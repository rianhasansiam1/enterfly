import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/service-error";
import {
  findActivePromoCode,
  getStoreSettings,
} from "@/lib/services/settings.service";
import type {
  CheckoutInput,
  CheckoutPreviewInput,
} from "@/lib/validations/checkout.validation";

/**
 * Single home for checkout pricing + order creation.
 *
 * Routes stay thin. Domain rules live here:
 *   - prices, taxes, shipping fees, and free-shipping thresholds are
 *     always read from `StoreSettings` and `Product` rows; never from
 *     the client.
 *   - promo codes are validated against `PromoCode` rules (status,
 *     start/end dates, min order, percent caps, usage limits).
 *   - stock is decremented atomically with `updateMany` + a stock
 *     guard so the last unit can't be sold to two carts at once.
 *   - every order is attached to the session userId (no anonymous
 *     orders); the route layer rejects unauthenticated requests with
 *     a 401 before reaching the service.
 */

export class CheckoutError extends ServiceError {
  constructor(
    status: number,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(status, message, details);
    this.name = "CheckoutError";
  }
}

/* -------------------------------------------------------------------------- */
/*  Money helpers                                                             */
/* -------------------------------------------------------------------------- */

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

function effectivePrice(product: {
  price: number;
  discountPrice: number | null;
}) {
  return product.discountPrice != null && product.discountPrice < product.price
    ? product.discountPrice
    : product.price;
}

function generateOrderNumber(): string {
  const now = new Date();
  const yy = String(now.getUTCFullYear()).slice(-2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const rand = Math.random().toString(16).slice(2, 10).toUpperCase();
  return `ORD-${yy}${mm}${dd}-${rand}`;
}

/* -------------------------------------------------------------------------- */
/*  Item resolution                                                           */
/* -------------------------------------------------------------------------- */

type ResolvedItem = { productId: string; quantity: number };

type ResolvedItems = {
  items: ResolvedItem[];
  /** True when items came from the user's persisted cart (so we can clear it). */
  fromCart: boolean;
};

/**
 * Pick the source of truth for the items being checked out.
 *
 * Priority:
 *   1. Body-provided items (the "Buy now" flow).
 *   2. The user's persisted cart, when no items are supplied.
 */
async function resolveItems(
  userId: string,
  bodyItems: ResolvedItem[] | undefined,
): Promise<ResolvedItems> {
  if (bodyItems && bodyItems.length > 0) {
    // Merge duplicates so the same productId can't appear twice.
    const merged = new Map<string, number>();
    for (const item of bodyItems) {
      const current = merged.get(item.productId) ?? 0;
      merged.set(item.productId, current + item.quantity);
    }
    return {
      items: Array.from(merged.entries()).map(([productId, quantity]) => ({
        productId,
        quantity,
      })),
      fromCart: false,
    };
  }

  const cart = await prisma.cartItem.findMany({
    where: { userId },
    select: { productId: true, quantity: true },
  });

  if (cart.length === 0) {
    throw new CheckoutError(
      400,
      "Your cart is empty. Add items before placing an order.",
    );
  }

  return { items: cart, fromCart: true };
}

/* -------------------------------------------------------------------------- */
/*  Line pricing                                                              */
/* -------------------------------------------------------------------------- */

type PricedLine = {
  productId: string;
  name: string;
  image: string | null;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  lineTotal: number;
  stock: number;
};

async function priceLines(items: ResolvedItem[]): Promise<PricedLine[]> {
  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      image: true,
      price: true,
      discountPrice: true,
      stock: true,
      status: true,
    },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  return items.map((line) => {
    const product = productMap.get(line.productId);
    if (!product) {
      throw new CheckoutError(404, `Product not found: ${line.productId}`);
    }
    if (product.status !== "ACTIVE") {
      throw new CheckoutError(
        409,
        `"${product.name}" is no longer available.`,
        { productId: product.id },
      );
    }
    if (product.stock < line.quantity) {
      throw new CheckoutError(
        409,
        `Only ${product.stock} unit(s) of "${product.name}" left in stock.`,
        { productId: product.id, available: product.stock },
      );
    }
    const unitPrice = effectivePrice(product);
    return {
      productId: product.id,
      name: product.name,
      image: product.image,
      quantity: line.quantity,
      unitPrice: money(unitPrice),
      originalPrice: money(product.price),
      lineTotal: money(unitPrice * line.quantity),
      stock: product.stock,
    };
  });
}

/* -------------------------------------------------------------------------- */
/*  Promo + summary                                                           */
/* -------------------------------------------------------------------------- */

type PromoApplication =
  | {
      ok: true;
      code: string;
      description: string | null;
      discount: number;
    }
  | {
      ok: false;
      code: string;
      reason: string;
    }
  | null;

async function applyPromoCode(
  rawCode: string | null | undefined,
  subtotal: number,
): Promise<PromoApplication> {
  if (!rawCode) return null;
  const trimmed = rawCode.trim();
  if (!trimmed) return null;

  const code = trimmed.toUpperCase();
  const promo = await findActivePromoCode(code);
  if (!promo) {
    return { ok: false, code, reason: "Promo code is invalid or expired." };
  }

  if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) {
    return {
      ok: false,
      code,
      reason: "This promo code has reached its usage limit.",
    };
  }

  if (promo.minOrder != null && subtotal < promo.minOrder) {
    return {
      ok: false,
      code,
      reason: `Spend at least BDT ${promo.minOrder.toLocaleString()} to use this code.`,
    };
  }

  let discount =
    promo.discountType === "PERCENT"
      ? (subtotal * promo.value) / 100
      : promo.value;

  if (promo.maxDiscount != null && discount > promo.maxDiscount) {
    discount = promo.maxDiscount;
  }

  discount = Math.min(money(discount), subtotal);

  return {
    ok: true,
    code,
    description: promo.description,
    discount,
  };
}

type StoreSettingsSnapshot = {
  taxRate: number;
  standardShippingFee: number;
  freeShippingThreshold: number;
  expressShippingFee: number;
  currency: string;
};

type CheckoutSummary = {
  subtotal: number;
  totalSavings: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  taxRate: number;
  freeShippingThreshold: number;
  shippingFee: number;
  isFreeShippingApplied: boolean;
  currency: string;
};

function summarize(
  lines: PricedLine[],
  promo: PromoApplication,
  settings: StoreSettingsSnapshot,
): CheckoutSummary {
  const subtotal = money(
    lines.reduce((sum, line) => sum + line.lineTotal, 0),
  );
  const totalSavings = money(
    lines.reduce(
      (sum, line) =>
        sum + Math.max(0, (line.originalPrice - line.unitPrice) * line.quantity),
      0,
    ),
  );

  const discount = promo?.ok ? promo.discount : 0;
  const afterDiscount = Math.max(0, subtotal - discount);

  const isFreeShipping =
    subtotal === 0 || afterDiscount >= settings.freeShippingThreshold;
  const shipping = isFreeShipping ? 0 : settings.standardShippingFee;

  const tax = money(afterDiscount * settings.taxRate);
  const total = money(afterDiscount + shipping + tax);

  return {
    subtotal,
    totalSavings,
    discount,
    shipping,
    tax,
    total,
    taxRate: settings.taxRate,
    freeShippingThreshold: settings.freeShippingThreshold,
    shippingFee: settings.standardShippingFee,
    isFreeShippingApplied: isFreeShipping,
    currency: settings.currency,
  };
}

function settingsToSnapshot(
  settings: Awaited<ReturnType<typeof getStoreSettings>>,
): StoreSettingsSnapshot {
  return {
    taxRate: settings.taxRate,
    standardShippingFee: settings.standardShippingFee,
    freeShippingThreshold: settings.freeShippingThreshold,
    expressShippingFee: settings.expressShippingFee,
    currency: settings.currency,
  };
}

/* -------------------------------------------------------------------------- */
/*  Public: preview                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Compute totals without writing anything. Used by the checkout page
 * to render the order summary as the customer types a promo code or
 * adjusts items. Always trustworthy — pricing comes from the DB.
 */
export async function previewCheckout(
  userId: string,
  input: CheckoutPreviewInput,
) {
  const { items: resolved } = await resolveItems(userId, input.items);
  const lines = await priceLines(resolved);

  const settings = settingsToSnapshot(await getStoreSettings());
  const subtotal = money(
    lines.reduce((sum, line) => sum + line.lineTotal, 0),
  );
  const promo = await applyPromoCode(input.promoCode, subtotal);
  const summary = summarize(lines, promo, settings);

  return {
    items: lines.map((line) => ({
      productId: line.productId,
      name: line.name,
      image: line.image,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      originalPrice: line.originalPrice,
      lineTotal: line.lineTotal,
      stock: line.stock,
    })),
    summary,
    promo,
  };
}

/* -------------------------------------------------------------------------- */
/*  Public: place order                                                       */
/* -------------------------------------------------------------------------- */

const orderInclude = {
  items: {
    include: {
      product: { select: { id: true, name: true, image: true } },
    },
  },
} satisfies Prisma.OrderInclude;

export async function placeOrder(userId: string, input: CheckoutInput) {
  // Pay Now is intentionally disabled until the gateway is wired up.
  // Reject server-side too so a curious client can't bypass the UI lock.
  if (input.paymentMethod === "ONLINE") {
    throw new CheckoutError(
      400,
      "Online payment is coming soon. Please choose Cash on Delivery for now.",
    );
  }

  const { items: resolved, fromCart } = await resolveItems(
    userId,
    input.items,
  );
  const lines = await priceLines(resolved);

  const settings = settingsToSnapshot(await getStoreSettings());
  const subtotal = money(
    lines.reduce((sum, line) => sum + line.lineTotal, 0),
  );
  const promo = await applyPromoCode(input.promoCode, subtotal);

  if (input.promoCode && promo && !promo.ok) {
    throw new CheckoutError(409, promo.reason);
  }

  const summary = summarize(lines, promo, settings);

  const orderNumber = generateOrderNumber();
  const trimmedEmail = input.customerEmail?.trim().toLowerCase();
  const customerEmail = trimmedEmail ? trimmedEmail : null;
  const trimmedCity = input.customerCity?.trim();
  const customerCity = trimmedCity ? trimmedCity : null;
  const trimmedPostal = input.customerPostalCode?.trim();
  const customerPostalCode = trimmedPostal ? trimmedPostal : null;
  const trimmedNote = input.customerNote?.trim();
  const customerNote = trimmedNote ? trimmedNote : null;

  try {
    return await prisma.$transaction(async (tx) => {
      // Atomic stock decrement: the WHERE clause guards against the
      // last unit being sold twice.
      for (const line of lines) {
        const result = await tx.product.updateMany({
          where: {
            id: line.productId,
            status: "ACTIVE",
            stock: { gte: line.quantity },
          },
          data: { stock: { decrement: line.quantity } },
        });
        if (result.count !== 1) {
          throw new CheckoutError(
            409,
            `Stock changed for "${line.name}". Please review your cart and try again.`,
            { productId: line.productId },
          );
        }
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          subtotal: summary.subtotal,
          deliveryCharge: summary.shipping,
          discountAmount: summary.discount,
          taxAmount: summary.tax,
          totalAmount: summary.total,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerAddress: input.customerAddress,
          customerEmail,
          customerCity,
          customerPostalCode,
          customerNote,
          paymentMethod: input.paymentMethod,
          promoCode: promo?.ok ? promo.code : null,
          items: {
            create: lines.map((line) => ({
              productId: line.productId,
              quantity: line.quantity,
              price: line.unitPrice,
            })),
          },
        },
        include: orderInclude,
      });

      // Bump usedCount when a real promo was applied.
      if (promo?.ok) {
        await tx.promoCode.updateMany({
          where: { code: promo.code },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Empty the cart on success when the items came from there.
      if (fromCart && input.clearCart) {
        await tx.cartItem.deleteMany({ where: { userId } });
      }

      return { order, summary, promo };
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new CheckoutError(
        500,
        "Failed to generate a unique order number. Please retry.",
      );
    }
    throw error;
  }
}

import "server-only";

import type { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

import { prisma } from "@/lib/db/prisma";
import {
  greaterThanOrEqual,
  minDecimal,
  multiply,
  percentOf,
  round2,
  subtractClamped,
  sumDecimals,
  toDecimal,
} from "@/lib/money";
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

/**
 * Pick the effective unit price for a product as an exact Decimal:
 * the discount price when set and lower than the sale price, otherwise
 * the sale price. Pricing lives on the product (variants are inventory).
 */
function effectiveProductPrice(product: {
  salePrice: Prisma.Decimal;
  discountPrice: Prisma.Decimal | null;
}): Prisma.Decimal {
  if (
    product.discountPrice != null &&
    toDecimal(product.discountPrice).lessThan(toDecimal(product.salePrice))
  ) {
    return toDecimal(product.discountPrice);
  }
  return toDecimal(product.salePrice);
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

type ResolvedItem = { productId: string; variantId?: string; quantity: number };

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
    // Merge duplicates so the same variant can't appear twice. Lines
    // without an explicit variant are keyed by product (the service
    // resolves them to the primary variant during pricing).
    const merged = new Map<string, ResolvedItem>();
    for (const item of bodyItems) {
      const key = item.variantId ?? `product:${item.productId}`;
      const current = merged.get(key);
      merged.set(key, {
        productId: item.productId,
        variantId: item.variantId,
        quantity: (current?.quantity ?? 0) + item.quantity,
      });
    }
    return { items: Array.from(merged.values()), fromCart: false };
  }

  const cart = await prisma.cartItem.findMany({
    where: { userId },
    select: { productId: true, variantId: true, quantity: true },
  });

  if (cart.length === 0) {
    throw new CheckoutError(
      400,
      "Your cart is empty. Add items before placing an order.",
    );
  }

  return {
    items: cart.map((row) => ({
      productId: row.productId,
      variantId: row.variantId,
      quantity: row.quantity,
    })),
    fromCart: true,
  };
}

/* -------------------------------------------------------------------------- */
/*  Line pricing                                                              */
/* -------------------------------------------------------------------------- */

type PricedLine = {
  productId: string;
  variantId: string;
  sku: string | null;
  color: string | null;
  size: string | null;
  name: string;
  image: string | null;
  quantity: number;
  // Money kept as exact Decimals internally; converted to number only
  // at the JSON boundary (see previewCheckout / summarize).
  unitPrice: Prisma.Decimal;
  originalPrice: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
  /** Admin-only source cost snapshot for OrderItem profit analytics. */
  buyingPrice: Prisma.Decimal;
  stock: number;
};

async function priceLines(items: ResolvedItem[]): Promise<PricedLine[]> {
  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      status: true,
      salePrice: true,
      discountPrice: true,
      buyingPrice: true,
      images: {
        orderBy: { position: "asc" },
        take: 1,
        select: { url: true },
      },
      variants: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          sku: true,
          color: true,
          size: true,
          stock: true,
        },
      },
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
    // Multi-variant products require an explicit size+color selection.
    if (!line.variantId && product.variants.length > 1) {
      throw new CheckoutError(
        409,
        `Please select a size and color for "${product.name}" before checkout.`,
        { productId: product.id, requiresVariantSelection: true },
      );
    }
    // Use the exact selected variant when provided, else the primary one.
    const variant = line.variantId
      ? product.variants.find((v) => v.id === line.variantId)
      : product.variants[0];
    if (!variant) {
      throw new CheckoutError(
        409,
        line.variantId
          ? `Selected variant for "${product.name}" is no longer available.`
          : `"${product.name}" has no purchasable variant.`,
        { productId: product.id },
      );
    }
    if (variant.stock < line.quantity) {
      throw new CheckoutError(
        409,
        `Only ${variant.stock} unit(s) of "${product.name}" left in stock.`,
        { productId: product.id, available: variant.stock },
      );
    }
    const unitPrice = effectiveProductPrice(product);
    return {
      productId: product.id,
      variantId: variant.id,
      sku: variant.sku,
      color: variant.color,
      size: variant.size,
      name: product.name,
      image: product.images[0]?.url ?? null,
      quantity: line.quantity,
      unitPrice,
      originalPrice: toDecimal(product.salePrice),
      lineTotal: multiply(unitPrice, line.quantity),
      buyingPrice: toDecimal(product.buyingPrice),
      stock: variant.stock,
    };
  });
}

/* -------------------------------------------------------------------------- */
/*  Promo + summary                                                           */
/* -------------------------------------------------------------------------- */

type PromoApplication =
  | {
      ok: true;
      id: string;
      code: string;
      description: string | null;
      discount: Prisma.Decimal;
    }
  | {
      ok: false;
      code: string;
      reason: string;
    }
  | null;

type CheckoutPromoRow = {
  id: string;
  code: string;
  description: string | null;
  discountType: Prisma.PromoCodeGetPayload<{
    select: { discountType: true };
  }>["discountType"];
  value: Prisma.Decimal | number;
  minOrder: Prisma.Decimal | number | null;
  maxDiscount: Prisma.Decimal | number | null;
  usageLimit: number | null;
  usedCount: number;
};

const checkoutPromoSelect = {
  id: true,
  code: true,
  description: true,
  discountType: true,
  value: true,
  minOrder: true,
  maxDiscount: true,
  usageLimit: true,
  usedCount: true,
} satisfies Prisma.PromoCodeSelect;

function normalizePromoCode(rawCode: string | null | undefined): string | null {
  if (!rawCode) return null;
  const code = rawCode.trim().toUpperCase();
  return code ? code : null;
}

function activePromoWindowWhere(now: Date): Prisma.PromoCodeWhereInput[] {
  return [
    { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
    { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
  ];
}

function buildPromoApplication(
  requestedCode: string,
  promo: CheckoutPromoRow | null,
  subtotal: Prisma.Decimal,
): PromoApplication {
  if (!promo) {
    return {
      ok: false,
      code: requestedCode,
      reason: "Promo code is invalid or expired.",
    };
  }

  if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) {
    return {
      ok: false,
      code: promo.code,
      reason: "This promo code has reached its usage limit.",
    };
  }

  if (promo.minOrder != null && subtotal.lessThan(toDecimal(promo.minOrder))) {
    return {
      ok: false,
      code: promo.code,
      reason: `Spend at least BDT ${round2(promo.minOrder).toLocaleString()} to use this code.`,
    };
  }

  let discount =
    promo.discountType === "PERCENT"
      ? percentOf(subtotal, promo.value)
      : toDecimal(promo.value);

  if (promo.maxDiscount != null) {
    discount = minDecimal(discount, promo.maxDiscount);
  }

  // Round to 2 dp and never exceed the subtotal.
  discount = minDecimal(toDecimal(round2(discount)), subtotal);

  return {
    ok: true,
    id: promo.id,
    code: promo.code,
    description: promo.description,
    discount,
  };
}

async function applyPromoCode(
  rawCode: string | null | undefined,
  subtotal: Prisma.Decimal,
): Promise<PromoApplication> {
  const code = normalizePromoCode(rawCode);
  if (!code) return null;

  const promo = await findActivePromoCode(code);
  return buildPromoApplication(code, promo, subtotal);
}

async function applyPromoCodeInTransaction(
  tx: Prisma.TransactionClient,
  rawCode: string | null | undefined,
  subtotal: Prisma.Decimal,
): Promise<PromoApplication> {
  const code = normalizePromoCode(rawCode);
  if (!code) return null;

  const now = new Date();
  const promo = await tx.promoCode.findFirst({
    where: {
      code,
      status: "ACTIVE",
      AND: activePromoWindowWhere(now),
    },
    select: checkoutPromoSelect,
  });

  return buildPromoApplication(code, promo, subtotal);
}

async function incrementPromoUsage(
  tx: Prisma.TransactionClient,
  promo: Extract<PromoApplication, { ok: true }>,
) {
  const now = new Date();
  const result = await tx.promoCode.updateMany({
    where: {
      id: promo.id,
      status: "ACTIVE",
      AND: [
        ...activePromoWindowWhere(now),
        {
          OR: [
            { usageLimit: null },
            { usedCount: { lt: tx.promoCode.fields.usageLimit } },
          ],
        },
      ],
    },
    data: { usedCount: { increment: 1 } },
  });

  if (result.count !== 1) {
    throw new CheckoutError(
      409,
      "This promo code has reached its usage limit.",
    );
  }
}

/** JSON-facing promo shape (Decimal discount converted to a number). */
type PromoApplicationJson =
  | { ok: true; code: string; description: string | null; discount: number }
  | { ok: false; code: string; reason: string }
  | null;

function promoToJson(promo: PromoApplication): PromoApplicationJson {
  if (promo == null) return null;
  if (!promo.ok) return promo;
  return {
    ok: true,
    code: promo.code,
    description: promo.description,
    discount: round2(promo.discount),
  };
}

type StoreSettingsSnapshot = {
  taxRate: number;
  standardShippingFee: number;
  freeShippingThreshold: number;
  expressShippingFee: number;
  currency: string;
};

type CheckoutDeliveryMethod = CheckoutPreviewInput["deliveryMethod"];

type CheckoutSummary = {
  subtotal: number;
  totalSavings: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  taxRate: number;
  deliveryMethod: CheckoutDeliveryMethod;
  freeShippingThreshold: number;
  shippingFee: number;
  standardShippingFee: number;
  expressShippingFee: number;
  standardDeliveryCharge: number;
  expressDeliveryCharge: number;
  isFreeShippingApplied: boolean;
  currency: string;
};

function summarize(
  lines: PricedLine[],
  promo: PromoApplication,
  settings: StoreSettingsSnapshot,
  deliveryMethod: CheckoutDeliveryMethod,
): CheckoutSummary {
  const subtotal = sumDecimals(lines.map((line) => line.lineTotal));
  const totalSavings = sumDecimals(
    lines.map((line) =>
      subtractClamped(
        multiply(line.originalPrice, line.quantity),
        multiply(line.unitPrice, line.quantity),
      ),
    ),
  );

  const discount = promo?.ok ? promo.discount : toDecimal(0);
  const afterDiscount = subtractClamped(subtotal, discount);

  const hasFreeShippingThreshold =
    greaterThanOrEqual(settings.freeShippingThreshold, 0.01);
  const isFreeShipping =
    subtotal.isZero() ||
    (hasFreeShippingThreshold &&
      greaterThanOrEqual(afterDiscount, settings.freeShippingThreshold));
  const standardDeliveryCharge = isFreeShipping
    ? toDecimal(0)
    : toDecimal(settings.standardShippingFee);
  const expressDeliveryCharge = subtotal.isZero()
    ? toDecimal(0)
    : toDecimal(settings.expressShippingFee);
  const shipping =
    deliveryMethod === "EXPRESS" ? expressDeliveryCharge : standardDeliveryCharge;

  const tax = percentOf(afterDiscount, multiply(settings.taxRate, 100));
  const total = toDecimal(round2(afterDiscount)).plus(shipping).plus(
    toDecimal(round2(tax)),
  );

  return {
    subtotal: round2(subtotal),
    totalSavings: round2(totalSavings),
    discount: round2(discount),
    shipping: round2(shipping),
    tax: round2(tax),
    total: round2(total),
    taxRate: settings.taxRate,
    deliveryMethod,
    freeShippingThreshold: settings.freeShippingThreshold,
    shippingFee:
      deliveryMethod === "EXPRESS"
        ? settings.expressShippingFee
        : settings.standardShippingFee,
    standardShippingFee: settings.standardShippingFee,
    expressShippingFee: settings.expressShippingFee,
    standardDeliveryCharge: round2(standardDeliveryCharge),
    expressDeliveryCharge: round2(expressDeliveryCharge),
    isFreeShippingApplied:
      deliveryMethod === "STANDARD" && isFreeShipping,
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
  const subtotal = sumDecimals(lines.map((line) => line.lineTotal));
  const promo = await applyPromoCode(input.promoCode, subtotal);
  const summary = summarize(lines, promo, settings, input.deliveryMethod);

  return {
    items: lines.map((line) => ({
      productId: line.productId,
      variantId: line.variantId,
      sku: line.sku,
      color: line.color,
      size: line.size,
      name: line.name,
      image: line.image,
      quantity: line.quantity,
      unitPrice: round2(line.unitPrice),
      originalPrice: round2(line.originalPrice),
      lineTotal: round2(line.lineTotal),
      stock: line.stock,
    })),
    summary,
    promo: promoToJson(promo),
  };
}

/* -------------------------------------------------------------------------- */
/*  Public: place order                                                       */
/* -------------------------------------------------------------------------- */

const orderInclude = {
  items: true,
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
  const subtotal = sumDecimals(lines.map((line) => line.lineTotal));

  // Email is identity-bound: always resolve it from the authenticated
  // user's DB record, never from the request body. Even if the client
  // tampers with the (disabled) email field via dev tools, the order
  // is stamped with the account's real email.
  const account = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!account) {
    throw new CheckoutError(
      401,
      "Your account could not be found. Please sign in again.",
    );
  }
  const accountEmail = account.email?.trim().toLowerCase();
  if (!accountEmail) {
    throw new CheckoutError(
      400,
      "Your account is missing an email address. Please add one on your profile page before checking out.",
    );
  }

  const orderNumber = generateOrderNumber();
  const customerEmail = accountEmail;
  const trimmedCity = input.customerCity?.trim();
  const customerCity = trimmedCity ? trimmedCity : null;
  const trimmedPostal = input.customerPostalCode?.trim();
  const customerPostalCode = trimmedPostal ? trimmedPostal : null;
  const trimmedNote = input.customerNote?.trim();
  const customerNote = trimmedNote ? trimmedNote : null;

  try {
    return await prisma.$transaction(async (tx) => {
      const promo = await applyPromoCodeInTransaction(
        tx,
        input.promoCode,
        subtotal,
      );
      if (input.promoCode && promo && !promo.ok) {
        throw new CheckoutError(409, promo.reason);
      }

      const summary = summarize(lines, promo, settings, input.deliveryMethod);

      // Atomic stock decrement on the variant: the WHERE clause guards
      // against the last unit being sold twice.
      for (const line of lines) {
        const result = await tx.productVariant.updateMany({
          where: {
            id: line.variantId,
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

        // Ledger entry so stock movements are auditable.
        await tx.inventoryLog.create({
          data: {
            variantId: line.variantId,
            type: "ORDER_PLACED",
            quantity: -line.quantity,
            note: `Order ${orderNumber}`,
          },
        });
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
              variantId: line.variantId,
              productName: line.name,
              productImage: line.image,
              sku: line.sku,
              color: line.color,
              size: line.size,
              quantity: line.quantity,
              unitPrice: round2(line.unitPrice),
              totalPrice: round2(line.lineTotal),
              buyingPrice: round2(line.buyingPrice),
            })),
          },
        },
        include: orderInclude,
      });

      // Audit + bump usedCount when a real promo was applied.
      if (promo?.ok) {
        await incrementPromoUsage(tx, promo);
        await tx.promoCodeUsage.create({
          data: {
            promoCodeId: promo.id,
            userId,
            orderId: order.id,
          },
        });
      }

      // Empty the cart on success when the items came from there.
      if (fromCart && input.clearCart) {
        await tx.cartItem.deleteMany({ where: { userId } });
      }

      return { order, summary, promo: promoToJson(promo) };
    });
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
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

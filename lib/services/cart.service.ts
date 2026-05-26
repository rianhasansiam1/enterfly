import "server-only";

import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import type {
  AddToCartInput,
  SyncCartInput,
  UpdateCartItemInput,
} from "@/lib/validations/cart.validation";

/**
 * The single home for Cart DB logic.
 *
 * Route handlers stay thin. Domain rules live here:
 *   - prices are always read from the DB (never trusted from the client)
 *   - inactive products and out-of-stock products are rejected
 *   - quantity can never exceed the product's current stock
 *   - all writes are scoped by `userId` in the WHERE clause so a user
 *     can never touch another user's cart row (IDOR-safe by SQL).
 */

/* -------------------------------------------------------------------------- */
/*  Domain error                                                              */
/* -------------------------------------------------------------------------- */

export class CartError extends Error {
  status: number;
  details?: Record<string, unknown>;

  constructor(
    status: number,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "CartError";
    this.status = status;
    this.details = details;
  }
}

/* -------------------------------------------------------------------------- */
/*  Selects / shapes                                                          */
/* -------------------------------------------------------------------------- */

/** Compact product info embedded inside each cart line. */
const cartItemProductSelect = {
  id: true,
  name: true,
  image: true,
  price: true,
  discountPrice: true,
  stock: true,
  status: true,
} as const;

const cartItemInclude = {
  product: { select: cartItemProductSelect },
} satisfies Prisma.CartItemInclude;

type CartItemWithProduct = Prisma.CartItemGetPayload<{
  include: typeof cartItemInclude;
}>;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/** Pick the unit price the customer should pay (discount when valid). */
function effectivePrice(product: {
  price: number;
  discountPrice: number | null;
}) {
  return product.discountPrice != null && product.discountPrice < product.price
    ? product.discountPrice
    : product.price;
}

/** Round currency to 2 dp to keep totals free of float noise. */
function money(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Shape returned to the client for one cart row. */
type CartLine = {
  id: string;
  productId: string;
  name: string;
  image: string | null;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  lineTotal: number;
  stock: number;
  status: "ACTIVE" | "INACTIVE";
};

type CartSummary = {
  totalItems: number;
  subtotal: number;
  totalDiscount: number;
  finalTotal: number;
};

/**
 * Map a DB row into the API line shape and decide whether it should
 * count toward the totals (inactive products are surfaced but ignored
 * in the summary so the UI can warn the user).
 */
function toLine(row: CartItemWithProduct): {
  line: CartLine;
  countable: boolean;
} {
  const p = row.product;
  const unitPrice = effectivePrice(p);
  const line: CartLine = {
    id: row.id,
    productId: p.id,
    name: p.name,
    image: p.image,
    quantity: row.quantity,
    unitPrice: money(unitPrice),
    originalPrice: money(p.price),
    lineTotal: money(unitPrice * row.quantity),
    stock: p.stock,
    status: p.status,
  };
  return { line, countable: p.status === "ACTIVE" };
}

function summarize(rows: CartItemWithProduct[]): {
  items: CartLine[];
  summary: CartSummary;
} {
  let totalItems = 0;
  let subtotal = 0;
  let totalDiscount = 0;
  const items: CartLine[] = [];

  for (const row of rows) {
    const { line, countable } = toLine(row);
    items.push(line);
    if (!countable) continue;
    totalItems += line.quantity;
    subtotal += line.lineTotal;
    totalDiscount += money(
      (line.originalPrice - line.unitPrice) * line.quantity,
    );
  }

  subtotal = money(subtotal);
  totalDiscount = money(totalDiscount);
  return {
    items,
    summary: {
      totalItems,
      subtotal,
      totalDiscount,
      finalTotal: subtotal,
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  Reads                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Return the current user's cart with a server-computed summary.
 *
 * Inactive products are returned for visibility but excluded from the
 * totals so the client can render a "no longer available" state.
 */
export async function getMyCart(userId: string) {
  const rows = await prisma.cartItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: cartItemInclude,
  });

  return summarize(rows);
}

const getCachedMyCart = unstable_cache(
  async (userId: string) => getMyCart(userId),
  ["cart-by-user"],
  { revalidate: 120, tags: ["cart"] },
);

export function getMyCartCached(userId: string) {
  return getCachedMyCart(userId);
}

export async function syncCartItems(userId: string, input: SyncCartInput) {
  if (input.items.length === 0) {
    return getMyCart(userId);
  }

  const merged = new Map<string, number>();
  for (const item of input.items) {
    const current = merged.get(item.productId) ?? 0;
    merged.set(item.productId, current + item.quantity);
  }

  const requested = Array.from(merged.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));

  const productIds = requested.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      status: "ACTIVE",
    },
    select: {
      id: true,
      stock: true,
    },
  });

  const existingRows = await prisma.cartItem.findMany({
    where: {
      userId,
      productId: { in: productIds },
    },
    select: {
      productId: true,
      quantity: true,
    },
  });

  const stockByProductId = new Map(products.map((product) => [product.id, product.stock]));
  const existingQuantityByProductId = new Map(
    existingRows.map((row) => [row.productId, row.quantity]),
  );

  const writes = requested.flatMap((item) => {
    const stock = stockByProductId.get(item.productId);
    if (stock == null || stock <= 0) return [];

    const existingQuantity = existingQuantityByProductId.get(item.productId) ?? 0;
    const remaining = Math.max(0, stock - existingQuantity);
    if (remaining <= 0) return [];

    const quantity = Math.min(item.quantity, remaining);
    return prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId: item.productId } },
      create: { userId, productId: item.productId, quantity },
      update: {
        quantity: {
          increment: quantity,
        },
      },
    });
  });

  if (writes.length > 0) {
    await prisma.$transaction(writes);
  }

  return getMyCart(userId);
}

/* -------------------------------------------------------------------------- */
/*  Writes                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Add a product to the cart. If the user already has a row for this
 * product we add to it; otherwise we create a new one. The combined
 * quantity is capped at `Product.stock`.
 */
export async function addToCart(userId: string, input: AddToCartInput) {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { id: true, name: true, stock: true, status: true },
  });
  if (!product) throw new CartError(404, "Product not found.");
  if (product.status !== "ACTIVE") {
    throw new CartError(409, `"${product.name}" is no longer available.`);
  }
  if (product.stock <= 0) {
    throw new CartError(409, `"${product.name}" is out of stock.`);
  }

  // Existing row (if any) so we know the current quantity.
  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId, productId: product.id } },
    select: { id: true, quantity: true },
  });

  const nextQuantity = (existing?.quantity ?? 0) + input.quantity;
  if (nextQuantity > product.stock) {
    throw new CartError(
      409,
      `Only ${product.stock} unit(s) of "${product.name}" available.`,
      { available: product.stock, requested: nextQuantity },
    );
  }

  // `upsert` keeps it to one round trip.
  const row = await prisma.cartItem.upsert({
    where: { userId_productId: { userId, productId: product.id } },
    create: { userId, productId: product.id, quantity: input.quantity },
    update: { quantity: nextQuantity },
    include: cartItemInclude,
  });

  return toLine(row).line;
}

/**
 * Update the quantity of a cart row the caller owns.
 *
 * The `where: { id, userId }` scope is the IDOR guard: a user cannot
 * touch another user's row even if they know the id.
 */
export async function updateCartItem(
  itemId: string,
  userId: string,
  input: UpdateCartItemInput,
) {
  const existing = await prisma.cartItem.findFirst({
    where: { id: itemId, userId },
    include: { product: { select: cartItemProductSelect } },
  });
  if (!existing) throw new CartError(404, "Cart item not found.");

  const product = existing.product;
  if (product.status !== "ACTIVE") {
    throw new CartError(409, `"${product.name}" is no longer available.`);
  }
  if (input.quantity > product.stock) {
    throw new CartError(
      409,
      `Only ${product.stock} unit(s) of "${product.name}" available.`,
      { available: product.stock, requested: input.quantity },
    );
  }

  const updated = await prisma.cartItem.update({
    where: { id: existing.id },
    data: { quantity: input.quantity },
    include: cartItemInclude,
  });

  return toLine(updated).line;
}

/** Delete a single cart row owned by the caller. */
export async function removeCartItem(itemId: string, userId: string) {
  // Scope by userId in the WHERE clause: prevents IDOR.
  const result = await prisma.cartItem.deleteMany({
    where: { id: itemId, userId },
  });
  if (result.count === 0) throw new CartError(404, "Cart item not found.");
  return { id: itemId };
}

/** Empty the caller's cart. Always succeeds (idempotent). */
export async function clearMyCart(userId: string) {
  const result = await prisma.cartItem.deleteMany({ where: { userId } });
  return { deletedCount: result.count };
}

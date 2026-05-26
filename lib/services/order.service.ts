import "server-only";

import { Prisma } from "@prisma/client";
import type { OrderStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/service-error";
import type {
  AdminOrderQueryInput,
  CreateOrderInput,
  OrderQueryInput,
  UpdateOrderStatusInput,
  UpdatePaymentStatusInput,
} from "@/lib/validations/order.validation";

/**
 * The single home for Order DB logic.
 *
 * Route handlers stay thin and these helpers stay reusable.
 * Domain rules live here:
 *   - prices and totals always come from the DB, never the client
 *   - stock is decremented atomically inside a transaction
 *   - cancellations restore stock in the same transaction
 *   - status transitions are validated centrally
 */

/* -------------------------------------------------------------------------- */
/*  Domain error                                                              */
/* -------------------------------------------------------------------------- */

/**
 * A typed error the service throws so route handlers can map it to
 * the right HTTP status without sprinkling try/catch heuristics.
 */
export class OrderError extends ServiceError {
  constructor(
    status: number,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(status, message, details);
    this.name = "OrderError";
  }
}

/* -------------------------------------------------------------------------- */
/*  Selects / shapes                                                          */
/* -------------------------------------------------------------------------- */

/** Compact product info we embed inside order items. */
const orderItemProductSelect = {
  id: true,
  name: true,
  image: true,
  slug: false, // products don't have a slug (yet)
} as const;

const orderItemInclude = {
  product: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
} satisfies Prisma.OrderItemInclude;

const orderInclude = {
  items: { include: orderItemInclude },
} satisfies Prisma.OrderInclude;

const orderWithUserInclude = {
  ...orderInclude,
  user: { select: { id: true, name: true, email: true, phone: true } },
} satisfies Prisma.OrderInclude;

export type OrderWithItems = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;
export type OrderWithItemsAndUser = Prisma.OrderGetPayload<{
  include: typeof orderWithUserInclude;
}>;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/** Pick the effective unit price the customer should pay. */
function effectivePrice(product: { price: number; discountPrice: number | null }) {
  return product.discountPrice != null && product.discountPrice < product.price
    ? product.discountPrice
    : product.price;
}

/**
 * Generate a human-readable order number.
 * Format: `ORD-YYMMDD-XXXXXXXX` (date + 8 random hex chars).
 * Cheap, sortable by day, low collision risk.
 */
function generateOrderNumber(): string {
  const now = new Date();
  const yy = String(now.getUTCFullYear()).slice(-2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const rand = Math.random().toString(16).slice(2, 10).toUpperCase();
  return `ORD-${yy}${mm}${dd}-${rand}`;
}

/** Round currency to 2 dp to avoid float noise creeping into totals. */
function money(value: number): number {
  return Math.round(value * 100) / 100;
}

/* -------------------------------------------------------------------------- */
/*  Create order                                                              */
/* -------------------------------------------------------------------------- */

type ResolvedItem = { productId: string; quantity: number };

async function resolveItems(
  userId: string,
  input: CreateOrderInput,
): Promise<{ items: ResolvedItem[]; fromCart: boolean }> {
  if (input.items && input.items.length > 0) {
    return { items: input.items, fromCart: false };
  }

  const cart = await prisma.cartItem.findMany({
    where: { userId },
    select: { productId: true, quantity: true },
  });

  if (cart.length === 0) {
    throw new OrderError(
      400,
      "Your cart is empty. Add items before placing an order.",
    );
  }
  return { items: cart, fromCart: true };
}

export async function createOrder(userId: string, input: CreateOrderInput) {
  const { items, fromCart } = await resolveItems(userId, input);

  // Load all products in one query and build a quick lookup.
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      price: true,
      discountPrice: true,
      stock: true,
      status: true,
    },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Validate every line: product exists, is active, has enough stock.
  // Failing fast outside the transaction keeps the DB busy for less time.
  const lines = items.map((line) => {
    const product = productMap.get(line.productId);
    if (!product) {
      throw new OrderError(404, `Product not found: ${line.productId}`);
    }
    if (product.status !== "ACTIVE") {
      throw new OrderError(
        409,
        `"${product.name}" is no longer available.`,
        { productId: product.id },
      );
    }
    if (product.stock < line.quantity) {
      throw new OrderError(
        409,
        `Not enough stock for "${product.name}". Available: ${product.stock}.`,
        { productId: product.id, available: product.stock },
      );
    }
    const unitPrice = effectivePrice(product);
    return {
      productId: product.id,
      name: product.name,
      quantity: line.quantity,
      unitPrice,
      lineTotal: money(unitPrice * line.quantity),
    };
  });

  const subtotal = money(lines.reduce((sum, l) => sum + l.lineTotal, 0));
  const deliveryCharge = money(input.deliveryCharge ?? 0);
  const discountAmount = Math.min(money(input.discountAmount ?? 0), subtotal);
  const totalAmount = money(subtotal + deliveryCharge - discountAmount);

  const orderNumber = generateOrderNumber();

  // Everything that mutates state happens inside one transaction.
  // We use `updateMany` with a stock guard for an atomic compare-and-set
  // so two concurrent orders for the last unit can't both succeed.
  try {
    return await prisma.$transaction(async (tx) => {
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
          throw new OrderError(
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
          subtotal,
          deliveryCharge,
          discountAmount,
          totalAmount,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerAddress: input.customerAddress,
          paymentMethod: input.paymentMethod,
          items: {
            create: lines.map((l) => ({
              productId: l.productId,
              quantity: l.quantity,
              price: l.unitPrice,
            })),
          },
        },
        include: orderInclude,
      });

      if (fromCart && input.clearCart) {
        await tx.cartItem.deleteMany({ where: { userId } });
      }

      return order;
    });
  } catch (error) {
    // P2002 on `orderNumber` is a one-in-a-trillion collision; retry once.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new OrderError(
        500,
        "Failed to generate a unique order number. Please retry.",
      );
    }
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/*  Customer reads                                                            */
/* -------------------------------------------------------------------------- */

export async function listMyOrders(userId: string, query: OrderQueryInput) {
  const where: Prisma.OrderWhereInput = {
    userId,
    ...(query.status ? { status: query.status } : {}),
  };
  const skip = (query.page - 1) * query.pageSize;

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.pageSize,
      include: orderInclude,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    items,
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}

/**
 * Fetch a single order, scoped to the user when `userId` is given.
 * The userId scope is part of the SQL `where` so unauthorized access
 * returns `null` (route maps it to 404) without leaking existence.
 */
export function getOrderForUser(orderId: string, userId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, userId },
    include: orderInclude,
  });
}

/* -------------------------------------------------------------------------- */
/*  Cancellation                                                              */
/* -------------------------------------------------------------------------- */

const CUSTOMER_CANCELLABLE: readonly OrderStatus[] = ["PENDING", "PROCESSING"];

export async function cancelOrderAsCustomer(orderId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });
    if (!order) throw new OrderError(404, "Order not found.");

    if (!CUSTOMER_CANCELLABLE.includes(order.status)) {
      throw new OrderError(
        409,
        `Order cannot be cancelled in its current status (${order.status}).`,
      );
    }

    // Restore stock for every line.
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    return tx.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
      include: orderInclude,
    });
  });
}

/* -------------------------------------------------------------------------- */
/*  Admin reads                                                               */
/* -------------------------------------------------------------------------- */

function buildAdminWhere(query: AdminOrderQueryInput): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};

  if (query.status) where.status = query.status;
  if (query.paymentStatus) where.paymentStatus = query.paymentStatus;

  if (query.search) {
    where.OR = [
      { orderNumber: { contains: query.search, mode: "insensitive" } },
      { customerName: { contains: query.search, mode: "insensitive" } },
      { customerPhone: { contains: query.search, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function listOrdersForAdmin(query: AdminOrderQueryInput) {
  const where = buildAdminWhere(query);
  const skip = (query.page - 1) * query.pageSize;

  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.pageSize,
      select: {
        id: true,
        orderNumber: true,
        subtotal: true,
        deliveryCharge: true,
        discountAmount: true,
        totalAmount: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        customerName: true,
        customerPhone: true,
        customerAddress: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  // Flatten `_count.items` so the API stays simple to consume.
  const items = rows.map((row) => {
    const { _count, ...rest } = row;
    return { ...rest, itemsCount: _count.items };
  });

  return {
    items,
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}

export function getOrderForAdmin(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: orderWithUserInclude,
  });
}

/* -------------------------------------------------------------------------- */
/*  Admin updates                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Allowed status transitions. We keep the rules simple:
 *   - Any non-terminal order can be moved to CANCELLED.
 *   - Otherwise we follow the natural order pipeline.
 *   - Terminal states (DELIVERED, CANCELLED) cannot change.
 */
const STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export async function updateOrderStatus(
  orderId: string,
  input: UpdateOrderStatusInput,
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new OrderError(404, "Order not found.");

    const next = input.status;
    if (next === order.status) {
      throw new OrderError(409, `Order is already ${next}.`);
    }

    const allowed = STATUS_TRANSITIONS[order.status];
    if (!allowed.includes(next)) {
      throw new OrderError(
        409,
        `Cannot change status from ${order.status} to ${next}.`,
      );
    }

    // Restore stock when an order moves into CANCELLED from a live state.
    if (next === "CANCELLED") {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    return tx.order.update({
      where: { id: order.id },
      data: { status: next },
      include: orderWithUserInclude,
    });
  });
}

export async function updatePaymentStatus(
  orderId: string,
  input: UpdatePaymentStatusInput,
) {
  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, paymentStatus: true },
  });
  if (!existing) throw new OrderError(404, "Order not found.");

  if (existing.paymentStatus === input.paymentStatus) {
    throw new OrderError(409, `Payment is already ${input.paymentStatus}.`);
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: input.paymentStatus },
    include: orderWithUserInclude,
  });
}

// `orderItemProductSelect` is exported only for tests / future use.
export { orderItemProductSelect };

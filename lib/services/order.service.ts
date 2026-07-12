import "server-only";

import type { Prisma } from "@prisma/client";
import type { OrderStatus } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/db/prisma";
import { round2, toNumber } from "@/lib/money";
import {
  CUSTOMER_CANCELLABLE_STATUSES,
  STATUS_TRANSITIONS,
} from "@/lib/orders/status";
import { notifyOrderStatusChange } from "@/lib/orders/notifications";
import { ServiceError } from "@/lib/services/service-error";
import type {
  AdminOrderQueryInput,
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
  slug: true,
} as const;

const orderItemInclude = {
  // Order items carry their own productName/productImage/sku snapshot,
  // so we only need the live product link for navigation (it may be null
  // if the product was deleted).
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} satisfies Prisma.OrderItemInclude;

const orderInclude = {
  items: { include: orderItemInclude },
  // Full audit trail, oldest first, so the customer tracker and admin
  // timeline render chronologically without a client-side sort.
  statusHistory: { orderBy: { createdAt: "asc" } },
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
/*  Serialization (Decimal -> number for JSON responses)                      */
/* -------------------------------------------------------------------------- */

/**
 * Normalize an order row for the API: money Decimals become numbers and
 * each item is flattened to the snapshot shape the client expects
 * (productName/productImage/sku/unitPrice/totalPrice), with the live
 * product link kept (nullable) for navigation.
 */
function serializeOrderItem(item: OrderWithItems["items"][number]) {
  return {
    id: item.id,
    productId: item.productId,
    variantId: item.variantId,
    productName: item.productName,
    productImage: item.productImage,
    sku: item.sku,
    color: item.color,
    size: item.size,
    quantity: item.quantity,
    unitPrice: toNumber(item.unitPrice),
    totalPrice: toNumber(item.totalPrice),
    product: item.product
      ? { id: item.product.id, name: item.product.name, slug: item.product.slug }
      : null,
  };
}

export function serializeOrder<T extends OrderWithItems>(order: T) {
  return {
    ...order,
    subtotal: toNumber(order.subtotal),
    deliveryCharge: toNumber(order.deliveryCharge),
    discountAmount: toNumber(order.discountAmount),
    taxAmount: toNumber(order.taxAmount),
    totalAmount: toNumber(order.totalAmount),
    items: order.items.map(serializeOrderItem),
  };
}

export function serializeOrderOrNull<T extends OrderWithItems>(
  order: T | null,
) {
  return order == null ? null : serializeOrder(order);
}

function netMerchandiseRevenue(source: {
  subtotal?: Parameters<typeof toNumber>[0];
  discountAmount?: Parameters<typeof toNumber>[0];
}): number {
  return round2(toNumber(source.subtotal) - toNumber(source.discountAmount));
}

/* -------------------------------------------------------------------------- */
/*  Create order — removed                                                    */
/* -------------------------------------------------------------------------- */
//
// The legacy `createOrder` path (and its `resolveItems` /
// `effectiveProductPrice` / `generateOrderNumber` helpers) used to trust
// client-supplied `discountAmount`/`deliveryCharge`. It has been deleted.
// Order creation now goes exclusively through
// `checkout.service.placeOrder` (used by both `POST /api/orders` and
// `POST /api/checkout`), which recomputes every money value from the DB
// inside a single transaction.



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
    items: items.map(serializeOrder),
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
  return prisma.order
    .findFirst({
      where: { id: orderId, userId },
      include: orderInclude,
    })
    .then(serializeOrderOrNull);
}

/* -------------------------------------------------------------------------- */
/*  Cancellation                                                              */
/* -------------------------------------------------------------------------- */

const CUSTOMER_CANCELLABLE: readonly OrderStatus[] = CUSTOMER_CANCELLABLE_STATUSES;

/**
 * Append a row to the order's status audit trail. Always called inside
 * the same transaction that updates `Order.status` so the history can
 * never drift from the live status.
 */
function recordStatusHistory(
  tx: Prisma.TransactionClient,
  orderId: string,
  status: OrderStatus,
  options: { note?: string | null; updatedBy?: string | null } = {},
) {
  return tx.orderStatusHistory.create({
    data: {
      orderId,
      status,
      note: options.note ?? null,
      updatedBy: options.updatedBy ?? null,
    },
  });
}

/**
 * Fire a best-effort status-change notification for an already-committed
 * order. Kept outside the DB transaction so a delivery hiccup can't roll
 * back the status update; `notifyOrderStatusChange` itself never throws.
 */
async function fireStatusNotification(order: {
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
}) {
  await notifyOrderStatusChange({
    orderNumber: order.orderNumber,
    status: order.status,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
  });
}

/**
 * Restore stock for an order's items onto their variants.
 *
 * Order items keep a `variantId` snapshot. We restore onto that variant
 * when it still exists (SET NULL on delete means it may be gone). A SKU
 * fallback covers any legacy rows that predate the variantId snapshot.
 * Each restore is recorded in the inventory ledger.
 */
async function restoreStockForItems(
  tx: Prisma.TransactionClient,
  items: { variantId: string | null; sku: string | null; quantity: number }[],
  orderNumber: string,
) {
  for (const item of items) {
    let variantId = item.variantId ?? null;

    if (!variantId && item.sku) {
      const variant = await tx.productVariant.findUnique({
        where: { sku: item.sku },
        select: { id: true },
      });
      variantId = variant?.id ?? null;
    }

    if (!variantId) continue;

    // Guard against a variant that was deleted after the order was placed.
    const exists = await tx.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true },
    });
    if (!exists) continue;

    await tx.productVariant.update({
      where: { id: variantId },
      data: { stock: { increment: item.quantity } },
    });
    await tx.inventoryLog.create({
      data: {
        variantId,
        type: "ORDER_CANCELLED",
        quantity: item.quantity,
        note: `Order ${orderNumber} cancelled`,
      },
    });
  }
}

export async function cancelOrderAsCustomer(orderId: string, userId: string) {
  const result = await prisma.$transaction(async (tx) => {
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

    // Restore stock for every line onto its variant.
    await restoreStockForItems(tx, order.items, order.orderNumber);

    const updated = await tx.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
      include: orderInclude,
    });
    await recordStatusHistory(tx, order.id, "CANCELLED", {
      note: "Cancelled by customer.",
      updatedBy: userId,
    });
    return serializeOrder(updated);
  });

  await fireStatusNotification(result);
  return result;
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

  const [rows, total, aggregates] = await Promise.all([
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
    // Lightweight aggregates for the summary cards — computed alongside the
    // list query so the client never needs to fetch all rows.
    prisma.order.aggregate({
      where: { ...where, status: { not: "CANCELLED" } },
      _sum: { totalAmount: true, subtotal: true, discountAmount: true },
      _count: true,
    }).then(async (agg) => {
      const [pendingCount, unpaidCount] = await Promise.all([
        prisma.order.count({ where: { ...where, status: "PENDING" } }),
        prisma.order.count({
          where: { ...where, paymentStatus: "UNPAID", status: { not: "CANCELLED" } },
        }),
      ]);
      return {
        revenue: netMerchandiseRevenue(agg._sum),
        pendingCount,
        unpaidCount,
      };
    }),
  ]);

  // Flatten `_count.items` and convert Decimal money fields to numbers.
  const items = rows.map((row) => {
    const { _count, ...rest } = row;
    return {
      ...rest,
      subtotal: toNumber(rest.subtotal),
      deliveryCharge: toNumber(rest.deliveryCharge),
      discountAmount: toNumber(rest.discountAmount),
      totalAmount: toNumber(rest.totalAmount),
      itemsCount: _count.items,
    };
  });

  return {
    items,
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      revenue: aggregates.revenue,
      pendingCount: aggregates.pendingCount,
      unpaidCount: aggregates.unpaidCount,
    },
  };
}

/**
 * Cache layer over `listOrdersForAdmin`. Tagged `admin-orders` so any
 * status / payment / cancellation mutation can bust it on demand via
 * `revalidateTag("admin-orders", "max")`. Uses stale-while-revalidate
 * semantics so the admin panel stays responsive even if the DB is slow.
 */
const getCachedOrdersForAdmin = unstable_cache(
  async (query: AdminOrderQueryInput) => listOrdersForAdmin(query),
  ["admin-orders-list"],
  { revalidate: 300, tags: ["admin-orders"] },
);

export function listOrdersForAdminCached(query: AdminOrderQueryInput) {
  return getCachedOrdersForAdmin(query);
}

export function getOrderForAdmin(orderId: string) {
  return prisma.order
    .findUnique({
      where: { id: orderId },
      include: orderWithUserInclude,
    })
    .then((order) => (order == null ? null : serializeOrder(order)));
}

/* -------------------------------------------------------------------------- */
/*  Admin updates                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Update an order's status.
 *
 * Transition rules live in `@/lib/orders/status` (shared with the UI).
 * Stock is restored when an order leaves a live state into CANCELLED or
 * is RETURNED, and every change appends to the audit trail — all inside
 * one transaction so status, stock, and history can't drift apart.
 *
 * `updatedBy` is the admin id from the session (recorded in the trail).
 */
export async function updateOrderStatus(
  orderId: string,
  input: UpdateOrderStatusInput,
  updatedBy?: string | null,
) {
  const result = await prisma.$transaction(async (tx) => {
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

    // Restore stock when an order moves out of a live state: an admin
    // cancellation or a completed return both put the units back.
    if (next === "CANCELLED" || next === "RETURNED") {
      await restoreStockForItems(tx, order.items, order.orderNumber);
    }

    const updated = await tx.order.update({
      where: { id: order.id },
      data: { status: next },
      include: orderWithUserInclude,
    });
    await recordStatusHistory(tx, order.id, next, {
      note: input.note ?? null,
      updatedBy: updatedBy ?? null,
    });
    return serializeOrder(updated);
  });

  await fireStatusNotification(result);
  return result;
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

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: input.paymentStatus },
    include: orderWithUserInclude,
  });
  return serializeOrder(updated);
}

// `orderItemProductSelect` is exported only for tests / future use.
export { orderItemProductSelect };

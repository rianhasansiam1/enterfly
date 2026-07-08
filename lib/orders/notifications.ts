/**
 * Order status-change notifications.
 *
 * This project ships no server-side email/SMS provider, so this module
 * is the single, pluggable trigger point: `buildOrderStatusNotification`
 * is a pure function (easily unit-tested and reusable), and
 * `notifyOrderStatusChange` performs best-effort delivery. The default
 * sink logs a structured record server-side — swap it for a real
 * provider (Resend / SES / Twilio …) without touching call sites.
 *
 * Framework-free on purpose (no `server-only`, no Prisma) so the pure
 * builder can be imported from tests and any runtime.
 */

import { ORDER_STATUS_META, type OrderStatus } from "./status";

type NotificationChannel = "email" | "sms" | "log";

export type OrderStatusNotification = {
  channel: NotificationChannel;
  to: string | null;
  subject: string;
  message: string;
};

export type OrderNotificationContext = {
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
};

/**
 * Build the customer-facing message for a status change. Pure: no I/O,
 * so it can be asserted directly in unit tests.
 *
 * Channel selection prefers email, then SMS, then a server-log fallback
 * when the order carries no contact details.
 */
function buildOrderStatusNotification(
  ctx: OrderNotificationContext,
): OrderStatusNotification {
  const meta = ORDER_STATUS_META[ctx.status];
  const name = ctx.customerName?.trim() || "there";

  const subject = `Order ${ctx.orderNumber}: ${meta.label}`;
  const message =
    `Hi ${name}, your order ${ctx.orderNumber} is now "${meta.label}". ` +
    meta.description;

  const channel: NotificationChannel = ctx.customerEmail
    ? "email"
    : ctx.customerPhone
      ? "sms"
      : "log";
  const to = ctx.customerEmail ?? ctx.customerPhone ?? null;

  return { channel, to, subject, message };
}

/**
 * Fire a status-change notification. Best-effort: never throws, so a
 * delivery hiccup can't roll back or block an order status update (the
 * durable record always lives in `OrderStatusHistory`).
 */
export async function notifyOrderStatusChange(
  ctx: OrderNotificationContext,
): Promise<OrderStatusNotification> {
  const notification = buildOrderStatusNotification(ctx);
  try {
    // Default sink: structured server log. Replace with a real provider
    // dispatch here when one is configured.
    console.info(
      "[order-notification]",
      JSON.stringify({
        channel: notification.channel,
        to: notification.to,
        subject: notification.subject,
      }),
    );
  } catch {
    // Swallow — notifications must never break the status update.
  }
  return notification;
}

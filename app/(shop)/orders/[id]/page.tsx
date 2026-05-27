import type { Metadata } from "next";

import OrderSummaryClient from "./components/OrderSummaryClient";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Order summary | EnterFly",
  description: "Review your order and download the receipt.",
  robots: { index: false, follow: false },
};

/**
 * Public order summary page.
 *
 * The page itself is a thin server wrapper that just unwraps the
 * `params` promise (Next 16 convention) and hands the id to the
 * client component. All data fetching happens client-side because
 * logged-in owners and admins call `/api/orders/[id]` directly,
 * which already enforces ownership at the SQL layer. Anonymous
 * visitors are bounced to /login by the client component.
 */
export default async function OrderSummaryPage({ params }: Props) {
  const { id } = await params;
  return <OrderSummaryClient orderId={id} />;
}

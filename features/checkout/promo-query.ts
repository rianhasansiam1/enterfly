export const PROMO_QUERY_PARAM = "promo";

export function normalizePromoCode(rawCode: string | null | undefined) {
  const code = rawCode?.trim().toUpperCase() ?? "";
  return code ? code : null;
}

export function buildCheckoutPath({
  buy,
  promoCode,
}: {
  buy?: string | null;
  promoCode?: string | null;
} = {}) {
  const params = new URLSearchParams();
  const buyValue = buy?.trim();
  const code = normalizePromoCode(promoCode);

  if (buyValue) params.set("buy", buyValue);
  if (code) params.set(PROMO_QUERY_PARAM, code);

  const query = params.toString();
  return query ? `/checkout?${query}` : "/checkout";
}

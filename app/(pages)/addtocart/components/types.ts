export type CartItem = {
  id: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  maxQuantity: number;
  /** e.g. "Color: Lavender / Size: M" */
  variant?: string;
  inStock: boolean;
  /** Estimated days until delivery. */
  deliveryDays?: number;
  /** Free returns, gift wrap, etc. */
  perks?: string[];
};

export type SavedItem = {
  id: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  originalPrice?: number;
  inStock: boolean;
};

export type AppliedPromo = {
  code: string;
  /** Flat amount discount in BDT. */
  discount: number;
  description: string;
};

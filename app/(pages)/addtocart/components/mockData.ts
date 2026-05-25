import type { CartItem, SavedItem } from "./types";

export const MOCK_CART: CartItem[] = [
  {
    id: "c-1",
    name: "Aurora Wireless Noise-Cancelling Headphones",
    brand: "Sonix",
    image:
      "https://images.unsplash.com/photo-1518444023325-89d4cb6e5dac?w=800&q=80",
    price: 18900,
    originalPrice: 24900,
    quantity: 1,
    maxQuantity: 5,
    variant: "Color: Midnight Black",
    inStock: true,
    deliveryDays: 3,
    perks: ["Free returns", "1-year warranty"],
  },
  {
    id: "c-2",
    name: "Orbit Mechanical Keyboard 75% — Lavender",
    brand: "Keychron",
    image:
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80",
    price: 14500,
    originalPrice: 16500,
    quantity: 2,
    maxQuantity: 4,
    variant: "Layout: ANSI / Switch: Brown",
    inStock: true,
    deliveryDays: 5,
    perks: ["Free returns"],
  },
  {
    id: "c-3",
    name: "Ceramic Pour-Over Coffee Set",
    brand: "Hario",
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80",
    price: 3850,
    originalPrice: 4500,
    quantity: 1,
    maxQuantity: 10,
    variant: "Capacity: 600ml",
    inStock: true,
    deliveryDays: 2,
    perks: ["Gift wrap available"],
  },
];

export const MOCK_SAVED: SavedItem[] = [
  {
    id: "s-1",
    name: "Lumen Pro Smartwatch — Titanium",
    brand: "Nordic",
    image:
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80",
    price: 32500,
    originalPrice: 36000,
    inStock: true,
  },
  {
    id: "s-2",
    name: "Nimbus Running Shoes — Cloud Foam",
    brand: "Atlas",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    price: 9800,
    inStock: true,
  },
  {
    id: "s-3",
    name: "Atelier Linen Oversized Shirt",
    brand: "Maison Co.",
    image:
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80",
    price: 4200,
    inStock: false,
  },
];

/** Free-shipping threshold (BDT). */
export const FREE_SHIPPING_THRESHOLD = 50000;

/** Standard shipping fee when below the free-shipping threshold (BDT). */
export const STANDARD_SHIPPING_FEE = 120;

/** Tax rate applied to the subtotal. */
export const TAX_RATE = 0.05;

export const VALID_PROMO_CODES: Record<
  string,
  { discount: number; description: string }
> = {
  ENTERFLY10: { discount: 1500, description: "10% off your first order" },
  WELCOME500: { discount: 500, description: "BDT 500 welcome gift" },
  FLYHIGH: { discount: 2500, description: "BDT 2500 off — flash deal" },
};

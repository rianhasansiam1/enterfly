import type { WishlistItem } from "./types";

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const MOCK_WISHLIST: WishlistItem[] = [
  {
    id: "wl-1",
    name: "Aurora Wireless Noise-Cancelling Headphones",
    brand: "Sonix",
    image:
      "https://images.unsplash.com/photo-1518444023325-89d4cb6e5dac?w=800&q=80",
    price: 18900,
    originalPrice: 24900,
    rating: 4.7,
    reviewCount: 1284,
    category: "Audio",
    inStock: true,
    addedAt: daysAgo(2),
    priceDropFromAdded: 1500,
    badge: "Best Seller",
  },
  {
    id: "wl-2",
    name: "Lumen Pro Smartwatch — Titanium Edition",
    brand: "Nordic",
    image:
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80",
    price: 32500,
    originalPrice: 36000,
    rating: 4.8,
    reviewCount: 612,
    category: "Wearables",
    inStock: true,
    addedAt: daysAgo(5),
    badge: "Limited",
  },
  {
    id: "wl-3",
    name: "Atelier Linen Oversized Shirt",
    brand: "Maison Co.",
    image:
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80",
    price: 4200,
    rating: 4.4,
    reviewCount: 198,
    category: "Fashion",
    inStock: true,
    addedAt: daysAgo(12),
    badge: "New",
  },
  {
    id: "wl-4",
    name: "Orbit Mechanical Keyboard 75% — Lavender",
    brand: "Keychron",
    image:
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80",
    price: 14500,
    originalPrice: 16500,
    rating: 4.9,
    reviewCount: 2310,
    category: "Computing",
    inStock: false,
    addedAt: daysAgo(20),
    badge: "Trending",
  },
  {
    id: "wl-5",
    name: "Ceramic Pour-Over Coffee Set",
    brand: "Hario",
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80",
    price: 3850,
    originalPrice: 4500,
    rating: 4.6,
    reviewCount: 421,
    category: "Home",
    inStock: true,
    addedAt: daysAgo(30),
    priceDropFromAdded: 350,
  },
  {
    id: "wl-6",
    name: "Nimbus Running Shoes — Cloud Foam",
    brand: "Atlas",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    price: 9800,
    rating: 4.5,
    reviewCount: 873,
    category: "Footwear",
    inStock: true,
    addedAt: daysAgo(45),
  },
];

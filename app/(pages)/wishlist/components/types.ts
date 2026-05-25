export type WishlistItem = {
  id: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  category: string;
  inStock: boolean;
  /** ISO date string – when the user added this to their wishlist. */
  addedAt: string;
  /** Optional drop in price since the item was added. */
  priceDropFromAdded?: number;
  badge?: "New" | "Trending" | "Limited" | "Best Seller";
};

export type WishlistView = "grid" | "list";

export type WishlistSort =
  | "recent"
  | "oldest"
  | "price-asc"
  | "price-desc"
  | "rating";

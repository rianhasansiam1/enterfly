import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type WishlistItem = {
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
  addedAt: string;
  priceDropFromAdded?: number;
  badge?: string;
};

type WishlistMode = "local" | "server";

type WishlistState = {
  items: WishlistItem[];
  mode: WishlistMode;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
};

const initialState: WishlistState = {
  items: [],
  mode: "local",
  isHydrated: false,
  isLoading: false,
  error: null,
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    setWishlistItems(state, action: PayloadAction<WishlistItem[]>) {
      state.items = action.payload;
      state.isHydrated = true;
      state.error = null;
    },
    upsertWishlistItem(state, action: PayloadAction<WishlistItem>) {
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index >= 0) {
        state.items[index] = action.payload;
      } else {
        state.items.unshift(action.payload);
      }
    },
    removeWishlistItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    clearWishlistItems(state) {
      state.items = [];
    },
    setWishlistMode(state, action: PayloadAction<WishlistMode>) {
      state.mode = action.payload;
    },
    setWishlistHydrated(state, action: PayloadAction<boolean>) {
      state.isHydrated = action.payload;
    },
    setWishlistLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setWishlistError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  setWishlistItems,
  upsertWishlistItem,
  removeWishlistItem,
  clearWishlistItems,
  setWishlistMode,
  setWishlistHydrated,
  setWishlistLoading,
  setWishlistError,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;


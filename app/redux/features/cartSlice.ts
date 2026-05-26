import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type CartStatus = "ACTIVE" | "INACTIVE";

type CartItem = {
  id: string;
  productId: string;
  name: string;
  image: string | null;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  lineTotal: number;
  stock: number;
  status: CartStatus;
};

type CartSummary = {
  totalItems: number;
  subtotal: number;
  totalDiscount: number;
  finalTotal: number;
};

type CartMode = "local" | "server";

type CartState = {
  items: CartItem[];
  summary: CartSummary;
  mode: CartMode;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
};

const EMPTY_SUMMARY: CartSummary = {
  totalItems: 0,
  subtotal: 0,
  totalDiscount: 0,
  finalTotal: 0,
};

const initialState: CartState = {
  items: [],
  summary: EMPTY_SUMMARY,
  mode: "local",
  isHydrated: false,
  isLoading: false,
  error: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCartData(
      state,
      action: PayloadAction<{ items: CartItem[]; summary: CartSummary }>,
    ) {
      state.items = action.payload.items;
      state.summary = action.payload.summary;
      state.isHydrated = true;
      state.error = null;
    },
    upsertCartItem(state, action: PayloadAction<CartItem>) {
      const next = action.payload;
      const index = state.items.findIndex(
        (item) => item.productId === next.productId || item.id === next.id,
      );

      if (index >= 0) {
        state.items[index] = next;
      } else {
        state.items.unshift(next);
      }
    },
    updateCartItem(state, action: PayloadAction<CartItem>) {
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index >= 0) {
        state.items[index] = action.payload;
      }
    },
    removeCartItemById(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    removeCartItemByProductId(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.productId !== action.payload);
    },
    clearCartItems(state) {
      state.items = [];
      state.summary = EMPTY_SUMMARY;
    },
    setCartSummary(state, action: PayloadAction<CartSummary>) {
      state.summary = action.payload;
    },
    setCartMode(state, action: PayloadAction<CartMode>) {
      state.mode = action.payload;
    },
    setCartHydrated(state, action: PayloadAction<boolean>) {
      state.isHydrated = action.payload;
    },
    setCartLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setCartError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  setCartData,
  upsertCartItem,
  updateCartItem,
  removeCartItemById,
  removeCartItemByProductId,
  clearCartItems,
  setCartSummary,
  setCartMode,
  setCartHydrated,
  setCartLoading,
  setCartError,
} = cartSlice.actions;

export default cartSlice.reducer;

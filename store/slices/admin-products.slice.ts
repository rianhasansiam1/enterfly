import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { AdminProduct, ApiMeta } from "@/features/admin-products/api";

type AdminProductsState = {
  items: AdminProduct[];
  meta: ApiMeta | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: AdminProductsState = {
  items: [],
  meta: null,
  isLoading: false,
  error: null,
};

const adminProductsSlice = createSlice({
  name: "adminProducts",
  initialState,
  reducers: {
    setAdminProductsPage(
      state,
      action: PayloadAction<{ items: AdminProduct[]; meta: ApiMeta }>,
    ) {
      state.items = action.payload.items;
      state.meta = action.payload.meta;
      state.error = null;
    },
    upsertAdminProduct(state, action: PayloadAction<AdminProduct>) {
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index >= 0) {
        state.items[index] = action.payload;
      } else {
        state.items.unshift(action.payload);
      }
    },
    removeAdminProduct(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    setAdminProductsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setAdminProductsError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  setAdminProductsPage,
  upsertAdminProduct,
  removeAdminProduct,
  setAdminProductsLoading,
  setAdminProductsError,
} = adminProductsSlice.actions;

export default adminProductsSlice.reducer;

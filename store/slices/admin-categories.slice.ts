import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { AdminCategoryRow, ApiMeta } from "@/features/admin-categories/api";

type AdminCategoriesState = {
  items: AdminCategoryRow[];
  meta: ApiMeta | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: AdminCategoriesState = {
  items: [],
  meta: null,
  isLoading: false,
  error: null,
};

const adminCategoriesSlice = createSlice({
  name: "adminCategories",
  initialState,
  reducers: {
    setAdminCategoriesPage(
      state,
      action: PayloadAction<{ items: AdminCategoryRow[]; meta: ApiMeta }>,
    ) {
      state.items = action.payload.items;
      state.meta = action.payload.meta;
      state.error = null;
    },
    upsertAdminCategory(state, action: PayloadAction<AdminCategoryRow>) {
      const index = state.items.findIndex(
        (item) => item.id === action.payload.id,
      );
      if (index >= 0) {
        const existing = state.items[index];
        state.items[index] = {
          ...action.payload,
          productCount:
            action.payload.productCount > 0
              ? action.payload.productCount
              : existing.productCount,
        };
      } else {
        state.items.unshift(action.payload);
      }
    },
    patchAdminCategory(
      state,
      action: PayloadAction<{ id: string; changes: Partial<AdminCategoryRow> }>,
    ) {
      const index = state.items.findIndex(
        (item) => item.id === action.payload.id,
      );
      if (index >= 0) {
        state.items[index] = { ...state.items[index], ...action.payload.changes };
      }
    },
    removeAdminCategory(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    setAdminCategoriesLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setAdminCategoriesError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  setAdminCategoriesPage,
  upsertAdminCategory,
  patchAdminCategory,
  removeAdminCategory,
  setAdminCategoriesLoading,
  setAdminCategoriesError,
} = adminCategoriesSlice.actions;

export default adminCategoriesSlice.reducer;

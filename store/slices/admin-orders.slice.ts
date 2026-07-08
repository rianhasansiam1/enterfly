import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { AdminOrderRow, ApiMeta } from "@/features/admin-orders/api";

type AdminOrdersState = {
  items: AdminOrderRow[];
  meta: ApiMeta | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: AdminOrdersState = {
  items: [],
  meta: null,
  isLoading: false,
  error: null,
};

const adminOrdersSlice = createSlice({
  name: "adminOrders",
  initialState,
  reducers: {
    setAdminOrdersPage(
      state,
      action: PayloadAction<{ items: AdminOrderRow[]; meta: ApiMeta }>,
    ) {
      state.items = action.payload.items;
      state.meta = action.payload.meta;
      state.error = null;
    },
    patchAdminOrder(
      state,
      action: PayloadAction<{ id: string; changes: Partial<AdminOrderRow> }>,
    ) {
      const index = state.items.findIndex(
        (item) => item.id === action.payload.id,
      );
      if (index >= 0) {
        state.items[index] = { ...state.items[index], ...action.payload.changes };
      }
    },
    setAdminOrdersLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setAdminOrdersError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  setAdminOrdersPage,
  patchAdminOrder,
  setAdminOrdersLoading,
  setAdminOrdersError,
} = adminOrdersSlice.actions;

export default adminOrdersSlice.reducer;

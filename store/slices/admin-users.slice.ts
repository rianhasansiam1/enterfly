import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { AdminUserRow, ApiMeta } from "@/features/admin-users/api";

type AdminUsersState = {
  items: AdminUserRow[];
  meta: ApiMeta | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: AdminUsersState = {
  items: [],
  meta: null,
  isLoading: false,
  error: null,
};

const adminUsersSlice = createSlice({
  name: "adminUsers",
  initialState,
  reducers: {
    setAdminUsersPage(
      state,
      action: PayloadAction<{ items: AdminUserRow[]; meta: ApiMeta }>,
    ) {
      state.items = action.payload.items;
      state.meta = action.payload.meta;
      state.error = null;
    },
    patchAdminUser(
      state,
      action: PayloadAction<{ id: string; changes: Partial<AdminUserRow> }>,
    ) {
      const index = state.items.findIndex(
        (item) => item.id === action.payload.id,
      );
      if (index >= 0) {
        state.items[index] = { ...state.items[index], ...action.payload.changes };
      }
    },
    setAdminUsersLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setAdminUsersError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  setAdminUsersPage,
  patchAdminUser,
  setAdminUsersLoading,
  setAdminUsersError,
} = adminUsersSlice.actions;

export default adminUsersSlice.reducer;

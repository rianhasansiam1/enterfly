import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { AdminMessageRow, ApiMeta } from "@/features/admin-messages/api";

type AdminMessagesState = {
  items: AdminMessageRow[];
  meta: ApiMeta | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: AdminMessagesState = {
  items: [],
  meta: null,
  isLoading: false,
  error: null,
};

const adminMessagesSlice = createSlice({
  name: "adminMessages",
  initialState,
  reducers: {
    setAdminMessagesPage(
      state,
      action: PayloadAction<{ items: AdminMessageRow[]; meta: ApiMeta }>,
    ) {
      state.items = action.payload.items;
      state.meta = action.payload.meta;
      state.error = null;
    },
    patchAdminMessage(
      state,
      action: PayloadAction<{
        id: string;
        changes: Partial<AdminMessageRow>;
      }>,
    ) {
      const index = state.items.findIndex(
        (item) => item.id === action.payload.id,
      );
      if (index >= 0) {
        state.items[index] = {
          ...state.items[index],
          ...action.payload.changes,
        };
      }
    },
    removeAdminMessage(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    setAdminMessagesLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setAdminMessagesError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  setAdminMessagesPage,
  patchAdminMessage,
  removeAdminMessage,
  setAdminMessagesLoading,
  setAdminMessagesError,
} = adminMessagesSlice.actions;

export default adminMessagesSlice.reducer;

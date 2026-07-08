import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { AdminReviewRow, ApiMeta } from "@/features/admin-reviews/api";

type AdminReviewsState = {
  items: AdminReviewRow[];
  meta: ApiMeta | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: AdminReviewsState = {
  items: [],
  meta: null,
  isLoading: false,
  error: null,
};

const adminReviewsSlice = createSlice({
  name: "adminReviews",
  initialState,
  reducers: {
    setAdminReviewsPage(
      state,
      action: PayloadAction<{ items: AdminReviewRow[]; meta: ApiMeta }>,
    ) {
      state.items = action.payload.items;
      state.meta = action.payload.meta;
      state.error = null;
    },
    prependAdminReview(state, action: PayloadAction<AdminReviewRow>) {
      state.items.unshift(action.payload);
    },
    removeAdminReview(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    setAdminReviewsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setAdminReviewsError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  setAdminReviewsPage,
  prependAdminReview,
  removeAdminReview,
  setAdminReviewsLoading,
  setAdminReviewsError,
} = adminReviewsSlice.actions;

export default adminReviewsSlice.reducer;

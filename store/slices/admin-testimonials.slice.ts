import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { AdminTestimonialRow, ApiMeta } from "@/features/admin-testimonials/api";

type AdminTestimonialsState = {
  items: AdminTestimonialRow[];
  meta: ApiMeta | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: AdminTestimonialsState = {
  items: [],
  meta: null,
  isLoading: false,
  error: null,
};

const adminTestimonialsSlice = createSlice({
  name: "adminTestimonials",
  initialState,
  reducers: {
    setAdminTestimonialsPage(
      state,
      action: PayloadAction<{ items: AdminTestimonialRow[]; meta: ApiMeta }>,
    ) {
      state.items = action.payload.items;
      state.meta = action.payload.meta;
      state.error = null;
    },
    upsertAdminTestimonial(state, action: PayloadAction<AdminTestimonialRow>) {
      const index = state.items.findIndex(
        (item) => item.id === action.payload.id,
      );
      if (index >= 0) {
        state.items[index] = action.payload;
      } else {
        state.items.unshift(action.payload);
      }
    },
    removeAdminTestimonial(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    setAdminTestimonialsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setAdminTestimonialsError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  setAdminTestimonialsPage,
  upsertAdminTestimonial,
  removeAdminTestimonial,
  setAdminTestimonialsLoading,
  setAdminTestimonialsError,
} = adminTestimonialsSlice.actions;

export default adminTestimonialsSlice.reducer;

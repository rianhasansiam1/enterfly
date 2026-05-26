import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type ProductStatus = "ACTIVE" | "INACTIVE";

type AdminProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  image: string | null;
  images: string[];
  rating: number;
  reviewCount: number;
  badge: string | null;
  status: ProductStatus;
  stock: number;
  createdAt: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    image: string | null;
  };
};

type AdminProductsState = {
  items: AdminProduct[];
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
};

const initialState: AdminProductsState = {
  items: [],
  isHydrated: false,
  isLoading: false,
  error: null,
};

const adminProductsSlice = createSlice({
  name: "adminProducts",
  initialState,
  reducers: {
    setAdminProducts(state, action: PayloadAction<AdminProduct[]>) {
      state.items = action.payload;
      state.isHydrated = true;
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
  setAdminProducts,
  upsertAdminProduct,
  removeAdminProduct,
  setAdminProductsLoading,
  setAdminProductsError,
} = adminProductsSlice.actions;

export default adminProductsSlice.reducer;

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type AllProductsItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  image: string;
  images: string[];
  rating: number;
  reviewCount: number;
  badge: string | null;
  categoryId: string;
  category: string;
  categoryImage: string | null;
  brand?: string;
  stock: number;
  inStock: boolean;
  createdAt: string;
};

type AllProductsState = {
  items: AllProductsItem[];
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
};

const initialState: AllProductsState = {
  items: [],
  isHydrated: false,
  isLoading: false,
  error: null,
};

const allProductsSlice = createSlice({
  name: "allProducts",
  initialState,
  reducers: {
    setAllProducts(state, action: PayloadAction<AllProductsItem[]>) {
      state.items = action.payload;
      state.isHydrated = true;
      state.error = null;
    },
    setAllProductsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setAllProductsError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  setAllProducts,
  setAllProductsLoading,
  setAllProductsError,
} = allProductsSlice.actions;

export default allProductsSlice.reducer;

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type HomeCategoryProduct = {
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
};

type HomeCategoryBanner = {
  id: string;
  image: string;
  label: string;
  heading: string;
  discount: string;
  description: string;
  link: string | null;
};

type HomeCategory = {
  id: string;
  name: string;
  image: string | null;
  products: HomeCategoryProduct[];
  categoryBanner: HomeCategoryBanner | null;
};

type HomeCategoriesState = {
  items: HomeCategory[];
  isHydrated: boolean;
};

const initialState: HomeCategoriesState = {
  items: [],
  isHydrated: false,
};

const homeCategoriesSlice = createSlice({
  name: "homeCategories",
  initialState,
  reducers: {
    setHomeCategories(state, action: PayloadAction<HomeCategory[]>) {
      state.items = action.payload;
      state.isHydrated = true;
    },
  },
});

export const { setHomeCategories } = homeCategoriesSlice.actions;
export default homeCategoriesSlice.reducer;

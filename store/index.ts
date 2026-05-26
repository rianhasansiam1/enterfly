import { configureStore } from "@reduxjs/toolkit";

import adminProductsReducer from "@/store/slices/admin-products.slice";
import allProductsReducer from "@/store/slices/all-products.slice";
import cartReducer from "@/store/slices/cart.slice";
import homeCategoriesReducer from "@/store/slices/home-categories.slice";
import wishlistReducer from "@/store/slices/wishlist.slice";

export const store = configureStore({
  reducer: {
    homeCategories: homeCategoriesReducer,
    allProducts: allProductsReducer,
    wishlist: wishlistReducer,
    cart: cartReducer,
    adminProducts: adminProductsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

import { configureStore } from "@reduxjs/toolkit";
import homeCategoriesReducer from "../features/homeCategoriesSlice";
import allProductsReducer from "../features/allProductsSlice";
import wishlistReducer from "../features/wishlistSlice";
import cartReducer from "../features/cartSlice";
import adminProductsReducer from "../features/adminProductsSlice";

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

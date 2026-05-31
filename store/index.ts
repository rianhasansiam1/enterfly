import { configureStore } from "@reduxjs/toolkit";

import adminBannersReducer from "@/store/slices/admin-banners.slice";
import adminCategoriesReducer from "@/store/slices/admin-categories.slice";
import adminMessagesReducer from "@/store/slices/admin-messages.slice";
import adminOrdersReducer from "@/store/slices/admin-orders.slice";
import adminProductsReducer from "@/store/slices/admin-products.slice";
import adminReportsReducer from "@/store/slices/admin-reports.slice";
import adminReviewsReducer from "@/store/slices/admin-reviews.slice";
import adminSettingsReducer from "@/store/slices/admin-settings.slice";
import adminTestimonialsReducer from "@/store/slices/admin-testimonials.slice";
import adminUsersReducer from "@/store/slices/admin-users.slice";
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
    adminOrders: adminOrdersReducer,
    adminUsers: adminUsersReducer,
    adminCategories: adminCategoriesReducer,
    adminBanners: adminBannersReducer,
    adminSettings: adminSettingsReducer,
    adminMessages: adminMessagesReducer,
    adminReports: adminReportsReducer,
    adminReviews: adminReviewsReducer,
    adminTestimonials: adminTestimonialsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

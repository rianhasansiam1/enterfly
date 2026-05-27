import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

type PaymentStatus = "PAID" | "UNPAID";

type PaymentMethod = "CASH_ON_DELIVERY" | "ONLINE";

type AdminOrderUser = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
} | null;

type AdminOrderRow = {
  id: string;
  orderNumber: string;
  subtotal: number;
  deliveryCharge: number;
  discountAmount: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  createdAt: string;
  updatedAt: string;
  itemsCount: number;
  user: AdminOrderUser;
};

type AdminOrdersState = {
  items: AdminOrderRow[];
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
};

const initialState: AdminOrdersState = {
  items: [],
  isHydrated: false,
  isLoading: false,
  error: null,
};

const adminOrdersSlice = createSlice({
  name: "adminOrders",
  initialState,
  reducers: {
    setAdminOrders(state, action: PayloadAction<AdminOrderRow[]>) {
      state.items = action.payload;
      state.isHydrated = true;
      state.error = null;
    },
    patchAdminOrder(
      state,
      action: PayloadAction<{ id: string; changes: Partial<AdminOrderRow> }>,
    ) {
      const index = state.items.findIndex(
        (item) => item.id === action.payload.id,
      );
      if (index >= 0) {
        state.items[index] = { ...state.items[index], ...action.payload.changes };
      }
    },
    setAdminOrdersLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setAdminOrdersError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  setAdminOrders,
  patchAdminOrder,
  setAdminOrdersLoading,
  setAdminOrdersError,
} = adminOrdersSlice.actions;

export default adminOrdersSlice.reducer;

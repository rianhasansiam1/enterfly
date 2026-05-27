import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { ReportPayload, ReportType } from "@/features/admin-reports/api";

type AdminReportsState = {
  type: ReportType;
  from: string;
  to: string;
  limit: number;
  payload: ReportPayload | null;
  isLoading: boolean;
  error: string | null;
  generatedAt: string | null;
};

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

const range = defaultRange();

const initialState: AdminReportsState = {
  type: "sales",
  from: range.from,
  to: range.to,
  limit: 100,
  payload: null,
  isLoading: false,
  error: null,
  generatedAt: null,
};

const slice = createSlice({
  name: "adminReports",
  initialState,
  reducers: {
    setReportType(state, action: PayloadAction<ReportType>) {
      state.type = action.payload;
      state.payload = null;
    },
    setFrom(state, action: PayloadAction<string>) {
      state.from = action.payload;
    },
    setTo(state, action: PayloadAction<string>) {
      state.to = action.payload;
    },
    setLimit(state, action: PayloadAction<number>) {
      state.limit = action.payload;
    },
    setReportLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setReportError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setReportPayload(state, action: PayloadAction<ReportPayload>) {
      state.payload = action.payload;
      state.generatedAt = new Date().toISOString();
      state.error = null;
    },
    clearReport(state) {
      state.payload = null;
      state.generatedAt = null;
      state.error = null;
    },
  },
});

export const {
  setReportType,
  setFrom,
  setTo,
  setLimit,
  setReportLoading,
  setReportError,
  setReportPayload,
  clearReport,
} = slice.actions;

export default slice.reducer;

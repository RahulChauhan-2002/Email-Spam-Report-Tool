import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  report: null,
  loading: false,
  error: null,
};

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    fetchReportStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchReportSuccess(state, action) {
      state.report = action.payload;
      state.loading = false;
    },
    fetchReportFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchReportStart,
  fetchReportSuccess,
  fetchReportFailure,
} = reportSlice.actions;

export default reportSlice.reducer;

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  testCode: null,
  loading: false,
  error: null,
};

const testSlice = createSlice({
  name: 'test',
  initialState,
  reducers: {
    startTestStart(state) {
      state.loading = true;
      state.error = null;
    },
    startTestSuccess(state, action) {
      state.testCode = action.payload;
      state.loading = false;
    },
    startTestFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  startTestStart,
  startTestSuccess,
  startTestFailure,
} = testSlice.actions;

export default testSlice.reducer;

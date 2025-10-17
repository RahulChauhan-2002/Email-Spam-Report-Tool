import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  inboxes: [],
  loading: false,
  error: null,
};

const inboxSlice = createSlice({
  name: 'inboxes',
  initialState,
  reducers: {
    fetchInboxesStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchInboxesSuccess(state, action) {
      state.inboxes = action.payload;
      state.loading = false;
    },
    fetchInboxesFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchInboxesStart,
  fetchInboxesSuccess,
  fetchInboxesFailure,
} = inboxSlice.actions;

export default inboxSlice.reducer;

import { configureStore } from '@reduxjs/toolkit';
import inboxReducer from './slices/inboxSlice';
import testReducer from './slices/testSlice';
import reportReducer from './slices/reportSlice';

export const store = configureStore({
  reducer: {
    inboxes: inboxReducer,
    test: testReducer,
    report: reportReducer,
  },
});

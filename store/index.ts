import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import reportReducer from './reportSlice';
import statsReducer from './statsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    report: reportReducer,
    stats: statsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['report/setSelectedEquipment', 'report/updateField'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
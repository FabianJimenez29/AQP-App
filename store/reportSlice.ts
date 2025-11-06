import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ReportState, Report } from '../types';

const initialState: ReportState = {
  currentReport: null,
  reports: [],
  isLoading: false,
  error: null,
};

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    startNewReport: (state, action: PayloadAction<{ clientName: string; location: string; technician: string }>) => {
      const reportNumber = `#${String(state.reports.length + 1).padStart(3, '0')}`;
      const now = new Date().toISOString();
      state.currentReport = {
        reportNumber,
        clientName: action.payload.clientName,
        location: action.payload.location,
        technician: action.payload.technician,
        entryTime: now,
        createdAt: now,
      };
    },
    updateCurrentReport: (state, action: PayloadAction<Partial<Report>>) => {
      if (state.currentReport) {
        state.currentReport = { ...state.currentReport, ...action.payload };
      }
    },
    finishReport: (state) => {
      if (state.currentReport) {
        state.currentReport.exitTime = new Date().toISOString();
        state.reports.push(state.currentReport as Report);
        state.currentReport = null;
      }
    },
    clearCurrentReport: (state) => {
      state.currentReport = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { 
  startNewReport, 
  updateCurrentReport, 
  finishReport, 
  clearCurrentReport, 
  setLoading, 
  setError 
} = reportSlice.actions;
export default reportSlice.reducer;
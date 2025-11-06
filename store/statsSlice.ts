import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchUserStats, fetchUserReports, fetchUserReport } from './statsActions';
import { logout } from './authSlice';

interface UserStats {
  totalReports: number;
  todayReports: number;
  weekReports: number;
}

interface ReportHistoryItem {
  id: number;
  created_at: string;
  status: string;
  location: string;
  photos_before: string[];
  photos_after: string[];
}

interface ReportHistory {
  reports: ReportHistoryItem[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
}

interface StatsState {
  userStats: UserStats | null;
  reportHistory: ReportHistory | null;
  isLoading: boolean;
  lastUpdate: string | null;
  error: string | null;
}

const initialState: StatsState = {
  userStats: null,
  reportHistory: null,
  isLoading: false,
  lastUpdate: null,
  error: null,
};

const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setUserStats: (state, action: PayloadAction<UserStats>) => {
      state.userStats = action.payload;
      state.lastUpdate = new Date().toISOString();
    },
    
    setReportHistory: (state, action: PayloadAction<ReportHistory>) => {
      state.reportHistory = action.payload;
    },
    
    clearStats: (state) => {
      state.userStats = null;
      state.reportHistory = null;
      state.lastUpdate = null;
      state.error = null;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    // Para agregar un nuevo reporte a las estadísticas inmediatamente
    incrementTodayReports: (state) => {
      if (state.userStats) {
        state.userStats.todayReports += 1;
        state.userStats.totalReports += 1;
        state.userStats.weekReports += 1;
        state.lastUpdate = new Date().toISOString();
      }
    },
  },
  extraReducers: (builder) => {
    // fetchUserStats
    builder
      .addCase(fetchUserStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userStats = action.payload;
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // fetchUserReports
    builder
      .addCase(fetchUserReports.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserReports.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reportHistory = action.payload;
      })
      .addCase(fetchUserReports.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // fetchUserReport
    builder
      .addCase(fetchUserReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserReport.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(fetchUserReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Limpiar estadísticas al hacer logout
    builder.addCase(logout, (state) => {
      state.userStats = null;
      state.reportHistory = null;
      state.lastUpdate = null;
      state.error = null;
      state.isLoading = false;
    });
  },
});

export const {
  setLoading,
  setUserStats,
  setReportHistory,
  clearStats,
  clearError,
  incrementTodayReports,
} = statsSlice.actions;

export default statsSlice.reducer;
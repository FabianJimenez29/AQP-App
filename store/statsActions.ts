import { createAsyncThunk } from '@reduxjs/toolkit';
import ApiService from '../services/api';
import { RootState } from './index';

export const fetchUserStats = createAsyncThunk(
  'stats/fetchUserStats',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No token available');
      }

      const stats = await ApiService.getUserStats(token);
      return stats;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error fetching statistics');
    }
  }
);

export const fetchUserReports = createAsyncThunk(
  'stats/fetchUserReports',
  async ({ page = 1, limit = 10 }: { page?: number; limit?: number } = {}, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No token available');
      }

      const history = await ApiService.getUserReports(token, page, limit);
      return history;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error fetching report history');
    }
  }
);

export const fetchUserReport = createAsyncThunk(
  'stats/fetchUserReport',
  async (reportId: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No token available');
      }

      const report = await ApiService.getUserReport(reportId, token);
      return report;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error fetching report details');
    }
  }
);

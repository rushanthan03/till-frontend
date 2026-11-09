import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { StaffMember, StaffPerformanceStats, MonthlyPerformanceReview, EfficiencyComparison, AttendanceTracking, PeakHourAnalysis, StaffLog } from './types';

interface StaffState {
    selectedStaff: StaffMember | null;
    dateRange: {
        startDate: string;
        endDate: string;
    };
    selectedMonth: {
        year: number;
        month: number;
    };
    performanceStats: StaffPerformanceStats | null;
    performanceReview: MonthlyPerformanceReview | null;
    efficiencyComparison: EfficiencyComparison | null;
    attendanceTracking: AttendanceTracking | null;
    peakHourAnalysis: PeakHourAnalysis | null;
    staffLogs: StaffLog[];
    isLoading: boolean;
    error: string | null;
}

const initialState: StaffState = {
    selectedStaff: null,
    dateRange: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    },
    selectedMonth: {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
    },
    performanceStats: null,
    performanceReview: null,
    efficiencyComparison: null,
    attendanceTracking: null,
    peakHourAnalysis: null,
    staffLogs: [],
    isLoading: false,
    error: null,
};

const staffSlice = createSlice({
    name: 'staff',
    initialState,
    reducers: {
        // Selection actions
        setSelectedStaff: (state, action: PayloadAction<StaffMember | null>) => {
            state.selectedStaff = action.payload;
        },
        setDateRange: (state, action: PayloadAction<{ startDate: string; endDate: string }>) => {
            state.dateRange = action.payload;
        },
        setSelectedMonth: (state, action: PayloadAction<{ year: number; month: number }>) => {
            state.selectedMonth = action.payload;
        },

        // Fetch actions
        fetchStaffPerformanceRequest: (state, _action: PayloadAction<{ staffId: string; restaurantId: string; startDate: string; endDate: string }>) => {
            state.isLoading = true;
            state.error = null;
        },
        fetchStaffPerformanceSuccess: (state, action: PayloadAction<StaffPerformanceStats>) => {
            state.performanceStats = action.payload;
            state.isLoading = false;
        },
        fetchStaffPerformanceFailure: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
            state.isLoading = false;
        },

        fetchPerformanceReviewRequest: (state, _action: PayloadAction<{ restaurantId: string; year: number; month: number }>) => {
            state.isLoading = true;
            state.error = null;
        },
        fetchPerformanceReviewSuccess: (state, action: PayloadAction<MonthlyPerformanceReview>) => {
            state.performanceReview = action.payload;
            state.isLoading = false;
        },
        fetchPerformanceReviewFailure: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
            state.isLoading = false;
        },

        fetchEfficiencyComparisonRequest: (state, _action: PayloadAction<{ restaurantId: string; startDate: string; endDate: string }>) => {
            state.isLoading = true;
            state.error = null;
        },
        fetchEfficiencyComparisonSuccess: (state, action: PayloadAction<EfficiencyComparison>) => {
            state.efficiencyComparison = action.payload;
            state.isLoading = false;
        },
        fetchEfficiencyComparisonFailure: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
            state.isLoading = false;
        },

        fetchStaffLogsRequest: (state, _action: PayloadAction<{ staffId: string; restaurantId: string; startDate: string; endDate: string }>) => {
            state.isLoading = true;
            state.error = null;
        },
        fetchStaffLogsSuccess: (state, action: PayloadAction<StaffLog[]>) => {
            state.staffLogs = action.payload;
            state.isLoading = false;
        },
        fetchStaffLogsFailure: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
            state.isLoading = false;
        },
    },
});

export const {
    setSelectedStaff,
    setDateRange,
    setSelectedMonth,
    fetchStaffPerformanceRequest,
    fetchStaffPerformanceSuccess,
    fetchStaffPerformanceFailure,
    fetchPerformanceReviewRequest,
    fetchPerformanceReviewSuccess,
    fetchPerformanceReviewFailure,
    fetchEfficiencyComparisonRequest,
    fetchEfficiencyComparisonSuccess,
    fetchEfficiencyComparisonFailure,
    fetchStaffLogsRequest,
    fetchStaffLogsSuccess,
    fetchStaffLogsFailure,
} = staffSlice.actions;

export default staffSlice.reducer;

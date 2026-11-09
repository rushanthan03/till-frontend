import axiosClient from "../../api/axiosClient";
import type {
    StaffPerformanceStats,
    MonthlyPerformanceReview,
    EfficiencyComparison,
    AttendanceTracking,
    PeakHourAnalysis,
    StaffLog,
    StaffPerformanceRequest,
    PerformanceReviewRequest,
    AnalyticsRequest
} from './types';

const StaffAPI = {
    // Get individual staff logs
    getStaffLogs: ({ staffId, restaurantId, startDate, endDate }: StaffPerformanceRequest) =>
        axiosClient.get<StaffLog[]>(
            `/api/order-management/logs/staff/${staffId}`,
            { params: { restaurantId, startDate, endDate } }
        ),

    // Get staff performance stats
    getStaffPerformance: ({ staffId, restaurantId, startDate, endDate }: StaffPerformanceRequest) =>
        axiosClient.get<StaffPerformanceStats>(
            `/api/order-management/logs/staff/${staffId}/performance`,
            { params: { restaurantId, startDate, endDate } }
        ),

    // Get monthly performance review
    getPerformanceReview: ({ restaurantId, year, month }: PerformanceReviewRequest) =>
        axiosClient.get<MonthlyPerformanceReview>(
            `/api/order-management/analytics/performance-review`,
            { params: { restaurantId, year, month } }
        ),

    // Get efficiency comparison
    getEfficiencyComparison: ({ restaurantId, startDate, endDate }: AnalyticsRequest) =>
        axiosClient.get<EfficiencyComparison>(
            `/api/order-management/analytics/efficiency-comparison`,
            { params: { restaurantId, startDate, endDate } }
        ),

    // Get attendance tracking
    getAttendanceTracking: ({ restaurantId, startDate, endDate }: AnalyticsRequest) =>
        axiosClient.get<AttendanceTracking>(
            `/api/order-management/analytics/attendance`,
            { params: { restaurantId, startDate, endDate } }
        ),

    // Get peak hour analysis
    getPeakHourAnalysis: ({ restaurantId, startDate, endDate }: AnalyticsRequest) =>
        axiosClient.get<PeakHourAnalysis>(
            `/api/order-management/analytics/peak-hours`,
            { params: { restaurantId, startDate, endDate } }
        ),
};

export default StaffAPI;

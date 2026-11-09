// Staff Analytics Types
export interface StaffMember {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    isActive?: boolean;
    createdAt?: string;
}

export interface StaffPerformanceStats {
    staff: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
    summary: {
        totalActions: number;
        uniqueOrdersHandled: number;
        loginSessions: number;
    };
    actionBreakdown: Record<string, number>;
    dailyActivity: Record<string, number>;
    hourlyActivity: Record<string, number>;
}

export interface MonthlyPerformanceReview {
    period: {
        year: number;
        month: number;
        monthName: string;
    };
    staffPerformance: Array<{
        staffId: string;
        name: string;
        role: string;
        metrics: {
            totalActions: number;
            ordersHandled: number;
            ordersConfirmed: number;
            ordersServed: number;
            paymentsProcessed: number;
        };
    }>;
    topPerformer: {
        staffId: string;
        name: string;
    };
}

export interface EfficiencyComparison {
    staffComparison: Array<{
        staffId: string;
        name: string;
        metrics: {
            ordersHandled: number;
            actionsPerOrder: string;
            efficiencyScore: string;
        };
    }>;
    mostEfficient: {
        staffId: string;
        name: string;
    };
}

export interface AttendanceTracking {
    staffAttendance: Array<{
        staffId: string;
        name: string;
        attendance: {
            totalSessions: number;
            totalHoursWorked: string;
            avgHoursPerDay: string;
            daysWorked: number;
            attendanceRate: string;
            dailyHours: Record<string, number>;
        };
    }>;
}

export interface PeakHourAnalysis {
    peakHours: Array<{
        hour: number;
        timeRange: string;
        totalActions: number;
        uniqueOrders: number;
        staffActive: number;
    }>;
    recommendations: {
        peakHour: string;
        recommendedStaffing: number;
    };
}

export interface StaffLog {
    id: string;
    action: string;
    performedByName: string;
    performedByRole: string;
    notes?: string;
    orderId: string;
    createdAt: string;
}

// Request Types
export interface StaffPerformanceRequest {
    staffId: string;
    restaurantId: string;
    startDate: string;
    endDate: string;
}

export interface PerformanceReviewRequest {
    restaurantId: string;
    year: number;
    month: number;
}

export interface AnalyticsRequest {
    restaurantId: string;
    startDate: string;
    endDate: string;
}

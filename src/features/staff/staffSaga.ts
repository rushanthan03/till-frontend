import { call, put, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import StaffAPI from './staffAPI';
import {
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
} from './staffSlice';
import type { StaffPerformanceRequest, PerformanceReviewRequest, AnalyticsRequest } from './types';

// Fetch staff performance
function* fetchStaffPerformanceSaga(action: PayloadAction<StaffPerformanceRequest>) {
    try {
        const response: Awaited<ReturnType<typeof StaffAPI.getStaffPerformance>> = yield call(
            StaffAPI.getStaffPerformance,
            action.payload
        );
        yield put(fetchStaffPerformanceSuccess(response.data));
    } catch (error: any) {
        yield put(fetchStaffPerformanceFailure(error.message || 'Failed to fetch staff performance'));
    }
}

// Fetch performance review
function* fetchPerformanceReviewSaga(action: PayloadAction<PerformanceReviewRequest>) {
    try {
        const response: Awaited<ReturnType<typeof StaffAPI.getPerformanceReview>> = yield call(
            StaffAPI.getPerformanceReview,
            action.payload
        );
        yield put(fetchPerformanceReviewSuccess(response.data));
    } catch (error: any) {
        yield put(fetchPerformanceReviewFailure(error.message || 'Failed to fetch performance review'));
    }
}

// Fetch efficiency comparison
function* fetchEfficiencyComparisonSaga(action: PayloadAction<AnalyticsRequest>) {
    try {
        const response: Awaited<ReturnType<typeof StaffAPI.getEfficiencyComparison>> = yield call(
            StaffAPI.getEfficiencyComparison,
            action.payload
        );
        yield put(fetchEfficiencyComparisonSuccess(response.data));
    } catch (error: any) {
        yield put(fetchEfficiencyComparisonFailure(error.message || 'Failed to fetch efficiency comparison'));
    }
}

// Fetch staff logs
function* fetchStaffLogsSaga(action: PayloadAction<StaffPerformanceRequest>) {
    try {
        const response: Awaited<ReturnType<typeof StaffAPI.getStaffLogs>> = yield call(
            StaffAPI.getStaffLogs,
            action.payload
        );
        yield put(fetchStaffLogsSuccess(response.data));
    } catch (error: any) {
        yield put(fetchStaffLogsFailure(error.message || 'Failed to fetch staff logs'));
    }
}

// Root saga
export default function* staffSaga() {
    yield takeLatest(fetchStaffPerformanceRequest.type, fetchStaffPerformanceSaga);
    yield takeLatest(fetchPerformanceReviewRequest.type, fetchPerformanceReviewSaga);
    yield takeLatest(fetchEfficiencyComparisonRequest.type, fetchEfficiencyComparisonSaga);
    yield takeLatest(fetchStaffLogsRequest.type, fetchStaffLogsSaga);
}

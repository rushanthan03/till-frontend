import { call, CallEffect, put, PutEffect, putResolve, takeLatest } from "redux-saga/effects";
import { createUserRoleFaliure, createUserRoleRequest, createUserRoleSuccess, fetchAllUserRoleFaliure, fetchAllUserRoleRequest, fetchAllUserRoleSuccess, fetchAllUsersByTenantFaliure, fetchAllUsersByTenantRequest, fetchAllUsersByTenantSuccess, resetUserPasswordFaliure, resetUserPasswordRequest, resetUserPasswordSuccess, updateUserRoleRequest, updateUserRoleSuccess } from "./userRolesSlice";
import { handleApiError } from "../../api/handleApiError";
import UserRoleAPI from "./userRolesAPI";
import { PayloadAction } from "@reduxjs/toolkit";
import { AllUserRoleResponse, CreateUserRequest, FetchAllUserRoleResponse, UserRoleAllRequest, UserRoleResponse } from "./types";
import { fetchAllRestaurantRequest, updateRestaurantsFaliure } from "../platformStores/storesSlice";
import { fetchAllTenantRequest } from "../platformTenants/tenantsSlice";
import { toast } from "react-toastify";

function* fetchAllUserRoleSaga({ payload: args }: PayloadAction<UserRoleAllRequest>): Generator<CallEffect | PutEffect, void, FetchAllUserRoleResponse> {
    try {
        const response = yield call(UserRoleAPI.fetchAllUserRoles, args);
        yield putResolve(fetchAllUserRoleSuccess(response))
        yield putResolve(fetchAllRestaurantRequest({}))
        yield putResolve(fetchAllTenantRequest({}))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchAllUserRoleFaliure(handleApiError(error)))
    }
}

function* fetchAllUsersByTenantSaga({ payload: args }: PayloadAction<UserRoleAllRequest>): Generator<CallEffect | PutEffect, void, FetchAllUserRoleResponse> {
    try {
        const response = yield call(UserRoleAPI.fetchAllUsersByTenant, args);
        yield putResolve(fetchAllUsersByTenantSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchAllUsersByTenantFaliure(handleApiError(error)))
    }
}

function* createUserRoleSaga({ payload: args }: PayloadAction<CreateUserRequest>): Generator<CallEffect | PutEffect, void, UserRoleResponse> {
    try {
        const response = yield call(UserRoleAPI.createUserRole, args);
        toast.success(`${args.name} user added successfully!`)
        yield putResolve(createUserRoleSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(createUserRoleFaliure(handleApiError(error)))
    }
}

function* updateUserRoleSaga({ payload: args }: PayloadAction<CreateUserRequest>): Generator<CallEffect | PutEffect, void, AllUserRoleResponse> {
    try {
        const response = yield call(UserRoleAPI.updateUserRole, args);
        toast.success(`${args.name} user updated successfully!`)
        yield putResolve(updateUserRoleSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(updateRestaurantsFaliure(handleApiError(error)))
    }
}

function* resetUserPasswordSaga({ payload: args }: PayloadAction<{ tenantId: string, userId: string }>): Generator<CallEffect | PutEffect, void> {
    try {
        yield call(UserRoleAPI.resetPassword, args.tenantId, args.userId);
        yield putResolve(resetUserPasswordSuccess())
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(resetUserPasswordFaliure(handleApiError(error)))
    }
}

export function* watchUserFoleSaga() {
    yield takeLatest(fetchAllUserRoleRequest.type, fetchAllUserRoleSaga)
    yield takeLatest(fetchAllUsersByTenantRequest.type, fetchAllUsersByTenantSaga)
    yield takeLatest(createUserRoleRequest.type, createUserRoleSaga)
    yield takeLatest(updateUserRoleRequest.type, updateUserRoleSaga)
    yield takeLatest(resetUserPasswordRequest.type, resetUserPasswordSaga)
}
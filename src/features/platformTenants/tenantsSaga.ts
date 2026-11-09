import { call, CallEffect, put, PutEffect, putResolve, takeLatest } from "redux-saga/effects";
import { CreateTenantRequest, Tenant, TenantMinimalList, TenantsAllRequest, TenantsResponse } from "./types";
import TenantsAPI from "./tenantsAPI";
import { createTenantFaliure, createTenantRequest, createTenantSuccess, deleteTenantFaliure, deleteTenantRequest, deleteTenantSuccess, fetchAllTenantFaliure, fetchAllTenantRequest, fetchAllTenantSuccess, updateTenantFaliure, updateTenantRequest, updateTenantSuccess, fetchTenantMinimalListFaliure, fetchTenantMinimalListSuccess, fetchTenantMinimalListRequest } from "./tenantsSlice";
import { PayloadAction } from "@reduxjs/toolkit";
import { handleApiError } from "../../api/handleApiError";
import { toast } from "react-toastify";
import { TenantType } from "../../utils/constants";
import { RestaurantRequestResponse } from "../platformStores/types";
import { createRestaurantsRequest } from "../platformStores/storesSlice";

function* fetchAllTenantsSaga({ payload: arg }: PayloadAction<TenantsAllRequest>): Generator<CallEffect | PutEffect, void, TenantsResponse> {
    try {
        const response = yield call(TenantsAPI.fetchAllTenants, arg)
        yield putResolve(fetchAllTenantSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchAllTenantFaliure(handleApiError(error)))
    }
}

function* createTenantsSaga({ payload: arg }: PayloadAction<{ tenant: CreateTenantRequest, restaurant?: RestaurantRequestResponse }>): Generator<CallEffect | PutEffect, void, any> {
    try {
        const response = yield call(TenantsAPI.createTenant, arg.tenant);
        toast.success("Tenant added successfully!")
        yield putResolve(createTenantSuccess(response))
        if (arg.restaurant && arg.tenant.type === TenantType.STORE) {
            const restaurantWithTenantRequest = {
                ...arg.restaurant,
                tenantId: response.id,
            };
            yield put(createRestaurantsRequest(restaurantWithTenantRequest));
        }
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(createTenantFaliure(handleApiError(error)))
    }
}

function* updateTenantsSaga({ payload: arg }: PayloadAction<CreateTenantRequest>): Generator<CallEffect | PutEffect, void, Tenant> {
    try {
        const response = yield call(TenantsAPI.updateTenant, arg);
        toast.success(`${arg.name} tenant update successfully!`)
        yield putResolve(updateTenantSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(updateTenantFaliure(handleApiError(error)))
    }
}

function* deleteTenantsSaga({ payload: arg }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, string> {
    try {
        yield call(TenantsAPI.deleteTenant, arg);
        toast.success(`${arg} tenant deleted successfully!`)
        yield putResolve(deleteTenantSuccess(arg))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(deleteTenantFaliure(handleApiError(error)))
    }
}


function* fetchTenantMinimalListSaga({ payload: tenantName }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, TenantMinimalList[]> {
    try {
        const response = yield call(TenantsAPI.fetchTenantMinimalList, tenantName);
        yield putResolve(fetchTenantMinimalListSuccess(response));
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchTenantMinimalListFaliure(handleApiError(error)));
    }
}

export function* watchTenantsSaga() {
    yield takeLatest(fetchAllTenantRequest.type, fetchAllTenantsSaga)
    yield takeLatest(createTenantRequest.type, createTenantsSaga)
    yield takeLatest(updateTenantRequest.type, updateTenantsSaga)
    yield takeLatest(deleteTenantRequest.type, deleteTenantsSaga)
    yield takeLatest(fetchTenantMinimalListRequest.type, fetchTenantMinimalListSaga)
}
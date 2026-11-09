import { call, CallEffect, put, PutEffect, putResolve, takeLatest } from "redux-saga/effects";
import { createRestaurantsFaliure, createRestaurantsRequest, createRestaurantsSuccess, deleteRestaurantsFaliure, deleteRestaurantsRequest, deleteRestaurantsSuccess, fetchAllRestaurantFaliure, fetchAllRestaurantRequest, fetchAllRestaurantsByTenantFaliure, fetchAllRestaurantsByTenantRequest, fetchAllRestaurantsByTenantSuccess, fetchAllRestaurantSuccess, fetchRestaurantByIdFaliure, fetchRestaurantByIdRequest, fetchRestaurantByIdSuccess, reactivateRestaurantsFaliure, reactivateRestaurantsRequest, reactivateRestaurantsSuccess, updateRestaurantsFaliure, updateRestaurantsRequest, updateRestaurantsSuccess, uploadRestaurantImageFaliure, uploadRestaurantImageRequest, uploadRestaurantImageSuccess } from "./storesSlice";
import { PayloadAction } from "@reduxjs/toolkit";
import RestaurantsAPI from "./storesAPI";
import { RestaurantRequestResponse, RestaurantAllRequest, RestaurantResponse, RestaurantAllRequestByTenant, Data, Restaurant } from "./types";
import { handleApiError } from "../../api/handleApiError";
import { fetchAllTenantRequest } from "../platformTenants/tenantsSlice";
import { toast } from "react-toastify";
import { base64ToFile } from "../../utils";
import { UploadMenuItemImageResponse } from "../platformMenuItems/types";

function* fetchAllRestaurantSage({ payload: arg }: PayloadAction<RestaurantAllRequest>): Generator<CallEffect | PutEffect, void, RestaurantResponse> {
    try {
        const response = yield call(RestaurantsAPI.fetchAllRestaurants, arg)
        yield putResolve(fetchAllRestaurantSuccess(response.data))
        if (Number(arg.page) <= 1) {
            yield putResolve(fetchAllTenantRequest({}))
        }
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchAllRestaurantFaliure(handleApiError(error)))
    }
}

function* fetchRestaurantByIdSage({ payload: arg }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, { data: Restaurant }> {
    try {
        const response = yield call(RestaurantsAPI.fetchRestaurantById, arg)
        yield putResolve(fetchRestaurantByIdSuccess(response.data))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchRestaurantByIdFaliure(handleApiError(error)))
    }
}

function* fetchAllRestaurantsByTenantSage({ payload: arg }: PayloadAction<RestaurantAllRequestByTenant>): Generator<CallEffect | PutEffect, void, Data> {
    try {
        const response = yield call(RestaurantsAPI.fetchAllRestaurantsByTenant, arg)
        yield putResolve(fetchAllRestaurantsByTenantSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchAllRestaurantsByTenantFaliure(handleApiError(error)))
    }
}

function* createRestaurantsSage({ payload: args }: PayloadAction<RestaurantRequestResponse>): Generator<CallEffect | PutEffect, void, { message: string, data: Restaurant }> {
    try {
        const response = yield call(RestaurantsAPI.createRestaurants, args)
        toast.success('New store added successfully!')
        yield putResolve(createRestaurantsSuccess(response.data))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(createRestaurantsFaliure(handleApiError(error)))
    }
}

function* updateRestaurantsSage({ payload: args }: PayloadAction<RestaurantRequestResponse>): Generator<CallEffect | PutEffect, void, { message: string, data: Restaurant }> {
    try {
        const response = yield call(RestaurantsAPI.updateRestaurants, args)
        toast.success(`${args.name} updated successfully!`)
        yield putResolve(updateRestaurantsSuccess(response.data))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(updateRestaurantsFaliure(handleApiError(error)))
    }
}

function* deleteRestaurantsSage({ payload: args }: PayloadAction<RestaurantRequestResponse>): Generator<CallEffect | PutEffect, void, string> {
    try {
        yield call(RestaurantsAPI.deleteRestaurants, args)
        toast.success(`${args.name} deleted successfully!`)
        yield putResolve(deleteRestaurantsSuccess(args.id!))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(deleteRestaurantsFaliure(handleApiError(error)))
    }
}

function* uploadRestaurantImageSaga({ payload: args }: PayloadAction<{ image: string }>): Generator<CallEffect | PutEffect, void, UploadMenuItemImageResponse> {
    try {
        const file = base64ToFile(args.image, "image.jpg");
        const response = yield call(RestaurantsAPI.uploadImage, file);
        yield putResolve(uploadRestaurantImageSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(uploadRestaurantImageFaliure(handleApiError(error)))
    }
}



function* reactivateRestaurantsSaga({ payload: args }: PayloadAction<{ tenantId: string, restaurantId: string }>): Generator<CallEffect | PutEffect, void, { data: Restaurant }> {
    try {
        const response = yield call(RestaurantsAPI.reactivateRestaurant, args.tenantId, args.restaurantId)
        toast.success('Restaurant reactivated successfully!')
        yield putResolve(reactivateRestaurantsSuccess(response.data))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(reactivateRestaurantsFaliure(handleApiError(error)))
    }
}





export function* watchRestaurantSaga() {
    yield takeLatest(fetchAllRestaurantRequest.type, fetchAllRestaurantSage)
    yield takeLatest(fetchRestaurantByIdRequest.type, fetchRestaurantByIdSage)
    yield takeLatest(fetchAllRestaurantsByTenantRequest.type, fetchAllRestaurantsByTenantSage)
    yield takeLatest(createRestaurantsRequest.type, createRestaurantsSage)
    yield takeLatest(updateRestaurantsRequest.type, updateRestaurantsSage)
    yield takeLatest(deleteRestaurantsRequest.type, deleteRestaurantsSage)
    yield takeLatest(uploadRestaurantImageRequest.type, uploadRestaurantImageSaga)
    yield takeLatest(reactivateRestaurantsRequest.type, reactivateRestaurantsSaga)
}
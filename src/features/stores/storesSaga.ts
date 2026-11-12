import { call, CallEffect, put, PutEffect, putResolve, takeLatest } from "redux-saga/effects";
import { fetchAllRestaurantsByTenantFaliure, fetchAllRestaurantsByTenantRequest, fetchAllRestaurantsByTenantSuccess, fetchRestaurantsByIdFaliure, fetchRestaurantsByIdRequest, fetchRestaurantsByIdSuccess, updateRestaurantsFaliure, updateRestaurantsRequest, updateRestaurantsSuccess, updateWaiterConfirmationFaliure, updateWaiterConfirmationRequest, updateWaiterConfirmationSuccess, uploadRestaurantLogoFaliure, uploadRestaurantLogoRequest, uploadRestaurantLogoSuccess, uploadRestaurantBannerFaliure, uploadRestaurantBannerRequest, uploadRestaurantBannerSuccess } from "./storesSlice";
import { PayloadAction } from "@reduxjs/toolkit";
import RestaurantsAPI from "./storesAPI";
import { Restaurant, RestaurantAllRequestByTenant, RestaurantRequestResponse, AllRestaurantResponse, RestaurantResponse } from "./types";
import { handleApiError } from "../../api/handleApiError";
import { toast } from "react-toastify";
import { base64ToFile } from "../../utils";

function* fetchRestaurantsByIdSage({ payload: arg }: PayloadAction<RestaurantAllRequestByTenant>): Generator<CallEffect | PutEffect, void, RestaurantResponse> {
    try {
        const response = yield call(RestaurantsAPI.fetchRestaurantsById, arg)
        yield putResolve(fetchRestaurantsByIdSuccess(response.data))
    } catch (error) {
        yield put(fetchRestaurantsByIdFaliure(handleApiError(error)))
    }
}

function* fetchAllRestaurantsByTenantSage({ payload: arg }: PayloadAction<RestaurantAllRequestByTenant>): Generator<CallEffect | PutEffect, void, AllRestaurantResponse> {
    try {
        const response = yield call(RestaurantsAPI.fetchAllRestaurantsByTenant, arg)
        // The axios client already unwraps the body, so the list is `data` (older callers expected `data.data`).
        const body = response as unknown as { data?: Restaurant[] | { data?: Restaurant[] } };
        const list = Array.isArray(body?.data) ? body.data : body?.data?.data ?? [];
        yield putResolve(fetchAllRestaurantsByTenantSuccess(list))
    } catch (error) {
        yield put(fetchAllRestaurantsByTenantFaliure(handleApiError(error)))
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

function* uploadRestaurantLogoSaga({ payload: args }: PayloadAction<{ restaurantId: string, image: string }>): Generator<CallEffect | PutEffect, void, { url: string }> {
    try {
        const file = base64ToFile(args.image, "logo.jpg");
        const response = yield call(RestaurantsAPI.uploadLogo, args.restaurantId, file);
        yield putResolve(uploadRestaurantLogoSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(uploadRestaurantLogoFaliure(handleApiError(error)))
    }
}

function* uploadRestaurantBannerSaga({ payload: args }: PayloadAction<{ restaurantId: string, image: string }>): Generator<CallEffect | PutEffect, void, { url: string }> {
    try {
        const file = base64ToFile(args.image, "banner.jpg");
        const response = yield call(RestaurantsAPI.uploadBanner, args.restaurantId, file);
        yield putResolve(uploadRestaurantBannerSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(uploadRestaurantBannerFaliure(handleApiError(error)))
    }
}

function* uploadWaiterConfirmationSaga({ payload: args }: PayloadAction<{ restaurantId: string, enable: boolean }>): Generator<CallEffect | PutEffect, void, any> {
    try {
        const response = yield call(RestaurantsAPI.updateWaiterConfirmation, args.restaurantId, args.enable);
        yield putResolve(updateWaiterConfirmationSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(updateWaiterConfirmationFaliure(handleApiError(error)))
    }
}

export function* watchRestaurantSaga() {
    yield takeLatest(fetchRestaurantsByIdRequest.type, fetchRestaurantsByIdSage)
    yield takeLatest(fetchAllRestaurantsByTenantRequest.type, fetchAllRestaurantsByTenantSage)
    yield takeLatest(updateRestaurantsRequest.type, updateRestaurantsSage)
    yield takeLatest(uploadRestaurantLogoRequest.type, uploadRestaurantLogoSaga)
    yield takeLatest(uploadRestaurantBannerRequest.type, uploadRestaurantBannerSaga)
    yield takeLatest(updateWaiterConfirmationRequest.type, uploadWaiterConfirmationSaga)
}
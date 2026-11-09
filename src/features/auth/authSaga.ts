import { call, CallEffect, put, PutEffect, takeLatest } from "redux-saga/effects";
import authAPI from "./authAPI";
import { PayloadAction } from "@reduxjs/toolkit";
import { loginFaliure, loginRequest, loginSuccess, logoutFaliure, logoutRequest, logoutSuccess } from "./authSilce";
import { tokenStorage } from "../../utils/token";
import { handleApiError } from "../../api/handleApiError";
import { AuthCredentials, AuthResponse, LogOutResponse } from "./types";
import { toast } from "react-toastify";

function* loginSaga(action: PayloadAction<AuthCredentials>): Generator<CallEffect | PutEffect, void, AuthResponse> {
    try {
        const response = yield call(authAPI.login, action.payload);
        tokenStorage.setTokens(response.accessToken, response.refreshToken)
        toast.success(`Welcome ${response.user?.name}!`)
        yield put(loginSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(loginFaliure(handleApiError(error)))
    }
}

function* logoutSaga(): Generator<CallEffect | PutEffect, void, LogOutResponse> {
    try {
        const response = yield call(authAPI.logout);
        yield put(logoutSuccess(response.message))
        toast.success(response.message)
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(logoutFaliure(handleApiError(error)))
    }
}

export function* watchAuthSaga() {
    yield takeLatest(loginRequest.type, loginSaga);
    yield takeLatest(logoutRequest.type, logoutSaga);
}
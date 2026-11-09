import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthCredentials, AuthInitialStateType, AuthResponse } from "./types";

const initalAuthState: AuthInitialStateType = {
    loading: false,
    error: null,
    user: null,
    logoutMessage: null
}

const authSlice = createSlice({
    name: "user/authSilce",
    initialState: initalAuthState,
    reducers: {
        loginRequest: (state, _: PayloadAction<AuthCredentials>) => {
            state.loading = true;
            state.user = null
            state.error = null;
        },
        loginSuccess: (state, action: PayloadAction<AuthResponse>) => {
            state.loading = false;
            state.user = action.payload.user!
        },
        loginFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload
        },
        logoutRequest: (state) => {
            state.loading = true;
            state.user = null;
            state.logoutMessage = null;
            state.error = null;
        },
        logoutSuccess: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.logoutMessage = action.payload;
        },
        logoutFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.logoutMessage = null;
            state.error = action.payload
        },
    },
})

export const {
    loginRequest,
    loginSuccess,
    loginFaliure,

    logoutRequest,
    logoutSuccess,
    logoutFaliure
} = authSlice.actions

export default authSlice.reducer;
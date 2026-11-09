import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AllUserRoleResponse, CreateUserRequest, FetchAllUserRoleResponse, InitialUserRoleType, UserRoleAllRequest, UserRoleResponse } from "./types";

const initalUserRoleState: InitialUserRoleType = {
    isCreateUserRole: false,
    isDeleteUserRole: false,
    isDeleteUser: false, // Added this line
    data: [],
    loading: false,
    error: null,
    total: 0,
    page: "1",
    limit: "10",
    totalPages: 0
}

const userRoleSlice = createSlice({
    name: "/userRoleSlice",
    initialState: initalUserRoleState,
    reducers: {
        resetUserRoles: (state) => {
            state.isCreateUserRole = false;
            state.isDeleteUserRole = false;
            state.isDeleteUser = false; // Added this line
            state.error = null; // Added this line
        },
        increaseLimit: (state, action: PayloadAction<string>) => {
            state.limit = action.payload
        },
        pagination: (state, action: PayloadAction<string>) => {
            state.page = action.payload;
        },

        /** Fetch All User Roles **/
        fetchAllUserRoleRequest: (state, _: PayloadAction<UserRoleAllRequest>) => {
            state.loading = true;
            state.isCreateUserRole = false;
            state.error = null;
        },
        fetchAllUserRoleSuccess: (state, action: PayloadAction<FetchAllUserRoleResponse>) => {
            const { limit, page, total, totalPages, data } = action.payload
            state.loading = false;
            state.data = data
            state.limit = limit;
            state.page = page
            state.total = total
            state.totalPages = totalPages
        },
        fetchAllUserRoleFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload
        },

        /** Fetch All User Roles By Tenant **/
        fetchAllUsersByTenantRequest: (state, _: PayloadAction<UserRoleAllRequest>) => {
            state.loading = true;
            state.isCreateUserRole = false;
            state.error = null;
        },
        fetchAllUsersByTenantSuccess: (state, action: PayloadAction<FetchAllUserRoleResponse>) => {
            const { limit, page, total, totalPages, data } = action.payload
            state.loading = false;
            state.data = data
            state.limit = limit;
            state.page = page
            state.total = total
            state.totalPages = totalPages
        },
        fetchAllUsersByTenantFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload
        },

        /** Create User Roles **/
        createUserRoleRequest: (state, _: PayloadAction<CreateUserRequest>) => {
            state.loading = true;
            state.isCreateUserRole = false;
            state.error = null;
        },
        createUserRoleSuccess: (state, action: PayloadAction<UserRoleResponse>) => {
            state.loading = false;
            state.isCreateUserRole = true;
            state.data = [action.payload, ...state.data];
        },
        createUserRoleFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isCreateUserRole = false;
            state.error = action.payload
        },

        /** Update User Roles **/
        updateUserRoleRequest: (state, _: PayloadAction<CreateUserRequest>) => {
            state.loading = true;
            state.isCreateUserRole = false;
            state.error = null;
        },
        updateUserRoleSuccess: (state, action: PayloadAction<AllUserRoleResponse>) => {
            state.loading = false;
            state.isCreateUserRole = true;
            state.data = state.data.map((user) =>
                user.id === action.payload.id ? action.payload : user);
        },
        updateUserRoleFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isCreateUserRole = false;
            state.error = action.payload
        },

        /** Reset User Password **/
        resetUserPasswordRequest: (state, _: PayloadAction<{ tenantId: string, userId: string, newPassword?: string }>) => {
            state.loading = true;
            state.isCreateUserRole = false;
            state.error = null;
        },
        resetUserPasswordSuccess: (state, _action?: PayloadAction<any>) => {
            state.loading = false;
        },
        resetUserPasswordFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isCreateUserRole = false;
            state.error = action.payload;
        },

        /** Delete User **/
        deleteUserRequest: (state, _: PayloadAction<{ tenantId: string, userId: string, restaurantId: string }>) => {
            state.loading = true;
            state.isDeleteUser = false;
            state.error = null;
        },
        deleteUserSuccess: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isDeleteUser = true;
            state.data = state.data.filter((user) => user.id !== action.payload);
        },
        deleteUserFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isDeleteUser = false;
            state.error = action.payload
        },
    }
});

export const {
    resetUserRoles,
    increaseLimit,
    pagination,

    fetchAllUserRoleRequest,
    fetchAllUserRoleSuccess,
    fetchAllUserRoleFaliure,

    fetchAllUsersByTenantRequest,
    fetchAllUsersByTenantSuccess,
    fetchAllUsersByTenantFaliure,

    createUserRoleRequest,
    createUserRoleSuccess,
    createUserRoleFaliure,

    updateUserRoleRequest,
    updateUserRoleSuccess,
    updateUserRoleFaliure,

    resetUserPasswordRequest,
    resetUserPasswordSuccess,
    resetUserPasswordFaliure,

    deleteUserRequest,
    deleteUserSuccess,
    deleteUserFaliure,
} = userRoleSlice.actions

export default userRoleSlice.reducer
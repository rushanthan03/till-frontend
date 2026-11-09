import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { InitialTenantsType, TenantResponseLight, TenantsResponse } from "./types";

const initalState: InitialTenantsType = {
    loading: false,
    tenants: [],
    error: null,
    isCreateTenant: false,
    isDeleteTenant: false
}

const TenantsSlice = createSlice({
    name: "/TenantsSlice",
    initialState: initalState,
    reducers: {
        fetchAllTenantRequest: (state) => {
            state.loading = true
            state.isCreateTenant = false;
            state.error = null
        },
        fetchAllTenantSuccess: (state, action: PayloadAction<TenantsResponse>) => {
            state.loading = false;
            state.tenants = action.payload.data
        },
        fetchAllTenantFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload
        },

        fetchTenantsIdNameRequest: (state) => {
            state.loading = true
            state.isCreateTenant = false;
            state.error = null
        },
        fetchTenantsIdNameSuccess: (state, action: PayloadAction<TenantResponseLight[]>) => {
            state.loading = false;
            state.tenants = action.payload
        },
        fetchTenantsIdNameFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload
        },
    }
})

export const {
    fetchAllTenantRequest,
    fetchAllTenantSuccess,
    fetchAllTenantFaliure,

    fetchTenantsIdNameRequest,
    fetchTenantsIdNameSuccess,
    fetchTenantsIdNameFaliure
} = TenantsSlice.actions;

export default TenantsSlice.reducer
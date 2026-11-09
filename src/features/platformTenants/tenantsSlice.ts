import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CreateTenantRequest, InitialTenantsType, Tenant, TenantMinimalList, TenantsAllRequest, TenantsResponse } from "./types";
import { TenantStatus } from "../../utils/constants";
import { RestaurantRequestResponse } from "../platformStores/types";

const initalState: InitialTenantsType = {
    loading: false,
    data: [],
    error: null,
    isCreateTenant: false,
    isDeleteTenant: false,
    total: 2,
    page: "1",
    limit: "10",
    totalPages: 0,
    tenantMinimalList: []
}

const TenantsSlice = createSlice({
    name: "/platformTenantsSlice",
    initialState: initalState,
    reducers: {
        increaseLimit: (state, action: PayloadAction<string>) => {
            state.limit = action.payload
        },
        pagination: (state, action: PayloadAction<string>) => {
            state.page = action.payload;
        },

        fetchAllTenantRequest: (state, _: PayloadAction<TenantsAllRequest>) => {
            state.loading = true
            state.isCreateTenant = false;
            state.data = [];
            state.error = null
        },
        fetchAllTenantSuccess: (state, action: PayloadAction<TenantsResponse>) => {
            const { limit, page, total, totalPages, data } = action.payload
            state.loading = false;
            state.data = data
            state.limit = limit;
            state.page = page
            state.total = total
            state.totalPages = totalPages
        },
        fetchAllTenantFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload
        },
        createTenantRequest: (state, _: PayloadAction<{ tenant: CreateTenantRequest, restaurant?: RestaurantRequestResponse }>) => {
            state.loading = true
            state.error = null
            state.isCreateTenant = false
        },
        createTenantSuccess: (state, action: PayloadAction<Tenant>) => {
            state.loading = false;
            state.data = [action.payload, ...state.data]
            state.isCreateTenant = true
        },
        createTenantFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false
            state.error = action.payload
            state.isCreateTenant = false
        },
        updateTenantRequest: (state, _: PayloadAction<CreateTenantRequest>) => {
            state.loading = true
            state.error = null
            state.isCreateTenant = false
        },
        updateTenantSuccess: (state, action: PayloadAction<Tenant>) => {
            state.loading = false;
            state.isCreateTenant = true
            state.data = state.data.map(tenant =>
                tenant.id === action.payload.id ? action.payload : tenant
            );
        },
        updateTenantFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false
            state.error = action.payload
            state.isCreateTenant = false
        },
        deleteTenantRequest: (state, _: PayloadAction<string>) => {
            state.loading = true
            state.error = null
            state.isDeleteTenant = false
        },
        deleteTenantSuccess: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isDeleteTenant = true
            const deleteTenent = state.data.find((tenant) => tenant.id === action.payload);
            if (deleteTenent) {
                deleteTenent.status = TenantStatus.INACTIVE;
                state.data = state.data.map(tenant =>
                    tenant.id === action.payload ? deleteTenent : tenant
                );
            }
        },
        deleteTenantFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false
            state.error = action.payload
            state.isDeleteTenant = false
        },
        /** Fetch Tenant Minimal List **/
        fetchTenantMinimalListRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },
        fetchTenantMinimalListSuccess: (state, action: PayloadAction<TenantMinimalList[]>) => {
            state.loading = false;
            state.tenantMinimalList = action.payload;
        },
        fetchTenantMinimalListFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
    }
})

export const {
    increaseLimit,
    pagination,


    fetchAllTenantRequest,
    fetchAllTenantSuccess,
    fetchAllTenantFaliure,

    createTenantRequest,
    createTenantSuccess,
    createTenantFaliure,

    updateTenantRequest,
    updateTenantSuccess,
    updateTenantFaliure,

    deleteTenantRequest,
    deleteTenantSuccess,
    deleteTenantFaliure,

    fetchTenantMinimalListRequest,
    fetchTenantMinimalListSuccess,
    fetchTenantMinimalListFaliure
} = TenantsSlice.actions;

export default TenantsSlice.reducer
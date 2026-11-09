import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RestaurantRequestResponse, InitialRestaurantType, Restaurant, RestaurantAllRequestByTenant } from "./types";

const initalRestaurantState: InitialRestaurantType = {
    isCreateRestaurant: false,
    isDeleteRestaurant: false,
    restaurant: null,
    restaurants: [],
    loading: false,
    imageLoading: false,
    error: null,
    uploadedLogoUrl: '',
    uploadedBannerUrl: ''
}

const restaurantSlice = createSlice({
    name: "/restaurantSlice",
    initialState: initalRestaurantState,
    reducers: {

        /** Fetch All Restaurant By Tenant **/
        fetchAllRestaurantsByTenantRequest: (state, _: PayloadAction<RestaurantAllRequestByTenant>) => {
            state.loading = true;
            state.error = null;
        },
        fetchAllRestaurantsByTenantSuccess: (state, action: PayloadAction<Restaurant[]>) => {
            state.loading = false;
            state.restaurants = action.payload
        },
        fetchAllRestaurantsByTenantFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        resetUploadedUrls: (state) => {
            state.uploadedLogoUrl = '';
            state.uploadedBannerUrl = '';
        },

        /** Fetch Restaurant By Id **/
        fetchRestaurantsByIdRequest: (state, _: PayloadAction<RestaurantAllRequestByTenant>) => {
            state.loading = true;
            state.error = null;
        },
        fetchRestaurantsByIdSuccess: (state, action: PayloadAction<Restaurant>) => {
            state.loading = false;
            state.restaurant = action.payload
        },
        fetchRestaurantsByIdFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /** Update Restaurant **/
        updateRestaurantsRequest: (state, _: PayloadAction<RestaurantRequestResponse>) => {
            state.loading = true
            state.isCreateRestaurant = false;
            state.error = null
        },
        updateRestaurantsSuccess: (state, action: PayloadAction<Restaurant>) => {
            state.loading = false
            state.isCreateRestaurant = true;
            state.restaurant = action.payload;
        },
        updateRestaurantsFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isCreateRestaurant = false;
            state.error = action.payload;
        },
        /** Upload Restaurant Logo **/
        uploadRestaurantLogoRequest: (state, _: PayloadAction<{ restaurantId: string, image: string }>) => {
            state.imageLoading = true;
            state.error = null;
        },
        uploadRestaurantLogoSuccess: (state, action: PayloadAction<{ url: string }>) => {
            state.imageLoading = false;
            state.uploadedLogoUrl = action.payload.url;
        },
        uploadRestaurantLogoFaliure: (state, action: PayloadAction<string>) => {
            state.imageLoading = false;
            state.error = action.payload;
        },
        /** Upload Restaurant Banner **/
        uploadRestaurantBannerRequest: (state, _: PayloadAction<{ restaurantId: string, image: string }>) => {
            state.imageLoading = true;
            state.error = null;
        },
        uploadRestaurantBannerSuccess: (state, action: PayloadAction<{ url: string }>) => {
            state.imageLoading = false;
            state.uploadedBannerUrl = action.payload.url;
        },
        uploadRestaurantBannerFaliure: (state, action: PayloadAction<string>) => {
            state.imageLoading = false;
            state.error = action.payload;
        },
        /** Update Waiter Confirmation **/
        updateWaiterConfirmationRequest: (state, _: PayloadAction<{ restaurantId: string, enable: boolean }>) => {
            state.loading = true
            state.error = null
        },
        updateWaiterConfirmationSuccess: (state, _: PayloadAction<any>) => {
            state.loading = false;
        },
        updateWaiterConfirmationFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
    }
});

export const {

    fetchAllRestaurantsByTenantRequest,
    fetchAllRestaurantsByTenantSuccess,
    fetchAllRestaurantsByTenantFaliure,

    fetchRestaurantsByIdRequest,
    fetchRestaurantsByIdSuccess,
    fetchRestaurantsByIdFaliure,

    updateRestaurantsRequest,
    updateRestaurantsSuccess,
    updateRestaurantsFaliure,

    uploadRestaurantLogoRequest,
    uploadRestaurantLogoSuccess,
    uploadRestaurantLogoFaliure,
    uploadRestaurantBannerRequest,
    uploadRestaurantBannerSuccess,
    uploadRestaurantBannerFaliure,

    updateWaiterConfirmationRequest,
    updateWaiterConfirmationSuccess,
    updateWaiterConfirmationFaliure,

    resetUploadedUrls
} = restaurantSlice.actions;

export default restaurantSlice.reducer;
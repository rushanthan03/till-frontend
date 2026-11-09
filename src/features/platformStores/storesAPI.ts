import axiosClient from "../../api/axiosClient";
import { RestaurantRequestResponse, RestaurantAllRequest, RestaurantResponse, RestaurantAllRequestByTenant, Data } from "./types";
import { UploadMenuItemImageResponse } from "../platformMenuItems/types";

const RestaurantsAPI = {
    fetchAllRestaurants: (args: RestaurantAllRequest) => axiosClient.get<RestaurantResponse>('/api/restaurants', { params: args }),
    fetchAllRestaurantsByTenant: (args: RestaurantAllRequestByTenant) => axiosClient.get<Data>(`/api/tenants/${args.tenantId}/outlets`, { params: { page: args.page, limit: args.limit } }),
    createRestaurants: (args: RestaurantRequestResponse) => {
        const { tenantId, ...rest } = args;
        return axiosClient.post(`/api/tenants/${tenantId}/outlets`, rest)
    },
    updateRestaurants: (args: RestaurantRequestResponse) => {
        const { tenantId, restaurantID, id, ...rest } = args;
        return axiosClient.patch(`/api/tenants/${tenantId}/outlets/${restaurantID}`, rest)
    },
    deleteRestaurants: (args: RestaurantRequestResponse) => axiosClient.delete(`/api/tenants/${args.tenantId}/outlets/${args.id}`),
    reactivateRestaurant: (tenantId: string, restaurantId: string) => axiosClient.post(`/api/tenants/${tenantId}/outlets/${restaurantId}/reactivate`),
    fetchRestaurantById: (restaurantId: string) => axiosClient.get(`/api/restaurants/${restaurantId}`),
    uploadImage: (file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        return axiosClient.post<UploadMenuItemImageResponse>('/api/upload/restaurant', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
}

export default RestaurantsAPI;

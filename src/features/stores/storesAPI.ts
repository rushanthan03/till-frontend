import axiosClient from "../../api/axiosClient";
import { Data, RestaurantAllRequestByTenant, RestaurantRequestResponse } from "./types";

const RestaurantsAPI = {
    fetchAllRestaurantsByTenant: (args: RestaurantAllRequestByTenant) => axiosClient.get<Data>(`/api/tenants/${args.tenantId}/outlets`),
    fetchRestaurantsById: (args: RestaurantAllRequestByTenant) => axiosClient.get<Data>(`/api/outlets/${args.restaurantId}`),
    updateRestaurants: (args: RestaurantRequestResponse) => {
        const { tenantId, restaurantID, banner, ...rest } = args;
        return axiosClient.patch<Data>(`/api/tenants/${tenantId}/outlets/${restaurantID}`, rest)
    },
    uploadLogo: (restaurantId: string, file: File) => {
        const formData = new FormData();
        formData.append('restaurantId', restaurantId);
        formData.append('image', file);
        return axiosClient.post<{ url: string }>('/api/upload/restaurant', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    uploadBanner: (restaurantId: string, file: File) => {
        const formData = new FormData();
        formData.append('restaurantId', restaurantId);
        formData.append('image', file);
        return axiosClient.post<{ url: string }>('/api/upload/restaurant', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    updateWaiterConfirmation: (restaurantId: string, enable: boolean) => axiosClient.patch(`/api/restaurants/${restaurantId}`, { requireWaiterConfirmation: enable }),
}

export default RestaurantsAPI;
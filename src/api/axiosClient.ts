import axios, { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { tokenStorage } from "../utils/token";
import { User } from "../features/auth/types";
import * as Sentry from "@sentry/react";

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void; }[] = [];

const axiosClient = axios.create({
    baseURL: apiBaseUrl,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    }
});

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

axiosClient.interceptors.request.use(
    (value: InternalAxiosRequestConfig<any>) => {
        const token = tokenStorage.getAccessToken();
        const userRaw = localStorage.getItem('currentUser');
        if (token) {
            value.headers.Authorization = `Bearer ${token}`;
        }
        if (userRaw) {
            const user = JSON.parse(userRaw) as User;
            value.headers.set("x-tenant-id", user.tenantId);

            // For SUPER_ADMIN and TENANT_ADMIN, token restaurantId is null.
            // Auto-append ?restaurantId from the selected outlet stored in localStorage ONLY if the endpoint URL does NOT already embed restaurantId in the path.
            const adminRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'super_admin', 'tenant_admin'];
            if (adminRoles.includes(user.role ?? '')) {
                const selectedRestaurantId = localStorage.getItem('selectedRestaurantId')
                    || user?.restaurantId
                    || user?.restaurant?.id;
                const urlHasRestaurantInPath = /\/restaurants\/[a-zA-Z0-9_-]{8,}/i.test(value.url || '');
                if (selectedRestaurantId && value.method !== 'post' && value.method !== 'patch' && value.method !== 'put' && !urlHasRestaurantInPath) {
                    // Append to GET/DELETE query params only; POST/PATCH bodies already include restaurantId
                    value.params = { restaurantId: selectedRestaurantId, ...value.params };
                }
            }
        }
        return value;
    },
    (error: any) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
    (response: AxiosResponse) => response.data,
    async (error: any) => {
        Sentry.captureException(error);
        const originalRequest = error.config;
        if (!error.response) {
            console.error("Network error:", error);
            return Promise.reject({ message: "Network Error. Please try again." });
        }
        const { status, data } = error.response;

        if (status === 401 && !(data?.path?.includes("login"))) {
            if (isRefreshing) {
                try {
                    const token = await new Promise(function (resolve, reject) {
                        failedQueue.push({ resolve, reject });
                    });
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return await axiosClient(originalRequest);
                } catch (err) {
                    return await Promise.reject(err);
                }
            }
            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = tokenStorage.getRefreshToken();
            if (!refreshToken) {
                window.location.href = "/login";
                return Promise.reject(error);
            }

            try {
                const response = await axios.post(`${apiBaseUrl}/api/auth/refresh`, { refreshToken });
                const { accessToken: access_token, refreshToken: refresh_token } = response.data;

                tokenStorage.setTokens(access_token, refresh_token)

                axiosClient.defaults.headers.Authorization = `Bearer ${access_token}`;
                processQueue(null, access_token);

                // Retry original request
                return axiosClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                tokenStorage.remove();
                window.location.href = "/login";
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        } else if (status === 403) {
            console.warn("Forbidden: insufficient permissions");
        } else if (status >= 500) {
            console.error("Server error:", error.response);
        }

        return Promise.reject(error.response?.data || error);
    }
)

export default axiosClient;
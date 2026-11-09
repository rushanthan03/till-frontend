import axiosClient from "../../api/axiosClient";
import { CreateSaleInput, Sale, SaleDetail, SalesSummary } from "./types";

export interface SaleListParams {
    receiptNumber?: string;
    shiftId?: string;
    cashier?: string;
    status?: Sale['status'];
    method?: 'cash' | 'card';
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
}

export interface SaleListResponse {
    data: Sale[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// axiosClient's response interceptor already unwraps `response.data`.
const unwrap = <T>(request: Promise<unknown>) => request as Promise<T>;

export const SalesAPI = {
    create: (restaurantId: string | undefined, body: CreateSaleInput) =>
        unwrap<Sale>(axiosClient.post('/api/sales', body, { params: { restaurantId } })),
    list: (restaurantId: string | undefined, params: SaleListParams = {}) =>
        unwrap<SaleListResponse>(axiosClient.get('/api/sales', { params: { restaurantId, ...params } })),
    get: (id: string, restaurantId?: string) =>
        unwrap<SaleDetail>(axiosClient.get(`/api/sales/${id}`, { params: { restaurantId } })),
    summary: (restaurantId: string | undefined, range: { from?: string; to?: string; shiftId?: string } = {}) =>
        unwrap<SalesSummary>(axiosClient.get('/api/sales/summary', { params: { restaurantId, ...range } })),
};

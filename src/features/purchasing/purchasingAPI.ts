import axiosClient from "../../api/axiosClient";
import type {
    PurchaseOrder, PurchaseOrderInput, PurchaseOrderListResponse, PurchaseOrderStatus, ReceiveInput, ReorderSuggestion, Supplier, SupplierInput,
} from "./types";

// axiosClient's response interceptor already unwraps `response.data`.
const unwrap = <T>(request: Promise<unknown>) => request as Promise<T>;

export const SuppliersAPI = {
    list: (storeId: string | undefined, params: { search?: string; status?: 'active' | 'inactive' | 'all' } = {}) =>
        unwrap<Supplier[]>(axiosClient.get('/api/suppliers', { params: { storeId, ...params } })),
    create: (storeId: string | undefined, body: SupplierInput) =>
        unwrap<Supplier>(axiosClient.post('/api/suppliers', body, { params: { storeId } })),
    update: (id: string, storeId: string | undefined, body: Partial<SupplierInput>) =>
        unwrap<Supplier>(axiosClient.patch(`/api/suppliers/${id}`, body, { params: { storeId } })),
};

export const PurchaseOrdersAPI = {
    list: (storeId: string | undefined, params: { status?: PurchaseOrderStatus; open?: boolean; supplierId?: string; search?: string; page?: number; limit?: number } = {}) =>
        unwrap<PurchaseOrderListResponse>(axiosClient.get('/api/purchase-orders', { params: { storeId, ...params, open: params.open ? 'true' : undefined } })),
    get: (id: string, storeId?: string) =>
        unwrap<PurchaseOrder>(axiosClient.get(`/api/purchase-orders/${id}`, { params: { storeId } })),
    suggestions: (storeId: string | undefined, supplierId?: string) =>
        unwrap<ReorderSuggestion[]>(axiosClient.get('/api/purchase-orders/suggestions', { params: { storeId, supplierId } })),
    create: (storeId: string | undefined, body: PurchaseOrderInput) =>
        unwrap<PurchaseOrder>(axiosClient.post('/api/purchase-orders', body, { params: { storeId } })),
    update: (id: string, storeId: string | undefined, body: Partial<PurchaseOrderInput>) =>
        unwrap<PurchaseOrder>(axiosClient.patch(`/api/purchase-orders/${id}`, body, { params: { storeId } })),
    submit: (id: string, storeId?: string) =>
        unwrap<PurchaseOrder>(axiosClient.post(`/api/purchase-orders/${id}/submit`, null, { params: { storeId } })),
    cancel: (id: string, storeId?: string) =>
        unwrap<PurchaseOrder>(axiosClient.post(`/api/purchase-orders/${id}/cancel`, null, { params: { storeId } })),
    receive: (id: string, storeId: string | undefined, body: ReceiveInput) =>
        unwrap<{ units: number; cost: number; status: PurchaseOrderStatus; order: PurchaseOrder }>(axiosClient.post(`/api/purchase-orders/${id}/receive`, body, { params: { storeId } })),
};

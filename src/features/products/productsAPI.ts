import axiosClient from "../../api/axiosClient";
import { DepartmentCount, Product, ProductInput, ProductListParams, ProductListResponse } from "./types";

// axiosClient's response interceptor already unwraps `response.data`, so the
// promises resolve to the payload itself. `unwrap` fixes the typing to match.
const unwrap = <T>(request: Promise<unknown>) => request as Promise<T>;

// Products are scoped to a store (restaurantId). Store users are scoped by their
// token; admins pass restaurantId explicitly.
export const ProductsAPI = {
    list: (params: ProductListParams) =>
        unwrap<ProductListResponse>(axiosClient.get('/api/products', { params: { ...params, lowStock: params.lowStock ? 'true' : undefined } })),
    departments: (restaurantId?: string) =>
        unwrap<DepartmentCount[]>(axiosClient.get('/api/products/departments', { params: { restaurantId } })),
    byBarcode: (barcode: string, restaurantId?: string) =>
        unwrap<Product>(axiosClient.get(`/api/products/barcode/${encodeURIComponent(barcode)}`, { params: { restaurantId } })),
    create: (restaurantId: string | undefined, body: ProductInput) =>
        unwrap<Product>(axiosClient.post('/api/products', body, { params: { restaurantId } })),
    update: (id: string, restaurantId: string | undefined, body: Partial<ProductInput>) =>
        unwrap<Product>(axiosClient.patch(`/api/products/${id}`, body, { params: { restaurantId } })),
    archive: (id: string, restaurantId?: string) =>
        unwrap<Product>(axiosClient.delete(`/api/products/${id}`, { params: { restaurantId } })),
    seedDemo: (restaurantId?: string) =>
        unwrap<{ created: number; skipped: number }>(axiosClient.post('/api/products/seed-demo', null, { params: { restaurantId } })),
};

import axiosClient from "../../api/axiosClient";
import { DepartmentCount, ImportResult, Product, ProductInput, ProductListParams, ProductListResponse } from "./types";

// axiosClient's response interceptor already unwraps `response.data`, so the
// promises resolve to the payload itself. `unwrap` fixes the typing to match.
const unwrap = <T>(request: Promise<unknown>) => request as Promise<T>;

// Products are scoped to a store (storeId). Store users are scoped by their
// token; admins pass storeId explicitly.
export const ProductsAPI = {
    list: (params: ProductListParams) =>
        unwrap<ProductListResponse>(axiosClient.get('/api/products', { params: { ...params, lowStock: params.lowStock ? 'true' : undefined } })),
    departments: (storeId?: string) =>
        unwrap<DepartmentCount[]>(axiosClient.get('/api/products/departments', { params: { storeId } })),
    byBarcode: (barcode: string, storeId?: string) =>
        unwrap<Product>(axiosClient.get(`/api/products/barcode/${encodeURIComponent(barcode)}`, { params: { storeId } })),
    create: (storeId: string | undefined, body: ProductInput) =>
        unwrap<Product>(axiosClient.post('/api/products', body, { params: { storeId } })),
    update: (id: string, storeId: string | undefined, body: Partial<ProductInput>) =>
        unwrap<Product>(axiosClient.patch(`/api/products/${id}`, body, { params: { storeId } })),
    archive: (id: string, storeId?: string) =>
        unwrap<Product>(axiosClient.delete(`/api/products/${id}`, { params: { storeId } })),
    exportAll: (storeId?: string) =>
        unwrap<Product[]>(axiosClient.get('/api/products/export', { params: { storeId } })),
    importRows: (storeId: string | undefined, rows: Record<string, string>[], dryRun: boolean) =>
        unwrap<ImportResult>(axiosClient.post('/api/products/import', { rows, dryRun }, { params: { storeId }, timeout: 120000 })),
    seedDemo: (storeId?: string) =>
        unwrap<{ created: number; skipped: number }>(axiosClient.post('/api/products/seed-demo', null, { params: { storeId } })),
};

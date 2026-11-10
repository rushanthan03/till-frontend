import axiosClient from "../../api/axiosClient";

// axiosClient's response interceptor already unwraps `response.data`.
const unwrap = <T>(request: Promise<unknown>) => request as Promise<T>;

export interface Range { from?: string; to?: string }

export interface VatReport {
    rows: { rate: number; grossSales: number; refunds: number; grossNet: number; vat: number; netExVat: number }[];
    totals: { grossSales: number; refunds: number; grossNet: number; vat: number; netExVat: number };
}
export interface TenderReport {
    rows: { method: 'cash' | 'card'; payments: number; sales: number; refunds: number; net: number }[];
    totals: { sales: number; refunds: number; net: number };
}
export interface DepartmentReport {
    rows: { department: string; quantity: number; gross: number; refunds: number; net: number; discounts: number; share: number }[];
    totals: { quantity: number; gross: number; refunds: number; net: number; discounts: number };
}
export interface ProductReport {
    sort: string;
    productsSold: number;
    rows: { productId: string; name: string; barcode: string; department: string; quantity: number; revenue: number; margin: number | null; marginPct: number | null }[];
}

export const ReportsAPI = {
    vat: (storeId: string | undefined, r: Range) => unwrap<VatReport>(axiosClient.get('/api/reports/vat', { params: { storeId, ...r } })),
    tender: (storeId: string | undefined, r: Range) => unwrap<TenderReport>(axiosClient.get('/api/reports/tender', { params: { storeId, ...r } })),
    departments: (storeId: string | undefined, r: Range) => unwrap<DepartmentReport>(axiosClient.get('/api/reports/departments', { params: { storeId, ...r } })),
    products: (storeId: string | undefined, r: Range, sort: 'revenue' | 'quantity' | 'margin', limit = 20) =>
        unwrap<ProductReport>(axiosClient.get('/api/reports/products', { params: { storeId, ...r, sort, limit } })),
};

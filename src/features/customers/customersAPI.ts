import axiosClient from "../../api/axiosClient";

export interface Customer {
    id: string;
    cardNumber: string;
    name: string;
    phone: string | null;
    email: string | null;
    marketingConsent: boolean;
    pointsBalance: number;
    totalSpend: number;
    visitCount: number;
    lastVisitAt: string | null;
    isActive: boolean;
    createdAt: string;
}

export interface CustomerDetail extends Customer {
    recentSales: { id: string; receiptNumber: string; total: number; pointsEarned: number; status: string; createdAt: string }[];
}

export interface CustomerInput {
    name: string;
    phone?: string;
    email?: string;
    marketingConsent?: boolean;
}

// axiosClient's response interceptor already unwraps `response.data`.
const unwrap = <T>(request: Promise<unknown>) => request as Promise<T>;

export const CustomersAPI = {
    list: (storeId: string | undefined, params: { search?: string; page?: number; limit?: number } = {}) =>
        unwrap<{ data: Customer[]; total: number; page: number; limit: number; totalPages: number }>(axiosClient.get('/api/customers', { params: { storeId, ...params } })),
    get: (id: string, storeId?: string) => unwrap<CustomerDetail>(axiosClient.get(`/api/customers/${id}`, { params: { storeId } })),
    create: (storeId: string | undefined, body: CustomerInput) => unwrap<Customer>(axiosClient.post('/api/customers', body, { params: { storeId } })),
    update: (id: string, storeId: string | undefined, body: Partial<CustomerInput> & { isActive?: boolean }) =>
        unwrap<Customer>(axiosClient.patch(`/api/customers/${id}`, body, { params: { storeId } })),
};

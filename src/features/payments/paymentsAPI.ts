import axiosClient from "../../api/axiosClient";

export interface ChargeResult {
    status: 'approved' | 'declined';
    reference: string;
    amount: number;
    scheme: string | null;
    last4: string | null;
    message: string | null;
}

// axiosClient's response interceptor already unwraps `response.data`.
export const PaymentsAPI = {
    status: (storeId?: string) =>
        axiosClient.get('/api/payments/terminal/status', { params: { storeId } }) as unknown as Promise<{ provider: string; ready: boolean }>,
    /** Takes a card payment. The same clientRef never charges twice, so a retry after a dropped connection is safe. */
    charge: (storeId: string | undefined, body: { amount: number; clientRef: string; simulate?: 'decline' }) =>
        axiosClient.post('/api/payments/terminal/charge', body, { params: { storeId }, timeout: 70000 }) as unknown as Promise<ChargeResult>,
};

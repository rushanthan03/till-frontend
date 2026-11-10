import axiosClient from "../../api/axiosClient";

export interface Approval {
    approvalToken: string;
    approver: { id: string; name: string };
    expiresInSeconds: number;
}

// axiosClient's response interceptor already unwraps `response.data`.
export const ApprovalsAPI = {
    verify: (storeId: string | undefined, pin: string) =>
        axiosClient.post('/api/approvals/verify', { pin }, { params: { storeId } }) as unknown as Promise<Approval>,
    setPin: (pin: string) =>
        axiosClient.post('/api/approvals/pin', { pin }) as unknown as Promise<{ message: string }>,
};

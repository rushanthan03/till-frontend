import axiosClient from "../../api/axiosClient";
import { Promotion, PromotionInput } from "./types";

// axiosClient's response interceptor already unwraps `response.data`.
const unwrap = <T>(request: Promise<unknown>) => request as Promise<T>;

export const PromotionsAPI = {
    list: (storeId?: string) => unwrap<Promotion[]>(axiosClient.get('/api/promotions', { params: { storeId } })),
    current: (storeId?: string) => unwrap<Promotion[]>(axiosClient.get('/api/promotions', { params: { storeId, current: 'true' } })),
    create: (storeId: string | undefined, body: PromotionInput) =>
        unwrap<Promotion>(axiosClient.post('/api/promotions', body, { params: { storeId } })),
    update: (id: string, storeId: string | undefined, body: Partial<PromotionInput>) =>
        unwrap<Promotion>(axiosClient.patch(`/api/promotions/${id}`, body, { params: { storeId } })),
};

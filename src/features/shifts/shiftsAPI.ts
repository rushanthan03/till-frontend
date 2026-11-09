import axiosClient from "../../api/axiosClient";
import { CountResult, Shift, ShiftDetail, ShiftListParams, ShiftListResponse, ShiftsSummary, XReport } from "./types";

// axiosClient's response interceptor already unwraps `response.data`.
const unwrap = <T>(request: Promise<unknown>) => request as Promise<T>;

export const ShiftsAPI = {
    // Nest answers a `null` result with an empty body, which arrives here as ''. Normalise it to null.
    current: async (restaurantId?: string): Promise<Shift | null> => {
        const res = await unwrap<Shift | '' | null>(axiosClient.get('/api/shifts/current', { params: { restaurantId } }));
        return res && typeof res === 'object' ? res : null;
    },
    open: (restaurantId: string | undefined, body: { openingFloat: number; note?: string }) =>
        unwrap<Shift>(axiosClient.post('/api/shifts/open', body, { params: { restaurantId } })),
    xReport: (restaurantId?: string) =>
        unwrap<XReport>(axiosClient.get('/api/shifts/current/x-report', { params: { restaurantId } })),
    count: (restaurantId: string | undefined, countedCash: number) =>
        unwrap<CountResult>(axiosClient.post('/api/shifts/current/count', { countedCash }, { params: { restaurantId } })),
    close: (restaurantId: string | undefined, body: { countedCash: number; note?: string }) =>
        unwrap<Shift>(axiosClient.post('/api/shifts/current/close', body, { params: { restaurantId } })),
    // ---- history (managers and above) ----
    list: (restaurantId: string | undefined, params: ShiftListParams = {}) =>
        unwrap<ShiftListResponse>(axiosClient.get('/api/shifts', { params: { restaurantId, ...params, differenceOnly: params.differenceOnly || undefined } })),
    summary: (restaurantId: string | undefined, params: Omit<ShiftListParams, 'page' | 'limit'> = {}) =>
        unwrap<ShiftsSummary>(axiosClient.get('/api/shifts/summary', { params: { restaurantId, ...params, differenceOnly: params.differenceOnly || undefined } })),
    detail: (id: string, restaurantId?: string) =>
        unwrap<ShiftDetail>(axiosClient.get(`/api/shifts/${id}`, { params: { restaurantId } })),
};

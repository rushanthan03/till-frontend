import axiosClient from "../../api/axiosClient";
import { CashMovement, CashMovementInput, DayReport, CountResult, Shift, ShiftDetail, ShiftListParams, ShiftListResponse, ShiftsSummary, XReport } from "./types";

// axiosClient's response interceptor already unwraps `response.data`.
const unwrap = <T>(request: Promise<unknown>) => request as Promise<T>;

export const ShiftsAPI = {
    // Nest answers a `null` result with an empty body, which arrives here as ''. Normalise it to null.
    current: async (storeId?: string): Promise<Shift | null> => {
        const res = await unwrap<Shift | '' | null>(axiosClient.get('/api/shifts/current', { params: { storeId } }));
        return res && typeof res === 'object' ? res : null;
    },
    open: (storeId: string | undefined, body: { openingFloat: number; note?: string }) =>
        unwrap<Shift>(axiosClient.post('/api/shifts/open', body, { params: { storeId } })),
    addMovement: (storeId: string | undefined, body: CashMovementInput) =>
        unwrap<CashMovement>(axiosClient.post('/api/shifts/current/movements', body, { params: { storeId } })),
    movements: (storeId: string | undefined, shiftId: string) =>
        unwrap<CashMovement[]>(axiosClient.get(`/api/shifts/${shiftId}/movements`, { params: { storeId } })),
    dayReport: (storeId: string | undefined, date?: string) =>
        unwrap<DayReport>(axiosClient.get('/api/shifts/day-report', { params: { storeId, date } })),
    xReport: (storeId?: string) =>
        unwrap<XReport>(axiosClient.get('/api/shifts/current/x-report', { params: { storeId } })),
    count: (storeId: string | undefined, countedCash: number) =>
        unwrap<CountResult>(axiosClient.post('/api/shifts/current/count', { countedCash }, { params: { storeId } })),
    close: (storeId: string | undefined, body: { countedCash: number; note?: string }) =>
        unwrap<Shift>(axiosClient.post('/api/shifts/current/close', body, { params: { storeId } })),
    // ---- history (managers and above) ----
    list: (storeId: string | undefined, params: ShiftListParams = {}) =>
        unwrap<ShiftListResponse>(axiosClient.get('/api/shifts', { params: { storeId, ...params, differenceOnly: params.differenceOnly || undefined } })),
    summary: (storeId: string | undefined, params: Omit<ShiftListParams, 'page' | 'limit'> = {}) =>
        unwrap<ShiftsSummary>(axiosClient.get('/api/shifts/summary', { params: { storeId, ...params, differenceOnly: params.differenceOnly || undefined } })),
    detail: (id: string, storeId?: string) =>
        unwrap<ShiftDetail>(axiosClient.get(`/api/shifts/${id}`, { params: { storeId } })),
};

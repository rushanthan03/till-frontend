import axiosClient from "../../api/axiosClient";
import { AdjustInput, MovementListParams, MovementListResponse, ReceiptInput, StocktakeResult, StockSummary } from "./types";

// axiosClient's response interceptor already unwraps `response.data`.
const unwrap = <T>(request: Promise<unknown>) => request as Promise<T>;

export const StockAPI = {
    summary: (storeId?: string) => unwrap<StockSummary>(axiosClient.get('/api/stock/summary', { params: { storeId } })),
    movements: (storeId: string | undefined, params: MovementListParams = {}) =>
        unwrap<MovementListResponse>(axiosClient.get('/api/stock/movements', { params: { storeId, ...params } })),
    receive: (storeId: string | undefined, body: ReceiptInput) =>
        unwrap<{ reference: string; lines: number; units: number; cost: number }>(axiosClient.post('/api/stock/receipts', body, { params: { storeId } })),
    adjust: (storeId: string | undefined, body: AdjustInput) =>
        unwrap<{ name: string; change: number; stockQuantity: number }>(axiosClient.post('/api/stock/adjustments', body, { params: { storeId } })),
    stocktake: (storeId: string | undefined, body: { name?: string; lines: { productId: string; counted: number }[] }) =>
        unwrap<StocktakeResult>(axiosClient.post('/api/stock/stocktakes', body, { params: { storeId } })),
};

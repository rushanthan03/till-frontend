import axiosClient from "../../api/axiosClient";
import { CreateRefundInput, Refund } from "./types";

const unwrap = <T>(request: Promise<unknown>) => request as Promise<T>;

export const RefundsAPI = {
    create: (storeId: string | undefined, body: CreateRefundInput) =>
        unwrap<Refund>(axiosClient.post('/api/refunds', body, { params: { storeId } })),
};

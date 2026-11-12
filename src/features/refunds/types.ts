export type RefundReason = 'faulty' | 'damaged' | 'wrong_item' | 'changed_mind' | 'price_error' | 'other';
export type RefundDisposition = 'restock' | 'waste' | 'damaged';

export interface RefundItemInput {
    saleItemId: string;
    quantity: number;
    disposition: RefundDisposition;
}

export interface RefundPaymentInput {
    method: 'cash' | 'card';
    amount: number;
    reference?: string;
}

export interface CreateRefundInput {
    approvalToken?: string;
    saleId: string;
    items: RefundItemInput[];
    reason: RefundReason;
    note?: string;
    payments: RefundPaymentInput[];
}

export interface Refund {
    id: string;
    refundNumber: string;
    originalReceiptNumber: string;
    reason: RefundReason;
    note: string | null;
    total: number;
    vatTotal: number;
    /** Loyalty points given back (the goods were partly paid for with points). */
    pointsReturned?: number;
    processedByName: string | null;
    approvedByName?: string | null;
    createdAt: string;
    items: { id: string; name: string; quantity: number; lineTotal: number; vatAmount: number; disposition: RefundDisposition }[];
    payments: { id: string; method: 'cash' | 'card'; amount: number; reference: string | null }[];
}

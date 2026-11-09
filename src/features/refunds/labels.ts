import type { RefundDisposition, RefundReason } from './types';

export const REASON_LABELS: Record<RefundReason, string> = {
    faulty: 'Faulty product',
    damaged: 'Damaged',
    wrong_item: 'Wrong item',
    changed_mind: 'Customer changed mind',
    price_error: 'Price error',
    other: 'Other',
};

export const DISPOSITION_LABELS: Record<RefundDisposition, string> = {
    restock: 'Returned to stock',
    waste: 'Waste',
    damaged: 'Damaged / supplier return',
};

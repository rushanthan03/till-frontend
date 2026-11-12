import type { Refund } from '../refunds/types';

export type SalePaymentMethod = 'cash' | 'card';

export interface SaleItem {
    id: string;
    productId: string | null;
    name: string;
    barcode: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    lineTotal: number;
    vatAmount: number;
    ageRestriction: number;
    promoDiscount: number;
    promotionName: string | null;
    /** This line's share of loyalty points spent (already out of lineTotal). */
    pointsDiscount?: number;
    originalUnitPrice: number | null;
    adjustmentReason: string | null;
    refundedQuantity: number;
    refundedAmount: number;
    refundedVat: number;
}

export interface SalePayment {
    id: string;
    method: SalePaymentMethod;
    amount: number;
    tendered: number | null;
    reference: string | null;
}

export interface Sale {
    id: string;
    storeId: string;
    receiptNumber: string;
    cashierName: string | null;
    status: 'completed' | 'partially_refunded' | 'refunded' | 'voided';
    refundedTotal: number;
    total: number;
    netTotal: number;
    vatTotal: number;
    changeDue: number;
    itemCount: number;
    discountTotal: number;
    customerId?: string | null;
    customerName: string | null;
    pointsEarned: number;
    /** Loyalty points spent on the sale and what they took off. */
    pointsRedeemed?: number;
    pointsDiscount?: number;
    approvedByName: string | null;
    ageVerified: boolean;
    items: SaleItem[];
    payments: SalePayment[];
    createdAt: string;
}

export interface SaleDetail extends Sale {
    refunds: Refund[];
}

export interface PaymentInput {
    method: SalePaymentMethod;
    /** Amount applied to the bill */
    amount: number;
    /** Cash handed over (cash only) */
    tendered?: number;
    /** Card authorisation reference */
    reference?: string;
}

export interface CreateSaleInput {
    items: { productId: string; quantity: number; discountPercent?: number; priceOverride?: number; reason?: string }[];
    payments: PaymentInput[];
    ageVerified?: boolean;
    /** From the manager PIN check; needed when a cashier applies a discount or override. */
    approvalToken?: string;
    customerId?: string;
}

/** Totals for a period; same definitions as the X report (net = gross - refunds). */
export interface SalesSummary {
    from: string;
    to: string;
    transactions: number;
    refundCount: number;
    grossSales: number;
    refundsTotal: number;
    netSales: number;
    vat: number;
    cashSales: number;
    cardSales: number;
    cashRefunds: number;
    cardRefunds: number;
}

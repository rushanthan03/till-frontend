export interface Shift {
    id: string;
    restaurantId: string;
    userId: string;
    cashierName: string;
    status: 'open' | 'closed';
    openedAt: string;
    closedAt: string | null;
    openingFloat: number;
    openingNote: string | null;
    countedCash: number | null;
    expectedCash: number | null;
    variance: number | null;
    closeNote: string | null;
    transactionCount: number | null;
    refundCount: number | null;
    grossSales: number | null;
    vatTotal: number | null;
    cashSales: number | null;
    cardSales: number | null;
    refundsTotal: number | null;
    cashRefunds: number | null;
    cardRefunds: number | null;
}

/** Running totals for an open shift (X report). */
export interface XReport {
    shift: Shift;
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
    expectedCash: number;
    varianceNoteThreshold: number;
}

export interface CountResult {
    countedCash: number;
    expectedCash: number;
    variance: number;
    requiresNote: boolean;
}

/** One session's figures: live if it is open, the saved Z report if it is closed. */
export type ShiftDetail = XReport;

export interface ShiftListParams {
    status?: 'open' | 'closed';
    cashier?: string;
    from?: string;
    to?: string;
    /** Only closed sessions whose cash count did not match */
    differenceOnly?: boolean;
    page?: number;
    limit?: number;
}

export interface ShiftListResponse {
    data: Shift[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ShiftsSummary {
    sessions: number;
    openSessions: number;
    closedSessions: number;
    /** Net sales (gross - refunds) of closed sessions */
    netSales: number;
    /** Sum of all closed sessions' differences (negative = short overall) */
    netDifference: number;
    shortCount: number;
    overCount: number;
    balancedCount: number;
    shortTotal: number;
    overTotal: number;
}

export type PromotionType = 'percent_off' | 'multibuy' | 'buy_get_free';
export type PromotionScope = 'product' | 'department';

export interface Promotion {
    id: string;
    name: string;
    type: PromotionType;
    scope: PromotionScope;
    productId: string | null;
    department: string | null;
    percentOff: number | null;
    buyQty: number | null;
    /** Buy-get-free: how many more are free once buyQty are bought. */
    freeQty?: number | null;
    bundlePrice: number | null;
    startsAt: string | null;
    endsAt: string | null;
    isActive: boolean;
    createdAt: string;
}

export interface PromotionInput {
    name: string;
    type: PromotionType;
    scope: PromotionScope;
    productId?: string;
    department?: string;
    percentOff?: number;
    buyQty?: number;
    freeQty?: number;
    bundlePrice?: number;
    /** null clears the date when editing. */
    startsAt?: string | null;
    endsAt?: string | null;
    isActive?: boolean;
}

/** The deal in words, e.g. "20% off", "3 for £5.00", "Buy 2 get 1 free". */
export function describeDeal(p: Pick<Promotion, 'type' | 'percentOff' | 'buyQty' | 'bundlePrice' | 'freeQty'>): string {
    if (p.type === 'percent_off') return `${Number(p.percentOff)}% off`;
    if (p.type === 'multibuy') return `${p.buyQty} for £${Number(p.bundlePrice).toFixed(2)}`;
    return `Buy ${p.buyQty} get ${p.freeQty} free`;
}

export type PromotionType = 'percent_off' | 'multibuy';
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
    bundlePrice?: number;
    startsAt?: string;
    endsAt?: string;
    isActive?: boolean;
}

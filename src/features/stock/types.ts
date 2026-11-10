export type StockMovementType =
    | 'opening' | 'goods_receipt' | 'adjustment' | 'waste' | 'damaged' | 'expired' | 'stocktake' | 'sale' | 'refund_restock';

export const MOVEMENT_LABELS: Record<StockMovementType, string> = {
    opening: 'Opening stock',
    goods_receipt: 'Goods received',
    adjustment: 'Adjustment',
    waste: 'Waste',
    damaged: 'Damaged',
    expired: 'Expired',
    stocktake: 'Stocktake',
    sale: 'Sale',
    refund_restock: 'Refund restock',
};

export interface StockMovement {
    id: string;
    productId: string;
    type: StockMovementType;
    quantity: number;
    quantityAfter: number;
    unitCost: number | null;
    reason: string | null;
    reference: string | null;
    supplier: string | null;
    userName: string | null;
    createdAt: string;
    product?: { name: string; barcode: string };
}

export interface StockSummary {
    products: number;
    outOfStock: number;
    negativeStock: number;
    lowStock: number;
    costValue: number;
    retailValue: number;
    writtenOff30Days: number;
}

export interface MovementListParams {
    type?: StockMovementType;
    search?: string;
    productId?: string;
    page?: number;
    limit?: number;
}

export interface MovementListResponse {
    data: StockMovement[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ReceiptInput {
    supplier?: string;
    reference?: string;
    lines: { productId: string; quantity: number; costPrice?: number }[];
}

export interface AdjustInput {
    productId: string;
    type: 'adjustment' | 'waste' | 'damaged' | 'expired';
    quantity: number;
    reason: string;
}

export interface StocktakeResult {
    reference: string;
    counted: number;
    changed: number;
    unitsShort: number;
    unitsOver: number;
    valueVariance: number;
    lines: { productId: string; name: string; barcode: string; system: number; counted: number; variance: number; value: number }[];
}

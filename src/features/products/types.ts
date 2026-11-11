export type ProductUnitType = 'each' | 'weight';

/** An extra barcode, e.g. a multipack or case: one scan adds packQuantity units. */
export interface ProductBarcode {
    barcode: string;
    packQuantity: number;
    label: string | null;
}

export interface Product {
    id: string;
    storeId: string;
    name: string;
    barcode: string;
    sku: string | null;
    department: string;
    category: string | null;
    brand: string | null;
    unitType: ProductUnitType;
    /** Shelf price including VAT (per kg for weighed items) */
    price: number;
    costPrice: number | null;
    vatRate: number;
    ageRestriction: number;
    stockQuantity: number;
    reorderLevel: number;
    imageUrl: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    barcodes?: ProductBarcode[];
    /** Usual supplier, used for reorder suggestions. */
    supplierId?: string | null;
    /** Set on barcode lookups: units one scan of that barcode adds. */
    scanQuantity?: number;
    scanLabel?: string | null;
}

export type ProductInput = Partial<
    Pick<Product, 'sku' | 'category' | 'brand' | 'unitType' | 'costPrice' | 'vatRate' | 'ageRestriction' | 'stockQuantity' | 'reorderLevel' | 'imageUrl' | 'isActive' | 'supplierId'>
> & Pick<Product, 'name' | 'barcode' | 'department' | 'price'> & { barcodes?: { barcode: string; packQuantity: number; label?: string }[] };

export type ImportAction = 'create' | 'update' | 'unchanged' | 'error';
export interface ImportRowResult {
    line: number;
    barcode: string;
    name: string | null;
    action: ImportAction;
    changes: string[];
    errors: string[];
    warnings: string[];
}
export interface ImportResult {
    dryRun: boolean;
    summary: Record<ImportAction, number>;
    rows: ImportRowResult[];
}

export interface ProductListParams {
    storeId?: string;
    search?: string;
    department?: string;
    status?: 'active' | 'inactive' | 'all';
    lowStock?: boolean;
    page?: number;
    limit?: number;
}

export interface ProductListResponse {
    data: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface DepartmentCount {
    department: string;
    count: number;
}

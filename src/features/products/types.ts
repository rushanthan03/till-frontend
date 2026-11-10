export type ProductUnitType = 'each' | 'weight';

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
}

export type ProductInput = Partial<
    Pick<Product, 'sku' | 'category' | 'brand' | 'unitType' | 'costPrice' | 'vatRate' | 'ageRestriction' | 'stockQuantity' | 'reorderLevel' | 'imageUrl' | 'isActive'>
> & Pick<Product, 'name' | 'barcode' | 'department' | 'price'>;

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

export interface Supplier {
    id: string;
    tenantId: string;
    name: string;
    contactName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    accountNumber: string | null;
    leadTimeDays: number | null;
    notes: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    /** Active products in this store with this as their usual supplier. */
    productCount?: number;
    /** Orders in this store still to arrive. */
    openOrders?: number;
}

export type SupplierInput = Partial<Pick<Supplier, 'contactName' | 'email' | 'phone' | 'address' | 'accountNumber' | 'leadTimeDays' | 'notes' | 'isActive'>> & { name: string };

export type PurchaseOrderStatus = 'draft' | 'ordered' | 'partial' | 'received' | 'cancelled';

export interface PurchaseOrderLine {
    id: string;
    productId: string;
    productName: string;
    barcode: string;
    quantity: number;
    unitCost: number;
    receivedQuantity: number;
    sortOrder: number;
    /** Only on a single order: */
    outstanding?: number;
    stockQuantity?: number | null;
    unitType?: 'each' | 'weight';
}

export interface PurchaseOrder {
    id: string;
    storeId: string;
    supplierId: string;
    supplier: Pick<Supplier, 'id' | 'name'> & Partial<Supplier>;
    number: string;
    status: PurchaseOrderStatus;
    expectedDate: string | null;
    notes: string | null;
    totalCost: number;
    receivedCost: number;
    createdByName: string | null;
    orderedAt: string | null;
    closedAt: string | null;
    createdAt: string;
    updatedAt: string;
    lineCount?: number;
    lines?: PurchaseOrderLine[];
}

export interface PurchaseOrderListResponse {
    data: PurchaseOrder[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PoLineInput {
    productId: string;
    quantity: number;
    unitCost?: number;
}

export interface PurchaseOrderInput {
    supplierId: string;
    expectedDate?: string;
    notes?: string;
    lines: PoLineInput[];
    submit?: boolean;
}

export interface ReorderSuggestion {
    productId: string;
    name: string;
    barcode: string;
    department: string;
    supplierId: string | null;
    stockQuantity: number;
    reorderLevel: number;
    onOrder: number;
    unitCost: number;
    unitType: 'each' | 'weight';
    suggested: number;
}

export interface ReceiveInput {
    deliveryNote?: string;
    updateCostPrices?: boolean;
    lines: { lineId: string; quantity: number; unitCost?: number }[];
}

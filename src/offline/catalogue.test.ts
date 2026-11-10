import 'fake-indexeddb/auto';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { Product } from '../features/products/types';

const product = (id: string, name: string, barcode: string, department: string, o: Partial<Product> = {}): Product => ({
    id, storeId: 's1', name, barcode, sku: null, department, category: null, brand: null, unitType: 'each', price: 1, costPrice: null, vatRate: 0,
    ageRestriction: 0, stockQuantity: 5, reorderLevel: 1, imageUrl: null, isActive: true, createdAt: '', updatedAt: '', ...o,
});
const catalogue = [
    product('1', 'Whole Milk 2L', '5000000000011', 'Dairy'),
    product('2', 'Semi Skimmed Milk 1L', '5000000000028', 'Dairy', { sku: 'MLK-1' }),
    product('3', 'White Loaf', '5000000000035', 'Bakery'),
];

vi.mock('../features/products/productsAPI', () => ({
    ProductsAPI: { list: vi.fn(async ({ page }: { page: number }) => ({ data: page === 1 ? catalogue.slice(0, 2) : catalogue.slice(2), total: 3, page, limit: 2, totalPages: 2 })) },
}));
vi.mock('../features/promotions/promotionsAPI', () => ({ PromotionsAPI: { current: vi.fn(async () => [{ id: 'x', name: 'Offer' }]) } }));

import { cachedBarcode, cachedDepartment, cachedDepartments, cachedPromos, cachedSearch, syncCatalogue } from './catalogue';

describe('offline catalogue', () => {
    beforeAll(async () => { await syncCatalogue('s1', true); });

    it('downloads every page of products', async () => {
        expect(await cachedSearch('s1', '', 10)).toHaveLength(3);
    });
    it('finds products by barcode or SKU, ignoring case', async () => {
        expect((await cachedBarcode('s1', '5000000000011'))?.name).toBe('Whole Milk 2L');
        expect((await cachedBarcode('s1', 'mlk-1'))?.id).toBe('2');
        expect(await cachedBarcode('s1', '0000')).toBeNull();
    });
    it('searches by name', async () => {
        expect((await cachedSearch('s1', 'milk', 10)).map(p => p.id)).toEqual(['1', '2']);
    });
    it('lists departments with counts and products in one department', async () => {
        expect(await cachedDepartments('s1')).toEqual([{ department: 'Bakery', count: 1 }, { department: 'Dairy', count: 2 }]);
        expect(await cachedDepartment('s1', 'Dairy', 10)).toHaveLength(2);
    });
    it('keeps the running offers', async () => {
        expect((await cachedPromos('s1'))[0].name).toBe('Offer');
    });
    it('does not mix up stores', async () => {
        expect(await cachedSearch('other', '', 10)).toHaveLength(0);
    });
    it('does not download again within ten minutes unless forced', async () => {
        expect(await syncCatalogue('s1')).toBeNull();
        expect(await syncCatalogue('s1', true)).toBe(3);
    });
});

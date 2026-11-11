import { describe, expect, it } from 'vitest';
import { allocateDiscount, maxRedeemable, pointsValue, totalsWithPoints } from './loyalty';
import type { Product } from '../features/products/types';

const product = (id: string, price: number, vatRate: number): Product => ({
    id, storeId: 's', name: id, barcode: id, sku: null, department: 'D', category: null, brand: null, unitType: 'each', price, costPrice: null, vatRate,
    ageRestriction: 0, stockQuantity: 10, reorderLevel: 0, imageUrl: null, isActive: true, createdAt: '', updatedAt: '',
});

describe('loyalty on the till', () => {
    it('values points and caps what can be spent at the bill', () => {
        expect(pointsValue(250)).toBe(2.5);
        expect(maxRedeemable(5000, 12.34)).toBe(1234);
        expect(maxRedeemable(300, 12.34)).toBe(300);
    });

    it('matches the server split of the discount', () => {
        expect(allocateDiscount([6, 3, 1], 1)).toEqual([0.6, 0.3, 0.1]);
    });

    it('takes points off the total and recalculates VAT on what is paid', () => {
        // £12 at 20% VAT (VAT £2.00) + £3 at 0%: spend 300 points = £3
        const t = totalsWithPoints([{ product: product('a', 12, 20), quantity: 1 }, { product: product('b', 3, 0), quantity: 1 }], [], 300);
        expect(t.pointsDiscount).toBe(3);
        expect(t.toPay).toBe(12);
        expect(t.vatTotal).toBe(1.6); // £9.60 left on the 20% line
    });

    it('never takes more than the bill', () => {
        const t = totalsWithPoints([{ product: product('a', 2, 20), quantity: 1 }], [], 900);
        expect(t.toPay).toBe(0);
        expect(t.pointsDiscount).toBe(2);
    });
});

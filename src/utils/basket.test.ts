import { describe, expect, it } from 'vitest';
import { BasketLine, addToBasket, basketTotals, hasAdjustments, lineAmounts, promoFor, unitPriceOf } from './basket';
import type { Product } from '../features/products/types';
import type { Promotion } from '../features/promotions/types';

const product = (o: Partial<Product> = {}): Product => ({
    id: 'p1', storeId: 's', name: 'Croissants', barcode: '1', sku: null, department: 'Bakery', category: null, brand: null, unitType: 'each',
    price: 2, costPrice: 1, vatRate: 20, ageRestriction: 0, stockQuantity: 10, reorderLevel: 2, imageUrl: null, isActive: true, createdAt: '', updatedAt: '', ...o,
});
const promo = (o: Partial<Promotion> = {}): Promotion => ({
    id: 'x', name: 'Offer', type: 'percent_off', scope: 'product', productId: 'p1', department: null, percentOff: 10, buyQty: null, bundlePrice: null,
    startsAt: null, endsAt: null, isActive: true, createdAt: '', ...o,
});
const line = (qty: number, o: Partial<BasketLine> = {}, p: Partial<Product> = {}): BasketLine => ({ product: product(p), quantity: qty, ...o });

describe('basket totals', () => {
    it('extracts VAT from VAT-inclusive prices', () => {
        const t = basketTotals([line(1, {}, { price: 1.2 })]);
        expect(t).toMatchObject({ total: 1.2, vatTotal: 0.2, netTotal: 1 });
    });
    it('counts a weighed line as one item', () => {
        expect(basketTotals([line(0.755, {}, { unitType: 'weight', price: 2.4, vatRate: 0 })]).itemCount).toBe(1);
    });
    it('adds up lines with different VAT rates', () => {
        const t = basketTotals([line(3, {}, { price: 1.35 }), line(2, {}, { id: 'p2', price: 1.65, vatRate: 0 })]);
        expect(t.total).toBe(7.35);
        expect(t.netTotal + t.vatTotal).toBeCloseTo(7.35, 2);
    });
});

describe('manual discounts', () => {
    it('percent discounts round to pence, per unit like the server', () => {
        expect(unitPriceOf(line(1, { adjustment: { kind: 'percent', value: 10, reason: 'x' } }, { price: 1.9 }))).toBe(1.71);
    });
    it('price overrides replace the shelf price', () => {
        expect(unitPriceOf(line(1, { adjustment: { kind: 'price', value: 0.99, reason: 'x' } }))).toBe(0.99);
    });
    it('reports the total discount and flags adjusted baskets', () => {
        const lines = [line(2, { adjustment: { kind: 'percent', value: 50, reason: 'x' } }, { price: 2, vatRate: 0 })];
        expect(basketTotals(lines).discountTotal).toBe(2);
        expect(hasAdjustments(lines)).toBe(true);
        expect(hasAdjustments([line(1)])).toBe(false);
    });
    it('does not merge a new scan into a discounted line', () => {
        const lines = [line(1, { adjustment: { kind: 'percent', value: 10, reason: 'x' } })];
        expect(addToBasket(lines, product(), 1)).toHaveLength(2);
        expect(addToBasket([line(1)], product(), 2)[0].quantity).toBe(3);
    });
});

describe('promotions', () => {
    it('applies percent off to the whole line', () => {
        expect(lineAmounts(line(3), [promo({ percentOff: 25 })])).toMatchObject({ lineTotal: 4.5, promoDiscount: 1.5, promoName: 'Offer' });
    });
    it('multibuy takes whole bundles only', () => {
        const m = promo({ type: 'multibuy', buyQty: 3, bundlePrice: 5, percentOff: null });
        expect(promoFor(line(4, {}, { price: 2 }), [m])?.discount).toBe(1);
        expect(promoFor(line(2, {}, { price: 2 }), [m])).toBeNull();
        expect(promoFor(line(7, {}, { price: 2 }), [m])?.discount).toBe(2);
    });
    it('buy X get Y free gives the free items in every full group', () => {
        const b = promo({ type: 'buy_get_free', buyQty: 2, freeQty: 1, percentOff: null });
        expect(promoFor(line(2, {}, { price: 1.5 }), [b])).toBeNull();
        expect(lineAmounts(line(3, {}, { price: 1.5 }), [b])).toMatchObject({ lineTotal: 3, promoDiscount: 1.5 });
        expect(promoFor(line(6, {}, { price: 1.5 }), [b])?.discount).toBe(3);
        expect(promoFor(line(2.5, {}, { price: 1.5 }), [promo({ type: 'buy_get_free', buyQty: 1, freeQty: 1, percentOff: null })])).toBeNull();
    });
    it('picks the best single offer and ignores other products', () => {
        const best = promoFor(line(1), [promo({ id: 'a', percentOff: 10 }), promo({ id: 'b', percentOff: 30 }), promo({ id: 'c', productId: 'other', percentOff: 90 })]);
        expect(best?.promo.id).toBe('b');
    });
    it('department offers match by department', () => {
        const d = promo({ scope: 'department', productId: null, department: 'Bakery', percentOff: 20 });
        expect(promoFor(line(1), [d])).not.toBeNull();
        expect(promoFor(line(1, {}, { department: 'Dairy' }), [d])).toBeNull();
    });
    it('hand-discounted lines get no offer on top', () => {
        expect(promoFor(line(1, { adjustment: { kind: 'percent', value: 5, reason: 'x' } }), [promo()])).toBeNull();
    });
    it('totals include offers', () => {
        const t = basketTotals([line(3, {}, { vatRate: 0 })], [promo({ type: 'multibuy', buyQty: 3, bundlePrice: 5, percentOff: null })]);
        expect(t.total).toBe(5);
        expect(t.discountTotal).toBe(1);
    });
});

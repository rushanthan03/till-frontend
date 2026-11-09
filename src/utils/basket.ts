import type { Product } from '../features/products/types';

// Mirrors the backend's sale-calculations.ts. The server recalculates everything
// when a sale is saved; these figures are for the live display only.

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;
export const round3 = (n: number): number => Math.round((n + Number.EPSILON) * 1000) / 1000;

export interface BasketLine {
    product: Product;
    quantity: number;
}

export interface LineAmounts {
    lineTotal: number;
    netAmount: number;
    vatAmount: number;
}

export function calcLine(unitPrice: number, quantity: number, vatRate: number): LineAmounts {
    const lineTotal = round2(unitPrice * quantity);
    const netAmount = round2(lineTotal / (1 + vatRate / 100));
    return { lineTotal, netAmount, vatAmount: round2(lineTotal - netAmount) };
}

export function basketTotals(lines: BasketLine[]) {
    const amounts = lines.map(l => calcLine(l.product.price, l.quantity, l.product.vatRate));
    const total = round2(amounts.reduce((a, l) => a + l.lineTotal, 0));
    const vatTotal = round2(amounts.reduce((a, l) => a + l.vatAmount, 0));
    const itemCount = lines.reduce((n, l) => n + (l.product.unitType === 'weight' ? 1 : l.quantity), 0);
    return { total, vatTotal, netTotal: round2(total - vatTotal), itemCount };
}

/** Adds a product, merging with an existing line of the same product. */
export function addToBasket(lines: BasketLine[], product: Product, quantity: number): BasketLine[] {
    const i = lines.findIndex(l => l.product.id === product.id);
    if (i === -1) return [...lines, { product, quantity: round3(quantity) }];
    return lines.map((l, idx) => (idx === i ? { ...l, quantity: round3(l.quantity + quantity) } : l));
}

export const needsAgeCheck = (lines: BasketLine[]) => lines.some(l => l.product.ageRestriction > 0);
export const highestAge = (lines: BasketLine[]) => lines.reduce((m, l) => Math.max(m, l.product.ageRestriction), 0);

import type { Product } from '../features/products/types';
import type { Promotion } from '../features/promotions/types';

// Mirrors the backend's sale-calculations.ts. The server recalculates everything
// when a sale is saved; these figures are for the live display only.

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;
export const round3 = (n: number): number => Math.round((n + Number.EPSILON) * 1000) / 1000;

/** A manager-approved price change on one line: a percentage off, or a replacement unit price. */
export interface LineAdjustment {
    kind: 'percent' | 'price';
    value: number;
    reason: string;
}

export interface BasketLine {
    product: Product;
    quantity: number;
    adjustment?: LineAdjustment;
}

/** Unit price after any discount/override (what the server will charge). */
export function unitPriceOf(l: BasketLine): number {
    const a = l.adjustment;
    if (!a) return l.product.price;
    return a.kind === 'percent' ? round2(l.product.price * (1 - a.value / 100)) : round2(a.value);
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

/** Best running offer for a line (offers never stack). Hand-discounted lines get no offer. Mirrors the backend. */
export function promoFor(l: BasketLine, promos: Promotion[]): { promo: Promotion; discount: number } | null {
    if (l.adjustment) return null;
    const unit = l.product.price;
    let best: { promo: Promotion; discount: number } | null = null;
    for (const p of promos) {
        const applies = p.scope === 'product' ? p.productId === l.product.id : !!p.department && p.department === l.product.department;
        if (!applies) continue;
        let d = 0;
        if (p.type === 'percent_off') d = round2((unit * l.quantity * (p.percentOff ?? 0)) / 100);
        else if (p.type === 'buy_get_free') {
            const buy = p.buyQty ?? 0, free = p.freeQty ?? 0;
            if (buy >= 1 && free >= 1 && Number.isInteger(l.quantity)) d = round2(Math.floor(l.quantity / (buy + free)) * free * unit);
        } else if (p.buyQty && p.buyQty >= 2 && p.bundlePrice !== null && Number.isInteger(l.quantity)) {
            d = Math.max(0, round2(Math.floor(l.quantity / p.buyQty) * (unit * p.buyQty - p.bundlePrice)));
        }
        if (d > 0 && (!best || d > best.discount)) best = { promo: p, discount: d };
    }
    return best;
}

/** Line figures after any offer. */
export function lineAmounts(l: BasketLine, promos: Promotion[] = []): LineAmounts & { promoDiscount: number; promoName: string | null } {
    const unit = unitPriceOf(l);
    const hit = promoFor(l, promos);
    const lineTotal = round2(round2(unit * l.quantity) - (hit?.discount ?? 0));
    const netAmount = round2(lineTotal / (1 + l.product.vatRate / 100));
    return { lineTotal, netAmount, vatAmount: round2(lineTotal - netAmount), promoDiscount: hit?.discount ?? 0, promoName: hit?.promo.name ?? null };
}

export function basketTotals(lines: BasketLine[], promos: Promotion[] = []) {
    const amounts = lines.map(l => lineAmounts(l, promos));
    const total = round2(amounts.reduce((a, l) => a + l.lineTotal, 0));
    const vatTotal = round2(amounts.reduce((a, l) => a + l.vatAmount, 0));
    const itemCount = lines.reduce((n, l) => n + (l.product.unitType === 'weight' ? 1 : l.quantity), 0);
    const shelfTotal = round2(lines.reduce((a, l) => a + calcLine(l.product.price, l.quantity, l.product.vatRate).lineTotal, 0));
    return { total, vatTotal, netTotal: round2(total - vatTotal), itemCount, discountTotal: round2(shelfTotal - total) };
}

export const hasAdjustments = (lines: BasketLine[]) => lines.some(l => !!l.adjustment);

/** Adds a product, merging with an existing full-price line of the same product (discounted lines stay separate). */
export function addToBasket(lines: BasketLine[], product: Product, quantity: number): BasketLine[] {
    const i = lines.findIndex(l => l.product.id === product.id && !l.adjustment);
    if (i === -1) return [...lines, { product, quantity: round3(quantity) }];
    return lines.map((l, idx) => (idx === i ? { ...l, quantity: round3(l.quantity + quantity) } : l));
}

export const needsAgeCheck = (lines: BasketLine[]) => lines.some(l => l.product.ageRestriction > 0);
export const highestAge = (lines: BasketLine[]) => lines.reduce((m, l) => Math.max(m, l.product.ageRestriction), 0);

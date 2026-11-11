import { BasketLine, basketTotals, lineAmounts, round2 } from './basket';
import type { Promotion } from '../features/promotions/types';

// Mirrors the backend's customers/loyalty.ts. The server checks and recalculates everything.
export const POINTS_PER_POUND = 100;
export const MIN_REDEEM_POINTS = 100;

export const pointsValue = (points: number) => round2(points / POINTS_PER_POUND);

/** Most points that can go on this bill: the balance, capped at the bill's value. */
export const maxRedeemable = (balance: number, total: number) => Math.max(0, Math.min(balance, Math.floor(round2(total) * POINTS_PER_POUND + 1e-6)));

/** Shares a points discount across lines in proportion to their totals, to the penny (same as the server). */
export function allocateDiscount(lineTotals: number[], value: number): number[] {
    const total = round2(lineTotals.reduce((a, t) => a + t, 0));
    if (value <= 0 || total <= 0) return lineTotals.map(() => 0);
    if (value >= total) return lineTotals.map(t => round2(t));
    const shares = lineTotals.map(t => Math.min(t, round2((value * t) / total)));
    let left = round2(value - shares.reduce((a, s) => a + s, 0));
    const order = lineTotals.map((_, i) => i).sort((a, b) => lineTotals[b] - lineTotals[a]);
    for (let guard = 0; Math.abs(left) >= 0.005 && guard < 10000; guard++) {
        const step = left > 0 ? 0.01 : -0.01;
        const i = order[guard % order.length];
        const next = round2(shares[i] + step);
        if (next < 0 || next > lineTotals[i]) continue;
        shares[i] = next;
        left = round2(left - step);
    }
    return shares;
}

/** Basket totals after spending points: VAT is worked out on what is left of each line. */
export function totalsWithPoints(lines: BasketLine[], promos: Promotion[], points: number) {
    const base = basketTotals(lines, promos);
    const value = Math.min(pointsValue(points), base.total);
    if (!(value > 0)) return { ...base, pointsDiscount: 0, toPay: base.total };
    const amounts = lines.map(l => lineAmounts(l, promos));
    const shares = allocateDiscount(amounts.map(a => a.lineTotal), value);
    let total = 0;
    let vatTotal = 0;
    amounts.forEach((a, i) => {
        const lineTotal = round2(a.lineTotal - shares[i]);
        const net = round2(lineTotal / (1 + lines[i].product.vatRate / 100));
        total = round2(total + lineTotal);
        vatTotal = round2(vatTotal + round2(lineTotal - net));
    });
    return { ...base, total, vatTotal, netTotal: round2(total - vatTotal), pointsDiscount: value, toPay: total };
}

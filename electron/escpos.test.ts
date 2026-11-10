import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import { createRequire } from 'node:module';
const { buildReceipt, drawerPulse, twoCol, wrap } = createRequire(import.meta.url)('./escpos.cjs');

const sample = {
    storeName: 'Fresh Market', receiptNumber: 'R-000001', date: '10/11/2026 09:00', cashier: 'Sam',
    lines: [{ name: 'Butter Croissant 4 Pack', quantity: 3, total: 5, note: 'Offer: 3 for £5' }, { name: 'Bananas', quantity: 0.755, total: 0.83 }],
    discountTotal: 0.7, total: 5.83, vatRows: [{ rate: 0, net: 5.83, vat: 0 }], payments: [{ label: 'Cash', amount: 10 }], change: 4.17,
};
const text = (b: Buffer) => b.toString('latin1');

describe('ESC/POS builder', () => {
    it('lays out two columns to the full width', () => {
        expect(twoCol('TOTAL', '£5.83', 20)).toHaveLength(20);
        expect(twoCol('A very long product name indeed', '£1.00', 20)).toHaveLength(20);
    });
    it('wraps long text without exceeding the width', () => {
        wrap('Fresh Market - High Street, 42 High Street Leeds West Yorkshire', 20).forEach((l: string) => expect(l.length).toBeLessThanOrEqual(20));
    });
    it('starts with init, ends with cut, and contains the key figures', () => {
        const b: Buffer = buildReceipt(sample);
        expect([b[0], b[1]]).toEqual([0x1b, 0x40]);
        expect(b.includes(Buffer.from([0x1d, 0x56, 0x42, 0x00]))).toBe(true);
        const t = text(b);
        expect(t).toContain('R-000001');
        expect(t).toContain('5.83');
        expect(t).toContain('Change');
        expect(t).toContain('0.755kg x Bananas');
    });
    it('only adds the drawer pulse when asked', () => {
        expect(buildReceipt(sample).includes(drawerPulse())).toBe(false);
        expect(buildReceipt(sample, { openDrawer: true }).includes(drawerPulse())).toBe(true);
    });
    it('a gift receipt shows no prices or totals', () => {
        const t = text(buildReceipt({ ...sample, gift: true }));
        expect(t).toContain('GIFT RECEIPT');
        expect(t).not.toContain('TOTAL');
        expect(t).not.toContain('5.83');
    });
    it('maps the pound sign for the printer code page and strips unsupported characters', () => {
        const b: Buffer = buildReceipt({ ...sample, lines: [{ name: 'Café “special”', quantity: 1, total: 1 }] });
        expect(b.includes(0x9c)).toBe(true);
        expect(text(b)).toContain('Caf? "special"');
    });
});

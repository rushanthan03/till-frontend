import { describe, expect, it } from 'vitest';
import { orderSheetHtml } from './printOrder';
import type { PurchaseOrder } from '../../features/purchasing/types';

const order = {
    id: 'o1', storeId: 's1', supplierId: 'x', number: 'PO-000007', status: 'ordered', expectedDate: '2026-11-14', notes: 'Back door <before 10>',
    totalCost: 27.4, receivedCost: 0, createdByName: 'Manager', orderedAt: '2026-11-11T09:00:00Z', closedAt: null, createdAt: '2026-11-11T09:00:00Z', updatedAt: '',
    supplier: { id: 'x', name: 'Booker & Sons', accountNumber: 'FM-1' },
    lines: [{ id: 'l1', productId: 'p', productName: 'Cola <2L>', barcode: '500', quantity: 24, unitCost: 1.1, receivedQuantity: 0, sortOrder: 0 }],
} as PurchaseOrder;

describe('order sheet', () => {
    const html = orderSheetHtml(order, 'Fresh Market');
    it('shows the order, supplier, lines and total', () => {
        expect(html).toContain('Purchase order PO-000007');
        expect(html).toContain('Account: FM-1');
        expect(html).toContain('£26.40');
        expect(html).toContain('£27.40');
        expect(html).toContain('14/11/2026');
    });
    it('escapes text so names cannot inject markup', () => {
        expect(html).toContain('Booker &amp; Sons');
        expect(html).toContain('Cola &lt;2L&gt;');
        expect(html).not.toContain('<before 10>');
    });
});

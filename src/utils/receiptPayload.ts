import type { Sale } from '../features/sales/types';
import type { ReceiptPayload } from '../hardware/hardware';

/** Turns a saved sale into the plain object the desktop shell prints. `gift` leaves prices off. */
export function buildReceiptPayload(sale: Sale, storeName: string, storeAddress?: string, gift = false): ReceiptPayload {
    const vat = new Map<number, { net: number; vat: number }>();
    for (const i of sale.items) {
        const row = vat.get(i.vatRate) ?? { net: 0, vat: 0 };
        row.net += i.lineTotal - i.vatAmount;
        row.vat += i.vatAmount;
        vat.set(i.vatRate, row);
    }
    return {
        storeName,
        address: storeAddress,
        receiptNumber: sale.receiptNumber,
        date: new Date(sale.createdAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        cashier: sale.cashierName ?? undefined,
        customer: sale.customerName ? `Customer: ${sale.customerName}${sale.pointsEarned > 0 ? ` +${sale.pointsEarned} pts` : ''}` : undefined,
        gift,
        lines: sale.items.map(i => ({
            name: i.name,
            quantity: i.quantity,
            total: i.lineTotal,
            note: i.promoDiscount > 0 ? `${i.promotionName}: -£${i.promoDiscount.toFixed(2)}` : i.originalUnitPrice != null ? `Was £${i.originalUnitPrice.toFixed(2)} (${i.adjustmentReason})` : undefined,
        })),
        discountTotal: sale.discountTotal ?? 0,
        total: sale.total,
        vatRows: [...vat.entries()].sort((a, b) => a[0] - b[0]).map(([rate, v]) => ({ rate, net: Math.round(v.net * 100) / 100, vat: Math.round(v.vat * 100) / 100 })),
        payments: sale.payments.map(p => ({ label: p.method === 'cash' ? 'Cash' : 'Card', amount: p.method === 'cash' && p.tendered ? p.tendered : p.amount })),
        change: sale.changeDue,
    };
}

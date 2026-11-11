import { useMemo } from 'react';
import { money } from '../../utils/money';
import type { Sale } from '../../features/sales/types';

interface Props {
    sale: Sale;
    storeName: string;
    storeAddress?: string;
}

/** 80mm-style receipt. `window.print()` prints only this element (see the print rule below). */
export function ReceiptView({ sale, storeName, storeAddress }: Props) {
    const vatBreakdown = useMemo(() => {
        const map = new Map<number, { net: number; vat: number; gross: number }>();
        sale.items.forEach(i => {
            const row = map.get(i.vatRate) ?? { net: 0, vat: 0, gross: 0 };
            row.gross += i.lineTotal;
            row.vat += i.vatAmount;
            row.net += i.lineTotal - i.vatAmount;
            map.set(i.vatRate, row);
        });
        return [...map.entries()].sort((a, b) => a[0] - b[0]);
    }, [sale.items]);

    const when = new Date(sale.createdAt);

    return (
        <>
            <style>{`@media print {
                body * { visibility: hidden !important; }
                #receipt-print, #receipt-print * { visibility: visible !important; }
                #receipt-print { position: absolute; left: 0; top: 0; width: 80mm; box-shadow: none !important; border: none !important; }
            }`}</style>
            <div id="receipt-print" className="mx-auto w-[300px] bg-white border border-gray-200 shadow-sm p-4 font-mono text-[12px] leading-snug text-gray-900">
                <div className="text-center">
                    <div className="text-base font-bold">{storeName}</div>
                    {storeAddress && <div>{storeAddress}</div>}
                </div>
                <div className="my-2 border-t border-dashed border-gray-400" />
                <div className="flex justify-between"><span>Receipt</span><span>{sale.receiptNumber}</span></div>
                <div className="flex justify-between"><span>{when.toLocaleDateString('en-GB')}</span><span>{when.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span></div>
                {sale.cashierName && <div className="flex justify-between"><span>Served by</span><span>{sale.cashierName}</span></div>}
                <div className="my-2 border-t border-dashed border-gray-400" />
                {sale.items.map(i => (
                    <div key={i.id} className="mb-1">
                        <div className="flex justify-between gap-2"><span className="break-words">{i.name}</span><span>{money(i.lineTotal)}</span></div>
                        {i.promoDiscount > 0 && <div className="text-gray-500 pl-2">{i.promotionName}: -{money(i.promoDiscount)}</div>}
                        {i.originalUnitPrice != null && <div className="text-gray-500 pl-2">Was {money(i.originalUnitPrice)} · {i.adjustmentReason}</div>}
                        {i.quantity !== 1 && <div className="text-gray-500 pl-2">{i.quantity} {Number.isInteger(i.quantity) ? '×' : 'kg @'} {money(i.unitPrice)}{Number.isInteger(i.quantity) ? '' : '/kg'}</div>}
                    </div>
                ))}
                <div className="my-2 border-t border-dashed border-gray-400" />
                {sale.discountTotal > 0 && <div className="flex justify-between"><span>Discounts</span><span>-{money(sale.discountTotal)}</span></div>}
                {(sale.pointsDiscount ?? 0) > 0 && <div className="flex justify-between"><span>Points used ({sale.pointsRedeemed})</span><span>-{money(sale.pointsDiscount ?? 0)}</span></div>}
                <div className="flex justify-between text-base font-bold"><span>TOTAL</span><span>{money(sale.total)}</span></div>
                {sale.payments.map(p => (
                    <div key={p.id} className="flex justify-between">
                        <span>{p.method === 'cash' ? 'Cash' : 'Card'}{p.reference ? ` (${p.reference})` : ''}</span>
                        <span>{money(p.method === 'cash' ? (p.tendered ?? p.amount) : p.amount)}</span>
                    </div>
                ))}
                {sale.changeDue > 0 && <div className="flex justify-between font-bold"><span>Change</span><span>{money(sale.changeDue)}</span></div>}
                <div className="my-2 border-t border-dashed border-gray-400" />
                <div className="text-gray-600">
                    <div className="flex justify-between font-semibold"><span>VAT</span><span>Net</span><span>VAT</span><span>Gross</span></div>
                    {vatBreakdown.map(([rate, v]) => (
                        <div key={rate} className="flex justify-between"><span>{rate}%</span><span>{money(v.net)}</span><span>{money(v.vat)}</span><span>{money(v.gross)}</span></div>
                    ))}
                </div>
                {sale.ageVerified && <div className="mt-2 text-center text-gray-600">Age verification completed</div>}
                <div className="my-2 border-t border-dashed border-gray-400" />
                {sale.customerName && <div className="mb-1">Customer: {sale.customerName}{sale.pointsEarned > 0 ? ` · +${sale.pointsEarned} pts` : ''}</div>}
                <div className="text-center">Thank you for shopping with us</div>
            </div>
        </>
    );
}

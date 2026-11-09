import { useEffect, useState } from 'react';
import { Banknote, CreditCard, Printer } from 'lucide-react';
import { toast } from 'react-toastify';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { ReceiptView } from '../till/ReceiptView';
import { SaleStatusBadge } from './SaleStatusBadge';
import { money } from '../../utils/money';
import { round2 } from '../../utils/basket';
import { handleApiError } from '../../api/handleApiError';
import { SalesAPI } from '../../features/sales/salesAPI';
import { DISPOSITION_LABELS, REASON_LABELS } from '../../features/refunds/labels';
import type { SaleDetail } from '../../features/sales/types';

type Tab = 'items' | 'payments' | 'refunds' | 'receipt';

interface Props {
    saleId: string;
    restaurantId: string;
    storeName: string;
    storeAddress?: string;
    onClose: () => void;
}

const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const MethodIcon = ({ method }: { method: 'cash' | 'card' }) => method === 'cash'
    ? <Banknote className="w-4 h-4 text-green-600" aria-hidden />
    : <CreditCard className="w-4 h-4 text-blue-600" aria-hidden />;

export function SaleDetailModal({ saleId, restaurantId, storeName, storeAddress, onClose }: Props) {
    const [sale, setSale] = useState<SaleDetail | null>(null);
    const [tab, setTab] = useState<Tab>('items');

    useEffect(() => {
        setSale(null);
        SalesAPI.get(saleId, restaurantId).then(setSale).catch((e) => { toast.error(handleApiError(e)); onClose(); });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [saleId, restaurantId]);

    const tabs: { id: Tab; label: string }[] = [
        { id: 'items', label: 'Items' }, { id: 'payments', label: 'Payments' },
        { id: 'refunds', label: `Refunds${sale?.refunds.length ? ` (${sale.refunds.length})` : ''}` }, { id: 'receipt', label: 'Receipt' },
    ];

    return (
        <Modal isOpen onClose={onClose} size="lg"
            title={sale ? <span className="flex flex-wrap items-center gap-3">{sale.receiptNumber}<SaleStatusBadge status={sale.status} /></span> : 'Sale'}
            description={sale ? `${when(sale.createdAt)} · served by ${sale.cashierName ?? '—'}` : undefined}>
            {!sale ? <p className="py-12 text-center text-gray-500" role="status">Loading…</p> : (
                <div className="space-y-4">
                    <div role="tablist" aria-label="Sale details" className="flex gap-1 border-b border-gray-200">
                        {tabs.map(t => (
                            <button key={t.id} role="tab" aria-selected={tab === t.id} type="button" onClick={() => setTab(t.id)}
                                className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${tab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>{t.label}</button>
                        ))}
                    </div>

                    {tab === 'items' && (
                        <div className="space-y-3">
                            <div className="overflow-x-auto border border-gray-200 rounded-xl">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                                        <tr><th className="px-3 py-2">Item</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Unit</th><th className="px-3 py-2 text-right">VAT</th><th className="px-3 py-2 text-right">Total</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {sale.items.map(i => (
                                            <tr key={i.id}>
                                                <td className="px-3 py-2"><div className="font-medium text-gray-900">{i.name}</div>
                                                    <div className="text-xs text-gray-500 font-mono">{i.barcode}{i.ageRestriction > 0 ? ` · ${i.ageRestriction}+` : ''}
                                                        {i.refundedQuantity > 0 && <span className="ml-2 font-sans text-amber-700">{i.refundedQuantity} refunded ({money(i.refundedAmount)})</span>}</div></td>
                                                <td className="px-3 py-2 text-right">{i.quantity}</td>
                                                <td className="px-3 py-2 text-right text-gray-600">{money(i.unitPrice)}</td>
                                                <td className="px-3 py-2 text-right text-gray-500">{i.vatRate}%</td>
                                                <td className="px-3 py-2 text-right font-semibold">{money(i.lineTotal)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <dl className="ml-auto max-w-xs space-y-1 text-sm">
                                <div className="flex justify-between"><dt className="text-gray-600">Subtotal (ex VAT)</dt><dd>{money(sale.netTotal)}</dd></div>
                                <div className="flex justify-between"><dt className="text-gray-600">VAT</dt><dd>{money(sale.vatTotal)}</dd></div>
                                <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-1"><dt>Total</dt><dd>{money(sale.total)}</dd></div>
                                {sale.refundedTotal > 0 && <>
                                    <div className="flex justify-between text-amber-800"><dt>Refunded</dt><dd>-{money(sale.refundedTotal)}</dd></div>
                                    <div className="flex justify-between font-bold"><dt>Net after refunds</dt><dd>{money(round2(sale.total - sale.refundedTotal))}</dd></div>
                                </>}
                            </dl>
                            {sale.ageVerified && <p className="text-sm text-gray-600">Age verification was completed at the till for this sale.</p>}
                        </div>
                    )}

                    {tab === 'payments' && (
                        <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl">
                            {sale.payments.map(p => (
                                <li key={p.id} className="flex items-center justify-between px-4 py-3">
                                    <span className="flex items-center gap-2 font-medium text-gray-900"><MethodIcon method={p.method} />{p.method === 'cash' ? 'Cash' : 'Card'}
                                        {p.reference && <span className="text-xs text-gray-500 font-mono">{p.reference}</span>}</span>
                                    <span className="text-right">
                                        <span className="font-semibold">{money(p.amount)}</span>
                                        {p.method === 'cash' && p.tendered !== null && p.tendered !== p.amount && <span className="block text-xs text-gray-500">given {money(p.tendered)}</span>}
                                    </span>
                                </li>
                            ))}
                            {sale.changeDue > 0 && <li className="flex justify-between px-4 py-3 bg-amber-50 font-semibold"><span>Change given</span><span>{money(sale.changeDue)}</span></li>}
                        </ul>
                    )}

                    {tab === 'refunds' && (
                        sale.refunds.length === 0 ? <p className="py-8 text-center text-gray-500">No refunds on this sale.</p> : (
                            <div className="space-y-3">
                                {sale.refunds.map(r => (
                                    <section key={r.id} className="border border-gray-200 rounded-xl p-4 space-y-2" aria-label={`Refund ${r.refundNumber}`}>
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div><span className="font-bold text-gray-900">{r.refundNumber}</span><span className="ml-2 text-xs text-gray-500">{when(r.createdAt)} · {r.processedByName ?? '—'}</span></div>
                                            <span className="font-bold text-amber-800">-{money(r.total)}</span>
                                        </div>
                                        <div className="text-sm text-gray-700">Reason: {REASON_LABELS[r.reason]}{r.note ? ` — ${r.note}` : ''}</div>
                                        <ul className="text-sm text-gray-700 space-y-0.5">
                                            {r.items.map(i => <li key={i.id} className="flex justify-between"><span>{i.quantity} × {i.name} <span className="text-xs text-gray-500">({DISPOSITION_LABELS[i.disposition]})</span></span><span>{money(i.lineTotal)}</span></li>)}
                                        </ul>
                                        <div className="flex flex-wrap gap-3 text-sm text-gray-600 border-t border-gray-100 pt-2">
                                            {r.payments.map(p => <span key={p.id} className="inline-flex items-center gap-1"><MethodIcon method={p.method} />Refunded to {p.method} {money(p.amount)}</span>)}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        )
                    )}

                    {tab === 'receipt' && (
                        <div className="space-y-3">
                            <ReceiptView sale={sale} storeName={storeName} storeAddress={storeAddress} />
                            {sale.refunds.length > 0 && <p className="text-center text-xs text-gray-500">This is the original receipt. See the Refunds tab for what was returned.</p>}
                            <div className="flex justify-center"><Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Reprint receipt</Button></div>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}

import { useEffect, useMemo, useState } from 'react';
import { Printer, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { PrintStyles } from './PrintStyles';
import { Divider, Row } from './ReportRows';
import { money } from '../../utils/money';
import { calcLine, round2, round3 } from '../../utils/basket';
import { handleApiError } from '../../api/handleApiError';
import { SalesAPI } from '../../features/sales/salesAPI';
import { RefundsAPI } from '../../features/refunds/refundsAPI';
import type { Sale, SaleItem } from '../../features/sales/types';
import { REASON_LABELS } from '../../features/refunds/labels';
import type { Refund, RefundDisposition, RefundReason } from '../../features/refunds/types';

const REASONS = (Object.keys(REASON_LABELS) as RefundReason[]).map(value => ({ value, label: REASON_LABELS[value] }));
// Imperative wording for the form (the history view uses the past-tense DISPOSITION_LABELS).
const DISPOSITIONS: { value: RefundDisposition; label: string }[] = [
    { value: 'restock', label: 'Return to stock' }, { value: 'waste', label: 'Waste' }, { value: 'damaged', label: 'Damaged / supplier return' },
];

type Step = 'find' | 'items' | 'pay' | 'done';

const remainingOf = (i: SaleItem) => round3(i.quantity - i.refundedQuantity);

/** Mirrors the server: partial quantities use the unit price, the last of a line takes the exact remainder. */
const estimate = (i: SaleItem, qty: number) =>
    qty === remainingOf(i) ? round2(i.lineTotal - i.refundedAmount) : calcLine(i.unitPrice, qty, i.vatRate).lineTotal;

interface Props {
    restaurantId: string;
    storeName: string;
    onClose: () => void;
}

export function RefundModal({ restaurantId, storeName, onClose }: Props) {
    const [step, setStep] = useState<Step>('find');
    const [query, setQuery] = useState('');
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(false);
    const [sale, setSale] = useState<Sale | null>(null);
    const [qty, setQty] = useState<Record<string, string>>({});
    const [disp, setDisp] = useState<Record<string, RefundDisposition>>({});
    const [reason, setReason] = useState<RefundReason>('changed_mind');
    const [note, setNote] = useState('');
    const [method, setMethod] = useState<'cash' | 'card'>('cash');
    const [busy, setBusy] = useState(false);
    const [refund, setRefund] = useState<Refund | null>(null);

    const search = async (receiptNumber?: string) => {
        setLoading(true);
        try {
            const r = await SalesAPI.list(restaurantId, { receiptNumber: receiptNumber || undefined, limit: 10 });
            setSales(r.data);
        } catch (e) { toast.error(handleApiError(e)); } finally { setLoading(false); }
    };
    useEffect(() => { search(); /* recent sales on open */ // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const pick = async (s: Sale) => {
        setLoading(true);
        try {
            const full = await SalesAPI.get(s.id, restaurantId);
            if (full.status === 'refunded') { toast.info('This sale has already been fully refunded'); return; }
            setSale(full);
            setQty({}); setDisp({});
            setMethod(full.payments.some(p => p.method === 'card') && !full.payments.some(p => p.method === 'cash') ? 'card' : 'cash');
            setStep('items');
        } catch (e) { toast.error(handleApiError(e)); } finally { setLoading(false); }
    };

    const lines = useMemo(() => (sale?.items ?? []).map(i => {
        const q = round3(Number(qty[i.id]) || 0);
        return { item: i, q, valid: q > 0 && q <= remainingOf(i), value: q > 0 && q <= remainingOf(i) ? estimate(i, q) : 0 };
    }), [sale, qty]);
    const selected = lines.filter(l => l.q > 0);
    const total = round2(selected.reduce((a, l) => a + l.value, 0));
    const anyInvalid = selected.some(l => !l.valid);

    const refundAll = () => {
        if (!sale) return;
        const next: Record<string, string> = {};
        sale.items.forEach(i => { if (remainingOf(i) > 0) next[i.id] = String(remainingOf(i)); });
        setQty(next);
    };

    const submit = async () => {
        if (!sale) return;
        setBusy(true);
        try {
            const done = await RefundsAPI.create(restaurantId, {
                saleId: sale.id,
                items: selected.map(l => ({ saleItemId: l.item.id, quantity: l.q, disposition: disp[l.item.id] ?? 'restock' })),
                reason,
                note: note.trim() || undefined,
                payments: [{ method, amount: total, reference: method === 'card' ? `SIM-RF-${Math.random().toString(36).slice(2, 8).toUpperCase()}` : undefined }],
            });
            setRefund(done);
            setStep('done');
        } catch (e) { toast.error(handleApiError(e)); } finally { setBusy(false); }
    };

    const titles: Record<Step, string> = { find: 'Refund: find the sale', items: `Refund: choose items (${sale?.receiptNumber ?? ''})`, pay: 'Refund: payment', done: 'Refund complete' };

    return (
        <Modal isOpen onClose={busy ? () => undefined : onClose} title={titles[step]} size="lg">
            {step === 'find' && (
                <div className="space-y-4">
                    <form onSubmit={(e) => { e.preventDefault(); search(query.trim()); }} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Receipt number, e.g. R-000012" aria-label="Receipt number"
                                className="w-full pl-9 pr-3 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-600" />
                        </div>
                        <Button type="submit" isLoading={loading}>Search</Button>
                    </form>
                    <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl max-h-80 overflow-y-auto">
                        {sales.length === 0 && <li className="p-6 text-center text-gray-500">{loading ? 'Searching…' : 'No sales found'}</li>}
                        {sales.map(s => (
                            <li key={s.id}>
                                <button type="button" onClick={() => pick(s)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-50">
                                    <span>
                                        <span className="font-semibold text-gray-900">{s.receiptNumber}</span>
                                        <span className="ml-2 text-xs text-gray-500">{new Date(s.createdAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {s.cashierName ?? '—'}</span>
                                    </span>
                                    <span className="flex items-center gap-3">
                                        {s.status !== 'completed' && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">{s.status === 'refunded' ? 'Refunded' : 'Part refunded'}</span>}
                                        <span className="font-bold">{money(s.total)}</span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {step === 'items' && sale && (
                <div className="space-y-4">
                    <div className="overflow-x-auto border border-gray-200 rounded-xl">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                                <tr><th className="px-3 py-2">Item</th><th className="px-3 py-2 text-center">Refundable</th><th className="px-3 py-2">Refund qty</th><th className="px-3 py-2">Goods</th><th className="px-3 py-2 text-right">Value</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {lines.map(({ item, q, valid, value }) => {
                                    const remaining = remainingOf(item);
                                    const weighed = !Number.isInteger(item.quantity);
                                    return (
                                        <tr key={item.id} className={remaining <= 0 ? 'opacity-50' : ''}>
                                            <td className="px-3 py-2"><div className="font-medium text-gray-900">{item.name}</div><div className="text-xs text-gray-500">{money(item.unitPrice)}{weighed ? '/kg' : ''} · sold {item.quantity}</div></td>
                                            <td className="px-3 py-2 text-center">{remaining}</td>
                                            <td className="px-3 py-2">
                                                <input type="number" min="0" max={remaining} step={weighed ? '0.001' : '1'} disabled={remaining <= 0} value={qty[item.id] ?? ''} aria-label={`Refund quantity for ${item.name}`}
                                                    onChange={(e) => setQty(p => ({ ...p, [item.id]: e.target.value }))}
                                                    className={`w-24 px-2 py-1.5 border-2 rounded-lg ${q > 0 && !valid ? 'border-red-400' : 'border-gray-300'}`} />
                                            </td>
                                            <td className="px-3 py-2">
                                                <select value={disp[item.id] ?? 'restock'} onChange={(e) => setDisp(p => ({ ...p, [item.id]: e.target.value as RefundDisposition }))} disabled={q <= 0} aria-label={`What happens to ${item.name}`}
                                                    className="px-2 py-1.5 border border-gray-300 rounded-lg bg-white">
                                                    {DISPOSITIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-3 py-2 text-right font-semibold">{q > 0 && valid ? money(value) : '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-sm font-medium text-gray-700">Reason
                            <select value={reason} onChange={(e) => setReason(e.target.value as RefundReason)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white">
                                {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                        </label>
                        <label className="block text-sm font-medium text-gray-700">Note (optional)
                            <input value={note} maxLength={250} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
                        </label>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Button variant="outline" onClick={refundAll}>Refund everything remaining</Button>
                        <div className="text-right"><div className="text-xs uppercase tracking-wider text-gray-500">Refund total</div><div className="text-3xl font-extrabold tabular-nums">{money(total)}</div></div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setStep('find')}>Back</Button>
                        <Button onClick={() => setStep('pay')} disabled={!selected.length || anyInvalid}>Continue</Button>
                    </div>
                </div>
            )}

            {step === 'pay' && sale && (
                <div className="space-y-4">
                    <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm text-gray-700">
                        Original payment: {sale.payments.map(p => `${p.method === 'cash' ? 'Cash' : 'Card'} ${money(p.amount)}`).join(' + ')}
                    </div>
                    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Refund method">
                        {(['cash', 'card'] as const).map(m => (
                            <button key={m} type="button" role="radio" aria-checked={method === m} onClick={() => setMethod(m)}
                                className={`rounded-xl border-2 p-4 font-semibold ${method === m ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-200 hover:bg-gray-50'}`}>
                                {m === 'cash' ? 'Refund to cash' : 'Refund to card'}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500">Money can only go back the way it was paid. {method === 'card' ? 'Card refunds use the simulated terminal in this demo.' : 'Cash comes out of the till drawer.'}</p>
                    <div className="rounded-xl bg-gray-900 text-white p-5 flex items-end justify-between"><span>Refund to customer</span><span className="text-4xl font-extrabold tabular-nums">{money(total)}</span></div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setStep('items')} disabled={busy}>Back</Button>
                        <Button variant="danger" size="lg" onClick={submit} isLoading={busy}>Confirm refund {money(total)}</Button>
                    </div>
                </div>
            )}

            {step === 'done' && refund && (
                <div className="grid gap-6 md:grid-cols-[1fr_auto]">
                    <div className="space-y-3">
                        <div className="text-green-700 font-semibold">Refund completed</div>
                        <div className="text-5xl font-extrabold tabular-nums">{money(refund.total)}</div>
                        <div className="text-sm text-gray-600">{refund.refundNumber} · original receipt {refund.originalReceiptNumber}</div>
                        <div className="text-sm text-gray-700">
                            {refund.payments.map(p => `${p.method === 'cash' ? 'Cash' : 'Card'} ${money(p.amount)}`).join(' + ')}
                            {refund.payments.some(p => p.method === 'cash') ? ' — give the customer the cash from the drawer' : ''}
                        </div>
                        <div className="flex flex-col gap-2 pt-2">
                            <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Print refund receipt</Button>
                            <Button size="lg" onClick={onClose}>Done</Button>
                        </div>
                    </div>
                    <>
                        <PrintStyles />
                        <div id="receipt-print" className="mx-auto w-[300px] bg-white border border-gray-200 p-4 font-mono text-[12px] leading-snug text-gray-900">
                            <div className="text-center font-bold text-base">REFUND</div>
                            <div className="text-center">{storeName}</div>
                            <Divider />
                            <Row label="Refund" value={refund.refundNumber} />
                            <Row label="Original receipt" value={refund.originalReceiptNumber} />
                            <Row label="Date" value={new Date(refund.createdAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
                            {refund.processedByName && <Row label="Processed by" value={refund.processedByName} />}
                            <Divider />
                            {refund.items.map(i => <Row key={i.id} label={`${i.quantity} × ${i.name}`} value={`-${money(i.lineTotal)}`} />)}
                            <Divider />
                            <Row label="TOTAL REFUNDED" value={money(refund.total)} bold />
                            {refund.payments.map(p => <Row key={p.id} label={p.method === 'cash' ? 'Cash' : `Card${p.reference ? ` (${p.reference})` : ''}`} value={money(p.amount)} />)}
                            <Row label="of which VAT" value={money(refund.vatTotal)} />
                        </div>
                    </>
                </div>
            )}
        </Modal>
    );
}

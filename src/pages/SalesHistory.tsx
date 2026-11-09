import { useCallback, useEffect, useRef, useState } from 'react';
import { Banknote, CreditCard, History, Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Pagination from '../components/Pagination';
import { PeriodPicker } from '../components/PeriodPicker';
import { SaleDetailModal } from '../components/sales/SaleDetailModal';
import { SaleStatusBadge } from '../components/sales/SaleStatusBadge';
import { useAuth } from '../hooks/useAuth';
import { handleApiError } from '../api/handleApiError';
import { money } from '../utils/money';
import { Preset, allTimeRange, rangeFor } from '../utils/dateRange';
import { SalesAPI } from '../features/sales/salesAPI';
import type { Sale, SalesSummary } from '../features/sales/types';

const timeFmt = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const SalesHistory = () => {
    const { user } = useAuth();
    const restaurantId = localStorage.getItem('selectedRestaurantId') || user?.restaurantId || user?.restaurant?.id || '';
    const storeName = user?.restaurant?.name || 'Store';
    const a = user?.restaurant?.address;
    const storeAddress = a ? [a.lane, a.city, a.district].filter(Boolean).join(', ') : undefined;

    // Opened from a till-session row: /sales?shift=<id> shows only that session's sales, across all dates.
    const [searchParams, setSearchParams] = useSearchParams();
    const shiftId = searchParams.get('shift') || undefined;

    const [preset, setPreset] = useState<Preset>(shiftId ? 'all' : 'today');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [receiptInput, setReceiptInput] = useState('');
    const [receipt, setReceipt] = useState('');
    const [cashierInput, setCashierInput] = useState('');
    const [cashier, setCashier] = useState('');
    const [status, setStatus] = useState<'' | Sale['status']>('');
    const [method, setMethod] = useState<'' | 'cash' | 'card'>('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);

    const [sales, setSales] = useState<Sale[]>([]);
    const [total, setTotal] = useState(0);
    const [summary, setSummary] = useState<SalesSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const requestId = useRef(0);

    useEffect(() => {
        const t = setTimeout(() => { setReceipt(receiptInput.trim()); setCashier(cashierInput.trim()); setPage(1); }, 300);
        return () => clearTimeout(t);
    }, [receiptInput, cashierInput]);

    const load = useCallback(async () => {
        if (!restaurantId) return;
        const mine = ++requestId.current;
        setLoading(true);
        try {
            const range = rangeFor(preset, customFrom, customTo);
            const summaryRange = preset === 'all' ? allTimeRange() : range;
            const [list, sum] = await Promise.all([
                SalesAPI.list(restaurantId, { ...range, shiftId, receiptNumber: receipt || undefined, cashier: cashier || undefined, status: status || undefined, method: method || undefined, page, limit }),
                SalesAPI.summary(restaurantId, { ...summaryRange, shiftId }),
            ]);
            if (mine !== requestId.current) return; // a newer request superseded this one
            setSales(list.data); setTotal(list.total); setSummary(sum);
        } catch (error) {
            if (mine === requestId.current) toast.error(handleApiError(error));
        } finally {
            if (mine === requestId.current) setLoading(false);
        }
    }, [restaurantId, shiftId, preset, customFrom, customTo, receipt, cashier, status, method, page, limit]);

    useEffect(() => { load(); }, [load]);

    const resetFilters = () => { setReceiptInput(''); setCashierInput(''); setStatus(''); setMethod(''); setPreset(shiftId ? 'all' : 'today'); setCustomFrom(''); setCustomTo(''); setPage(1); };
    const clearShift = () => { setSearchParams({}); setPreset('today'); setPage(1); };
    const hasFilters = !!(receiptInput || cashierInput || status || method || (!shiftId && preset !== 'today'));

    if (!restaurantId) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-600">
                <History className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                <p className="font-semibold text-gray-900">No store selected</p>
                <p className="text-sm mt-1">Pick a store from the outlet switcher to see its sales.</p>
            </div>
        );
    }

    const tiles = summary ? [
        { label: 'Sales', value: String(summary.transactions), sub: `${summary.refundCount} refund${summary.refundCount === 1 ? '' : 's'}` },
        { label: 'Gross sales', value: money(summary.grossSales), sub: 'before refunds' },
        { label: 'Refunds', value: money(summary.refundsTotal), sub: `cash ${money(summary.cashRefunds)} · card ${money(summary.cardRefunds)}` },
        { label: 'Net sales', value: money(summary.netSales), sub: `incl. VAT ${money(summary.vat)}` },
        { label: 'Taken', value: `${money(summary.cashSales)} cash`, sub: `${money(summary.cardSales)} card` },
    ] : [];

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Sales history</h1>
                <p className="text-gray-500 mt-1">Every till sale, with receipts, payments and refunds.</p>
            </div>

            {shiftId ? (
                <div className="flex flex-wrap items-center gap-3 rounded-xl bg-blue-50 border border-blue-200 px-4 py-2.5 text-sm text-blue-900">
                    <span>Showing sales from <b>one till session</b> only (all dates).</span>
                    <button type="button" onClick={clearShift} className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:underline"><X className="w-4 h-4" aria-hidden />Show all sales</button>
                </div>
            ) : (
                <PeriodPicker preset={preset} customFrom={customFrom} customTo={customTo}
                    onPreset={(p) => { setPreset(p); setPage(1); }} onCustomFrom={(v) => { setCustomFrom(v); setPage(1); }} onCustomTo={(v) => { setCustomTo(v); setPage(1); }} />
            )}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-live="polite">
                {(summary ? tiles : Array.from({ length: 5 }, () => null)).map((t, i) => (
                    <div key={t?.label ?? i} className="bg-white rounded-xl border border-gray-200 p-4">
                        {t ? <>
                            <div className="text-xs uppercase tracking-wide text-gray-500">{t.label}</div>
                            <div className="text-2xl font-extrabold text-gray-900 tabular-nums mt-0.5">{t.value}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{t.sub}</div>
                        </> : <div className="h-14 animate-pulse bg-gray-100 rounded" />}
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 grid gap-3 md:grid-cols-[1.3fr_1fr_160px_150px_auto] items-end">
                <label className="block text-sm font-medium text-gray-700">Receipt number
                    <span className="relative block mt-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
                        <input value={receiptInput} onChange={(e) => setReceiptInput(e.target.value)} placeholder="e.g. R-000012" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg font-normal" />
                    </span>
                </label>
                <label className="block text-sm font-medium text-gray-700">Cashier
                    <input value={cashierInput} onChange={(e) => setCashierInput(e.target.value)} placeholder="Name" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg font-normal" />
                </label>
                <label className="block text-sm font-medium text-gray-700">Status
                    <select value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white font-normal">
                        <option value="">All</option><option value="completed">Completed</option><option value="partially_refunded">Part refunded</option><option value="refunded">Refunded</option><option value="voided">Voided</option>
                    </select>
                </label>
                <label className="block text-sm font-medium text-gray-700">Payment
                    <select value={method} onChange={(e) => { setMethod(e.target.value as typeof method); setPage(1); }} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white font-normal">
                        <option value="">All</option><option value="cash">Cash</option><option value="card">Card</option>
                    </select>
                </label>
                <button type="button" onClick={resetFilters} disabled={!hasFilters} className="px-3 py-2 text-sm font-semibold text-blue-700 hover:underline disabled:text-gray-400 disabled:no-underline">Reset</button>
            </div>

            <div>
                <div className="bg-white rounded-t-xl border border-gray-200 overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Receipt</th><th className="px-4 py-3">Date &amp; time</th><th className="px-4 py-3">Cashier</th>
                                <th className="px-4 py-3">Payment</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading && sales.length === 0 && <tr><td colSpan={6} className="px-4 py-14 text-center text-gray-500" role="status">Loading sales…</td></tr>}
                            {!loading && sales.length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-14 text-center text-gray-500">{hasFilters ? 'No sales match these filters.' : 'No sales yet in this period.'}</td></tr>
                            )}
                            {sales.map(s => {
                                const methods = [...new Set(s.payments.map(p => p.method))];
                                return (
                                    <tr key={s.id} tabIndex={0} onClick={() => setSelectedId(s.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(s.id); } }}
                                        aria-label={`Open sale ${s.receiptNumber}`} className={`cursor-pointer hover:bg-blue-50 focus:outline-none focus:bg-blue-50 ${loading ? 'opacity-60' : ''}`}>
                                        <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{s.receiptNumber}</td>
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{timeFmt(s.createdAt)}</td>
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{s.cashierName ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center gap-2 text-gray-700">
                                                {methods.map(m => m === 'cash'
                                                    ? <span key={m} className="inline-flex items-center gap-1"><Banknote className="w-4 h-4 text-green-600" aria-hidden />Cash</span>
                                                    : <span key={m} className="inline-flex items-center gap-1"><CreditCard className="w-4 h-4 text-blue-600" aria-hidden />Card</span>)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums"><div className="font-bold text-gray-900">{money(s.total)}</div>
                                            {s.refundedTotal > 0 && <div className="text-xs text-amber-700">-{money(s.refundedTotal)} refunded</div>}</td>
                                        <td className="px-4 py-3"><SaleStatusBadge status={s.status} /></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <Pagination page={String(page)} limit={String(limit)} total={total}
                    handleChangePage={(_, p) => setPage(p + 1)} handleChangeRowsPerPage={(e) => { setLimit(Number(e.target.value)); setPage(1); }} />
            </div>

            {selectedId && <SaleDetailModal saleId={selectedId} restaurantId={restaurantId} storeName={storeName} storeAddress={storeAddress} onClose={() => setSelectedId(null)} />}
        </div>
    );
};

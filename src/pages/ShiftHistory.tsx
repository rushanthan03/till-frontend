import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import Pagination from '../components/Pagination';
import { PeriodPicker } from '../components/PeriodPicker';
import { DifferenceBadge } from '../components/shifts/DifferenceBadge';
import { ShiftDetailModal } from '../components/shifts/ShiftDetailModal';
import { useAuth } from '../hooks/useAuth';
import { handleApiError } from '../api/handleApiError';
import { money } from '../utils/money';
import { round2 } from '../utils/basket';
import { Preset, rangeFor } from '../utils/dateRange';
import { ShiftsAPI } from '../features/shifts/shiftsAPI';
import type { Shift, ShiftsSummary } from '../features/shifts/types';

const timeFmt = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const ShiftHistory = () => {
    const { user } = useAuth();
    const storeId = localStorage.getItem('selectedRestaurantId') || user?.restaurantId || user?.restaurant?.id || '';
    const storeName = user?.restaurant?.name || 'Store';

    const [preset, setPreset] = useState<Preset>('7d');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [cashierInput, setCashierInput] = useState('');
    const [cashier, setCashier] = useState('');
    const [status, setStatus] = useState<'' | 'open' | 'closed'>('');
    const [differenceOnly, setDifferenceOnly] = useState(false);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);

    const [shifts, setShifts] = useState<Shift[]>([]);
    const [total, setTotal] = useState(0);
    const [summary, setSummary] = useState<ShiftsSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const requestId = useRef(0);

    useEffect(() => {
        const t = setTimeout(() => { setCashier(cashierInput.trim()); setPage(1); }, 300);
        return () => clearTimeout(t);
    }, [cashierInput]);

    const load = useCallback(async () => {
        if (!storeId) return;
        const mine = ++requestId.current;
        setLoading(true);
        try {
            const filters = { ...rangeFor(preset, customFrom, customTo), cashier: cashier || undefined, status: status || undefined, differenceOnly };
            const [list, sum] = await Promise.all([
                ShiftsAPI.list(storeId, { ...filters, page, limit }),
                ShiftsAPI.summary(storeId, filters),
            ]);
            if (mine !== requestId.current) return;
            setShifts(list.data); setTotal(list.total); setSummary(sum);
        } catch (error) {
            if (mine === requestId.current) toast.error(handleApiError(error));
        } finally {
            if (mine === requestId.current) setLoading(false);
        }
    }, [storeId, preset, customFrom, customTo, cashier, status, differenceOnly, page, limit]);

    useEffect(() => { load(); }, [load]);

    const hasFilters = !!(cashierInput || status || differenceOnly || preset !== '7d');
    const resetFilters = () => { setCashierInput(''); setStatus(''); setDifferenceOnly(false); setPreset('7d'); setCustomFrom(''); setCustomTo(''); setPage(1); };

    if (!storeId) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-600">
                <Clock className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                <p className="font-semibold text-gray-900">No store selected</p>
                <p className="text-sm mt-1">Pick a store from the outlet switcher to see its till sessions.</p>
            </div>
        );
    }

    const diffWord = (n: number) => (n === 0 ? 'Balanced' : n < 0 ? `Short ${money(Math.abs(n))}` : `Over ${money(n)}`);
    const tiles = summary ? [
        { label: 'Sessions', value: String(summary.sessions), sub: `${summary.closedSessions} closed · ${summary.openSessions} open` },
        { label: 'Net sales (closed)', value: money(summary.netSales), sub: 'after refunds' },
        { label: 'Cash difference', value: diffWord(summary.netDifference), sub: `short ${money(Math.abs(summary.shortTotal))} · over ${money(summary.overTotal)}` },
        { label: 'Sessions not balanced', value: String(summary.shortCount + summary.overCount), sub: `${summary.shortCount} short · ${summary.overCount} over · ${summary.balancedCount} balanced` },
    ] : [];

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Till sessions</h1>
                <p className="text-gray-500 mt-1">Every opening and closing of a till, with its cash count and Z report.</p>
            </div>

            <PeriodPicker preset={preset} customFrom={customFrom} customTo={customTo}
                onPreset={(p) => { setPreset(p); setPage(1); }} onCustomFrom={(v) => { setCustomFrom(v); setPage(1); }} onCustomTo={(v) => { setCustomTo(v); setPage(1); }} />

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-live="polite">
                {(summary ? tiles : Array.from({ length: 4 }, () => null)).map((t, i) => (
                    <div key={t?.label ?? i} className="bg-white rounded-xl border border-gray-200 p-4">
                        {t ? <>
                            <div className="text-xs uppercase tracking-wide text-gray-500">{t.label}</div>
                            <div className="text-2xl font-extrabold text-gray-900 tabular-nums mt-0.5">{t.value}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{t.sub}</div>
                        </> : <div className="h-14 animate-pulse bg-gray-100 rounded" />}
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 grid gap-3 md:grid-cols-[1.2fr_160px_auto_auto] items-end">
                <label className="block text-sm font-medium text-gray-700">Cashier
                    <span className="relative block mt-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
                        <input value={cashierInput} onChange={(e) => setCashierInput(e.target.value)} placeholder="Name" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg font-normal" />
                    </span>
                </label>
                <label className="block text-sm font-medium text-gray-700">Status
                    <select value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white font-normal">
                        <option value="">All</option><option value="open">Open</option><option value="closed">Closed</option>
                    </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 pb-2 cursor-pointer">
                    <input type="checkbox" checked={differenceOnly} onChange={(e) => { setDifferenceOnly(e.target.checked); setPage(1); }} className="w-4 h-4" />
                    Only with a cash difference
                </label>
                <button type="button" onClick={resetFilters} disabled={!hasFilters} className="px-3 py-2 text-sm font-semibold text-blue-700 hover:underline disabled:text-gray-400 disabled:no-underline">Reset</button>
            </div>

            <div>
                <div className="bg-white rounded-t-xl border border-gray-200 overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Cashier</th><th className="px-4 py-3">Opened</th><th className="px-4 py-3">Closed</th>
                                <th className="px-4 py-3">Difference</th><th className="px-4 py-3 text-right whitespace-nowrap">Net sales</th>
                                <th className="px-4 py-3 text-right">Float</th><th className="px-4 py-3 text-right">Expected</th><th className="px-4 py-3 text-right">Counted</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading && shifts.length === 0 && <tr><td colSpan={8} className="px-4 py-14 text-center text-gray-500" role="status">Loading sessions…</td></tr>}
                            {!loading && shifts.length === 0 && <tr><td colSpan={8} className="px-4 py-14 text-center text-gray-500">{hasFilters ? 'No sessions match these filters.' : 'No till sessions yet.'}</td></tr>}
                            {shifts.map(s => {
                                const closed = s.status === 'closed';
                                return (
                                    <tr key={s.id} tabIndex={0} onClick={() => setSelectedId(s.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(s.id); } }}
                                        aria-label={`Open till session of ${s.cashierName}, ${timeFmt(s.openedAt)}`} className={`cursor-pointer hover:bg-blue-50 focus:outline-none focus:bg-blue-50 ${loading ? 'opacity-60' : ''}`}>
                                        <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{s.cashierName}</td>
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{timeFmt(s.openedAt)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{closed && s.closedAt ? <span className="text-gray-600">{timeFmt(s.closedAt)}</span>
                                            : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"><span className="w-1.5 h-1.5 rounded-full bg-blue-600" aria-hidden />Open now</span>}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{closed ? <><DifferenceBadge variance={s.variance} />{s.closeNote && <span className="ml-2 text-xs text-gray-500">reason on file</span>}</> : <span className="text-gray-400">—</span>}</td>
                                        <td className="px-4 py-3 text-right tabular-nums font-semibold">{closed ? money(round2((s.grossSales ?? 0) - (s.refundsTotal ?? 0))) : '—'}</td>
                                        <td className="px-4 py-3 text-right tabular-nums text-gray-600">{money(s.openingFloat)}</td>
                                        <td className="px-4 py-3 text-right tabular-nums text-gray-600">{closed ? money(s.expectedCash) : '—'}</td>
                                        <td className="px-4 py-3 text-right tabular-nums text-gray-600">{closed ? money(s.countedCash) : '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <Pagination page={String(page)} limit={String(limit)} total={total}
                    handleChangePage={(_, p) => setPage(p + 1)} handleChangeRowsPerPage={(e) => { setLimit(Number(e.target.value)); setPage(1); }} />
            </div>

            {selectedId && <ShiftDetailModal shiftId={selectedId} storeId={storeId} storeName={storeName} onClose={() => setSelectedId(null)} />}
        </div>
    );
};

import { useCallback, useEffect, useState } from 'react';
import { FileText, Printer } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { handleApiError } from '../api/handleApiError';
import { money } from '../utils/money';
import { ShiftsAPI } from '../features/shifts/shiftsAPI';
import type { DayReport } from '../features/shifts/types';

const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const time = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—');

const Line = ({ label, value, bold, tone }: { label: string; value: string | number; bold?: boolean; tone?: 'bad' | 'good' }) => (
    <div className={`flex justify-between gap-4 py-1 ${bold ? 'font-bold border-t border-gray-200 mt-1 pt-2' : ''} ${tone === 'bad' ? 'text-red-700' : tone === 'good' ? 'text-green-700' : ''}`}>
        <span>{label}</span><span className="tabular-nums">{value}</span>
    </div>
);

/** All till sessions of one trading day, with combined totals, cash movements and the cash difference. */
export const DayReportPage = () => {
    const { user } = useAuth();
    const storeId = localStorage.getItem('selectedRestaurantId') || user?.restaurantId || user?.restaurant?.id || '';
    const [date, setDate] = useState(today());
    const [report, setReport] = useState<DayReport | null>(null);
    const [loading, setLoading] = useState(false);

    const load = useCallback(() => {
        if (!storeId) return;
        setLoading(true);
        ShiftsAPI.dayReport(storeId, date)
            .then(setReport)
            .catch((e) => toast.error(handleApiError(e)))
            .finally(() => setLoading(false));
    }, [storeId, date]);
    useEffect(() => { load(); }, [load]);

    if (!storeId) return <p className="p-10 text-center text-gray-500">Pick a store first.</p>;
    const t = report?.totals;

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><FileText className="w-6 h-6" />Day end report</h1>
                    <p className="text-sm text-gray-600">Everything that happened on the tills for one trading day ({report?.date ?? date}).</p>
                </div>
                <div className="flex items-end gap-2 print:hidden">
                    <label className="text-sm font-medium text-gray-700">Date
                        <input type="date" value={date} max={today()} onChange={(e) => e.target.value && setDate(e.target.value)}
                            className="mt-1 block px-3 py-2 border border-gray-300 rounded-lg" />
                    </label>
                    <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Print</Button>
                </div>
            </div>

            {loading && !report && <p className="py-10 text-center text-gray-500" role="status">Loading…</p>}

            {report && t && (
                <>
                    {report.openSessions > 0 && (
                        <div role="alert" className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 text-sm">
                            {report.openSessions} till session{report.openSessions > 1 ? 's are' : ' is'} still open. Their figures are live and will change; close every till before signing off the day.
                        </div>
                    )}
                    {report.sessions === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">No till sessions were opened on {report.date}.</div>
                    ) : (
                        <>
                            <div className="grid gap-4 md:grid-cols-3">
                                <section className="bg-white rounded-xl border border-gray-200 p-4 text-sm">
                                    <h2 className="font-semibold text-gray-900 mb-2">Sales</h2>
                                    <Line label="Transactions" value={t.transactions} />
                                    <Line label="Gross sales" value={money(t.grossSales)} />
                                    <Line label={`Refunds (${t.refundCount})`} value={`-${money(t.refundsTotal)}`} />
                                    <Line label="Net sales" value={money(t.netSales)} bold />
                                    <Line label="of which VAT" value={money(t.vat)} />
                                    <Line label="Discounts given" value={money(report.discountTotal)} />
                                </section>
                                <section className="bg-white rounded-xl border border-gray-200 p-4 text-sm">
                                    <h2 className="font-semibold text-gray-900 mb-2">Takings by tender</h2>
                                    <Line label="Cash sales" value={money(t.cashSales)} />
                                    <Line label="Card sales" value={money(t.cardSales)} />
                                    <Line label="Cash refunds" value={`-${money(t.cashRefunds)}`} />
                                    <Line label="Card refunds" value={`-${money(t.cardRefunds)}`} />
                                </section>
                                <section className="bg-white rounded-xl border border-gray-200 p-4 text-sm">
                                    <h2 className="font-semibold text-gray-900 mb-2">Cash office</h2>
                                    <Line label="Paid in" value={money(t.paidIn)} />
                                    <Line label="Paid out" value={`-${money(t.paidOut)}`} />
                                    <Line label="Safe drops" value={`-${money(t.safeDrops)}`} />
                                    <Line label="No sale opens" value={t.noSales} />
                                    <Line label="Expected cash" value={money(t.expectedCash)} bold />
                                    <Line label="Counted cash" value={money(t.countedCash)} />
                                    <Line label="Difference" value={money(t.variance)} tone={t.variance < 0 ? 'bad' : t.variance > 0 ? 'good' : undefined} />
                                </section>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                                        <tr><th className="px-4 py-2">Cashier</th><th className="px-4 py-2">Opened</th><th className="px-4 py-2">Closed</th>
                                            <th className="px-4 py-2 text-right">Net sales</th><th className="px-4 py-2 text-right">Expected</th><th className="px-4 py-2 text-right">Counted</th><th className="px-4 py-2 text-right">Difference</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {report.shifts.map(s => (
                                            <tr key={s.id}>
                                                <td className="px-4 py-2 font-medium">{s.cashierName}</td>
                                                <td className="px-4 py-2">{time(s.openedAt)}</td>
                                                <td className="px-4 py-2">{s.status === 'open' ? <span className="text-amber-700">Still open</span> : time(s.closedAt)}</td>
                                                <td className="px-4 py-2 text-right tabular-nums">{money(s.netSales)}</td>
                                                <td className="px-4 py-2 text-right tabular-nums">{money(s.expectedCash)}</td>
                                                <td className="px-4 py-2 text-right tabular-nums">{s.countedCash === null ? '—' : money(s.countedCash)}</td>
                                                <td className={`px-4 py-2 text-right tabular-nums ${s.variance && s.variance < 0 ? 'text-red-700' : ''}`}>{s.variance === null ? '—' : money(s.variance)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

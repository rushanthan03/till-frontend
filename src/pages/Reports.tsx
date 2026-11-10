import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, Printer } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../components/Button';
import { PeriodPicker } from '../components/PeriodPicker';
import { useAuth } from '../hooks/useAuth';
import { handleApiError } from '../api/handleApiError';
import { money } from '../utils/money';
import { downloadCsv } from '../utils/csv';
import { Preset, rangeFor } from '../utils/dateRange';
import { DepartmentReport, ProductReport, ReportsAPI, TenderReport, VatReport } from '../features/reports/reportsAPI';

type Tab = 'vat' | 'tender' | 'departments' | 'products';
const TABS: { id: Tab; label: string }[] = [
    { id: 'vat', label: 'VAT' }, { id: 'tender', label: 'Tender' }, { id: 'departments', label: 'Departments' }, { id: 'products', label: 'Products' },
];

const th = 'px-4 py-2';
const num = 'px-4 py-2 text-right tabular-nums';
const Head = ({ cols }: { cols: { label: string; right?: boolean }[] }) => (
    <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
        <tr>{cols.map(c => <th key={c.label} className={`${th} ${c.right ? 'text-right' : ''}`}>{c.label}</th>)}</tr>
    </thead>
);
const Empty = ({ cols }: { cols: number }) => <tr><td colSpan={cols} className="px-4 py-10 text-center text-gray-500">No sales in this period.</td></tr>;
const TotalRow = ({ children }: { children: React.ReactNode }) => <tr className="bg-gray-50 font-bold">{children}</tr>;

export const ReportsPage = () => {
    const { user } = useAuth();
    const storeId = localStorage.getItem('selectedRestaurantId') || user?.restaurantId || user?.restaurant?.id || '';
    const [tab, setTab] = useState<Tab>('vat');
    const [preset, setPreset] = useState<Preset>('month');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [sort, setSort] = useState<'revenue' | 'quantity' | 'margin'>('revenue');
    const [data, setData] = useState<{ vat?: VatReport; tender?: TenderReport; departments?: DepartmentReport; products?: ProductReport }>({});
    const [loading, setLoading] = useState(false);

    const range = useMemo(() => rangeFor(preset, customFrom, customTo), [preset, customFrom, customTo]);
    const rangeKey = `${range.from ?? ''}|${range.to ?? ''}`;

    useEffect(() => {
        if (!storeId || (preset === 'custom' && !customFrom && !customTo)) return;
        let cancelled = false;
        setLoading(true);
        const run = async () => {
            try {
                if (tab === 'vat') { const r = await ReportsAPI.vat(storeId, range); if (!cancelled) setData(d => ({ ...d, vat: r })); }
                if (tab === 'tender') { const r = await ReportsAPI.tender(storeId, range); if (!cancelled) setData(d => ({ ...d, tender: r })); }
                if (tab === 'departments') { const r = await ReportsAPI.departments(storeId, range); if (!cancelled) setData(d => ({ ...d, departments: r })); }
                if (tab === 'products') { const r = await ReportsAPI.products(storeId, range, sort); if (!cancelled) setData(d => ({ ...d, products: r })); }
            } catch (e) { if (!cancelled) toast.error(handleApiError(e)); } finally { if (!cancelled) setLoading(false); }
        };
        run();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storeId, tab, rangeKey, sort]);

    const exportCsv = () => {
        const stamp = new Date().toISOString().slice(0, 10);
        if (tab === 'vat' && data.vat) downloadCsv(`vat-report-${stamp}.csv`, ['VAT rate %', 'Gross sales', 'Refunds', 'Net takings', 'VAT', 'Net ex VAT'], data.vat.rows.map(r => [r.rate, r.grossSales, r.refunds, r.grossNet, r.vat, r.netExVat]));
        if (tab === 'tender' && data.tender) downloadCsv(`tender-report-${stamp}.csv`, ['Tender', 'Payments', 'Sales', 'Refunds', 'Net'], data.tender.rows.map(r => [r.method, r.payments, r.sales, r.refunds, r.net]));
        if (tab === 'departments' && data.departments) downloadCsv(`department-sales-${stamp}.csv`, ['Department', 'Quantity', 'Gross', 'Refunds', 'Net', 'Discounts', 'Share %'], data.departments.rows.map(r => [r.department, r.quantity, r.gross, r.refunds, r.net, r.discounts, r.share]));
        if (tab === 'products' && data.products) downloadCsv(`product-sales-${stamp}.csv`, ['Product', 'Barcode', 'Department', 'Quantity', 'Revenue', 'Est. margin', 'Margin %'], data.products.rows.map(r => [r.name, r.barcode, r.department, r.quantity, r.revenue, r.margin, r.marginPct]));
    };

    if (!storeId) return <p className="p-10 text-center text-gray-500">Pick a store first.</p>;
    const vat = data.vat, tender = data.tender, dept = data.departments, prod = data.products;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><BarChart3 className="w-6 h-6" />Reports</h1>
                    <p className="text-sm text-gray-600">Figures are net of refunds. Refunds count on the day they were made. Voided sales are left out.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={exportCsv}><Download className="w-4 h-4 mr-2" />Export CSV</Button>
                    <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Print</Button>
                </div>
            </div>
            <PeriodPicker preset={preset} customFrom={customFrom} customTo={customTo} onPreset={setPreset} onCustomFrom={setCustomFrom} onCustomTo={setCustomTo} />
            <div className="flex flex-wrap gap-1 border-b border-gray-200" role="tablist">
                {TABS.map(t => (
                    <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${tab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>{t.label}</button>
                ))}
            </div>
            {loading && <p className="text-sm text-gray-500" role="status">Loading…</p>}

            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                {tab === 'vat' && (
                    <table className="min-w-full text-sm">
                        <Head cols={[{ label: 'VAT rate' }, { label: 'Gross sales', right: true }, { label: 'Refunds', right: true }, { label: 'Net takings', right: true }, { label: 'VAT', right: true }, { label: 'Net ex VAT', right: true }]} />
                        <tbody className="divide-y divide-gray-100">
                            {vat && vat.rows.length === 0 && <Empty cols={6} />}
                            {vat?.rows.map(r => <tr key={r.rate}><td className={th}>{r.rate === 0 ? 'Zero rated (0%)' : `${r.rate}%`}</td><td className={num}>{money(r.grossSales)}</td><td className={num}>-{money(r.refunds)}</td><td className={num}>{money(r.grossNet)}</td><td className={num}>{money(r.vat)}</td><td className={num}>{money(r.netExVat)}</td></tr>)}
                            {vat && vat.rows.length > 0 && <TotalRow><td className={th}>Total</td><td className={num}>{money(vat.totals.grossSales)}</td><td className={num}>-{money(vat.totals.refunds)}</td><td className={num}>{money(vat.totals.grossNet)}</td><td className={num}>{money(vat.totals.vat)}</td><td className={num}>{money(vat.totals.netExVat)}</td></TotalRow>}
                        </tbody>
                    </table>
                )}
                {tab === 'tender' && (
                    <table className="min-w-full text-sm">
                        <Head cols={[{ label: 'Tender' }, { label: 'Payments', right: true }, { label: 'Sales', right: true }, { label: 'Refunds', right: true }, { label: 'Net', right: true }]} />
                        <tbody className="divide-y divide-gray-100">
                            {tender?.rows.map(r => <tr key={r.method}><td className={`${th} capitalize`}>{r.method}</td><td className={num}>{r.payments}</td><td className={num}>{money(r.sales)}</td><td className={num}>-{money(r.refunds)}</td><td className={num}>{money(r.net)}</td></tr>)}
                            {tender && <TotalRow><td className={th}>Total</td><td className={num} /><td className={num}>{money(tender.totals.sales)}</td><td className={num}>-{money(tender.totals.refunds)}</td><td className={num}>{money(tender.totals.net)}</td></TotalRow>}
                        </tbody>
                    </table>
                )}
                {tab === 'departments' && (
                    <table className="min-w-full text-sm">
                        <Head cols={[{ label: 'Department' }, { label: 'Quantity', right: true }, { label: 'Gross', right: true }, { label: 'Refunds', right: true }, { label: 'Net', right: true }, { label: 'Discounts', right: true }, { label: 'Share', right: true }]} />
                        <tbody className="divide-y divide-gray-100">
                            {dept && dept.rows.length === 0 && <Empty cols={7} />}
                            {dept?.rows.map(r => <tr key={r.department}><td className={`${th} font-medium`}>{r.department}</td><td className={num}>{r.quantity}</td><td className={num}>{money(r.gross)}</td><td className={num}>-{money(r.refunds)}</td><td className={num}>{money(r.net)}</td><td className={num}>{money(r.discounts)}</td><td className={num}>{r.share}%</td></tr>)}
                            {dept && dept.rows.length > 0 && <TotalRow><td className={th}>Total</td><td className={num}>{dept.totals.quantity}</td><td className={num}>{money(dept.totals.gross)}</td><td className={num}>-{money(dept.totals.refunds)}</td><td className={num}>{money(dept.totals.net)}</td><td className={num}>{money(dept.totals.discounts)}</td><td className={num} /></TotalRow>}
                        </tbody>
                    </table>
                )}
                {tab === 'products' && (
                    <>
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 text-sm">
                            <span className="text-gray-600">Top 20 by</span>
                            {(['revenue', 'quantity', 'margin'] as const).map(s => (
                                <button key={s} type="button" aria-pressed={sort === s} onClick={() => setSort(s)}
                                    className={`px-3 py-1 rounded-full border ${sort === s ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-100'}`}>{s === 'margin' ? 'Est. margin' : s[0].toUpperCase() + s.slice(1)}</button>
                            ))}
                            {prod && <span className="ml-auto text-gray-500">{prod.productsSold} products sold</span>}
                        </div>
                        <table className="min-w-full text-sm">
                            <Head cols={[{ label: 'Product' }, { label: 'Department' }, { label: 'Quantity', right: true }, { label: 'Revenue', right: true }, { label: 'Est. margin', right: true }, { label: 'Margin %', right: true }]} />
                            <tbody className="divide-y divide-gray-100">
                                {prod && prod.rows.length === 0 && <Empty cols={6} />}
                                {prod?.rows.map(r => <tr key={r.productId}><td className={th}><div className="font-medium">{r.name}</div><div className="text-xs text-gray-500 font-mono">{r.barcode}</div></td><td className={th}>{r.department}</td><td className={num}>{r.quantity}</td><td className={num}>{money(r.revenue)}</td><td className={num}>{r.margin === null ? '—' : money(r.margin)}</td><td className={num}>{r.marginPct === null ? '—' : `${r.marginPct}%`}</td></tr>)}
                            </tbody>
                        </table>
                        <p className="px-4 py-2 text-xs text-gray-500">Margin = net sales ex VAT minus quantity × the product's current cost price. Products with no cost price show a dash.</p>
                    </>
                )}
            </div>
        </div>
    );
};

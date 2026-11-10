import { useCallback, useEffect, useState } from 'react';
import { Boxes, ClipboardCheck, History as HistoryIcon, PackagePlus, SlidersHorizontal, LayoutDashboard, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../components/Button';
import Pagination from '../components/Pagination';
import { ProductPicker } from '../components/stock/ProductPicker';
import { useAuth } from '../hooks/useAuth';
import { handleApiError } from '../api/handleApiError';
import { money } from '../utils/money';
import { ProductsAPI } from '../features/products/productsAPI';
import { StockAPI } from '../features/stock/stockAPI';
import { MOVEMENT_LABELS, StockMovement, StockMovementType, StockSummary, StocktakeResult } from '../features/stock/types';
import type { DepartmentCount, Product } from '../features/products/types';

type Tab = 'overview' | 'receive' | 'adjust' | 'stocktake' | 'history';
const TABS: { id: Tab; label: string; icon: typeof Boxes }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'receive', label: 'Receive stock', icon: PackagePlus },
    { id: 'adjust', label: 'Adjust / waste', icon: SlidersHorizontal },
    { id: 'stocktake', label: 'Stocktake', icon: ClipboardCheck },
    { id: 'history', label: 'History', icon: HistoryIcon },
];

const input = 'px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600';
const Tile = ({ label, value, tone }: { label: string; value: string | number; tone?: 'bad' | 'warn' }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
        <div className={`text-2xl font-bold tabular-nums ${tone === 'bad' ? 'text-red-700' : tone === 'warn' ? 'text-amber-700' : 'text-gray-900'}`}>{value}</div>
    </div>
);

export const Stock = () => {
    const { user } = useAuth();
    const storeId = localStorage.getItem('selectedRestaurantId') || user?.restaurantId || user?.restaurant?.id || '';
    const [tab, setTab] = useState<Tab>('overview');
    const [version, setVersion] = useState(0); // bump to refresh overview/history after a change
    const changed = () => setVersion(v => v + 1);

    if (!storeId) return <p className="p-10 text-center text-gray-500">Pick a store first.</p>;
    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Boxes className="w-6 h-6" />Stock</h1>
                <p className="text-sm text-gray-600">Receive deliveries, write off waste, count the shelves. Every change is recorded.</p>
            </div>
            <div className="flex flex-wrap gap-1 border-b border-gray-200" role="tablist">
                {TABS.map(t => (
                    <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${tab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
                        <t.icon className="w-4 h-4" />{t.label}
                    </button>
                ))}
            </div>
            {tab === 'overview' && <Overview storeId={storeId} version={version} />}
            {tab === 'receive' && <Receive storeId={storeId} onDone={changed} />}
            {tab === 'adjust' && <Adjust storeId={storeId} onDone={changed} />}
            {tab === 'stocktake' && <Stocktake storeId={storeId} onDone={changed} />}
            {tab === 'history' && <HistoryTab storeId={storeId} version={version} />}
        </div>
    );
};

function Overview({ storeId, version }: { storeId: string; version: number }) {
    const [s, setS] = useState<StockSummary | null>(null);
    const [low, setLow] = useState<Product[]>([]);
    useEffect(() => {
        StockAPI.summary(storeId).then(setS).catch(e => toast.error(handleApiError(e)));
        ProductsAPI.list({ storeId, lowStock: true, status: 'active', limit: 50 }).then(r => setLow(r.data)).catch(e => toast.error(handleApiError(e)));
    }, [storeId, version]);
    if (!s) return <p className="py-10 text-center text-gray-500" role="status">Loading…</p>;
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Tile label="Products" value={s.products} />
                <Tile label="Low stock" value={s.lowStock} tone={s.lowStock ? 'warn' : undefined} />
                <Tile label="Out of stock" value={s.outOfStock} tone={s.outOfStock ? 'bad' : undefined} />
                <Tile label="Negative stock" value={s.negativeStock} tone={s.negativeStock ? 'bad' : undefined} />
                <Tile label="Stock value (cost)" value={money(s.costValue)} />
                <Tile label="Stock value (retail)" value={money(s.retailValue)} />
                <Tile label="Written off, 30 days" value={money(s.writtenOff30Days)} />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                <div className="px-4 py-3 font-semibold text-gray-900 border-b border-gray-100">Needs reordering ({low.length})</div>
                {low.length === 0 ? <p className="p-6 text-center text-gray-500">Everything is above its reorder level.</p> : (
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                            <tr><th className="px-4 py-2">Product</th><th className="px-4 py-2">Department</th><th className="px-4 py-2 text-right">In stock</th><th className="px-4 py-2 text-right">Reorder level</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {low.map(p => (
                                <tr key={p.id}>
                                    <td className="px-4 py-2"><div className="font-medium">{p.name}</div><div className="text-xs text-gray-500 font-mono">{p.barcode}</div></td>
                                    <td className="px-4 py-2">{p.department}</td>
                                    <td className={`px-4 py-2 text-right tabular-nums font-semibold ${p.stockQuantity <= 0 ? 'text-red-700' : 'text-amber-700'}`}>{p.stockQuantity}</td>
                                    <td className="px-4 py-2 text-right tabular-nums">{p.reorderLevel}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

interface ReceiptLine { product: Product; quantity: string; cost: string }

function Receive({ storeId, onDone }: { storeId: string; onDone: () => void }) {
    const [lines, setLines] = useState<ReceiptLine[]>([]);
    const [supplier, setSupplier] = useState('');
    const [reference, setReference] = useState('');
    const [busy, setBusy] = useState(false);

    const add = (p: Product) => setLines(prev => (prev.some(l => l.product.id === p.id) ? prev : [...prev, { product: p, quantity: '', cost: p.costPrice != null ? String(p.costPrice) : '' }]));
    const set = (i: number, patch: Partial<ReceiptLine>) => setLines(prev => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
    const valid = lines.length > 0 && lines.every(l => Number(l.quantity) > 0);

    const submit = async () => {
        setBusy(true);
        try {
            const r = await StockAPI.receive(storeId, {
                supplier: supplier.trim() || undefined,
                reference: reference.trim() || undefined,
                lines: lines.map(l => ({ productId: l.product.id, quantity: Number(l.quantity), costPrice: l.cost !== '' ? Number(l.cost) : undefined })),
            });
            toast.success(`Delivery ${r.reference} booked in: ${r.units} units, cost ${money(r.cost)}`);
            setLines([]); setSupplier(''); setReference('');
            onDone();
        } catch (e) { toast.error(handleApiError(e)); } finally { setBusy(false); }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm font-medium text-gray-700">Supplier (optional)<input value={supplier} onChange={e => setSupplier(e.target.value)} maxLength={100} className={`mt-1 w-full ${input}`} /></label>
                <label className="text-sm font-medium text-gray-700">Delivery note / invoice no.<input value={reference} onChange={e => setReference(e.target.value)} maxLength={60} className={`mt-1 w-full ${input}`} /></label>
            </div>
            <ProductPicker storeId={storeId} onPick={add} placeholder="Scan or search a product to add to the delivery…" />
            {lines.length === 0 ? <p className="py-6 text-center text-gray-500">Add the products on the delivery note.</p> : (
                <table className="min-w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wide text-gray-500"><tr><th className="py-2">Product</th><th className="py-2 w-28">Qty received</th><th className="py-2 w-32">Unit cost (£)</th><th className="w-10" /></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                        {lines.map((l, i) => (
                            <tr key={l.product.id}>
                                <td className="py-2"><div className="font-medium">{l.product.name}</div><div className="text-xs text-gray-500">Now {l.product.stockQuantity} in stock</div></td>
                                <td className="py-2"><input type="number" min="0" step={l.product.unitType === 'weight' ? '0.001' : '1'} value={l.quantity} onChange={e => set(i, { quantity: e.target.value })} aria-label={`Quantity of ${l.product.name}`} className={`w-24 ${input}`} /></td>
                                <td className="py-2"><input type="number" min="0" step="0.01" value={l.cost} onChange={e => set(i, { cost: e.target.value })} aria-label={`Cost of ${l.product.name}`} className={`w-28 ${input}`} /></td>
                                <td className="py-2"><button type="button" aria-label={`Remove ${l.product.name}`} onClick={() => setLines(prev => prev.filter((_, idx) => idx !== i))} className="p-2 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            <div className="flex justify-end"><Button disabled={!valid || busy} onClick={submit}>{busy ? 'Booking in…' : 'Book in delivery'}</Button></div>
        </div>
    );
}

const ADJUST_TYPES = [
    { id: 'waste', label: 'Waste', hint: 'Units thrown away' },
    { id: 'damaged', label: 'Damaged', hint: 'Units damaged and unsellable' },
    { id: 'expired', label: 'Expired', hint: 'Units past their date' },
    { id: 'adjustment', label: 'Correction', hint: 'Signed change: -3 removes, 5 adds' },
] as const;

function Adjust({ storeId, onDone }: { storeId: string; onDone: () => void }) {
    const [product, setProduct] = useState<Product | null>(null);
    const [type, setType] = useState<(typeof ADJUST_TYPES)[number]['id']>('waste');
    const [qty, setQty] = useState('');
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const n = Number(qty);
    const valid = !!product && qty !== '' && n !== 0 && (type === 'adjustment' || n > 0) && !!reason.trim();

    const submit = async () => {
        if (!product) return;
        setBusy(true);
        try {
            const r = await StockAPI.adjust(storeId, { productId: product.id, type, quantity: n, reason: reason.trim() });
            toast.success(`${r.name}: now ${r.stockQuantity} in stock`);
            setProduct(null); setQty(''); setReason('');
            onDone();
        } catch (e) { toast.error(handleApiError(e)); } finally { setBusy(false); }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 max-w-xl">
            {product ? (
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <div><div className="font-medium">{product.name}</div><div className="text-xs text-gray-500">{product.stockQuantity} in stock</div></div>
                    <button type="button" className="text-sm text-blue-700" onClick={() => setProduct(null)}>Change</button>
                </div>
            ) : <ProductPicker storeId={storeId} onPick={setProduct} />}
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Type">
                {ADJUST_TYPES.map(t => (
                    <button key={t.id} type="button" role="radio" aria-checked={type === t.id} onClick={() => setType(t.id)}
                        className={`py-2 rounded-lg border text-sm font-semibold ${type === t.id ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-100'}`}>{t.label}</button>
                ))}
            </div>
            <p className="text-sm text-gray-600">{ADJUST_TYPES.find(t => t.id === type)!.hint}</p>
            <label className="block text-sm font-medium text-gray-700">Quantity
                <input type="number" step={product?.unitType === 'weight' ? '0.001' : '1'} value={qty} onChange={e => setQty(e.target.value)} className={`mt-1 w-full ${input}`} /></label>
            <label className="block text-sm font-medium text-gray-700">Reason
                <input value={reason} onChange={e => setReason(e.target.value)} maxLength={150} placeholder="e.g. Dropped in aisle 4" className={`mt-1 w-full ${input}`} /></label>
            <div className="flex justify-end"><Button disabled={!valid || busy} onClick={submit}>{busy ? 'Saving…' : 'Record'}</Button></div>
        </div>
    );
}

function Stocktake({ storeId, onDone }: { storeId: string; onDone: () => void }) {
    const [departments, setDepartments] = useState<DepartmentCount[]>([]);
    const [dept, setDept] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [counts, setCounts] = useState<Record<string, string>>({});
    const [result, setResult] = useState<StocktakeResult | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => { ProductsAPI.departments(storeId).then(setDepartments).catch(e => toast.error(handleApiError(e))); }, [storeId]);
    useEffect(() => {
        if (!dept) { setProducts([]); return; }
        ProductsAPI.list({ storeId, department: dept, status: 'active', limit: 200 }).then(r => { setProducts(r.data); setCounts({}); setResult(null); }).catch(e => toast.error(handleApiError(e)));
    }, [storeId, dept]);

    const counted = products.filter(p => counts[p.id] !== undefined && counts[p.id] !== '');
    const submit = async () => {
        setBusy(true);
        try {
            const r = await StockAPI.stocktake(storeId, { name: `Stocktake: ${dept}`, lines: counted.map(p => ({ productId: p.id, counted: Number(counts[p.id]) })) });
            setResult(r);
            toast.success(r.changed ? `${r.changed} product${r.changed > 1 ? 's' : ''} corrected` : 'Counts all matched');
            const fresh = await ProductsAPI.list({ storeId, department: dept, status: 'active', limit: 200 });
            setProducts(fresh.data); setCounts({});
            onDone();
        } catch (e) { toast.error(handleApiError(e)); } finally { setBusy(false); }
    };

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-end gap-3">
                <label className="text-sm font-medium text-gray-700">Department to count
                    <select value={dept} onChange={e => setDept(e.target.value)} className={`mt-1 block bg-white ${input}`}>
                        <option value="">Choose…</option>
                        {departments.map(d => <option key={d.department} value={d.department}>{d.department} ({d.count})</option>)}
                    </select></label>
                <p className="text-sm text-gray-600 flex-1 min-w-[220px]">Count what is on the shelf and type it in. Leave a product blank to skip it. Submitting replaces the system figure with your count.</p>
                <Button disabled={!counted.length || busy} onClick={submit}>{busy ? 'Saving…' : `Submit count (${counted.length})`}</Button>
            </div>

            {result && (
                <div role="status" className="bg-white rounded-xl border border-gray-200 p-4 text-sm space-y-2">
                    <div className="font-semibold text-gray-900">Stocktake {result.reference}</div>
                    <div>{result.counted} counted · {result.changed} corrected · {result.unitsShort} units short · {result.unitsOver} units over · value difference <b className={result.valueVariance < 0 ? 'text-red-700' : ''}>{money(result.valueVariance)}</b></div>
                    {result.lines.map(l => <div key={l.productId} className="text-gray-700">{l.name}: system {l.system}, counted {l.counted} ({l.variance > 0 ? '+' : ''}{l.variance})</div>)}
                </div>
            )}

            {products.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                            <tr><th className="px-4 py-2">Product</th><th className="px-4 py-2 text-right">System</th><th className="px-4 py-2 w-32">Counted</th><th className="px-4 py-2 text-right">Difference</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {products.map(p => {
                                const c = counts[p.id];
                                const diff = c !== undefined && c !== '' ? Number(c) - p.stockQuantity : null;
                                return (
                                    <tr key={p.id}>
                                        <td className="px-4 py-2"><div className="font-medium">{p.name}</div><div className="text-xs text-gray-500 font-mono">{p.barcode}</div></td>
                                        <td className="px-4 py-2 text-right tabular-nums">{p.stockQuantity}</td>
                                        <td className="px-4 py-2"><input type="number" min="0" step={p.unitType === 'weight' ? '0.001' : '1'} value={c ?? ''} aria-label={`Counted ${p.name}`}
                                            onChange={e => setCounts(prev => ({ ...prev, [p.id]: e.target.value }))} className={`w-28 ${input}`} /></td>
                                        <td className={`px-4 py-2 text-right tabular-nums font-semibold ${diff && diff < 0 ? 'text-red-700' : diff && diff > 0 ? 'text-green-700' : 'text-gray-400'}`}>{diff === null ? '—' : diff > 0 ? `+${diff}` : diff}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function HistoryTab({ storeId, version }: { storeId: string; version: number }) {
    const [rows, setRows] = useState<StockMovement[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [type, setType] = useState<StockMovementType | ''>('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        StockAPI.movements(storeId, { page, limit, type: type || undefined, search: search.trim() || undefined })
            .then(r => { setRows(r.data); setTotal(r.total); })
            .catch(e => toast.error(handleApiError(e)))
            .finally(() => setLoading(false));
    }, [storeId, page, limit, type, search]);
    useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load, version]);

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Product, barcode or reference" aria-label="Search history" className={`min-w-[240px] ${input}`} />
                <select value={type} onChange={e => { setType(e.target.value as StockMovementType | ''); setPage(1); }} aria-label="Movement type" className={`bg-white ${input}`}>
                    <option value="">All types</option>
                    {(Object.keys(MOVEMENT_LABELS) as StockMovementType[]).map(t => <option key={t} value={t}>{MOVEMENT_LABELS[t]}</option>)}
                </select>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                        <tr><th className="px-4 py-2">When</th><th className="px-4 py-2">Product</th><th className="px-4 py-2">Type</th><th className="px-4 py-2 text-right">Change</th><th className="px-4 py-2 text-right">After</th><th className="px-4 py-2">Reference / reason</th><th className="px-4 py-2">By</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">{loading ? 'Loading…' : 'No stock movements yet.'}</td></tr>}
                        {rows.map(m => (
                            <tr key={m.id}>
                                <td className="px-4 py-2 whitespace-nowrap">{new Date(m.createdAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                                <td className="px-4 py-2">{m.product?.name ?? '—'}</td>
                                <td className="px-4 py-2">{MOVEMENT_LABELS[m.type]}</td>
                                <td className={`px-4 py-2 text-right tabular-nums font-semibold ${m.quantity < 0 ? 'text-red-700' : 'text-green-700'}`}>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                                <td className="px-4 py-2 text-right tabular-nums">{m.quantityAfter}</td>
                                <td className="px-4 py-2 text-gray-600">{[m.reference, m.supplier, m.reason].filter(Boolean).join(' · ') || '—'}</td>
                                <td className="px-4 py-2 text-gray-600">{m.userName ?? '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <Pagination page={String(page)} limit={String(limit)} total={total} handleChangePage={(_, p) => setPage(p + 1)} handleChangeRowsPerPage={e => { setLimit(Number(e.target.value)); setPage(1); }} />
            </div>
        </div>
    );
}

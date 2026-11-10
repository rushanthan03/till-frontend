import { FormEvent, useCallback, useEffect, useState } from 'react';
import { BadgePercent, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ProductPicker } from '../components/stock/ProductPicker';
import { useAuth } from '../hooks/useAuth';
import { handleApiError } from '../api/handleApiError';
import { money } from '../utils/money';
import { ProductsAPI } from '../features/products/productsAPI';
import { PromotionsAPI } from '../features/promotions/promotionsAPI';
import type { DepartmentCount, Product } from '../features/products/types';
import type { Promotion, PromotionType, PromotionScope } from '../features/promotions/types';

const field = 'mt-1 w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600';
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB') : '—');

const describe = (p: Promotion) =>
    p.type === 'percent_off' ? `${p.percentOff}% off` : `${p.buyQty} for ${money(p.bundlePrice)}`;

/** Running = switched on and inside its dates. */
const status = (p: Promotion): { label: string; tone: string } => {
    if (!p.isActive) return { label: 'Off', tone: 'bg-gray-100 text-gray-600' };
    const now = Date.now();
    if (p.startsAt && new Date(p.startsAt).getTime() > now) return { label: 'Scheduled', tone: 'bg-blue-50 text-blue-700' };
    if (p.endsAt && new Date(p.endsAt).getTime() < now) return { label: 'Ended', tone: 'bg-gray-100 text-gray-600' };
    return { label: 'Running', tone: 'bg-green-50 text-green-700' };
};

export const PromotionsPage = () => {
    const { user } = useAuth();
    const storeId = localStorage.getItem('selectedRestaurantId') || user?.restaurantId || user?.restaurant?.id || '';
    const [promos, setPromos] = useState<Promotion[]>([]);
    const [products, setProducts] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    const load = useCallback(() => {
        if (!storeId) return;
        setLoading(true);
        PromotionsAPI.list(storeId).then(setPromos).catch(e => toast.error(handleApiError(e))).finally(() => setLoading(false));
    }, [storeId]);
    useEffect(() => { load(); }, [load]);

    // names for product-scoped offers
    useEffect(() => {
        const missing = promos.filter(p => p.productId && !products[p.productId]);
        if (!missing.length || !storeId) return;
        ProductsAPI.list({ storeId, status: 'all', limit: 200 }).then(r => setProducts(Object.fromEntries(r.data.map(p => [p.id, p.name])))).catch(() => undefined);
    }, [promos, storeId, products]);

    const toggle = async (p: Promotion) => {
        try { await PromotionsAPI.update(p.id, storeId, { isActive: !p.isActive }); load(); } catch (e) { toast.error(handleApiError(e)); }
    };

    if (!storeId) return <p className="p-10 text-center text-gray-500">Pick a store first.</p>;
    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><BadgePercent className="w-6 h-6" />Promotions</h1>
                    <p className="text-sm text-gray-600">Offers apply automatically at the till while they are on and in date. One offer per item: the best one wins.</p>
                </div>
                <Button onClick={() => setCreating(true)}><Plus className="w-4 h-4 mr-1.5" />New promotion</Button>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                        <tr><th className="px-4 py-2">Offer</th><th className="px-4 py-2">Deal</th><th className="px-4 py-2">Applies to</th><th className="px-4 py-2">Dates</th><th className="px-4 py-2">Status</th><th className="px-4 py-2" /></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {promos.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">{loading ? 'Loading…' : 'No promotions yet.'}</td></tr>}
                        {promos.map(p => {
                            const s = status(p);
                            return (
                                <tr key={p.id}>
                                    <td className="px-4 py-2 font-medium">{p.name}</td>
                                    <td className="px-4 py-2">{describe(p)}</td>
                                    <td className="px-4 py-2">{p.scope === 'department' ? `Department: ${p.department}` : products[p.productId ?? ''] ?? 'Product'}</td>
                                    <td className="px-4 py-2 whitespace-nowrap">{fmtDate(p.startsAt)} → {fmtDate(p.endsAt)}</td>
                                    <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.tone}`}>{s.label}</span></td>
                                    <td className="px-4 py-2 text-right"><button type="button" className="text-blue-700 hover:underline" onClick={() => toggle(p)}>{p.isActive ? 'Switch off' : 'Switch on'}</button></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {creating && <CreateModal storeId={storeId} onClose={() => setCreating(false)} onCreated={() => { setCreating(false); load(); }} />}
        </div>
    );
};

function CreateModal({ storeId, onClose, onCreated }: { storeId: string; onClose: () => void; onCreated: () => void }) {
    const [name, setName] = useState('');
    const [type, setType] = useState<PromotionType>('percent_off');
    const [scope, setScope] = useState<PromotionScope>('product');
    const [product, setProduct] = useState<Product | null>(null);
    const [departments, setDepartments] = useState<DepartmentCount[]>([]);
    const [department, setDepartment] = useState('');
    const [percent, setPercent] = useState('');
    const [buyQty, setBuyQty] = useState('3');
    const [bundle, setBundle] = useState('');
    const [startsAt, setStartsAt] = useState('');
    const [endsAt, setEndsAt] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => { ProductsAPI.departments(storeId).then(setDepartments).catch(() => undefined); }, [storeId]);

    const target = scope === 'product' ? !!product : !!department;
    const valid = !!name.trim() && target && (type === 'percent_off' ? Number(percent) > 0 && Number(percent) <= 100 : Number(buyQty) >= 2 && bundle !== '' && Number(bundle) >= 0);

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setBusy(true);
        try {
            await PromotionsAPI.create(storeId, {
                name: name.trim(), type, scope,
                productId: scope === 'product' ? product!.id : undefined,
                department: scope === 'department' ? department : undefined,
                percentOff: type === 'percent_off' ? Number(percent) : undefined,
                buyQty: type === 'multibuy' ? Number(buyQty) : undefined,
                bundlePrice: type === 'multibuy' ? Number(bundle) : undefined,
                startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
                endsAt: endsAt ? new Date(`${endsAt}T23:59:59`).toISOString() : undefined,
            });
            toast.success('Promotion created');
            onCreated();
        } catch (err) { toast.error(handleApiError(err)); } finally { setBusy(false); }
    };

    const seg = (active: boolean) => `py-2 rounded-lg border text-sm font-semibold ${active ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-100'}`;
    return (
        <Modal isOpen onClose={onClose} title="New promotion" size="md">
            <form onSubmit={submit} className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Name (shown on the receipt)<input value={name} onChange={e => setName(e.target.value)} maxLength={100} placeholder="e.g. 3 for £5 Croissants" className={field} /></label>
                <div className="grid grid-cols-2 gap-2">
                    <button type="button" className={seg(type === 'percent_off')} onClick={() => setType('percent_off')}>% off</button>
                    <button type="button" className={seg(type === 'multibuy')} onClick={() => { setType('multibuy'); setScope('product'); }}>Multibuy (N for £X)</button>
                </div>
                {type === 'percent_off' ? (
                    <label className="block text-sm font-medium text-gray-700">Percentage off<input type="number" min="1" max="100" value={percent} onChange={e => setPercent(e.target.value)} className={field} /></label>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block text-sm font-medium text-gray-700">Buy quantity<input type="number" min="2" value={buyQty} onChange={e => setBuyQty(e.target.value)} className={field} /></label>
                        <label className="block text-sm font-medium text-gray-700">Bundle price (£)<input type="number" min="0" step="0.01" value={bundle} onChange={e => setBundle(e.target.value)} className={field} /></label>
                    </div>
                )}
                {type === 'percent_off' && (
                    <div className="grid grid-cols-2 gap-2">
                        <button type="button" className={seg(scope === 'product')} onClick={() => setScope('product')}>One product</button>
                        <button type="button" className={seg(scope === 'department')} onClick={() => setScope('department')}>Whole department</button>
                    </div>
                )}
                {scope === 'product' ? (
                    product ? (
                        <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                            <div><div className="font-medium">{product.name}</div><div className="text-xs text-gray-500">Shelf price {money(product.price)}</div></div>
                            <button type="button" className="text-sm text-blue-700" onClick={() => setProduct(null)}>Change</button>
                        </div>
                    ) : <ProductPicker storeId={storeId} onPick={setProduct} />
                ) : (
                    <select value={department} onChange={e => setDepartment(e.target.value)} aria-label="Department" className={`${field} bg-white`}>
                        <option value="">Choose a department…</option>
                        {departments.map(d => <option key={d.department} value={d.department}>{d.department}</option>)}
                    </select>
                )}
                <div className="grid grid-cols-2 gap-3">
                    <label className="block text-sm font-medium text-gray-700">Starts (optional)<input type="date" value={startsAt} onChange={e => setStartsAt(e.target.value)} className={field} /></label>
                    <label className="block text-sm font-medium text-gray-700">Ends (optional)<input type="date" value={endsAt} min={startsAt || undefined} onChange={e => setEndsAt(e.target.value)} className={field} /></label>
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={!valid || busy}>{busy ? 'Saving…' : 'Create promotion'}</Button>
                </div>
            </form>
        </Modal>
    );
}

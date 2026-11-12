import { FormEvent, useCallback, useEffect, useState } from 'react';
import { BadgePercent, Pencil, Plus } from 'lucide-react';
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
import { describeDeal, type Promotion, type PromotionType, type PromotionScope } from '../features/promotions/types';

const field = 'mt-1 w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600';
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB') : '—');

/** yyyy-mm-dd in local time, for a date input. */
const toDateInput = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

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
    const [products, setProducts] = useState<Record<string, Product>>({});
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState<Promotion | null>(null);

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
        ProductsAPI.list({ storeId, status: 'all', limit: 200 }).then(r => setProducts(Object.fromEntries(r.data.map(p => [p.id, p])))).catch(() => undefined);
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
                    <p className="text-sm text-gray-600">Offers apply automatically at the till while they are on and in date. One offer per item: the best one wins. Changing an offer does not change past sales.</p>
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
                                    <td className="px-4 py-2">{describeDeal(p)}</td>
                                    <td className="px-4 py-2">{p.scope === 'department' ? `Department: ${p.department}` : products[p.productId ?? '']?.name ?? 'Product'}</td>
                                    <td className="px-4 py-2 whitespace-nowrap">{fmtDate(p.startsAt)} → {fmtDate(p.endsAt)}</td>
                                    <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.tone}`}>{s.label}</span></td>
                                    <td className="px-4 py-2 text-right whitespace-nowrap">
                                        <button type="button" className="text-blue-700 hover:underline inline-flex items-center gap-1 mr-4" onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}><Pencil className="w-3.5 h-3.5" />Edit</button>
                                        <button type="button" className="text-blue-700 hover:underline" onClick={() => toggle(p)}>{p.isActive ? 'Switch off' : 'Switch on'}</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {creating && <OfferModal storeId={storeId} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); load(); }} />}
            {editing && (
                <OfferModal
                    storeId={storeId}
                    offer={editing}
                    offerProduct={editing.productId ? products[editing.productId] ?? null : null}
                    onClose={() => setEditing(null)}
                    onSaved={() => { setEditing(null); load(); }}
                />
            )}
        </div>
    );
};

interface OfferModalProps {
    storeId: string;
    /** The offer being edited; leave out to create a new one. */
    offer?: Promotion;
    offerProduct?: Product | null;
    onClose: () => void;
    onSaved: () => void;
}

function OfferModal({ storeId, offer, offerProduct = null, onClose, onSaved }: OfferModalProps) {
    const [name, setName] = useState(offer?.name ?? '');
    const [type, setType] = useState<PromotionType>(offer?.type ?? 'percent_off');
    const [scope, setScope] = useState<PromotionScope>(offer?.scope ?? 'product');
    const [product, setProduct] = useState<Product | null>(offerProduct);
    /** The edited offer's product id, kept even when its details are not loaded; cleared by "Change". */
    const [keptProductId, setKeptProductId] = useState<string | null>(offer?.scope === 'product' ? offer.productId : null);
    const [departments, setDepartments] = useState<DepartmentCount[]>([]);
    const [department, setDepartment] = useState(offer?.department ?? '');
    const [percent, setPercent] = useState(offer?.percentOff != null ? String(offer.percentOff) : '');
    const [buyQty, setBuyQty] = useState(offer?.buyQty != null ? String(offer.buyQty) : '3');
    const [freeQty, setFreeQty] = useState(offer?.freeQty != null ? String(offer.freeQty) : '1');
    const [bundle, setBundle] = useState(offer?.bundlePrice != null ? String(offer.bundlePrice) : '');
    const [startsAt, setStartsAt] = useState(toDateInput(offer?.startsAt ?? null));
    const [endsAt, setEndsAt] = useState(toDateInput(offer?.endsAt ?? null));
    const [busy, setBusy] = useState(false);

    useEffect(() => { ProductsAPI.departments(storeId).then(setDepartments).catch(() => undefined); }, [storeId]);

    const productId = product?.id ?? keptProductId;
    const target = scope === 'product' ? !!productId : !!department;
    const dealValid =
        type === 'percent_off' ? Number(percent) > 0 && Number(percent) <= 100
            : type === 'multibuy' ? Number(buyQty) >= 2 && bundle !== '' && Number(bundle) >= 0
                : Number(buyQty) >= 1 && Number(freeQty) >= 1;
    const valid = !!name.trim() && target && dealValid;

    // What the customer sees, so staff can check the deal reads right.
    const preview = dealValid ? describeDeal({ type, percentOff: Number(percent), buyQty: Number(buyQty), freeQty: Number(freeQty), bundlePrice: Number(bundle) }) : '';
    const shelf = product && type !== 'percent_off' ? (type === 'multibuy' ? product.price * Number(buyQty || 0) : product.price * (Number(buyQty || 0) + Number(freeQty || 0))) : null;

    const pickType = (t: PromotionType) => {
        setType(t);
        if (t === 'multibuy') setScope('product');
        if (t !== 'percent_off' && product && product.unitType !== 'each') { setProduct(null); setKeptProductId(null); }
    };

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setBusy(true);
        const body = {
            name: name.trim(), type, scope,
            productId: scope === 'product' ? productId! : undefined,
            department: scope === 'department' ? department : undefined,
            percentOff: type === 'percent_off' ? Number(percent) : undefined,
            buyQty: type !== 'percent_off' ? Number(buyQty) : undefined,
            freeQty: type === 'buy_get_free' ? Number(freeQty) : undefined,
            bundlePrice: type === 'multibuy' ? Number(bundle) : undefined,
        };
        try {
            if (offer) {
                await PromotionsAPI.update(offer.id, storeId, {
                    ...body,
                    startsAt: startsAt ? new Date(startsAt).toISOString() : null,
                    endsAt: endsAt ? new Date(`${endsAt}T23:59:59`).toISOString() : null,
                });
                toast.success('Promotion saved');
            } else {
                await PromotionsAPI.create(storeId, {
                    ...body,
                    startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
                    endsAt: endsAt ? new Date(`${endsAt}T23:59:59`).toISOString() : undefined,
                });
                toast.success('Promotion created');
            }
            onSaved();
        } catch (err) { toast.error(handleApiError(err)); } finally { setBusy(false); }
    };

    const seg = (active: boolean) => `py-2 px-1 rounded-lg border text-sm font-semibold ${active ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-100'}`;
    return (
        <Modal isOpen onClose={onClose} title={offer ? `Edit ${offer.name}` : 'New promotion'} size="md">
            <form onSubmit={submit} className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Name (shown on the receipt)<input value={name} onChange={e => setName(e.target.value)} maxLength={100} placeholder="e.g. 3 for £5 Croissants" className={field} /></label>
                <div className="grid grid-cols-3 gap-2" role="group" aria-label="Kind of offer">
                    <button type="button" aria-pressed={type === 'percent_off'} className={seg(type === 'percent_off')} onClick={() => pickType('percent_off')}>% off</button>
                    <button type="button" aria-pressed={type === 'multibuy'} className={seg(type === 'multibuy')} onClick={() => pickType('multibuy')}>N for £X</button>
                    <button type="button" aria-pressed={type === 'buy_get_free'} className={seg(type === 'buy_get_free')} onClick={() => pickType('buy_get_free')}>Buy X get Y free</button>
                </div>
                {type === 'percent_off' && (
                    <label className="block text-sm font-medium text-gray-700">Percentage off<input type="number" min="1" max="100" value={percent} onChange={e => setPercent(e.target.value)} className={field} /></label>
                )}
                {type === 'multibuy' && (
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block text-sm font-medium text-gray-700">Buy quantity<input type="number" min="2" value={buyQty} onChange={e => setBuyQty(e.target.value)} className={field} /></label>
                        <label className="block text-sm font-medium text-gray-700">Bundle price (£)<input type="number" min="0" step="0.01" value={bundle} onChange={e => setBundle(e.target.value)} className={field} /></label>
                    </div>
                )}
                {type === 'buy_get_free' && (
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block text-sm font-medium text-gray-700">Customer buys<input type="number" min="1" value={buyQty} onChange={e => setBuyQty(e.target.value)} className={field} /></label>
                        <label className="block text-sm font-medium text-gray-700">Gets free<input type="number" min="1" value={freeQty} onChange={e => setFreeQty(e.target.value)} className={field} /></label>
                    </div>
                )}
                {type !== 'multibuy' && (
                    <div className="grid grid-cols-2 gap-2">
                        <button type="button" aria-pressed={scope === 'product'} className={seg(scope === 'product')} onClick={() => setScope('product')}>One product</button>
                        <button type="button" aria-pressed={scope === 'department'} className={seg(scope === 'department')} onClick={() => setScope('department')}>Whole department</button>
                    </div>
                )}
                {scope === 'product' ? (
                    productId ? (
                        <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                            <div><div className="font-medium">{product?.name ?? 'Current product'}</div>{product && <div className="text-xs text-gray-500">Shelf price {money(product.price)}</div>}</div>
                            <button type="button" className="text-sm text-blue-700" onClick={() => { setProduct(null); setKeptProductId(null); }}>Change</button>
                        </div>
                    ) : <ProductPicker storeId={storeId} onPick={setProduct} />
                ) : (
                    <select value={department} onChange={e => setDepartment(e.target.value)} aria-label="Department" className={`${field} bg-white`}>
                        <option value="">Choose a department…</option>
                        {departments.map(d => <option key={d.department} value={d.department}>{d.department}</option>)}
                    </select>
                )}
                {type === 'buy_get_free' && scope === 'department' && (
                    <p className="text-xs text-gray-500">Counts each product on its own: buying 2 of one product and 1 of another does not make a group.</p>
                )}
                {preview && (
                    <p className="text-sm rounded-lg bg-blue-50 text-blue-900 px-3 py-2">
                        {preview}
                        {shelf !== null && Number.isFinite(shelf) && shelf > 0 && (type === 'buy_get_free'
                            ? ` — ${Number(buyQty) + Number(freeQty)} items for ${money(product!.price * Number(buyQty))} instead of ${money(shelf)}`
                            : ` — instead of ${money(shelf)}`)}
                    </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                    <label className="block text-sm font-medium text-gray-700">Starts (optional)<input type="date" value={startsAt} onChange={e => setStartsAt(e.target.value)} className={field} /></label>
                    <label className="block text-sm font-medium text-gray-700">Ends (optional)<input type="date" value={endsAt} min={startsAt || undefined} onChange={e => setEndsAt(e.target.value)} className={field} /></label>
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={!valid || busy}>{busy ? 'Saving…' : offer ? 'Save changes' : 'Create promotion'}</Button>
                </div>
            </form>
        </Modal>
    );
}

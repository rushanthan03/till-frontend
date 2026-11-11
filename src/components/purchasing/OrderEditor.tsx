import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Sparkles, Trash2 } from 'lucide-react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { ProductPicker } from '../stock/ProductPicker';
import { handleApiError } from '../../api/handleApiError';
import { money } from '../../utils/money';
import { PurchaseOrdersAPI } from '../../features/purchasing/purchasingAPI';
import type { PurchaseOrder, Supplier } from '../../features/purchasing/types';
import type { Product } from '../../features/products/types';
import { qty as fmtQty } from './poStatus';

const field = 'w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600';

interface Line {
    productId: string;
    name: string;
    barcode: string;
    quantity: string;
    unitCost: string;
    stock: number | null;
    whole: boolean;
}

interface Props {
    isOpen: boolean;
    storeId: string;
    suppliers: Supplier[];
    /** A draft to change; omit for a new order. */
    order?: PurchaseOrder | null;
    /** Pre-selected supplier for a new order. */
    supplierId?: string;
    onClose: () => void;
    onSaved: (o: PurchaseOrder) => void;
}

export function OrderEditor({ isOpen, storeId, suppliers, order, supplierId: initialSupplier, onClose, onSaved }: Props) {
    const [supplierId, setSupplierId] = useState('');
    const [expectedDate, setExpectedDate] = useState('');
    const [notes, setNotes] = useState('');
    const [lines, setLines] = useState<Line[]>([]);
    const [onlySupplier, setOnlySupplier] = useState(true);
    const [suggesting, setSuggesting] = useState(false);
    const [saving, setSaving] = useState<'draft' | 'order' | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setSupplierId(order?.supplierId ?? initialSupplier ?? '');
        setExpectedDate(order?.expectedDate ?? '');
        setNotes(order?.notes ?? '');
        setLines((order?.lines ?? []).map(l => ({
            productId: l.productId, name: l.productName, barcode: l.barcode, quantity: String(l.quantity), unitCost: String(l.unitCost),
            stock: l.stockQuantity ?? null, whole: (l.unitType ?? 'each') === 'each',
        })));
    }, [isOpen, order, initialSupplier]);

    const supplier = suppliers.find(s => s.id === supplierId);
    const total = useMemo(() => lines.reduce((a, l) => a + (Number(l.quantity) || 0) * (Number(l.unitCost) || 0), 0), [lines]);

    const addProduct = (p: Product) => {
        if (lines.some(l => l.productId === p.id)) { toast.info(`${p.name} is already on the order`); return; }
        setLines(prev => [...prev, {
            productId: p.id, name: p.name, barcode: p.barcode, quantity: '1', unitCost: String(p.costPrice ?? 0),
            stock: p.stockQuantity, whole: p.unitType === 'each',
        }]);
    };

    const addSuggestions = async () => {
        setSuggesting(true);
        try {
            const list = await PurchaseOrdersAPI.suggestions(storeId, onlySupplier && supplierId ? supplierId : undefined);
            const fresh = list.filter(s => !lines.some(l => l.productId === s.productId));
            if (!fresh.length) { toast.info(list.length ? 'Those products are already on the order' : 'Nothing is below its reorder level'); return; }
            setLines(prev => [...prev, ...fresh.map(s => ({
                productId: s.productId, name: s.name, barcode: s.barcode, quantity: String(s.suggested), unitCost: String(s.unitCost),
                stock: s.stockQuantity, whole: s.unitType === 'each',
            }))]);
            toast.success(`Added ${fresh.length} low-stock product${fresh.length > 1 ? 's' : ''}`);
        } catch (error) {
            toast.error(handleApiError(error));
        } finally {
            setSuggesting(false);
        }
    };

    const setLine = (i: number, k: 'quantity' | 'unitCost', v: string) => setLines(prev => prev.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)));

    const save = async (submit: boolean) => {
        if (!supplierId) { toast.error('Choose a supplier'); return; }
        if (!lines.length) { toast.error('Add at least one product'); return; }
        const bad = lines.find(l => !(Number(l.quantity) > 0) || (l.whole && !Number.isInteger(Number(l.quantity))) || Number(l.unitCost) < 0 || l.unitCost === '');
        if (bad) { toast.error(`Check the quantity and cost for ${bad.name}`); return; }
        const body = {
            supplierId, expectedDate: expectedDate || undefined, notes: notes.trim() || undefined,
            lines: lines.map(l => ({ productId: l.productId, quantity: Number(l.quantity), unitCost: Number(l.unitCost) })),
        };
        setSaving(submit ? 'order' : 'draft');
        try {
            let saved: PurchaseOrder;
            if (order) {
                saved = await PurchaseOrdersAPI.update(order.id, storeId, body);
                if (submit) saved = await PurchaseOrdersAPI.submit(order.id, storeId);
            } else {
                saved = await PurchaseOrdersAPI.create(storeId, { ...body, submit });
            }
            toast.success(submit ? `${saved.number} marked as ordered` : `${saved.number} saved as a draft`);
            onSaved(saved);
        } catch (error) {
            toast.error(handleApiError(error));
        } finally {
            setSaving(null);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" title={order ? `Edit ${order.number}` : 'New purchase order'}
            description="Costs are per unit, excluding VAT. A draft can be changed until it is marked as ordered.">
            <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                    <label className="text-sm font-medium text-gray-700">Supplier *
                        <select className={`${field} mt-1`} value={supplierId} onChange={(e) => setSupplierId(e.target.value)} aria-label="Supplier">
                            <option value="">Choose…</option>
                            {suppliers.filter(s => s.isActive || s.id === supplierId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </label>
                    <label className="text-sm font-medium text-gray-700">Delivery expected
                        <input type="date" className={`${field} mt-1`} value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} aria-label="Delivery expected" />
                        {!expectedDate && supplier?.leadTimeDays != null && <span className="text-xs text-gray-500 font-normal">Blank = {supplier.leadTimeDays} days after ordering</span>}
                    </label>
                    <label className="text-sm font-medium text-gray-700">Notes for the supplier
                        <input className={`${field} mt-1`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. deliver before 10am" aria-label="Notes" />
                    </label>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[240px]"><ProductPicker storeId={storeId} onPick={addProduct} placeholder="Scan or search a product to add…" /></div>
                    <Button type="button" variant="outline" onClick={addSuggestions} isLoading={suggesting}><Sparkles className="w-4 h-4 mr-2" />Add low-stock items</Button>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" className="w-4 h-4" checked={onlySupplier} onChange={(e) => setOnlySupplier(e.target.checked)} />
                        Only this supplier's products
                    </label>
                </div>

                <div className="max-h-80 overflow-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0 text-left text-gray-600">
                            <tr><th className="px-3 py-2">Product</th><th className="px-3 py-2 text-right">In stock</th><th className="px-3 py-2 w-28">Quantity</th><th className="px-3 py-2 w-32">Unit cost £</th><th className="px-3 py-2 text-right">Line total</th><th /></tr>
                        </thead>
                        <tbody>
                            {lines.map((l, i) => (
                                <tr key={l.productId} className="border-t border-gray-100">
                                    <td className="px-3 py-2"><div className="font-medium">{l.name}</div><div className="text-xs text-gray-500 font-mono">{l.barcode}</div></td>
                                    <td className="px-3 py-2 text-right text-gray-600">{l.stock === null ? '—' : fmtQty(l.stock)}</td>
                                    <td className="px-3 py-2"><input type="number" min="0" step={l.whole ? '1' : '0.001'} className={field} value={l.quantity} onChange={(e) => setLine(i, 'quantity', e.target.value)} aria-label={`Quantity of ${l.name}`} /></td>
                                    <td className="px-3 py-2"><input type="number" min="0" step="0.01" className={field} value={l.unitCost} onChange={(e) => setLine(i, 'unitCost', e.target.value)} aria-label={`Unit cost of ${l.name}`} /></td>
                                    <td className="px-3 py-2 text-right font-medium">{money((Number(l.quantity) || 0) * (Number(l.unitCost) || 0))}</td>
                                    <td className="px-2"><button type="button" aria-label={`Remove ${l.name}`} onClick={() => setLines(prev => prev.filter((_, idx) => idx !== i))} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button></td>
                                </tr>
                            ))}
                            {!lines.length && <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-500">No products yet. Search above, or add the low-stock items.</td></tr>}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
                    <div className="text-lg">{lines.length} line{lines.length === 1 ? '' : 's'} · Total <b>{money(total)}</b> <span className="text-sm text-gray-500">ex VAT</span></div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button variant="outline" onClick={() => save(false)} isLoading={saving === 'draft'} disabled={!!saving}>Save draft</Button>
                        <Button onClick={() => save(true)} isLoading={saving === 'order'} disabled={!!saving}>Save and mark ordered</Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

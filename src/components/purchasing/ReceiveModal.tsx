import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { handleApiError } from '../../api/handleApiError';
import { money } from '../../utils/money';
import { PurchaseOrdersAPI } from '../../features/purchasing/purchasingAPI';
import type { PurchaseOrder } from '../../features/purchasing/types';
import { qty } from './poStatus';

const field = 'w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600';

interface Props {
    isOpen: boolean;
    storeId: string;
    order: PurchaseOrder | null;
    onClose: () => void;
    onReceived: (o: PurchaseOrder) => void;
}

/** Book a delivery: quantities start at what is still outstanding; change them to what actually arrived. */
export function ReceiveModal({ isOpen, storeId, order, onClose, onReceived }: Props) {
    const [rows, setRows] = useState<Record<string, { quantity: string; unitCost: string }>>({});
    const [deliveryNote, setDeliveryNote] = useState('');
    const [updateCost, setUpdateCost] = useState(true);
    const [saving, setSaving] = useState(false);
    const lines = useMemo(() => order?.lines ?? [], [order]);

    useEffect(() => {
        if (!isOpen) return;
        setRows(Object.fromEntries(lines.map(l => [l.id, { quantity: String(l.outstanding ?? Math.max(0, l.quantity - l.receivedQuantity)), unitCost: String(l.unitCost) }])));
        setDeliveryNote('');
        setUpdateCost(true);
    }, [isOpen, lines]);

    const set = (id: string, k: 'quantity' | 'unitCost', v: string) => setRows(prev => ({ ...prev, [id]: { ...prev[id], [k]: v } }));
    const total = lines.reduce((a, l) => a + (Number(rows[l.id]?.quantity) || 0) * (Number(rows[l.id]?.unitCost) || 0), 0);
    const over = lines.filter(l => (Number(rows[l.id]?.quantity) || 0) > (l.outstanding ?? 0));
    const short = lines.filter(l => (Number(rows[l.id]?.quantity) || 0) < (l.outstanding ?? 0));

    const submit = async () => {
        if (!order) return;
        const body = lines
            .map(l => ({ l, q: Number(rows[l.id]?.quantity), c: Number(rows[l.id]?.unitCost) }))
            .filter(x => x.q > 0);
        if (!body.length) { toast.error('Enter what arrived for at least one product'); return; }
        const bad = body.find(x => !Number.isFinite(x.q) || !Number.isFinite(x.c) || x.c < 0 || ((x.l.unitType ?? 'each') === 'each' && !Number.isInteger(x.q)));
        if (bad) { toast.error(`Check the quantity and cost for ${bad.l.productName}`); return; }
        setSaving(true);
        try {
            const r = await PurchaseOrdersAPI.receive(order.id, storeId, {
                deliveryNote: deliveryNote.trim() || undefined,
                updateCostPrices: updateCost,
                lines: body.map(x => ({ lineId: x.l.id, quantity: x.q, unitCost: x.c !== x.l.unitCost ? x.c : undefined })),
            });
            toast.success(`Booked in ${qty(r.units)} units (${money(r.cost)}). ${r.status === 'received' ? 'Order complete.' : 'Rest still to come.'}`);
            onReceived(r.order);
        } catch (error) {
            toast.error(handleApiError(error));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" title={`Receive delivery: ${order?.number ?? ''}`}
            description="Stock goes up by what you enter here, and each line is recorded in the stock history against this order.">
            <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2 items-end">
                    <label className="text-sm font-medium text-gray-700">Delivery note or invoice number
                        <input className={`${field} mt-1`} value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} placeholder="e.g. DN-20418" aria-label="Delivery note" />
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
                        <input type="checkbox" className="w-4 h-4" checked={updateCost} onChange={(e) => setUpdateCost(e.target.checked)} />
                        Update product cost prices to these costs
                    </label>
                </div>
                <div className="max-h-80 overflow-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0 text-left text-gray-600">
                            <tr><th className="px-3 py-2">Product</th><th className="px-3 py-2 text-right">Ordered</th><th className="px-3 py-2 text-right">Already in</th><th className="px-3 py-2 w-28">Arrived now</th><th className="px-3 py-2 w-32">Unit cost £</th></tr>
                        </thead>
                        <tbody>
                            {lines.map(l => (
                                <tr key={l.id} className="border-t border-gray-100">
                                    <td className="px-3 py-2"><div className="font-medium">{l.productName}</div><div className="text-xs text-gray-500 font-mono">{l.barcode}</div></td>
                                    <td className="px-3 py-2 text-right">{qty(l.quantity)}</td>
                                    <td className="px-3 py-2 text-right text-gray-600">{qty(l.receivedQuantity)}</td>
                                    <td className="px-3 py-2"><input type="number" min="0" step={(l.unitType ?? 'each') === 'each' ? '1' : '0.001'} className={field} value={rows[l.id]?.quantity ?? ''} onChange={(e) => set(l.id, 'quantity', e.target.value)} aria-label={`Arrived of ${l.productName}`} /></td>
                                    <td className="px-3 py-2"><input type="number" min="0" step="0.01" className={field} value={rows[l.id]?.unitCost ?? ''} onChange={(e) => set(l.id, 'unitCost', e.target.value)} aria-label={`Unit cost of ${l.productName}`} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {(over.length > 0 || short.length > 0) && (
                    <div className="text-sm text-amber-800 bg-amber-50 rounded-lg p-3 flex gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                            {short.length > 0 && <div>{short.length} line{short.length > 1 ? 's are' : ' is'} short; the order stays open for the rest (or cancel what is left later).</div>}
                            {over.length > 0 && <div>More than ordered: {over.map(l => l.productName).join(', ')}. That's allowed if it really arrived.</div>}
                        </div>
                    </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
                    <div className="text-lg">This delivery: <b>{money(total)}</b> <span className="text-sm text-gray-500">ex VAT</span></div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button onClick={submit} isLoading={saving}>Book into stock</Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

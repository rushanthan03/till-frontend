import { useCallback, useEffect, useState } from 'react';
import { Ban, ClipboardList, PackageCheck, Pencil, Plus, Printer, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { DataTable } from '../components/DataTable';
import Pagination from '../components/Pagination';
import { useAuth } from '../hooks/useAuth';
import { handleApiError } from '../api/handleApiError';
import { money } from '../utils/money';
import { PurchaseOrdersAPI, SuppliersAPI } from '../features/purchasing/purchasingAPI';
import type { PurchaseOrder, PurchaseOrderStatus, Supplier } from '../features/purchasing/types';
import { OrderEditor } from '../components/purchasing/OrderEditor';
import { ReceiveModal } from '../components/purchasing/ReceiveModal';
import { PO_STATUS, fmtDate, qty } from '../components/purchasing/poStatus';
import { printOrder } from '../components/purchasing/printOrder';

type Filter = 'open' | 'all' | PurchaseOrderStatus;
const FILTERS: { value: Filter; label: string }[] = [
    { value: 'open', label: 'Open' },
    { value: 'draft', label: 'Drafts' },
    { value: 'ordered', label: 'Ordered' },
    { value: 'partial', label: 'Part delivered' },
    { value: 'received', label: 'Received' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'all', label: 'All' },
];

const Badge = ({ status }: { status: PurchaseOrderStatus }) => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PO_STATUS[status].tone}`}>{PO_STATUS[status].label}</span>
);

const isLate = (o: PurchaseOrder) => (o.status === 'ordered' || o.status === 'partial') && !!o.expectedDate && o.expectedDate < new Date().toISOString().slice(0, 10);

export const PurchaseOrdersPage = () => {
    const { user } = useAuth();
    const storeId = localStorage.getItem('selectedRestaurantId') || user?.restaurantId || user?.restaurant?.id || '';
    const storeName = user?.restaurant?.name ?? '';
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [filter, setFilter] = useState<Filter>('open');
    const [supplierId, setSupplierId] = useState('');
    const [loading, setLoading] = useState(false);

    const [detail, setDetail] = useState<PurchaseOrder | null>(null);
    const [editorOpen, setEditorOpen] = useState(false);
    const [editing, setEditing] = useState<PurchaseOrder | null>(null);
    const [receiving, setReceiving] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        if (!storeId) return;
        setLoading(true);
        try {
            const r = await PurchaseOrdersAPI.list(storeId, {
                open: filter === 'open', status: filter === 'open' || filter === 'all' ? undefined : filter,
                supplierId: supplierId || undefined, page, limit,
            });
            setOrders(r.data);
            setTotal(r.total);
        } catch (error) {
            toast.error(handleApiError(error));
        } finally {
            setLoading(false);
        }
    }, [storeId, filter, supplierId, page, limit]);
    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (storeId) SuppliersAPI.list(storeId, { status: 'all' }).then(setSuppliers).catch((e) => toast.error(handleApiError(e)));
    }, [storeId]);

    const openDetail = async (o: PurchaseOrder) => {
        try { setDetail(await PurchaseOrdersAPI.get(o.id, storeId)); } catch (error) { toast.error(handleApiError(error)); }
    };
    const afterChange = (o: PurchaseOrder) => { setDetail(o); load(); };

    const submit = async () => {
        if (!detail) return;
        setBusy(true);
        try { afterChange(await PurchaseOrdersAPI.submit(detail.id, storeId)); toast.success(`${detail.number} marked as ordered`); }
        catch (error) { toast.error(handleApiError(error)); }
        finally { setBusy(false); }
    };
    const cancel = async () => {
        if (!detail) return;
        setBusy(true);
        try { afterChange(await PurchaseOrdersAPI.cancel(detail.id, storeId)); toast.success(`${detail.number} cancelled`); setConfirmCancel(false); }
        catch (error) { toast.error(handleApiError(error)); }
        finally { setBusy(false); }
    };

    const columns = [
        { key: 'number', label: 'Order', render: (o: PurchaseOrder) => <span className="font-mono font-semibold">{o.number}</span> },
        { key: 'supplier', label: 'Supplier', render: (o: PurchaseOrder) => o.supplier?.name ?? '—' },
        { key: 'status', label: 'Status', render: (o: PurchaseOrder) => <Badge status={o.status} /> },
        { key: 'lineCount', label: 'Lines', render: (o: PurchaseOrder) => o.lineCount ?? '—' },
        { key: 'totalCost', label: 'Total (ex VAT)', render: (o: PurchaseOrder) => <span className="font-semibold">{money(o.totalCost)}</span> },
        { key: 'orderedAt', label: 'Ordered', render: (o: PurchaseOrder) => fmtDate(o.orderedAt) },
        {
            key: 'expectedDate', label: 'Expected',
            render: (o: PurchaseOrder) => <span className={isLate(o) ? 'text-red-600 font-semibold' : ''}>{fmtDate(o.expectedDate)}{isLate(o) ? ' · late' : ''}</span>,
        },
    ];

    const lines = detail?.lines ?? [];
    const canReceive = detail?.status === 'ordered' || detail?.status === 'partial';
    const canCancel = detail && ['draft', 'ordered', 'partial'].includes(detail.status);

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Purchase orders</h1>
                    <p className="text-gray-500 mt-1">Order stock from suppliers and book deliveries in. Costs exclude VAT.</p>
                </div>
                <Button onClick={() => { setEditing(null); setEditorOpen(true); }} disabled={!suppliers.some(s => s.isActive)}
                    title={suppliers.some(s => s.isActive) ? undefined : 'Add a supplier first'}>
                    <Plus className="w-4 h-4 mr-2" />New order
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap items-center gap-2">
                {FILTERS.map(f => (
                    <button key={f.value} onClick={() => { setFilter(f.value); setPage(1); }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === f.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{f.label}</button>
                ))}
                <select className="ml-auto px-3 py-1.5 border-2 border-gray-300 rounded-lg text-sm" value={supplierId} onChange={(e) => { setSupplierId(e.target.value); setPage(1); }} aria-label="Filter by supplier">
                    <option value="">All suppliers</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>

            <div>
                <DataTable<PurchaseOrder> data={orders} columns={columns} isLoading={loading} height={520} onRowClick={openDetail}
                    emptyMessage={suppliers.length ? 'No orders here.' : 'Add your suppliers first (Suppliers page), then raise an order.'} />
                <Pagination page={String(page)} limit={String(limit)} total={total}
                    handleChangePage={(_, p) => setPage(p + 1)} handleChangeRowsPerPage={(e) => { setLimit(Number(e.target.value)); setPage(1); }} />
            </div>

            <Modal isOpen={!!detail && !editorOpen && !receiving} onClose={() => setDetail(null)} size="xl"
                title={detail ? `${detail.number} · ${detail.supplier?.name ?? ''}` : ''}>
                {detail && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-700">
                            <span><Badge status={detail.status} /></span>
                            <span>Raised {fmtDate(detail.createdAt)}{detail.createdByName ? ` by ${detail.createdByName}` : ''}</span>
                            <span>Ordered {fmtDate(detail.orderedAt)}</span>
                            <span className={isLate(detail) ? 'text-red-600 font-semibold' : ''}>Expected {fmtDate(detail.expectedDate)}</span>
                            {detail.closedAt && <span>Closed {fmtDate(detail.closedAt)}</span>}
                        </div>
                        {detail.notes && <div className="text-sm bg-gray-50 rounded-lg p-3">{detail.notes}</div>}
                        <div className="max-h-80 overflow-auto border border-gray-200 rounded-lg">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0 text-left text-gray-600">
                                    <tr><th className="px-3 py-2">Product</th><th className="px-3 py-2 text-right">Ordered</th><th className="px-3 py-2 text-right">Received</th><th className="px-3 py-2 text-right">Unit cost</th><th className="px-3 py-2 text-right">Line total</th><th className="px-3 py-2 text-right">In stock now</th></tr>
                                </thead>
                                <tbody>
                                    {lines.map(l => (
                                        <tr key={l.id} className="border-t border-gray-100">
                                            <td className="px-3 py-2"><div className="font-medium">{l.productName}</div><div className="text-xs text-gray-500 font-mono">{l.barcode}</div></td>
                                            <td className="px-3 py-2 text-right">{qty(l.quantity)}</td>
                                            <td className={`px-3 py-2 text-right ${l.receivedQuantity >= l.quantity ? 'text-green-700' : l.receivedQuantity > 0 ? 'text-amber-700' : 'text-gray-500'}`}>{qty(l.receivedQuantity)}</td>
                                            <td className="px-3 py-2 text-right">{money(l.unitCost)}</td>
                                            <td className="px-3 py-2 text-right">{money(l.quantity * l.unitCost)}</td>
                                            <td className="px-3 py-2 text-right text-gray-600">{l.stockQuantity === null || l.stockQuantity === undefined ? '—' : qty(l.stockQuantity)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-wrap gap-6 text-sm">
                            <span>Ordered: <b>{money(detail.totalCost)}</b></span>
                            <span>Received so far: <b>{money(detail.receivedCost)}</b></span>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-gray-100">
                            <Button variant="outline" onClick={() => printOrder(detail, storeName)}><Printer className="w-4 h-4 mr-2" />Print</Button>
                            {canCancel && <Button variant="outline" onClick={() => setConfirmCancel(true)}><Ban className="w-4 h-4 mr-2" />{detail.status === 'partial' ? 'Cancel the rest' : 'Cancel order'}</Button>}
                            {detail.status === 'draft' && <Button variant="outline" onClick={() => { setEditing(detail); setEditorOpen(true); }}><Pencil className="w-4 h-4 mr-2" />Edit</Button>}
                            {detail.status === 'draft' && <Button onClick={submit} isLoading={busy}><Send className="w-4 h-4 mr-2" />Mark as ordered</Button>}
                            {canReceive && <Button onClick={() => setReceiving(true)}><PackageCheck className="w-4 h-4 mr-2" />Receive delivery</Button>}
                        </div>
                    </div>
                )}
            </Modal>

            <OrderEditor isOpen={editorOpen} storeId={storeId} suppliers={suppliers} order={editing}
                supplierId={supplierId || undefined}
                onClose={() => setEditorOpen(false)}
                onSaved={(o) => { setEditorOpen(false); afterChange(o); }} />

            <ReceiveModal isOpen={receiving} storeId={storeId} order={detail} onClose={() => setReceiving(false)}
                onReceived={(o) => { setReceiving(false); afterChange(o); }} />

            <Modal isOpen={confirmCancel} onClose={() => setConfirmCancel(false)} title="Cancel order" size="sm">
                <p className="text-gray-700">
                    {detail?.status === 'partial'
                        ? <>Cancel what is still to come on <b>{detail?.number}</b>? Stock already booked in stays.</>
                        : <>Cancel <b>{detail?.number}</b>? It can't be reopened; raise a new order instead.</>}
                </p>
                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => setConfirmCancel(false)}>Keep it</Button>
                    <Button variant="danger" onClick={cancel} isLoading={busy}>Cancel order</Button>
                </div>
            </Modal>
            {!storeId && <p className="text-gray-500"><ClipboardList className="w-4 h-4 inline mr-1" />Pick a store first.</p>}
        </div>
    );
};

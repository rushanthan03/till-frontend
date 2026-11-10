import { useCallback, useEffect, useState } from 'react';
import { UsersRound } from 'lucide-react';
import { toast } from 'react-toastify';
import Pagination from '../components/Pagination';
import { Modal } from '../components/Modal';
import { useAuth } from '../hooks/useAuth';
import { handleApiError } from '../api/handleApiError';
import { money } from '../utils/money';
import { Customer, CustomerDetail, CustomersAPI } from '../features/customers/customersAPI';

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB') : '—');

export const CustomersPage = () => {
    const { user } = useAuth();
    const storeId = localStorage.getItem('selectedRestaurantId') || user?.restaurantId || user?.restaurant?.id || '';
    const [rows, setRows] = useState<Customer[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [detail, setDetail] = useState<CustomerDetail | null>(null);

    const load = useCallback(() => {
        if (!storeId) return;
        setLoading(true);
        CustomersAPI.list(storeId, { page, limit, search: search.trim() || undefined })
            .then(r => { setRows(r.data); setTotal(r.total); })
            .catch(e => toast.error(handleApiError(e)))
            .finally(() => setLoading(false));
    }, [storeId, page, limit, search]);
    useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

    const open = (c: Customer) => CustomersAPI.get(c.id, storeId).then(setDetail).catch(e => toast.error(handleApiError(e)));

    if (!storeId) return <p className="p-10 text-center text-gray-500">Pick a store first.</p>;
    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><UsersRound className="w-6 h-6" />Customers</h1>
                <p className="text-sm text-gray-600">Loyalty members of your whole company: points are earned and kept across all your stores. They earn 1 point for every £1 spent. Cashiers sign customers up at the till.</p>
            </div>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, phone, email or card" aria-label="Search customers"
                className="w-full max-w-sm px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600" />
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                        <tr><th className="px-4 py-2">Customer</th><th className="px-4 py-2">Card</th><th className="px-4 py-2 text-right">Points</th><th className="px-4 py-2 text-right">Spend</th><th className="px-4 py-2 text-right">Visits</th><th className="px-4 py-2">Last visit</th><th className="px-4 py-2">Marketing</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">{loading ? 'Loading…' : 'No customers yet.'}</td></tr>}
                        {rows.map(c => (
                            <tr key={c.id} onClick={() => open(c)} className="cursor-pointer hover:bg-gray-50">
                                <td className="px-4 py-2"><div className="font-medium">{c.name}</div><div className="text-xs text-gray-500">{c.phone ?? c.email ?? ''}</div></td>
                                <td className="px-4 py-2 font-mono text-xs">{c.cardNumber}</td>
                                <td className="px-4 py-2 text-right tabular-nums font-semibold">{c.pointsBalance}</td>
                                <td className="px-4 py-2 text-right tabular-nums">{money(c.totalSpend)}</td>
                                <td className="px-4 py-2 text-right tabular-nums">{c.visitCount}</td>
                                <td className="px-4 py-2">{when(c.lastVisitAt)}</td>
                                <td className="px-4 py-2">{c.marketingConsent ? 'Opted in' : 'No'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <Pagination page={String(page)} limit={String(limit)} total={total} handleChangePage={(_, p) => setPage(p + 1)} handleChangeRowsPerPage={e => { setLimit(Number(e.target.value)); setPage(1); }} />
            </div>
            {detail && (
                <Modal isOpen onClose={() => setDetail(null)} title={detail.name} size="md">
                    <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-2 text-gray-700">
                            <div>Card: <b className="font-mono">{detail.cardNumber}</b></div><div>Points: <b>{detail.pointsBalance}</b></div>
                            <div>Phone: {detail.phone ?? '—'}</div><div>Email: {detail.email ?? '—'}</div>
                            <div>Total spend: {money(detail.totalSpend)}</div><div>Visits: {detail.visitCount}</div>
                            <div>Joined: {when(detail.createdAt)}{detail.homeStoreName ? ` at ${detail.homeStoreName}` : ''}</div><div>Marketing: {detail.marketingConsent ? 'Opted in' : 'No'}</div>
                        </div>
                        <div className="font-semibold text-gray-900 pt-2">Recent purchases</div>
                        {detail.recentSales.length === 0 ? <p className="text-gray-500">No purchases yet.</p> : (
                            <ul className="divide-y divide-gray-100">
                                {detail.recentSales.map(s => (
                                    <li key={s.id} className="flex justify-between py-1.5"><span>{s.receiptNumber} · {when(s.createdAt)}{s.storeName ? ` · ${s.storeName.replace(/^.* - /, '')}` : ''}</span><span>{money(s.total)} · +{s.pointsEarned} pts</span></li>
                                ))}
                            </ul>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
};

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Plus, Search, Truck } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Modal } from '../components/Modal';
import { DataTable } from '../components/DataTable';
import { useAuth } from '../hooks/useAuth';
import { handleApiError } from '../api/handleApiError';
import { SuppliersAPI } from '../features/purchasing/purchasingAPI';
import type { Supplier, SupplierInput } from '../features/purchasing/types';

const area = 'w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600';

interface FormState {
    name: string; contactName: string; email: string; phone: string; address: string;
    accountNumber: string; leadTimeDays: string; notes: string; isActive: boolean;
}
const empty: FormState = { name: '', contactName: '', email: '', phone: '', address: '', accountNumber: '', leadTimeDays: '', notes: '', isActive: true };
const toForm = (s: Supplier): FormState => ({
    name: s.name, contactName: s.contactName ?? '', email: s.email ?? '', phone: s.phone ?? '', address: s.address ?? '',
    accountNumber: s.accountNumber ?? '', leadTimeDays: s.leadTimeDays === null ? '' : String(s.leadTimeDays), notes: s.notes ?? '', isActive: s.isActive,
});
const toInput = (f: FormState): SupplierInput => ({
    name: f.name.trim(), contactName: f.contactName.trim(), email: f.email.trim() || undefined, phone: f.phone.trim(), address: f.address.trim(),
    accountNumber: f.accountNumber.trim(), leadTimeDays: f.leadTimeDays === '' ? undefined : Number(f.leadTimeDays), notes: f.notes.trim(), isActive: f.isActive,
});

/** Suppliers are shared by every store in the company. */
export const SuppliersPage = () => {
    const { user } = useAuth();
    const storeId = localStorage.getItem('selectedRestaurantId') || user?.restaurantId || user?.restaurant?.id || '';
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<'active' | 'inactive' | 'all'>('active');
    const [editing, setEditing] = useState<Supplier | null>(null);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<FormState>(empty);
    const [saving, setSaving] = useState(false);

    useEffect(() => { const t = setTimeout(() => setSearch(searchInput), 300); return () => clearTimeout(t); }, [searchInput]);

    const load = useCallback(async () => {
        if (!storeId) return;
        setLoading(true);
        try { setSuppliers(await SuppliersAPI.list(storeId, { search: search || undefined, status })); }
        catch (error) { toast.error(handleApiError(error)); }
        finally { setLoading(false); }
    }, [storeId, search, status]);
    useEffect(() => { load(); }, [load]);

    const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
    const openEdit = (s: Supplier) => { setEditing(s); setForm(toForm(s)); setOpen(true); };
    const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(prev => ({ ...prev, [k]: v }));

    const save = async (e: FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) { toast.error('Enter the supplier name'); return; }
        setSaving(true);
        try {
            if (editing) await SuppliersAPI.update(editing.id, storeId, toInput(form));
            else await SuppliersAPI.create(storeId, toInput(form));
            toast.success(editing ? 'Supplier updated' : 'Supplier added');
            setOpen(false);
            load();
        } catch (error) {
            toast.error(handleApiError(error));
        } finally {
            setSaving(false);
        }
    };

    const columns = [
        {
            key: 'name', label: 'Supplier',
            render: (s: Supplier) => (
                <div>
                    <div className="font-semibold text-gray-900">{s.name}</div>
                    <div className="text-xs text-gray-500">{s.accountNumber ? `Account ${s.accountNumber}` : ''}</div>
                </div>
            ),
        },
        {
            key: 'contact', label: 'Contact',
            render: (s: Supplier) => (
                <div className="text-sm">
                    <div>{s.contactName ?? '—'}</div>
                    <div className="text-xs text-gray-500">{[s.phone, s.email].filter(Boolean).join(' · ')}</div>
                </div>
            ),
        },
        { key: 'leadTimeDays', label: 'Lead time', render: (s: Supplier) => (s.leadTimeDays === null ? '—' : `${s.leadTimeDays} day${s.leadTimeDays === 1 ? '' : 's'}`) },
        { key: 'productCount', label: 'Products', render: (s: Supplier) => s.productCount ?? 0 },
        { key: 'openOrders', label: 'Open orders', render: (s: Supplier) => s.openOrders ?? 0 },
        {
            key: 'isActive', label: 'Status',
            render: (s: Supplier) => (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{s.isActive ? 'Active' : 'Inactive'}</span>
            ),
        },
    ];

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
                    <p className="text-gray-500 mt-1">Shared by every store in the company. Products and open orders are for this store.</p>
                </div>
                <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add supplier</Button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 grid gap-3 md:grid-cols-[1fr_200px] items-end">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-[calc(50%+0.55rem)] -translate-y-1/2 text-gray-400" />
                    <Input label="Search" placeholder="Name, contact, email or account" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9" />
                </div>
                <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}
                    options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'all', label: 'All' }]} />
            </div>

            <DataTable<Supplier>
                data={suppliers}
                columns={columns}
                isLoading={loading}
                height={520}
                emptyMessage={search ? 'No suppliers match.' : 'No suppliers yet. Add the companies you buy stock from.'}
                onRowClick={openEdit}
            />

            <Modal isOpen={open} onClose={() => setOpen(false)} title={editing ? 'Edit supplier' : 'Add supplier'} size="lg">
                <form onSubmit={save} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Input label="Name *" value={form.name} onChange={(e) => set('name', e.target.value)} required />
                        <Input label="Our account number" value={form.accountNumber} onChange={(e) => set('accountNumber', e.target.value)} />
                        <Input label="Contact name" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} />
                        <Input label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                        <Input label="Order email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
                        <Input label="Lead time (days)" type="number" min="0" max="120" step="1" value={form.leadTimeDays} onChange={(e) => set('leadTimeDays', e.target.value)}
                            helperText="Sets the expected delivery date on new orders" />
                    </div>
                    <label className="block text-sm font-medium text-gray-700">Address
                        <textarea className={`${area} mt-1.5`} rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} />
                    </label>
                    <label className="block text-sm font-medium text-gray-700">Notes
                        <textarea className={`${area} mt-1.5`} rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Order cut-off times, minimum order, delivery days…" />
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="w-4 h-4" />
                        Active (can be used on new orders)
                    </label>
                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" isLoading={saving}>{editing ? 'Save changes' : 'Add supplier'}</Button>
                    </div>
                </form>
            </Modal>
            {!storeId && <p className="text-gray-500"><Truck className="w-4 h-4 inline mr-1" />Pick a store first.</p>}
        </div>
    );
};

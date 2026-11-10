import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Package, Plus, Search, Pencil, Archive, Database, AlertTriangle, ShieldAlert } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Modal } from '../components/Modal';
import { DataTable } from '../components/DataTable';
import Pagination from '../components/Pagination';
import { useAuth } from '../hooks/useAuth';
import { handleApiError } from '../api/handleApiError';
import { money } from '../utils/money';
import { ProductsAPI } from '../features/products/productsAPI';
import { DepartmentCount, Product, ProductInput } from '../features/products/types';

const VAT_OPTIONS = [
    { value: '0', label: '0% (zero-rated)' },
    { value: '5', label: '5% (reduced)' },
    { value: '20', label: '20% (standard)' },
];
const AGE_OPTIONS = [
    { value: '0', label: 'No restriction' },
    { value: '16', label: '16+' },
    { value: '18', label: '18+' },
    { value: '21', label: '21+' },
    { value: '25', label: 'Challenge 25' },
];
const UNIT_OPTIONS = [
    { value: 'each', label: 'Each' },
    { value: 'weight', label: 'By weight (price per kg)' },
];

interface FormState {
    name: string;
    barcode: string;
    sku: string;
    department: string;
    category: string;
    brand: string;
    unitType: 'each' | 'weight';
    price: string;
    costPrice: string;
    vatRate: string;
    ageRestriction: string;
    stockQuantity: string;
    reorderLevel: string;
    isActive: boolean;
}

const emptyForm: FormState = {
    name: '', barcode: '', sku: '', department: '', category: '', brand: '', unitType: 'each',
    price: '', costPrice: '', vatRate: '20', ageRestriction: '0', stockQuantity: '0', reorderLevel: '0', isActive: true,
};

const toForm = (p: Product): FormState => ({
    name: p.name, barcode: p.barcode, sku: p.sku ?? '', department: p.department, category: p.category ?? '',
    brand: p.brand ?? '', unitType: p.unitType, price: String(p.price), costPrice: p.costPrice === null ? '' : String(p.costPrice),
    vatRate: String(p.vatRate), ageRestriction: String(p.ageRestriction), stockQuantity: String(p.stockQuantity),
    reorderLevel: String(p.reorderLevel), isActive: p.isActive,
});

const toPayload = (f: FormState): ProductInput => ({
    name: f.name.trim(),
    barcode: f.barcode.trim(),
    sku: f.sku.trim() || undefined,
    department: f.department.trim(),
    category: f.category.trim() || undefined,
    brand: f.brand.trim() || undefined,
    unitType: f.unitType,
    price: Number(f.price),
    costPrice: f.costPrice === '' ? undefined : Number(f.costPrice),
    vatRate: Number(f.vatRate),
    ageRestriction: Number(f.ageRestriction),
    stockQuantity: Number(f.stockQuantity || 0),
    reorderLevel: Number(f.reorderLevel || 0),
    isActive: f.isActive,
});

export const Products = () => {
    const { user } = useAuth();
    const storeId =
        localStorage.getItem('selectedRestaurantId') || user?.restaurantId || user?.restaurant?.id || '';

    const [products, setProducts] = useState<Product[]>([]);
    const [departments, setDepartments] = useState<DepartmentCount[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [loading, setLoading] = useState(false);

    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [department, setDepartment] = useState('');
    const [status, setStatus] = useState<'active' | 'inactive' | 'all'>('active');
    const [lowStock, setLowStock] = useState(false);

    const [editing, setEditing] = useState<Product | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [archiveTarget, setArchiveTarget] = useState<Product | null>(null);

    // debounce the search box
    useEffect(() => {
        const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    const load = useCallback(async () => {
        if (!storeId) return;
        setLoading(true);
        try {
            const [list, deps] = await Promise.all([
                ProductsAPI.list({ storeId, search, department: department || undefined, status, lowStock, page, limit }),
                ProductsAPI.departments(storeId),
            ]);
            setProducts(list.data);
            setTotal(list.total);
            setDepartments(deps);
        } catch (error) {
            toast.error(handleApiError(error));
        } finally {
            setLoading(false);
        }
    }, [storeId, search, department, status, lowStock, page, limit]);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => { setEditing(null); setForm(emptyForm); setIsFormOpen(true); };
    const openEdit = (p: Product) => { setEditing(p); setForm(toForm(p)); setIsFormOpen(true); };
    const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(prev => ({ ...prev, [key]: value }));
    const onText = (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setField(key, e.target.value as never);

    const priceNum = Number(form.price);
    const vatNum = Number(form.vatRate);
    const net = useMemo(() => (Number.isFinite(priceNum) ? priceNum / (1 + vatNum / 100) : 0), [priceNum, vatNum]);
    const margin = useMemo(() => {
        const cost = Number(form.costPrice);
        if (form.costPrice === '' || !Number.isFinite(cost) || net <= 0) return null;
        return ((net - cost) / net) * 100;
    }, [form.costPrice, net]);

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.barcode.trim() || !form.department.trim() || form.price === '') {
            toast.error('Name, barcode, department and price are required');
            return;
        }
        setSaving(true);
        try {
            const payload = toPayload(form);
            if (editing) await ProductsAPI.update(editing.id, storeId, payload);
            else await ProductsAPI.create(storeId, payload);
            toast.success(editing ? 'Product updated' : 'Product created');
            setIsFormOpen(false);
            load();
        } catch (error) {
            toast.error(handleApiError(error));
        } finally {
            setSaving(false);
        }
    };

    const handleArchive = async () => {
        if (!archiveTarget) return;
        try {
            await ProductsAPI.archive(archiveTarget.id, storeId);
            toast.success(`${archiveTarget.name} archived`);
            setArchiveTarget(null);
            load();
        } catch (error) {
            toast.error(handleApiError(error));
        }
    };

    const handleSeed = async () => {
        try {
            const res = await ProductsAPI.seedDemo(storeId);
            toast.success(`Loaded ${res.created} demo products${res.skipped ? ` (${res.skipped} already existed)` : ''}`);
            load();
        } catch (error) {
            toast.error(handleApiError(error));
        }
    };

    if (!storeId) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-600">
                <Package className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                <p className="font-semibold text-gray-900">No store selected</p>
                <p className="text-sm mt-1">Pick a store from the outlet switcher to manage its products.</p>
            </div>
        );
    }

    const columns = [
        {
            key: 'name', label: 'Product',
            render: (p: Product) => (
                <div>
                    <div className="font-semibold text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-500">{[p.brand, p.category].filter(Boolean).join(' · ')}</div>
                </div>
            ),
        },
        { key: 'barcode', label: 'Barcode', render: (p: Product) => <span className="font-mono text-sm">{p.barcode}</span> },
        { key: 'department', label: 'Department' },
        {
            key: 'price', label: 'Price (inc VAT)',
            render: (p: Product) => <span className="font-semibold">{money(p.price)}{p.unitType === 'weight' ? ' /kg' : ''}</span>,
        },
        { key: 'vatRate', label: 'VAT', render: (p: Product) => `${p.vatRate}%` },
        {
            key: 'ageRestriction', label: 'Age',
            render: (p: Product) => p.ageRestriction > 0
                ? <span className="inline-flex items-center gap-1 text-amber-700 text-sm font-medium"><ShieldAlert className="w-4 h-4" />{p.ageRestriction}+</span>
                : <span className="text-gray-400">—</span>,
        },
        {
            key: 'stockQuantity', label: 'Stock',
            render: (p: Product) => {
                const low = p.stockQuantity <= p.reorderLevel;
                return (
                    <span className={`inline-flex items-center gap-1 text-sm font-medium ${low ? 'text-red-600' : 'text-gray-800'}`}>
                        {low && <AlertTriangle className="w-4 h-4" />}
                        {p.stockQuantity}{p.unitType === 'weight' ? ' kg' : ''}{low ? ' · Low' : ''}
                    </span>
                );
            },
        },
        {
            key: 'isActive', label: 'Status',
            render: (p: Product) => (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {p.isActive ? 'Active' : 'Archived'}
                </span>
            ),
        },
        {
            key: 'actions', label: '',
            render: (p: Product) => (
                <div className="flex items-center gap-1 justify-end">
                    <button aria-label={`Edit ${p.name}`} title="Edit" onClick={(ev) => { ev.stopPropagation(); openEdit(p); }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"><Pencil className="w-4 h-4" /></button>
                    {p.isActive && (
                        <button aria-label={`Archive ${p.name}`} title="Archive" onClick={(ev) => { ev.stopPropagation(); setArchiveTarget(p); }} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Archive className="w-4 h-4" /></button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Products</h1>
                    <p className="text-gray-500 mt-1">Barcodes, prices, VAT and stock levels for this store.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSeed}><Database className="w-4 h-4 mr-2" />Load demo products</Button>
                    <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add product</Button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 grid gap-3 md:grid-cols-[1fr_220px_160px_auto] items-end">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-[calc(50%+0.55rem)] -translate-y-1/2 text-gray-400" />
                    <Input label="Search" placeholder="Name, barcode, SKU or brand" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9" />
                </div>
                <Select label="Department" value={department} onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
                    options={[{ value: '', label: 'All departments' }, ...departments.map(d => ({ value: d.department, label: `${d.department} (${d.count})` }))]} />
                <Select label="Status" value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }}
                    options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Archived' }, { value: 'all', label: 'All' }]} />
                <label className="flex items-center gap-2 text-sm text-gray-700 pb-2 cursor-pointer">
                    <input type="checkbox" checked={lowStock} onChange={(e) => { setLowStock(e.target.checked); setPage(1); }} className="w-4 h-4" />
                    Low stock only
                </label>
            </div>

            <div>
                <DataTable<Product>
                    data={products}
                    columns={columns}
                    isLoading={loading}
                    height={560}
                    emptyMessage={total === 0 && !search && !department ? 'No products yet — add one, or load the demo catalogue.' : 'No products match these filters.'}
                    onRowClick={openEdit}
                />
                <Pagination
                    page={String(page)}
                    limit={String(limit)}
                    total={total}
                    handleChangePage={(_, p) => setPage(p + 1)}
                    handleChangeRowsPerPage={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                />
            </div>

            <Modal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title={editing ? 'Edit product' : 'Add product'}
                description="Prices are entered including VAT, as shown on the shelf."
                size="lg"
            >
                <form onSubmit={handleSave} className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Input label="Product name *" value={form.name} onChange={onText('name')} required />
                        <Input label="Barcode *" value={form.barcode} onChange={onText('barcode')} required placeholder="Scan or type" />
                        <Input label="SKU" value={form.sku} onChange={onText('sku')} />
                        <div>
                            <Input label="Department *" list="product-departments" value={form.department} onChange={onText('department')} required />
                            <datalist id="product-departments">
                                {departments.map(d => <option key={d.department} value={d.department} />)}
                            </datalist>
                        </div>
                        <Input label="Category" value={form.category} onChange={onText('category')} />
                        <Input label="Brand" value={form.brand} onChange={onText('brand')} />
                        <Select label="Sold" value={form.unitType} onChange={onText('unitType')} options={UNIT_OPTIONS} />
                        <Select label="Age restriction" value={form.ageRestriction} onChange={onText('ageRestriction')} options={AGE_OPTIONS} />
                        <Input label={`Price incl. VAT * ${form.unitType === 'weight' ? '(per kg)' : ''}`} type="number" step="0.01" min="0" value={form.price} onChange={onText('price')} required />
                        <Select label="VAT rate" value={form.vatRate} onChange={onText('vatRate')} options={VAT_OPTIONS} />
                        <Input label="Cost price (ex VAT)" type="number" step="0.01" min="0" value={form.costPrice} onChange={onText('costPrice')} />
                        <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-2 text-sm text-gray-700 self-end">
                            <div>Net price: <b>{money(net)}</b> · VAT: <b>{money(priceNum - net)}</b></div>
                            <div>Margin: <b>{margin === null ? '—' : `${margin.toFixed(1)}%`}</b></div>
                        </div>
                        <Input label="Stock quantity" type="number" step="0.001" min="0" value={form.stockQuantity} onChange={onText('stockQuantity')} />
                        <Input label="Reorder level" type="number" step="0.001" min="0" value={form.reorderLevel} onChange={onText('reorderLevel')} />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={form.isActive} onChange={(e) => setField('isActive', e.target.checked)} className="w-4 h-4" />
                        Active (available to sell at the till)
                    </label>
                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                        <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                        <Button type="submit" isLoading={saving}>{editing ? 'Save changes' : 'Create product'}</Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!archiveTarget} onClose={() => setArchiveTarget(null)} title="Archive product" size="sm">
                <p className="text-gray-700">
                    Archive <b>{archiveTarget?.name}</b>? It will no longer be sold at the till, but past sales keep their history.
                </p>
                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => setArchiveTarget(null)}>Cancel</Button>
                    <Button variant="danger" onClick={handleArchive}>Archive</Button>
                </div>
            </Modal>
        </div>
    );
};

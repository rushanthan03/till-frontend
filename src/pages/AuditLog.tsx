import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Download, Lock, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Modal } from '../components/Modal';
import { DataTable } from '../components/DataTable';
import { PeriodPicker } from '../components/PeriodPicker';
import { useAuth } from '../hooks/useAuth';
import { handleApiError } from '../api/handleApiError';
import { AuditLogAPI, type AuditEntry } from '../features/auditLog/auditLogAPI';
import { Preset, rangeFor } from '../utils/dateRange';
import { downloadCsv } from '../utils/csv';
import type { RootState } from '../app/store';

const PAGE_SIZE = 50;
const ROLE_WORDS: Record<string, string> = { tenant_admin: 'Company admin', super_admin: 'Platform admin', manager: 'Manager', cashier: 'Cashier' };
const GROUP_STYLE: Record<string, string> = {
    auth: 'bg-slate-100 text-slate-700', sale: 'bg-amber-100 text-amber-800', refund: 'bg-red-100 text-red-700',
    drawer: 'bg-orange-100 text-orange-800', shift: 'bg-sky-100 text-sky-800', product: 'bg-violet-100 text-violet-800',
    stock: 'bg-emerald-100 text-emerald-800', purchasing: 'bg-teal-100 text-teal-800', promotion: 'bg-pink-100 text-pink-800',
    customer: 'bg-indigo-100 text-indigo-800', staff: 'bg-blue-100 text-blue-800', permissions: 'bg-fuchsia-100 text-fuchsia-800',
};
const groupOf = (action: string) => action.split('.')[0];
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

/** Read-only record of sensitive actions. Managers see their own store; company admins every store. */
export const AuditLogPage = () => {
    const { user } = useAuth();
    const role = (user?.role ?? '').toLowerCase();
    const isAdmin = role === 'tenant_admin' || role === 'super_admin';
    const stores = useSelector((s: RootState) => s.restaurant.restaurants) as { id: string; name: string }[] | undefined;
    const storeName = useMemo(() => new Map((stores ?? []).map(s => [s.id, s.name])), [stores]);

    const [preset, setPreset] = useState<Preset>('7d');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [storeId, setStoreId] = useState('');
    const [group, setGroup] = useState('');
    const [userId, setUserId] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [rows, setRows] = useState<AuditEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [groups, setGroups] = useState<Record<string, string>>({});
    const [people, setPeople] = useState<{ id: string; name: string }[]>([]);
    const [open, setOpen] = useState<AuditEntry | null>(null);

    useEffect(() => { const t = setTimeout(() => setSearch(searchInput.trim()), 300); return () => clearTimeout(t); }, [searchInput]);
    useEffect(() => {
        AuditLogAPI.filters().then(f => { setGroups(f.groups); setPeople(f.people); }).catch(() => undefined);
    }, []);

    const range = useMemo(() => rangeFor(preset, customFrom, customTo), [preset, customFrom, customTo]);
    const query = useMemo(() => ({
        ...range, storeId: storeId || undefined, group: group || undefined, userId: userId || undefined, search: search || undefined,
    }), [range, storeId, group, userId, search]);

    useEffect(() => { setPage(1); }, [query]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await AuditLogAPI.list({ ...query, page, limit: PAGE_SIZE });
            setRows(r.data); setTotal(r.total);
        } catch (error) {
            toast.error(handleApiError(error));
        } finally {
            setLoading(false);
        }
    }, [query, page]);
    useEffect(() => { void load(); }, [load]);

    const exportCsv = async () => {
        setExporting(true);
        try {
            const all: AuditEntry[] = [];
            for (let p = 1; p <= 10; p++) {
                const r = await AuditLogAPI.list({ ...query, page: p, limit: 1000 });
                all.push(...r.data);
                if (p >= r.totalPages) break;
            }
            downloadCsv(`audit-log-${new Date().toISOString().slice(0, 10)}.csv`, ['Time', 'Who', 'Role', 'Store', 'Type', 'What'],
                all.map(e => [when(e.createdAt), e.userName ?? '', ROLE_WORDS[e.userRole ?? ''] ?? e.userRole ?? '', e.storeId ? storeName.get(e.storeId) ?? '' : 'Company', groups[groupOf(e.action)] ?? e.action, e.summary]));
            if (all.length >= 10000) toast.info('Exported the newest 10,000 entries. Narrow the period for older ones.');
        } catch (error) {
            toast.error(handleApiError(error));
        } finally {
            setExporting(false);
        }
    };

    const columns = [
        { key: 'createdAt', label: 'When', width: '170px', render: (e: AuditEntry) => <span className="text-sm tabular-nums whitespace-nowrap">{when(e.createdAt)}</span> },
        {
            key: 'user', label: 'Who', width: '180px',
            render: (e: AuditEntry) => (
                <div className="text-sm">
                    <div className="font-medium text-gray-900">{e.userName ?? 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{ROLE_WORDS[e.userRole ?? ''] ?? e.userRole ?? ''}</div>
                </div>
            ),
        },
        ...(isAdmin ? [{ key: 'store', label: 'Store', width: '150px', render: (e: AuditEntry) => <span className="text-sm text-gray-600">{e.storeId ? storeName.get(e.storeId) ?? '—' : 'Company'}</span> }] : []),
        {
            key: 'summary', label: 'What happened',
            render: (e: AuditEntry) => (
                <div className="flex items-start gap-2 text-sm whitespace-normal min-w-[320px] max-w-2xl">
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${GROUP_STYLE[groupOf(e.action)] ?? 'bg-gray-100 text-gray-700'}`}>{groups[groupOf(e.action)] ?? groupOf(e.action)}</span>
                    <span className="text-gray-900">{e.summary}</span>
                </div>
            ),
        },
    ];

    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Audit log</h1>
                    <p className="text-gray-500 mt-1 flex items-center gap-1.5">
                        <Lock className="w-4 h-4" />
                        Sign-ins, price changes, refunds, drawer openings, stock and staff changes. Entries can't be changed or deleted.
                    </p>
                </div>
                <Button variant="outline" onClick={exportCsv} isLoading={exporting} disabled={!total}><Download className="w-4 h-4 mr-2" />Export CSV</Button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                <PeriodPicker preset={preset} customFrom={customFrom} customTo={customTo} onPreset={setPreset} onCustomFrom={setCustomFrom} onCustomTo={setCustomTo} />
                <div className={`grid gap-3 items-end ${isAdmin ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-[calc(50%+0.55rem)] -translate-y-1/2 text-gray-400" />
                        <Input label="Search" placeholder="Receipt, product, name…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9" />
                    </div>
                    <Select label="Type" value={group} onChange={(e) => setGroup(e.target.value)}
                        options={[{ value: '', label: 'Everything' }, ...Object.entries(groups).map(([value, label]) => ({ value, label }))]} />
                    <Select label="Person" value={userId} onChange={(e) => setUserId(e.target.value)}
                        options={[{ value: '', label: 'Everyone' }, ...people.map(p => ({ value: p.id, label: p.name ?? 'Unknown' }))]} />
                    {isAdmin && (
                        <Select label="Store" value={storeId} onChange={(e) => setStoreId(e.target.value)}
                            options={[{ value: '', label: 'All stores' }, ...(stores ?? []).map(s => ({ value: s.id, label: s.name }))]} />
                    )}
                </div>
            </div>

            <DataTable<AuditEntry>
                data={rows}
                columns={columns}
                isLoading={loading}
                height={560}
                emptyMessage="Nothing recorded for these filters."
                onRowClick={setOpen}
            />
            <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{total.toLocaleString('en-GB')} entr{total === 1 ? 'y' : 'ies'}</span>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)}>Newer</Button>
                    <span>Page {page} of {pages}</span>
                    <Button variant="outline" size="sm" disabled={page >= pages || loading} onClick={() => setPage(p => p + 1)}>Older</Button>
                </div>
            </div>

            <Modal isOpen={!!open} onClose={() => setOpen(null)} title="Audit entry" size="lg">
                {open && (
                    <div className="space-y-3 text-sm">
                        <p className="text-base text-gray-900">{open.summary}</p>
                        <dl className="grid grid-cols-[140px_1fr] gap-y-1.5">
                            <dt className="text-gray-500">When</dt><dd>{when(open.createdAt)}</dd>
                            <dt className="text-gray-500">Who</dt><dd>{open.userName ?? 'Unknown'} {open.userRole ? `(${ROLE_WORDS[open.userRole] ?? open.userRole})` : ''}</dd>
                            <dt className="text-gray-500">Store</dt><dd>{open.storeId ? storeName.get(open.storeId) ?? open.storeId : 'Company-wide'}</dd>
                            <dt className="text-gray-500">Type</dt><dd><code className="text-xs">{open.action}</code></dd>
                        </dl>
                        {open.details && <DetailsView details={open.details} />}
                    </div>
                )}
            </Modal>
        </div>
    );
};

function DetailsView({ details }: { details: Record<string, unknown> }) {
    const lines = (details.lines ?? details.items ?? details.changes) as Record<string, unknown>[] | undefined;
    const rest = Object.entries(details).filter(([k, v]) => !['lines', 'items', 'changes'].includes(k) && v !== null && v !== undefined && typeof v !== 'object');
    return (
        <div className="space-y-3 border-t border-gray-100 pt-3">
            {rest.length > 0 && (
                <dl className="grid grid-cols-[140px_1fr] gap-y-1.5">
                    {rest.map(([k, v]) => (<Fragment key={k}><dt className="text-gray-500">{k}</dt><dd>{String(v)}</dd></Fragment>))}
                </dl>
            )}
            {Array.isArray(lines) && lines.length > 0 && (
                <div className="overflow-auto border border-gray-200 rounded-lg max-h-72">
                    <table className="w-full text-xs">
                        <thead className="bg-gray-50 text-left text-gray-600 sticky top-0">
                            <tr>{Object.keys(lines[0]).map(k => <th key={k} className="px-2 py-1.5">{k}</th>)}</tr>
                        </thead>
                        <tbody>
                            {lines.map((l, i) => (
                                <tr key={i} className="border-t border-gray-100">{Object.keys(lines[0]).map(k => <td key={k} className="px-2 py-1.5">{l[k] === null || l[k] === undefined ? '—' : String(l[k])}</td>)}</tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

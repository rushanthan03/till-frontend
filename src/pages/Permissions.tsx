import { useEffect, useMemo, useState } from 'react';
import { RotateCcw, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../components/Button';
import { handleApiError } from '../api/handleApiError';
import { PermissionsAPI } from '../features/permissions/permissionsAPI';
import { LEVEL_LABELS, type EditableRole, type Level, type PermissionDef, type RolePermissions } from '../features/permissions/permissions';

const ROLES: { role: EditableRole; label: string }[] = [
    { role: 'manager', label: 'Managers' },
    { role: 'cashier', label: 'Cashiers' },
];

const LEVEL_STYLE: Record<Level, string> = {
    yes: 'bg-green-600 text-white border-green-600',
    pin: 'bg-amber-500 text-white border-amber-500',
    no: 'bg-gray-700 text-white border-gray-700',
};

const clone = (p: RolePermissions): RolePermissions => ({ manager: { ...p.manager }, cashier: { ...p.cashier } });

/** Company admins decide what managers and cashiers may do. Admins themselves can always do everything. */
export const PermissionsPage = () => {
    const [defs, setDefs] = useState<PermissionDef[]>([]);
    const [saved, setSaved] = useState<RolePermissions | null>(null);
    const [defaults, setDefaults] = useState<RolePermissions | null>(null);
    const [draft, setDraft] = useState<RolePermissions | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        PermissionsAPI.settings()
            .then(r => { setDefs(r.permissions); setSaved(r.roles); setDefaults(r.defaults); setDraft(clone(r.roles)); })
            .catch(e => toast.error(handleApiError(e)));
    }, []);

    const changes = useMemo(() => {
        if (!draft || !saved) return [];
        return ROLES.flatMap(({ role }) => defs.filter(d => draft[role][d.key] !== saved[role][d.key]).map(d => ({ role, key: d.key })));
    }, [draft, saved, defs]);
    const atDefaults = !!draft && !!defaults && ROLES.every(({ role }) => defs.every(d => draft[role][d.key] === defaults[role][d.key]));

    const set = (role: EditableRole, key: PermissionDef['key'], level: Level) =>
        setDraft(prev => (prev ? { ...prev, [role]: { ...prev[role], [key]: level } } : prev));

    const save = async () => {
        if (!draft || !changes.length) return;
        setSaving(true);
        try {
            const body: Partial<RolePermissions> = {};
            for (const c of changes) body[c.role] = { ...(body[c.role] ?? {}), [c.key]: draft[c.role][c.key] } as RolePermissions[EditableRole];
            const r = await PermissionsAPI.update(body);
            setSaved(r.roles); setDraft(clone(r.roles));
            toast.success(`Saved ${changes.length} change${changes.length > 1 ? 's' : ''}. It's in the audit log.`);
        } catch (e) {
            toast.error(handleApiError(e));
        } finally {
            setSaving(false);
        }
    };

    if (!draft) return <div className="p-10 text-center text-gray-500" role="status">Loading permissions…</div>;

    const section = (group: PermissionDef['group'], title: string, note: string) => (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">{title}</h2>
                <p className="text-xs text-gray-500">{note}</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm table-fixed min-w-[760px]">
                    <colgroup><col /><col className="w-32" /><col className="w-52" /><col className="w-80" /></colgroup>
                    <thead className="text-left text-gray-600">
                        <tr>
                            <th className="px-4 py-2">Permission</th>
                            <th className="px-4 py-2 whitespace-nowrap">Company admins</th>
                            {ROLES.map(r => <th key={r.role} className="px-4 py-2">{r.label}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {defs.filter(d => d.group === group).map(d => (
                            <tr key={d.key} className="border-t border-gray-100 align-top">
                                <td className="px-4 py-3">
                                    <div className="font-medium text-gray-900">{d.label}</div>
                                    <div className="text-xs text-gray-500">{d.description}</div>
                                </td>
                                <td className="px-4 py-3"><span className="text-xs text-gray-500">Always allowed</span></td>
                                {ROLES.map(({ role, label }) => {
                                    const options = d.levels[role];
                                    const current = draft[role][d.key];
                                    const changed = saved && saved[role][d.key] !== current;
                                    if (options.length === 1) return <td key={role} className="px-4 py-3"><span className="text-xs text-gray-400">{LEVEL_LABELS[options[0]]}</span></td>;
                                    return (
                                        <td key={role} className="px-4 py-3">
                                            <div className={`inline-flex rounded-lg border ${changed ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'} p-0.5 gap-0.5`} role="radiogroup" aria-label={`${d.label} for ${label.toLowerCase()}`}>
                                                {options.map(l => (
                                                    <button key={l} type="button" role="radio" aria-checked={current === l} onClick={() => set(role, d.key, l)}
                                                        className={`px-2.5 py-1 rounded-md text-xs font-semibold border whitespace-nowrap ${current === l ? LEVEL_STYLE[l] : 'border-transparent text-gray-600 hover:bg-gray-100'}`}>
                                                        {LEVEL_LABELS[l]}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="space-y-5 pb-20">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Permissions</h1>
                    <p className="text-gray-500 mt-1 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        What managers and cashiers may do in every store. Company admins can always do everything.
                    </p>
                </div>
                <Button variant="outline" onClick={() => defaults && setDraft(clone(defaults))} disabled={atDefaults}><RotateCcw className="w-4 h-4 mr-2" />Back to defaults</Button>
            </div>

            {section('till', 'At the till', '"Manager PIN" means a manager types their PIN on the till each time. A manager can only approve what their own role is allowed to do.')}
            {section('office', 'Back office', 'Pages and changes away from the till. Cashiers only use the till.')}

            <p className="text-sm text-gray-500">The server applies changes within 30 seconds. Staff who are signed in see new menus and buttons after they reload the page or sign in again.</p>

            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-end gap-3 z-30">
                <span className="text-sm text-gray-600 mr-auto">{changes.length ? `${changes.length} unsaved change${changes.length > 1 ? 's' : ''}` : 'No changes'}</span>
                <Button variant="outline" onClick={() => saved && setDraft(clone(saved))} disabled={!changes.length || saving}>Undo changes</Button>
                <Button onClick={save} isLoading={saving} disabled={!changes.length}>Save</Button>
            </div>
        </div>
    );
};

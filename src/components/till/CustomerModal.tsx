import { FormEvent, useEffect, useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { toast } from 'react-toastify';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { handleApiError } from '../../api/handleApiError';
import { CustomersAPI, Customer } from '../../features/customers/customersAPI';

interface Props {
    storeId: string;
    onPick: (c: Customer) => void;
    onClose: () => void;
}

/** Find a loyalty customer by name, phone or card number, or sign a new one up. */
export function CustomerModal({ storeId, onPick, onClose }: Props) {
    const [mode, setMode] = useState<'find' | 'new'>('find');
    const [term, setTerm] = useState('');
    const [results, setResults] = useState<Customer[]>([]);
    const [form, setForm] = useState({ name: '', phone: '', email: '', consent: false });
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (mode !== 'find' || term.trim().length < 2) { setResults([]); return; }
        const t = setTimeout(() => {
            CustomersAPI.list(storeId, { search: term.trim(), limit: 8 }).then(r => setResults(r.data)).catch(() => setResults([]));
        }, 250);
        return () => clearTimeout(t);
    }, [term, storeId, mode]);

    const create = async (e: FormEvent) => {
        e.preventDefault();
        setBusy(true);
        try {
            const c = await CustomersAPI.create(storeId, {
                name: form.name.trim(),
                phone: form.phone.trim() || undefined,
                email: form.email.trim() || undefined,
                marketingConsent: form.consent,
            });
            toast.success(`Welcome ${c.name}! Card ${c.cardNumber}`);
            onPick(c);
        } catch (err) { toast.error(handleApiError(err)); } finally { setBusy(false); }
    };

    const field = 'mt-1 w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600';
    return (
        <Modal isOpen onClose={onClose} title="Loyalty customer" size="sm">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2" role="tablist">
                    {(['find', 'new'] as const).map(m => (
                        <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
                            className={`py-2 rounded-lg border text-sm font-semibold ${mode === m ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-100'}`}>
                            {m === 'find' ? 'Find customer' : 'New customer'}
                        </button>
                    ))}
                </div>
                {mode === 'find' ? (
                    <div className="space-y-2">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input autoFocus value={term} onChange={e => setTerm(e.target.value)} placeholder="Name, phone or card number" aria-label="Find customer"
                                className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600" />
                        </div>
                        {results.map(c => (
                            <button key={c.id} type="button" onClick={() => onPick(c)} className="w-full flex justify-between items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 hover:bg-blue-50 text-left">
                                <span><span className="font-medium">{c.name}</span><span className="block text-xs text-gray-500">{c.phone ?? 'No phone'} · {c.cardNumber}</span></span>
                                <span className="text-sm font-semibold text-blue-700">{c.pointsBalance} pts</span>
                            </button>
                        ))}
                        {term.trim().length >= 2 && results.length === 0 && <p className="text-sm text-gray-500 text-center py-3">No match. Try "New customer".</p>}
                    </div>
                ) : (
                    <form onSubmit={create} className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Name<input autoFocus required maxLength={100} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={field} /></label>
                        <label className="block text-sm font-medium text-gray-700">Phone<input inputMode="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={field} /></label>
                        <label className="block text-sm font-medium text-gray-700">Email<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={field} /></label>
                        <label className="flex items-start gap-2 text-sm text-gray-700">
                            <input type="checkbox" checked={form.consent} onChange={e => setForm({ ...form, consent: e.target.checked })} className="mt-1" />
                            <span>Customer agrees to receive offers by phone or email. Leave unticked if they have not said yes.</span>
                        </label>
                        <Button type="submit" disabled={!form.name.trim() || busy} className="w-full"><UserPlus className="w-4 h-4 mr-2" />{busy ? 'Saving…' : 'Sign up and attach'}</Button>
                    </form>
                )}
            </div>
        </Modal>
    );
}

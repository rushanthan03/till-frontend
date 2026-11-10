import { FormEvent, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { ApprovalsAPI, Approval } from '../../features/approvals/approvalsAPI';
import { handleApiError } from '../../api/handleApiError';

interface Props {
    storeId: string;
    /** What the manager is being asked to approve, e.g. "10% off Butter Croissant". */
    summary: string;
    onApproved: (approval: Approval) => void;
    onClose: () => void;
}

/** Asks a manager to type their PIN. The cashier never learns the PIN: only a short-lived token comes back. */
export function ManagerPinModal({ storeId, summary, onApproved, onClose }: Props) {
    const [pin, setPin] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const submit = async (e?: FormEvent) => {
        e?.preventDefault();
        if (pin.length < 4 || busy) return;
        setBusy(true); setError('');
        try {
            onApproved(await ApprovalsAPI.verify(storeId, pin));
        } catch (err) {
            setError(handleApiError(err));
            setPin('');
        } finally {
            setBusy(false);
        }
    };

    const press = (k: string) => setPin(p => (p.length < 6 ? p + k : p));

    return (
        <Modal isOpen onClose={onClose} title="Manager approval" size="sm">
            <form onSubmit={submit} className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-200 p-3">
                    <ShieldCheck className="w-6 h-6 text-blue-700 shrink-0" />
                    <p className="text-sm text-blue-900">A manager must approve: <b>{summary}</b></p>
                </div>
                <div aria-label="PIN entry" className="flex justify-center gap-2 h-8">
                    {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
                        <span key={i} className={`w-4 h-4 rounded-full mt-2 ${i < pin.length ? 'bg-gray-900' : 'bg-gray-200'}`} />
                    ))}
                </div>
                <input type="password" inputMode="numeric" autoFocus autoComplete="off" value={pin} aria-label="Manager PIN"
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} className="sr-only" />
                {error && <p role="alert" className="text-sm text-red-700 text-center">{error}</p>}
                <div className="grid grid-cols-3 gap-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(k => (
                        <button key={k} type="button" onClick={() => press(k)} className="py-3 text-xl font-semibold rounded-lg border border-gray-300 hover:bg-gray-100">{k}</button>
                    ))}
                    <button type="button" onClick={() => setPin('')} className="py-3 rounded-lg border border-gray-300 hover:bg-gray-100">Clear</button>
                    <button type="button" onClick={() => press('0')} className="py-3 text-xl font-semibold rounded-lg border border-gray-300 hover:bg-gray-100">0</button>
                    <button type="button" onClick={() => setPin(p => p.slice(0, -1))} className="py-3 rounded-lg border border-gray-300 hover:bg-gray-100" aria-label="Backspace">⌫</button>
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={pin.length < 4 || busy}>{busy ? 'Checking…' : 'Approve'}</Button>
                </div>
            </form>
        </Modal>
    );
}

import { FormEvent, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from './Button';
import { ApprovalsAPI } from '../features/approvals/approvalsAPI';
import { handleApiError } from '../api/handleApiError';

/** Lets a manager or admin set the PIN they type on the till to approve discounts and overrides. */
export function ApprovalPinCard() {
    const [pin, setPin] = useState('');
    const [confirm, setConfirm] = useState('');
    const [busy, setBusy] = useState(false);

    const mismatch = confirm !== '' && pin !== confirm;
    const valid = /^\d{4,6}$/.test(pin) && pin === confirm;

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (!valid) return;
        setBusy(true);
        try {
            await ApprovalsAPI.setPin(pin);
            toast.success('Approval PIN saved');
            setPin(''); setConfirm('');
        } catch (err) {
            toast.error(handleApiError(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 p-5 max-w-md space-y-3">
            <div className="flex items-center gap-2 font-semibold text-gray-900"><KeyRound className="w-5 h-5" />Approval PIN</div>
            <p className="text-sm text-gray-600">Cashiers ask you to type this PIN to approve discounts and price overrides. Use 4 to 6 digits and keep it private.</p>
            <input type="password" inputMode="numeric" autoComplete="new-password" placeholder="New PIN" aria-label="New PIN" value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg" />
            <input type="password" inputMode="numeric" autoComplete="new-password" placeholder="Confirm PIN" aria-label="Confirm PIN" value={confirm}
                onChange={(e) => setConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg" />
            {mismatch && <p role="alert" className="text-sm text-red-700">PINs do not match</p>}
            <Button type="submit" disabled={!valid || busy}>{busy ? 'Saving…' : 'Save PIN'}</Button>
        </form>
    );
}

import { useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Landmark, DoorOpen } from 'lucide-react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import type { CashMovementType } from '../../features/shifts/types';

interface Props {
    submitting: boolean;
    onSubmit: (m: { type: CashMovementType; amount?: number; reason: string }) => void;
    onClose: () => void;
}

const OPTIONS: { type: CashMovementType; label: string; hint: string; icon: typeof Landmark; reasons: string[] }[] = [
    { type: 'paid_in', label: 'Paid in', hint: 'Cash added to the drawer', icon: ArrowDownToLine, reasons: ['Change from safe', 'Float top-up', 'Other'] },
    { type: 'paid_out', label: 'Paid out', hint: 'Cash taken for an expense (manager approval)', icon: ArrowUpFromLine, reasons: ['Cleaning supplies', 'Milk / shop run', 'Delivery driver', 'Other'] },
    { type: 'safe_drop', label: 'Safe drop', hint: 'Excess cash moved to the safe', icon: Landmark, reasons: ['Drawer limit reached', 'Excess cash', 'Other'] },
    { type: 'no_sale', label: 'No sale', hint: 'Open the drawer without a sale', icon: DoorOpen, reasons: ['Change for customer', 'Drawer check', 'Other'] },
];

/** Cash in and out of the drawer outside normal sales. Every entry is recorded with a reason. */
export function CashMovementModal({ submitting, onSubmit, onClose }: Props) {
    const [type, setType] = useState<CashMovementType>('paid_in');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [other, setOther] = useState('');
    const opt = OPTIONS.find(o => o.type === type)!;
    const n = Number(amount);
    const finalReason = reason === 'Other' ? other.trim() : reason;
    const amountOk = type === 'no_sale' || (amount !== '' && Number.isFinite(n) && n > 0 && n <= 100000);
    const canSubmit = amountOk && !!finalReason && !submitting;

    return (
        <Modal isOpen onClose={onClose} title="Cash in / out" size="sm">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Movement type">
                    {OPTIONS.map(o => (
                        <button key={o.type} type="button" role="radio" aria-checked={type === o.type}
                            onClick={() => { setType(o.type); setReason(''); setOther(''); }}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-semibold ${type === o.type ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-100'}`}>
                            <o.icon className="w-4 h-4" />{o.label}
                        </button>
                    ))}
                </div>
                <p className="text-sm text-gray-600">{opt.hint}</p>
                {type !== 'no_sale' && (
                    <label className="block text-sm font-medium text-gray-700">
                        Amount (£)
                        <input type="number" inputMode="decimal" step="0.01" min="0" value={amount} autoFocus onChange={(e) => setAmount(e.target.value)}
                            className="mt-1 w-full px-3 py-2.5 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600" />
                    </label>
                )}
                <label className="block text-sm font-medium text-gray-700">
                    Reason
                    <select value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg bg-white">
                        <option value="">Choose a reason…</option>
                        {opt.reasons.map(r => <option key={r}>{r}</option>)}
                    </select>
                </label>
                {reason === 'Other' && (
                    <input value={other} onChange={(e) => setOther(e.target.value)} maxLength={100} placeholder="Describe the reason" aria-label="Other reason"
                        className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg" />
                )}
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button disabled={!canSubmit} onClick={() => onSubmit({ type, amount: type === 'no_sale' ? undefined : n, reason: finalReason })}>
                        {submitting ? 'Saving…' : type === 'no_sale' ? 'Record no sale' : 'Record'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

import { useEffect, useRef, useState } from 'react';
import { Banknote, CreditCard, CheckCircle2, XCircle, Loader2, Trash2 } from 'lucide-react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { money } from '../../utils/money';
import { round2 } from '../../utils/basket';
import type { PaymentInput } from '../../features/sales/types';

type CardState = 'idle' | 'connecting' | 'present' | 'processing' | 'approved' | 'declined';

const CARD_STEPS: Record<CardState, string> = {
    idle: 'Ready',
    connecting: 'Connecting to card terminal…',
    present: 'Present, insert or tap card',
    processing: 'Processing…',
    approved: 'Approved',
    declined: 'Declined',
};

interface Props {
    total: number;
    isSubmitting: boolean;
    onClose: () => void;
    /** Called once the full amount is covered. */
    onComplete: (payments: PaymentInput[]) => void;
}

const QUICK_CASH = [5, 10, 20, 50];

/**
 * Cash + card payment with split-tender support.
 * The card terminal is SIMULATED for the demo; a real terminal SDK replaces `runCardSimulation`.
 */
export function PaymentModal({ total, isSubmitting, onClose, onComplete }: Props) {
    const [payments, setPayments] = useState<PaymentInput[]>([]);
    const [mode, setMode] = useState<'cash' | 'card'>('cash');
    const [cashInput, setCashInput] = useState('');
    const [cardAmountInput, setCardAmountInput] = useState('');
    const [cardState, setCardState] = useState<CardState>('idle');
    const [declineNext, setDeclineNext] = useState(false);
    const timers = useRef<number[]>([]);

    const paid = round2(payments.reduce((a, p) => a + p.amount, 0));
    const remaining = round2(total - paid);
    const changeDue = round2(payments.reduce((a, p) => a + (p.method === 'cash' ? (p.tendered ?? p.amount) - p.amount : 0), 0));
    const cardBusy = cardState === 'connecting' || cardState === 'present' || cardState === 'processing';

    useEffect(() => () => timers.current.forEach(clearTimeout), []);

    const addCash = (received: number) => {
        if (!(received > 0) || remaining <= 0) return;
        const amount = Math.min(received, remaining);
        setPayments(prev => [...prev, { method: 'cash', amount: round2(amount), tendered: round2(received) }]);
        setCashInput('');
    };

    const runCardSimulation = () => {
        const amount = cardAmountInput === '' ? remaining : round2(Number(cardAmountInput));
        if (!(amount > 0) || amount > remaining) return;
        const steps: [CardState, number][] = [['connecting', 0], ['present', 900], ['processing', 2200]];
        steps.forEach(([state, delay]) => timers.current.push(window.setTimeout(() => setCardState(state), delay)));
        timers.current.push(window.setTimeout(() => {
            if (declineNext) {
                setCardState('declined');
                setDeclineNext(false);
                return;
            }
            setCardState('approved');
            const reference = `SIM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
            setPayments(prev => [...prev, { method: 'card', amount, reference }]);
            setCardAmountInput('');
        }, 3400));
    };

    const resetCard = () => {
        timers.current.forEach(clearTimeout);
        timers.current = [];
        setCardState('idle');
    };

    const removePayment = (i: number) => setPayments(prev => prev.filter((_, idx) => idx !== i));
    const cashValue = Number(cashInput);
    const complete = remaining <= 0;

    return (
        <Modal isOpen onClose={() => { if (!cardBusy && !isSubmitting) onClose(); }} title="Payment" size="lg">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => { setMode('cash'); resetCard(); }} disabled={cardBusy || complete}
                            className={`flex flex-col items-center gap-1 rounded-xl border-2 p-4 font-semibold transition ${mode === 'cash' ? 'border-green-600 bg-green-50 text-green-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'} disabled:opacity-50`}>
                            <Banknote className="w-7 h-7" />Cash
                        </button>
                        <button type="button" onClick={() => setMode('card')} disabled={cardBusy || complete}
                            className={`flex flex-col items-center gap-1 rounded-xl border-2 p-4 font-semibold transition ${mode === 'card' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'} disabled:opacity-50`}>
                            <CreditCard className="w-7 h-7" />Card
                        </button>
                    </div>

                    {!complete && mode === 'cash' && (
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700" htmlFor="cash-received">Amount received</label>
                            <input id="cash-received" autoFocus inputMode="decimal" type="number" min="0" step="0.01" value={cashInput}
                                onChange={(e) => setCashInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') addCash(cashValue); }}
                                className="w-full px-4 py-3 text-2xl font-bold border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-600" placeholder="0.00" />
                            <div className="grid grid-cols-5 gap-2">
                                <button type="button" onClick={() => addCash(remaining)} className="py-3 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700">Exact</button>
                                {QUICK_CASH.map(v => (
                                    <button key={v} type="button" onClick={() => addCash(v)} className="py-3 rounded-lg border-2 border-gray-300 font-bold hover:bg-gray-50">{money(v).replace(/\.00$/, '')}</button>
                                ))}
                            </div>
                            <Button className="w-full" size="lg" onClick={() => addCash(cashValue)} disabled={!(cashValue > 0)}>Confirm cash</Button>
                        </div>
                    )}

                    {!complete && mode === 'card' && (
                        <div className="space-y-3">
                            <div className={`rounded-xl border-2 p-5 text-center ${cardState === 'approved' ? 'border-green-500 bg-green-50' : cardState === 'declined' ? 'border-red-400 bg-red-50' : 'border-blue-200 bg-blue-50'}`} role="status" aria-live="polite">
                                {cardBusy && <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-600" />}
                                {cardState === 'approved' && <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />}
                                {cardState === 'declined' && <XCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />}
                                <div className="font-semibold text-gray-900">{CARD_STEPS[cardState]}</div>
                                <div className="text-xs text-gray-500 mt-1">Simulated terminal (demo)</div>
                            </div>
                            <label className="block text-sm font-medium text-gray-700" htmlFor="card-amount">Card amount (default: remaining)</label>
                            <input id="card-amount" type="number" min="0" step="0.01" value={cardAmountInput} placeholder={remaining.toFixed(2)} disabled={cardBusy}
                                onChange={(e) => setCardAmountInput(e.target.value)}
                                className="w-full px-4 py-3 text-xl font-bold border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-600" />
                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                <input type="checkbox" checked={declineNext} onChange={(e) => setDeclineNext(e.target.checked)} disabled={cardBusy} className="w-4 h-4" />
                                Demo: decline the next card
                            </label>
                            <Button className="w-full" size="lg" onClick={() => { resetCard(); runCardSimulation(); }} disabled={cardBusy}>
                                {cardState === 'declined' ? 'Try card again' : 'Take card payment'}
                            </Button>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="rounded-xl bg-gray-900 text-white p-5 space-y-2">
                        <div className="flex justify-between text-sm text-gray-300"><span>Sale total</span><span>{money(total)}</span></div>
                        <div className="flex justify-between text-sm text-gray-300"><span>Paid so far</span><span>{money(paid)}</span></div>
                        <div className="flex justify-between items-end border-t border-gray-700 pt-2">
                            <span className="text-sm">{complete ? 'Fully paid' : 'Remaining'}</span>
                            <span className="text-4xl font-extrabold">{money(Math.max(remaining, 0))}</span>
                        </div>
                        {complete && changeDue > 0 && (
                            <div className="flex justify-between items-end bg-amber-400 text-gray-900 rounded-lg px-3 py-2">
                                <span className="font-semibold">Change due</span>
                                <span className="text-3xl font-extrabold">{money(changeDue)}</span>
                            </div>
                        )}
                    </div>

                    {payments.length > 0 && (
                        <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl">
                            {payments.map((p, i) => (
                                <li key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                                    <span className="flex items-center gap-2 font-medium text-gray-800">
                                        {p.method === 'cash' ? <Banknote className="w-4 h-4 text-green-600" /> : <CreditCard className="w-4 h-4 text-blue-600" />}
                                        {p.method === 'cash' ? 'Cash' : 'Card'}
                                        {p.method === 'cash' && p.tendered && p.tendered !== p.amount ? <span className="text-gray-500">(given {money(p.tendered)})</span> : null}
                                        {p.reference ? <span className="text-xs text-gray-500">{p.reference}</span> : null}
                                    </span>
                                    <span className="flex items-center gap-2 font-semibold">
                                        {money(p.amount)}
                                        {!isSubmitting && p.method === 'cash' && (
                                            <button type="button" aria-label="Remove payment" onClick={() => removePayment(i)} className="p-1 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
                                        )}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="flex gap-2 pt-1">
                        <Button variant="outline" className="flex-1" onClick={onClose} disabled={cardBusy || isSubmitting}>Back to sale</Button>
                        <Button className="flex-1" size="lg" disabled={!complete || isSubmitting} isLoading={isSubmitting} onClick={() => onComplete(payments)}>Complete sale</Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

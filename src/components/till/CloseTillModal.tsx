import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Printer } from 'lucide-react';
import { toast } from 'react-toastify';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { ReportView, Row, Divider } from './ReportRows';
import { money } from '../../utils/money';
import { round2 } from '../../utils/basket';
import { handleApiError } from '../../api/handleApiError';
import { ShiftsAPI } from '../../features/shifts/shiftsAPI';
import type { CountResult, Shift } from '../../features/shifts/types';

// Cash denominations for the drawer count (GBP).
const DENOMINATIONS = [
    { label: '£50', value: 50 }, { label: '£20', value: 20 }, { label: '£10', value: 10 }, { label: '£5', value: 5 },
    { label: '£2', value: 2 }, { label: '£1', value: 1 }, { label: '50p', value: 0.5 }, { label: '20p', value: 0.2 },
    { label: '10p', value: 0.1 }, { label: '5p', value: 0.05 }, { label: '2p', value: 0.02 }, { label: '1p', value: 0.01 },
];

type Step = 'check' | 'count' | 'result' | 'done';

interface Props {
    storeId: string;
    storeName: string;
    heldCount: number;
    basketHasItems: boolean;
    /** Called when the till session has been closed and the cashier dismisses the Z report. */
    onClosed: () => void;
    onCancel: () => void;
}

/**
 * Close till wizard. The count is BLIND: the expected cash stays hidden until the
 * cashier has submitted what they counted.
 */
export function CloseTillModal({ storeId, storeName, heldCount, basketHasItems, onClosed, onCancel }: Props) {
    const [step, setStep] = useState<Step>('check');
    const [counts, setCounts] = useState<Record<string, string>>({});
    const [totalOverride, setTotalOverride] = useState('');
    const [result, setResult] = useState<CountResult | null>(null);
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [closedShift, setClosedShift] = useState<Shift | null>(null);

    const counted = useMemo(() => {
        if (totalOverride !== '') return round2(Number(totalOverride) || 0);
        return round2(DENOMINATIONS.reduce((sum, d) => sum + d.value * (Number(counts[d.label]) || 0), 0));
    }, [counts, totalOverride]);

    const submitCount = async () => {
        setBusy(true);
        try {
            setResult(await ShiftsAPI.count(storeId, counted));
            setStep('result');
        } catch (e) { toast.error(handleApiError(e)); } finally { setBusy(false); }
    };

    const confirmClose = async () => {
        if (!result) return;
        setBusy(true);
        try {
            setClosedShift(await ShiftsAPI.close(storeId, { countedCash: result.countedCash, note: note.trim() || undefined }));
            setStep('done');
        } catch (e) { toast.error(handleApiError(e)); } finally { setBusy(false); }
    };

    const stepNames = ['Check', 'Count cash', 'Review', 'Z report'];
    const stepIndex = { check: 0, count: 1, result: 2, done: 3 }[step];

    return (
        <Modal isOpen onClose={step === 'done' ? onClosed : onCancel} title="Close till" size={step === 'count' ? 'lg' : 'md'}>
            <ol className="flex gap-2 mb-5 text-xs font-semibold" aria-label="Progress">
                {stepNames.map((n, i) => (
                    <li key={n} className={`flex-1 text-center py-1.5 rounded-full ${i === stepIndex ? 'bg-blue-600 text-white' : i < stepIndex ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>{i + 1}. {n}</li>
                ))}
            </ol>

            {step === 'check' && (
                <div className="space-y-4">
                    {basketHasItems && (
                        <div className="flex gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-red-800 text-sm"><AlertTriangle className="w-5 h-5 shrink-0" />There is an unfinished sale in the basket. Complete or void it before closing.</div>
                    )}
                    {heldCount > 0 && (
                        <div className="flex gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-amber-800 text-sm"><AlertTriangle className="w-5 h-5 shrink-0" />{heldCount} held sale{heldCount === 1 ? '' : 's'} will not be carried over. Recall and finish or delete {heldCount === 1 ? 'it' : 'them'} first.</div>
                    )}
                    {!basketHasItems && heldCount === 0 && (
                        <div className="flex gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-green-800 text-sm"><CheckCircle2 className="w-5 h-5 shrink-0" />No unfinished sales. Ready to count the drawer.</div>
                    )}
                    <p className="text-sm text-gray-600">Next you will count the cash in the drawer. The expected amount is hidden until you submit your count.</p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onCancel}>Cancel</Button>
                        <Button onClick={() => setStep('count')} disabled={basketHasItems}>Continue to cash count</Button>
                    </div>
                </div>
            )}

            {step === 'count' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {DENOMINATIONS.map(d => (
                            <label key={d.label} className="block">
                                <span className="text-sm font-semibold text-gray-700">{d.label}</span>
                                <input type="number" inputMode="numeric" min="0" step="1" value={counts[d.label] ?? ''} aria-label={`Number of ${d.label}`}
                                    onChange={(e) => { setTotalOverride(''); setCounts(c => ({ ...c, [d.label]: e.target.value })); }}
                                    className="mt-1 w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600" />
                            </label>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-end justify-between gap-3 border-t border-gray-100 pt-4">
                        <label className="text-sm text-gray-600">Or enter the total counted
                            <input type="number" min="0" step="0.01" value={totalOverride} onChange={(e) => setTotalOverride(e.target.value)} aria-label="Total counted"
                                className="mt-1 block w-40 px-3 py-2 border border-gray-300 rounded-lg" placeholder="0.00" />
                        </label>
                        <div className="text-right">
                            <div className="text-xs uppercase tracking-wider text-gray-500">Counted</div>
                            <div className="text-4xl font-extrabold tabular-nums">{money(counted)}</div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setStep('check')}>Back</Button>
                        <Button onClick={submitCount} isLoading={busy}>Submit count</Button>
                    </div>
                </div>
            )}

            {step === 'result' && result && (
                <div className="space-y-4">
                    <div className="rounded-xl bg-gray-900 text-white p-5 space-y-2">
                        <div className="flex justify-between text-gray-300"><span>Expected cash</span><span>{money(result.expectedCash)}</span></div>
                        <div className="flex justify-between text-gray-300"><span>Counted cash</span><span>{money(result.countedCash)}</span></div>
                        <div className="flex justify-between items-end border-t border-gray-700 pt-2">
                            <span>{result.variance === 0 ? 'Balanced' : result.variance > 0 ? 'Over' : 'Short'}</span>
                            <span className={`text-4xl font-extrabold ${result.variance === 0 ? 'text-green-400' : result.variance > 0 ? 'text-amber-300' : 'text-red-400'}`}>
                                {result.variance > 0 ? '+' : ''}{money(result.variance)}
                            </span>
                        </div>
                    </div>
                    {result.requiresNote && (
                        <div className="space-y-2">
                            <div className="flex gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-amber-800 text-sm"><AlertTriangle className="w-5 h-5 shrink-0" />This difference is over the allowed limit. Give a reason to close the till.</div>
                            <label className="block text-sm font-medium text-gray-700" htmlFor="variance-note">Reason for the difference *</label>
                            <textarea id="variance-note" rows={2} maxLength={250} value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                        </div>
                    )}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setStep('count')}>Recount</Button>
                        <Button onClick={confirmClose} isLoading={busy} disabled={result.requiresNote && !note.trim()}>Close till</Button>
                    </div>
                </div>
            )}

            {step === 'done' && closedShift && (
                <div className="space-y-4">
                    <ReportView
                        title="Z REPORT — TILL CLOSED"
                        storeName={storeName}
                        cashier={closedShift.cashierName}
                        opened={closedShift.openedAt}
                        closed={closedShift.closedAt}
                        openingFloat={closedShift.openingFloat}
                        figures={{
                            transactions: closedShift.transactionCount ?? 0,
                            refundCount: closedShift.refundCount ?? 0,
                            grossSales: closedShift.grossSales ?? 0,
                            refundsTotal: closedShift.refundsTotal ?? 0,
                            netSales: round2((closedShift.grossSales ?? 0) - (closedShift.refundsTotal ?? 0)),
                            vat: closedShift.vatTotal ?? 0,
                            cashSales: closedShift.cashSales ?? 0,
                            cardSales: closedShift.cardSales ?? 0,
                            cashRefunds: closedShift.cashRefunds ?? 0,
                            cardRefunds: closedShift.cardRefunds ?? 0,
                        }}
                        extra={<>
                            <Divider />
                            <Row label="Expected cash" value={money(closedShift.expectedCash)} />
                            <Row label="Counted cash" value={money(closedShift.countedCash)} />
                            <Row label="Difference" value={`${(closedShift.variance ?? 0) > 0 ? '+' : ''}${money(closedShift.variance)}`} bold tone={closedShift.variance === 0 ? 'good' : 'bad'} />
                            {closedShift.closeNote && <div className="mt-1 text-gray-600">Reason: {closedShift.closeNote}</div>}
                        </>}
                    />
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Print</Button>
                        <Button className="flex-1" onClick={onClosed}>Done</Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}

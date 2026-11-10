import { useState } from 'react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { money } from '../../utils/money';
import { BasketLine, LineAdjustment, calcLine, round2 } from '../../utils/basket';

interface Props {
    line: BasketLine;
    onApply: (adjustment: LineAdjustment) => void;
    onRemove?: () => void;
    onClose: () => void;
}

const REASONS = ['Damaged packaging', 'Short date', 'Price match', 'Customer goodwill', 'Shelf price error', 'Other'];
const PRESETS = [5, 10, 20, 50];

export function DiscountModal({ line, onApply, onRemove, onClose }: Props) {
    const shelf = line.product.price;
    const [kind, setKind] = useState<'percent' | 'price'>(line.adjustment?.kind ?? 'percent');
    const [value, setValue] = useState(line.adjustment ? String(line.adjustment.value) : '');
    const [reason, setReason] = useState(REASONS.includes(line.adjustment?.reason ?? '') ? line.adjustment!.reason : (line.adjustment ? 'Other' : REASONS[0]));
    const [other, setOther] = useState(line.adjustment && !REASONS.includes(line.adjustment.reason) ? line.adjustment.reason : '');

    const n = Number(value);
    const valid = value !== '' && Number.isFinite(n) && (kind === 'percent' ? n > 0 && n <= 100 : n >= 0 && n < shelf);
    const newUnit = !valid ? shelf : kind === 'percent' ? round2(shelf * (1 - n / 100)) : round2(n);
    const saving = round2(calcLine(shelf, line.quantity, line.product.vatRate).lineTotal - calcLine(newUnit, line.quantity, line.product.vatRate).lineTotal);
    const finalReason = reason === 'Other' ? other.trim() : reason;
    const canApply = valid && saving > 0 && !!finalReason;

    return (
        <Modal isOpen onClose={onClose} title="Discount / price override" size="sm">
            <div className="space-y-4">
                <div>
                    <p className="font-semibold text-gray-900">{line.product.name}</p>
                    <p className="text-sm text-gray-600">Shelf price {money(shelf)} × {line.quantity}</p>
                </div>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Adjustment type">
                    {(['percent', 'price'] as const).map(k => (
                        <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => { setKind(k); setValue(''); }}
                            className={`py-2 rounded-lg border text-sm font-semibold ${kind === k ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-100'}`}>
                            {k === 'percent' ? '% off' : 'New price'}
                        </button>
                    ))}
                </div>
                {kind === 'percent' && (
                    <div className="flex gap-2">
                        {PRESETS.map(p => (
                            <button key={p} type="button" onClick={() => setValue(String(p))}
                                className={`flex-1 py-2 rounded-lg border text-sm ${Number(value) === p ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-300 hover:bg-gray-100'}`}>{p}%</button>
                        ))}
                    </div>
                )}
                <label className="block text-sm font-medium text-gray-700">
                    {kind === 'percent' ? 'Percentage off' : 'New unit price (£, VAT included)'}
                    <input type="number" inputMode="decimal" step="0.01" min="0" value={value} autoFocus
                        onChange={(e) => setValue(e.target.value)}
                        className="mt-1 w-full px-3 py-2.5 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600" />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                    Reason
                    <select value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg bg-white">
                        {REASONS.map(r => <option key={r}>{r}</option>)}
                    </select>
                </label>
                {reason === 'Other' && (
                    <input value={other} onChange={(e) => setOther(e.target.value)} maxLength={100} placeholder="Describe the reason" aria-label="Other reason"
                        className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg" />
                )}
                {valid && (
                    <div className="rounded-lg bg-green-50 text-green-800 px-3 py-2 text-sm">
                        New price {money(newUnit)} each · customer saves <b>{money(saving)}</b>
                    </div>
                )}
                <div className="flex justify-between gap-2">
                    {onRemove ? <Button variant="outline" onClick={onRemove}>Remove discount</Button> : <span />}
                    <span className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button disabled={!canApply} onClick={() => onApply({ kind, value: n, reason: finalReason })}>Apply</Button>
                    </span>
                </div>
            </div>
        </Modal>
    );
}

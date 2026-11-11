import { useEffect, useState } from 'react';
import { Gift } from 'lucide-react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { money } from '../../utils/money';
import { MIN_REDEEM_POINTS, POINTS_PER_POUND, maxRedeemable, pointsValue } from '../../utils/loyalty';

interface Props {
    isOpen: boolean;
    customerName: string;
    balance: number;
    /** Bill before points. */
    total: number;
    /** Points already chosen for this sale (0 = none). */
    current: number;
    onClose: () => void;
    onApply: (points: number) => void;
}

/** Choose how many loyalty points to spend on this sale (100 points = £1 off). */
export function PointsModal({ isOpen, customerName, balance, total, current, onClose, onApply }: Props) {
    const max = maxRedeemable(balance, total);
    const [input, setInput] = useState('');

    useEffect(() => { if (isOpen) setInput(String(current || max)); }, [isOpen, current, max]);

    const points = Math.floor(Number(input));
    const error =
        !Number.isFinite(points) || points <= 0 ? 'Enter a number of points'
            : points < MIN_REDEEM_POINTS ? `At least ${MIN_REDEEM_POINTS} points at a time`
                : points > balance ? `${customerName} has ${balance} points`
                    : pointsValue(points) > total ? 'That is more than the bill'
                        : '';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Use loyalty points" size="sm"
            description={`${POINTS_PER_POUND} points = £1 off. Points come off the price of the goods.`}>
            <div className="space-y-4">
                <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900 flex gap-2">
                    <Gift className="w-5 h-5 shrink-0" />
                    <div><b>{customerName}</b> has <b>{balance}</b> points, worth {money(pointsValue(balance))}.</div>
                </div>
                {balance < MIN_REDEEM_POINTS ? (
                    <p className="text-gray-700">At least {MIN_REDEEM_POINTS} points are needed before they can be spent.</p>
                ) : (
                    <>
                        <label className="block text-sm font-medium text-gray-700">Points to spend
                            <input type="number" min={MIN_REDEEM_POINTS} max={max} step="1" value={input} onChange={(e) => setInput(e.target.value)} autoFocus
                                className="mt-1 w-full px-3 py-3 text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600" aria-label="Points to spend" />
                        </label>
                        <div className="flex gap-2">
                            <button type="button" className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm" onClick={() => setInput(String(max))}>All usable ({max})</button>
                            {[500, 1000].filter(n => n < max).map(n => (
                                <button key={n} type="button" className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm" onClick={() => setInput(String(n))}>{n}</button>
                            ))}
                        </div>
                        <div className="text-lg">Takes off <b>{money(error ? 0 : pointsValue(points))}</b> of {money(total)}</div>
                        {error && <div className="text-sm text-red-600">{error}</div>}
                    </>
                )}
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                    {current > 0 && <Button variant="outline" onClick={() => onApply(0)}>Don't use points</Button>}
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onApply(points)} disabled={!!error || balance < MIN_REDEEM_POINTS}>Use points</Button>
                </div>
            </div>
        </Modal>
    );
}

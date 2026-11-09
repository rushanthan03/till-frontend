import { FormEvent, useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '../Button';
import { money } from '../../utils/money';

interface Props {
    cashierName: string;
    storeName: string;
    isSubmitting: boolean;
    onOpen: (openingFloat: number, note?: string) => void;
}

const QUICK_FLOATS = [50, 100, 150, 200];

/** Shown when the cashier has no open till session: nothing can be sold until a float is declared. */
export function OpenTillScreen({ cashierName, storeName, isSubmitting, onOpen }: Props) {
    const [floatInput, setFloatInput] = useState('');
    const [note, setNote] = useState('');
    const value = Number(floatInput);
    const valid = floatInput !== '' && Number.isFinite(value) && value >= 0;

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (valid) onOpen(Math.round(value * 100) / 100, note.trim() || undefined);
    };

    return (
        <div className="max-w-xl mx-auto mt-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-1">
                <div className="p-2.5 rounded-xl bg-gray-100"><Lock className="w-6 h-6 text-gray-600" /></div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Till closed</h1>
                    <p className="text-sm text-gray-500">{storeName} · {cashierName}</p>
                </div>
            </div>
            <form onSubmit={submit} className="mt-6 space-y-4">
                <label className="block text-sm font-medium text-gray-700" htmlFor="opening-float">Opening float (cash in the drawer)</label>
                <input id="opening-float" autoFocus type="number" inputMode="decimal" min="0" step="0.01" value={floatInput}
                    onChange={(e) => setFloatInput(e.target.value)} placeholder="0.00"
                    className="w-full px-4 py-3 text-3xl font-bold border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-600" />
                <div className="grid grid-cols-4 gap-2">
                    {QUICK_FLOATS.map(v => (
                        <button key={v} type="button" onClick={() => setFloatInput(String(v))}
                            className="py-3 rounded-lg border-2 border-gray-300 font-bold hover:bg-gray-50">{money(v).replace(/\.00$/, '')}</button>
                    ))}
                </div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="opening-note">Note (optional)</label>
                <input id="opening-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={250}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600" />
                <Button type="submit" size="lg" className="w-full" disabled={!valid} isLoading={isSubmitting}>Open till</Button>
            </form>
        </div>
    );
}

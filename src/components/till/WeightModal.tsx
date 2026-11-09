import { useState } from 'react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { money } from '../../utils/money';
import { round2 } from '../../utils/basket';
import type { Product } from '../../features/products/types';

interface Props {
    product: Product;
    onConfirm: (kg: number) => void;
    onCancel: () => void;
}

/** Weighed items: enter the weight in kg (a connected scale replaces this input later). */
export function WeightModal({ product, onConfirm, onCancel }: Props) {
    const [kg, setKg] = useState('');
    const value = Number(kg);
    const valid = value > 0 && value < 1000;
    return (
        <Modal isOpen onClose={onCancel} title={`Weigh: ${product.name}`} size="sm">
            <form onSubmit={(e) => { e.preventDefault(); if (valid) onConfirm(Math.round(value * 1000) / 1000); }} className="space-y-4">
                <p className="text-sm text-gray-600">{money(product.price)} per kg</p>
                <label className="block text-sm font-medium text-gray-700" htmlFor="weight-kg">Weight (kg)</label>
                <input id="weight-kg" autoFocus type="number" step="0.001" min="0" value={kg} onChange={(e) => setKg(e.target.value)}
                    className="w-full px-4 py-3 text-3xl font-bold border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-600" placeholder="0.000" />
                <div className="text-xl font-bold text-right">{valid ? money(round2(product.price * value)) : '—'}</div>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" className="flex-1" disabled={!valid}>Add to basket</Button>
                </div>
            </form>
        </Modal>
    );
}

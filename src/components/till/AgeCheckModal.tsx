import { ShieldAlert } from 'lucide-react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import type { Product } from '../../features/products/types';

interface Props {
    product: Product;
    onVerified: () => void;
    onRefuse: () => void;
}

/** Shown when an age-restricted item is scanned. Verifying applies to the whole sale. */
export function AgeCheckModal({ product, onVerified, onRefuse }: Props) {
    return (
        <Modal isOpen onClose={onRefuse} title="Age verification required" size="sm">
            <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl bg-amber-50 border-2 border-amber-300 p-4">
                    <ShieldAlert className="w-8 h-8 text-amber-600 shrink-0" />
                    <div>
                        <p className="font-bold text-gray-900">{product.name}</p>
                        <p className="text-amber-800 font-semibold">Customer must be {product.ageRestriction} or over.</p>
                    </div>
                </div>
                <p className="text-sm text-gray-700">
                    <b>Challenge 25:</b> if the customer looks under 25, ask for valid photo ID (passport, driving licence or PASS card) before continuing.
                </p>
                <div className="grid gap-2">
                    <Button size="lg" onClick={onVerified}>Age verified — add item</Button>
                    <Button size="lg" variant="danger" onClick={onRefuse}>Refuse sale of this item</Button>
                </div>
            </div>
        </Modal>
    );
}

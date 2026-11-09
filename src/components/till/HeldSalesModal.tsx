import { Modal } from '../Modal';
import { Button } from '../Button';
import { money } from '../../utils/money';
import type { BasketLine } from '../../utils/basket';

export interface HeldSale {
    ref: string;
    heldAt: string;
    lines: BasketLine[];
    ageVerified: boolean;
    total: number;
}

interface Props {
    held: HeldSale[];
    onRecall: (h: HeldSale) => void;
    onDelete: (h: HeldSale) => void;
    onClose: () => void;
}

export function HeldSalesModal({ held, onRecall, onDelete, onClose }: Props) {
    return (
        <Modal isOpen onClose={onClose} title="Recall held sale" size="md">
            {held.length === 0 ? (
                <p className="text-gray-600 py-6 text-center">No held sales.</p>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {held.map(h => (
                        <li key={h.ref} className="flex items-center justify-between py-3 gap-3">
                            <div>
                                <div className="font-semibold text-gray-900">{h.ref}</div>
                                <div className="text-xs text-gray-500">
                                    {new Date(h.heldAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} · {h.lines.length} line{h.lines.length === 1 ? '' : 's'} · {money(h.total)}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" onClick={() => onRecall(h)}>Recall</Button>
                                <Button size="sm" variant="danger" onClick={() => onDelete(h)}>Delete</Button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Modal>
    );
}

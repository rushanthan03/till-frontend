import { CheckCircle2, CircleSlash, RotateCcw, Undo2 } from 'lucide-react';
import type { Sale } from '../../features/sales/types';

const STATUS: Record<Sale['status'], { label: string; className: string; Icon: typeof CheckCircle2 }> = {
    completed: { label: 'Completed', className: 'bg-green-100 text-green-800', Icon: CheckCircle2 },
    partially_refunded: { label: 'Part refunded', className: 'bg-amber-100 text-amber-800', Icon: Undo2 },
    refunded: { label: 'Refunded', className: 'bg-gray-200 text-gray-800', Icon: RotateCcw },
    voided: { label: 'Voided', className: 'bg-red-100 text-red-800', Icon: CircleSlash },
};

/** Status is always shown as icon + text, never colour alone. */
export function SaleStatusBadge({ status }: { status: Sale['status'] }) {
    const { label, className, Icon } = STATUS[status];
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}>
            <Icon className="w-3.5 h-3.5" aria-hidden />{label}
        </span>
    );
}

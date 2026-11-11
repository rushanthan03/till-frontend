import type { PurchaseOrderStatus } from '../../features/purchasing/types';

export const PO_STATUS: Record<PurchaseOrderStatus, { label: string; tone: string }> = {
    draft: { label: 'Draft', tone: 'bg-gray-100 text-gray-700' },
    ordered: { label: 'Ordered', tone: 'bg-blue-100 text-blue-700' },
    partial: { label: 'Part delivered', tone: 'bg-amber-100 text-amber-800' },
    received: { label: 'Received', tone: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Cancelled', tone: 'bg-red-100 text-red-700' },
};

export const fmtDate = (iso: string | null | undefined) => (iso ? new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('en-GB') : '—');
export const qty = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, ''));

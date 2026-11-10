import { useState } from 'react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { money } from '../../utils/money';
import { OutboxEntry, discard, retry } from '../../offline/outbox';

interface Props {
    entries: OutboxEntry[];
    onClose: () => void;
}

/** Offline sales the server turned down (for example the till session was closed). A manager decides what to do with each. */
export function SyncProblemsModal({ entries, onClose }: Props) {
    const [confirming, setConfirming] = useState<string | null>(null);
    const failed = entries.filter(e => e.status === 'failed');
    return (
        <Modal isOpen onClose={onClose} title="Offline sales that need attention" size="md">
            <div className="space-y-3 text-sm">
                {failed.length === 0 && <p className="text-gray-600">Nothing needs attention.</p>}
                {failed.map(e => (
                    <div key={e.clientRef} className="rounded-lg border border-red-200 bg-red-50 p-3">
                        <div className="flex justify-between font-semibold text-gray-900"><span>{e.provisionalReceipt}</span><span>{money(e.total)}</span></div>
                        <div className="text-xs text-gray-600">{new Date(e.createdAt).toLocaleString('en-GB')} · {e.body.items.length} line{e.body.items.length > 1 ? 's' : ''}</div>
                        <p className="mt-1 text-red-800">{e.error}</p>
                        {confirming === e.clientRef ? (
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-red-900">Delete this sale for good? The customer has already paid.</span>
                                <Button variant="danger" size="sm" onClick={() => { void discard(e.clientRef); setConfirming(null); }}>Delete sale</Button>
                                <Button variant="outline" size="sm" onClick={() => setConfirming(null)}>Keep</Button>
                            </div>
                        ) : (
                            <div className="mt-2 flex gap-2">
                                <Button size="sm" onClick={() => void retry(e.clientRef)}>Try again</Button>
                                <Button variant="outline" size="sm" onClick={() => setConfirming(e.clientRef)}>Delete…</Button>
                            </div>
                        )}
                    </div>
                ))}
                <p className="text-xs text-gray-500">Tip: if the till session was closed, open it again and press Try again.</p>
                <div className="flex justify-end"><Button variant="outline" onClick={onClose}>Close</Button></div>
            </div>
        </Modal>
    );
}

import { CloudOff, RefreshCw } from 'lucide-react';

interface Props {
    online: boolean;
    forced: boolean;
    pending: number;
    failed: number;
    onShowProblems: () => void;
}

/** Tells the cashier whether sales are going to the server or being kept on this till. */
export function OfflineBanner({ online, forced, pending, failed, onShowProblems }: Props) {
    if (online && pending === 0 && failed === 0) return null;
    return (
        <div role="status" className={`flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium ${online ? 'bg-blue-50 text-blue-900' : 'bg-amber-100 text-amber-900'}`}>
            <span className="inline-flex items-center gap-2">
                {online ? <RefreshCw className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
                {!online && <>Offline{forced ? ' (simulated)' : ''}: sales are saved on this till and sent when the connection returns. Cash only; no refunds, discounts or card payments.</>}
                {online && pending > 0 && <>Sending {pending} offline sale{pending > 1 ? 's' : ''}…</>}
                {online && pending === 0 && failed > 0 && <>Some offline sales need attention.</>}
            </span>
            <span className="inline-flex items-center gap-3">
                {!online && pending > 0 && <b>{pending} waiting to send</b>}
                {failed > 0 && <button type="button" onClick={onShowProblems} className="underline font-semibold">{failed} need attention</button>}
            </span>
        </div>
    );
}

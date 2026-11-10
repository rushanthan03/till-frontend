import type { CreateSaleInput, Sale } from '../features/sales/types';
import { idb } from './idb';
import { isNetworkError } from './connectivity';

// Sales rung up while the server can't be reached wait here (on disk) and are sent when it comes back.
// Every sale carries a clientRef, so a resend is safe: the server returns the sale it already has.

export interface OutboxEntry {
    clientRef: string;
    storeId: string;
    body: CreateSaleInput & { clientRef: string; soldAt: string };
    provisionalReceipt: string;
    total: number;
    createdAt: string;
    status: 'pending' | 'failed';
    error?: string;
}

const listeners = new Set<() => void>();
const changed = () => listeners.forEach(l => l());
export const onOutboxChange = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

export const newClientRef = (): string =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

/** Receipt numbers for offline sales, per till: OFF-0001, OFF-0002… The server numbers them for real on sync. */
export function nextProvisionalNumber(storeId: string): string {
    const key = `till.offlineSeq.${storeId}`;
    let n = 0;
    try { n = Number(localStorage.getItem(key) ?? 0); } catch { /* ignore */ }
    n += 1;
    try { localStorage.setItem(key, String(n)); } catch { /* ignore */ }
    return `OFF-${String(n).padStart(4, '0')}`;
}

export async function listOutbox(storeId: string): Promise<OutboxEntry[]> {
    return (await idb.getAll<OutboxEntry>('outbox')).filter(e => e.storeId === storeId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function enqueue(entry: OutboxEntry): Promise<void> {
    await idb.put('outbox', entry);
    changed();
}

export async function discard(clientRef: string): Promise<void> {
    await idb.delete('outbox', clientRef);
    changed();
}

export async function retry(clientRef: string): Promise<void> {
    const e = await idb.get<OutboxEntry>('outbox', clientRef);
    if (e) { await idb.put('outbox', { ...e, status: 'pending', error: undefined }); changed(); }
}

export interface SyncResult { synced: Sale[]; failed: number; stopped: 'offline' | 'server' | null }

let running: Promise<SyncResult> | null = null;

/**
 * Sends pending sales oldest first. A network error or server error stops the run (try again later);
 * a rejection by the server (e.g. the till session was closed) marks that one sale as needing attention and carries on.
 */
export function syncOutbox(storeId: string, post: (body: OutboxEntry['body']) => Promise<Sale>): Promise<SyncResult> {
    if (running) return running; // never two syncs at once
    running = (async () => {
        const result: SyncResult = { synced: [], failed: 0, stopped: null };
        for (const entry of await listOutbox(storeId)) {
            if (entry.status === 'failed') { result.failed++; continue; }
            try {
                result.synced.push(await post(entry.body));
                await idb.delete('outbox', entry.clientRef);
            } catch (e) {
                const status = (e as { statusCode?: number; response?: { status?: number } })?.statusCode ?? (e as { response?: { status?: number } })?.response?.status;
                if (isNetworkError(e)) { result.stopped = 'offline'; break; }
                if (!status || status >= 500 || status === 429 || status === 401) { result.stopped = 'server'; break; }
                const raw = (e as { message?: unknown })?.message;
                const message = Array.isArray(raw) ? raw.join(', ') : typeof raw === 'object' && raw ? String((raw as { message?: unknown }).message ?? '') : String(raw ?? 'Rejected by the server');
                await idb.put('outbox', { ...entry, status: 'failed', error: message || 'Rejected by the server' });
                result.failed++;
            }
        }
        changed();
        return result;
    })().finally(() => { running = null; });
    return running;
}

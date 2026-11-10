import { useSyncExternalStore } from 'react';
import { apiBaseUrl } from '../api/axiosClient';

// Whether the till can reach the server. The browser's own "online" flag only knows about the network
// cable, not the server, so the till also pings /health. A manager can force offline mode to demo or test it.

const FORCE_KEY = 'till.forceOffline';
const listeners = new Set<() => void>();
let reachable = typeof navigator === 'undefined' ? true : navigator.onLine;
let forced = false;
try { forced = localStorage.getItem(FORCE_KEY) === '1'; } catch { /* storage unavailable */ }
let snapshot = { online: reachable && !forced, forced };

const emit = () => {
    const next = { online: reachable && !forced, forced };
    if (next.online !== snapshot.online || next.forced !== snapshot.forced) { snapshot = next; listeners.forEach(l => l()); }
};

export const isOnline = () => snapshot.online;

export function setForceOffline(on: boolean) {
    forced = on;
    try { localStorage.setItem(FORCE_KEY, on ? '1' : '0'); } catch { /* ignore */ }
    emit();
    if (!on) void ping();
}

/** Called when a request fails with no response at all (server down, cable out). */
export function markOffline() { reachable = false; emit(); }

export async function ping(): Promise<boolean> {
    if (forced) return false;
    try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 4000);
        const res = await fetch(`${apiBaseUrl}/health`, { signal: ctrl.signal, cache: 'no-store' });
        clearTimeout(t);
        reachable = res.ok;
    } catch {
        reachable = false;
    }
    emit();
    return reachable;
}

/** True for errors where the request never got an answer (as opposed to the server saying "no"). */
export const isNetworkError = (e: unknown): boolean => {
    const err = e as { response?: unknown; code?: string; message?: string; isAxiosError?: boolean };
    if (err?.response) return false;
    return !!err?.isAxiosError || err?.code === 'ERR_NETWORK' || err?.code === 'ECONNABORTED' || /network|timeout/i.test(err?.message ?? '');
};

let started = false;
export function startConnectivityMonitor() {
    if (started || typeof window === 'undefined') return;
    started = true;
    window.addEventListener('online', () => void ping());
    window.addEventListener('offline', () => { reachable = false; emit(); });
    const loop = async () => { await ping(); setTimeout(loop, reachable && !forced ? 30000 : 6000); };
    void loop();
}

const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
export const useConnectivity = () => useSyncExternalStore(subscribe, () => snapshot);

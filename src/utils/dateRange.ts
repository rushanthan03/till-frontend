export type Preset = 'today' | 'yesterday' | '7d' | 'month' | 'all' | 'custom';

export const PRESETS: { id: Preset; label: string }[] = [
    { id: 'today', label: 'Today' }, { id: 'yesterday', label: 'Yesterday' }, { id: '7d', label: 'Last 7 days' },
    { id: 'month', label: 'This month' }, { id: 'all', label: 'All time' }, { id: 'custom', label: 'Custom' },
];

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

/** "2026-11-09" (from <input type="date">) -> local date, avoiding the UTC shift of Date.parse. */
export const parseDay = (s: string): Date | null => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};

/** Turns the chosen period into ISO bounds (local-day boundaries). `all` has no bounds. */
export function rangeFor(preset: Preset, customFrom: string, customTo: string): { from?: string; to?: string } {
    const now = new Date();
    switch (preset) {
        case 'today': return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() };
        case 'yesterday': { const y = new Date(now); y.setDate(y.getDate() - 1); return { from: startOfDay(y).toISOString(), to: endOfDay(y).toISOString() }; }
        case '7d': { const s = new Date(now); s.setDate(s.getDate() - 6); return { from: startOfDay(s).toISOString(), to: endOfDay(now).toISOString() }; }
        case 'month': return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), to: endOfDay(now).toISOString() };
        case 'custom': {
            const f = parseDay(customFrom), t = parseDay(customTo);
            return { from: f ? startOfDay(f).toISOString() : undefined, to: t ? endOfDay(t).toISOString() : undefined };
        }
        default: return {};
    }
}

/** Bounds that cover "everything", for endpoints that need explicit dates. */
export const allTimeRange = () => ({ from: new Date(2000, 0, 1).toISOString(), to: endOfDay(new Date(Date.now() + 864e5)).toISOString() });

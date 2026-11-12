import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { PermissionsAPI } from '../features/permissions/permissionsAPI';
import { defaultLevels, type Level, type Levels, type PermissionKey } from '../features/permissions/permissions';

export interface PermissionsContextType {
    levels: Levels;
    /** yes / pin / no for the signed-in user. */
    level: (key: PermissionKey) => Level;
    /** Anything but "not allowed". */
    can: (key: PermissionKey) => boolean;
    loaded: boolean;
    reload: () => Promise<void>;
}

export const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

const cacheKey = (userId: string) => `permissions:${userId}`;

function cached(userId: string | undefined): Levels | null {
    if (!userId) return null;
    try {
        const raw = localStorage.getItem(cacheKey(userId));
        return raw ? (JSON.parse(raw) as Levels) : null;
    } catch {
        return null;
    }
}

/**
 * What the signed-in user may do, from the company's permissions. Kept in local storage so the till
 * still knows when offline. The server checks everything again; this only decides what to show.
 */
export function PermissionsProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const userId = user?.id;
    const role = user?.role;
    const [levels, setLevels] = useState<Levels>(() => cached(userId) ?? defaultLevels(role));
    const [loaded, setLoaded] = useState(false);

    const reload = useCallback(async () => {
        if (!userId) return;
        try {
            const r = await PermissionsAPI.mine();
            setLevels({ ...defaultLevels(role), ...r.levels });
            localStorage.setItem(cacheKey(userId), JSON.stringify(r.levels));
        } catch {
            // offline or server down: keep what we have
        } finally {
            setLoaded(true);
        }
    }, [userId, role]);

    useEffect(() => {
        setLevels(cached(userId) ?? defaultLevels(role));
        setLoaded(false);
        void reload();
    }, [userId, role, reload]);

    const value = useMemo<PermissionsContextType>(() => ({
        levels,
        level: (k) => levels[k] ?? 'no',
        can: (k) => (levels[k] ?? 'no') !== 'no',
        loaded,
        reload,
    }), [levels, loaded, reload]);

    return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

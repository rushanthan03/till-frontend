import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { PermissionsAPI } from '../features/permissions/permissionsAPI';
import { DEFAULT_FEATURES, defaultLevels, type Features, type Level, type Levels, type PermissionKey } from '../features/permissions/permissions';

export interface PermissionsContextType {
    levels: Levels;
    /** yes / pin / no for the signed-in user. */
    level: (key: PermissionKey) => Level;
    /** Anything but "not allowed". */
    can: (key: PermissionKey) => boolean;
    /** Optional company features (email receipts…), switched on in Settings. */
    features: Features;
    loaded: boolean;
    reload: () => Promise<void>;
}

export const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

const cacheKey = (userId: string) => `permissions:${userId}`;
const featuresKey = (userId: string) => `features:${userId}`;

function read<T>(key: string | null): T | null {
    if (!key) return null;
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
}
const cached = (userId: string | undefined) => read<Levels>(userId ? cacheKey(userId) : null);
const cachedFeatures = (userId: string | undefined): Features => ({ ...DEFAULT_FEATURES, ...read<Features>(userId ? featuresKey(userId) : null) });

/**
 * What the signed-in user may do, from the company's permissions. Kept in local storage so the till
 * still knows when offline. The server checks everything again; this only decides what to show.
 */
export function PermissionsProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const userId = user?.id;
    const role = user?.role;
    const [levels, setLevels] = useState<Levels>(() => cached(userId) ?? defaultLevels(role));
    const [features, setFeatures] = useState<Features>(() => cachedFeatures(userId));
    const [loaded, setLoaded] = useState(false);

    const reload = useCallback(async () => {
        if (!userId) return;
        try {
            const r = await PermissionsAPI.mine();
            setLevels({ ...defaultLevels(role), ...r.levels });
            localStorage.setItem(cacheKey(userId), JSON.stringify(r.levels));
            const f = { ...DEFAULT_FEATURES, ...r.features };
            setFeatures(f);
            localStorage.setItem(featuresKey(userId), JSON.stringify(f));
        } catch {
            // offline or server down: keep what we have
        } finally {
            setLoaded(true);
        }
    }, [userId, role]);

    useEffect(() => {
        setLevels(cached(userId) ?? defaultLevels(role));
        setFeatures(cachedFeatures(userId));
        setLoaded(false);
        void reload();
    }, [userId, role, reload]);

    const value = useMemo<PermissionsContextType>(() => ({
        levels,
        level: (k) => levels[k] ?? 'no',
        can: (k) => (levels[k] ?? 'no') !== 'no',
        features,
        loaded,
        reload,
    }), [levels, features, loaded, reload]);

    return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

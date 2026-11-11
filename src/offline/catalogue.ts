import { ProductsAPI } from '../features/products/productsAPI';
import { PromotionsAPI } from '../features/promotions/promotionsAPI';
import type { DepartmentCount, Product } from '../features/products/types';
import type { Promotion } from '../features/promotions/types';
import type { Shift } from '../features/shifts/types';
import { idb } from './idb';
import { isNetworkError, isOnline, markOffline } from './connectivity';

// A copy of the store's products, offers and open till session kept on the till, so scanning and selling
// carry on when the server can't be reached. Refreshed whenever the till is online.

const STALE_MS = 10 * 60 * 1000;
type Cached = Product & { key: string };
const keyOf = (storeId: string, id: string) => `${storeId}:${id}`;

export async function syncCatalogue(storeId: string, force = false): Promise<number | null> {
    const last = await idb.get<number>('meta', `catalogueAt:${storeId}`);
    if (!force && last && Date.now() - last < STALE_MS) return null;
    const all: Product[] = [];
    for (let page = 1; ; page++) {
        const r = await ProductsAPI.list({ storeId, status: 'active', limit: 200, page });
        all.push(...r.data);
        if (page >= r.totalPages) break;
    }
    await idb.replaceProducts(storeId, all.map(p => ({ ...p, key: keyOf(storeId, p.id), storeId })));
    try { await idb.put('meta', await PromotionsAPI.current(storeId), `promos:${storeId}`); } catch { /* keep the old offers */ }
    await idb.put('meta', Date.now(), `catalogueAt:${storeId}`);
    return all.length;
}

const cachedProducts = (storeId: string) => idb.getAllByIndex<Cached>('products', 'storeId', storeId);

export async function cachedBarcode(storeId: string, code: string): Promise<Product | null> {
    const c = code.trim().toLowerCase();
    const all = await cachedProducts(storeId);
    const main = all.find(p => p.barcode.toLowerCase() === c);
    if (main) return { ...main, scanQuantity: 1, scanLabel: null };
    for (const p of all) {
        const pack = p.barcodes?.find(b => b.barcode.toLowerCase() === c);
        if (pack) return { ...p, scanQuantity: pack.packQuantity, scanLabel: pack.label };
    }
    const bySku = all.find(p => p.sku?.toLowerCase() === c);
    return bySku ? { ...bySku, scanQuantity: 1, scanLabel: null } : null;
}
export async function cachedSearch(storeId: string, term: string, limit: number): Promise<Product[]> {
    const t = term.trim().toLowerCase();
    return (await cachedProducts(storeId)).filter(p => p.name.toLowerCase().includes(t) || p.barcode.includes(t)).slice(0, limit);
}
export async function cachedDepartment(storeId: string, department: string, limit: number): Promise<Product[]> {
    return (await cachedProducts(storeId)).filter(p => p.department === department).slice(0, limit);
}
export async function cachedDepartments(storeId: string): Promise<DepartmentCount[]> {
    const counts = new Map<string, number>();
    (await cachedProducts(storeId)).forEach(p => counts.set(p.department, (counts.get(p.department) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([department, count]) => ({ department, count }));
}
export const cachedPromos = async (storeId: string) => (await idb.get<Promotion[]>('meta', `promos:${storeId}`)) ?? [];
export const cachedShift = async (storeId: string, userId: string) => (await idb.get<Shift | null>('meta', `shift:${storeId}:${userId}`)) ?? null;
export const cacheShift = (storeId: string, userId: string, shift: Shift | null) => idb.put('meta', shift, `shift:${storeId}:${userId}`);

/**
 * Online-first lookups: ask the server, and fall back to the local copy when it can't be reached.
 * A real "not found" from the server is still reported as not found.
 */
async function withFallback<T>(online: () => Promise<T>, offline: () => Promise<T>): Promise<T> {
    if (!isOnline()) return offline();
    try { return await online(); } catch (e) {
        if (isNetworkError(e)) { markOffline(); return offline(); }
        throw e;
    }
}

export const lookupBarcode = (storeId: string, code: string): Promise<Product> =>
    withFallback(
        () => ProductsAPI.byBarcode(code, storeId),
        async () => { const p = await cachedBarcode(storeId, code); if (!p) throw new Error('Product not found in the offline catalogue'); return p; },
    );
export const searchProducts = (storeId: string, term: string, limit: number): Promise<Product[]> =>
    withFallback(() => ProductsAPI.list({ storeId, search: term, status: 'active', limit }).then(r => r.data), () => cachedSearch(storeId, term, limit));
export const departmentProducts = (storeId: string, department: string, limit: number): Promise<Product[]> =>
    withFallback(() => ProductsAPI.list({ storeId, department, status: 'active', limit }).then(r => r.data), () => cachedDepartment(storeId, department, limit));
export const listDepartments = (storeId: string): Promise<DepartmentCount[]> =>
    withFallback(() => ProductsAPI.departments(storeId), () => cachedDepartments(storeId));
export const currentPromos = (storeId: string): Promise<Promotion[]> =>
    withFallback(() => PromotionsAPI.current(storeId), () => cachedPromos(storeId));

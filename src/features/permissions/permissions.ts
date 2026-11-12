/** Mirrors the server's permission list (till-backend src/permissions/permissions.ts). */
export type Level = 'yes' | 'pin' | 'no';
export type EditableRole = 'manager' | 'cashier';

export type PermissionKey =
    | 'discounts' | 'refunds' | 'paidOut' | 'noSale'
    | 'products' | 'stock' | 'purchasing' | 'promotions' | 'customers' | 'reports' | 'staff' | 'audit';

export type Levels = Record<PermissionKey, Level>;

export interface PermissionDef {
    key: PermissionKey;
    group: 'till' | 'office';
    label: string;
    description: string;
    levels: Record<EditableRole, Level[]>;
    defaults: Record<EditableRole, Level>;
}

export type RolePermissions = Record<EditableRole, Levels>;

export interface PermissionSettings {
    permissions: PermissionDef[];
    roles: RolePermissions;
    defaults: RolePermissions;
    changed?: number;
}

/** Used until the server answers (and when offline with nothing cached): the server's defaults. */
const DEFAULTS: RolePermissions = {
    manager: { discounts: 'yes', refunds: 'yes', paidOut: 'yes', noSale: 'yes', products: 'yes', stock: 'yes', purchasing: 'yes', promotions: 'yes', customers: 'yes', reports: 'yes', staff: 'yes', audit: 'no' },
    cashier: { discounts: 'pin', refunds: 'no', paidOut: 'pin', noSale: 'yes', products: 'no', stock: 'no', purchasing: 'no', promotions: 'no', customers: 'no', reports: 'no', staff: 'no', audit: 'no' },
};

const ALL_YES = Object.fromEntries(Object.keys(DEFAULTS.manager).map(k => [k, 'yes'])) as Levels;
const ALL_NO = Object.fromEntries(Object.keys(DEFAULTS.manager).map(k => [k, 'no'])) as Levels;

export function defaultLevels(role?: string): Levels {
    const r = (role ?? '').toLowerCase();
    if (r === 'super_admin' || r === 'tenant_admin' || r === 'owner') return ALL_YES;
    if (r === 'manager' || r === 'cashier') return DEFAULTS[r];
    return ALL_NO;
}

export const LEVEL_LABELS: Record<Level, string> = { yes: 'Allowed', pin: 'Manager PIN', no: 'Not allowed' };

/** Optional features the company admin switches on in Settings. All off until switched on. */
export interface Features {
    emailReceipts: boolean;
}

export const DEFAULT_FEATURES: Features = { emailReceipts: false };

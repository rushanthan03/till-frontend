export enum UserRole {
    SUPER_ADMIN = 'super_admin',      // Platform administrator - Full system access
    TENANT_ADMIN = 'tenant_admin',    // Tenant administrator - Tenant-level management
    MANAGER = 'manager',              // Store manager - refunds, reports, products
    CASHIER = 'cashier'               // Till operator - sells at the till, no refunds
}

export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended'
}

export enum TenantStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended'
}

export enum TenantType {
    STORE = 'restaurant', // stored as 'restaurant' in the database
}

export enum SubscriptionPlan {
    BASIC = 'basic',
    PRO = 'pro',
    ENTERPRISE = 'enterprise'
}

export enum PaymentTiming {
    PAY_AT_LAST = 'pay_at_last',
    PAY_AT_FIRST = 'pay_at_first'
}

export const COLORS = {
    primary: '#3b82f6', // Professional Blue
    secondary: '#64748b', // Slate
    success: '#10b981', // Emerald
    warning: '#f59e0b', // Amber
    danger: '#ef4444', // Red
    purple: '#8b5cf6', // Violet
    teal: '#14b8a6', // Teal
    orange: '#f97316', // Orange
    blue: '#2563eb', // Royal Blue
    indigo: '#6366f1', // Indigo
};

// Currency used to display prices across the supermarket POS screens.
// Change here to switch the whole app (e.g. to LKR / en-LK).
export const DEFAULT_CURRENCY = { code: 'GBP', locale: 'en-GB' } as const;

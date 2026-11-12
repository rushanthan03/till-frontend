import { describe, expect, it } from 'vitest';
import { defaultLevels } from './permissions';

describe('defaultLevels', () => {
    it('matches the server defaults for managers and cashiers', () => {
        expect(defaultLevels('cashier')).toMatchObject({ discounts: 'pin', refunds: 'no', paidOut: 'pin', noSale: 'yes', reports: 'no' });
        expect(defaultLevels('manager')).toMatchObject({ discounts: 'yes', refunds: 'yes', audit: 'no', products: 'yes' });
    });
    it('lets admins do everything and unknown roles nothing', () => {
        expect(Object.values(defaultLevels('tenant_admin')).every(l => l === 'yes')).toBe(true);
        expect(Object.values(defaultLevels('SUPER_ADMIN')).every(l => l === 'yes')).toBe(true);
        expect(Object.values(defaultLevels(undefined)).every(l => l === 'no')).toBe(true);
    });
});

import { formatCurrency } from './index';
import { DEFAULT_CURRENCY } from './constants';

/** Formats an amount in the app currency (see DEFAULT_CURRENCY). */
export const money = (n: number | null | undefined): string =>
    n === null || n === undefined ? '—' : formatCurrency(n, DEFAULT_CURRENCY.code, DEFAULT_CURRENCY.locale);

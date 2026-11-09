import { ReactNode } from 'react';
import { money } from '../../utils/money';
import { PrintStyles } from './PrintStyles';

export const Row = ({ label, value, bold, tone }: { label: string; value: ReactNode; bold?: boolean; tone?: 'good' | 'bad' }) => (
    <div className={`flex justify-between gap-3 ${bold ? 'font-bold' : ''} ${tone === 'bad' ? 'text-red-700' : tone === 'good' ? 'text-green-700' : ''}`}>
        <span>{label}</span><span className="tabular-nums">{value}</span>
    </div>
);

/** Money going out, shown with a minus sign only when there is something to show. */
const out = (n: number) => `${n > 0 ? '-' : ''}${money(n)}`;

export const Divider = () => <div className="my-2 border-t border-dashed border-gray-400" />;

interface Figures {
    transactions: number;
    refundCount: number;
    grossSales: number;
    refundsTotal: number;
    netSales: number;
    vat: number;
    cashSales: number;
    cardSales: number;
    cashRefunds: number;
    cardRefunds: number;
}

/** Shared body for the X report (running) and the Z report (final). */
export function ReportView({ title, storeName, cashier, opened, closed, openingFloat, figures, extra }: {
    title: string; storeName: string; cashier: string; opened: string; closed?: string | null;
    openingFloat: number; figures: Figures; extra?: ReactNode;
}) {
    const fmt = (d: string) => new Date(d).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    return (
        <>
            <PrintStyles />
            <div id="receipt-print" className="mx-auto w-[320px] bg-white border border-gray-200 p-4 font-mono text-[12px] leading-snug text-gray-900">
                <div className="text-center font-bold text-base">{title}</div>
                <div className="text-center">{storeName}</div>
                <Divider />
                <Row label="Cashier" value={cashier} />
                <Row label="Opened" value={fmt(opened)} />
                {closed && <Row label="Closed" value={fmt(closed)} />}
                <Divider />
                <Row label="Transactions" value={figures.transactions} />
                <Row label="Gross sales" value={money(figures.grossSales)} />
                <Row label={`Refunds (${figures.refundCount})`} value={out(figures.refundsTotal)} />
                <Row label="Net sales" value={money(figures.netSales)} bold />
                <Row label="of which VAT" value={money(figures.vat)} />
                <Divider />
                <Row label="Cash sales" value={money(figures.cashSales)} />
                <Row label="Card sales" value={money(figures.cardSales)} />
                <Row label="Cash refunds" value={out(figures.cashRefunds)} />
                <Row label="Card refunds" value={out(figures.cardRefunds)} />
                <Divider />
                <Row label="Opening float" value={money(openingFloat)} />
                {extra}
            </div>
        </>
    );
}

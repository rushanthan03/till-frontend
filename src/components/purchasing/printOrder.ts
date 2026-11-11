import type { PurchaseOrder } from '../../features/purchasing/types';
import { money } from '../../utils/money';
import { fmtDate, qty } from './poStatus';

const esc = (s: string | null | undefined) =>
    (s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/** Order sheet to send to the supplier: printed (or saved as PDF) through a hidden frame. */
export function orderSheetHtml(o: PurchaseOrder, storeName: string): string {
    const rows = (o.lines ?? []).map((l) => `
        <tr><td>${esc(l.barcode)}</td><td>${esc(l.productName)}</td><td class="r">${qty(l.quantity)}</td>
        <td class="r">${money(l.unitCost)}</td><td class="r">${money(l.quantity * l.unitCost)}</td></tr>`).join('');
    const s = o.supplier;
    return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(o.number)}</title><style>
        body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#111;margin:24px}
        h1{font-size:20px;margin:0 0 4px} .muted{color:#555} .grid{display:flex;justify-content:space-between;gap:24px;margin:16px 0}
        table{width:100%;border-collapse:collapse;margin-top:12px} th,td{border-bottom:1px solid #ddd;padding:6px 4px;text-align:left}
        th{background:#f3f3f3} .r{text-align:right} .total td{font-weight:bold;border-top:2px solid #111;border-bottom:none}
    </style></head><body>
        <h1>Purchase order ${esc(o.number)}</h1>
        <div class="muted">${esc(storeName)}</div>
        <div class="grid">
            <div><b>Supplier</b><br>${esc(s.name)}${s.accountNumber ? `<br>Account: ${esc(s.accountNumber)}` : ''}${s.contactName ? `<br>${esc(s.contactName)}` : ''}${s.phone ? `<br>${esc(s.phone)}` : ''}${s.email ? `<br>${esc(s.email)}` : ''}</div>
            <div><b>Order date:</b> ${fmtDate(o.orderedAt ?? o.createdAt)}<br><b>Delivery expected:</b> ${fmtDate(o.expectedDate)}<br><b>Raised by:</b> ${esc(o.createdByName)}</div>
        </div>
        <table><thead><tr><th>Barcode</th><th>Product</th><th class="r">Qty</th><th class="r">Unit cost</th><th class="r">Line total</th></tr></thead>
        <tbody>${rows}<tr class="total"><td colspan="4" class="r">Total (ex VAT)</td><td class="r">${money(o.totalCost)}</td></tr></tbody></table>
        ${o.notes ? `<p><b>Notes:</b> ${esc(o.notes)}</p>` : ''}
    </body></html>`;
}

export function printOrder(o: PurchaseOrder, storeName: string) {
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(frame);
    const doc = frame.contentWindow!.document;
    doc.open(); doc.write(orderSheetHtml(o, storeName)); doc.close();
    setTimeout(() => {
        frame.contentWindow!.focus();
        frame.contentWindow!.print();
        setTimeout(() => frame.remove(), 1000);
    }, 100);
}

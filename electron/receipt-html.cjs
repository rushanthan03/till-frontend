'use strict';
const { money } = require('./escpos.cjs');

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Receipt as 80mm HTML, for printers that only have a normal Windows/macOS driver. */
function receiptHtml(r) {
  const rows = (r.lines || []).map((l) => {
    const qty = Number.isInteger(l.quantity) ? (l.quantity !== 1 ? `${l.quantity} x ` : '') : `${l.quantity}kg x `;
    return `<div class="row"><span>${esc(qty + l.name)}</span><span>${r.gift ? '' : money(l.total)}</span></div>` +
      (l.note && !r.gift ? `<div class="note">${esc(l.note)}</div>` : '');
  }).join('');
  const totals = r.gift ? '' : `
    ${r.discountTotal > 0 ? `<div class="row"><span>Discounts</span><span>-${money(r.discountTotal)}</span></div>` : ''}
    ${r.points && r.points.value > 0 ? `<div class="row"><span>Points used (${r.points.points})</span><span>-${money(r.points.value)}</span></div>` : ''}
    <div class="row b"><span>TOTAL</span><span>${money(r.total)}</span></div>
    ${(r.payments || []).map((p) => `<div class="row"><span>${esc(p.label)}</span><span>${money(p.amount)}</span></div>`).join('')}
    ${r.change > 0 ? `<div class="row"><span>Change</span><span>${money(r.change)}</span></div>` : ''}
    ${(r.vatRows || []).length ? '<hr>' + r.vatRows.map((v) => `<div class="row"><span>VAT ${v.rate}% on ${money(v.net)}</span><span>${money(v.vat)}</span></div>`).join('') : ''}`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { margin: 0 } body { width: 72mm; margin: 0 4mm; font: 12px/1.35 'Courier New', monospace; color: #000 }
    .c { text-align: center } .b { font-weight: 700 } .row { display: flex; justify-content: space-between; gap: 8px }
    .note { padding-left: 8px; font-size: 11px } hr { border: 0; border-top: 1px dashed #000; margin: 6px 0 } h1 { font-size: 16px; margin: 4px 0 }
  </style></head><body>
    <div class="c"><h1>${esc(r.storeName)}</h1>${r.address ? `<div>${esc(r.address)}</div>` : ''}${r.gift ? '<div class="b">GIFT RECEIPT</div>' : ''}</div><hr>
    <div class="row"><span>Receipt</span><span>${esc(r.receiptNumber)}</span></div>
    <div class="row"><span>${esc(r.date)}</span><span>${r.cashier ? 'Served by ' + esc(r.cashier) : ''}</span></div><hr>
    ${rows}<hr>${totals}
    ${r.customer ? `<hr><div>${esc(r.customer)}</div>` : ''}<hr>
    <div class="c">${esc(r.footer || 'Thank you for shopping with us')}</div>
  </body></html>`;
}

module.exports = { receiptHtml };

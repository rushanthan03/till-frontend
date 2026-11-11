'use strict';
/**
 * ESC/POS receipt builder for thermal printers (Epson-compatible). Pure functions, no hardware access,
 * so it is unit tested. Output is a Buffer ready to send to the printer.
 */

const ESC = 0x1b;
const GS = 0x1d;

const money = (n) => `£${(Math.round((Number(n) + Number.EPSILON) * 100) / 100).toFixed(2)}`;

/** Characters outside the printer's code page would print as garbage, so map the common ones. */
function clean(s) {
  return String(s ?? '')
    .replace(/£/g, '\x9c') // CP437 pound sign
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7e\x9c]/g, '?');
}

/** Pads `left` and `right` to one line of `width` characters; the left side is shortened if needed. */
function twoCol(left, right, width) {
  const r = clean(right);
  const room = Math.max(1, width - r.length - 1);
  let l = clean(left);
  if (l.length > room) l = l.slice(0, room);
  return l + ' '.repeat(Math.max(1, width - l.length - r.length)) + r;
}

/** Word-wraps `text` to `width` characters per line. */
function wrap(text, width) {
  const words = clean(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= width) cur += ' ' + w;
    else { lines.push(cur); cur = w; }
    while (cur.length > width) { lines.push(cur.slice(0, width)); cur = cur.slice(width); }
  }
  if (cur) lines.push(cur);
  return lines;
}

class Doc {
  constructor(width) { this.width = width; this.parts = [Buffer.from([ESC, 0x40]), Buffer.from([ESC, 0x74, 0x00])]; } // init, code page 437
  raw(...bytes) { this.parts.push(Buffer.from(bytes)); return this; }
  text(s) { this.parts.push(Buffer.from(clean(s) + '\n', 'latin1')); return this; }
  line(s) { return this.text(s); }
  rule(ch = '-') { return this.text(ch.repeat(this.width)); }
  align(a) { return this.raw(ESC, 0x61, a === 'center' ? 1 : a === 'right' ? 2 : 0); }
  bold(on) { return this.raw(ESC, 0x45, on ? 1 : 0); }
  big(on) { return this.raw(GS, 0x21, on ? 0x11 : 0x00); }
  feed(n = 1) { return this.raw(ESC, 0x64, n); }
  cut() { return this.feed(3).raw(GS, 0x56, 0x42, 0x00); } // feed, then partial cut
  buffer() { return Buffer.concat(this.parts); }
}

/** Drawer-kick pulse on connector pin 2 (the usual one for cash drawers wired to a receipt printer). */
const drawerPulse = () => Buffer.from([ESC, 0x70, 0x00, 0x32, 0x32]);

/**
 * Builds a sales receipt. `r` is the plain object the app sends:
 * { storeName, address, receiptNumber, date, cashier, customer, gift, lines:[{ name, quantity, unitPrice, total, note }],
 *   discountTotal, total, vatRows:[{ rate, net, vat }], payments:[{ label, amount }], change, footer }
 */
function buildReceipt(r, opts = {}) {
  const width = opts.width === 32 ? 32 : 42;
  const d = new Doc(width);
  d.align('center').bold(true).big(true).text(r.storeName || 'Store').big(false).bold(false);
  if (r.address) wrap(r.address, width).forEach((l) => d.text(l));
  if (r.gift) d.bold(true).text('GIFT RECEIPT').bold(false);
  d.align('left').rule();
  d.text(twoCol('Receipt', r.receiptNumber, width));
  d.text(twoCol(r.date || '', r.cashier ? `Served by ${r.cashier}` : '', width));
  d.rule();

  for (const l of r.lines || []) {
    const qtyText = Number.isInteger(l.quantity) ? (l.quantity !== 1 ? `${l.quantity} x ` : '') : `${l.quantity}kg x `;
    const price = r.gift ? '' : money(l.total);
    wrap(`${qtyText}${l.name}`, width - (price ? price.length + 1 : 0)).forEach((part, i) => d.text(i === 0 ? twoCol(part, price, width) : part));
    if (l.note && !r.gift) d.text('  ' + l.note);
  }
  d.rule();

  if (!r.gift) {
    if (r.discountTotal > 0) d.text(twoCol('Discounts', `-${money(r.discountTotal)}`, width));
    if (r.points && r.points.value > 0) d.text(twoCol(`Points used (${r.points.points})`, `-${money(r.points.value)}`, width));
    d.bold(true).text(twoCol('TOTAL', money(r.total), width)).bold(false);
    for (const p of r.payments || []) d.text(twoCol(p.label, money(p.amount), width));
    if (r.change > 0) d.text(twoCol('Change', money(r.change), width));
    if ((r.vatRows || []).length) {
      d.rule();
      d.text(twoCol('VAT rate  Net', 'VAT', width));
      for (const v of r.vatRows) d.text(twoCol(`${v.rate}%  ${money(v.net)}`, money(v.vat), width));
    }
  }
  if (r.customer) d.rule().text(r.customer);
  d.rule().align('center');
  wrap(r.footer || 'Thank you for shopping with us', width).forEach((l) => d.text(l));
  d.align('left').cut();
  if (opts.openDrawer) d.parts.push(drawerPulse());
  return d.buffer();
}

/** A short test page so staff can check the printer, width and drawer. */
function buildTestPage(opts = {}) {
  const width = opts.width === 32 ? 32 : 42;
  const d = new Doc(width);
  d.align('center').bold(true).text('AUVREN TILL').bold(false).text('Printer test').rule('=');
  d.align('left').text('1234567890'.repeat(5).slice(0, width));
  d.text(twoCol('Left', 'Right', width));
  d.text(`Width: ${width} characters`).text('Pound sign: £1.99').align('center').text('If you can read this,').text('the printer works.').align('left').cut();
  if (opts.openDrawer) d.parts.push(drawerPulse());
  return d.buffer();
}

module.exports = { buildReceipt, buildTestPage, drawerPulse, twoCol, wrap, clean, money };

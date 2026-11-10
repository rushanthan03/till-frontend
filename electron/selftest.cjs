'use strict';
// Checks the printer path without hardware: starts a fake network printer, prints a receipt and opens the drawer.
//   npm run electron:selftest
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { app } = require('electron');
app.setPath('userData', path.join(os.tmpdir(), `till-selftest-${process.pid}`));
const hardware = require('./hardware.cjs');
const { drawerPulse } = require('./escpos.cjs');

const received = [];
const server = net.createServer((sock) => { const chunks = []; sock.on('data', (c) => chunks.push(c)); sock.on('end', () => received.push(Buffer.concat(chunks))); });

app.whenReady().then(async () => {
  let failed = 0;
  const check = (name, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; };
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;

  hardware.setSettings({ printMode: 'network', printerHost: '127.0.0.1', printerPort: port, paperWidth: 42 });
  await hardware.printReceipt({ storeName: 'Fresh Market', receiptNumber: 'R-000042', date: '10/11/2026', lines: [{ name: 'Milk 2L', quantity: 2, total: 3.1 }], total: 3.1, payments: [{ label: 'Cash', amount: 5 }], change: 1.9, vatRows: [] }, { openDrawer: true });
  await new Promise((r) => setTimeout(r, 200));
  check('receipt received by printer', received.length === 1 && received[0].toString('latin1').includes('R-000042'));
  check('receipt includes drawer pulse', received[0] && received[0].includes(drawerPulse()));

  await hardware.openDrawer();
  await new Promise((r) => setTimeout(r, 200));
  check('drawer-only command', received.length === 2 && received[1].equals(drawerPulse()));

  hardware.setSettings({ printerPort: 1 });
  let err = '';
  await hardware.openDrawer().catch((e) => { err = e.message; });
  check('unreachable printer gives a readable error', /Could not reach the printer/.test(err));

  hardware.setSettings({ printMode: 'bogus', printerPort: 99999, paperWidth: 7 });
  const s = hardware.getSettings();
  check('invalid settings are ignored', s.printMode === 'network' && s.paperWidth === 42 && s.printerPort === 1);

  server.close();
  console.log(failed ? `SELFTEST FAILED (${failed})` : 'SELFTEST OK');
  app.exit(failed ? 1 : 0);
});

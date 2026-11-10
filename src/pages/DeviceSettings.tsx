import { useEffect, useState } from 'react';
import { MonitorSmartphone, Printer } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../components/Button';
import { HardwareSettings, hardware, isDesktop } from '../hardware/hardware';
import { setForceOffline, useConnectivity } from '../offline/connectivity';

const field = 'mt-1 w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600';

/** Lets a manager switch the till into offline mode on purpose: for demos, training and testing. */
function OfflineTest() {
    const { forced, online } = useConnectivity();
    return (
        <section className="bg-white rounded-xl border border-gray-200 p-5 text-sm text-gray-700 space-y-2">
            <h2 className="font-semibold text-gray-900">Offline mode</h2>
            <p>The till keeps a copy of the products and offers, and keeps selling (cash only) if the server can't be reached. Sales are saved on this till and sent automatically when the connection returns.</p>
            <p>Status: <b className={online ? 'text-green-700' : 'text-amber-700'}>{online ? 'Connected' : forced ? 'Offline (simulated)' : 'Offline'}</b></p>
            <label className="flex items-center gap-2"><input type="checkbox" checked={forced} onChange={e => setForceOffline(e.target.checked)} />Simulate offline (for demos and training). Remember to switch it off.</label>
        </section>
    );
}

/** Receipt printer and cash drawer for this till. Only available in the desktop app. */
export const DeviceSettingsPage = () => {
    const [s, setS] = useState<HardwareSettings | null>(null);
    const [printers, setPrinters] = useState<{ name: string; isDefault: boolean }[]>([]);
    const [info, setInfo] = useState<{ version: string; platform: string } | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!isDesktop()) return;
        hardware.settings().then(setS);
        hardware.printers().then(setPrinters).catch(() => undefined);
        hardware.appInfo().then(setInfo).catch(() => undefined);
    }, []);

    if (!isDesktop()) {
        return (
            <div className="space-y-3 max-w-2xl">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><MonitorSmartphone className="w-6 h-6" />Device settings</h1>
                <div className="bg-white rounded-xl border border-gray-200 p-6 text-gray-700">
                    <p className="font-semibold text-gray-900">Open the Auvren Till desktop app on this till.</p>
                    <p className="mt-2 text-sm">Receipt printer and cash drawer settings live in the desktop app. In a web browser the till prints receipts through the normal print dialog.</p>
                </div>
                <OfflineTest />
            </div>
        );
    }
    if (!s) return <p className="py-10 text-center text-gray-500" role="status">Loading…</p>;

    const set = <K extends keyof HardwareSettings>(k: K, v: HardwareSettings[K]) => setS({ ...s, [k]: v });
    const save = async () => {
        setBusy(true);
        try { setS(await hardware.save(s)); toast.success('Device settings saved'); } catch { toast.error('Could not save settings'); } finally { setBusy(false); }
    };
    const run = async (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) => {
        setBusy(true);
        try {
            await hardware.save(s); // test with what is on screen
            const r = await fn();
            if (r.ok) toast.success(okMsg); else toast.error(r.error || 'Failed');
        } finally { setBusy(false); }
    };

    return (
        <div className="space-y-5 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><MonitorSmartphone className="w-6 h-6" />Device settings</h1>
                <p className="text-sm text-gray-600">Receipt printer and cash drawer for this till.{info ? ` Desktop app ${info.version} (${info.platform}).` : ''}</p>
            </div>
            <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Printer className="w-5 h-5" />Receipt printer</h2>
                <label className="block text-sm font-medium text-gray-700">Printer type
                    <select value={s.printMode} onChange={e => set('printMode', e.target.value as HardwareSettings['printMode'])} className={`${field} bg-white`}>
                        <option value="off">None: use the print dialog</option>
                        <option value="network">Network thermal printer (ESC/POS, opens the drawer)</option>
                        <option value="system">Printer installed on this computer</option>
                    </select>
                </label>
                {s.printMode === 'network' && (
                    <div className="grid grid-cols-3 gap-3">
                        <label className="col-span-2 block text-sm font-medium text-gray-700">Printer IP address<input value={s.printerHost} onChange={e => set('printerHost', e.target.value)} placeholder="192.168.1.50" className={field} /></label>
                        <label className="block text-sm font-medium text-gray-700">Port<input type="number" value={s.printerPort} onChange={e => set('printerPort', Number(e.target.value))} className={field} /></label>
                    </div>
                )}
                {s.printMode === 'system' && (
                    <label className="block text-sm font-medium text-gray-700">Printer
                        <select value={s.printerName} onChange={e => set('printerName', e.target.value)} className={`${field} bg-white`}>
                            <option value="">Default printer</option>
                            {printers.map(p => <option key={p.name} value={p.name}>{p.name}{p.isDefault ? ' (default)' : ''}</option>)}
                        </select>
                    </label>
                )}
                {s.printMode === 'network' && (
                    <label className="block text-sm font-medium text-gray-700">Paper
                        <select value={s.paperWidth} onChange={e => set('paperWidth', Number(e.target.value) as 32 | 42)} className={`${field} bg-white`}>
                            <option value={42}>80 mm</option>
                            <option value={32}>58 mm</option>
                        </select>
                    </label>
                )}
                <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={s.autoPrint} onChange={e => set('autoPrint', e.target.checked)} />Print the receipt automatically after each sale</label>
                <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={s.autoDrawer} onChange={e => set('autoDrawer', e.target.checked)} />Open the cash drawer for cash sales and No sale</label>
                {s.printMode === 'system' && <p className="text-xs text-gray-500">With an installed printer the drawer opens through the printer driver (set "open cash drawer" in the driver). Automatic drawer pulses need a network ESC/POS printer.</p>}
                <div className="flex flex-wrap gap-2 pt-1">
                    <Button onClick={save} disabled={busy}>Save</Button>
                    <Button variant="outline" disabled={busy || s.printMode === 'off'} onClick={() => run(hardware.testPrint, 'Test page sent to the printer')}>Print test page</Button>
                    <Button variant="outline" disabled={busy || s.printMode !== 'network'} onClick={() => run(hardware.openDrawer, 'Drawer opened')}>Open drawer</Button>
                </div>
            </section>
            <OfflineTest />
            <section className="bg-white rounded-xl border border-gray-200 p-5 text-sm text-gray-700 space-y-1">
                <h2 className="font-semibold text-gray-900">Barcode scanner</h2>
                <p>USB and Bluetooth scanners that type like a keyboard work with no setup: scan while the till screen is open. Set the scanner to add an Enter key after each scan.</p>
            </section>
        </div>
    );
};

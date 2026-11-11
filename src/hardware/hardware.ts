// Bridge to the Auvren Till desktop shell (Electron). In a normal browser none of this exists and the
// app falls back to the browser's print dialog, so the web version keeps working everywhere.

export type PrintMode = 'off' | 'network' | 'system';

export interface HardwareSettings {
    printMode: PrintMode;
    printerHost: string;
    printerPort: number;
    printerName: string;
    paperWidth: 32 | 42;
    autoPrint: boolean;
    autoDrawer: boolean;
}

export interface ReceiptPayload {
    storeName: string;
    address?: string;
    receiptNumber: string;
    date: string;
    cashier?: string;
    customer?: string;
    gift?: boolean;
    lines: { name: string; quantity: number; total: number; note?: string }[];
    discountTotal: number;
    /** Loyalty points spent, e.g. { points: 250, value: 2.5 } */
    points?: { points: number; value: number };
    total: number;
    vatRows: { rate: number; net: number; vat: number }[];
    payments: { label: string; amount: number }[];
    change: number;
    footer?: string;
}

interface Result { ok: boolean; error?: string }

interface Bridge {
    isDesktop: true;
    getSettings(): Promise<HardwareSettings>;
    setSettings(patch: Partial<HardwareSettings>): Promise<HardwareSettings>;
    listPrinters(): Promise<{ name: string; isDefault: boolean }[]>;
    printReceipt(receipt: ReceiptPayload, options?: { openDrawer?: boolean }): Promise<Result>;
    openDrawer(): Promise<Result>;
    testPrint(): Promise<Result>;
    appInfo(): Promise<{ version: string; platform: string; dev: boolean }>;
}

const bridge = (): Bridge | undefined => (window as unknown as { tillHardware?: Bridge }).tillHardware;

export const isDesktop = (): boolean => !!bridge();

export const hardware = {
    settings: async (): Promise<HardwareSettings | null> => (bridge() ? bridge()!.getSettings() : null),
    save: (patch: Partial<HardwareSettings>) => bridge()!.setSettings(patch),
    printers: () => bridge()!.listPrinters(),
    appInfo: () => bridge()!.appInfo(),
    testPrint: () => bridge()!.testPrint(),
    openDrawer: () => bridge()!.openDrawer(),
    printReceipt: (receipt: ReceiptPayload, openDrawer: boolean) => bridge()!.printReceipt(receipt, { openDrawer }),
};

/** True when a real receipt printer is set up in the desktop app. */
export async function hasReceiptPrinter(): Promise<boolean> {
    const s = await hardware.settings();
    return !!s && s.printMode !== 'off';
}

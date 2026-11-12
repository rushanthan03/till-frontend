import { useState } from 'react';
import { flushSync } from 'react-dom';
import { toast } from 'react-toastify';
import { hardware, isDesktop } from '../../hardware/hardware';
import { buildReceiptPayload } from '../../utils/receiptPayload';
import type { Sale } from '../../features/sales/types';

/**
 * Prints a receipt or gift receipt: on the receipt printer when the desktop app has one, otherwise
 * through the browser's print dialog. `gift` tells the on-screen ReceiptView what to show while printing.
 */
export function useReceiptPrint(storeName: string, storeAddress?: string) {
    const [gift, setGift] = useState(false);

    const print = async (sale: Sale, asGift = false) => {
        if (isDesktop()) {
            const s = await hardware.settings();
            if (s && s.printMode !== 'off') {
                const r = await hardware.printReceipt(buildReceiptPayload(sale, storeName, storeAddress, asGift), false);
                if (!r.ok) toast.error(`Receipt not printed: ${r.error}`);
                return;
            }
        }
        // The browser prints what is on screen, so switch the receipt to the gift version first.
        flushSync(() => setGift(asGift));
        window.print();
        setGift(false);
    };

    return { gift, print };
}

/** Print only the element with id="receipt-print" (receipts and reports). */
export function PrintStyles() {
    return (
        <style>{`@media print {
            body * { visibility: hidden !important; }
            #receipt-print, #receipt-print * { visibility: visible !important; }
            #receipt-print { position: absolute; left: 0; top: 0; width: 80mm; box-shadow: none !important; border: none !important; }
        }`}</style>
    );
}

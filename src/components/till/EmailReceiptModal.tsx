import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { toast } from 'react-toastify';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { Input } from '../Input';
import { handleApiError } from '../../api/handleApiError';
import { SalesAPI } from '../../features/sales/salesAPI';
import { CustomersAPI } from '../../features/customers/customersAPI';
import { isValidEmail } from '../../utils';
import type { Sale } from '../../features/sales/types';

interface Props {
    sale: Sale;
    storeId?: string;
    /** Start with the gift receipt ticked (when opened from a gift receipt button). */
    gift?: boolean;
    onClose: () => void;
}

/** Ask for an address and email the receipt. Fills in the loyalty customer's email when there is one. */
export function EmailReceiptModal({ sale, storeId, gift: startGift = false, onClose }: Props) {
    const [email, setEmail] = useState('');
    const [gift, setGift] = useState(startGift);
    const [sending, setSending] = useState(false);
    const [touched, setTouched] = useState(false);

    useEffect(() => {
        if (!sale.customerId) return;
        let live = true;
        CustomersAPI.get(sale.customerId, storeId)
            .then(c => { if (live && c.email) setEmail(e => e || c.email!); })
            .catch(() => { /* no prefill; the cashier types it */ });
        return () => { live = false; };
    }, [sale.customerId, storeId]);

    const valid = isValidEmail(email);
    const send = async () => {
        setTouched(true);
        if (!valid) return;
        setSending(true);
        try {
            await SalesAPI.emailReceipt(sale.id, storeId, { email: email.trim(), gift });
            toast.success(`${gift ? 'Gift receipt' : 'Receipt'} sent to ${email.trim()}`);
            onClose();
        } catch (e) {
            toast.error(handleApiError(e));
        } finally {
            setSending(false);
        }
    };

    return (
        <Modal
            isOpen
            onClose={onClose}
            title={`Email receipt ${sale.receiptNumber}`}
            size="sm"
            footer={<>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={send} isLoading={sending} disabled={sending}><Mail className="w-4 h-4 mr-2" />Send</Button>
            </>}
        >
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); void send(); }}>
                <Input
                    label="Customer's email"
                    type="email"
                    inputMode="email"
                    autoComplete="off"
                    autoFocus
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onBlur={() => setTouched(true)}
                    error={touched && email && !valid ? 'Enter a valid email address' : undefined}
                    placeholder="name@example.com"
                />
                <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" className="mt-0.5 h-4 w-4" checked={gift} onChange={e => setGift(e.target.checked)} />
                    <span><span className="font-medium text-gray-900">Gift receipt</span><span className="block text-gray-500">Lists the items without prices, for the person receiving the gift.</span></span>
                </label>
                <p className="text-xs text-gray-500">The address is only used to send this receipt. It isn't saved.</p>
            </form>
        </Modal>
    );
}

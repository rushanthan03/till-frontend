import { useEffect, useState } from 'react';
import { Gift, Mail } from 'lucide-react';
import { toast } from 'react-toastify';
import { IOSSwitch } from '../../components/Switch';
import { handleApiError } from '../../api/handleApiError';
import { PermissionsAPI } from '../../features/permissions/permissionsAPI';
import { DEFAULT_FEATURES, type Features } from '../../features/permissions/permissions';
import { usePermissions } from '../../hooks/usePermissions';

/** Company-wide receipt options. Each switch saves straight away. */
export default function ReceiptsTab({ primaryColor }: { primaryColor: string }) {
    const { reload } = usePermissions();
    const [features, setFeatures] = useState<Features | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        PermissionsAPI.features()
            .then(f => setFeatures({ ...DEFAULT_FEATURES, ...f }))
            .catch(e => { toast.error(handleApiError(e)); setFeatures(DEFAULT_FEATURES); });
    }, []);

    const toggle = async (key: keyof Features, on: boolean) => {
        if (!features) return;
        const before = features;
        setFeatures({ ...features, [key]: on });
        setSaving(true);
        try {
            setFeatures({ ...DEFAULT_FEATURES, ...(await PermissionsAPI.updateFeatures({ [key]: on })) });
            await reload();
            toast.success(on ? 'Email receipts switched on' : 'Email receipts switched off');
        } catch (e) {
            setFeatures(before);
            toast.error(handleApiError(e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100" aria-label="Receipt options">
            <div className="p-6">
                <h2 className="text-lg font-bold text-gray-900">Receipts</h2>
                <p className="text-sm text-gray-500">These apply to every store in the company.</p>
            </div>

            <div className="p-6 flex items-start justify-between gap-6">
                <div className="flex gap-3">
                    <Mail className="w-5 h-5 mt-0.5 text-gray-500 shrink-0" aria-hidden />
                    <div>
                        <div id="email-receipts-label" className="font-semibold text-gray-900">Email receipts</div>
                        <p className="text-sm text-gray-500 max-w-xl">
                            Adds an Email button after a sale and in Sales history, so staff can send the receipt or a gift receipt
                            to the customer. The server must have email set up.
                        </p>
                    </div>
                </div>
                <IOSSwitch
                    primaryColor={primaryColor}
                    checked={!!features?.emailReceipts}
                    disabled={!features || saving}
                    onChange={e => void toggle('emailReceipts', e.target.checked)}
                    slotProps={{ input: { 'aria-labelledby': 'email-receipts-label' } }}
                />
            </div>

            <div className="p-6 flex gap-3">
                <Gift className="w-5 h-5 mt-0.5 text-gray-500 shrink-0" aria-hidden />
                <div>
                    <div className="font-semibold text-gray-900">Gift receipts</div>
                    <p className="text-sm text-gray-500 max-w-xl">Always available: prints the items without prices. Staff choose it after a sale or in Sales history.</p>
                </div>
            </div>
        </section>
    );
}

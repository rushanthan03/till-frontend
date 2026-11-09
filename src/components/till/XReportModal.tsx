import { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import { toast } from 'react-toastify';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { ReportView, Row, Divider } from './ReportRows';
import { money } from '../../utils/money';
import { handleApiError } from '../../api/handleApiError';
import { ShiftsAPI } from '../../features/shifts/shiftsAPI';
import type { XReport } from '../../features/shifts/types';

interface Props {
    restaurantId: string;
    storeName: string;
    onClose: () => void;
}

/** X report: running totals for the open till session. Does not close or reset anything. */
export function XReportModal({ restaurantId, storeName, onClose }: Props) {
    const [report, setReport] = useState<XReport | null>(null);

    useEffect(() => {
        ShiftsAPI.xReport(restaurantId).then(setReport).catch((e) => { toast.error(handleApiError(e)); onClose(); });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [restaurantId]);

    return (
        <Modal isOpen onClose={onClose} title="X report" description="Running totals for this till session. Nothing is closed." size="sm">
            {!report ? (
                <p className="py-10 text-center text-gray-500">Loading…</p>
            ) : (
                <div className="space-y-4">
                    <ReportView
                        title="X REPORT"
                        storeName={storeName}
                        cashier={report.shift.cashierName}
                        opened={report.shift.openedAt}
                        openingFloat={report.shift.openingFloat}
                        figures={report}
                        extra={<><Divider /><Row label="Expected cash in drawer" value={money(report.expectedCash)} bold /></>}
                    />
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Print</Button>
                        <Button className="flex-1" onClick={onClose}>Close</Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}

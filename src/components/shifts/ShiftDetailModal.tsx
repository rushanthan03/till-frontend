import { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { ReportView, Row, Divider } from '../till/ReportRows';
import { DifferenceBadge } from './DifferenceBadge';
import { money } from '../../utils/money';
import { handleApiError } from '../../api/handleApiError';
import { ShiftsAPI } from '../../features/shifts/shiftsAPI';
import { RouteLinks } from '../../routers/type';
import type { ShiftDetail } from '../../features/shifts/types';

interface Props {
    shiftId: string;
    storeId: string;
    storeName: string;
    onClose: () => void;
}

/** A session's report: the saved Z report if closed, live X figures if still open. */
export function ShiftDetailModal({ shiftId, storeId, storeName, onClose }: Props) {
    const navigate = useNavigate();
    const [detail, setDetail] = useState<ShiftDetail | null>(null);

    useEffect(() => {
        setDetail(null);
        ShiftsAPI.detail(shiftId, storeId).then(setDetail).catch((e) => { toast.error(handleApiError(e)); onClose(); });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shiftId, storeId]);

    const shift = detail?.shift;
    const isOpen = shift?.status === 'open';

    return (
        <Modal isOpen onClose={onClose} size="sm"
            title={shift ? (isOpen ? 'Till session (open)' : 'Till session report') : 'Till session'}
            description={shift ? `${shift.cashierName}${isOpen ? ' · figures are live and still changing' : ''}` : undefined}>
            {!detail || !shift ? <p className="py-12 text-center text-gray-500" role="status">Loading…</p> : (
                <div className="space-y-4">
                    <ReportView
                        title={isOpen ? 'X REPORT — LIVE' : 'Z REPORT'}
                        storeName={storeName}
                        cashier={shift.cashierName}
                        opened={shift.openedAt}
                        closed={shift.closedAt}
                        openingFloat={shift.openingFloat}
                        figures={detail}
                        extra={<>
                            <Divider />
                            <Row label={isOpen ? 'Expected cash now' : 'Expected cash'} value={money(detail.expectedCash)} />
                            {!isOpen && <>
                                <Row label="Counted cash" value={money(shift.countedCash)} />
                                <div className="flex justify-between items-center font-bold"><span>Difference</span><DifferenceBadge variance={shift.variance} /></div>
                                {shift.closeNote && <div className="mt-1 text-gray-600">Reason: {shift.closeNote}</div>}
                            </>}
                            {shift.openingNote && <div className="mt-1 text-gray-600">Opening note: {shift.openingNote}</div>}
                        </>}
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                        <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Print</Button>
                        <Button variant="outline" onClick={() => navigate(`${RouteLinks.SALES}?shift=${shift.id}`)}>View sales in this session</Button>
                    </div>
                    <Button className="w-full" onClick={onClose}>Close</Button>
                </div>
            )}
        </Modal>
    );
}

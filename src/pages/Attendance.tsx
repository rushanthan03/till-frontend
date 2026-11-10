import { useEffect, useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import { PeriodPicker } from '../components/PeriodPicker';
import { useAuth } from '../hooks/useAuth';
import { handleApiError } from '../api/handleApiError';
import { Preset, rangeFor } from '../utils/dateRange';
import { AttendanceAPI, AttendanceReport } from '../features/attendance/attendanceAPI';

const hours = (m: number) => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');

/** Who worked when: clock in and out times and total hours per person. */
export const AttendancePage = () => {
    const { user } = useAuth();
    const storeId = localStorage.getItem('selectedRestaurantId') || user?.restaurantId || user?.restaurant?.id || '';
    const [preset, setPreset] = useState<Preset>('7d');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [report, setReport] = useState<AttendanceReport | null>(null);
    const [loading, setLoading] = useState(false);
    const range = useMemo(() => rangeFor(preset, customFrom, customTo), [preset, customFrom, customTo]);

    useEffect(() => {
        if (!storeId || (preset === 'custom' && !customFrom && !customTo)) return;
        setLoading(true);
        AttendanceAPI.report(storeId, range).then(setReport).catch(e => toast.error(handleApiError(e))).finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storeId, range.from, range.to]);

    if (!storeId) return <p className="p-10 text-center text-gray-500">Pick a store first.</p>;
    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Clock className="w-6 h-6" />Attendance</h1>
                <p className="text-sm text-gray-600">Clock in and out times. Staff clock in automatically when they sign in with a PIN, and clock out from the till after closing it.</p>
            </div>
            <div className="print:hidden"><PeriodPicker preset={preset} customFrom={customFrom} customTo={customTo} onPreset={setPreset} onCustomFrom={setCustomFrom} onCustomTo={setCustomTo} /></div>
            {loading && <p className="text-sm text-gray-500" role="status">Loading…</p>}
            {report && (
                <>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                        <div className="px-4 py-3 font-semibold text-gray-900 border-b border-gray-100">Hours by person</div>
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-4 py-2">Name</th><th className="px-4 py-2 text-right">Shifts</th><th className="px-4 py-2 text-right">Hours</th></tr></thead>
                            <tbody className="divide-y divide-gray-100">
                                {report.people.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">No clock entries in this period.</td></tr>}
                                {report.people.map(p => <tr key={p.userId}><td className="px-4 py-2 font-medium">{p.userName}</td><td className="px-4 py-2 text-right tabular-nums">{p.shifts}</td><td className="px-4 py-2 text-right tabular-nums">{hours(p.minutes)}</td></tr>)}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                        <div className="px-4 py-3 font-semibold text-gray-900 border-b border-gray-100">Clock entries</div>
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">In</th><th className="px-4 py-2">Out</th><th className="px-4 py-2 text-right">Time</th><th className="px-4 py-2">Note</th></tr></thead>
                            <tbody className="divide-y divide-gray-100">
                                {report.entries.map(e => (
                                    <tr key={e.id}>
                                        <td className="px-4 py-2">{e.userName}</td><td className="px-4 py-2">{when(e.clockedInAt)}</td>
                                        <td className="px-4 py-2">{e.open ? <span className={e.forgotten ? 'text-red-700 font-semibold' : 'text-green-700'}>{e.forgotten ? 'Forgot to clock out' : 'On the clock'}</span> : when(e.clockedOutAt)}</td>
                                        <td className="px-4 py-2 text-right tabular-nums">{hours(e.minutes)}</td><td className="px-4 py-2 text-gray-500">{e.note ?? ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

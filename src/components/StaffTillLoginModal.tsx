import { FormEvent, useState } from 'react';
import { toast } from 'react-toastify';
import { Modal } from './Modal';
import { Button } from './Button';
import { AttendanceAPI } from '../features/attendance/attendanceAPI';
import { handleApiError } from '../api/handleApiError';

interface Props {
    userId: string;
    name: string;
    onClose: () => void;
}

/** Sets the employee number and PIN a member of staff uses to sign in at the till. */
export function StaffTillLoginModal({ userId, name, onClose }: Props) {
    const [employeeNumber, setEmployeeNumber] = useState('');
    const [pin, setPin] = useState('');
    const [busy, setBusy] = useState(false);
    const valid = /^\d{3,8}$/.test(employeeNumber) && /^\d{4,6}$/.test(pin);

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (!valid) return;
        setBusy(true);
        try {
            await AttendanceAPI.setStaffLogin(userId, { employeeNumber, pin });
            toast.success(`Till sign-in saved for ${name}`);
            onClose();
        } catch (err) { toast.error(handleApiError(err)); } finally { setBusy(false); }
    };

    const field = 'mt-1 w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600';
    return (
        <Modal isOpen onClose={onClose} title={`Till sign-in: ${name}`} size="sm">
            <form onSubmit={submit} className="space-y-4">
                <p className="text-sm text-gray-600">{name} will type these on the till's Staff PIN screen. Saving again replaces the old PIN.</p>
                <label className="block text-sm font-medium text-gray-700">Employee number (3 to 8 digits)
                    <input inputMode="numeric" autoFocus autoComplete="off" value={employeeNumber} onChange={e => setEmployeeNumber(e.target.value.replace(/\D/g, '').slice(0, 8))} className={field} /></label>
                <label className="block text-sm font-medium text-gray-700">PIN (4 to 6 digits)
                    <input type="password" inputMode="numeric" autoComplete="new-password" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} className={field} /></label>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={!valid || busy}>{busy ? 'Saving…' : 'Save'}</Button>
                </div>
            </form>
        </Modal>
    );
}

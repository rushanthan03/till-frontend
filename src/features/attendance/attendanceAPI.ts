import axiosClient from "../../api/axiosClient";

export interface TimeEntry {
    id: string;
    userId: string;
    userName: string;
    clockedInAt: string;
    clockedOutAt: string | null;
    note: string | null;
    minutes?: number;
    open?: boolean;
    forgotten?: boolean;
}

export interface AttendanceReport {
    from: string;
    to: string;
    people: { userId: string; userName: string; minutes: number; shifts: number }[];
    entries: (TimeEntry & { minutes: number; open: boolean; forgotten: boolean })[];
}

// axiosClient's response interceptor already unwraps `response.data`.
const unwrap = <T>(request: Promise<unknown>) => request as Promise<T>;

export const AttendanceAPI = {
    status: async (storeId?: string): Promise<TimeEntry | null> => {
        const res = await unwrap<TimeEntry | '' | null>(axiosClient.get('/api/attendance/status', { params: { storeId } }));
        return res && typeof res === 'object' ? res : null;
    },
    clockIn: (storeId?: string) => unwrap<TimeEntry>(axiosClient.post('/api/attendance/clock-in', null, { params: { storeId } })),
    clockOut: (storeId?: string) => unwrap<TimeEntry>(axiosClient.post('/api/attendance/clock-out', null, { params: { storeId } })),
    report: (storeId: string | undefined, range: { from?: string; to?: string; userId?: string } = {}) =>
        unwrap<AttendanceReport>(axiosClient.get('/api/attendance', { params: { storeId, ...range } })),
    setStaffLogin: (userId: string, body: { employeeNumber?: string; pin?: string }) =>
        unwrap<{ id: string; name: string; employeeNumber: string | null; hasPin: boolean }>(axiosClient.post(`/api/staff/${userId}/till-login`, body)),
};

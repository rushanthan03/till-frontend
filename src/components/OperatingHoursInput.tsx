import { FC, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface OperatingHoursInputProps {
    value?: Record<string, string> | null;
    onChange: (value: Record<string, string> | null) => void;
}

export const OperatingHoursInput: FC<OperatingHoursInputProps> = ({ value, onChange }) => {
    const [entries, setEntries] = useState<{ id: number, days: string, open: string, close: string }[]>([]);

    // Initialize entries from value prop
    useEffect(() => {
        if (value && Object.keys(value).length > 0) {
            const newEntries = (Object.entries(value) as [string, any][]).map(
                ([day, schedule], index) => ({
                    id: Date.now() + index,
                    days: day,
                    open: schedule.closed ? "" : schedule.open,
                    close: schedule.closed ? "" : schedule.close,
                })
            );
            setEntries(newEntries);
        } else {
            setEntries([]);
        }
    }, [value]);

    const updateParent = (currentEntries: typeof entries) => {
        if (currentEntries.length === 0) {
            onChange(null);
            return;
        }
        const newValue: Record<string, string> = {};
        let hasValidEntry = false;

        currentEntries.forEach(e => {
            if (e.days && e.open && e.close) {
                newValue[e.days] = `${e.open}-${e.close}`;
                hasValidEntry = true;
            }
        });

        onChange(hasValidEntry ? newValue : null);
    };

    const addEntry = () => {
        const newEntries = [...entries, { id: Date.now(), days: '', open: '09:00', close: '22:00' }];
        setEntries(newEntries);
        // We don't update parent immediately on add to avoid sending incomplete data
    };

    const removeEntry = (id: number) => {
        const newEntries = entries.filter(e => e.id !== id);
        setEntries(newEntries);
        updateParent(newEntries);
    };

    const handleChange = (id: number, field: 'days' | 'open' | 'close', val: string) => {
        const newEntries = entries.map(e => e.id === id ? { ...e, [field]: val } : e);
        setEntries(newEntries);
        updateParent(newEntries);
    };

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">Day-Specific Hours</label>
                <button
                    type="button"
                    onClick={addEntry}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                    <Plus className="w-4 h-4" />
                    Add Schedule
                </button>
            </div>

            {entries.length === 0 && (
                <div className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
                    No specific schedules added. Standard hours will apply.
                </div>
            )}

            <div className="space-y-2">
                {entries.map((entry) => (
                    <div key={entry.id} className="flex gap-2 items-start">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="e.g. Mon-Fri"
                                value={entry.days}
                                onChange={(e) => handleChange(entry.id, 'days', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="w-28">
                            <input
                                type="time"
                                value={entry.open}
                                onChange={(e) => handleChange(entry.id, 'open', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <span className="self-center text-gray-400 font-medium">-</span>
                        <div className="w-28">
                            <input
                                type="time"
                                value={entry.close}
                                onChange={(e) => handleChange(entry.id, 'close', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => removeEntry(entry.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-[1px]"
                            title="Remove schedule"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
            <p className="text-xs text-gray-400">
                Specify days (e.g., "Mon-Fri", "Weekends") and their operating hours.
            </p>
        </div>
    );
};

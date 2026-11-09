import { PRESETS, Preset } from '../utils/dateRange';

interface Props {
    preset: Preset;
    customFrom: string;
    customTo: string;
    onPreset: (p: Preset) => void;
    onCustomFrom: (v: string) => void;
    onCustomTo: (v: string) => void;
}

/** Period chips (Today, Yesterday, …) plus from/to date inputs for "Custom". */
export function PeriodPicker({ preset, customFrom, customTo, onPreset, onCustomFrom, onCustomTo }: Props) {
    return (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Period">
            {PRESETS.map(p => (
                <button key={p.id} type="button" aria-pressed={preset === p.id} onClick={() => onPreset(p.id)}
                    className={`px-3.5 py-1.5 text-sm rounded-full border font-medium ${preset === p.id ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>{p.label}</button>
            ))}
            {preset === 'custom' && (
                <span className="flex items-center gap-2 text-sm">
                    <input type="date" aria-label="From date" value={customFrom} max={customTo || undefined} onChange={(e) => onCustomFrom(e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded-lg" />
                    <span className="text-gray-500">to</span>
                    <input type="date" aria-label="To date" value={customTo} min={customFrom || undefined} onChange={(e) => onCustomTo(e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded-lg" />
                </span>
            )}
        </div>
    );
}

import { Clock } from "lucide-react";
import { IOSSwitch } from "../../components/Switch";
import { RestaurantRequestResponse } from "../../features/stores/types";

interface OpenHoursTabProps {
    restaurantState: RestaurantRequestResponse | null;
    setRestaurantState: (restaurantState: RestaurantRequestResponse | null) => void;
    primaryColor: string;
}

function OpenHoursTab({ restaurantState, setRestaurantState, primaryColor }: OpenHoursTabProps) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 md:p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                <div className="p-3 bg-orange-50/80 border border-orange-100/80 rounded-2xl text-orange-600 shrink-0">
                    <Clock className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Weekly Schedule</h2>
                    <p className="text-sm text-slate-500 font-medium">Set the operating hours for each day of the week</p>
                </div>
            </div>

            {/* Schedule List */}
            <div className="space-y-3">
                {days.map((day) => {
                    const dayKey = day.toLowerCase();
                    const dayHours = restaurantState?.openHours?.[dayKey] || { open: '09:00', close: '22:00', closed: false };
                    const isOpen = !dayHours.closed;

                    return (
                        <div
                            key={day}
                            className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all duration-200 ${
                                isOpen
                                    ? 'bg-slate-50/50 border-slate-200/70 hover:bg-white hover:border-slate-300 hover:shadow-xs'
                                    : 'bg-slate-100/40 border-slate-200/40 opacity-75'
                            }`}
                        >
                            {/* Day & Toggle */}
                            <div className="flex items-center gap-4 min-w-[180px]">
                                <IOSSwitch
                                    primaryColor={primaryColor}
                                    checked={isOpen}
                                    onChange={(e) => {
                                        const newOpenHours = {
                                            ...restaurantState?.openHours,
                                            [dayKey]: { ...dayHours, closed: !e.target.checked }
                                        };
                                        setRestaurantState({ ...restaurantState, openHours: newOpenHours });
                                    }}
                                />
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-slate-800">{day}</span>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                                        isOpen
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                                            : 'bg-slate-200/60 text-slate-600 border-slate-300/50'
                                    }`}>
                                        {isOpen ? 'Open' : 'Closed'}
                                    </span>
                                </div>
                            </div>

                            {/* Time Selectors */}
                            {isOpen ? (
                                <div className="flex items-center gap-3 flex-1 sm:justify-end animate-in fade-in duration-200">
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                                        <span className="text-xs font-medium text-slate-400">Open</span>
                                        <input
                                            type="time"
                                            value={dayHours.open || '09:00'}
                                            onChange={(e) => {
                                                const newOpenHours = {
                                                    ...restaurantState?.openHours,
                                                    [dayKey]: { ...dayHours, open: e.target.value }
                                                };
                                                setRestaurantState({ ...restaurantState, openHours: newOpenHours });
                                            }}
                                            className="text-sm font-medium text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                                        />
                                    </div>

                                    <span className="text-slate-300 font-medium">–</span>

                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                                        <span className="text-xs font-medium text-slate-400">Close</span>
                                        <input
                                            type="time"
                                            value={dayHours.close || '22:00'}
                                            onChange={(e) => {
                                                const newOpenHours = {
                                                    ...restaurantState?.openHours,
                                                    [dayKey]: { ...dayHours, close: e.target.value }
                                                };
                                                setRestaurantState({ ...restaurantState, openHours: newOpenHours });
                                            }}
                                            className="text-sm font-medium text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs font-medium text-slate-400 italic">
                                    No operating hours set
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default OpenHoursTab;
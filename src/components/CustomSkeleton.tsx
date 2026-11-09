import { Skeleton } from "@mui/material";

export const SubscriptionCardSkeleton = () => (
    <div className={`bg-white rounded-xl shadow-sm border-2 transition-all hover:shadow-lg border-gray-200`}>
        <div className='p-6'>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <Skeleton width={100} height={50} />
                    <Skeleton width={50} />
                </div>
                <Skeleton width={20} height={35} />
            </div>
            <Skeleton width={200} />
            <div className="mb-6 mt-0">
                <div className="flex items-baseline -mb-2">
                    <Skeleton width={170} height={80} />
                </div>
                <Skeleton width={150} />
            </div>
            <div className="space-y-3 mb-6">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-2">
                        <Skeleton width={15} />
                        <Skeleton width={150} />
                    </div>
                ))}
            </div>
            <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Skeleton width={35} />
                        <Skeleton width={55} height={30} />
                    </div>
                    <div>
                        <Skeleton width={35} />
                        <Skeleton width={55} height={30} />
                    </div>
                </div>
            </div>
        </div>
    </div>
)

export const QRCardSkeleton = () => (
    <div className={`flex flex-col bg-white rounded-xl border border-gray-200 min-h-[280px]`}>
        {/* Header Section */}
        <div className="flex justify-between items-center px-6 pt-5 pb-3">
            <Skeleton width={120} height={40} />
            <Skeleton width={80} height={32} className="rounded-full" />
        </div>

        {/* Details Section - grows to fill space */}
        <div className="px-6 space-y-3 grow">
            <div className="flex items-center space-x-2">
                <Skeleton variant="circular" width={16} height={16} />
                <Skeleton width={60} />
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1">
                    <Skeleton variant="circular" width={16} height={16} />
                    <Skeleton width={150} />
                </div>
                <Skeleton width={40} height={24} />
            </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-4 mx-6" />

        {/* Action Buttons - always at bottom */}
    </div>
)

export const MenuItemCardSkeleton = () => (
    <div className="h-[360px] bg-white rounded-xl duration-100 ease-linear shadow border border-gray-200">
        <Skeleton variant="rectangular" width="100%" height="50%" className="rounded-t-xl" />

        <div className="flex h-14 justify-between px-4 pt-2.5 pb-1.5 space-x-2 items-center">
            <Skeleton width="60%" height={24} />
            <Skeleton width={80} height={32} className="rounded-full" />
        </div >

        <div className="flex px-4 space-x-2 items-center mt-2">
            <Skeleton width={60} height={20} />
            <Skeleton width={100} height={20} />
        </div>

        <div className="h-px bg-gray-200 mx-5 my-3" />

        <div className="flex justify-between px-4 items-center">
            <Skeleton width={80} height={24} className="rounded-full" />
            <Skeleton width={40} height={24} />
        </div>

        <div className="flex justify-between px-10 mt-4 pt-2 border-gray-200 border-t">
            <Skeleton width={50} height={20} />
            <div className="w-px h-4 bg-gray-200" />
            <Skeleton width={50} height={20} />
        </div>
    </div >
)

export const CategoryCardSkeleton = () => (
    <div className="flex h-24 bg-gray-100 rounded-lg px-6 items-center justify-between space-x-4 border border-gray-200">
        <div className="flex flex-col space-y-2 w-full">
            <Skeleton width="40%" height={24} />
            <Skeleton width="70%" height={16} />
        </div>
        <Skeleton variant="rectangular" width={20} height={20} />
    </div>
)

export const DashboardKPISkeleton = () => (
    <div className="relative bg-white rounded-2xl p-5 border border-gray-200 shadow-sm animate-pulse min-h-[140px] flex flex-col justify-between overflow-hidden">
        {/* Decorative circle skeleton */}
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full border-12 border-gray-50 opacity-10"></div>

        <div className="relative z-10 flex items-start justify-between">
            <Skeleton variant="rectangular" width={44} height={44} className="rounded-xl bg-gray-100" />
            <Skeleton variant="rectangular" width={70} height={24} className="rounded-full bg-gray-50" />
        </div>

        <div className="relative z-10 mt-auto">
            <Skeleton width="60%" height={36} className="bg-gray-200 mb-2 rounded-lg" />
            <Skeleton width="40%" height={16} className="bg-gray-100 rounded-md" />
        </div>
    </div>
)

export const AnalyticsKPISkeleton = () => (
    <div className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-200 animate-pulse min-h-[160px] flex flex-col justify-between overflow-hidden">
        {/* Decorative circle skeleton */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full border-12 border-gray-50 opacity-10"></div>

        <div className="relative z-10 flex items-start justify-between">
            <Skeleton variant="rectangular" width={48} height={48} className="rounded-xl bg-gray-100" />
            <Skeleton variant="rectangular" width={80} height={28} className="rounded-full bg-gray-50" />
        </div>

        <div className="relative z-10 mt-auto">
            <Skeleton width="50%" height={40} className="bg-gray-200 mb-2 rounded-lg" />
            <div className="flex items-center gap-2">
                <Skeleton width={60} height={20} className="rounded-md bg-gray-100" />
                <Skeleton width={80} height={16} className="bg-gray-100 rounded-md" />
            </div>
        </div>
    </div>
)

export const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full animate-pulse">
        <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
                <Skeleton width="35%" height={20} className="mb-2 bg-gray-200" />
                <Skeleton width="50%" height={14} className="bg-gray-100" />
            </div>
            <Skeleton variant="rectangular" width={40} height={40} className="rounded-lg bg-gray-100" />
        </div>
        <Skeleton variant="rectangular" width="100%" height={height - 120} className="rounded-lg bg-gray-50" />
    </div>
)

export const TableCardSkeleton = () => (
    <div className="bg-white rounded-2xl p-5 border-2 border-gray-100 shadow-sm animate-pulse">
        <div className="flex flex-col items-center gap-4 mb-4">
            <Skeleton variant="circular" width={112} height={112} className="border-4 border-gray-100" />
        </div>
        <div className="space-y-3">
            <Skeleton width="60%" height={20} className="mx-auto" />
            <div className="flex justify-center gap-4">
                <Skeleton width={60} height={16} />
                <Skeleton width={60} height={16} />
            </div>
        </div>
    </div>
)

export const ListMenuItemCardSkeleton = () => (
    <div className="h-[200px] bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <Skeleton variant="rectangular" width="100%" height="50%" />
        <div className="flex flex-col h-1/2 px-3 py-4 space-y-3">
            <Skeleton width="80%" height={20} className="mx-auto" />
            <div className="border-t border-gray-100 pt-3">
                <Skeleton width="40%" height={24} className="mx-auto" />
            </div>
        </div>
    </div>
)

export const OrderItemCardSkeleton = () => (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm hover:shadow-lg transition-all p-5 animate-pulse">
        <div className="flex items-center justify-between mb-4">
            <Skeleton width={100} height={24} className="rounded-full" />
            <Skeleton variant="circular" width={40} height={40} />
        </div>
        <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2">
                <Skeleton variant="circular" width={16} height={16} />
                <Skeleton width="60%" height={16} />
            </div>
            <div className="flex items-center gap-2">
                <Skeleton variant="circular" width={16} height={16} />
                <Skeleton width="40%" height={16} />
            </div>
            <div className="flex items-center gap-2">
                <Skeleton variant="circular" width={16} height={16} />
                <Skeleton width="50%" height={16} />
            </div>
        </div>
        <div className="border-t border-gray-200 pt-3 mb-3">
            <Skeleton width="30%" height={20} className="mb-2" />
            <Skeleton width="100%" height={40} />
        </div>
        <Skeleton width="100%" height={44} className="rounded-lg" />
    </div>
)

export const SettingsSkeleton = () => (
    <div className="space-y-6">
        {/* Header with Tabs Skeleton */}
        <div className="bg-white/90 rounded-2xl shadow-sm border border-gray-100 p-2 overflow-x-auto no-scrollbar sticky top-16 z-50 backdrop-blur-xl">
            <div className="flex items-center gap-1 min-w-max">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3 rounded-xl bg-gray-50/50">
                        <Skeleton variant="circular" width={20} height={20} />
                        <Skeleton width={80} height={20} />
                    </div>
                ))}
            </div>
        </div>

        <div className="min-h-[600px] animate-pulse">
            <div className="space-y-6">
                {/* General Info Skeleton */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <Skeleton variant="rectangular" width={48} height={48} className="rounded-2xl" />
                        <div>
                            <Skeleton width={180} height={28} className="mb-2" />
                            <Skeleton width={220} height={16} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i}>
                                <Skeleton width={120} height={20} className="mb-2" />
                                <Skeleton width="100%" height={48} className="rounded-lg" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Address Skeleton */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <Skeleton variant="rectangular" width={48} height={48} className="rounded-2xl" />
                        <div>
                            <Skeleton width={180} height={28} className="mb-2" />
                            <Skeleton width={220} height={16} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i}>
                                <Skeleton width={120} height={20} className="mb-2" />
                                <Skeleton width="100%" height={48} className="rounded-lg" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
)

export const KitchenItemSkeleton = () => (
    <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm mb-5">
        <div className="flex items-center space-x-4 border-b border-gray-200 pb-4">
            <div className="flex flex-1 space-x-4">
                <Skeleton variant="circular" width={48} height={48} className="shrink-0" />

                <div className="flex flex-col flex-1 text-left space-y-2">
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton variant="text" width="40%" height={16} />
                    <Skeleton variant="text" width="30%" height={16} />
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <Skeleton variant="rectangular" width={120} height={40} />
                <Skeleton variant="rectangular" width={120} height={40} />
            </div>
        </div>
    </div>
)
export const DashboardSkeleton = () => {
    return (
        <div className="space-y-8 pb-8">
            {/* Hero Section Skeleton */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 p-8 shadow-xl animate-pulse">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                        <Skeleton width="40%" height={48} sx={{ bgcolor: 'rgba(255, 255, 255, 0.3)' }} />
                        <Skeleton width="60%" height={28} sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', marginTop: 1 }} />
                    </div>
                    <div className="flex items-center gap-4">
                        <Skeleton width={150} height={44} sx={{ bgcolor: 'rgba(255, 255, 255, 0.3)', borderRadius: '16px' }} />
                        <Skeleton variant="circular" width={44} height={44} sx={{ bgcolor: 'rgba(255, 255, 255, 0.3)' }} />
                    </div>
                </div>
            </div>

            {/* KPI Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <Skeleton width="70%" height={20} />
                                <Skeleton width="90%" height={36} sx={{ marginTop: 1 }} />
                            </div>
                            <Skeleton variant="circular" width={48} height={48} />
                        </div>
                        <Skeleton width="40%" height={20} />
                    </div>
                ))}
            </div>

            {/* Charts Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Trend Chart Skeleton */}
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex-1">
                            <Skeleton width="40%" height={28} />
                            <Skeleton width="50%" height={16} sx={{ marginTop: 1 }} />
                        </div>
                        <Skeleton variant="circular" width={48} height={48} />
                    </div>
                    <Skeleton variant="rectangular" width="100%" height={320} sx={{ borderRadius: '12px' }} />
                </div>

                {/* Platform Growth Chart Skeleton */}
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex-1">
                            <Skeleton width="40%" height={28} />
                            <Skeleton width="50%" height={16} sx={{ marginTop: 1 }} />
                        </div>
                        <Skeleton variant="circular" width={48} height={48} />
                    </div>
                    <Skeleton variant="rectangular" width="100%" height={320} sx={{ borderRadius: '12px' }} />
                </div>

                {/* User Growth Chart Skeleton */}
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex-1">
                            <Skeleton width="40%" height={28} />
                            <Skeleton width="50%" height={16} sx={{ marginTop: 1 }} />
                        </div>
                        <Skeleton variant="circular" width={48} height={48} />
                    </div>
                    <Skeleton variant="rectangular" width="100%" height={320} sx={{ borderRadius: '12px' }} />
                </div>

                {/* Revenue by Plan Chart Skeleton */}
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex-1">
                            <Skeleton width="40%" height={28} />
                            <Skeleton width="50%" height={16} sx={{ marginTop: 1 }} />
                        </div>
                        <Skeleton variant="circular" width={48} height={48} />
                    </div>
                    <div className="flex items-center justify-center">
                        <Skeleton variant="circular" width={220} height={220} />
                    </div>
                    <div className="flex justify-center gap-4 mt-6">
                        <Skeleton width={80} height={20} />
                        <Skeleton width={80} height={20} />
                        <Skeleton width={80} height={20} />
                    </div>
                </div>

                {/* Billing Cycles Chart Skeleton */}
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex-1">
                            <Skeleton width="40%" height={28} />
                            <Skeleton width="50%" height={16} sx={{ marginTop: 1 }} />
                        </div>
                        <Skeleton variant="circular" width={48} height={48} />
                    </div>
                    <div className="flex items-center justify-center">
                        <Skeleton variant="circular" width={220} height={220} />
                    </div>
                    <div className="flex justify-center gap-4 mt-6">
                        <Skeleton width={80} height={20} />
                        <Skeleton width={80} height={20} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const RestaurantDetailSkeleton = () => (
    <div className="min-h-screen bg-gray-50/50">
        {/* Header Section Skeleton */}
        <div className="relative h-64 w-full bg-gray-200 animate-pulse">
            <div className="absolute top-6 left-6">
                <Skeleton width={180} height={40} style={{ borderRadius: '9999px' }} />
            </div>
        </div>

        {/* Restaurant Info Card Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 transition-all">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                    <div className="flex items-start gap-6 w-full">
                        <div className="-mt-12">
                            <Skeleton variant="rectangular" width={96} height={96} style={{ borderRadius: '0.75rem' }} className="shadow-md border-4 border-white" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <Skeleton width={200} height={40} />
                                <Skeleton width={80} height={32} style={{ borderRadius: '9999px' }} />
                                <Skeleton width={120} height={32} style={{ borderRadius: '9999px' }} />
                            </div>
                            <div className="flex flex-wrap items-center gap-4">
                                <Skeleton width={150} height={24} />
                                <Skeleton width={200} height={24} />
                                <Skeleton width={120} height={24} />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Skeleton variant="circular" width={40} height={40} />
                        <Skeleton variant="circular" width={40} height={40} />
                        <Skeleton width={120} height={40} style={{ borderRadius: '0.5rem' }} />
                    </div>
                </div>

                {/* Navigation Tabs Skeleton */}
                <div className="flex items-center gap-6 mt-8 border-b border-gray-100 px-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="pb-3">
                            <Skeleton width={80} height={24} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Skeleton - Generic Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-64">
                        <Skeleton width="60%" height={28} className="mb-4" />
                        <Skeleton width="100%" height={20} className="mb-2" />
                        <Skeleton width="90%" height={20} className="mb-2" />
                        <Skeleton width="80%" height={20} />
                    </div>
                ))}
            </div>
        </div>
    </div>
);
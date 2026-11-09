import { FC } from 'react';
import { AlertCircle, RefreshCw, Home, ShieldAlert } from 'lucide-react';
import { Button } from '../components/Button';
import { RouteLinks } from '../routers/type';

export const GeneralError: FC = () => {
    const handleReload = () => {
        window.location.reload();
    };

    const handleGoHome = () => {
        window.location.href = RouteLinks.TILL;
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-center font-sans">

            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-50/50 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-50/50 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-xl w-full">
                <div className="bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-gray-100 p-12 md:p-16 mb-8 transform transition-all hover:scale-[1.01]">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-red-50 rounded-3xl mb-10 relative">
                        <ShieldAlert className="w-12 h-12 text-red-500" strokeWidth={1.5} />
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                            <AlertCircle className="w-4 h-4 text-white" />
                        </div>
                    </div>

                    <h1 className="text-4xl font-black text-gray-900 mb-6 tracking-tight">
                        Something's Smoldering
                    </h1>

                    <div className="space-y-4 text-gray-500 mb-12">
                        <p className="text-xl font-medium leading-relaxed italic">
                            "A minor mishap in the digital kitchen."
                        </p>
                        <p className="text-base leading-relaxed">
                            We've encountered an unexpected error. Our team has been notified and we're working to get everything back in order.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button
                            onClick={handleReload}
                            className="w-full py-7 rounded-2xl bg-gray-900 hover:bg-black text-white shadow-xl shadow-gray-200 transition-all active:scale-95 font-bold"
                        >
                            <RefreshCw className="w-5 h-5 mr-2" />
                            Reload Page
                        </Button>
                        <Button
                            onClick={handleGoHome}
                            variant="outline"
                            className="w-full py-7 rounded-2xl border-2 border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all text-gray-600 font-bold"
                        >
                            <Home className="w-5 h-5 mr-2" />
                            Go to Home
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-gray-400">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <p className="text-xs font-bold uppercase tracking-widest">
                        Support Team has been alerted
                    </p>
                </div>
            </div>
        </div>
    );
};

import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';
import { Button } from '../components/Button';
import { RouteLinks } from '../routers/type';
import { useAuth } from '../hooks/useAuth';

const Unauthorized: FC = () => {
    const navigate = useNavigate();
    const { primaryColor, user } = useAuth();

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-6 text-center">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-10"
                    style={{ backgroundColor: primaryColor }}
                />
                <div
                    className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-10"
                    style={{ backgroundColor: primaryColor }}
                />
            </div>

            <div className="relative z-10 max-w-lg w-full">
                {/* Icon Container */}
                <div className="relative inline-block mb-8">
                    <div className="absolute inset-0 animate-ping rounded-full bg-red-100 opacity-20"></div>
                    <div className="relative bg-white p-8 rounded-[40px] shadow-2xl border border-gray-100">
                        <div className="relative">
                            <Lock
                                className="w-16 h-16 text-gray-800"
                                strokeWidth={1.5}
                            />
                            <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-2 border-4 border-white">
                                <ShieldAlert className="w-4 h-4 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-4 mb-10">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                        Access Restricted
                    </h1>
                    <div className="flex flex-col gap-2">
                        <p className="text-gray-500 text-lg leading-relaxed">
                            Oops! You don't have the required permissions to view this page.
                        </p>
                        <p className="text-sm text-gray-400 font-medium">
                            Please contact your administrator if you believe this is an error.
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                        onClick={() => navigate(-1)}
                        variant="outline"
                        className="w-full sm:w-auto px-8 py-6 rounded-2xl border-gray-200 hover:bg-white hover:shadow-lg transition-all"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Go Back
                    </Button>
                    <Button
                        onClick={() => navigate(RouteLinks.TILL)}
                        className="w-full sm:w-auto px-8 py-6 rounded-2xl shadow-xl shadow-blue-200 transition-all hover:-translate-y-1"
                    >
                        <Home className="w-5 h-5 mr-2" />
                        {user?.role === 'manager' || user?.role === 'waiter' || user?.role === 'kitchen_staff' ? 'Go to Orders' : 'Go to Dashboard'}
                    </Button>
                </div>

                {/* Footer Brand */}
                <div className="mt-16 pt-8 border-t border-gray-100">
                    <p className="text-gray-300 font-bold uppercase tracking-[0.2em] text-[10px]">
                        Supermarket Till
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;

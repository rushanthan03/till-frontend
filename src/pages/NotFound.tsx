import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, ArrowLeft, Home, Search } from 'lucide-react';
import { Button } from '../components/Button';
import { RouteLinks } from '../routers/type';
import { useAuth } from '../hooks/useAuth';

export const NotFound: FC = () => {
    const navigate = useNavigate();
    const { primaryColor } = useAuth();

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-6 text-center">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[150px] opacity-10 animate-pulse"
                    style={{ backgroundColor: primaryColor }}
                />
                <div
                    className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full blur-[150px] opacity-10 animate-pulse"
                    style={{ backgroundColor: primaryColor }}
                />
            </div>

            <div className="relative z-10 max-w-2xl w-full">
                {/* 404 Illustration Area */}
                <div className="relative mb-12">
                    <div className="text-[180px] font-black text-gray-100/50 leading-none select-none">
                        404
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 animate-ping rounded-full bg-blue-100 opacity-20"></div>
                            <div className="relative bg-white/70 backdrop-blur-xl p-10 rounded-[45px] shadow-2xl border border-white/50 transform hover:rotate-3 transition-transform duration-500">
                                <div className="relative">
                                    <Utensils
                                        className="w-20 h-20 text-gray-800"
                                        strokeWidth={1}
                                    />
                                    <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-2.5 shadow-lg border-4 border-white">
                                        <Search className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-6 mb-12">
                    <h1 className="text-5xl font-black text-gray-900 tracking-tight">
                        Page Misplaced
                    </h1>
                    <div className="max-w-md mx-auto">
                        <p className="text-gray-500 text-xl leading-relaxed">
                            Oops! Our chef couldn't find the page you're looking for. It might have been moved or doesn't exist.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                    <Button
                        onClick={() => navigate(-1)}
                        variant="ghost"
                        className="w-full sm:w-auto px-10 py-7 rounded-2xl text-gray-600 hover:bg-gray-100/80 transition-all font-bold"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Go Back
                    </Button>
                    <Button
                        onClick={() => navigate(RouteLinks.TILL)}
                        className="w-full sm:w-auto px-10 py-7 rounded-2xl shadow-2xl shadow-blue-200 transition-all hover:-translate-y-1 hover:shadow-blue-300 font-bold"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <Home className="w-5 h-5 mr-2" />
                        Back to Kitchen
                    </Button>
                </div>

                {/* Brand Footnote */}
                <div className="mt-20 opacity-30">
                    <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-xs">
                        DineFlow Till
                    </p>
                </div>
            </div>
        </div>
    );
};

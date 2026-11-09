import { ImageIcon, Palette, Upload, X, Image as BannerIcon } from "lucide-react";
import { Button } from "../../components/Button";
import { Restaurant, RestaurantRequestResponse } from "../../features/stores/types";
import { FC, useRef } from "react";
import placeHolderImage from '../../assets/placeholder.png';
import { useAuth } from "../../hooks/useAuth";
import { fileToBase64 } from "../../utils";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../app/store";
import { uploadRestaurantBannerRequest, uploadRestaurantLogoRequest } from "../../features/stores/storesSlice";

interface AppearanceProps {
    restaurantState: RestaurantRequestResponse | null;
    restaurant: Restaurant | null;
    imageLoading?: boolean;
    handleRemoveLogo?: () => void;
    handleRemoveBanner?: () => void;
}

const Appearance: FC<AppearanceProps> = ({ restaurantState, restaurant, imageLoading, handleRemoveLogo, handleRemoveBanner }) => {
    const { user, primaryColor, updatePrimaryColor } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const dispatch = useDispatch<AppDispatch>();

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && user?.restaurant?.id) {
            const base64 = await fileToBase64(file);
            localStorage.setItem('lastUploadedLogo', base64);
            dispatch(uploadRestaurantLogoRequest({ restaurantId: user.restaurant.id, image: base64 }));
        }
    };

    const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && user?.restaurant?.id) {
            const base64 = await fileToBase64(file);
            dispatch(uploadRestaurantBannerRequest({ restaurantId: user.restaurant.id, image: base64 }));
        }
    };

    const triggerFileInput = () => fileInputRef.current?.click();
    const triggerBannerFileInput = () => bannerInputRef.current?.click();

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 md:p-8">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                    <div className="p-3 bg-pink-50/80 border border-pink-100/80 rounded-2xl text-pink-600 shrink-0">
                        <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Brand Identity</h2>
                        <p className="text-sm text-slate-500 font-medium">Manage your store logo and display banner</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Logo Section */}
                    <div className="flex flex-col md:flex-row items-center gap-5 p-5 bg-slate-50/60 rounded-2xl border border-slate-200/70">
                        <div className="relative group shrink-0">
                            <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-white bg-white shadow-xs flex items-center justify-center relative transition-transform duration-200 group-hover:scale-102">
                                {restaurantState?.logo || restaurant?.logo ? (
                                    <img
                                        src={restaurantState?.logo || restaurant?.logo || placeHolderImage}
                                        alt="Store logo"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-center p-2">
                                        <ImageIcon className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                                        <span className="text-xs font-medium text-slate-400">No Logo</span>
                                    </div>
                                )}

                                {imageLoading && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-xs z-20">
                                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>

                            {(restaurantState?.logo || restaurant?.logo) && (
                                <button
                                    onClick={handleRemoveLogo}
                                    className="absolute -top-2 -right-2 p-1.5 bg-rose-500 text-white rounded-lg shadow-sm hover:bg-rose-600 transition-all z-30 cursor-pointer"
                                    title="Remove Logo"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="flex-1 space-y-3 text-center md:text-left">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Store Logo</h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    Square ratio recommended (PNG, JPEG)
                                </p>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleLogoUpload}
                                accept="image/png,image/jpeg"
                                className="hidden"
                            />
                            <Button
                                onClick={triggerFileInput}
                                variant="primary"
                                disabled={imageLoading}
                                className="rounded-xl px-4 py-2 text-xs font-medium shadow-2xs"
                            >
                                <Upload className="w-3.5 h-3.5 mr-1.5" />
                                {restaurantState?.logo || restaurant?.logo ? 'Change Logo' : 'Upload Logo'}
                            </Button>
                        </div>
                    </div>

                    {/* Banner Section */}
                    <div className="flex flex-col gap-4 p-5 bg-slate-50/60 rounded-2xl border border-slate-200/70">
                        <div className="relative group w-full h-28 shrink-0">
                            <div className="w-full h-full rounded-xl overflow-hidden border-2 border-white bg-white shadow-xs flex items-center justify-center relative transition-all duration-200">
                                {restaurantState?.banner || restaurant?.banner ? (
                                    <img
                                        src={restaurantState?.banner || restaurant?.banner || placeHolderImage}
                                        alt="Store banner"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-center p-2">
                                        <BannerIcon className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                                        <span className="text-xs font-medium text-slate-400">No Banner</span>
                                    </div>
                                )}

                                {imageLoading && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-xs z-20">
                                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>

                            {(restaurantState?.banner || restaurant?.banner) && (
                                <button
                                    onClick={handleRemoveBanner}
                                    className="absolute -top-2 -right-2 p-1.5 bg-rose-500 text-white rounded-lg shadow-sm hover:bg-rose-600 transition-all z-30 cursor-pointer"
                                    title="Remove Banner"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Store Banner</h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    Wide ratio recommended (16:9)
                                </p>
                            </div>
                            <input
                                type="file"
                                ref={bannerInputRef}
                                onChange={handleBannerUpload}
                                accept="image/png,image/jpeg"
                                className="hidden"
                            />
                            <Button
                                onClick={triggerBannerFileInput}
                                variant="primary"
                                disabled={imageLoading}
                                className="rounded-xl px-4 py-2 text-xs font-medium shadow-2xs"
                            >
                                <Upload className="w-3.5 h-3.5 mr-1.5" />
                                {restaurantState?.banner || restaurant?.banner ? 'Change Banner' : 'Upload Banner'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Theme Customization Card */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 md:p-8">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                    <div className="p-3 bg-purple-50/80 border border-purple-100/80 rounded-2xl text-purple-600 shrink-0">
                        <Palette className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Theme Customization</h2>
                        <p className="text-sm text-slate-500 font-medium">Design how your brand looks across the till and back-office</p>
                    </div>
                </div>

                <div className="p-5 bg-slate-50/60 rounded-2xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-white shadow-xs cursor-pointer ring-1 ring-slate-200">
                            <input
                                type="color"
                                value={primaryColor}
                                onChange={(e) => updatePrimaryColor(e.target.value)}
                                className="absolute inset-0 w-[200%] h-[200%] -top-[50%] -left-[50%] cursor-pointer p-0 border-0"
                            />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Brand Primary Color</h3>
                            <p className="text-xs font-mono font-medium text-slate-500 mt-0.5">{primaryColor.toUpperCase()}</p>
                        </div>
                    </div>
                    <span className="text-xs font-medium text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200/60 self-start sm:self-auto">
                        Main theme highlight
                    </span>
                </div>
            </div>

        </div>
    );
};

export default Appearance;

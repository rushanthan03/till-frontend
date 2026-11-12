import { Save, Palette, Clock, Store, Receipt } from 'lucide-react';
import { useLayoutEffect, useState } from 'react';
import { Button } from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { fetchRestaurantsByIdRequest, resetUploadedUrls, updateRestaurantsRequest } from '../features/stores/storesSlice';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../app/store';
import { RestaurantRequestResponse } from '../features/stores/types';
import { ApprovalPinCard } from '../components/ApprovalPinCard';
import Appearance from '../sections/Settings/Appearance';
import { SettingsSkeleton } from '../components/CustomSkeleton';
import GenaralTab from '../sections/Settings/GenaralTab';
import OpenHoursTab from '../sections/Settings/OpenHoursTab';
import ReceiptsTab from '../sections/Settings/ReceiptsTab';

type TabId = 'general' | 'hours' | 'appearance' | 'receipts';

const TABS: { id: TabId; label: string; icon: typeof Store }[] = [
  { id: 'general', label: 'Store details', icon: Store },
  { id: 'hours', label: 'Opening hours', icon: Clock },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'receipts', label: 'Receipts', icon: Receipt },
];

const DEFAULT_HOURS = {
  monday: { open: '08:00', close: '22:00', closed: false },
  tuesday: { open: '08:00', close: '22:00', closed: false },
  wednesday: { open: '08:00', close: '22:00', closed: false },
  thursday: { open: '08:00', close: '22:00', closed: false },
  friday: { open: '08:00', close: '22:00', closed: false },
  saturday: { open: '08:00', close: '22:00', closed: false },
  sunday: { open: '10:00', close: '16:00', closed: false },
};

export const Settings = () => {
  const { user, primaryColor, updateRestaurantLogo, updateRestaurantName } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  // `restaurant` in the store is the store (shop) record
  const { restaurant, imageLoading, loading, uploadedLogoUrl, uploadedBannerUrl } = useSelector((state: RootState) => state.restaurant);

  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [storeState, setStoreState] = useState<RestaurantRequestResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useLayoutEffect(() => {
    dispatch(fetchRestaurantsByIdRequest({ tenantId: user?.tenant?.id || '', restaurantId: user?.restaurant?.id || '' }));
  }, [dispatch, user?.tenant?.id, user?.restaurant?.id]);

  useLayoutEffect(() => {
    if (!restaurant) return;
    setStoreState({
      name: restaurant.name,
      contactEmail: restaurant.contactEmail,
      contactPhoneNumber: restaurant.contactPhoneNumber,
      openTime: restaurant.openTime,
      closeTime: restaurant.closeTime,
      logo: restaurant.logo,
      banner: restaurant.banner,
      address: restaurant.address,
      openHours: restaurant.openHours || DEFAULT_HOURS,
    });
  }, [restaurant]);

  useLayoutEffect(() => {
    if (uploadedLogoUrl && storeState && uploadedLogoUrl !== storeState.logo) {
      setStoreState(prev => (prev ? { ...prev, logo: uploadedLogoUrl } : null));
    }
    if (uploadedBannerUrl && storeState && uploadedBannerUrl !== storeState.banner) {
      setStoreState(prev => (prev ? { ...prev, banner: uploadedBannerUrl } : null));
    }
  }, [uploadedLogoUrl, uploadedBannerUrl]);

  useLayoutEffect(() => () => { dispatch(resetUploadedUrls()); }, []);

  const handleSave = () => {
    if (isSubmitting || !storeState) return;
    setIsSubmitting(true);
    dispatch(updateRestaurantsRequest({
      tenantId: user?.tenant?.id || '',
      restaurantID: user?.restaurant?.id || '',
      name: storeState.name ?? 'My store',
      contactEmail: storeState.contactEmail ?? '',
      contactPhoneNumber: storeState.contactPhoneNumber ?? '',
      openTime: storeState.openTime,
      closeTime: storeState.closeTime,
      logo: storeState.logo ?? '',
      banner: storeState.banner ?? '',
      address: storeState.address,
      primaryColor: primaryColor ?? '#2563EB',
    }));
    updateRestaurantLogo(storeState.logo ?? '');
    updateRestaurantName(storeState.name ?? 'My store');
    dispatch(resetUploadedUrls());
    setTimeout(() => setIsSubmitting(false), 800);
  };

  // Managers only get their own approval PIN here; store details are for admins.
  if (user?.role === 'manager') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <ApprovalPinCard />
      </div>
    );
  }

  if (loading) return <SettingsSkeleton />;

  return (
    <div className="space-y-6">
      <div className="sticky top-16 z-30 backdrop-blur-md border-b border-gray-200 mb-6 mx-1 px-6 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-8">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActive ? 'text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
                style={isActive ? { borderColor: primaryColor, color: primaryColor } : undefined}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-1 space-y-6">
        {activeTab === 'general' && ['manager', 'tenant_admin', 'super_admin'].includes(String(user?.role)) && <ApprovalPinCard />}
        {activeTab === 'general' && (
          <GenaralTab restaurantState={storeState} restaurant={restaurant} setRestaurantState={setStoreState} />
        )}
        {activeTab === 'hours' && (
          <OpenHoursTab restaurantState={storeState} setRestaurantState={setStoreState} primaryColor={primaryColor} />
        )}
        {activeTab === 'appearance' && (
          <Appearance
            restaurantState={storeState}
            restaurant={restaurant}
            imageLoading={imageLoading}
            handleRemoveLogo={() => setStoreState(prev => (prev ? { ...prev, logo: '' } : null))}
            handleRemoveBanner={() => setStoreState(prev => (prev ? { ...prev, banner: '' } : null))}
          />
        )}
        {activeTab === 'receipts' && <ReceiptsTab primaryColor={primaryColor ?? '#2563EB'} />}
      </div>

      {activeTab !== 'receipts' && <div className="sticky bottom-6 flex items-center justify-end gap-3 z-30 px-6 pointer-events-none">
        <Button
          onClick={handleSave}
          disabled={!restaurant || !storeState || isSubmitting}
          className="shadow-lg rounded-2xl py-3 px-8 font-bold pointer-events-auto disabled:opacity-50"
        >
          <Save className="w-5 h-5 mr-2" />
          {isSubmitting ? 'Saving…' : 'Save settings'}
        </Button>
      </div>}
    </div>
  );
};

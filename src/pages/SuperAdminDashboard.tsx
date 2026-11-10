import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Building2, Store, CheckCircle2, PauseCircle } from 'lucide-react';
import { AppDispatch, RootState } from '../app/store';
import { fetchAllTenantRequest } from '../features/platformTenants/tenantsSlice';
import { fetchAllRestaurantRequest } from '../features/platformStores/storesSlice';
import { RouteLinks } from '../routers/type';

const Card = ({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: number; tone: string }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-3xl font-black text-gray-900 mt-1">{value}</p>
    </div>
    <div className={`p-3 rounded-xl ${tone}`}><Icon className="w-7 h-7" /></div>
  </div>
);

export const SuperAdminDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const tenants = useSelector((s: RootState) => s.platformTenants);
  const stores = useSelector((s: RootState) => s.platformRestaurant);

  useEffect(() => {
    dispatch(fetchAllTenantRequest({ page: '1', limit: '100' } as any));
    dispatch(fetchAllRestaurantRequest({ page: '1', limit: '100' } as any));
  }, [dispatch]);

  const activeTenants = tenants.data.filter((t: any) => t.status === 'active').length;
  const activeStores = stores.data.filter((r: any) => r.isActive).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Platform overview</h1>
        <p className="text-sm text-gray-500">Supermarket tenants and their stores across Auvren Till</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card icon={Building2} label="Tenants" value={tenants.total || tenants.data.length} tone="bg-blue-50 text-blue-600" />
        <Card icon={CheckCircle2} label="Active tenants" value={activeTenants} tone="bg-green-50 text-green-600" />
        <Card icon={Store} label="Stores" value={stores.total || stores.data.length} tone="bg-purple-50 text-purple-600" />
        <Card icon={PauseCircle} label="Inactive stores" value={stores.data.length - activeStores} tone="bg-orange-50 text-orange-600" />
      </div>
      <button onClick={() => navigate(RouteLinks.TENANT)} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold">
        Manage tenants & stores
      </button>
    </div>
  );
};

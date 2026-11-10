import auvrenMark from '../assets/auvren-mark.png';
import React, { type FC, useLayoutEffect, useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Building2,
  Package,
  ScanBarcode,
  History,
  Clock,
  FileText,
  Boxes,
  BadgePercent,
  UsersRound,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../utils/constants';
import { NavLink, Outlet } from 'react-router-dom';
import { RouteLinks } from '../routers/type';
import type { SideMenuListType } from '../models/BaseType';
import { hexToRgba } from '../utils';
import { fetchRestaurantsByIdRequest, fetchAllRestaurantsByTenantRequest } from '../features/stores/storesSlice';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../app/store';

const menuItems: SideMenuListType[] = [
  { id: RouteLinks.TILL, label: 'Till', icon: ScanBarcode },
  { id: RouteLinks.SALES, label: 'Sales history', icon: History },
  { id: RouteLinks.SHIFTS, label: 'Till sessions', icon: Clock },
  { id: RouteLinks.DAY_REPORT, label: 'Day end report', icon: FileText },
  { id: RouteLinks.PRODUCTS, label: 'Products', icon: Package },
  { id: RouteLinks.STOCK, label: 'Stock', icon: Boxes },
  { id: RouteLinks.PROMOTIONS, label: 'Promotions', icon: BadgePercent },
  { id: RouteLinks.CUSTOMERS, label: 'Customers', icon: UsersRound },
  { id: RouteLinks.USERS, label: 'Staff', icon: Users },
  { id: RouteLinks.SETTINGS, label: 'Settings', icon: Settings },
];

const platformMenuItems: SideMenuListType[] = [
  { id: RouteLinks.PLATFORM_DASHBOARD, label: 'Platform Overview', icon: LayoutDashboard },
  { id: RouteLinks.TENANT, label: 'Tenants', icon: Building2 },
];

// ─── Sidebar list ─────────────────────────────────────────────────────────────

const SidebarNavList: React.FC<{
  items: SideMenuListType[];
  primaryColor: string;
  onItemClick: () => void;
}> = ({ items, primaryColor, onItemClick }) => (
  <>
    {items.map((item: SideMenuListType) => {
      const Icon = item.icon;
      return (
        <NavLink
          key={item.id}
          to={item.id}
          replace
          onClick={onItemClick}
          style={({ isActive }) => ({
            backgroundColor: isActive ? hexToRgba(primaryColor, 0.1) : 'transparent',
            borderLeft: isActive ? `3px solid ${primaryColor}` : '3px solid transparent',
          })}
          className={({ isActive }) => `
            w-full flex items-center gap-3 px-3 py-2.5 rounded-r-lg text-sm font-medium
            transition-all duration-200 group relative
            ${isActive ? 'shadow-sm' : 'hover:bg-gray-100/80'}
          `}
        >
          {({ isActive }) => (
            <>
              <div
                className={`p-1.5 rounded-lg transition-all duration-200 ${
                  isActive ? 'shadow-sm' : 'group-hover:bg-white group-hover:shadow-sm'
                }`}
                style={{ backgroundColor: isActive ? hexToRgba(primaryColor, 0.15) : 'transparent' }}
              >
                <Icon className="w-4 h-4" style={{ color: isActive ? primaryColor : '#6b7280' }} />
              </div>
              <span style={{ color: isActive ? primaryColor : '#374151' }} className="font-semibold flex-1">
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      );
    })}
  </>
);

export const Layout: FC = () => {
  const { user, logout, primaryColor } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const { restaurant: storeData, restaurants: stores } = useSelector((state: RootState) => state.restaurant);

  const currentStore = storeData || user?.restaurant;

  const normRole = (user?.role || '').toLowerCase().trim();
  const isSuperAdmin = normRole === UserRole.SUPER_ADMIN;
  const isTenantAdmin = normRole === UserRole.TENANT_ADMIN || normRole === 'owner';
  const isManager = normRole === UserRole.MANAGER;
  const isCashier = normRole === UserRole.CASHIER;
  const isMultiStoreAdmin = isSuperAdmin || isTenantAdmin;

  // Store currently selected by a multi-store admin (persisted so the till and reports follow it)
  const [selectedStoreId, setSelectedStoreId] = useState<string>(() =>
    localStorage.getItem('selectedRestaurantId') || user?.restaurantId || user?.restaurant?.id || ''
  );

  useLayoutEffect(() => {
    if (isMultiStoreAdmin && user?.tenant?.id) {
      dispatch(fetchAllRestaurantsByTenantRequest({ tenantId: user.tenant.id }));
    }
    if (user?.tenant?.id && (user?.restaurant?.id || user?.restaurantId)) {
      dispatch(fetchRestaurantsByIdRequest({
        tenantId: user.tenant.id,
        restaurantId: selectedStoreId || user.restaurant?.id || user.restaurantId || ''
      }));
    }
  }, [dispatch, user, isMultiStoreAdmin]);

  const handleStoreChange = (newStoreId: string) => {
    setSelectedStoreId(newStoreId);
    localStorage.setItem('selectedRestaurantId', newStoreId);
    if (user?.tenant?.id) {
      dispatch(fetchRestaurantsByIdRequest({ tenantId: user.tenant.id, restaurantId: newStoreId }));
    }
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const allowed = useMemo(() => {
    if (isCashier) return [RouteLinks.TILL];
    if (isTenantAdmin || isSuperAdmin) return menuItems.map(item => item.id);
    if (isManager) {
      return menuItems.map(item => item.id).filter(id => id !== RouteLinks.USERS);
    }
    return [RouteLinks.TILL];
  }, [isTenantAdmin, isSuperAdmin, isManager, isCashier]);

  // Settings is rendered in the pinned bottom section
  const visibleItems = menuItems.filter(item => allowed.includes(item.id) && item.id !== RouteLinks.SETTINGS);

  const operationItems = visibleItems.filter(item =>
    [RouteLinks.TILL, RouteLinks.SALES, RouteLinks.SHIFTS, RouteLinks.DAY_REPORT].includes(item.id as RouteLinks));
  const managementItems = visibleItems.filter(item =>
    [RouteLinks.PRODUCTS, RouteLinks.STOCK, RouteLinks.PROMOTIONS, RouteLinks.CUSTOMERS, RouteLinks.USERS].includes(item.id as RouteLinks));

  const handleLogout = () => {
    logout();
  };

  return (
      <div className="flex flex-1 flex-col min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="lg:hidden text-gray-600 hover:text-gray-900"
                >
                  {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              <div className="flex items-center gap-3">
                {user?.restaurant?.logo ? (
                  <img
                    src={user?.restaurant?.logo}
                    alt={user?.restaurant?.name}
                    className="w-10 h-10 rounded-xl object-cover shadow-2xs border border-slate-100"
                  />
                ) : (
                  <img src={auvrenMark} alt="Auvren" className="w-10 h-10 rounded-xl object-cover shadow-2xs border border-slate-100" />
                )}
                <div>
                  {isMultiStoreAdmin && stores && stores.length > 1 ? (
                    <div className="relative inline-flex items-center">
                      <select
                        value={selectedStoreId || currentStore?.id || ''}
                        onChange={(e) => handleStoreChange(e.target.value)}
                        className="text-sm font-black text-gray-900 bg-transparent pr-6 py-0.5 border-b border-dashed border-gray-300 hover:border-gray-500 focus:outline-none cursor-pointer appearance-none leading-tight"
                      >
                        {stores.map((outlet: any) => (
                          <option key={outlet.id || outlet.restaurantID} value={outlet.id || outlet.restaurantID}>
                            {outlet.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-0 pointer-events-none" />
                    </div>
                  ) : (
                    <p className="text-sm font-black text-gray-900 leading-tight">{currentStore?.name || user?.restaurant?.name || 'Store'}</p>
                  )}
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {isMultiStoreAdmin ? 'Store admin' : 'Auvren Till'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                {user?.avatar && (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        <aside
          className={`
            fixed top-16 bottom-0 left-0 z-30 w-64 bg-linear-to-b from-white to-gray-50 border-r border-gray-200 shadow-sm
            transform transition-transform duration-300 ease-in-out flex flex-col
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <nav className="p-3 space-y-4 h-full overflow-y-auto flex flex-col justify-between">
            {/* Primary Navigation Section */}
            <div className='flex-1 flex flex-col space-y-4'>
              {/* Platform Section (super admin only) */}
              {isSuperAdmin && (
                <div>
                  <h3 className="px-3 mb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Platform</h3>
                  <SidebarNavList items={platformMenuItems} primaryColor={primaryColor} onItemClick={() => setIsSidebarOpen(false)} />
                </div>
              )}

              {/* Operations Section */}
              {operationItems.length > 0 && (
                <div>
                  <h3 className="px-3 mb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Operations</h3>
                  <SidebarNavList items={operationItems} primaryColor={primaryColor} onItemClick={() => setIsSidebarOpen(false)} />
                </div>
              )}

              {/* Management Section */}
              {managementItems.length > 0 && (
                <div>
                  <h3 className="px-3 mb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Management</h3>
                  <SidebarNavList items={managementItems} primaryColor={primaryColor} onItemClick={() => setIsSidebarOpen(false)} />
                </div>
              )}

            </div>

            {/* Settings - Bottom Section */}
            {(isTenantAdmin || isSuperAdmin) && (
              <div className="pt-2 border-t border-gray-200 shrink-0">
                <NavLink
                  to={RouteLinks.SETTINGS}
                  replace
                  onClick={() => setIsSidebarOpen(false)}
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? hexToRgba(primaryColor, 0.1) : 'transparent',
                    borderLeft: isActive ? `3px solid ${primaryColor}` : '3px solid transparent',
                  })}
                  className={({ isActive }) => `
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-r-lg text-sm font-medium
                    transition-all duration-200 group relative
                    ${isActive ? 'shadow-sm' : 'hover:bg-gray-100/80'}
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <div className={`p-1.5 rounded-lg transition-all duration-200 ${isActive
                        ? 'shadow-sm'
                        : 'group-hover:bg-white group-hover:shadow-sm'
                        }`} style={{ backgroundColor: isActive ? hexToRgba(primaryColor, 0.15) : 'transparent' }}>
                        <Settings className="w-4 h-4" style={{ color: isActive ? primaryColor : '#6b7280' }} />
                      </div>
                      <span style={{ color: isActive ? primaryColor : '#374151' }} className="font-semibold">
                        Settings
                      </span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }}></div>
                      )}
                    </>
                  )}
                </NavLink>
              </div>
            )}
          </nav>
        </aside>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black opacity-50 z-20 lg:hidden mt-16"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}
      </div>

      <main className="pl-0 lg:pl-64">
        <div className='flex flex-1 flex-col p-4'>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

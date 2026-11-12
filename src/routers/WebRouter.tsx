import type { FC, ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { RouteLinks } from "./type";
import { Login } from "../pages/Login";
import { Layout } from "../components/Layout";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import { UserRole } from "../utils/constants";
import { Settings, NotFound } from "../pages";
import { Users } from "../pages/Users";
import Unauthorized from "../pages/Unauthorized";
import { SuperAdminDashboard } from "../pages/SuperAdminDashboard";
import { Tenants } from "../pages/Tenants";
import TenantDetail from "../pages/TenantDetail";
import { Products } from "../pages/Products";
import { Till } from "../pages/Till";
import { SalesHistory } from "../pages/SalesHistory";
import { ShiftHistory } from "../pages/ShiftHistory";
import { DayReportPage } from "../pages/DayReport";
import { Stock } from "../pages/Stock";
import { SuppliersPage } from "../pages/Suppliers";
import { PurchaseOrdersPage } from "../pages/PurchaseOrders";
import { DeviceSettingsPage } from "../pages/DeviceSettings";
import { AttendancePage } from "../pages/Attendance";
import { ReportsPage } from "../pages/Reports";
import { PromotionsPage } from "../pages/Promotions";
import { CustomersPage } from "../pages/Customers";
import { AuditLogPage } from "../pages/AuditLog";
import { PermissionsPage } from "../pages/Permissions";
import type { PermissionKey } from "../features/permissions/permissions";

const { SUPER_ADMIN, TENANT_ADMIN, MANAGER, CASHIER } = UserRole;

const guarded = (roles: UserRole[], page: ReactNode, permissions?: PermissionKey[]) => (
    <ProtectedRoute allowedRoles={roles} permissions={permissions}>{page}</ProtectedRoute>
);

const WebRouter: FC = () => {
    return (
        <Routes>
            <Route
                path={RouteLinks.LOGIN}
                element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                }
            />

            <Route path="/" element={<Navigate to={RouteLinks.TILL} replace />} />

            <Route element={<Layout />}>
                {/* Platform (super admin) */}
                <Route path={RouteLinks.PLATFORM_DASHBOARD} element={guarded([SUPER_ADMIN], <SuperAdminDashboard />)} />
                <Route path={RouteLinks.TENANT} element={guarded([SUPER_ADMIN], <Tenants />)} />
                <Route path={`${RouteLinks.TENANT}/:tenantId`} element={guarded([SUPER_ADMIN], <TenantDetail />)} />

                {/* Store operations */}
                <Route path={RouteLinks.TILL} element={guarded([TENANT_ADMIN, SUPER_ADMIN, MANAGER, CASHIER], <Till />)} />
                <Route path={RouteLinks.SALES} element={guarded([TENANT_ADMIN, SUPER_ADMIN, MANAGER], <SalesHistory />, ['reports'])} />
                <Route path={RouteLinks.SHIFTS} element={guarded([TENANT_ADMIN, SUPER_ADMIN, MANAGER], <ShiftHistory />, ['reports'])} />
                <Route path={RouteLinks.DAY_REPORT} element={guarded([TENANT_ADMIN, SUPER_ADMIN, MANAGER], <DayReportPage />, ['reports'])} />
                <Route path={RouteLinks.REPORTS} element={guarded([TENANT_ADMIN, SUPER_ADMIN, MANAGER], <ReportsPage />, ['reports'])} />
                <Route path={RouteLinks.ATTENDANCE} element={guarded([TENANT_ADMIN, SUPER_ADMIN, MANAGER], <AttendancePage />, ['staff'])} />
                <Route path={RouteLinks.DEVICE} element={guarded([TENANT_ADMIN, SUPER_ADMIN, MANAGER], <DeviceSettingsPage />)} />
                <Route path={RouteLinks.STOCK} element={guarded([TENANT_ADMIN, SUPER_ADMIN, MANAGER], <Stock />, ['stock'])} />
                <Route path={RouteLinks.PURCHASE_ORDERS} element={guarded([TENANT_ADMIN, SUPER_ADMIN, MANAGER], <PurchaseOrdersPage />, ['purchasing'])} />
                <Route path={RouteLinks.SUPPLIERS} element={guarded([TENANT_ADMIN, SUPER_ADMIN, MANAGER], <SuppliersPage />, ['purchasing'])} />
                <Route path={RouteLinks.PROMOTIONS} element={guarded([TENANT_ADMIN, SUPER_ADMIN, MANAGER], <PromotionsPage />, ['promotions'])} />
                <Route path={RouteLinks.CUSTOMERS} element={guarded([TENANT_ADMIN, SUPER_ADMIN, MANAGER], <CustomersPage />, ['customers'])} />
                <Route path={RouteLinks.PRODUCTS} element={guarded([TENANT_ADMIN, SUPER_ADMIN, MANAGER], <Products />, ['products'])} />

                {/* Administration */}
                <Route path={RouteLinks.USERS} element={guarded([TENANT_ADMIN, SUPER_ADMIN], <Users />)} />
                <Route path={RouteLinks.PERMISSIONS} element={guarded([TENANT_ADMIN, SUPER_ADMIN], <PermissionsPage />)} />
                <Route path={RouteLinks.AUDIT_LOG} element={guarded([TENANT_ADMIN, SUPER_ADMIN, MANAGER], <AuditLogPage />, ['audit'])} />
                <Route path={RouteLinks.SETTINGS} element={guarded([TENANT_ADMIN, SUPER_ADMIN, MANAGER], <Settings />)} />
            </Route>

            <Route path={RouteLinks.UNAUTHORIZED} element={<Unauthorized />} />

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default WebRouter;

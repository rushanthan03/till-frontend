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

const { SUPER_ADMIN, TENANT_ADMIN, MANAGER, CASHIER } = UserRole;

const guarded = (roles: UserRole[], page: ReactNode) => (
    <ProtectedRoute allowedRoles={roles}>{page}</ProtectedRoute>
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
                <Route path={RouteLinks.SALES} element={guarded([TENANT_ADMIN, SUPER_ADMIN, MANAGER], <SalesHistory />)} />
                <Route path={RouteLinks.SHIFTS} element={guarded([TENANT_ADMIN, SUPER_ADMIN, MANAGER], <ShiftHistory />)} />
                <Route path={RouteLinks.DAY_REPORT} element={guarded([TENANT_ADMIN, SUPER_ADMIN, MANAGER], <DayReportPage />)} />
                <Route path={RouteLinks.STOCK} element={guarded([TENANT_ADMIN, SUPER_ADMIN, MANAGER], <Stock />)} />
                <Route path={RouteLinks.PRODUCTS} element={guarded([TENANT_ADMIN, SUPER_ADMIN, MANAGER], <Products />)} />

                {/* Administration */}
                <Route path={RouteLinks.USERS} element={guarded([TENANT_ADMIN, SUPER_ADMIN], <Users />)} />
                <Route path={RouteLinks.SETTINGS} element={guarded([TENANT_ADMIN, SUPER_ADMIN, MANAGER], <Settings />)} />
            </Route>

            <Route path={RouteLinks.UNAUTHORIZED} element={<Unauthorized />} />

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default WebRouter;

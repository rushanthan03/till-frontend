import type { FC } from "react";
import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";
import { RouteLinks } from "./type";
import { UserRole } from "../utils/constants";

interface PublicRouteProps {
    children: React.ReactNode;
}

const defaultRoutesByRole: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: RouteLinks.PLATFORM_DASHBOARD,
    [UserRole.TENANT_ADMIN]: RouteLinks.TILL,
    [UserRole.MANAGER]: RouteLinks.TILL,
    [UserRole.CASHIER]: RouteLinks.TILL,
};

const PublicRoute: FC<PublicRouteProps> = ({ children }) => {
    const { user } = useAuth();

    if (user) {
        return <Navigate to={defaultRoutesByRole[user.role as UserRole]} replace />
    }
    return <>{children}</>
}

export default PublicRoute;
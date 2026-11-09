import type { FC } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { RouteLinks } from "./type";

interface ProtectedRouteProps {
    allowedRoles?: string[];
    requiredPermissions?: string[];
    children: React.ReactNode;
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({ allowedRoles, requiredPermissions, children }) => {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to={RouteLinks.LOGIN} replace />
    }

    if (allowedRoles) {
        const userRole = (user.role || '').toLowerCase().trim();
        const hasRole = allowedRoles.some(r => r.toLowerCase().trim() === userRole);
        if (!hasRole) {
            return <Navigate to={RouteLinks.UNAUTHORIZED} replace />;
        }
    }

    if (requiredPermissions && !requiredPermissions.every(p => user.permissions && user.permissions.includes(p))) {
        return <Navigate to={RouteLinks.UNAUTHORIZED} replace />;
    }

    return <>{children}</>
}

export default ProtectedRoute;
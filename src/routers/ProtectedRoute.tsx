import type { FC } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../hooks/usePermissions";
import type { PermissionKey } from "../features/permissions/permissions";
import { RouteLinks } from "./type";

interface ProtectedRouteProps {
    allowedRoles?: string[];
    /** The company's permissions: at least one of these must not be "not allowed" (admins always pass). */
    permissions?: PermissionKey[];
    children: React.ReactNode;
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({ allowedRoles, permissions, children }) => {
    const { user } = useAuth();
    const { can, loaded } = usePermissions();

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

    if (permissions?.length && !permissions.some(can)) {
        // Until the server answers we only have cached or default permissions: wait rather than turn someone away.
        if (!loaded) return <div className="p-10 text-center text-gray-500" role="status">Loading…</div>;
        return <Navigate to={RouteLinks.UNAUTHORIZED} replace />;
    }

    return <>{children}</>
}

export default ProtectedRoute;

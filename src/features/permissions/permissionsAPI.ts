import axiosClient from "../../api/axiosClient";
import type { EditableRole, Level, Levels, PermissionKey, PermissionSettings } from "./permissions";

const unwrap = <T>(request: Promise<unknown>) => request as Promise<T>;

export const PermissionsAPI = {
    mine: () => unwrap<{ role: string; levels: Levels }>(axiosClient.get('/api/permissions/me')),
    settings: () => unwrap<PermissionSettings>(axiosClient.get('/api/permissions')),
    update: (roles: Partial<Record<EditableRole, Partial<Record<PermissionKey, Level>>>>) =>
        unwrap<PermissionSettings>(axiosClient.put('/api/permissions', { roles })),
};

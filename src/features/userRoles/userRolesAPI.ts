import axiosClient from "../../api/axiosClient";
import { AllUserRoleResponse, CreateUserRequest, FetchAllUserRoleResponse, UserRoleAllRequest, UserRoleResponse } from "./types";

const UserRoleAPI = {
    fetchAllUserRoles: (args: UserRoleAllRequest) => axiosClient.get<FetchAllUserRoleResponse>('/api/users', { params: args }),
    fetchAllUsersByTenant: (args: UserRoleAllRequest) => axiosClient.get<FetchAllUserRoleResponse>(`/api/tenants/${args.tenantId}/users`, { params: args }),
    createUserRole: (args: CreateUserRequest) => {
        const { tenantId, phoneNumber, ...rest } = args;
        const newArgs = { phone: phoneNumber, ...rest }
        return axiosClient.post<UserRoleResponse>(`/api/tenants/${tenantId}/users`, newArgs)
    },
    updateUserRole: (args: CreateUserRequest) => {
        const { tenantId, userId, password, ...rest } = args;
        const payload = password ? { ...rest, password } : rest;
        return axiosClient.patch<AllUserRoleResponse>(`/api/tenants/${tenantId}/users/${userId}`, payload);
    },
    resetUserPassword: (tenantId: string, userId: string, newPassword?: string) => {
        return axiosClient.post<any>(`/api/tenants/${tenantId}/users/${userId}/reset-password`, newPassword ? { newPassword, password: newPassword, temporaryPassword: newPassword } : {});
    },
    deleteUser: (tenantId: string, userId: string) => {
        return axiosClient.delete<AllUserRoleResponse>(`/api/tenants/${tenantId}/users/${userId}`);
    }
}

export default UserRoleAPI;
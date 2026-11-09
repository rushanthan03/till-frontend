import axiosClient from "../../api/axiosClient";
import { AllUserRoleResponse, CreateUserRequest, FetchAllUserRoleResponse, UserRoleAllRequest, UserRoleResponse } from "./types";

const UserRoleAPI = {
    fetchAllUserRoles: (args: UserRoleAllRequest) => axiosClient.get<FetchAllUserRoleResponse>('/api/users', { params: args }),
    fetchAllUsersByTenant: (args: UserRoleAllRequest) => {
        const { tenantId, ...params } = args;
        return axiosClient.get<FetchAllUserRoleResponse>(`/api/tenants/${tenantId}/users`, { params });
    },
    createUserRole: (args: CreateUserRequest) => {
        const { tenantId, phoneNumber, ...rest } = args;
        const newArgs = { phone: phoneNumber, ...rest }
        return axiosClient.post<UserRoleResponse>(`/api/tenants/${tenantId}/users`, newArgs)
    },
    updateUserRole: (args: CreateUserRequest) => {
        const { tenantId, userId, password, ...rest } = args;
        return axiosClient.patch<AllUserRoleResponse>(`/api/tenants/${tenantId}/users/${userId}`, rest)
    },
    resetPassword: (tenantId: string, userId: string) => {
        return axiosClient.post(`/api/tenants/${tenantId}/users/${userId}/reset-password`)
    }
}

export default UserRoleAPI;
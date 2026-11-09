import axiosClient from "../../api/axiosClient";
import { CreateTenantRequest, Tenant, TenantsAllRequest, TenantsResponse } from "./types";

const TenantsAPI = {
    fetchAllTenants: (args: TenantsAllRequest) => axiosClient.get<TenantsResponse>('/api/tenants', { params: args }),
    createTenant: (args: CreateTenantRequest) => axiosClient.post('/api/tenants', args),
    updateTenant: (args: CreateTenantRequest) => {
        const { id, ...rest } = args
        return axiosClient.patch<Tenant>(`/api/tenants/${id}`, rest)
    },
    deleteTenant: (args: string) => axiosClient.delete(`/api/tenants/${args}`),
    fetchTenantMinimalList: (tenantName?: string) => axiosClient.get<Tenant[]>(`/api/tenants/search`, { params: { q: tenantName } }),
}

export default TenantsAPI;
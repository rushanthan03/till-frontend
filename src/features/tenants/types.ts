import { FetchAllRequestType, InitialCommonType } from "../../models/BaseType";

export interface TenantsAllRequest extends FetchAllRequestType {
    search?: string;
    tenantId?: string;
    sortBy?: string;
    sortOrder?: string
}

export interface TenantsResponse {
    data: Tenant[];
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface TenantResponseLight {
    id?: string;
    name?: string;
}

export interface CreateTenantRequest {
    id?: string;
    name: string;
    type: string
    contactEmail: string;
    contactPhoneNumber: string;
    description: string;
    status: string;
}

export interface InitialTenantsType extends InitialCommonType {
    isCreateTenant: boolean;
    isDeleteTenant: boolean;
    tenants: Tenant[];
}

export interface Tenant extends TenantResponseLight{
    subdomain?: string;
    type?: string;
    status?: string;
    subscriptionPlan?: string | null
    contactEmail?: string;
    contactPhoneNumber?: string;
    logo?: string | null
    description?: string;
    settings?: string | null
    billingInfo?: string | null
    subscriptionExpiresAt?: string | null
    createdAt?: string
    updatedAt?: string
}
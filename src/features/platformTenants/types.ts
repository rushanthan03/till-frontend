import { FetchAllRequestType, InitialCommonType } from "../../models/BaseType";
import { Address } from "../platformStores/types";

export interface TenantsAllRequest extends FetchAllRequestType {
    search?: string;
    tenantId?: string;
    sortBy?: string;
    sortOrder?: string;
    status?: string;
    city?: string;
    district?: string;
}

export interface TenantsResponse {
    data: Tenant[];
    total: number
    page: string
    limit: string
    totalPages: number
}

export interface CreateTenantRequest {
    id?: string;
    name: string;
    type: string
    address?: Address;
    contactEmail: string;
    contactPhoneNumber: string;
    description: string;
    status: string;
    logo?: string | null;
}

export interface InitialTenantsType extends InitialCommonType, TenantsResponse {
    isCreateTenant: boolean;
    isDeleteTenant: boolean;
    tenantMinimalList: TenantMinimalList[];
}

export interface Tenant {
    id: string;
    name: string;
    subdomain: string;
    type: string;
    status: string;
    subscriptionPlan: string | null
    contactEmail: string;
    contactPhoneNumber: string;
    logo: string | null
    description: string;
    settings: string | null
    billingInfo: string | null
    subscriptionExpiresAt: string | null
    createdAt: string
    updatedAt: string
    address?: Address;
}

export interface TenantMinimalList {
    id: string;
    tenantName: string;
}
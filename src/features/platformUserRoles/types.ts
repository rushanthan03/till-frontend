import { FetchAllRequestType, InitialCommonType } from "../../models/BaseType";
import { Restaurant } from "../platformStores/types";
import { Tenant } from "../platformTenants/types";

export interface UserRoleAllRequest extends FetchAllRequestType {
    search?: string;
    tenantId?: string;
    restaurantId?: string;
    sortBy?: string;
    sortOrder?: string
}

export interface FetchAllUserRoleResponse {
    data: AllUserRoleResponse[];
    total: number
    page: string
    limit: string
    totalPages: number
}

export interface CreateUserRequest {
    name: string;
    email: string;
    password: string;
    role: string;
    phoneNumber: string;
    restaurantId: string;
    tenantId?: string;
    status?: string;
    userId?: string;
}

export interface UserRoleResponse {
    id?: string;
    email?: string;
    phoneNumber?: string;
    password?: string;
    name?: string;
    role?: string;
    status?: string;
    avatar?: string | null;
    permissions?: string | null;
    lastLoginAt?: string | null;
    emailVerifiedAt?: string | null;
    phoneVerifiedAt?: string | null;
    refreshToken?: string | null;
    refreshTokenExpiresAt?: string | null;
    tenantId?: string;
    restaurantId?: string;
    createdAt?: string;
}

export interface AllUserRoleResponse extends UserRoleResponse {
    tenant?: Tenant
    restaurant?: Restaurant
}

export interface InitialUserRoleType extends InitialCommonType, FetchAllUserRoleResponse {
    isCreateUserRole: boolean;
    isDeleteUserRole: boolean;
}
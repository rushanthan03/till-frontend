import { FetchAllRequestType, FetchAllResponse, InitialCommonType } from "../../models/BaseType";
import { Restaurant } from "../stores/types";
import { Tenant } from "../tenants/types";

export interface UserRoleAllRequest extends FetchAllRequestType {
    search?: string;
    tenantId?: string;
    sortBy?: string;
    sortOrder?: string
}

export interface FetchAllUserRoleResponse extends FetchAllResponse {
    data: AllUserRoleResponse[];
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
    isDeleteUser: boolean;
}
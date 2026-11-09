import { InitialCommonType } from "../../models/BaseType";
import { Restaurant } from "../stores/types";
import { Tenant } from "../tenants/types";

export interface AuthCredentials {
    email: string;
    password: string;
}

export interface AuthResponse {
    user?: AllUserRoleResponse
    accessToken: string
    refreshToken: string
    expiresIn: number
}

export interface LogOutResponse {
    message: string
}

export interface AuthInitialStateType extends InitialCommonType {
    user: User | null
    logoutMessage: string | null
}

export interface User {
    id?: string;
    email?: string;
    phoneNumber?: string;
    password?: string;
    name?: string;
    role?: string;
    status?: string;
    avatar?: string | null;
    permissions?: string[] | null;
    lastLoginAt?: string | null;
    emailVerifiedAt?: string | null;
    phoneVerifiedAt?: string | null;
    refreshToken?: string | null;
    refreshTokenExpiresAt?: string | null;
    tenantId?: string;
    restaurantId?: string;
    restaurant?: Restaurant;
    tenant?: Tenant;
    createdAt?: string;
}

export interface AllUserRoleResponse extends User {
    tenant?: Tenant
    restaurant?: Restaurant
}
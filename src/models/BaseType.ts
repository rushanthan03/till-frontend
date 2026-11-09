
import type { LucideIcon } from "lucide-react";
import { RouteLinks } from "../routers/type";

export interface InitialCommonType {
    loading: boolean;
    error: string | null;
}

export interface SideMenuListType {
    id: RouteLinks | string;
    label: string;
    icon: LucideIcon;
}

export interface DynamicObject {
    [key: string]: any;
}

export interface FetchAllRequestType {
    page?: number;
    limit?: number;
}

export interface FetchAllResponse {
    total: number
    page: string
    limit: string
    totalPages: number
}

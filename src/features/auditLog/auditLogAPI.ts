import axiosClient from "../../api/axiosClient";

export interface AuditEntry {
    id: string;
    tenantId: string | null;
    storeId: string | null;
    userId: string | null;
    userName: string | null;
    userRole: string | null;
    action: string;
    entityType: string | null;
    entityId: string | null;
    summary: string;
    details: Record<string, unknown> | null;
    createdAt: string;
}

export interface AuditQuery {
    storeId?: string;
    userId?: string;
    group?: string;
    search?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
}

export interface AuditPage { data: AuditEntry[]; total: number; page: number; limit: number; totalPages: number }

const unwrap = <T>(request: Promise<unknown>) => request as Promise<T>;

export const AuditLogAPI = {
    list: (q: AuditQuery) => unwrap<AuditPage>(axiosClient.get('/api/audit-log', { params: q })),
    filters: () => unwrap<{ groups: Record<string, string>; people: { id: string; name: string }[] }>(axiosClient.get('/api/audit-log/filters')),
};

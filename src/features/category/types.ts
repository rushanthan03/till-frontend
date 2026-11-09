import { InitialCommonType } from "../../models/BaseType";
import { UploadMenuItemImageResponse } from "../menuItems/types";

export interface CategoryRequest {
    id?: string;
    name: string
    description: string;
    restaurantId: string;
    image: string;
}

export type ReorderCategoriesRequest = Array<{ id: string, displayOrder: number }>;

export interface CategoryResponse {
    isSuccess: boolean;
    data: Category | Category[]
}

export interface Category {
    id: string;
    name: string
    code?: string | null;
    image?: string | null;
    description?: string | null
    itemCount?: number;
    isActive?: boolean;
    isShowcase?: boolean;
    displayOrder?: number;
    auditCreatedDateTime?: string;
    auditCreatedBy?: string;
    auditModifiedBy?: string | null;
    auditModifiedDateTime?: string | null;
    auditDeletedBy?: string | null;
}

export interface InitialCategoryType extends InitialCommonType {
    isCreateCategory: boolean;
    isDeleteCategory: boolean;
    isUpdateCategory: boolean;
    categoies: Category[];
    image: UploadMenuItemImageResponse | null
    imageLoading: boolean;
}
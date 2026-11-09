import { FetchAllResponse, InitialCommonType } from "../../models/BaseType";
import { AddOn } from "../addOns/types";
import { Category } from "../category/types";
import { RestaurantRequestResponse } from "../stores/types";

export interface MenuItem extends CreateMenuItemRequest {
    id?: string;
    restaurant?: RestaurantRequestResponse
    categoryId?: string
    category?: Category
    isFeatured?: boolean
    featuredOrder?: number
    badges?: Badge[]
    createdAt?: string;
    menuAddons?: MenuAddons[]
}

export interface MenuAddons {
    id: string;
    menuId: string;
    addonId: string;
    addon: AddOn;
    overridePrice: number;
    isRequired: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateMenuItemRequest {
    name?: string;
    description?: string;
    note?: string;
    price: number;
    image?: string;
    restaurantId?: string;
    categoryId?: string;
    discount?: number;
    quantityAvailable?: number;
    preparationTime?: number;
    isAvailable?: boolean;
    availableFrom?: string;
    availableTo?: string;
    isFeatured?: boolean;
    featuredOrder?: number;
    badges?: string[] | Badge[];
    variantOptions?: VariantType[]
    id?: string;
}

export interface VariantType {
    id?: number;
    name: string;
    type: 'single' | 'multiple';
    required?: boolean;
    options?: OptionType[];
}

export interface OptionType {
    id: number;
    name: string;
    price?: number;
    priceModifier?: number;
    isDefault?: boolean;
}

export interface UploadMenuItemImageResponse {
    key: string;
    url: string;
    publicUrl: string;
    bucket: string;
    size: number;
    contentType: string;
}

export interface FetchMenuItemRequest {
    page?: string;
    limit?: string;
    restaurantId: string;
    categoryId?: string;
    search?: string;
}

export interface FetchMenuItemLessWeightRequest {
    restaurantId: string;
    search?: string;
}

export interface FetchMenuItemLessWeightResponse {
    menuItemId: string;
    menuName: string;
}

export interface FetchAllMenuItemResponse extends FetchAllResponse {
    data: MenuItem[];
}

export interface Badge {
    id: string;
    restaurantId: string;
    name: string;
    code: string;
    description: string;
    icon: string;
    backgroundColor: string;
    textColor: string;
    displayOrder: number;
    isActive: boolean;
    isSystem: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface InitialMenuItemyType extends InitialCommonType, FetchAllMenuItemResponse {
    isCreateMenuItem: boolean;
    isUpdateMenuItem: boolean;
    isDeleteMenuItem: boolean;
    image: UploadMenuItemImageResponse | null;
    imageLoading: boolean;
    isPaginationFetching: boolean;
    menuItemsLessWeight: FetchMenuItemLessWeightResponse[];
    badges: Badge[];
}
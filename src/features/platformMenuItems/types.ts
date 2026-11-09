import { FetchAllRequestType, FetchAllResponse, InitialCommonType } from "../../models/BaseType";
import { Category } from "../category/types";
import { RestaurantRequestResponse } from "../platformStores/types";

export interface FetchAllMenuItemRequest extends FetchAllRequestType {
    restaurantId?: string;
}

export interface MenuItem extends CreateMenuItemRequest {
    id: string;
    restaurantId: string
    restaurant?: RestaurantRequestResponse
    categoryId: string
    category?: Category
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateMenuItemRequest {
    name: string;
    description?: string;
    note?: string;
    price: number;
    image?: string;
    imageKey?: string;
    restaurantId: string;
    categoryId: string;
    discount?: number;
    quantityAvailable?: number;
    preparationTime?: number;
    isAvailable?: boolean;
    availableFrom?: string;
    availableTo?: string;
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
    search?: string;
}

export interface FetchMenuItemLessWeightResponse {
    menuItemId: string;
    menuName: string;
}

export interface FetchAllMenuItemResponse extends FetchAllResponse {
    data: MenuItem[];
}

export interface InitialMenuItemyType extends InitialCommonType, FetchAllMenuItemResponse {
    isCreateMenuItem: boolean;
    isUpdateMenuItem: boolean;
    isDeleteMenuItem: boolean;
    image: UploadMenuItemImageResponse | null;
    imageLoading: boolean;
    menuItemsLessWeight: FetchMenuItemLessWeightResponse[];
}
import { FetchAllResponse, InitialCommonType } from "../../models/BaseType";
import { RestaurantRequestResponse } from "../stores/types";

export interface AddOn extends CreateAddOnRequest {
    id: string;
    restaurantId: string;
    restaurant?: RestaurantRequestResponse;
    createdAt?: string;
    menus: AddOnMenu[];
}

export interface CreateAddOnRequest {
    name: string;
    description: string;
    unitPrice: number;
    menuIds?: string[];
    quantity: number;
    restaurantId: string;
    id?: string;
}

export interface AddOnMenu {
    id: string;
    name: string;
    description: string;
    discount: string;
    restaurantId: string;
    items: any[];
}

export interface FetchAllAddOnResponse extends FetchAllResponse {
    data: AddOn[];
}

export interface InitialAddOnType extends InitialCommonType, FetchAllAddOnResponse {
    isCreateAddOn: boolean;
    isUpdateAddOn: boolean;
    isDeleteAddOn: boolean;
}

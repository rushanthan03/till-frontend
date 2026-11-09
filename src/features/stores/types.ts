import { DynamicObject, FetchAllRequestType, InitialCommonType } from "../../models/BaseType";

export interface RestaurantAllRequest extends FetchAllRequestType {
    search?: string;
    tenantId?: string;
    sortBy?: string;
    sortOrder?: string
}

export interface RestaurantAllRequestByTenant extends FetchAllRequestType {
    tenantId: string;
    restaurantId?: string;
}

export interface AllRestaurantResponse {
    data: Data;
    message?: string;
}

export interface RestaurantResponse {
    data: Restaurant;
    message?: string;
}

export interface Data {
    data: Restaurant[];
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface Restaurant extends RestaurantRequestResponse {
    isActive?: boolean;
    webUrl?: string;
    timeZone?: string;
    menus?: any[];
    location?: Location;
    auditCreatedDateTime?: string | null;
    paymentTiming?: string;
    isServiceChargeEnabled?: boolean;
    serviceChargePercentage?: number;
    serviceChargeType?: 'fixed' | 'percentage';
    fixedServiceCharge?: number;
    requireWaiterConfirmation?: boolean;
    smsSendMode?: 'ALWAYS' | 'ASK_CASHIER' | 'OFF';
    isLoyaltyEnabled?: boolean;
    isRoomsEnabled?: boolean;
    isAppearanceEnabled?: boolean;
}

export interface Address {
    city?: string;
    lane?: string;
    country?: string;
    district?: string;
}

export interface Location {
    id: string;
    address?: Address;
    city: string;
    country: string;
    state: string;
    latitude: number;
    longitude: number
}

export interface RestaurantRequestResponse {
    id?: string;
    tenantId?: string;
    name?: string;
    address?: Address;
    logo?: string;
    banner?: string;
    contactEmail?: string;
    contactPhoneNumber?: string;
    openTime?: string | null;
    closeTime?: string | null;
    openHours?: DynamicObject | null;
    bankDetails?: BankDetails | null;
    primaryColor?: string;
    createdAt?: string | null;
    restaurantID?: string | null;
    applyServiceCharge?: boolean;
    serviceChargePercentage?: number;
    serviceChargeType?: 'fixed' | 'percentage';
    fixedServiceCharge?: number;
    requireWaiterConfirmation?: boolean;
    // System & Notification Controls
    orderAlertsVisible?: boolean;
    orderAlertsMuted?: boolean;
    showPOSOrderSidebar?: boolean;
    bypassKitchen?: boolean;
    kitchenBulkMode?: boolean;
    autoPrintEnabled?: boolean;
    printerPaperWidth?: string;
    connectedPrinterName?: string;
    alertAudioRingtone?: string;
    alertAudioRingMode?: string;
    alertAudioVolume?: number;
    alertStopCondition?: string;
    smsSendMode?: 'ALWAYS' | 'ASK_CASHIER' | 'OFF';
    // Feature Flags (controlled by Super Admin)
    isLoyaltyEnabled?: boolean;
    isRoomsEnabled?: boolean;
    isAppearanceEnabled?: boolean;
}

export interface BankDetails {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    branch?: string;
    iban?: string;
    swiftCode?: string;
}

export interface InitialRestaurantType extends InitialCommonType {
    isCreateRestaurant: boolean;
    isDeleteRestaurant: boolean;
    restaurant: Restaurant | null;
    restaurants: Restaurant[];
    imageLoading: boolean;
    uploadedLogoUrl?: string;
    uploadedBannerUrl?: string;
}

export interface CurrentPlanResponseDto {
    id: string;
    name: string;
    code: string;
    description: string;
    priceMonthly: string;
    priceYearly: string;
    status: string;
    features: string[];
    billingCycle: string;
    yearlySavingsPercent: string;
    createdAt: string;
    updatedAt: string;
}
import { DynamicObject, FetchAllRequestType, InitialCommonType } from "../../models/BaseType";
import { UploadMenuItemImageResponse } from "../platformMenuItems/types";

export interface RestaurantAllRequest extends FetchAllRequestType {
    search?: string;
    tenantId?: string;
    sortBy?: string;
    sortOrder?: string;
    status?: string;
    city?: string;
    district?: string;
    isOverLimit?: boolean;
    planCode?: string;
    minWalletBalance?: number;
    maxWalletBalance?: number;
}

export interface RestaurantAllRequestByTenant extends FetchAllRequestType {
    tenantId: string;
}

export interface RestaurantResponse {
    data: Data;
    message?: string;
}

export interface Data {
    data: Restaurant[];
    total: number
    page: string
    limit: string
    totalPages: number
}

export interface SuperAdminFeatureControlPayload {
    isRoomsEnabled?: boolean;
    isLoyaltyEnabled?: boolean;
    isWhatsAppEnabled?: boolean;
    isAppearanceEnabled?: boolean;
    requireWaiterConfirmation?: boolean;
}

export interface UpdateRestaurantFeaturesArgs {
    tenantId: string;
    restaurantId: string;
    payload: SuperAdminFeatureControlPayload;
}

export interface Restaurant extends RestaurantRequestResponse {
    isActive?: boolean;
    webUrl?: string;
    timeZone?: string;
    menus?: any[];
    location?: Location;
    gracePeriodStartDate?: string;
    gracePeriodEndDate?: string;
    auditCreatedDateTime?: string | null;
    isRoomsEnabled?: boolean;
    isLoyaltyEnabled?: boolean;
    isWhatsAppEnabled?: boolean;
    isAppearanceEnabled?: boolean;
    requireWaiterConfirmation?: boolean;
}

export interface Location {
    id: string;
    address?: string;
    city: string;
    country: string;
    state: string;
    latitude: number;
    longitude: number
}

export interface Address {
    city?: string;
    lane?: string;
    country?: string;
    district?: string;
}

export interface RestaurantRequestResponse {
    id?: string;
    tenantId: string;
    name: string;
    address?: Address;
    logo: string;
    type?: string;
    contactEmail: string;
    contactPhoneNumber: string;
    openTime?: string | null;
    closeTime?: string | null;
    openHours?: DynamicObject | null;
    createdAt?: string | null;
    restaurantID?: string | null;
    paymentTiming?: string;
    walletBalance?: number;
    subscription?: Subscription;
}

export interface Subscription {
    id: string;
    planId: string;
    planName: string;
    planCode: string;
    billingCycle: string;
    startDate: string;
    endDate: string;
    status: string;
    isAutoRenew: boolean;
    priceMonthly: string;
    priceYearly: string;
    orderLimit: number;
    completedOrders?: number;
    isOverLimit?: boolean;
    overageCount?: number;
    additionalCharges?: number;
    features: string[];
}

export interface GracePeriodResponse {
    success: boolean,
    message: string,
    data: {
        restaurant: {
            id: string,
            name: string,
            status: string,
            isActive: boolean,
            gracePeriodStartDate: string,
            gracePeriodEndDate: string
        }
    }
}


export interface InitialRestaurantType extends InitialCommonType, Data {
    isCreateRestaurant: boolean;
    isDeleteRestaurant: boolean;
    image: UploadMenuItemImageResponse | null;
    restaurant: Restaurant | null;
    imageLoading: boolean;
}

export interface BankDetails {
    bankName?: string | null;
    accountName?: string | null;
    accountNumber?: string | null;
    branch?: string | null;
    iban?: string | null;
    swiftCode?: string | null;
}

export interface WalletSummary {
    totalBalance: number;
    walletTotalEarned: number;
    walletTotalWithdrawn: number;
}

export interface WalletTransaction {
    invoiceId: string;
    amount: number;
    date: string;
    description: string;
    status: 'Completed' | 'Pending' | 'Failed';
}

export interface InvoiceResponseDto {
    id: number;
    restaurantId: string;
    billing_period: string;
    plan: string;
    amount: number;
    base_amount: number;
    fees: number;
    status: string;
    due_date: string;
    paid_date?: string | null;
    created_at: string;
    updated_at: string;
}

export interface SummaryMetric {
    value: number;
    growth?: number;
    label: string;
    trend?: 'up' | 'down';
}

export interface RestaurantSummary {
    totalRestaurants: SummaryMetric;
    activeRestaurants: SummaryMetric;
    totalRevenue: SummaryMetric;
    overallGrowth: SummaryMetric;
}

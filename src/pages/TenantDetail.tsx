import { FC, useCallback, useLayoutEffect, useState } from "react";
import placeholder from '../assets/placeholder.jpg'
import { Edit, Mail, Phone, Building2 } from "lucide-react";
import StoreSection from "../sections/TenantDetail/StoreSection";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../app/store";
import { useParams } from "react-router-dom";
import { fetchAllRestaurantsByTenantRequest, increaseLimit as restaurantIncreaseLimit, pagination as restaurantPagination } from "../features/platformStores/storesSlice";
import { CreateTenantRequest, Tenant } from "../features/platformTenants/types";
import { StatusBadge } from "../components/StatusBadge";
import TablePagination from "@mui/material/TablePagination";
import { updateTenantRequest } from "../features/platformTenants/tenantsSlice";
import { EditTenantModal } from "../components/EditTenantModal";
import { Button } from "../components/Button";

const TenantDetail: FC = () => {

    const { tenantId } = useParams();

    const dispatch = useDispatch<AppDispatch>();

    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: filteredRestaurants, loading: restaurantLoading, limit: restaurantLimit, page: restaurantPage, total: restaurantTotal } = useSelector((state: RootState) => state.platformRestaurant);
    const { data: tenants, isCreateTenant } = useSelector((state: RootState) => state.platformTenants);

    const filterTenant = tenants.find((i) => i.id === tenantId);
    const { name, type, contactEmail, contactPhoneNumber, description, status } = filterTenant as Tenant;

    const validateToasts = useCallback(() => {
        if (isCreateTenant) {
            setIsModalOpen(false);
            return;
        }
    }, [isCreateTenant])

    useLayoutEffect(() => {
        validateToasts();
    }, [validateToasts])

    const fetchRestaurants = useCallback(() => {
        dispatch(fetchAllRestaurantsByTenantRequest({ page: Number(restaurantPage), limit: Number(restaurantLimit), tenantId: tenantId as string }))
    }, [dispatch, tenantId, restaurantPage, restaurantLimit])

    useLayoutEffect(() => {
        fetchRestaurants()
    }, [fetchRestaurants])

    const handleEditClick = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleEdit = (data: CreateTenantRequest) => {
        dispatch(updateTenantRequest(data));
    };

    const handleChangePage = (_: React.MouseEvent<HTMLButtonElement, MouseEvent> | null, page: number) => {
        dispatch(restaurantPagination(String(page + 1)))
    }

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        dispatch(restaurantIncreaseLimit(event.target.value))
    }

    const filterRestaurant = filteredRestaurants.filter((restaurant) => restaurant.tenantId === tenantId);

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header Section with Cover */}
            <div className="relative h-48 w-full bg-gradient-to-br from-blue-600 to-blue-800">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>

            {/* Tenant Info Card */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                        <div className="flex items-start gap-6">
                            <div className="w-24 h-24 rounded-xl bg-gray-100 border-4 border-white shadow-md overflow-hidden -mt-12">
                                <img
                                    src={placeholder}
                                    alt={name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl font-bold text-gray-900">{name}</h1>
                                    <StatusBadge
                                        status={status}
                                        type="subscription"
                                    />
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        {contactEmail}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        {contactPhoneNumber}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Building2 className="w-4 h-4 text-gray-400" />
                                        <span className="capitalize">{type?.replace('_', ' ')}</span>
                                    </div>
                                </div>
                                {description && (
                                    <p className="text-sm text-gray-500 mt-2">{description}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <Button variant="secondary" onClick={handleEditClick}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Info
                            </Button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-1 mt-8 border-b border-gray-100">
                        <div className="px-6 py-3 text-sm font-medium border-b-2 border-blue-600 text-blue-600">
                            Stores
                        </div>
                        <div className="px-6 py-3 text-sm text-gray-400 italic">
                            Staff members are managed within each store
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="pb-12">
                    <StoreSection tenant={filterTenant} dataList={filterRestaurant} loading={restaurantLoading} />
                </div>

                {/* Pagination */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4 mb-8">
                    <TablePagination
                        component="div"
                        count={restaurantTotal}
                        page={Number(restaurantPage) - 1}
                        onPageChange={handleChangePage}
                        rowsPerPage={Number(restaurantLimit)}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </div>
            </div>

            {filterTenant && (
                <EditTenantModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSubmit={handleEdit}
                    tenant={filterTenant}
                    loading={false}
                />
            )}
        </div>
    )
}

export default TenantDetail;
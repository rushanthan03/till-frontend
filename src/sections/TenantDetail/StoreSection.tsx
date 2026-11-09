import { FC, useCallback, useMemo, useState } from "react";
import { Restaurant, RestaurantRequestResponse } from "../../features/platformStores/types";
import { Edit, Plus, MapPin, Phone, Mail, MoreHorizontal, Eye, ArrowRight, CheckCircle, Ban } from "lucide-react";
import { StatusBadge } from "../../components/StatusBadge";
import { SubmitHandler, useForm, Controller } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../app/store";
import { createRestaurantsRequest, deleteRestaurantsRequest, updateRestaurantsRequest, uploadRestaurantImageRequest, reactivateRestaurantsRequest } from "../../features/platformStores/storesSlice";
import { Tenant } from "../../features/platformTenants/types";
import { Modal } from "../../components/Modal";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { TenantType } from "../../utils/constants";
import { useNavigate } from "react-router-dom";
import { Select } from "../../components/Select";
import { OperatingHoursInput } from "../../components/OperatingHoursInput";
import { getAllDistricts, getCitiesByDistrict } from "../../utils/sriLankaData";
import ImageUploadInput from "../../components/ImageUploadInput";
import { fileToBase64, formatPhoneNumber, isValidEmail, validateSriLankanPhoneNumber } from "../../utils";

interface StoreSectionProps {
    tenant?: Tenant;
    dataList: Restaurant[]
    loading?: boolean;
}

const StoreSection: FC<StoreSectionProps> = ({ dataList, tenant, loading }) => {

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
    const [restaurantToAction, setRestaurantToAction] = useState<Restaurant | null>(null);

    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    const { image, imageLoading } = useSelector((state: RootState) => state.platformRestaurant);

    const { register, handleSubmit, reset, getValues, control, watch } = useForm<RestaurantRequestResponse>({
        defaultValues: {
            name: "",
            contactEmail: "",
            contactPhoneNumber: "",
            address: tenant?.address,
            logo: "",
            tenantId: "",
            openTime: "09:00",
            closeTime: "22:00",
            openHours: null
        },
    });

    const isEmailValid = isValidEmail(watch('contactEmail'));

    const handleAdd = () => {
        setSelectedRestaurant(null);
        setIsModalOpen(true);
        {
            reset({
                name: "",
                openTime: "09:00",
                closeTime: "22:00",
                openHours: null
            });
        }
    }

    const onHandleDeleteRestaurant = useCallback((restaurant: Restaurant) => {
        setRestaurantToAction(restaurant);
        setIsDeleteModalOpen(true);
    }, [])

    const onHandleReactivateRestaurant = useCallback((restaurant: Restaurant) => {
        setRestaurantToAction(restaurant);
        setIsReactivateModalOpen(true);
    }, [])

    const confirmDelete = useCallback(() => {
        if (restaurantToAction) {
            dispatch(deleteRestaurantsRequest(restaurantToAction));
            setIsDeleteModalOpen(false);
            setRestaurantToAction(null);
        }
    }, [dispatch, restaurantToAction])

    const confirmReactivate = useCallback(() => {
        if (restaurantToAction) {
            dispatch(reactivateRestaurantsRequest({ tenantId: restaurantToAction.tenantId, restaurantId: restaurantToAction.id! }));
            setIsReactivateModalOpen(false);
            setRestaurantToAction(null);
        }
    }, [dispatch, restaurantToAction])

    const closeConfirmationModals = useCallback(() => {
        setIsDeleteModalOpen(false);
        setIsReactivateModalOpen(false);
        setRestaurantToAction(null);
    }, [])

    const handleEdit = useCallback((restaurant: Restaurant) => {
        setSelectedRestaurant(restaurant);
        reset({
            name: restaurant.name,
            contactEmail: restaurant.contactEmail,
            contactPhoneNumber: restaurant.contactPhoneNumber?.replace('+94', '0'),
            address: restaurant.address,
            restaurantID: restaurant.id,
            tenantId: restaurant.tenantId,
            logo: restaurant.logo,
            openTime: restaurant.openTime || "09:00",
            closeTime: restaurant.closeTime || "22:00",
            openHours: restaurant.openHours || null
        })
        setIsModalOpen(true);
    }, [reset])

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedRestaurant(null);
    }, []);

    const handleCreateRestaurant: SubmitHandler<RestaurantRequestResponse> = useCallback((data) => {
        setIsModalOpen(false);
        if (getValues('restaurantID')) {
            dispatch(updateRestaurantsRequest({ ...data, logo: image?.url ?? '', contactPhoneNumber: formatPhoneNumber(data.contactPhoneNumber) }))
        } else {
            dispatch(createRestaurantsRequest({ ...data, tenantId: tenant!.id, logo: image?.url ?? '', contactPhoneNumber: formatPhoneNumber(data.contactPhoneNumber) }))
        }
    }, [dispatch, getValues, tenant, image])

    const handleImageUpload = async (file: File | null) => {
        if (file) {
            const base64 = await fileToBase64(file);
            dispatch(uploadRestaurantImageRequest({ image: base64 }));
        }
    };

    const handleViewRestaurant = (restaurantId?: string) => {
        if (!tenant) {
            return;
        }
        navigate(`/restaurants/${tenant.id}/${restaurantId}/${tenant.type}`)
    }

    const filterRestaurant = useMemo(() => {
        return searchTerm.length <= 0 ? dataList : dataList.filter((i) => {
            const name = i.name?.toLowerCase() || "";
            const email = i.contactEmail?.toLowerCase() || "";
            const phone = i.contactPhoneNumber?.toLowerCase() || "";

            return (
                name.includes(searchTerm.toLowerCase()) ||
                email.includes(searchTerm.toLowerCase()) ||
                phone.includes(searchTerm.toLowerCase())
            );
        });
    }, [dataList, searchTerm])

    const validateAddRestaurant = tenant?.type === TenantType.STORE && dataList.length >= 1

    if (loading && dataList.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Loading stores...</div>
            </div>
        );
    }

    const preventMinus = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            return;
        }
        if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
            return;
        }
        if (!/^[0-9+]$/.test(e.key)) {
            e.preventDefault();
        }
    };

    const isPhoneNumberValid = validateSriLankanPhoneNumber(watch('contactPhoneNumber'));
    const isDisable = watch('name') === '' || watch('contactEmail') === '' || watch('contactPhoneNumber') === '' || watch('address.city') === '' || watch('address.district') === '' || watch('address.country') === '' || watch('address.lane') === '' || !isPhoneNumberValid;

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">
                        {'Stores'}
                    </h3>
                    <p className="text-sm text-gray-500">Manage locations and details</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <Button onClick={handleAdd} disabled={validateAddRestaurant}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Store
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterRestaurant.map((restaurant) => (
                    <div key={restaurant.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group">
                        <div className="relative h-40 overflow-hidden bg-gray-100">
                            <img
                                src={restaurant.logo || 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=400'}
                                alt={restaurant.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute top-3 right-3">
                                <StatusBadge
                                    status={restaurant.isActive ? 'active' : 'inactive'}
                                    type="subscription"
                                />
                            </div>
                        </div>

                        <div className="p-5">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <h4 className="text-lg font-bold text-gray-900 mb-1">{restaurant.name}</h4>
                                    {restaurant.address && (
                                        <div className="flex items-start text-sm text-gray-500">
                                            <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                                            <span className="line-clamp-2">
                                                {restaurant.address.lane}, {restaurant.address.city}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                    onClick={() => handleEdit(restaurant)}
                                >
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-2 pt-3 border-t border-gray-50">
                                {restaurant.contactEmail && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="truncate">{restaurant.contactEmail}</span>
                                    </div>
                                )}
                                {restaurant.contactPhoneNumber && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                        <span>{restaurant.contactPhoneNumber}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                                <button
                                    onClick={() => handleViewRestaurant(restaurant.id)}
                                    className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 hover:scale-105 flex items-center justify-center gap-1"
                                >
                                    <Eye className="w-4 h-4" />
                                    View Details
                                    <ArrowRight className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => handleEdit(restaurant)}
                                    className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105"
                                    title="Edit"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                {restaurant.isActive ? (
                                    <button
                                        onClick={() => onHandleDeleteRestaurant(restaurant)}
                                        className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-105"
                                        title="Deactivate"
                                    >
                                        <Ban className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => onHandleReactivateRestaurant(restaurant)}
                                        className="px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all duration-200 hover:scale-105"
                                        title="Reactivate"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filterRestaurant.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                    <p className="text-gray-500">No stores found</p>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={selectedRestaurant ? 'Edit Store' : 'Add Store'}
                size="lg"
                footer={
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit(handleCreateRestaurant)} disabled={isDisable} isLoading={loading || imageLoading}>
                            {selectedRestaurant ? 'Update Store' : 'Create Store'}
                        </Button>
                    </div>
                }
            >
                <form>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Store Name"
                            placeholder="Enter store name"
                            {...register('name')}
                        />
                        <Input
                            label="Email"
                            type="email"
                            placeholder="contact@restaurant.com"
                            {...register('contactEmail')}
                            error={watch('contactEmail')?.length > 5 && !isEmailValid ? 'Invalid email format' : undefined}
                        />
                        <Input
                            label="Phone"
                            type="tel"
                            maxLength={12}
                            placeholder="XX XXX XXXX"
                            prefix="+94"
                            onKeyDown={preventMinus}
                            {...register('contactPhoneNumber')}
                            error={watch('contactPhoneNumber')?.length > 9 && !isPhoneNumberValid ? 'Invalid phone number format' : undefined}
                        />
                        <div className="col-span-2 space-y-4">
                            <ImageUploadInput
                                value={watch('logo') || ''}
                                placeholder="Upload Image"
                                onChange={handleImageUpload}
                            />
                        </div>
                        <Input
                            label="Lane"
                            placeholder="123 Main Street"
                            {...register('address.lane')}
                                                    />
                        <Select
                            label="District"
                            options={[
                                { value: '', label: 'Select District' },
                                ...getAllDistricts().map(district => ({
                                    value: district,
                                    label: district,
                                })),
                            ]}
                            value={watch('address.district')}
                            required
                            {...register('address.district')}
                        />
                        <Select
                            label="City"
                            options={[
                                { value: '', label: watch('address.district') ? 'Select City' : 'Select District First' },
                                ...getCitiesByDistrict(watch('address.district') ?? "").map(city => ({
                                    value: city,
                                    label: city,
                                })),
                            ]}
                            value={watch('address.city')}
                            disabled={!watch('address.district')}
                            required
                            {...register('address.city')}
                        />
                        <Input
                            label="Country"
                            placeholder="Sri Lanka"
                            {...register('address.country')}
                                                    />
                                                <Input
                            label="Opening Time"
                            type="time"
                            placeholder="09:00"
                            {...register('openTime')}
                        />
                        <Input
                            label="Closing Time"
                            type="time"
                            placeholder="22:00"
                            {...register('closeTime')}
                        />
                        <div className='col-span-2'>
                            <Controller
                                name="openHours"
                                control={control}
                                render={({ field }) => (
                                    <OperatingHoursInput
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Delete/Deactivate Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={closeConfirmationModals}
                title="Deactivate Store"
                size="sm"
                footer={
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={closeConfirmationModals}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={confirmDelete}>
                            <Ban className="w-4 h-4 mr-2" />
                            Deactivate
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <Ban className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-base font-semibold text-gray-900 mb-1">
                                Deactivate "{restaurantToAction?.name}"?
                            </h4>
                            <p className="text-sm text-gray-600">
                                This store will be marked as inactive. You can reactivate it anytime.
                            </p>
                        </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-sm text-amber-800">
                            <strong>Note:</strong> The store will not be able to trade while inactive.
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Reactivate Confirmation Modal */}
            <Modal
                isOpen={isReactivateModalOpen}
                onClose={closeConfirmationModals}
                title="Reactivate Store"
                size="sm"
                footer={
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={closeConfirmationModals}>
                            Cancel
                        </Button>
                        <Button onClick={confirmReactivate}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Reactivate
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-base font-semibold text-gray-900 mb-1">
                                Reactivate "{restaurantToAction?.name}"?
                            </h4>
                            <p className="text-sm text-gray-600">
                                This store will be marked as active and can start accepting orders again.
                            </p>
                        </div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-emerald-800">
                                <p className="font-medium mb-1">Store will be reactivated with:</p>
                                <ul className="list-disc list-inside space-y-0.5 ml-2">
                                    <li>Active status restored</li>
                                    <li>Till and sales enabled</li>
                                    <li>Product catalogue available</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default StoreSection;
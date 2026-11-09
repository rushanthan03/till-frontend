import { FC, useState, useEffect, useMemo } from 'react';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { TextArea } from '../components/TextArea';
import { TenantType } from '../utils/constants';
import { CreateTenantRequest } from '../features/platformTenants/types';
import { RestaurantRequestResponse } from '../features/platformStores/types';
import { useForm } from 'react-hook-form';
import { Building2, Store, MapPin, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { getAllDistricts, getCitiesByDistrict } from '../utils/sriLankaData';
import ImageUploadInput from './ImageUploadInput';
import { fileToBase64, formatPhoneNumber, displayPhoneNumber, validateSriLankanPhoneNumber, isValidEmail } from '../utils';
import { uploadRestaurantImageRequest } from '../features/platformStores/storesSlice';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../app/store';

interface AddTenantStepperProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (tenantData: CreateTenantRequest, restaurantData?: RestaurantRequestResponse) => void;
    loading?: boolean;
}

export const AddTenantStepper: FC<AddTenantStepperProps> = ({
    isOpen,
    onClose,
    onSubmit,
    loading = false,
}) => {
    const dispatch = useDispatch<AppDispatch>();

    const [currentStep, setCurrentStep] = useState(0);
    const [tenantDistrict, setTenantDistrict] = useState('');
    const [tenantCity, setTenantCity] = useState('');
    const [restaurantDistrict, setRestaurantDistrict] = useState('');
    const [restaurantCity, setRestaurantCity] = useState('');

    const { image } = useSelector((state: RootState) => state.platformRestaurant);

    const { register: registerTenant, watch: watchTenant, reset: resetTenant, setValue: setValueTenant } = useForm<CreateTenantRequest>({
        defaultValues: {
            name: '',
            contactEmail: '',
            contactPhoneNumber: '',
            description: '',
            type: TenantType.STORE,
            address: {
                lane: '',
                city: '',
                district: '',
                country: 'Sri Lanka',
            },
        },
    });

    const { register: registerRestaurant, watch: watchRestaurant, reset: resetRestaurant, setValue: setValueRestaurant, } = useForm<RestaurantRequestResponse>({
        defaultValues: {
            name: '',
            contactEmail: '',
            contactPhoneNumber: '',
            address: {
                lane: '',
                city: '',
                district: '',
                country: 'Sri Lanka',
            },
        },
    });

    const tenantType = watchTenant('type');

    // Get available cities based on selected district
    const tenantAvailableCities = tenantDistrict ? getCitiesByDistrict(tenantDistrict) : [];
    const restaurantAvailableCities = restaurantDistrict ? getCitiesByDistrict(restaurantDistrict) : [];
    const tenantPhoneNumberValid = validateSriLankanPhoneNumber(watchTenant('contactPhoneNumber'));
    const restaurantPhoneNumberValid = validateSriLankanPhoneNumber(watchRestaurant('contactPhoneNumber'));
    const tenantEmailValid = isValidEmail(watchTenant('contactEmail'));
    const restaurantEmailValid = isValidEmail(watchRestaurant('contactEmail'));

    // Reset city when district changes
    useEffect(() => {
        setTenantCity('');
        setValueTenant('address.city', '');
    }, [tenantDistrict, setValueTenant]);

    useEffect(() => {
        setRestaurantCity('');
        setValueRestaurant('address.city', '');
    }, [restaurantDistrict, setValueRestaurant]);

    // Update form values when district/city changes
    useEffect(() => {
        setValueTenant('address.district', tenantDistrict);
        setValueTenant('address.city', tenantCity);
    }, [tenantDistrict, tenantCity, setValueTenant]);

    useEffect(() => {
        setValueRestaurant('address.district', restaurantDistrict);
        setValueRestaurant('address.city', restaurantCity);
    }, [restaurantDistrict, restaurantCity, setValueRestaurant]);

    const steps = [
        {
            title: 'Tenant Information',
            description: 'Basic details about the tenant',
            icon: Building2,
        },
        {
            title: 'Tenant Address',
            description: 'Location information',
            icon: MapPin,
        },
        ...(tenantType === TenantType.STORE
            ? [
                {
                    title: 'Store Details',
                    description: 'Add your first store',
                    icon: Store,
                },
            ]
            : []),
        {
            title: 'Review & Submit',
            description: 'Confirm your information',
            icon: CheckCircle,
        },
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleFinalSubmit = () => {
        const tenantData = watchTenant();
        const restaurantRequest = watchRestaurant();
        const { status, ...tenantDataWithoutStatus } = tenantData;
        const formattedTenantData = {
            ...tenantDataWithoutStatus,
            contactEmail: tenantDataWithoutStatus.contactEmail.toLowerCase(),
            contactPhoneNumber: formatPhoneNumber(tenantDataWithoutStatus.contactPhoneNumber)
        };

        const restaurantData = tenantType === TenantType.STORE ? {
            ...restaurantRequest,
            contactEmail: restaurantRequest.contactEmail.toLowerCase(),
            contactPhoneNumber: formatPhoneNumber(restaurantRequest.contactPhoneNumber),
            logo: image?.url ?? ''
        } : undefined;

        onSubmit(formattedTenantData as CreateTenantRequest, restaurantData);
        handleModalClose();
    };

    const handleImageUpload = async (file: File | null) => {
        if (file) {
            const base64 = await fileToBase64(file);
            dispatch(uploadRestaurantImageRequest({ image: base64 }));
        }
    };

    const handleModalClose = () => {
        setCurrentStep(0);
        resetTenant();
        resetRestaurant();
        setTenantDistrict('');
        setTenantCity('');
        setRestaurantDistrict('');
        setRestaurantCity('');
        onClose();
    };

    const tenantName = watchTenant('name');
    const tenantAddressLane = watchTenant('address.lane');
    const tenantEmail = watchTenant('contactEmail');
    const tenantPhoneNumber = watchTenant('contactPhoneNumber');
    const tenantCountry = watchTenant('address.country');

    const restaurantName = watchRestaurant('name');
    const restaurantAddressLane = watchRestaurant('address.lane');
    const restaurantEmail = watchRestaurant('contactEmail');
    const restaurantPhoneNumber = watchRestaurant('contactPhoneNumber');

    const isDisable = useMemo(() => {
        switch (currentStep) {
            case 0:
                return tenantName === '' || tenantEmail === '' || tenantPhoneNumber === '' || !tenantPhoneNumberValid;
            case 1:
                return tenantAddressLane === '' || tenantDistrict === '' || tenantCity === '' || tenantCountry === '';
            case 2:
                return restaurantName === '' || restaurantEmail === '' || restaurantPhoneNumber === '' || restaurantAddressLane === '' || restaurantDistrict === '' || restaurantCity === '' || !restaurantPhoneNumberValid;
            default:
                return true;
        }
    }, [currentStep, tenantDistrict, tenantCity, restaurantDistrict, restaurantCity, restaurantName, restaurantEmail, restaurantPhoneNumber, restaurantAddressLane, tenantCountry, tenantAddressLane, tenantDistrict, tenantCity, tenantCountry, tenantName, tenantEmail, tenantPhoneNumber, tenantPhoneNumberValid, restaurantPhoneNumberValid, tenantType]);

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

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Tenant Name*"
                                placeholder="Enter tenant name"
                                {...registerTenant('name')}
                                required
                            />
                            <Input
                                label="Contact Email*"
                                type="email"
                                placeholder="contact@example.com"
                                {...registerTenant('contactEmail')}
                                error={tenantEmail && !tenantEmailValid ? 'Invalid email format' : undefined}
                                required
                            />
                            <Input
                                label="Contact Phone*"
                                type="tel"
                                maxLength={10}
                                placeholder="XX XXX XXXX"
                                prefix="+94"
                                onKeyDown={preventMinus}
                                {...registerTenant('contactPhoneNumber', {
                                    required: true,
                                    value: tenantPhoneNumber,
                                })}
                                error={tenantPhoneNumber?.length === 10 && !tenantPhoneNumberValid ? 'Invalid phone number format (e.g., 07XXXXXXXX or +947XXXXXXXX)' : undefined}
                            />
                        </div>
                        <div>
                            <TextArea
                                label="Description"
                                value={watchTenant('description')}
                                placeholder="Brief description of the tenant"
                                {...registerTenant('description')}
                            />
                        </div>
                    </div>
                );

            case 1:
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <Input
                                    label="Address Lane"
                                    placeholder="123 Main Street"
                                    {...registerTenant('address.lane')}
                                    required
                                />
                            </div>
                            <Select
                                label="District"
                                options={[
                                    { value: '', label: 'Select District' },
                                    ...getAllDistricts().map(district => ({
                                        value: district,
                                        label: district,
                                    })),
                                ]}
                                value={tenantDistrict}
                                onChange={(e) => setTenantDistrict(e.target.value)}
                                required
                            />
                            <Select
                                label="City"
                                options={[
                                    { value: '', label: tenantDistrict ? 'Select City' : 'Select District First' },
                                    ...tenantAvailableCities.map(city => ({
                                        value: city,
                                        label: city,
                                    })),
                                ]}
                                value={tenantCity}
                                onChange={(e) => setTenantCity(e.target.value)}
                                disabled={!tenantDistrict}
                                required
                            />
                            <Input
                                label="Country"
                                placeholder="Sri Lanka"
                                {...registerTenant('address.country', {
                                    required: true,
                                })}
                            />
                        </div>
                    </div>
                );

            case 2:
                if (tenantType === TenantType.STORE) {
                    return (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-blue-800">
                                    <strong>Note:</strong> Add your first store to get started quickly. You can add more stores later from the tenant detail page.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Store Name"
                                    placeholder="Enter store name"
                                    {...registerRestaurant('name')}
                                    required
                                />
                                <Input
                                    label="Contact Email"
                                    type="email"
                                    placeholder="restaurant@example.com"
                                    {...registerRestaurant('contactEmail')}
                                    error={restaurantEmail?.length > 5 && !restaurantEmailValid ? 'Invalid email format' : undefined}
                                    required
                                />
                                <Input
                                    label="Contact Phone"
                                    type="tel"
                                    maxLength={10}
                                    placeholder="XX XXX XXXX"
                                    prefix="+94"
                                    onKeyDown={preventMinus}
                                    {...registerRestaurant('contactPhoneNumber')}
                                    error={restaurantPhoneNumber?.length > 9 && !restaurantPhoneNumberValid ? 'Invalid phone number format (e.g., 07XXXXXXXX or +947XXXXXXXX)' : undefined}
                                    required
                                />
                                <div className="col-span-2 space-y-4">
                                    <ImageUploadInput
                                        value={watchRestaurant('logo') || ''}
                                        placeholder="Upload Image"
                                        onChange={handleImageUpload}
                                    />
                                </div>
                                <Input
                                    label="Address Lane"
                                    placeholder="123 Main Street"
                                    {...registerRestaurant('address.lane')}
                                    required
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
                                    value={restaurantDistrict}
                                    onChange={(e) => setRestaurantDistrict(e.target.value)}
                                    required
                                />
                                <Select
                                    label="City"
                                    options={[
                                        { value: '', label: restaurantDistrict ? 'Select City' : 'Select District First' },
                                        ...restaurantAvailableCities.map(city => ({
                                            value: city,
                                            label: city,
                                        })),
                                    ]}
                                    value={restaurantCity}
                                    onChange={(e) => setRestaurantCity(e.target.value)}
                                    disabled={!restaurantDistrict}
                                    required
                                />
                            </div>
                        </div>
                    );
                }
                // Fall through to review if not restaurant type
                return renderReviewStep();

            case 3:
            case 4: 
                return renderReviewStep();

            default:
                return null;
        }
    };

    const renderReviewStep = () => {
        const tenantData = watchTenant();
        const restaurantData = watchRestaurant();

        return (
            <div className="space-y-6 animate-fadeIn">
                {/* Tenant Review */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Tenant Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Name</p>
                            <p className="text-gray-900 font-medium">{tenantData.name || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Type</p>
                            <p className="text-gray-900 font-medium capitalize">{tenantData.type}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Email</p>
                            <p className="text-gray-900 font-medium">{tenantData.contactEmail || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Phone</p>
                            <p className="text-gray-900 font-medium">{displayPhoneNumber(tenantData.contactPhoneNumber) || '-'}</p>
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Address</p>
                            <p className="text-gray-900 font-medium">
                                {tenantData.address?.lane}, {tenantData.address?.city}, {tenantData.address?.district}, {tenantData.address?.country}
                            </p>
                        </div>
                        {tenantData.description && (
                            <div className="md:col-span-2">
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Description</p>
                                <p className="text-gray-700">{tenantData.description}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Restaurant Review (if applicable) */}
                {tenantType === TenantType.STORE && restaurantData.name && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-green-600 p-2 rounded-lg">
                                <Store className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Store Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Name</p>
                                <p className="text-gray-900 font-medium">{restaurantData.name || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Email</p>
                                <p className="text-gray-900 font-medium">{restaurantData.contactEmail || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Phone</p>
                                <p className="text-gray-900 font-medium">{displayPhoneNumber(restaurantData.contactPhoneNumber) || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Address</p>
                                <p className="text-gray-900 font-medium">
                                    {restaurantData.address?.lane}, {restaurantData.address?.city}, {restaurantData.address?.district}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleModalClose}
            title="Create New Tenant"
            size="xl"
            footer={
                <div className="flex items-center justify-between w-full">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={currentStep === 0 || loading}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={handleModalClose} disabled={loading}>
                            Cancel
                        </Button>
                        {currentStep === steps.length - 1 ? (
                            <Button onClick={handleFinalSubmit} isLoading={loading}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Create Tenant
                            </Button>
                        ) : (
                            <Button disabled={isDisable} onClick={handleNext}>
                                Next
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                    </div>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Stepper Header */}
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = index === currentStep;
                        const isCompleted = index < currentStep;

                        return (
                            <div key={index} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                    <div
                                        className={`
                      w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                      ${isActive
                                                ? 'bg-blue-600 text-white shadow-lg scale-110'
                                                : isCompleted
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-200 text-gray-400'
                                            }
                    `}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle className="w-6 h-6" />
                                        ) : (
                                            <Icon className="w-6 h-6" />
                                        )}
                                    </div>
                                    <div className="mt-2 text-center">
                                        <p
                                            className={`text-sm font-semibold ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                                                }`}
                                        >
                                            {step.title}
                                        </p>
                                        <p className="text-xs text-gray-500 hidden md:block">{step.description}</p>
                                    </div>
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={`h-1 flex-1 mx-2 transition-all duration-300 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'
                                            }`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Step Content */}
                <div className="min-h-[400px] pt-6">
                    {renderStepContent()}
                </div>
            </div>
        </Modal>
    );
};

import { FC, useState, useEffect, useLayoutEffect } from 'react';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { TextArea } from '../components/TextArea';
import { CreateTenantRequest, Tenant } from '../features/platformTenants/types';
import { useForm } from 'react-hook-form';
import { Building2, Save } from 'lucide-react';
import { getAllDistricts, getCitiesByDistrict } from '../utils/sriLankaData';
import { isValidEmail, validateSriLankanPhoneNumber } from '../utils';

interface EditTenantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateTenantRequest) => void;
    tenant: Tenant;
    loading?: boolean;
}

export const EditTenantModal: FC<EditTenantModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    tenant,
    loading = false,
}) => {
    const [district, setDistrict] = useState(tenant.address?.district || '');
    const [city, setCity] = useState(tenant.address?.city || '');

    const { register, handleSubmit, setValue, watch, reset } = useForm<CreateTenantRequest>({
        defaultValues: {
            id: tenant.id,
            name: tenant.name,
            contactEmail: tenant.contactEmail,
            contactPhoneNumber: tenant.contactPhoneNumber,
            description: tenant.description,
            status: tenant.status,
            type: tenant.type,
            logo: tenant.logo || '',
            address: {
                lane: tenant.address?.lane || '',
                city: tenant.address?.city || '',
                district: tenant.address?.district || '',
                country: tenant.address?.country || 'Sri Lanka',
            },
        },
    });
    const isPhoneNumberValid = validateSriLankanPhoneNumber(watch('contactPhoneNumber'));
    const isEmailValid = isValidEmail(watch('contactEmail'));

    // Get available cities based on selected district
    const availableCities = district ? getCitiesByDistrict(district) : [];

    useLayoutEffect(() => {
        reset({
            id: tenant.id,
            name: tenant.name,
            contactEmail: tenant.contactEmail,
            contactPhoneNumber: tenant.contactPhoneNumber?.replace('+94', '0'),
            description: tenant.description,
            status: tenant.status,
            type: tenant.type,
            logo: tenant.logo || '',
            address: {
                ...tenant.address,
                district,
                city,
            },
        });
    }, [district, city, tenant]);

    // Reset city when district changes
    useEffect(() => {
        if (district !== tenant.address?.district) {
            setCity('');
            setValue('address.city', '');
        }
    }, [district, tenant.address?.district, setValue]);

    // Update form values when district/city changes
    useEffect(() => {
        setValue('address.district', district);
        setValue('address.city', city);
    }, [district, city, setValue]);

    const handleFormSubmit = (data: CreateTenantRequest) => {
        const normalizedData = {
            ...data,
            contactEmail: data.contactEmail?.toLowerCase(),
        };
        onSubmit(normalizedData as CreateTenantRequest);
    };

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

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Tenant"
            size="xl"
            footer={
                <div className="flex items-center justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit(handleFormSubmit)} isLoading={loading} disabled={!isPhoneNumberValid}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                    </Button>
                </div>
            }
        >
            <form className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Tenant Information</h3>
                        <p className="text-sm text-gray-500">Update tenant details and configuration</p>
                    </div>
                </div>

                {/* Basic Information */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Tenant Name"
                            placeholder="Enter tenant name"
                            {...register('name')}
                            required
                        />
                        <Input
                            label="Contact Email"
                            type="email"
                            placeholder="contact@example.com"
                            {...register('contactEmail')}
                            error={watch('contactEmail')?.length > 5 && !isEmailValid ? 'Invalid email format' : undefined}
                            required
                        />
                        <Input
                            label="Contact Phone"
                            type="tel"
                            placeholder="XX XXX XXXX"
                            prefix="+94"
                            onKeyDown={preventMinus}
                            {...register('contactPhoneNumber')}
                            error={watch('contactPhoneNumber')?.length > 9 && !isPhoneNumberValid ? 'Invalid phone number format' : undefined}
                            required
                        />
                        <Select
                            label="Status"
                            options={[
                                { value: 'active', label: 'Active' },
                                { value: 'inactive', label: 'Inactive' },
                            ]}
                            {...register('status')}
                            required
                        />
                        <Input
                            label="Logo URL"
                            placeholder="https://example.com/logo.png"
                            {...register('logo')}
                        />
                    </div>
                </div>

                {/* Address Information */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Address Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Input
                                label="Address Lane"
                                placeholder="123 Main Street"
                                {...register('address.lane')}
                                required
                            />
                        </div>
                        <Select
                            label="District"
                            options={[
                                { value: '', label: 'Select District' },
                                ...getAllDistricts().map(d => ({
                                    value: d,
                                    label: d,
                                })),
                            ]}
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            required
                        />
                        <Select
                            label="City"
                            options={[
                                { value: '', label: district ? 'Select City' : 'Select District First' },
                                ...availableCities.map(c => ({
                                    value: c,
                                    label: c,
                                })),
                            ]}
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            disabled={!district}
                            required
                        />
                        <Input
                            label="Country"
                            placeholder="Sri Lanka"
                            {...register('address.country')}
                            defaultValue="Sri Lanka"
                            disabled
                            required
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Additional Details</h4>
                    <TextArea
                        label="Description"
                        value={watch('description')}
                        placeholder="Brief description of the tenant"
                        {...register('description')}
                    />
                </div>
            </form>
        </Modal>
    );
};

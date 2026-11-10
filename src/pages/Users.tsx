import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Plus, Search, Shield, UserCog, ShoppingCart, BarChart3, Key, Copy, Check, RefreshCw, Eye, EyeOff, Send, MessageSquare } from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../app/store';
import { createUserRoleRequest, deleteUserRequest, fetchAllUserRoleRequest, fetchAllUsersByTenantRequest, increaseLimit, pagination, resetUserPasswordRequest, resetUserRoles, updateUserRoleRequest } from '../features/userRoles/userRolesSlice';
import { toast } from 'react-toastify';
import { AllUserRoleResponse, CreateUserRequest } from '../features/userRoles/types';
import { SubmitHandler, useForm } from 'react-hook-form';
import { TenantStatus, UserRole } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';
import Pagination from '../components/Pagination';
import { hexToRgba } from '../utils';
import StaffCard from '../components/StaffCard';
import { StaffTillLoginModal } from '../components/StaffTillLoginModal';

export const Users = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | string>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tillLoginUser, setTillLoginUser] = useState<AllUserRoleResponse | null>(null);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [userToReset, setUserToReset] = useState<AllUserRoleResponse | null>(null);
    const [tempPassword, setTempPassword] = useState('');
    const [showTempPassword, setShowTempPassword] = useState(false);
    const [resetStage, setResetStage] = useState<'configure' | 'success'>('configure');
    const [isResetting, setIsResetting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<AllUserRoleResponse | null>(null);

    const dispatch = useDispatch<AppDispatch>();
    const { user, primaryColor } = useAuth();

    const { data: filteredUsers, isCreateUserRole, isDeleteUser, limit, page, total, error } = useSelector((state: RootState) => state.userRole)
    const { tenants } = useSelector((state: RootState) => state.tenants)

    const { register, handleSubmit, reset, watch } = useForm<CreateUserRequest>({
        defaultValues: {
            name: "",
            email: "",
            password: "",
            phoneNumber: "",
            restaurantId: "",
            tenantId: ""
        },
    });

    const filterTenant = tenants.filter(i =>
        i.status === TenantStatus.ACTIVE
    ).map((tenant) => {
        return {
            value: tenant.id,
            label: tenant.name
        }
    });

    useLayoutEffect(() => {
        if (isCreateUserRole && isModalOpen) {
            handleCloseModal();
            dispatch(resetUserRoles())
        }
        if (isDeleteUser) {
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
            dispatch(resetUserRoles());
        }
    }, [isModalOpen, isCreateUserRole, isDeleteUser, error])

    useLayoutEffect(() => {
        if (user?.restaurantId) {
        }
        if (user?.role === UserRole.SUPER_ADMIN) {
            dispatch(fetchAllUserRoleRequest({ page: Number(page), limit: Number(limit) }))
        } else {
            dispatch(fetchAllUsersByTenantRequest({ page: Number(page), limit: Number(limit), tenantId: user!.tenantId, search: searchTerm }))
        }
    }, [dispatch, limit, page, searchTerm, user])

    const handleEdit = useCallback((user: AllUserRoleResponse) => {
        setSelectedUser(user);
        setIsModalOpen(true);
        reset({
            name: user.name,
            email: user.email,
            password: user.password,
            phoneNumber: user.phoneNumber,
            restaurantId: user.restaurantId,
            tenantId: user.tenantId,
            role: user.role,
            status: user.status,
            userId: user.id
        })
    }, [reset]);

    const handleAdd = () => {
        setSelectedUser(null);
        setIsModalOpen(true);
        reset({ name: "" })
    };

    const handleCreateUserRole: SubmitHandler<CreateUserRequest> = (data) => {
        if (!user?.restaurantId) {
            toast.error("Please choose the relevant store")
            return;
        }
        if (selectedUser) {
            dispatch(updateUserRoleRequest({ ...data, tenantId: user!.tenantId, restaurantId: user!.restaurantId }))
        } else {
            dispatch(createUserRoleRequest({ ...data, tenantId: user!.tenantId, restaurantId: user!.restaurantId }))
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    const handleChangePage = (_: unknown, newPage: number) => {
        dispatch(pagination(String(newPage + 1)))
    }

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        dispatch(increaseLimit(event.target.value))
    }

    const roleStats = [
        { role: UserRole.SUPER_ADMIN, count: filteredUsers.filter((u) => u.role === UserRole.SUPER_ADMIN).length, icon: Shield, label: 'Super Admin' },
        { role: UserRole.TENANT_ADMIN, count: filteredUsers.filter((u) => u.role === UserRole.TENANT_ADMIN).length, icon: Shield, label: 'Tenant Admin' },
        { role: UserRole.MANAGER, count: filteredUsers.filter((u) => u.role === UserRole.MANAGER).length, icon: UserCog, label: 'Manager' },
        { role: UserRole.CASHIER, count: filteredUsers.filter((u) => u.role === UserRole.CASHIER).length, icon: ShoppingCart, label: 'Cashier' },
    ];

    const filterUserRoleWise = useMemo(() => {
        if (roleFilter === 'all') return filteredUsers;
        return filteredUsers.filter(user => user.role === roleFilter);
    }, [filteredUsers, roleFilter]);

    const generateTempPassword = (name?: string) => {
        const clean = (name || 'Staff').split(' ')[0].replace(/[^a-zA-Z]/g, '') || 'Staff';
        const num = Math.floor(1000 + Math.random() * 9000);
        return `${clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase()}#${num}`;
    };

    const handleResetPassword = (user: AllUserRoleResponse) => {
        if (!user.tenantId || !user.id) {
            toast.error("User not found");
            return;
        }
        setUserToReset(user);
        setTempPassword(generateTempPassword(user.name));
        setShowTempPassword(false);
        setResetStage('configure');
        setCopied(false);
        setIsResetModalOpen(true);
    };

    const confirmResetPassword = async () => {
        if (userToReset && userToReset.tenantId && userToReset.id) {
            setIsResetting(true);
            try {
                dispatch(resetUserPasswordRequest({ 
                    tenantId: userToReset.tenantId, 
                    userId: userToReset.id,
                    newPassword: tempPassword
                }));
                setResetStage('success');
            } catch (err: any) {
                toast.error(err?.message || "Failed to reset password");
            } finally {
                setIsResetting(false);
            }
        }
    };

    const cancelResetPassword = () => {
        setIsResetModalOpen(false);
        setUserToReset(null);
        setResetStage('configure');
        setCopied(false);
    };

    const handleCopyCredentials = () => {
        if (!userToReset) return;
        const text = `🔐 Your POS Login Credentials\n👤 Name: ${userToReset.name}\n📧 Email: ${userToReset.email}\n🔑 Temporary Password: ${tempPassword}\n💼 Role: ${String(userToReset.role).toUpperCase()}\n🌐 Login: ${window.location.origin}/login`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Login credentials copied to clipboard!");
        setTimeout(() => setCopied(false), 3000);
    };

    const handleSendWhatsApp = () => {
        if (!userToReset) return;
        const text = `🔐 *Your POS Login Credentials*\n👤 Name: ${userToReset.name}\n📧 Email: ${userToReset.email}\n🔑 Temporary Password: ${tempPassword}\n💼 Role: ${String(userToReset.role).toUpperCase()}\n🌐 Login: ${window.location.origin}/login\n\nPlease log in and update your password upon sign in.`;
        const phone = (userToReset.phoneNumber || (userToReset as any).phone || '').replace(/\D/g, '');
        const url = phone 
            ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` 
            : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const handleDelete = (user: AllUserRoleResponse) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (userToDelete && userToDelete.tenantId && userToDelete.id && user?.restaurantId) {
            dispatch(deleteUserRequest({ tenantId: userToDelete.tenantId, userId: userToDelete.id, restaurantId: user!.restaurantId }));
        }
    };

    const cancelDelete = () => {
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
    };

    const isDisabled = watch('name').length <= 0 || watch('email').length <= 0 || watch('phoneNumber').length <= 0;

    return (
        <div className="space-y-6">
            <div className="flex-1 flex md:flex-row flex-col items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
                    <p className="text-sm text-gray-600">Manage staff members and their permissions</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto md:mt-0 mt-4">
                    <Button
                        className="flex-1 md:flex-initial"
                        variant="outline"
                        onClick={() => window.location.href = '/staff/analytics'}
                    >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Analytics
                    </Button>
                    <Button className="flex-1 md:flex-initial" onClick={handleAdd}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add User
                    </Button>
                </div>
            </div>

            {/* Role Stats Cards - Unified Design Pattern */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {roleStats.map((stat) => (
                    <div key={stat.role} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-lg bg-primary-50">
                                    <stat.icon className="w-5 h-5 text-primary-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-0.5">{stat.count}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>


            {/* Filters Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Search className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Staff Filters</h3>
                            <p className="text-sm text-gray-500">Refine your search results</p>
                        </div>
                    </div>
                    {/* Optional: Add clear filters button here if needed in layout */}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name, email or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-gray-50/50 focus:bg-white transition-all text-sm font-medium placeholder:text-gray-400"
                        />
                    </div>
                    <div className="relative">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-gray-50/50 focus:bg-white transition-all text-sm font-medium text-gray-700 cursor-pointer appearance-none"
                        >
                            <option value="all">All Roles</option>
                            <option value={UserRole.SUPER_ADMIN}>Admin (Super)</option>
                            <option value={UserRole.TENANT_ADMIN}>Tenant Admin</option>
                            <option value={UserRole.MANAGER}>Manager</option>
                            <option value={UserRole.CASHIER}>Cashier</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filterUserRoleWise.length}</span> of <span className="font-semibold text-gray-900">{total}</span> staff members
            </div>

            {filterUserRoleWise.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {filterUserRoleWise.map((user) => (
                        <StaffCard key={user.id} user={user} handleEdit={handleEdit} handleResetPassword={handleResetPassword} handleDelete={handleDelete} handleTillLogin={setTillLoginUser} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="p-4 bg-gray-50 rounded-full mb-4">
                        <UserCog className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No staff members found</h3>
                    <p className="text-gray-500 text-sm mb-6 max-w-sm text-center">
                        We couldn't find any staff members. Try adjusting your search query or filters.
                    </p>
                    <button
                        onClick={() => { setSearchTerm(''); setRoleFilter('all'); }}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            )}

            <Pagination
                page={page}
                limit={limit}
                total={total}
                handleChangePage={handleChangePage}
                handleChangeRowsPerPage={handleChangeRowsPerPage}
            />

            {tillLoginUser?.id && <StaffTillLoginModal userId={tillLoginUser.id} name={tillLoginUser.name ?? 'staff member'} onClose={() => setTillLoginUser(null)} />}

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={
                    <div className="flex items-center gap-3">
                        <div style={{ background: `linear-gradient(to bottom right, ${hexToRgba(primaryColor, 0.8)}, ${hexToRgba(primaryColor, 0.9)})` }} className="p-2 rounded-lg">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <span>{selectedUser ? 'Edit Staff Member' : 'Add New Staff Member'}</span>
                    </div>
                }
                size="lg"
                footer={
                    <div className="flex items-center justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={handleCloseModal}
                            className="hover:bg-gray-100"
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={isDisabled}
                            onClick={handleSubmit(handleCreateUserRole)}
                            className="shadow-lg"
                        >
                            {selectedUser ? '✓ Save Changes' : '+ Create Staff'}
                        </Button>
                    </div>
                }
            >
                <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Input
                                label="Full Name"
                                placeholder="John Doe"
                                {...register('name')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="john@example.com"
                                {...register('email')}
                            />
                        </div>
                        {!selectedUser && (
                            <div className="space-y-2">
                                <Input
                                    label="Password"
                                    isPassword
                                    placeholder="•••••••••••••"
                                    {...register('password')}
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Input
                                label="Phone Number"
                                type="tel"
                                placeholder="+94 XX XXX XXXX"
                                {...register('phoneNumber')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Select
                                label="Role"
                                options={[
                                    { value: UserRole.MANAGER, label: '👔 Manager' },
                                    { value: UserRole.CASHIER, label: '🛒 Cashier' },
                                ]}
                                {...register('role')}
                            />
                        </div>
                        {
                            user?.role === UserRole.SUPER_ADMIN && (
                                <div className="space-y-2">
                                    <Select
                                        label="Tenant"
                                        options={[
                                            { value: '', label: 'Select Tenant' },
                                            ...filterTenant,
                                        ]}
                                        {...register('tenantId')}
                                    />
                                </div>
                            )
                        }
                        {selectedUser && (
                            <div className="space-y-2">
                                <Select
                                    label="Status"
                                    options={[
                                        { value: 'active', label: '✓ Active' },
                                        { value: 'inactive', label: '✗ Inactive' },
                                    ]}
                                    {...register('status')}
                                />
                            </div>
                        )}
                    </div>
                </form>
            </Modal>

            {/* Password Reset Modal with 1-Click Copy & Direct WhatsApp Share */}
            <Modal
                isOpen={isResetModalOpen}
                onClose={cancelResetPassword}
                title={
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${resetStage === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {resetStage === 'success' ? <Check className="w-5 h-5" /> : <Key className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="font-extrabold text-base text-slate-900">
                                {resetStage === 'success' ? 'Password Reset & Ready to Send' : 'Reset Staff Password'}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                                {resetStage === 'success' ? 'Share credentials directly via WhatsApp or copy' : `Set a new password for ${userToReset?.name || 'Staff'}`}
                            </p>
                        </div>
                    </div>
                }
                size="md"
                footer={
                    resetStage === 'configure' ? (
                        <div className="flex items-center justify-end gap-3 w-full">
                            <Button
                                variant="ghost"
                                onClick={cancelResetPassword}
                                className="hover:bg-slate-100 font-bold text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmResetPassword}
                                isLoading={isResetting}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-200"
                            >
                                ⚡ Confirm & Set Password
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-end gap-3 w-full">
                            <Button
                                onClick={cancelResetPassword}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md"
                            >
                                Done
                            </Button>
                        </div>
                    )
                }
            >
                {resetStage === 'configure' ? (
                    <div className="py-2 space-y-4">
                        {/* User Summary Pill */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0">
                                    {userToReset?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-extrabold text-sm text-slate-800 truncate">{userToReset?.name}</p>
                                    <p className="text-xs text-slate-500 font-medium truncate">{userToReset?.email}</p>
                                </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-700">
                                {userToReset?.role}
                            </span>
                        </div>

                        {/* Password Configuration */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    New Temporary Password
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setTempPassword(generateTempPassword(userToReset?.name))}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    <span>Regenerate</span>
                                </button>
                            </div>

                            <div className="relative">
                                <input
                                    type={showTempPassword ? 'text' : 'password'}
                                    value={tempPassword}
                                    onChange={(e) => setTempPassword(e.target.value)}
                                    className="w-full pl-3.5 pr-20 py-2.5 text-sm font-mono font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-800"
                                    placeholder="Enter new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowTempPassword(prev => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
                                >
                                    {showTempPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Direct Sharing Notice */}
                        <div className="p-3 bg-amber-50 border border-amber-200/70 rounded-xl flex items-start gap-2.5">
                            <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                <strong className="font-bold">No email setup needed:</strong> Once you confirm, you can copy the login details or send them directly to this staff member via WhatsApp.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="py-2 space-y-4">
                        {/* Ready to Send Card */}
                        <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-md border border-slate-700 space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Staff Account</p>
                                    <p className="text-sm font-extrabold text-white">{userToReset?.name}</p>
                                </div>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-slate-700 text-slate-200">
                                    {userToReset?.role}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-2 text-xs">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Portal URL:</span>
                                    <p className="font-mono text-slate-300 text-xs truncate">{window.location.origin}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Login Email / Username:</span>
                                    <p className="font-mono text-white text-xs font-bold truncate">{userToReset?.email}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-amber-400 uppercase">New Password:</span>
                                    <div className="flex items-center justify-between mt-0.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                                        <p className="font-mono text-amber-400 font-bold text-sm">{tempPassword}</p>
                                        <button
                                            type="button"
                                            onClick={handleCopyCredentials}
                                            className="text-xs text-slate-300 hover:text-white inline-flex items-center gap-1"
                                        >
                                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                            <span className="text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Sharing Action Buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            <button
                                type="button"
                                onClick={handleCopyCredentials}
                                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border ${
                                    copied 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs' 
                                        : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300 shadow-xs active:scale-[0.98]'
                                }`}
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                                <span>{copied ? '✅ Credentials Copied!' : '📋 Copy Full Details'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleSendWhatsApp}
                                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 transition-all shadow-md shadow-emerald-200 active:scale-[0.98]"
                            >
                                <Send className="w-4 h-4 fill-white" />
                                <span>📲 Share on WhatsApp</span>
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* User Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={cancelDelete}
                title={
                    <div className="flex items-center gap-3 text-red-600">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <span>Confirm Delete User</span>
                    </div>
                }
                size="md"
                footer={
                    <div className="flex items-center justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={cancelDelete}
                            className="hover:bg-gray-100"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white border-none shadow-lg shadow-red-100"
                        >
                            Delete User
                        </Button>
                    </div>
                }
            >
                <div className="py-4">
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                        <div className="flex">
                            <div className="shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">
                                    This action is permanent and cannot be reversed.
                                </p>
                            </div>
                        </div>
                    </div>
                    <p className="text-gray-600">
                        Are you sure you want to delete the staff member <span className="font-bold text-gray-900">{userToDelete?.name}</span> ({userToDelete?.email})?
                    </p>
                    <p className="text-sm text-gray-500 mt-4 italic">
                        All access for this user will be immediately revoked.
                    </p>
                </div>
            </Modal>
        </div>
    );
};

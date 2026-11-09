import { MoreHorizontal, Mail, Phone, Calendar, Lock, Edit2, BarChart3, Trash } from "lucide-react"
import { FC, useState, useRef, useEffect } from "react"
import { AllUserRoleResponse } from "../features/userRoles/types"
import { UserRole } from "../utils/constants"
import { useNavigate } from "react-router-dom"

interface StaffCardProps {
    user: AllUserRoleResponse
    handleEdit: (user: AllUserRoleResponse) => void
    handleResetPassword: (user: AllUserRoleResponse) => void
    handleDelete: (user: AllUserRoleResponse) => void
}

const StaffCard: FC<StaffCardProps> = ({ user, handleEdit, handleResetPassword, handleDelete }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const roleConfig = {
        [UserRole.TENANT_ADMIN]: { label: 'Tenant Admin' },
        [UserRole.MANAGER]: { label: 'Manager' },
        [UserRole.CASHIER]: { label: 'Cashier' },
        'default': { label: user.role }
    };

    const config = roleConfig[user.role as keyof typeof roleConfig] || roleConfig['default'];

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col">
            <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img
                                src={user.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100'}
                                alt={user.name}
                                className="w-11 h-11 rounded-full object-cover border-2 border-gray-100"
                            />
                            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${user.status === 'active' ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm leading-tight">{user.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border bg-gray-50 text-gray-700 border-gray-200">
                                    {config.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    {user.role !== UserRole.TENANT_ADMIN && (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors focus:outline-none"
                            >
                                <MoreHorizontal className="w-5 h-5" />
                            </button>

                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-gray-100 rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 transition-all duration-200 transform opacity-100 scale-100">
                                    <div className="px-1 py-1">
                                        <button
                                            onClick={() => {
                                                handleEdit(user);
                                                setIsMenuOpen(false);
                                            }}
                                            className="group flex w-full items-center rounded-lg px-2 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                                        >
                                            <Edit2 className="mr-2 h-4 w-4" aria-hidden="true" />
                                            Edit Details
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleResetPassword(user);
                                                setIsMenuOpen(false);
                                            }}
                                            className="group flex w-full items-center rounded-lg px-2 py-2 text-sm font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-700"
                                        >
                                            <Lock className="mr-2 h-4 w-4" aria-hidden="true" />
                                            Reset Password
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleDelete(user);
                                                setIsMenuOpen(false);
                                            }}
                                            className="group flex w-full items-center rounded-lg px-2 py-2 text-sm font-medium text-red-700 hover:bg-red-50 hover:text-red-700"
                                        >
                                            <Trash className="mr-2 h-4 w-4" aria-hidden="true" />
                                            Delete User
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-2.5 pt-3">
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                        <div className="w-7 flex justify-center shrink-0">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        <span className="truncate font-medium">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                        <div className="w-7 flex justify-center shrink-0">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        <span className="font-medium">{user.phoneNumber || 'No phone'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                        <div className="w-7 flex justify-center shrink-0">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        <span className="font-medium">Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[10px] font-bold text-gray-500">
                <span className={user.status === 'active' ? 'text-gray-700' : 'text-gray-400'}>
                    {user.status === 'active' ? '● ACTIVE' : '● INACTIVE'}
                </span>
                <span>ID: #{user.id?.substring(0, 6) || 'N/A'}</span>
            </div>

            {/* View Performance Button */}
            {user.role !== UserRole.TENANT_ADMIN && (
                <div className="px-5 pb-4">
                    <button
                        onClick={() => navigate(`/staff/${user.id}`)}
                        className="w-full px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                        <BarChart3 className="w-4 h-4" />
                        View Performance
                    </button>
                </div>
            )}
        </div>
    )
}

export default StaffCard
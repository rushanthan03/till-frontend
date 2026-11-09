import { useCallback, useLayoutEffect, useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  Search,
  EyeIcon,
  Edit2,
  CheckCircle2,
  X,
  Filter,
  TrendingUp,
  Building2,
} from "lucide-react";
import { DataTable } from "../components/PlatformDataTable";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { StatusBadge } from "../components/StatusBadge";
import { useDispatch, useSelector } from "react-redux";
import { displayPhoneNumber, formatPhoneNumber } from '../utils';
import { AppDispatch, RootState } from "../app/store";
import {
  createTenantRequest,
  deleteTenantRequest,
  fetchAllTenantRequest,
  increaseLimit,
  pagination,
  updateTenantRequest,
} from "../features/platformTenants/tenantsSlice";
import { TenantStatus } from "../utils/constants";

import { CreateTenantRequest, Tenant } from "../features/platformTenants/types";
import { useNavigate } from "react-router-dom";
import { RouteLinks } from "../routers/type";

import { getCitiesByDistrict, getAllDistricts } from "../utils/sriLankaData";
import { AddTenantStepper } from '../components/AddTenantStepper';
import { EditTenantModal } from '../components/EditTenantModal';
import { RestaurantRequestResponse } from "../features/platformStores/types";

export const Tenants = () => {
  const navigation = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  // Get available cities based on selected district
  const availableCities = useMemo(() => {
    if (!districtFilter) return [];
    return getCitiesByDistrict(districtFilter);
  }, [districtFilter]);

  // Reset city when district changes
  const handleDistrictChange = (district: string) => {
    setDistrictFilter(district);
    setCityFilter(""); // Reset city when district changes
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setDistrictFilter("");
    setCityFilter("");
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>();

  const dispatch = useDispatch<AppDispatch>();

  const {
    data: filteredTenant,
    isCreateTenant,
    isDeleteTenant,
    loading,
    limit,
    page,
    total,
  } = useSelector((state: RootState) => state.platformTenants);

  const validateToasts = useCallback(() => {
    if (isCreateTenant || isDeleteTenant) {
      setIsModalOpen(false);
      setIsDeleteModalOpen(false);
    }
  }, [isCreateTenant, isDeleteTenant]);

  useLayoutEffect(() => {
    validateToasts();
  }, [validateToasts]);

  useLayoutEffect(() => {
    dispatch(
      fetchAllTenantRequest({
        page: Number(page),
        limit: Number(limit),
        search: searchTerm,
        status: statusFilter,
        city: cityFilter,
        district: districtFilter,
      })
    );
  }, [dispatch, searchTerm, page, limit, statusFilter, cityFilter, districtFilter]);

  const handleEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsModalOpen(true);
  };

  const handleNavigate = (tenant: Tenant) => {
    navigation(`${RouteLinks.TENANT}/${tenant.id}`);
  };

  const handleDelete = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsDeleteModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedTenant(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedTenant(null);
    setIsModalOpen(false);
    setIsDeleteModalOpen(false);
  };

  const handleAddTenant = async (tenantData: CreateTenantRequest, restaurantData?: RestaurantRequestResponse) => {
    if (selectedTenant) {
      // Update existing tenant
      dispatch(updateTenantRequest({ ...tenantData, id: selectedTenant.id }));
    } else {
      // Create new tenant
      dispatch(createTenantRequest({ tenant: tenantData, restaurant: restaurantData }));
    }
  };

  const handleEditTenant = (data: CreateTenantRequest) => {
    dispatch(updateTenantRequest({ ...data, contactPhoneNumber: formatPhoneNumber(data.contactPhoneNumber) }));
  };

  const handleUpdateStatusConfirm = () => {
    if (!selectedTenant) return;

    const {
      id,
      address,
      type,
      name,
      description,
      contactPhoneNumber,
      contactEmail,
      status,
    }: Tenant = selectedTenant;

    if (status === TenantStatus.ACTIVE) {
      dispatch(deleteTenantRequest(id));
      return;
    }
    dispatch(
      updateTenantRequest({
        id,
        address,
        type,
        name,
        description,
        contactPhoneNumber,
        contactEmail,
        status: TenantStatus.ACTIVE,
      })
    );
  };

  const handleChangePage = (
    _: React.MouseEvent<HTMLButtonElement, MouseEvent> | null,
    page: number
  ) => {
    dispatch(pagination(String(page)));
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    dispatch(increaseLimit(event.target.value));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tenant Management
          </h1>
          <p className="text-gray-600">
            Manage store owners and their linked stores.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Tenant
        </Button>
      </div>

      {/* Modern Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total tenants</p>
              <h3 className="text-3xl font-bold">{total}</h3>
            </div>
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Building2 className="w-8 h-8" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium mb-1">Active</p>
              <h3 className="text-3xl font-bold">{filteredTenant.filter(t => t.status === 'active').length}</h3>
            </div>
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium mb-1">Inactive</p>
              <h3 className="text-3xl font-bold">{filteredTenant.filter(t => t.status !== 'active').length}</h3>
            </div>
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Modern Filter Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {/* Filter Header */}
        <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Filter className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <p className="text-sm text-gray-500">Refine your search results</p>
              </div>
            </div>
            {(searchTerm || statusFilter || districtFilter || cityFilter) && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200 font-medium text-sm group"
              >
                <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 text-sm"
              />
            </div>

            {/* Status Select */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 text-sm appearance-none cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* District Select */}
            <div className="relative">
              <select
                value={districtFilter}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 text-sm appearance-none cursor-pointer"
              >
                <option value="">All Districts</option>
                {getAllDistricts().map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* City Select */}
            <div className="relative">
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                disabled={!districtFilter}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 text-sm appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{districtFilter ? "All Cities" : "Select District First"}</option>
                {availableCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {(searchTerm || statusFilter || districtFilter || cityFilter) && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-500 py-2">Active Filters:</span>
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium animate-fadeIn">
                  Search: {searchTerm}
                  <button onClick={() => setSearchTerm("")} className="hover:bg-blue-100 rounded p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {statusFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium animate-fadeIn">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter("")} className="hover:bg-green-100 rounded p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {districtFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium animate-fadeIn">
                  District: {districtFilter}
                  <button onClick={() => setDistrictFilter("")} className="hover:bg-purple-100 rounded p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {cityFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium animate-fadeIn">
                  City: {cityFilter}
                  <button onClick={() => setCityFilter("")} className="hover:bg-orange-100 rounded p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredTenant.length}</span> of <span className="font-semibold text-gray-900">{total}</span> tenants
          </p>
        </div>
      </div>

      <DataTable
        data={filteredTenant}
        height={460}

        isLoading={filteredTenant.length <= 0 && loading}
        columns={[
          {
            key: "name",
            label: "TENANT NAME",
            render: (tenant) => (
              <div>
                <div className="font-semibold text-gray-900">{tenant.name}</div>
              </div>
            ),
          },
          {
            key: "email",
            label: "EMAIL",
            render: (tenant) => (
              <div className="text-sm">
                <div>{tenant.contactEmail}</div>
              </div>
            ),
          },
          {
            key: "phonenumber",
            label: "PHONE",
            render: (tenant) => (
              <div className="text-sm">
                <div>{displayPhoneNumber(tenant.contactPhoneNumber)}</div>
              </div>
            ),
          },
          {
            key: "city",
            label: "CITY",
            render: (tenant) => (
              <div className="text-sm">
                <div>{tenant.address?.city}</div>
              </div>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (tenant) => (
              <StatusBadge status={tenant.status} type="subscription" />
            ),
          },
          {
            key: "actions",
            label: "Actions",
            width: "130px",
            render: (tenant) => (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(tenant)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" color="#2563eb" />
                </button>
                <button
                  onClick={() => handleNavigate(tenant)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <EyeIcon className="w-4 h-4" color="#2563eb" />
                </button>
                <button
                  onClick={() => handleDelete(tenant)}
                  className="p-1 hover:bg-red-50 rounded-lg transition-colors"
                >
                  {tenant.status === TenantStatus.ACTIVE ? (
                    <Trash2 className="w-4 h-4" color="#dc2626" />
                  ) : (
                    <CheckCircle2
                      className="w-5 h-5"
                      color="white"
                      fill="#22c55e"
                    />
                  )}
                </button>
              </div>
            ),
          },
        ]}

        total={total}
        page={page}
        handleChangePage={handleChangePage}
        limit={limit}
        handleChangeRowsPerPage={handleChangeRowsPerPage}
        emptyMessage={"No tenants found."}
      />

      <div >
      </div>

      {/* Modern Stepper Modal */}
      <AddTenantStepper
        isOpen={isModalOpen && !selectedTenant}
        onClose={handleCloseModal}
        onSubmit={handleAddTenant}
        loading={loading}
      />

      {/* Edit Tenant Modal */}
      {selectedTenant && (
        <EditTenantModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleEditTenant}
          tenant={selectedTenant}
          loading={loading}
        />
      )}

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModal}
        title={selectedTenant ? selectedTenant.name : ""}
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              style={{
                backgroundColor:
                  selectedTenant?.status === TenantStatus.ACTIVE
                    ? "#2563eb"
                    : "#0daa2a",
              }}
              onClick={handleUpdateStatusConfirm}
              isLoading={loading}
            >
              {selectedTenant?.status === TenantStatus.ACTIVE
                ? "Archive"
                : "Re-Active"}
            </Button>
          </div>
        }
      >
        <div>
          Are you sure you want to{" "}
          {selectedTenant?.status === TenantStatus.ACTIVE
            ? "archive"
            : "re-activate"}{" "}
          this tenant?
        </div>
      </Modal>
    </div>
  );
};

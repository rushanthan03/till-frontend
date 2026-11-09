import { MapPin, Store } from "lucide-react";
import { Input } from "../../components/Input";
import { RestaurantRequestResponse, Restaurant } from "../../features/stores/types";
import { getAllDistricts, getCitiesByDistrict } from "../../utils/sriLankaData";
import { Select } from "../../components/Select";

interface GenaralTabProps {
    restaurantState: RestaurantRequestResponse | null;
    restaurant: Restaurant | null;
    setRestaurantState: (restaurantState: RestaurantRequestResponse | null) => void;
}

function GenaralTab({ restaurantState, restaurant, setRestaurantState }: GenaralTabProps) {
    return <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-50 rounded-2xl shadow-sm">
                    <Store className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">General Information</h2>
                    <p className="text-sm text-gray-400 font-medium">Basic details of your store</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Store name" value={restaurantState?.name || restaurant?.name} onChange={(e) => setRestaurantState({ ...restaurantState, name: e.target.value })} />
                <Input label="Support Email" type="email" value={restaurantState?.contactEmail || restaurant?.contactEmail} onChange={(e) => setRestaurantState({ ...restaurantState, contactEmail: e.target.value })} />
                <Input label="Support Phone" type="tel" value={restaurantState?.contactPhoneNumber || restaurant?.contactPhoneNumber} onChange={(e) => setRestaurantState({ ...restaurantState, contactPhoneNumber: e.target.value })} />
            </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-emerald-50 rounded-2xl shadow-sm">
                    <MapPin className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Store address</h2>
                    <p className="text-sm text-gray-400 font-medium">Where customers can find you</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                    label="Street Address / Lane"
                    placeholder="123 Main Street"
                    value={restaurantState?.address?.lane ?? ""}
                    onChange={(e) => setRestaurantState({
                        ...restaurantState,
                        address: { ...restaurantState?.address, lane: e.target.value }
                    })} />
                <Select
                    label="District"
                    options={[
                        { value: '', label: 'Select District' },
                        ...getAllDistricts().map(district => ({
                            value: district,
                            label: district,
                        })),
                    ]}
                    value={restaurantState?.address?.district}
                    onChange={(e) => setRestaurantState({
                        ...restaurantState,
                        address: { ...restaurantState?.address, district: e.target.value }
                    })} />
                <Select
                    label="City"
                    options={[
                        { value: '', label: restaurantState?.address?.district ? 'Select City' : 'Select District First' },
                        ...getCitiesByDistrict(restaurantState?.address?.district ?? "").map(city => ({
                            value: city,
                            label: city,
                        })),
                    ]}
                    value={restaurantState?.address?.city}
                    disabled={!restaurantState?.address?.district}
                    required
                    onChange={(e) => setRestaurantState({
                        ...restaurantState,
                        address: { ...restaurantState?.address, city: e.target.value }
                    })} />
                <Input
                    label="Country"
                    placeholder="Sri Lanka"
                    value={restaurantState?.address?.country ?? ""}
                    onChange={(e) => setRestaurantState({
                        ...restaurantState,
                        address: { ...restaurantState?.address, country: e.target.value }
                    })} />
            </div>
        </div>
    </div>;
}

export default GenaralTab;

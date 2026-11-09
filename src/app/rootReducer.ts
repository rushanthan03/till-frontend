import { combineReducers } from "@reduxjs/toolkit";
import platformTenantsReducer from "../features/platformTenants/tenantsSlice";
import platformRestaurantReducer from "../features/platformStores/storesSlice";

import platformUserRoleReducer from "../features/platformUserRoles/userRolesSlice";
import tenantsReducer from "../features/tenants/tenantsSlice";
import authReducer from '../features/auth/authSilce'
import restaurantReducer from '../features/stores/storesSlice'
import userRoleReducer from '../features/userRoles/userRolesSlice'

import staffReducer from "../features/staff/staffSlice";

const rootReducer = combineReducers({
    auth: authReducer,
    tenants: tenantsReducer,
    platformTenants: platformTenantsReducer,
    platformRestaurant: platformRestaurantReducer,
    platformUserRole: platformUserRoleReducer,
    restaurant: restaurantReducer,
    userRole: userRoleReducer,
    staff: staffReducer,
})

const tempRootReducer = (state: any, action: { type: string; }) => {
    if (action.type === 'LOGOUT') {
        // 🔥 resets ALL reducers to initial state
        state = undefined;
    }

    return tempRootReducer(state, action);
};

export default rootReducer
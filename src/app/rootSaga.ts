import { all, fork } from "redux-saga/effects";
import { watchAuthSaga } from "../features/auth/authSaga";
import { watchUserFoleSaga } from "../features/userRoles/userRolesSaga";
import { watchRestaurantSaga } from "../features/stores/storesSaga";
import staffSaga from "../features/staff/staffSaga";

import { watchTenantsSaga as watchPlatformTenantsSaga } from "../features/platformTenants/tenantsSaga";
import { watchRestaurantSaga as watchPlatformRestaurantSaga } from "../features/platformStores/storesSaga";
import { watchUserFoleSaga as watchPlatformUserRoleSaga } from "../features/platformUserRoles/userRolesSaga";


export default function* rootSaga() {
        yield all([
                fork(watchAuthSaga),
                fork(watchPlatformTenantsSaga),
                fork(watchPlatformRestaurantSaga),
                fork(watchPlatformUserRoleSaga),
                fork(watchUserFoleSaga),
                fork(watchRestaurantSaga),
                fork(staffSaga),
        ])
}
import axiosClient from "../../api/axiosClient"
import { AuthCredentials, AuthResponse, LogOutResponse } from "./types";

const authAPI = {
    login: (credentials: AuthCredentials) => axiosClient.post<AuthResponse>("/api/auth/login", credentials),
    logout: () => axiosClient.post<LogOutResponse>("/api/auth/logout")
}

export default authAPI;
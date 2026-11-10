import axiosClient from "../../api/axiosClient"
import { AuthCredentials, AuthResponse, LogOutResponse, isPinLogin } from "./types";

const authAPI = {
    login: (credentials: AuthCredentials) => axiosClient.post<AuthResponse>(isPinLogin(credentials) ? "/api/auth/pin-login" : "/api/auth/login", credentials),
    logout: () => axiosClient.post<LogOutResponse>("/api/auth/logout")
}

export default authAPI;
export const tokenStorage = {
    setTokens(accessToken: string, refreshToken: string) {
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);
    },
    getAccessToken(): string | null {
        return localStorage.getItem("access_token");
    },
    getRefreshToken(): string | null {
        return localStorage.getItem("refresh_token");
    },
    remove() {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("currentUser");
    },
}
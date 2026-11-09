export const handleApiError = (error: any): string => {
    if (!error) return "An unknown error occurred.";
    if (typeof error === 'string') return error;

    // Axios error response
    if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') return data;
        if (Array.isArray(data.message) && data.message.length > 0) return String(data.message[0]);
        if (typeof data.message === 'string') return data.message;
        if (typeof data.error === 'string') return data.error;
        if (typeof data.detail === 'string') return data.detail;
    }

    if (error.request && !error.response) {
        return "No response from server. Please check your network connection.";
    }

    if (typeof error.message === 'string') {
        return error.message;
    }

    if (error.message && typeof error.message.message === 'string') {
        return error.message.message;
    }

    if (Array.isArray(error.message?.message) && error.message.message.length > 0) {
        return String(error.message.message[0]);
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "An error occurred. Please try again.";
};
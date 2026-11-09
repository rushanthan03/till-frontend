
export const formatPhoneNumber = (phoneNumber: string): string => {
    if (!phoneNumber) return '';

    let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');

    if (cleaned.startsWith('+94')) {
        return cleaned;
    }

    if (cleaned.startsWith('94')) {
        return '+' + cleaned;
    }
    if (cleaned.startsWith('0')) {
        return '+94' + cleaned.substring(1);
    }

    return '+94' + cleaned;
};

export const displayPhoneNumber = (phoneNumber: string): string => {
    if (!phoneNumber) return '';

    const formatted = formatPhoneNumber(phoneNumber);

    if (formatted.length === 12 && formatted.startsWith('+94')) {
        return `${formatted.substring(0, 3)} ${formatted.substring(3, 5)} ${formatted.substring(5, 8)} ${formatted.substring(8)}`;
    }

    return formatted;
};

export const validateSriLankanPhoneNumber = (phoneNumber: string): boolean => {
    if (!phoneNumber) return false;

    if (phoneNumber.trim().startsWith("-")) return false;

    const formatted = formatPhoneNumber(phoneNumber);

    const regex = /^\+94\d{9}$/;

    return regex.test(formatted);
};

export const removeCountryCode = (phoneNumber: string): string => {
    if (!phoneNumber) return '';

    const formatted = formatPhoneNumber(phoneNumber);

    if (formatted.startsWith('+94')) {
        return '0' + formatted.substring(3);
    }

    return phoneNumber;
};

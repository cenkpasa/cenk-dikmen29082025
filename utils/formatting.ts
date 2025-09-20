
import { Offer } from '@/types';

type Currency = Offer['currency'];

export const formatCurrency = (amount: number, currency: Currency): string => {
    if (typeof amount !== 'number') {
        amount = 0;
    }
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: currency,
    }).format(amount);
};

export const formatDate = (isoString?: string): string => {
    if (!isoString) return '';
    try {
        return new Date(isoString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return 'Invalid Date';
    }
};

export const formatDateTime = (isoString?: string): string => {
    if (!isoString) return '';
    try {
        return new Date(isoString).toLocaleString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return 'Invalid Date';
    }
};

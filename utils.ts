
// Fix: Switched to direct submodule imports for date-fns to resolve module export errors.
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
// Fix: Use direct import for locale to prevent type errors.
import de from 'date-fns/locale/de';

export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
};

export const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Kein Datum';
    try {
        // Fix: Casting locale to any to bypass strict type check for locale object properties
        return format(parseISO(dateString), 'dd. MMMM yyyy', { locale: de as any });
    } catch (error) {
        console.warn(`Ungültiger Datumsstring für formatDate: ${dateString}`, error);
        return 'Ungültiges Datum';
    }
};

/**
 * Triggers a short vibration feedback on supported devices.
 * Patterns: 'light' (default), 'medium', 'heavy', 'success', 'error'
 */
export const triggerHapticFeedback = (pattern: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
            switch (pattern) {
                case 'light': navigator.vibrate(10); break;
                case 'medium': navigator.vibrate(25); break;
                case 'heavy': navigator.vibrate(50); break;
                case 'success': navigator.vibrate([10, 30, 10]); break;
                case 'error': navigator.vibrate([50, 100, 50, 100]); break;
            }
        } catch (e) {
            // Silently fail if vibration is blocked or unsupported
        }
    }
};

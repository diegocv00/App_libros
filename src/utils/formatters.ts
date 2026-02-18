/**
 * Formats a number as currency with thousands separators.
 * Example: 1000 -> $1,000.00
 */
export function formatCurrency(value: number | string): string {
    const numeric = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numeric)) return '$0';

    // Formats with dot as thousands separator: 94900 -> 94.900
    const formatted = Math.floor(numeric).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `$${formatted}`;
}

/**
 * Removes all non-numeric characters except for the decimal separator if needed.
 * For dots as thousands, we strip all non-digits.
 */
export function cleanPrice(value: string): string {
    return value.replace(/\D/g, "");
}

/**
 * Formats a raw string of numbers with dots every thousands.
 */
export function formatInputPrice(value: string): string {
    const raw = cleanPrice(value);
    if (!raw) return "";
    return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

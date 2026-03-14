/**
 * Input sanitization utilities
 * Strips potentially dangerous HTML/script content from user inputs
 */

/**
 * Sanitize a string by removing HTML tags and trimming whitespace.
 * Prevents basic XSS attacks when user input is reflected in the UI.
 */
export function sanitize(input: string): string {
    if (!input || typeof input !== 'string') return '';

    return input
        // Remove HTML tags
        .replace(/<[^>]*>/g, '')
        // Remove script-related attributes
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        // Remove javascript: protocol
        .replace(/javascript\s*:/gi, '')
        // Remove data: protocol (except data:image which is safe)
        .replace(/data\s*:(?!image\/)/gi, '')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Sanitize an object's string values recursively.
 * Useful for sanitizing form data before sending to API.
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const result = { ...obj };
    for (const key in result) {
        if (typeof result[key] === 'string') {
            (result as any)[key] = sanitize(result[key]);
        } else if (typeof result[key] === 'object' && result[key] !== null) {
            (result as any)[key] = sanitizeObject(result[key]);
        }
    }
    return result;
}

/**
 * Validate and sanitize an email address.
 */
export function sanitizeEmail(email: string): string {
    const cleaned = sanitize(email).toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleaned)) return '';
    return cleaned;
}

/**
 * Escape HTML entities for safe display.
 */
export function escapeHtml(str: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return str.replace(/[&<>"']/g, (m) => map[m]);
}

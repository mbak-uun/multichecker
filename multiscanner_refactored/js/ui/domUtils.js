import { getFromLocalStorage, saveToLocalStorage } from '../storage.js';

/**
 * Creates a hoverable link.
 * @param {string} url - The URL for the link.
 * @param {string} text - The text to display.
 * @param {string} [className=''] - Optional CSS class.
 * @returns {string} HTML string for the anchor tag.
 */
export function createHoverLink(url, text, className = '') {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="hover-link ${className}" title="${url}">${text}</a>`;
}

/**
 * Ensures a URL is safe and has a fallback.
 * @param {string} u - The URL to check.
 * @param {string} fallback - The fallback URL.
 * @returns {string} The original URL or the fallback.
 */
export function safeUrl(u, fallback) {
    return (u && typeof u === 'string' && /^https?:\/\//i.test(u)) ? u : fallback;
}

/**
 * Creates a styled link for deposit/withdraw status.
 * @param {boolean} flag - The status flag (true for active).
 * @param {string} label - The label ('DP' or 'WD').
 * @param {string} urlOk - The URL to use if the status is active.
 * @param {string} [colorOk='green'] - The color for the active status.
 * @returns {string} HTML string.
 */
export function linkifyStatus(flag, label, urlOk, colorOk = 'green') {
    if (flag === true) return `<a href="${urlOk}" target="_blank" class="uk-text-bold" style="color:${colorOk};">${label}</a>`;
    if (flag === false) return `<span style="color:red; font-weight:bold;">${label === 'DP' ? 'DX' : 'WX'}</span>`;
    return `<span style="color:black; font-weight:bold;">${label.replace('P', '-')}</span>`;
}

/**
 * Gets a styled status label.
 * @param {boolean} flag - The status flag.
 * @param {string} type - The label type.
 * @returns {string} HTML string.
 */
export function getStatusLabel(flag, type) {
    if (flag === true) return `<b style="color:green; font-weight:bold;">${type}</b>`;
    if (flag === false) return `<b style="color:red; font-weight:bold;">${type.replace('P', 'X')}</b>`;
    return `<b style="color:black; font-weight:bold;">${type.replace('P', '-')}</b>`;
}

/**
 * Converts a hex color to an RGBA color.
 * @param {string} hex - The hex color string.
 * @param {number} alpha - The alpha transparency value.
 * @returns {string} The RGBA color string.
 */
export function hexToRgba(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Formats a price value for display, handling very small numbers.
 * @param {number} price - The price to format.
 * @returns {string} The formatted price string.
 */
export function formatPrice(price) {
    if (price >= 1) {
        return price.toFixed(3) + '$';
    }

    let strPrice = price.toFixed(20).replace(/0+$/, '');
    let match = strPrice.match(/0\.(0*)(\d+)/);

    if (match) {
        let zeroCount = match[1].length;
        let significant = match[2].substring(0, 4);
        significant = significant.padEnd(4, '0');

        if (zeroCount >= 2) {
            return `0.{${zeroCount}}${significant}$`;
        } else {
            return `0.${match[1]}${significant}$`;
        }
    }

    return price.toFixed(6) + '$';
}

/**
 * Creates a simple link.
 * @param {string} url - The URL.
 * @param {string} text - The display text.
 * @param {string} [className=''] - Optional CSS class.
 * @returns {string} HTML string for the anchor tag.
 */
export function createLink(url, text, className = '') {
    return url
        ? `<a href="${url}" target="_blank" class="${className}"><b>${text}</b></a>`
        : `<b>${text}</b>`;
}

/**
 * Disables all form inputs on the page.
 */
export function form_off() {
    $('input, select, textarea, button').prop('disabled', true);
}

/**
 * Enables all form inputs on the page.
 */
export function form_on() {
    $('input, select, button').prop('disabled', false);
}

/**
 * Updates the dark mode icon based on the current mode.
 * @param {boolean} isDark - Whether dark mode is active.
 */
export function updateDarkIcon(isDark) {
    const icon = document.querySelector('#darkModeToggle');
    if (icon) {
        const iconName = isDark ? 'sun' : 'moon';
        // Uikit 3 uses uk-icon attribute for icons
        icon.setAttribute("uk-icon", `icon: ${iconName}`);
    }
}

/**
 * Toggles dark mode on/off.
 */
export function toggleDarkMode() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    body.classList.toggle('uk-dark');

    const isDark = body.classList.contains('dark-mode');
    saveToLocalStorage("DARK_MODE", isDark);
    updateDarkIcon(isDark);
}

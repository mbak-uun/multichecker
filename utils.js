/**
 * A collection of utility functions for general purpose tasks.
 */
export const Utils = {
    /**
     * Generates a formatted timestamp string.
     * e.g., "09:28:37 | 15/08/2025"
     * @returns {string} The formatted timestamp.
     */
    getCurrentTimestamp() {
        const now = new Date();

        const pad = (num) => String(num).padStart(2, '0');

        const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        const date = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

        return `${time} | ${date}`;
    },

    /**
     * Formats a number, for example, by adding commas as thousand separators.
     * This is a simple implementation.
     * @param {number} num - The number to format.
     * @returns {string} The formatted number string.
     */
    formatNumber(num) {
        if (num === null || num === undefined) {
            return '';
        }
        return num.toLocaleString('en-US');
    },

    /**
     * A simple delay function using Promises.
     * @param {number} ms - The delay in milliseconds.
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

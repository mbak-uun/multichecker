/**
 * A wrapper for window.localStorage to handle JSON serialization automatically.
 */
export const Storage = {
    /**
     * Retrieves an item from localStorage and parses it as JSON.
     * @param {string} key - The key of the item to retrieve.
     * @param {*} [defaultValue=null] - The default value to return if the key doesn't exist or data is invalid.
     * @returns {*} The retrieved and parsed data, or the defaultValue.
     */
    get(key, defaultValue = null) {
        try {
            const item = window.localStorage.getItem(key);
            // If item is null or undefined, return default value
            if (item === null || item === undefined) {
                return defaultValue;
            }
            // If item is just a string, it might not be JSON. We try to parse.
            // If it fails, we assume it's a raw string and return it.
            try {
                return JSON.parse(item);
            } catch (e) {
                return item; // Return as is if it's not valid JSON
            }
        } catch (error) {
            console.error(`Error reading from localStorage for key "${key}":`, error);
            return defaultValue;
        }
    },

    /**
     * Saves an item to localStorage, converting it to a JSON string.
     * @param {string} key - The key under which to store the value.
     * @param {*} value - The value to store. It will be JSON.stringified.
     */
    set(key, value) {
        try {
            if (value === undefined) {
                window.localStorage.removeItem(key);
            } else {
                const stringValue = JSON.stringify(value);
                window.localStorage.setItem(key, stringValue);
            }
        } catch (error) {
            console.error(`Error writing to localStorage for key "${key}":`, error);
        }
    },

    /**
     * Removes an item from localStorage.
     * @param {string} key - The key of the item to remove.
     */
    remove(key) {
        try {
            window.localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing from localStorage for key "${key}":`, error);
        }
    }
};

// Note: The storagePrefix constant will need to be defined globally or passed in.
// For now, this is a placeholder. It will be resolved when wiring everything together.
const storagePrefix = "MULTISCANNER_";

/**
 * Gets an item from localStorage and parses it as JSON.
 * @param {string} key The key of the item to retrieve.
 * @param {*} defaultValue The default value to return if the key is not found or parsing fails.
 * @returns {*} The retrieved and parsed item, or the default value.
 */
function getFromLocalStorage(key, defaultValue) {
    try {
        const raw = localStorage.getItem(storagePrefix + key);
        if (raw === null || raw === undefined) {
            return defaultValue;
        }
        return JSON.parse(raw);
    } catch (e) {
        console.error(`Failed to parse localStorage item with key "${key}":`, e);
        return defaultValue;
    }
}

/**
 * Saves a value to localStorage after serializing it to JSON.
 * @param {string} key The key under which to store the value.
 * @param {*} value The value to store.
 */
function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(storagePrefix + key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error saving data to localStorage with key "${key}":`, error);
        if (error.name === "QuotaExceededError") {
            toastr.error("Browser memory is full! Not enough space to save data.");
        } else {
            toastr.error("An unexpected error occurred while saving data.");
        }
    }
}

/**
 * Removes an item from localStorage.
 * @param {string} key The key of the item to remove.
 */
function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(storagePrefix + key);
    } catch (e) {
        console.error(`Failed to remove localStorage item with key "${key}":`, e);
    }
}

// --- API Key Management ---

const API_KEYS_STORAGE_KEY = 'MULTISCANNER_API_KEYS';

/**
 * Retrieves API keys from localStorage.
 * @returns {object} The stored API keys.
 */
function getApiKeys() {
    try {
        const storedKeys = localStorage.getItem(API_KEYS_STORAGE_KEY);
        return storedKeys ? JSON.parse(storedKeys) : {};
    } catch (e) {
        console.error("Failed to parse API keys from localStorage:", e);
        return {};
    }
}

/**
 * Saves API keys to localStorage.
 * @param {object} apiKeys - The API keys object to save.
 */
function saveApiKeys(apiKeys) {
    try {
        localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(apiKeys));
        console.log("API Keys saved successfully.");
    } catch (e) {
        console.error("Failed to save API keys to localStorage:", e);
        toastr.error("Could not save API keys. Storage might be full.");
    }
}

/**
 * Gets a random API key for OKX DEX from the hardcoded list.
 * This is kept for backward compatibility but should ideally be user-configurable.
 * @returns {object|null}
 */
// Default public keys for OKX DEX. Should be user-configurable in the future.
const apiKeysOKXDEX = [
    { ApiKeyOKX: "28bc65f0-8cd1-4ecb-9b53-14d84a75814b", secretKeyOKX: "E8C92510E44400D8A709FBF140AABEC1", PassphraseOKX: "Regi!#007" },
    { ApiKeyOKX: "04f923ec-98f2-4e60-bed3-b8f2d419c773", secretKeyOKX: "3D7D0BD3D985C8147F70592DF6BE3C48", PassphraseOKX: "Regi!#007" },
    // ... more keys
];

function getRandomApiKeyOKX() {
    if (apiKeysOKXDEX && apiKeysOKXDEX.length > 0) {
        const randomIndex = Math.floor(Math.random() * apiKeysOKXDEX.length);
        return apiKeysOKXDEX[randomIndex];
    }
    return null;
}

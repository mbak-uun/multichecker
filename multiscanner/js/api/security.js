/**
 * This module handles security-related functions, such as API call signing and key management.
 */

// This list of API keys for OKX DEX is kept for backward compatibility.
// In a real-world scenario, these should be managed via a secure vault or user input.
const apiKeysOKXDEX = [
    { ApiKeyOKX: "28bc65f0-8cd1-4ecb-9b53-14d84a75814b", secretKeyOKX: "E8C92510E44400D8A709FBF140AABEC1", PassphraseOKX: "Regi!#007" },
    { ApiKeyOKX: "04f923ec-98f2-4e60-bed3-b8f2d419c773", secretKeyOKX: "3D7D0BD3D985C8147F70592DF6BE3C48", PassphraseOKX: "Regi!#007" },
    { ApiKeyOKX: "cf214e57-8af2-42bf-8afa-3b7880c5a152", secretKeyOKX: "26AA1E415682BD8BBDF44A9B1CFF4759", PassphraseOKX: "Regi!#007" },
    // ... (the rest of the keys from the original config)
    { ApiKeyOKX: "08af14cb-2f97-472c-90cd-fefd2103f253", secretKeyOKX: "FFC78575E3961D11BF134C8DE9CBE7F8", PassphraseOKX: "Regi!#007" },
];

/**
 * Returns a random API key set from the hardcoded list for OKX DEX.
 * @returns {object} An object containing ApiKeyOKX, secretKeyOKX, and PassphraseOKX.
 */
function getRandomApiKeyOKX() {
    const randomIndex = Math.floor(Math.random() * apiKeysOKXDEX.length);
    return apiKeysOKXDEX[randomIndex];
}

/**
 * Calculates a signature for an API request based on the exchange's requirements.
 * @param {string} exchange The name of the exchange (e.g., "BINANCE", "MEXC").
 * @param {string} apiSecret The user's API secret.
 * @param {string} dataToSign The string data to be signed.
 * @param {string} [hashMethod="HmacSHA256"] The hashing method to use.
 * @returns {string|null} The calculated signature or null if the exchange is not supported.
 */
function calculateSignature(exchange, apiSecret, dataToSign, hashMethod = "HmacSHA256") {
    if (!apiSecret || !dataToSign) {
        console.error(`[${exchange}] API Secret or Data for Signature is invalid!`);
        return null;
    }

    // Ensure CryptoJS is available
    if (typeof CryptoJS === 'undefined') {
        console.error("CryptoJS library is not loaded. Cannot calculate signature.");
        return null;
    }

    switch (exchange.toUpperCase()) {
        case "MEXC":
        case "BINANCE":
        case "KUCOIN": // Assuming KUCOIN uses the same method
        case "BYBIT":  // Assuming BYBIT uses the same method
            return CryptoJS[hashMethod](dataToSign, apiSecret).toString(CryptoJS.enc.Hex);

        case "OKX":
            const hmac = CryptoJS.HmacSHA256(dataToSign, apiSecret);
            return CryptoJS.enc.Base64.stringify(hmac);

        default:
            console.error(`[${exchange}] Exchange not supported for signature calculation.`);
            return null;
    }
}

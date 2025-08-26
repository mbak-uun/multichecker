/**
 * Application State Management
 * This module holds the shared state of the application.
 */

// Holds the main application settings, loaded from localStorage.
let AppSettings = {};

// Holds the raw token data, loaded from localStorage.
let TokenData = [];

// Holds the currently displayed/filtered tokens after processing.
let FilteredTokens = [];

// Holds the original, unfiltered list of tokens for the current session.
let OriginalTokens = [];

// Holds the price of USDT in IDR.
let RateUSDT_IDR = 0;

// Holds the gas fee data for all supported chains.
let GasFeeData = [];

// A flag to control the main scanning loop.
let isScanning = false;

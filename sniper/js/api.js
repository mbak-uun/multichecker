// This file contains the API logic for the sniper application.
// It has been refactored to use modular CEX and DEX handlers.

// --- Shared Utility Functions ---

function getRandomApiKeyOKX() {
    const apiKeys = getApiKeys();
    const okxKey = apiKeys['OKXDEX'];
    if (!okxKey) return null;
    return { ApiKeyOKX: okxKey.key, secretKeyOKX: okxKey.secret, PassphraseOKX: okxKey.passphrase };
}

function calculateSignature(exchange, apiSecret, dataToSign, hashMethod = "HmacSHA256") { /* ... */ }
function processOrderBook(data) { /* ... */ }
function getFeeSwap(chainName) { /* ... */ }
function generateDexLink(dex, chainName, codeChain, nameToken, sc_input, namePair, sc_output) { /* ... */ }


// --- CEX Price Fetching (Modular) ---
function getPriceCEX(coins, nameToken, namePair, cex, callback) {
    const apiKeys = getApiKeys();
    const cexKeyData = apiKeys[cex.toUpperCase()];
    // Although keys are not used for public endpoints, we check for them to ensure user has configured the app.
    if (!cexKeyData) return callback(`API Key for ${cex} not found. Please add it in the API Key Manager.`, null);

    const config = window.CEX_MODULES[cex.toUpperCase()];
    if (!config) return callback(`Exchange module for ${cex} not found.`, null);

    const settings = getSettings();
    const jedaCex = settings?.JedaCexs?.[cex] || 0;
    const feeList = getTokens(); // Using new state management
    const tokenData = feeList.find(item => item.symbol_in === nameToken && item.symbol_out === namePair && item.cex === cex);
    const isStablecoin = (token) => ["USDT", "DAI", "USDC", "FDUSD"].includes(token);

    let results = {};
    const urls = [
        isStablecoin(nameToken) ? null : config.url({ symbol: nameToken, apiKey: cexKeyData }),
        isStablecoin(namePair) ? null : config.url({ symbol: namePair, apiKey: cexKeyData })
    ];

    const processFinalResult = () => {
        if (Object.keys(results).length < 2) return;
        // ... (rest of the processing logic is the same)
    };

    urls.forEach((url, index) => {
        const currentTokenName = index === 0 ? nameToken : namePair;
        if (isStablecoin(currentTokenName)) {
            results[currentTokenName] = { price_sell: 1, price_buy: 1, volumes_sell: [], volumes_buy: [] };
            processFinalResult();
            return;
        }
        if (url) {
            setTimeout(() => {
                $.ajax({
                    url: url, method: 'GET',
                    success: (data) => {
                        const processedData = config.processData(data);
                        // ... (rest of success handler is the same)
                        results[currentTokenName] = { /*...*/ };
                        processFinalResult();
                    },
                    error: (xhr) => callback(`API Error for ${currentTokenName}: ${xhr.statusText}`, null)
                });
            }, jedaCex);
        }
    });
}


// --- DEX Price Fetching (Modular & Decoupled) ---
function getPriceDEX(params, callback) {
    // ... (this function is already clean)
}

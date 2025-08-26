// --- Shared Utility Functions ---

function processOrderBook(data) {
    const bids = data.bids || data.buy || [];
    const asks = data.asks || data.sell || [];
    const priceBuy = bids.slice(0, 3).map(([p, v]) => ({ price: parseFloat(p), volume: parseFloat(p) * parseFloat(v) })).reverse();
    const priceSell = asks.slice(0, 3).map(([p, v]) => ({ price: parseFloat(p), volume: parseFloat(p) * parseFloat(v) })).reverse();
    return { priceBuy, priceSell };
}

function convertIDRtoUSDT(idrAmount) {
    const rateUSDT = getFromLocalStorage("PRICE_RATE_USDT", 0);
    if (!rateUSDT || rateUSDT === 0) return 0;
    return parseFloat((idrAmount / rateUSDT).toFixed(8));
}

function getFeeSwap(chainName) {
    const allGasData = getFromLocalStorage("ALL_GAS_FEES", []);
    const gasInfo = allGasData.find(g => g.chain.toLowerCase() === chainName.toLowerCase());
    if (!gasInfo) return 0;
    const chainConfig = CONFIG_CHAINS[chainName.toLowerCase()];
    if (!chainConfig) return 0;
    const gasLimit = parseFloat(chainConfig.GASLIMIT || 250000);
    return ((parseFloat(gasInfo.gwei) * gasLimit) / 1e9) * parseFloat(gasInfo.tokenPrice);
}

function calculateSignature(exchange, apiSecret, dataToSign, hashMethod = "HmacSHA256") {
    if (!apiSecret || !dataToSign) return null;
    switch (exchange.toUpperCase()) {
        case "MEXC":
        case "BINANCE":
            return CryptoJS[hashMethod](dataToSign, apiSecret).toString(CryptoJS.enc.Hex);
        case "OKX":
            return CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(dataToSign, apiSecret));
        default:
            return null;
    }
}

// --- CEX Price Fetching (Modular) ---
function getPriceCEX(coins, NameToken, NamePair, cex, callback) {
    const config = window.CEX_MODULES[cex.toUpperCase()];
    if (!config) return callback(`Exchange module for ${cex} not found.`, null);

    const settings = getFromLocalStorage("SETTING_SCANNER", {});
    const jedaCex = settings?.JedaCexs?.[cex] || 0;
    const isStablecoin = (token) => stablecoins.includes(token);
    let results = {};

    const urls = [
        isStablecoin(NameToken) ? null : config.url({ symbol: NameToken }),
        isStablecoin(NamePair) ? null : config.url({ symbol: NamePair })
    ];

    const processFinalResult = () => {
        if (Object.keys(results).length !== 2) return;
        // ... (rest of the logic from original scanner.js)
        callback(null, finalResult);
    };

    urls.forEach((url, index) => {
        const tokenName = index === 0 ? NameToken : NamePair;
        if (isStablecoin(tokenName)) {
            results[tokenName] = { price_sell: 1, price_buy: 1, volumes_sell: [], volumes_buy: [] };
            processFinalResult();
            return;
        }
        if (url) {
            setTimeout(() => {
                $.ajax({
                    url: url,
                    method: 'GET',
                    success: (data) => {
                        results[tokenName] = config.processData(data);
                        processFinalResult();
                    },
                    error: (xhr) => callback(`API Error for ${tokenName}: ${xhr.statusText}`, null)
                });
            }, jedaCex);
        }
    });
}


// --- DEX Price Fetching (Modular) ---
function getPriceDEX(params, callback) {
    const { sc_input_in, des_input, sc_output_in, des_output, amount_in, dexType, chainName, chainCode, action, walletAddress } = params;
    const dexKey = dexType.toUpperCase() === '0X' ? '0X' : dexType.toUpperCase();
    const dexModule = window.DEX_MODULES[dexKey];

    if (!dexModule || typeof dexModule.fetchPrice !== 'function') {
        return callback({ message: `DEX module for ${dexType} not found.` }, null);
    }
    const sc_input = sc_input_in.toLowerCase();
    const sc_output = sc_output_in.toLowerCase();
    const bigIntAmount = BigInt(Math.round(Math.pow(10, des_input) * amount_in));
    dexModule.fetchPrice(sc_input, des_input, sc_output, des_output, bigIntAmount, chainName, chainCode, action, walletAddress, callback);
}

// --- CEX Wallet Status ---
async function checkAllCEXWallets() {
    // ... (Implementation to be added later)
}

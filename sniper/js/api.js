// This file contains the API logic for the sniper application.
// It has been refactored to use modular CEX and DEX handlers.

// --- Shared Utility Functions ---

function getRandomApiKeyOKX() {
    const apiKeys = getApiKeys();
    const okxKey = apiKeys['OKXDEX'];
    if (!okxKey) return null;
    return { ApiKeyOKX: okxKey.key, secretKeyOKX: okxKey.secret, PassphraseOKX: okxKey.passphrase };
}

function calculateSignature(exchange, apiSecret, dataToSign, hashMethod = "HmacSHA256") {
    if (!apiSecret || !dataToSign) {
        console.error(`[${exchange}] API Secret atau Data untuk Signature tidak valid!`);
        return null;
    }
    switch (exchange.toUpperCase()) {
        case "MEXC":
        case "BINANCE":
        case "KUCOIN":
        case "BYBIT":
            return CryptoJS[hashMethod](dataToSign, apiSecret).toString(CryptoJS.enc.Hex);
        case "OKX":
            return CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(dataToSign, apiSecret));
        default:
            console.error(`[${exchange}] Exchange tidak didukung untuk perhitungan signature.`);
            return null;
    }
}

function processOrderBook(data) {
    const bids = data.bids || [];
    const asks = data.asks || [];
    const priceBuy = bids.slice(0, 3).map(([p, v]) => ({ price: parseFloat(p), volume: parseFloat(p) * parseFloat(v) })).reverse();
    const priceSell = asks.slice(0, 3).map(([p, v]) => ({ price: parseFloat(p), volume: parseFloat(p) * parseFloat(v) })).reverse();
    return { priceBuy, priceSell };
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

function generateDexLink(dex, chainName, codeChain, nameToken, sc_input, namePair, sc_output) {
    const links = {
        'kyberswap': `https://kyberswap.com/swap/${chainName}/${sc_input}-to-${sc_output}`,
        'odos': `https://app.odos.xyz`,
        '0x': `https://matcha.xyz/tokens/${codeChain}/${sc_input.toLowerCase()}?buyAddress=${sc_output.toLowerCase()}`,
        '1inch': `https://app.1inch.io/advanced/swap?network=${codeChain}&src=${sc_input}&dst=${sc_output}`,
        'okx': `https://www.okx.com/web3/dex-swap?inputChain=${codeChain}&inputCurrency=${sc_input}&outputCurrency=${sc_output}`,
        'jupiter': `https://jup.ag/swap/${sc_input}-${sc_output}`,
        'lifi': `https://jumper.exchange/?fromChain=${codeChain}&fromToken=${sc_input}&toChain=${codeChain}&toToken=${sc_output}`,
    };
    return links[dex.toLowerCase()] || '#';
}

// --- CEX Price Fetching (Modular) ---
function getPriceCEX(coins, nameToken, namePair, cex, callback) {
    const apiKeys = getApiKeys();
    const cexKeyData = apiKeys[cex.toUpperCase()];
    if (!cexKeyData && (cex.toUpperCase() === 'BINANCE' || cex.toUpperCase() === 'MEXC' || cex.toUpperCase() === 'GATE')) {
         return callback(`API Key for ${cex} not found. Please add it in the API Key Manager.`, null);
    }

    const config = window.CEX_MODULES[cex.toUpperCase()];
    if (!config) return callback(`Exchange module for ${cex} not found.`, null);

    const settings = getSettings();
    const jedaCex = settings?.JedaCexs?.[cex] || 0;
    const feeList = getTokens();
    const tokenData = feeList.find(item => item.symbol_in === nameToken && item.symbol_out === namePair && item.cex === cex);
    const isStablecoin = (token) => ["USDT", "DAI", "USDC", "FDUSD"].includes(token);

    let results = {};
    const urls = [
        isStablecoin(nameToken) ? null : config.url({ symbol: nameToken, apiKey: cexKeyData }),
        isStablecoin(namePair) ? null : config.url({ symbol: namePair, apiKey: cexKeyData })
    ];

    const processFinalResult = () => {
        if (Object.keys(results).length < 2) return;

        const priceBuyToken = results[nameToken]?.price_buy || 0;
        const priceBuyPair = results[namePair]?.price_buy || 0;
        const feeWDToken = (tokenData && tokenData.feeWDToken) ? parseFloat(tokenData.feeWDToken) * priceBuyToken : 0;
        const feeWDPair = (tokenData && tokenData.feeWDPair) ? parseFloat(tokenData.feeWDPair) * priceBuyPair : 0;

        const finalResult = {
            token: nameToken.toUpperCase(), pair: namePair.toUpperCase(), cex: cex.toUpperCase(),
            price_sellToken: results[nameToken]?.price_sell || 0, price_buyToken,
            price_sellPair: results[namePair]?.price_sell || 0, price_buyPair,
            volumes_sellToken: results[nameToken]?.volumes_sell || [], volumes_buyToken: results[nameToken]?.volumes_buy || [],
            volumes_sellPair: results[namePair]?.volumes_sell || [], volumes_buyPair: results[namePair]?.volumes_buy || [],
            feeWDToken, feeWDPair, chainName: coins.chain,
        };
        if (typeof updateTableVolCEX === 'function') updateTableVolCEX(finalResult, cex);
        callback(null, finalResult);
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
                        try {
                            const processedData = config.processData(data);
                            const isIndodax = cex.toLowerCase() === "indodax";
                            const priceBuy = isIndodax ? (processedData?.priceSell?.[2]?.price || 0) : ((processedData?.priceBuy || []).sort((a,b)=>b.price-a.price)[2]?.price || 0);
                            const priceSell = isIndodax ? (processedData?.priceBuy?.[2]?.price || 0) : ((processedData?.priceSell || []).sort((a,b)=>a.price-b.price)[2]?.price || 0);
                            results[currentTokenName] = { price_sell: priceSell, price_buy: priceBuy, volumes_sell: processedData?.priceBuy || [], volumes_buy: processedData?.priceSell || [] };
                            processFinalResult();
                        } catch(e) {
                             callback(`Error processing CEX data for ${currentTokenName}: ${e.message}`, null)
                        }
                    },
                    error: (xhr) => callback(`API Error for ${currentTokenName}: ${xhr.statusText}`, null)
                });
            }, jedaCex);
        }
    });
}


// --- DEX Price Fetching (Modular & Decoupled) ---
function getPriceDEX(params, callback) {
    const { sc_input_in, des_input, sc_output_in, des_output, amount_in, dexType, chainName, chainCode, action } = params;

    const dexKey = dexType.toUpperCase() === '0X' ? '0X' : dexType.toUpperCase();
    const dexModule = window.DEX_MODULES[dexKey];

    if (!dexModule || typeof dexModule.fetchPrice !== 'function') {
        return callback({ message: `DEX module for ${dexType} not found or invalid.` }, null);
    }

    const sc_input = sc_input_in.toLowerCase();
    const sc_output = sc_output_in.toLowerCase();
    const bigIntAmount = BigInt(Math.round(Math.pow(10, des_input) * amount_in));
    const walletAddress = getSettings().walletMeta;

    dexModule.fetchPrice(sc_input, des_input, sc_output, des_output, bigIntAmount, chainName, chainCode, action, walletAddress, callback);
}

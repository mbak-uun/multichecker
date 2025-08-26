/**
 * API Manager
 * This module centralizes all external API interactions.
 */

// =================================================================================
// CEX Wallet Status Checkers
// =================================================================================

async function fetchBinance() {
    const { ApiKey, ApiSecret } = CONFIG_CEX.BINANCE;
    const timestamp = Date.now().toString();
    const queryString = `timestamp=${timestamp}`;
    const signature = calculateSignature("BINANCE", ApiSecret, queryString, "HmacSHA256");
    const url = `https://proxykanan.awokawok.workers.dev/?https://api-gcp.binance.com/sapi/v1/capital/config/getall?${queryString}&signature=${signature}`;

    const response = await $.ajax({ url, headers: { "X-MBX-ApiKey": ApiKey }, method: "GET" });

    const result = [];
    for (const item of response) {
        if (!item.trading || !Array.isArray(item.networkList)) continue;
        for (const net of item.networkList) {
            result.push({
                cex: "BINANCE",
                tokenName: item.coin,
                chain: net.network,
                feeWDs: parseFloat(net.withdrawFee || 0),
                depositEnable: !!net.depositEnable,
                withdrawEnable: !!net.withdrawEnable
            });
        }
    }
    return result;
}

async function fetchMexc() {
    const { ApiKey, ApiSecret } = CONFIG_CEX.MEXC;
    const timestamp = Date.now();
    const queryString = `recvWindow=5000&timestamp=${timestamp}`;
    const signature = calculateSignature("MEXC", ApiSecret, queryString);
    const url = `https://proxykiri.awokawok.workers.dev/?https://api.mexc.com/api/v3/capital/config/getall?${queryString}&signature=${signature}`;

    const response = await $.ajax({ url, headers: { "X-MEXC-APIKEY": ApiKey }, method: "GET" });

    const result = [];
    for (const item of response) {
        if (!Array.isArray(item.networkList)) continue;
        for (const net of item.networkList) {
            result.push({
                cex: "MEXC",
                tokenName: item.coin,
                chain: net.netWork,
                feeWDs: parseFloat(net.withdrawFee || 0),
                depositEnable: !!net.depositEnable,
                withdrawEnable: !!net.withdrawEnable
            });
        }
    }
    return result;
}

async function fetchGate() {
    const { ApiKey, ApiSecret } = CONFIG_CEX.GATE;
    const host = "https://cors-anywhere.herokuapp.com/https://api.gateio.ws";
    const timestamp = Math.floor(Date.now() / 1000);
    const method = "GET";
    const prefix = "/api/v4";

    const buildSignature = (url, body) => {
        const bodyHash = CryptoJS.SHA512(body).toString(CryptoJS.enc.Hex);
        const signString = `${method}\\n${prefix}${url}\\n\\n${bodyHash}\\n${timestamp}`;
        return CryptoJS.HmacSHA512(signString, ApiSecret).toString(CryptoJS.enc.Hex);
    };

    const headers = { KEY: ApiKey, SIGN: buildSignature("/wallet/withdraw_status", ""), Timestamp: timestamp };

    const wdData = await $.ajax({ url: `${host}${prefix}/wallet/withdraw_status`, method, headers });
    const statusData = await $.ajax({ url: `${host}${prefix}/spot/currencies`, method, headers });

    const result = [];
    for (const item of statusData) {
        if (!Array.isArray(item.chains)) continue;
        for (const chain of item.chains) {
            const feeItem = wdData.find(f =>
                f.currency?.toUpperCase() === item.currency?.toUpperCase() &&
                f.withdraw_fix_on_chains &&
                f.withdraw_fix_on_chains[chain.name]
            );
            result.push({
                cex: "GATE",
                tokenName: item.currency,
                chain: chain.name,
                feeWDs: feeItem ? parseFloat(feeItem.withdraw_fix_on_chains[chain.name]) : 0,
                depositEnable: !chain.deposit_disabled,
                withdrawEnable: !chain.withdraw_disabled
            });
        }
    }
    return result;
}


async function checkAllCEXWallets() {
    // This function now orchestrates the fetching and updating process.
    // It depends on UI functions like infoSet/infoAdd and state management,
    // which will be handled by the main.js module.

    console.log('🚀 === STARTING CEX WALLET CHECK ===');

    const cexFetchers = {
        'BINANCE': fetchBinance,
        'MEXC': fetchMexc,
        'GATE': fetchGate,
        // 'INDODAX': fetchIndodax, // Assuming fetchIndodax will be created
    };

    const selectedCexes = AppSettings.FilterCEXs || Object.keys(CONFIG_CEX);
    const fetchJobs = [];

    selectedCexes.forEach(cexKey => {
        if (cexFetchers[cexKey]) {
            fetchJobs.push(cexFetchers[cexKey]());
        }
    });

    if (fetchJobs.length === 0) {
        console.warn('No valid CEX fetchers found for the selected exchanges.');
        return;
    }

    try {
        const results = await Promise.all(fetchJobs);
        let allWalletData = {};
        results.forEach((cexResult, index) => {
            const cexName = selectedCexes[index];
            allWalletData[cexName] = cexResult;
        });

        // Update the main TokenData in the state
        const updatedTokens = TokenData.map(token => {
            const updatedDataCexs = { ...(token.dataCexs || {}) };
            (token.selectedCexs || []).forEach(cexKey => {
                const walletList = allWalletData[cexKey] || [];

                const updateForSymbol = (symbol, isTokenIn) => {
                    const match = walletList.find(w => w.tokenName.toUpperCase() === symbol.toUpperCase());
                    if (match) {
                        if (isTokenIn) {
                            updatedDataCexs[cexKey].feeWDToken = match.feeWDs;
                            updatedDataCexs[cexKey].depositToken = match.depositEnable;
                            updatedDataCexs[cexKey].withdrawToken = match.withdrawEnable;
                        } else {
                            updatedDataCexs[cexKey].feeWDPair = match.feeWDs;
                            updatedDataCexs[cexKey].depositPair = match.depositEnable;
                            updatedDataCexs[cexKey].withdrawPair = match.withdrawEnable;
                        }
                    }
                };
                if (token.symbol_in) updateForSymbol(token.symbol_in, true);
                if (token.symbol_out) updateForSymbol(token.symbol_out, false);
            });
            return { ...token, dataCexs: updatedDataCexs };
        });

        TokenData = updatedTokens;
        saveToLocalStorage('TOKEN_SCANNER', TokenData);
        console.log('✅ CEX wallet data updated and saved.');
        alert('✅ CEX wallet data updated successfully!');

    } catch (error) {
        console.error('❌ Failed to fetch or process CEX wallet data:', error);
        alert('❌ Failed to update CEX wallet data. Check console for details.');
    }
}


// =================================================================================
// Price Fetching Stubs
// =================================================================================

/**
 * Fetches order book data from a CEX.
 * The actual implementation will be in the respective /js/cex/ module.
 * @param {object} token The token object from the main data list.
 * @param {string} symbol The symbol to fetch.
 * @param {string} pair The pair to fetch.
 * @param {string} cex The CEX name.
 * @param {function} callback The callback function.
 */
function getPriceCEX(token, symbol, pair, cex, callback) {
    // This will be a dispatcher to the correct CEX module function.
    // e.g., switch(cex) { case 'BINANCE': return fetchBinancePrice(...) }
    console.log(`Dispatching getPriceCEX for ${cex}`);
}

/**
 * Fetches swap price data from a DEX.
 * The actual implementation will be in the respective /js/dex/ module.
 */
function getPriceDEX(sc_input, des_input, sc_output, des_output, amount_in, price, dextype, Name_in, Name_out, cex, nameChain, codeChain, trx, callback) {
    // This will be a dispatcher to the correct DEX module function.
    console.log(`Dispatching getPriceDEX for ${dextype}`);
}

/**
 * Fetches the gas fee for all configured chains.
 */
async function feeGasGwei() {
    // Implementation to be moved here from the original index.html
    console.log('Fetching gas fees...');
}

/**
 * Fetches the USDT to IDR conversion rate.
 */
function getRateUSDT() {
    // Implementation to be moved here from the original index.html
    console.log('Fetching USDT rate...');
}

/**
 * LIFI DEX module.
 * This module fetches quotes via different aggregators based on the transaction direction,
 * similar to the 1inch module's logic in the original code.
 */

/**
 * Fetches a swap quote using the Marble API (LIFI).
 * This is used for the 'TokentoPair' direction.
 * @param {object} params The parameters for the swap quote.
 * @returns {Promise<object>} A promise that resolves to the processed quote data.
 */
async function fetchLifiViaMarble(params) {
    const { chainCode, sc_input, sc_output, amount_in, des_output } = params;
    const url = "https://api-v1.marbleland.io/api/v1/jumper/api/p/lifi/advanced/routes";
    const requestData = {
        fromAmount: amount_in.toString(),
        fromChainId: chainCode,
        fromTokenAddress: sc_input,
        toChainId: chainCode,
        toTokenAddress: sc_output,
        options: {
            integrator: "swap.marbleland.io",
            order: "CHEAPEST",
            maxPriceImpact: 0.4,
            allowSwitchChain: false,
            bridges: {
                deny: ["hop", "cbridge", "optimism", "arbitrum", "across", "omni", "celercircle", "allbridge", "thorswap", "symbiosis", "squid", "mayan", "mayanWH", "mayanMCTP", "relay", "polygon", "glacis", "stargateV2", "stargateV2Bus", "chainflip"]
            }
        }
    };

    const response = await $.ajax({ url, method: 'POST', data: JSON.stringify(requestData), contentType: 'application/json' });
    const routes = response.routes || [];
    let bestQuote = null;
    let bestAmount = 0;
    for (const route of routes) {
        if (route?.toAmount) {
            const amount = parseFloat(route.toAmount);
            if (amount > bestAmount) {
                bestAmount = amount;
                bestQuote = route;
            }
        }
    }
    if (!bestQuote) throw new Error("No suitable LIFI route found in Marble response");

    return {
        dexTitle: `${bestQuote.steps?.[0]?.tool || "LIFI"} via Marble`,
        amount_out: bestAmount / Math.pow(10, des_output),
        FeeSwap: parseFloat(bestQuote.gasCostUSD) || 0,
    };
}

/**
 * Fetches a swap quote using the DZAP API.
 * This is used for the 'PairtoToken' direction.
 * @param {object} params The parameters for the swap quote.
 * @returns {Promise<object>} A promise that resolves to the processed quote data.
 */
async function fetchLifiViaDzap(params) {
    const { chainCode, sc_input, des_input, sc_output, des_output, amount_in } = params;
    const url = "https://api.dzap.io/v1/quotes";
    const requestData = {
        account: AppSettings.walletMeta || '0x0000000000000000000000000000000000000000',
        fromChain: chainCode,
        integratorId: 'dzap',
        notAllowedSources: [], // Allow all sources
        data: [{
            amount: amount_in.toString(),
            srcToken: sc_input,
            srcDecimals: des_input,
            destToken: sc_output,
            destDecimals: des_output,
            slippage: 0.3,
            toChain: chainCode
        }]
    };

    const response = await $.ajax({ url, method: 'POST', data: JSON.stringify(requestData), contentType: 'application/json' });
    const key = Object.keys(response)[0];
    const quoteSources = response[key]?.quoteRates;
    let bestQuote = null;
    let bestAmount = 0;
    for (const data of Object.values(quoteSources || {})) {
        if (data?.destAmount) {
            const amount = parseFloat(data.destAmount);
            if (amount > bestAmount) {
                bestAmount = amount;
                bestQuote = data;
            }
        }
    }
    if (!bestQuote) throw new Error("No suitable quote found in DZAP response");

    return {
        dexTitle: `${response[key]?.recommendedSource || "LIFI"} via DZAP`,
        amount_out: bestAmount / Math.pow(10, des_output),
        FeeSwap: parseFloat(bestQuote?.fee?.gasFee?.[0]?.amountUSD) || 0,
    };
}


/**
 * Main quote function for LIFI, dispatched based on transaction direction.
 * @param {object} params The parameters for the swap quote.
 * @param {string} params.action The direction of the swap ('TokentoPair' or 'PairtoToken').
 * @returns {Promise<object>} A promise that resolves to the quote data.
 */
async function fetchLifiQuote(params) {
    try {
        if (params.action === "TokentoPair") {
            return await fetchLifiViaMarble(params);
        } else if (params.action === "PairtoToken") {
            return await fetchLifiViaDzap(params);
        } else {
            throw new Error(`Unsupported action for LIFI: ${params.action}`);
        }
    } catch (error) {
        console.error("Error fetching LIFI quote:", error.responseJSON?.message || error.statusText || error);
        throw new Error(`LIFI API Error: ${error.responseJSON?.message || 'Failed to fetch quote'}`);
    }
}

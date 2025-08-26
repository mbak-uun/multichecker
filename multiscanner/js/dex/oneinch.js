/**
 * 1inch DEX module.
 * Fetches swap quotes from 1inch via different aggregators.
 */

/**
 * Fetches a swap quote using the DZAP API (LIFI).
 * @param {object} params The parameters for the swap quote.
 * @returns {Promise<object>} A promise that resolves to the processed quote data.
 */
async function fetch1inchViaDzap(params) {
    const { chainCode, sc_input, des_input, sc_output, des_output, amount_in } = params;
    const url = "https://api.dzap.io/v1/quotes";
    const requestData = {
        account: AppSettings.walletMeta || '0x0000000000000000000000000000000000000000',
        fromChain: chainCode,
        integratorId: 'dzap',
        allowedSources: ["oneInchViaLifi"],
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
    const quoteData = response[key]?.quoteRates?.oneInchViaLifi;
    if (!quoteData) throw new Error("1inch quote not found in DZAP response");

    return {
        dexTitle: "1inch via DZAP",
        amount_out: parseFloat(quoteData.destAmount) / Math.pow(10, des_output),
        FeeSwap: parseFloat(quoteData.fee?.gasFee?.[0]?.amountUSD) || 0,
    };
}

/**
 * Fetches a swap quote using the Marble API (LIFI).
 * @param {object} params The parameters for the swap quote.
 * @returns {Promise<object>} A promise that resolves to the processed quote data.
 */
async function fetch1inchViaMarble(params) {
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
            exchanges: { allow: ["1inch"] }
        }
    };

    const response = await $.ajax({ url, method: 'POST', data: JSON.stringify(requestData), contentType: 'application/json' });
    const quoteData = response.routes?.[0];
    if (!quoteData) throw new Error("1inch route not found in Marble response");

    return {
        dexTitle: "1inch via Marble",
        amount_out: parseFloat(quoteData.toAmount) / Math.pow(10, des_output),
        FeeSwap: parseFloat(quoteData.gasCostUSD) || 0,
    };
}

/**
 * Main quote function for 1inch, dispatched based on transaction direction.
 * @param {object} params The parameters for the swap quote.
 * @param {string} params.action The direction of the swap ('TokentoPair' or 'PairtoToken').
 * @returns {Promise<object>} A promise that resolves to the quote data.
 */
async function fetch1inchQuote(params) {
    try {
        if (params.action === "TokentoPair") {
            return await fetch1inchViaDzap(params);
        } else if (params.action === "PairtoToken") {
            return await fetch1inchViaMarble(params);
        } else {
            throw new Error(`Unsupported action for 1inch: ${params.action}`);
        }
    } catch (error) {
        console.error("Error fetching 1inch quote:", error.responseJSON?.message || error.statusText || error);
        throw new Error(`1inch API Error: ${error.responseJSON?.message || 'Failed to fetch quote'}`);
    }
}

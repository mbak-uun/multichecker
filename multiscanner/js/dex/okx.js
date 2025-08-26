/**
 * OKX DEX module.
 * Fetches swap quotes from the OKX API.
 */

/**
 * Fetches a swap quote from the OKX API.
 * @param {object} params The parameters for the swap quote.
 * @returns {Promise<object>} A promise that resolves to the processed quote data.
 */
async function fetchOkxQuote({ chainCode, sc_input, sc_output, amount_in, des_output, chainName }) {
    const selectedApiKey = getRandomApiKeyOKX(); // From security.js
    const timestamp = new Date().toISOString();
    const method = "GET";
    const path = "/api/v5/dex/aggregator/quote";
    const queryParams = `amount=${amount_in}&chainIndex=${chainCode}&fromTokenAddress=${sc_input}&toTokenAddress=${sc_output}`;
    const dataToSign = timestamp + method + path + "?" + queryParams;
    const signature = calculateSignature("OKX", selectedApiKey.secretKeyOKX, dataToSign);

    const url = `https://web3.okx.com${path}?${queryParams}`;
    const headers = {
        "OK-ACCESS-KEY": selectedApiKey.ApiKeyOKX,
        "OK-ACCESS-SIGN": signature,
        "OK-ACCESS-PASSPHRASE": selectedApiKey.PassphraseOKX,
        "OK-ACCESS-TIMESTAMP": timestamp,
        "Content-Type": "application/json"
    };

    try {
        const response = await $.ajax({
            url: url,
            method: 'GET',
            headers: headers
        });

        if (!response.data || !response.data[0] || !response.data[0].toTokenAmount) {
            throw new Error("Invalid response structure from OKX API");
        }

        const amount_out = parseFloat(response.data[0].toTokenAmount) / Math.pow(10, des_output);
        const feeSwap = getFeeSwap(chainName);

        return {
            dexTitle: "OKX DEX",
            amount_out,
            FeeSwap: feeSwap,
        };

    } catch (error) {
        const errorMessage = error.responseJSON?.msg || error.statusText || "Unknown API error";
        console.error("Error fetching OKX quote:", errorMessage);
        throw new Error(`OKX API Error: ${errorMessage}`);
    }
}

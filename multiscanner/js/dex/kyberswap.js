/**
 * KyberSwap DEX module.
 * Fetches swap quotes from KyberSwap.
 */

/**
 * Fetches a swap quote from KyberSwap.
 * @param {object} params The parameters for the swap quote.
 * @param {string} params.chainName The name of the chain (e.g., "polygon").
 * @param {string} params.sc_input The input token contract address.
 * @param {string} params.sc_output The output token contract address.
 * @param {BigInt} params.amount_in The input amount in wei.
 * @param {number} params.des_output The decimals of the output token.
 * @returns {Promise<object>} A promise that resolves to the processed quote data.
 */
async function fetchKyberSwapQuote({ chainName, sc_input, sc_output, amount_in, des_output }) {
    const network = chainName.toLowerCase() === "avax" ? "avalanche" : chainName.toLowerCase();
    const url = `https://aggregator-api.kyberswap.com/${network}/api/v1/routes?tokenIn=${sc_input}&tokenOut=${sc_output}&amountIn=${amount_in}&gasInclude=true`;

    try {
        const response = await $.ajax({
            url: url,
            method: 'GET'
        });

        if (!response.data || !response.data.routeSummary) {
            throw new Error("Invalid response structure from KyberSwap API");
        }

        const { routeSummary } = response.data;
        const amount_out = parseFloat(routeSummary.amountOut) / Math.pow(10, des_output);
        const feeSwap = parseFloat(routeSummary.gasUsd) || 0;

        return {
            dexTitle: "KyberSwap",
            amount_out,
            FeeSwap: feeSwap,
        };

    } catch (error) {
        const errorMessage = error.responseJSON?.message || error.statusText || "Unknown API error";
        console.error("Error fetching KyberSwap quote:", errorMessage);
        throw new Error(`KyberSwap API Error: ${errorMessage}`);
    }
}

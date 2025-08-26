/**
 * Odos DEX module.
 * Fetches swap quotes from the Odos API.
 */

/**
 * Fetches a swap quote from the Odos API (v2 or v3).
 * @param {object} params The parameters for the swap quote.
 * @param {string} params.chainCode The ID of the chain.
 * @param {string} params.sc_input The input token contract address.
 * @param {BigInt} params.amount_in The input amount in wei.
 * @param {string} params.sc_output The output token contract address.
 * @param {number} params.des_output The decimals of the output token.
 * @param {string} params.action The direction of the swap ('TokentoPair' or 'PairtoToken').
 * @returns {Promise<object>} A promise that resolves to the processed quote data.
 */
async function fetchOdosQuote({ chainCode, sc_input, amount_in, sc_output, des_output, action }) {
    // Odos uses different API versions/endpoints based on what was in the original code
    const url = action === "TokentoPair"
        ? "https://vercel-proxycors.vercel.app/?url=https://api.odos.xyz/sor/quote/v2"
        : "https://api.odos.xyz/sor/quote/v3";

    const requestData = {
        chainId: chainCode,
        compact: true,
        disableRFQs: true,
        userAddr: AppSettings.walletMeta || '0x0000000000000000000000000000000000000000',
        inputTokens: [{
            amount: amount_in.toString(),
            tokenAddress: sc_input
        }],
        outputTokens: [{
            proportion: 1,
            tokenAddress: sc_output
        }],
        slippageLimitPercent: 0.3,
    };

    try {
        const response = await $.ajax({
            url: url,
            method: 'POST',
            data: JSON.stringify(requestData),
            contentType: 'application/json'
        });

        if (!response.outAmounts || !response.gasEstimateValue) {
            throw new Error("Invalid response structure from Odos API");
        }

        const amount_out = parseFloat(response.outAmounts) / Math.pow(10, des_output);
        const feeSwap = parseFloat(response.gasEstimateValue) || 0;

        return {
            dexTitle: "Odos",
            amount_out,
            FeeSwap: feeSwap,
        };

    } catch (error) {
        const errorMessage = error.responseJSON?.description || error.statusText || "Unknown API error";
        console.error("Error fetching Odos quote:", errorMessage);
        throw new Error(`Odos API Error: ${errorMessage}`);
    }
}

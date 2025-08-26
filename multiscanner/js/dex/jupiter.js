/**
 * Jupiter DEX module (for Solana).
 * Fetches swap quotes from the Jupiter API.
 */

/**
 * Fetches a swap quote from the Jupiter API.
 * @param {object} params The parameters for the swap quote.
 * @returns {Promise<object>} A promise that resolves to the processed quote data.
 */
async function fetchJupiterQuote({ sc_input, sc_output, amount_in, des_output, chainName }) {
    const url = `https://quote-api.jup.ag/v6/quote?inputMint=${sc_input}&outputMint=${sc_output}&amount=${amount_in}`;

    try {
        const response = await $.ajax({
            url: url,
            method: 'GET'
        });

        if (!response.outAmount) {
            throw new Error("Invalid response structure from Jupiter API");
        }

        const amount_out = parseFloat(response.outAmount) / Math.pow(10, des_output);
        const feeSwap = getFeeSwap(chainName); // Relies on global gas fee data

        return {
            dexTitle: "Jupiter",
            amount_out,
            FeeSwap: feeSwap,
        };

    } catch (error) {
        const errorMessage = error.responseJSON?.error || error.statusText || "Unknown API error";
        console.error("Error fetching Jupiter quote:", errorMessage);
        throw new Error(`Jupiter API Error: ${errorMessage}`);
    }
}

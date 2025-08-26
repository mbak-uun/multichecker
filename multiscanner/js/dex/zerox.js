/**
 * 0x (Matcha) DEX module.
 * Fetches swap quotes from the 0x API.
 */

/**
 * Fetches a swap quote from the 0x API.
 * @param {object} params The parameters for the swap quote.
 * @returns {Promise<object>} A promise that resolves to the processed quote data.
 */
async function fetch0xQuote({ chainName, sc_input, sc_output, amount_in, des_output, chainCode }) {
    let url;
    if (chainName.toLowerCase() === 'solana') {
        // Solana has a different URL structure
        url = `https://matcha.xyz/api/swap/quote/solana?sellTokenAddress=${sc_input}&buyTokenAddress=${sc_output}&sellAmount=${amount_in}&dynamicSlippage=true&slippageBps=50&userPublicKey=Eo6CpSc1ViboPva7NZ1YuxUnDCgqnFDXzcDMDAF6YJ1L`;
    } else {
        url = `https://matcha.xyz/api/swap/price?chainId=${chainCode}&buyToken=${sc_output}&sellToken=${sc_input}&sellAmount=${amount_in}`;
    }

    try {
        const response = await $.ajax({
            url: url,
            method: 'GET'
        });

        if (!response.buyAmount) {
            throw new Error("Invalid response structure from 0x API");
        }

        const amount_out = parseFloat(response.buyAmount) / Math.pow(10, des_output);

        // 0x API does not provide a direct gas fee estimate in the price endpoint,
        // so we rely on the globally fetched gas fee.
        const feeSwap = getFeeSwap(chainName);

        return {
            dexTitle: "0x (Matcha)",
            amount_out,
            FeeSwap: feeSwap,
        };

    } catch (error) {
        const errorMessage = error.responseJSON?.reason || error.statusText || "Unknown API error";
        console.error("Error fetching 0x quote:", errorMessage);
        throw new Error(`0x API Error: ${errorMessage}`);
    }
}

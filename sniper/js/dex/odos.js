window.DEX_MODULES = window.DEX_MODULES || {};

window.DEX_MODULES.ODOS = {
    fetchPrice: function(sc_input, des_input, sc_output, des_output, amount_in, chainCode, action, walletAddress, callback) {
        let apiUrl, requestData;

        // Odos uses the same endpoint for both directions, but the payload might differ slightly based on version (v2 vs v3)
        // The original code uses different endpoints for different actions, I will replicate that.
        if (action === "TokentoPair") {
            apiUrl = "https://vercel-proxycors.vercel.app/?url=https://api.odos.xyz/sor/quote/v2";
            requestData = {
                chainId: chainCode,
                compact: true,
                disableRFQs: true,
                userAddr: walletAddress,
                inputTokens: [{ amount: amount_in.toString(), tokenAddress: sc_input }],
                outputTokens: [{ proportion: 1, tokenAddress: sc_output }],
                slippageLimitPercent: 0.3,
            };
        } else if (action === "PairtoToken") {
            apiUrl = "https://api.odos.xyz/sor/quote/v3";
            requestData = {
                chainId: chainCode,
                compact: true,
                disableRFQs: true,
                userAddr: walletAddress,
                inputTokens: [{ amount: amount_in.toString(), tokenAddress: sc_input }],
                outputTokens: [{ proportion: 1, tokenAddress: sc_output }],
                slippageLimitPercent: 0.3,
            };
        } else {
            return callback({ message: "Invalid action for Odos module" }, null);
        }

        $.ajax({
            url: apiUrl,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(requestData),
            success: function(response) {
                try {
                    const amount_out = parseFloat(response.outAmounts) / Math.pow(10, des_output);
                    const feeSwap = response.gasEstimateValue || 0;

                    if (!isNaN(amount_out)) {
                        callback(null, { dexTitle: "ODOS", amount_out, FeeSwap: feeSwap });
                    } else {
                        callback({ message: "Could not parse Odos response" }, null);
                    }
                } catch (error) {
                    callback({ message: `Error processing Odos response: ${error.message}` }, null);
                }
            },
            error: function(xhr) {
                callback({ statusCode: xhr.status, message: `Odos API error: ${xhr.statusText}` }, null);
            }
        });
    }
};

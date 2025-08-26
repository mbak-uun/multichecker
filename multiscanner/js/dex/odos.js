window.DEX_MODULES = window.DEX_MODULES || {};

window.DEX_MODULES.ODOS = {
    fetchPrice: function(sc_input, des_input, sc_output, des_output, amount_in, chainName, chainCode, action, walletAddress, callback) {
        let apiUrl, requestData;
        const userAddr = walletAddress || '0x0000000000000000000000000000000000000000';

        if (action === "TokentoPair") {
            apiUrl = "https://vercel-proxycors.vercel.app/?url=https://api.odos.xyz/sor/quote/v2";
            requestData = {
                chainId: chainCode,
                compact: true,
                disableRFQs: true,
                userAddr: userAddr,
                inputTokens: [{ amount: amount_in.toString(), tokenAddress: sc_input }],
                outputTokens: [{ proportion: 1, tokenAddress: sc_output }],
                slippageLimitPercent: 0.3,
            };
        } else { // PairtoToken
            apiUrl = "https://api.odos.xyz/sor/quote/v3";
            requestData = {
                chainId: chainCode,
                compact: true,
                disableRFQs: true,
                userAddr: userAddr,
                inputTokens: [{ amount: amount_in.toString(), tokenAddress: sc_input }],
                outputTokens: [{ proportion: 1, tokenAddress: sc_output }],
                slippageLimitPercent: 0.3,
            };
        }

        $.ajax({
            url: apiUrl,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(requestData),
            success: function(response) {
                try {
                    const amount_out = parseFloat(response.outAmounts) / Math.pow(10, des_output);
                    const feeSwap = response.gasEstimateValue || getFeeSwap(chainName);
                    const result = {
                        dexTitle: "ODOS",
                        amount_out: amount_out,
                        FeeSwap: feeSwap,
                    };
                    callback(null, result);
                } catch (error) {
                    callback({ statusCode: 500, pesanDEX: `Error processing Odos response: ${error.message}`, color: "#f39999", DEX: "ODOS" }, null);
                }
            },
            error: function(xhr) {
                callback({ statusCode: xhr.status, pesanDEX: `Odos API error: ${xhr.statusText}`, color: "#f39999", DEX: "ODOS" }, null);
            }
        });
    }
};

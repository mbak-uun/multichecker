window.DEX_MODULES = window.DEX_MODULES || {};

window.DEX_MODULES.KYBERSWAP = {
    fetchPrice: function(sc_input, des_input, sc_output, des_output, amount_in, chainName, chainCode, action, walletAddress, callback) {
        let netChain = chainName.toUpperCase() === "AVAX" ? "avalanche" : chainName.toLowerCase();
        const apiUrl = `https://aggregator-api.kyberswap.com/${netChain}/api/v1/routes?tokenIn=${sc_input}&tokenOut=${sc_output}&amountIn=${amount_in}&gasInclude=true`;

        $.ajax({
            url: apiUrl,
            method: 'GET',
            success: function(response) {
                try {
                    const amount_out = response.data.routeSummary.amountOut / Math.pow(10, des_output);
                    const feeSwap = parseFloat(response.data.routeSummary.gasUsd) || getFeeSwap(chainName);

                    const result = {
                        dexTitle: "KYBERSWAP",
                        amount_out: amount_out,
                        FeeSwap: feeSwap,
                    };
                    callback(null, result);
                } catch (error) {
                    callback({
                        statusCode: 500,
                        pesanDEX: `Error processing KyberSwap response: ${error.message}`,
                        color: "#f39999",
                        DEX: "KYBERSWAP",
                    }, null);
                }
            },
            error: function(xhr) {
                callback({
                    statusCode: xhr.status,
                    pesanDEX: `KyberSwap API error: ${xhr.statusText}`,
                    color: "#f39999",
                    DEX: "KYBERSWAP",
                }, null);
            }
        });
    }
};

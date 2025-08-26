window.DEX_MODULES = window.DEX_MODULES || {};

window.DEX_MODULES.KYBERSWAP = {
    fetchPrice: function(sc_input, des_input, sc_output, des_output, amount_in, chainName, chainCode, callback) {
        let netChain = chainName.toLowerCase();
        if (netChain === "avax") {
            netChain = "avalanche";
        }

        const apiUrl = `https://aggregator-api.kyberswap.com/${netChain}/api/v1/routes?tokenIn=${sc_input}&tokenOut=${sc_output}&amountIn=${amount_in}&gasInclude=true`;

        $.ajax({
            url: apiUrl,
            method: 'GET',
            success: function (response) {
                try {
                    const amount_out = response.data.routeSummary.amountOut / Math.pow(10, des_output);
                    const feeSwap = parseFloat(response.data.routeSummary.gasUsd) || 0;

                    const result = {
                        dexTitle: "KYBERSWAP",
                        amount_out: amount_out,
                        FeeSwap: feeSwap,
                        // You might need to add other relevant fields from the original logic here
                    };
                    callback(null, result);
                } catch (error) {
                    callback({ message: `Error processing Kyberswap response: ${error.message}` }, null);
                }
            },
            error: function (xhr) {
                callback({
                    statusCode: xhr.status,
                    message: `Kyberswap API error: ${xhr.statusText}`
                }, null);
            }
        });
    }
};

window.DEX_MODULES = window.DEX_MODULES || {};

window.DEX_MODULES.JUPITER = {
    fetchPrice: function(sc_input, des_input, sc_output, des_output, amount_in, chainName, chainCode, action, walletAddress, callback) {
        const apiUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${sc_input}&outputMint=${sc_output}&amount=${amount_in}`;

        $.ajax({
            url: apiUrl,
            method: 'GET',
            success: function(response) {
                try {
                    const amount_out = response.outAmount / Math.pow(10, des_output);
                    const feeSwap = getFeeSwap(chainName);

                    const result = {
                        dexTitle: "JUPITER",
                        amount_out: amount_out,
                        FeeSwap: feeSwap,
                    };
                    callback(null, result);
                } catch (error) {
                    callback({
                        statusCode: 500,
                        pesanDEX: `Error processing Jupiter response: ${error.message}`,
                        color: "#f39999",
                        DEX: "JUPITER",
                    }, null);
                }
            },
            error: function(xhr) {
                callback({
                    statusCode: xhr.status,
                    pesanDEX: `Jupiter API error: ${xhr.statusText}`,
                    color: "#f39999",
                    DEX: "JUPITER",
                }, null);
            }
        });
    }
};

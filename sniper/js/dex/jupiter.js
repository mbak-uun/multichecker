window.DEX_MODULES = window.DEX_MODULES || {};

window.DEX_MODULES.JUPITER = {
    fetchPrice: function(sc_input, des_input, sc_output, des_output, amount_in, callback) {
        const apiUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${sc_input}&outputMint=${sc_output}&amount=${amount_in}`;

        $.ajax({
            url: apiUrl,
            method: 'GET',
            success: function(response) {
                try {
                    // The response from Jupiter gives the amount in the smallest unit (lamports for SOL)
                    // The original code does not seem to use decimals for Jupiter, so I will replicate that.
                    // This might need adjustment if the amount_in is not already in the smallest unit.
                    const amount_out = response.outAmount;
                    const feeSwap = 0; // Fee is complex, often included in the quote.

                    if (amount_out !== undefined) {
                        callback(null, { dexTitle: "JUPITER", amount_out: amount_out / Math.pow(10, des_output), FeeSwap: feeSwap });
                    } else {
                        callback({ message: "Could not parse Jupiter response" }, null);
                    }
                } catch (error) {
                    callback({ message: `Error processing Jupiter response: ${error.message}` }, null);
                }
            },
            error: function(xhr) {
                callback({ statusCode: xhr.status, message: `Jupiter API error: ${xhr.statusText}` }, null);
            }
        });
    }
};

window.DEX_MODULES = window.DEX_MODULES || {};

window.DEX_MODULES['0X'] = { // Note: Key is '0X' to be a valid property name
    fetchPrice: function(sc_input, des_input, sc_output, des_output, amount_in, chainName, chainCode, callback) {
        let apiUrl;

        if (chainName.toLowerCase() === 'solana') {
            apiUrl = `https://matcha.xyz/api/swap/quote/solana?sellTokenAddress=${sc_input}&buyTokenAddress=${sc_output}&sellAmount=${amount_in}&dynamicSlippage=true&slippageBps=50&userPublicKey=Eo6CpSc1ViboPva7NZ1YuxUnDCgqnFDXzcDMDAF6YJ1L`;
        } else {
            apiUrl = `https://matcha.xyz/api/swap/price?chainId=${chainCode}&buyToken=${sc_output}&sellToken=${sc_input}&sellAmount=${amount_in}`;
        }

        $.ajax({
            url: apiUrl,
            method: 'GET',
            success: function(response) {
                try {
                    const amount_out = response.buyAmount / Math.pow(10, des_output);
                    // 0x API doesn't seem to provide a direct gas fee estimate in the response
                    const feeSwap = 0; // Or fetch it via getFeeSwap if needed

                    if (!isNaN(amount_out)) {
                        callback(null, { dexTitle: "0X", amount_out, FeeSwap: feeSwap });
                    } else {
                        callback({ message: "Could not parse 0x response" }, null);
                    }
                } catch (error) {
                    callback({ message: `Error processing 0x response: ${error.message}` }, null);
                }
            },
            error: function(xhr) {
                callback({ statusCode: xhr.status, message: `0x API error: ${xhr.statusText}` }, null);
            }
        });
    }
};

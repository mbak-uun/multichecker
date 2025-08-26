window.DEX_MODULES = window.DEX_MODULES || {};

window.DEX_MODULES['0X'] = {
    fetchPrice: function(sc_input, des_input, sc_output, des_output, amount_in, chainName, chainCode, action, walletAddress, callback) {
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
                    const feeSwap = getFeeSwap(chainName);
                    const result = {
                        dexTitle: "0X",
                        amount_out: amount_out,
                        FeeSwap: feeSwap,
                    };
                    callback(null, result);
                } catch (error) {
                    callback({ statusCode: 500, pesanDEX: `Error processing 0x response: ${error.message}`, color: "#f39999", DEX: "0X" }, null);
                }
            },
            error: function(xhr) {
                callback({ statusCode: xhr.status, pesanDEX: `0x API error: ${xhr.statusText}`, color: "#f39999", DEX: "0X" }, null);
            }
        });
    }
};

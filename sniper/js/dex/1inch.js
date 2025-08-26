window.DEX_MODULES = window.DEX_MODULES || {};

window.DEX_MODULES.ONEINCH = {
    fetchPrice: function(sc_input, des_input, sc_output, des_output, amount_in, chainCode, action, walletAddress, callback) {
        let apiUrl, requestData;

        if (action === "TokentoPair") {
            apiUrl = "https://api.dzap.io/v1/quotes";
            requestData = {
                account: walletAddress || '0x0000000000000000000000000000000000000000',
                fromChain: chainCode,
                integratorId: 'dzap',
                allowedSources: ["oneInchViaLifi"],
                notAllowedSources: [],
                data: [{
                    amount: amount_in.toString(),
                    srcToken: sc_input,
                    srcDecimals: des_input,
                    destToken: sc_output,
                    destDecimals: des_output,
                    slippage: 0.3,
                    toChain: chainCode
                }]
            };
        } else if (action === "PairtoToken") {
            apiUrl = "https://api-v1.marbleland.io/api/v1/jumper/api/p/lifi/advanced/routes";
            requestData = {
                fromAmount: amount_in.toString(),
                fromChainId: chainCode,
                fromTokenAddress: sc_input,
                toChainId: chainCode,
                toTokenAddress: sc_output,
                options: {
                    integrator: "swap.marbleland.io",
                    order: "CHEAPEST",
                    maxPriceImpact: 0.4,
                    allowSwitchChain: false,
                    bridges: {
                        deny: ["hop", "cbridge", "optimism", "arbitrum", "across", "omni", "celercircle", "allbridge", "thorswap", "symbiosis", "squid", "mayan", "mayanWH", "mayanMCTP", "relay", "polygon", "glacis", "stargateV2", "stargateV2Bus", "chainflip"]
                    },
                    exchanges: {
                        allow: ["1inch"]
                    }
                }
            };
        } else {
            return callback({ message: "Invalid action for 1inch module" }, null);
        }

        $.ajax({
            url: apiUrl,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(requestData),
            success: function(response) {
                try {
                    let amount_out, feeSwap;
                    if (action === "TokentoPair") {
                        const key = Object.keys(response)[0];
                        const quoteData = response[key]?.quoteRates?.oneInchViaLifi;
                        if (quoteData) {
                            amount_out = parseFloat(quoteData.destAmount / Math.pow(10, des_output));
                            feeSwap = parseFloat(quoteData.fee?.gasFee?.[0]?.amountUSD) || 0;
                        }
                    } else if (action === "PairtoToken") {
                        const quoteData = response.routes?.[0];
                        if (quoteData) {
                            amount_out = parseFloat(quoteData.toAmount / Math.pow(10, des_output));
                            feeSwap = parseFloat(quoteData.gasCostUSD) || 0;
                        }
                    }

                    if (amount_out !== undefined) {
                        callback(null, { dexTitle: "1INCH", amount_out, FeeSwap: feeSwap });
                    } else {
                        callback({ message: "Could not parse 1inch response" }, null);
                    }
                } catch (error) {
                    callback({ message: `Error processing 1inch response: ${error.message}` }, null);
                }
            },
            error: function(xhr) {
                callback({ statusCode: xhr.status, message: `1inch API error: ${xhr.statusText}` }, null);
            }
        });
    }
};

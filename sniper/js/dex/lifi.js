window.DEX_MODULES = window.DEX_MODULES || {};

window.DEX_MODULES.LIFI = {
    fetchPrice: function(sc_input, des_input, sc_output, des_output, amount_in, chainCode, action, walletAddress, callback) {
        let apiUrl, requestData;

        if (action === "TokentoPair") {
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
                    }
                }
            };
        } else if (action === "PairtoToken") {
            apiUrl = "https://api.dzap.io/v1/quotes";
            requestData = {
                account: walletAddress || '0x0000000000000000000000000000000000000000',
                fromChain: chainCode,
                integratorId: 'dzap',
                allowedSources: ["bebop", "enso", "iceCreamSwap", "izumi", "kyberSwap", "lifi", "magpie", "odos", "okx", "oneInchViaLifi", "openOcean", "paraSwap", "sushiswap", "synapse", "uniswap", "unizen", "vaporDex", "woodSwap", "xyFinance", "zerox", "orbiter", "relayLink", "mayanFinance", "jupiter"],
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
        } else {
            return callback({ message: "Invalid action for Lifi module" }, null);
        }

        $.ajax({
            url: apiUrl,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(requestData),
            success: function(response) {
                try {
                    let amount_out, feeSwap, dexTitle = "LIFI";
                    if (action === "TokentoPair") {
                        const bestQuote = (response.routes || []).reduce((best, route) => {
                            const currentAmount = parseFloat(route.toAmount);
                            return currentAmount > (best ? parseFloat(best.toAmount) : 0) ? route : best;
                        }, null);
                        if (bestQuote) {
                            amount_out = parseFloat(bestQuote.toAmount) / Math.pow(10, des_output);
                            feeSwap = parseFloat(bestQuote.gasCostUSD) || 0;
                            dexTitle = `${bestQuote.steps?.[0]?.tool || "unknown"} via LIFI`;
                        }
                    } else if (action === "PairtoToken") {
                        const key = Object.keys(response)[0];
                        const bestQuote = Object.values(response[key]?.quoteRates || {}).reduce((best, quote) => {
                             const currentAmount = parseFloat(quote.destAmount);
                             return currentAmount > (best ? parseFloat(best.destAmount) : 0) ? quote : best;
                        }, null);
                        if (bestQuote) {
                            amount_out = parseFloat(bestQuote.destAmount) / Math.pow(10, des_output);
                            feeSwap = parseFloat(bestQuote?.fee?.gasFee?.[0]?.amountUSD) || 0;
                            dexTitle = `${response[key]?.recommendedSource || "unknown"} via DZAP`;
                        }
                    }

                    if (amount_out !== undefined) {
                        callback(null, { dexTitle, amount_out, FeeSwap: feeSwap });
                    } else {
                        callback({ message: "Could not parse Lifi response" }, null);
                    }
                } catch (error) {
                    callback({ message: `Error processing Lifi response: ${error.message}` }, null);
                }
            },
            error: function(xhr) {
                callback({ statusCode: xhr.status, message: `Lifi API error: ${xhr.statusText}` }, null);
            }
        });
    }
};

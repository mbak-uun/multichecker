window.DEX_MODULES = window.DEX_MODULES || {};

window.DEX_MODULES.LIFI = {
    fetchPrice: function(sc_input, des_input, sc_output, des_output, amount_in, chainName, chainCode, action, walletAddress, callback) {
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
                    bridges: { deny: ["hop", "cbridge", "optimism", "arbitrum", "across", "omni", "celercircle", "allbridge", "thorswap", "symbiosis", "squid", "mayan", "mayanWH", "mayanMCTP", "relay", "polygon", "glacis", "stargateV2", "stargateV2Bus", "chainflip"] },
                }
            };
        } else { // PairtoToken
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
        }

        $.ajax({
            url: apiUrl,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(requestData),
            success: function(response) {
                try {
                    let amount_out, feeSwap, dexTitle;
                    if (action === "TokentoPair") {
                        const routes = response.routes || [];
                        let bestQuote = null;
                        let bestAmount = 0;
                        for (const route of routes) {
                            if (route?.toAmount) {
                                const amount = parseFloat(route.toAmount) / Math.pow(10, des_output);
                                if (amount > bestAmount) {
                                    bestAmount = amount;
                                    bestQuote = route;
                                }
                            }
                        }
                        if (bestQuote) {
                            amount_out = bestAmount;
                            feeSwap = parseFloat(bestQuote.gasCostUSD) || getFeeSwap(chainName);
                            dexTitle = `${bestQuote.steps?.[0]?.tool || "unknown"} via LIFI`;
                        }
                    } else { // PairtoToken
                        const key = Object.keys(response)[0];
                        const quoteSources = response[key]?.quoteRates;
                        let bestQuote = null;
                        let bestAmount = 0;
                        for (const data of Object.values(quoteSources || {})) {
                            if (data?.destAmount) {
                                const amount = parseFloat(data.destAmount) / Math.pow(10, des_output);
                                if (amount > bestAmount) {
                                    bestAmount = amount;
                                    bestQuote = data;
                                }
                            }
                        }
                        if (bestQuote) {
                            amount_out = bestAmount;
                            feeSwap = parseFloat(bestQuote?.fee?.gasFee?.[0]?.amountUSD) || getFeeSwap(chainName);
                            dexTitle = `${response[key]?.recommendedSource || "unknown"} via DZAP`;
                        }
                    }

                    if (amount_out !== undefined) {
                        const result = { dexTitle, amount_out, FeeSwap: feeSwap };
                        callback(null, result);
                    } else {
                        throw new Error("Could not parse amount_out from LIFI response.");
                    }
                } catch (error) {
                    callback({ statusCode: 500, pesanDEX: `Error processing LIFI response: ${error.message}`, color: "#f39999", DEX: "LIFI" }, null);
                }
            },
            error: function(xhr) {
                callback({ statusCode: xhr.status, pesanDEX: `LIFI API error: ${xhr.statusText}`, color: "#f39999", DEX: "LIFI" }, null);
            }
        });
    }
};

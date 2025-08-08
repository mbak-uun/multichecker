class ApiService {
    constructor() {
        this.GasPriceUSD = {
            BSC: 0,
            Ethereum: 0,
            Polygon: 0
        };
    }

    _withProxy(url, useProxy = true) {
        return useProxy ? `https://vercel-proxycors.vercel.app/?url=${encodeURIComponent(url)}` : url;
    }

    _withTimeout(promise, timeout) {
        return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), timeout))
        ]);
    }

    async _fetchWithCountdown(cellId, dexName, promiseFn) {
        const cell = $(`#${cellId}`);
        let countdown = Math.floor(window.timeoutApi / 1000);

        cell.html(`⏳ ${dexName} ${countdown--}s`);
        const interval = setInterval(() => {
            if (countdown > 0) {
                cell.html(`⏳ ${dexName} ${countdown--}s`);
            }
        }, 1000);

        try {
            const result = await this._withTimeout(promiseFn(), window.timeoutApi);
            clearInterval(interval);
            return result;
        } catch (err) {
            clearInterval(interval);
            if (err.name === 'TimeoutError') {
                console.warn(`🕒 Timeout pada ${dexName}: permintaan melebihi batas waktu`);
            } else if (err.exchange && err.error) {
                console.error(`❌ Error ${err.exchange}: ${err.error} ${err.apikey}  (status: ${err.status || 'unknown'})`);
            } else {
                console.error(`💥 Error tidak diketahui dari ${dexName}:`, err);
            }
            throw err;
        }
    }

    _calculateSignature(exchange, apiSecret, dataToSign, hashMethod = "HmacSHA256") {
        if (!apiSecret || !dataToSign) {
            console.error(`[${exchange}] API Secret atau Data untuk Signature tidak valid!`);
            return null;
        }

        switch (exchange.toUpperCase()) {
            case "OKX":
                const hmac = CryptoJS.HmacSHA256(dataToSign, apiSecret);
                return CryptoJS.enc.Base64.stringify(hmac);
            default:
                return CryptoJS.HmacSHA256(dataToSign, apiSecret).toString(CryptoJS.enc.Hex);
        }
    }

    async getBinanceOrderBook(pair) {
        if (pair.baseSymbol === 'USDT' && pair.quoteSymbol === 'USDT') {
            return {
                buy: 1, sell: 1, topAsks: [], topBids: [], quotePriceUSDT: 1
            };
        }

        const baseResp = await this._withTimeout(fetch(`https://api-gcp.binance.com/api/v3/depth?symbol=${pair.baseSymbol}USDT&limit=5`), window.timeoutApi);
        const baseData = await baseResp.json();

        let quotePriceUSDT = 1;
        if (pair.quoteSymbol !== 'USDT') {
            const quoteResp = await this._withTimeout(fetch(`https://api-gcp.binance.com/api/v3/depth?symbol=${pair.quoteSymbol}USDT&limit=5`), window.timeoutApi);
            const quoteData = await quoteResp.json();
            quotePriceUSDT = parseFloat(quoteData.asks[0][0]);
        }

        return {
            buy: parseFloat(baseData.asks[0][0]),
            sell: parseFloat(baseData.bids[0][0]),
            topAsks: baseData.asks.slice(0, 5).map(x => ({ price: parseFloat(x[0]), qty: parseFloat(x[1]) })),
            topBids: baseData.bids.slice(0, 5).map(x => ({ price: parseFloat(x[0]), qty: parseFloat(x[1]) })),
            quotePriceUSDT
        };
    }

    async getMEXCOrderBook(pair) {
        if (pair.baseSymbol === 'USDT' && pair.quoteSymbol === 'USDT') {
            return {
                buy: 1, sell: 1, topAsks: [], topBids: [], quotePriceUSDT: 1
            };
        }

        const baseUrl = `https://api.mexc.com/api/v3/depth?symbol=${pair.baseSymbol}USDT&limit=5`;
        const baseResp = await this._withTimeout(fetch(this._withProxy(baseUrl)), window.timeoutApi);
        const baseData = await baseResp.json();

        let quotePriceUSDT = 1;
        if (pair.quoteSymbol !== 'USDT') {
            const quoteResp = await this._withTimeout(fetch(`https://api.mexc.com/api/v3/depth?symbol=${pair.quoteSymbol}USDT&limit=5`), window.timeoutApi);
            const quoteData = await quoteResp.json();
            quotePriceUSDT = parseFloat(quoteData.asks[0][0]);
        }

        return {
            buy: parseFloat(baseData.asks[0][0]),
            sell: parseFloat(baseData.bids[0][0]),
            topAsks: baseData.asks.slice(0, 5).map(x => ({ price: parseFloat(x[0]), qty: parseFloat(x[1]) })),
            topBids: baseData.bids.slice(0, 5).map(x => ({ price: parseFloat(x[0]), qty: parseFloat(x[1]) })),
            quotePriceUSDT
        };
    }

    async getGateOrderBook(pair) {
        if (pair.baseSymbol === 'USDT' && pair.quoteSymbol === 'USDT') {
            return {
                buy: 1, sell: 1, topAsks: [], topBids: [], quotePriceUSDT: 1
            };
        }

        const baseResp = await this._withTimeout(fetch(`https://proxykiri.awokawok.workers.dev/?https://api.gateio.ws/api/v4/spot/order_book?currency_pair=${pair.baseSymbol}_USDT&limit=5`), window.timeoutApi);
        const baseData = await baseResp.json();

        let quotePriceUSDT = 1;
        if (pair.quoteSymbol !== 'USDT') {
            const quoteResp = await this._withTimeout(fetch(`https://proxykiri.awokawok.workers.dev/?https://api.gateio.ws/api/v4/spot/order_book?currency_pair=${pair.quoteSymbol}_USDT&limit=5`), window.timeoutApi);
            const quoteData = await quoteResp.json();
            quotePriceUSDT = parseFloat(quoteData.asks[0][0]);
        }

        return {
            buy: parseFloat(baseData.asks[0][0]),
            sell: parseFloat(baseData.bids[0][0]),
            topAsks: baseData.asks.slice(0, 5).map(x => ({ price: parseFloat(x[0]), qty: parseFloat(x[1]) })),
            topBids: baseData.bids.slice(0, 5).map(x => ({ price: parseFloat(x[0]), qty: parseFloat(x[1]) })),
            quotePriceUSDT
        };
    }

    async getIndodaxOrderBook(pair) {
        const base = pair.baseSymbol.toLowerCase();
        const quote = pair.quoteSymbol.toLowerCase();

        if (base === 'usdt' && quote === 'usdt') {
            return {
                buy: 1, sell: 1, topAsks: [], topBids: [], quotePriceUSDT: 1
            };
        }

        const baseUrl = `https://indodax.com/api/depth/${base}idr?limit=5`;
        const baseResp = await this._withTimeout(fetch(this._withProxy(baseUrl)), window.timeoutApi);
        const baseData = await baseResp.json();

        const usdtToIDR = window.ExchangeRates?.IndodaxUSDT || 16000;
        const rateIDRtoUSDT = 1 / usdtToIDR;

        if (!baseData?.sell?.length || !baseData?.buy?.length) {
            console.warn(`❌ Order book Indodax kosong untuk ${base}IDR`);
            return {
                buy: 0,
                sell: 0,
                topAsks: [],
                topBids: [],
                quotePriceUSDT: rateIDRtoUSDT
            };
        }

        const topAsks = baseData.buy.map(([price, qty]) => ({
            price: parseFloat(price) * rateIDRtoUSDT,
            qty: parseFloat(qty)
        }));

        const topBids = baseData.sell.map(([price, qty]) => ({
            price: parseFloat(price) * rateIDRtoUSDT,
            qty: parseFloat(qty)
        }));

        return {
            buy: topBids[0].price,
            sell: topAsks[0].price,
            topAsks,
            topBids,
            quotePriceUSDT: rateIDRtoUSDT
        };
    }

    getKyberSwapPrice(tokenIn, tokenOut, amountIn, chainName) {
        const net = chainName === 'avax' ? 'avalanche' : chainName;
        const url = `https://aggregator-api.kyberswap.com/${net}/api/v1/routes?tokenIn=${tokenIn}&tokenOut=${tokenOut}&amountIn=${amountIn}&gasInclude=true`;

        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                method: 'GET',
                success: function(data) {
                    if (data && data.data && data.data.routeSummary) {
                        const route = data.data.routeSummary;
                        const feeSwapUSDT = PriceUtils.getGasFeeUSD(chainName, route.gas);
                        resolve({
                            exchange: 'KyberSwap',
                            amountIn: amountIn,
                            amountOut: route.amountOut,
                            price: parseFloat(route.amountOut) / parseFloat(amountIn),
                            gasEstimate: route.gasEstimate || 0,
                            gasPrice: route.gasPrice || 0,
                            feeDEX: parseFloat(route.gasUsd),
                            feeSwapUSDT : parseFloat(feeSwapUSDT),
                            rawRate: parseFloat(amountIn) / parseFloat(route.amountOut),
                            timestamp: Date.now()
                        });
                    } else {
                        reject({ exchange: 'KyberSwap', error: 'Invalid response', status: 'invalid_data' });
                    }
                },
                error: function(xhr, status, error) {
                    let errText = 'Unknown error';
                    try {
                        const res = JSON.parse(xhr.responseText);
                        errText = res.message || error?.toString() || status;
                    } catch {
                        errText = error?.toString() || status;
                    }

                    reject({
                        exchange: 'KYBERSWAP',
                        error: errText,
                        status,
                        httpCode: xhr.status,
                        httpText: xhr.statusText,
                        rawResponse: xhr.responseText
                    });
                }
            });
        });
    }

    getODOSPrice(inputTokens, outputTokens, userAddr,amountIn, chainId,chainName) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: 'https://api.odos.xyz/sor/quote/v2',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    chainId: parseInt(chainId),
                    inputTokens,
                    outputTokens,
                    userAddr,
                    slippageLimitPercent: 0.3,
                    sourceBlacklist: [],
                    sourceWhitelist: [],
                    simulate: false,
                    referralCode: 0
                }),
                success: function(data) {
                    const feeSwapUSDT = PriceUtils.getGasFeeUSD(chainName, data.gasEstimate);

                    if (data && data.outAmounts && data.outAmounts.length > 0) {
                        resolve({
                            exchange: 'ODOS',
                            amountIn: amountIn,
                            outAmounts: data.outAmounts,
                            amountOut: data.outAmounts?.[0] || '0',
                            price: parseFloat(data.outAmounts[0]) / parseFloat(amountIn),
                            rawRate: parseFloat(amountIn) / parseFloat(data.outAmounts[0]),
                            feeDEX: parseFloat(data.gasEstimateValue),
                            feeSwapUSDT: parseFloat(feeSwapUSDT),
                            timestamp: Date.now()
                        });
                    } else {
                        reject({ exchange: 'ODOS', error: 'Invalid response', status: 'invalid_data' });
                    }
                },
                error: function(xhr, status, error) {
                    let errText = 'Unknown error';
                    try {
                        const res = JSON.parse(xhr.responseText);
                        errText = res.message || error?.toString() || status;
                    } catch {
                        errText = error?.toString() || status;
                    }

                    reject({
                        exchange: 'ODOS',
                        error: errText,
                        status,
                        httpCode: xhr.status,
                        httpText: xhr.statusText,
                        rawResponse: xhr.responseText
                    });
                }
            });
        });
    }

    getHinkalODOSPrice(inputTokens, outputTokens, userAddr,amountIn, chainId,chainName) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: `https://ethmainnet.server.hinkal.pro/OdosSwapData`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    chainId: parseInt(chainId),
                    inputTokens,
                    outputTokens,
                    userAddr,
                    slippageLimitPercent: 0.3,
                    sourceBlacklist: [],
                    sourceWhitelist: [],
                    simulate: false,
                    referralCode: 0
                }),
                success: function(data) {
                    const feeSwapUSDT = PriceUtils.getGasFeeUSD(chainName, data.gasEstimate);

                    if (data && data.outAmounts && data.outAmounts.length > 0) {
                        resolve({
                            exchange: 'ODOS',
                            amountIn: amountIn,
                            outAmounts: data.odosResponse.outValues[0],
                            amountOut: data.odosResponse.outValues[0]?.[0] || '0',
                            price: parseFloat(data.odosResponse.outValues[0]) / parseFloat(amountIn),
                            rawRate: parseFloat(amountIn) / parseFloat(data.odosResponse.outValues[0]),
                            feeDEX: parseFloat(data.odosResponse.gasEstimateValue),
                            feeSwapUSDT: parseFloat(feeSwapUSDT),
                            timestamp: Date.now()
                        });
                    } else {
                        reject({ exchange: 'HINKAL ODOS', error: 'Invalid response', status: 'invalid_data' });
                    }
                },
                error: function(xhr, status, error) {
                    let errText = 'Unknown error';
                    try {
                        const res = JSON.parse(xhr.responseText);
                        errText = res.message || error?.toString() || status;
                    } catch {
                        errText = error?.toString() || status;
                    }
                    reject({
                        exchange: 'HINKAL ODOS',
                        error: errText,
                        status,
                        httpCode: xhr.status,
                        httpText: xhr.statusText,
                        rawResponse: xhr.responseText
                    });
                }
            });
        });
    }

    getHinkal1InchPrice(inputTokens, outputTokens, userAddr, amountIn, chainId, chainName) {
        return new Promise((resolve, reject) => {
            const sc_input = inputTokens[0]?.tokenAddress;
            const sc_output = outputTokens[0]?.tokenAddress;
            const apiUrl = "https://ethmainnet.server.hinkal.pro/OneInchSwapData";

            const requestData = {
                url: "https://api.1inch.dev/swap/v5.2/" + chainId + "/swap?" +
                    "fromTokenAddress=" + sc_input +
                    "&toTokenAddress=" + sc_output +
                    "&amount=" + amountIn +
                    "&fromAddress=" + userAddr +
                    "&slippage=10" +
                    "&destReceiver=" + userAddr +
                    "&disableEstimate=true"
            };

            $.ajax({
                url: apiUrl,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(requestData),
                success: function(data) {
                    const outAmount = data?.oneInchResponse?.toAmount || '0';
                    let gasEstimate = parseFloat(data?.oneInchResponse?.tx?.gas || 0);
                    if (!gasEstimate || gasEstimate === 0) gasEstimate = 350000;
                    const gweiOverride = 0.1;
                    const feeSwapUSDT = PriceUtils.getGasFeeUSD(chainName, gasEstimate, gweiOverride);

                    if (parseFloat(outAmount) > 0) {
                        resolve({
                            exchange: '1INCH',
                            amountIn: amountIn,
                            outAmounts: [outAmount],
                            amountOut: outAmount,
                            price: parseFloat(outAmount) / parseFloat(amountIn),
                            rawRate: parseFloat(amountIn) / parseFloat(outAmount),
                            gasEstimate: gasEstimate,
                            gasPrice: gweiOverride,
                            feeDEX: 0,
                            feeSwapUSDT: parseFloat(feeSwapUSDT),
                            timestamp: Date.now()
                        });
                    } else {
                        reject({ exchange: '1INCH', error: 'Invalid response', status: 'invalid_data' });
                    }
                },
                error: function(xhr, status, error) {
                    let errText = 'Unknown error';
                    try {
                        const res = JSON.parse(xhr.responseText);
                        errText = res.message || error?.toString() || status;
                    } catch {
                        errText = error?.toString() || status;
                    }

                    reject({
                        exchange: '1INCH',
                        error: errText,
                        status,
                        httpCode: xhr.status,
                        httpText: xhr.statusText,
                        rawResponse: xhr.responseText
                    });
                }
            });
        });
    }

    get0xPrice(sellToken, buyToken, sellAmount, chainId, direction,chainName) {
        return new Promise((resolve, reject) => {
             if (direction === 'cex_to_dex') {
                var proxiedUrl = `https://proxykiri.awokawok.workers.dev/?https://matcha.xyz/api/swap/price?chainId=${chainId}&buyToken=${buyToken}&sellToken=${sellToken}&sellAmount=${sellAmount}`;
             }else{
                var proxiedUrl = `https://proxykanan.awokawok.workers.dev/?https://matcha.xyz/api/swap/price?chainId=${chainId}&buyToken=${buyToken}&sellToken=${sellToken}&sellAmount=${sellAmount}`;
             }

            $.ajax({
                url: proxiedUrl,
                method: 'GET',
                success: function (data) {
                    let feeETH = 0;
                    if (data.totalNetworkFee) {
                        feeETH = parseFloat(data.totalNetworkFee) / 1e18;
                    } else if (data.estimatedGas && data.gasPrice) {
                        feeETH = (parseFloat(data.estimatedGas) * parseFloat(data.gasPrice)) / 1e18;
                    }

                    const feeSwapUSDT = PriceUtils.getGasFeeUSD(chainName, data.gas);

                    resolve({
                        exchange: 'Matcha',
                        sellToken: sellToken,
                        buyToken: buyToken,
                        sellAmount: sellAmount,
                        buyAmount: data.buyAmount,
                        price: parseFloat(data.price),
                        gasPrice: parseFloat(data.gasPrice || 0),
                        estimatedGas: parseFloat(data.estimatedGas || 0),
                        feeDEX: feeSwapUSDT,
                        feeSwapUSDT : feeSwapUSDT,
                        rawRate: 1 / parseFloat(data.price),
                        timestamp: Date.now()
                    });
                },
                error: function (xhr, status, error) {
                    let errText = 'Unknown error';
                    try {
                        const res = JSON.parse(xhr.responseText);
                        errText = res.message || error?.toString() || status;
                    } catch {
                        errText = error?.toString() || status;
                    }

                    reject({
                        exchange: 'MATCHA',
                        error: errText,
                        status,
                        httpCode: xhr.status,
                        httpText: xhr.statusText,
                        rawResponse: xhr.responseText
                    });
                }
            });
        });
    }

    async fetchCEXPrices(token, tokenPriceData, cexName, direction) {
        if (!this.gasTokenPrices) this.gasTokenPrices = {};
        const promises = [];

        const baseSymbol = token.symbol.toUpperCase();
        const quoteSymbol = token.pairSymbol.toUpperCase();

        if (baseSymbol === 'USDT') this.gasTokenPrices['USDT'] = 1;
        if (quoteSymbol === 'USDT') this.gasTokenPrices['USDT'] = 1;

        tokenPriceData.analisis_data = tokenPriceData.analisis_data || {};
        tokenPriceData.analisis_data[direction] = tokenPriceData.analisis_data[direction] || {};
        tokenPriceData.analisis_data[direction][cexName] = tokenPriceData.analisis_data[direction][cexName] || {};

        const symbols = [baseSymbol, quoteSymbol];

        for (const symbol of symbols) {
            const pair = { baseSymbol: symbol, quoteSymbol: 'USDT' };

            const assignData = (symbol => data => {
                tokenPriceData.analisis_data[direction][cexName][`${symbol}ToUSDT`] = data;
                if (data.buy) this.gasTokenPrices[symbol] = data.buy;
            })(symbol);

            switch (cexName) {
                case 'Binance':
                    promises.push(this.getBinanceOrderBook(pair).then(assignData).catch(err => console.warn(`Binance ${symbol}/USDT error: ${err.message}`)));
                    break;
                case 'MEXC':
                    promises.push(this.getMEXCOrderBook(pair).then(assignData).catch(err => console.warn(`MEXC ${symbol}/USDT error: ${err.message}`)));
                    break;
                case 'Gate':
                    promises.push(this.getGateOrderBook(pair).then(assignData).catch(err => console.warn(`Gate ${symbol}/USDT error: ${err.message}`)));
                    break;
                case 'INDODAX':
                    promises.push(this.getIndodaxOrderBook(pair).then(assignData).catch(err => console.warn(`INDODAX ${symbol}/USDT error: ${err.message}`)));
                break;
            }
        }

        await Promise.allSettled(promises);
    }

    async fetchDEXPrices(token, tokenPriceData, dexName, cexName, direction) {
        const chainId = PriceUtils.getChainId(token.chain);
        const network = token.chain.toLowerCase();
        const tokenDecimals = token.decimals;
        const pairDecimals = token.pairDecimals;

        const baseSymbol = token.symbol.toUpperCase();
        const quoteSymbol = token.pairSymbol.toUpperCase();

        const modal = direction === 'cex_to_dex'
            ? token.modalCexToDex[cexName]
            : token.modalDexToCex[dexName];

        if (!modal) {
            console.warn(`Modal not found for ${cexName}/${dexName} in direction ${direction}`);
            return;
        }

        const isBaseUSDT = baseSymbol === 'USDT';
        const isQuoteUSDT = quoteSymbol === 'USDT';

        const cexData = tokenPriceData.analisis_data?.[direction]?.[cexName];

        if (!cexData || Object.keys(cexData).length === 0) {
            console.warn(`❗ No CEX data for ${token.symbol}/${token.pairSymbol} @ ${cexName}`);
            return;
        }

        const getCEXRate = (symbol, type = 'buy') => {
            const key = Object.keys(cexData).find(k => k.toUpperCase().includes(symbol));
            return Number(cexData?.[key]?.[type] || 0);
        };

        const baseBuy = isBaseUSDT ? 1 : getCEXRate(baseSymbol, 'buy');
        const baseSell = isBaseUSDT ? 1 : getCEXRate(baseSymbol, 'sell');
        const quoteBuy = isQuoteUSDT ? 1 : getCEXRate(quoteSymbol, 'buy');
        const quoteSell = isQuoteUSDT ? 1 : getCEXRate(quoteSymbol, 'sell');

        if (!baseBuy || !baseSell || !quoteBuy || !quoteSell) {
            console.warn(`${cexName} ${baseSymbol} price not found`);
            return;
        }

        let inputContract, outputContract, inputDecimals, outputDecimals;
        if (direction === 'cex_to_dex') {
            inputContract = token.contractAddress;
            outputContract = token.pairContractAddress;
            inputDecimals = tokenDecimals;
            outputDecimals = pairDecimals;
        } else {
            inputContract = token.pairContractAddress;
            outputContract = token.contractAddress;
            inputDecimals = pairDecimals;
            outputDecimals = tokenDecimals;
        }

        const inputAmountToken = direction === 'cex_to_dex'
            ? (isBaseUSDT ? modal : modal / baseBuy)
            : (isQuoteUSDT ? modal : modal / quoteBuy);

        const rawAmountIn = PriceUtils.calculateAmount(inputAmountToken, inputDecimals);
        const quotePriceUSDT = direction === 'cex_to_dex' ? quoteBuy : baseSell;

        console.log(`Fetching DEX price for ${dexName} with modal ${modal}`);
    }
}

window.ApiService = new ApiService();

// =================================================================================
// API AND NETWORK FUNCTIONS
// =================================================================================

/**
 * Fetches the order book for a token pair from a CEX.
 * @param {object} coins - The token object containing pair info.
 * @param {string} NameToken - The base token symbol.
 * @param {string} NamePair - The quote token symbol.
 * @param {string} cex - The CEX name.
 * @param {function} callback - The callback function (error, result).
 */
function getPriceCEX(coins, NameToken, NamePair, cex, callback) {
    const config = exchangeConfig[cex];
    if (!config) {
        callback(`Exchange ${cex} tidak ditemukan dalam konfigurasi.`, null);
        return;
    }

    const settings = getFromLocalStorage("SETTING_SCANNER", {});
    const jedaCex = settings?.JedaCexs?.[cex] || 0;

    const feeList = getFromLocalStorage("TOKEN_SCANNER", []);
    if (!Array.isArray(feeList) || feeList.length === 0) {
        toastr.error("PERIKSA ULANG FEE WD dari EXCHANGER !!");
        callback("Token scanner belum diatur.", null);
        return;
    }

    // Ambil entry token berdasarkan simbol; lalu baca fee per-CEX dari dataCexs
    const upperCex = String(cex).toUpperCase();
    const tokenData = feeList.find(item => {
        const samePair = String(item.symbol_in).toUpperCase() === String(NameToken).toUpperCase() &&
                         String(item.symbol_out).toUpperCase() === String(NamePair).toUpperCase();
        const hasCex = Array.isArray(item.selectedCexs) && item.selectedCexs.map(x=>String(x).toUpperCase()).includes(upperCex);
        return samePair && hasCex;
    });

    const isStablecoin = (token) => stablecoins.includes(token);
    let results = {};

    const urls = [
        isStablecoin(NameToken) ? null : config.url({ symbol: NameToken }),
        isStablecoin(NamePair) ? null : config.url({ symbol: NamePair })
    ];

    const processFinalResult = () => {
        if (Object.keys(results).length === 2) {
            const priceBuyToken = results[NameToken]?.price_buy || 0;
            const priceBuyPair = results[NamePair]?.price_buy || 0;

            const cexInfo = tokenData?.dataCexs?.[upperCex] || {};
            const feeWDToken = parseFloat(cexInfo.feeWDToken || 0) * priceBuyToken;
            const feeWDPair  = parseFloat(cexInfo.feeWDPair  || 0) * priceBuyPair;

            if (isNaN(feeWDToken) || feeWDToken < 0) {
                callback(`FeeWD untuk ${NameToken} di ${cex} tidak valid: ${feeWDToken}`, null);
                return;
            }
            if (isNaN(feeWDPair) || feeWDPair < 0) {
                callback(`FeeWD untuk ${NamePair} di ${cex} tidak valid: ${feeWDPair}`, null);
                return;
            }

            const finalResult = {
                token: NameToken.toUpperCase(),
                sc_input: coins.sc_in,
                sc_output: coins.sc_out,
                pair: NamePair.toUpperCase(),
                cex: cex.toUpperCase(),
                price_sellToken: results[NameToken]?.price_sell || 0,
                price_buyToken: priceBuyToken,
                price_sellPair: results[NamePair]?.price_sell || 0,
                price_buyPair: priceBuyPair,
                volumes_sellToken: results[NameToken]?.volumes_sell || [],
                volumes_buyToken: results[NameToken]?.volumes_buy || [],
                volumes_sellPair: results[NamePair]?.volumes_sell || [],
                volumes_buyPair: results[NamePair]?.volumes_buy || [],
                feeWDToken: feeWDToken,
                feeWDPair: feeWDPair,
                chainName: coins.chain
            };

            updateTableVolCEX(finalResult, cex);
            callback(null, finalResult);
        }
    };

    urls.forEach((url, index) => {
        const tokenName = index === 0 ? NameToken : NamePair;

        if (isStablecoin(tokenName)) {
            results[tokenName] = {
                price_sell: 1,
                price_buy: 1,
                volumes_sell: Array(3).fill({ price: 1, volume: 10000 }),
                volumes_buy: Array(3).fill({ price: 1, volume: 10000 })
            };
            processFinalResult();
            return;
        }

        if (url) {
            setTimeout(() => {
                $.ajax({
                    url: url,
                    method: 'GET',
                    success: function (data) {
                        let processedData;
                        try {
                            processedData = config.processData(data);
                        } catch (error) {
                            console.error(`Error processing data untuk ${tokenName} di ${cex}:`, error);
                            callback(`Error processing data untuk ${tokenName} di ${cex}.`, null);
                            return;
                        }

                        const isIndodax = cex.toLowerCase() === "indodax";
                        let priceBuy, priceSell;

                        if (isIndodax) {
                            priceBuy = processedData?.priceSell?.[2]?.price || 0;
                            priceSell = processedData?.priceBuy?.[2]?.price || 0;
                        } else {
                            priceBuy = (processedData?.priceBuy || []).sort((a, b) => b.price - a.price)[2]?.price || 0;
                            priceSell = (processedData?.priceSell || []).sort((a, b) => a.price - b.price)[2]?.price || 0;
                        }

                        if (priceBuy <= 0 || priceSell <= 0) {
                            callback(`Harga tidak valid untuk ${tokenName} di ${cex}.`, null);
                            return;
                        }

                        results[tokenName] = {
                            price_sell: priceSell,
                            price_buy: priceBuy,
                            volumes_sell: processedData?.priceBuy || [],
                            volumes_buy: processedData?.priceSell || []
                        };

                        processFinalResult();
                    },
                    error: function (xhr) {
                        const errorMessage = xhr.responseJSON?.msg || "Unknown ERROR";
                        callback(`Error koneksi API untuk ${tokenName} di ${cex}: ${errorMessage}`, null);
                    }
                });
            }, jedaCex);
            console.log(`JEDA EXCHANGER ${cex}: ${jedaCex}`)
        }
    });
}

/**
 * Fetches a price quote from a DEX aggregator.
 * @param {string} sc_input_in - Input token contract address.
 * @param {number} des_input - Input token decimals.
 * @param {string} sc_output_in - Output token contract address.
 * @param {number} des_output - Output token decimals.
 * @param {number} amount_in - The amount of input token.
 * @param {number} PriceRate - The price rate for conversion.
 * @param {string} dexType - The DEX aggregator name.
 * @param {string} NameToken - The input token name.
 * @param {string} NamePair - The output token name.
 * @param {string} cex - The reference CEX name.
 * @param {string} chainName - The chain name.
 * @param {number} chainCode - The chain ID.
 * @param {string} action - The trade direction ('TokentoPair' or 'PairtoToken').
 * @param {function} callback - The callback function (error, result).
 */
function getPriceDEX(sc_input_in, des_input, sc_output_in, des_output, amount_in, PriceRate, dexType, NameToken, NamePair, cex,chainName,chainCode,action, callback) {
    const chainConfig = CONFIG_CHAINS[chainName.toLowerCase()];
    var sc_input=sc_input_in.toLowerCase();
    var sc_output=sc_output_in.toLowerCase();
    var dexId = `${cex}_${dexType.toUpperCase()}_${NameToken}_${NamePair}_${chainName}`;
    var SavedSettingData = getFromLocalStorage('SETTING_SCANNER', {});
    var selectedApiKey = getRandomApiKeyOKX();
    var amount_in_big = BigInt(Math.round(Math.pow(10, des_input) * amount_in));
    var apiUrl, requestData,headers;   
    var linkDEX = generateDexLink(dexType,chainName,chainCode,NameToken,sc_input_in, NamePair, sc_output_in);
  
    switch (dexType) {
        case 'kyberswap':
                let NetChain = chainName.toUpperCase() === "AVAX" ? "avalanche" : chainName;
                apiUrl = `https://aggregator-api.kyberswap.com/${NetChain.toLowerCase()}/api/v1/routes?tokenIn=${sc_input}&tokenOut=${sc_output}&amountIn=${amount_in_big}&gasInclude=true`;
            break;
        
        case '1inch':
        case 'lifi':
            const isLifi = dexType === 'lifi';
            if (action === "TokentoPair") {
                apiUrl = isLifi ? "https://api-v1.marbleland.io/api/v1/jumper/api/p/lifi/advanced/routes" : "https://api.dzap.io/v1/quotes";
                if (isLifi) {
                    requestData = { fromAmount: amount_in_big.toString(), fromChainId: chainCode, fromTokenAddress: sc_input, toChainId: chainCode, toTokenAddress: sc_output, options: { integrator: "swap.marbleland.io", order: "CHEAPEST", maxPriceImpact: 0.4, allowSwitchChain: false, bridges: { deny: ["hop", "cbridge", "optimism", "arbitrum", "across", "omni", "celercircle", "allbridge", "thorswap", "symbiosis", "squid", "mayan", "mayanWH", "mayanMCTP", "relay", "polygon", "glacis", "stargateV2", "stargateV2Bus", "chainflip"] } } };
                } else {
                    requestData = { account: SavedSettingData.walletMeta || '0x0000000000000000000000000000000000000000', fromChain: chainCode, integratorId: 'dzap', allowedSources: ["oneInchViaLifi"], data: [{ amount: amount_in_big.toString(), srcToken: sc_input, srcDecimals: des_input, destToken: sc_output, destDecimals: des_output, slippage: 0.3, toChain: chainCode }] };
                }
            } else { // PairtoToken
                apiUrl = isLifi ? "https://api.dzap.io/v1/quotes" : "https://api-v1.marbleland.io/api/v1/jumper/api/p/lifi/advanced/routes";
                if (isLifi) {
                    requestData = { account: SavedSettingData.walletMeta || '0x0000000000000000000000000000000000000000', fromChain: chainCode, integratorId: 'dzap', allowedSources: ["bebop", "enso", "iceCreamSwap", "izumi", "kyberSwap", "lifi", "magpie", "odos", "okx", "oneInchViaLifi", "openOcean", "paraSwap", "sushiswap", "synapse", "uniswap", "unizen", "vaporDex", "woodSwap", "xyFinance", "zerox", "orbiter", "relayLink", "mayanFinance", "jupiter"], data: [{ amount: amount_in_big.toString(), srcToken: sc_input, srcDecimals: des_input, destToken: sc_output, destDecimals: des_output, slippage: 0.3, toChain: chainCode }] };
                } else {
                    requestData = { fromAmount: amount_in_big.toString(), fromChainId: chainCode, fromTokenAddress: sc_input, toChainId: chainCode, toTokenAddress: sc_output, options: { integrator: "swap.marbleland.io", order: "CHEAPEST", maxPriceImpact: 0.4, allowSwitchChain: false, bridges: { deny: ["hop", "cbridge", "optimism", "arbitrum", "across", "omni", "celercircle", "allbridge", "thorswap", "symbiosis", "squid", "mayan", "mayanWH", "mayanMCTP", "relay", "polygon", "glacis", "stargateV2", "stargateV2Bus", "chainflip"] }, exchanges: { allow: ["1inch"] } } };
                }
            }
            break;

        case 'odos':
            apiUrl = action === "TokentoPair" ? "https://vercel-proxycors.vercel.app/?url=https://api.odos.xyz/sor/quote/v2" : "https://api.odos.xyz/sor/quote/v3";
            requestData = { chainId: chainCode, compact: true, disableRFQs: true, userAddr: SavedSettingData.walletMeta, inputTokens: [{ amount: amount_in_big.toString(), tokenAddress: sc_input }], outputTokens: [{ proportion: 1, tokenAddress: sc_output }], slippageLimitPercent: 0.3 };
            break;

        case '0x':
            apiUrl = chainName.toLowerCase() === 'solana' ? `https://matcha.xyz/api/swap/quote/solana?sellTokenAddress=${sc_input_in}&buyTokenAddress=${sc_output_in}&sellAmount=${amount_in_big}&dynamicSlippage=true&slippageBps=50&userPublicKey=Eo6CpSc1ViboPva7NZ1YuxUnDCgqnFDXzcDMDAF6YJ1L` : `https://matcha.xyz/api/swap/price?chainId=${chainCode}&buyToken=${sc_output}&sellToken=${sc_input}&sellAmount=${amount_in_big}`;
            break;
            
        case 'okx':
            var timestamp = new Date().toISOString();
            var path = "/api/v5/dex/aggregator/quote";
            var queryParams = `amount=${amount_in_big}&chainIndex=${chainCode}&fromTokenAddress=${sc_input_in}&toTokenAddress=${sc_output_in}`;
            var dataToSign = timestamp + "GET" + path + "?" + queryParams;
            var signature = calculateSignature("OKX", selectedApiKey.secretKeyOKX, dataToSign);
            apiUrl = `https://web3.okx.com${path}?${queryParams}`;
            headers = { "OK-ACCESS-KEY": selectedApiKey.ApiKeyOKX, "OK-ACCESS-SIGN": signature, "OK-ACCESS-PASSPHRASE": selectedApiKey.PassphraseOKX, "OK-ACCESS-TIMESTAMP": timestamp, "Content-Type": "application/json" };
            break;

        case 'jupiter':
            apiUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${sc_input_in}&outputMint=${sc_output_in}&amount=${amount_in_big}`;
            headers = {};
            break; 
        
        default:
            console.error("Unsupported DEX type");
            return;
    }

    $.ajax({
        url: apiUrl,
        method: ['odos', '1inch', 'lifi'].includes(dexType) ? 'POST' : 'GET',
        headers: headers,
        data: ['odos', '1inch', 'lifi'].includes(dexType) ? JSON.stringify(requestData) : undefined,
        contentType: ['odos', '1inch', 'lifi'].includes(dexType) ? 'application/json' : undefined,
        success: function (response) {
            var amount_out = null, FeeSwap = null, dexTitle = dexType.toUpperCase();
            try {
                switch (dexType) {
                    case 'kyberswap':
                        amount_out = response.data.routeSummary.amountOut / Math.pow(10, des_output);
                        FeeSwap = parseFloat(response.data.routeSummary.gasUsd) || getFeeSwap(chainName);
                        break;
                    case 'odos':
                        amount_out = parseFloat(response.outAmounts) / Math.pow(10, des_output);
                        FeeSwap = response.gasEstimateValue || getFeeSwap(chainName);
                        break;
                    case '1inch':
                    case 'lifi':
                        let quoteData, bestQuote, bestAmount = 0;
                        if(action === "TokentoPair" && dexType === '1inch') quoteData = response[Object.keys(response)[0]]?.quoteRates?.oneInchViaLifi;
                        if(action === "PairtoToken" && dexType === '1inch') quoteData = response.routes?.[0];
                        if(action === "TokentoPair" && dexType === 'lifi') {
                            (response.routes || []).forEach(route => {
                                if(route?.toAmount && parseFloat(route.toAmount) / Math.pow(10, des_output) > bestAmount) {
                                    bestAmount = parseFloat(route.toAmount) / Math.pow(10, des_output); bestQuote = route;
                                }
                            });
                            quoteData = bestQuote;
                        }
                        if(action === "PairtoToken" && dexType === 'lifi') {
                             Object.values(response[Object.keys(response)[0]]?.quoteRates || {}).forEach(data => {
                                if(data?.destAmount && parseFloat(data.destAmount) / Math.pow(10, des_output) > bestAmount) {
                                    bestAmount = parseFloat(data.destAmount) / Math.pow(10, des_output); bestQuote = data;
                                }
                            });
                            quoteData = bestQuote;
                        }

                        if(quoteData) {
                            amount_out = quoteData.toAmount ? (parseFloat(quoteData.toAmount) / Math.pow(10, des_output)) : (parseFloat(quoteData.destAmount) / Math.pow(10, des_output));
                            FeeSwap = parseFloat(quoteData.gasCostUSD || quoteData.fee?.gasFee?.[0]?.amountUSD) || getFeeSwap(chainName);
                            dexTitle = `${quoteData.steps?.[0]?.tool || response[Object.keys(response)[0]]?.recommendedSource || "unknown"} via ${dexType.toUpperCase()}`;
                        }
                        break;
                    case '0x':
                        amount_out = response.buyAmount / Math.pow(10, des_output);
                        FeeSwap = getFeeSwap(chainName);
                        break;
                    case 'okx':
                        amount_out = response.data[0].toTokenAmount / Math.pow(10, des_output);
                        FeeSwap = getFeeSwap(chainName);
                        break;
                    default: throw new Error(`DEX type ${dexType} not supported.`);
                }
                callback(null, { dexTitle, sc_input, des_input, sc_output, des_output, FeeSwap, amount_out, apiUrl });
            } catch (error) {
                callback({ statusCode: 500, pesanDEX: `Error DEX : ${error.message}`, color: "#f39999", DEX: dexType.toUpperCase() }, null);
            }
        },
        error: function (xhr) {
            var alertMessage = "Terjadi kesalahan", warna = "#f39999";
            // Error handling logic remains the same
            callback({ statusCode: xhr.status, pesanDEX:`${dexType.toUpperCase()}: ${alertMessage}`, color: warna, DEX: dexType.toUpperCase(), dexURL: linkDEX }, null);
        }, 
    });
}

/**
 * Fallback function to get price from SWOOP service.
 */
function getPriceSWOOP(sc_input, des_input, sc_output, des_output, amount_in, PriceRate,  dexType, NameToken, NamePair, cex,nameChain,codeChain,action, callback) {
    var SavedSettingData = getFromLocalStorage('SETTING_SCANNER', {});
    var payload = {
        "chainId": codeChain, "aggregatorSlug": dexType.toLowerCase(), "sender": SavedSettingData.walletMeta,
        "inToken": { "chainId": codeChain, "type": "TOKEN", "address": sc_input.toLowerCase(), "decimals": parseFloat(des_input) },
        "outToken": { "chainId": codeChain, "type": "TOKEN", "address": sc_output.toLowerCase(), "decimals": parseFloat(des_output) },
        "amountInWei": String(BigInt(Math.round(Number(amount_in)))), "slippageBps": "100", "gasPriceGwei": Number(getFromLocalStorage('gasGWEI', 0)),
    };
    $.ajax({
        url:'https://bzvwrjfhuefn.up.railway.app/swap', type: 'POST', contentType: 'application/json', data: JSON.stringify(payload),
        success: function (response) {
            var amount_out = parseFloat(response.amountOutWei) / Math.pow(10, des_output);
            const FeeSwap = getFeeSwap(nameChain);
            callback(null, { dexTitle: `${dexType} via SWOOP`, sc_input, des_input, sc_output, des_output, FeeSwap, dex: dexType, amount_out });
        },
        error: function (xhr) {
            // Error handling logic remains the same
            callback({ statusCode: xhr.status, pesanDEX: "SWOOP: Gagal", color: "#f39999", DEX: dexType.toUpperCase() }, null);
        }
    });
}

/**
 * Fetches USDT/IDR rate from Indodax.
 */
function getRateUSDT() {
    $.getJSON('https://indodax.com/api/ticker/usdtidr')
        .done(data => saveToLocalStorage('PRICE_RATE_USDT', parseFloat(data?.ticker?.last || 0)))
        .fail(() => toastr.error('KONEKSI INDODAX KENA LIMIT!'));
}

/**
 * Fetches gas fees for all configured chains.
 */
async function feeGasGwei() {
    const settings = getFromLocalStorage('SETTING_SCANNER', {});
    const allChains = settings.AllChains || [];
    if (!allChains.length) return;

    const chainInfos = allChains.map(name => {
        const data = getChainData(name);
        return data ? { ...data, rpc: data.RPC, symbol: data.BaseFEEDEX.replace("USDT", ""), gasLimit: data.GASLIMIT || 21000 } : null;
    }).filter(c => c && c.rpc && c.symbol);

    const symbols = [...new Set(chainInfos.map(c => c.BaseFEEDEX.toUpperCase()))];
    if (!symbols.length) return;

    try {
        const prices = await $.getJSON(`https://api-gcp.binance.com/api/v3/ticker/price?symbols=${encodeURIComponent(JSON.stringify(symbols))}`);
        const tokenPrices = Object.fromEntries(prices.map(p => [p.symbol.replace('USDT', ''), parseFloat(p.price)]));

        const gasResults = await Promise.all(chainInfos.map(async (chain) => {
            const price = tokenPrices[chain.symbol.toUpperCase()];
            if (!price) return null;
            try {
                const web3 = new Web3(new Web3.providers.HttpProvider(chain.rpc));
                const block = await web3.eth.getBlock("pending");
                const baseFee = Number(block?.baseFeePerGas ?? await web3.eth.getGasPrice());
                const gwei = (baseFee / 1e9) * 2;
                const gasUSD = (gwei * chain.gasLimit * price) / 1e9;
                return { chain: chain.Nama_Chain, key: chain.key || chain.symbol, symbol: chain.symbol, tokenPrice: price, gwei, gasUSD };
            } catch { return null; }
        }));
        saveToLocalStorage("ALL_GAS_FEES", gasResults.filter(Boolean));
    } catch (err) { console.error("Gagal ambil harga token gas:", err); }
}

/**
 * Calculates the API signature for a given exchange.
 */
function calculateSignature(exchange, apiSecret, dataToSign) {
    if (!apiSecret || !dataToSign) return null;
    const method = exchange.toUpperCase() === "OKX" ? "HmacSHA256" : "HmacSHA256";
    const encoding = exchange.toUpperCase() === "OKX" ? CryptoJS.enc.Base64 : CryptoJS.enc.Hex;
    return CryptoJS[method](dataToSign, apiSecret).toString(encoding);
}

/**
 * Returns a random API key for OKX DEX from the pool.
 */
function getRandomApiKeyOKX() {
    return apiKeysOKXDEX[Math.floor(Math.random() * apiKeysOKXDEX.length)];
}

/**
 * Sends a status message to Telegram.
 */
function sendStatusTELE(user, status) {
    const message = `<b>#MULTISCAN_SCANNER</b>\n<b>USER:</b> ${user ? user.toUpperCase() : '-'}[<b>${status ? status.toUpperCase() : '-'}]</b>`;
    $.post('https://api.telegram.org/bot8053447166:AAH7YYbyZ4eBoPX31D8h3bCYdzEeIaiG4JU/sendMessage', { chat_id: -1002079288809, text: message, parse_mode: "HTML", disable_web_page_preview: true });
}

/**
 * Sends a detailed arbitrage signal message to Telegram.
 */
function MultisendMessage(cex, dex, tokenData, modal, PNL, priceBUY, priceSELL, FeeSwap, FeeWD, totalFee, nickname, direction) {
    const chainConfig = CONFIG_CHAINS[String(tokenData.chain || '').toLowerCase()];
    if (!chainConfig) return;

    const fromSymbol = direction === 'cex_to_dex' ? tokenData.symbol : tokenData.pairSymbol;
    const toSymbol = direction === 'cex_to_dex' ? tokenData.pairSymbol : tokenData.symbol;
    const scIn = direction === 'cex_to_dex' ? tokenData.contractAddress : tokenData.pairContractAddress;
    const scOut = direction === 'cex_to_dex' ? tokenData.pairContractAddress : tokenData.contractAddress;

    const linkBuy = `<a href="${chainConfig.URL_Chain}/token/${scIn}">${fromSymbol}</a>`;
    const linkSell = `<a href="${chainConfig.URL_Chain}/token/${scOut}">${toSymbol}</a>`;
    const dexTradeLink = `<a href="https://swap.defillama.com/?chain=${chainConfig.Nama_Chain}&from=${scIn}&to=${scOut}">${dex.toUpperCase()}</a>`;
    const urls = GeturlExchanger(cex.toUpperCase(), fromSymbol, toSymbol) || {};
    const linkCEX = `<a href="${urls.tradeToken || '#'}">${cex.toUpperCase()}</a>`;

    const message = `<b>#MULTISCAN #${chainConfig.Nama_Chain.toUpperCase()}</b>\n<b>USER:</b> ~ ${nickname||'-'}\n-----------------------------------------\n<b>MARKET:</b> ${linkCEX} VS ${dexTradeLink}\n<b>TOKEN-PAIR:</b> <b>#<a href="${urls.tradeToken||'#'}">${fromSymbol}</a>_<a href="${urls.tradePair||'#'}">${toSymbol}</a></b>\n<b>MODAL:</b> $${modal} | <b>PROFIT:</b> ${PNL.toFixed(2)}$\n<b>BUY:</b> ${linkBuy} @ ${Number(priceBUY)||0}\n<b>SELL:</b> ${linkSell} @ ${Number(priceSELL)||0}\n<b>FEE WD:</b> ${Number(FeeWD).toFixed(3)}$\n<b>FEE TOTAL:</b> $${Number(totalFee).toFixed(2)} | <b>SWAP:</b> $${Number(FeeSwap).toFixed(2)}\n-----------------------------------------`;
    $.post('https://api.telegram.org/bot8053447166:AAH7YYbyZ4eBoPX31D8h3bCYdzEeIaiG4JU/sendMessage', { chat_id: -1002079288809, text: message, parse_mode: "HTML", disable_web_page_preview: true });
}

/**
 * Fetches wallet status from an exchange.
 */
async function fetchWalletStatus(cex) {
    const settings = getFromLocalStorage('SETTING_SCANNER', {});
    const keys = settings.api_keys?.[cex];
    if (!keys || !keys.ApiKey || !keys.ApiSecret) throw new Error(`${cex} API Key/Secret not configured.`);

    let url, headers, response;
    const timestamp = Date.now();

    switch(cex) {
        case 'BINANCE':
            const binanceQuery = `timestamp=${timestamp}`;
            const binanceSig = calculateSignature("BINANCE", keys.ApiSecret, binanceQuery);
            url = `https://proxykanan.awokawok.workers.dev/?https://api-gcp.binance.com/sapi/v1/capital/config/getall?${binanceQuery}&signature=${binanceSig}`;
            headers = { "X-MBX-ApiKey": keys.ApiKey };
            response = await $.ajax({ url, headers });
            return response.flatMap(item => item.networkList.map(net => ({ cex, tokenName: item.coin, chain: net.network, feeWDs: parseFloat(net.withdrawFee || 0), depositEnable: !!net.depositEnable, withdrawEnable: !!net.withdrawEnable })));

        case 'MEXC':
            const mexcQuery = `recvWindow=5000&timestamp=${timestamp}`;
            const mexcSig = calculateSignature("MEXC", keys.ApiSecret, mexcQuery);
            url = `https://proxykiri.awokawok.workers.dev/?https://api.mexc.com/api/v3/capital/config/getall?${mexcQuery}&signature=${mexcSig}`;
            headers = { "X-MEXC-APIKEY": keys.ApiKey };
            response = await $.ajax({ url, headers });
            return response.flatMap(item => item.networkList.map(net => ({ cex, tokenName: item.coin, chain: net.netWork, feeWDs: parseFloat(net.withdrawFee || 0), depositEnable: !!net.depositEnable, withdrawEnable: !!net.withdrawEnable })));

        case 'GATE':
            const host = "https://cors-anywhere.herokuapp.com/https://api.gateio.ws";
            const prefix = "/api/v4";
            const buildGateSig = (path, body = "") => calculateSignature("GATE", keys.ApiSecret, `GET\n${prefix}${path}\n\n${CryptoJS.SHA512(body).toString(CryptoJS.enc.Hex)}\n${Math.floor(timestamp/1000)}`);
            const gateHeaders = (path) => ({ KEY: keys.ApiKey, SIGN: buildGateSig(path), Timestamp: Math.floor(timestamp/1000) });
            const [wdData, statusData] = await Promise.all([
                $.ajax({ url: `${host}${prefix}/wallet/withdraw_status`, headers: gateHeaders("/wallet/withdraw_status") }),
                $.ajax({ url: `${host}${prefix}/spot/currencies`, headers: gateHeaders("/spot/currencies") })
            ]);
            return statusData.flatMap(item => item.chains.map(chain => {
                const feeItem = wdData.find(f => f.currency?.toUpperCase() === item.currency?.toUpperCase() && f.withdraw_fix_on_chains?.[chain.name]);
                return { cex, tokenName: item.currency, chain: chain.name, feeWDs: feeItem ? parseFloat(feeItem.withdraw_fix_on_chains[chain.name]) : 0, depositEnable: !chain.deposit_disabled, withdrawEnable: !chain.withdraw_disabled };
            }));
        default:
            return [];
    }
}


/**
 * Orchestrates fetching wallet status from all configured CEXs and updates TOKEN_SCANNER.
 */
async function checkAllCEXWallets() {
    $('#loadingOverlay').fadeIn(150);
    infoSet('🚀 Memulai pengecekan DATA CEX...');
    
    const settings = getFromLocalStorage('SETTING_SCANNER', {});
    const selectedCexes = Object.keys(settings.api_keys || {});
    if (selectedCexes.length === 0) {
        infoSet('⚠ Tidak ada CEX yang dikonfigurasi dengan API Key.');
        $('#loadingOverlay').fadeOut(150);
        return;
    }

    const fetchJobs = selectedCexes.map(cex => 
        fetchWalletStatus(cex).catch(err => {
            console.error(`❌ ${cex} gagal:`, err);
            infoAdd(`❌ ${cex} GAGAL (${err.message})`);
            return { error: true, cex, message: err.message };
        })
    );

    const results = await Promise.all(fetchJobs);
    const failed = results.filter(r => r.error);

    if(failed.length > 0) {
        alert(`❌ GAGAL UPDATE WALLET EXCHANGER.\n${failed.map(f=>`- ${f.cex}: ${f.message}`).join('\n')}`);
        $('#loadingOverlay').fadeOut(150);
        return;
    }

    const walletByCex = {};
    results.flat().forEach(item => {
        if(!walletByCex[item.cex]) walletByCex[item.cex] = [];
        walletByCex[item.cex].push(item);
    });

    infoAdd(`✅ Data wallet dari ${selectedCexes.join(', ')} berhasil diambil.`);
    
    let tokens = getFromLocalStorage('TOKEN_SCANNER', []);
    if (!tokens.length) {
        infoAdd('⚠ Tidak ada data token untuk di-update.');
        $('#loadingOverlay').fadeOut(150);
        return;
    }

    const updatedTokens = tokens.map(token => {
        const updatedDataCexs = { ...(token.dataCexs || {}) };
        (token.selectedCexs || []).forEach(cexKey => {
            const walletList = walletByCex[cexKey] || [];
            const updateForSymbol = (symbol, isTokenIn) => {
                if(!symbol) return;
                const match = walletList.find(w => w.tokenName.toUpperCase() === symbol.toUpperCase() && w.chain.toUpperCase() === (getChainData(token.chain)?.CEXCHAIN?.[cexKey]?.chainCEX || ''));
                if(match) {
                    updatedDataCexs[cexKey] = updatedDataCexs[cexKey] || {};
                    const feeField = isTokenIn ? 'feeWDToken' : 'feeWDPair';
                    const depositField = isTokenIn ? 'depositToken' : 'depositPair';
                    const withdrawField = isTokenIn ? 'withdrawToken' : 'withdrawPair';
                    updatedDataCexs[cexKey][feeField] = String(match.feeWDs || '0');
                    updatedDataCexs[cexKey][depositField] = !!match.depositEnable;
                    updatedDataCexs[cexKey][withdrawField] = !!match.withdrawEnable;
                }
            };
            updateForSymbol(token.symbol_in, true);
            updateForSymbol(token.symbol_out, false);
        });
        return { ...token, dataCexs: updatedDataCexs };
    });

    saveToLocalStorage('TOKEN_SCANNER', updatedTokens);
    infoAdd(`💾 ${updatedTokens.length} token berhasil diupdate.`);
    setLastAction("UPDATE WALLET EXCHANGER");
    alert('✅ BERHASIL\nData wallet & fee telah diperbarui.');
    location.reload();
}

  
      // fungsi dapatkan harga token dari Exchanger
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

            // Jika stablecoin → langsung isi data dummy
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

            // Jika bukan stablecoin → kasih delay sebelum request
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
                            let priceBuy, priceSell, volumesBuy, volumesSell;

                            if (isIndodax) {
                                priceBuy = processedData?.priceSell?.[2]?.price || 0;
                                priceSell = processedData?.priceBuy?.[2]?.price || 0;
                                volumesBuy = processedData?.priceSell || [];
                                volumesSell = processedData?.priceBuy || [];
                            } else {
                                volumesBuy = (processedData?.priceBuy || []).sort((a, b) => b.price - a.price);
                                volumesSell = (processedData?.priceSell || []).sort((a, b) => a.price - b.price);

                                priceBuy = volumesBuy[2]?.price || 0;
                                priceSell = volumesSell[2]?.price || 0;
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

        // Fungsi untuk mengecek harga pada DEX  
    function getPriceDEX(sc_input_in, des_input, sc_output_in, des_output, amount_in, PriceRate, dexType, NameToken, NamePair, cex,chainName,chainCode,action, callback) {
        const chainConfig = CONFIG_CHAINS[chainName.toLowerCase()];
        var sc_input=sc_input_in.toLowerCase();
        var sc_output=sc_output_in.toLowerCase();
        var dexId = `${cex}_${dexType.toUpperCase()}_${NameToken}_${NamePair}_${chainName}`;
        var SavedSettingData = getFromLocalStorage('SETTING_SCANNER', {});
        var selectedApiKey = getRandomApiKeyOKX();
        var amount_in = BigInt(Math.round(Math.pow(10, des_input) * amount_in));
        var apiUrl, requestData,headers;   
        var linkDEX = generateDexLink(dexType,chainName,chainCode,NameToken,sc_input_in, NamePair, sc_output);
      
        switch (dexType) {
            case 'kyberswap':
                    let NetChain;
                    if (chainName.toUpperCase() === "AVAX") {
                        NetChain = "avalanche";
                    }else{
                        NetChain=chainName;
                    }
                    

                // if (action === "TokentoPair") {
                    apiUrl = "https://aggregator-api.kyberswap.com/" + NetChain.toLowerCase() + "/api/v1/routes?tokenIn=" + sc_input + "&tokenOut=" + sc_output + "&amountIn=" + amount_in+ "&gasInclude=true";
                //  } else if (action === "PairtoToken") {
                //     if(chainCode==1){
                //         apiUrl = `https://api.zeroswap.io/quote/kyberswap?fromChain=${chainCode}&fromTokenAddress=${sc_input}&toTokenAddress=${sc_output}&fromTokenDecimals=${des_input}&toTokenDecimals=${des_output}&sellAmount=${amount_in}&slippage=0.3`;
                //     }else{
                //         apiUrl = "https://aggregator-api.kyberswap.com/" + NetChain.toLowerCase() + "/api/v1/routes?tokenIn=" + sc_input + "&tokenOut=" + sc_output + "&amountIn=" + amount_in+ "&gasInclude=true";
                //     }
                // }    
                break;
            
            case '1inch':
                // apiUrl = "https://1inch-nginx-proxy.vercel.app/swap/v6.1/"+ chainCode +"/quote?src="+sc_input+"&dst="+ sc_output +"&amount="+amount_in;
                if (action === "TokentoPair") {
                    apiUrl = "https://api.dzap.io/v1/quotes"; 
                    
                    requestData = {
                        account: SavedSettingData.walletMeta || '0x0000000000000000000000000000000000000000',
                        fromChain: chainCode,
                        integratorId: 'dzap', // opsional
                        allowedSources: ["oneInchViaLifi"],
                        notAllowedSources: [],
                        data: [{
                            amount: amount_in.toString(),
                            srcToken: sc_input,
                            srcDecimals: des_input, // kamu harus ambil dari metadata token
                            destToken: sc_output,
                            destDecimals: des_output, // ambil dari metadata juga
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
                                deny: [
                                    "hop", "cbridge", "optimism", "arbitrum", "across", "omni", "celercircle", "allbridge",
                                    "thorswap", "symbiosis", "squid", "mayan", "mayanWH", "mayanMCTP", "relay", "polygon",
                                    "glacis", "stargateV2", "stargateV2Bus", "chainflip"
                                ]
                            },
                            exchanges: {
                                allow: ["1inch"]
                            }
                        }
                    };

                }
                break;

            case 'lifi':
                 if (action === "TokentoPair") {
                    // Menggunakan MARBLE API (tidak membatasi hanya ke "1inch")
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
                                deny: [
                                    "hop", "cbridge", "optimism", "arbitrum", "across", "omni", "celercircle", "allbridge",
                                    "thorswap", "symbiosis", "squid", "mayan", "mayanWH", "mayanMCTP", "relay", "polygon",
                                    "glacis", "stargateV2", "stargateV2Bus", "chainflip"
                                ]
                            },
                            // Tidak ada exchanges.allow → biarkan Marble memilih semua DEX terbaik
                            // Jika ingin eksplisit: hapus properti 'exchanges' atau biarkan kosong
                        }
                    };
                }else if (action === "PairtoToken") {
                    // Menggunakan DZAP API (tidak membatasi ke "1inch" saja)
                    apiUrl = "https://api.dzap.io/v1/quotes";
                    
                    requestData = {
                        account: SavedSettingData.walletMeta || '0x0000000000000000000000000000000000000000',
                        fromChain: chainCode,
                        integratorId: 'dzap',
                        allowedSources: [ // biarkan semua source aktif (tanpa dibatasi hanya "1inch")
                            "bebop", "enso", "iceCreamSwap", "izumi", "kyberSwap", "lifi", "magpie",
                            "odos", "okx", "oneInchViaLifi", "openOcean", "paraSwap", "sushiswap",
                            "synapse", "uniswap", "unizen", "vaporDex", "woodSwap", "xyFinance",
                            "zerox", "orbiter", "relayLink", "mayanFinance", "jupiter"
                        ],
                        notAllowedSources: [],
                        data: [{
                            amount: amount_in.toString(),
                            srcToken: sc_input,
                            srcDecimals: des_input,  // ← ambil dari metadata token
                            destToken: sc_output,
                            destDecimals: des_output, // ← ambil dari metadata token
                            slippage: 0.3,
                            toChain: chainCode
                        }]
                    };
                    
                } 

                break;

            case 'odos':
                 if (action === "TokentoPair") {
                    // apiUrl = "https://ethmainnet.server.hinkal.pro/OdosSwapData";
                    // requestData = {
                    //     chainId: chainCode,
                    //     compact: true,
                    //     disableRFQs: true,
                    //     userAddr: SavedSettingData.walletMeta,
                    //     inputTokens: [{ amount: amount_in.toString(), tokenAddress: sc_input }],
                    //     outputTokens: [{ proportion: 1, tokenAddress: sc_output }],
                    //     slippageLimitPercent: 0.3,
                    // }; 
                     apiUrl =  "https://vercel-proxycors.vercel.app/?url=https://api.odos.xyz/sor/quote/v2";               
                    requestData = {
                        chainId: chainCode,
                        compact: true,
                        disableRFQs: true,
                        userAddr: SavedSettingData.walletMeta,
                        inputTokens: [{ amount: amount_in.toString(), tokenAddress: sc_input }],
                        outputTokens: [{ proportion: 1, tokenAddress: sc_output }],
                        slippageLimitPercent: 0.3,
                    };   
                 } else if (action === "PairtoToken") {
                    // apiUrl = "https://bzvwrjfhuefn.up.railway.app/swap";               
                   //  var amount_in = BigInt(Math.round(Number(amount_in)));
                    
                    // var requestData = {
                    //     "chainId": chainCode,
                    //     "aggregatorSlug": 'odos',
                    //     "sender": SavedSettingData.walletMeta,
                    //     "inToken": {
                    //         "chainId": chainCode,
                    //         "type": "TOKEN",
                    //         "address": sc_input.toLowerCase(),
                    //         "decimals": parseFloat(des_input)
                    //     },
                    //     "outToken": {
                    //         "chainId": chainCode,
                    //         "type": "TOKEN",
                    //         "address": sc_output.toLowerCase(),
                    //         "decimals": parseFloat(des_output)
                    //     },
                    //     "amountInWei": String(amount_in),
                    //     "slippageBps": "100",
                    //     "gasPriceGwei": Number(getFromLocalStorage('gasGWEI', 0)),
                    // };
                    
                    apiUrl = "https://api.odos.xyz/sor/quote/v3";               
                    requestData = {
                        chainId: chainCode,
                        compact: true,
                        disableRFQs: true,
                        userAddr: SavedSettingData.walletMeta,
                        inputTokens: [{ amount: amount_in.toString(), tokenAddress: sc_input }],
                        outputTokens: [{ proportion: 1, tokenAddress: sc_output }],
                        slippageLimitPercent: 0.3,
                    };         
                    
                 }
                 break;

            case '0x':           
                if(chainName.toLowerCase() === 'solana'){
                    apiUrl = "https://matcha.xyz/api/swap/quote/solana?sellTokenAddress="+sc_input_in+"&buyTokenAddress="+sc_output_in+"&sellAmount="+amount_in+"&dynamicSlippage=true&slippageBps=50&userPublicKey=Eo6CpSc1ViboPva7NZ1YuxUnDCgqnFDXzcDMDAF6YJ1L";
                }else{
                    apiUrl = "https://matcha.xyz/api/swap/price?chainId=" + chainCode +"&buyToken=" + sc_output + "&sellToken=" + sc_input + "&sellAmount=" + amount_in ;
                }
                break;
                
            case 'okx':
                var timestamp = new Date().toISOString();
                var method = "GET";

                var path = "/api/v5/dex/aggregator/quote";
                var queryParams = `amount=${amount_in}` +
                                `&chainIndex=${chainCode}` +
                                `&fromTokenAddress=${sc_input_in}` +
                                `&toTokenAddress=${sc_output_in}`;

                var dataToSign = timestamp + method + path + "?" + queryParams;
                var signature = calculateSignature("OKX", selectedApiKey.secretKeyOKX, dataToSign, "BASE64");

                apiUrl = `https://web3.okx.com${path}?${queryParams}`;
                break;


            case 'jupiter':
                apiUrl = "https://quote-api.jup.ag/v6/quote?inputMint=" + sc_input_in + "&outputMint=" + sc_output_in + "&amount=" + amount_in;
                headers = {}; // Tidak memerlukan header khusus
                break; 
            

            default:
                console.error("Unsupported DEX type");
                return;
        }

            // Siapkan URL dan data sebelumnya (misalnya: apiUrl, requestData, signature, timestamp, selectedApiKey)
        $.ajax({
            url: apiUrl,
            method: ['odos', '1inch', 'lifi'].includes(dexType) ? 'POST' : 'GET',

            headers: Object.assign(
                {},
                headers || {},
                dexType === 'okx' ? {
                    "OK-ACCESS-KEY": selectedApiKey.ApiKeyOKX,
                    "OK-ACCESS-SIGN": signature,
                    "OK-ACCESS-PASSPHRASE": selectedApiKey.PassphraseOKX,
                    "OK-ACCESS-TIMESTAMP": timestamp,
                    "Content-Type": "application/json"
                } : {}
            ),

            data: ['odos', '1inch', 'lifi'].includes(dexType)
                ? JSON.stringify(requestData)  // Untuk DEX POST seperti ODOS, 1inch, dll
                : undefined, // Untuk GET seperti OKX
            contentType: ['odos', '1inch', 'lifi'].includes(dexType)
                ? 'application/json'
                : undefined,
          //  timeout: parseInt(SavedSettingData.waktuTunggu) * 1000, // Ambil waktu tunggu dari localStorage atau default ke 0
            success: function (response, xhr) {
                //console.log("RESPONSE DEX: ",response)
                var amount_out = null, FeeSwap = null; // Default kosong
                try {
                    
                    switch (dexType) {
                            case 'kyberswap':
                                dexTitle = "KYBESWAP";
                               // if (action === "TokentoPair") {
                                    amount_out = response.data.routeSummary.amountOut / Math.pow(10, des_output);
                                    FeeSwap = parseFloat(response.data.routeSummary.gasUsd) || getFeeSwap(chainConfig.Nama_Chain);
                                // } else if (action === "PairtoToken") {
                                //     if (chainCode == 1) {
                                //         const estimation = response.quote.estimation;
                                //         amount_out = parseFloat(estimation.buyAmount) / Math.pow(10, des_output);
                                //         FeeSwap = getFeeSwap(chainConfig.Nama_Chain);
                                //     } else {
                                //         amount_out = response.data.routeSummary.amountOut / Math.pow(10, des_output);
                                //         FeeSwap = parseFloat(response.data.routeSummary.gasUsd) || getFeeSwap(chainConfig.Nama_Chain);
                                //     }
                                // }
                                break;

                            case 'odos':
                                dexTitle = "ODOS";
                                // if (action === "TokentoPair") {
                                //     amount_out = parseFloat(response.odosResponse.outValues[0]) / PriceRate;
                                //     FeeSwap = response.odosResponse.gasEstimateValue || getFeeSwap(chainConfig.Nama_Chain);
                                // } else if (action === "PairtoToken") {
                                //     amount_out = parseFloat(response.outAmounts) / Math.pow(10, des_output);
                                //     FeeSwap = response.gasEstimateValue || getFeeSwap(chainConfig.Nama_Chain);
                                // }
                                    amount_out = parseFloat(response.outAmounts) / Math.pow(10, des_output);
                                    FeeSwap = response.gasEstimateValue || getFeeSwap(chainConfig.Nama_Chain);
                                break;

                            case '1inch':
                                dexTitle = "1INCH";
                                if (action === "TokentoPair") {
                                    const key = Object.keys(response)[0];
                                    const quoteData = response[key]?.quoteRates?.oneInchViaLifi;
                                    if (quoteData) {
                                        amount_out = parseFloat(quoteData.destAmount / Math.pow(10, des_output));
                                        FeeSwap = parseFloat(quoteData.fee?.gasFee?.[0]?.amountUSD) || getFeeSwap(chainConfig.Nama_Chain);
                                    }
                                } else if (action === "PairtoToken") {
                                    const quoteData = response.routes?.[0];
                                    if (quoteData) {
                                        amount_out = parseFloat(quoteData.toAmount / Math.pow(10, des_output));
                                        FeeSwap = parseFloat(quoteData.gasCostUSD) || getFeeSwap(chainConfig.Nama_Chain);
                                    }
                                }
                                break;

                            case '0x':
                                amount_out = response.buyAmount / Math.pow(10, des_output);
                                dexTitle = "0X";
                                FeeSwap = getFeeSwap(chainConfig.Nama_Chain);
                                break;

                            case 'okx':
                                dexTitle = "0KX";
                                amount_out = response.data[0].toTokenAmount / Math.pow(10, des_output);
                                FeeSwap = getFeeSwap(chainConfig.Nama_Chain);
                                break;

                            case 'lifi':
                                // LIFI TokentoPair
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
                                        FeeSwap = parseFloat(bestQuote.gasCostUSD) || getFeeSwap(chainConfig.Nama_Chain);
                                        dexTitle = `${bestQuote.steps?.[0]?.tool || "unknown"} via LIFI`;
                                    }
                                } 
                                // LIFI PairtoToken
                                else if (action === "PairtoToken") {
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
                                        FeeSwap = parseFloat(bestQuote?.fee?.gasFee?.[0]?.amountUSD) || getFeeSwap(chainConfig.Nama_Chain);
                                        dexTitle = `${response[key]?.recommendedSource || "unknown"} via DZAP`;
                                    }
                                }
                                break;

                            default:
                                throw new Error(`DEX type ${dexType} not supported.`);
                        }

                        const result = {
                            dexTitle: dexTitle,
                            sc_input: sc_input,
                            des_input: des_input,
                            sc_output: sc_output,
                            des_output: des_output,
                            FeeSwap: FeeSwap,
                            amount_out: amount_out,
                            apiUrl: apiUrl,
                        };

                        callback(null, result);
                    } catch (error) {
                        callback({
                            statusCode: 500,
                            pesanDEX: `Error DEX : ${error.message}`,
                            color: "#f39999",
                            DEX: dexType.toUpperCase(),
                        }, null);
                    }
            },
            
            error: function (xhr) {
                var alertMessage = "Terjadi kesalahan";
                var warna = "#f39999";
                switch (xhr.status) {
                    case 0:  
                        if(dexType=='kyberswap' || dexType =='odos' ||  dexType == '0x'){
                            alertMessage = "KENA LIMIT";
                        }
                            else{
                            alertMessage = "NULL RESPONSE";
                        }
                        break;                        
                    case 400:
                        try { 
                            var errorResponse = JSON.parse(xhr.responseText);
                            if (
                                (errorResponse.description && errorResponse.description.toLowerCase().includes("insufficient liquidity")) || 
                                (errorResponse.error && errorResponse.error.toLowerCase().includes("no routes found with enough liquidity"))
                            ) {
                                alertMessage = "NO LP (No Liquidity Provider)";
                                warna = "#f39999";
                            } else {
                                alertMessage = errorResponse.detail || errorResponse.description || errorResponse.error || "KONEKSI BURUK";
                            }
                        } catch (e) {
                            alertMessage = "KONEKSI LAMBAT"; // Jika parsing gagal
                        }
                    break;
                    case 401:
                        alertMessage = "API SALAH";
                        break;
                    case 403:
                        alertMessage = "AKSES DIBLOK";
                        warna = "#fff";
                        break;
                    case 404:
                        alertMessage = "Permintaan tidak ditemukan";
                        break ;
                    case 429:
                            warna = "#f39999";
                            alertMessage = "AKSES KENA LIMIT";
                        break;
                    case 500:
                        try {
                            var errorResponse = JSON.parse(xhr.responseText);
                            if (errorResponse.msg && errorResponse.msg.toLowerCase().includes("too many requests")) {
                                alertMessage = "AKSES KENA LIMIT (500 Too Many Requests)";
                                warna = "#f39999";
                            } else {
                                alertMessage = errorResponse.detail || "GAGAL DAPATKAN DATA";
                            }
                        } catch (e) {
                            alertMessage = "GAGAL DAPATKAN DATA";
                        }
                        break;
                    case 503:
                        alertMessage = "Layanan tidak tersedia";
                        break;
                    case 502:
                        alertMessage = "Respons tidak valid";
                        break;
                    default:
                        warna = "#f39999";
                        alertMessage = "Status: " + xhr.status;
                }
                $(`#SWAP_${dexId}`).html(`<a href="${linkDEX}" title="${dexType.toUpperCase()}: ${alertMessage}" target="_blank" class="uk-text-danger"><i class="bi bi-x-circle"></i> ${dexType.toUpperCase()} </a>`);

                callback({ 
                    statusCode: xhr.status, 
                    pesanDEX:`${dexType.toUpperCase()}: ${alertMessage}`,
                    color: warna, 
                    DEX: dexType.toUpperCase(),
                    dexURL: linkDEX 
                }, null);
            }, 
        });
    }

    // Fungsi untuk mengecek harga pada SWOOP
    function getPriceSWOOP(sc_input, des_input, sc_output, des_output, amount_in, PriceRate,  dexType, NameToken, NamePair, cex,nameChain,codeChain,action, callback) {
        const chainName = nameChain.toLowerCase();
        const chainConfig = CONFIG_CHAINS[chainName];
        var SavedSettingData = getFromLocalStorage('SETTING_SCANNER', {});
        var dexId = `${cex}_${dexType.toUpperCase()}_${NameToken}_${NamePair}_${(chainConfig.Nama_Chain).toUpperCase()}`;
       // var amount_in = Math.pow(10, des_input) * amount_in;
        var amount_in = BigInt(Math.round(Number(amount_in)));
        var dexURL = generateDexLink(dexType,chainName,codeChain,NameToken,sc_input, NamePair, sc_output);
        
        var payload = {
            "chainId": codeChain,
            "aggregatorSlug": dexType.toLowerCase(),
            "sender": SavedSettingData.walletMeta,
            "inToken": {
                "chainId": codeChain,
                "type": "TOKEN",
                "address": sc_input.toLowerCase(),
                "decimals": parseFloat(des_input)
            },
            "outToken": {
                "chainId": codeChain,
                "type": "TOKEN",
                "address": sc_output.toLowerCase(),
                "decimals": parseFloat(des_output)
            },
            "amountInWei": String(amount_in),
            "slippageBps": "100",
            "gasPriceGwei": Number(getFromLocalStorage('gasGWEI', 0)),
        };
    
        $.ajax({
            url:'https://bzvwrjfhuefn.up.railway.app/swap',

            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function (response) {
                    var amount_out = parseFloat(response.amountOutWei) / Math.pow(10, des_output);
                    
                    const FeeSwap = getFeeSwap(chainConfig.Nama_Chain);
                   // var FeeSwap = ((parseFloat(getFromLocalStorage('gasGWEI')) * 250000) / Math.pow(10, 9))*parseFloat(getFromLocalStorage('PRICEGAS'));
                    const result = {
                            dexTitle: dexType+" via SWOOP",
                            sc_input: sc_input,
                            des_input: des_input,
                            sc_output: sc_output,
                            des_output: des_output,
                            FeeSwap: FeeSwap,
                            dex: dexType,
                            amount_out: amount_out,
                        };
                        callback(null, result);
                    },
            error: function (xhr) {
                var alertMessage = "Terjadi kesalahan";
                var warna = "#f39999";
            
                switch (xhr.status) {
                    case 0:
                        alertMessage = "NO RESPONSE";
                        break;
                    case 400:
                        try {
                            var errorResponse = JSON.parse(xhr.responseText);
                            alertMessage = errorResponse.detail || errorResponse.description || "KONEKSI BURUK";
                        } catch (e) {
                            alertMessage = "KONEKSI LAMBAT"; // Jika parsing gagal
                        }
                        break;
                    case 403:
                        alertMessage = "AKSES DIBLOK";
                        break;
                    case 404:
                        alertMessage = "Permintaan tidak ditemukan";
                        break;
                    case 429:
                       alertMessage = "AKSES KENA LIMIT";
                        break;
                    case 500:
                        try {
                            var errorResponse = JSON.parse(xhr.responseText);
                            alertMessage = errorResponse.message || "GAGAL DAPATKAN DATA";
                        } catch (e) {
                            alertMessage = "GAGAL DAPATKAN DATA"; // Jika parsing gagal
                        }
                        break;
                    case 503:
                        alertMessage = "Layanan tidak tersedia";
                        break;
                    case 502:
                        alertMessage = "Respons tidak valid";
                        break;
                    default:
                        warna = "#f39999";
                        alertMessage = "Status: " + xhr.status;
                }

//                $(`#SWAP_${dexId}`).html(`<a href="${dexURL}" title="${dexType.toUpperCase()}: ${alertMessage}" target="_blank" class="uk-text-danger"><i class="bi bi-x-circle"></i> ${dexType.toUpperCase()} </a>`);

                // Kirim callback untuk penanganan lebih lanjut
                callback({ 
                    statusCode: xhr.status, 
                    pesanDEX: "SWOOP: "+alertMessage, 
                    color: warna, 
                    DEX: dexType.toUpperCase(), 
                    dexURL: dexURL 
                }, null);
            }
            
        });
    }

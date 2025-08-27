import { getFromLocalStorage } from '../storage.js';
import { getFeeSwap } from '../core/scanner.js'; // Dependency for fee calculation
import { calculateSignature } from './cexApi.js'; // Dependency for OKX

const { CONFIG_CHAINS, apiKeysOKXDEX } = window;

function getRandomApiKeyOKX() {
    const randomIndex = Math.floor(Math.random() * apiKeysOKXDEX.length);
    return apiKeysOKXDEX[randomIndex];
}

function generateDexLink(dex, chainName, codeChain, NameToken, sc_input, NamePair, sc_output) {
    const link = {
        'kyberswap': `https://kyberswap.com/swap/${chainName}/${sc_input}-to-${sc_output}`,
        'odos': "https://app.odos.xyz",
        '0x': `https://matcha.xyz/tokens/${codeChain}/${sc_input.toLowerCase()}?buyChain=${codeChain}&buyAddress=${sc_output.toLowerCase()}`,
        '1inch': `https://app.1inch.io/advanced/swap?network=${codeChain}&src=${sc_input.toUpperCase()}&dst=${sc_output.toUpperCase()}`,
        'okx': `https://www.okx.com/web3/dex-swap?inputChain=${codeChain}&inputCurrency=${sc_input}&outputChain=501&outputCurrency=${sc_output}`,
        'lifi': `https://jumper.exchange/?fromChain=${codeChain}&fromToken=${sc_input}&toChain=${codeChain}&toToken=${sc_output}`,
    };
    return link[dex] || '#';
}

function getApiConfigForDex(dexType, params) {
    const { chainCode, sc_input, sc_output, amount_in, des_input, des_output, SavedSettingData, action } = params;
    const wallet = SavedSettingData.walletMeta || '0x0000000000000000000000000000000000000000';

    switch (dexType) {
        case 'kyberswap':
            const netChain = params.chainName.toUpperCase() === "AVAX" ? "avalanche" : params.chainName;
            return {
                url: `https://aggregator-api.kyberswap.com/${netChain.toLowerCase()}/api/v1/routes?tokenIn=${sc_input}&tokenOut=${sc_output}&amountIn=${amount_in}&gasInclude=true`,
                method: 'GET'
            };

        case '1inch':
            if (action === "TokentoPair") {
                return {
                    url: "https://api.dzap.io/v1/quotes",
                    method: 'POST',
                    data: {
                        account: wallet, fromChain: chainCode, integratorId: 'dzap',
                        allowedSources: ["oneInchViaLifi"], notAllowedSources: [],
                        data: [{ amount: amount_in.toString(), srcToken: sc_input, srcDecimals: des_input, destToken: sc_output, destDecimals: des_output, slippage: 0.3, toChain: chainCode }]
                    }
                };
            }
            return {
                url: "https://api-v1.marbleland.io/api/v1/jumper/api/p/lifi/advanced/routes",
                method: 'POST',
                data: {
                    fromAmount: amount_in.toString(), fromChainId: chainCode, fromTokenAddress: sc_input, toChainId: chainCode, toTokenAddress: sc_output,
                    options: { integrator: "swap.marbleland.io", order: "CHEAPEST", maxPriceImpact: 0.4, allowSwitchChain: false, exchanges: { allow: ["1inch"] } }
                }
            };

        case 'lifi':
             // Complex logic with different endpoints based on 'action'
             // This can be further simplified, but for now, we keep the original logic.
            if (action === "TokentoPair") {
                 return {
                    url: "https://api-v1.marbleland.io/api/v1/jumper/api/p/lifi/advanced/routes",
                    method: 'POST',
                    data: { fromAmount: amount_in.toString(), fromChainId: chainCode, fromTokenAddress: sc_input, toChainId: chainCode, toTokenAddress: sc_output, options: { integrator: "swap.marbleland.io", order: "CHEAPEST" } }
                 };
            }
            return {
                url: "https://api.dzap.io/v1/quotes",
                method: 'POST',
                data: { account: wallet, fromChain: chainCode, integratorId: 'dzap', data: [{ amount: amount_in.toString(), srcToken: sc_input, srcDecimals: des_input, destToken: sc_output, destDecimals: des_output, slippage: 0.3, toChain: chainCode }] }
            };

        case 'odos':
            return {
                url: "https://api.odos.xyz/sor/quote/v2",
                method: 'POST',
                data: { chainId: chainCode, userAddr: wallet, inputTokens: [{ amount: amount_in.toString(), tokenAddress: sc_input }], outputTokens: [{ proportion: 1, tokenAddress: sc_output }], slippageLimitPercent: 0.3 }
            };

        case '0x':
            return {
                url: `https://matcha.xyz/api/swap/price?chainId=${chainCode}&buyToken=${sc_output}&sellToken=${sc_input}&sellAmount=${amount_in}`,
                method: 'GET'
            };

        case 'okx':
            const timestamp = new Date().toISOString();
            const path = "/api/v5/dex/aggregator/quote";
            const queryParams = `amount=${amount_in}&chainIndex=${chainCode}&fromTokenAddress=${sc_input}&toTokenAddress=${sc_output}`;
            const dataToSign = timestamp + "GET" + path + "?" + queryParams;
            const selectedApiKey = getRandomApiKeyOKX();
            const signature = calculateSignature("OKX", selectedApiKey.secretKeyOKX, dataToSign);
            return {
                url: `https://web3.okx.com${path}?${queryParams}`,
                method: 'GET',
                headers: {
                    "OK-ACCESS-KEY": selectedApiKey.ApiKeyOKX, "OK-ACCESS-SIGN": signature,
                    "OK-ACCESS-PASSPHRASE": selectedApiKey.PassphraseOKX, "OK-ACCESS-TIMESTAMP": timestamp,
                    "Content-Type": "application/json"
                }
            };
        default:
            return null;
    }
}

function parseDexResponse(dexType, response, des_output, chainName, action) {
    let amount_out = null, FeeSwap = null, dexTitle = dexType.toUpperCase();
    const chainConfig = CONFIG_CHAINS[chainName.toLowerCase()];
    const defaultFee = getFeeSwap(chainName);

    try {
        switch (dexType) {
            case 'kyberswap':
                amount_out = response.data.routeSummary.amountOut / Math.pow(10, des_output);
                FeeSwap = parseFloat(response.data.routeSummary.gasUsd) || defaultFee;
                break;
            case 'odos':
                amount_out = parseFloat(response.outAmounts) / Math.pow(10, des_output);
                FeeSwap = response.gasEstimateValue || defaultFee;
                break;
            case '1inch':
                if (action === "TokentoPair") {
                    const quoteData = response[Object.keys(response)[0]]?.quoteRates?.oneInchViaLifi;
                    if (quoteData) {
                        amount_out = parseFloat(quoteData.destAmount / Math.pow(10, des_output));
                        FeeSwap = parseFloat(quoteData.fee?.gasFee?.[0]?.amountUSD) || defaultFee;
                    }
                } else {
                    const quoteData = response.routes?.[0];
                    if (quoteData) {
                        amount_out = parseFloat(quoteData.toAmount / Math.pow(10, des_output));
                        FeeSwap = parseFloat(quoteData.gasCostUSD) || defaultFee;
                    }
                }
                break;
            case '0x':
                amount_out = response.buyAmount / Math.pow(10, des_output);
                FeeSwap = defaultFee;
                break;
            case 'okx':
                amount_out = response.data[0].toTokenAmount / Math.pow(10, des_output);
                FeeSwap = defaultFee;
                break;
            case 'lifi':
                 if (action === "TokentoPair") {
                    const bestQuote = (response.routes || []).reduce((best, route) => {
                        const amount = parseFloat(route.toAmount);
                        return amount > (best?.amount || 0) ? { amount, route } : best;
                    }, null);
                    if (bestQuote) {
                        amount_out = bestQuote.amount / Math.pow(10, des_output);
                        FeeSwap = parseFloat(bestQuote.route.gasCostUSD) || defaultFee;
                        dexTitle = `${bestQuote.route.steps?.[0]?.tool || "unknown"} via LIFI`;
                    }
                } else {
                    const quoteSources = response[Object.keys(response)[0]]?.quoteRates;
                    const bestQuote = Object.values(quoteSources || {}).reduce((best, data) => {
                         const amount = parseFloat(data.destAmount);
                         return amount > (best?.amount || 0) ? { amount, data } : best;
                    }, null);
                    if(bestQuote) {
                        amount_out = bestQuote.amount / Math.pow(10, des_output);
                        FeeSwap = parseFloat(bestQuote.data?.fee?.gasFee?.[0]?.amountUSD) || defaultFee;
                        dexTitle = `${response[Object.keys(response)[0]]?.recommendedSource || "unknown"} via DZAP`;
                    }
                }
                break;
            default: throw new Error(`DEX type ${dexType} not supported for parsing.`);
        }
        return { dexTitle, amount_out, FeeSwap };
    } catch (error) {
        console.error(`Error parsing ${dexType} response:`, error, response);
        throw error;
    }
}

export function getPriceDEX(params, callback) {
    const { dexType, chainName, chainCode, NameToken, sc_input, NamePair, sc_output } = params;
    const apiConfig = getApiConfigForDex(dexType, params);
    if (!apiConfig) return callback({ pesanDEX: `Unsupported DEX type: ${dexType}` }, null);

    const linkDEX = generateDexLink(dexType, chainName, chainCode, NameToken, sc_input, NamePair, sc_output);

    $.ajax({
        url: apiConfig.url,
        method: apiConfig.method,
        headers: apiConfig.headers || {},
        data: apiConfig.data ? JSON.stringify(apiConfig.data) : undefined,
        contentType: apiConfig.data ? 'application/json' : undefined,
        success: function (response) {
            try {
                const result = parseDexResponse(dexType, response, params.des_output, chainName, params.action);
                callback(null, { ...result, apiUrl: apiConfig.url });
            } catch (error) {
                callback({ pesanDEX: `Error parsing DEX response: ${error.message}`, DEX: dexType.toUpperCase() }, null);
            }
        },
        error: function (xhr) {
            let alertMessage = `Status: ${xhr.status}`;
            if (xhr.status === 400) alertMessage = "NO LP (Insufficient Liquidity)";
            if (xhr.status === 429) alertMessage = "AKSES KENA LIMIT";
            if (xhr.status === 500) alertMessage = "GAGAL DAPATKAN DATA";
            callback({ pesanDEX: `${dexType.toUpperCase()}: ${alertMessage}`, dexURL: linkDEX }, null);
        },
    });
}

export function getPriceSWOOP(params, callback) {
    const { sc_input, des_input, sc_output, des_output, amount_in, dexType, nameChain, codeChain } = params;
    const SavedSettingData = getFromLocalStorage('SETTING_SCANNER', {});
    const payload = {
        "chainId": codeChain,
        "aggregatorSlug": dexType.toLowerCase(),
        "sender": SavedSettingData.walletMeta,
        "inToken": { "chainId": codeChain, "type": "TOKEN", "address": sc_input.toLowerCase(), "decimals": parseFloat(des_input) },
        "outToken": { "chainId": codeChain, "type": "TOKEN", "address": sc_output.toLowerCase(), "decimals": parseFloat(des_output) },
        "amountInWei": String(BigInt(Math.round(Number(amount_in)))),
        "slippageBps": "100",
        "gasPriceGwei": Number(getFromLocalStorage('gasGWEI', 0)),
    };

    $.ajax({
        url: 'https://bzvwrjfhuefn.up.railway.app/swap',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        success: function (response) {
            const amount_out = parseFloat(response.amountOutWei) / Math.pow(10, des_output);
            const FeeSwap = getFeeSwap(nameChain);
            const result = {
                dexTitle: `${dexType} via SWOOP`,
                amount_out, FeeSwap,
            };
            callback(null, result);
        },
        error: function (xhr) {
             callback({ pesanDEX: `SWOOP Error: Status ${xhr.status}` }, null);
        }
    });
}

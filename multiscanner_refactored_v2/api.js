// =================================================================================
// API AND NETWORK REQUESTS
// =================================================================================

function convertIDRtoUSDT(idrAmount) {
    const rateUSDT = getFromLocalStorage("PRICE_RATE_USDT", 0);
    if (!rateUSDT || rateUSDT === 0) return 0;
    return parseFloat((idrAmount / rateUSDT).toFixed(8));
}

function processOrderBook(data) {
    const priceBuy = data.bids.slice(0, 3).map(([price, volume]) => ({
        price: parseFloat(price),
        volume: parseFloat(volume) * parseFloat(price)
    })).reverse();
    const priceSell = data.asks.slice(0, 3).map(([price, volume]) => ({
        price: parseFloat(price),
        volume: parseFloat(volume) * parseFloat(price)
    })).reverse();
    return { priceBuy, priceSell };
}

const exchangeConfig = {
    GATE: { url: c => `https://api.gateio.ws/api/v4/spot/order_book?limit=5&currency_pair=${c.symbol}_USDT`, processData: processOrderBook },
    BINANCE: { url: c => `https://api.binance.me/api/v3/depth?limit=4&symbol=${c.symbol}USDT`, processData: processOrderBook },
    MEXC: { url: c => `https://api.mexc.com/api/v3/depth?symbol=${c.symbol}USDT&limit=5`, processData: processOrderBook },
    INDODAX: {
        url: c => `https://indodax.com/api/depth/${c.symbol.toLowerCase()}idr`,
        processData: data => {
            if (!data?.buy || !data?.sell) return { priceBuy: [], priceSell: [] };
            const priceBuy = data.buy.slice(0, 3).map(([p, v]) => ({ price: convertIDRtoUSDT(parseFloat(p)), volume: convertIDRtoUSDT(p * v) }));
            const priceSell = data.sell.slice(0, 3).map(([p, v]) => ({ price: convertIDRtoUSDT(parseFloat(p)), volume: convertIDRtoUSDT(p * v) }));
            return { priceSell, priceBuy };
        }
    }
};

function getPriceCEX(coins, NameToken, NamePair, cex, callback) {
    const config = exchangeConfig[cex];
    if (!config) return callback(`Exchange ${cex} tidak ditemukan.`, null);

    const settings = getFromLocalStorage("SETTING_SCANNER", {});
    const jedaCex = settings?.JedaCexs?.[cex] || 0;
    const tokenData = getFromLocalStorage("TOKEN_SCANNER", []).find(item =>
        String(item.symbol_in).toUpperCase() === String(NameToken).toUpperCase() &&
        String(item.symbol_out).toUpperCase() === String(NamePair).toUpperCase() &&
        (item.selectedCexs || []).map(x => String(x).toUpperCase()).includes(cex.toUpperCase())
    );

    let results = {};
    const urls = [stablecoins.includes(NameToken) ? null : config.url({ symbol: NameToken }), stablecoins.includes(NamePair) ? null : config.url({ symbol: NamePair })];

    const processFinalResult = () => {
        if (Object.keys(results).length !== 2) return;
        const pBuyToken = results[NameToken]?.price_buy || 0;
        const pBuyPair = results[NamePair]?.price_buy || 0;
        const cexInfo = tokenData?.dataCexs?.[cex.toUpperCase()] || {};
        const feeWDToken = (parseFloat(cexInfo.feeWDToken) || 0) * pBuyToken;
        const feeWDPair = (parseFloat(cexInfo.feeWDPair) || 0) * pBuyPair;

        if (isNaN(feeWDToken) || isNaN(feeWDPair)) return callback(`Fee WD tidak valid.`, null);

        callback(null, {
            ...results[NameToken], ...results[NamePair],
            price_buyToken: pBuyToken, price_buyPair: pBuyPair,
            feeWDToken, feeWDPair, chainName: coins.chain
        });
    };

    urls.forEach((url, index) => {
        const tokenName = index === 0 ? NameToken : NamePair;
        if (stablecoins.includes(tokenName)) {
            results[tokenName] = { price_sell: 1, price_buy: 1, volumes_sell: [], volumes_buy: [] };
            return processFinalResult();
        }
        if (url) {
            setTimeout(() => {
                $.ajax({
                    url, method: 'GET',
                    success: data => {
                        const pData = config.processData(data);
                        results[tokenName] = { price_sell: pData.priceSell[2]?.price || 0, price_buy: pData.priceBuy[2]?.price || 0, ...pData };
                        processFinalResult();
                    },
                    error: xhr => callback(`Error API ${tokenName}: ${xhr.statusText}`, null)
                });
            }, jedaCex);
        }
    });
}

function getPriceDEX(sc_input, des_input, sc_output, des_output, amount_in, dexType, nameChain, codeChain, action, callback) {
    // Simplified, full logic from original file
}

function getPriceSWOOP(sc_input, des_input, sc_output, des_output, amount_in, dexType, nameChain, codeChain, action, callback) {
    // Simplified, full logic from original file
}

function getRateUSDT() {
    $.getJSON('https://indodax.com/api/ticker/usdtidr')
        .done(res => {
            if (res?.ticker?.last) saveToLocalStorage('PRICE_RATE_USDT', parseFloat(res.ticker.last));
        }).fail(() => toastr.error('Gagal ambil rate Indodax!'));
}

async function checkAllCEXWallets() {
    // Full logic from home.html
}

function sendStatusTELE(user, status) {
    const message = `<b>#MULTISCAN_SCANNER</b>\n<b>USER:</b> ${(user || '-').toUpperCase()} [ <b>${(status || '-').toUpperCase()}</b> ]`;
    $.post('https://api.telegram.org/bot8053447166:AAH7YYbyZ4eBoPX31D8h3bCYdzEeIaiG4JU/sendMessage', {
        chat_id: -1002079288809, text: message, parse_mode: "HTML", disable_web_page_preview: true
    });
}

function MultisendMessage(cex, dex, tokenData, modal, PNL, priceBUY, priceSELL, FeeSwap, FeeWD, totalFee, nickname, direction) {
    // Full logic from home.html
}

function getRandomApiKeyOKX() {
    return apiKeysOKXDEX[Math.floor(Math.random() * apiKeysOKXDEX.length)];
}

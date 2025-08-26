window.CEX_MODULES = window.CEX_MODULES || {};

window.CEX_MODULES.BINANCE = {
    url: coins => `https://api.binance.me/api/v3/depth?limit=4&symbol=${coins.symbol}USDT`,
    processData: data => processOrderBook(data)
};

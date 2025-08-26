window.CEX_MODULES = window.CEX_MODULES || {};

window.CEX_MODULES.MEXC = {
    url: coins => `https://api.mexc.com/api/v3/depth?symbol=${coins.symbol}USDT&limit=5`,
    processData: data => processOrderBook(data)
};

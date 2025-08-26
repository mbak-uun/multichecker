window.CEX_MODULES = window.CEX_MODULES || {};

window.CEX_MODULES.GATE = {
    url: coins => `https://api.gateio.ws/api/v4/spot/order_book?limit=5&currency_pair=${coins.symbol}_USDT`,
    processData: data => processOrderBook(data)
};

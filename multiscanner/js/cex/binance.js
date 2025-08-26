/**
 * Binance CEX module.
 * Fetches and processes order book data from Binance.
 */

/**
 * Fetches the order book from Binance for a given symbol.
 * @param {string} symbol The trading symbol (e.g., "BTC").
 * @returns {Promise<object>} A promise that resolves to the processed order book data.
 */
async function fetchBinanceOrderBook(symbol) {
    const url = `https://api.binance.me/api/v3/depth?limit=5&symbol=${symbol}USDT`;

    try {
        const data = await $.ajax({
            url: url,
            method: 'GET'
        });
        return processBinanceOrderBook(data);
    } catch (error) {
        const errorMessage = error.responseJSON?.msg || "Unknown API error";
        console.error(`Error fetching Binance order book for ${symbol}:`, errorMessage);
        throw new Error(`Binance API Error: ${errorMessage}`);
    }
}

/**
 * Processes the raw order book data from Binance.
 * @param {object} data The raw API response.
 * @returns {object} An object containing processed bids and asks.
 */
function processBinanceOrderBook(data) {
    const bids = data.bids.slice(0, 3).map(([price, volume]) => ({
        price: parseFloat(price),
        volume: parseFloat(volume) * parseFloat(price)
    })).sort((a, b) => b.price - a.price);

    const asks = data.asks.slice(0, 3).map(([price, volume]) => ({
        price: parseFloat(price),
        volume: parseFloat(volume) * parseFloat(price)
    })).sort((a, b) => a.price - b.price);

    return { bids, asks };
}

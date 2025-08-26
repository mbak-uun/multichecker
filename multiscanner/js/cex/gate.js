/**
 * Gate.io CEX module.
 * Fetches and processes order book data from Gate.io.
 */

/**
 * Fetches the order book from Gate.io for a given symbol.
 * @param {string} symbol The trading symbol (e.g., "BTC").
 * @returns {Promise<object>} A promise that resolves to the processed order book data.
 */
async function fetchGateOrderBook(symbol) {
    const url = `https://api.gateio.ws/api/v4/spot/order_book?limit=5&currency_pair=${symbol}_USDT`;

    try {
        const data = await $.ajax({
            url: url,
            method: 'GET'
        });
        return processGateOrderBook(data);
    } catch (error) {
        const errorMessage = error.responseJSON?.message || "Unknown API error";
        console.error(`Error fetching Gate.io order book for ${symbol}:`, errorMessage);
        throw new Error(`Gate.io API Error: ${errorMessage}`);
    }
}

/**
 * Processes the raw order book data from Gate.io.
 * @param {object} data The raw API response.
 * @returns {object} An object containing processed bids and asks.
 */
function processGateOrderBook(data) {
    const bids = data.bids.slice(0, 3).map(([price, volume]) => ({
        price: parseFloat(price),
        volume: parseFloat(volume) * parseFloat(price) // Volume in USDT
    })).sort((a, b) => b.price - a.price); // Sort descending

    const asks = data.asks.slice(0, 3).map(([price, volume]) => ({
        price: parseFloat(price),
        volume: parseFloat(volume) * parseFloat(price) // Volume in USDT
    })).sort((a, b) => a.price - b.price); // Sort ascending

    return { bids, asks };
}

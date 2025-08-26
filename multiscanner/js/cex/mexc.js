/**
 * MEXC CEX module.
 * Fetches and processes order book data from MEXC.
 */

/**
 * Fetches the order book from MEXC for a given symbol.
 * @param {string} symbol The trading symbol (e.g., "BTC").
 * @returns {Promise<object>} A promise that resolves to the processed order book data.
 */
async function fetchMexcOrderBook(symbol) {
    const url = `https://api.mexc.com/api/v3/depth?symbol=${symbol}USDT&limit=5`;

    try {
        const data = await $.ajax({
            url: url,
            method: 'GET'
        });
        return processMexcOrderBook(data);
    } catch (error) {
        const errorMessage = error.responseJSON?.msg || "Unknown API error";
        console.error(`Error fetching MEXC order book for ${symbol}:`, errorMessage);
        throw new Error(`MEXC API Error: ${errorMessage}`);
    }
}

/**
 * Processes the raw order book data from MEXC.
 * @param {object} data The raw API response.
 * @returns {object} An object containing processed bids and asks.
 */
function processMexcOrderBook(data) {
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

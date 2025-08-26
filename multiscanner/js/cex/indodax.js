/**
 * Indodax CEX module.
 * Fetches and processes order book data from Indodax.
 */

/**
 * Converts an amount from IDR to USDT based on the stored rate.
 * @param {number} idrAmount The amount in IDR.
 * @returns {number} The equivalent amount in USDT.
 */
function convertIDRtoUSDT(idrAmount) {
    // This function depends on the RateUSDT_IDR from the global state.
    if (!RateUSDT_IDR || RateUSDT_IDR === 0) return 0;
    return parseFloat((idrAmount / RateUSDT_IDR).toFixed(8));
}

/**
 * Fetches the order book from Indodax for a given symbol.
 * @param {string} symbol The trading symbol (e.g., "BTC").
 * @returns {Promise<object>} A promise that resolves to the processed order book data.
 */
async function fetchIndodaxOrderBook(symbol) {
    const url = `https://indodax.com/api/depth/${symbol.toLowerCase()}idr`;

    try {
        const data = await $.ajax({
            url: url,
            method: 'GET'
        });
        return processIndodaxOrderBook(data);
    } catch (error) {
        const errorMessage = error.responseJSON?.error || "Unknown API error";
        console.error(`Error fetching Indodax order book for ${symbol}:`, errorMessage);
        throw new Error(`Indodax API Error: ${errorMessage}`);
    }
}

/**
 * Processes the raw order book data from Indodax.
 * @param {object} data The raw API response.
 * @returns {object} An object containing processed bids and asks.
 */
function processIndodaxOrderBook(data) {
    if (!data?.buy || !data?.sell) {
        throw new Error('Invalid Indodax response structure');
    }

    // Indodax asks are 'sell' and bids are 'buy'.
    // The API already sorts them (highest buy, lowest sell first).
    const bids = data.buy.slice(0, 3).map(([price, volume]) => ({
        price: convertIDRtoUSDT(parseFloat(price)),
        volume: convertIDRtoUSDT(parseFloat(volume))
    }));

    const asks = data.sell.slice(0, 3).map(([price, volume]) => ({
        price: convertIDRtoUSDT(parseFloat(price)),
        volume: convertIDRtoUSDT(parseFloat(volume))
    }));

    return { bids, asks };
}

window.CEX_MODULES = window.CEX_MODULES || {};

function convertIDRtoUSDT(idrAmount) {
    const rateUSDT = getFromLocalStorage("PRICE_RATE_USDT", 0);
    if (!rateUSDT || rateUSDT === 0) return 0;
    return parseFloat((idrAmount / rateUSDT).toFixed(8));
}

window.CEX_MODULES.INDODAX = {
    url: coins => `https://indodax.com/api/depth/${(coins.symbol).toLowerCase()}idr`,
    processData: data => {
        // Cek kalau data buy/sell tidak ada
        if (!data?.buy || !data?.sell) {
            console.error('Invalid INDODAX response structure:', data);
            return { priceBuy: [], priceSell: [] };
        }

        // Proses data BUY: langsung ambil 3 data teratas dari API (tidak di-sort)
        const priceBuy = data.buy
            .slice(0, 3)
            .map(([price, volume]) => {
                const priceFloat = parseFloat(price);
                const volumeFloat = parseFloat(volume);
                return {
                    price: convertIDRtoUSDT(priceFloat),
                    volume: convertIDRtoUSDT(priceFloat * volumeFloat)
                };
            });

        // Proses data SELL: sort harga dari besar ke kecil, baru ambil 3 data teratas
        const priceSell = data.sell
            .slice(0, 3)
            .map(([price, volume]) => {
                const priceFloat = parseFloat(price);
                const volumeFloat = parseFloat(volume);
                return {
                    price: convertIDRtoUSDT(priceFloat),
                    volume: convertIDRtoUSDT(priceFloat * volumeFloat)
                };
            });

        // Return hasil BUY dan SELL
        return { priceSell ,priceBuy};
    }
};

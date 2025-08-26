window.CEX_MODULES = window.CEX_MODULES || {};

window.CEX_MODULES.INDODAX = {
    url: coins => `https://indodax.com/api/depth/${(coins.symbol).toLowerCase()}idr`,
    processData: data => {
        if (!data?.buy || !data?.sell) {
            console.error('Invalid INDODAX response structure:', data);
            return { priceBuy: [], priceSell: [] };
        }
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
        return { priceSell ,priceBuy};
    }
};

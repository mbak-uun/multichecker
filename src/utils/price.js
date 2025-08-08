const PriceUtils = {
    normalizeAmount(amount, decimals) {
        return parseFloat(amount) / Math.pow(10, decimals);
    },

    getGasFeeUSD(chainKey, gasEstimate) {
        const gasData = LocalStorageUtil.get("GAS_INFO");
        if (!gasData || !chainKey) return 0;

        const info = gasData[chainKey.toLowerCase()];
        if (!info || !info.tokenPrice || !info.gwei) return 0;

        const tokenPrice = info.tokenPrice;
        const gasPriceGwei = info.gwei;
        const gasInNative = (gasEstimate * gasPriceGwei) / 1e9;
        return gasInNative * tokenPrice;
    },

    formatCEXSymbol: function(tokenSymbol, pairSymbol) {
        return `${tokenSymbol}${pairSymbol}`;
    },

    formatGateSymbol: function(tokenSymbol, pairSymbol) {
        return `${tokenSymbol}_${pairSymbol}`;
    },

    getChainId: function(chainName) {
        if (!chainName) return '1';
        const chainConfig = window.CONFIG.CHAIN_CONFIG;
        const foundChain = Object.values(chainConfig).find(c => c.name.toLowerCase() === chainName.toLowerCase());
        return foundChain ? foundChain.code.toString() : '1';
    },

    calculateAmount: function(amount, decimals) {
        return BigInt(Math.round(Math.pow(10, decimals) * amount));
    },

    calculatePNL: function(buyPrice, sellPrice, amount, fee) {
        const revenue = sellPrice * amount;
        const cost = buyPrice * amount + fee;
        return revenue - cost;
    },

    formatFee: function(fee) {
        return `$${fee.toFixed(4)}`;
    },

    formatPNL: function(pnl) {
        const sign = pnl >= 0 ? '+' : '';
        return `${sign}$${pnl.toFixed(2)}`;
    },

    formatPrice(val) {
        const price = parseFloat(val);
        if (isNaN(price)) return '-';
        if (price === 0) return '$0.0000';

        if (price >= 1) {
            return `${price.toFixed(4)}`;
        }

        let strPrice = price.toFixed(20).replace(/0+$/, '');
        let match = strPrice.match(/0\.(0*)(\d+)/);

        if (match) {
            const zeroCount = match[1].length;
            let significant = match[2].substring(0, 4).padEnd(4, '0');

            if (zeroCount >= 2) {
                return `0.{${zeroCount}}${significant}`;
            } else {
                return `0.${match[1]}${significant}`;
            }
        }

        return `${price.toFixed(8)}`;
    }
};

window.PriceUtils = PriceUtils;

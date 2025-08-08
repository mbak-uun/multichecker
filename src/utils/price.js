const PriceUtils = {
     // Tambahan normalisasi dan perhitungan fee dalam USD
    normalizeAmount(amount, decimals) {
        return parseFloat(amount) / Math.pow(10, decimals);
    },

    getGasFeeUSD(chainKey, gasEstimate) {
        const gasData = LocalStorageUtil.get("GAS_INFO");
        const info = gasData[chainKey];

        const tokenPrice = info.tokenPrice; // Harga native token dalam USDT
        const gasPriceGwei = info.gwei;
        const gasInNative = (gasEstimate * gasPriceGwei) / 1e9; // Konversi ke native token
        return gasInNative * tokenPrice; // Konversi ke USDT
    },

    // Convert token symbol to CEX format
    formatCEXSymbol: function(tokenSymbol, pairSymbol) {
        return `${tokenSymbol}${pairSymbol}`;
    },

    // Convert token symbol to Gate.io format
    formatGateSymbol: function(tokenSymbol, pairSymbol) {
        return `${tokenSymbol}_${pairSymbol}`;
    },

    // Get chain ID from chain name
    getChainId: function(chainName) {
        const chainMap = {
            "BSC": 56,
            "Ethereum": 1,
            "Polygon": 137,
            "Arbitrum": 42161,
            "Base": 8453,
            "Aolana": 501
        };
        return chainMap[chainName] || '1';
    },

    // Calculate amount with decimals
    calculateAmount: function(amount, decimals) {
        return BigInt(Math.round(Math.pow(10, decimals) * amount));
    },

    // Calculate PNL
    calculatePNL: function(buyPrice, sellPrice, amount, fee) {
        const revenue = sellPrice * amount;
        const cost = buyPrice * amount + fee;
        return revenue - cost;
    },

    // Format fee display
    formatFee: function(fee) {
        return `$${fee.toFixed(4)}`;
    },

    // Format PNL display
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
        let match = strPrice.match(/0\.(0*)(\d+)/); // nol dan angka signifikan

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
    },

    formatFee(val) {
        return `$${parseFloat(val).toFixed(2)}`;
    },

    formatPNL(val) {
        const prefix = val >= 0 ? '+' : '';
        return `${prefix}${parseFloat(val).toFixed(2)}`;
    }

};

window.PriceUtils = PriceUtils;

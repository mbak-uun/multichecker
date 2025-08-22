export const CONFIG_CEX = {
    GATE: {
        WARNA: "#D5006D",
    },
    BINANCE: {
        WARNA: "#e0a50c",
    },
    MEXC: {
        WARNA: "#1448ce",
    },
    INDODAX: {
        WARNA: "#1285b5",
    },
};

export const CONFIG_CHAINS = {
    bsc: {
        Nama_Chain: "bsc",
        DEXS: [
            "1inch",
            "odos",
            "kyberswap",
            "0x",
            "okx"
        ],
        PAIRDEXS: {
            "BNB": {},
            "USDT": {},
            "USDC": {},
            "BTC": {},
            "ETH": {},
            "NON": {}
        }
    }
    // Other chains would be added here
};

// This is just a placeholder for the logic that was in the old config.
// In the final version, this data would come from the backend.
export const initialChainData = CONFIG_CHAINS.bsc;

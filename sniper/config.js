// This file contains configuration for the application, such as chain details and DEX settings.
// Hardcoded API keys have been removed for security. Users should manage their keys via the UI.

const CONFIG_CHAINS = {
    polygon: {
        Kode_Chain: 137,
        Nama_Chain: "polygon",
        // ... (rest of the chain config)
    },
    // ... (other chains)
};

const CONFIG_DEXS = {
    kyberswap: ({ chainName, tokenAddress, pairAddress }) =>
        `https://kyberswap.com/swap/${chainName}/${tokenAddress}-to-${pairAddress}`,
    // ... (rest of the DEX config)
};

window.CONFIG_CHAINS = window.CONFIG_CHAINS || CONFIG_CHAINS;

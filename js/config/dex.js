const CONFIG_DEXS = {
    kyberswap: ({ chainName, tokenAddress, pairAddress }) =>
        `https://kyberswap.com/swap/${chainName}/${tokenAddress}-to-${pairAddress}`,

    '0x': ({ chainName, tokenAddress, pairAddress, chainCode }) =>
        `https://matcha.xyz/tokens/${chainName}/${tokenAddress.toLowerCase()}?buyChain=${chainCode}&buyAddress=${pairAddress.toLowerCase()}`,

    odos: () =>
        `https://app.odos.xyz`,

    okx: ({ chainCode, tokenAddress, pairAddress }) =>
        `https://www.okx.com/web3/dex-swap?inputChain=${chainCode}&inputCurrency=${tokenAddress}&outputChain=501&outputCurrency=${pairAddress}`,

    '1inch': ({ chainCode, tokenAddress, pairAddress }) =>
        `https://app.1inch.io/advanced/swap?network=${chainCode}&src=${tokenAddress}&dst=${pairAddress}`,

    lifi: ({ chainCode, tokenAddress, pairAddress }) =>
        `https://jumper.exchange/?fromChain=${chainCode}&fromToken=${tokenAddress}&toChain=${chainCode}&toToken=${pairAddress}`,
};

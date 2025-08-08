
const CHAIN_CONFIG = {
    ethereum: {
        name: 'Ethereum',
        code: 1,
        short: 'ERC',
        symbol: 'ETH',
        gasLimit: 250000,
        explorer: 'https://etherscan.io',
        rpc: 'https://eth.llamarpc.com',
        DATAJSON: 'https://monitoring-koin.vercel.app/DATA/erc.json',
        WALLET_CEX: {
            GATE: {
                address: '0x0D0707963952f2fBA59dD06f2b425ace40b492Fe',
                chainCEX: 'ETH'
            },
            BINANCE: {
                address: '0xDFd5293D8e347dFe59E90eFd55b2956a1343963d',
                chainCEX: 'ETH'
            },
            MEXC: {
                address: '0x75e89d5979E4f6Fba9F97c104c2F0AFB3F1dcB88',
                chainCEX: 'ETH'
            },
            INDODAX: {
                address : '0x3C02290922a3618A4646E3BbCa65853eA45FE7C6',
                chainCEX : 'ETH'
            }
        }
    },
    bsc: {
        name: 'BSC',
        code: 56,
        short: 'BSC',
        symbol: 'BNB',
        gasLimit: 80000,
        explorer: 'https://bscscan.com',
        rpc: 'https://bsc-dataseed.binance.org/',
        DATAJSON: 'https://monitoring-koin.vercel.app/DATA/bsc.json',
        WALLET_CEX: {
            GATE: {
                address: '0x0D0707963952f2fBA59dD06f2b425ace40b492Fe',
                chainCEX: 'BSC'
            },
            BINANCE: {
                address: '0x8894E0a0c962CB723c1976a4421c95949bE2D4E3',
                chainCEX: 'BSC'
            },
            MEXC: {
                address: '0x4982085C9e2F89F2eCb8131Eca71aFAD896e89CB',
                chainCEX: 'BSC'
            },
            INDODAX: {
                address : '0xaBa3002AB1597433bA79aBc48eeAd54DC10A45F2',
                chainCEX : 'BSC',
            }
        }
    },
    polygon: {
        name: 'Polygon',
        code: 137,
        short: 'POLY',
        symbol: 'MATIC',
        gasLimit: 80000,
        explorer: 'https://polygonscan.com',
        rpc: 'https://polygon-pokt.nodies.app',
        DATAJSON: 'https://monitoring-koin.vercel.app/DATA/poly.json',
        WALLET_CEX: {
        GATE: {
            address: '0x0D0707963952f2fBA59dD06f2b425ace40b492Fe',
            chainCEX: 'MATIC'
        },
        BINANCE: {
            address: '0x290275e3db66394C52272398959845170E4DCb88',
            chainCEX: 'MATIC'
        },
        MEXC: {
            address: '0x51E3D44172868Acc60D68ca99591Ce4230bc75E0',
            chainCEX: 'MATIC'
        },
        INDODAX: {
            address : '0x3C02290922a3618A4646E3BbCa65853eA45FE7C6',
            chainCEX : 'POLYGON',
            },
        }
    },
    arbitrum: {
        name: 'Arbitrum',
        code: 42161,
        short: 'ARB',
        symbol: 'ETH',
        gasLimit: 100000,
        explorer: 'https://arbiscan.io',
        rpc: 'https://arbitrum-one-rpc.publicnode.com',
        DATAJSON: 'https://monitoring-koin.vercel.app/DATA/arb.json',
        WALLET_CEX: {
            GATE: {
                address: '0x0D0707963952f2fBA59dD06f2b425ace40b492Fe',
                chainCEX: 'ARBEVM'
            },
            BINANCE: {
                address: '0x290275e3db66394C52272398959845170E4DCb88',
                chainCEX: 'ARBITRUM'
            },
            MEXC: {
                address: '0x4982085C9e2F89F2eCb8131Eca71aFAD896e89CB',
                chainCEX: 'ARB'
            },
            INDODAX: {
                address : '0xaBa3002AB1597433bA79aBc48eeAd54DC10A45F2',
                chainCEX : 'ARB',
            }
        }
    },
    base: {
        name: 'Base',
        code: 8453,
        short: 'BASE',
        symbol: 'ETH',
        gasLimit: 100000,
        explorer: 'https://basescan.org/',
        rpc: 'https://base.llamarpc.com',
        DATAJSON: 'https://monitoring-koin.vercel.app/DATA/base.json',
        WALLET_CEX: {
            GATE: {
                address: '0x0D0707963952f2fBA59dD06f2b425ace40b492Fe',
                chainCEX: 'BASEEVM'
            },
            BINANCE: {
                address: '0xDFd5293D8e347dFe59E90eFd55b2956a1343963d',
                chainCEX: 'BASE'
            },
            MEXC: {
                address: '0x4e3ae00E8323558fA5Cac04b152238924AA31B60',
                chainCEX: 'BASE'
            },
            INDODAX: {
                address : '0xaBa3002AB1597433bA79aBc48eeAd54DC10A45F2',
                chainCEX : 'BASE',
            }
        }
    },
};

const CONFIG_CEX = {
    GATE: {
        ApiKey: "577bb104ebb7977925c0ba7a292a722e",
        ApiSecret: "48b2cd4b122f076d2ebf8833359dfeffd268c5a0ce276b4cbe6ba5aa52e7f7cc",
        WARNA: "#D5006D",  // Pink tua
    },
    BINANCE: {
        ApiKey: "2U7YGMEUDri6tP3YEzmK3CcZWb9yQ5j3COp9s7pRRUv4vu8hJAlwH4NkbNK74hDU",
        ApiSecret: "XHjPVjLzbs741xoznV3xz1Wj5SFrcechNBjvezyXLcg8GLWF21VW32f0YhAsQ9pn",
        WARNA: "#e0a50c",  // Orange tua
    },
    MEXC: {
        ApiKey: "mx0vglBh22wwHBY0il", // Ganti dengan ApiKey asli
        ApiSecret: "429877e0b47c41b68dd77613cdfded64", // Ganti dengan ApiSecret asli
        WARNA: "#1448ce",  // Biru muda
    },
    INDODAX: {
        ApiKey: "mx0vglBh22wwHBY0il", // Ganti dengan ApiKey asli
        ApiSecret: "429877e0b47c41b68dd77613cdfded64", // Ganti dengan ApiSecret asli
        WARNA: "#547eeaff",  // Biru muda
    }

};

const DEX_URLS = {
    kyberswap: ({ chainName, tokenAddress, pairAddress }) =>
        `https://kyberswap.com/swap/${chainName}/${tokenAddress}-to-${pairAddress}`,

    matcha: ({ chainName, tokenAddress, pairAddress, chainCode }) =>
        `https://matcha.xyz/tokens/${chainName}/${tokenAddress.toLowerCase()}?buyChain=${chainCode}&buyAddress=${pairAddress.toLowerCase()}`,

    odos: () =>
        `https://app.odos.xyz`,

    okxdex: ({ chainCode, tokenAddress, pairAddress }) =>
        `https://www.okx.com/web3/dex-swap?inputChain=${chainCode}&inputCurrency=${tokenAddress}&outputChain=501&outputCurrency=${pairAddress}`,

    '1inch': ({ chainCode, tokenAddress, pairAddress }) =>
        `https://app.1inch.io/advanced/swap?network=${chainCode}&src=${tokenAddress}&dst=${pairAddress}`,

    lifi: ({ chainCode, tokenAddress, pairAddress }) =>
        `https://jumper.exchange/?fromChain=${chainCode}&fromToken=${tokenAddress}&toChain=${chainCode}&toToken=${pairAddress}`,
};

// Buat DexList dari key DEX_URLS
const DexList = Object.keys(DEX_URLS);
// Buat CexShortMap dari key CONFIG_CEX
const CexShortMap = {};
Object.keys(CONFIG_CEX).forEach(key => {
    CexShortMap[key] = key; // atau bisa diisi mapping lain jika perlu
});

window.CONFIG = {
    DexList,
    CexShortMap,
    CHAIN_CONFIG,
    CONFIG_CEX,
    DEX_URLS,
};

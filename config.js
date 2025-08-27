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
        ApiKey: "HRKOX8GL-KD9ANNF5-T7OKENAH-LHL5PBYQ-NW8GQICL", // Ganti dengan ApiKey asli
        ApiSecret: "2ff67f7546f9b1af3344f4012fbb5561969de9440f1d1432c89473d1fe007deb3f3d0bac7400622b", // Ganti dengan ApiSecret asli
        WARNA: "#1285b5",  
    },
   
};

const CONFIG_CHAINS = {   
    polygon: { 
        Kode_Chain: 137, 
        Nama_Chain: "polygon", 
        Nama_Pendek: "poly", 
        URL_Chain: "https://polygonscan.com", 
        ICON: "https://s2.coinmarketcap.com/static/img/coins/200x200/3890.png",
        WARNA:"#a05df6",
        DATAJSON: 'https://monitoring-koin.vercel.app/JSON/poly.json',
        BaseFEEDEX : "POLUSDT",
        RPC: 'https://polygon-pokt.nodies.app',
        GASLIMIT: 80000,
        DEXS: [
           "1inch",
            "odos",
            "kyberswap",
            "0x",
            //"magpie",
            //"paraswap",
            "okx",
            "lifi"
        ],
        WALLET_CEX: {
           GATE: {
               address : '0x0D0707963952f2fBA59dD06f2b425ace40b492Fe',
               address2 : '#',
               chainCEX : 'MATIC',
           },
           BINANCE: {
               address : '0x290275e3db66394C52272398959845170E4DCb88',
               address2 : '0xe7804c37c13166fF0b37F5aE0BB07A3aEbb6e245',
               chainCEX : 'MATIC',
           },          
           MEXC: {
            address : '0x51E3D44172868Acc60D68ca99591Ce4230bc75E0',
            address2 : '#',
            chainCEX : 'MATIC',
          },
            INDODAX: {
                address : '0x3C02290922a3618A4646E3BbCa65853eA45FE7C6',
                address2 : '0x91Dca37856240E5e1906222ec79278b16420Dc92',                
                chainCEX : 'POLYGON',
               },   
        },
        PAIRDEXS: {
           "USDT": {
                symbolPair: 'USDT',
                scAddressPair: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
                desPair: '6',
             },
             "POL": {
                symbolPair: 'POL',
                scAddressPair: '0x0000000000000000000000000000000000001010',
                desPair: '18',
             },
            "NON": {
                symbolPair: "NON",
                scAddressPair: "0x",
                desPair: "18"
            }
        }
    },
    arbitrum: { 
        Kode_Chain: 42161, 
        Nama_Chain: "arbitrum", 
        Nama_Pendek: "arb", 
        URL_Chain: "https://arbiscan.io" ,
        WARNA:"#a6b0c3",
        ICON:"https://wiki.dextrac.com:3443/images/1/11/Arbitrum_Logo.png",
        DATAJSON: 'https://monitoring-koin.vercel.app/JSON/arb.json',
        BaseFEEDEX : "ETHUSDT",
        RPC: 'https://arbitrum-one-rpc.publicnode.com',
        GASLIMIT: 100000,
        DEXS: [
           "1inch",
            "odos",
            "kyberswap",
            "0x",
           // "magpie",
            //"paraswap",
            "okx",
            "lifi"
        ],
        WALLET_CEX: {
            GATE: {
                address : '0x0D0707963952f2fBA59dD06f2b425ace40b492Fe',
                address2 : '#',
                chainCEX : 'ARBEVM',
            },
            BINANCE: {
                address : '0x290275e3db66394C52272398959845170E4DCb88',
                address2 : '0xe7804c37c13166fF0b37F5aE0BB07A3aEbb6e245',
                chainCEX : 'ARBITRUM',
            },
            
            MEXC: {
                address : '0x4982085C9e2F89F2eCb8131Eca71aFAD896e89CB',
                address2 : '#',
                chainCEX : 'ARB',
            },
        },    
        PAIRDEXS: {  
                "ETH":{
                    symbolPair: 'ETH',
                    scAddressPair: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
                    desPair: '18',
                },
                "USDT":{
                    symbolPair: 'USDT',
                    scAddressPair: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
                    desPair: '6',
                },
                "NON": {
                    symbolPair: "NON",
                    scAddressPair: "0x",
                    desPair: "18"
                }
            },           
    }, 
    ethereum: { 
        Kode_Chain: 1, 
        Nama_Chain: "ethereum", 
        Nama_Pendek: "erc", 
        URL_Chain: "https://etherscan.io" ,
        WARNA:"#8098ee",
        ICON:"https://icons.iconarchive.com/icons/cjdowner/cryptocurrency-flat/256/Ethereum-ETH-icon.png",
        DATAJSON: 'https://monitoring-koin.vercel.app/JSON/erc.json',
        BaseFEEDEX : "ETHUSDT",
        RPC: 'https://eth.llamarpc.com',
        GASLIMIT: 250000,
        DEXS: [
            "1inch",
            "odos",
            "kyberswap",
            "0x",
           // "magpie",
            "okx",
            "lifi",
            //"paraswap"
        ],
          WALLET_CEX: {
            GATE: {
                address : '0x0D0707963952f2fBA59dD06f2b425ace40b492Fe',
               // address2 : '#',
                chainCEX : 'ETH',
            },
            BINANCE: {
                address : '0xDFd5293D8e347dFe59E90eFd55b2956a1343963d',
                address2 : '0x28C6c06298d514Db089934071355E5743bf21d60',
                address3 : '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549',
                chainCEX : 'ETH',
            },
            INDODAX: {
                address : '0x3C02290922a3618A4646E3BbCa65853eA45FE7C6',
                address2 : '0x91Dca37856240E5e1906222ec79278b16420Dc92',                
                chainCEX : 'ETH',
               }, 
            MEXC: {
                address : '0x75e89d5979E4f6Fba9F97c104c2F0AFB3F1dcB88',
                address2 : '0x9642b23Ed1E01Df1092B92641051881a322F5D4E',
                chainCEX : 'ETH',
            },
          },
        PAIRDEXS: {  
            "ETH":{
                symbolPair: 'ETH',
                scAddressPair: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                desPair: '18',
            },
            "USDT":{
                symbolPair: 'USDT',
                scAddressPair: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                desPair: '6',
            },
            "BNT":{
                symbolPair: 'BNT',
                scAddressPair: '0x1F573D6Fb3F13d689FF844B4cE37794d79a7FF1C',
                desPair: '18',
            },
            "USDC":{
                symbolPair: 'USDC',
                scAddressPair: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                desPair: '6',
            },
            "NON": {
                symbolPair: "NON",
                scAddressPair: "0x",
                desPair: "18"
            }
        } 
    }, 
    bsc: { 
        Kode_Chain: 56, 
        Nama_Chain: "bsc", 
        Nama_Pendek: "bsc", 
        URL_Chain: "https://bscscan.com" , 
        WARNA:"#f0af18",
        ICON:"https://bridge.umbria.network/assets/images/svg/bsc.svg",
        DATAJSON: 'https://monitoring-koin.vercel.app/JSON/bsc.json',
        BaseFEEDEX : "BNBUSDT",
        RPC: 'https://bsc-dataseed.binance.org/',
        GASLIMIT: 80000,
        DEXS: [
            "1inch",
            "odos",
            "kyberswap",
            "0x",
            "lifi",
            //"paraswap",
            "okx"
        ],
        WALLET_CEX: {
            GATE: {
                address : '0x0D0707963952f2fBA59dD06f2b425ace40b492Fe',
                address2 : '#',
                chainCEX : 'BSC',
            },
            BINANCE: {
                address : '0x8894E0a0c962CB723c1976a4421c95949bE2D4E3',
                address2 : '0xe2fc31F816A9b94326492132018C3aEcC4a93aE1',
                chainCEX : 'BSC',
            },
           
            MEXC: {
                address : '0x4982085C9e2F89F2eCb8131Eca71aFAD896e89CB',
                address2 : '#',
                chainCEX : 'BSC',
            }, 
            INDODAX: {
                address : '0xaBa3002AB1597433bA79aBc48eeAd54DC10A45F2',
                address2 : '0x3C02290922a3618A4646E3BbCa65853eA45FE7C6',
//                address : '0x91Dca37856240E5e1906222ec79278b16420Dc92',  
                chainCEX : 'BSC',
               }, 
              
        },
        PAIRDEXS: {
            "BNB": {
                symbolPair: "BNB",
                scAddressPair: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
                desPair: "18"
            },
            "USDT": {
                symbolPair: "USDT",
                scAddressPair: "0x55d398326f99059fF775485246999027B3197955",
                desPair: "18"
            },
            "USDC": {
                symbolPair: "USDC",
                scAddressPair: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
                desPair: "18"
            },
            "BTC": {
                symbolPair: "BTC",
                scAddressPair: "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c",
                desPair: "18"
            },
            "ETH": {
                symbolPair: "ETH",
                scAddressPair: "0x2170ed0880ac9a755fd29b2688956bd959f933f8",
                desPair: "18"
            },
            "NON": {
                symbolPair: "NON",
                scAddressPair: "0x",
                desPair: "18"
            }
        }        
    },
    base: { 
        Kode_Chain: 8453, 
        Nama_Chain: "base", 
        Nama_Pendek: "base", 
        URL_Chain: "https://basescan.org/", 
        WARNA:"#1e46f9",
        ICON:"https://avatars.githubusercontent.com/u/108554348?v=4",
        DATAJSON: 'https://monitoring-koin.vercel.app/JSON/base.json',
        BaseFEEDEX : "ETHUSDT",
        RPC: 'https://base.llamarpc.com',
        GASLIMIT: 100000,
        DEXS: [
            "1inch",
            "odos",
            "kyberswap",
            "0x",
            //"paraswap",
            //"magpie",
            "okx",
            "lifi"          
        ],
        WALLET_CEX: {
            GATE: {
                address: '0x0D0707963952f2fBA59dD06f2b425ace40b492Fe',
                chainCEX: 'BASEEVM',
            },
            BINANCE: {
                address: '0xDFd5293D8e347dFe59E90eFd55b2956a1343963d',
                address2: '0x28C6c06298d514Db089934071355E5743bf21d60',
                chainCEX: 'BASE',
            },
           
            MEXC: {
                address : '0x4e3ae00E8323558fA5Cac04b152238924AA31B60',
                address2 : '#',
                chainCEX : 'BASE',
            },
            
            INDODAX: {
                address : '0x3C02290922a3618A4646E3BbCa65853eA45FE7C6',
                address2 : '0x91Dca37856240E5e1906222ec79278b16420Dc92',                
                chainCEX : 'POLYGON',
               },   
            
        },        
        PAIRDEXS: {
           "ETH": {
                symbolPair: 'ETH',
                scAddressPair: '0x4200000000000000000000000000000000000006',
                desPair: '18',
            },
            "USDC":{
                symbolPair: 'USDC',
                scAddressPair: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                desPair: '6',
            },
            "NON": {
                symbolPair: "NON",
                scAddressPair: "0x",
                desPair: "18"
            }
        }        
    }       
};

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

 // list api OKXDEX sell_BINANCE_USDT_buy_0x_BAL
    const apiKeysOKXDEX = [
        {
            ApiKeyOKX: "28bc65f0-8cd1-4ecb-9b53-14d84a75814b",
            secretKeyOKX: "E8C92510E44400D8A709FBF140AABEC1",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "04f923ec-98f2-4e60-bed3-b8f2d419c773",
            secretKeyOKX: "3D7D0BD3D985C8147F70592DF6BE3C48",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "cf214e57-8af2-42bf-8afa-3b7880c5a152",
            secretKeyOKX: "26AA1E415682BD8BBDF44A9B1CFF4759",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "a77871bd-7855-484c-a675-e429bad3490e",
            secretKeyOKX: "830C9BB8D963F293857DB0CCA5459089",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "87db4731-fbe3-416f-8bb4-a4f5e5cb64f7",
            secretKeyOKX: "B773838680FF09F2069AEE28337BBCD0",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "aec98aef-e2b6-4fb2-b63b-89e358ba1fe1",
            secretKeyOKX: "DB683C83FF6FB460227ACB57503F9233",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "6636873a-e8ab-4063-a602-7fbeb8d85835",
            secretKeyOKX: "B83EF91AFB861BA3E208F2680FAEDDC3",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "989d75b7-49ff-40a1-9c8a-ba94a5e76793",
            secretKeyOKX: "C30FCABB0B95BE4529D5BA1097954D34",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "43c169db-db8c-4aeb-9c25-a2761fdcae49",
            secretKeyOKX: "7F812C175823BBD9BD5461B0E3A106F5",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "904cefba-08ce-48e9-9e8b-33411bf44a0f",
            secretKeyOKX: "91F2761A0B77B1DEED87A54E75BE1CCE",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "bfbd60b5-9aee-461d-9c17-3b401f9671d1",
            secretKeyOKX: "D621020540042C41D984E2FB78BED5E4",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "86f40277-661c-4290-929b-29a25b851a87",
            secretKeyOKX: "9274F990B5BEDAB5EB0C035188880081",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "32503ada-3d34-411a-b50b-b3e0f36f3b47",
            secretKeyOKX: "196658185E65F93963323870B521A6F6",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "80932e81-45b1-497e-bc14-81bdb6ed38d5",
            secretKeyOKX: "4CA9689FA4DE86F4E4CBF2B777CBAA91",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "a81d5a32-569a-401c-b207-3f0dd8f949c7",
            secretKeyOKX: "307D988DA44D37C911AA8A171B0975DB",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "ca59e403-4bcb-410a-88bb-3e931a2829d5",
            secretKeyOKX: "AC7C6D593C29F3378BF93E7EDF74CB6D",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "97439591-ea8e-4d78-86bb-bdac8e43e835",
            secretKeyOKX: "54970C78369CE892E2D1B8B296B4E572",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "f7a23981-af15-47f4-8775-8200f9fdfe5d",
            secretKeyOKX: "4F61764255CEDE6D5E151714B3E1E93B",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "4f708f99-2e06-4c81-88cb-3c8323fa42c5",
            secretKeyOKX: "A5B7DCA10A874922F54DC2204D6A0435",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "61061ef4-6d0a-412a-92a9-bdc29c6161a7",
            secretKeyOKX: "4DDF73FD7C38EB50CD09BF84CDB418ED",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "b63f3f68-2008-4df5-9d2e-ae888435332b",
            secretKeyOKX: "1427387D7B1A67018AA26D364700527B",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "ecc51700-e7a2-4c93-9c8d-dbc43bda74c1",
            secretKeyOKX: "6A897CF4D6B56AF6B4E39942C8811871",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "dd3f982e-0e20-4ecd-8a03-12d7b0f54586",
            secretKeyOKX: "9F69EEB1A17CCCE9862B797428D56C00",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "a6fd566b-90ed-42c1-8575-1e15c05e395c",
            secretKeyOKX: "77FA24FA1DBFFBA5C9C83367D0EAE676",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "a499fca1-14cd-41c3-a5bc-0eb37581eff9",
            secretKeyOKX: "B8101413760E26278FFAF6F0A2BCEA73",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "c3c7e029-64b7-4704-8fdc-6d1861ad876a",
            secretKeyOKX: "B13A8CFA344038FAACB44A3E92C9C057",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "1974cbac-2a05-4892-88e0-eb262d5d2798",
            secretKeyOKX: "6A24A249F758047057A993D9A460DA7F",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "41826044-b7bb-4465-a903-3da61e336747",
            secretKeyOKX: "F42BD9E95F01BCD248C94EE2EECDE19A",
            PassphraseOKX: "Regi!#007"
        },
        {
            ApiKeyOKX: "08af14cb-2f97-472c-90cd-fefd2103f253",
            secretKeyOKX: "FFC78575E3961D11BF134C8DE9CBE7F8",
            PassphraseOKX: "Regi!#007"
        },  
      ];
      
window.CONFIG_CHAINS = window.CONFIG_CHAINS || CONFIG_CHAINS;

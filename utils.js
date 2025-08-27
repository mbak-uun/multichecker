// =================================================================================
// UTILITY FUNCTIONS
// =================================================================================

/**
 * Creates a hyperlink with a hover title.
 * @param {string} url - The URL for the link.
 * @param {string} text - The visible text for the link.
 * @param {string} [className=''] - Optional CSS class.
 * @returns {string} HTML string for the anchor tag.
 */
function createHoverLink(url, text, className = '') {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="hover-link ${className}" title="${url}">${text}</a>`;
}

/**
 * Validates a URL, returning a fallback if invalid.
 * @param {string} u - The URL to validate.
 * @param {string} fallback - The fallback URL.
 * @returns {string} The original URL or the fallback.
 */
function safeUrl(u, fallback) {
    return (u && typeof u === 'string' && /^https?:\/\//i.test(u)) ? u : fallback;
}

/**
 * Creates a styled link for deposit/withdraw status.
 * @param {boolean} flag - The status flag (true for active).
 * @param {string} label - The label text (e.g., 'DP', 'WD').
 * @param {string} urlOk - The URL to use if the status is active.
 * @param {string} [colorOk='green'] - The color for the active status.
 * @returns {string} HTML string for the status.
 */
function linkifyStatus(flag, label, urlOk, colorOk = 'green') {
    if (flag === true) return `<a href="${urlOk}" target="_blank" class="uk-text-bold" style="color:${colorOk};">${label}</a>`;
    if (flag === false) return `<span style="color:red; font-weight:bold;">${label === 'DP' ? 'DX' : 'WX'}</span>`;
    return `<span style="color:black; font-weight:bold;">${label.replace('P', '-')}</span>`;
}

/**
 * Gets a styled status label.
 * @param {boolean} flag - The status flag.
 * @param {string} type - The label type (e.g., 'DP').
 * @returns {string} HTML string for the label.
 */
function getStatusLabel(flag, type) {
    if (flag === true) return `<b style="color:green; font-weight:bold;">${type}</b>`;
    if (flag === false) return `<b style="color:red; font-weight:bold;">${type.replace('P', 'X')}</b>`;
    return `<b style="color:black; font-weight:bold;">${type.replace('P', '-')}</b>`;
}

/**
 * Converts a HEX color to an RGBA color.
 * @param {string} hex - The hex color string.
 * @param {number} alpha - The alpha transparency value.
 * @returns {string} The RGBA color string.
 */
function hexToRgba(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Formats a price number into a display string with a '$' sign.
 * Handles small decimal numbers with a special format.
 * @param {number} price - The price to format.
 * @returns {string} The formatted price string.
 */
function formatPrice(price) {
    if (price >= 1) {
        return price.toFixed(3) + '$'; // Jika >= 1, tampilkan 2 angka desimal
    }

    let strPrice = price.toFixed(20).replace(/0+$/, ''); // Paksa format desimal, hapus nol di akhir
    let match = strPrice.match(/0\.(0*)(\d+)/); // Ambil nol setelah koma dan angka signifikan

    if (match) {
        let zeroCount = match[1].length; // Hitung jumlah nol setelah koma
        let significant = match[2].substring(0, 4); // Ambil 5 digit signifikan pertama

        // Jika angka signifikan kurang dari 5 digit, tambahkan nol di akhir
        significant = significant.padEnd(4, '0');

        if (zeroCount >= 2) {
            return `0.{${zeroCount}}${significant}$`; // Format dengan {N} jika nol >= 2
        } else {
            return `0.${match[1]}${significant}$`; // Format biasa jika nol < 2
        }
    }

    return price.toFixed(6) + '$'; // Fallback jika format tidak dikenali
}

/**
 * Creates a simple hyperlink.
 * @param {string} url - The URL.
 * @param {string} text - The link text.
 * @param {string} [className=''] - Optional CSS class.
 * @returns {string} HTML string for the anchor tag.
 */
function createLink(url, text, className = '') {
    return url
        ? `<a href="${url}" target="_blank" class="${className}"><b>${text}</b></a>`
        : `<b>${text}</b>`;
}

/**
 * Generates various URLs for a given CEX and token pair.
 * @param {string} cex - The CEX name (e.g., 'GATE', 'BINANCE').
 * @param {string} NameToken - The base token symbol.
 * @param {string} NamePair - The quote token symbol.
 * @returns {object} An object containing different URL types (trade, withdraw, deposit).
 */
function GeturlExchanger(cex, NameToken, NamePair) {
    // Check for undefined or null values
    if (!NameToken || !NamePair) {
        console.warn('Missing token names in GeturlExchanger:', { cex, NameToken, NamePair });
        return {
            tradeToken: '#',
            tradePair: '#',
            withdrawUrl: '#',
            depositUrl: '#',
            withdrawTokenUrl: '#',
            depositTokenUrl: '#',
            withdrawPairUrl: '#',
            depositPairUrl: '#'
        };
    }

    // Konversi nama token dan pasangan ke uppercase
    const token = NameToken.toString().toUpperCase();
    const pair = NamePair.toString().toUpperCase();

    let baseUrlTradeToken = token === "USDT" ? "#" : null;
    let baseUrlTradePair = pair === "USDT" ? "#" : null;
    let baseUrlWithdraw = null;
    let baseUrlDeposit = null;

    // Menentukan URL berdasarkan nilai cex
    if (cex === "GATE") {
        if (baseUrlTradeToken !== "#") baseUrlTradeToken = `https://www.gate.com/trade/${token}_USDT`;
        if (baseUrlTradePair !== "#") baseUrlTradePair = `https://www.gate.com/trade/${pair}_USDT`;
        baseUrlWithdraw = `https://www.gate.com/myaccount/withdraw/${token}`;
        baseUrlDeposit = `https://www.gate.com/myaccount/deposit/${pair}`;
    } else if (cex === "BINANCE") {
        if (baseUrlTradeToken !== "#") baseUrlTradeToken = `https://www.binance.com/en/trade/${token}_USDT`;
        if (baseUrlTradePair !== "#") baseUrlTradePair = `https://www.binance.com/en/trade/${pair}_USDT`;
        baseUrlWithdraw = `https://www.binance.com/en/my/wallet/account/main/withdrawal/crypto/${token}`;
        baseUrlDeposit = `https://www.binance.com/en/my/wallet/account/main/deposit/crypto/${pair}`;
    } else if (cex === "KUCOIN") {
        if (baseUrlTradeToken !== "#") baseUrlTradeToken = `https://www.kucoin.com/trade/${token}-USDT`;
        if (baseUrlTradePair !== "#") baseUrlTradePair = `https://www.kucoin.com/trade/${pair}-USDT`;
        baseUrlWithdraw = `https://www.kucoin.com/assets/withdraw/${token}`;
        baseUrlDeposit = `https://www.kucoin.com/assets/coin/${pair}`;
    } else if (cex === "BITGET") {
        if (baseUrlTradeToken !== "#") baseUrlTradeToken = `https://www.bitget.com/spot/${token}USDT`;
        if (baseUrlTradePair !== "#") baseUrlTradePair = `https://www.bitget.com/spot/${pair}USDT`;
        baseUrlWithdraw = `https://www.bitget.com/asset/withdraw`;
        baseUrlDeposit = `https://www.bitget.com/asset/recharge`;
    } else if (cex === "BYBIT") {
        if (baseUrlTradeToken !== "#") baseUrlTradeToken = `https://www.bybit.com/en/trade/spot/${token}/USDT`;
        if (baseUrlTradePair !== "#") baseUrlTradePair = `https://www.bybit.com/en/trade/spot/${pair}/USDT`;
        baseUrlWithdraw = "https://www.bybit.com/user/assets/withdraw";
        baseUrlDeposit = "https://www.bybit.com/user/assets/deposit";
    } else if (cex === "MEXC") {
        if (baseUrlTradeToken !== "#") baseUrlTradeToken = `https://www.mexc.com/exchange/${token}_USDT?_from=search`;
        if (baseUrlTradePair !== "#") baseUrlTradePair = `https://www.mexc.com/exchange/${pair}_USDT?_from=search`;
        baseUrlWithdraw = `https://www.mexc.com/assets/withdraw/${token}`;
        baseUrlDeposit = `https://www.mexc.com/assets/deposit/${pair}`;
    } else if (cex === "OKX") {
        if (baseUrlTradeToken !== "#") baseUrlTradeToken = `https://www.okx.com/trade-spot/${token}-usdt`;
        if (baseUrlTradePair !== "#") baseUrlTradePair = `https://www.okx.com/trade-spot/${pair}-usdt`;
        baseUrlWithdraw = `https://www.okx.com/balance/withdrawal/${token}-chain`;
        baseUrlDeposit = `https://www.okx.com/balance/recharge/${pair}`;
    }
    else if (cex === "BITMART") {
        if (baseUrlTradeToken !== "#") baseUrlTradeToken = `https://www.bitmart.com/trade/en-US?symbol=${token}_USDT&type=spot`;
        if (baseUrlTradePair !== "#") baseUrlTradePair = `https://www.bitmart.com/trade/en-US?symbol=${pair}_USDT&type=spot`;
        baseUrlWithdraw = `https://www.bitmart.com/asset-withdrawal/en-US`;
        baseUrlDeposit = `https://www.bitmart.com/asset-deposit/en-US`;
    }
    else if (cex === "INDODAX") {
        if (baseUrlTradeToken !== "#") baseUrlTradeToken = `https://indodax.com/market/${token}IDR`;
        if (baseUrlTradePair !== "#") baseUrlTradePair = `https://indodax.com/market/${pair}IDR`;
        baseUrlWithdraw = `https://indodax.com/finance/${token}#kirim`;
        baseUrlDeposit = `https://indodax.com/finance/${token}`;
    }

    return {
        tradeToken: baseUrlTradeToken,
        tradePair: baseUrlTradePair,
        // Back-compat fields (keep):
        withdrawUrl: baseUrlWithdraw,
        depositUrl: baseUrlDeposit,
        // Standardized fields used by UI:
        withdrawTokenUrl: baseUrlWithdraw,
        depositTokenUrl: baseUrlDeposit,
        withdrawPairUrl: baseUrlWithdraw,
        depositPairUrl: baseUrlDeposit
    };
}

/**
 * Retrieves configuration data for a specific chain.
 * @param {string} chainName - The name of the chain (e.g., 'polygon').
 * @returns {object|null} The chain configuration object or null if not found.
 */
function getChainData(chainName) {
    if (!chainName) return null;
    
    const chainLower = chainName.toLowerCase();
    const chainData = CONFIG_CHAINS[chainLower];
    
    const managedChains = getManagedChains();
    if (!managedChains.includes(chainLower)) {
        console.log(`Chain ${chainName} tidak termasuk dalam chain yang dikelola`);
        return null;
    }
    
    if (!chainData) {
        console.log(`Chain dengan nama ${chainName} tidak ditemukan di CONFIG_CHAINS`);
        return null;
    }

    return {
        Kode_Chain: chainData.Kode_Chain || '',
        Nama_Chain: chainData.Nama_Chain || '',
        DEXS: chainData.DEXS || {},
        PAIRDExS: chainData.PAIRDExS || {},
        URL_Chain: chainData.URL_Chain || '', 
        DATAJSON: chainData.DATAJSON || {},
        BaseFEEDEX: chainData.BaseFEEDEX || '',
        CEXCHAIN: chainData.WALLET_CEX || {},
        ICON_CHAIN: chainData.ICON || '',
        COLOR_CHAIN: chainData.WARNA || '#000',
        SHORT_NAME: chainData.Nama_Pendek || '',
        RPC: chainData.RPC || '' // ⬅ penting
    };
}

/**
 * Retrieves configuration data for a specific CEX.
 * @param {string} cexName - The name of the CEX (e.g., 'BINANCE').
 * @returns {object|null} The CEX configuration object or null if not found.
 */
function getCexDataConfig(cexName) {
    if (!cexName || typeof cexName !== 'string') return null;

    const key = cexName.toUpperCase();
    const cexData = (typeof CONFIG_CEX === 'object' && CONFIG_CEX[key]) ? CONFIG_CEX[key] : null;

    if (!cexData) {
        console.log(`CEX dengan nama ${cexName} tidak ditemukan di CONFIG_CEX`);
        return null;
    }

    return {
        NAME: key,
        API_KEY: cexData.ApiKey || '',
        API_SECRET: cexData.ApiSecret || '',
        COLOR: cexData.WARNA || '#000'
    };
}

/**
 * Retrieves configuration data for a specific DEX.
 * @param {string} dexName - The name of the DEX (e.g., 'kyberswap').
 * @returns {object|null} The DEX configuration object or null if not found.
 */
function getDexData(dexName) {
    if (!dexName || typeof dexName !== 'string') return null;

    // Normalisasi key sesuai definisi di CONFIG_DEXS
    const nameLower = dexName.toLowerCase();
    let dexKey = nameLower;
    // Beberapa key di CONFIG_DEXS menggunakan format khusus ("0x", "1inch")
    if (nameLower === '0x') dexKey = '0x';
    if (nameLower === '1inch') dexKey = '1inch';

    const dexBuilder = (typeof CONFIG_DEXS === 'object') ? CONFIG_DEXS[dexKey] : undefined;

    if (!dexBuilder) {
        console.log(`DEX dengan nama ${dexName} tidak ditemukan di CONFIG_DEXS`);
        return null;
    }

    // Kumpulkan daftar chain yang mendukung DEX ini (berdasarkan CONFIG_CHAINS[*].DEXS)
    const supportedChains = Object.keys(CONFIG_CHAINS || {})
        .filter(chain => Array.isArray(CONFIG_CHAINS[chain].DEXS) && CONFIG_CHAINS[chain].DEXS.map(String).map(s=>s.toLowerCase()).includes(dexKey))
        .map(chain => ({
            key: chain,                                      // key object di CONFIG_CHAINS
            code: CONFIG_CHAINS[chain].Kode_Chain || '',     // kode chain (angka)
            name: CONFIG_CHAINS[chain].Nama_Chain || chain,  // nama chain (string)
            short: CONFIG_CHAINS[chain].Nama_Pendek || '',
            color: CONFIG_CHAINS[chain].WARNA || '#000'
        }));

    return {
        NAME: dexKey,                        // nama dex ter-normalisasi
        HAS_BUILDER: typeof dexBuilder === 'function',
        BUILDER: dexBuilder || null,         // fungsi pembentuk URL (bila ada)
        SUPPORTED_CHAINS: supportedChains    // daftar chain yang mendukung DEX ini
    };
}

/**
 * Flattens the token data from TOKEN_SCANNER, creating a separate entry for each selected CEX.
 * @param {Array} dataTokens - The array of token objects from localStorage.
 * @returns {Array} A flattened array of token objects, ready for scanning.
 */
function flattenDataKoin(dataTokens) {
  if (!Array.isArray(dataTokens)) {
    try { dataTokens = JSON.parse(dataTokens || '[]'); } catch { dataTokens = []; }
  }
  let flatResult = [];
  let counter = 1;

  const setting = getFromLocalStorage('SETTING_SCANNER', {}) || {};
  const selectedFilterCEX = Array.isArray(setting.FilterCEXs) ? setting.FilterCEXs.map(x => String(x).toUpperCase()) : [];
  const isAllCexActive = selectedFilterCEX.length === 0; // kosong = semua aktif

  dataTokens.forEach(item => {
    if (!item.status) return;

    (item.selectedCexs || []).forEach(cex => {
      const cexUpper = String(cex).toUpperCase();
      if (!isAllCexActive && !selectedFilterCEX.includes(cexUpper)) return; // filter CEX

      const cexInfo = item.dataCexs?.[cexUpper] || {};
      const dexArray = (item.selectedDexs || []).map(dex => ({
        dex: dex,
        left: item.dataDexs?.[dex]?.left || 0,
        right: item.dataDexs?.[dex]?.right || 0
      }));

      flatResult.push({
        no: counter++,
        id: item.id,
        cex: cexUpper,
        feeWDToken: parseFloat(cexInfo.feeWDToken) || 0,
        feeWDPair:  parseFloat(cexInfo.feeWDPair)  || 0,
        depositToken: !!cexInfo.depositToken,
        withdrawToken: !!cexInfo.withdrawToken,
        depositPair: !!cexInfo.depositPair,
        withdrawPair: !!cexInfo.withdrawPair,
        chain: item.chain,
        symbol_in: item.symbol_in,
        sc_in: item.sc_in,
        des_in: item.des_in,
        symbol_out: item.symbol_out,
        sc_out: item.sc_out,
        des_out: item.des_out,
        status: item.status,
        dexs: dexArray
      });
    });
  });

  return flatResult;
}

/**
 * Calculates the estimated swap fee in USD for a given chain.
 * @param {string} chainName - The name of the chain.
 * @returns {number} The estimated swap fee in USD.
 */
function getFeeSwap(chainName) {
    const allGasData = getFromLocalStorage("ALL_GAS_FEES");
    if (!allGasData) return 0;

    // cari data gas untuk chain yang sesuai
    const gasInfo = allGasData.find(g => g.chain.toLowerCase() === chainName.toLowerCase());
    if (!gasInfo) {
        console.error(`❌ Gas data not found for chain: ${chainName}`);
        return 0;
    }

    // ambil GASLIMIT dari CONFIG_CHAINS
    const chainConfig = CONFIG_CHAINS[chainName.toLowerCase()];
    if (!chainConfig) {
        console.error(`❌ Chain config not found for: ${chainName}`);
        return 0;
    }

    const gasLimit = parseFloat(chainConfig.GASLIMIT || 250000); // default kalau tidak ada
    const feeSwap = ((parseFloat(gasInfo.gwei) * gasLimit) / Math.pow(10, 9)) * parseFloat(gasInfo.tokenPrice);

    return feeSwap;
}

/**
 * Converts an IDR amount to USDT based on the stored rate.
 * @param {number} idrAmount - The amount in IDR.
 * @returns {number} The equivalent amount in USDT.
 */
function convertIDRtoUSDT(idrAmount) {
    const rateUSDT = getFromLocalStorage("PRICE_RATE_USDT", 0);
    if (!rateUSDT || rateUSDT === 0) return 0;
    return parseFloat((idrAmount / rateUSDT).toFixed(8));
}

/**
 * Generates a direct trade link for a given DEX.
 * @param {string} dex - The DEX name.
 * @param {string} chainName - The chain name.
 * @param {number} codeChain - The chain ID.
 * @param {string} NameToken - The input token symbol.
 * @param {string} sc_input - The input token contract address.
 * @param {string} NamePair - The output token symbol.
 * @param {string} sc_output - The output token contract address.
 * @returns {string|null} The DEX trade URL or null if not supported.
 */
function getWarnaCEX(cex) {
    if (!cex || typeof cex !== 'string') {
        return 'black';
    }
    try {
        const upperCex = cex.toUpperCase();
        if (CONFIG_CEX && CONFIG_CEX[upperCex] && CONFIG_CEX[upperCex].WARNA) {
            return CONFIG_CEX[upperCex].WARNA;
        }
        return 'black'; // Warna default
    } catch (error) {
        console.error('Error dalam getWarnaCEX:', error);
        return 'black';
    }
}

function generateDexLink(dex,chainName,codeChain, NameToken, sc_input, NamePair, sc_output) {
    const link = {
        'kyberswap': `https://kyberswap.com/swap/${chainName}/${sc_input}-to-${sc_output}`,
        'kana': `https://app.paraswap.xyz/#/swap/${sc_input}-${sc_output}?version=6.2&network=${chainName}`,
        'odos': "https://app.odos.xyz",
        '0x': chainName.toLowerCase() === 'solana' 
            ? `https://matcha.xyz/tokens/solana/${sc_input}?sellChain=1399811149&sellAddress=${sc_output}` 
            : `https://matcha.xyz/tokens/${codeChain}/${sc_input.toLowerCase()}?buyChain=${codeChain}&buyAddress=${sc_output.toLowerCase()}`,
        '1inch': ` https://app.1inch.io/advanced/swap?network=${codeChain}&src=${sc_input.toUpperCase()}&dst=${sc_output.toUpperCase()}`,
      // '1inch': `https://app.1inch.io/#/${codeChain}/advanced/swap/${sc_input}/${sc_output}`,
        'okx': `https://www.okx.com/web3/dex-swap?inputChain=${codeChain}&inputCurrency=${sc_input}&outputChain=501&outputCurrency=${sc_output}`,
        'magpie': `https://app.magpiefi.xyz/swap/${chainName.toLowerCase()}/${NameToken.toUpperCase()}/${chainName.toLowerCase()}/${NamePair.toUpperCase()}`,
        'paraswap': `https://app.paraswap.xyz/#/swap/${sc_input}-${sc_output}?version=6.2&network=${chainName}`,
        'openocean' : `https://app.openocean.finance/swap/${chainName}/${sc_input}/${sc_output}`,
        'jupiter': `https://jup.ag/swap/${sc_input}-${sc_output}`,
        'lifi' : `https://jumper.exchange/?fromChain=${codeChain}&fromToken=${sc_input}&toChain=${codeChain}&toToken=${sc_output}`,
    };
    return link[dex] || null;
}

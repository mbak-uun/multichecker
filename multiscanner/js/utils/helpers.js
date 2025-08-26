// --- UTILITY FUNCTIONS ---

function createHoverLink(url, text, className = '') {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="hover-link ${className}" title="${url}">${text}</a>`;
}

function safeUrl(u, fallback) {
    return (u && typeof u === 'string' && /^https?:\/\//i.test(u)) ? u : fallback;
}

function linkifyStatus(flag, label, urlOk, colorOk = 'green') {
    if (flag === true) return `<a href="${urlOk}" target="_blank" class="uk-text-bold" style="color:${colorOk};">${label}</a>`;
    if (flag === false) return `<span style="color:red; font-weight:bold;">${label === 'DP' ? 'DX' : 'WX'}</span>`;
    return `<span style="color:black; font-weight:bold;">${label.replace('P','-')}</span>`;
}

function getStatusLabel(flag, type) {
    if (flag === true) return `<b style="color:green; font-weight:bold;">${type}</b>`;
    if (flag === false) return `<b style="color:red; font-weight:bold;">${type.replace('P','X')}</b>`;
    return `<b style="color:black; font-weight:bold;">${type.replace('P','-')}</b>`;
}

function hexToRgba(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatPrice(price) {
    if (price >= 1) {
        return price.toFixed(3) + '$';
    }
    let strPrice = price.toFixed(20).replace(/0+$/, '');
    let match = strPrice.match(/0\.(0*)(\d+)/);
    if (match) {
        let zeroCount = match[1].length;
        let significant = match[2].substring(0, 4).padEnd(4, '0');
        if (zeroCount >= 2) {
            return `0.{${zeroCount}}${significant}$`;
        } else {
            return `0.${match[1]}${significant}$`;
        }
    }
    return price.toFixed(6) + '$';
}

function GeturlExchanger(cex, NameToken, NamePair) {
    if (!NameToken || !NamePair) {
        return { tradeToken: '#', tradePair: '#', withdrawUrl: '#', depositUrl: '#' };
    }
    const token = NameToken.toString().toUpperCase();
    const pair = NamePair.toString().toUpperCase();
    let baseUrlTradeToken = token === "USDT" ? "#" : null;
    let baseUrlTradePair = pair === "USDT" ? "#" : null;
    let baseUrlWithdraw = null;
    let baseUrlDeposit = null;

    switch (cex) {
        case "GATE":
            if (baseUrlTradeToken !== "#") baseUrlTradeToken = `https://www.gate.com/trade/${token}_USDT`;
            if (baseUrlTradePair !== "#") baseUrlTradePair = `https://www.gate.com/trade/${pair}_USDT`;
            baseUrlWithdraw = `https://www.gate.com/myaccount/withdraw/${token}`;
            baseUrlDeposit = `https://www.gate.com/myaccount/deposit/${pair}`;
            break;
        case "BINANCE":
            if (baseUrlTradeToken !== "#") baseUrlTradeToken = `https://www.binance.com/en/trade/${token}_USDT`;
            if (baseUrlTradePair !== "#") baseUrlTradePair = `https://www.binance.com/en/trade/${pair}_USDT`;
            baseUrlWithdraw = `https://www.binance.com/en/my/wallet/account/main/withdrawal/crypto/${token}`;
            baseUrlDeposit = `https://www.binance.com/en/my/wallet/account/main/deposit/crypto/${pair}`;
            break;
        // Add other CEX cases here...
    }

    return {
        tradeToken: baseUrlTradeToken,
        tradePair: baseUrlTradePair,
        withdrawUrl: baseUrlWithdraw,
        depositUrl: baseUrlDeposit,
        withdrawTokenUrl: baseUrlWithdraw,
        depositTokenUrl: baseUrlDeposit,
        withdrawPairUrl: baseUrlWithdraw,
        depositPairUrl: baseUrlDeposit
    };
}

function generateDexLink(dex, chainName, codeChain, NameToken, sc_input, NamePair, sc_output) {
    const link = {
        'kyberswap': `https://kyberswap.com/swap/${chainName}/${sc_input}-to-${sc_output}`,
        'odos': "https://app.odos.xyz",
        '0x': chainName.toLowerCase() === 'solana'
            ? `https://matcha.xyz/tokens/solana/${sc_input}?sellChain=1399811149&sellAddress=${sc_output}`
            : `https://matcha.xyz/tokens/${codeChain}/${sc_input.toLowerCase()}?buyChain=${codeChain}&buyAddress=${sc_output.toLowerCase()}`,
        '1inch': ` https://app.1inch.io/advanced/swap?network=${codeChain}&src=${sc_input.toUpperCase()}&dst=${sc_output.toUpperCase()}`,
        'okx': `https://www.okx.com/web3/dex-swap?inputChain=${codeChain}&inputCurrency=${sc_input}&outputChain=501&outputCurrency=${sc_output}`,
        'jupiter': `https://jup.ag/swap/${sc_input}-${sc_output}`,
        'lifi' : `https://jumper.exchange/?fromChain=${codeChain}&fromToken=${sc_input}&toChain=${codeChain}&toToken=${sc_output}`,
    };
    return link[dex.toLowerCase()] || null;
}

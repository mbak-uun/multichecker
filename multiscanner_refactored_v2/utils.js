function createHoverLink(url, text, className = '') {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="hover-link ${className}" title="${url}">${text}</a>`;
}

function safeUrl(u, fallback) {
    return (u && typeof u === 'string' && /^https?:\/\//i.test(u)) ? u : fallback;
}

function linkifyStatus(flag, label, urlOk, colorOk = 'green') {
    if (flag === true) return `<a href="${urlOk}" target="_blank" class="uk-text-bold" style="color:${colorOk};">${label}</a>`;
    if (flag === false) return `<span style="color:red; font-weight:bold;">${label === 'DP' ? 'DX' : 'WX'}</span>`;
    return `<span style="color:black; font-weight:bold;">${label.replace('P', '-')}</span>`;
}

function getStatusLabel(flag, type) {
    if (flag === true) return `<b style="color:green; font-weight:bold;">${type}</b>`;
    if (flag === false) return `<b style="color:red; font-weight:bold;">${type.replace('P', 'X')}</b>`;
    return `<b style="color:black; font-weight:bold;">${type.replace('P', '-')}</b>`;
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

function createLink(url, text, className = '') {
    return url ? `<a href="${url}" target="_blank" class="${className}"><b>${text}</b></a>` : `<b>${text}</b>`;
}

function calculateSignature(exchange, apiSecret, dataToSign, hashMethod = "HmacSHA256") {
    if (!apiSecret || !dataToSign) {
        console.error(`[${exchange}] API Secret atau Data untuk Signature tidak valid!`);
        return null;
    }
    switch (exchange.toUpperCase()) {
        case "MEXC":
        case "BINANCE":
        case "KUCOIN":
        case "BYBIT":
            return CryptoJS[hashMethod](dataToSign, apiSecret).toString(CryptoJS.enc.Hex);
        case "OKX":
            const hmac = CryptoJS.HmacSHA256(dataToSign, apiSecret);
            return CryptoJS.enc.Base64.stringify(hmac);
        default:
            console.error(`[${exchange}] Exchange tidak didukung untuk perhitungan signature.`);
            return null;
    }
}

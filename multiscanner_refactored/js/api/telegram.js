import { GeturlExchanger } from './cexApi.js';

const { CONFIG_CHAINS } = window;
const TELEGRAM_API_URL = 'https://api.telegram.org/bot8053447166:AAH7YYbyZ4eBoPX31D8h3bCYdzEeIaiG4JU/sendMessage';
const CHAT_ID = -1002079288809;

/**
 * Sends a status message to Telegram (e.g., user online/offline).
 * @param {string} user - The user's nickname.
 * @param {string} status - The status message (e.g., 'ONLINE').
 */
export function sendStatusTELE(user, status) {
    const message = `
<b>#MULTISCAN_SCANNER</b>
<b>USER:</b> ${(user || '-').toUpperCase()} [ <b>${(status || '-').toUpperCase()}</b> ]
    `.trim();

    $.ajax({
        url: TELEGRAM_API_URL,
        method: "POST",
        data: {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: "HTML",
            disable_web_page_preview: true
        }
    });
}

/**
 * Sends a detailed arbitrage signal message to Telegram.
 * @param {string} cex - The CEX name.
 * @param {string} dex - The DEX name.
 * @param {object} tokenData - Data about the tokens.
 * @param {number} modal - The initial capital.
 * @param {number} PNL - The calculated Profit and Loss.
 * @param {number} priceBUY - The buy price.
 * @param {number} priceSELL - The sell price.
 * @param {number} FeeSwap - The DEX swap fee.
 * @param {number} FeeWD - The CEX withdrawal fee.
 * @param {number} totalFee - The total fees.
 * @param {string} nickname - The user's nickname.
 * @param {string} direction - The direction of the trade ('cex_to_dex' or 'dex_to_cex').
 */
export function MultisendMessage(
    cex, dex, tokenData, modal, PNL,
    priceBUY, priceSELL,
    FeeSwap, FeeWD, totalFee,
    nickname, direction
) {
    try {
        if (!tokenData || !tokenData.chain) {
            console.error('❌ tokenData/chain is missing in MultisendMessage:', tokenData);
            return;
        }

        const chainName = String(tokenData.chain || '').toLowerCase();
        const chainConfig = CONFIG_CHAINS[chainName];
        if (!chainConfig) {
            console.error('❌ Chain configuration not found for:', chainName);
            return;
        }

        const fromSymbol = (direction === 'cex_to_dex') ? tokenData.symbol : tokenData.pairSymbol;
        const toSymbol = (direction === 'cex_to_dex') ? tokenData.pairSymbol : tokenData.symbol;
        const scIn = (direction === 'cex_to_dex') ? tokenData.contractAddress : tokenData.pairContractAddress;
        const scOut = (direction === 'cex_to_dex') ? tokenData.pairContractAddress : tokenData.contractAddress;

        const linkBuy = `<a href="${chainConfig.URL_Chain}/token/${scIn}" target="_blank">${fromSymbol}</a>`;
        const linkSell = `<a href="${chainConfig.URL_Chain}/token/${scOut}" target="_blank">${toSymbol}</a>`;
        const dexTradeLink = `<a href="https://swap.defillama.com/?chain=${chainConfig.Nama_Chain}&from=${scIn}&to=${scOut}" target="_blank">${dex.toUpperCase()}</a>`;

        const urls = GeturlExchanger(String(cex).toUpperCase(), fromSymbol, toSymbol) || {};
        const cexLinkFrom = urls.tradeToken || '#';
        const cexLinkTo = urls.tradePair || '#';
        const linkCEX = `<a href="${cexLinkFrom}" target="_blank">${String(cex).toUpperCase()}</a>`;

        const pnl = Number(PNL) || 0;
        const cap = Number(modal) || 0;

        const message = `
<b>#MULTISCAN #${String(chainConfig.Nama_Chain || chainName).toUpperCase()}</b>
<b>USER:</b> ~ ${nickname || '-'}
-----------------------------------------
<b>MARKET:</b> ${linkCEX} VS ${dexTradeLink}
<b>TOKEN-PAIR:</b> <b>#<a href="${cexLinkFrom}" target="_blank">${fromSymbol}</a>_<a href="${cexLinkTo}" target="_blank">${toSymbol}</a></b>
<b>MODAL:</b> $${cap} | <b>PROFIT:</b> ${pnl.toFixed(2)}$
<b>BUY:</b> ${linkBuy} @ ${Number(priceBUY).toPrecision(4)}
<b>SELL:</b> ${linkSell} @ ${Number(priceSELL).toPrecision(4)}
<b>FEE WD:</b> ${Number(FeeWD).toFixed(3)}$
<b>FEE TOTAL:</b> $${Number(totalFee).toFixed(2)} | <b>SWAP:</b> $${Number(FeeSwap).toFixed(2)}
-----------------------------------------`.trim();

        $.ajax({
            url: TELEGRAM_API_URL,
            method: "POST",
            data: {
                chat_id: CHAT_ID,
                text: message,
                parse_mode: "HTML",
                disable_web_page_preview: true
            }
        });

    } catch (err) {
        console.error('❌ MultisendMessage error:', err);
    }
}

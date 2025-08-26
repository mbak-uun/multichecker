function calculateArbitrageResult(amount_out, FeeSwap, sc_input, sc_output, cex, Modal, amount_in, priceBuyToken_CEX, priceSellToken_CEX, priceBuyPair_CEX, priceSellPair_CEX, Name_in, Name_out, feeWD, dextype, nameChain, codeChain, trx, vol, DataDEX) {
    const FeeTrade = 0.0014 * Modal;
    const totalFee = FeeSwap + feeWD + FeeTrade;
    const totalModal = Modal + totalFee;
    const totalValue = amount_out * priceSellPair_CEX;
    const PNL = totalValue - totalModal;
    const profitLossPercent = totalModal !== 0 ? (PNL / totalModal) * 100 : 0;

    const settings = getSettings();
    const filterPNLValue = parseFloat(settings.filterPNL);

    const conclusion = (PNL > filterPNLValue) ? "GET SIGNAL" : "NO SELISIH";
    const selisih = PNL > filterPNLValue;

    return {
        PNL, cex, Name_in, Name_out, totalFee, modal, dextype, FeeSwap, FeeWD,
        totalValue, totalModal, conclusion, selisih, nameChain, codeChain,
        trx, profitLossPercent, vol, DataDEX
    };
}

async function processSingleToken(token) {
    logMessage(`Processing token pair: ${token.symbol_in}/${token.symbol_out} on CEX: ${token.cex}`);

    getPriceCEX(token, token.symbol_in, token.symbol_out, token.cex, (error, cexData) => {
        if (error || !cexData) {
            logMessage(`Could not get CEX data for ${token.symbol_in}: ${error}`, 'error');
            return;
        }

        token.dexs.forEach(dexInfo => {
            const dexType = dexInfo.dex;
            const modalLeft = dexInfo.left || 0;
            const modalRight = dexInfo.right || 0;

            if (modalLeft > 0) {
                const amount_in_token = parseFloat(modalLeft) / parseFloat(cexData.price_buyToken);
                const dexParamsLeft = { /* ... */ };
                getPriceDEX(dexParamsLeft, (dexError, dexData) => {
                    if (dexError) return;
                    const result = calculateArbitrageResult(/* ... */);
                    displayArbitrageResult(result);
                });
            }

            if (modalRight > 0) {
                const amount_in_pair = parseFloat(modalRight) / parseFloat(cexData.price_buyPair);
                const dexParamsRight = { /* ... */ };
                getPriceDEX(dexParamsRight, (dexError, dexData) => {
                    if (dexError) return;
                    const result = calculateArbitrageResult(/* ... */);
                    displayArbitrageResult(result);
                });
            }
        });
    });
}

function monitorArbitrage() {
    const allTokens = getTokens();
    const flatTokens = flattenDataKoin(allTokens);

    if (flatTokens.length === 0) {
        logMessage("No tokens to monitor.", "warn");
        return;
    }

    logMessage("Starting arbitrage monitoring cycle...");
    flatTokens.forEach(token => {
        if(token.status) {
            processSingleToken(token);
        }
    });
}

function startMonitoring() {
    if (window.APP_STATE.isMonitoring) return;
    window.APP_STATE.isMonitoring = true;
    logMessage('Monitoring started.', 'info');
    updateMonitoringStatus(true);
    setMonitoringButtons(true);
    monitorArbitrage();
    const settings = getSettings();
    const interval = settings.jedaTimeGroup || 15000;
    window.APP_STATE.monitoringInterval = setInterval(monitorArbitrage, interval);
}

function stopMonitoring() {
    if (!window.APP_STATE.isMonitoring) return;
    window.APP_STATE.isMonitoring = false;
    clearInterval(window.APP_STATE.monitoringInterval);
    logMessage('Monitoring stopped.', 'info');
    updateMonitoringStatus(false);
    setMonitoringButtons(false);
}

function flattenDataKoin(dataTokens) {
    if (!Array.isArray(dataTokens)) return [];
    let flatResult = [];
    dataTokens.forEach(item => {
        if (!item.status) return;
        (item.selectedCexs || []).forEach(cex => {
            const cexInfo = item.dataCexs?.[cex] || {};
            flatResult.push({
                ...item,
                cex: cex,
                feeWDToken: parseFloat(cexInfo.feeWDToken) || 0,
                feeWDPair: parseFloat(cexInfo.feeWDPair) || 0,
                dexs: (item.selectedDexs || []).map(d => ({
                    dex: d,
                    left: item.dataDexs?.[d]?.left || 0,
                    right: item.dataDexs?.[d]?.right || 0
                }))
            });
        });
    });
    return flatResult;
}

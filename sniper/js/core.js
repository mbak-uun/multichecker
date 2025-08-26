function calculateArbitrageResult(amount_out, FeeSwap, sc_input, sc_output, cex, Modal, amount_in, priceBuyToken_CEX, priceSellToken_CEX, priceBuyPair_CEX, priceSellPair_CEX, Name_in, Name_out, feeWD, dextype, nameChain, codeChain, trx, vol, DataDEX) {
    const FeeTrade = 0.0014 * Modal;
    const totalFee = FeeSwap + feeWD + FeeTrade;
    const totalModal = Modal + totalFee;
    const totalValue = amount_out * priceSellPair_CEX;
    const PNL = totalValue - totalModal;
    const profitLossPercent = totalModal !== 0 ? (PNL / totalModal) * 100 : 0;

    const settings = getSettings();
    const filterPNLValue = parseFloat(settings.filterPNL || 0);

    const conclusion = (PNL > filterPNLValue) ? "GET SIGNAL" : "NO SELISIH";
    const selisih = PNL > filterPNLValue;

    return {
        PNL, cex, Name_in, Name_out, totalFee, modal, dextype, FeeSwap, FeeWD,
        totalValue, totalModal, conclusion, selisih, nameChain, codeChain,
        trx, profitLossPercent, vol, DataDEX
    };
}

async function processSingleToken(token) {
    logMessage(`Processing: ${token.symbol_in}/${token.symbol_out} on ${token.cex}`);

    getPriceCEX(token, token.symbol_in, token.symbol_out, token.cex, (error, cexData) => {
        if (error || !cexData) {
            logMessage(`CEX Error for ${token.symbol_in}: ${error}`, 'error');
            return;
        }

        token.dexs.forEach(dexInfo => {
            const dexType = dexInfo.dex;
            const modalLeft = dexInfo.left || 0;
            const modalRight = dexInfo.right || 0;
            const chainConfig = CONFIG_CHAINS[token.chain];

            // --- CEX -> DEX (LEFT) ---
            if (modalLeft > 0 && cexData.price_buyToken > 0) {
                const amount_in_token = parseFloat(modalLeft) / parseFloat(cexData.price_buyToken);
                const dexParamsLeft = {
                    sc_input_in: token.sc_in, des_input: token.des_in,
                    sc_output_in: token.sc_out, des_output: token.des_out,
                    amount_in: amount_in_token, dexType: dexType,
                    chainName: token.chain, chainCode: chainConfig.Kode_Chain,
                    action: 'TokentoPair'
                };

                getPriceDEX(dexParamsLeft, (dexError, dexData) => {
                    if (dexError || !dexData) {
                        logMessage(`DEX Error (${dexType}) for ${token.symbol_in}: ${dexError?.message || 'No data'}`, 'error');
                        return;
                    }
                    const result = calculateArbitrageResult(
                        dexData.amount_out, dexData.FeeSwap, token.sc_in, token.sc_out, token.cex,
                        modalLeft, amount_in_token, cexData.price_buyToken, cexData.price_sellToken,
                        cexData.price_buyPair, cexData.price_sellPair, token.symbol_in, token.symbol_out,
                        cexData.feeWDToken, dexType, token.chain, chainConfig.Kode_Chain, 'TokentoPair', cexData.volumes_buyToken, dexData
                    );
                    displayArbitrageResult(result);
                });
            }

            // --- DEX -> CEX (RIGHT) ---
            if (modalRight > 0 && cexData.price_buyPair > 0) {
                const amount_in_pair = parseFloat(modalRight) / parseFloat(cexData.price_buyPair);
                 const dexParamsRight = {
                    sc_input_in: token.sc_out, des_input: token.des_out,
                    sc_output_in: token.sc_in, des_output: token.des_in,
                    amount_in: amount_in_pair, dexType: dexType,
                    chainName: token.chain, chainCode: chainConfig.Kode_Chain,
                    action: 'PairtoToken'
                };

                 getPriceDEX(dexParamsRight, (dexError, dexData) => {
                    if (dexError || !dexData) {
                        logMessage(`DEX Error (${dexType}) for ${token.symbol_out}: ${dexError?.message || 'No data'}`, 'error');
                        return;
                    }
                    const result = calculateArbitrageResult(
                        dexData.amount_out, dexData.FeeSwap, token.sc_out, token.sc_in, token.cex,
                        modalRight, amount_in_pair, cexData.price_buyPair, cexData.price_sellPair,
                        cexData.price_buyToken, cexData.price_sellToken, token.symbol_out, token.symbol_in,
                        cexData.feeWDPair, dexType, token.chain, chainConfig.Kode_Chain, 'PairtoToken', cexData.volumes_buyPair, dexData
                    );
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
        logMessage("No tokens to monitor. Please add some.", "warn");
        return;
    }

    logMessage("Starting new arbitrage monitoring cycle...");
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

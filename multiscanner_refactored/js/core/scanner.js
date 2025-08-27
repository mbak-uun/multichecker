import { getFromLocalStorage, saveToLocalStorage } from '../storage.js';
import { getPriceCEX } from '../api/cexApi.js';
import { getPriceDEX, getPriceSWOOP } from '../api/dexApi.js';
import { sendStatusTELE } from '../api/telegram.js';
import { updateProgress, DisplayPNL, refreshTokensTable } from '../ui/mainView.js';
import { form_off, form_on } from '../ui/domUtils.js';

const { CONFIG_CHAINS } = window;
let isScanning = false;

export function flattenDataKoin(dataTokens, settings) {
    if (!Array.isArray(dataTokens)) return [];
    let flatResult = [];
    let counter = 1;

    const selectedFilterCEX = (settings.FilterCEXs || []).map(x => String(x).toUpperCase());
    const isAllCexActive = selectedFilterCEX.length === 0;

    dataTokens.forEach(item => {
        if (!item.status) return;
        (item.selectedCexs || []).forEach(cex => {
            const cexUpper = String(cex).toUpperCase();
            if (!isAllCexActive && !selectedFilterCEX.includes(cexUpper)) return;

            const cexInfo = item.dataCexs?.[cexUpper] || {};
            const dexArray = (item.selectedDexs || []).map(dex => ({
                dex: dex,
                left: item.dataDexs?.[dex]?.left || 0,
                right: item.dataDexs?.[dex]?.right || 0
            }));

            flatResult.push({
                no: counter++, id: item.id, cex: cexUpper,
                feeWDToken: parseFloat(cexInfo.feeWDToken) || 0,
                feeWDPair: parseFloat(cexInfo.feeWDPair) || 0,
                depositToken: !!cexInfo.depositToken, withdrawToken: !!cexInfo.withdrawToken,
                depositPair: !!cexInfo.depositPair, withdrawPair: !!cexInfo.withdrawPair,
                chain: item.chain, symbol_in: item.symbol_in, sc_in: item.sc_in, des_in: item.des_in,
                symbol_out: item.symbol_out, sc_out: item.sc_out, des_out: item.des_out,
                status: item.status, dexs: dexArray
            });
        });
    });
    return flatResult;
}

export function getFeeSwap(chainName) {
    const allGasData = getFromLocalStorage("ALL_GAS_FEES", []);
    const gasInfo = allGasData.find(g => g.chain.toLowerCase() === chainName.toLowerCase());
    if (!gasInfo) return 0;

    const chainConfig = CONFIG_CHAINS[chainName.toLowerCase()];
    if (!chainConfig) return 0;

    const gasLimit = parseFloat(chainConfig.GASLIMIT || 250000);
    return ((parseFloat(gasInfo.gwei) * gasLimit) / 1e9) * parseFloat(gasInfo.tokenPrice);
}

function ResultEksekusi(params) {
    const { amount_out, FeeSwap, sc_input, sc_output, cex, Modal, amount_in, priceBuyToken_CEX, priceSellPair_CEX, Name_in, Name_out, feeWD, dextype, nameChain, trx, DataDEX } = params;

    const NameX = `${Name_in}_${Name_out}`;
    const FeeTrade = 0.0014 * Modal;
    const totalFee = (FeeSwap || 0) + (feeWD || 0) + FeeTrade;
    const totalValue = (amount_out || 0) * priceSellPair_CEX;
    const profitLoss = totalValue - (Modal + totalFee);

    DisplayPNL(profitLoss, cex, Name_in, NameX, totalFee, Modal, dextype, FeeSwap, feeWD, Name_out, totalValue, (Modal + totalFee), nameChain, trx);
}

async function processRequest(token, settings) {
    if (!isScanning) return;

    return new Promise(resolve => {
        getPriceCEX(token, token.symbol_in, token.symbol_out, token.cex, (error, DataCEX) => {
            if (error || !DataCEX) {
                console.error(`Error getting CEX price for ${token.symbol_in}/${token.symbol_out} on ${token.cex}:`, error);
                return resolve();
            }

            const { priceBuyTokenCEX, priceSellTokenCEX, priceBuyPairCEX, priceSellPairCEX } = DataCEX;
            if ([priceBuyTokenCEX, priceSellTokenCEX, priceBuyPairCEX, priceSellPairCEX].some(p => !isFinite(p) || p <= 0)) {
                return resolve();
            }

            const dexPromises = token.dexs.map(dexData => {
                return new Promise(dexResolve => {
                    const { dex, left: modalKiri, right: modalKanan } = dexData;
                    const amount_in_token = modalKiri / priceBuyTokenCEX;
                    const amount_in_pair = modalKanan / priceBuyPairCEX;
                    const jedaDEX = settings.JedaDexs?.[dex] || 700;

                    const baseParams = {
                        cex: token.cex, nameChain: token.chain, codeChain: CONFIG_CHAINS[token.chain]?.Kode_Chain,
                        dextype: dex.toLowerCase(), NameToken: token.symbol_in, NamePair: token.symbol_out,
                        sc_input: token.sc_in, sc_output: token.sc_out, des_input: token.des_in, des_output: token.des_out,
                        priceBuyTokenCEX, priceSellTokenCEX, priceBuyPairCEX, priceSellPairCEX,
                        DataCEX
                    };

                    const processDexSide = (direction) => {
                        const isTokenToPair = direction === 'TokentoPair';
                        if (isTokenToPair && !settings.posisiKiri) return;
                        if (!isTokenToPair && !settings.posisiKanan) return;

                        setTimeout(() => {
                            const dexParams = {
                                ...baseParams,
                                action: direction,
                                amount_in: isTokenToPair ? amount_in_token : amount_in_pair,
                            };
                            getPriceDEX(dexParams, (err, data) => {
                                if (err) {
                                    // Handle error, potentially with SWOOP fallback
                                    console.error(`DEX Error for ${dex}:`, err);
                                } else {
                                    ResultEksekusi({
                                        ...data, ...baseParams,
                                        Modal: isTokenToPair ? modalKiri : modalKanan,
                                        feeWD: isTokenToPair ? DataCEX.feeWDToken : DataCEX.feeWDPair,
                                        trx: direction,
                                    });
                                }
                            });
                        }, jedaDEX);
                    };

                    processDexSide('TokentoPair');
                    processDexSide('PairtoToken');

                    // Since DEX calls are async with timeout, we resolve this promise quickly.
                    // The UI updates will happen via callbacks.
                    dexResolve();
                });
            });

            Promise.all(dexPromises).then(() => resolve());
        });
    });
}

export async function startScanner() {
    if (isScanning) return;
    isScanning = true;

    const settings = getFromLocalStorage('SETTING_SCANNER', {});
    if (!settings.AllChains?.length) {
        isScanning = false;
        return toastr.warning('Tidak ada Chain yang dipilih.');
    }

    settings.posisiKiri = $('#checkKIRI').is(':checked'); // Assume IDs are set on checkboxes
    settings.posisiKanan = $('#checkKANAN').is(':checked');

    saveToLocalStorage('STATUS_RUN', { run: 'YES' });
    form_off();
    $('#startSCAN').prop('disabled', true).text('Running...');
    $('#stopSCAN').prop('disabled', false).show();
    sendStatusTELE(settings.nickname, 'ONLINE');

    const allTokens = getFromLocalStorage("TOKEN_SCANNER", []);
    let flatTokens = window.filteredTokens || flattenDataKoin(allTokens, settings);

    if (!flatTokens.length) {
        toastr.info('Tidak ada token pada chain terpilih.');
        stopScanner();
        return;
    }

    const startTime = Date.now();
    const totalTokens = flatTokens.length;
    const scanPerKoin = settings.scanPerKoin || 5;
    const jedaTimeGroup = settings.jedaTimeGroup || 1000;
    const jedaKoin = settings.jedaKoin || 500;

    let currentProcessed = 0;
    for (let i = 0; i < totalTokens; i += scanPerKoin) {
        if (!isScanning) break;
        const group = flatTokens.slice(i, i + scanPerKoin);
        console.log(`Memproses grup ${Math.floor(i / scanPerKoin) + 1}...`);

        const promises = group.map(token => {
            return processRequest(token, settings).then(() => {
                currentProcessed++;
                updateProgress(currentProcessed, totalTokens, startTime, `${token.symbol_in}_${token.symbol_out}`);
            });
        });

        await Promise.all(promises);
        if (isScanning) await new Promise(resolve => setTimeout(resolve, jedaTimeGroup));
    }

    if (isScanning) { // Only show "SELESAI" if it wasn't stopped manually
        updateProgress(totalTokens, totalTokens, startTime, 'SELESAI');
    }
    stopScanner();
}

export function stopScanner() {
    isScanning = false;
    saveToLocalStorage('STATUS_RUN', { run: 'NO' });
    form_on();
    $('#startSCAN').prop('disabled', false).text('Start');
    $('#stopSCAN').hide();
    console.log("Scanner stopped.");
}

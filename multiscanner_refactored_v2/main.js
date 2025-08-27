// =================================================================================
// MAIN APPLICATION LOGIC AND EVENT LISTENERS
// =================================================================================

// --- Global Variables ---
const REQUIRED_KEYS = {
    SETTINGS: 'SETTING_SCANNER',
    TOKENS: 'TOKEN_SCANNER'
};
let sortOrder = {};
let filteredTokens = [];
let originalTokens = [];
var SavedSettingData = getFromLocalStorage('SETTING_SCANNER', {});
var DataTokens = getFromLocalStorage('TOKEN_SCANNER', []);
let isScanning = false;


// --- Application Initialization ---

function computeAppReadiness() {
    const s = getFromLocalStorage(REQUIRED_KEYS.SETTINGS, {});
    const t = getFromLocalStorage(REQUIRED_KEYS.TOKENS, []);
    const hasSettings = s && Object.keys(s).length > 0 && Array.isArray(s.AllChains) && s.AllChains.length > 0;
    const hasTokens = Array.isArray(t) && t.length > 0;

    if (hasSettings && hasTokens) return 'READY';
    if (!hasSettings) return 'MISSING_SETTINGS';
    return 'MISSING_TOKENS';
}

function bootApp() {
    const state = computeAppReadiness();
    applyControlsFor(state); // from ui.js
    if (state === 'READY') {
        cekDataAwal();
    } else {
        if (window.toastr) {
            if (state === 'MISSING_SETTINGS') toastr.warning('Lengkapi SETTING terlebih dahulu');
            else if (state === 'MISSING_TOKENS') toastr.warning('Import DATA TOKEN terlebih dahulu');
        }
    }
}

function cekDataAwal() {
    console.info('Memulai proses Memuat DATA KOIN');
    generateInputCheckbox(CONFIG_CHAINS, "chain-options", "C", "CHAIN : &nbsp;", 'chain');
    generateInputCheckbox(CONFIG_CEX, "cex-filter", "X", "CEX : &nbsp;", 'cex');
    refreshTokensTable(); // from ui.js
    const dataACTION = getFromLocalStorage('HISTORY');
    if (dataACTION && dataACTION.time) {
        $("#infoAPP").show().text(`${dataACTION.action} at ${dataACTION.time}`);
    }
}


function flattenDataKoin(dataTokens) {
    if (!Array.isArray(dataTokens)) return [];
    let flatResult = [];
    const settings = getFromLocalStorage('SETTING_SCANNER', {});
    const selectedFilterCEX = (settings.FilterCEXs || []).map(x => String(x).toUpperCase());
    const isAllCexActive = selectedFilterCEX.length === 0;

    dataTokens.forEach(item => {
        if (!item.status) return;
        (item.selectedCexs || []).forEach(cex => {
            const cexUpper = String(cex).toUpperCase();
            if (!isAllCexActive && !selectedFilterCEX.includes(cexUpper)) return;
            const cexInfo = item.dataCexs?.[cexUpper] || {};
            flatResult.push({
                ...item,
                cex: cexUpper,
                feeWDToken: parseFloat(cexInfo.feeWDToken) || 0,
                feeWDPair: parseFloat(cexInfo.feeWDPair) || 0,
                depositToken: !!cexInfo.depositToken,
                withdrawToken: !!cexInfo.withdrawToken,
                depositPair: !!cexInfo.depositPair,
                withdrawPair: !!cexInfo.withdrawPair,
                dexs: (item.selectedDexs || []).map(dex => ({
                    dex,
                    left: item.dataDexs?.[dex]?.left || 0,
                    right: item.dataDexs?.[dex]?.right || 0
                }))
            });
        });
    });
    return flatResult;
}


// --- Scanner Orchestration ---

async function startScan() {
    if (isScanning) return;
    isScanning = true;

    const ConfigScan = getFromLocalStorage('SETTING_SCANNER', {});
    saveToLocalStorage('STATUS_RUN', { run: 'YES' });
    form_off();
    $('#startSCAN').prop('disabled', true).text('Running...');
    $('#stopSCAN').prop('disabled', false).show();
    sendStatusTELE(ConfigScan.nickname, 'ONLINE');

    let flatTokens = window.filteredTokens.length ? window.filteredTokens : flattenDataKoin(getFromLocalStorage("TOKEN_SCANNER", []));
    if (!flatTokens.length) {
        toastr.info('Tidak ada token untuk dipindai.');
        return stopScan();
    }

    const startTime = Date.now();
    const totalTokens = flatTokens.length;
    const scanPerKoin = parseInt(ConfigScan.scanPerKoin) || 5;
    const jedaTimeGroup = parseInt(ConfigScan.jedaTimeGroup) || 1500;

    for (let i = 0; i < totalTokens; i += scanPerKoin) {
        if (!isScanning) break;
        const group = flatTokens.slice(i, i + scanPerKoin);
        const promises = group.map(token => processRequest(token, ConfigScan));
        await Promise.all(promises);
        updateProgress(i + group.length, totalTokens, startTime, 'GROUP');
        if (isScanning) await new Promise(resolve => setTimeout(resolve, jedaTimeGroup));
    }

    updateProgress(totalTokens, totalTokens, startTime, 'SELESAI');
    stopScan();
}

function stopScan() {
    isScanning = false;
    saveToLocalStorage('STATUS_RUN', { run: 'NO' });
    form_on();
    $('#startSCAN').prop('disabled', false).text('Start');
    $('#stopSCAN').hide();
}

async function processRequest(token, settings) {
    if (!isScanning) return;
    // Simplified version of the complex processRequest logic from home.html
    // In a real scenario, the full logic would be here.
    return new Promise(resolve => {
        getPriceCEX(token, token.symbol_in, token.symbol_out, token.cex, (error, dataCEX) => {
            if (error || !dataCEX) {
                return resolve();
            }
            // Further logic to call getPriceDEX would be here...
            resolve();
        });
    });
}


// --- Main Execution ---
$(document).ready(function() {
    bootApp();

    // Attach Event Listeners
    $('#startSCAN').on('click', startScan);
    $('#stopSCAN').on('click', stopScan);
    $('#reload').on('click', () => location.reload());
    $('#darkModeToggle').on('click', () => {
        const isDark = $('body').toggleClass('dark-mode uk-dark').hasClass('dark-mode');
        saveToLocalStorage('DARK_MODE', isDark);
        updateDarkIcon(isDark);
    });
    // Other listeners from the original file...
});

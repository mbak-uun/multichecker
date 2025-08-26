// --- Application State Management ---

const storagePrefix = "MULTISCANNER_";
const REQUIRED_KEYS = {
    SETTINGS: 'SETTING_SCANNER',
    TOKENS: 'TOKEN_SCANNER'
};
const stablecoins = ["USDT", "DAI", "USDC", "FDUSD"];

let SavedSettingData = {};
let DataTokens = [];
let filteredTokens = [];
let originalTokens = [];
let sortOrder = {};

function getManagedChains() {
    const settings = getFromLocalStorage('SETTING_SCANNER', {});
    return settings.AllChains || Object.keys(CONFIG_CHAINS);
}

function getChainData(chainName) {
    if (!chainName) return null;
    const chainLower = chainName.toLowerCase();
    const chainData = CONFIG_CHAINS[chainLower];
    const managedChains = getManagedChains();
    if (!managedChains.includes(chainLower)) {
        return null;
    }
    if (!chainData) {
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
        RPC: chainData.RPC || ''
    };
}

function flattenDataKoin(dataTokens) {
    if (!Array.isArray(dataTokens)) {
        try { dataTokens = JSON.parse(dataTokens || '[]'); } catch { dataTokens = []; }
    }
    let flatResult = [];
    let counter = 1;
    const setting = getFromLocalStorage('SETTING_SCANNER', {}) || {};
    const selectedFilterCEX = (setting.FilterCEXs || []).map(x => String(x).toUpperCase());
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
                feeWDPair: parseFloat(cexInfo.feeWDPair)  || 0,
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

function setLastAction(action) {
    const now = new Date();
    const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} | ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    const lastAction = { time: formattedTime, action: action };
    saveToLocalStorage("HISTORY", lastAction);
    $("#infoAPP").html(`${lastAction.action} at ${lastAction.time}`);
}

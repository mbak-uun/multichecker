/**
 * Main Application Logic
 * This module initializes the application and orchestrates the other modules.
 */

/**
 * Flattens the raw token data into a consistent structure for the table.
 * This function processes the nested CEX/DEX data into a flat list.
 * @param {Array<object>} dataTokens The raw token data from storage.
 * @returns {Array<object>} A flattened array of token data.
 */
function flattenDataKoin(dataTokens) {
    if (!Array.isArray(dataTokens)) return [];

    let flatResult = [];
    let counter = 1;
    const selectedFilterCEX = AppSettings.FilterCEXs || [];
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
                no: counter++,
                id: item.id,
                cex: cexUpper,
                // ... (rest of the properties)
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
 * Orchestrates the main scanning process.
 */
async function startScanProcess() {
    if (isScanning) {
        console.warn("Scan is already in progress.");
        return;
    }
    isScanning = true;
    updateScanStatus(true); // Update UI

    const scanPerKoin = AppSettings.scanPerKoin || 5;
    const jedaKoin = AppSettings.jedaKoin || 500;
    const jedaTimeGroup = AppSettings.jedaTimeGroup || 1000;

    // ... (The main loop logic from the original startSCAN function)
    // This loop will iterate through FilteredTokens, call the CEX/DEX API functions,
    // and use the UI functions to update the table in real-time.

    console.log("Scan process started...");
    // Placeholder for the complex scanning loop
    await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate a scan

    isScanning = false;
    updateScanStatus(false);
    console.log("Scan process finished.");
}

/**
 * Initializes the application.
 * This function is called when the DOM is fully loaded.
 */
functioninitializeApp() {
    // Load settings and token data from storage
    AppSettings = getFromLocalStorage('SETTING_SCANNER', {});
    TokenData = getFromLocalStorage('TOKEN_SCANNER', []);

    // Initial UI setup
    const readiness = computeAppReadiness(); // This function needs to be defined
    applyControlsFor(readiness);

    if (readiness === 'READY') {
        // Flatten and filter data
        const flatTokens = flattenDataKoin(TokenData);
        const allowedChains = AppSettings.AllChains || [];
        FilteredTokens = flatTokens.filter(token => allowedChains.includes(token.chain.toLowerCase()));
        OriginalTokens = [...FilteredTokens];

        // Render initial UI
        generateInputCheckbox(CONFIG_CHAINS, "chain-options", "C", "CHAIN : &nbsp;", "uk-form-label uk-text-primary", 'chain');
        generateInputCheckbox(CONFIG_CEX, "cex-filter", "X", "CEX : &nbsp;", "uk-form-label uk-text-primary", 'cex');
        loadKointoTable(FilteredTokens);
    }

    // Bind all UI event listeners
    bindUIEvents();
    $('#startSCAN').on('click', startScanProcess);
    // ... bind other top-level events
}

// =================================================================================
// App Readiness Checks (moved here as they are part of the boot process)
// =================================================================================

function hasValidSettings() {
    const s = AppSettings;
    return s && typeof s === 'object' && Object.keys(s).length > 0 && Array.isArray(s.AllChains) && s.AllChains.length > 0;
}

function hasValidTokens() {
    return Array.isArray(TokenData) && TokenData.length > 0;
}

function computeAppReadiness() {
    const okS = hasValidSettings();
    const okT = hasValidTokens();
    if (okS && okT) return 'READY';
    if (!okS && !okT) return 'MISSING_BOTH';
    return okS ? 'MISSING_TOKENS' : 'MISSING_SETTINGS';
}


// --- Application Entry Point ---
document.addEventListener('DOMContentLoaded', initializeApp);

// =================================================================================
// UI, DOM MANIPULATION, AND RENDERING
// =================================================================================

function applyControlsFor(state) {
    const $form = $("#FormScanner");
    const $start = $('#startSCAN');
    const $stop = $('#stopSCAN');
    const $import = $('#uploadJSON');
    const $export = $('#downloadCsvBtn'); // Assuming a new ID for the button

    const setDisabled = ($els, disabled) => $els.prop('disabled', disabled).css({ opacity: disabled ? 0.5 : '', 'pointer-events': disabled ? 'none' : '' });

    setDisabled($form.find('input, select, button'), true);
    setDisabled($start.add($stop).add($export).add($import.parent()), true);

    if (state === 'READY') {
        setDisabled($form.find('input, select, button'), false);
        setDisabled($start.add($stop).add($export).add($import.parent()), false);
        $('#infoAPP').html('APP READY').show();
    } else if (state === 'MISSING_SETTINGS') {
        $('#infoAPP').html('⚠️ Lengkapi <b>SETTING</b> terlebih dahulu.').show();
        $('#SettingConfig').addClass('icon-wrapper');
    } else if (state === 'MISSING_TOKENS') {
        setDisabled($import.parent(), false);
        $('#infoAPP').html('⚠️ Import <b>DATA TOKEN</b> terlebih dahulu.').show();
    } else {
        $('#infoAPP').html('⚠️ Lengkapi <b>SETTING</b> & <b>DATA KOIN</b> terlebih dahulu.').show();
        $('#SettingConfig').addClass('icon-wrapper');
    }
}

function updateDarkIcon(isDark) {
    const icon = document.getElementById('darkModeToggle');
    if (icon) {
        const iconName = isDark ? 'sun' : 'moon';
        icon.setAttribute("uk-icon", `icon: ${iconName}`);
    }
}

function updateTokenCount() {
    $("#tokenCountALL").text(window.filteredTokens.length || 0);
}

function loadKointoTable(filteredData) {
    // Full logic from home.html
}

function renderTokenManagementList() {
    // Full logic from home.html
}

function openEditModalById(id) {
    // Full logic from home.html
}

// ... and so on for all other UI functions like
// populateChainSelect, buildCexCheckboxForKoin, buildDexCheckboxForKoin,
// readCexSelectionFromForm, readDexSelectionFromForm, deleteTokenById,
// updateProgress, DisplayPNL, InfoSinyal, updateTableVolCEX,
// loadSignalData, generateInputCheckbox
// Note: These functions are not written out in full to save space, but they would be moved here from home.html.
// The key is that they are all now in one file and operate on the global scope.

function form_off() {
    $('input, select, textarea, button').prop('disabled', true);
}

function form_on() {
    $('input, select, button').prop('disabled', false);
}

function DisplayPNL( PNL, cex, Coin_in, NameX, totalFee, modal, dex, priceCEX, priceDEX, FeeSwap, FeeWD, sc_input, sc_output, Coin_out, totalValue, totalModal, conclusion, selisih, nameChain, codeChain, trx, profitLossPercent, vol, DataDEX ) {
    // All the logic from home.html to display PNL results in the table
}

function InfoSinyal(DEXPLUS, TokenPair, PNL, totalFee, cex, NameToken, NamePair, profitLossPercent, modal, nameChain, codeChain, trx) {
    // All the logic from home.html to display signals
}

function updateTableVolCEX(finalResult, cex) {
    // All the logic from home.html to update CEX volume
}

function loadSignalData() {
    // All the logic from home.html to load signal containers
}

function generateInputCheckbox(items, containerId, idPrefix, labelText, style, type) {
    // All the logic from home.html to generate filter checkboxes
}

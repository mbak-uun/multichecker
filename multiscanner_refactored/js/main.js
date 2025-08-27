import { getFromLocalStorage, uploadTokenScannerCSV, downloadTokenScannerCSV } from './storage.js';
import { initializeSettings } from './ui/settings.js';
import { initializeTokenManager } from './ui/tokenManager.js';
import { initializeMainView, refreshTokensTable } from './ui/mainView.js';
import { startScanner, stopScanner } from './core/scanner.js';
import { checkAllCEXWallets } from './api/cexApi.js';
import { toggleDarkMode } from './ui/domUtils.js';

function hasValidSettings() {
    const s = getFromLocalStorage('SETTING_SCANNER', {});
    return s && typeof s === 'object' && Object.keys(s).length > 0 && Array.isArray(s.AllChains) && s.AllChains.length > 0;
}

function hasValidTokens() {
    const t = getFromLocalStorage('TOKEN_SCANNER', []);
    return Array.isArray(t) && t.length > 0;
}

function computeAppReadiness() {
    const okS = hasValidSettings();
    const okT = hasValidTokens();
    if (okS && okT) return 'READY';
    if (!okS && !okT) return 'MISSING_BOTH';
    return okS ? 'MISSING_TOKENS' : 'MISSING_SETTINGS';
}

function applyControlsFor(state) {
    const $form = $("#FormScanner");
    const $start = $('#startSCAN');
    const $stop = $('#stopSCAN');
    const $import = $('#uploadJSON');
    const $export = $('#downloadCsvBtn'); // Assuming a new ID for the button

    function setDisabled($els, disabled) {
        $els.prop('disabled', disabled)
            .css('opacity', disabled ? '0.5' : '')
            .css('pointer-events', disabled ? 'none' : '');
    }

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

function bootApp() {
    const state = computeAppReadiness();
    applyControlsFor(state);
    if (state === 'READY') {
        initializeMainView();
    } else {
        if (window.toastr) {
            if (state === 'MISSING_SETTINGS') toastr.warning('Lengkapi SETTING terlebih dahulu');
            else if (state === 'MISSING_TOKENS') toastr.warning('Import DATA TOKEN terlebih dahulu');
            else toastr.warning('Lengkapi SETTING & TOKEN');
        }
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI modules
    initializeSettings();
    initializeTokenManager();

    // Boot application
    bootApp();

    // Attach main event listeners
    $('#startSCAN').on('click', startScanner);
    $('#stopSCAN').on('click', stopScanner);
    $('#UpdateWalletCEX').on('click', () => {
        if (confirm("APAKAH ANDA INGIN UPDATE WALLET EXCHANGER?")) {
            checkAllCEXWallets();
        }
    });

    $('#reload').on('click', () => {
        const config = getFromLocalStorage('STATUS_RUN', {});
        if (config.run === "YES") {
            if (confirm("⚠️ PROSES SCANNING AKAN DIHENTIKAN. LANJUTKAN?")) {
                stopScanner();
                location.reload();
            }
        } else {
            location.reload();
        }
    });

    $('#downloadCsvBtn').on('click', downloadTokenScannerCSV);
    $('#uploadJSON').on('change', uploadTokenScannerCSV);
    $('#darkModeToggle').on('click', toggleDarkMode);

    // Handle cross-tab communication for stopping the scan
    window.addEventListener('storage', (event) => {
        if (event.key === storagePrefix + 'STATUS_RUN') {
            const config = JSON.parse(event.newValue || '{}');
            if (config.run === 'NO' && isScanning) { // isScanning is from scanner.js
                stopScanner();
            }
        }
    });
});

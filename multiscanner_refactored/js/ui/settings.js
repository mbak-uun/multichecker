import { getFromLocalStorage, saveToLocalStorage } from '../storage.js';

// These are expected to be available in the global scope from config.js
const { CONFIG_CEX, CONFIG_CHAINS } = window;

/**
 * Populates the settings form with currently saved values.
 */
function loadSettingsForm() {
    let appSettings = getFromLocalStorage('SETTING_SCANNER', {});

    $('#user').val(appSettings.nickname || '');
    $('#jeda-time-group').val(appSettings.jedaTimeGroup || 500);
    $('#jeda-koin').val(appSettings.jedaKoin || 500);
    $('#walletMeta').val(appSettings.walletMeta || '');
    $('#inFilterPNL').val(appSettings.filterPNL || 2);
    $(`input[name="koin-group"][value="${appSettings.scanPerKoin || 5}"]`).prop('checked', true);
    $(`input[name="waktu-tunggu"][value="${appSettings.speedScan || 2}"]`).prop('checked', true);

    const modalCexs = appSettings.JedaCexs || {};
    $('.cex-modal-input').each(function () {
        const cex = $(this).data('cex');
        if (modalCexs[cex] !== undefined) {
            $(this).val(modalCexs[cex]);
        }
    });

    const modalDexs = appSettings.JedaDexs || {};
    $('.dex-modal-input').each(function () {
        const dex = $(this).data('dex');
        if (modalDexs[dex] !== undefined) {
            $(this).val(modalDexs[dex]);
        }
    });
}

/**
 * Generates the dynamic input fields for CEX and DEX delays in the settings modal.
 */
function generateDelayInputs() {
    // Generate CEX checkbox + input
    const cexList = Object.keys(CONFIG_CEX || {});
    let cexHtml = '';
    cexList.forEach(cex => {
        cexHtml += `
        <div class="uk-flex uk-flex-middle uk-margin-small-bottom">
            <label for="cex-${cex}" style="min-width:70px; display:inline-block; margin-left:5px;">${cex}</label>
            <input type="number" class="uk-input uk-form-small cex-modal-input" data-cex="${cex}" value="300"
            style="width:80px; display:inline-block; margin-left:8px;" min="0">
        </div>
        `;
    });
    $('#cex-checkbox-group').html(cexHtml);

    // Generate DEX checkbox + input
    const dexList = Object.keys(window.CONFIG_DEXS || {});
    let dexHtml = '';
    dexList.forEach(dex => {
        dexHtml += `
        <div class="uk-flex uk-flex-middle uk-margin-small-bottom">
            <label for="dex-${dex}" style="min-width:70px; display:inline-block; margin-left:5px;">${dex.toUpperCase()}</label>
            <input type="number" class="uk-input uk-form-small dex-modal-input" data-dex="${dex}" value="700"
            style="width:80px; display:inline-block; margin-left:8px;" min="0">
        </div>
        `;
    });
    $('#dex-checkbox-group').html(dexHtml);
}

/**
 * Handles the save settings button click. Validates and saves the form data.
 */
function saveSettings() {
    const nickname = $('#user').val().trim();
    const filterPNL = parseFloat($('#inFilterPNL').val());
    const jedaTimeGroup = parseInt($('#jeda-time-group').val(), 10);
    const jedaKoin = parseInt($('#jeda-koin').val(), 10);
    const walletMeta = $('#walletMeta').val().trim();
    const scanPerKoin = $('input[name="koin-group"]:checked').val();
    const speedScan = $('input[name="waktu-tunggu"]:checked').val();

    // Validation
    if (!nickname) return toastr.error('Nickname harus diisi!');
    if (!jedaTimeGroup || jedaTimeGroup <= 0) return toastr.error('Jeda / Group harus lebih dari 0!');
    if (!jedaKoin || jedaKoin <= 0) return toastr.error('Jeda / Koin harus lebih dari 0!');
    if (!walletMeta) return toastr.error('Wallet Address harus diisi!');
    if (!walletMeta.startsWith('0x')) return toastr.error('Wallet Address harus diawali dengan "0x"!');
    if (!scanPerKoin) return toastr.error('Pilih opsi KOIN / GRUP!');
    if (!speedScan) return toastr.error('Pilih opsi WAKTU TUNGGU!');

    // Get CEX delays
    let JedaCexs = {};
    $('.cex-modal-input').each(function () {
        const cex = $(this).data('cex');
        const val = parseFloat($(this).val()) || 300;
        JedaCexs[cex] = val;
    });

    // Get DEX delays
    let JedaDexs = {};
    $('.dex-modal-input').each(function () {
        const dex = $(this).data('dex');
        const val = parseFloat($(this).val()) || 700;
        JedaDexs[dex] = val;
    });

    // By default, all chains and CEXs are selected when settings are first created.
    let AllChains = Object.keys(CONFIG_CHAINS);
    let FilterCEXs = Object.keys(CONFIG_CEX);

    const settingData = {
        nickname,
        jedaTimeGroup,
        jedaKoin,
        filterPNL,
        walletMeta,
        scanPerKoin: parseInt(scanPerKoin, 10),
        speedScan: parseFloat(speedScan),
        JedaCexs,
        JedaDexs,
        AllChains,
        FilterCEXs
    };

    saveToLocalStorage('SETTING_SCANNER', settingData);
    alert("✅ SETTING SCANNER BERHASIL DISIMPAN");
    location.reload();
}

/**
 * Initializes all event listeners related to the settings modal.
 */
export function initializeSettings() {
    $("#SettingConfig").on("click", function () {
        generateDelayInputs();
        loadSettingsForm();
        UIkit.modal("#modal-setting").show();
    });

    $('#btn-save-setting').on('click', saveSettings);
}

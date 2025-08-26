// --- Main Application Entry Point ---

$(document).ready(function() {
    // --- Initial Setup ---
    $('title').text("MULTISCANNER");
    toastr.options = { "positionClass": "toast-top-right", "timeOut": "2500", "progressBar": true };

    bootApp();

    // --- Event Listeners ---
    window.addEventListener('storage', function(event) {
        if (event.key !== 'MULTISCANNER_STATUS_RUN') return;
        const config = JSON.parse(event.newValue || '{}');
        const $start = $('#startSCAN');
        const $stop = $('#stopSCAN');
        if (config.run === 'NO') {
            $start.prop('disabled', false).text('START').show();
            $stop.hide();
        } else {
            $start.prop('disabled', true).text('Running...').show();
            $stop.prop('disabled', false).show();
        }
    });

    $('#darkModeToggle').on('click', () => {
        const isDark = !$('body').hasClass('dark-mode');
        $('body').toggleClass('dark-mode uk-dark', isDark).toggleClass('uk-light', !isDark);
        saveToLocalStorage("DARK_MODE", isDark);
        updateDarkIcon(isDark);
    });

    $('#searchInput').on('input', () => refreshTokensTable());
    $('#searchMgr').on('input', renderTokenManagementList);

    $("#reload").click(() => location.reload());

    $("#stopSCAN").click(() => {
        localStorage.setItem('MULTISCANNER_STATUS_RUN', JSON.stringify({ run: 'NO' }));
        location.reload();
    });

    $("#startSCAN").click(startScanningProcess);

    $('#ManajemenKoin').on('click', function(e) {
        e.preventDefault();
        $('#scanner-config, #sinyal-container, #header-table, .uk-overflow-auto').hide();
        $('#token-management').show();
        renderTokenManagementList();
    });

    $(document).on('click', '.mgrEdit', function() { openEditModal($(this).data('id')); });
    $(document).on('submit', '#multiTokenForm', handleTokenFormSubmit);
    $(document).on('click', '#HapusEditkoin', handleTokenDelete);
    $('#btnNewToken').on('click', handleNewTokenClick);

    $('#UpdateWalletCEX').on('click', () => {
        if (confirm("APAKAH ANDA INGIN UPDATE WALLET EXCHANGER?")) {
            checkAllCEXWallets();
        }
    });

     $('#SettingConfig').on("click", handleSettingsClick);
     $(document).on('click', '#btn-save-setting', handleSaveSettings);
});

// --- Core Application Logic ---

function bootApp() {
    window.SavedSettingData = getFromLocalStorage('SETTING_SCANNER', {});
    window.DataTokens = getFromLocalStorage('TOKEN_SCANNER', []);
    const isDark = getFromLocalStorage("DARK_MODE", false);
    $('body').toggleClass('dark-mode uk-dark', isDark).toggleClass('uk-light', !isDark);
    updateDarkIcon(isDark);

    const readiness = computeAppReadiness();
    applyControlsFor(readiness);

    if (readiness === 'READY') {
        cekDataAwal();
    } else {
        const msg = readiness === 'MISSING_SETTINGS' ? 'Lengkapi SETTING terlebih dahulu' :
                    readiness === 'MISSING_TOKENS' ? 'Import DATA TOKEN terlebih dahulu' :
                    'Lengkapi SETTING & TOKEN';
        toastr.warning(msg);
    }
}

function computeAppReadiness() {
    const hasSettings = window.SavedSettingData && Object.keys(window.SavedSettingData).length > 0 && Array.isArray(window.SavedSettingData.AllChains);
    const hasTokens = Array.isArray(window.DataTokens) && window.DataTokens.length > 0;
    if (hasSettings && hasTokens) return 'READY';
    if (!hasSettings && !hasTokens) return 'MISSING_BOTH';
    return hasSettings ? 'MISSING_TOKENS' : 'MISSING_SETTINGS';
}

function cekDataAwal() {
    console.info('⏳ Memuat data awal...');
    refreshTokensTable();
    generateInputCheckbox(CONFIG_CHAINS, "chain-options", "C", "CHAIN : &nbsp;", "uk-form-label uk-text-primary", 'chain');
    // generateInputCheckbox for CEX needs to be adapted
    console.info('✅ Data awal dimuat.');
}

async function startScanningProcess() {
    localStorage.setItem('MULTISCANNER_STATUS_RUN', JSON.stringify({ run: 'YES' }));
    $('#startSCAN').prop('disabled', true).text('Running...');
    form_off();
    $("#stopSCAN").show().prop('disabled', false);

    const ConfigScan = getFromLocalStorage('SETTING_SCANNER', {});
    const scanPerKoin = parseInt(ConfigScan.scanPerKoin || 5);
    const jedaTimeGroup = parseInt(ConfigScan.jedaTimeGroup || 1500);

    let tokenGroups = [];
    for (let i = 0; i < window.filteredTokens.length; i += scanPerKoin) {
        tokenGroups.push(window.filteredTokens.slice(i, i + scanPerKoin));
    }

    for (const group of tokenGroups) {
        const config = JSON.parse(localStorage.getItem('MULTISCANNER_STATUS_RUN') || '{}');
        if (config.run !== 'YES') {
            console.log("Scan dihentikan oleh pengguna.");
            break;
        }
        await Promise.all(group.map(token => processToken(token, ConfigScan)));
        await new Promise(resolve => setTimeout(resolve, jedaTimeGroup));
    }

    localStorage.setItem('MULTISCANNER_STATUS_RUN', JSON.stringify({ run: 'NO' }));
    $('#startSCAN').prop('disabled', false).text('Start');
    form_on();
    $("#stopSCAN").hide();
}

async function processToken(token, config) {
    const jedaKoin = parseInt(config.jedaKoin || 500);
    return new Promise(resolve => {
        getPriceCEX(token, token.symbol_in, token.symbol_out, token.cex, (error, dataCEX) => {
            if (error || !dataCEX) {
                console.error(`Error CEX price for ${token.symbol_in}:`, error);
                return resolve();
            }
            token.dexs.forEach(dexData => {
                const params = {
                    sc_input_in: token.sc_in, des_input: token.des_in,
                    sc_output_in: token.sc_out, des_output: token.des_out,
                    amount_in: dexData.left / dataCEX.price_buyToken,
                    dexType: dexData.dex, chainName: token.chain,
                    chainCode: CONFIG_CHAINS[token.chain].Kode_Chain,
                    action: 'TokentoPair', walletAddress: config.walletMeta
                };
                getPriceDEX(params, (dexError, dexResult) => {
                    if (dexError) return;
                    ResultEksekusi(dexResult.amount_out, dexResult.FeeSwap, token.sc_in, token.sc_out, token.cex, dexData.left, params.amount_in, dataCEX.price_buyToken, dataCEX.price_sellToken, dataCEX.price_buyPair, dataCEX.price_sellPair, token.symbol_in, token.symbol_out, dataCEX.feeWDToken, dexData.dex, token.chain, params.chainCode, 'TokentoPair', 0, dexResult);
                });
            });
            setTimeout(resolve, jedaKoin);
        });
    });
}

function ResultEksekusi(amount_out, FeeSwap, sc_input, sc_output, cex, Modal, amount_in, priceBuyToken_CEX, priceSellToken_CEX, priceBuyPair_CEX, priceSellPair_CEX, Name_in, Name_out, feeWD, dextype, nameChain, codeChain, trx, vol, DataDEX) {
    const NameX = `${Name_in}_${Name_out}`;
    const FeeWD = parseFloat(feeWD);
    const FeeTrade = parseFloat(0.0014 * Modal);
    FeeSwap = parseFloat(FeeSwap);
    const totalFee = FeeSwap + FeeWD + FeeTrade;
    const totalValue = parseFloat(amount_out) * priceSellPair_CEX;
    const PNL = totalValue - (Modal + totalFee);
    DisplayPNL(PNL, cex, Name_in, NameX, totalFee, Modal, dextype, priceBuyToken_CEX, priceSellPair_CEX, FeeSwap, FeeWD, sc_input, sc_output, Name_out, totalValue, (Modal + totalFee), PNL > 0, PNL > 0, nameChain, codeChain, trx, 0, vol);
}

function handleTokenFormSubmit(e) {
    e.preventDefault();
    const id = $('#multiTokenIndex').val();
    let tokens = getFromLocalStorage('TOKEN_SCANNER', []);
    const isEdit = tokens.some(t => String(t.id) === String(id));
    const readDexSelection = () => {
        const selected = []; const data = {};
        $('#dex-checkbox-koin .dex-edit-checkbox:checked').each(function () {
            const name = $(this).val();
            const safeId = name.toLowerCase().replace(/[^a-z0-9_-]/gi, '');
            const left = parseFloat($(`#dex-${safeId}-left`).val()) || 0;
            const right = parseFloat($(`#dex-${safeId}-right`).val()) || 0;
            selected.push(name);
            data[name] = { left, right };
        });
        return { selectedDexs: selected, dataDexs: data };
    };
    const new_data = {
        id: id || Date.now().toString(),
        symbol_in: $('#inputSymbolToken').val().trim(),
        des_in: Number($('#inputDesToken').val()),
        sc_in: $('#inputSCToken').val().trim(),
        symbol_out: $('#inputSymbolPair').val().trim(),
        des_out: Number($('#inputDesPair').val()),
        sc_out: $('#inputSCPair').val().trim(),
        status: readStatusRadio(),
        chain: $('#FormEditKoinModal #mgrChain').val().toLowerCase(),
        selectedCexs: $('#cex-checkbox-koin input:checked').map((_, el) => $(el).val()).get(),
        ...readDexSelection()
    };
    if (isEdit) {
        tokens = tokens.map(t => String(t.id) === String(id) ? { ...t, ...new_data } : t);
    } else {
        tokens.push(new_data);
    }
    saveToLocalStorage('TOKEN_SCANNER', tokens);
    toastr.success(`Token ${isEdit ? 'diperbarui' : 'ditambahkan'}`);
    refreshTokensTable();
    UIkit.modal('#FormEditKoinModal').hide();
}

function handleTokenDelete() {
    const id = $('#multiTokenIndex').val();
    if (confirm('Anda yakin ingin menghapus token ini?')) {
        let tokens = getFromLocalStorage('TOKEN_SCANNER', []);
        const updatedTokens = tokens.filter(t => String(t.id) !== String(id));
        saveToLocalStorage('TOKEN_SCANNER', updatedTokens);
        toastr.success('Token berhasil dihapus');
        refreshTokensTable();
        UIkit.modal('#FormEditKoinModal').hide();
    }
}

function handleNewTokenClick() {
    const newId = Date.now().toString();
    const blankToken = {
        id: newId, status: true, chain: (Object.keys(CONFIG_CHAINS) || [])[0] || '',
        symbol_in: '', des_in: 18, sc_in: '',
        symbol_out: '', des_out: 18, sc_out: '',
        selectedCexs: [], selectedDexs: [], dataDexs: {}, dataCexs: {}
    };
    openEditModal(blankToken);
}

function handleSettingsClick() {
    UIkit.modal("#modal-setting").show();
    // Logic to populate settings modal needs to be implemented
}

function handleSaveSettings() {
    const settingData = {
        nickname: $('#user').val().trim(),
        jedaTimeGroup: parseInt($('#jeda-time-group').val(), 10),
        jedaKoin: parseInt($('#jeda-koin').val(), 10),
        filterPNL: parseFloat($('#inFilterPNL').val()),
        walletMeta: $('#walletMeta').val().trim(),
        scanPerKoin: parseInt($('input[name="koin-group"]:checked').val(), 10),
        speedScan: parseFloat($('input[name="waktu-tunggu"]:checked').val()),
        JedaCexs: {}, JedaDexs: {}, AllChains: [], FilterCEXs: []
    };
    saveToLocalStorage('SETTING_SCANNER', settingData);
    alert("✅ SETTING SCANNER BERHASIL");
    location.reload();
}

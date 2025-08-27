// =================================================================================
// MAIN APPLICATION LOGIC AND EVENT LISTENERS
// =================================================================================

// --- Global Variables ---
const storagePrefix = "MULTISCANNER_";
const REQUIRED_KEYS = {
    SETTINGS: 'SETTING_SCANNER',
    TOKENS: 'TOKEN_SCANNER'
};

let sortOrder = {};
let filteredTokens = [];
let originalTokens = [];
var SavedSettingData = getFromLocalStorage('SETTING_SCANNER', {});
var DataTokens = getFromLocalStorage('TOKEN_SCANNER',[]);

// --- Application Initialization ---

/**
 * Checks if essential settings and token data are present in localStorage.
 * @returns {string} The readiness state of the application.
 */
function computeAppReadiness() {
    const okS = hasValidSettings();
    const okT = hasValidTokens();
    if (okS && okT) return 'READY';
    if (!okS && !okT) return 'MISSING_BOTH';
    return okS ? 'MISSING_TOKENS' : 'MISSING_SETTINGS';
}

/**
 * Checks if settings are valid.
 * @returns {boolean}
 */
function hasValidSettings() {
    const s = getFromLocalStorage(REQUIRED_KEYS.SETTINGS, {});
    return s && typeof s === 'object' && Object.keys(s).length > 0 && Array.isArray(s.AllChains) && s.AllChains.length > 0;
}

/**
 * Checks if token data is valid.
 * @returns {boolean}
 */
function hasValidTokens() {
    const t = getFromLocalStorage(REQUIRED_KEYS.TOKENS, []);
    return Array.isArray(t) && t.length > 0;
}

/**
 * Initializes the application on DOM content load.
 * Sets up controls based on readiness state.
 */
function bootApp() {
    const state = computeAppReadiness();
    applyControlsFor(state);
    if (state === 'READY') {
        try { cekDataAwal(); } catch (e) { console.error('cekDataAwal error:', e); }
    } else {
        if (window.toastr) {
            if (state === 'MISSING_SETTINGS') toastr.warning('Lengkapi SETTING terlebih dahulu');
            else if (state === 'MISSING_TOKENS') toastr.warning('Import DATA TOKEN terlebih dahulu');
            else toastr.warning('Lengkapi SETTING & TOKEN');
        }
    }
}

/**
 * Performs the initial data check and renders the UI.
 */
function cekDataAwal() {
  let info = true;
  let errorMessages = [];

  let DataTokens = getFromLocalStorage('TOKEN_SCANNER', []);
  let SavedSettingData = getFromLocalStorage('SETTING_SCANNER', {});

  if (!Array.isArray(DataTokens) || DataTokens.length === 0) {
    errorMessages.push("❌ Tidak ada data token yang tersedia.");
    toastr.error("Tidak ada data token yang tersedia");
    if(typeof scanner_form_off !== 'undefined') scanner_form_off();
    info = false;
  }

  if (!SavedSettingData || Object.keys(SavedSettingData).length === 0) {
    errorMessages.push("⚠️ Cek SETTINGAN aplikasi {USERNAME, WALLET ADDRESS, JEDA}!");
    $("#SettingConfig").addClass("icon-wrapper");
    form_off();
    info = false;
  }

  if (info) {
    console.info('⏳ Memulai proses Memuat DATA KOIN');
    console.time('⏱️ Waktu eksekusi Memuat DATA KOIN');

    const allowedChains = (SavedSettingData.AllChains || []).map(c => String(c).toLowerCase());
    const flatTokens = flattenDataKoin(DataTokens);

    const filteredByChain = flatTokens
      .filter(token => allowedChains.includes(String(token.chain || '').toLowerCase()))
      .sort((a, b) => {
        const A = (a.symbol_in || '').toUpperCase();
        const B = (b.symbol_in || '').toUpperCase();
        return A < B ? -1 : A > B ? 1 : 0;
      });

    console.timeEnd('⏱️ Waktu eksekusi Memuat DATA KOIN');
    console.info('✅ Proses Memuat DATA KOIN selesai.');

    generateInputCheckbox(CONFIG_CHAINS, "chain-options", "C", "CHAIN : &nbsp;", "uk-form-label uk-text-primary", 'chain');
    generateInputCheckbox(CONFIG_CEX,    "cex-filter",   "X", "CEX : &nbsp;",   "uk-form-label uk-text-primary", 'cex');

    try { refreshTokensTable(); } catch (e) { console.error(e); }
  }

  const managedChains = getManagedChains?.() || [];
  if (managedChains.length > 0) {
    const chainParam = encodeURIComponent(managedChains.join(','));
    const link = $('a[href="index.html"]');
    if (link.length > 0) {
      let href = link.attr('href') || '';
      href = href.split('?')[0] || 'index.html';
      link.attr('href', `${href}?chains=${chainParam}`);
    }
  }

  if (!info) {
    $("#infoAPP").show().html(errorMessages.join("<br/>"));
  }

  const dataACTION = getFromLocalStorage('HISTORY');
  if (dataACTION && dataACTION.time) {
    $("#infoAPP").show().text(`${dataACTION.action} at ${dataACTION.time}`);
  }
}

/**
 * Refreshes the main token table from localStorage data.
 */
function refreshTokensTable() {
    const settingScanner = getFromLocalStorage('SETTING_SCANNER', {});
    const allowedChains = (settingScanner.AllChains || []).map(c => c.toLowerCase());
    const allTokens = getFromLocalStorage("TOKEN_SCANNER", []);
    const flatTokens = flattenDataKoin(allTokens);

    const filteredByChain = flatTokens
        .filter(token =>
            allowedChains.includes((token.chain || '').toLowerCase())
        )
        .sort((a, b) => {
            const A = (a.symbol_in || '').toUpperCase();
            const B = (b.symbol_in || '').toUpperCase();
            if (A < B) return -1;
            if (A > B) return  1;
            return 0;
        });

    filteredTokens = [...filteredByChain];
    originalTokens = [...filteredByChain];

    updateTokenCount();
    loadKointoTable(filteredTokens);
}

// --- Main Execution ---

$(document).ready(function() {
    // Initialize app state from localStorage
    const config = getFromLocalStorage('STATUS_RUN', {});
    if (config.run === "YES") {
        $('#startSCAN').prop('disabled', true).text('Running...');
        $('#stopSCAN').show();
        $('#infoAPP').html('⚠️ Proses sebelumnya tidak selesai. Tekan tombol <b>RESET PROSES</b> untuk memulai ulang.').show();
    } else {
        $('#startSCAN').prop('disabled', false).text('Start');
        $('#stopSCAN').hide();
    }

    const isDark = getFromLocalStorage("DARK_MODE", false);
    if (isDark) {
        $('body').addClass('dark-mode uk-dark').removeClass('uk-light');
    } else {
        $('body').removeClass('dark-mode uk-dark');
    }

    $('title').text("MULTISCANNER");
    $('#namachain').text("MULTISCANNER");
    $('#sinyal-container').css('color',"black");
    $('h4#daftar,h4#judulmanajemenkoin').css({ 'color': 'white', 'background': `linear-gradient(to right, #5c9513, #ffffff)`, 'padding-left': '7px','border-radius': '5px' });

    bootApp();
    updateDarkIcon(isDark);

    // --- Event Listeners ---

    window.addEventListener('storage', function (event) {
        if (event.key !== 'MULTISCANNER_STATUS_RUN') return;
        const config = JSON.parse(event.newValue || '{}');
        const $start = $('#startSCAN');
        const $stop  = $('#stopSCAN');

        if (config.run === 'NO') {
            $start.prop('disabled', false).text('START').show();
            $stop.hide();
        } else if (config.run === 'YES') {
            $start.prop('disabled', true).text('Running...').show();
            $stop.prop('disabled', false).show();
        }
    });

    $('#darkModeToggle').on('click', function() {
        const body = $('body');
        body.toggleClass('dark-mode uk-dark');
        const isDark = body.hasClass('dark-mode');
        saveToLocalStorage('DARK_MODE', isDark);
        updateDarkIcon(isDark);
    });

    $('.sort-toggle').off('click').on('click', function () {
        $('.sort-toggle').removeClass('active');
        $(this).addClass('active');
        const sortValue = $(this).data('sort');
        const sortedData = [...originalTokens].sort((a, b) => {
            const A = (a.symbol_in || "").toUpperCase();
            const B = (b.symbol_in || "").toUpperCase();
            if (A < B) return sortValue === "opt_A" ? -1 : 1;
            if (A > B) return sortValue === "opt_A" ?  1 : -1;
            return 0;
        });
        window.filteredTokens = sortedData;
        loadKointoTable(window.filteredTokens, false);
    });

    $('#btn-save-setting').on('click', function() {
        const nickname = $('#user').val().trim();
        let filterPNL = parseFloat($('#inFilterPNL').val());
        const jedaTimeGroup = parseInt($('#jeda-time-group').val(), 10);
        const jedaKoin = parseInt($('#jeda-koin').val(), 10);
        const walletMeta = $('#walletMeta').val().trim();
        const scanPerKoin = $('input[name="koin-group"]:checked').val();
        const speedScan = $('input[name="waktu-tunggu"]:checked').val();

        if (!nickname) return UIkit.notification({message: 'Nickname harus diisi!', status: 'danger'});
        if (!jedaTimeGroup || jedaTimeGroup <= 0) return UIkit.notification({message: 'Jeda / Group harus lebih dari 0!', status: 'danger'});
        if (!jedaKoin || jedaKoin <= 0) return UIkit.notification({message: 'Jeda / Koin harus lebih dari 0!', status: 'danger'});
        if (!walletMeta || !walletMeta.startsWith('0x')) return UIkit.notification({message: 'Wallet Address harus valid!', status: 'danger'});

        let JedaCexs = {};
        $('.cex-delay-input').each(function() {
            JedaCexs[$(this).data('cex')] = parseFloat($(this).val()) || 30;
        });

        let JedaDexs = {};
        $('.dex-delay-input').each(function() {
            JedaDexs[$(this).data('dex')] = parseFloat($(this).val()) || 100;
        });

        let api_keys = {};
        $('.cex-api-key-input').each(function() {
            const cex = $(this).data('cex');
            if(!api_keys[cex]) api_keys[cex] = {};
            api_keys[cex].ApiKey = $(this).val().trim();
        });
        $('.cex-api-secret-input').each(function() {
            const cex = $(this).data('cex');
            if(!api_keys[cex]) api_keys[cex] = {};
            api_keys[cex].ApiSecret = $(this).val().trim();
        });

        const settingData = {
            nickname, jedaTimeGroup, jedaKoin, filterPNL, walletMeta,
            scanPerKoin: parseInt(scanPerKoin, 10),
            speedScan: parseFloat(speedScan),
            JedaCexs,
            JedaDexs,
            api_keys, // Save the API keys
            AllChains: Object.keys(CONFIG_CHAINS),
            FilterCEXs: Object.keys(CONFIG_CEX)
        };

        saveToLocalStorage('SETTING_SCANNER', settingData);
        alert("✅ SETTING SCANNER BERHASIL DISIMPAN");
        location.reload();
    });

    UIkit.util.on('#modal-setting', 'show', function () {
        form_on();
    });

    $('#searchInput').on('input', function() {
        const searchValue = $(this).val().toLowerCase();
        $('#dataTableBody tr').filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(searchValue) > -1);
        });
    });

    $('.posisi-check').on('change', function () {
        if ($('.posisi-check:checked').length === 0) {
            $(this).prop('checked', true);
            toastr.error("Minimal salah satu POSISI harus aktif!");
            return;
        }
        const label = $(this).val() === 'Actionkiri' ? 'KIRI' : 'KANAN';
        const status = $(this).is(':checked') ? 'AKTIF' : 'NONAKTIF';
        toastr.info(`POSISI ${label} ${status}`);
    });

    $("#reload").click(function () {
        // Always set run to NO on reload to ensure a clean state
        saveToLocalStorage('STATUS_RUN', { run: "NO" });
        location.reload();
    });

    $("#stopSCAN").click(function () {
        const config = getFromLocalStorage('STATUS_RUN', {});
        if (config.run === "YES") {
            saveToLocalStorage('STATUS_RUN', { run: "NO" });
            clearInterval(window.autorunTimer);
            $('#startSCAN').prop('disabled', false).text('Start');
            alert("✅ SCAN AKAN DIHENTIKAN");
            location.reload();
        } else {
            alert("⚠️ SCAN SUDAH NONAKTIF");
        }
    });

    $("#SettingConfig").on("click", function () {
        UIkit.modal("#modal-setting").show();

        // Generate CEX delay inputs
        const cexList = Object.keys(CONFIG_CEX || {});
        let cexDelayHtml = '<h4>Jeda CEX</h4>';
        cexList.forEach(cex => {
            cexDelayHtml += `<div class="uk-flex uk-flex-middle uk-margin-small-bottom"><label style="min-width:70px;">${cex}</label><input type="number" class="uk-input uk-form-small cex-delay-input" data-cex="${cex}" value="30" style="width:80px; margin-left:8px;" min="0"></div>`;
        });
        $('#cex-delay-group').html(cexDelayHtml);

        // Generate DEX delay inputs
        const dexList = Object.keys(CONFIG_DEXS || {});
        let dexDelayHtml = '<h4>Jeda DEX</h4>';
        dexList.forEach(dex => {
            dexDelayHtml += `<div class="uk-flex uk-flex-middle uk-margin-small-bottom"><label style="min-width:70px;">${dex.toUpperCase()}</label><input type="number" class="uk-input uk-form-small dex-delay-input" data-dex="${dex}" value="100" style="width:80px; margin-left:8px;" min="0"></div>`;
        });
        $('#dex-delay-group').html(dexDelayHtml);

        // Generate CEX API Key inputs
        let cexApiHtml = '';
        cexList.forEach(cex => {
            cexApiHtml += `<div>
                <label class="uk-form-label uk-text-bold">${cex}</label>
                <div class="uk-form-controls uk-margin-small-bottom">
                    <input class="uk-input uk-form-small cex-api-key-input" data-cex="${cex}" type="text" placeholder="API Key">
                </div>
                <div class="uk-form-controls">
                    <input class="uk-input uk-form-small cex-api-secret-input" data-cex="${cex}" type="password" placeholder="API Secret">
                </div>
            </div><hr class="uk-divider-small">`;
        });
        $('#cex-api-keys-group').html(cexApiHtml);


        // Load existing settings
        let appSettings = getFromLocalStorage('SETTING_SCANNER') || {};
        $('#user').val(appSettings.nickname || '');
        $('#jeda-time-group').val(appSettings.jedaTimeGroup || 1500);
        $('#jeda-koin').val(appSettings.jedaKoin || 500);
        $('#walletMeta').val(appSettings.walletMeta || '');
        $('#inFilterPNL').val(appSettings.filterPNL || 1);
        $(`input[name="koin-group"][value="${appSettings.scanPerKoin || 5}"]`).prop('checked', true);
        $(`input[name="waktu-tunggu"][value="${appSettings.speedScan || 2}"]`).prop('checked', true);

        const modalCexs = appSettings.JedaCexs || {};
        $('.cex-delay-input').each(function() {
            const cex = $(this).data('cex');
            if (modalCexs[cex] !== undefined) $(this).val(modalCexs[cex]);
        });

        const modalDexs = appSettings.JedaDexs || {};
        $('.dex-delay-input').each(function() {
            const dex = $(this).data('dex');
            if (modalDexs[dex] !== undefined) $(this).val(modalDexs[dex]);
        });

        const apiKeys = appSettings.api_keys || {};
        $('.cex-api-key-input').each(function() {
            const cex = $(this).data('cex');
            if (apiKeys[cex]?.ApiKey) $(this).val(apiKeys[cex].ApiKey);
        });
        $('.cex-api-secret-input').each(function() {
            const cex = $(this).data('cex');
            if (apiKeys[cex]?.ApiSecret) $(this).val(apiKeys[cex].ApiSecret);
        });
    });

    $('#ManajemenKoin').on('click', function(e){
      e.preventDefault();
      $('#scanner-config,#sinyal-container,#header-table').hide();
      $('#dataTableBody').closest('.uk-overflow-auto').hide();
      $('#token-management').show();
      renderTokenManagementList();
    });

    $('#searchMgr').on('input', renderTokenManagementList);

    $('#btnNewToken').on('click', () => {
      const keys = Object.keys(window.CONFIG_CHAINS || {});
      const firstChainWithDex = keys.find(k => {
          const d = CONFIG_CHAINS[k]?.DEXS;
          return Array.isArray(d) ? d.length > 0 : !!(d && Object.keys(d).length);
        }) || keys[0] || '';

      const empty = { id: Date.now().toString(), chain: String(firstChainWithDex).toLowerCase(), status: true, selectedCexs: [], selectedDexs: [], dataDexs: {}, dataCexs: {} };

      $('#multiTokenIndex').val(empty.id);
      $('#inputSymbolToken, #inputSCToken, #inputSymbolPair, #inputSCPair').val('');
      $('#inputDesToken, #inputDesPair').val('');
      setStatusRadios(true);

      const $sel = $('#FormEditKoinModal #mgrChain');
      populateChainSelect($sel, empty.chain);

      const currentChain = String($sel.val() || empty.chain).toLowerCase();
      const baseToken = { ...empty, chain: currentChain };

      buildCexCheckboxForKoin(baseToken);
      buildDexCheckboxForKoin(baseToken);

      $sel.off('change.rebuildDexAdd').on('change.rebuildDexAdd', function () {
        const newChain = String($(this).val() || '').toLowerCase();
        buildDexCheckboxForKoin({ ...baseToken, chain: newChain });
      });

      if (window.UIkit?.modal) UIkit.modal('#FormEditKoinModal').show();
    });

    $('#UpdateWalletCEX').on('click', () => {
        if (confirm("APAKAH ANDA INGIN UPDATE WALLET EXCHANGER?")) {
            checkAllCEXWallets();
        }
    });

    $("#startSCAN").click(function () {
        const ConfigScan = getFromLocalStorage('SETTING_SCANNER', {}) || {};
        let allowedChains = Array.isArray(ConfigScan.AllChains) && ConfigScan.AllChains.length
            ? ConfigScan.AllChains.map(c => String(c).toLowerCase())
            : (typeof getManagedChains === 'function' ? getManagedChains() : Object.keys(CONFIG_CHAINS || {}));

        if (!allowedChains || !allowedChains.length) {
            toastr.warning('Tidak ada Chain yang dipilih. Silakan pilih minimal 1 Chain.');
            return;
        }

        window.SavedSettingData = ConfigScan;
        window.CURRENT_CHAINS = allowedChains;

        let flatTokens;
        if (Array.isArray(window.filteredTokens) && window.filteredTokens.length) {
            flatTokens = window.filteredTokens.filter(t =>
                allowedChains.includes(String(t.chain).toLowerCase())
            );
        } else {
            const allTokens = getFromLocalStorage("TOKEN_SCANNER", []);
            flatTokens = flattenDataKoin(allTokens)
                .filter(token => allowedChains.includes((token.chain || '').toLowerCase()))
                .sort((a, b) => (a.symbol_in || '').localeCompare(b.symbol_in || '', 'en', { sensitivity: 'base' }));
            refreshTokensTable();
        }

        if (!flatTokens || flatTokens.length === 0) {
            toastr.info('Tidak ada token pada chain terpilih.');
            return;
        }

        saveToLocalStorage('STATUS_RUN', { run: 'YES' });
        $('#startSCAN').prop('disabled', true).text('Running...');
        $('#searchInput').val('');
        $('#sinyal-container span[id^="sinyal"]').empty();
        form_off();
        $("#autoScrollCheckbox").show().prop('disabled', false);
        $("#stopSCAN").show().prop('disabled', false);
        $('#LoadDataBtn, #SettingModal, #MasterData,#UpdateWalletCEX, #chain-links-container,.sort-toggle').css({'pointer-events': 'none', 'opacity': '0.4'});
        $('[id^="EditMulti-"]').css({'pointer-events':'none','opacity':'0.4'}).attr('aria-disabled','true');
        $('.statusCheckbox').css({ 'pointer-events': 'auto', 'opacity': '1' }).prop('disabled', false);

        sendStatusTELE(ConfigScan.nickname, 'ONLINE');

        let scanPerKoin   = parseInt(ConfigScan.scanPerKoin || 1);
        let jedaKoin      = parseInt(ConfigScan.jedaKoin || 500);
        let jedaTimeGroup = parseInt(ConfigScan.jedaTimeGroup || 1000);
        let speedScan = parseInt(getFromLocalStorage('SavedSettingData.speedScan', 500)) * 1000;

        const jedaDexMap = (window.SavedSettingData || getFromLocalStorage('SETTING_SCANNER', {}) || {}).JedaDexs || {};
        const getJedaDex = (dx) => parseInt(jedaDexMap[dx]) || 0;

        function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
        const isPosChecked = (val) => $('input[type="checkbox"][value="'+val+'"]').is(':checked');

        function updateProgress(current, total, startTime, TokenPair) {
            let duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
            let progressPercentage = Math.floor((current / total) * 100);
            let progressText = `CHECKING - ${TokenPair} [${current}/${total}] :: Mulai: ${new Date(startTime).toLocaleTimeString()} ~ DURASI [${duration} Menit]`;
            $('#progress-bar').css('width', progressPercentage + '%');
            $('#progress-text').text(progressPercentage + '%');
            $('#progress').text(progressText);
        }

        async function processRequest(token) {
            if (!allowedChains.includes(String(token.chain).toLowerCase())) return;

            try {
                await new Promise((resolve, reject) => {
                    let timeout = setTimeout(() => reject('Timeout'), speedScan);

                    getPriceCEX(token, token.symbol_in, token.symbol_out, token.cex, (error, DataCEX) => {
                        clearTimeout(timeout);
                        if (error || !DataCEX) {
                            toastr.error(`Cek ulang harga ${token.symbol_in}/${token.symbol_out} di ${token.cex}`);
                            resolve();
                            return;
                        }

                        const prices = [DataCEX.priceBuyToken, DataCEX.priceSellToken, DataCEX.priceBuyPair, DataCEX.priceSellPair];
                        if (prices.some(p => !isFinite(p) || p <= 0)) {
                            toastr.error(`CEK MANUAL ${token.symbol_in} di ${token.cex}`);
                            resolve();
                            return;
                        }

                        if (token.dexs && Array.isArray(token.dexs)) {
                            token.dexs.forEach((dexData) => {
                                const dex = dexData.dex.toLowerCase();
                                const modalKiri = dexData.left;
                                const modalKanan = dexData.right;
                                const amount_in_token = parseFloat(modalKiri) / DataCEX.priceBuyToken;
                                const amount_in_pair = parseFloat(modalKanan) / DataCEX.priceBuyPair;

                                const callDex = (direction) => {
                                    const isKiri = direction === 'TokentoPair';
                                    if(isKiri && !isPosChecked('Actionkiri')) return;
                                    if(!isKiri && !isPosChecked('ActionKanan')) return;

                                    const idCELL = `${token.cex.toUpperCase()}_${dex.toUpperCase()}_${isKiri ? token.symbol_in : token.symbol_out}_${isKiri ? token.symbol_out : token.symbol_in}_${token.chain.toUpperCase()}`;

                                    setTimeout(() => {
                                        getPriceDEX(
                                            isKiri ? token.sc_in : token.sc_out,
                                            isKiri ? token.des_in : token.des_out,
                                            isKiri ? token.sc_out : token.sc_in,
                                            isKiri ? token.des_out : token.des_in,
                                            isKiri ? amount_in_token : amount_in_pair,
                                            DataCEX.priceBuyPair, dex,
                                            isKiri ? token.symbol_in : token.symbol_out,
                                            isKiri ? token.symbol_out : token.symbol_in,
                                            token.cex, token.chain, CONFIG_CHAINS[token.chain.toLowerCase()].Kode_Chain,
                                            direction,
                                            (err, dexRes) => {
                                                if (err || !dexRes) {
                                                    console.error(`Error fetching from DEX ${dex} for ${direction}:`, err);
                                                    toastr.error(`Gagal ambil data dari ${dex.toUpperCase()}`);
                                                    $(`#SWAP_${idCELL}`).html(`<span class="uk-text-danger" title="${err?.pesanDEX || 'Unknown Error'}">[ERROR]</span>`);
                                                    return;
                                                }
                                                ResultEksekusi(
                                                    dexRes.amount_out, dexRes.FeeSwap,
                                                    isKiri ? token.sc_in : token.sc_out,
                                                    isKiri ? token.sc_out : token.sc_in,
                                                    token.cex, isKiri ? modalKiri : modalKanan,
                                                    isKiri ? amount_in_token : amount_in_pair,
                                                    DataCEX.priceBuyToken, DataCEX.priceSellToken,
                                                    DataCEX.priceBuyPair, DataCEX.priceSellPair,
                                                    isKiri ? token.symbol_in : token.symbol_out,
                                                    isKiri ? token.symbol_out : token.symbol_in,
                                                    isKiri ? DataCEX.feeWDToken : DataCEX.feeWDPair,
                                                    dex, token.chain, CONFIG_CHAINS[token.chain.toLowerCase()].Kode_Chain,
                                                    direction, 0, dexRes
                                                );
                                            }
                                        );
                                    }, getJedaDex(dex));
                                };
                                callDex('TokentoPair');
                                callDex('PairtoToken');
                            });
                        }
                        resolve();
                    });
                });
                await delay(jedaKoin);
            } catch (error) {
                console.error(`Kesalahan saat memproses ${token.symbol_in}_${token.symbol_out}:`, error);
            }
        }

        async function processTokens() {
            let startTime = Date.now();
            let tokenGroups = [];
            for (let i = 0; i < flatTokens.length; i += scanPerKoin) {
                tokenGroups.push(flatTokens.slice(i, i + scanPerKoin));
            }

            for (let groupIndex = 0; groupIndex < tokenGroups.length; groupIndex++) {
                let groupTokens = tokenGroups[groupIndex];

                if ($('#autoScrollCheckbox').is(':checked')) {
                    const first = groupTokens[0];
                    const rowId = `DETAIL_${first.cex.toUpperCase()}_${first.symbol_in.toUpperCase()}_${first.symbol_out.toUpperCase()}_${first.chain.toUpperCase()}`.replace(/[^A-Z0-9_]/g,'');
                    const target = document.getElementById(rowId);
                    if(target) target.scrollIntoView({ behavior:'smooth', block:'center' });
                }

                await Promise.all(groupTokens.map(processRequest));

                updateProgress((groupIndex + 1) * scanPerKoin, flatTokens.length, startTime, 'GROUP');
                await delay(jedaTimeGroup);
            }

            updateProgress(flatTokens.length, flatTokens.length, startTime, 'SELESAI');
            form_on();
            $("#stopSCAN").hide().prop("disabled", false);
            saveToLocalStorage('STATUS_RUN', { run: 'NO' });
            $('#startSCAN').prop('disabled', false).text('Start');
            $("#LoadDataBtn, #SettingModal, #MasterData,#UpdateWalletCEX,#chain-links-container,.sort-toggle").css("pointer-events", "auto").css("opacity", "1");
            $('[id^="EditMulti-"]').css({'pointer-events':'auto','opacity':'1'}).removeAttr('aria-disabled');
        }

        processTokens();
    });

    // Token Management Form Handlers
    $(document).on('submit', '#multiTokenForm', function (e) {
        e.preventDefault();
        const id = $('#multiTokenIndex').val();
        if (!id) return toastr.error('ID token tidak ditemukan.');

        const updatedToken = {
            id,
            symbol_in: ($('#inputSymbolToken').val() || '').trim(),
            des_in: Number($('#inputDesToken').val() || 0),
            sc_in: ($('#inputSCToken').val() || '').trim(),
            symbol_out: ($('#inputSymbolPair').val() || '').trim(),
            des_out: Number($('#inputDesPair').val() || 0),
            sc_out: ($('#inputSCPair').val() || '').trim(),
            chain: String($('#FormEditKoinModal #mgrChain').val() || '').toLowerCase(),
            status: readStatusRadio(),
            ...readCexSelectionFromForm(),
            ...readDexSelectionFromForm()
        };

        if (!updatedToken.symbol_in || !updatedToken.symbol_out) return toastr.warning('Symbol Token & Pair tidak boleh kosong');
        if (updatedToken.selectedDexs.length > 4) return toastr.warning('Maksimal 4 DEX yang dipilih');

        let tokens = getFromLocalStorage('TOKEN_SCANNER', []);
        const idx = tokens.findIndex(t => String(t.id) === String(id));

        const buildDataCexs = (prev = {}) => {
            const obj = {};
            (updatedToken.selectedCexs || []).forEach(cx => {
                const up = String(cx).toUpperCase();
                obj[up] = prev[up] || { feeWDToken: 0, feeWDPair: 0, depositToken: false, withdrawToken: false, depositPair: false, withdrawPair: false };
            });
            return obj;
        };
        updatedToken.dataCexs = buildDataCexs(idx !== -1 ? tokens[idx].dataCexs : {});

        if (idx !== -1) {
            tokens[idx] = { ...tokens[idx], ...updatedToken };
        } else {
            tokens.push(updatedToken);
        }

        saveToLocalStorage('TOKEN_SCANNER', tokens);
        toastr.success(idx !== -1 ? 'Perubahan token berhasil disimpan' : 'Token baru berhasil ditambahkan');
        refreshTokensTable();
        setLastAction(idx !== -1 ? "UBAH DATA KOIN" : "TAMBAH DATA KOIN");
        if (window.UIkit?.modal) UIkit.modal('#FormEditKoinModal').hide();
    });

    $(document).on('click', '#HapusEditkoin', function (e) {
        e.preventDefault();
        const id = $('#multiTokenIndex').val();
        if (!id) return toastr.error('ID token tidak ditemukan.');
        if (confirm(`⚠️ INGIN HAPUS DATA KOIN INI?`)) {
            deleteTokenById(id);
            toastr.success(`KOIN TERHAPUS`);
            if (window.UIkit?.modal) UIkit.modal('#FormEditKoinModal').hide();
        }
    });

    $(document).on('click', '[id^="EditMulti-"]', function () {
        try {
            openEditModalById($(this).data('id'));
        } catch (e) {
            console.error('Gagal membuka modal edit:', e);
            toastr.error('Gagal membuka form edit');
        }
    });

    $(document).on('change', '.mgrStatus', function(){
        const id = String($(this).data('id'));
        const val = $(this).val() === 'true';
        let tokens = getFromLocalStorage('TOKEN_SCANNER', []);
        const idx = tokens.findIndex(t => String(t.id) === id);
        if (idx !== -1) {
            tokens[idx].status = val;
            saveToLocalStorage('TOKEN_SCANNER', tokens);
            toastr.success(`Status diubah ke ${val ? 'ACTIVE' : 'INACTIVE'}`);
        }
    });
});

function readCexSelectionFromForm() {
    const selectedCexs = [];
    $('#cex-checkbox-koin input[type="checkbox"]:checked').each(function () {
        selectedCexs.push(String($(this).val()).toUpperCase());
    });
    return { selectedCexs };
}

function readDexSelectionFromForm() {
    const selectedDexs = [];
    const dataDexs = {};
    $('#dex-checkbox-koin .dex-edit-checkbox:checked').each(function () {
        const dexName = String($(this).val());
        const dexKeyLower = dexName.toLowerCase().replace(/[^a-z0-9_-]/gi, '');
        const leftVal  = parseFloat($(`#dex-${dexKeyLower}-left`).val());
        const rightVal = parseFloat($(`#dex-${dexKeyLower}-right`).val());
        selectedDexs.push(dexName);
        dataDexs[dexName] = { left: isNaN(leftVal) ? 0 : leftVal, right: isNaN(rightVal) ? 0 : rightVal };
    });
    return { selectedDexs, dataDexs };
}

function deleteTokenById(tokenId) {
    let tokens = getFromLocalStorage('TOKEN_SCANNER', []);
    const updated = tokens.filter(t => String(t.id) !== String(tokenId));
    saveToLocalStorage('TOKEN_SCANNER', updated);
    refreshTokensTable();
    renderTokenManagementList();
    setLastAction("HAPUS KOIN");
}

function setLastAction(action) {
    const formattedTime = new Date().toLocaleString('id-ID', { hour12: false });
    const lastAction = { time: formattedTime, action: action };
    saveToLocalStorage("HISTORY", lastAction);
    $("#infoAPP").html(`${lastAction.action} at ${lastAction.time}`);
}

function getManagedChains() {
    const settings = getFromLocalStorage('SETTING_SCANNER', {});
    return settings.AllChains || Object.keys(CONFIG_CHAINS);
}

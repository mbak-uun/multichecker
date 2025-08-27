// =================================================================================
// UI AND DOM MANIPULATION FUNCTIONS
// =================================================================================

/**
 * Enables or disables form controls based on the application's readiness state.
 * @param {string} state - The current state ('READY', 'MISSING_SETTINGS', etc.).
 */
function applyControlsFor(state) {
    const $form   = $("#FormScanner");
    const $start  = $('#startSCAN');
    const $stop   = $('#stopSCAN');
    const $import = $('#uploadJSON');
    const $export = $('a[onclick="downloadTokenScannerCSV()"]');

    function setDisabled($els, disabled) {
        $els.prop('disabled', disabled)
            .css('opacity', disabled ? '0.5' : '')
            .css('pointer-events', disabled ? 'none' : '');
    }

    // lock everything by default
    setDisabled($form.find('input, select, button'), true);
    setDisabled($start.add($stop).add($export).add($import), true);

    if (state === 'READY') {
        setDisabled($form.find('input, select, button'), false);
        setDisabled($start.add($stop).add($export).add($import), false);
    } else if (state === 'MISSING_SETTINGS') {
        $('#infoAPP').html('⚠️ Lengkapi <b>SETTING</b> terlebih dahulu.').show();
        $('#SettingConfig').addClass('icon-wrapper');
    } else if (state === 'MISSING_TOKENS') {
        setDisabled($import, false);
        $('#infoAPP').html('⚠️ Import <b>DATA TOKEN</b> terlebih dahulu.').show();
    } else {
        $('#infoAPP').html('⚠️ Lengkapi <b>SETTING</b> & <b>DATA KOIN</b> terlebih dahulu.').show();
        $('#SettingConfig').addClass('icon-wrapper');
    }
}

/**
 * Renders the main token data table.
 * @param {Array} filteredData - The array of token data to render.
 */
function loadKointoTable(filteredData) {
    loadSignalData();
    const $tableBody = $('#dataTableBody');
    $tableBody.empty();

    if (!Array.isArray(filteredData) || filteredData.length === 0) {
        $('#startSCAN').prop('disabled', true);
        return;
    }

    const fragment = document.createDocumentFragment();
    const maxSlots = 4;

    filteredData.forEach((data, index) => {
        const row = document.createElement('tr');

        /** ========== ORDERBOOK kiri (CEX) ========== **/
        const tdOrderbookLeft = document.createElement('td');
        const warnaCex = (CONFIG_CEX[data.cex] && CONFIG_CEX[data.cex].WARNA) || '#000';
        tdOrderbookLeft.style.color = warnaCex;
        tdOrderbookLeft.style.textAlign = 'center';
        tdOrderbookLeft.style.verticalAlign = 'middle';
        tdOrderbookLeft.innerHTML = `
                <span id="LEFT_${data.cex}_${data.symbol_in}_${data.symbol_out}_${data.chain.toUpperCase()}">
                    <b>PRICE & VOL BUY <br>${data.cex}</b> 🔒
                </span>
            `;
        row.appendChild(tdOrderbookLeft);

    /** ========== CEX → DEX (Kiri) ========== **/
        for (let i = 0; i < maxSlots; i++) {
            const td = document.createElement('td');
            td.style.textAlign = 'center';
            td.style.verticalAlign = 'middle';
            if (data.dexs && data.dexs[i]) {
                const dexName = data.dexs[i].dex || '-';
                const modalLeft = data.dexs[i].left ?? 0;
                const idCELL = `${data.cex.toUpperCase()}_${dexName.toUpperCase()}_${data.symbol_in}_${data.symbol_out}_${(data.chain).toUpperCase()}`;
                td.id=idCELL;

               let innerHTML = `
                    <strong class="uk-align-center" style="display:inline-block; margin:0;">${dexName.toUpperCase()} [$${modalLeft}]</strong><br>
                    <span class="buy" id="BUY_${idCELL}" title="BUY_${idCELL}"></span><br>
                    <span class="uk-text-primary uk-text-bolder" id="SWAP_${idCELL}"> 🔒 </span><br>
                    <span class="sell" id="SELL_${idCELL}" title="SELL_${idCELL}"></span><br>
                    <hr class="uk-divider-small uk-margin-remove">
                    <span class="uk-text-primary" id="RESULT_${idCELL}"></span>
                `;

                td.innerHTML = innerHTML;
            } else {
                td.style.backgroundColor="#b2aeae";
                td.textContent = '-';
            }
            row.appendChild(td);
        }

        /** ========== DETAIL INFO ========== **/
        const chainLower = data.chain?.toLowerCase();
        const chainConfig = CONFIG_CHAINS[chainLower] || { URL_Chain: '', WARNA: '#000', Kode_Chain: '', Nama_Chain: '' };
        const warnaChain = chainConfig.WARNA || '#000';
        const urlScIn = chainConfig.URL_Chain ? `${chainConfig.URL_Chain}/token/${data.sc_in}` : '#';
        const urlScOut = chainConfig.URL_Chain ? `${chainConfig.URL_Chain}/token/${data.sc_out}` : '#';
        const urlsCEX = GeturlExchanger(data.cex, data.symbol_in, data.symbol_out);

        const tradeTokenUrl = safeUrl(urlsCEX?.tradeToken, urlScIn);
        const tradePairUrl  = safeUrl(urlsCEX?.tradePair,  urlScOut);
        const withdrawTokenUrl = safeUrl(urlsCEX?.withdrawTokenUrl || urlsCEX?.withdrawUrl, urlScIn);
        const depositTokenUrl  = safeUrl(urlsCEX?.depositTokenUrl  || urlsCEX?.depositUrl,  urlScIn);
        const withdrawPairUrl  = safeUrl(urlsCEX?.withdrawPairUrl  || urlsCEX?.withdrawUrl, urlScOut);
        const depositPairUrl   = safeUrl(urlsCEX?.depositPairUrl   || urlsCEX?.depositUrl,  urlScOut);

        const linkToken = createHoverLink(tradeTokenUrl, (data.symbol_in||'').toUpperCase());
        const linkPair  = createHoverLink(tradePairUrl,  (data.symbol_out||'').toUpperCase());

        const WD_TOKEN = linkifyStatus(data.withdrawToken, 'WD', withdrawTokenUrl);
        const DP_TOKEN = linkifyStatus(data.depositToken,  'DP', depositTokenUrl);
        const WD_PAIR  = linkifyStatus(data.withdrawPair,  'WD', withdrawPairUrl);
        const DP_PAIR  = linkifyStatus(data.depositPair,   'DP', depositPairUrl);

        const chainData = getChainData(data.chain);
        const walletObj = chainData?.CEXCHAIN?.[data.cex] || {};
        const linkStokToken = Object.entries(walletObj)
            .filter(([key, val]) => key.toLowerCase().includes('address') && val && val !== '#')
            .map(([key, val], idx) => createHoverLink(`${chainConfig.URL_Chain}/token/${data.sc_in}?a=${val}`, `#${idx + 1} `))
            .join('');
        const linkStokPair = Object.entries(walletObj)
            .filter(([key, val]) => key.toLowerCase().includes('address') && val && val !== '#')
            .map(([key, val], idx) => createHoverLink(`${chainConfig.URL_Chain}/token/${data.sc_out}?a=${val}`, `#${idx + 1} `))
            .join('');

        const linkSCtoken = createHoverLink(urlScIn, '[SC]', 'uk-text-primary');
        const linkSCpair = createHoverLink(urlScOut, '[SC]', 'uk-text-primary');

        const linkOKDEX = createHoverLink(`https://www.okx.com/web3/dex-swap?inputChain=${chainConfig.Kode_Chain}&inputCurrency=${data.sc_in}&outputChain=501&outputCurrency=${data.sc_out}`, '#OKX', 'uk-text-secondary');
        const linkUNIDEX = createHoverLink(`https://app.unidex.exchange/?chain=${chainConfig.Nama_Chain}&from=${data.sc_in}&to=${data.sc_out}`, '#UND', 'uk-text-success');
        const linkDEFIL = createHoverLink(`https://swap.defillama.com/?chain=${chainConfig.Nama_Chain}&from=${data.sc_in}&to=${data.sc_out}`, '#DFL', 'uk-text-primary');
        const linkLiFi = createHoverLink(`https://jumper.exchange/?fromChain=${chainConfig.Kode_Chain}&fromToken=${data.sc_in}&toChain=${chainConfig.Kode_Chain}&toToken==${data.sc_out}`, '#LFX', 'uk-text-warning');

        const tdDetail = document.createElement('td');
        const rowId = `DETAIL_${String(data.cex).toUpperCase()}_${String(data.symbol_in).toUpperCase()}_${String(data.symbol_out).toUpperCase()}_${String(data.chain).toUpperCase()}`.replace(/[^A-Z0-9_]/g,'');
        tdDetail.id = rowId;
        tdDetail.className = 'uk-text-center uk-background uk-text-nowrap';
        tdDetail.style.textAlign = 'center';
        tdDetail.style.border='1px solid black';
        const chainShort = (data.chain || '').substring(0,3).toUpperCase();
        tdDetail.innerHTML = `
            [${index + 1}] <span style="color: ${warnaCex}; font-weight:bolder;">${data.cex} </span>
            on <span style="color: ${warnaChain}; font-weight:bolder;">${chainShort} </span><br/>
            <span class="uk-text-secondary uk-text-bolder">${linkToken} VS ${linkPair}</span>
            <span id="EditMulti-${data.id}"
                data-id="${data.id}"
                data-cex="${data.cex}"
                data-coin="${data.symbol_in}"
                title="UBAH DATA KOIN"
                uk-icon="icon: pencil; ratio: 0.6"
                class="uk-text-secondary uk-text-bolder"
                style="cursor:pointer"></span> </br>
            <span class="uk-text-bolder">${WD_TOKEN} ~ ${DP_TOKEN}</span> |
            <span class="uk-text-bolder">${WD_PAIR} ~ ${DP_PAIR}</span><br/>
            <span class="uk-text-primary uk-text-bolder">${(data.symbol_in||'').toUpperCase()} [${data.feeWDToken}]</span> ${linkSCtoken} : ${linkStokToken} <br/>
            <span class="uk-text-primary uk-text-bolder">${(data.symbol_out||'').toUpperCase()} [${data.feeWDPair}]</span> ${linkSCpair} : ${linkStokPair}<br/>
             ${linkUNIDEX} ${linkOKDEX} ${linkDEFIL} ${linkLiFi}
        `;
        row.appendChild(tdDetail);


    /** ========== DEX → CEX (Kanan) ========== **/
        for (let i = 0; i < maxSlots; i++) {
            const td = document.createElement('td');
            td.style.textAlign = 'center';
            td.style.verticalAlign = 'middle';
            if (data.dexs && data.dexs[i]) {
                const dexName = data.dexs[i].dex || '-';
                const modalRight = data.dexs[i].right ?? 0;
                const idCELL = `${data.cex}_${dexName.toUpperCase()}_${data.symbol_out}_${data.symbol_in}_${data.chain.toUpperCase()}`;
                td.id = idCELL;

               let innerHTML = `
                    <strong class="uk-align-center" style="display:inline-block; margin:0; padding:0;">${dexName.toUpperCase()} [$${modalRight}]</strong><br>
                    <span class="buy" id="BUY_${idCELL}" title="BUY_${idCELL}"> </span><br>
                    <span class="uk-text-primary uk-text-bolder" id="SWAP_${idCELL}"> 🔒 </span><br>
                    <span class="sell" id="SELL_${idCELL}" title="SELL_${idCELL}"> </span><br>
                    <hr class="uk-divider-small uk-margin-remove">
                    <span class="uk-text-primary" id="RESULT_${idCELL}"> </span>
                `;

                td.innerHTML = innerHTML;
            } else {
                td.style.backgroundColor="#b2aeae";
                td.textContent = '-';
            }
            row.appendChild(td);
        }


        /** ========== ORDERBOOK kanan (CEX) ========== **/
        const tdOrderbookRight = document.createElement('td');
        tdOrderbookRight.style.color = warnaCex;
        tdOrderbookRight.style.textAlign = 'center';
        tdOrderbookRight.style.verticalAlign = 'middle';
        tdOrderbookRight.innerHTML = `
                <span id="RIGHT_${data.cex}_${data.symbol_in}_${data.symbol_out}_${data.chain.toUpperCase()}">
                   <b> PRICE & VOL SELL <br>${data.cex}</b> 🔒
                </span>
            `;
        row.appendChild(tdOrderbookRight);

        fragment.appendChild(row);
    });

    $tableBody.append(fragment);
}

/**
 * Updates the token count display in the UI.
 */
function updateTokenCount() {
    $("#tokenCount").text(`(${filteredTokens.length})`);
    const uniqueKeys = new Set();
    filteredTokens.forEach(item => {
        const key = `${item.cex}|${item.chain}|${item.symbol_in}|${item.symbol_out}`;
        uniqueKeys.add(key);
    });
    $('#tokenCountALL').text(`TOTAL SEMUA: ${uniqueKeys.size} PAIR-TOKEN`);
}

/**
 * Toggles the dark mode icon.
 * @param {boolean} isDark - Whether dark mode is active.
 */
function updateDarkIcon(isDark) {
    const icon = document.querySelector('#darkModeToggle');
    if (icon) {
        icon.setAttribute("src", isDark ? "https://cdn-icons-png.flaticon.com/512/112/112213.png" : "https://cdn-icons-png.flaticon.com/512/3751/3751403.png");
    }
}

/**
 * Generates and populates filter checkboxes for chains and CEXs.
 * @param {object} items - The configuration object (CONFIG_CHAINS or CONFIG_CEX).
 * @param {string} containerId - The ID of the container element.
 * @param {string} idPrefix - The prefix for checkbox IDs.
 * @param {string} labelText - The label text for the group.
 * @param {string} style - CSS classes for the label.
 * @param {string} type - 'chain' or 'cex'.
 */
function generateInputCheckbox(items, containerId, idPrefix, labelText, style, type = 'cex') {
  if (type !== 'cex' && type !== 'chain') return;

  const $container = $(`#${containerId}`);
  $container.empty();

  let settingData = getFromLocalStorage('SETTING_SCANNER', {}) || {};
  let selectedChains = Array.isArray(settingData.AllChains)
    ? settingData.AllChains.map(x => String(x).toLowerCase())
    : [];

  $container.append(`<b><span class="uk-text-secondary uk-text-medium">${labelText}</span></b>`);

  const itemsArr = Object.keys(items || {});
  const tokenScanner = getFromLocalStorage('TOKEN_SCANNER', []);
  const tokensArray  = Array.isArray(tokenScanner) ? tokenScanner : [];

  const countByChain = tokensArray
    .filter(t => t && t.status)
    .reduce((acc, t) => {
      const k = String(t.chain || '').toLowerCase();
      if (!k) return acc;
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

  const countByCex = tokensArray
    .filter(t => t && t.status)
    .reduce((acc, t) => {
      const chainLower = String(t.chain || '').toLowerCase();
      if (selectedChains.length && !selectedChains.includes(chainLower)) return acc;
      (t.selectedCexs || []).forEach(cx => {
        const k = String(cx).toUpperCase();
        acc[k] = (acc[k] || 0) + 1;
      });
      return acc;
    }, {});

  const persistedFilterCEX = Array.isArray(settingData.FilterCEXs)
    ? settingData.FilterCEXs.map(x => String(x).toUpperCase())
    : [];

  const hasFilterCEX = persistedFilterCEX.length > 0;

  const wrapper = $('<div style="display:flex; flex-wrap:wrap; gap:10px;"></div>');

  itemsArr.forEach(item => {
    const lower = String(item).toLowerCase();
    const upper = String(item).toUpperCase();

    let color = '#333';
    if (type === 'cex') {
      const cfg = (window.CONFIG_CEX || items || {})[upper];
      if (cfg && cfg.WARNA) color = cfg.WARNA;
    } else {
      const cfg = (window.CONFIG_CHAINS || items || {})[lower];
      if (cfg && cfg.WARNA) color = cfg.WARNA;
    }

    let labelTextShow, tooltipText, isChecked, badgeCount;

    if (type === 'chain') {
      const cd = (window.CONFIG_CHAINS || items || {})[lower];
      labelTextShow = (cd && (cd.Nama_Pendek || cd.SHORT_NAME)) ? (cd.Nama_Pendek || cd.SHORT_NAME) : upper.substring(0,3);
      tooltipText   = (cd && cd.Nama_Chain) ? cd.Nama_Chain : upper;
      isChecked     = selectedChains.includes(lower);
      badgeCount    = countByChain[lower] || 0;
    } else {
      labelTextShow = upper;
      tooltipText   = upper;
      isChecked     = hasFilterCEX ? persistedFilterCEX.includes(upper) : false;
      badgeCount    = countByCex[upper] || 0;
    }

    const checkboxId = `${idPrefix}${upper}`;
    const inlineStyle = `color:${color}; font-weight:bolder; line-height:1; display:inline-block;`;

    const html = `
      <label class="uk-text-small" title="${tooltipText}">
        <input type="checkbox" id="${checkboxId}" class="uk-checkbox ${type}-item" value="${upper}" ${isChecked ? 'checked' : ''}>
        <span style="${inlineStyle}">${String(labelTextShow).toUpperCase()}</span>
        <span>[${badgeCount}]</span>
      </label>
    `;

    wrapper.append(html);
  });

  $container.append(wrapper);

  // Handler perubahan (persist ke localStorage)
  $container.off('change.checkbox').on('change.checkbox', 'input[type="checkbox"]', function(){
    const valUpper = String(this.value).toUpperCase();
    const valLower = String(this.value).toLowerCase();
    let settingData = getFromLocalStorage('SETTING_SCANNER', {});

    if ($(this).hasClass('chain-item')) {
      let chains = Array.isArray(settingData.AllChains) ? settingData.AllChains.map(x => String(x).toLowerCase()) : [];
      if (this.checked) {
        if (!chains.includes(valLower)) chains.push(valLower);
        toastr.info(`CHAIN ${valUpper} DITAMBAH`);
      } else {
        if (chains.length <= 1) {
          toastr.warning('Minimal harus ada 1 chain yang dipilih!');
          this.checked = true;
          return;
        }
        chains = chains.filter(c => c !== valLower);
        toastr.info(`CHAIN ${valUpper} DIHAPUS`);
      }
      settingData.AllChains = chains;
      saveToLocalStorage('SETTING_SCANNER', settingData);
      try {
        generateInputCheckbox(CONFIG_CEX, 'cex-filter', 'X', 'CEX: ', 'uk-form-label uk-text-primary', 'cex');
        refreshTokensTable();
      } catch(_) { location.reload(); }
      return;
    }

    // CEX
    let filter = Array.isArray(settingData.FilterCEXs) ? settingData.FilterCEXs.map(x => String(x).toUpperCase()) : [];
    if (this.checked) {
      if (!filter.includes(valUpper)) filter.push(valUpper);
      toastr.info(`CEX ${valUpper} AKTIF`);
    } else {
      filter = filter.filter(x => x !== valUpper);
      if (filter.length === 0) {
        toastr.warning('Tidak memilih CEX mana pun = SEMUA CEX aktif.');
      } else {
        toastr.info(`CEX ${valUpper} NONAKTIF`);
      }
    }
    settingData.FilterCEXs = Array.from(new Set(filter));
    saveToLocalStorage('SETTING_SCANNER', settingData);
    try { refreshTokensTable(); } catch(_) { location.reload(); }
  });
}

/**
 * Renders the signal display area for each DEX.
 */
function loadSignalData() {
    const dexList = Object.keys(CONFIG_DEXS || {});
    const sinyalContainer = document.getElementById('sinyal-container');
    if (!sinyalContainer) return;

    sinyalContainer.innerHTML = '';
    sinyalContainer.setAttribute('uk-grid', '');
    sinyalContainer.className = 'uk-grid uk-grid-small uk-child-width-expand';

    dexList.forEach((dex, index) => {
        const gridItem = document.createElement('div');
        const card = document.createElement('div');
        card.className = 'uk-card uk-card-default uk-card-hover';
        card.style.cssText = 'border-radius: 5px; overflow: hidden; border: 1px solid black; padding-bottom: 10px; margin-top: 10px;';

        const cardHeader = document.createElement('div');
        cardHeader.className = 'uk-card-header uk-padding-remove-vertical uk-padding-small';
        cardHeader.style.cssText = 'background-color: #e5ebc6; height: 30px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid black;';

        const bodyId = `body-${String(dex).toLowerCase()}-${index}`;
        cardHeader.innerHTML = `
            <div class="uk-flex uk-flex-middle" style="gap:8px;">
                <span class="uk-text-bold" style="color:black !important; font-size:14px;">${String(dex).toUpperCase()}</span>
            </div>
            <a class="uk-icon-link uk-text-danger uk-text-bolder" uk-icon="chevron-up" uk-toggle="target: #${bodyId}"></a>
        `;

        const cardBody = document.createElement('div');
        cardBody.className = 'uk-card-body uk-padding-remove';
        cardBody.id = bodyId;

        const signalSpan = document.createElement('div');
        signalSpan.id = `sinyal${String(dex).toLowerCase()}`;
        signalSpan.style.fontSize = '13.5px';

        cardBody.appendChild(signalSpan);
        card.appendChild(cardHeader);
        card.appendChild(cardBody);
        gridItem.appendChild(card);
        sinyalContainer.appendChild(gridItem);
    });

    UIkit.update(sinyalContainer);
}

/**
 * Updates the CEX order book volume display in the main table.
 * @param {object} finalResult - The result object from getPriceCEX.
 * @param {string} cex - The CEX name.
 */
function updateTableVolCEX(finalResult, cex) {
    const cexName = cex.toUpperCase();
    const TokenPair = finalResult.token + "_" + finalResult.pair;
    const isIndodax = cexName === 'INDODAX';

    const getPriceIDR = priceUSDT => {
        const rateIDR = getFromLocalStorage("PRICE_RATE_USDT", 0);
        return rateIDR ? (priceUSDT * rateIDR).toLocaleString("id-ID", { style: "currency", currency: "IDR" }) : "N/A";
    };

    const volumesBuyToken = isIndodax
        ? finalResult.volumes_buyToken.slice().sort((a, b) => b.price - a.price)
        : finalResult.volumes_buyToken.slice().sort((a, b) => b.price - a.price);

    const volumesSellPair = isIndodax
        ? finalResult.volumes_sellPair
        : finalResult.volumes_sellPair;

    const volumesBuyPair = isIndodax
        ? finalResult.volumes_buyPair.slice().sort((a, b) => b.price - a.price)
        : finalResult.volumes_buyPair.slice().sort((a, b) => b.price - a.price);

    const volumesSellToken = isIndodax
        ? finalResult.volumes_sellToken
        : finalResult.volumes_sellToken.slice().sort((a, b) => b.price - a.price);

    $('#LEFT_' + cexName + '_' + TokenPair + '_' + finalResult.chainName.toUpperCase()).html(
        volumesBuyToken.map(data => `<span class='uk-text-success' title="IDR: ${getPriceIDR(data.price)}">${formatPrice(data.price || 0)} : <b>${data.volume.toFixed(2) || 0}$</b><br/></span>`).join('') +
        `<span class='uk-text-primary uk-text-bolder'>${finalResult.token} -> ${finalResult.pair}</span><br/>` +
        volumesSellPair.map(data => `<span class='uk-text-danger' title="IDR: ${getPriceIDR(data.price)}">${formatPrice(data.price || 0)} : <b>${data.volume.toFixed(2) || 0}$</b><br/></span>`).join('')
    );

    $('#RIGHT_' + cexName + '_' + TokenPair + '_' + finalResult.chainName.toUpperCase()).html(
        volumesBuyPair.map(data => `<span class='uk-text-success' title="IDR: ${getPriceIDR(data.price)}">${formatPrice(data.price || 0)} : <b>${data.volume.toFixed(2) || 0}$</b><br/></span>`).join('') +
        `<span class='uk-text-primary uk-text-bolder'>${finalResult.pair} -> ${finalResult.token}</span><br/>` +
        volumesSellToken.map(data => `<span class='uk-text-danger' title="IDR: ${getPriceIDR(data.price)}">${formatPrice(data.price || 0)} : <b>${data.volume.toFixed(2) || 0}$</b><br/></span>`).join('')
    );
}

/**
 * Displays the final PNL result in the UI.
 */
function DisplayPNL( PNL, cex, Coin_in, NameX, totalFee, modal, dex, priceCEX, priceDEX, FeeSwap, FeeWD, sc_input, sc_output, Coin_out, totalValue, totalModal, conclusion, selisih, nameChain, codeChain, trx, profitLossPercent, vol ) {
    var filterPNLValue = parseFloat(SavedSettingData.filterPNL);
    var nickname = SavedSettingData.nickname;
    var totalValue = parseFloat(totalValue);
    var totalGet = totalValue - parseFloat(modal);
    var totalModal = parseFloat(totalModal);
    var totalFee = parseFloat(totalFee);
    var checkVol = $('#checkVOL').is(':checked');

    const urlsCEXToken = GeturlExchanger(cex.toUpperCase(), Coin_in, Coin_out);
    var buyLink = urlsCEXToken.tradeToken;
    var sellLink = urlsCEXToken.tradePair;

    const chainNameLower = nameChain.toLowerCase();
    const chainConfig = CONFIG_CHAINS[chainNameLower];
    if (!chainConfig) return;

    var IdCELL = `${cex.toUpperCase()}_${dex.toUpperCase()}_${NameX}_${(chainConfig.Nama_Chain).toUpperCase()}`;
    var rowCell = $(`#${IdCELL}`);
    var resultCell = $(`#RESULT_${IdCELL}`);
    var buyCell = $(`#BUY_${IdCELL}`);
    var sellCell = $(`#SELL_${IdCELL}`);

    var sinyals = `<a href="#SWAP_${cex.toUpperCase()}_${dex.toUpperCase()}_${NameX}_${(nameChain).toUpperCase()}" class='link-class'>${cex.toUpperCase()} VS ${dex.toUpperCase()} : ${NameX} (${PNL.toFixed(2)}$)</a>`;

    const isHighlight = (PNL > totalFee) || (PNL > filterPNLValue);

    if (isHighlight) {
        toastr.success(sinyals);
        rowCell.attr("style", "background-color: #94fa95 !important; font-weight: bolder !important; color: black !important; vertical-align: middle !important; text-align: center !important;");

        let htmlFee = '';
        if (trx === "TokentoPair") {
            htmlFee = `<span style="color:#0f04e2 !important;">FeeWD: ${FeeWD.toFixed(2)}$</span> | ${createLink(urlsCEXToken.withdrawUrl, 'WD')}<br/>`;
        } else if (trx === "PairtoToken") {
            htmlFee = `<span style="color:#0f04e2 !important;">FeeWD: ${FeeWD.toFixed(2)}$</span> | ${createLink(urlsCEXToken.depositUrl, 'DP')}<br/>`;
        }
        let htmlResult = `${htmlFee}<span style="color: #d20000;">All: ${totalFee.toFixed(2)}$</span> <span style="color: #1e87f0;">SW: ${FeeSwap.toFixed(2)}$</span><br/><span style="color: #444;">GT: ${totalGet.toFixed(2)}$</span> <span style="color: #444;">PNL: ${PNL.toFixed(2)}$</span><br/>`;
        resultCell.html(htmlResult);

        if (!buyCell.parent().is("a")) buyCell.wrap(`<a href="${buyLink}" target="_blank"></a>`);
        if (!sellCell.parent().is("a")) sellCell.wrap(`<a href="${sellLink}" target="_blank"></a>`);

        InfoSinyal(dex.toLowerCase(), NameX, PNL, totalFee, cex.toUpperCase(), Coin_in, Coin_out, profitLossPercent, modal, nameChain, codeChain, trx);

    } else {
        resultCell.html(`<span style="color:black;" title="FEE WD CEX">FeeWD : ${FeeWD.toFixed(2)}$</span><br/><span class="uk-text-danger" title="FEE ALL">ALL:${totalFee.toFixed(2)}$</span> <span class="uk-text-primary" title="FEE SWAP"> ${FeeSwap.toFixed(2)}$</span><br/><span class="uk-text-success" title="GET BRUTO">GT:${totalGet.toFixed(2)}$</span> <span class="uk-text-warning" title="GET NETTO / PNL" > ${PNL.toFixed(2)}$</span>`);
        if (PNL > totalFee) {
            InfoSinyal(dex.toLowerCase(), NameX, PNL, totalFee, cex.toUpperCase(), Coin_in, Coin_out, profitLossPercent, modal, nameChain, codeChain, trx);
        }
    }

    if (PNL > 0.25) {
        const direction = (trx === 'TokentoPair') ? 'cex_to_dex' : 'dex_to_cex';
        const priceBUY  = (direction === 'cex_to_dex') ? priceCEX : priceDEX;
        const priceSELL = (direction === 'cex_to_dex') ? priceDEX : priceCEX;
        const tokenData = { symbol: Coin_in, pairSymbol: Coin_out, contractAddress: sc_input, pairContractAddress: sc_output, chain: nameChain };
        MultisendMessage(cex, dex.toUpperCase(), tokenData, modal, PNL, priceBUY, priceSELL, FeeSwap, FeeWD, totalFee, nickname, direction);
    }
}

/**
 * Renders a new signal in the top signal container.
 */
function InfoSinyal(DEXPLUS, TokenPair, PNL, totalFee, cex, NameToken, NamePair, profitLossPercent, modal, nameChain, codeChain, trx) {
    const chainData = getChainData(nameChain);
    const chainShort = String(chainData?.SHORT_NAME || chainData?.Nama_Chain || nameChain).toUpperCase();
    const filterPNLValue = parseFloat(SavedSettingData.filterPNL);
    const warnaCEX = getWarnaCEX(cex);
    const warnaTeksArah = (trx === "TokentoPair") ? "uk-text-success" : "uk-text-danger";
    const idCELL = `${cex.toUpperCase()}_${DEXPLUS.toUpperCase()}_${NameToken}_${NamePair}_${String(nameChain).toUpperCase()}`;
    const highlightStyle = (Number(PNL) > filterPNLValue) ? "background-color:#acf9eea6; font-weight:bolder;" : "";

    const sLink = `<div><a href="#${idCELL}" class="buy" style="text-decoration:none; font-size:12px;"><span style="color:${warnaCEX}; display:inline-block; ${highlightStyle}; margin-left:4px; margin-top:6px;">🔸 ${String(cex).slice(0,3).toUpperCase()}X<span class="uk-text-secondary">:${modal}</span> <span class="${warnaTeksArah}"> ${NameToken}->${NamePair}</span> <span class="uk-text-secondary">[${chainShort}]</span>: <span class="uk-text-warning">${Number(PNL).toFixed(2)}$</span></span></a></div>`;

    $("#sinyal" + DEXPLUS.toLowerCase()).append(sLink);

    const audio = new Audio('audio.mp3');
    audio.play();
}

/**
 * Renders the token management list.
 */
function renderTokenManagementList() {
  const $tb = $('#mgrTbody').empty();
  let list = getFromLocalStorage('TOKEN_SCANNER', []) || [];
  if (!Array.isArray(list)) list = [];

  const q = ($('#searchMgr').val() || '').toLowerCase();
  const rows = list
    .filter(t => !q || `${t.symbol_in} ${t.symbol_out} ${t.chain}`.toLowerCase().includes(q))
    .map((t,i)=>({ ...t, no: i+1 }));

  const dexChips = (row) => {
    const names = (row.selectedDexs || []).slice(0,4);
    while (names.length < 4) names.push(null);
    return names.map(name => {
      if (!name) return `<span class="dex-chip dex-empty">-</span>`;
      const k = String(name);
      const l = row?.dataDexs?.[k]?.left  ?? row?.dataDexs?.[k.toLowerCase()]?.left  ?? 0;
      const r = row?.dataDexs?.[k]?.right ?? row?.dataDexs?.[k.toLowerCase()]?.right ?? 0;
      return `<span class="dex-chip"><b>${k.toUpperCase()}</b> [<span class="dex-mini">${l}</span>~<span class="dex-mini">${r}</span>]</span>`;
    }).join(' ');
  };

  rows.forEach(r=>{
    const cexHtml = (r.selectedCexs||[]).map(cx=>{
      const name = String(cx).toUpperCase();
      const col  = (CONFIG_CEX?.[name]?.WARNA) || '#000';
      return `<span class="cex-chip" style="color:${col}">${name}</span>`;
    }).join(' ');

    const chainName = (CONFIG_CHAINS?.[String(r.chain).toLowerCase()]?.Nama_Chain) || r.chain;

    const radioGroup = `<div class="status-group"><label class="uk-text-success"><input class="uk-radio mgrStatus" type="radio" name="status-${r.id}" data-id="${r.id}" value="true" ${r.status ? 'checked':''}> ON</label> <label class="uk-text-danger"><input class="uk-radio mgrStatus" type="radio" name="status-${r.id}" data-id="${r.id}" value="false" ${!r.status ? 'checked':''}> OFF</label></div>`;

    $tb.append(`<tr><td class="uk-text-center">${r.no}</td><td><div><span class="uk-text-bold uk-text-success">${(r.symbol_in||'-').toUpperCase()}</span> <span class="addr">${r.sc_in || ''} [${r.des_in ?? ''}]</span></div><div><span class="uk-text-bold uk-text-danger">${(r.symbol_out||'-').toUpperCase()}</span> <span class="addr">${r.sc_out || ''} [${r.des_out ?? ''}]</span></div></td><td><div class="uk-text-center uk-margin-small-bottom">${String(chainName).toUpperCase()} ${radioGroup}</div></td><td>${cexHtml || '-'}</td><td>${dexChips(r)}</td><td class="actions"><button class="uk-button uk-button-primary uk-button-xxsmall mgrEdit" data-id="${r.id}">Edit</button></td></tr>`);
  });
}

/**
 * Opens and populates the 'Edit Koin' modal.
 * @param {string} id - The ID of the token to edit.
 */
function openEditModalById(id) {
    const tokens = getFromLocalStorage('TOKEN_SCANNER', []);
    const token = (Array.isArray(tokens) ? tokens : []).find(t => String(t.id) === String(id));
    if (!token) {
        toastr.error('Data token tidak ditemukan');
        return;
    }

    $('#multiTokenIndex').val(token.id);
    $('#inputSymbolToken').val(token.symbol_in || '');
    $('#inputDesToken').val(token.des_in ?? '');
    $('#inputSCToken').val(token.sc_in || '');
    $('#inputSymbolPair').val(token.symbol_out || '');
    $('#inputDesPair').val(token.des_out ?? '');
    $('#inputSCPair').val(token.sc_out || '');

    setStatusRadios(!!token.status);

    const $ctx = $('#FormEditKoinModal');
    const $sel = $ctx.find('#mgrChain');
    populateChainSelect($sel, token.chain);

    try { buildCexCheckboxForKoin(token); } catch (e) { console.warn('Build CEX gagal:', e); }
    try { buildDexCheckboxForKoin(token); } catch (e) { console.warn('Build DEX gagal:', e); }

    $sel.off('change.rebuildDex').on('change.rebuildDex', function(){
        const newChain = $(this).val();
        try { buildDexCheckboxForKoin({ ...token, chain: newChain }); } catch (_) {}
    });

    if (window.UIkit && UIkit.modal) {
        UIkit.modal('#FormEditKoinModal').show();
    }
}

/**
 * Populates a <select> element with chain options.
 * @param {jQuery} $select - The jQuery object for the select element.
 * @param {string} selectedKey - The key of the chain to be selected by default.
 */
function populateChainSelect($select, selectedKey) {
  const cfg = window.CONFIG_CHAINS || {};
  const keys = Object.keys(cfg);

  $select.empty();
  if (!keys.length) {
    $select.append('<option value="">-- PILIHAN CHAIN --</option>');
    return;
  }

  keys.sort().forEach(k => {
    const item  = cfg[k] || {};
    const label = (item.Nama_Chain || item.nama_chain || item.name || k).toString().toUpperCase();
    $select.append(`<option value="${k.toLowerCase()}">${label}</option>`);
  });

  const want = String(selectedKey || '').toLowerCase();
  const lowerKeys = keys.map(k => k.toLowerCase());
  $select.val(lowerKeys.includes(want) ? want : lowerKeys[0]);
}

/**
 * Sets the status radio buttons in the edit modal.
 * @param {boolean} isOn - Whether the status is 'ON'.
 */
function setStatusRadios(isOn) {
    $('#mgrStatusOn').prop('checked', !!isOn);
    $('#mgrStatusOff').prop('checked', !isOn);
}

/**
 * Reads the value of the status radio buttons.
 * @returns {boolean} True if 'ON' is selected, false otherwise.
 */
function readStatusRadio() {
    return ($('input[name="mgrStatus"]:checked').val() === 'on');
}

/**
 * Builds CEX selection checkboxes for the edit modal.
 * @param {object} token - The token data object.
 */
function buildCexCheckboxForKoin(token) {
    const container = $('#cex-checkbox-koin');
    container.empty();
    const selected = (token.selectedCexs || []).map(s => String(s).toUpperCase());
    Object.keys(CONFIG_CEX || {}).forEach(cexKey => {
        const upper = String(cexKey).toUpperCase();
        const isChecked = selected.includes(upper);
        const color = (CONFIG_CEX[upper] && CONFIG_CEX[upper].WARNA) || '#000';
        const id = `cex-${upper}`;
        container.append(`<label class="uk-display-block uk-margin-xsmall"><input type="checkbox" class="uk-checkbox" id="${id}" value="${upper}" ${isChecked ? 'checked' : ''}> <span style="color:${color}; font-weight:bold;">${upper}</span></label>`);
    });
}

/**
 * Builds DEX selection checkboxes and capital inputs for the edit modal.
 * @param {object} token - The token data object.
 */
function buildDexCheckboxForKoin(token = {}) {
    const container = $('#dex-checkbox-koin');
    container.empty();
    const chainName = token.chain || '';
    const chainCfg = CONFIG_CHAINS?.[String(chainName).toLowerCase()] || CONFIG_CHAINS?.[chainName] || {};
    const allowedDexs = Array.isArray(chainCfg.DEXS) ? chainCfg.DEXS : Object.keys(chainCfg.DEXS || {});

    if (!allowedDexs.length) {
        container.html('<div class="uk-text-meta">Tidak ada DEX terdefinisi untuk chain ini di CONFIG_CHAINS.</div>');
        return;
    }

    const selectedDexs = (token.selectedDexs || []).map(d => String(d).toLowerCase());
    const dataDexs = token.dataDexs || {};

    allowedDexs.forEach(dexNameRaw => {
        const dexName = String(dexNameRaw);
        const dexKeyLower = dexName.toLowerCase();
        const isChecked = selectedDexs.includes(dexKeyLower) || selectedDexs.includes(dexName);
        const stored = dataDexs[dexName] || dataDexs[dexKeyLower] || {};
        const leftVal  = stored.left  ?? 0;
        const rightVal = stored.right ?? 0;
        const safeId = dexKeyLower.replace(/[^a-z0-9_-]/gi, '');
        container.append(`<div class="uk-flex uk-flex-middle uk-margin-small"><label class="uk-margin-small-right"><input type="checkbox" class="uk-checkbox dex-edit-checkbox" id="dex-${safeId}" value="${dexName}" ${isChecked ? 'checked' : ''}> <b>${dexName.toUpperCase()}</b></label><div class="uk-flex uk-flex-middle" style="gap:6px;"><input type="number" class="uk-input uk-form-xxsmall dex-left" id="dex-${safeId}-left" placeholder="KIRI" value="${leftVal}" style="width:88px;"><input type="number" class="uk-input uk-form-xxsmall dex-right" id="dex-${safeId}-right" placeholder="KANAN" value="${rightVal}" style="width:88px;"></div></div>`);
    });

    container.off('change.max4').on('change.max4', '.dex-edit-checkbox', function(){
        if (container.find('.dex-edit-checkbox:checked').length > 4) {
            this.checked = false;
            toastr.warning('Maksimal 4 DEX dipilih');
        }
    });
}

/**
 * Disables all form inputs.
 */
function form_off() {
    $('input, select, textarea, button').prop('disabled', true);
}

/**
 * Enables all form inputs.
 */
function form_on() {
    $('input, select, button').prop('disabled', false);
}

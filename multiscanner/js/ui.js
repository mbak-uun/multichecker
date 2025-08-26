// --- UI & DOM Manipulation ---

function form_on() { $('input, select, button').prop('disabled', false); }
function form_off() { $('input, select, textarea, button').prop('disabled', true); }

function applyControlsFor(state) {
    const $form = $("#FormScanner");
    const $start = $('#startSCAN');
    const $stop = $('#stopSCAN');
    const $import = $('#uploadJSON');
    const $export = $('a[onclick="downloadTokenScannerCSV()"]');
    const setDisabled = ($els, disabled) => $els.prop('disabled', disabled).css({ 'opacity': disabled ? '0.5' : '', 'pointer-events': disabled ? 'none' : '' });

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

function updateTokenCount() {
    if (window.filteredTokens) {
        $('#tokenCountALL').text(`(${window.filteredTokens.length})`);
    }
}

function updateDarkIcon(isDark) {
    const icon = document.querySelector('#darkModeToggle');
    if (icon) {
        icon.src = isDark ? 'https://cdn-icons-png.flaticon.com/512/180/180700.png' : 'https://cdn-icons-png.flaticon.com/512/3751/3751403.png';
    }
}

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
        const warnaCex = '#000';

        const tdOrderbookLeft = document.createElement('td');
        tdOrderbookLeft.style.cssText = `color: ${warnaCex}; text-align: center; vertical-align: middle;`;
        tdOrderbookLeft.innerHTML = `<span id="LEFT_${data.cex}_${data.symbol_in}_${data.symbol_out}_${data.chain.toUpperCase()}"><b>PRICE & VOL BUY <br>${data.cex}</b> 🔒</span>`;
        row.appendChild(tdOrderbookLeft);

        for (let i = 0; i < maxSlots; i++) {
            const td = document.createElement('td');
            td.style.cssText = 'text-align: center; vertical-align: middle;';
            if (data.dexs && data.dexs[i]) {
                const dexName = data.dexs[i].dex || '-';
                const modalLeft = data.dexs[i].left ?? 0;
                const idCELL = `${data.cex.toUpperCase()}_${dexName.toUpperCase()}_${data.symbol_in}_${data.symbol_out}_${(data.chain).toUpperCase()}`;
                td.id=idCELL;
                td.innerHTML = `<strong class="uk-align-center" style="display:inline-block; margin:0;">[ ${dexName.toUpperCase()}: $${modalLeft} ]</strong><br><span class="buy" id="BUY_${idCELL}"></span><br><span class="uk-text-primary uk-text-bolder" id="SWAP_${idCELL}"> 🔒 </span><br><span class="sell" id="SELL_${idCELL}"></span><br><hr class="uk-divider-small uk-margin-remove"><span class="uk-text-primary" id="RESULT_${idCELL}"></span>`;
            } else {
                td.style.backgroundColor="#b2aeae";
                td.textContent = '-';
            }
            row.appendChild(td);
        }

        const chainLower = data.chain?.toLowerCase();
        const chainConfig = CONFIG_CHAINS[chainLower] || { URL_Chain: '', WARNA: '#000' };
        const warnaChain = chainConfig.WARNA || '#000';
        const urlScIn = chainConfig.URL_Chain ? `${chainConfig.URL_Chain}/token/${data.sc_in}` : '#';
        const urlScOut = chainConfig.URL_Chain ? `${chainConfig.URL_Chain}/token/${data.sc_out}` : '#';
        const urlsCEX = GeturlExchanger(data.cex, data.symbol_in, data.symbol_out);
        const linkToken = createHoverLink(safeUrl(urlsCEX?.tradeToken, urlScIn), (data.symbol_in||'').toUpperCase());
        const linkPair  = createHoverLink(safeUrl(urlsCEX?.tradePair,  urlScOut),  (data.symbol_out||'').toUpperCase());
        const WD_TOKEN = linkifyStatus(data.withdrawToken, 'WD', safeUrl(urlsCEX?.withdrawTokenUrl, urlScIn));
        const DP_TOKEN = linkifyStatus(data.depositToken,  'DP', safeUrl(urlsCEX?.depositTokenUrl, urlScIn));
        const WD_PAIR  = linkifyStatus(data.withdrawPair,  'WD', safeUrl(urlsCEX?.withdrawPairUrl, urlScOut));
        const DP_PAIR  = linkifyStatus(data.depositPair,   'DP', safeUrl(urlsCEX?.depositPairUrl, urlScOut));
        const linkSCtoken = createHoverLink(urlScIn, '[SC]', 'uk-text-primary');
        const linkSCpair = createHoverLink(urlScOut, '[SC]', 'uk-text-primary');
        const chainShort = (data.chain || '').substring(0,3).toUpperCase();

        const tdDetail = document.createElement('td');
        tdDetail.id = `DETAIL_${String(data.cex).toUpperCase()}_${String(data.symbol_in).toUpperCase()}_${String(data.symbol_out).toUpperCase()}_${String(data.chain).toUpperCase()}`.replace(/[^A-Z0-9_]/g,'');
        tdDetail.className = 'uk-text-center uk-background uk-text-nowrap';
        tdDetail.style.cssText = 'text-align: center; border:1px solid black;';
        tdDetail.innerHTML = `
            [${index + 1}] <span style="color: ${warnaCex}; font-weight:bolder;">${data.cex} </span>
            on <span style="color: ${warnaChain}; font-weight:bolder;">${chainShort} </span><br/>
            <span class="uk-text-secondary uk-text-bolder">${linkToken} VS ${linkPair}</span>
            <span id="EditMulti-${data.id}" data-id="${data.id}" title="UBAH DATA KOIN" uk-icon="icon: pencil; ratio: 0.6" class="uk-text-secondary uk-text-bolder" style="cursor:pointer"></span><br/>
            <span class="uk-text-bolder">${WD_TOKEN} ~ ${DP_TOKEN}</span> |
            <span class="uk-text-bolder">${WD_PAIR} ~ ${DP_PAIR}</span><br/>
            <span class="uk-text-primary uk-text-bolder">${(data.symbol_in||'').toUpperCase()} [${data.feeWDToken}]</span> ${linkSCtoken}<br/>
            <span class="uk-text-primary uk-text-bolder">${(data.symbol_out||'').toUpperCase()} [${data.feeWDPair}]</span> ${linkSCpair}`;
        row.appendChild(tdDetail);

        for (let i = 0; i < maxSlots; i++) {
            const td = document.createElement('td');
            td.style.textAlign = 'center';
            td.style.verticalAlign = 'middle';
            if (data.dexs && data.dexs[i]) {
                const dexName = data.dexs[i].dex || '-';
                const modalRight = data.dexs[i].right ?? 0;
                const idCELL = `${data.cex}_${dexName.toUpperCase()}_${data.symbol_out}_${data.symbol_in}_${data.chain.toUpperCase()}`;
                td.id = idCELL;
                td.innerHTML = `<strong class="uk-align-center" style="display:inline-block; margin:0; padding:0;">[ ${dexName.toUpperCase()} ~ $${modalRight} ]</strong><br><span class="buy" id="BUY_${idCELL}"> </span><br><span class="uk-text-primary uk-text-bolder" id="SWAP_${idCELL}"> 🔒 </span><br><span class="sell" id="SELL_${idCELL}"> </span><br><hr class="uk-divider-small uk-margin-remove"><span class="uk-text-primary" id="RESULT_${idCELL}"> </span>`;
            } else {
                td.style.backgroundColor="#b2aeae";
                td.textContent = '-';
            }
            row.appendChild(td);
        }

        const tdOrderbookRight = document.createElement('td');
        tdOrderbookRight.style.cssText = `color: ${warnaCex}; text-align: center; vertical-align: middle;`;
        tdOrderbookRight.innerHTML = `<span id="RIGHT_${data.cex}_${data.symbol_in}_${data.symbol_out}_${data.chain.toUpperCase()}"><b> PRICE & VOL SELL <br>${data.cex}</b> 🔒</span>`;
        row.appendChild(tdOrderbookRight);

        fragment.appendChild(row);
    });

    $tableBody.append(fragment);
}

function DisplayPNL( PNL, cex, Coin_in, NameX, totalFee, modal, dex, priceCEX, priceDEX, FeeSwap, FeeWD, sc_input, sc_output, Coin_out, totalValue, totalModal, conclusion, selisih, nameChain, codeChain, trx, profitLossPercent, vol ) {
    var filterPNLValue = parseFloat(window.SavedSettingData.filterPNL);
    var nickname = window.SavedSettingData.nickname;
    var totalValue = parseFloat(totalValue);
    var totalGet = totalValue - parseFloat(modal);
    var totalModal = parseFloat(totalModal);
    var totalFee = parseFloat(totalFee);
    const urlsCEXToken = GeturlExchanger(cex.toUpperCase(), Coin_in, Coin_out);
    var buyLink = urlsCEXToken.tradeToken;
    var sellLink = urlsCEXToken.tradePair;
    const chainNameLower = nameChain.toLowerCase();
    const chainConfig = CONFIG_CHAINS[chainNameLower];
    if (!chainConfig) return;

    var IdCELL = `${cex.toUpperCase()}_${dex.toUpperCase()}_${NameX}_${(chainConfig.Nama_Chain).toUpperCase()}`;
    var rowCell = $(`#${IdCELL}`);
    var resultCell = $(`#RESULT_${idCELL}`);
    var buyCell = $(`#BUY_${idCELL}`);
    var sellCell = $(`#SELL_${idCELL}`);
    var sinyals = `<a href="#SWAP_${cex.toUpperCase()}_${dex.toUpperCase()}_${NameX}_${(nameChain).toUpperCase()}" class='link-class'>${cex.toUpperCase()} VS ${dex.toUpperCase()} : ${NameX} (${PNL.toFixed(2)}$)</a>`;
    const isHighlight = (PNL > totalFee) || (PNL > filterPNLValue);

    if (isHighlight) {
        toastr.success(sinyals);
        rowCell.attr("style", "background-color: #94fa95 !important; font-weight: bolder !important; color: black !important; vertical-align: middle !important; text-align: center !important;");
        let htmlFee = (trx === "TokentoPair") ? `<span style="color:#0f04e2 !important;">FeeWD: ${FeeWD.toFixed(2)}$</span> | ${createLink(urlsCEXToken.withdrawUrl, 'WD')}<br/>` : `<span style="color:#0f04e2 !important;">FeeWD: ${FeeWD.toFixed(2)}$</span> | ${createLink(urlsCEXToken.depositUrl, 'DP')}<br/>`;
        resultCell.html(`${htmlFee}<span style="color: #d20000;">All: ${totalFee.toFixed(2)}$</span> <span style="color: #1e87f0;">SW: ${FeeSwap.toFixed(2)}$</span><br/><span style="color: #444;">GT: ${totalGet.toFixed(2)}$</span> <span style="color: #444;">PNL: ${PNL.toFixed(2)}$</span><br/>`);
        if (!buyCell.parent().is("a")) buyCell.wrap(`<a href="${buyLink}" target="_blank"></a>`);
        if (!sellCell.parent().is("a")) sellCell.wrap(`<a href="${sellLink}" target="_blank"></a>`);
        InfoSinyal(dex.toLowerCase(), NameX, PNL, totalFee, cex.toUpperCase(), Coin_in, Coin_out, profitLossPercent, modal, nameChain, codeChain, trx);
    } else {
        resultCell.html(`<span style="color:black;" title="FEE WD CEX">FeeWD : ${FeeWD.toFixed(2)}$</span><br/><span class="uk-text-danger" title="FEE ALL">ALL:${totalFee.toFixed(2)}$</span> <span class="uk-text-primary" title="FEE SWAP"> ${FeeSwap.toFixed(2)}$</span><br/><span class="uk-text-success" title="GET BRUTO">GT:${totalGet.toFixed(2)}$</span> <span class="uk-text-warning" title="GET NETTO / PNL" > ${PNL.toFixed(2)}$</span>`);
    }
}

function InfoSinyal(DEXPLUS, TokenPair, PNL, totalFee, cex, NameToken, NamePair, profitLossPercent, modal, nameChain, codeChain, trx) {
    const chainData = getChainData(nameChain);
    const chainShort = String(chainData?.SHORT_NAME || chainData?.Nama_Chain || nameChain).toUpperCase();
    const filterPNLValue = parseFloat(window.SavedSettingData.filterPNL);
    const warnaTeksArah = (trx === "TokentoPair") ? "uk-text-success" : "uk-text-danger";
    const idCELL = `${cex.toUpperCase()}_${DEXPLUS.toUpperCase()}_${NameToken}_${NamePair}_${String(nameChain).toUpperCase()}`;
    const highlightStyle = (Number(PNL) > filterPNLValue) ? "background-color:#acf9eea6; font-weight:bolder;" : "";
    const sLink = `<div><a href="#${idCELL}" class="buy" style="text-decoration:none; font-size:12px;"><span style="color:black; display:inline-block; ${highlightStyle}; margin-left:4px; margin-top:6px;">🔸 ${String(cex).slice(0,3).toUpperCase()}X<span class="uk-text-secondary">:${modal}</span> <span class="${warnaTeksArah}"> ${NameToken}->${NamePair}</span> <span class="uk-text-secondary">[${chainShort}]</span>: <span class="uk-text-warning">${Number(PNL).toFixed(2)}$</span></span></a></div>`;
    $("#sinyal" + DEXPLUS.toLowerCase()).append(sLink);
    const audio = new Audio('audio.mp3');
    audio.play();
}

function updateTableVolCEX(finalResult, cex) {
    const cexName = cex.toUpperCase();
    const TokenPair = finalResult.token + "_" + finalResult.pair;
    const getPriceIDR = priceUSDT => {
        const rateIDR = getFromLocalStorage("PRICE_RATE_USDT", 0);
        return rateIDR ? (priceUSDT * rateIDR).toLocaleString("id-ID", { style: "currency", currency: "IDR" }) : "N/A";
    };
    const volumesBuyToken = finalResult.volumes_buyToken.slice().sort((a, b) => b.price - a.price);
    const volumesSellPair = finalResult.volumes_sellPair;
    const volumesBuyPair = finalResult.volumes_buyPair.slice().sort((a, b) => b.price - a.price);
    const volumesSellToken = finalResult.volumes_sellToken.slice().sort((a, b) => b.price - a.price);
    $('#LEFT_' + cexName + '_' + TokenPair + '_' + finalResult.chainName.toUpperCase()).html(volumesBuyToken.map(data => `<span class='uk-text-success' title="IDR: ${getPriceIDR(data.price)}">${formatPrice(data.price || 0)} : <b>${data.volume.toFixed(2) || 0}$</b><br/></span>`).join('') + `<span class='uk-text-primary uk-text-bolder'>${finalResult.token} -> ${finalResult.pair}</span><br/>` + volumesSellPair.map(data => `<span class='uk-text-danger' title="IDR: ${getPriceIDR(data.price)}">${formatPrice(data.price || 0)} : <b>${data.volume.toFixed(2) || 0}$</b><br/></span>`).join(''));
    $('#RIGHT_' + cexName + '_' + TokenPair + '_' + finalResult.chainName.toUpperCase()).html(volumesBuyPair.map(data => `<span class='uk-text-success' title="IDR: ${getPriceIDR(data.price)}">${formatPrice(data.price || 0)} : <b>${data.volume.toFixed(2) || 0}$</b><br/></span>`).join('') + `<span class='uk-text-primary uk-text-bolder'>${finalResult.pair} -> ${finalResult.token}</span><br/>` + volumesSellToken.map(data => `<span class='uk-text-danger' title="IDR: ${getPriceIDR(data.price)}">${formatPrice(data.price || 0)} : <b>${data.volume.toFixed(2) || 0}$</b><br/></span>`).join(''));
}

function renderTokenManagementList() {
    const $tb = $('#mgrTbody').empty();
    let list = getFromLocalStorage('TOKEN_SCANNER', []) || [];
    const q = ($('#searchMgr').val() || '').toLowerCase();
    const rows = list.filter(t => !q || `${t.symbol_in} ${t.symbol_out} ${t.chain}`.toLowerCase().includes(q)).map((t,i)=>({ ...t, no: i+1 }));
    rows.forEach(r => {
        const cexHtml = (r.selectedCexs||[]).map(cx => `<span class="cex-chip">${String(cx).toUpperCase()}</span>`).join(' ');
        const chainName = (CONFIG_CHAINS?.[String(r.chain).toLowerCase()]?.Nama_Chain) || r.chain;
        const radioGroup = `<div class="status-group"><label class="uk-text-success"><input class="uk-radio mgrStatus" type="radio" name="status-${r.id}" data-id="${r.id}" value="true" ${r.status ? 'checked':''}> ON</label><label class="uk-text-danger"><input class="uk-radio mgrStatus" type="radio" name="status-${r.id}" data-id="${r.id}" value="false" ${!r.status ? 'checked':''}> OFF</label></div>`;
        $tb.append(`<tr><td class="uk-text-center">${r.no}</td><td><div><span class="uk-text-bold uk-text-success">${(r.symbol_in||'-').toUpperCase()}</span><span class="addr">${r.sc_in || ''} [${r.des_in ?? ''}]</span></div><div><span class="uk-text-bold uk-text-danger">${(r.symbol_out||'-').toUpperCase()}</span><span class="addr">${r.sc_out || ''} [${r.des_out ?? ''}]</span></div></td><td><div class="uk-text-center uk-margin-small-bottom">${String(chainName).toUpperCase()} ${radioGroup}</div></td><td>${cexHtml || '-'}</td><td>${(r.selectedDexs || []).join(', ')}</td><td class="actions"><button class="uk-button uk-button-primary uk-button-xxsmall mgrEdit" data-id="${r.id}">Edit</button></td></tr>`);
    });
}

function openEditModal(tokenOrId) {
    let token;
    if (typeof tokenOrId === 'object') {
        token = tokenOrId;
    } else {
        const tokens = getFromLocalStorage('TOKEN_SCANNER', []);
        token = tokens.find(t => String(t.id) === String(tokenOrId));
    }
    if (!token) return toastr.error('Data token tidak ditemukan');
    $('#multiTokenIndex').val(token.id);
    $('#inputSymbolToken').val(token.symbol_in || '');
    $('#inputDesToken').val(token.des_in ?? '');
    $('#inputSCToken').val(token.sc_in || '');
    $('#inputSymbolPair').val(token.symbol_out || '');
    $('#inputDesPair').val(token.des_out ?? '');
    $('#inputSCPair').val(token.sc_out || '');
    setStatusRadios(!!token.status);
    const $sel = $('#FormEditKoinModal #mgrChain');
    populateChainSelect($sel, token.chain);
    buildCexCheckboxForKoin(token);
    buildDexCheckboxForKoin(token);
    $sel.off('change.rebuildDex').on('change.rebuildDex', function(){
        buildDexCheckboxForKoin({ ...token, chain: $(this).val() });
    });
    UIkit.modal('#FormEditKoinModal').show();
}

function populateChainSelect($select, selectedKey) {
    const cfg = window.CONFIG_CHAINS || {};
    const keys = Object.keys(cfg);
    $select.empty();
    if (!keys.length) return $select.append('<option value="">-- PILIHAN CHAIN --</option>');
    keys.sort().forEach(k => {
        const item  = cfg[k] || {};
        const label = (item.Nama_Chain || k).toUpperCase();
        $select.append(`<option value="${k.toLowerCase()}">${label}</option>`);
    });
    const want = String(selectedKey || '').toLowerCase();
    $select.val(keys.map(k => k.toLowerCase()).includes(want) ? want : keys[0].toLowerCase());
}

function setStatusRadios(isOn) {
    $('#mgrStatusOn').prop('checked', !!isOn);
    $('#mgrStatusOff').prop('checked', !isOn);
}

function readStatusRadio() {
    return $('input[name="mgrStatus"]:checked').val() === 'on';
}

function buildCexCheckboxForKoin(token) {
    const container = $('#cex-checkbox-koin');
    container.empty();
    const selected = (token.selectedCexs || []).map(s => String(s).toUpperCase());
    const availableCexs = ['GATE', 'BINANCE', 'MEXC', 'INDODAX'];
    availableCexs.forEach(cexKey => {
        const isChecked = selected.includes(cexKey);
        container.append(`<label class="uk-display-block uk-margin-xsmall"><input type="checkbox" class="uk-checkbox" value="${cexKey}" ${isChecked ? 'checked' : ''}> <span style="font-weight:bold;">${cexKey}</span></label>`);
    });
}

function buildDexCheckboxForKoin(token = {}) {
    const container = $('#dex-checkbox-koin');
    container.empty();
    const chainName = token.chain || '';
    const chainCfg = CONFIG_CHAINS?.[String(chainName).toLowerCase()] || {};
    const allowedDexs = Array.isArray(chainCfg.DEXS) ? chainCfg.DEXS : Object.keys(chainCfg.DEXS || {});
    if (!allowedDexs.length) {
        container.html('<div class="uk-text-meta">Tidak ada DEX terdefinisi untuk chain ini.</div>');
        return;
    }
    const selectedDexs = (token.selectedDexs || []).map(d => String(d).toLowerCase());
    const dataDexs = token.dataDexs || {};
    allowedDexs.forEach(dexNameRaw => {
        const dexName = String(dexNameRaw);
        const dexKeyLower = dexName.toLowerCase();
        const isChecked = selectedDexs.includes(dexKeyLower);
        const stored = dataDexs[dexName] || dataDexs[dexKeyLower] || {};
        const leftVal  = stored.left  ?? 0;
        const rightVal = stored.right ?? 0;
        const safeId = dexKeyLower.replace(/[^a-z0-9_-]/gi, '');
        container.append(`<div class="uk-flex uk-flex-middle uk-margin-small"><label class="uk-margin-small-right"><input type="checkbox" class="uk-checkbox dex-edit-checkbox" value="${dexName}" ${isChecked ? 'checked' : ''}> <b>${dexName.toUpperCase()}</b></label><div class="uk-flex uk-flex-middle" style="gap:6px;"><input type="number" class="uk-input uk-form-xxsmall dex-left" id="dex-${safeId}-left" placeholder="KIRI" value="${leftVal}" style="width:88px;"><input type="number" class="uk-input uk-form-xxsmall dex-right" id="dex-${safeId}-right" placeholder="KANAN" value="${rightVal}" style="width:88px;"></div></div>`);
    });
}

function generateInputCheckbox(items, containerId, idPrefix, labelText, style, type) {
    const $container = $(`#${containerId}`);
    $container.empty();
    $container.append(`<b><span class="uk-text-secondary uk-text-medium">${labelText}</span></b>`);
    const wrapper = $('<div style="display:flex; flex-wrap:wrap; gap:10px;"></div>');
    Object.keys(items || {}).forEach(item => {
        // ... more logic here
    });
    $container.append(wrapper);
}

function loadSignalData() {
    const dexList = Object.keys(CONFIG_DEXS || {});
    const sinyalContainer = document.getElementById('sinyal-container');
    if (!sinyalContainer) return;
    sinyalContainer.innerHTML = '';
    sinyalContainer.className = 'uk-grid uk-grid-small uk-child-width-expand';
    dexList.forEach((dex, index) => {
        const gridItem = document.createElement('div');
        const card = document.createElement('div');
        card.className = 'uk-card uk-card-default uk-card-hover';
        const cardHeader = document.createElement('div');
        cardHeader.className = 'uk-card-header uk-padding-remove-vertical uk-padding-small';
        const bodyId = `body-${String(dex).toLowerCase()}-${index}`;
        cardHeader.innerHTML = `<div class="uk-flex uk-flex-middle" style="gap:8px;"><span class="uk-text-bold" style="color:black !important; font-size:14px;">${String(dex).toUpperCase()}</span></div><a class="uk-icon-link uk-text-danger uk-text-bolder" uk-icon="chevron-up" uk-toggle="target: #${bodyId}"></a>`;
        const cardBody = document.createElement('div');
        cardBody.id = bodyId;
        const signalSpan = document.createElement('div');
        signalSpan.id = `sinyal${String(dex).toLowerCase()}`;
        cardBody.appendChild(signalSpan);
        card.appendChild(cardHeader);
        card.appendChild(cardBody);
        gridItem.appendChild(card);
        sinyalContainer.appendChild(gridItem);
    });
    UIkit.update(sinyalContainer);
}

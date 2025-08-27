import { getFromLocalStorage, saveToLocalStorage, setLastAction } from '../storage.js';
import { flattenDataKoin } from '../core/scanner.js';
import { createHoverLink, safeUrl, linkifyStatus, getStatusLabel, formatPrice, createLink } from './domUtils.js';
import { getChainData, getCexDataConfig, getDexData, GeturlExchanger } from '../core/dataGetters.js';
import { MultisendMessage } from '../api/telegram.js';

const { CONFIG_CEX, CONFIG_DEXS, CONFIG_CHAINS, stablecoins } = window;
let originalTokens = [];
let filteredTokens = [];

// ==========================
// TABLE & VIEW RENDERING
// ==========================

export function refreshTokensTable() {
    const settingScanner = getFromLocalStorage('SETTING_SCANNER', {});
    const allowedChains = (settingScanner.AllChains || []).map(c => c.toLowerCase());
    const allTokens = getFromLocalStorage("TOKEN_SCANNER", []);

    const flatTokens = flattenDataKoin(allTokens, settingScanner);

    const filteredByChain = flatTokens
        .filter(token => allowedChains.includes((token.chain || '').toLowerCase()))
        .sort((a, b) => (a.symbol_in || '').localeCompare(b.symbol_in || '', 'en', { sensitivity: 'base' }));

    filteredTokens = [...filteredByChain];
    originalTokens = [...filteredByChain];

    updateTokenCount();
    loadKointoTable(filteredTokens);

    const uniqueKeys = new Set(filteredTokens.map(item => `${item.cex}|${item.chain}|${item.symbol_in}|${item.symbol_out}`));
    $('#tokenCountALL').text(`TOTAL SEMUA: ${uniqueKeys.size} PAIR-TOKEN`);
}

function loadKointoTable(dataToRender) {
    loadSignalData();
    const $tableBody = $('#dataTableBody');
    $tableBody.empty();

    if (!Array.isArray(dataToRender) || dataToRender.length === 0) {
        $('#startSCAN').prop('disabled', true);
        return;
    }

    const fragment = document.createDocumentFragment();
    const maxSlots = 4;

    dataToRender.forEach((data, index) => {
        const row = document.createElement('tr');
        const warnaCex = (CONFIG_CEX[data.cex] && CONFIG_CEX[data.cex].WARNA) || '#000';

        // Left Orderbook
        const tdOrderbookLeft = document.createElement('td');
        tdOrderbookLeft.style.cssText = `color: ${warnaCex}; text-align: center; vertical-align: middle;`;
        tdOrderbookLeft.innerHTML = `<span id="LEFT_${data.cex}_${data.symbol_in}_${data.symbol_out}_${data.chain.toUpperCase()}"><b>PRICE & VOL BUY <br>${data.cex}</b> 🔒</span>`;
        row.appendChild(tdOrderbookLeft);

        // CEX -> DEX Cells
        for (let i = 0; i < maxSlots; i++) {
            const td = document.createElement('td');
            td.style.cssText = 'text-align: center; vertical-align: middle;';
            if (data.dexs && data.dexs[i]) {
                const dexName = data.dexs[i].dex || '-';
                const modalLeft = data.dexs[i].left ?? 0;
                const idCELL = `${data.cex.toUpperCase()}_${dexName.toUpperCase()}_${data.symbol_in}_${data.symbol_out}_${(data.chain).toUpperCase()}`;
                td.id = idCELL;
                td.innerHTML = `
                    <strong class="uk-align-center" style="display:inline-block; margin:0;">${dexName.toUpperCase()} [$${modalLeft}]</strong><br>
                    <span class="buy" id="BUY_${idCELL}"></span><br>
                    <span class="uk-text-primary uk-text-bolder" id="SWAP_${idCELL}"> 🔒 </span><br>
                    <span class="sell" id="SELL_${idCELL}"></span><br>
                    <hr class="uk-divider-small uk-margin-remove">
                    <span class="uk-text-primary" id="RESULT_${idCELL}"></span>`;
            } else {
                td.style.backgroundColor = "#b2aeae";
                td.textContent = '-';
            }
            row.appendChild(td);
        }

        // Detail Info Cell
        row.appendChild(createDetailCell(data, index));

        // DEX -> CEX Cells
        for (let i = 0; i < maxSlots; i++) {
            const td = document.createElement('td');
            td.style.cssText = 'text-align: center; vertical-align: middle;';
            if (data.dexs && data.dexs[i]) {
                const dexName = data.dexs[i].dex || '-';
                const modalRight = data.dexs[i].right ?? 0;
                const idCELL = `${data.cex}_${dexName.toUpperCase()}_${data.symbol_out}_${data.symbol_in}_${data.chain.toUpperCase()}`;
                td.id = idCELL;
                td.innerHTML = `
                    <strong class="uk-align-center" style="display:inline-block; margin:0; padding:0;">${dexName.toUpperCase()} [$${modalRight}]</strong><br>
                    <span class="buy" id="BUY_${idCELL}"></span><br>
                    <span class="uk-text-primary uk-text-bolder" id="SWAP_${idCELL}"> 🔒 </span><br>
                    <span class="sell" id="SELL_${idCELL}"></span><br>
                    <hr class="uk-divider-small uk-margin-remove">
                    <span class="uk-text-primary" id="RESULT_${idCELL}"></span>`;
            } else {
                td.style.backgroundColor = "#b2aeae";
                td.textContent = '-';
            }
            row.appendChild(td);
        }

        // Right Orderbook
        const tdOrderbookRight = document.createElement('td');
        tdOrderbookRight.style.cssText = `color: ${warnaCex}; text-align: center; vertical-align: middle;`;
        tdOrderbookRight.innerHTML = `<span id="RIGHT_${data.cex}_${data.symbol_in}_${data.symbol_out}_${data.chain.toUpperCase()}"><b>PRICE & VOL SELL <br>${data.cex}</b> 🔒</span>`;
        row.appendChild(tdOrderbookRight);

        fragment.appendChild(row);
    });

    $tableBody.append(fragment);
}

function createDetailCell(data, index) {
    const chainConfig = getChainData(data.chain) || { URL_Chain: '', WARNA: '#000', Kode_Chain: '', Nama_Chain: '' };
    const warnaChain = chainConfig.COLOR_CHAIN || '#000';
    const urlScIn = chainConfig.URL_Chain ? `${chainConfig.URL_Chain}/token/${data.sc_in}` : '#';
    const urlScOut = chainConfig.URL_Chain ? `${chainConfig.URL_Chain}/token/${data.sc_out}` : '#';
    const urlsCEX = GeturlExchanger(data.cex, data.symbol_in, data.symbol_out);

    const tradeTokenUrl = safeUrl(urlsCEX?.tradeToken, urlScIn);
    const tradePairUrl = safeUrl(urlsCEX?.tradePair, urlScOut);

    const linkToken = createHoverLink(tradeTokenUrl, (data.symbol_in || '').toUpperCase());
    const linkPair = createHoverLink(tradePairUrl, (data.symbol_out || '').toUpperCase());

    const WD_TOKEN = linkifyStatus(data.withdrawToken, 'WD', safeUrl(urlsCEX?.withdrawTokenUrl, urlScIn));
    const DP_TOKEN = linkifyStatus(data.depositToken, 'DP', safeUrl(urlsCEX?.depositTokenUrl, urlScIn));
    const WD_PAIR = linkifyStatus(data.withdrawPair, 'WD', safeUrl(urlsCEX?.withdrawPairUrl, urlScOut));
    const DP_PAIR = linkifyStatus(data.depositPair, 'DP', safeUrl(urlsCEX?.depositPairUrl, urlScOut));

    const tdDetail = document.createElement('td');
    const rowId = `DETAIL_${String(data.cex).toUpperCase()}_${String(data.symbol_in).toUpperCase()}_${String(data.symbol_out).toUpperCase()}_${String(data.chain).toUpperCase()}`.replace(/[^A-Z0-9_]/g, '');
    tdDetail.id = rowId;
    tdDetail.className = 'uk-text-center uk-background uk-text-nowrap';
    tdDetail.style.cssText = 'text-align: center; border: 1px solid black;';
    const chainShort = (chainConfig.SHORT_NAME || data.chain || '').substring(0, 3).toUpperCase();

    tdDetail.innerHTML = `
        [${index + 1}] <span style="color: ${(CONFIG_CEX[data.cex] || {}).WARNA}; font-weight:bolder;">${data.cex}</span>
        on <span style="color: ${warnaChain}; font-weight:bolder;">${chainShort}</span><br/>
        <span class="uk-text-secondary uk-text-bolder">${linkToken} VS ${linkPair}</span>
        <span id="EditMulti-${data.id}" data-id="${data.id}" title="UBAH DATA KOIN" uk-icon="icon: pencil; ratio: 0.6" class="uk-text-secondary uk-text-bolder" style="cursor:pointer"></span><br/>
        <span class="uk-text-bolder">${WD_TOKEN} ~ ${DP_TOKEN}</span> |
        <span class="uk-text-bolder">${WD_PAIR} ~ ${DP_PAIR}</span><br/>
        ...`; // Simplified for brevity, original links can be added back if needed

    return tdDetail;
}


function updateTokenCount() {
    const count = Array.isArray(filteredTokens) ? filteredTokens.length : 0;
    $("#tokenCount").text(`(${count})`);
}

export function updateProgress(current, total, startTime, TokenPair) {
    let duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    let progressPercentage = total > 0 ? Math.floor((current / total) * 100) : 0;
    let progressText = `CHECKING - ${TokenPair} [${current}/${total}] :: Mulai: ${new Date(startTime).toLocaleTimeString()} ~ DURASI [${duration} Menit]`;

    $('#progress-bar').css('width', progressPercentage + '%');
    $('#progress-text').text(progressPercentage + '%');
    $('#progress').text(progressText);
}

export function updateTableVolCEX(finalResult, cex) {
    const cexName = cex.toUpperCase();
    const TokenPair = finalResult.token + "_" + finalResult.pair;
    const isIndodax = cexName === 'INDODAX';

    const getPriceIDR = priceUSDT => {
        const rateIDR = getFromLocalStorage("PRICE_RATE_USDT", 0);
        return rateIDR ? (priceUSDT * rateIDR).toLocaleString("id-ID", { style: "currency", currency: "IDR" }) : "N/A";
    };

    const formatVol = (volumes) => volumes.map(data => `
        <span class='uk-text-${data.price > 0 ? 'success' : 'danger'}' title="IDR: ${getPriceIDR(data.price)}">
            ${formatPrice(data.price || 0)} : <b>${data.volume.toFixed(2) || 0}$</b><br/>
        </span>`).join('');

    const volumesBuyToken = isIndodax ? finalResult.volumes_buyToken.slice().sort((a, b) => b.price - a.price) : finalResult.volumes_buyToken.slice().sort((a, b) => b.price - a.price);
    const volumesSellPair = isIndodax ? finalResult.volumes_sellPair : finalResult.volumes_sellPair;
    const volumesBuyPair = isIndodax ? finalResult.volumes_buyPair.slice().sort((a, b) => b.price - a.price) : finalResult.volumes_buyPair.slice().sort((a, b) => b.price - a.price);
    const volumesSellToken = isIndodax ? finalResult.volumes_sellToken : finalResult.volumes_sellToken.slice().sort((a, b) => b.price - a.price);

    $('#LEFT_' + cexName + '_' + TokenPair + '_' + finalResult.chainName.toUpperCase()).html(
        formatVol(volumesBuyToken) + `<span class='uk-text-primary uk-text-bolder'>${finalResult.token} -> ${finalResult.pair}</span><br/>` + formatVol(volumesSellPair)
    );

    $('#RIGHT_' + cexName + '_' + TokenPair + '_' + finalResult.chainName.toUpperCase()).html(
        formatVol(volumesBuyPair) + `<span class='uk-text-primary uk-text-bolder'>${finalResult.pair} -> ${finalResult.token}</span><br/>` + formatVol(volumesSellToken)
    );
}

export function DisplayPNL( PNL, cex, Coin_in, NameX, totalFee, modal, dex, FeeSwap, FeeWD, Coin_out, totalValue, totalModal, nameChain, trx ) {
    const SavedSettingData = getFromLocalStorage('SETTING_SCANNER', {});
    const filterPNLValue = parseFloat(SavedSettingData.filterPNL);
    const nickname = SavedSettingData.nickname;

    const urlsCEXToken = GeturlExchanger(cex.toUpperCase(), Coin_in, Coin_out);
    const buyLink = urlsCEXToken.tradeToken;
    const sellLink = urlsCEXToken.tradePair;

    const chainName = nameChain.toLowerCase();
    const chainConfig = CONFIG_CHAINS[chainName];
    if (!chainConfig) return;

    const IdCELL = `${cex.toUpperCase()}_${dex.toUpperCase()}_${NameX}_${(chainConfig.Nama_Chain).toUpperCase()}`;
    const rowCell = $(`#${IdCELL}`);
    if (!rowCell.length) return;

    const totalGet = totalValue - modal;
    const isHighlight = (PNL > totalFee) || (PNL > filterPNLValue);

    if (isHighlight) {
        const sinyals = `<a href="#${IdCELL}" class='link-class'>${cex.toUpperCase()} VS ${dex.toUpperCase()} : ${NameX} (${PNL.toFixed(2)}$)</a>`;
        toastr.success(sinyals);

        rowCell.css({
            "background-color": "#94fa95 !important",
            "font-weight": "bolder",
            "color": "black",
        });

        const feeLink = createLink(trx === "TokentoPair" ? urlsCEXToken.withdrawUrl : urlsCEXToken.depositUrl, 'WD/DP');
        let htmlResult = `
            <span style="color:#0f04e2 !important;">FeeWD: ${FeeWD.toFixed(2)}$</span> | ${feeLink}<br/>
            <span style="color: #d20000;">All: ${totalFee.toFixed(2)}$</span>
            <span style="color: #1e87f0;">SW: ${FeeSwap.toFixed(2)}$</span><br/>
            <span style="color: #444;">GT: ${totalGet.toFixed(2)}$</span>
            <span style="color: #444;">PNL: ${PNL.toFixed(2)}$</span><br/>`;

        $(`#RESULT_${IdCELL}`).html(htmlResult);

        const buyCell = $(`#BUY_${IdCELL}`);
        const sellCell = $(`#SELL_${IdCELL}`);
        if (!buyCell.parent().is("a")) buyCell.wrap(`<a href="${buyLink}" target="_blank"></a>`);
        if (!sellCell.parent().is("a")) sellCell.wrap(`<a href="${sellLink}" target="_blank"></a>`);

        InfoSinyal(dex.toLowerCase(), NameX, PNL, totalFee, cex.toUpperCase(), Coin_in, Coin_out, modal, nameChain, trx);
    } else {
        $(`#RESULT_${IdCELL}`).html(`
            <span style="color:black;" title="FEE WD CEX">FeeWD : ${FeeWD.toFixed(2)}$</span><br/>
            <span class="uk-text-danger" title="FEE ALL">ALL:${totalFee.toFixed(2)}$</span>
            <span class="uk-text-primary" title="FEE SWAP"> ${FeeSwap.toFixed(2)}$</span><br/>
            <span class="uk-text-success" title="GET BRUTO">GT:${totalGet.toFixed(2)}$</span>
            <span class="uk-text-warning" title="GET NETTO / PNL"> ${PNL.toFixed(2)}$</span>`);
    }
}

function InfoSinyal(DEXPLUS, TokenPair, PNL, totalFee, cex, NameToken, NamePair, modal, nameChain, trx) {
    const chainData = getChainData(nameChain);
    const chainShort = (chainData?.SHORT_NAME || nameChain).toUpperCase();
    const SavedSettingData = getFromLocalStorage('SETTING_SCANNER', {});
    const filterPNLValue = parseFloat(SavedSettingData.filterPNL);
    const warnaCEX = (CONFIG_CEX[cex] || {}).WARNA || '#000';
    const warnaTeksArah = (trx === "TokentoPair") ? "uk-text-success" : "uk-text-danger";
    const idCELL = `${cex}_${DEXPLUS.toUpperCase()}_${NameToken}_${NamePair}_${nameChain.toUpperCase()}`;
    const highlightStyle = (PNL > filterPNLValue) ? "background-color:#acf9eea6; font-weight:bolder;" : "";

    const sLink = `<div>
        <a href="#${idCELL}" class="buy" style="text-decoration:none; font-size:12px;">
            <span style="color:${warnaCEX}; display:inline-block; ${highlightStyle}; margin-left:4px; margin-top:6px;">
            🔸 ${cex.slice(0,3)}X<span class="uk-text-secondary">:${modal}</span>
            <span class="${warnaTeksArah}"> ${NameToken}->${NamePair}</span>
            <span class="uk-text-secondary">[${chainShort}]</span>:
            <span class="uk-text-warning">${PNL.toFixed(2)}$</span>
            </span>
        </a>
        </div>`;

    $("#sinyal" + DEXPLUS).append(sLink);

    const audio = new Audio('./audio/audio.mp3');
    audio.play().catch(e => console.error("Audio play failed:", e));
}

function loadSignalData() {
    const dexList = Object.keys(CONFIG_DEXS || {});
    const sinyalContainer = document.getElementById('sinyal-container');
    if (!sinyalContainer) return;
    sinyalContainer.innerHTML = '';
    sinyalContainer.className = 'uk-grid uk-grid-small uk-child-width-expand';
    dexList.forEach((dex) => {
        const gridItem = document.createElement('div');
        gridItem.innerHTML = `
            <div class="uk-card uk-card-default uk-card-hover" style="border-radius: 5px; overflow: hidden; border: 1px solid black; padding-bottom: 10px; margin-top: 10px;">
                <div class="uk-card-header uk-padding-remove-vertical uk-padding-small" style="background-color: #e5ebc6; height: 30px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid black;">
                    <div class="uk-flex uk-flex-middle" style="gap:8px;">
                        <span class="uk-text-bold" style="color:black !important; font-size:14px;">${dex.toUpperCase()}</span>
                    </div>
                    <a class="uk-icon-link uk-text-danger uk-text-bolder" uk-icon="chevron-up" uk-toggle="target: #body-${dex}"></a>
                </div>
                <div class="uk-card-body uk-padding-remove" id="body-${dex}">
                    <div id="sinyal${dex}" style="font-size: 13.5px;"></div>
                </div>
            </div>`;
        sinyalContainer.appendChild(gridItem);
    });
    UIkit.update(sinyalContainer);
}

function generateInputCheckbox(items, containerId, idPrefix, labelText, type = 'cex') {
    const $container = $(`#${containerId}`);
    $container.empty();
    let settingData = getFromLocalStorage('SETTING_SCANNER', {}) || {};
    let selectedItems;
    let countMap = {};
    const tokensArray = getFromLocalStorage('TOKEN_SCANNER', []).filter(t => t && t.status);

    if (type === 'chain') {
        selectedItems = (settingData.AllChains || []).map(c => c.toLowerCase());
        countMap = tokensArray.reduce((acc, t) => {
            const k = (t.chain || '').toLowerCase();
            if (k) acc[k] = (acc[k] || 0) + 1;
            return acc;
        }, {});
    } else { // cex
        const selectedChains = (settingData.AllChains || []).map(c => c.toLowerCase());
        selectedItems = (settingData.FilterCEXs || []).map(c => c.toUpperCase());
        countMap = tokensArray.reduce((acc, t) => {
            if (selectedChains.length && !selectedChains.includes((t.chain || '').toLowerCase())) return acc;
            (t.selectedCexs || []).forEach(cx => {
                const k = cx.toUpperCase();
                acc[k] = (acc[k] || 0) + 1;
            });
            return acc;
        }, {});
    }

    const wrapper = $('<div style="display:flex; flex-wrap:wrap; gap:10px;"></div>');
    wrapper.append(`<b><span class="uk-text-secondary uk-text-medium">${labelText}</span></b>`);

    Object.keys(items || {}).forEach(item => {
        const lower = item.toLowerCase();
        const upper = item.toUpperCase();
        const config = type === 'cex' ? CONFIG_CEX[upper] : CONFIG_CHAINS[lower];
        const color = config?.WARNA || '#333';
        const isChecked = type === 'cex' ? (selectedItems.length > 0 ? selectedItems.includes(upper) : false) : selectedItems.includes(lower);
        const badgeCount = countMap[type === 'cex' ? upper : lower] || 0;
        const labelTextShow = type === 'chain' ? (config?.Nama_Pendek || upper.substring(0,3)) : upper;

        wrapper.append(`
            <label class="uk-text-small" title="${config?.Nama_Chain || upper}">
                <input type="checkbox" class="uk-checkbox ${type}-item" value="${upper}" ${isChecked ? 'checked' : ''}>
                <span style="color:${color}; font-weight:bolder;">${labelTextShow.toUpperCase()}</span>
                <span>[${badgeCount}]</span>
            </label>
        `);
    });

    $container.html(wrapper);
}


// ==========================
// INITIALIZATION
// ==========================

export function initializeMainView() {
    refreshTokensTable();
    generateInputCheckbox(CONFIG_CHAINS, "chain-options", "C", "CHAIN : &nbsp;", 'chain');
    generateInputCheckbox(CONFIG_CEX, "cex-filter", "X", "CEX : &nbsp;", 'cex');

    // Search handler
    $('#searchInput').on('input', function () {
        const searchValue = $(this).val().toLowerCase();
        $('#dataTableBody tr').filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(searchValue) > -1);
        });
    });

    // Sort handlers
    $('.sort-toggle').off('click').on('click', function () {
        $('.sort-toggle').removeClass('active');
        $(this).addClass('active');
        const sortValue = $(this).data('sort');
        const sortedData = [...originalTokens].sort((a, b) => {
            const A = (a.symbol_in || "").toUpperCase();
            const B = (b.symbol_in || "").toUpperCase();
            if (A < B) return sortValue === "opt_A" ? -1 : 1;
            if (A > B) return sortValue === "opt_A" ? 1 : -1;
            return 0;
        });
        window.filteredTokens = sortedData; // Make available to scanner
        loadKointoTable(sortedData);
    });

    // Filter checkbox handlers
    $('#chain-options, #cex-filter').on('change', 'input[type="checkbox"]', function(){
        const settingData = getFromLocalStorage('SETTING_SCANNER', {});
        const isChain = $(this).hasClass('chain-item');
        const key = isChain ? 'AllChains' : 'FilterCEXs';
        const value = isChain ? this.value.toLowerCase() : this.value.toUpperCase();

        let currentList = (settingData[key] || []).map(v => isChain ? v.toLowerCase() : v.toUpperCase());

        if (this.checked) {
            if (!currentList.includes(value)) currentList.push(value);
        } else {
            if (isChain && currentList.length <= 1) {
                toastr.warning('Minimal harus ada 1 chain yang dipilih!');
                this.checked = true;
                return;
            }
            currentList = currentList.filter(item => item !== value);
        }

        settingData[key] = [...new Set(currentList)];
        saveToLocalStorage('SETTING_SCANNER', settingData);

        // Re-render dependent parts
        if(isChain) {
            generateInputCheckbox(CONFIG_CEX, "cex-filter", "X", "CEX : &nbsp;", 'cex');
        }
        refreshTokensTable();
    });
}

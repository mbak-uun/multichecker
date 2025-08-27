import { getFromLocalStorage, saveToLocalStorage, setLastAction } from '../storage.js';
import { createHoverLink } from './domUtils.js';

const { CONFIG_CEX, CONFIG_CHAINS } = window;

// ==========================
// RENDER MAIN LIST
// ==========================

function renderTokenManagementList() {
    const $tb = $('#mgrTbody').empty();
    let list = getFromLocalStorage('TOKEN_SCANNER', []) || [];
    if (!Array.isArray(list)) list = [];

    const q = ($('#searchMgr').val() || '').toLowerCase();
    const rows = list
        .filter(t => !q || `${t.symbol_in} ${t.symbol_out} ${t.chain}`.toLowerCase().includes(q))
        .map((t, i) => ({ ...t, no: i + 1 }));

    const dexChips = (row) => {
        const names = (row.selectedDexs || []).slice(0, 4);
        while (names.length < 4) names.push(null);
        return names.map(name => {
            if (!name) return `<span class="dex-chip dex-empty">-</span>`;
            const k = String(name);
            const l = row?.dataDexs?.[k]?.left ?? row?.dataDexs?.[k.toLowerCase()]?.left ?? 0;
            const r = row?.dataDexs?.[k]?.right ?? row?.dataDexs?.[k.toLowerCase()]?.right ?? 0;
            return `
          <span class="dex-chip">
            <b>${k.toUpperCase()}</b> [
            <span class="dex-mini">${l}</span>
            ~
            <span class="dex-mini">${r}</span>
          ]</span>`;
        }).join(' ');
    };

    rows.forEach(r => {
        const cexHtml = (r.selectedCexs || []).map(cx => {
            const name = String(cx).toUpperCase();
            const col = (CONFIG_CEX?.[name]?.WARNA) || '#000';
            return `<span class="cex-chip" style="color:${col}">${name}</span>`;
        }).join(' ');

        const chainName = (CONFIG_CHAINS?.[String(r.chain).toLowerCase()]?.Nama_Chain) || r.chain;

        const radioGroup = `
        <div class="status-group">
          <label class="uk-text-success">
            <input class="uk-radio mgrStatus" type="radio"
                   name="status-${r.id}" data-id="${r.id}" value="true" ${r.status ? 'checked' : ''}>
            ON
          </label>
          <label class="uk-text-danger">
            <input class="uk-radio mgrStatus" type="radio"
                   name="status-${r.id}" data-id="${r.id}" value="false" ${!r.status ? 'checked' : ''}>
            OFF
          </label>
        </div>`;

        $tb.append(`
        <tr>
          <td class="uk-text-center">${r.no}</td>
          <td>
            <div>
              <span class="uk-text-bold uk-text-success">${(r.symbol_in || '-').toUpperCase()}</span>
              <span class="addr">${r.sc_in || ''} [${r.des_in ?? ''}]</span>
            </div>
            <div>
              <span class="uk-text-bold uk-text-danger">${(r.symbol_out || '-').toUpperCase()}</span>
              <span class="addr">${r.sc_out || ''} [${r.des_out ?? ''}]</span>
            </div>
          </td>
          <td>
            <div class="uk-text-center uk-margin-small-bottom">${String(chainName).toUpperCase()} ${radioGroup}</div>
          </td>
          <td>${cexHtml || '-'}</td>
          <td>${dexChips(r)}</td>
          <td class="actions">
            <button class="uk-button uk-button-primary uk-button-xxsmall mgrEdit" data-id="${r.id}">Edit</button>
          </td>
        </tr>
      `);
    });
}

// ==========================
// MODAL & FORM LOGIC
// ==========================

function populateChainSelect($select, selectedKey) {
    const cfg = window.CONFIG_CHAINS || {};
    const keys = Object.keys(cfg);
    $select.empty();
    if (!keys.length) {
        $select.append('<option value="">-- PILIHAN CHAIN --</option>');
        return;
    }
    keys.sort().forEach(k => {
        const item = cfg[k] || {};
        const label = (item.Nama_Chain || item.nama_chain || item.name || k).toString().toUpperCase();
        $select.append(`<option value="${k.toLowerCase()}">${label}</option>`);
    });
    const want = String(selectedKey || '').toLowerCase();
    const lowerKeys = keys.map(k => k.toLowerCase());
    $select.val(lowerKeys.includes(want) ? want : lowerKeys[0]);
}

function buildCexCheckboxForKoin(token) {
    const container = $('#cex-checkbox-koin');
    container.empty();
    const selected = (token.selectedCexs || []).map(s => String(s).toUpperCase());
    Object.keys(CONFIG_CEX || {}).forEach(cexKey => {
        const upper = String(cexKey).toUpperCase();
        const isChecked = selected.includes(upper);
        const color = (CONFIG_CEX[upper] && CONFIG_CEX[upper].WARNA) || '#000';
        const html = `
          <label class="uk-display-block uk-margin-xsmall">
              <input type="checkbox" class="uk-checkbox" value="${upper}" ${isChecked ? 'checked' : ''}>
              <span style="color:${color}; font-weight:bold;">${upper}</span>
          </label>
      `;
        container.append(html);
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
        const leftVal = stored.left ?? 0;
        const rightVal = stored.right ?? 0;
        const html = `
        <div class="uk-flex uk-flex-middle uk-margin-small">
            <label class="uk-margin-small-right">
            <input type="checkbox" class="uk-checkbox dex-edit-checkbox" value="${dexName}" ${isChecked ? 'checked' : ''}>
            <b>${dexName.toUpperCase()}</b>
            </label>
            <div class="uk-flex uk-flex-middle" style="gap:6px;">
            <input type="number" class="uk-input uk-form-xxsmall dex-left" placeholder="KIRI" value="${leftVal}" style="width:88px;">
            <input type="number" class="uk-input uk-form-xxsmall dex-right" placeholder="KANAN" value="${rightVal}" style="width:88px;">
            </div>
        </div>
        `;
        container.append(html);
    });
}

function openEditModalById(id) {
    const tokens = getFromLocalStorage('TOKEN_SCANNER', []);
    const token = (Array.isArray(tokens) ? tokens : []).find(t => String(t.id) === String(id));
    if (!token) return toastr.error('Data token tidak ditemukan');

    $('#multiTokenIndex').val(token.id);
    $('#inputSymbolToken').val(token.symbol_in || '');
    $('#inputDesToken').val(token.des_in ?? '');
    $('#inputSCToken').val(token.sc_in || '');
    $('#inputSymbolPair').val(token.symbol_out || '');
    $('#inputDesPair').val(token.des_out ?? '');
    $('#inputSCPair').val(token.sc_out || '');
    $('#mgrStatusOn').prop('checked', !!token.status);
    $('#mgrStatusOff').prop('checked', !token.status);

    const $sel = $('#FormEditKoinModal #mgrChain');
    populateChainSelect($sel, token.chain);
    buildCexCheckboxForKoin(token);
    buildDexCheckboxForKoin(token);

    $sel.off('change.rebuildDex').on('change.rebuildDex', function () {
        const newChain = $(this).val();
        buildDexCheckboxForKoin({ ...token, chain: newChain });
    });

    UIkit.modal('#FormEditKoinModal').show();
}

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
        const parent = $(this).closest('.uk-flex');
        const leftVal = parseFloat(parent.find('.dex-left').val()) || 0;
        const rightVal = parseFloat(parent.find('.dex-right').val()) || 0;
        selectedDexs.push(dexName);
        dataDexs[dexName] = { left: leftVal, right: rightVal };
    });
    return { selectedDexs, dataDexs };
}

function saveToken() {
    const id = $('#multiTokenIndex').val();
    if (!id) return toastr.error('ID token tidak ditemukan.');

    const formData = {
        symbol_in: ($('#inputSymbolToken').val() || '').toString().trim(),
        des_in: Number($('#inputDesToken').val() || 0),
        sc_in: ($('#inputSCToken').val() || '').toString().trim(),
        status: $('input[name="mgrStatus"]:checked').val() === 'true',
        symbol_out: ($('#inputSymbolPair').val() || '').toString().trim(),
        des_out: Number($('#inputDesPair').val() || 0),
        sc_out: ($('#inputSCPair').val() || '').toString().trim(),
        chain: String($('#FormEditKoinModal #mgrChain').val() || '').toLowerCase(),
        ...readCexSelectionFromForm(),
        ...readDexSelectionFromForm()
    };

    if (!formData.symbol_in || !formData.symbol_out) return toastr.warning('Symbol Token & Pair tidak boleh kosong');
    if (formData.selectedDexs.length > 4) return toastr.warning('Maksimal 4 DEX yang dipilih');

    let tokens = getFromLocalStorage('TOKEN_SCANNER', []);
    const idx = tokens.findIndex(t => String(t.id) === String(id));
    const isEdit = idx !== -1;

    const buildDataCexs = (prev = {}) => {
        const obj = {};
        (formData.selectedCexs || []).forEach(cx => {
            const up = String(cx).toUpperCase();
            const old = prev[up] || {};
            obj[up] = {
                feeWDToken: parseFloat(old.feeWDToken) || 0,
                feeWDPair: parseFloat(old.feeWDPair) || 0,
                depositToken: !!old.depositToken,
                withdrawToken: !!old.withdrawToken,
                depositPair: !!old.depositPair,
                withdrawPair: !!old.withdrawPair
            };
        });
        return obj;
    };

    if (isEdit) {
        const old = tokens[idx] || {};
        tokens[idx] = { ...old, ...formData, dataCexs: buildDataCexs(old.dataCexs || {}) };
    } else {
        const newToken = { ...formData, id, dataCexs: buildDataCexs({}) };
        tokens.push(newToken);
    }

    saveToLocalStorage('TOKEN_SCANNER', tokens);
    toastr.success(isEdit ? 'Perubahan token berhasil disimpan' : 'Token baru berhasil ditambahkan');
    renderTokenManagementList();
    setLastAction(isEdit ? "UBAH DATA KOIN" : "TAMBAH DATA KOIN");
    UIkit.modal('#FormEditKoinModal').hide();
}

function deleteTokenById(tokenId) {
    let tokens = getFromLocalStorage('TOKEN_SCANNER', []);
    const updated = tokens.filter(t => String(t.id) !== String(tokenId));
    saveToLocalStorage('TOKEN_SCANNER', updated);
    renderTokenManagementList();
    setLastAction("HAPUS KOIN");
}

// ==========================
// INITIALIZATION
// ==========================

export function initializeTokenManager() {
    // Show/Hide Main sections
    $('#ManajemenKoin').on('click', function (e) {
        e.preventDefault();
        $('#scanner-config, #sinyal-container, #header-table').hide();
        $('#dataTableBody').closest('.uk-overflow-auto').hide();
        $('#token-management').show();
        renderTokenManagementList();
    });

    // Search
    $('#searchMgr').on('input', renderTokenManagementList);

    // Edit button on list
    $('#mgrTbody').on('click', '.mgrEdit', function () {
        openEditModalById($(this).data('id'));
    });

    // Status radio button on list
    $('#mgrTbody').on('change', '.mgrStatus', function () {
        const id = String($(this).data('id'));
        const val = $(this).val() === 'true';
        let tokens = getFromLocalStorage('TOKEN_SCANNER', []) || [];
        const idx = tokens.findIndex(t => String(t.id) === id);
        if (idx === -1) return toastr.error('Data tidak ditemukan');
        tokens[idx].status = val;
        saveToLocalStorage('TOKEN_SCANNER', tokens);
        toastr.success(`Status diubah ke ${val ? 'ACTIVE' : 'INACTIVE'}`);
    });

    // New Token button
    $('#btnNewToken').on('click', () => {
        const keys = Object.keys(window.CONFIG_CHAINS || {});
        const firstChainWithDex = keys.find(k => {
            const d = CONFIG_CHAINS[k]?.DEXS;
            return Array.isArray(d) ? d.length > 0 : !!(d && Object.keys(d).length);
        }) || keys[0] || '';

        const empty = {
            id: Date.now().toString(),
            chain: String(firstChainWithDex || '').toLowerCase(),
            status: true,
            selectedCexs: [], selectedDexs: [], dataDexs: {}, dataCexs: {}
        };

        $('#multiTokenIndex').val(empty.id);
        $('#inputSymbolToken, #inputSCToken, #inputSymbolPair, #inputSCPair').val('');
        $('#inputDesToken, #inputDesPair').val('');
        $('#mgrStatusOn').prop('checked', true);

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

        UIkit.modal('#FormEditKoinModal').show();
    });

    // Form submission
    $('#multiTokenForm').on('submit', function (e) {
        e.preventDefault();
        saveToken();
    });

    // Delete button
    $('#HapusEditkoin').on('click', function (e) {
        e.preventDefault();
        const id = $('#multiTokenIndex').val();
        const token = ($('#inputSymbolToken').val() || '').toString();
        const pair = ($('#inputSymbolPair').val() || '').toString();
        if (!id) return toastr.error('ID token tidak ditemukan.');

        if (confirm(`⚠️ INGIN HAPUS DATA KOIN ${token.toUpperCase() || ''} VS ${pair.toUpperCase() || ''}?`)) {
            deleteTokenById(id);
            toastr.success(`KOIN ${token.toUpperCase() || ''} TERHAPUS`);
            UIkit.modal('#FormEditKoinModal').hide();
        }
    });
}

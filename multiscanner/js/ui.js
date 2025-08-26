/**
 * UI Module
 * This module handles all DOM manipulation and UI-related event listeners.
 */

/**
 * Enables or disables form controls based on the application's readiness state.
 * @param {string} state The current state ('READY', 'MISSING_SETTINGS', etc.).
 */
function applyControlsFor(state) {
    const $form = $("#FormScanner");
    const $start = $('#startSCAN');
    const $stop = $('#stopSCAN');
    const $import = $('#uploadJSON');
    const $export = $('a[onclick="downloadTokenScannerCSV()"]');

    function setDisabled($els, disabled) {
        $els.prop('disabled', disabled)
            .css('opacity', disabled ? '0.5' : '')
            .css('pointer-events', disabled ? 'none' : '');
    }

    // Lock everything by default
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
 * Renders the main table with token data.
 * @param {Array<object>} filteredData The data to render.
 */
function loadKointoTable(filteredData) {
    loadSignalData(); // Re-initialize the signal containers
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
        const warnaCex = (CONFIG_CEX[data.cex] && CONFIG_CEX[data.cex].WARNA) || '#000';

        // Left Orderbook (CEX)
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
                    <strong class="uk-align-center" style="display:inline-block; margin:0;">[ ${dexName.toUpperCase()}: $${modalLeft} ]</strong><br>
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

        // Token Detail Cell (omitted for brevity, but would be constructed here)
        const tdDetail = document.createElement('td');
        // ... complex innerHTML for tdDetail
        row.appendChild(tdDetail);


        // DEX -> CEX Cells
        for (let i = 0; i < maxSlots; i++) {
             const td = document.createElement('td');
            td.style.cssText = 'text-align: center; vertical-align: middle;';
            if (data.dexs && data.dexs[i]) {
                const dexName = data.dexs[i].dex || '-';
                const modalRight = data.dexs[i].right ?? 0;
                const idCELL = `${data.cex.toUpperCase()}_${dexName.toUpperCase()}_${data.symbol_out}_${data.symbol_in}_${(data.chain).toUpperCase()}`;
                td.id = idCELL;
                td.innerHTML = `
                    <strong class="uk-align-center" style="display:inline-block; margin:0;">[ ${dexName.toUpperCase()}: $${modalRight} ]</strong><br>
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

        // Right Orderbook (CEX)
        const tdOrderbookRight = document.createElement('td');
        tdOrderbookRight.style.cssText = `color: ${warnaCex}; text-align: center; vertical-align: middle;`;
        tdOrderbookRight.innerHTML = `<span id="RIGHT_${data.cex}_${data.symbol_in}_${data.symbol_out}_${data.chain.toUpperCase()}"><b>PRICE & VOL SELL <br>${data.cex}</b> 🔒</span>`;
        row.appendChild(tdOrderbookRight);

        fragment.appendChild(row);
    });

    $tableBody.append(fragment);
}


/**
 * Updates the CEX order book volume display in the table.
 * @param {object} finalResult The result object containing volume data.
 * @param {string} cex The CEX name.
 */
function updateTableVolCEX(finalResult, cex) {
    // ... implementation to update the order book cells ...
}

/**
 * Displays the PNL results in the corresponding table cell.
 * @param {object} pnlData All data required to calculate and display PNL.
 */
function DisplayPNL(pnlData) {
    // ... implementation to calculate and render PNL ...
}

/**
 * Appends a signal to the top signal container.
 * @param {string} dexName The name of the DEX.
 * @param {string} tokenPair The token pair string.
 * @param {number} pnl The calculated PNL.
 */
function InfoSinyal(dexName, tokenPair, pnl) {
    // ... implementation to append signal ...
}

/**
 * Initializes the signal containers for each DEX.
 */
function loadSignalData() {
    // ... implementation to create signal containers ...
}

/**
 * Generates the filter checkboxes for chains and CEXs.
 * @param {object} items The configuration object for chains or CEXs.
 * @param {string} containerId The ID of the container element.
 */
function generateInputCheckbox(items, containerId, ...args) {
    // ... implementation to create and render checkboxes ...
}

/**
 * Opens and populates the "Edit Koin" modal.
 * @param {string} tokenId The ID of the token to edit.
 */
function openEditModalById(tokenId) {
    // ... implementation to show and populate the modal ...
}

/**
 * Updates the dark mode icon.
 * @param {boolean} isDark True if dark mode is enabled.
 */
function updateDarkIcon(isDark) {
    const icon = document.querySelector('#darkModeToggle');
    if (icon) {
        // Logic to change the icon source or class
    }
}

/**
 * Toggles the dark mode on the body.
 */
function toggleDarkMode() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    body.classList.toggle('uk-dark');
    const isDark = body.classList.contains('dark-mode');
    saveToLocalStorage("DARK_MODE", isDark);
    updateDarkIcon(isDark);
}

/**
 * Binds all the necessary UI event listeners.
 */
function bindUIEvents() {
    // Dark mode toggle
    $('#darkModeToggle').on('click', toggleDarkMode);

    // Setting modal button
    $("#SettingConfig").on("click", () => {
        UIkit.modal("#modal-setting").show();
        // ... logic to populate setting modal ...
    });

    // Save settings button
    $('#btn-save-setting').on('click', () => {
        // ... logic to read and save settings ...
        // This will call functions from the main/state module.
    });

    // Search input
    $('#searchInput').on('input', function() {
        const searchValue = $(this).val().toLowerCase();
        $('#dataTableBody tr').filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(searchValue) > -1);
        });
    });

    // ... other event listeners like #reload, #stopSCAN, #startSCAN, etc.
    // These will be bound here and will call functions from main.js to dispatch actions.
}

class UI {
    constructor(controller) {
        this.controller = controller;
        this.renderTokenModalForms();
        this.renderFormSettingScan();
        this.renderSyncKoinModalForms();
        this.bindEvents();
    }

    renderSyncKoinModalForms() {
        const chainContainer = $('#sync-koin-chain-container');
        const cexContainer = $('#sync-koin-cex-container');
        const dexContainer = $('#sync-koin-dex-container');

        chainContainer.empty();
        cexContainer.empty();
        dexContainer.empty();

        // Chains
        for (const chainKey in window.CONFIG.CHAIN_CONFIG) {
            const chain = window.CONFIG.CHAIN_CONFIG[chainKey];
            const checkbox = `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" name="sync_chain" value="${chain.name.toLowerCase()}" id="sync_chain_${chainKey}">
                    <label class="form-check-label" for="sync_chain_${chainKey}">${chain.name.toUpperCase()}</label>
                </div>`;
            chainContainer.append(checkbox);
        }

        // CEXs
        for (const cexName in window.CONFIG.CONFIG_CEX) {
            const checkbox = `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" name="sync_cex" value="${cexName}" id="sync_cex_${cexName.toLowerCase()}">
                    <label class="form-check-label" for="sync_cex_${cexName.toLowerCase()}">${cexName}</label>
                </div>`;
            cexContainer.append(checkbox);
        }

        // DEXs
        window.CONFIG.DexList.forEach(dexName => {
            const checkbox = `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" name="sync_dex" value="${dexName}" id="sync_dex_${dexName.toLowerCase()}">
                    <label class="form-check-label" for="sync_dex_${dexName.toLowerCase()}">${dexName}</label>
                </div>`;
            dexContainer.append(checkbox);
        });
    }

    renderTokenModalForms() {
        const cexContainer = $('#token-modal-cex-container');
        const dexContainer = $('#token-modal-dex-container');
        const chainContainer = $('#token-modal-chain-container');

        // CEX Checkboxes
        for (const cexName in window.CONFIG.CONFIG_CEX) {
            const checkboxId = `cex${cexName}`;
            const checkbox = `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="${cexName}" id="${checkboxId}">
                    <label class="form-check-label" for="${checkboxId}">${cexName}</label>
                </div>`;
            cexContainer.append(checkbox);
        }

        // DEX Checkboxes
        const dexList = window.CONFIG.DexList;
        const dexCol1 = $('<div class="col-6"></div>');
        const dexCol2 = $('<div class="col-6"></div>');
        dexList.forEach((dexName, index) => {
            const checkboxId = `dex${dexName.replace(/\s/g, '')}`;
            const checkbox = `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="${dexName}" id="${checkboxId}">
                    <label class="form-check-label" for="${checkboxId}">${dexName}</label>
                </div>`;
            if (index < Math.ceil(dexList.length / 2)) {
                dexCol1.append(checkbox);
            } else {
                dexCol2.append(checkbox);
            }
        });
        dexContainer.append($('<div class="row"></div>').append(dexCol1, dexCol2));


        // Chain Select
        const chainSelect = $('<select class="form-select" id="tokenChain" required></select>');
        chainSelect.append('<option value="">PILIH Chain</option>');
        for (const chainKey in window.CONFIG.CHAIN_CONFIG) {
            const chain = window.CONFIG.CHAIN_CONFIG[chainKey];
            chainSelect.append(`<option value="${chain.name}">${chain.name}</option>`);
        }
        chainContainer.append(chainSelect);
    }

    bindEvents() {
        const self = this;
        $('#token-modal-cex-container').on('change', 'input[type="checkbox"]', function() {
            self.renderModalInputs();
        });
        $('#token-modal-dex-container').on('change', 'input[type="checkbox"]', function() {
            self.renderModalInputs();
        });
    }

    renderModalInputs() {
        const cexModalContainer = $('#token-modal-cex-modal-container');
        const dexModalContainer = $('#token-modal-dex-modal-container');

        cexModalContainer.empty();
        dexModalContainer.empty();

        $('#token-modal-cex-container input[type="checkbox"]:checked').each(function() {
            const cexName = $(this).val();
            const input = `
                <div class="input-group mb-2">
                    <span class="input-group-text">${cexName}</span>
                    <input type="number" class="form-control" data-cex-modal="${cexName}" value="100" min="1" step="0.01">
                </div>`;
            cexModalContainer.append(input);
        });

        $('#token-modal-dex-container input[type="checkbox"]:checked').each(function() {
            const dexName = $(this).val();
            const input = `
                <div class="input-group mb-2">
                    <span class="input-group-text">${dexName}</span>
                    <input type="number" class="form-control" data-dex-modal="${dexName}" value="100" min="1" step="0.01">
                </div>`;
            dexModalContainer.append(input);
        });
    }

    showAlert(message, type = 'info') {
        const alertId = 'alert-' + Date.now();
        const alertHtml = `
            <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show position-fixed d-flex align-items-center justify-content-between"
                style="top: 1%; left: 50%; transform: translateX(-50%); z-index: 9999; min-width: 70%; max-width: 90vw; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 3rem;">
                <div class="me-2">${message}</div>
                <button type="button" class="btn-close ms-2" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        $('body').append(alertHtml);
        setTimeout(() => {
            $(`#${alertId}`).alert('close');
        }, 5000);

        if (window.Android && typeof window.Android.showToast === 'function') {
            const plainText = message.replace(/<[^>]*>/g, '');
            window.Android.showToast(plainText);
        }

        if (window.Android && typeof window.Android.vibrate === 'function') {
            window.Android.vibrate(200);
        }
    }

    showAlertWithAudio() {
        const alertBox = document.getElementById("customAlert");
        var audio = new Audio('finish.mp3');
        audio.play();
        alertBox.style.display = "block";
        setTimeout(() => {
            alertBox.style.display = "none";
        }, 4000);
    }

    renderTokenTable(tokens) {
        const tbody = $('#tokenTableBody')[0];
        tbody.innerHTML = '';

        if (tokens.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="6" class="text-center py-4 text-muted">Tidak Ada DATA KOIN</td>`;
            tbody.appendChild(tr);
            return;
        }

        const fragment = document.createDocumentFragment();
        tokens.forEach((token, index) => {
            const tr = document.createElement('tr');
            tr.className = 'align-middle token-data-row';

            const modalCexText = Object.entries(token.modalCexToDex || {}).map(([key, value]) => `${key}: $${value}`).join('<br>');
            const modalDexText = Object.entries(token.modalDexToCex || {}).map(([key, value]) => `${key}: $${value}`).join('<br>');

            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>
                    <strong>${token.symbol}/${token.pairSymbol}</strong><br>
                    <small class="text-muted">${token.contractAddress}</small>
                </td>
                <td>${token.chain}</td>
                <td>
                    <div class="p-1" title="CEX Modals">${modalCexText || 'N/A'}</div>
                    <hr class="my-1">
                    <div class="p-1" title="DEX Modals">${modalDexText || 'N/A'}</div>
                </td>
                <td>${(token.selectedCexs || []).join(', ')}</td>
                <td>${(token.selectedDexs || []).join(', ')}</td>
            `;
            fragment.appendChild(tr);
        });

        tbody.appendChild(fragment);
    }

    generateEmptyTable() {
        const tbody = $('#priceTableBody');
        tbody.empty();
        // ... implementation from TokenPriceMonitor.generateEmptyTable ...
    }

    createTokenDetailContent(token, cex) {
        // ... implementation from TokenPriceMonitor.createTokenDetailContent ...
    }

    InfoSettingApps(settings) {
        const shortened = this.shortenAddress(settings.WalletAddress);
        const infoHTML = `
            🆔&nbsp; UserName: ${settings.UserName}<br>
            👛&nbsp; Wallets: ${shortened}<br>
            👥&nbsp; Anggota Grup: ${settings.tokensPerBatch} Koin<br>
            ⏱️&nbsp; Jeda Grup: ${settings.delayBetweenGrup}ms<br>
            ⌛&nbsp; Time Out: ${settings.TimeoutCount}ms<br>
            💰&nbsp; PNLFilter: $${settings.PNLFilter}
        `;
        $('#infoConfig').html(infoHTML);

        $('#UserName').val(settings.UserName);
        $('#tokensPerBatch').val(settings.tokensPerBatch);
        $('#delayBetweenGrup').val(settings.delayBetweenGrup);
        $('#TimeoutCount').val(settings.TimeoutCount);
        $('#PNLFilter').val(settings.PNLFilter);
        $('#WalletAddress').val(settings.WalletAddress);
    }

    InfoConfigScan(config, selectedTokens) {
        // ... implementation from TokenPriceMonitor.InfoConfigScan ...
    }

    updateDexErrorBadge(dexName, count) {
        const badge = $(`#errorBadge_${dexName}`);
        if (count > 0) {
            badge.text(count).removeClass('d-none');
        } else {
            badge.addClass('d-none');
        }
    }

    renderFormSettingScan() {
        const $chainContainer = $('#chainCheckboxGroup');
        const $cexContainer = $('#cexCheckboxGroup');
        $chainContainer.empty();
        $cexContainer.empty();

        // Chain Checkboxes
        for (const chainKey in window.CONFIG.CHAIN_CONFIG) {
            const config = window.CONFIG.CHAIN_CONFIG[chainKey];
            const id = `Scan${config.short.toUpperCase()}`;
            const label = config.short.toUpperCase();
            const checkbox = `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" name="set_chain" value="${config.name}" id="${id}">
                    <label class="form-check-label" for="${id}">${label}</label>
                </div>`;
            $chainContainer.append(checkbox);
        }

        // CEX Checkboxes
        for (const key in window.CONFIG.CONFIG_CEX) {
            const id = `Scan${key.toUpperCase()}`;
            const label = key.toUpperCase();
            const checkbox = `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" name="set_cex" value="${key}" id="${id}">
                    <label class="form-check-label" for="${id}">${label}</label>
                </div>`;
            $cexContainer.append(checkbox);
        }
    }

    initPNLSignalStructure() {
        // ... implementation from TokenPriceMonitor.initPNLSignalStructure ...
    }

    CellResult(token, cexInfo, dexInfo, direction, cexName, dexName) {
        // ... implementation from TokenPriceMonitor.CellResult ...
    }

    setDexCellLoading(token, cexName, dexName, direction) {
        // ... implementation from TokenPriceMonitor.setDexCellLoading ...
    }

    generateOrderBook(token, priceData, cexName, direction) {
        // ... implementation from TokenPriceMonitor.generateOrderBook ...
    }

    getTokenFormData() {
        const selectedCexs = [];
        $('#token-modal-cex-container input[type="checkbox"]:checked').each(function() {
            selectedCexs.push($(this).val());
        });

        const selectedDexs = [];
        $('#token-modal-dex-container input[type="checkbox"]:checked').each(function() {
            selectedDexs.push($(this).val());
        });

        const modalCexToDex = {};
        $('input[data-cex-modal]').each(function() {
            const cexName = $(this).data('cex-modal');
            modalCexToDex[cexName] = $(this).val();
        });

        const modalDexToCex = {};
        $('input[data-dex-modal]').each(function() {
            const dexName = $(this).data('dex-modal');
            modalDexToCex[dexName] = $(this).val();
        });

        return {
            symbol: $('#tokenSymbol').val().trim().toUpperCase(),
            pairSymbol: $('#pairSymbol').val().trim().toUpperCase(),
            contractAddress: $('#tokenContract').val().trim(),
            pairContractAddress: $('#pairContract').val().trim(),
            decimals: $('#tokenDecimals').val(),
            pairDecimals: $('#pairDecimals').val(),
            chain: $('#tokenChain').val(),
            modalCexToDex: modalCexToDex,
            modalDexToCex: modalDexToCex,
            selectedCexs: selectedCexs,
            selectedDexs: selectedDexs
        };
    }

    updateStats(tokens) {
        // ... implementation from TokenPriceMonitor.updateStats ...
    }

    shortenAddress(address, start = 6, end = 6) {
        if (!address || address.length <= start + end) return address;
        return address.substring(0, start) + "..." + address.substring(address.length - end);
    }
}

window.UI = UI;

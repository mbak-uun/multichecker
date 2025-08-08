class UI {
    
    constructor(app) {
        this.app = app;
        this.currentEditingToken = null;
        this.renderTokenModalForms();
        this.renderSyncKoinModalForms();
        this.renderFormSettingScan();
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
            const row = `
                <div class="form-check d-flex align-items-center mb-2">
                    <input class="form-check-input me-2" type="checkbox" name="sync_cex" value="${cexName}" id="sync_cex_${cexName.toLowerCase()}">
                    <label class="form-check-label me-2" for="sync_cex_${cexName.toLowerCase()}">${cexName}</label>
                    <input type="number" class="form-control form-control-sm w-auto ms-2" name="modal_cex_${cexName}" value="100" min="1" step="0.01" style="max-width:90px;" title="Modal ${cexName}">
                </div>`;
            cexContainer.append(row);
        }

        // DEXs
        window.CONFIG.DexList.forEach(dexName => {
            const row = `
                <div class="form-check d-flex align-items-center mb-2">
                    <input class="form-check-input me-2" type="checkbox" name="sync_dex" value="${dexName.toUpperCase()}" id="sync_dex_${dexName.toLowerCase()}">
                    <label class="form-check-label me-2" for="sync_dex_${dexName.toLowerCase()}">${dexName.toUpperCase()}</label>
                    <input type="number" class="form-control form-control-sm w-auto ms-2" name="modal_dex_${dexName.toLowerCase()}" value="100" min="1" step="0.01" style="max-width:90px;" title="Modal ${dexName}">
                </div>`;
            dexContainer.append(row);
        });
    }

    renderTokenModalForms() {
        const cexContainer = $('#token-modal-cex-container');
        const dexContainer = $('#token-modal-dex-container');
        const chainContainer = $('#token-modal-chain-container');

        cexContainer.empty();
        dexContainer.empty();
        chainContainer.empty();

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
        $('#token-modal-cex-container, #token-modal-dex-container').on('change', 'input[type="checkbox"]', () => this.renderModalInputs());
        $('#saveTokenBtn').on('click', () => this.app.saveToken());
        $('#saveAppSettingsBtn').on('click', (e) => {
            e.preventDefault();
            this.app.saveSettings();
        });
        $('#saveScanSettingsBtn').on('click', (e) => {
            e.preventDefault();
            this.app.saveScanConfig();
        });
        $('#CheckPrice').on('click', () => this.app.startPriceCheck());
        $('#StopScan').on('click', () => this.app.stopPriceCheck());
        $('#autorunBtn').on('click', () => this.app.toggleAutorun());
        $('#sortByToken').on('click', () => this.app.sortTokens());
        $('#tokenSearch').on('input', () => this.app.filterTokens());
        $('.filter-chain-checkbox').on('change', () => this.app.filterTokens());
        $('#exportTokensBtn').on('click', () => this.app.exportTokens());
        $('#importTokensBtn').on('click', () => $('#importTokensInput').click());
        $('#importTokensInput').on('change', (e) => this.app.importTokens(e));

        $(document).on('click', '.edit-token-btn', function() {
            const tokenId = $(this).data('id');
            self.app.editToken(tokenId);
        });

        $(document).on('click', '.delete-token-btn', function() {
            const tokenId = $(this).data('id');
            self.app.deleteToken(tokenId);
        });

        $(document).on('click', '.toggle-status-btn', function() {
            const tokenId = $(this).data('id');
            self.app.toggleTokenStatus(tokenId);
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
    }

    renderTokenTable(tokens) {
        const tbody = $('#tokenTableBody');
        tbody.empty();

        if (!tokens || tokens.length === 0) {
            tbody.html('<tr><td colspan="6" class="text-center py-4 text-muted">Tidak Ada DATA KOIN</td></tr>');
            return;
        }

        const fragment = document.createDocumentFragment();
        tokens.forEach((token, index) => {
            const tr = document.createElement('tr');
            tr.className = 'align-middle token-data-row';

            const modalCexText = Object.entries(token.modalCexToDex || {}).map(([key, value]) => `${key}: $${value}`).join('<br>');
            const modalDexText = Object.entries(token.modalDexToCex || {}).map(([key, value]) => `${key}: $${value}`).join('<br>');
            const statusBtnClass = token.isActive ? 'btn-success' : 'btn-outline-secondary';

            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>
                    <strong>${token.symbol}/${token.pairSymbol}</strong><br>
                    <small class="text-muted">${token.contractAddress}</small>
                </td>
                <td>
                     <span class="badge ${this.getBadgeColor(token.chain, 'chain')}">${token.chain}</span>
                     <div class="btn-group btn-group-sm mt-1" role="group">
                        <button class="btn ${statusBtnClass} toggle-status-btn" data-id="${token.id}" title="Change Status"><i class="bi bi-power"></i></button>
                        <button class="btn btn-outline-primary edit-token-btn" data-id="${token.id}" title="Edit"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-outline-danger delete-token-btn" data-id="${token.id}" title="Delete"><i class="bi bi-trash"></i></button>
                    </div>
                </td>
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

        tbody.append(fragment);
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

    populateTokenForm(token) {
        this.currentEditingToken = token;
        $('#modalTitle').text('Edit Token');
        $('#tokenSymbol').val(token.symbol);
        $('#pairSymbol').val(token.pairSymbol);
        $('#tokenContract').val(token.contractAddress);
        $('#pairContract').val(token.pairContractAddress);
        $('#tokenDecimals').val(token.decimals);
        $('#pairDecimals').val(token.pairDecimals);
        $('#tokenChain').val(token.chain);

        $('input[type="checkbox"]').prop('checked', false);
        (token.selectedCexs || []).forEach(cex => $(`#cex${cex}`).prop('checked', true));
        (token.selectedDexs || []).forEach(dex => $(`#dex${dex.replace(/\s/g, '')}`).prop('checked', true));

        this.renderModalInputs();

        for(const cex in token.modalCexToDex) {
            $(`input[data-cex-modal="${cex}"]`).val(token.modalCexToDex[cex]);
        }
        for(const dex in token.modalDexToCex) {
            $(`input[data-dex-modal="${dex}"]`).val(token.modalDexToCex[dex]);
        }

        $('#tokenModal').modal('show');
    }

    resetTokenForm() {
        this.currentEditingToken = null;
        $('#tokenForm')[0].reset();
        $('#modalTitle').text('Add New Token');
        this.renderModalInputs();
    }

    getBadgeColor(name, type) {
        // ... implementation from TokenPriceMonitor.getBadgeColor ...
        return 'bg-secondary';
    }

    renderFormSettingScan() {
        // ... implementation from UI.renderFormSettingScan ...
    }

    // ... other UI-related methods from TokenPriceMonitor ...
}

window.UI = UI;

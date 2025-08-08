class App {
    constructor() {
        this.state = new State();
        this.ui = new UI(this);
        this.api = new ApiService();

        this.searchKeyword = '';
        this.sortAscending = true;
        this.isAutorun = false;
        this.autorunTimer = null;

        this.init();
    }

    init() {
        if (!this.checkAppRequirements()) return;

        this.ui.InfoSettingApps(this.state.getSettings());
        this.ui.bindEvents();
        // ... other initialization logic from TokenPriceMonitor.init ...

        window.timeoutApi = this.state.getSettings()?.TimeoutCount || 4000;

        this.ui.renderTokenTable(this.state.getTokens());
        this.ui.updateStats(this.state.getTokens());
        this.fetchGasTokenPrices();
        // this.SearchCTokenMonitoring();
        this.ui.generateEmptyTable();
        this.fetchUSDTtoIDRRate();
        // this.initPairSymbolAutocomplete();
    }

    checkAppRequirements() {
        // ... logic from TokenPriceMonitor.checkAppRequirements ...
        // This will need to be adapted to use this.state and this.ui
        return true;
    }

    async checkPrices() {
        this.errorStats = {};
        // this.ui.updateErrorStats(this.errorStats);

        let config = this.state.configScan;

        try {
            await this.fetchGasTokenPrices();
        } catch (err) {
            console.error('Gagal fetchGasTokenPrices:', err);
            this.ui.showAlert('Gagal mengambil harga Gas Token, scan dibatalkan', 'danger');
            return;
        }

        const settings = this.state.getSettings();
        const tokens = this.state.getTokens();

        const allTokenUnits = [];
        tokens.forEach(token => {
            if (!token.isActive) return;
            // Further filtering based on config can be added here
            token.selectedCexs.forEach(cexName => {
                allTokenUnits.push({ ...token, cexName });
            });
        });

        const chunkArray = (arr, size) => {
            const result = [];
            for (let i = 0; i < arr.length; i += size) {
                result.push(arr.slice(i, i + size));
            }
            return result;
        };

        const unitBatches = chunkArray(allTokenUnits, settings.tokensPerBatch || 5);

        for (const batch of unitBatches) {
            await Promise.allSettled(batch.map(async tokenUnit => {
                const priceData = {
                    token: tokenUnit,
                    analisis_data: {
                        cex_to_dex: {},
                        dex_to_cex: {}
                    }
                };

                await this.api.fetchCEXPrices(tokenUnit, priceData, tokenUnit.cexName, 'cex_to_dex');
                // this.ui.generateOrderBook(tokenUnit, priceData, tokenUnit.cexName, 'cex_to_dex');

                for (const dexName of tokenUnit.selectedDexs) {
                    await this.api.fetchDEXPrices(tokenUnit, priceData, dexName, tokenUnit.cexName, 'cex_to_dex');
                    await this.api.fetchCEXPrices(tokenUnit, priceData, tokenUnit.cexName, 'dex_to_cex');
                    // this.ui.generateOrderBook(tokenUnit, priceData, tokenUnit.cexName, 'dex_to_cex');
                    await this.api.fetchDEXPrices(tokenUnit, priceData, dexName, tokenUnit.cexName, 'dex_to_cex');
                }
            }));
            await new Promise(resolve => setTimeout(resolve, settings.delayBetweenGrup || 500));
        }
    }

    // ... other methods from TokenPriceMonitor that represent business logic ...

    startPriceCheck() {
        // This will be called by the UI event handler
        this.checkPrices();
    }

    stopPriceCheck() {
        // This will be called by the UI event handler
    }

    saveToken() {
        const formData = this.ui.getTokenFormData();
        if (!this.ui.validateTokenForm(formData)) {
            return;
        }
        if (this.ui.currentEditingToken) {
            this.state.updateToken(this.ui.currentEditingToken.id, formData);
        } else {
            this.state.addToken(formData);
        }
        this.ui.renderTokenTable(this.state.getTokens());
        this.ui.updateStats(this.state.getTokens());
        $('#tokenModal').modal('hide');
    }

    saveSettings() {
        const settings = this.ui.getSettingsFormData();
        if(settings){
            this.state.saveSettings(settings);
            this.ui.showAlert('✅ SIMPAN SETINGAN APLIKASI BERHASIL!', 'success');
            location.reload();
        }
    }

    async fetchGasTokenPrices() {
        // ... implementation from TokenPriceMonitor.fetchGasTokenPrices ...
    }

    fetchUSDTtoIDRRate() {
        // ... implementation from TokenPriceMonitor.fetchUSDTtoIDRRate ...
    }

    logAction(message) {
        // ... implementation from TokenPriceMonitor.logAction ...
    }
}

$(document).ready(function() {
    window.app = new App();
});

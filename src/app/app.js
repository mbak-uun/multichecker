class App {
    constructor() {
        this.state = new State();
        this.ui = new UI(this);
        this.api = new ApiService();

        this.searchKeyword = '';
        this.sortAscending = true;
        this.isAutorun = false;
        this.autorunTimer = null;
        this.isScanning = false;

        this.init();
    }

    init() {
        this.ui.applyTheme(this.state.selectTheme);
        if (!this.checkAppRequirements()) return;

        this.ui.InfoSettingApps(this.state.getSettings());
        this.ui.InfoConfigScan(this.state.getConfigScan(), this.state.getKoinScanner());
        this.ui.renderFormSettingScan(this.state.getMasterTokens());

        window.timeoutApi = this.state.getSettings()?.TimeoutCount || 4000;

        this.ui.renderTokenTable(this.state.getTokens());
        this.ui.updateStats(this.state.getTokens());
        this.fetchGasTokenPrices();
        this.fetchUSDTtoIDRRate();
        this.ui.generateEmptyTable(this.state.getTokens(), this.state.getConfigScan());
        this.logAction(`APP INITIALIZED`);
    }

    checkAppRequirements() {
        const requirements = [
            { data: this.state.getSettings(), message: '⚠️ SILAKAN SETTING APLIKASI TERLEBIH DAHULU.' },
            { data: this.state.getMasterTokens(), message: '⚠️ SILAKAN SINKRONISASI DATA KOIN !!!' },
            { data: this.state.getConfigScan(), message: '⚠️ SILAKAN KONFIGURASI KOIN SCANNER' },
            { data: this.state.getKoinScanner(), message: '⚠️ SILAKAN TENTUKAN KOIN ( MEMILIH CHAIN & EXCHANGER )' }
        ];

        for (const { data, message } of requirements) {
            const isEmpty = (
                data == null ||
                (Array.isArray(data) && data.length === 0) ||
                (typeof data === 'object' && Object.keys(data).length === 0)
            );
            if (isEmpty) {
                this.ui.showAlert(message, 'danger');
                this.ui.disableTabs();
                return false;
            }
        }
        return true;
    }

    async startPriceCheck() {
        if (this.isScanning) {
            this.ui.showAlert("⚠️ SCAN MASIH JALAN..SILAKAN STOP DAHULU", 'warning');
            return;
        }
        this.isScanning = true;
        this.ui.toggleScanButtons(true);

        try {
            await this.fetchGasTokenPrices();
        } catch (err) {
            console.error('Gagal fetchGasTokenPrices:', err);
            this.ui.showAlert('Gagal mengambil harga Gas Token, scan dibatalkan', 'danger');
            this.stopPriceCheck();
            return;
        }

        this.ui.initPNLSignalStructure();

        const tokensToScan = this.state.getKoinScanner();
        if (tokensToScan.length === 0) {
            this.ui.showAlert('Tidak ada token untuk di-scan berdasarkan konfigurasi saat ini.', 'info');
            this.stopPriceCheck();
            return;
        }

        this.ui.generateEmptyTable(tokensToScan, this.state.getConfigScan());

        await this.runScanLoop(tokensToScan);

        if (this.isAutorun && this.isScanning) {
            this.ui.startAutorunCountdown(() => this.startPriceCheck());
        } else {
            this.stopPriceCheck();
        }
    }

    async runScanLoop(tokens) {
        const settings = this.state.getSettings();
        const { tokensPerBatch, delayBetweenGrup } = settings;

        const chunkArray = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));
        const batches = chunkArray(tokens, tokensPerBatch);

        let processedCount = 0;
        const totalCount = tokens.length;

        for (const batch of batches) {
            if (!this.isScanning) break;

            await Promise.allSettled(batch.map(async (token) => {
                if (!this.isScanning) return;

                const priceData = { token, analisis_data: { cex_to_dex: {}, dex_to_cex: {} } };

                const cexs = token.selectedCexs || [];
                for (const cexName of cexs) {
                    await this.api.fetchCEXPrices(token, priceData, cexName, 'cex_to_dex');
                    this.ui.generateOrderBook(token, priceData, cexName, 'cex_to_dex');

                    for (const dexName of token.selectedDexs) {
                         if (!this.isScanning) break;
                        await this.processTradePath(token, priceData, dexName, cexName, 'cex_to_dex');
                        await this.processTradePath(token, priceData, dexName, cexName, 'dex_to_cex');
                    }
                }
                processedCount++;
                this.ui.updateProgressBar(processedCount, totalCount, token.symbol);
            }));

            if (this.isScanning) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenGrup));
            }
        }
    }

    async processTradePath(token, priceData, dexName, cexName, direction) {
        try {
            this.ui.setDexCellLoading(token, cexName, dexName, direction);
            const result = await this.api.fetchDEXPrice(token, priceData, dexName, cexName, direction);
            if(result) {
                this.ui.CellResult(token, priceData.analisis_data[direction][cexName], result, direction, cexName, dexName);
            }
        } catch (error) {
            console.error(`Error processing ${direction} for ${token.symbol} ${dexName}/${cexName}:`, error);
            this.ui.CellResult(token, priceData.analisis_data[direction][cexName], { error: error.message || 'Error' }, direction, cexName, dexName);
        }
    }

    stopPriceCheck() {
        this.isScanning = false;
        this.isAutorun = false;
        this.ui.toggleScanButtons(false);
        this.ui.clearAutorun();
        this.ui.showAlertWithAudio();
    }

    toggleAutorun() {
        this.isAutorun = !this.isAutorun;
        this.ui.updateAutorunButton(this.isAutorun);
    }

    saveToken() {
        const formData = this.ui.getTokenFormData();
        // Validation can be added here
        if (this.ui.currentEditingToken) {
            this.state.updateToken(this.ui.currentEditingToken.id, formData);
            this.ui.showAlert('Token berhasil diperbarui', 'success');
        } else {
            this.state.addToken(formData);
            this.ui.showAlert('Token berhasil ditambahkan', 'success');
        }
        this.ui.renderTokenTable(this.state.getTokens());
        this.ui.updateStats(this.state.getTokens());
        $('#tokenModal').modal('hide');
        this.ui.resetTokenForm();
    }

    editToken(tokenId) {
        const token = this.state.getTokens().find(t => t.id === tokenId);
        if (token) {
            this.ui.populateTokenForm(token);
        }
    }

    deleteToken(tokenId) {
        if (confirm('Apakah Anda yakin ingin menghapus token ini?')) {
            this.state.deleteToken(tokenId);
            this.ui.renderTokenTable(this.state.getTokens());
            this.ui.updateStats(this.state.getTokens());
            this.ui.showAlert('Token berhasil dihapus', 'danger');
        }
    }

    toggleTokenStatus(tokenId) {
        this.state.toggleTokenStatus(tokenId);
        this.ui.renderTokenTable(this.state.getTokens());
        this.ui.updateStats(this.state.getTokens());
    }

    saveSettings() {
        const newSettings = this.ui.getSettingsFormData();
        // Validation can be added here
        this.state.saveSettings(newSettings);
        this.ui.showAlert('Pengaturan aplikasi berhasil disimpan', 'success');
        this.logAction('SAVE APP SETTINGS');
        setTimeout(() => location.reload(), 500);
    }

    saveScanConfig() {
        const config = this.ui.getScanConfigFormData();
        this.state.saveScanConfig(config);
        this.state.updateSelectedKoin();
        this.ui.showAlert('Konfigurasi pindai berhasil disimpan', 'success');
        this.logAction('SAVE SCAN CONFIG');
        setTimeout(() => location.reload(), 500);
    }

    async fetchGasTokenPrices() {
        // ... (implementation can be moved here from the old script)
    }

    fetchUSDTtoIDRRate() {
        // ... (implementation can be moved here)
    }

    logAction(message) {
        const now = new Date();
        const timestamp = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
        const fullMessage = `${timestamp} - ${message}`;
        LocalStorageUtil.set("HISTORTY_ACTION", fullMessage);
        this.ui.updateLogStatus(fullMessage);
    }
}

$(document).ready(function() {
    window.app = new App();
});

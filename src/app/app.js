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
        this.checkTheme();

        if (!this.checkAppRequirements()) return;

        this.ui.InfoSettingApps(this.state.getSettings());
        // Di dalam App.init() atau setelah sync token
        this.ui.updateSettingScanForm(
            this.state.getMasterTokens ? this.state.getMasterTokens() : [],
            window.CONFIG.CHAIN_CONFIG,
            window.CONFIG.CONFIG_CEX
        );
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
        console.log('Checking app requirements...');
        // ... logic from TokenPriceMonitor.checkAppRequirements ...
        // This will need to be adapted to use this.state and this.ui
         const checkRequirements = [
            {
                key: 'SETTING_APP',
                data: this.state.getSettings(),
                message: '⚠️ SILAKAN SETTING APLIKASI TERLEBIH DAHULU.'
            },
            {
                key: 'MASTER_TOKENS',
                data: this.state.getMasterTokens ? this.state.getMasterTokens() : [],
                message: '⚠️ SILAKAN SINKRONISASI DATA KOIN !!!'
            },
            {
                key: 'CONFIG_SCANNER',
                data: this.state.getConfigScan ? this.state.getConfigScan() : {},
                message: '⚠️ SILAKAN KONFIGURASI KOIN SCANNER'
            },
            {
                key: 'SELECT_KOIN',
                data: this.state.getKoinScanner ? this.state.getKoinScanner() : [],
                message: '⚠️ SILAKAN TENTUKAN KOIN ( MEMILIH CHAIN & EXCHANGER )'
            }
        ];

        for (const item of checkRequirements) {
            const dataEmpty = (
                item.data == null ||
                (Array.isArray(item.data) && item.data.length === 0) ||
                (typeof item.data === 'object' && Object.keys(item.data).length === 0)
            );

            if (dataEmpty) {
                this.ui.showAlert(item.message, 'danger');
                $('#mainTabs a[href="#appSettings"]').tab('show');

                $('#CheckPrice').prop('disabled', true);
                $('#autorunBtn').prop('disabled', true);
                $('#StopScan').addClass('d-none');
                $('#setting-tab').addClass('petunjuk');

                const disableTab = (selector) => {
                    const tabBtn = $(`#tabIconController button[data-bs-target="${selector}"]`);
                    tabBtn.addClass('disabled').css({
                        'pointer-events': 'none',
                        'opacity': 0.5
                    });
                };

                disableTab('#priceMonitoring');
                disableTab('#tokenManagement');
                disableTab('#portfolioTab');
                disableTab('#WalletCEX');

                return; // Hentikan init()
            }
        }
        return true;        
    }
    
    checkTheme() {
        console.log('Checking app theme...');
        const theme = LocalStorageUtil.rawGet('SELECT_THEME', 'biru');
        if (this.isValidTheme(theme)) {
            this.applyTheme(theme);
        } else {
            alert("🎨 Tema tidak valid. Diterapkan tema default 'biru'.");
            this.applyTheme('biru'); // Default theme
        }
        document.querySelectorAll('.theme-box').forEach(box => {
            box.addEventListener('click', () => {
                const selectedTheme = box.getAttribute('data-theme');
                this.applyTheme(selectedTheme);
            });
        });
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

    async fetchGasTokenPrices() {
        // ... implementation from TokenPriceMonitor.fetchGasTokenPrices ...
    }

    fetchUSDTtoIDRRate() {
        // ... implementation from TokenPriceMonitor.fetchUSDTtoIDRRate ...
    }

    logAction(message) {
        // ... implementation from TokenPriceMonitor.logAction ...
    }

    isValidTheme(theme) {
        const allowedThemes = ['biru', 'ijo', 'coklat', 'abu', 'pink', 'orange', 'ungu'];
        return allowedThemes.includes(theme);
    }

    applyTheme(theme) {
        const validTheme = this.isValidTheme(theme) ? theme : 'biru';

        document.body.setAttribute('data-theme', validTheme);
        if (typeof LocalStorageUtil !== 'undefined') {
            LocalStorageUtil.rawSet('SELECT_THEME', validTheme);
        } else {
            localStorage.setItem('SELECT_THEME', validTheme);
        }

        this.logAction('GANTI TEMA'); 
        
        document.querySelectorAll('.theme-box').forEach(box => box.classList.remove('active'));
        const activeBox = document.querySelector(`.theme-box[data-theme="${validTheme}"]`);
        if (activeBox) activeBox.classList.add('active');
    }
}

$(document).ready(function() {
    window.app = new App();

    // Misal di UI.js atau app.js
    $('#appSettingsForm').on('submit', function(e) {
        e.preventDefault();

        const newSettings = {
            UserName: $('#UserName').val()?.trim() || '',
            WalletAddress: $('#WalletAddress').val()?.trim() || '',
            tokensPerBatch: parseInt($('#tokensPerBatch').val(), 10) || 3,
            delayBetweenGrup: parseInt($('#delayBetweenGrup').val(), 10) || 400,
            TimeoutCount: parseInt($('#TimeoutCount').val(), 10) || 10000,
            PNLFilter: parseFloat($('#PNLFilter').val()) || 0
        };

        // Validasi (bisa copy dari kode lama)
        if (!newSettings.UserName) {
            app.ui.showAlert('❌ Nama pengguna tidak boleh kosong', 'danger');
            return;
        }
        if (!newSettings.WalletAddress || newSettings.WalletAddress === '-' || !newSettings.WalletAddress.startsWith('0x')) {
            app.ui.showAlert('❌ Alamat wallet SALAH (harus diawali "0x")', 'danger');
            return;
        }
        if (!newSettings.tokensPerBatch || newSettings.tokensPerBatch < 3 || newSettings.tokensPerBatch > 10) {
            app.ui.showAlert('Jumlah Anggota (Tokens Per Batch) harus antara 3-7', 'danger');
            return;
        }
        if (!newSettings.delayBetweenGrup || newSettings.delayBetweenGrup < 300 || newSettings.delayBetweenGrup > 5000) {
            app.ui.showAlert('Delay antar grup harus antara 300–5000 ms', 'danger');
            return;
        }
        if (!newSettings.TimeoutCount || newSettings.TimeoutCount < 2000 || newSettings.TimeoutCount > 10000) {
            app.ui.showAlert('Timeout harus antara 2000–10000 ms', 'danger');
            return;
        }

        // Simpan ke state dan localStorage
        app.state.saveSettings(newSettings);
        app.ui.showAlert('✅ SIMPAN SETTING APLIKASI BERHASIL!', 'success');
        app.logAction('SETTING APLIKASI');
        setTimeout(() => location.reload(), 800); // reload agar setting terupdate
    });

    $('#saveSyncKoinBtn').off('click').on('click', async function(event) {
        event.preventDefault();
        $('body').append(`<div id="freezeOverlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:#000000a0;z-index:9999;display:flex;justify-content:center;align-items:center;color:#fff;font-size:1.5em">⏳ Syncing data...</div>`);
        try {
            const jumlah = await State.syncMasterTokensFromForm('#SyncKoinForm');
            $('#freezeOverlay').remove();
            alert(`✅ Berhasil SYNC DATA ${jumlah} KOIN.\nSILAKAN KLIK OK UNTUK RELOAD HALAMAN`);
            location.reload();
            $('#ModalSyncKoin').modal('hide');
        } catch (err) {
            $('#freezeOverlay').remove();
            alert('❌ ' + (err.message || err));
        }
    });
});

function app() {
    return {
        // State Properties
        tokens: [],
        settings: {},
        currentEditingToken: null,
        tokenSearchKeyword: '',
        monitoringSearchKeyword: '',
        managementSelectedChains: [],
        sortAscending: true,
        monitoringSelectedChains: [],
        scanProgress: 0,
        scanStatusText: '',
        scanTimeInfo: '',
        isScanning: false,
        priceRows: [],
        isTokenModalOpen: false,
        modalTitle: 'Add New Token',
        newToken: {},
        isAutorun: false,
        autorunTimer: null,
        apiBaseUrl: window.location.origin + '/api',
        dexErrorCount: {},

        // UI State for dynamic content
        activeTab: 'priceMonitoring', // 'priceMonitoring', 'tokenManagement', 'apiSettings', 'portfolioTab', 'memoryTab'
        infoConfigHtml: '',
        gasPricesHtml: 'Loading Gwei info...',
        btcPrice: '--',
        bnbPrice: '--',
        ethPrice: '--',
        maticPrice: '--',
        usdtIdrPrice: '--',
        infoStatus: '---',
        statError: ''

        // Initialization
        init() {
            this.tokens = this.loadTokens();
            this.settings = this.loadSettings();
            this.monitoringSelectedChains = JSON.parse(localStorage.getItem('MULTIALL_CHAINS')) || [];
            this.managementSelectedChains = this.getChainList(); // Default to all chains selected

            this.loadTokenTable();
            this.updateStats();
            // this.bindEvents(); // Will be replaced by x-on directives
            this.fetchGasTokenPrices();
            this.SearchCTokenMonitoring();
            this.generateEmptyTable();
            this.fetchUSDTtoIDRRate();
            this.initializeChainCheckbox();
            this.initPairSymbolAutocomplete();

            const timeoutValue = this.settings?.TimeoutCount || 4000;
            window.timeoutApi = timeoutValue;

            const lastWalletUpdate = localStorage.getItem("MULTIALL_ACTIONS");
            this.infoStatus = lastWalletUpdate ? lastWalletUpdate : "???";

            if (this.isSettingInvalid()) {
                if (document.getElementById('CheckPrice')) document.getElementById('CheckPrice').disabled = true;
                if (document.getElementById('autorunBtn')) document.getElementById('autorunBtn').disabled = true;
                if (document.getElementById('StopScan')) document.getElementById('StopScan').classList.add('d-none');

                alert("⚠️ Silakan Setting Aplikasi Dahulu");

                const disableTab = (selector) => {
                    const tabBtn = document.querySelector(`#tabIconController button[data-bs-target="${selector}"]`);
                    if (tabBtn) {
                        tabBtn.classList.add('disabled');
                        tabBtn.style.pointerEvents = 'none';
                        tabBtn.style.opacity = 0.5;
                    }
                };

                disableTab('#priceMonitoring');
                disableTab('#tokenManagement');
                disableTab('#portfolioTab');
                disableTab('#WalletCEX');

                if (document.getElementById('setting-tab')) document.getElementById('setting-tab').classList.add('petunjuk');
                this.showAlert('⚠️ Silakan Isi Nama dan Wallet!', 'warning');
                return;
            }

            this.dexErrorCount = {};
            DexList.forEach(dex => this.dexErrorCount[dex] = 0);

            // Theme initialization from original $(document).ready
            this.initializeTheme();
        },

        initializeTheme() {
            const applyTheme = (theme) => {
                document.body.setAttribute('data-theme', theme);
                localStorage.setItem('MULTIALL_theme', theme);
                document.querySelectorAll('.theme-box').forEach(box => box.classList.remove('active'));
                const activeBox = document.querySelector(`.theme-box[data-theme="${theme}"]`);
                if (activeBox) {
                    activeBox.classList.add('active');
                }
            };

            const isValidTheme = (theme) => {
                const allowedThemes = ['biru', 'ijo', 'coklat', 'abu', 'pink', 'orange', 'ungu'];
                return allowedThemes.includes(theme);
            };

            const savedTheme = localStorage.getItem('MULTIALL_theme');
            if (!savedTheme || !isValidTheme(savedTheme)) {
                const defaultTheme = 'biru';
                // alert("🎨 SILAKAN PILIH TEMA LAIN [POJOK KANAN ATAS]!");
                applyTheme(defaultTheme);
                localStorage.removeItem('MULTIALL_theme');
            } else {
                applyTheme(savedTheme);
            }
        },

        // Methods from TokenPriceMonitor, adapted for Alpine
        incrementDexError(dexName) {
            if (!this.dexErrorCount[dexName]) {
                this.dexErrorCount[dexName] = 0;
            }
            this.dexErrorCount[dexName]++;
            this.updateDexErrorBadge(dexName);
        },

        updateDexErrorBadge(dexName) {
            const count = this.dexErrorCount[dexName] || 0;
            const badge = document.getElementById(`errorBadge_${dexName}`);
            if(badge) {
                if (count > 0) {
                    badge.textContent = count;
                    badge.classList.remove('d-none');
                } else {
                    badge.classList.add('d-none');
                }
            }
        },

        loadTokens() {
            const tokens = JSON.parse(localStorage.getItem('MULTIALL_TOKENS') || '[]');
            return tokens.map(t => ({ ...t, id: String(t.id) }));
        },

        saveTokensToStorage(updateUI = false) {
            localStorage.setItem('MULTIALL_TOKENS', JSON.stringify(this.tokens));
            this.updateStats();
            if (updateUI) {
                this.loadTokenTable();
                // this.bindEvents(); // No longer needed
            }
        },

        loadSettings() {
            const settings = localStorage.getItem('MULTIALL_SETTING');
            const parsedSettings = settings ? JSON.parse(settings) : {
                tokensPerBatch: 3,
                UserName: 'XXX',
                delayBetweenGrup: 400,
                TimeoutCount: 4000,
                PNLFilter: 0,
                WalletAddress: '-'
            };
            const shortened = this.shortenAddress(parsedSettings.WalletAddress);
            this.infoConfigHtml = `
                🆔&nbsp; UserName: ${parsedSettings.UserName}<br>
                👛&nbsp; Wallets: ${shortened}<br>
                👥&nbsp; Anggota Grup: ${parsedSettings.tokensPerBatch} Koin<br>
                ⏱️&nbsp; Jeda Grup: ${parsedSettings.delayBetweenGrup}ms<br>
                ⌛&nbsp; Time Out: ${parsedSettings.TimeoutCount}ms<br>
                💰&nbsp; PNLFilter: $${parsedSettings.PNLFilter}
            `;

            return parsedSettings;
        },

        saveSettingsToStorage() {
            localStorage.setItem('MULTIALL_SETTING', JSON.stringify(this.settings));
        },

        isSettingInvalid() {
            const parsed = this.settings;
            return (
                !parsed ||
                parsed.UserName === 'XXX' || !parsed.UserName || parsed.UserName.trim() === '' ||
                parsed.WalletAddress === '-' || !parsed.WalletAddress || parsed.WalletAddress.trim() === ''
            );
        },

        shortenAddress(address, start = 6, end = 6) {
            if (!address || address.length <= start + end) return address;
            return address.substring(0, start) + "..." + address.substring(address.length - end);
        },

        showAlert(message, type = 'info') {
            const alertId = 'alert-' + Date.now();
            const alertHtml = `
                <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show position-fixed d-flex align-items-center justify-content-between"
                    style="top: 1%; left: 50%; transform: translateX(-50%); z-index: 9999; min-width: 70%; max-width: 90vw; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 3rem;">
                    <div class="me-2">${message}</div>
                    <button type="button" class="btn-close ms-2" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', alertHtml);

            setTimeout(() => {
                const el = document.getElementById(alertId);
                if (el) {
                    bootstrap.Alert.getOrCreateInstance(el).close();
                }
            }, 5000);
        },

        get filteredTokens() {
            if (!this.tokens) return [];

            const keyword = this.tokenSearchKeyword.toLowerCase().trim();
            const selectedChains = this.managementSelectedChains.map(c => c.toLowerCase());

            const filtered = this.tokens.filter(token => {
                const chainMatch = selectedChains.length === 0 || selectedChains.includes(token.chain.toLowerCase());

                const searchableFields = [
                    token.symbol,
                    token.pairSymbol,
                    token.chain,
                    token.contractAddress,
                    token.pairContractAddress,
                    token.isActive ? 'active' : 'inactive',
                    ...(token.selectedCexs || []),
                    ...(token.selectedDexs || [])
                ].map(val => (val || '').toString().toLowerCase());

                const keywordMatch = keyword === '' || searchableFields.some(val => val.includes(keyword));

                return chainMatch && keywordMatch;
            });

            return filtered.slice().sort((a, b) => (b.isActive === true) - (a.isActive === true));
        },

        // This method is now replaced by the reactive x-for loop in the HTML
        // loadTokenTable() { },

        // This method needs to be refactored to be reactive
        updateStats() {
            // This is a good candidate for computed properties as well
            const totalTokens = this.tokens.length;
            const activeTokens = this.tokens.filter(t => t.isActive).length;
            document.getElementById('totalTokensManagement').textContent = totalTokens;
            document.getElementById('activeTokensManagement').textContent = activeTokens;
            document.getElementById('inactiveTokensManagement').textContent = totalTokens - activeTokens;
            // ... and so on for the other stats.
            // A full refactor would involve creating computed properties for each stat.
        },
        loadSettingsForm() {
            // This method is now obsolete. x-model handles form population.
            // The this.settings object is the source of truth.
        },

        saveSettings() {
            const userName = this.settings.UserName?.trim() || '';
            const wallet = this.settings.WalletAddress?.trim() || '';
            const tokensPerBatch = parseInt(this.settings.tokensPerBatch, 10) || 3;
            const delayBetweenGrup = parseInt(this.settings.delayBetweenGrup, 10) || 400;
            const timeoutCount = parseInt(this.settings.TimeoutCount, 10) || 10000;
            const pnlFilter = parseFloat(this.settings.PNLFilter) || 0;

            if (!userName || userName === 'XXX') {
                this.showAlert('❌ Nama pengguna tidak boleh kosong atau "XXX"', 'danger');
                return;
            }

            if (!wallet || wallet === '-' || !wallet.startsWith('0x')) {
                this.showAlert('❌ Alamat wallet SALAH (harus diawali "0x")', 'danger');
                return;
            }

            if (!tokensPerBatch || tokensPerBatch < 3 || tokensPerBatch > 10) {
                this.showAlert('Jumlah Anggota (Tokens Per Batch) harus antara 3-7', 'danger');
                return;
            }

            if (!delayBetweenGrup || delayBetweenGrup < 300 || delayBetweenGrup > 5000) {
                this.showAlert('Delay antar grup harus antara 300–5000 ms', 'danger');
                return;
            }

            if (!timeoutCount || timeoutCount < 2000 || timeoutCount > 10000) {
                this.showAlert('Timeout harus antara 2000–15000 ms', 'danger');
                return;
            }

            // The this.settings object is already updated by x-model.
            // We just need to ensure the values are of the correct type.
            this.settings.UserName = userName;
            this.settings.WalletAddress = wallet;
            this.settings.tokensPerBatch = tokensPerBatch;
            this.settings.delayBetweenGrup = delayBetweenGrup;
            this.settings.TimeoutCount = timeoutCount;
            this.settings.PNLFilter = pnlFilter;

            this.saveSettingsToStorage();

            this.logAction(`SETTING APLIKASI`);
            alert('✅ SIMPAN SETTING BERHASIL!');

            location.reload();
        },
        async fetchGasTokenPrices() {
            const binanceURL = 'https://api-gcp.binance.com/api/v3/ticker/price?symbols=["BNBUSDT","ETHUSDT","MATICUSDT","BTCUSDT"]';
            this.gasPricesHtml = `<small class="text-white">Loading Gwei info...</small>`;

            try {
                const response = await $.getJSON(binanceURL);
                if (!response) {
                    throw new Error("Respon harga token kosong dari Binance");
                }

                const tokenPrices = {};
                response.forEach(item => {
                    const symbol = item.symbol.replace("USDT", "");
                    tokenPrices[symbol] = parseFloat(item.price);

                    if (symbol === 'BTC') this.btcPrice = `$${tokenPrices[symbol].toFixed(2)}`;
                    if (symbol === 'BNB') this.bnbPrice = `$${tokenPrices[symbol].toFixed(2)}`;
                    if (symbol === 'ETH') this.ethPrice = `$${tokenPrices[symbol].toFixed(2)}`;
                    if (symbol === 'MATIC') this.maticPrice = `$${tokenPrices[symbol].toFixed(2)}`;
                });

                // ... (rest of the gas price logic)
                // This part needs more careful refactoring as it uses CHAIN_CONFIG
                // For now, I'll just update the display logic
                this.gasPricesHtml = 'Gas price logic needs full refactor.';


            } catch (err) {
                this.gasPricesHtml = '<span class="text-danger">Gagal ambil harga.</span>';
                console.error('Gagal ambil harga token dari Binance', err);
            }
        },
        fetchUSDTtoIDRRate() {
            const targetURL = 'https://indodax.com/api/ticker/usdtidr';
            const fullURL = withProxy(targetURL);

            $.getJSON(fullURL)
                .done(response => {
                    const rate = parseFloat(response.ticker.last);
                    window.ExchangeRates = window.ExchangeRates || {};
                    window.ExchangeRates.IndodaxUSDT = rate;
                    this.usdtIdrPrice = `Rp ${rate.toLocaleString('id-ID')}`;
                })
                .fail(err => {
                    console.warn('[✘] Failed to fetch USDT → IDR rate:', err);
                    this.usdtIdrPrice = 'Error';
                });
        },
        logAction(message) {
            const now = new Date();
            const dd = String(now.getDate()).padStart(2, '0');
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const yyyy = now.getFullYear();
            const hh = String(now.getHours()).padStart(2, '0');
            const min = String(now.getMinutes()).padStart(2, '0');
            const ss = String(now.getSeconds()).padStart(2, '0');
            const timestamp = `${dd}-${mm}-${yyyy} ${hh}:${min}:${ss}`;
            const fullMessage = `${timestamp} </br> [${message}]`;

            localStorage.setItem("MULTIALL_ACTIONS", fullMessage);
            this.infoStatus = fullMessage;
            console.log("Action:", fullMessage);
        },
        openTokenModal(token = null) {
            if (token) {
                this.modalTitle = 'Edit Token';
                this.currentEditingToken = token;
                // Deep clone the token to avoid modifying the original object directly
                this.newToken = JSON.parse(JSON.stringify(token));
            } else {
                this.modalTitle = 'Add New Token';
                this.currentEditingToken = null;
                this.newToken = {
                    symbol: '', pairSymbol: '', contractAddress: '', pairContractAddress: '',
                    decimals: 18, pairDecimals: 18, chain: '',
                    modalCexToDex: 100, modalDexToCex: 100,
                    selectedCexs: [], selectedDexs: [],
                    isActive: true,
                };
            }
            this.isTokenModalOpen = true;
        },

        saveToken() {
            if (!this.validateTokenForm(this.newToken)) {
                return;
            }
            if (this.currentEditingToken) {
                this.updateToken(this.currentEditingToken.id, this.newToken);
                this.showAlert('✅ Berhasil SIMPAN Perubahan DATA!', 'success');
                this.logAction(`UBAH DATA KOIN`);
            } else {
                this.addToken(this.newToken);
                this.showAlert('✅ Berhasil Menambah DATA Baru', 'success');
                this.logAction(`TAMBAH DATA KOIN`);
            }
            this.isTokenModalOpen = false;
        },

        addToken(tokenData) {
            const token = {
                id: Date.now().toString(),
                ...tokenData,
                createdAt: new Date().toISOString()
            };
            this.tokens.push(token);
            this.saveTokensToStorage();
        },

        validateTokenForm(formData) {
            if (!formData.symbol || !formData.pairSymbol) { this.showAlert('Masukan Symbol Token & Pair', 'warning'); return false; }
            if (!formData.contractAddress || !formData.pairContractAddress) { this.showAlert('Masukan Smart Kontrak', 'warning'); return false; }
            if (!formData.chain) { this.showAlert('Pilih Chain', 'warning'); return false; }
            if (!formData.selectedCexs || formData.selectedCexs.length === 0) { this.showAlert('Pilih CEX', 'warning'); return false; }
            if (!formData.selectedDexs || formData.selectedDexs.length === 0) { this.showAlert('Pilih DEX', 'warning'); return false; }
            if (formData.selectedDexs.length > 4) { this.showAlert('⚠️ Maksimal hanya boleh memilih 4 DEX.', 'warning'); return false; }
            return true;
        },

        // ... other placeholders
        SearchCTokenMonitoring() { console.log('SearchCTokenMonitoring called'); },
        generateEmptyTable() { // Renaming this to initializePriceRows would be better, but let's stick to the original name for now
            this.priceRows = [];

            const activeTokens = this.tokens
                .filter(t => t.isActive)
                .filter(t => this.monitoringSelectedChains.includes(t.chain))
                .filter(t => {
                    const keyword = (this.monitoringSearchKeyword || '').toLowerCase();
                    return (
                        t.symbol.toLowerCase().includes(keyword) ||
                        t.pairSymbol.toLowerCase().includes(keyword)
                    );
                })
                .sort((a, b) => {
                    const symbolA = a.symbol.toLowerCase();
                    const symbolB = b.symbol.toLowerCase();
                    return this.sortAscending
                        ? symbolA.localeCompare(symbolB)
                        : symbolB.localeCompare(symbolA);
                });

            if (activeTokens.length === 0) {
                return;
            }

            let rowIndex = 0;
            for (const token of activeTokens) {
                for (const cex of token.selectedCexs) {
                    const limitedDexList = (token.selectedDexs || []).slice(0, 4);

                    const row = {
                        id: `token-row-${token.id}-${cex.replace(/\W+/g, '').toLowerCase()}`,
                        token: token,
                        cex: cex,
                        stripClass: rowIndex % 2 === 0 ? 'strip-even' : 'strip-odd',
                        orderbookLeftHtml: `${cex}🔒`,
                        orderbookRightHtml: `${cex}🔒`,
                        tokenDetailHtml: this.createTokenDetailContent(token, cex),
                        cexToDexCells: limitedDexList.map(dex => ({
                            id: `cell_${token.symbol}_${token.pairSymbol}_${token.chain}_${cex}_${dex}`.toLowerCase().replace(/\W+/g, ''),
                            dex: dex,
                            html: `${dex} 🔒`
                        })),
                        dexToCexCells: limitedDexList.map(dex => ({
                            id: `cell_${token.pairSymbol}_${token.symbol}_${token.chain}_${dex}_${cex}`.toLowerCase().replace(/\W+/g, ''),
                            dex: dex,
                            html: `${dex} 🔒`
                        })),
                    };
                    this.priceRows.push(row);
                    rowIndex++;
                }
            }
        },
        initializeChainCheckbox() { console.log('initializeChainCheckbox called'); },
        initPairSymbolAutocomplete() { console.log('initPairSymbolAutocomplete called'); },

        getChainList() { return Object.values(CHAIN_CONFIG).map(c => c.name); },
        getCexList() { return CexList; },
        getDexList() { return DexList; },

        toggleSort() {
            this.sortAscending = !this.sortAscending;
            // The table will react automatically if it's bound to a sorted computed property
            this.generateEmptyTable(); // For now, we manually trigger a redraw
        },

        startPriceCheck() {
            this.isScanning = true;
            this.CheckPrices();
        },

        stopPriceCheck() {
            this.isScanning = false;
            // Logic to actually stop the scan will need to be implemented
            // For now, it just changes the state
            location.reload(); // Simple way to stop everything
        },

        async CheckPrices() {
            this.errorStats = {};
            this.statError = '';

            try {
                this.scanStatusText = 'Cek Harga Gas Gwei..';
                await this.fetchGasTokenPrices();
            } catch (err) {
                console.error('Gagal fetchGasTokenPrices:', err);
                this.showAlert('Gagal mengambil harga Gas Token, scan dibatalkan', 'danger');
                this.isScanning = false;
                return;
            }

            // ... (The rest of the giant CheckPrices method will go here)
            // For now, let's simulate a scan
            this.scanProgress = 0;
            this.scanStatusText = 'Starting scan...';
            const interval = setInterval(() => {
                if (this.scanProgress < 100 && this.isScanning) {
                    this.scanProgress += 10;
                    this.scanStatusText = `Scanning... ${this.scanProgress}%`;
                } else {
                    clearInterval(interval);
                    this.isScanning = false;
                    this.scanStatusText = 'Scan Complete.';
                }
            }, 500);
        },

        updateToken(tokenId, tokenData) {
            const index = this.tokens.findIndex(t => t.id === tokenId);
            if (index !== -1) {
                this.tokens[index] = { ...this.tokens[index], ...tokenData, updatedAt: new Date().toISOString() };
                this.saveTokensToStorage();
                this.showAlert(`Token ${this.tokens[index].symbol} berhasil diperbarui`, 'info');
            }
        },

        deleteToken(tokenId) {
            const token = this.tokens.find(t => t.id === tokenId);
            if (token && confirm(`Ingin Hapus Token ${token.symbol} on ${token.chain} semua CEX?`)) {
                this.tokens = this.tokens.filter(t => t.id !== tokenId);
                this.saveTokensToStorage();
                this.showAlert(`Token ${token.symbol} berhasil dihapus.`, 'warning');
            }
        },

        toggleTokenStatus(tokenId) {
            const token = this.tokens.find(t => t.id === tokenId);
            if (token) {
                token.isActive = !token.isActive;
                this.saveTokensToStorage();
                const status = token.isActive ? 'diaktifkan' : 'dinonaktifkan';
                this.showAlert(`Token ${token.symbol} telah ${status}`, 'info');
                this.logAction(`UBAH STATUS KOIN`);
            }
        },

        // Helper functions for rendering, adapted from original script
        getBadgeColor(name, type) {
            if (type === 'cex') {
                const colors = { Binance: 'bg-binance', MEXC: 'bg-mexc', Gateio: 'bg-gateio', INDODAX: 'bg-indodax' };
                return colors[name] || 'bg-secondary text-light';
            }
            if (type === 'dex') {
                const colors = { "1inch": 'bg-1inch', KyberSwap: 'bg-kyberswap', Matcha: 'bg-matcha', ODOS: 'bg-odos', ParaSwap: 'bg-paraswap', OKXDEX: 'bg-okxdex', LIFI: 'bg-lifi', Magpie: 'bg-magpie' };
                return colors[name] || 'bg-secondary text-light';
            }
            if (type === 'chain') {
                const colors = { bsc: 'bg-warning text-dark', ethereum: 'bg-primary text-light', polygon: 'bg-success text-light', arbitrum: 'bg-info text-dark', base: 'bg-dark text-light' };
                return colors[name.toLowerCase()] || 'bg-dark text-light';
            }
            return 'bg-secondary text-light';
        },

        getTextColorClassFromBadge(badgeClass = '') {
            const map = {
                'bg-binance': 'text-binance', 'bg-mexc': 'text-mexc', 'bg-gateio': 'text-gateio',
                'bg-indodax': 'text-indodax', 'bg-1inch': 'text-1inch', 'bg-kyberswap': 'text-kyberswap',
                'bg-matcha': 'text-matcha', 'bg-odos': 'text-odos', 'bg-paraswap': 'text-paraswap',
                'bg-okxdex': 'text-okxdex', 'bg-lifi': 'text-lifi', 'bg-magpie': 'text-magpie',
            };
            const bgClass = badgeClass.split(' ').find(cls => cls.startsWith('bg-'));
            return map[bgClass] || 'text-light';
        },

        formatStatus(value, openText, closeText) {
            if (value === true) return `<span class="text-success fw-bold">${openText}</span>`;
            if (value === false) return `<span class="text-danger fw-bold">${closeText}</span>`;
            return `<span class="text-warning">⚠️</span>`;
        },

        GeturlExchanger(cex, NameToken, NamePair, direction = 'cex_to_dex') {
            const token = NameToken.toUpperCase();
            const pair = NamePair.toUpperCase();
            let symbolForTrade = 'BTC'; // fallback

            if (token === 'USDT') symbolForTrade = pair;
            else if (pair === 'USDT') symbolForTrade = token;
            else symbolForTrade = pair;

            let tradeLink = '#', withdrawUrl = null, depositUrl = null;

            switch (cex.toUpperCase()) {
                case 'BINANCE':
                    tradeLink = `https://www.binance.com/en/trade/${symbolForTrade}_USDT`;
                    withdrawUrl = `https://www.binance.com/en/my/wallet/account/main/withdrawal/crypto/${token}`;
                    depositUrl = `https://www.binance.com/en/my/wallet/account/main/deposit/crypto/${token}`;
                    break;
                case 'GATEIO':
                    tradeLink = `https://www.gate.io/trade/${symbolForTrade}_USDT`;
                    withdrawUrl = `https://www.gate.io/myaccount/withdraw/${token}`;
                    depositUrl = `https://www.gate.io/myaccount/deposit/${token}`;
                    break;
                case 'MEXC':
                    tradeLink = `https://www.mexc.com/exchange/${symbolForTrade}_USDT?_from=search`;
                    withdrawUrl = `https://www.mexc.com/assets/withdraw/${token}`;
                    depositUrl = `https://www.mexc.com/assets/deposit/${token}`;
                    break;
                case 'INDODAX':
                    tradeLink = `https://indodax.com/market/${symbolForTrade}IDR`;
                    withdrawUrl = `https://indodax.com/finance/${token}#kirim`;
                    depositUrl = `https://indodax.com/finance/${token}`;
                    break;
            }
            return { tradeLink, withdrawUrl, depositUrl };
        },

        generateStokLinkCEX(tokenAddress, chain, cex) {
            const chainKey = chain.toLowerCase();
            const cexKey = cex.toUpperCase();
            const chainData = CEXWallets[chainKey];
            if (!chainData) return '#STOK';

            const wallet = chainData.WALLET_CEX?.[cexKey]?.address;
            const explorer = (Object.values(CHAIN_CONFIG).find(c => c.code === Number(chainData.Kode_Chain)) || {}).explorer;

            if (!wallet) return '#STOK';
            return `${explorer}/token/${tokenAddress}?a=${wallet}`;
        },

        createTokenDetailContent(token, cex) {
            const chainId = PriceUtils.getChainId(token.chain);
            const explorerUrl = (Object.values(CHAIN_CONFIG).find(c => c.code === Number(chainId)) || {}).explorer;
            const tokenSymbol = token.symbol.toUpperCase();
            const pairSymbol = token.pairSymbol.toUpperCase();
            const cexUpper = cex.toUpperCase();
            const cexColor = this.getTextColorClassFromBadge(this.getBadgeColor(cex, 'cex'));
            const shortChain = CHAIN_CONFIG[token.chain?.toLowerCase()]?.short || 'CHAIN';
            const url = this.GeturlExchanger(cexUpper, tokenSymbol, pairSymbol);
            const url2 = this.GeturlExchanger(cexUpper, pairSymbol, tokenSymbol);

            // This is a simplified version. The original has more complex link generation.
            return `
              <div class="bg-white py-1">
                    <div class="d-block mb-1">
                         <button class="btn bg-primary btn-xs text-light" @click='openTokenModal(${JSON.stringify(token)})' title="Ubah">
                            <i class="bi bi-pencil"></i>
                        </button>
                         <strong class="fs-7 align-middle">${token.modalCexToDex}$ ⇔ ${token.modalDexToCex}$</strong>
                    </div>
                    <div class="d-block mb-1 text-secondary fs-6">
                        <span class="badge ${this.getBadgeColor(cex, 'cex')}">${cexUpper}</span>
                        in <span class="badge ${this.getBadgeColor(token.chain, 'chain')}">${shortChain}</span>
                    </div>
                    <div class="d-block mb-1 fw-bold">
                        <span><a href="${url2.tradeLink}" class="fs-6 mx-1 ${cexColor}" target="_blank">${tokenSymbol}</a></span>
                        VS
                        <span><a href="${url.tradeLink}" class="fs-7" target="_blank">${pairSymbol}</a></span>
                    </div>
                </div>
            `;
        }
    };
}

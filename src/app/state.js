class State {
    
    static async syncMasterTokensFromForm(formSelector, configObj) {
        const $form = $(formSelector);
        const CHAIN_CONFIG = (configObj && configObj.CHAIN_CONFIG)
            || (typeof window.CHAIN_CONFIG !== 'undefined' ? window.CHAIN_CONFIG : (window.CONFIG && window.CONFIG.CHAIN_CONFIG ? window.CONFIG.CHAIN_CONFIG : undefined));
        const CONFIG_CEX = (configObj && configObj.CONFIG_CEX) || window.CONFIG_CEX;

        const selectedChains = $form.find('input[name="sync_chain"]:checked')
            .map(function () { return this.value.toLowerCase(); }).get();
        if (selectedChains.length === 0) throw new Error('Pilih minimal satu chain.');

        const selectedDexs = $form.find('input[name="sync_dex"]:checked')
            .map(function () { return this.value; }).get();
        if (selectedDexs.length === 0 || selectedDexs.length > 4) throw new Error('Pilih minimal 1 sampai maksimal 4 DEX.');

        const selectedCexs = $form.find('input[name="sync_cex"]:checked')
            .map(function () { return this.value.toLowerCase(); }).get();
        if (selectedCexs.length === 0) throw new Error('Pilih minimal 1 CEX.');

        // Ambil modal untuk setiap CEX yang dipilih
        const modalCexToDex = {};
        let cexModalValid = true;
        $form.find('input[name="sync_cex"]:checked').each(function() {
            const cex = this.value;
            // Cari input modal dengan name case-insensitive
            const input = $form.find(`input[name="modal_cex_${cex}"]`);
            let modal = 0;
            if (input.length > 0) {
                modal = parseFloat(input.val()) || 0;
            }
            if (modal <= 0) {
                cexModalValid = false;
                throw new Error(`Modal untuk CEX ${cex} harus diisi (>0).`);
            }
            modalCexToDex[cex.toUpperCase()] = modal;
        });
        if (!cexModalValid) throw new Error('Modal CEX tidak valid.');

        // Ambil modal untuk setiap DEX yang dipilih
        const modalDexToCex = {};
        let dexModalValid = true;
        $form.find('input[name="sync_dex"]:checked').each(function() {
            const dex = this.value;
            // Cari input modal dengan name case-insensitive
            const input = $form.find(`input[name="modal_dex_${dex.toLowerCase()}"]`);
            let modal = 0;
            if (input.length > 0) {
                modal = parseFloat(input.val()) || 0;
            }
            if (modal <= 0) {
                dexModalValid = false;
                throw new Error(`Modal untuk DEX ${dex} harus diisi (>0).`);
            }
            modalDexToCex[dex] = modal;
        });
        if (!dexModalValid) throw new Error('Modal DEX tidak valid.');

        // ❄️ Tampilkan loading freeze (opsional, UI handle)
        const tokenMap = {}; // key = sc_in + chain
        let idCounter = 1;

        for (const chain of selectedChains) {
            const config = CHAIN_CONFIG[chain];
            if (!config || !config.DATAJSON) continue;
            try {
                const res = await fetch(config.DATAJSON);
                const json = await res.json();
                const tokens = json.token || [];
                tokens.forEach(t => {
                    const jsonCex = (t.cex || '').toLowerCase();
                    const match = selectedCexs.includes(jsonCex);
                    if (!match) return;
                    const upperCex = jsonCex.toUpperCase();
                    const properCex = CONFIG_CEX[upperCex] ? upperCex : jsonCex.charAt(0).toUpperCase() + jsonCex.slice(1).toLowerCase();
                    const key = t.sc_in.toLowerCase() + '|' + config.name;
                    if (!tokenMap[key]) {
                        tokenMap[key] = {
                            id: idCounter++,
                            symbol: t.symbol_in,
                            pairSymbol: t.symbol_out,
                            contractAddress: t.sc_in,
                            pairContractAddress: t.sc_out,
                            decimals: t.des_in,
                            pairDecimals: t.des_out,
                            chain: config.name,
                            modalCexToDex: { ...modalCexToDex },
                            modalDexToCex: { ...modalDexToCex },
                            isActive: t.status === true || t.status === "TRUE",
                            selectedCexs: [properCex],
                            selectedDexs: selectedDexs
                        };
                    } else {
                        if (!tokenMap[key].selectedCexs.includes(properCex)) {
                            tokenMap[key].selectedCexs.push(properCex);
                        }
                    }
                });
            } catch (err) {
                console.error(`❌ Gagal fetch ${config.DATAJSON}`, err);
            }
        }
        const allTokenData = Object.values(tokenMap);
        LocalStorageUtil.set('MASTER_TOKENS', allTokenData);
        return allTokenData.length;
    }

    constructor() {
        this.settings = LocalStorageUtil.get('SETTING_APP', {});
        this.masterTokens = LocalStorageUtil.get('MASTER_TOKENS', {});
        this.configScan = LocalStorageUtil.get('CONFIG_SCANNER', {});
        this.koinScanner = LocalStorageUtil.get('SELECT_KOIN', {});
        this.gasInfo = LocalStorageUtil.get('GAS_INFO', {});
        this.logAction = LocalStorageUtil.get('HISTORTY_ACTION', {});
        this.selectTheme = LocalStorageUtil.rawGet('SELECT_THEME', {});
        this.autoScroll = LocalStorageUtil.get('AUTO_SCROLL', {});
        this.tokens = this.loadTokens();
    }

    loadTokens() {
        const tokens = LocalStorageUtil.get('SELECT_KOIN', []);
        return tokens.map(t => ({ ...t, id: String(t.id) }));
    }

    // Tambahkan method ini di dalam class State
    shortenAddress(address) {
        if (!address || typeof address !== 'string' || address.length < 10) return address || '-';
        return address.slice(0, 6) + '...' + address.slice(-4);
    }

    getSettings() {
        // console.log('Setting App:', STATE.SET_APP);
        const parsedSettings = LocalStorageUtil.get('SETTING_APP', {
            tokensPerBatch: '',          // jumlah anggota
            UserName: '',            // nama user default
            delayBetweenGrup: '',     // jeda antar grup (ms)
            TimeoutCount: '',       // timeout API
            PNLFilter: '',           // filter minimal PNL
            WalletAddress: ''          // alamat wallet default
        });
         // Tampilkan info config ke elemen #infoConfig
        const shortened = this.shortenAddress(parsedSettings.WalletAddress);
        // Buat HTML info dengan icon unicode
        const infoHTML = `
            🆔&nbsp; UserName: ${parsedSettings.UserName}<br>
            👛&nbsp; Wallets: ${shortened}<br>
            👥&nbsp; Anggota Grup: ${parsedSettings.tokensPerBatch} Koin<br>
            ⏱️&nbsp; Jeda Grup: ${parsedSettings.delayBetweenGrup}ms<br>
            ⌛&nbsp; Time Out: ${parsedSettings.TimeoutCount}ms<br>
            💰&nbsp; PNLFilter: $${parsedSettings.PNLFilter}
        `;
        $('#infoConfig').html(infoHTML);

        // ISI NILAI FORM (form id: #settingsForm)
        $('#UserName').val(parsedSettings.UserName);
        $('#tokensPerBatch').val(parsedSettings.tokensPerBatch);
        $('#delayBetweenGrup').val(parsedSettings.delayBetweenGrup);
        $('#TimeoutCount').val(parsedSettings.TimeoutCount);
        $('#PNLFilter').val(parsedSettings.PNLFilter);
        $('#WalletAddress').val(parsedSettings.WalletAddress);
        //console.log("DATA SETTING: ",parsedSettings); // ← log sebelum return
        return parsedSettings;
        return this.settings;
    } 

    getMasterTokens() {
        return this.masterTokens;
    }

    getConfigScan() {
        return this.configScan;
    }

    getKoinScanner() {
        return this.koinScanner;
    }

    getSelectTheme() {
        return this.selectTheme;
    }   

    getGasInfo() {
        return this.gasInfo;
    }
    saveTokens() {
        LocalStorageUtil.set('SELECT_KOIN', this.tokens);
    }

    addToken(tokenData) {
        const newId = Date.now().toString();
        const modalCexToDex = {};
        const modalDexToCex = {};

        tokenData.selectedCexs.forEach(cex => {
            modalCexToDex[cex] = parseFloat(tokenData.modalCexToDex) || 100;
        });
        tokenData.selectedDexs.forEach(dex => {
            modalDexToCex[dex] = parseFloat(tokenData.modalDexToCex) || 100;
        });

        const token = {
            id: newId,
            symbol: tokenData.symbol,
            pairSymbol: tokenData.pairSymbol,
            contractAddress: tokenData.contractAddress,
            pairContractAddress: tokenData.pairContractAddress,
            decimals: parseInt(tokenData.decimals),
            pairDecimals: parseInt(tokenData.pairDecimals),
            chain: tokenData.chain,
            modalCexToDex: modalCexToDex,
            modalDexToCex: modalDexToCex,
            selectedCexs: tokenData.selectedCexs,
            selectedDexs: tokenData.selectedDexs,
            isActive: true,
            createdAt: new Date().toISOString()
        };
        this.tokens.push(token);
        this.saveTokens();
        return token;
    }

    updateToken(tokenId, tokenData) {
        const index = this.tokens.findIndex(t => t.id === tokenId);
        if (index !== -1) {
            const modalCexToDex = {};
            const modalDexToCex = {};

            tokenData.selectedCexs.forEach(cex => {
                modalCexToDex[cex] = parseFloat(tokenData.modalCexToDex[cex]) || parseFloat(tokenData.modalCexToDex) || 100;
            });
            tokenData.selectedDexs.forEach(dex => {
                modalDexToCex[dex] = parseFloat(tokenData.modalDexToCex[dex]) || parseFloat(tokenData.modalDexToCex) || 100;
            });

            this.tokens[index] = {
                ...this.tokens[index],
                ...tokenData,
                modalCexToDex: modalCexToDex,
                modalDexToCex: modalDexToCex,
                updatedAt: new Date().toISOString()
            };
            this.saveTokens();
            return this.tokens[index];
        }
        return null;
    }

    deleteToken(tokenId) {
        const token = this.tokens.find(t => t.id === tokenId);
        if (!token) {
            return false;
        }
        this.tokens = this.tokens.filter(t => t.id !== tokenId);
        this.saveTokens();
        return true;
    }

    toggleTokenStatus(tokenId) {
        const token = this.tokens.find(t => t.id === tokenId);
        if (token) {
            token.isActive = !token.isActive;
            this.saveTokens();
            return token;
        }
        return null;
    }

    saveSettings(newSettings) {
        this.settings = newSettings;
        LocalStorageUtil.set('SETTING_APP', this.settings);
    }

    getTokens() {
        return this.tokens;
    }
}

window.State = State;

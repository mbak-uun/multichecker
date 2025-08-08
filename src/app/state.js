class State {
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

    getSettings() {
        return this.settings;
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

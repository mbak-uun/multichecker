async function checkAllCEXWallets() {
    try { $('#loadingOverlay').fadeIn(150); } catch(_) {}
    infoSet('🚀 Memulai pengecekan DATA CEX...');
    console.log('🚀 === MULAI PENGECEKAN WALLET CEX ===');

    // ===== Helper =====
    const clean = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    function infoSet(msg){ try{$('#infoAPP').html(msg);}catch(_){} console.log('📢', msg); }
    function infoAdd(msg){ try{$('#infoAPP').html(`${$('#infoAPP').html()}<br>${msg}`);}catch(_){} console.log('📌', msg); }

    // ===== Ambil setting =====
    let setting = {};
    try { setting = getFromLocalStorage('SETTING_SCANNER', {}) || {}; }
    catch (e) { console.error('❌ Error get SETTING_SCANNER:', e); }

    const selectedChains = Array.isArray(setting.AllChains) ? setting.AllChains.map(c => String(c).toLowerCase()) : [];
    const selectedCexesRaw = (setting.JedaCexs && typeof setting.JedaCexs === 'object') ? Object.keys(setting.JedaCexs) : [];
    if (selectedCexesRaw.length === 0) {
        infoSet('⚠ Tidak ada CEX yang dipilih');
        try { $('#loadingOverlay').fadeOut(150); } catch(_) {}
        return;
    }

    // Normalisasi nama CEX
    const normalizeCEX = (k) => {
        const u = String(k || '').toUpperCase();
        if (u === 'GATEIO') return 'GATE';
        return u;
    };
    const selectedCexes = selectedCexesRaw.map(normalizeCEX);

    // ===== Mapping Fetcher =====
    const cexFetchers = {
        'BINANCE': { fn: (typeof fetchBinance === 'function') ? fetchBinance : null, name: 'BINANCE', key: 'BINANCE' },
        'MEXC':    { fn: (typeof fetchMexc    === 'function') ? fetchMexc    : null, name: 'MEXC',    key: 'MEXC' },
        'GATE':    { fn: (typeof fetchGate    === 'function') ? fetchGate    : null, name: 'GATE',    key: 'GATE' },
      //  'INDODAX': { fn: (typeof fetchIndodax === 'function') ? fetchIndodax : null, name: 'INDODAX', key: 'INDODAX' },
    };

    // ===== Parallel fetch (sekali per CEX) =====
    const fetchJobs = [];
    const validCexes = [];

    selectedCexes.forEach(cexKey => {
        const F = cexFetchers[cexKey];
        if (!F) {  return; }
        if (!F.fn || typeof F.fn !== 'function') {return; }

        validCexes.push(F.key);
        fetchJobs.push((async () => {
            infoAdd(`📡 Mengambil data ${F.name}...`);
            try {
                const t0 = performance.now?.() ?? Date.now();
                const data = await F.fn();
                const n = Array.isArray(data) ? data.length : 0;
                const t1 = performance.now?.() ?? Date.now();
                infoAdd(`✅ ${F.name} OK (${n} items, ${Math.round(t1 - t0)} ms)`);
                return { key: F.key, ok: true, data: Array.isArray(data) ? data : [], errMsg: '' };
            } catch (error) {
                console.error(`❌ ${F.name} gagal:`, error);
                infoAdd(`❌ ${F.name} GAGAL (${error?.message || 'Unknown error'})`);
                return { key: F.key, ok: false, data: [], errMsg: error?.message || 'Unknown error' };
            }
        })());
    });

    if (fetchJobs.length === 0) {
        infoAdd('⚠ Tidak ada CEX valid untuk di-fetch');
        try { $('#loadingOverlay').fadeOut(150); } catch(_) {}
        return;
    }

  //  infoAdd(`⏳ Menunggu ${fetchJobs.length} request CEX selesai...`);
    const fetched = await Promise.all(fetchJobs);

    const walletByCex = {};
    const successList = [];
    const failedList  = [];

    fetched.forEach(r => {
        walletByCex[r.key] = r.data;
        if (r.ok) successList.push(r.key);
        else failedList.push(`${r.key}${r.errMsg ? `: ${r.errMsg}` : ''}`);
    });

    // ===== Jika ada yang gagal → hentikan total, beri alert dan keluar =====
    if (failedList.length > 0) {
        const msgSummary = [
            `❌ Gagal ambil data dari ${failedList.length} CEX:`,
            failedList.map(s => `• ${s}`).join('<br>')
        ].join('<br>');
        infoAdd(msgSummary);

        const alertText = [
            '❌ GAGAL UPDATE WALLET EXCHANGER.',
            ...failedList.map(s => `- ${s}`),
            'PASTIKAN MOESIF ON & TELAH BUKA KUNCI'
        ].join('\n');

        try { alert(alertText); } catch(_) {}
        try { $('#loadingOverlay').fadeOut(150); } catch(_) {}
        console.warn('⛔ Membatalkan proses karena ada fetch gagal.');
        return; // ⛔ STOP: tidak lanjut ke cache/index/update token
    }

    // ===== Semua sukses → lanjut
    infoAdd(`✅ Semua CEX sukses: ${successList.join(', ')}`);

    // Cache mentah
    const cachePayload = { ts: Date.now(), chains: selectedChains, cexes: validCexes, data: walletByCex };
    try { saveToLocalStorage('CEX_WALLET_CACHE', cachePayload); infoAdd('💾 Cache tersimpan (CEX_WALLET_CACHE)'); }
    catch (e) { console.error('❌ Error save cache:', e); }

    // ===== Index (CHAIN_LABEL_CEX + CEX) =====
    const index = {};
    const pushIndex = (cexKey, rows) => {
        if (!Array.isArray(rows) || rows.length === 0) return;
        rows.forEach(item => {
            if (!item || typeof item !== 'object') return;
            const chainLabel = String(item.chain || item.network || '').toUpperCase();
            if (!chainLabel) return;
            const k = `${chainLabel}_${cexKey}`;
            if (!index[k]) index[k] = [];
            index[k].push(item);
        });
    };
    Object.keys(walletByCex).forEach(k => pushIndex(k, walletByCex[k]));
    try {
        const indexInfo = {
            ts: Date.now(),
            indexKeys: Object.keys(index),
            indexCounts: Object.fromEntries(Object.keys(index).map(k => [k, index[k].length])),
        };
        saveToLocalStorage('CEX_WALLET_INDEX', indexInfo);
        infoAdd('🗂️ Index CEX disimpan (CEX_WALLET_INDEX)');
    } catch(e){ console.error('❌ Error save index:', e); }

    // ===== Ambil & update TOKEN_SCANNER =====
    const tokenKey = 'TOKEN_SCANNER';
    let tokens = [];
    try { tokens = getFromLocalStorage(tokenKey, []); }
    catch (e) { console.error('❌ Error get TOKEN_SCANNER:', e); }
    if (!Array.isArray(tokens) || tokens.length === 0) {
        infoAdd('⚠ Tidak ada data token untuk di-update.');
        try { $('#loadingOverlay').fadeOut(150); } catch(_) {}
        return;
    }
    infoAdd(`🛠️ Mengupdate ${tokens.length} token...`);

    const updatedTokens = tokens.map((token, idx) => {
        if (!token || typeof token !== 'object') return token;

        const tokenChainKey = String(token.chain || '').toLowerCase();
        if (!tokenChainKey) return token;

        let chainData = null;
        try { chainData = getChainData(tokenChainKey); }
        catch (e) { console.error(`❌ getChainData(${tokenChainKey})`, e); }

        const chainCfg = (chainData && chainData.CEXCHAIN) ? chainData.CEXCHAIN : null;
        const updatedDataCexs = { ...(token.dataCexs || {}) };

        const tokenCexListRaw = (Array.isArray(token.selectedCexs) && token.selectedCexs.length)
            ? token.selectedCexs
            : validCexes;
        const tokenCexList = tokenCexListRaw.map(normalizeCEX);
        const finalCexList = tokenCexList.filter(ck => validCexes.includes(ck));

        const applyUpdate = (walletList, cexKey, symbol, isTokenIn) => {
            if (!symbol || !cexKey) return;
            const symbolClean = clean(symbol);
            const match = (Array.isArray(walletList) ? walletList : []).find(entry => {
                if (!entry || typeof entry !== 'object') return false;
                const n1 = clean(entry.tokenName || entry.token_name || '');
                const n2 = clean(entry.token || entry.symbol || '');
                return n1 === symbolClean || n2 === symbolClean;
            });

            if (!updatedDataCexs[cexKey]) updatedDataCexs[cexKey] = {};

            if (match) {
                const fee = String(match.feeWDs ?? match.withdrawFee ?? match.fee ?? '0');
                const depo = !!(match.depositEnable ?? match.deposit ?? false);
                const wd   = !!(match.withdrawEnable ?? match.withdraw ?? false);

                if (isTokenIn) {
                    updatedDataCexs[cexKey].feeWDToken    = fee;
                    updatedDataCexs[cexKey].depositToken  = depo;
                    updatedDataCexs[cexKey].withdrawToken = wd;
                } else {
                    updatedDataCexs[cexKey].feeWDPair     = fee;
                    updatedDataCexs[cexKey].depositPair   = depo;
                    updatedDataCexs[cexKey].withdrawPair  = wd;
                }
            } else {
                if (isTokenIn) {
                    updatedDataCexs[cexKey].feeWDToken    = updatedDataCexs[cexKey].feeWDToken || '0';
                    updatedDataCexs[cexKey].depositToken  = (updatedDataCexs[cexKey].depositToken ?? false);
                    updatedDataCexs[cexKey].withdrawToken = (updatedDataCexs[cexKey].withdrawToken ?? false);
                } else {
                    updatedDataCexs[cexKey].feeWDPair     = updatedDataCexs[cexKey].feeWDPair || '0';
                    updatedDataCexs[cexKey].depositPair   = (updatedDataCexs[cexKey].depositPair ?? false);
                    updatedDataCexs[cexKey].withdrawPair  = (updatedDataCexs[cexKey].withdrawPair ?? false);
                }
            }
        };

        finalCexList.forEach(cexKey => {
            let chainLabelForCEX = String(token.chain || '').toUpperCase();
            if (chainCfg && chainCfg[cexKey] && chainCfg[cexKey].chainCEX) {
                chainLabelForCEX = String(chainCfg[cexKey].chainCEX).toUpperCase();
            }
            const storageKey = `${chainLabelForCEX}_${cexKey}`;   // contoh: BSC_BINANCE
            const walletList = index[storageKey] || [];

            if (token.symbol_in)  applyUpdate(walletList, cexKey, token.symbol_in,  true);
            if (token.symbol_out) applyUpdate(walletList, cexKey, token.symbol_out, false);
        });

        if ((idx+1) % 20 === 0) infoAdd(`… progress update token: ${idx+1}/${tokens.length}`);
        return { ...token, dataCexs: updatedDataCexs };
    });

    try { saveToLocalStorage(tokenKey, updatedTokens); infoAdd(`💾 ${updatedTokens.length} token berhasil diupdate → ${tokenKey}`); }
    catch (e) { console.error('❌ Error save updated tokens:', e); }

    infoAdd('✅ SELESAI CEX WALLET EXCHANGER');
    try { setLastAction("UPDATE WALLET EXCHANGER"); } catch(_) {}
    console.log('🎉 === SELESAI PENGECEKAN WALLET CEX ===');

    try { alert('✅ BERHASIL\nSemua CEX sukses di-fetch.\nData wallet & fee telah diperbarui.'); } catch(_) {}
    try { $('#loadingOverlay').fadeOut(150); } catch(_) {}
    try { location.reload(); } catch(_) {}
}

async function fetchBinance() {
    const { ApiKey, ApiSecret } = CONFIG_CEX.BINANCE;
    const timestamp = Date.now().toString();
    const queryString = `timestamp=${timestamp}`;
    const signature = calculateSignature("BINANCE", ApiSecret, queryString, "HmacSHA256");
    const url = `https://proxykanan.awokawok.workers.dev/?https://api-gcp.binance.com/sapi/v1/capital/config/getall?${queryString}&signature=${signature}`;

    const response = await $.ajax({ url, headers: { "X-MBX-ApiKey": ApiKey }, method: "GET" });

    const result = [];
    for (const item of response) {
        if (!item.trading || !Array.isArray(item.networkList)) continue;
        for (const net of item.networkList) {
            result.push({
                cex: "BINANCE",
                tokenName: item.coin,
                chain: net.network,
                feeWDs: parseFloat(net.withdrawFee || 0),
                depositEnable: !!net.depositEnable,
                withdrawEnable: !!net.withdrawEnable
            });
        }
    }
    return result;
}

async function fetchMexc() {
    const { ApiKey, ApiSecret } = CONFIG_CEX.MEXC;
    const timestamp = Date.now();
    const queryString = `recvWindow=5000&timestamp=${timestamp}`;
    const signature = calculateSignature("MEXC", ApiSecret, queryString);
    const url = `https://proxykiri.awokawok.workers.dev/?https://api.mexc.com/api/v3/capital/config/getall?${queryString}&signature=${signature}`;

    const response = await $.ajax({ url, headers: { "X-MEXC-APIKEY": ApiKey }, method: "GET" });

    const result = [];
    for (const item of response) {
        if (!Array.isArray(item.networkList)) continue;
        for (const net of item.networkList) {
            result.push({
                cex: "MEXC",
                tokenName: item.coin,
                chain: net.netWork,
                feeWDs: parseFloat(net.withdrawFee || 0),
                depositEnable: !!net.depositEnable,
                withdrawEnable: !!net.withdrawEnable
            });
        }
    }
    return result;
}

async function fetchGate() {
    const { ApiKey, ApiSecret } = CONFIG_CEX.GATE;
    const host = "https://cors-anywhere.herokuapp.com/https://api.gateio.ws";
    const timestamp = Math.floor(Date.now() / 1000);
    const method = "GET";
    const prefix = "/api/v4";

    const buildSignature = (url, body) => {
        const bodyHash = CryptoJS.SHA512(body).toString(CryptoJS.enc.Hex);
        const signString = `${method}\n${prefix}${url}\n\n${bodyHash}\n${timestamp}`;
        return CryptoJS.HmacSHA512(signString, ApiSecret).toString(CryptoJS.enc.Hex);
    };

    const headers = { KEY: ApiKey, SIGN: buildSignature("/wallet/withdraw_status", ""), Timestamp: timestamp };

    const wdData = await $.ajax({ url: `${host}${prefix}/wallet/withdraw_status`, method, headers });
    const statusData = await $.ajax({ url: `${host}${prefix}/spot/currencies`, method, headers });

    const result = [];
    for (const item of statusData) {
        if (!Array.isArray(item.chains)) continue;
        for (const chain of item.chains) {
            const feeItem = wdData.find(f =>
                f.currency?.toUpperCase() === item.currency?.toUpperCase() &&
                f.withdraw_fix_on_chains &&
                f.withdraw_fix_on_chains[chain.name]
            );
            result.push({
                cex: "GATE",
                tokenName: item.currency,
                chain: chain.name,
                feeWDs: feeItem ? parseFloat(feeItem.withdraw_fix_on_chains[chain.name]) : 0,
                depositEnable: !chain.deposit_disabled,
                withdrawEnable: !chain.withdraw_disabled
            });
        }
    }
    return result;
}

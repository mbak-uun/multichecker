class UI {
    constructor(controller) {
        this.controller = controller;
    }

    bindEvents() {
        // Event listeners will be moved here
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
        // ... implementation from TokenPriceMonitor.loadTokenTable ...
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
        // ... implementation from TokenPriceMonitor.renderFormSettingScan ...
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

    updateStats(tokens) {
        // ... implementation from TokenPriceMonitor.updateStats ...
    }

    shortenAddress(address, start = 6, end = 6) {
        if (!address || address.length <= start + end) return address;
        return address.substring(0, start) + "..." + address.substring(address.length - end);
    }
}

window.UI = UI;

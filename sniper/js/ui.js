function displayTokens() {
    const tokenList = document.getElementById('tokenList');
    tokenList.innerHTML = '';
    const tokens = getTokens();
    tokens.forEach(token => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${token.name}</td>
            <td>${token.address}</td>
            <td>${token.symbol}</td>
            <td>${token.cex}</td>
            <td>${token.dex}</td>
            <td>${token.network}</td>
            <td id="price-${token.address}">N/A</td>
            <td id="gas-${token.address}">N/A</td>
            <td id="status-${token.address}">Idle</td>
            <td>
                <button onclick="editToken('${token.address}')">Edit</button>
                <button onclick="deleteToken('${token.address}')">Delete</button>
            </td>
        `;
        tokenList.appendChild(row);
    });
}

function addToken() {
    const tokenName = document.getElementById('tokenName').value;
    const tokenAddress = document.getElementById('tokenAddress').value;
    const tokenSymbol = document.getElementById('tokenSymbol').value;
    const cex = document.getElementById('cex').value;
    const dex = document.getElementById('dex').value;
    const network = document.getElementById('network').value;

    if (tokenName && tokenAddress && tokenSymbol && cex && dex && network) {
        const tokens = getTokens();
        tokens.push({ name: tokenName, address: tokenAddress, symbol: tokenSymbol, cex, dex, network });
        saveTokens(tokens);
        displayTokens();
        closeModal();
    } else {
        showAlert('Please fill in all fields.');
    }
}

function editToken(address) {
    const tokens = getTokens();
    const token = tokens.find(t => t.address === address);
    if (token) {
        document.getElementById('editTokenName').value = token.name;
        document.getElementById('editTokenAddress').value = token.address;
        document.getElementById('editTokenSymbol').value = token.symbol;
        document.getElementById('editCex').value = token.cex;
        document.getElementById('editDex').value = token.dex;
        document.getElementById('editNetwork').value = token.network;
        document.getElementById('editModal').style.display = 'block';
    }
}

function deleteToken(address) {
    let tokens = getTokens();
    tokens = tokens.filter(t => t.address !== address);
    saveTokens(tokens);
    displayTokens();
}

function saveToken() {
    const originalAddress = document.getElementById('editTokenAddress').value;
    let tokens = getTokens();
    const tokenIndex = tokens.findIndex(t => t.address === originalAddress);

    if (tokenIndex !== -1) {
        tokens[tokenIndex] = {
            name: document.getElementById('editTokenName').value,
            address: document.getElementById('editTokenAddress').value,
            symbol: document.getElementById('editTokenSymbol').value,
            cex: document.getElementById('editCex').value,
            dex: document.getElementById('editDex').value,
            network: document.getElementById('editNetwork').value,
        };
        saveTokens(tokens);
        displayTokens();
        closeModal('editModal');
    }
}

function cancelEdit() {
    closeModal('editModal');
}

function openModal(modalId = 'addTokenModal') {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId = 'addTokenModal') {
    if (modalId === 'addTokenModal') {
         document.getElementById(modalId).style.display = 'none';
         document.getElementById('addTokenForm').reset();
    } else if (modalId === 'editModal') {
        document.getElementById(modalId).style.display = 'none';
    }
}

function exportToCSV() {
    const tokens = getTokens();
    let csvContent = "data:text/csv;charset=utf-8,Name,Address,Symbol,CEX,DEX,Network\n";
    tokens.forEach(token => {
        let row = [token.name, token.address, token.symbol, token.cex, token.dex, token.network].join(",");
        csvContent += row + "\r\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tokens.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function importFromCSV() {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const csvData = event.target.result;
            const lines = csvData.split('\n').filter(line => line.trim() !== '');
            if (lines.length > 1) {
                const headers = lines[0].trim().split(',');
                let tokens = getTokens();
                for (let i = 1; i < lines.length; i++) {
                    const data = lines[i].trim().split(',');
                    const token = {
                        name: data[0],
                        address: data[1],
                        symbol: data[2],
                        cex: data[3],
                        dex: data[4],
                        network: data[5]
                    };
                    // Avoid duplicates
                    if (!tokens.some(t => t.address === token.address)) {
                        tokens.push(token);
                    }
                }
                saveTokens(tokens);
                displayTokens();
            }
        };
        reader.readAsText(file);
    }
}


function showAlert(message) {
    const alertBox = document.getElementById('alertBox');
    const alertMessage = document.getElementById('alertMessage');
    alertMessage.textContent = message;
    alertBox.style.display = 'block';
    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 3000);
}

function updateMonitoringStatus(isMonitoring) {
    const statusDiv = document.getElementById('monitoringStatus');
    statusDiv.textContent = isMonitoring ? 'Status: Monitoring for Arbitrage Opportunities' : 'Status: Monitoring Paused';
    statusDiv.className = isMonitoring ? 'monitoring-on' : 'monitoring-off';
}

function logMessage(message, type = 'info') {
    const logContainer = document.getElementById('logContainer');
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    logEntry.innerHTML = `<strong>[${timestamp}]</strong> ${message}`;
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight; // Auto-scroll to bottom
}

function updateTokenPrice(address, priceCEX, priceDEX) {
    const priceCell = document.getElementById(`price-${address}`);
    if (priceCell) {
        priceCell.textContent = `CEX: ${priceCEX.toFixed(6)}, DEX: ${priceDEX.toFixed(6)}`;
    }
}

function updateTokenStatus(address, status, color) {
    const statusCell = document.getElementById(`status-${address}`);
    if (statusCell) {
        statusCell.textContent = status;
        statusCell.style.color = color;
    }
}

function resetAllTokenStatuses() {
    const tokens = getTokens();
    tokens.forEach(token => {
        const statusCell = document.getElementById(`status-${token.address}`);
        if (statusCell) {
            statusCell.textContent = 'Idle';
            statusCell.style.color = 'inherit';
        }
    });
}

function setMonitoringButtons(isMonitoring) {
    document.getElementById('startMonitor').disabled = isMonitoring;
    document.getElementById('stopMonitor').disabled = !isMonitoring;
}

function updateTableVolCEX(finalResult, cex) {
    const cexName = cex.toUpperCase();
    const TokenPair = finalResult.token + "_" + finalResult.pair;
    const isIndodax = cexName === 'INDODAX';

    const getPriceIDR = priceUSDT => {
        const rateIDR = getFromLocalStorage("PRICE_RATE_USDT", 0);
        return rateIDR ? (priceUSDT * rateIDR).toLocaleString("id-ID", { style: "currency", currency: "IDR" }) : "N/A";
    };

    const formatPrice = (price) => {
        if (price >= 1) return price.toFixed(3) + '$';
        let strPrice = price.toFixed(20).replace(/0+$/, '');
        let match = strPrice.match(/0\.(0*)(\d+)/);
        if (match) {
            let zeroCount = match[1].length;
            let significant = match[2].substring(0, 4).padEnd(4, '0');
            return zeroCount >= 2 ? `0.{${zeroCount}}${significant}$` : `0.${match[1]}${significant}$`;
        }
        return price.toFixed(6) + '$';
    };

    const volumesBuyToken = finalResult.volumes_buyToken.slice().sort((a, b) => b.price - a.price);
    const volumesSellPair = finalResult.volumes_sellPair;
    const volumesBuyPair = finalResult.volumes_buyPair.slice().sort((a, b) => b.price - a.price);
    const volumesSellToken = finalResult.volumes_sellToken.slice().sort((a, b) => b.price - a.price);

    $('#LEFT_' + cexName + '_' + TokenPair + '_' + finalResult.chainName.toUpperCase()).html(
        volumesBuyToken.map(data => `<span class='uk-text-success' title="IDR: ${getPriceIDR(data.price)}">${formatPrice(data.price || 0)} : <b>${data.volume.toFixed(2) || 0}$</b><br/></span>`).join('') +
        `<span class='uk-text-primary uk-text-bolder'>${finalResult.token} -> ${finalResult.pair}</span><br/>` +
        volumesSellPair.map(data => `<span class='uk-text-danger' title="IDR: ${getPriceIDR(data.price)}">${formatPrice(data.price || 0)} : <b>${data.volume.toFixed(2) || 0}$</b><br/></span>`).join('')
    );

    $('#RIGHT_' + cexName + '_' + TokenPair + '_' + finalResult.chainName.toUpperCase()).html(
        volumesBuyPair.map(data => `<span class='uk-text-success' title="IDR: ${getPriceIDR(data.price)}">${formatPrice(data.price || 0)} : <b>${data.volume.toFixed(2) || 0}$</b><br/></span>`).join('') +
        `<span class='uk-text-primary uk-text-bolder'>${finalResult.pair} -> ${finalResult.token}</span><br/>` +
        volumesSellToken.map(data => `<span class='uk-text-danger' title="IDR: ${getPriceIDR(data.price)}">${formatPrice(data.price || 0)} : <b>${data.volume.toFixed(2) || 0}$</b><br/></span>`).join('')
    );
}

function displayArbitrageResult(result) {
    const { PNL, cex, Name_in, Name_out, totalFee, modal, dextype, FeeSwap, FeeWD, totalValue, totalModal, conclusion, selisih, nameChain, codeChain, trx, profitLossPercent, vol, DataDEX } = result;

    const SavedSettingData = getFromLocalStorage('SETTING_SCANNER', {});
    const filterPNLValue = parseFloat(SavedSettingData.filterPNL);
    const nickname = SavedSettingData.nickname;

    const urlsCEXToken = GeturlExchanger(cex.toUpperCase(), Name_in, Name_out);
    const buyLink = urlsCEXToken.tradeToken;
    const sellLink = urlsCEXToken.tradePair;

    const chainConfig = CONFIG_CHAINS[nameChain.toLowerCase()];
    const IdCELL = `${cex.toUpperCase()}_${dextype.toUpperCase()}_${Name_in}_${Name_out}_${(chainConfig.Nama_Chain).toUpperCase()}`;

    const rowCell = $(`#${IdCELL}`);
    const resultCell = $(`#RESULT_${IdCELL}`);

    const isHighlight = (PNL > totalFee) || (PNL > filterPNLValue);

    if (isHighlight) {
        const sinyals = `<a href="#SWAP_${IdCELL}" class='link-class'>${cex.toUpperCase()} VS ${dextype.toUpperCase()} : ${Name_in}_${Name_out} (${PNL.toFixed(2)}$)</a>`;
        toastr.success(sinyals);
        rowCell.attr("style", "background-color: #94fa95 !important; font-weight: bolder !important; color: black !important; vertical-align: middle !important; text-align: center !important;");

        // Additional UI logic for displaying results
    } else {
         // UI logic for non-highlighted results
    }

    if (PNL > 0.25) {
        // Telegram sending logic can be called from here
    }
}

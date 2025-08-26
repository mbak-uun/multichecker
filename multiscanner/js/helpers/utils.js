/**
 * Downloads the token data from localStorage as a CSV file.
 */
function downloadTokenScannerCSV() {
    const tokenData = getFromLocalStorage("TOKEN_SCANNER", []);

    // CSV headers
    const headers = [
        "id", "no", "symbol_in", "symbol_out", "chain",
        "sc_in", "des_in", "sc_out", "des_out",
        "dataCexs", "dataDexs", "status", "selectedCexs", "selectedDexs"
    ];

    // Convert each token object to a CSV row
    const rows = tokenData.map(token => {
        const rowData = [
            token.id ?? "",
            token.no ?? "",
            token.symbol_in ?? "",
            token.symbol_out ?? "",
            token.chain ?? "",
            token.sc_in ?? "",
            token.des_in ?? "",
            token.sc_out ?? "",
            token.des_out ?? "",
            JSON.stringify(token.dataCexs ?? {}),
            JSON.stringify(token.dataDexs ?? {}),
            token.status ? "true" : "false",
            (token.selectedCexs ?? []).join("|"),
            (token.selectedDexs ?? []).join("|")
        ];
        // Escape quotes and wrap each value in double quotes
        return rowData.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "KOIN_MULTISCAN_SNIPER.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // This function depends on setLastAction, which should be available globally or passed in.
    try {
        setLastAction("EXPORT DATA KOIN");
    } catch (e) {
        console.warn("setLastAction function not found.");
    }
}

/**
 * Handles the upload of a CSV file to populate token data in localStorage.
 * @param {Event} event The file input change event.
 */
function uploadTokenScannerCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const csvText = e.target.result.trim();
            const rows = csvText.split("\n");
            const headers = rows[0].split(",").map(h => h.trim());

            const tokenData = rows.slice(1).map(row => {
                const values = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                let obj = {};
                headers.forEach((header, index) => {
                    let val = values[index] ? values[index].trim() : "";
                    if (val.startsWith('"') && val.endsWith('"')) {
                        val = val.slice(1, -1).replace(/""/g, '"');
                    }

                    // Parse values based on header key
                    switch(header) {
                        case "dataCexs":
                        case "dataDexs":
                            try { val = JSON.parse(val || "{}"); } catch { val = {}; }
                            break;
                        case "selectedCexs":
                        case "selectedDexs":
                            val = val ? val.split("|") : [];
                            break;
                        case "no":
                        case "des_in":
                        case "des_out":
                            val = val ? Number(val) : null;
                            break;
                        case "status":
                            val = String(val).trim().toLowerCase() === "true";
                            break;
                    }
                    obj[header] = val;
                });
                return obj;
            });

            saveToLocalStorage("TOKEN_SCANNER", tokenData);

            // These functions are application-specific and will be called from main.js
            // applyControlsFor(computeAppReadiness());
            // setLastAction("IMPORT DATA KOIN");

            alert(`✅ Successfully imported ${tokenData.length} tokens.`);
            location.reload();

        } catch (error) {
            console.error("Error parsing CSV:", error);
            toastr.error("Invalid CSV file format!");
        }
    };
    reader.readAsText(file);
}

/**
 * Creates a hyperlink with a hover title.
 * @param {string} url The URL for the link.
 * @param {string} text The visible text for the link.
 * @param {string} className Additional CSS classes.
 * @returns {string} HTML string for the anchor tag.
 */
function createHoverLink(url, text, className = '') {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="hover-link ${className}" title="${url}">${text}</a>`;
}

/**
 * Formats a price number into a display string.
 * @param {number} price The price to format.
 * @returns {string} The formatted price string.
 */
function formatPrice(price) {
    if (price >= 1) {
        return price.toFixed(3) + '$';
    }
    let strPrice = price.toFixed(20).replace(/0+$/, '');
    let match = strPrice.match(/0\\.(0*)(\\d+)/);
    if (match) {
        let zeroCount = match[1].length;
        let significant = match[2].substring(0, 4).padEnd(4, '0');
        if (zeroCount >= 2) {
            return `0.{${zeroCount}}${significant}$`;
        } else {
            return `0.${match[1]}${significant}$`;
        }
    }
    return price.toFixed(6) + '$';
}

/**
 * Generates URLs for a given CEX and token pair.
 * @param {string} cex The CEX name (e.g., "GATE", "BINANCE").
 * @param {string} nameToken The symbol of the token.
 * @param {string} namePair The symbol of the pair.
 * @returns {object} An object containing various URLs (trade, deposit, withdraw).
 */
function getUrlExchanger(cex, nameToken, namePair) {
    if (!nameToken || !namePair) {
        return { tradeToken: '#', tradePair: '#', withdrawUrl: '#', depositUrl: '#' };
    }
    const token = nameToken.toString().toUpperCase();
    const pair = namePair.toString().toUpperCase();

    let urls = {
        tradeToken: '#',
        tradePair: '#',
        withdrawUrl: '#',
        depositUrl: '#'
    };

    switch (cex) {
        case "GATE":
            if (token !== "USDT") urls.tradeToken = `https://www.gate.com/trade/${token}_USDT`;
            if (pair !== "USDT") urls.tradePair = `https://www.gate.com/trade/${pair}_USDT`;
            urls.withdrawUrl = `https://www.gate.com/myaccount/withdraw/${token}`;
            urls.depositUrl = `https://www.gate.com/myaccount/deposit/${pair}`;
            break;
        case "BINANCE":
            if (token !== "USDT") urls.tradeToken = `https://www.binance.com/en/trade/${token}_USDT`;
            if (pair !== "USDT") urls.tradePair = `https://www.binance.com/en/trade/${pair}_USDT`;
            urls.withdrawUrl = `https://www.binance.com/en/my/wallet/account/main/withdrawal/crypto/${token}`;
            urls.depositUrl = `https://www.binance.com/en/my/wallet/account/main/deposit/crypto/${pair}`;
            break;
        // Add other CEX cases here...
    }
    return urls;
}

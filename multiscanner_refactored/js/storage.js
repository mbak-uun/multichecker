const storagePrefix = "MULTISCANNER_";

export function getFromLocalStorage(key, defaultValue) {
    try {
        const raw = localStorage.getItem(storagePrefix + key);
        if (!raw) return defaultValue;
        return JSON.parse(raw);
    } catch (e) {
        console.error("Gagal parse localStorage:", e);
        return defaultValue;
    }
}

export function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(storagePrefix + key, JSON.stringify(value));
    } catch (error) {
        console.error("Error saat menyimpan data:", error);
        if (error.name === "QuotaExceededError") {
            toastr.error("MEMORY BROWSER PENUH!!! Sisa ruang tidak mencukupi.");
        } else {
            toastr.error("Terjadi kesalahan tak terduga saat menyimpan data.");
        }
    }
}

export function removeFromLocalStorage(key) {
    localStorage.removeItem(storagePrefix + key);
}

export function setLastAction(action) {
    const now = new Date();
    const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} | ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    const lastAction = { time: formattedTime, action: action };
    saveToLocalStorage("HISTORY", lastAction);
    try {
     $('#infoAPP').html(`${lastAction.action} at ${lastAction.time}`);
    } catch(e) {/*UI might not be ready*/}
}

export function downloadTokenScannerCSV() {
    const tokenData = getFromLocalStorage("TOKEN_SCANNER", []);
    const headers = ["id", "no", "symbol_in", "symbol_out", "chain", "sc_in", "des_in", "sc_out", "des_out", "dataCexs", "dataDexs", "status", "selectedCexs", "selectedDexs"];

    const rows = tokenData.map(token => headers.map(header => {
        let val = token[header] ?? "";
        if (typeof val === 'object') val = JSON.stringify(val);
        if (Array.isArray(token[header])) val = token[header].join('|');
        return `"${String(val).replace(/"/g, '""')}"`;
    }));

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "KOIN_MULTISCAN_SNIPER.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setLastAction("EXPORT DATA KOIN");
}

export function uploadTokenScannerCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
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
                    if (header === "dataCexs" || header === "dataDexs") {
                        try { val = JSON.parse(val || "{}"); } catch { val = {}; }
                    } else if (header === "selectedCexs" || header === "selectedDexs") {
                        val = val ? val.split("|") : [];
                    } else if (header === "no" || header === "des_in" || header === "des_out") {
                        val = val ? Number(val) : null;
                    } else if (header === "status") {
                        val = (val || "").toString().trim().toLowerCase() === "true";
                    }
                    obj[header] = val;
                });
                return obj;
            });

            saveToLocalStorage("TOKEN_SCANNER", tokenData);
            alert(`✅ BERHASIL IMPORT ${tokenData.length} TOKEN 📦`);
            setLastAction("IMPORT DATA KOIN");
            location.reload();

        } catch (error) {
            console.error("Error parsing CSV:", error);
            toastr.error("Format file CSV tidak valid!");
        }
    };
    reader.readAsText(file);
}

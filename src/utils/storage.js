const LocalStorageUtil = (function () {
    const storagePrefix = "MULTIALL_V1_";

    return {
        get(key, defaultValue = null) {
            try {
                const data = localStorage.getItem(storagePrefix + key);
                return data ? JSON.parse(data) : defaultValue;
            } catch (e) {
                console.warn("Gagal membaca localStorage:", e);
                return defaultValue;
            }
        },

        set(key, value) {
            try {
                localStorage.setItem(storagePrefix + key, JSON.stringify(value));
            } catch (error) {
                console.error("Error saat menyimpan data:", error);
                if (error.name === "QuotaExceededError") {
                    let usedSpace = new Blob(Object.values(localStorage)).size;
                    let totalSpace = 5 * 1024 * 1024; // 5MB
                    console.error(`Used space: ${usedSpace} / ${totalSpace}`);
                    alert("🗂️ MEMORY BROWSER PENUH!!! Sisa ruang tidak mencukupi.");
                } else {
                    alert("💾 Terjadi kesalahan tak terduga saat menyimpan data.");
                }
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(storagePrefix + key);
            } catch (e) {
                console.warn("Gagal menghapus localStorage:", e);
            }
        },

        has(key) {
            return localStorage.getItem(storagePrefix + key) !== null;
        },

        rawGet(key) {
            return localStorage.getItem(storagePrefix + key);
        },

        rawSet(key, value) {
            localStorage.setItem(storagePrefix + key, value);
        }
    };
})();

window.LocalStorageUtil = LocalStorageUtil;

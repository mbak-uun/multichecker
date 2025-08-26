const storagePrefix = "MULTICHECKER_";

// --- State Initialization ---

function loadState() {
    const tokens = localStorage.getItem(storagePrefix + 'TOKEN_SCANNER');
    const settings = localStorage.getItem(storagePrefix + 'SETTING_SCANNER');

    if (tokens) {
        window.APP_STATE.tokens = JSON.parse(tokens);
    }
    if (settings) {
        window.APP_STATE.settings = JSON.parse(settings);
    }
    console.log("Application state loaded from localStorage.");
}


// --- State Getters ---

function getTokens() {
    return window.APP_STATE.tokens || [];
}

function getSettings() {
    return window.APP_STATE.settings || {};
}


// --- State Setters ---

function saveTokens(tokens) {
    window.APP_STATE.tokens = tokens;
    try {
        localStorage.setItem(storagePrefix + 'TOKEN_SCANNER', JSON.stringify(tokens));
    } catch (error) {
        console.error("Error saving tokens to localStorage:", error);
        if (typeof toastr !== 'undefined') {
            toastr.error("Could not save token data. Storage might be full.");
        }
    }
}

function saveSettings(settings) {
    window.APP_STATE.settings = settings;
     try {
        localStorage.setItem(storagePrefix + 'SETTING_SCANNER', JSON.stringify(settings));
    } catch (error) {
        console.error("Error saving settings to localStorage:", error);
        if (typeof toastr !== 'undefined') {
            toastr.error("Could not save settings. Storage might be full.");
        }
    }
}

import { STORAGE_KEYS, DEFAULT_SETTINGS } from './config.js';
import { Storage } from './storage.js';
import { Utils } from './utils.js';
import { UI } from './ui.js';
import { Scanner } from './scanner.js';

/**
 * The main application object. Orchestrates all modules.
 */
const App = {
    // Non-persistent state for the running application
    AppState: {
        settings: null,
        tokens: [],
        history: [],
        gasFees: [],
        priceRate: null,
    },

    /**
     * Application entry point.
     */
    init() {
        console.log("Initializing application...");
        this.loadDataFromStorage();
        this.renderInitialUI();
        this.bindEventListeners();
        this.initScanner();
        UI.displayMessage('Application loaded successfully.', 'success');
    },

    /**
     * Loads all data from localStorage into AppState.
     * Uses defaults if data is not found.
     */
    loadDataFromStorage() {
        this.AppState.settings = Storage.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
        this.AppState.tokens = Storage.get(STORAGE_KEYS.TOKEN_LIST, []);
        this.AppState.history = Storage.get(STORAGE_KEYS.HISTORY, []);
        this.AppState.gasFees = Storage.get(STORAGE_KEYS.GAS_FEES, []);
        this.AppState.priceRate = Storage.get(STORAGE_KEYS.PRICE_RATE_USDT, {});

        // Ensure settings in storage are not missing any default keys
        this.AppState.settings = { ...DEFAULT_SETTINGS, ...this.AppState.settings };
        Storage.set(STORAGE_KEYS.SETTINGS, this.AppState.settings);
    },

    /**
     * Renders all UI components with data from AppState.
     */
    renderInitialUI() {
        UI.renderSettings(this.AppState.settings);
        UI.renderTokenList(this.AppState.tokens);
        UI.renderHistory(this.AppState.history);
        UI.renderGasFees(this.AppState.gasFees);
    },

    /**
     * Initializes the Scanner with the necessary callbacks.
     */
    initScanner() {
        Scanner.init({
            onLog: this.handleScannerLog.bind(this),
            onScanComplete: this.handleScanComplete.bind(this),
        });
    },

    /**
     * Sets up all application event listeners.
     */
    bindEventListeners() {
        // --- Settings ---
        $('#save-settings-btn').on('click', this.handleSaveSettings.bind(this));

        // --- Scanner Controls ---
        $('#start-scan-btn').on('click', () => Scanner.start());
        $('#stop-scan-btn').on('click', () => Scanner.stop());

        // --- Data Management ---
        $('#import-data-btn').on('click', this.handleImportData.bind(this)); // Assuming an import button
        $('#clear-history-btn').on('click', this.handleClearHistory.bind(this)); // Assuming a clear history button
    },

    // --- Event Handlers ---

    handleSaveSettings() {
        const settingsFromForm = UI.getSettingsFromForm();
        this.AppState.settings = settingsFromForm;
        Storage.set(STORAGE_KEYS.SETTINGS, this.AppState.settings);
        this.addLog("Settings saved.");
        UI.displayMessage('Settings have been saved successfully!', 'success');
    },

    handleImportData() {
        // Placeholder for an import functionality
        this.addLog("IMPORT DATA KOIN");
        UI.displayMessage('Data imported (placeholder).', 'primary');
    },

    handleClearHistory() {
        this.AppState.history = [];
        Storage.remove(STORAGE_KEYS.HISTORY);
        UI.renderHistory(this.AppState.history);
        this.addLog("History cleared.");
        UI.displayMessage('History has been cleared.', 'success');
    },

    // --- Scanner Callbacks ---

    /**
     * Handles log messages from the Scanner.
     * @param {object} log - The log object from the scanner { time, action }.
     */
    handleScannerLog(log) {
        // Add to the UI
        UI.addHistoryLog(log);
        // Add to the state
        this.AppState.history.unshift(log);
        // Persist to storage
        Storage.set(STORAGE_KEYS.HISTORY, this.AppState.history);
    },

    /**
     * Handles the scan completion event.
     */
    handleScanComplete() {
        UI.displayMessage('Scan complete.', 'success');
        // Maybe update some UI elements, e.g., button states
    },

    // --- Utility ---

    /**
     * A helper to add a log entry from within the App module.
     * @param {string} action - The description of the action.
     */
    addLog(action) {
        const log = {
            time: Utils.getCurrentTimestamp(),
            action: action
        };
        this.handleScannerLog(log);
    }
};

// --- Start the application ---
$(document).ready(() => {
    App.init();
});

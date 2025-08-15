import { Storage } from './storage.js';
import { STORAGE_KEYS } from './config.js';
import { Utils } from './utils.js';

/**
 * Handles the core token scanning logic.
 */
export const Scanner = {
    isRunning: false,
    _callbacks: {
        onLog: () => {},
        onScanComplete: () => {},
        onTokenScanned: () => {}
    },
    _settings: null,
    _tokens: [],

    /**
     * Initializes the Scanner with callbacks for logging and completion events.
     * @param {object} callbacks - Callbacks for events.
     * @param {function} callbacks.onLog - Called to log a history action.
     * @param {function} callbacks.onScanComplete - Called when the entire scan finishes.
     * @param {function} callbacks.onTokenScanned - Called after each token is scanned.
     */
    init(callbacks) {
        this._callbacks = { ...this._callbacks, ...callbacks };
    },

    /**
     * Starts the scanning process.
     */
    async start() {
        if (this.isRunning) {
            this._log({ action: "Scan is already in progress." });
            return;
        }

        this.isRunning = true;
        this._log({ action: "Starting scanner..." });

        // Load the latest settings and token list
        this._settings = Storage.get(STORAGE_KEYS.SETTINGS);
        this._tokens = Storage.get(STORAGE_KEYS.TOKEN_LIST);

        if (!this._settings || !this._tokens || this._tokens.length === 0) {
            this._log({ action: "Error: Settings or token list not found." });
            this.isRunning = false;
            this._callbacks.onScanComplete();
            return;
        }

        // Main scanning loop
        for (const token of this._tokens) {
            if (!this.isRunning) {
                this._log({ action: "Scanner stopped by user." });
                break;
            }

            // Filter token based on status or other criteria if needed
            if (!token.status) {
                // this._log({ action: `Skipping inactive token: ${token.symbol_in}` });
                continue;
            }

            await this._scanToken(token, this._settings);
            this._callbacks.onTokenScanned(token);

            // Wait for the specified delay before scanning the next coin
            await Utils.sleep(this._settings.jedaKoin);
        }

        this.isRunning = false;
        this._log({ action: "Scanner finished." });
        this._callbacks.onScanComplete();
    },

    /**
     * Stops the currently running scan.
     */
    stop() {
        if (!this.isRunning) {
            this._log({ action: "Scanner is not running." });
            return;
        }
        this.isRunning = false;
    },

    /**
     * Placeholder for the logic to scan a single token.
     * @private
     * @param {object} token - The token object to scan.
     * @param {object} settings - The current application settings.
     */
    async _scanToken(token, settings) {
        // This is where the core logic for checking a token would go.
        // e.g., API calls to DEXs/CEXs, price comparison, PNL calculation.

        this._log({ action: `Scanning ${token.symbol_in} on ${token.chain}...` });

        // Simulate network requests and processing time based on settings
        const apiCallDelay = settings.speedScan * 100; // Example calculation
        await Utils.sleep(apiCallDelay);

        // Simulate finding a result
        const pnl = (Math.random() * 5) - 1; // Random PNL between -1 and 4
        if (pnl > settings.filterPNL) {
            this._log({ action: `>>> Opportunity found for ${token.symbol_in}! PNL: ${pnl.toFixed(2)}%` });
        }
    },

    /**
     * Helper to fire the onLog callback with a timestamp.
     * @private
     * @param {object} logData - The data to log, e.g., { action: "Message" }.
     */
    _log(logData) {
        const log = {
            time: Utils.getCurrentTimestamp(),
            ...logData
        };
        this._callbacks.onLog(log);
    }
};

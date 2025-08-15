import { CONFIG_CHAINS } from './config.js';

/**
 * Handles all DOM manipulations and UI updates.
 */
export const UI = {

    /**
     * Populates the settings form with data from a settings object.
     * @param {object} settings - The settings object.
     */
    renderSettings(settings) {
        if (!settings) return;
        $('#nickname').val(settings.nickname);
        $('#jedaTimeGroup').val(settings.jedaTimeGroup);
        $('#jedaKoin').val(settings.jedaKoin);
        $('#filterPNL').val(settings.filterPNL);
        $('#walletMeta').val(settings.walletMeta);
        $('#scanPerKoin').val(settings.scanPerKoin);
        $('#speedScan').val(settings.speedScan);

        // Populate CEX delays
        for (const cex in settings.JedaCexs) {
            $(`#jeda-cex-${cex.toLowerCase()}`).val(settings.JedaCexs[cex]);
        }

        // Populate DEX delays
        for (const dex in settings.JedaDexs) {
            $(`#jeda-dex-${dex.toLowerCase()}`).val(settings.JedaDexs[dex]);
        }

        // Render chain checkboxes
        const chainsContainer = $('#chains-container');
        chainsContainer.empty();
        for (const chainKey in CONFIG_CHAINS) {
            const chain = CONFIG_CHAINS[chainKey];
            const isChecked = settings.AllChains.includes(chain.Nama_Chain);
            chainsContainer.append(`
                <label>
                    <input class="uk-checkbox" type="checkbox" value="${chain.Nama_Chain}" ${isChecked ? 'checked' : ''}>
                    <img src="${chain.ICON}" width="16" height="16" class="uk-margin-small-right">${chain.Nama_Chain}
                </label>
            `);
        }
    },

    /**
     * Reads all values from the settings form and returns a settings object.
     * @returns {object} The settings object from the form inputs.
     */
    getSettingsFromForm() {
        const settings = {
            nickname: $('#nickname').val(),
            jedaTimeGroup: parseInt($('#jedaTimeGroup').val(), 10),
            jedaKoin: parseInt($('#jedaKoin').val(), 10),
            filterPNL: parseFloat($('#filterPNL').val()),
            walletMeta: $('#walletMeta').val(),
            scanPerKoin: parseInt($('#scanPerKoin').val(), 10),
            speedScan: parseInt($('#speedScan').val(), 10),
            JedaCexs: {},
            JedaDexs: {},
            AllChains: []
        };

        // Get CEX delays
        $('#jeda-cexs-container input').each(function() {
            const cexName = $(this).data('cex-name').toUpperCase();
            settings.JedaCexs[cexName] = parseInt($(this).val(), 10);
        });

        // Get DEX delays
        $('#jeda-dexs-container input').each(function() {
            const dexName = $(this).data('dex-name');
            settings.JedaDexs[dexName] = parseInt($(this).val(), 10);
        });

        // Get selected chains
        $('#chains-container input:checked').each(function() {
            settings.AllChains.push($(this).val());
        });

        return settings;
    },

    /**
     * Renders the list of tokens into the token table.
     * @param {Array<object>} tokens - Array of token objects.
     */
    renderTokenList(tokens) {
        const tableBody = $('#token-table-body');
        tableBody.empty();
        if (!tokens || tokens.length === 0) {
            tableBody.append('<tr><td colspan="6" class="uk-text-center">No tokens found.</td></tr>');
            return;
        }

        tokens.forEach(token => {
            const row = `
                <tr data-id="${token.id}">
                    <td>${token.no}</td>
                    <td>${token.symbol_in} / ${token.symbol_out}</td>
                    <td>${token.chain}</td>
                    <td>${token.selectedCexs.join(', ')}</td>
                    <td>${token.selectedDexs.join(', ')}</td>
                    <td><span class="uk-badge ${token.status ? 'uk-badge-success' : ''}">${token.status ? 'Active' : 'Inactive'}</span></td>
                </tr>
            `;
            tableBody.append(row);
        });
    },

    /**
     * Renders the history logs.
     * @param {Array<object>} history - Array of history log objects.
     */
    renderHistory(history) {
        const historyContainer = $('#history-log');
        historyContainer.empty();
        if (!history || history.length === 0) return;

        history.forEach(log => {
            this.addHistoryLog(log, false); // Add without prepending
        });
    },

    /**
     * Adds a single log entry to the history view.
     * @param {object} log - The log object { time, action }.
     * @param {boolean} [prepend=true] - Whether to add the new log to the top.
     */
    addHistoryLog(log, prepend = true) {
        const logEntry = `<div><span class="uk-text-meta">${log.time}</span> - ${log.action}</div>`;
        if (prepend) {
            $('#history-log').prepend(logEntry);
        } else {
            $('#history-log').append(logEntry);
        }
    },

    /**
     * Renders the gas fees data into its table.
     * @param {Array<object>} gasFees - Array of gas fee objects.
     */
    renderGasFees(gasFees) {
        const tableBody = $('#gas-fees-table-body');
        tableBody.empty();
        if (!gasFees || gasFees.length === 0) {
            tableBody.append('<tr><td colspan="4" class="uk-text-center">No gas fee data.</td></tr>');
            return;
        }

        gasFees.forEach(fee => {
            const row = `
                <tr>
                    <td>${fee.chain}</td>
                    <td>${fee.gwei.toFixed(8)} ${fee.symbol}</td>
                    <td>$${fee.tokenPrice.toFixed(2)}</td>
                    <td>$${fee.gasUSD.toFixed(8)}</td>
                </tr>
            `;
            tableBody.append(row);
        });
    },

    /**
     * Displays a notification message to the user.
     * @param {string} message - The message to display.
     * @param {string} [status='primary'] - UIkit status (primary, success, warning, danger).
     */
    displayMessage(message, status = 'primary') {
        UIkit.notification({
            message: message,
            status: status,
            pos: 'top-center',
            timeout: 5000
        });
    }
};

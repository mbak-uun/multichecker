window.DEX_MODULES = window.DEX_MODULES || {};

window.DEX_MODULES.OKX = {
    fetchPrice: function(sc_input, des_input, sc_output, des_output, amount_in, chainCode, callback) {

        const selectedApiKey = getRandomApiKeyOKX(); // Assumes this global function is available
        const timestamp = new Date().toISOString();
        const method = "GET";
        const path = "/api/v5/dex/aggregator/quote";
        const queryParams = `amount=${amount_in}&chainIndex=${chainCode}&fromTokenAddress=${sc_input}&toTokenAddress=${sc_output}`;
        const dataToSign = timestamp + method + path + "?" + queryParams;

        // Assumes calculateSignature is available globally
        const signature = calculateSignature("OKX", selectedApiKey.secretKeyOKX, dataToSign, "BASE64");

        const apiUrl = `https://web3.okx.com${path}?${queryParams}`;

        const headers = {
            "OK-ACCESS-KEY": selectedApiKey.ApiKeyOKX,
            "OK-ACCESS-SIGN": signature,
            "OK-ACCESS-PASSPHRASE": selectedApiKey.PassphraseOKX,
            "OK-ACCESS-TIMESTAMP": timestamp,
            "Content-Type": "application/json"
        };

        $.ajax({
            url: apiUrl,
            method: 'GET',
            headers: headers,
            success: function(response) {
                try {
                    const amount_out = response.data[0].toTokenAmount / Math.pow(10, des_output);
                    const feeSwap = 0; // Or estimate if needed

                    if (!isNaN(amount_out)) {
                        callback(null, { dexTitle: "OKX", amount_out, FeeSwap: feeSwap });
                    } else {
                        callback({ message: "Could not parse OKX response" }, null);
                    }
                } catch (error) {
                    callback({ message: `Error processing OKX response: ${error.message}` }, null);
                }
            },
            error: function(xhr) {
                callback({ statusCode: xhr.status, message: `OKX API error: ${xhr.statusText}` }, null);
            }
        });
    }
};

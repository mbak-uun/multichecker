window.DEX_MODULES = window.DEX_MODULES || {};

window.DEX_MODULES.OKX = {
    fetchPrice: function(sc_input, des_input, sc_output, des_output, amount_in, chainName, chainCode, action, walletAddress, callback) {
        const selectedApiKey = getRandomApiKeyOKX();
        if (!selectedApiKey) {
            return callback({ statusCode: 401, pesanDEX: "OKX API Key not configured.", color: "#f39999", DEX: "OKX" }, null);
        }

        const timestamp = new Date().toISOString();
        const method = "GET";
        const path = "/api/v5/dex/aggregator/quote";
        const queryParams = `amount=${amount_in}&chainIndex=${chainCode}&fromTokenAddress=${sc_input}&toTokenAddress=${sc_output}`;
        const dataToSign = timestamp + method + path + "?" + queryParams;
        const signature = calculateSignature("OKX", selectedApiKey.secretKeyOKX, dataToSign, "BASE64");

        const apiUrl = `https://web3.okx.com${path}?${queryParams}`;

        $.ajax({
            url: apiUrl,
            method: 'GET',
            headers: {
                "OK-ACCESS-KEY": selectedApiKey.ApiKeyOKX,
                "OK-ACCESS-SIGN": signature,
                "OK-ACCESS-PASSPHRASE": selectedApiKey.PassphraseOKX,
                "OK-ACCESS-TIMESTAMP": timestamp,
                "Content-Type": "application/json"
            },
            success: function(response) {
                try {
                    const amount_out = response.data[0].toTokenAmount / Math.pow(10, des_output);
                    const feeSwap = getFeeSwap(chainName);
                    const result = {
                        dexTitle: "OKX",
                        amount_out: amount_out,
                        FeeSwap: feeSwap,
                    };
                    callback(null, result);
                } catch (error) {
                    callback({ statusCode: 500, pesanDEX: `Error processing OKX response: ${error.message}`, color: "#f39999", DEX: "OKX" }, null);
                }
            },
            error: function(xhr) {
                callback({ statusCode: xhr.status, pesanDEX: `OKX API error: ${xhr.statusText}`, color: "#f39999", DEX: "OKX" }, null);
            }
        });
    }
};

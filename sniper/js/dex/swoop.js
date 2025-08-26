window.DEX_MODULES = window.DEX_MODULES || {};

window.DEX_MODULES.SWOOP = {
    fetchPrice: function(sc_input, des_input, sc_output, des_output, amount_in, chainCode, walletAddress, callback) {

        const payload = {
            "chainId": chainCode,
            "aggregatorSlug": "swoop", // This seems to be hardcoded, might need to be dynamic
            "sender": walletAddress,
            "inToken": {
                "chainId": chainCode,
                "type": "TOKEN",
                "address": sc_input.toLowerCase(),
                "decimals": parseFloat(des_input)
            },
            "outToken": {
                "chainId": chainCode,
                "type": "TOKEN",
                "address": sc_output.toLowerCase(),
                "decimals": parseFloat(des_output)
            },
            "amountInWei": String(amount_in),
            "slippageBps": "100",
            "gasPriceGwei": Number(getFromLocalStorage('gasGWEI', 0)),
        };

        $.ajax({
            url: 'https://bzvwrjfhuefn.up.railway.app/swap',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function (response) {
                try {
                    const amount_out = parseFloat(response.amountOutWei) / Math.pow(10, des_output);
                    // The original getPriceSWOOP calls getFeeSwap, so this module needs it too.
                    // Assuming getFeeSwap is globally available for now.
                    const feeSwap = 0; //getFeeSwap(chainConfig.Nama_Chain);

                    if (!isNaN(amount_out)) {
                        callback(null, { dexTitle: "SWOOP", amount_out, FeeSwap: feeSwap });
                    } else {
                        callback({ message: "Could not parse SWOOP response" }, null);
                    }
                } catch (error) {
                     callback({ message: `Error processing SWOOP response: ${error.message}` }, null);
                }
            },
            error: function (xhr) {
                callback({ statusCode: xhr.status, message: `SWOOP API error: ${xhr.statusText}` }, null);
            }
        });
    }
};

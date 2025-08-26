// --- API Key Management ---

function getApiKeys() {
    return getFromLocalStorage('API_KEYS', {});
}

function saveApiKeys(keys) {
    saveToLocalStorage('API_KEYS', keys);
    renderApiKeyList();
}

function populateExchangeSelect() {
    const select = document.getElementById('exchangeSelect');
    select.innerHTML = '<option value="">-- Select Exchange --</option>';

    // Add CEXs that need keys
    Object.keys(window.CEX_MODULES).forEach(cex => {
        select.innerHTML += `<option value="${cex}">${cex}</option>`;
    });

    // Add DEXs that need keys (e.g., OKX)
    select.innerHTML += `<option value="OKXDEX">OKX (DEX)</option>`;

    select.addEventListener('change', () => {
        const selected = select.value;
        const passphraseField = document.getElementById('passphrase-field');
        if (selected === 'OKXDEX' || selected === 'OKX') {
            passphraseField.style.display = 'block';
        } else {
            passphraseField.style.display = 'none';
        }
    });
}

function renderApiKeyList() {
    const keys = getApiKeys();
    const list = document.getElementById('apiKeyList');
    list.innerHTML = '';

    for (const exchange in keys) {
        const keyData = keys[exchange];
        const partialKey = keyData.key ? `${keyData.key.substring(0, 4)}...${keyData.key.substring(keyData.key.length - 4)}` : 'N/A';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${exchange}</td>
            <td>${partialKey}</td>
            <td>
                <button class="uk-button uk-button-small" onclick="editApiKey('${exchange}')">Edit</button>
                <button class="uk-button uk-button-danger uk-button-small" onclick="deleteApiKey('${exchange}')">Delete</button>
            </td>
        `;
        list.appendChild(row);
    }
}

function handleApiKeyFormSubmit(event) {
    event.preventDefault();
    const exchange = document.getElementById('exchangeSelect').value;
    const key = document.getElementById('apiKeyInput').value;
    const secret = document.getElementById('apiSecretInput').value;
    const passphrase = document.getElementById('apiPassphraseInput').value;
    const id = document.getElementById('apiKeyId').value;

    if (!exchange || !key || !secret) {
        showAlert('Please fill in all required fields.', 'danger');
        return;
    }

    const keys = getApiKeys();
    keys[exchange] = { key, secret };
    if (passphrase) {
        keys[exchange].passphrase = passphrase;
    }

    saveApiKeys(keys);
    resetApiKeyForm();
    showAlert('API Key saved successfully!', 'success');
}

function editApiKey(exchange) {
    const keys = getApiKeys();
    const keyData = keys[exchange];
    if (keyData) {
        document.getElementById('exchangeSelect').value = exchange;
        document.getElementById('apiKeyInput').value = keyData.key;
        document.getElementById('apiSecretInput').value = keyData.secret;
        if (keyData.passphrase) {
            document.getElementById('apiPassphraseInput').value = keyData.passphrase;
            document.getElementById('passphrase-field').style.display = 'block';
        } else {
             document.getElementById('passphrase-field').style.display = 'none';
        }
        document.getElementById('apiKeyId').value = exchange; // Use exchange as ID
    }
}

function deleteApiKey(exchange) {
    if (confirm(`Are you sure you want to delete the API key for ${exchange}?`)) {
        const keys = getApiKeys();
        delete keys[exchange];
        saveApiKeys(keys);
        showAlert('API Key deleted.', 'success');
    }
}

function resetApiKeyForm() {
    document.getElementById('apiKeyForm').reset();
    document.getElementById('apiKeyId').value = '';
    document.getElementById('passphrase-field').style.display = 'none';
}

function setupApiKeyManager() {
    populateExchangeSelect();
    renderApiKeyList();
    document.getElementById('apiKeyForm').addEventListener('submit', handleApiKeyFormSubmit);
    document.getElementById('cancelApiKeyEdit').addEventListener('click', resetApiKeyForm);
}

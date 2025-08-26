document.addEventListener('DOMContentLoaded', () => {
    // Load initial state from localStorage
    loadState();

    // Initial display of tokens
    displayTokens();

    // Setup button listeners
    document.getElementById('apiKeyManagerBtn').addEventListener('click', () => {
        UIkit.modal('#apiKeyModal').show();
        setupApiKeyManager();
    });
    document.getElementById('addTokenBtn').addEventListener('click', () => openModal('addTokenModal'));
    document.getElementById('startMonitor').addEventListener('click', startMonitoring);
    document.getElementById('stopMonitor').addEventListener('click', stopMonitoring);
    document.getElementById('exportCsvBtn').addEventListener('click', exportToCSV);
    document.getElementById('importCsvBtn').addEventListener('click', () => document.getElementById('csvFileInput').click());
    document.getElementById('csvFileInput').addEventListener('change', importFromCSV);

    // Setup modal listeners
    document.querySelector('.close-btn').addEventListener('click', () => closeModal('addTokenModal'));
    document.getElementById('addTokenForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addToken();
    });

    // Edit Modal listeners
    document.querySelector('#editModal .close-btn').addEventListener('click', () => closeModal('editModal'));
    document.getElementById('editTokenForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveToken();
    });
     document.getElementById('cancelEditBtn').addEventListener('click', cancelEdit);


    // Close modal if user clicks outside of it
    window.onclick = function(event) {
        const addModal = document.getElementById('addTokenModal');
        const editModal = document.getElementById('editModal');
        if (event.target == addModal) {
            closeModal('addTokenModal');
        }
        if (event.target == editModal) {
            closeModal('editModal');
        }
    }

    // Initial state for monitoring
    updateMonitoringStatus(false);
    document.getElementById('stopMonitor').disabled = true;

    logMessage('Application initialized. Ready to monitor.');
});

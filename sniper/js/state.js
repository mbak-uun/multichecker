// Defines the central state object for the application.

window.APP_STATE = {
    isMonitoring: false,
    monitoringInterval: null,
    tokens: [], // This will be loaded from localStorage at startup
    settings: {}, // This will also be loaded
    // other dynamic state can be added here
};

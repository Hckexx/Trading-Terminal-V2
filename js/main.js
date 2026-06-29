/* ==========================================================================
   TRADETERMINAL V2 — Main Entry Point
   ========================================================================== */

(function() {
    'use strict';

    function init() {
        // Load persisted data
        loadState();

        // Initialize shared UI
        UI.init();

        // Initialize router (handles navigation)
        Router.init();

        // Initialize Dashboard view (it's the default)
        DashboardView.init();

        // Initialize Journal view
        JournalView.init();

        // Initialize Settings view
        SettingsView.init();

       // Initialize Calculator view
CalculatorView.init();

        // Subscribe to journal updates for dashboard refresh
        EventBus.on(EVENTS.JOURNAL_UPDATED, () => {
            if (Router.currentView === 'dashboard') {
                DashboardView.refresh();
               
            }
        });

        // Mark ready
        console.log(`TradeTerminal v${CONFIG.VERSION} ready.`);
    }

    function loadState() {
        // Load trader name
        Store.traderName = Storage.load(CONFIG.STORAGE_KEYS.TRADER_NAME, '');

        // Load accounts
        Store.accounts = Storage.load(CONFIG.STORAGE_KEYS.ACCOUNTS, []);

        // Load active account
        Store.activeAccountId = Storage.load(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT, null);

        // Load journal
        Store.journal = Storage.load(CONFIG.STORAGE_KEYS.JOURNAL, []);

        // If active account doesn't exist in accounts, clear it
        if (Store.activeAccountId && !Store.accounts.find(a => a.id === Store.activeAccountId)) {
            Store.activeAccountId = null;
            Storage.remove(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT);
        }

        // If no active account but accounts exist, set first as active
        if (!Store.activeAccountId && Store.accounts.length > 0) {
            Store.accounts[0].isActive = true;
            Store.activeAccountId = Store.accounts[0].id;
            Storage.save(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT, Store.accounts[0].id);
            Storage.save(CONFIG.STORAGE_KEYS.ACCOUNTS, Store.accounts);
        }
    }

    // Start on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

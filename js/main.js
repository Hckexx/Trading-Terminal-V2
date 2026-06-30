(function() {
    'use strict';

    function init() {
        loadState();
        
        if (typeof UI !== 'undefined') UI.init();
        if (typeof Router !== 'undefined') Router.init();
        if (typeof DashboardView !== 'undefined') DashboardView.init();
        if (typeof JournalView !== 'undefined') JournalView.init();
        if (typeof SettingsView !== 'undefined') SettingsView.init();
        if (typeof CalculatorView !== 'undefined') CalculatorView.init();
        if (typeof ChecklistView !== 'undefined') ChecklistView.init();

        if (typeof EventBus !== 'undefined') {
            EventBus.on(EVENTS.JOURNAL_UPDATED, function() {
                if (typeof Router !== 'undefined' && Router.currentView === 'dashboard') {
                    if (typeof DashboardView !== 'undefined') DashboardView.refresh();
                }
            });
        }

        console.log('TradeTerminal ready.');
    }

    function loadState() {
        if (typeof Storage === 'undefined' || typeof Store === 'undefined') return;
        
        Store.traderName = Storage.load(CONFIG.STORAGE_KEYS.TRADER_NAME, '');
        Store.accounts = Storage.load(CONFIG.STORAGE_KEYS.ACCOUNTS, []);
        Store.activeAccountId = Storage.load(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT, null);
        Store.journal = Storage.load(CONFIG.STORAGE_KEYS.JOURNAL, []);

        if (Store.activeAccountId && !Store.accounts.find(function(a) { return a.id === Store.activeAccountId; })) {
            Store.activeAccountId = null;
            Storage.remove(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT);
        }
        if (!Store.activeAccountId && Store.accounts.length > 0) {
            Store.accounts[0].isActive = true;
            Store.activeAccountId = Store.accounts[0].id;
            Storage.save(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT, Store.accounts[0].id);
            Storage.save(CONFIG.STORAGE_KEYS.ACCOUNTS, Store.accounts);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

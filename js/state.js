/* ==========================================================================
   TRADETERMINAL V2 — State Management & Event Bus
   ========================================================================== */

const Store = {
    traderName: '',
    accounts: [],
    activeAccountId: null,
    journal: []
};

const EventBus = {
    _listeners: {},

    on(event, callback) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(callback);
    },

    off(event, callback) {
        if (!this._listeners[event]) return;
        this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    },

    emit(event, data) {
        if (!this._listeners[event]) return;
        this._listeners[event].forEach(cb => {
            try {
                cb(data);
            } catch (e) {
                console.error(`EventBus error [${event}]:`, e);
            }
        });
    }
};

// Key events
const EVENTS = {
    ACCOUNTS_UPDATED: 'accounts:updated',
    ACTIVE_ACCOUNT_CHANGED: 'account:changed',
    JOURNAL_UPDATED: 'journal:updated',
    TRADER_NAME_CHANGED: 'trader:name:changed',
    VIEW_CHANGED: 'view:changed',
    DASHBOARD_REFRESH: 'dashboard:refresh'
};

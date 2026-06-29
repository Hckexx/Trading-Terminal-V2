/* ==========================================================================
   TRADETERMINAL V2 — Settings View (Redesigned)
   Workspace + Trading Accounts + Data Management
   ========================================================================== */

const SettingsView = {
    elements: {},
    editingAccountId: null,

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.detectTimezone();
        this.render();
    },

    cacheDOM() {
        // Workspace
        this.elements.displayName = document.getElementById('settingsDisplayName');
        this.elements.theme = document.getElementById('settingsTheme');
        this.elements.currency = document.getElementById('settingsCurrency');
        this.elements.timezone = document.getElementById('settingsTimezone');
        this.elements.timezoneHint = document.getElementById('timezoneHint');

        // Accounts
        this.elements.accountsList = document.getElementById('accountsList');
        this.elements.btnAddAccount = document.getElementById('btnAddAccount');

        // Account Modal
        this.elements.accountModal = document.getElementById('accountModal');
        this.elements.accountModalTitle = document.getElementById('accountModalTitle');
        this.elements.accountForm = document.getElementById('accountForm');
        this.elements.accountFormId = document.getElementById('accountFormId');
        this.elements.accountName = document.getElementById('accountName');
        this.elements.accountBroker = document.getElementById('accountBroker');
        this.elements.accountType = document.getElementById('accountType');
        this.elements.accountCurrency = document.getElementById('accountCurrency');
        this.elements.accountBalance = document.getElementById('accountBalance');
        this.elements.accountDailyDD = document.getElementById('accountDailyDD');
        this.elements.accountOverallDD = document.getElementById('accountOverallDD');
        this.elements.accountProfitTarget = document.getElementById('accountProfitTarget');
        this.elements.btnAccountModalClose = document.getElementById('btnAccountModalClose');
        this.elements.btnAccountModalCancel = document.getElementById('btnAccountModalCancel');

        // Data
        this.elements.btnExportData = document.getElementById('btnExportData');
        this.elements.btnImportData = document.getElementById('btnImportData');
        this.elements.importFileInput = document.getElementById('importFileInput');
        this.elements.btnResetData = document.getElementById('btnResetData');
    },

    bindEvents() {
    // Save workspace button
    const btnSave = document.getElementById('btnSaveWorkspace');
    if (btnSave) {
        btnSave.addEventListener('click', () => {
            this.saveWorkspaceSettings();
            UI.showToast('Settings applied.');
        });
    }

    // Workspace — also save on input/blur
    this.elements.displayName.addEventListener('blur', () => this.saveWorkspaceSettings());
    this.elements.theme.addEventListener('change', () => this.saveWorkspaceSettings());
    this.elements.currency.addEventListener('change', () => this.saveWorkspaceSettings());
    this.elements.timezone.addEventListener('change', () => this.saveWorkspaceSettings());

    // Accounts
    this.elements.btnAddAccount.addEventListener('click', () => this.openAccountModal());
    this.elements.btnAccountModalClose.addEventListener('click', () => this.closeAccountModal());
    this.elements.btnAccountModalCancel.addEventListener('click', () => this.closeAccountModal());
    this.elements.accountModal.addEventListener('click', (e) => {
        if (e.target === this.elements.accountModal) this.closeAccountModal();
    });
    this.elements.accountForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveAccount();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.closeAccountModal();
    });

    // Data
    this.elements.btnExportData.addEventListener('click', () => this.exportData());
    this.elements.btnImportData.addEventListener('click', () => this.elements.importFileInput.click());
    this.elements.importFileInput.addEventListener('change', (e) => this.importData(e));
    this.elements.btnResetData.addEventListener('click', () => this.resetAllData());

    // Re-render on view change
    EventBus.on(EVENTS.VIEW_CHANGED, (data) => {
        if (data.view === 'settings') this.render();
    });
},

saveWorkspaceSettings() {
    const displayName = this.elements.displayName.value.trim();
    const settings = {
        displayName: displayName,
        theme: this.elements.theme.value,
        currency: this.elements.currency.value,
        timezone: this.elements.timezone.value
    };
    Storage.save(CONFIG.STORAGE_KEYS.SETTINGS, settings);

    // Sync display name to Store immediately
    Store.traderName = displayName;
    Storage.save(CONFIG.STORAGE_KEYS.TRADER_NAME, displayName);
    EventBus.emit(EVENTS.TRADER_NAME_CHANGED, displayName);
    EventBus.emit(EVENTS.DASHBOARD_REFRESH);
},

// Update saveAccount to enforce 10 account limit
saveAccount() {
    const name = this.elements.accountName.value.trim();
    const broker = this.elements.accountBroker.value.trim();
    const type = this.elements.accountType.value;
    const currency = this.elements.accountCurrency.value;
    const balance = parseFloat(this.elements.accountBalance.value);
    const dailyDD = parseFloat(this.elements.accountDailyDD.value) || 0;
    const overallDD = parseFloat(this.elements.accountOverallDD.value) || 0;
    const profitTarget = parseFloat(this.elements.accountProfitTarget.value) || 0;

    if (!name) { UI.showToast('Please enter an account name.'); return; }
    if (isNaN(balance) || balance <= 0) { UI.showToast('Please enter a valid balance.'); return; }

    // Check account limit for new accounts
    if (!this.editingAccountId && Store.accounts.length >= 10) {
        UI.showToast('Maximum 10 accounts allowed. Delete an existing account first.');
        return;
    }

    const accountData = {
        id: this.editingAccountId || UI.generateId(),
        name,
        broker,
        type,
        currency,
        balance,
        dailyDDPercent: dailyDD,
        overallDDPercent: overallDD,
        profitTargetPercent: profitTarget,
        isActive: false
    };

    if (this.editingAccountId) {
        const index = Store.accounts.findIndex(a => a.id === this.editingAccountId);
        if (index !== -1) {
            accountData.isActive = Store.accounts[index].isActive;
            Store.accounts[index] = accountData;
        }
        UI.showToast('Account updated.');
    } else {
        if (Store.accounts.length === 0) {
            accountData.isActive = true;
            Store.activeAccountId = accountData.id;
            Storage.save(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT, accountData.id);
        }
        Store.accounts.push(accountData);
        UI.showToast('Account added.');
    }

    this.persistAndNotify();
    this.closeAccountModal();
},

    // ==========================================
    // WORKSPACE
    // ==========================================
    detectTimezone() {
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (tz && this.elements.timezoneHint) {
                this.elements.timezoneHint.textContent = `Detected: ${tz}`;
            }
        } catch (e) {
            // Silently fail
        }
    },

    saveWorkspaceSettings() {
        const settings = {
            displayName: this.elements.displayName.value.trim(),
            theme: this.elements.theme.value,
            currency: this.elements.currency.value,
            timezone: this.elements.timezone.value
        };
        Storage.save(CONFIG.STORAGE_KEYS.SETTINGS, settings);

        // Sync display name to Store
        Store.traderName = settings.displayName;
        Storage.save(CONFIG.STORAGE_KEYS.TRADER_NAME, settings.displayName);
        EventBus.emit(EVENTS.TRADER_NAME_CHANGED, settings.displayName);
        EventBus.emit(EVENTS.DASHBOARD_REFRESH);
    },

    loadWorkspaceSettings() {
        const settings = Storage.load(CONFIG.STORAGE_KEYS.SETTINGS, {});
        if (settings.displayName) this.elements.displayName.value = settings.displayName;
        if (settings.theme) this.elements.theme.value = settings.theme;
        if (settings.currency) this.elements.currency.value = settings.currency;
        if (settings.timezone) this.elements.timezone.value = settings.timezone;
    },

    // ==========================================
    // RENDER
    // ==========================================
    render() {
        this.loadWorkspaceSettings();
        this.renderAccountsList();
    },

    renderAccountsList() {
        const container = this.elements.accountsList;

        if (Store.accounts.length === 0) {
            container.innerHTML = '<p class="empty-state">No accounts yet. Add one to get started.</p>';
            return;
        }

        container.innerHTML = Store.accounts.map(acc => this.buildAccountCard(acc)).join('');

        container.querySelectorAll('.account-card').forEach(card => {
            const accountId = card.dataset.accountId;
            card.querySelector('.btn-edit-account')?.addEventListener('click', () => this.openAccountModal(accountId));
            card.querySelector('.btn-delete-account')?.addEventListener('click', () => this.deleteAccount(accountId));
            card.querySelector('.btn-set-active')?.addEventListener('click', () => this.setActiveAccount(accountId));
        });
    },

    buildAccountCard(account) {
        const isActive = account.id === Store.activeAccountId;
        const typeClass = this.getTypeClass(account.type);
        const typeLabel = this.getTypeLabel(account.type);

        return `
            <div class="account-card type-${typeClass}" data-account-id="${account.id}">
                <div class="account-card-header">
                    <div class="account-card-info">
                        <span class="account-card-name">${UI.escapeHTML(account.name)}</span>
                        ${account.broker ? `<span class="account-card-broker">${UI.escapeHTML(account.broker)}</span>` : ''}
                        <div class="account-card-meta">
                            <span class="account-card-type ${typeClass}">${typeLabel}</span>
                            <span class="account-card-status ${isActive ? 'active' : 'inactive'}">${isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                    </div>
                    <div class="account-card-actions">
                        ${!isActive ? `<button class="btn btn-sm btn-primary btn-set-active">Set Active</button>` : ''}
                        <button class="btn btn-sm btn-secondary btn-edit-account">Edit</button>
                        <button class="btn btn-sm btn-danger btn-delete-account">Delete</button>
                    </div>
                </div>
                <div class="account-card-details">
                    <div class="account-detail">
                        <span class="account-detail-label">Balance</span>
                        <span class="account-detail-value">${FORMATTERS.compact.format(account.balance)}</span>
                    </div>
                    ${account.dailyDDPercent > 0 ? `
                    <div class="account-detail">
                        <span class="account-detail-label">Daily DD Limit</span>
                        <span class="account-detail-value">${account.dailyDDPercent}%</span>
                    </div>` : ''}
                    ${account.overallDDPercent > 0 ? `
                    <div class="account-detail">
                        <span class="account-detail-label">Overall DD Limit</span>
                        <span class="account-detail-value">${account.overallDDPercent}%</span>
                    </div>` : ''}
                    ${account.profitTargetPercent > 0 ? `
                    <div class="account-detail">
                        <span class="account-detail-label">Profit Target</span>
                        <span class="account-detail-value">${account.profitTargetPercent}%</span>
                    </div>` : ''}
                </div>
            </div>
        `;
    },

    getTypeClass(type) {
        const map = { 'Live': 'live', 'Demo': 'demo', 'Prop Challenge': 'challenge', 'Funded': 'funded' };
        return map[type] || 'demo';
    },

    getTypeLabel(type) {
        const map = { 'Live': 'Live', 'Demo': 'Demo', 'Prop Challenge': 'Challenge', 'Funded': 'Funded' };
        return map[type] || type;
    },

    // ==========================================
    // ACCOUNT MODAL
    // ==========================================
    openAccountModal(accountId = null) {
        this.editingAccountId = accountId;

        if (accountId) {
            const account = Store.accounts.find(a => a.id === accountId);
            if (!account) return;
            this.elements.accountModalTitle.textContent = 'Edit Account';
            this.elements.accountFormId.value = account.id;
            this.elements.accountName.value = account.name;
            this.elements.accountBroker.value = account.broker || '';
            this.elements.accountType.value = account.type;
            this.elements.accountCurrency.value = account.currency || 'USD';
            this.elements.accountBalance.value = account.balance;
            this.elements.accountDailyDD.value = account.dailyDDPercent || '';
            this.elements.accountOverallDD.value = account.overallDDPercent || '';
            this.elements.accountProfitTarget.value = account.profitTargetPercent || '';
        } else {
            this.elements.accountModalTitle.textContent = 'Add Account';
            this.elements.accountForm.reset();
            this.elements.accountFormId.value = '';
            this.elements.accountCurrency.value = Store.settings?.currency || 'USD';
        }

        this.elements.accountModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    },

    closeAccountModal() {
        this.elements.accountModal.classList.add('hidden');
        document.body.style.overflow = '';
        this.editingAccountId = null;
    },

    saveAccount() {
        const name = this.elements.accountName.value.trim();
        const broker = this.elements.accountBroker.value.trim();
        const type = this.elements.accountType.value;
        const currency = this.elements.accountCurrency.value;
        const balance = parseFloat(this.elements.accountBalance.value);
        const dailyDD = parseFloat(this.elements.accountDailyDD.value) || 0;
        const overallDD = parseFloat(this.elements.accountOverallDD.value) || 0;
        const profitTarget = parseFloat(this.elements.accountProfitTarget.value) || 0;

        if (!name) { UI.showToast('Please enter an account name.'); return; }
        if (isNaN(balance) || balance <= 0) { UI.showToast('Please enter a valid balance.'); return; }

        const accountData = {
            id: this.editingAccountId || UI.generateId(),
            name,
            broker,
            type,
            currency,
            balance,
            dailyDDPercent: dailyDD,
            overallDDPercent: overallDD,
            profitTargetPercent: profitTarget,
            isActive: false
        };

        if (this.editingAccountId) {
            const index = Store.accounts.findIndex(a => a.id === this.editingAccountId);
            if (index !== -1) {
                accountData.isActive = Store.accounts[index].isActive;
                Store.accounts[index] = accountData;
            }
            UI.showToast('Account updated.');
        } else {
            if (Store.accounts.length === 0) {
                accountData.isActive = true;
                Store.activeAccountId = accountData.id;
                Storage.save(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT, accountData.id);
            }
            Store.accounts.push(accountData);
            UI.showToast('Account added.');
        }

        this.persistAndNotify();
        this.closeAccountModal();
    },

    setActiveAccount(accountId) {
        Store.accounts.forEach(a => a.isActive = false);
        const account = Store.accounts.find(a => a.id === accountId);
        if (account) {
            account.isActive = true;
            Store.activeAccountId = accountId;
            Storage.save(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT, accountId);
            this.persistAndNotify();
            UI.showToast(`${account.name} is now active.`);
        }
    },

    deleteAccount(accountId) {
        const account = Store.accounts.find(a => a.id === accountId);
        if (!account) return;
        if (!confirm(`Delete account "${account.name}"?`)) return;

        const wasActive = account.isActive;
        Store.accounts = Store.accounts.filter(a => a.id !== accountId);

        if (wasActive) {
            Store.activeAccountId = null;
            Storage.remove(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT);
            if (Store.accounts.length > 0) {
                Store.accounts[0].isActive = true;
                Store.activeAccountId = Store.accounts[0].id;
                Storage.save(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT, Store.accounts[0].id);
            }
        }

        this.persistAndNotify();
        UI.showToast('Account deleted.');
    },

    // ==========================================
    // DATA MANAGEMENT
    // ==========================================
    exportData() {
        const data = Storage.exportAll();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tradeterminal-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        UI.showToast('Backup exported.');
    },

    importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (!confirm('This will replace all existing data. Continue?')) return;
                Storage.importAll(data);
                location.reload();
            } catch (err) {
                UI.showToast('Invalid backup file.');
            }
        };
        reader.readAsText(file);
        this.elements.importFileInput.value = '';
    },

    resetAllData() {
        if (!confirm('Delete ALL data? This cannot be undone.')) return;
        if (!confirm('Are you absolutely sure?')) return;

        Storage.clearAll();
        Store.accounts = [];
        Store.activeAccountId = null;
        Store.journal = [];
        Store.traderName = '';

        this.render();
        EventBus.emit(EVENTS.ACCOUNTS_UPDATED);
        EventBus.emit(EVENTS.ACTIVE_ACCOUNT_CHANGED);
        EventBus.emit(EVENTS.JOURNAL_UPDATED);
        EventBus.emit(EVENTS.DASHBOARD_REFRESH);
        UI.showToast('All data has been reset.');
    },

    // ==========================================
    // PERSISTENCE
    // ==========================================
    persistAndNotify() {
        Storage.save(CONFIG.STORAGE_KEYS.ACCOUNTS, Store.accounts);
        Storage.save(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT, Store.activeAccountId);
        this.render();
        EventBus.emit(EVENTS.ACCOUNTS_UPDATED, Store.accounts);
        EventBus.emit(EVENTS.ACTIVE_ACCOUNT_CHANGED, Store.activeAccountId);
        EventBus.emit(EVENTS.DASHBOARD_REFRESH);
    }
};

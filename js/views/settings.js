/* ==========================================================================
   TRADETERMINAL V2 — Settings View (Fixed)
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
        // Save workspace button — with confirmation toast
        const btnSave = document.getElementById('btnSaveWorkspace');
        if (btnSave) {
            btnSave.addEventListener('click', () => {
                this.saveWorkspaceSettings();
                const name = this.elements.displayName.value.trim();
                if (name) {
                    UI.showToast('Settings saved. Welcome, ' + name + '.');
                } else {
                    UI.showToast('Settings saved.');
                }
            });
        }

        // Workspace — also save on blur/change
        if (this.elements.displayName) {
            this.elements.displayName.addEventListener('blur', () => {
                this.saveWorkspaceSettings();
            });
        }
        if (this.elements.theme) {
            this.elements.theme.addEventListener('change', () => this.saveWorkspaceSettings());
        }
        if (this.elements.currency) {
            this.elements.currency.addEventListener('change', () => this.saveWorkspaceSettings());
        }
        if (this.elements.timezone) {
            this.elements.timezone.addEventListener('change', () => this.saveWorkspaceSettings());
        }

        // Accounts — Add Account button
        if (this.elements.btnAddAccount) {
            this.elements.btnAddAccount.addEventListener('click', () => {
                console.log('Add Account button clicked');
                this.openAccountModal();
            });
        }

        // Account Modal close buttons
        if (this.elements.btnAccountModalClose) {
            this.elements.btnAccountModalClose.addEventListener('click', () => this.closeAccountModal());
        }
        if (this.elements.btnAccountModalCancel) {
            this.elements.btnAccountModalCancel.addEventListener('click', () => this.closeAccountModal());
        }
        if (this.elements.accountModal) {
            this.elements.accountModal.addEventListener('click', (e) => {
                if (e.target === this.elements.accountModal) this.closeAccountModal();
            });
        }

        // Save account form
        if (this.elements.accountForm) {
            this.elements.accountForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveAccount();
            });
        }

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeAccountModal();
        });

        // Data buttons
        if (this.elements.btnExportData) {
            this.elements.btnExportData.addEventListener('click', () => this.exportData());
        }
        if (this.elements.btnImportData) {
            this.elements.btnImportData.addEventListener('click', () => this.elements.importFileInput.click());
        }
        if (this.elements.importFileInput) {
            this.elements.importFileInput.addEventListener('change', (e) => this.importData(e));
        }
        if (this.elements.btnResetData) {
            this.elements.btnResetData.addEventListener('click', () => this.resetAllData());
        }

        // Re-render when settings view becomes visible
        EventBus.on(EVENTS.VIEW_CHANGED, (data) => {
            if (data.view === 'settings') {
                this.render();
            }
        });
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
        const displayName = this.elements.displayName ? this.elements.displayName.value.trim() : '';
        const settings = {
            displayName: displayName,
            theme: this.elements.theme ? this.elements.theme.value : 'midnight',
            currency: this.elements.currency ? this.elements.currency.value : 'USD',
            timezone: this.elements.timezone ? this.elements.timezone.value : 'auto'
        };
        Storage.save(CONFIG.STORAGE_KEYS.SETTINGS, settings);

        // Sync display name to Store immediately
        Store.traderName = displayName;
        Storage.save(CONFIG.STORAGE_KEYS.TRADER_NAME, displayName);
        EventBus.emit(EVENTS.TRADER_NAME_CHANGED, displayName);
        EventBus.emit(EVENTS.DASHBOARD_REFRESH);

        console.log('Workspace settings saved:', settings);
    },

    loadWorkspaceSettings() {
        const settings = Storage.load(CONFIG.STORAGE_KEYS.SETTINGS, {});
        if (this.elements.displayName && settings.displayName) {
            this.elements.displayName.value = settings.displayName;
        }
        if (this.elements.theme && settings.theme) {
            this.elements.theme.value = settings.theme;
        }
        if (this.elements.currency && settings.currency) {
            this.elements.currency.value = settings.currency;
        }
        if (this.elements.timezone && settings.timezone) {
            this.elements.timezone.value = settings.timezone;
        }
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
        if (!container) return;

        if (!Store.accounts || Store.accounts.length === 0) {
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
        // Check limit for new accounts
        if (!accountId && Store.accounts && Store.accounts.length >= 10) {
            UI.showToast('Maximum 10 accounts allowed. Delete an existing account first.');
            return;
        }

        this.editingAccountId = accountId;

        if (accountId) {
            const account = Store.accounts.find(a => a.id === accountId);
            if (!account) return;
            if (this.elements.accountModalTitle) this.elements.accountModalTitle.textContent = 'Edit Account';
            if (this.elements.accountFormId) this.elements.accountFormId.value = account.id;
            if (this.elements.accountName) this.elements.accountName.value = account.name;
            if (this.elements.accountBroker) this.elements.accountBroker.value = account.broker || '';
            if (this.elements.accountType) this.elements.accountType.value = account.type;
            if (this.elements.accountCurrency) this.elements.accountCurrency.value = account.currency || 'USD';
            if (this.elements.accountBalance) this.elements.accountBalance.value = account.balance;
            if (this.elements.accountDailyDD) this.elements.accountDailyDD.value = account.dailyDDPercent || '';
            if (this.elements.accountOverallDD) this.elements.accountOverallDD.value = account.overallDDPercent || '';
            if (this.elements.accountProfitTarget) this.elements.accountProfitTarget.value = account.profitTargetPercent || '';
        } else {
            if (this.elements.accountModalTitle) this.elements.accountModalTitle.textContent = 'Add Account';
            if (this.elements.accountForm) this.elements.accountForm.reset();
            if (this.elements.accountFormId) this.elements.accountFormId.value = '';
            if (this.elements.accountCurrency) this.elements.accountCurrency.value = 'USD';
        }

        if (this.elements.accountModal) {
            this.elements.accountModal.classList.remove('hidden');
        }
        document.body.style.overflow = 'hidden';
        console.log('Account modal opened. Edit mode:', !!accountId);
    },

    closeAccountModal() {
        if (this.elements.accountModal) {
            this.elements.accountModal.classList.add('hidden');
        }
        document.body.style.overflow = '';
        this.editingAccountId = null;
    },

    saveAccount() {
        const name = this.elements.accountName ? this.elements.accountName.value.trim() : '';
        const broker = this.elements.accountBroker ? this.elements.accountBroker.value.trim() : '';
        const type = this.elements.accountType ? this.elements.accountType.value : 'Demo';
        const currency = this.elements.accountCurrency ? this.elements.accountCurrency.value : 'USD';
        const balance = this.elements.accountBalance ? parseFloat(this.elements.accountBalance.value) : 0;
        const dailyDD = this.elements.accountDailyDD ? (parseFloat(this.elements.accountDailyDD.value) || 0) : 0;
        const overallDD = this.elements.accountOverallDD ? (parseFloat(this.elements.accountOverallDD.value) || 0) : 0;
        const profitTarget = this.elements.accountProfitTarget ? (parseFloat(this.elements.accountProfitTarget.value) || 0) : 0;

        if (!name) { UI.showToast('Please enter an account name.'); return; }
        if (isNaN(balance) || balance <= 0) { UI.showToast('Please enter a valid balance.'); return; }

        // Check account limit for new accounts
        if (!this.editingAccountId && Store.accounts && Store.accounts.length >= 10) {
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
            if (!Store.accounts) Store.accounts = [];
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
        if (!Store.accounts) return;
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
        if (!Store.accounts) return;
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
        if (this.elements.importFileInput) {
            this.elements.importFileInput.value = '';
        }
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

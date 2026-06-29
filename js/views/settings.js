/* ==========================================================================
   TRADETERMINAL V2 — Settings View
   Account Manager + Profile + Data Management
   ========================================================================== */

const SettingsView = {
    elements: {},
    editingAccountId: null,

    // ==========================================
    // INITIALIZATION
    // ==========================================
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.render();
    },

    cacheDOM() {
        // Profile
        this.elements.traderName = document.getElementById('settingsTraderName');

        // Account list
        this.elements.accountsList = document.getElementById('accountsList');
        this.elements.btnAddAccount = document.getElementById('btnAddAccount');

        // Account Modal
        this.elements.accountModal = document.getElementById('accountModal');
        this.elements.accountModalTitle = document.getElementById('accountModalTitle');
        this.elements.accountForm = document.getElementById('accountForm');
        this.elements.accountFormId = document.getElementById('accountFormId');
        this.elements.accountName = document.getElementById('accountName');
        this.elements.accountType = document.getElementById('accountType');
        this.elements.accountBalance = document.getElementById('accountBalance');
        this.elements.accountLeverage = document.getElementById('accountLeverage');
        this.elements.accountDailyDD = document.getElementById('accountDailyDD');
        this.elements.accountOverallDD = document.getElementById('accountOverallDD');
        this.elements.accountProfitTarget = document.getElementById('accountProfitTarget');
        this.elements.accountMinDays = document.getElementById('accountMinDays');
        this.elements.btnAccountModalClose = document.getElementById('btnAccountModalClose');
        this.elements.btnAccountModalCancel = document.getElementById('btnAccountModalCancel');

        // Data Management
        this.elements.btnExportData = document.getElementById('btnExportData');
        this.elements.btnResetData = document.getElementById('btnResetData');
    },

    bindEvents() {
        // Trader name — auto-save on input
        this.elements.traderName.addEventListener('input', () => {
            Store.traderName = this.elements.traderName.value.trim();
            Storage.save(CONFIG.STORAGE_KEYS.TRADER_NAME, Store.traderName);
            EventBus.emit(EVENTS.TRADER_NAME_CHANGED, Store.traderName);
            EventBus.emit(EVENTS.DASHBOARD_REFRESH);
        });

        // Open Add Account modal
        this.elements.btnAddAccount.addEventListener('click', () => this.openAccountModal());

        // Close account modal
        this.elements.btnAccountModalClose.addEventListener('click', () => this.closeAccountModal());
        this.elements.btnAccountModalCancel.addEventListener('click', () => this.closeAccountModal());
        this.elements.accountModal.addEventListener('click', (e) => {
            if (e.target === this.elements.accountModal) this.closeAccountModal();
        });

        // Save account
        this.elements.accountForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAccount();
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeAccountModal();
        });

        // Export data
        this.elements.btnExportData.addEventListener('click', () => this.exportData());

        // Reset everything
        this.elements.btnResetData.addEventListener('click', () => this.resetAllData());
    },

    // ==========================================
    // RENDER
    // ==========================================
    render() {
        this.renderTraderName();
        this.renderAccountsList();
    },

    renderTraderName() {
        this.elements.traderName.value = Store.traderName || '';
    },

    renderAccountsList() {
        const container = this.elements.accountsList;

        if (Store.accounts.length === 0) {
            container.innerHTML = '<p class="empty-state">No accounts added yet. Add your first one!</p>';
            return;
        }

        container.innerHTML = Store.accounts.map(acc => this.buildAccountCard(acc)).join('');

        // Bind events for each card
        container.querySelectorAll('.account-card').forEach(card => {
            const accountId = card.dataset.accountId;

            card.querySelector('.btn-set-active')?.addEventListener('click', () => this.setActiveAccount(accountId));
            card.querySelector('.btn-edit-account')?.addEventListener('click', () => this.openAccountModal(accountId));
            card.querySelector('.btn-delete-account')?.addEventListener('click', () => this.deleteAccount(accountId));
        });
    },

    buildAccountCard(account) {
        const isActive = account.id === Store.activeAccountId;
        const typeLabels = {
            'Live': '🟢 Live',
            'Demo': '🔵 Demo',
            'Prop Firm': '🟣 Prop Firm'
        };
        const typeLabel = typeLabels[account.type] || account.type;

        return `
            <div class="account-card ${isActive ? 'active-account' : ''}" data-account-id="${account.id}">
                <div class="account-card-header">
                    <div class="account-card-info">
                        <span class="account-card-name">${UI.escapeHTML(account.name)}</span>
                        <span class="account-card-type">${typeLabel}</span>
                        ${isActive ? '<span class="account-active-badge">Active</span>' : ''}
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
                    <div class="account-detail">
                        <span class="account-detail-label">Leverage</span>
                        <span class="account-detail-value">${account.leverage > 0 ? '1:' + account.leverage : 'None'}</span>
                    </div>
                    <div class="account-detail">
                        <span class="account-detail-label">Daily DD</span>
                        <span class="account-detail-value">${account.dailyDDPercent || 0}%</span>
                    </div>
                    <div class="account-detail">
                        <span class="account-detail-label">Overall DD</span>
                        <span class="account-detail-value">${account.overallDDPercent || 0}%</span>
                    </div>
                    ${account.type === 'Prop Firm' ? `
                    <div class="account-detail">
                        <span class="account-detail-label">Profit Target</span>
                        <span class="account-detail-value">${account.profitTargetPercent || 0}%</span>
                    </div>
                    <div class="account-detail">
                        <span class="account-detail-label">Min Trading Days</span>
                        <span class="account-detail-value">${account.minTradingDays || 0}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    // ==========================================
    // ACCOUNT MODAL
    // ==========================================
    openAccountModal(accountId = null) {
        this.editingAccountId = accountId;

        if (accountId) {
            // Edit mode
            const account = Store.accounts.find(a => a.id === accountId);
            if (!account) return;

            this.elements.accountModalTitle.textContent = 'Edit Account';
            this.elements.accountFormId.value = account.id;
            this.elements.accountName.value = account.name;
            this.elements.accountType.value = account.type;
            this.elements.accountBalance.value = account.balance;
            this.elements.accountLeverage.value = account.leverage;
            this.elements.accountDailyDD.value = account.dailyDDPercent || '';
            this.elements.accountOverallDD.value = account.overallDDPercent || '';
            this.elements.accountProfitTarget.value = account.profitTargetPercent || '';
            this.elements.accountMinDays.value = account.minTradingDays || '';
        } else {
            // Add mode
            this.elements.accountModalTitle.textContent = 'Add Account';
            this.elements.accountForm.reset();
            this.elements.accountFormId.value = '';
            this.elements.accountLeverage.value = '100';
        }

        this.elements.accountModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    },

    closeAccountModal() {
        this.elements.accountModal.classList.add('hidden');
        document.body.style.overflow = '';
        this.editingAccountId = null;
    },

    // ==========================================
    // SAVE ACCOUNT
    // ==========================================
    saveAccount() {
        const name = this.elements.accountName.value.trim();
        const type = this.elements.accountType.value;
        const balance = parseFloat(this.elements.accountBalance.value);
        const leverage = parseInt(this.elements.accountLeverage.value);
        const dailyDD = parseFloat(this.elements.accountDailyDD.value) || 0;
        const overallDD = parseFloat(this.elements.accountOverallDD.value) || 0;
        const profitTarget = parseFloat(this.elements.accountProfitTarget.value) || 0;
        const minDays = parseInt(this.elements.accountMinDays.value) || 0;

        // Validation
        if (!name) {
            UI.showToast('Please enter an account name.');
            return;
        }
        if (isNaN(balance) || balance <= 0) {
            UI.showToast('Please enter a valid balance.');
            return;
        }

        const accountData = {
            id: this.editingAccountId || UI.generateId(),
            name,
            type,
            balance,
            leverage,
            dailyDDPercent: dailyDD,
            overallDDPercent: overallDD,
            profitTargetPercent: profitTarget,
            minTradingDays: minDays,
            isActive: false
        };

        if (this.editingAccountId) {
            // Update existing
            const index = Store.accounts.findIndex(a => a.id === this.editingAccountId);
            if (index !== -1) {
                accountData.isActive = Store.accounts[index].isActive;
                Store.accounts[index] = accountData;
            }
            UI.showToast('Account updated.');
        } else {
            // Add new
            // If this is the first account, set it as active automatically
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
    // SET ACTIVE ACCOUNT
    // ==========================================
    setActiveAccount(accountId) {
        // Deactivate all
        Store.accounts.forEach(a => a.isActive = false);
        
        // Activate selected
        const account = Store.accounts.find(a => a.id === accountId);
        if (account) {
            account.isActive = true;
            Store.activeAccountId = accountId;
            Storage.save(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT, accountId);
            this.persistAndNotify();
            UI.showToast(`${account.name} is now active.`);
        }
    },

    // ==========================================
    // DELETE ACCOUNT
    // ==========================================
    deleteAccount(accountId) {
        const account = Store.accounts.find(a => a.id === accountId);
        if (!account) return;

        if (!confirm(`Delete account "${account.name}"? This cannot be undone.`)) return;

        const wasActive = account.isActive;
        Store.accounts = Store.accounts.filter(a => a.id !== accountId);

        // If deleted account was active, clear active
        if (wasActive) {
            Store.activeAccountId = null;
            Storage.remove(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT);
            
            // Set first remaining account as active
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
        UI.showToast('Data exported successfully.');
    },

    resetAllData() {
        if (!confirm('Delete ALL data? This includes accounts, journal, and settings. This CANNOT be undone.')) return;
        if (!confirm('Are you absolutely sure? This will erase everything.')) return;

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

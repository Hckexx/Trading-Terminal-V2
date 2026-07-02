/* ==========================================================================
   TRADETERMINAL V2 — Dashboard View (Complete)
   Live Balance + DD + Milestone + Session + Trade Counter + Quick Actions
   ========================================================================== */

const DashboardView = {
    elements: {},
    _timeInterval: null,
    _sessionInterval: null,

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.bindMilestoneEvents();
        this.refresh();
        this._timeInterval = setInterval(() => this.updateTime(), 30000);
        this._sessionInterval = setInterval(() => this.updateSession(), 60000);
    },

    cacheDOM() {
        this.elements = {
            greeting: document.getElementById('dashboardGreeting'),
            accountType: document.getElementById('dashAccountType'),
            accountName: document.getElementById('dashAccountName'),
            balance: document.getElementById('dashBalance'),
            todayPnL: document.getElementById('dashTodayPnL'),
            winRate: document.getElementById('dashWinRate'),
            dailyDD: document.getElementById('dashDailyDD'),
            dailyDDFill: document.getElementById('dashDailyDDFill'),
            overallDD: document.getElementById('dashOverallDD'),
            overallDDFill: document.getElementById('dashOverallDDFill'),
            riskStatus: document.getElementById('dashRiskStatus'),
            riskStatusCard: document.getElementById('dashRiskStatusCard'),
            recentTrades: document.getElementById('dashboardRecentTrades'),
            headerTime: document.getElementById('headerTime'),
            headerBalance: document.getElementById('headerBalance'),
            headerTodayPnL: document.getElementById('headerTodayPnL'),
            headerRiskStatus: document.getElementById('headerRiskStatus'),
            stopBanner: document.getElementById('stopTradingBanner'),
            milestoneTarget: document.getElementById('milestoneTarget'),
            milestoneCurrent: document.getElementById('milestoneCurrent'),
            milestoneRemaining: document.getElementById('milestoneRemaining'),
            milestoneBarFill: document.getElementById('milestoneBarFill'),
            milestonePercent: document.getElementById('milestonePercent'),
            milestoneStatus: document.getElementById('milestoneStatus'),
            tradeCount: document.getElementById('tradeCount'),
            tradeCounterFill: document.getElementById('tradeCounterFill'),
            tradeCounterStatus: document.getElementById('tradeCounterStatus'),
            tradeCounterCard: document.getElementById('tradeCounterCard'),
        };
    },

    bindEvents() {
        EventBus.on(EVENTS.ACCOUNTS_UPDATED, () => this.refresh());
        EventBus.on(EVENTS.ACTIVE_ACCOUNT_CHANGED, () => this.refresh());
        EventBus.on(EVENTS.JOURNAL_UPDATED, () => this.refresh());
        EventBus.on(EVENTS.TRADER_NAME_CHANGED, () => this.updateGreeting());
        EventBus.on(EVENTS.DASHBOARD_REFRESH, () => this.refresh());
    },

    bindMilestoneEvents() {
        const modal = document.getElementById('milestoneModal');
        const form = document.getElementById('milestoneForm');
        const btnEdit = document.getElementById('btnEditMilestone');
        const btnClose = document.getElementById('btnMilestoneModalClose');
        const btnCancel = document.getElementById('btnMilestoneModalCancel');
        const targetInput = document.getElementById('milestoneTargetInput');
        const receivedInput = document.getElementById('milestoneReceivedInput');

        if (btnEdit) {
            btnEdit.addEventListener('click', () => {
                const milestone = Storage.load('tt_milestone', { target: 10000, received: 0 });
                if (targetInput) targetInput.value = milestone.target;
                if (receivedInput) receivedInput.value = milestone.received;
                if (modal) modal.classList.remove('hidden');
            });
        }
        if (btnClose) btnClose.addEventListener('click', () => { if (modal) modal.classList.add('hidden'); });
        if (btnCancel) btnCancel.addEventListener('click', () => { if (modal) modal.classList.add('hidden'); });
        if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const target = parseFloat(targetInput?.value) || 10000;
                const received = parseFloat(receivedInput?.value) || 0;
                if (target <= 0) { UI.showToast('Target must be greater than 0.'); return; }
                Storage.save('tt_milestone', { target, received });
                this.renderMilestone({ target, received });
                if (modal) modal.classList.add('hidden');
                UI.showToast('Milestone updated.');
            });
        }
    },

    refresh() {
        this.updateGreeting();
        this.updateTime();
        this.updateSession();
        this.updateTradeCounter();
        this.loadAccountInfo();
        this.loadMilestone();
        this.calculateMetrics();
        this.renderRecentTrades();
        this.updateHeaderStats();
    },

    updateGreeting() {
        const name = Store.traderName;
        if (this.elements.greeting) {
            this.elements.greeting.textContent = (name && name.length > 0) ? 'Welcome back, ' + name : 'Welcome back';
        }
    },

    updateTime() {
        if (this.elements.headerTime) {
            this.elements.headerTime.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        }
    },

    updateSession() {
        const sessionStatus = document.getElementById('sessionStatus');
        const sessionTimeLeft = document.getElementById('sessionTimeLeft');
        const sessionPill = document.getElementById('sessionPill');
        if (!sessionStatus || !sessionPill) return;

        const now = new Date();
        const hours = now.getUTCHours();
        const minutes = now.getUTCMinutes();
        const day = now.getUTCDay();
        
        if (day === 6 || day === 0) {
            sessionStatus.textContent = 'WEEKEND';
            sessionTimeLeft.textContent = 'Market Closed';
            sessionPill.classList.add('session-inactive');
            return;
        }

        const currentMinutes = hours * 60 + minutes;
        
        if (currentMinutes >= 0 && currentMinutes < 420) {
            const remaining = 420 - currentMinutes;
            sessionStatus.textContent = 'ASIAN';
            sessionTimeLeft.textContent = Math.floor(remaining/60) + 'h ' + (remaining%60) + 'm';
            sessionPill.classList.remove('session-active');
            sessionPill.classList.add('session-inactive');
        } else if (currentMinutes >= 420 && currentMinutes < 900) {
            const remaining = 900 - currentMinutes;
            sessionStatus.textContent = 'LONDON';
            sessionTimeLeft.textContent = Math.floor(remaining/60) + 'h ' + (remaining%60) + 'm';
            sessionPill.classList.add('session-active');
            sessionPill.classList.remove('session-inactive');
        } else if (currentMinutes >= 720 && currentMinutes < 1200) {
            const remaining = 1200 - currentMinutes;
            sessionStatus.textContent = 'NEW YORK';
            sessionTimeLeft.textContent = Math.floor(remaining/60) + 'h ' + (remaining%60) + 'm';
            sessionPill.classList.add('session-active');
            sessionPill.classList.remove('session-inactive');
        } else {
            sessionStatus.textContent = 'NO SESSION';
            sessionTimeLeft.textContent = '';
            sessionPill.classList.remove('session-active');
            sessionPill.classList.add('session-inactive');
        }
    },

    updateTradeCounter() {
        const today = new Date().toISOString().split('T')[0];
        const todayTrades = (Store.journal || []).filter(t => t.date === today && t.result);
        const count = todayTrades.length;

        if (this.elements.tradeCount) this.elements.tradeCount.textContent = count;
        if (this.elements.tradeCounterFill) {
            this.elements.tradeCounterFill.style.width = Math.min(100, (count/2)*100) + '%';
            this.elements.tradeCounterFill.classList.toggle('full', count >= 2);
        }
        if (this.elements.tradeCounterStatus) {
            if (count >= 2) this.elements.tradeCounterStatus.textContent = 'Limit reached. Walk away.';
            else if (count === 1) this.elements.tradeCounterStatus.textContent = 'One more trade available';
            else this.elements.tradeCounterStatus.textContent = 'No trades taken today';
        }
        if (this.elements.tradeCounterCard) {
            this.elements.tradeCounterCard.classList.toggle('limit-reached', count >= 2);
        }
    },

    loadAccountInfo() {
        const activeAccount = this.getActiveAccount();
        if (!activeAccount) {
            this.elements.accountType.textContent = 'Not Set';
            this.elements.accountName.textContent = 'Configure in Settings';
            this.elements.balance.textContent = '$0.00';
            this.elements.headerBalance.textContent = '$0.00';
            return;
        }

        const typeLabels = {
            'Live': '🟢 Live', 'Demo': '🔵 Demo', 'Prop Challenge': '🟡 Challenge', 'Funded': '🟣 Funded', 'Prop Firm': '🟣 Prop Firm'
        };
        this.elements.accountType.textContent = typeLabels[activeAccount.type] || activeAccount.type;
        this.elements.accountName.textContent = activeAccount.name;

        const trades = Store.journal || [];
        const allClosed = trades.filter(t => t.result);
        const totalPnL = allClosed.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
        const currentBalance = activeAccount.balance + totalPnL;
        const balanceFormatted = FORMATTERS.compact.format(currentBalance);
        this.elements.balance.textContent = balanceFormatted;
        this.elements.headerBalance.textContent = balanceFormatted;
    },

    loadMilestone() {
        const milestone = Storage.load('tt_milestone', { target: 10000, received: 0 });
        this.renderMilestone(milestone);
    },

    renderMilestone(milestone) {
        const target = milestone.target || 10000;
        const received = milestone.received || 0;
        const remaining = Math.max(0, target - received);
        const percent = target > 0 ? Math.min(100, Math.round((received / target) * 100)) : 0;

        if (this.elements.milestoneTarget) this.elements.milestoneTarget.textContent = FORMATTERS.compact.format(target);
        if (this.elements.milestoneCurrent) this.elements.milestoneCurrent.textContent = FORMATTERS.compact.format(received);
        if (this.elements.milestoneRemaining) this.elements.milestoneRemaining.textContent = FORMATTERS.compact.format(remaining);
        if (this.elements.milestoneBarFill) this.elements.milestoneBarFill.style.width = `${percent}%`;
        if (this.elements.milestonePercent) this.elements.milestonePercent.textContent = `${percent}%`;
        if (this.elements.milestoneStatus) {
            if (percent >= 100) this.elements.milestoneStatus.textContent = '🎉 Milestone reached! Time for a payout.';
            else if (percent >= 75) this.elements.milestoneStatus.textContent = 'Almost there. Stay disciplined.';
            else if (percent >= 50) this.elements.milestoneStatus.textContent = 'Halfway. Momentum is building.';
            else if (percent >= 25) this.elements.milestoneStatus.textContent = 'Solid progress. Keep going.';
            else this.elements.milestoneStatus.textContent = 'Keep pushing. Every trade counts.';
        }
    },

    calculateMetrics() {
        const activeAccount = this.getActiveAccount();
        const trades = Store.journal || [];
        const today = new Date().toISOString().split('T')[0];
        const todayTrades = trades.filter(t => t.date === today && t.result);
        const todayPnL = todayTrades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
        const allClosed = trades.filter(t => t.result);
        const wins = allClosed.filter(t => t.result === 'WIN').length;
        const totalClosed = allClosed.length;
        const winRate = totalClosed > 0 ? (wins / totalClosed) * 100 : null;

        const pnlFormatted = FORMATTERS.currency.format(Math.abs(todayPnL));
        const pnlSigned = todayPnL >= 0 ? `+${pnlFormatted}` : `-${pnlFormatted}`;
        this.elements.todayPnL.textContent = pnlSigned;
        this.elements.todayPnL.className = `dash-card-value ${todayPnL >= 0 ? 'positive' : 'negative'}`;
        this.elements.headerTodayPnL.textContent = pnlSigned;
        this.elements.headerTodayPnL.style.color = todayPnL >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
        this.elements.winRate.textContent = winRate !== null ? `${Math.round(winRate)}%` : '--';

        if (activeAccount) {
            const dailyDDLimit = activeAccount.balance * (activeAccount.dailyDDPercent / 100);
            const overallDDLimit = activeAccount.balance * (activeAccount.overallDDPercent / 100);
            const todayLoss = Math.abs(Math.min(todayPnL, 0));
            const allTimeLosses = allClosed.filter(t => t.result === 'LOSS').reduce((sum, t) => sum + Math.abs(parseFloat(t.pnl) || 0), 0);

            const dailyDDRemaining = dailyDDLimit - todayLoss;
            const dailyDDPercent = dailyDDLimit > 0 ? (todayLoss / dailyDDLimit) * 100 : 0;
            this.elements.dailyDD.textContent = FORMATTERS.currency.format(Math.max(0, dailyDDRemaining));
            this.elements.dailyDDFill.style.width = `${Math.min(100, dailyDDPercent)}%`;
            this.updateProgressColor(this.elements.dailyDDFill, dailyDDPercent);

            const overallDDRemaining = overallDDLimit - allTimeLosses;
            const overallDDPercent = overallDDLimit > 0 ? (allTimeLosses / overallDDLimit) * 100 : 0;
            this.elements.overallDD.textContent = FORMATTERS.currency.format(Math.max(0, overallDDRemaining));
            this.elements.overallDDFill.style.width = `${Math.min(100, overallDDPercent)}%`;
            this.updateProgressColor(this.elements.overallDDFill, overallDDPercent);

            this.updateRiskStatus(dailyDDPercent, overallDDPercent);
        } else {
            this.elements.dailyDD.textContent = '--';
            this.elements.overallDD.textContent = '--';
            this.elements.riskStatus.textContent = '--';
            this.elements.dailyDDFill.style.width = '0%';
            this.elements.overallDDFill.style.width = '0%';
        }
    },

    updateProgressColor(element, percent) {
        element.classList.remove('warning', 'danger');
        if (percent >= 80) element.classList.add('danger');
        else if (percent >= 50) element.classList.add('warning');
    },

    updateRiskStatus(dailyDDPercent, overallDDPercent) {
        const maxDD = Math.max(dailyDDPercent, overallDDPercent);
        let status, className, headerClass;

        if (maxDD >= 100) { status = 'STOP'; className = 'danger'; headerClass = 'danger'; this.showStopBanner(true); }
        else if (maxDD >= 75) { status = 'CAUTION'; className = 'caution'; headerClass = 'caution'; this.showStopBanner(false); }
        else { status = 'SAFE'; className = 'safe'; headerClass = 'safe'; this.showStopBanner(false); }

        this.elements.riskStatus.textContent = status;
        this.elements.riskStatus.className = `risk-badge ${className}`;
        this.elements.riskStatusCard.classList.remove('safe', 'caution', 'danger');
        this.elements.riskStatusCard.classList.add(className);
        this.elements.headerRiskStatus.textContent = status === 'SAFE' ? '🟢' : status === 'CAUTION' ? '🟡' : '🔴';
        this.elements.headerRiskStatus.className = 'stat-value risk-indicator ' + headerClass;
    },

    showStopBanner(show) {
        const banner = document.getElementById('stopTradingBanner');
        if (banner) banner.classList.toggle('visible', show);
    },

    renderRecentTrades() {
        const container = this.elements.recentTrades;
        if (!container) return;
        const trades = Store.journal || [];
        const recent = trades.sort((a, b) => `${b.date}T${b.createdAt || '00:00'}`.localeCompare(`${a.date}T${a.createdAt || '00:00'}`)).slice(0, 5);

        if (recent.length === 0) {
            container.innerHTML = '<p class="empty-state">No trades logged yet. Start your journey!</p>';
            return;
        }
        container.innerHTML = recent.map(trade => this.buildTradeRow(trade)).join('');
    },

    buildTradeRow(trade) {
        const pnl = parseFloat(trade.pnl) || 0;
        const pnlClass = trade.result === 'WIN' ? 'win' : trade.result === 'LOSS' ? 'loss' : '';
        const pnlSign = pnl >= 0 ? '+' : '';
        const stars = '★'.repeat(trade.rating || 0) + '☆'.repeat(5 - (trade.rating || 0));

        return `
            <div class="trade-row-compact" data-trade-id="${trade.id}">
                <div class="trade-info-left">
                    <span class="trade-pair">${trade.pair || '--'}</span>
                    <span class="trade-direction ${trade.direction === 'BUY' ? 'buy' : 'sell'}">${trade.direction || '--'}</span>
                    ${trade.rating > 0 ? `<span class="trade-score">${stars}</span>` : ''}
                </div>
                <div class="trade-info-right">
                    <span class="trade-pnl ${pnlClass}">${pnlSign}${FORMATTERS.currency.format(Math.abs(pnl))}</span>
                    <span class="trade-date-compact">${FORMATTERS.date.format(new Date(trade.date + 'T00:00:00'))}</span>
                </div>
            </div>`;
    },

    updateHeaderStats() {},

    getActiveAccount() {
        if (!Store.activeAccountId || !Store.accounts.length) return null;
        return Store.accounts.find(a => a.id === Store.activeAccountId) || null;
    }
};

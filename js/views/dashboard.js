/* ==========================================================================
   TRADETERMINAL V2 — Dashboard View (Live Balance + DD + Milestone)
   ========================================================================== */

const DashboardView = {
    elements: {},
    _timeInterval: null,

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.bindMilestoneEvents();
        this.refresh();
        // Update time every 30 seconds
        this._timeInterval = setInterval(() => this.updateTime(), 30000);
       this._sessionInterval = setInterval(() => this.updateSession(), 60000);
    },

    cacheDOM() {
        this.elements = {
            greeting: document.getElementById('dashboardGreeting'),
            // Account cards
            accountType: document.getElementById('dashAccountType'),
            accountName: document.getElementById('dashAccountName'),
            balance: document.getElementById('dashBalance'),
            todayPnL: document.getElementById('dashTodayPnL'),
            winRate: document.getElementById('dashWinRate'),
            // Risk cards
            dailyDD: document.getElementById('dashDailyDD'),
            dailyDDFill: document.getElementById('dashDailyDDFill'),
            overallDD: document.getElementById('dashOverallDD'),
            overallDDFill: document.getElementById('dashOverallDDFill'),
            riskStatus: document.getElementById('dashRiskStatus'),
            riskStatusCard: document.getElementById('dashRiskStatusCard'),
            // Recent trades
            recentTrades: document.getElementById('dashboardRecentTrades'),
            // Header stats
            headerTime: document.getElementById('headerTime'),
            headerBalance: document.getElementById('headerBalance'),
            headerTodayPnL: document.getElementById('headerTodayPnL'),
            headerRiskStatus: document.getElementById('headerRiskStatus'),
            // Banner
            stopBanner: document.getElementById('stopTradingBanner'),
            // Milestone
            milestoneTarget: document.getElementById('milestoneTarget'),
            milestoneCurrent: document.getElementById('milestoneCurrent'),
            milestoneRemaining: document.getElementById('milestoneRemaining'),
            milestoneBarFill: document.getElementById('milestoneBarFill'),
            milestonePercent: document.getElementById('milestonePercent'),
            milestoneStatus: document.getElementById('milestoneStatus'),
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
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.add('hidden');
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const target = parseFloat(targetInput?.value) || 10000;
                const received = parseFloat(receivedInput?.value) || 0;
                if (target <= 0) {
                    UI.showToast('Target must be greater than 0.');
                    return;
                }
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
        this.loadAccountInfo();
        this.loadMilestone();
        this.calculateMetrics();
        this.renderRecentTrades();
        this.updateHeaderStats();
       this.updateSession();
    },

    updateGreeting() {
        const name = Store.traderName;
        if (this.elements.greeting) {
            if (name && name.length > 0) {
                this.elements.greeting.textContent = 'Welcome back, ' + name;
            } else {
                this.elements.greeting.textContent = 'Welcome back';
            }
        }
    },

    updateTime() {
        if (this.elements.headerTime) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            this.elements.headerTime.textContent = timeStr;
        }
    },
updateSession() {
    const now = new Date();
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();
    const day = now.getUTCDay();
    
    if (day === 6 || day === 0) {
        document.getElementById('sessionStatus').textContent = 'WEEKEND';
        document.getElementById('sessionTimeLeft').textContent = 'Market Closed';
        document.getElementById('sessionPill').classList.add('session-inactive');
        return;
    }

    const currentMinutes = hours * 60 + minutes;
    
    if (currentMinutes >= 0 && currentMinutes < 420) {
        // Asian session (00:00-07:00 GMT)
        const remaining = 420 - currentMinutes;
        document.getElementById('sessionStatus').textContent = 'ASIAN';
        document.getElementById('sessionTimeLeft').textContent = Math.floor(remaining/60) + 'h ' + (remaining%60) + 'm';
        document.getElementById('sessionPill').classList.remove('session-active');
        document.getElementById('sessionPill').classList.add('session-inactive');
    } else if (currentMinutes >= 420 && currentMinutes < 900) {
        // London session (07:00-15:00 GMT)
        const remaining = 900 - currentMinutes;
        document.getElementById('sessionStatus').textContent = 'LONDON';
        document.getElementById('sessionTimeLeft').textContent = Math.floor(remaining/60) + 'h ' + (remaining%60) + 'm';
        document.getElementById('sessionPill').classList.add('session-active');
        document.getElementById('sessionPill').classList.remove('session-inactive');
    } else if (currentMinutes >= 720 && currentMinutes < 1200) {
        // NY session (12:00-20:00 GMT)
        const remaining = 1200 - currentMinutes;
        document.getElementById('sessionStatus').textContent = 'NEW YORK';
        document.getElementById('sessionTimeLeft').textContent = Math.floor(remaining/60) + 'h ' + (remaining%60) + 'm';
        document.getElementById('sessionPill').classList.add('session-active');
        document.getElementById('sessionPill').classList.remove('session-inactive');
    } else {
        document.getElementById('sessionStatus').textContent = 'NO SESSION';
        document.getElementById('sessionTimeLeft').textContent = '';
        document.getElementById('sessionPill').classList.remove('session-active');
        document.getElementById('sessionPill').classList.add('session-inactive');
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

        // Account type badge
        const typeLabels = {
            'Live': '🟢 Live',
            'Demo': '🔵 Demo',
            'Prop Challenge': '🟡 Challenge',
            'Funded': '🟣 Funded',
            'Prop Firm': '🟣 Prop Firm'
        };
        this.elements.accountType.textContent = typeLabels[activeAccount.type] || activeAccount.type;
        this.elements.accountName.textContent = activeAccount.name;

        // Calculate LIVE balance: starting balance + all-time P&L
        const trades = Store.journal || [];
        const allClosed = trades.filter(t => t.result);
        const totalPnL = allClosed.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
        const currentBalance = activeAccount.balance + totalPnL;

        // Display current balance
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

        if (this.elements.milestoneTarget) {
            this.elements.milestoneTarget.textContent = FORMATTERS.compact.format(target);
        }
        if (this.elements.milestoneCurrent) {
            this.elements.milestoneCurrent.textContent = FORMATTERS.compact.format(received);
        }
        if (this.elements.milestoneRemaining) {
            this.elements.milestoneRemaining.textContent = FORMATTERS.compact.format(remaining);
        }
        if (this.elements.milestoneBarFill) {
            this.elements.milestoneBarFill.style.width = `${percent}%`;
        }
        if (this.elements.milestonePercent) {
            this.elements.milestonePercent.textContent = `${percent}%`;
        }
        if (this.elements.milestoneStatus) {
            if (percent >= 100) {
                this.elements.milestoneStatus.textContent = '🎉 Milestone reached! Time for a payout.';
            } else if (percent >= 75) {
                this.elements.milestoneStatus.textContent = 'Almost there. Stay disciplined.';
            } else if (percent >= 50) {
                this.elements.milestoneStatus.textContent = 'Halfway. Momentum is building.';
            } else if (percent >= 25) {
                this.elements.milestoneStatus.textContent = 'Solid progress. Keep going.';
            } else {
                this.elements.milestoneStatus.textContent = 'Keep pushing. Every trade counts.';
            }
        }
    },

    calculateMetrics() {
        const activeAccount = this.getActiveAccount();
        const trades = Store.journal || [];
        
        // Today's date
        const today = new Date().toISOString().split('T')[0];
        
        // Today's trades
        const todayTrades = trades.filter(t => t.date === today && t.result);
        
        // Today's P&L
        const todayPnL = todayTrades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
        
        // Win rate (all time)
        const allClosed = trades.filter(t => t.result);
        const wins = allClosed.filter(t => t.result === 'WIN').length;
        const totalClosed = allClosed.length;
        const winRate = totalClosed > 0 ? (wins / totalClosed) * 100 : null;

        // Update Today's P&L
        const pnlFormatted = FORMATTERS.currency.format(Math.abs(todayPnL));
        const pnlSigned = todayPnL >= 0 ? `+${pnlFormatted}` : `-${pnlFormatted}`;
        this.elements.todayPnL.textContent = pnlSigned;
        this.elements.todayPnL.className = `dash-card-value ${todayPnL >= 0 ? 'positive' : 'negative'}`;
        this.elements.headerTodayPnL.textContent = pnlSigned;
        this.elements.headerTodayPnL.style.color = todayPnL >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';

        // Win rate
        this.elements.winRate.textContent = winRate !== null ? `${Math.round(winRate)}%` : '--';

        // Drawdown calculations
        if (activeAccount) {
            const totalPnL = allClosed.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
            
            const dailyDDLimit = activeAccount.balance * (activeAccount.dailyDDPercent / 100);
            const overallDDLimit = activeAccount.balance * (activeAccount.overallDDPercent / 100);
            
            // Today's loss (only negative P&L)
            const todayLoss = Math.abs(Math.min(todayPnL, 0));
            
            // All-time losses
            const allTimeLosses = allClosed
                .filter(t => t.result === 'LOSS')
                .reduce((sum, t) => sum + Math.abs(parseFloat(t.pnl) || 0), 0);

            // Daily DD
            const dailyDDRemaining = dailyDDLimit - todayLoss;
            const dailyDDPercent = dailyDDLimit > 0 ? (todayLoss / dailyDDLimit) * 100 : 0;
            
            this.elements.dailyDD.textContent = FORMATTERS.currency.format(Math.max(0, dailyDDRemaining));
            this.elements.dailyDDFill.style.width = `${Math.min(100, dailyDDPercent)}%`;
            this.updateProgressColor(this.elements.dailyDDFill, dailyDDPercent);

            // Overall DD
            const overallDDRemaining = overallDDLimit - allTimeLosses;
            const overallDDPercent = overallDDLimit > 0 ? (allTimeLosses / overallDDLimit) * 100 : 0;
            
            this.elements.overallDD.textContent = FORMATTERS.currency.format(Math.max(0, overallDDRemaining));
            this.elements.overallDDFill.style.width = `${Math.min(100, overallDDPercent)}%`;
            this.updateProgressColor(this.elements.overallDDFill, overallDDPercent);

            // Risk Status
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
        if (percent >= 80) {
            element.classList.add('danger');
        } else if (percent >= 50) {
            element.classList.add('warning');
        }
    },

    updateRiskStatus(dailyDDPercent, overallDDPercent) {
        const maxDD = Math.max(dailyDDPercent, overallDDPercent);
        let status, className, headerClass;

        if (maxDD >= 100) {
            status = 'STOP';
            className = 'danger';
            headerClass = 'danger';
            this.showStopBanner(true);
        } else if (maxDD >= 75) {
            status = 'CAUTION';
            className = 'caution';
            headerClass = 'caution';
            this.showStopBanner(false);
        } else {
            status = 'SAFE';
            className = 'safe';
            headerClass = 'safe';
            this.showStopBanner(false);
        }

        this.elements.riskStatus.textContent = status;
        this.elements.riskStatus.className = `risk-badge ${className}`;

        const card = this.elements.riskStatusCard;
        card.classList.remove('safe', 'caution', 'danger');
        card.classList.add(className);

        const headerStatus = this.elements.headerRiskStatus;
        headerStatus.textContent = status === 'SAFE' ? '🟢' : status === 'CAUTION' ? '🟡' : '🔴';
        headerStatus.className = 'stat-value risk-indicator ' + headerClass;
    },

    showStopBanner(show) {
        const existingBanner = document.getElementById('stopTradingBanner');
        if (existingBanner) {
            existingBanner.classList.toggle('visible', show);
        }
    },

    renderRecentTrades() {
        const container = this.elements.recentTrades;
        if (!container) return;

        const trades = Store.journal || [];
        const recent = trades
            .sort((a, b) => {
                const dateA = `${a.date}T${a.createdAt || '00:00'}`;
                const dateB = `${b.date}T${b.createdAt || '00:00'}`;
                return dateB.localeCompare(dateA);
            })
            .slice(0, 5);

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
                    <span class="trade-direction ${trade.direction === 'BUY' ? 'buy' : 'sell'}">
                        ${trade.direction || '--'}
                    </span>
                    ${trade.rating > 0 ? `<span class="trade-score">${stars}</span>` : ''}
                </div>
                <div class="trade-info-right">
                    <span class="trade-pnl ${pnlClass}">${pnlSign}${FORMATTERS.currency.format(Math.abs(pnl))}</span>
                    <span class="trade-date-compact">${FORMATTERS.date.format(new Date(trade.date + 'T00:00:00'))}</span>
                </div>
            </div>
        `;
    },

    updateHeaderStats() {
        // Handled in calculateMetrics
    },

    getActiveAccount() {
        if (!Store.activeAccountId || !Store.accounts.length) return null;
        return Store.accounts.find(a => a.id === Store.activeAccountId) || null;
    }
};

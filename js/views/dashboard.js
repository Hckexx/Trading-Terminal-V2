/* ==========================================================================
   TRADETERMINAL V2 — Dashboard View
   ========================================================================== */

const DashboardView = {
    elements: {},

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.refresh();
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
            headerBalance: document.getElementById('headerBalance'),
            headerTodayPnL: document.getElementById('headerTodayPnL'),
            headerRiskStatus: document.getElementById('headerRiskStatus'),
            // Banner
            stopBanner: document.getElementById('stopTradingBanner')
        };
    },

    bindEvents() {
        EventBus.on(EVENTS.ACCOUNTS_UPDATED, () => this.refresh());
        EventBus.on(EVENTS.ACTIVE_ACCOUNT_CHANGED, () => this.refresh());
        EventBus.on(EVENTS.JOURNAL_UPDATED, () => this.refresh());
        EventBus.on(EVENTS.TRADER_NAME_CHANGED, () => this.updateGreeting());
        EventBus.on(EVENTS.DASHBOARD_REFRESH, () => this.refresh());
    },

    refresh() {
        this.updateGreeting();
        this.loadAccountInfo();
        this.calculateMetrics();
        this.renderRecentTrades();
        this.updateHeaderStats();
    },

    updateGreeting() {
        const name = Store.traderName || 'Trader';
        if (this.elements.greeting) {
            this.elements.greeting.textContent = `Welcome back, ${name}`;
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
            'Prop Firm': '🟣 Prop Firm'
        };
        this.elements.accountType.textContent = typeLabels[activeAccount.type] || activeAccount.type;
        this.elements.accountName.textContent = activeAccount.name;

        // Balance
        const balanceFormatted = FORMATTERS.compact.format(activeAccount.balance);
        this.elements.balance.textContent = balanceFormatted;
        this.elements.headerBalance.textContent = balanceFormatted;
    },

    calculateMetrics() {
        const activeAccount = this.getActiveAccount();
        const trades = Store.journal || [];
        
        // Today's date
        const today = new Date().toISOString().split('T')[0];
        
        // Today's trades
        const todayTrades = trades.filter(t => t.date === today);
        const todayClosed = todayTrades.filter(t => t.status === 'CLOSED');
        
        // Today's P&L
        const todayPnL = todayClosed.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
        
        // Win rate (all time)
        const allClosed = trades.filter(t => t.status === 'CLOSED' && t.result);
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

        // Dashboard risk badge
        this.elements.riskStatus.textContent = status;
        this.elements.riskStatus.className = `risk-badge ${className}`;

        // Risk status card border
        const card = this.elements.riskStatusCard;
        card.classList.remove('safe', 'caution', 'danger');
        card.classList.add(className);

        // Header risk indicator
        const headerStatus = this.elements.headerRiskStatus;
        headerStatus.textContent = status === 'SAFE' ? '🟢' : status === 'CAUTION' ? '🟡' : '🔴';
        headerStatus.className = 'stat-value risk-indicator ' + headerClass;
    },

    showStopBanner(show) {
        // Optional: Create a stop trading banner element if you add one to HTML
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
                const dateA = `${a.date}T${a.time || '00:00'}`;
                const dateB = `${b.date}T${b.time || '00:00'}`;
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
        const grade = getGrade(trade.checklistScore);
        const gradeColor = getGradeColor(grade);

        return `
            <div class="trade-row-compact" data-trade-id="${trade.id}">
                <div class="trade-info-left">
                    <span class="trade-pair">${trade.pair || '--'}</span>
                    <span class="trade-direction ${trade.direction === 'BUY' ? 'buy' : 'sell'}">
                        ${trade.direction || '--'}
                    </span>
                    ${grade ? `<span class="trade-score ${gradeColor}">${grade}</span>` : ''}
                </div>
                <div class="trade-info-right">
                    <span class="trade-pnl ${pnlClass}">${pnlSign}${FORMATTERS.currency.format(Math.abs(pnl))}</span>
                    <span class="trade-date-compact">${FORMATTERS.date.format(new Date(trade.date + 'T00:00:00'))}</span>
                </div>
            </div>
        `;
    },

    updateHeaderStats() {
        // Already handled in calculateMetrics via element references
    },

    getActiveAccount() {
        if (!Store.activeAccountId || !Store.accounts.length) return null;
        return Store.accounts.find(a => a.id === Store.activeAccountId) || null;
    }
};

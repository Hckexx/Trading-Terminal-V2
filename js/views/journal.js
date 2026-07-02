/* ==========================================================================
   TRADETERMINAL V2 — Trade Journal View (Final)
   Complete CRUD + Filtering + Animated Stats + Dashboard Sync
   Session & HTF Direction support added
   ========================================================================== */

const JournalView = {
    elements: {},
    currentFilters: {
        account: 'all',
        result: 'all',
        pair: 'all'
    },
    editingTradeId: null,
    viewingTradeId: null,
    _animationFrames: {},
    _currentStats: {
        totalTrades: 0,
        winRate: 0,
        totalPnL: 0,
        avgRR: 0,
        bestTrade: 0,
        worstTrade: 0
    },

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.populateFilterDropdowns();
        this.setDefaultDate();
        this.renderAll();
    },

    cacheDOM() {
        this.elements.btnNewTrade = document.getElementById('btnNewTrade');
        this.elements.filterAccount = document.getElementById('journalFilterAccount');
        this.elements.filterResult = document.getElementById('journalFilterResult');
        this.elements.filterPair = document.getElementById('journalFilterPair');
        this.elements.totalTrades = document.getElementById('journalTotalTrades');
        this.elements.winRate = document.getElementById('journalWinRate');
        this.elements.totalPnL = document.getElementById('journalTotalPnL');
        this.elements.avgRR = document.getElementById('journalAvgRR');
        this.elements.bestTrade = document.getElementById('journalBestTrade');
        this.elements.worstTrade = document.getElementById('journalWorstTrade');
        this.elements.entriesContainer = document.getElementById('journalEntries');
        this.elements.tradeModal = document.getElementById('tradeModal');
        this.elements.tradeForm = document.getElementById('tradeForm');
        this.elements.modalTitle = document.getElementById('modalTitle');
        this.elements.btnModalClose = document.getElementById('btnModalClose');
        this.elements.btnModalCancel = document.getElementById('btnModalCancel');
        this.elements.btnModalSave = document.getElementById('btnModalSave');
        this.elements.tradeAccount = document.getElementById('tradeAccount');
        this.elements.tradeDate = document.getElementById('tradeDate');
        this.elements.tradePair = document.getElementById('tradePair');
        this.elements.tradeDirection = document.getElementById('tradeDirectionModal');
        this.elements.tradeResult = document.getElementById('tradeResult');
        this.elements.tradePnL = document.getElementById('tradePnL');
        this.elements.tradeRiskPercent = document.getElementById('tradeRiskPercent');
        this.elements.tradeEntry = document.getElementById('tradeEntry');
        this.elements.tradeSL = document.getElementById('tradeSL');
        this.elements.tradeTP = document.getElementById('tradeTP');
        this.elements.tradeLotSize = document.getElementById('tradeLotSize');
        this.elements.tradeRating = document.getElementById('tradeRating');
        this.elements.tradeWentWell = document.getElementById('tradeWentWell');
        this.elements.tradeMistakes = document.getElementById('tradeMistakes');
        this.elements.tradeLesson = document.getElementById('tradeLesson');
        this.elements.ratingStars = document.getElementById('ratingStars');
        this.elements.modalBtnBuy = document.getElementById('modalBtnBuy');
        this.elements.modalBtnSell = document.getElementById('modalBtnSell');
        this.elements.editTradeModal = document.getElementById('editTradeModal');
        this.elements.editTradeForm = document.getElementById('editTradeForm');
        this.elements.editTradeId = document.getElementById('editTradeId');
        this.elements.editTradeAccount = document.getElementById('editTradeAccount');
        this.elements.editTradeDate = document.getElementById('editTradeDate');
        this.elements.editTradePair = document.getElementById('editTradePair');
        this.elements.editTradeDirection = document.getElementById('editTradeDirection');
        this.elements.editTradeResult = document.getElementById('editTradeResult');
        this.elements.editTradePnL = document.getElementById('editTradePnL');
        this.elements.editTradeRiskPercent = document.getElementById('editTradeRiskPercent');
        this.elements.editTradeEntry = document.getElementById('editTradeEntry');
        this.elements.editTradeSL = document.getElementById('editTradeSL');
        this.elements.editTradeTP = document.getElementById('editTradeTP');
        this.elements.editTradeLotSize = document.getElementById('editTradeLotSize');
        this.elements.editTradeRating = document.getElementById('editTradeRating');
        this.elements.editTradeWentWell = document.getElementById('editTradeWentWell');
        this.elements.editTradeMistakes = document.getElementById('editTradeMistakes');
        this.elements.editTradeLesson = document.getElementById('editTradeLesson');
        this.elements.editRatingStars = document.getElementById('editRatingStars');
        this.elements.btnEditModalClose = document.getElementById('btnEditModalClose');
        this.elements.btnEditModalCancel = document.getElementById('btnEditModalCancel');
        this.elements.editModalBtnBuy = document.getElementById('editModalBtnBuy');
        this.elements.editModalBtnSell = document.getElementById('editModalBtnSell');
        this.elements.detailModal = document.getElementById('tradeDetailModal');
        this.elements.detailContent = document.getElementById('tradeDetailContent');
        this.elements.detailModalTitle = document.getElementById('detailModalTitle');
        this.elements.btnDetailModalClose = document.getElementById('btnDetailModalClose');
        this.elements.btnDetailEdit = document.getElementById('btnDetailEdit');
        this.elements.btnDetailDelete = document.getElementById('btnDetailDelete');
    },

    bindEvents() {
        this.elements.btnNewTrade.addEventListener('click', () => this.openNewTradeModal());
        this.elements.btnModalClose.addEventListener('click', () => this.closeModal(this.elements.tradeModal));
        this.elements.btnModalCancel.addEventListener('click', () => this.closeModal(this.elements.tradeModal));
        this.elements.btnEditModalClose.addEventListener('click', () => this.closeModal(this.elements.editTradeModal));
        this.elements.btnEditModalCancel.addEventListener('click', () => this.closeModal(this.elements.editTradeModal));
        this.elements.btnDetailModalClose.addEventListener('click', () => this.closeModal(this.elements.detailModal));

        [this.elements.tradeModal, this.elements.editTradeModal, this.elements.detailModal].forEach(modal => {
            if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) this.closeModal(modal); });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal(this.elements.tradeModal);
                this.closeModal(this.elements.editTradeModal);
                this.closeModal(this.elements.detailModal);
            }
        });

        this.elements.tradeForm.addEventListener('submit', (e) => { e.preventDefault(); this.saveNewTrade(); });
        this.elements.editTradeForm.addEventListener('submit', (e) => { e.preventDefault(); this.saveEditedTrade(); });
        this.elements.modalBtnBuy.addEventListener('click', () => this.setDirection('BUY', 'new'));
        this.elements.modalBtnSell.addEventListener('click', () => this.setDirection('SELL', 'new'));
        this.elements.editModalBtnBuy.addEventListener('click', () => this.setDirection('BUY', 'edit'));
        this.elements.editModalBtnSell.addEventListener('click', () => this.setDirection('SELL', 'edit'));

        this.elements.ratingStars.querySelectorAll('.star-btn').forEach(btn => {
            btn.addEventListener('click', () => this.setRating(parseInt(btn.dataset.rating), 'new'));
        });
        this.elements.editRatingStars.querySelectorAll('.star-btn').forEach(btn => {
            btn.addEventListener('click', () => this.setRating(parseInt(btn.dataset.rating), 'edit'));
        });

        this.elements.btnDetailEdit.addEventListener('click', () => this.openEditFromDetail());
        this.elements.btnDetailDelete.addEventListener('click', () => this.deleteFromDetail());

        this.elements.filterAccount.addEventListener('change', () => { this.currentFilters.account = this.elements.filterAccount.value; this.renderAll(); });
        this.elements.filterResult.addEventListener('change', () => { this.currentFilters.result = this.elements.filterResult.value; this.renderAll(); });
        this.elements.filterPair.addEventListener('change', () => { this.currentFilters.pair = this.elements.filterPair.value; this.renderAll(); });

        EventBus.on(EVENTS.ACCOUNTS_UPDATED, () => {
            this.populateFilterDropdowns();
            this.populateAccountDropdown(this.elements.tradeAccount);
            this.populateAccountDropdown(this.elements.editTradeAccount);
            this.renderAll();
        });
        EventBus.on(EVENTS.ACTIVE_ACCOUNT_CHANGED, () => { this.populateFilterDropdowns(); });
    },

    openModal(modal) { if (!modal) return; modal.classList.remove('hidden'); document.body.style.overflow = 'hidden'; },
    closeModal(modal) {
        if (!modal) return;
        modal.classList.add('hidden');
        if (document.querySelectorAll('.modal-overlay:not(.hidden)').length === 0) document.body.style.overflow = '';
    },

    openNewTradeModal() {
        if (!Store.accounts || Store.accounts.length === 0) { UI.showToast('Please add an account in Settings first.'); return; }
        this.elements.modalTitle.textContent = 'New Trade Entry';
        this.elements.tradeForm.reset();
        this.populateAccountDropdown(this.elements.tradeAccount);
        this.setDefaultDate();
        this.setDirection('BUY', 'new');
        this.setRating(0, 'new');
        this.elements.tradeRating.value = 0;
        this.openModal(this.elements.tradeModal);
    },

    setDefaultDate() { const today = new Date().toISOString().split('T')[0]; if (this.elements.tradeDate) this.elements.tradeDate.value = today; },

    setDirection(direction, mode) {
        if (mode === 'new') {
            this.elements.tradeDirection.value = direction;
            this.elements.modalBtnBuy.classList.toggle('active', direction === 'BUY');
            this.elements.modalBtnSell.classList.toggle('active', direction === 'SELL');
        } else {
            this.elements.editTradeDirection.value = direction;
            this.elements.editModalBtnBuy.classList.toggle('active', direction === 'BUY');
            this.elements.editModalBtnSell.classList.toggle('active', direction === 'SELL');
        }
    },

    setRating(rating, mode) {
        const starsContainer = mode === 'new' ? this.elements.ratingStars : this.elements.editRatingStars;
        const hiddenInput = mode === 'new' ? this.elements.tradeRating : this.elements.editTradeRating;
        hiddenInput.value = rating;
        starsContainer.querySelectorAll('.star-btn').forEach(btn => {
            const btnRating = parseInt(btn.dataset.rating);
            if (btnRating <= rating) { btn.textContent = '★'; btn.classList.add('active'); }
            else { btn.textContent = '☆'; btn.classList.remove('active'); }
        });
    },

    saveNewTrade() {
        const trade = this.collectFormData('new');
        if (!trade) return;
        trade.id = UI.generateId();
        trade.createdAt = new Date().toISOString();
        if (!Store.journal) Store.journal = [];
        Store.journal.unshift(trade);
        this.persistAndRefresh();
        this.closeModal(this.elements.tradeModal);
        UI.showToast('Trade logged successfully');
    },

    openEditModal(tradeId) {
        const trade = Store.journal.find(t => t.id === tradeId);
        if (!trade) return;
        this.editingTradeId = tradeId;
        this.populateAccountDropdown(this.elements.editTradeAccount);
        this.elements.editTradeId.value = trade.id;
        this.elements.editTradeAccount.value = trade.accountId || '';
        this.elements.editTradeDate.value = trade.date || '';
        this.elements.editTradePair.value = trade.pair || '';
        this.setDirection(trade.direction || 'BUY', 'edit');
        this.elements.editTradeResult.value = trade.result || '';
        this.elements.editTradePnL.value = trade.pnl || 0;
        this.elements.editTradeRiskPercent.value = trade.riskPercent || '';
        this.elements.editTradeEntry.value = trade.entry || '';
        this.elements.editTradeSL.value = trade.sl || '';
        this.elements.editTradeTP.value = trade.tp || '';
        this.elements.editTradeLotSize.value = trade.lotSize || '';
        this.setRating(trade.rating || 0, 'edit');
        this.elements.editTradeWentWell.value = trade.wentWell || '';
        this.elements.editTradeMistakes.value = trade.mistakes || '';
        this.elements.editTradeLesson.value = trade.lesson || '';
        // Session & HTF
        const sessionSelect = document.getElementById('editTradeSession');
        if (sessionSelect) sessionSelect.value = trade.session || '';
        const htfSelect = document.getElementById('editTradeHTFDirection');
        if (htfSelect) htfSelect.value = trade.htfDirection || '';
        this.openModal(this.elements.editTradeModal);
    },

    saveEditedTrade() {
        const trade = this.collectFormData('edit');
        if (!trade) return;
        const index = Store.journal.findIndex(t => t.id === this.editingTradeId);
        if (index === -1) return;
        trade.id = this.editingTradeId;
        trade.createdAt = Store.journal[index].createdAt;
        Store.journal[index] = trade;
        this.editingTradeId = null;
        this.persistAndRefresh();
        this.closeModal(this.elements.editTradeModal);
        this.closeModal(this.elements.detailModal);
        UI.showToast('Trade updated successfully');
    },

    openEditFromDetail() { if (!this.viewingTradeId) return; this.closeModal(this.elements.detailModal); this.openEditModal(this.viewingTradeId); },

    deleteTrade(tradeId) {
        if (!confirm('Delete this trade?')) return;
        Store.journal = Store.journal.filter(t => t.id !== tradeId);
        this.persistAndRefresh();
        this.closeModal(this.elements.detailModal);
        UI.showToast('Trade deleted');
    },
    deleteFromDetail() { if (this.viewingTradeId) this.deleteTrade(this.viewingTradeId); },

    openDetailModal(tradeId) {
        const trade = Store.journal.find(t => t.id === tradeId);
        if (!trade) return;
        this.viewingTradeId = tradeId;
        const account = Store.accounts ? Store.accounts.find(a => a.id === trade.accountId) : null;
        const accountName = account ? account.name : 'Unknown';
        const resultClass = trade.result === 'WIN' ? 'win' : trade.result === 'LOSS' ? 'loss' : '';
        const pnlFormatted = FORMATTERS.currency.format(Math.abs(trade.pnl || 0));
        const pnlSign = (trade.pnl || 0) >= 0 ? '+' : '-';

        this.elements.detailContent.innerHTML = `
            <div class="detail-row"><span class="detail-label">Account</span><span class="detail-value">${UI.escapeHTML(accountName)}</span></div>
            <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${FORMATTERS.fullDate.format(new Date(trade.date + 'T00:00:00'))}</span></div>
            <div class="detail-row"><span class="detail-label">Pair</span><span class="detail-value">${UI.escapeHTML(trade.pair)}</span></div>
            <div class="detail-row"><span class="detail-label">Direction</span><span class="detail-value">${trade.direction}</span></div>
            ${trade.session ? `<div class="detail-row"><span class="detail-label">Session</span><span class="detail-value">${trade.session}</span></div>` : ''}
            ${trade.htfDirection ? `<div class="detail-row"><span class="detail-label">HTF Direction</span><span class="detail-value">${trade.htfDirection}</span></div>` : ''}
            <div class="detail-row"><span class="detail-label">Result</span><span class="detail-value ${resultClass}">${trade.result}</span></div>
            <div class="detail-row"><span class="detail-label">P&L</span><span class="detail-value ${resultClass}">${pnlSign}${pnlFormatted}</span></div>
            <div class="detail-row"><span class="detail-label">Risk</span><span class="detail-value">${trade.riskPercent || '--'}%</span></div>
            ${trade.entry ? `<div class="detail-row"><span class="detail-label">Entry</span><span class="detail-value">${trade.entry}</span></div>` : ''}
            ${trade.sl ? `<div class="detail-row"><span class="detail-label">Stop Loss</span><span class="detail-value">${trade.sl}</span></div>` : ''}
            ${trade.tp ? `<div class="detail-row"><span class="detail-label">Take Profit</span><span class="detail-value">${trade.tp}</span></div>` : ''}
            ${trade.lotSize ? `<div class="detail-row"><span class="detail-label">Lot Size</span><span class="detail-value">${trade.lotSize}</span></div>` : ''}
            <div class="detail-row"><span class="detail-label">Rating</span><span class="detail-value">${'★'.repeat(trade.rating || 0)}${'☆'.repeat(5 - (trade.rating || 0))}</span></div>
            ${trade.wentWell ? `<div class="detail-section-title">What went well</div><div class="detail-text">${UI.escapeHTML(trade.wentWell)}</div>` : ''}
            ${trade.mistakes ? `<div class="detail-section-title">Mistakes made</div><div class="detail-text">${UI.escapeHTML(trade.mistakes)}</div>` : ''}
            ${trade.lesson ? `<div class="detail-section-title">Lesson learned</div><div class="detail-text">${UI.escapeHTML(trade.lesson)}</div>` : ''}
        `;
        this.openModal(this.elements.detailModal);
    },

    collectFormData(mode) {
        const accountId = mode === 'new' ? this.elements.tradeAccount.value : this.elements.editTradeAccount.value;
        const date = mode === 'new' ? this.elements.tradeDate.value : this.elements.editTradeDate.value;
        const pair = mode === 'new' ? this.elements.tradePair.value : this.elements.editTradePair.value;
        const result = mode === 'new' ? this.elements.tradeResult.value : this.elements.editTradeResult.value;
        const pnl = mode === 'new' ? parseFloat(this.elements.tradePnL.value) : parseFloat(this.elements.editTradePnL.value);

        if (!accountId) { UI.showToast('Please select an account.'); return null; }
        if (!date) { UI.showToast('Please select a date.'); return null; }
        if (!pair) { UI.showToast('Please select a pair.'); return null; }
        if (!result) { UI.showToast('Please select a result.'); return null; }
        if (isNaN(pnl)) { UI.showToast('Please enter a valid P&L amount.'); return null; }

        return {
            accountId, date, pair,
            direction: mode === 'new' ? this.elements.tradeDirection.value : this.elements.editTradeDirection.value,
            result, pnl,
            riskPercent: mode === 'new' ? (parseFloat(this.elements.tradeRiskPercent.value) || 0) : (parseFloat(this.elements.editTradeRiskPercent.value) || 0),
            entry: mode === 'new' ? (this.elements.tradeEntry.value ? parseFloat(this.elements.tradeEntry.value) : null) : (this.elements.editTradeEntry.value ? parseFloat(this.elements.editTradeEntry.value) : null),
            sl: mode === 'new' ? (this.elements.tradeSL.value ? parseFloat(this.elements.tradeSL.value) : null) : (this.elements.editTradeSL.value ? parseFloat(this.elements.editTradeSL.value) : null),
            tp: mode === 'new' ? (this.elements.tradeTP.value ? parseFloat(this.elements.tradeTP.value) : null) : (this.elements.editTradeTP.value ? parseFloat(this.elements.editTradeTP.value) : null),
            lotSize: mode === 'new' ? (this.elements.tradeLotSize.value ? parseFloat(this.elements.tradeLotSize.value) : null) : (this.elements.editTradeLotSize.value ? parseFloat(this.elements.editTradeLotSize.value) : null),
            rating: mode === 'new' ? parseInt(this.elements.tradeRating.value) || 0 : parseInt(this.elements.editTradeRating.value) || 0,
            wentWell: mode === 'new' ? this.elements.tradeWentWell.value.trim() : this.elements.editTradeWentWell.value.trim(),
            mistakes: mode === 'new' ? this.elements.tradeMistakes.value.trim() : this.elements.editTradeMistakes.value.trim(),
            lesson: mode === 'new' ? this.elements.tradeLesson.value.trim() : this.elements.editTradeLesson.value.trim(),
            session: mode === 'new' ? (document.getElementById('tradeSession')?.value || '') : (document.getElementById('editTradeSession')?.value || ''),
            htfDirection: mode === 'new' ? (document.getElementById('tradeHTFDirection')?.value || '') : (document.getElementById('editTradeHTFDirection')?.value || ''),
        };
    },

    getFilteredTrades() {
        if (!Store.journal) return [];
        let trades = [...Store.journal];
        if (this.currentFilters.account !== 'all') trades = trades.filter(t => t.accountId === this.currentFilters.account);
        if (this.currentFilters.result !== 'all') trades = trades.filter(t => t.result === this.currentFilters.result);
        if (this.currentFilters.pair !== 'all') trades = trades.filter(t => t.pair === this.currentFilters.pair);
        trades.sort((a, b) => `${b.date}T${b.createdAt || ''}`.localeCompare(`${a.date}T${a.createdAt || ''}`));
        return trades;
    },

    populateFilterDropdowns() {
        const accountFilter = this.elements.filterAccount;
        const currentAccountFilter = accountFilter.value;
        accountFilter.innerHTML = '<option value="all">All Accounts</option>';
        if (Store.accounts && Store.accounts.length > 0) {
            Store.accounts.forEach(acc => {
                accountFilter.innerHTML += `<option value="${acc.id}" ${currentAccountFilter === acc.id ? 'selected' : ''}>${UI.escapeHTML(acc.name)}</option>`;
            });
        }
        accountFilter.value = (currentAccountFilter && Store.accounts?.some(a => a.id === currentAccountFilter)) ? currentAccountFilter : 'all';
        this.currentFilters.account = accountFilter.value;

        const pairFilter = this.elements.filterPair;
        const currentPairFilter = pairFilter.value;
        pairFilter.innerHTML = '<option value="all">All Pairs</option>';
        const usedPairs = new Set();
        JOURNAL_PAIRS.forEach(p => usedPairs.add(p));
        if (Store.journal) Store.journal.forEach(t => { if (t.pair) usedPairs.add(t.pair); });
        [...usedPairs].sort().forEach(p => {
            if (p) pairFilter.innerHTML += `<option value="${p}" ${currentPairFilter === p ? 'selected' : ''}>${p}</option>`;
        });
        pairFilter.value = (currentPairFilter && usedPairs.has(currentPairFilter)) ? currentPairFilter : 'all';
        this.currentFilters.pair = pairFilter.value;
    },

    populateAccountDropdown(selectElement) {
        if (!selectElement) return;
        selectElement.innerHTML = '<option value="">Select Account</option>';
        if (!Store.accounts || Store.accounts.length === 0) {
            selectElement.innerHTML += '<option value="" disabled>No accounts — add one in Settings</option>';
        } else {
            Store.accounts.forEach(acc => selectElement.innerHTML += `<option value="${acc.id}">${UI.escapeHTML(acc.name)}</option>`);
        }
    },

    renderAll() { this.updateStats(); this.renderEntries(); this.populateFilterDropdowns(); },

    updateStats() {
        const trades = this.getFilteredTrades();
        const total = trades.length;
        const wins = trades.filter(t => t.result === 'WIN').length;
        const losses = trades.filter(t => t.result === 'LOSS').length;
        const closed = wins + losses;
        const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const winRate = closed > 0 ? Math.round((wins / closed) * 100) : 0;
        let best = null, worst = null;
        const winningTrades = trades.filter(t => (t.pnl || 0) > 0);
        if (winningTrades.length > 0) best = Math.max(...winningTrades.map(t => t.pnl));
        const losingTrades = trades.filter(t => (t.pnl || 0) < 0);
        if (losingTrades.length > 0) worst = Math.min(...losingTrades.map(t => t.pnl));
        const winTrades = trades.filter(t => t.result === 'WIN' && t.pnl > 0);
        const lossTrades = trades.filter(t => t.result === 'LOSS' && t.pnl < 0);
        let avgRR = 0;
        if (winTrades.length > 0 && lossTrades.length > 0) {
            const avgWin = winTrades.reduce((s, t) => s + t.pnl, 0) / winTrades.length;
            const avgLoss = Math.abs(lossTrades.reduce((s, t) => s + t.pnl, 0) / lossTrades.length);
            if (avgLoss > 0) avgRR = avgWin / avgLoss;
        }
        this._animateStat(this.elements.totalTrades, this._currentStats.totalTrades, total, 'int');
        this._animateStat(this.elements.winRate, this._currentStats.winRate, winRate, 'percent');
        this._animateStat(this.elements.totalPnL, this._currentStats.totalPnL, totalPnL, 'currency');
        this._animateStat(this.elements.avgRR, this._currentStats.avgRR, avgRR, 'ratio');
        this._animateStat(this.elements.bestTrade, this._currentStats.bestTrade, best, 'currency');
        this._animateStat(this.elements.worstTrade, this._currentStats.worstTrade, worst, 'currency');
        Object.assign(this._currentStats, { totalTrades: total, winRate, totalPnL, avgRR, bestTrade: best, worstTrade: worst });
    },

    _animateStat(element, startValue, endValue, type) {
        if (!element) return;
        if (this._animationFrames[element.id]) cancelAnimationFrame(this._animationFrames[element.id]);
        const start = (startValue !== null && startValue !== undefined) ? startValue : 0;
        const end = (endValue !== null && endValue !== undefined) ? endValue : 0;
        if (Math.abs(end - start) < 0.001) { this._renderStatValue(element, end, type); return; }
        const duration = 400, startTime = performance.now();
        const animate = (currentTime) => {
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            this._renderStatValue(element, start + (end - start) * eased, type);
            if (progress < 1) this._animationFrames[element.id] = requestAnimationFrame(animate);
            else this._renderStatValue(element, end, type);
        };
        this._animationFrames[element.id] = requestAnimationFrame(animate);
    },

    _renderStatValue(element, value, type) {
        if (type === 'int') element.textContent = Math.round(value);
        else if (type === 'percent') element.textContent = value > 0 ? `${Math.round(value)}%` : '--';
        else if (type === 'currency') {
            if (value === null || value === 0) { element.textContent = '--'; element.style.color = ''; }
            else { element.textContent = (value >= 0 ? '+' : '') + FORMATTERS.currency.format(Math.abs(value)); element.style.color = value >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'; }
        }
        else if (type === 'ratio') element.textContent = value > 0 ? FORMATTERS.ratio.format(value) + ':1' : '--';
    },

    renderEntries() {
        const trades = this.getFilteredTrades();
        const container = this.elements.entriesContainer;
        if (trades.length === 0) {
            container.innerHTML = `<div class="empty-state-journal"><div class="empty-state-icon">📓</div><h3 class="empty-state-title">No Trades Yet</h3><p class="empty-state-description">Every great trader starts with a single entry.<br>Log your first trade and begin building your edge.</p><button class="btn btn-primary" id="btnEmptyStateNewTrade">+ New Trade</button></div>`;
            const emptyBtn = document.getElementById('btnEmptyStateNewTrade');
            if (emptyBtn) emptyBtn.addEventListener('click', () => this.openNewTradeModal());
            return;
        }
        container.innerHTML = trades.map(trade => this.buildEntryCard(trade)).join('');
        container.querySelectorAll('.trade-entry-card').forEach(card => {
            const tradeId = card.dataset.tradeId;
            card.querySelector('.trade-entry-header').addEventListener('click', (e) => { if (!e.target.closest('.btn')) card.classList.toggle('expanded'); });
            card.querySelector('.btn-edit-trade')?.addEventListener('click', (e) => { e.stopPropagation(); this.openEditModal(tradeId); });
            card.querySelector('.btn-delete-trade')?.addEventListener('click', (e) => { e.stopPropagation(); this.deleteTrade(tradeId); });
            card.querySelector('.btn-view-trade')?.addEventListener('click', (e) => { e.stopPropagation(); this.openDetailModal(tradeId); });
        });
    },

    buildEntryCard(trade) {
        const account = Store.accounts ? Store.accounts.find(a => a.id === trade.accountId) : null;
        const accountName = account ? account.name : 'Unknown';
        const pnl = trade.pnl || 0;
        const pnlFormatted = FORMATTERS.currency.format(Math.abs(pnl));
        const pnlSign = pnl >= 0 ? '+' : '-';
        const resultClass = trade.result === 'WIN' ? 'win' : trade.result === 'LOSS' ? 'loss' : 'breakeven';
        const stars = '★'.repeat(trade.rating || 0) + '☆'.repeat(5 - (trade.rating || 0));

        return `
            <div class="trade-entry-card result-${resultClass}" data-trade-id="${trade.id}">
                <div class="trade-entry-header">
                    <div class="trade-entry-left">
                        <span class="trade-entry-pair">${UI.escapeHTML(trade.pair)}</span>
                        <span class="trade-entry-direction ${trade.direction === 'BUY' ? 'buy' : 'sell'}">${trade.direction}</span>
                        <span class="trade-entry-result ${resultClass}">${trade.result}</span>
                        <span class="trade-entry-rating">${stars.split('').map(s => `<span class="${s === '★' ? 'star-filled' : 'star-empty'}">${s}</span>`).join('')}</span>
                    </div>
                    <div class="trade-entry-right">
                        <span class="trade-entry-pnl ${resultClass}">${pnlSign}${pnlFormatted}</span>
                        <span class="trade-entry-date">${FORMATTERS.date.format(new Date(trade.date + 'T00:00:00'))}</span>
                        <span class="trade-entry-arrow">▼</span>
                    </div>
                </div>
                <div class="trade-entry-body">
                    <div class="trade-entry-details-grid">
                        <div class="trade-entry-detail"><span class="trade-entry-detail-label">Account</span><span class="trade-entry-detail-value">${UI.escapeHTML(accountName)}</span></div>
                        ${trade.session ? `<div class="trade-entry-detail"><span class="trade-entry-detail-label">Session</span><span class="trade-entry-detail-value">${trade.session}</span></div>` : ''}
                        ${trade.htfDirection ? `<div class="trade-entry-detail"><span class="trade-entry-detail-label">HTF</span><span class="trade-entry-detail-value">${trade.htfDirection}</span></div>` : ''}
                        ${trade.entry ? `<div class="trade-entry-detail"><span class="trade-entry-detail-label">Entry</span><span class="trade-entry-detail-value">${trade.entry}</span></div>` : '<div></div>'}
                        ${trade.sl ? `<div class="trade-entry-detail"><span class="trade-entry-detail-label">Stop Loss</span><span class="trade-entry-detail-value">${trade.sl}</span></div>` : '<div></div>'}
                        ${trade.tp ? `<div class="trade-entry-detail"><span class="trade-entry-detail-label">Take Profit</span><span class="trade-entry-detail-value">${trade.tp}</span></div>` : '<div></div>'}
                        ${trade.lotSize ? `<div class="trade-entry-detail"><span class="trade-entry-detail-label">Lot Size</span><span class="trade-entry-detail-value">${trade.lotSize}</span></div>` : '<div></div>'}
                        ${trade.riskPercent ? `<div class="trade-entry-detail"><span class="trade-entry-detail-label">Risk</span><span class="trade-entry-detail-value">${trade.riskPercent}%</span></div>` : '<div></div>'}
                    </div>
                    ${(trade.wentWell || trade.mistakes || trade.lesson) ? `
                    <div class="trade-entry-reflection">
                        <div class="trade-entry-reflection-block"><div class="trade-entry-reflection-label">What went well</div><div class="trade-entry-reflection-text">${UI.escapeHTML(trade.wentWell || '--')}</div></div>
                        <div class="trade-entry-reflection-block"><div class="trade-entry-reflection-label">Mistakes made</div><div class="trade-entry-reflection-text">${UI.escapeHTML(trade.mistakes || '--')}</div></div>
                        <div class="trade-entry-reflection-block"><div class="trade-entry-reflection-label">Lesson learned</div><div class="trade-entry-reflection-text">${UI.escapeHTML(trade.lesson || '--')}</div></div>
                    </div>` : ''}
                    <div class="trade-entry-actions">
                        <button class="btn btn-sm btn-primary btn-view-trade">View Details</button>
                        <button class="btn btn-sm btn-secondary btn-edit-trade">Edit</button>
                        <button class="btn btn-sm btn-danger btn-delete-trade">Delete</button>
                    </div>
                </div>
            </div>`;
    },

    persistAndRefresh() {
        Storage.save(CONFIG.STORAGE_KEYS.JOURNAL, Store.journal);
        this.renderAll();
        EventBus.emit(EVENTS.JOURNAL_UPDATED, Store.journal);
        EventBus.emit(EVENTS.DASHBOARD_REFRESH);
    }
};

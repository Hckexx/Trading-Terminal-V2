const CalculatorView = {
    init() {
        // Wait for DOM
        setTimeout(() => {
            this.cacheAll();
            this.bindAll();
            this.loadAccounts();
        }, 100);
    },

    cacheAll() {
        this.calcEntry = document.getElementById('calcEntry');
        this.calcSL = document.getElementById('calcSL');
        this.calcTP = document.getElementById('calcTP');
        this.calcAsset = document.getElementById('calcAsset');
        this.calcRiskType = document.getElementById('calcRiskType');
        this.calcRiskValue = document.getElementById('calcRiskValue');
        this.calcLeverage = document.getElementById('calcLeverage');
        this.calcAccount = document.getElementById('calcAccount');
        this.calcDirection = document.getElementById('calcDirection');
        this.calcBtnBuy = document.getElementById('calcBtnBuy');
        this.calcBtnSell = document.getElementById('calcBtnSell');
        this.calcError = document.getElementById('calcError');
        this.calcWarning = document.getElementById('calcWarning');
        this.calcLotSize = document.getElementById('calcLotSize');
        this.calcUnits = document.getElementById('calcUnits');
        this.calcDollarRisk = document.getElementById('calcDollarRisk');
        this.calcSLDistance = document.getElementById('calcSLDistance');
        this.calcSLUnit = document.getElementById('calcSLUnit');
        this.calcRR = document.getElementById('calcRR');
        this.calcMargin = document.getElementById('calcMargin');
        this.calcProfit = document.getElementById('calcProfit');
        this.btnSaveJournal = document.getElementById('btnSaveToJournal');
        this.btnCopy = document.getElementById('btnCalcCopy');
    },

    bindAll() {
        if (this.calcEntry) this.calcEntry.addEventListener('input', () => this.run());
        if (this.calcSL) this.calcSL.addEventListener('input', () => this.run());
        if (this.calcTP) this.calcTP.addEventListener('input', () => this.run());
        if (this.calcRiskValue) this.calcRiskValue.addEventListener('input', () => this.run());
        if (this.calcRiskType) this.calcRiskType.addEventListener('change', () => this.run());
        if (this.calcAsset) this.calcAsset.addEventListener('change', () => this.run());
        if (this.calcLeverage) this.calcLeverage.addEventListener('change', () => this.run());
        if (this.calcAccount) this.calcAccount.addEventListener('change', () => this.run());

        if (this.calcBtnBuy) {
            this.calcBtnBuy.addEventListener('click', () => {
                this.calcDirection.value = 'BUY';
                this.calcBtnBuy.classList.add('active');
                this.calcBtnSell.classList.remove('active');
                this.run();
            });
        }
        if (this.calcBtnSell) {
            this.calcBtnSell.addEventListener('click', () => {
                this.calcDirection.value = 'SELL';
                this.calcBtnSell.classList.add('active');
                this.calcBtnBuy.classList.remove('active');
                this.run();
            });
        }

        if (this.btnSaveJournal) this.btnSaveJournal.addEventListener('click', () => this.saveToJournal());
        if (this.btnCopy) this.btnCopy.addEventListener('click', () => this.copyResults());
    },

    loadAccounts() {
        if (!this.calcAccount) return;
        this.calcAccount.innerHTML = '<option value="">Manual Entry (Default $5,000)</option>';
        if (Store.accounts && Store.accounts.length > 0) {
            Store.accounts.forEach(acc => {
                this.calcAccount.innerHTML += `<option value="${acc.id}">${acc.name} ($${acc.balance})</option>`;
            });
        }
    },

    getBalance() {
        if (!this.calcAccount || !this.calcAccount.value) return 5000;
        if (Store.accounts) {
            const acc = Store.accounts.find(a => a.id === this.calcAccount.value);
            if (acc) return acc.balance;
        }
        return 5000;
    },

    run() {
        if (this.calcError) this.calcError.style.display = 'none';
        if (this.calcWarning) this.calcWarning.style.display = 'none';

        const assetKey = this.calcAsset ? this.calcAsset.value : 'XAUUSD';
        const direction = this.calcDirection ? this.calcDirection.value : 'BUY';
        const entry = this.calcEntry ? parseFloat(this.calcEntry.value) : NaN;
        const sl = this.calcSL ? parseFloat(this.calcSL.value) : NaN;
        const tp = this.calcTP && this.calcTP.value ? parseFloat(this.calcTP.value) : null;
        const riskType = this.calcRiskType ? this.calcRiskType.value : 'percent';
        const riskVal = this.calcRiskValue ? parseFloat(this.calcRiskValue.value) : 0.5;
        const leverage = this.calcLeverage ? parseInt(this.calcLeverage.value) || 0 : 100;
        const balance = this.getBalance();

        // Asset config
        const assets = {
            XAUUSD: { cs: 100, ps: 0.10, tv: 1.00, min: 0.01, step: 0.01, max: 100, unit: 'oz', dl: 'pips' },
            BTCUSD: { cs: 1, ps: 1.00, tv: 1.00, min: 0.01, step: 0.01, max: 100, unit: 'BTC', dl: 'points' },
            ETHUSD: { cs: 1, ps: 0.01, tv: 0.01, min: 0.01, step: 0.01, max: 100, unit: 'ETH', dl: 'points' },
            EURUSD: { cs: 100000, ps: 0.0001, tv: 10.00, min: 0.01, step: 0.01, max: 100, unit: 'units', dl: 'pips' },
            GBPUSD: { cs: 100000, ps: 0.0001, tv: 10.00, min: 0.01, step: 0.01, max: 100, unit: 'units', dl: 'pips' },
            US30: { cs: 1, ps: 1.00, tv: 1.00, min: 0.01, step: 0.01, max: 500, unit: 'contracts', dl: 'points' },
            NAS100: { cs: 1, ps: 1.00, tv: 1.00, min: 0.01, step: 0.01, max: 500, unit: 'contracts', dl: 'points' },
            custom: { cs: 1, ps: 0.01, tv: 1.00, min: 0.01, step: 0.01, max: 9999, unit: 'units', dl: 'units' }
        };
        const a = assets[assetKey] || assets['custom'];

        // Validate
        if (isNaN(entry) || isNaN(sl)) {
            this.clearOutputs();
            return;
        }
        if (entry === sl) { this.showError('Entry cannot equal Stop Loss.'); return; }
        if (direction === 'BUY' && sl >= entry) { this.showError('Buy: SL must be below Entry.'); return; }
        if (direction === 'SELL' && sl <= entry) { this.showError('Sell: SL must be above Entry.'); return; }
        if (tp && direction === 'BUY' && tp <= entry) { this.showError('Buy: TP must be above Entry.'); return; }
        if (tp && direction === 'SELL' && tp >= entry) { this.showError('Sell: TP must be below Entry.'); return; }
        if (isNaN(riskVal) || riskVal <= 0) { this.showError('Enter a valid risk value.'); return; }

        // Calculate
        const dollarRisk = riskType === 'percent' ? balance * (riskVal / 100) : riskVal;
        const slDist = Math.abs(entry - sl);
        const slPips = slDist / a.ps;
        const riskPerLot = slPips * a.tv;
        if (riskPerLot <= 0) { this.showError('Invalid SL distance.'); return; }

        let lots = dollarRisk / riskPerLot;
        const rounded = Math.max(a.min, Math.min(a.max, Math.floor(lots / a.step) * a.step));
        const units = rounded * a.cs;

        // Margin
        const notional = rounded * a.cs * entry;
        const margin = leverage > 0 ? notional / leverage : notional;

        // Warnings
        const warnings = [];
        if (rounded === a.min && lots < a.min) warnings.push('Rounded up to minimum lot. Actual risk is higher.');
        if (rounded === a.max && lots > a.max) warnings.push('Capped at maximum lot. Risk is lower than desired.');
        if (leverage > 0 && margin > balance) warnings.push('Insufficient margin at this leverage.');
        if (riskType === 'percent' && riskVal > 5) warnings.push('Risking more than 5% of your account.');

        // Profit & RR
        let rr = 0, profit = 0;
        if (tp) {
            const tpDist = Math.abs(tp - entry);
            rr = slDist > 0 ? tpDist / slDist : 0;
            profit = rounded * (tpDist / a.ps) * a.tv;
        }

        // Render
        if (this.calcLotSize) this.calcLotSize.textContent = rounded.toFixed(2);
        if (this.calcUnits) this.calcUnits.textContent = units.toFixed(2) + ' ' + a.unit;
        if (this.calcDollarRisk) this.calcDollarRisk.textContent = '$' + dollarRisk.toFixed(2);
        if (this.calcSLDistance) this.calcSLDistance.textContent = slPips.toFixed(1);
        if (this.calcSLUnit) this.calcSLUnit.textContent = a.dl;
        if (this.calcMargin) this.calcMargin.textContent = '$' + margin.toFixed(2);
        if (this.calcProfit) this.calcProfit.textContent = '$' + profit.toFixed(2);
        if (this.calcRR) this.calcRR.textContent = rr > 0 ? rr.toFixed(2) + ' : 1' : '--';

        if (warnings.length > 0 && this.calcWarning) {
            this.calcWarning.innerHTML = warnings.join('<br>');
            this.calcWarning.style.display = 'block';
        }

        if (this.btnSaveJournal) this.btnSaveJournal.disabled = false;
    },

    showError(msg) {
        if (this.calcError) { this.calcError.textContent = msg; this.calcError.style.display = 'block'; }
        this.clearOutputs();
    },

    clearOutputs() {
        const ids = ['calcLotSize', 'calcUnits', 'calcDollarRisk', 'calcSLDistance', 'calcRR', 'calcMargin', 'calcProfit'];
        ids.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '--'; });
        if (this.calcSLUnit) this.calcSLUnit.textContent = '';
        if (this.btnSaveJournal) this.btnSaveJournal.disabled = true;
    },

    saveToJournal() {
        Router.navigateTo('journal');
        UI.showToast('Go to Journal → + New Trade to log this setup.');
    },

    copyResults() {
        const lot = this.calcLotSize ? this.calcLotSize.textContent : '--';
        if (lot === '--') { UI.showToast('No results to copy.'); return; }
        const text = `${this.calcDirection.value} ${this.calcAsset.value}\nLot: ${lot}\nEntry: ${this.calcEntry.value} | SL: ${this.calcSL.value}\nRisk: ${this.calcDollarRisk.textContent}`;
        navigator.clipboard.writeText(text).then(() => UI.showToast('Copied!')).catch(() => UI.showToast('Copy failed.'));
    }
};
// Auto-init when script loads (belt and suspenders)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CalculatorView.init());
} else {
    CalculatorView.init();
}

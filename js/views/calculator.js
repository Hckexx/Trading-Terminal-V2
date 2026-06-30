/* ==========================================================================
   TRADETERMINAL V2 — Position Size Calculator (Corrected Formulas)
   ========================================================================== */

const CalculatorView = {
    elements: {},

    ASSETS: {
        // Forex — pip-based formula
        XAUUSD: { type: 'gold', contractSize: 100, pipSize: 0.10, minLot: 0.01, lotStep: 0.01, maxLot: 100, unitLabel: 'oz', distanceLabel: 'pips', pipValue: 100 },
        EURUSD: { type: 'forex', contractSize: 100000, pipSize: 0.0001, minLot: 0.01, lotStep: 0.01, maxLot: 100, unitLabel: 'units', distanceLabel: 'pips', pipValue: 10 },
        GBPUSD: { type: 'forex', contractSize: 100000, pipSize: 0.0001, minLot: 0.01, lotStep: 0.01, maxLot: 100, unitLabel: 'units', distanceLabel: 'pips', pipValue: 10 },
        // Crypto — direct dollar distance formula
        BTCUSD: { type: 'crypto', minLot: 0.0001, lotStep: 0.0001, maxLot: 100, unitLabel: 'BTC', distanceLabel: 'dollars' },
        ETHUSD: { type: 'crypto', minLot: 0.0001, lotStep: 0.0001, maxLot: 500, unitLabel: 'ETH', distanceLabel: 'dollars' },
        // Indices — point-based
        US30:   { type: 'forex', contractSize: 1, pipSize: 1.00, minLot: 0.01, lotStep: 0.01, maxLot: 500, unitLabel: 'contracts', distanceLabel: 'points', pipValue: 1 },
        NAS100: { type: 'forex', contractSize: 1, pipSize: 1.00, minLot: 0.01, lotStep: 0.01, maxLot: 500, unitLabel: 'contracts', distanceLabel: 'points', pipValue: 1 },
        custom: { type: 'forex', contractSize: 1, pipSize: 0.01, minLot: 0.01, lotStep: 0.01, maxLot: 9999, unitLabel: 'units', distanceLabel: 'units', pipValue: 1 }
    },

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.loadAccountDropdown();
    },

    cacheDOM() {
        this.elements = {};
        const ids = [
            'calcAccount', 'calcRiskType', 'calcRiskValue', 'calcRiskLabel',
            'calcLeverage', 'calcAsset', 'calcDirection',
            'calcBtnBuy', 'calcBtnSell', 'calcEntry', 'calcSL', 'calcTP',
            'calcLotSize', 'calcUnits', 'calcDollarRisk', 'calcSLDistance',
            'calcSLUnit', 'calcRR', 'calcMargin', 'calcProfit',
            'calcError', 'calcWarning', 'btnSaveToJournal', 'btnCalcCopy'
        ];
        ids.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });
    },

    bindEvents() {
        ['calcEntry', 'calcSL', 'calcTP', 'calcRiskValue'].forEach(id => {
            const el = this.elements[id];
            if (el) el.addEventListener('input', () => this.run());
        });
        ['calcRiskType', 'calcAsset', 'calcLeverage', 'calcAccount'].forEach(id => {
            const el = this.elements[id];
            if (el) el.addEventListener('change', () => {
                if (id === 'calcRiskType') this.updateRiskLabel();
                this.run();
            });
        });

        if (this.elements.calcBtnBuy) {
            this.elements.calcBtnBuy.addEventListener('click', () => {
                this.elements.calcDirection.value = 'BUY';
                this.elements.calcBtnBuy.classList.add('active');
                this.elements.calcBtnSell.classList.remove('active');
                this.run();
            });
        }
        if (this.elements.calcBtnSell) {
            this.elements.calcBtnSell.addEventListener('click', () => {
                this.elements.calcDirection.value = 'SELL';
                this.elements.calcBtnSell.classList.add('active');
                this.elements.calcBtnBuy.classList.remove('active');
                this.run();
            });
        }

        if (this.elements.btnSaveToJournal) this.elements.btnSaveToJournal.addEventListener('click', () => this.saveToJournal());
        if (this.elements.btnCalcCopy) this.elements.btnCalcCopy.addEventListener('click', () => this.copyResults());
    },

    loadAccountDropdown() {
        const select = this.elements.calcAccount;
        if (!select) return;
        select.innerHTML = '<option value="">Manual ($5,000 default)</option>';
        if (Store.accounts && Store.accounts.length > 0) {
            Store.accounts.forEach(acc => {
                select.innerHTML += `<option value="${acc.id}">${UI.escapeHTML(acc.name)} ($${FORMATTERS.compact.format(acc.balance)})</option>`;
            });
        }
    },

    updateRiskLabel() {
        const type = this.elements.calcRiskType?.value || 'percent';
        if (this.elements.calcRiskLabel) {
            this.elements.calcRiskLabel.textContent = type === 'percent' ? 'Risk Value (%)' : 'Risk Value ($)';
        }
    },

    getBalance() {
        const id = this.elements.calcAccount?.value;
        if (id && Store.accounts) {
            const acc = Store.accounts.find(a => a.id === id);
            if (acc) return acc.balance;
        }
        return 5000;
    },

    run() {
        // Hide errors/warnings
        if (this.elements.calcError) this.elements.calcError.style.display = 'none';
        if (this.elements.calcWarning) this.elements.calcWarning.style.display = 'none';

        const assetKey = this.elements.calcAsset?.value || 'XAUUSD';
        const asset = this.ASSETS[assetKey] || this.ASSETS['custom'];
        const direction = this.elements.calcDirection?.value || 'BUY';
        const entry = parseFloat(this.elements.calcEntry?.value);
        const sl = parseFloat(this.elements.calcSL?.value);
        const tp = this.elements.calcTP?.value ? parseFloat(this.elements.calcTP.value) : null;
        const riskType = this.elements.calcRiskType?.value || 'percent';
        const riskVal = parseFloat(this.elements.calcRiskValue?.value) || 0.5;
        const leverage = parseInt(this.elements.calcLeverage?.value) || 0;
        const balance = this.getBalance();

        // Validate
        if (isNaN(entry) || isNaN(sl)) { this.clearOutputs(); return; }
        if (entry === sl) { this.showError('Entry cannot equal Stop Loss.'); return; }
        if (direction === 'BUY' && sl >= entry) { this.showError('Buy: SL must be below Entry.'); return; }
        if (direction === 'SELL' && sl <= entry) { this.showError('Sell: SL must be above Entry.'); return; }
        if (tp && direction === 'BUY' && tp <= entry) { this.showError('Buy: TP must be above Entry.'); return; }
        if (tp && direction === 'SELL' && tp >= entry) { this.showError('Sell: TP must be below Entry.'); return; }
        if (isNaN(riskVal) || riskVal <= 0) { this.showError('Enter a valid risk value.'); return; }

        // Dollar risk
        const dollarRisk = riskType === 'percent' ? balance * (riskVal / 100) : riskVal;
        const slDistancePrice = Math.abs(entry - sl);

        let lots, units;
        const warnings = [];

        // ==========================================
        // CORRECTED FORMULAS BY ASSET TYPE
        // ==========================================

        if (asset.type === 'gold') {
            // GOLD: Lots = (Balance × Risk%) / (SL in $ × 100)
            // $1 move in gold = $100 per standard lot (100 oz)
            lots = dollarRisk / (slDistancePrice * 100);
            units = lots * 100;

        } else if (asset.type === 'crypto') {
            // CRYPTO: Coin Units = (Balance × Risk%) / (Entry - SL)
            // No lots. Direct coin quantity.
            units = dollarRisk / slDistancePrice;
            lots = units; // 1 unit = 1 coin

        } else {
            // FOREX & INDICES: Lot Size = (Balance × Risk%) / (SL in pips × Pip Value)
            const slPips = slDistancePrice / asset.pipSize;
            const pipValue = asset.pipValue || 10;
            lots = dollarRisk / (slPips * pipValue);
            units = lots * (asset.contractSize || 100000);
        }

        // Round to broker step
        const step = asset.lotStep || 0.01;
        const roundedLots = Math.max(asset.minLot, Math.min(asset.maxLot, Math.floor(lots / step) * step));
        const displayUnits = asset.type === 'crypto' ? roundedLots : roundedLots * (asset.contractSize || 100000);

        // Warnings
        if (roundedLots === asset.minLot && lots < asset.minLot) {
            warnings.push('Rounded up to minimum. Actual risk is higher than desired.');
        }
        if (roundedLots === asset.maxLot && lots > asset.maxLot) {
            warnings.push('Capped at maximum. Risk is lower than desired.');
        }

        // Margin
        const notional = asset.type === 'crypto' ? roundedLots * entry : roundedLots * (asset.contractSize || 100000) * entry / (asset.type === 'forex' ? 1 : 1);
        const actualNotional = asset.type === 'crypto' ? roundedLots * entry : roundedLots * (asset.contractSize || 1) * entry;
        const margin = leverage > 0 ? actualNotional / leverage : actualNotional;
        if (leverage > 0 && margin > balance) {
            warnings.push('Insufficient margin at this leverage.');
        }

        // RR & Profit
        let rr = 0, profit = 0;
        if (tp) {
            const tpDist = Math.abs(tp - entry);
            rr = slDistancePrice > 0 ? tpDist / slDistancePrice : 0;
            if (asset.type === 'crypto') {
                profit = roundedLots * tpDist;
            } else if (asset.type === 'gold') {
                profit = roundedLots * 100 * tpDist;
            } else {
                const tpPips = tpDist / asset.pipSize;
                profit = roundedLots * tpPips * (asset.pipValue || 10);
            }
        }

        if (riskType === 'percent' && riskVal > 5) {
            warnings.push('Risking more than 5% of account.');
        }

        // Render
        const unitLabel = asset.unitLabel || 'units';
        if (this.elements.calcLotSize) this.elements.calcLotSize.textContent = roundedLots.toFixed(asset.type === 'crypto' ? 4 : 2);
        if (this.elements.calcUnits) this.elements.calcUnits.textContent = displayUnits.toFixed(asset.type === 'crypto' ? 4 : 2) + ' ' + unitLabel;
        if (this.elements.calcDollarRisk) this.elements.calcDollarRisk.textContent = '$' + dollarRisk.toFixed(2);
        if (this.elements.calcSLDistance) this.elements.calcSLDistance.textContent = slDistancePrice.toFixed(asset.type === 'crypto' ? 2 : 1);
        if (this.elements.calcSLUnit) this.elements.calcSLUnit.textContent = asset.distanceLabel || 'pips';
        if (this.elements.calcMargin) this.elements.calcMargin.textContent = '$' + margin.toFixed(2);
        if (this.elements.calcProfit) this.elements.calcProfit.textContent = '$' + profit.toFixed(2);
        if (this.elements.calcRR) this.elements.calcRR.textContent = rr > 0 ? rr.toFixed(2) + ' : 1' : '--';

        if (warnings.length > 0 && this.elements.calcWarning) {
            this.elements.calcWarning.innerHTML = warnings.join('<br>');
            this.elements.calcWarning.style.display = 'block';
        }
        if (this.elements.btnSaveToJournal) this.elements.btnSaveToJournal.disabled = false;
    },

    showError(msg) {
        if (this.elements.calcError) {
            this.elements.calcError.textContent = msg;
            this.elements.calcError.style.display = 'block';
        }
        this.clearOutputs();
    },

    clearOutputs() {
        ['calcLotSize', 'calcUnits', 'calcDollarRisk', 'calcSLDistance', 'calcRR', 'calcMargin', 'calcProfit'].forEach(id => {
            const el = this.elements[id];
            if (el) el.textContent = '--';
        });
        if (this.elements.calcSLUnit) this.elements.calcSLUnit.textContent = '';
        if (this.elements.btnSaveToJournal) this.elements.btnSaveToJournal.disabled = true;
    },

    saveToJournal() {
        Router.navigateTo('journal');
        UI.showToast('Go to Journal → + New Trade to log this setup.');
    },

    copyResults() {
        const lot = this.elements.calcLotSize?.textContent || '--';
        if (lot === '--') { UI.showToast('No results.'); return; }
        const text = `${this.elements.calcDirection?.value} ${this.elements.calcAsset?.value}\nLot: ${lot}\nEntry: ${this.elements.calcEntry?.value} | SL: ${this.elements.calcSL?.value}\nRisk: ${this.elements.calcDollarRisk?.textContent}`;
        navigator.clipboard.writeText(text).then(() => UI.showToast('Copied!')).catch(() => UI.showToast('Copy failed.'));
    }
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CalculatorView.init());
} else {
    setTimeout(() => CalculatorView.init(), 200);
}

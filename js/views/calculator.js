/* ==========================================================================
   TRADETERMINAL V2 — Position Size Calculator (Fixed)
   ========================================================================== */

const CalculatorView = {
    elements: {},

    ASSETS: {
        XAUUSD: { contractSize: 100, pipSize: 0.10, tickValue: 1.00, minLot: 0.01, lotStep: 0.01, maxLot: 100, unitLabel: 'oz', distanceLabel: 'pips' },
        BTCUSD: { contractSize: 1, pipSize: 1.00, tickValue: 1.00, minLot: 0.01, lotStep: 0.01, maxLot: 100, unitLabel: 'BTC', distanceLabel: 'points' },
        ETHUSD: { contractSize: 1, pipSize: 0.01, tickValue: 0.01, minLot: 0.01, lotStep: 0.01, maxLot: 100, unitLabel: 'ETH', distanceLabel: 'points' },
        EURUSD: { contractSize: 100000, pipSize: 0.0001, tickValue: 10.00, minLot: 0.01, lotStep: 0.01, maxLot: 100, unitLabel: 'units', distanceLabel: 'pips' },
        GBPUSD: { contractSize: 100000, pipSize: 0.0001, tickValue: 10.00, minLot: 0.01, lotStep: 0.01, maxLot: 100, unitLabel: 'units', distanceLabel: 'pips' },
        US30:   { contractSize: 1, pipSize: 1.00, tickValue: 1.00, minLot: 0.01, lotStep: 0.01, maxLot: 500, unitLabel: 'contracts', distanceLabel: 'points' },
        NAS100: { contractSize: 1, pipSize: 1.00, tickValue: 1.00, minLot: 0.01, lotStep: 0.01, maxLot: 500, unitLabel: 'contracts', distanceLabel: 'points' },
        custom: { contractSize: 1, pipSize: 0.01, tickValue: 1.00, minLot: 0.01, lotStep: 0.01, maxLot: 9999, unitLabel: 'units', distanceLabel: 'units' }
    },

    init() {
        console.log('CalculatorView initializing...');
        this.cacheDOM();
        this.bindEvents();
        this.populateAccountDropdown();
        console.log('CalculatorView ready.');
    },

    cacheDOM() {
        this.elements.calcAccount = document.getElementById('calcAccount');
        this.elements.calcRiskType = document.getElementById('calcRiskType');
        this.elements.calcRiskValue = document.getElementById('calcRiskValue');
        this.elements.calcRiskLabel = document.getElementById('calcRiskLabel');
        this.elements.calcLeverage = document.getElementById('calcLeverage');
        this.elements.calcAsset = document.getElementById('calcAsset');
        this.elements.calcDirection = document.getElementById('calcDirection');
        this.elements.calcEntry = document.getElementById('calcEntry');
        this.elements.calcSL = document.getElementById('calcSL');
        this.elements.calcTP = document.getElementById('calcTP');
        this.elements.calcBtnBuy = document.getElementById('calcBtnBuy');
        this.elements.calcBtnSell = document.getElementById('calcBtnSell');

        this.elements.calcLotSize = document.getElementById('calcLotSize');
        this.elements.calcUnits = document.getElementById('calcUnits');
        this.elements.calcDollarRisk = document.getElementById('calcDollarRisk');
        this.elements.calcSLDistance = document.getElementById('calcSLDistance');
        this.elements.calcSLUnit = document.getElementById('calcSLUnit');
        this.elements.calcRR = document.getElementById('calcRR');
        this.elements.calcMargin = document.getElementById('calcMargin');
        this.elements.calcProfit = document.getElementById('calcProfit');
        this.elements.calcError = document.getElementById('calcError');
        this.elements.calcWarning = document.getElementById('calcWarning');
        this.elements.btnSaveToJournal = document.getElementById('btnSaveToJournal');
        this.elements.btnCalcCopy = document.getElementById('btnCalcCopy');
    },

    bindEvents() {
        // Use 'input' event for instant calculation
        const inputIds = ['calcEntry', 'calcSL', 'calcTP', 'calcRiskValue'];
        inputIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => this.calculate());
                console.log('Bound input:', id);
            } else {
                console.warn('Element not found:', id);
            }
        });

        // Select changes
        const selectIds = ['calcRiskType', 'calcAsset', 'calcLeverage', 'calcAccount'];
        selectIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => {
                    if (id === 'calcRiskType') this.updateRiskLabel();
                    this.calculate();
                });
                console.log('Bound select:', id);
            } else {
                console.warn('Element not found:', id);
            }
        });

        // Direction buttons
        if (this.elements.calcBtnBuy) {
            this.elements.calcBtnBuy.addEventListener('click', () => {
                this.elements.calcDirection.value = 'BUY';
                this.elements.calcBtnBuy.classList.add('active');
                this.elements.calcBtnSell.classList.remove('active');
                this.calculate();
            });
        }
        if (this.elements.calcBtnSell) {
            this.elements.calcBtnSell.addEventListener('click', () => {
                this.elements.calcDirection.value = 'SELL';
                this.elements.calcBtnSell.classList.add('active');
                this.elements.calcBtnBuy.classList.remove('active');
                this.calculate();
            });
        }

        // Action buttons
        if (this.elements.btnSaveToJournal) {
            this.elements.btnSaveToJournal.addEventListener('click', () => this.saveToJournal());
        }
        if (this.elements.btnCalcCopy) {
            this.elements.btnCalcCopy.addEventListener('click', () => this.copyResults());
        }

        // Listen for account updates
        EventBus.on(EVENTS.ACCOUNTS_UPDATED, () => {
            this.populateAccountDropdown();
        });
    },

    updateRiskLabel() {
        const type = this.elements.calcRiskType.value;
        this.elements.calcRiskLabel.textContent = type === 'percent' ? 'Risk Value (%)' : 'Risk Value ($)';
    },

    populateAccountDropdown() {
        const select = this.elements.calcAccount;
        if (!select) return;
        select.innerHTML = '<option value="">Manual Entry</option>';
        if (Store.accounts && Store.accounts.length > 0) {
            Store.accounts.forEach(acc => {
                select.innerHTML += `<option value="${acc.id}">${UI.escapeHTML(acc.name)} (${FORMATTERS.compact.format(acc.balance)})</option>`;
            });
        }
    },

    getBalance() {
        const accountId = this.elements.calcAccount.value;
        if (accountId && Store.accounts) {
            const acc = Store.accounts.find(a => a.id === accountId);
            if (acc) return acc.balance;
        }
        return 5000; // Default
    },

    calculate() {
        console.log('Calculating...');
        
        const asset = this.ASSETS[this.elements.calcAsset.value] || this.ASSETS['custom'];
        const direction = this.elements.calcDirection.value;
        const entry = parseFloat(this.elements.calcEntry.value);
        const sl = parseFloat(this.elements.calcSL.value);
        const tp = this.elements.calcTP.value ? parseFloat(this.elements.calcTP.value) : null;
        const riskType = this.elements.calcRiskType.value;
        const riskValue = parseFloat(this.elements.calcRiskValue.value);
        const leverage = parseInt(this.elements.calcLeverage.value) || 0;
        const balance = this.getBalance();

        // Hide errors
        if (this.elements.calcError) this.elements.calcError.style.display = 'none';
        if (this.elements.calcWarning) this.elements.calcWarning.style.display = 'none';

        // Validate
        if (isNaN(entry) || isNaN(sl)) {
            this.clearOutputs();
            return;
        }
        if (entry === sl) {
            this.showError('Entry cannot equal Stop Loss.');
            return;
        }
        if (direction === 'BUY' && sl >= entry) {
            this.showError('Buy: SL must be below Entry.');
            return;
        }
        if (direction === 'SELL' && sl <= entry) {
            this.showError('Sell: SL must be above Entry.');
            return;
        }
        if (tp && direction === 'BUY' && tp <= entry) {
            this.showError('Buy: TP must be above Entry.');
            return;
        }
        if (tp && direction === 'SELL' && tp >= entry) {
            this.showError('Sell: TP must be below Entry.');
            return;
        }
        if (isNaN(riskValue) || riskValue <= 0) {
            this.showError('Enter a valid risk value.');
            return;
        }

        // Dollar risk
        const dollarRisk = riskType === 'percent' ? balance * (riskValue / 100) : riskValue;

        // SL distance
        const slDist = Math.abs(entry - sl);
        const slPips = slDist / asset.pipSize;

        // Position size
        const riskPerLot = slPips * asset.tickValue;
        if (riskPerLot <= 0) {
            this.showError('Invalid SL distance for this asset.');
            return;
        }

        let lots = dollarRisk / riskPerLot;
        const step = asset.lotStep || 0.01;
        const roundedLots = Math.max(asset.minLot, Math.min(asset.maxLot, Math.floor(lots / step) * step));
        const units = roundedLots * asset.contractSize;

        // Warnings
        const warnings = [];
        if (roundedLots === asset.minLot && lots < asset.minLot) {
            warnings.push('Rounded up to minimum lot. Risk is higher than desired.');
        }
        if (roundedLots === asset.maxLot && lots > asset.maxLot) {
            warnings.push('Capped at maximum lot. Risk is lower than desired.');
        }

        // Margin
        const notional = roundedLots * asset.contractSize * entry;
        const margin = leverage > 0 ? notional / leverage : notional;
        if (leverage > 0 && margin > balance) {
            warnings.push('Insufficient margin at this leverage.');
        }

        // R:R & Profit
        let rr = 0, profit = 0;
        if (tp) {
            const tpDist = Math.abs(tp - entry);
            rr = slDist > 0 ? tpDist / slDist : 0;
            const tpPips = tpDist / asset.pipSize;
            profit = roundedLots * tpPips * asset.tickValue;
        }

        if (riskType === 'percent' && riskValue > 5) {
            warnings.push('Risking more than 5% of account.');
        }

        // Render
        this.elements.calcLotSize.textContent = FORMATTERS.lots.format(roundedLots);
        this.elements.calcUnits.textContent = `${FORMATTERS.units.format(units)} ${asset.unitLabel}`;
        this.elements.calcDollarRisk.textContent = FORMATTERS.currency.format(dollarRisk);
        this.elements.calcSLDistance.textContent = FORMATTERS.pips.format(slPips);
        this.elements.calcSLUnit.textContent = asset.distanceLabel;
        this.elements.calcMargin.textContent = FORMATTERS.currency.format(margin);
        this.elements.calcProfit.textContent = FORMATTERS.currency.format(profit);
        this.elements.calcRR.textContent = rr > 0 ? `${FORMATTERS.ratio.format(rr)} : 1` : '--';

        if (warnings.length > 0 && this.elements.calcWarning) {
            this.elements.calcWarning.innerHTML = warnings.join('<br>');
            this.elements.calcWarning.style.display = 'block';
        }

        if (this.elements.btnSaveToJournal) {
            this.elements.btnSaveToJournal.disabled = false;
        }

        console.log('Calculation done. Lots:', roundedLots);
    },

    showError(msg) {
        if (this.elements.calcError) {
            this.elements.calcError.textContent = msg;
            this.elements.calcError.style.display = 'block';
        }
        this.clearOutputs();
    },

    clearOutputs() {
        this.elements.calcLotSize.textContent = '--';
        this.elements.calcUnits.textContent = '--';
        this.elements.calcDollarRisk.textContent = '--';
        this.elements.calcSLDistance.textContent = '--';
        this.elements.calcSLUnit.textContent = '';
        this.elements.calcRR.textContent = '--';
        this.elements.calcMargin.textContent = '--';
        this.elements.calcProfit.textContent = '--';
        if (this.elements.btnSaveToJournal) {
            this.elements.btnSaveToJournal.disabled = true;
        }
    },

    saveToJournal() {
        Router.navigateTo('journal');
        UI.showToast('Switch to Journal and click + New Trade. Values pre-filled from calculator.');
    },

    copyResults() {
        const lotSize = this.elements.calcLotSize.textContent;
        if (lotSize === '--') {
            UI.showToast('No results to copy.');
            return;
        }
        const text = [
            `${this.elements.calcDirection.value} ${this.elements.calcAsset.value}`,
            `Lot Size: ${lotSize} Lots`,
            `Entry: ${this.elements.calcEntry.value} | SL: ${this.elements.calcSL.value}`,
            `Risk: ${this.elements.calcDollarRisk.textContent} | RR: ${this.elements.calcRR.textContent}`
        ].join('\n');

        navigator.clipboard.writeText(text).then(() => {
            UI.showToast('Results copied!');
        }).catch(() => {
            UI.showToast('Copy failed.');
        });
    }
};

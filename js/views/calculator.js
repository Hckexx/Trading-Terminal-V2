/* ==========================================================================
   TRADETERMINAL V2 — Position Size Calculator
   ========================================================================== */

const CalculatorView = {
    elements: {},
    _updateTimeout: null,

    // Asset configuration
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
        this.cacheDOM();
        this.bindEvents();
        this.populateAccountDropdown();
    },

    cacheDOM() {
        // Inputs
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

        // Outputs
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

        // Buttons
        this.elements.btnSaveToJournal = document.getElementById('btnSaveToJournal');
        this.elements.btnCalcCopy = document.getElementById('btnCalcCopy');
    },

    bindEvents() {
        // Input events
        const inputs = ['calcRiskValue', 'calcEntry', 'calcSL', 'calcTP'];
        inputs.forEach(id => {
            if (this.elements[id]) {
                this.elements[id].addEventListener('input', () => this.calculate());
            }
        });

        // Select events
        if (this.elements.calcRiskType) {
            this.elements.calcRiskType.addEventListener('change', () => {
                this.updateRiskLabel();
                this.calculate();
            });
        }
        if (this.elements.calcAsset) {
            this.elements.calcAsset.addEventListener('change', () => this.calculate());
        }
        if (this.elements.calcLeverage) {
            this.elements.calcLeverage.addEventListener('change', () => this.calculate());
        }
        if (this.elements.calcAccount) {
            this.elements.calcAccount.addEventListener('change', () => this.calculate());
        }

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

        // Recalculate when accounts update
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
        if (Store.accounts) {
            Store.accounts.forEach(acc => {
                select.innerHTML += `<option value="${acc.id}">${UI.escapeHTML(acc.name)} (${FORMATTERS.compact.format(acc.balance)})</option>`;
            });
        }
    },

    getAccountBalance() {
        const accountId = this.elements.calcAccount.value;
        if (!accountId || !Store.accounts) return null;
        const account = Store.accounts.find(a => a.id === accountId);
        return account ? account.balance : null;
    },

    calculate() {
        // Clear previous errors
        if (this.elements.calcError) this.elements.calcError.style.display = 'none';
        if (this.elements.calcWarning) this.elements.calcWarning.style.display = 'none';

        const assetKey = this.elements.calcAsset.value;
        const asset = this.ASSETS[assetKey] || this.ASSETS['custom'];
        const direction = this.elements.calcDirection.value;
        const entry = parseFloat(this.elements.calcEntry.value);
        const sl = parseFloat(this.elements.calcSL.value);
        const tp = this.elements.calcTP.value ? parseFloat(this.elements.calcTP.value) : null;
        const riskType = this.elements.calcRiskType.value;
        const riskValue = parseFloat(this.elements.calcRiskValue.value);
        const leverage = parseInt(this.elements.calcLeverage.value) || 0;

        // Get balance
        let balance = this.getAccountBalance();
        if (balance === null) balance = 5000; // Default fallback

        // Validation
        if (!entry || !sl || isNaN(entry) || isNaN(sl)) {
            this.showError('Enter Entry and Stop Loss prices.');
            this.clearOutputs();
            return;
        }
        if (entry === sl) {
            this.showError('Entry cannot equal Stop Loss.');
            this.clearOutputs();
            return;
        }
        if (direction === 'BUY' && sl >= entry) {
            this.showError('Buy: Stop Loss must be below Entry.');
            this.clearOutputs();
            return;
        }
        if (direction === 'SELL' && sl <= entry) {
            this.showError('Sell: Stop Loss must be above Entry.');
            this.clearOutputs();
            return;
        }
        if (tp && direction === 'BUY' && tp <= entry) {
            this.showError('Buy: Take Profit must be above Entry.');
            this.clearOutputs();
            return;
        }
        if (tp && direction === 'SELL' && tp >= entry) {
            this.showError('Sell: Take Profit must be below Entry.');
            this.clearOutputs();
            return;
        }
        if (!riskValue || isNaN(riskValue) || riskValue <= 0) {
            this.showError('Enter a valid risk value.');
            this.clearOutputs();
            return;
        }

        // Calculate dollar risk
        const dollarRisk = riskType === 'percent' ? balance * (riskValue / 100) : riskValue;

        // SL distance
        const slDistancePrice = Math.abs(entry - sl);
        const slDistancePips = slDistancePrice / asset.pipSize;

        // Position size formula
        const dollarRiskPerLot = slDistancePips * asset.tickValue;
        if (dollarRiskPerLot <= 0) {
            this.showError('Invalid stop loss distance for this asset.');
            this.clearOutputs();
            return;
        }

        let lots = dollarRisk / dollarRiskPerLot;
        const roundedLots = this.roundLots(lots, asset);
        const units = roundedLots * asset.contractSize;

        // Warnings
        const warnings = [];
        if (roundedLots !== lots) {
            if (roundedLots === asset.minLot && lots < asset.minLot) {
                warnings.push('Position rounded up to minimum lot size. Actual risk is higher than desired.');
            } else if (roundedLots === asset.maxLot && lots > asset.maxLot) {
                warnings.push('Position capped at maximum lot size. Risk is lower than desired.');
            }
        }

        // Margin
        const notionalValue = roundedLots * asset.contractSize * entry;
        const marginRequired = leverage > 0 ? notionalValue / leverage : notionalValue;
        if (leverage > 0 && marginRequired > balance) {
            warnings.push('Insufficient margin for this position size at the selected leverage.');
        }

        // R:R and Profit
        let rrRatio = 0;
        let potentialProfit = 0;
        if (tp) {
            const tpDistance = Math.abs(tp - entry);
            rrRatio = slDistancePrice > 0 ? tpDistance / slDistancePrice : 0;
            const tpDistancePips = tpDistance / asset.pipSize;
            potentialProfit = roundedLots * tpDistancePips * asset.tickValue;
        }

        // Risk > 5% warning
        if (riskType === 'percent' && riskValue > 5) {
            warnings.push('High risk: You are risking more than 5% of your account.');
        }

        // Update outputs
        this.elements.calcLotSize.textContent = FORMATTERS.lots.format(roundedLots);
        this.elements.calcUnits.textContent = `${FORMATTERS.units.format(units)} ${asset.unitLabel}`;
        this.elements.calcDollarRisk.textContent = FORMATTERS.currency.format(dollarRisk);
        this.elements.calcSLDistance.textContent = FORMATTERS.pips.format(slDistancePips);
        this.elements.calcSLUnit.textContent = asset.distanceLabel;
        this.elements.calcMargin.textContent = FORMATTERS.currency.format(marginRequired);
        this.elements.calcProfit.textContent = FORMATTERS.currency.format(potentialProfit);

        if (rrRatio > 0) {
            this.elements.calcRR.textContent = `${FORMATTERS.ratio.format(rrRatio)} : 1`;
        } else {
            this.elements.calcRR.textContent = '--';
        }

        // Show warnings
        if (warnings.length > 0 && this.elements.calcWarning) {
            this.elements.calcWarning.innerHTML = warnings.join('<br>');
            this.elements.calcWarning.style.display = 'block';
        }

        // Enable save button
        if (this.elements.btnSaveToJournal) {
            this.elements.btnSaveToJournal.disabled = false;
        }
    },

    roundLots(lots, asset) {
        const step = asset.lotStep || 0.01;
        const rounded = Math.floor(lots / step) * step;
        return Math.max(asset.minLot, Math.min(asset.maxLot, rounded));
    },

    showError(msg) {
        if (this.elements.calcError) {
            this.elements.calcError.textContent = msg;
            this.elements.calcError.style.display = 'block';
        }
        if (this.elements.btnSaveToJournal) {
            this.elements.btnSaveToJournal.disabled = true;
        }
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
        // Navigate to journal and pre-fill the form
        Router.navigateTo('journal');
        setTimeout(() => {
            // Populate journal form from calculator values
            if (typeof JournalView !== 'undefined' && JournalView.openNewTradeModal) {
                JournalView.openNewTradeModal();
                // Pre-fill values
                setTimeout(() => {
                    const asset = this.elements.calcAsset.value;
                    const pairSelect = document.getElementById('tradePair');
                    if (pairSelect && asset !== 'custom') {
                        const option = pairSelect.querySelector(`option[value="${asset}"]`);
                        if (option) pairSelect.value = asset;
                    }
                    const entryInput = document.getElementById('tradeEntry');
                    if (entryInput) entryInput.value = this.elements.calcEntry.value;
                    const slInput = document.getElementById('tradeSL');
                    if (slInput) slInput.value = this.elements.calcSL.value;
                    const tpInput = document.getElementById('tradeTP');
                    if (tpInput) tpInput.value = this.elements.calcTP.value;
                    const lotInput = document.getElementById('tradeLotSize');
                    if (lotInput) lotInput.value = this.elements.calcLotSize.textContent.replace(' Lots', '');
                    const riskInput = document.getElementById('tradeRiskPercent');
                    const riskType = this.elements.calcRiskType.value;
                    const riskValue = this.elements.calcRiskValue.value;
                    if (riskInput) riskInput.value = riskType === 'percent' ? riskValue : '';
                    const dirModal = document.getElementById('tradeDirectionModal');
                    const dir = this.elements.calcDirection.value;
                    if (dirModal) dirModal.value = dir;
                    // Trigger direction button
                    const btnBuy = document.getElementById('modalBtnBuy');
                    const btnSell = document.getElementById('modalBtnSell');
                    if (dir === 'BUY') {
                        if (btnBuy) btnBuy.classList.add('active');
                        if (btnSell) btnSell.classList.remove('active');
                    } else {
                        if (btnSell) btnSell.classList.add('active');
                        if (btnBuy) btnBuy.classList.remove('active');
                    }
                }, 200);
            }
        }, 300);
        UI.showToast('Calculator values sent to Journal.');
    },

    copyResults() {
        const lotSize = this.elements.calcLotSize.textContent;
        if (lotSize === '--') {
            UI.showToast('No results to copy.');
            return;
        }

        const asset = this.elements.calcAsset.value;
        const direction = this.elements.calcDirection.value;
        const text = [
            `Trade: ${direction} ${asset}`,
            `Lot Size: ${lotSize} Lots`,
            `Entry: ${this.elements.calcEntry.value}`,
            `SL: ${this.elements.calcSL.value}`,
            this.elements.calcTP.value ? `TP: ${this.elements.calcTP.value}` : '',
            `Risk: ${this.elements.calcDollarRisk.textContent}`,
            `RR: ${this.elements.calcRR.textContent}`,
            `Margin: ${this.elements.calcMargin.textContent}`
        ].filter(Boolean).join('\n');

        navigator.clipboard.writeText(text).then(() => {
            UI.showToast('Results copied!');
        }).catch(() => {
            UI.showToast('Copy failed.');
        });
    }
};

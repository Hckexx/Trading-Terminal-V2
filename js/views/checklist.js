/* ==========================================================================
   TRADETERMINAL V2 — XAUUSD Session Plan Checklist
   ========================================================================== */

const ChecklistView = {
    elements: {},
    score: 0,

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.loadState();
        this.updateDisplay();
    },

    cacheDOM() {
        this.elements.checkboxes = document.querySelectorAll('.checklist-checkbox');
        this.elements.scoreNumber = document.getElementById('checklistScoreNumber');
        this.elements.scoreCard = document.getElementById('checklistScoreCard');
        this.elements.gradeBadge = document.getElementById('checklistGradeBadge');
        this.elements.gradeText = document.getElementById('checklistGradeText');
        this.elements.checkedCount = document.getElementById('checklistCheckedCount');
        this.elements.miniScore = document.getElementById('checklistMiniScore');
        this.elements.btnReset = document.getElementById('btnChecklistReset');
        this.elements.btnSave = document.getElementById('btnChecklistSave');
    },

    bindEvents() {
        this.elements.checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                this.calculateScore();
                this.updateDisplay();
                this.saveState();
            });
        });

        if (this.elements.btnReset) {
            this.elements.btnReset.addEventListener('click', () => {
                this.elements.checkboxes.forEach(cb => cb.checked = false);
                this.calculateScore();
                this.updateDisplay();
                this.saveState();
            });
        }

        if (this.elements.btnSave) {
            this.elements.btnSave.addEventListener('click', () => this.saveToJournal());
        }
    },

    calculateScore() {
        let checked = 0;
        this.elements.checkboxes.forEach(cb => { if (cb.checked) checked++; });
        this.score = checked;
    },

    getGrade(checked) {
        const total = this.elements.checkboxes.length;
        if (checked === total) return { grade: 'READY', class: 'grade-complete', text: 'Session plan complete. Execute with confidence.' };
        if (checked >= 7) return { grade: 'ALMOST', class: 'grade-partial', text: 'Nearly ready. Complete remaining steps.' };
        if (checked >= 4) return { grade: 'PREPPING', class: 'grade-partial', text: 'Keep preparing. Don\'t trade yet.' };
        return { grade: 'NOT READY', class: 'grade-incomplete', text: 'Do not trade. Complete your pre-market first.' };
    },

    updateDisplay() {
        const total = this.elements.checkboxes.length;
        const checked = Array.from(this.elements.checkboxes).filter(cb => cb.checked).length;
        const { grade, class: gradeClass, text } = this.getGrade(checked);

        if (this.elements.scoreNumber) this.elements.scoreNumber.textContent = checked;
        if (this.elements.checkedCount) this.elements.checkedCount.textContent = `${checked}/${total}`;
        if (this.elements.miniScore) this.elements.miniScore.textContent = `${Math.round((checked/total)*100)}%`;
        if (this.elements.gradeBadge) this.elements.gradeBadge.textContent = grade;
        if (this.elements.gradeText) this.elements.gradeText.textContent = text;

        if (this.elements.scoreCard) {
            this.elements.scoreCard.className = 'checklist-score-card ' + gradeClass;
        }

        if (this.elements.btnSave) {
            this.elements.btnSave.disabled = (checked < 7);
            this.elements.btnSave.textContent = checked >= 7 ? 'Save & Go to Journal' : `${7 - checked} more steps needed`;
        }
    },

    saveToJournal() {
        const checked = Array.from(this.elements.checkboxes).filter(cb => cb.checked).length;
        if (checked < 7) { UI.showToast('Complete at least 7 steps before trading.'); return; }

        Router.navigateTo('journal');
        setTimeout(() => {
            if (typeof JournalView !== 'undefined' && JournalView.openNewTradeModal) {
                if (!Store.accounts || Store.accounts.length === 0) {
                    UI.showToast('Add an account in Settings first.');
                    return;
                }
                JournalView.openNewTradeModal();
                setTimeout(() => {
                    const scoreInput = document.getElementById('tradeChecklistScore');
                    if (scoreInput) scoreInput.value = Math.round((checked / this.elements.checkboxes.length) * 100);
                    const pairInput = document.getElementById('tradePair');
                    if (pairInput) pairInput.value = 'XAUUSD';
                }, 100);
            }
        }, 200);
        UI.showToast(`Session readiness: ${Math.round((checked/this.elements.checkboxes.length)*100)}%. Log your trade.`);
    },

    saveState() {
        const state = {};
        this.elements.checkboxes.forEach(cb => { state[cb.dataset.id] = cb.checked; });
        Storage.save('tt_checklist', state);
    },

    loadState() {
        const state = Storage.load('tt_checklist', {});
        this.elements.checkboxes.forEach(cb => {
            if (state[cb.dataset.id] !== undefined) cb.checked = state[cb.dataset.id];
        });
        this.calculateScore();
    }
};

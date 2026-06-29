/* ==========================================================================
   TRADETERMINAL V2 — Configuration & Constants
   ========================================================================== */

const CONFIG = {
    APP_NAME: 'TradeTerminal',
    VERSION: '2.0.0',
    STORAGE_KEYS: {
        ACCOUNTS: 'tt_accounts',
        ACTIVE_ACCOUNT: 'tt_active_account',
        TRADER_NAME: 'tt_trader_name',
        JOURNAL: 'tt_journal',
        SETTINGS: 'tt_settings'
    },
    DEFAULT_ACCOUNT: {
        id: '',
        name: '',
        type: 'Demo',
        balance: 0,
        leverage: 100,
        dailyDDPercent: 5,
        overallDDPercent: 10,
        profitTargetPercent: 10,
        minTradingDays: 0,
        isActive: false
    }
};

const FORMATTERS = {
    currency: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }),
    compact: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }),
    percent: new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }),
    decimal: new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }),
    date: new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric'
    }),
    fullDate: new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
};

const GRADE_THRESHOLDS = {
    'A+': { min: 85, color: 'grade-a' },
    'A': { min: 70, color: 'grade-a' },
    'B': { min: 55, color: 'grade-b' },
    'C': { min: 40, color: 'grade-c' },
    'D': { min: 0, color: 'grade-d' }
};

function getGrade(score) {
    if (score === null || score === undefined || isNaN(score)) return null;
    if (score >= 85) return 'A+';
    if (score >= 70) return 'A';
    if (score >= 55) return 'B';
    if (score >= 40) return 'C';
    return 'D';
}

function getGradeColor(grade) {
    if (!grade) return '';
    const entry = GRADE_THRESHOLDS[grade];
    return entry ? entry.color : '';
}

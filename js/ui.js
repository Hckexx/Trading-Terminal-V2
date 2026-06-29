/* ==========================================================================
   TRADETERMINAL V2 — Shared UI Utilities
   ========================================================================== */

const UI = {
    elements: {},

    init() {
        this.cacheDOM();
    },

    cacheDOM() {
        this.elements.toast = document.getElementById('toast');
    },

    showToast(message, duration = 2500) {
        const toast = this.elements.toast;
        if (!toast) return;
        toast.textContent = message;
        toast.classList.remove('hidden');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            toast.classList.add('hidden');
        }, duration);
    },

    generateId() {
        return `tt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    getTodayDate() {
        return new Date().toISOString().split('T')[0];
    },

    getCurrentTime() {
        return new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    },

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};

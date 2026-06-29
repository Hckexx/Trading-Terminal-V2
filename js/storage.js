/* ==========================================================================
   TRADETERMINAL V2 — Storage Manager
   ========================================================================== */

const Storage = {
    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.warn('Storage save failed:', e);
            return false;
        }
    },

    load(key, fallback = null) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            console.warn('Storage load failed:', e);
            return fallback;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('Storage remove failed:', e);
        }
    },

    clearAll() {
        Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
            this.remove(key);
        });
    },

    exportAll() {
        const data = {};
        Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
            data[key] = this.load(key);
        });
        return data;
    },

    importAll(data) {
        Object.entries(data).forEach(([key, value]) => {
            this.save(key, value);
        });
    }
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
export const Utils = {
    delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    randomId: () => Math.random().toString(36).substring(2, 10),

    formatNumber: (num) => {
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toString();
    },

    truncateAddress: (addr, start = 4, end = 4) => {
        if (!addr || addr.length < start + end) return addr;
        return `${addr.slice(0, start)}...${addr.slice(-end)}`;
    },

    isValidSolanaAddress: (addr) => {
        return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
    },

    sleep: (ms) => new Promise(r => setTimeout(r, ms)),

    clamp: (value, min, max) => Math.min(Math.max(value, min), max),

    randomBetween: (min, max) => Math.random() * (max - min) + min,

    debounce: (fn, delay) => {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    },
};

// ============================================================
// TOAST MANAGER
// ============================================================
export const ToastManager = {
    container: null,

    init() {
        if (!this.container) {
            this.container = document.getElementById('toastContainer');
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.className = 'toast-container';
                this.container.id = 'toastContainer';
                document.body.appendChild(this.container);
            }
        }
        return this.container;
    },

    show(message, type = 'info', duration = 4000) {
        const container = this.init();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-closing');
            setTimeout(() => toast.remove(), 400);
        }, duration);
    },

    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error'); },
    info(msg) { this.show(msg, 'info'); },
    warning(msg) { this.show(msg, 'warning'); },
};

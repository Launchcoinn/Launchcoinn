// ============================================================
// WALLET MANAGER
// ============================================================
export class WalletManager {
    constructor() {
        this.provider = null;
        this.publicKey = null;
        this.isConnected = false;
        this.listeners = {
            connect: [],
            disconnect: [],
            error: []
        };
    }

    getPhantomProvider() {
        if ('solana' in window && window.solana.isPhantom) {
            return window.solana;
        }
        return null;
    }

    async connect() {
        try {
            const provider = this.getPhantomProvider();
            if (!provider) {
                throw new Error('Phantom wallet not found. Please install Phantom extension.');
            }

            this.provider = provider;
            const resp = await provider.connect();
            this.publicKey = resp.publicKey.toString();
            this.isConnected = true;

            // Setup disconnection listener
            provider.on('disconnect', () => {
                this.isConnected = false;
                this.publicKey = null;
                this.emit('disconnect');
            });

            this.emit('connect');
            return this.publicKey;

        } catch (err) {
            this.emit('error', err);
            throw err;
        }
    }

    async disconnect() {
        try {
            if (this.provider) {
                await this.provider.disconnect();
            }
        } catch (e) {
            // Ignore disconnect errors
        }
        this.isConnected = false;
        this.publicKey = null;
        this.provider = null;
        this.emit('disconnect');
    }

    async autoConnect() {
        try {
            const provider = this.getPhantomProvider();
            if (!provider) return false;

            const resp = await provider.connect({ onlyIfTrusted: true });
            this.provider = provider;
            this.publicKey = resp.publicKey.toString();
            this.isConnected = true;

            provider.on('disconnect', () => {
                this.isConnected = false;
                this.publicKey = null;
                this.emit('disconnect');
            });

            this.emit('connect');
            return true;

        } catch (e) {
            return false;
        }
    }

    // ============================================================
    // EVENT SYSTEM
    // ============================================================
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
        return this;
    }

    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
        return this;
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => {
                try { cb(data); } catch (e) { console.error(e); }
            });
        }
    }

    // ============================================================
    // UTILITY
    // ============================================================
    get shortAddress() {
        if (!this.publicKey) return '';
        return `${this.publicKey.slice(0, 4)}...${this.publicKey.slice(-4)}`;
    }

    isPhantomInstalled() {
        return !!this.getPhantomProvider();
    }
}

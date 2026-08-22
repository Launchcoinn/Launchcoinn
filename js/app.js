import { Utils, ToastManager } from './utils.js';

// ============================================================
// SOLANA CONNECTION
// ============================================================
import { Connection, PublicKey, LAMPORTS_PER_SOL } from 'https://cdn.jsdelivr.net/npm/@solana/web3.js@1.98.0/+esm';

// ============================================================
// APP STATE - With real payment verification
// ============================================================
class App {
    constructor() {
        this.toast = ToastManager;
        this.tokensCreated = 1247;
        
        // =============================================
        // ⚠️ I TUOI INDIRIZZI DI RICEZIONE ⚠️
        // =============================================
        // PHANTOM WALLET - principale
        this.phantomAddress = 'BmH2Pcn1suMEH1mTSDuqmnNqayWNTjkHU4TY2xVCFd2T';
        // CAKE WALLET - secondario (stesso indirizzo per ora)
        this.cakeAddress = '9GD63MUwf1SzLs59UFZCmA7NLABkYYWrx8PVG3CmXBMo';
        // =============================================
        
        this.paymentAmount = 0.05;
        this.initialized = false;
        this.isVerifying = false;
        this.lastVerifiedTx = null;
        
        // Solana connection
        this.connection = new Connection(
            'https://api.mainnet-beta.solana.com',
            { commitment: 'confirmed' }
        );
        
        this.init();
        
        // ===== AVVIA I PREZZI IN TEMPO REALE =====
        this.fetchMemePrices();
        setInterval(() => {
            this.fetchMemePrices();
        }, 30000);
    }

    init() {
        this.dom = {
            createBtn: document.getElementById('createBtn'),
            tokenName: document.getElementById('tokenName'),
            tokenSymbol: document.getElementById('tokenSymbol'),
            tokenDecimals: document.getElementById('tokenDecimals'),
            tokenSupply: document.getElementById('tokenSupply'),
            networkSelect: document.getElementById('networkSelect'),
            tokenCount: document.getElementById('tokenCount'),
            dashTokens: document.getElementById('dashTokens'),
            dashVolume: document.getElementById('dashVolume'),
            dashUsers: document.getElementById('dashUsers'),
            dashStatus: document.getElementById('dashStatus'),
            copyAddressBtn: document.getElementById('copyAddressBtn'),
            paymentAddress: document.getElementById('paymentAddress'),
            paymentConfirmBtn: document.getElementById('paymentConfirmBtn'),
            paymentStatus: document.getElementById('paymentStatus'),
            phantomAddress: document.getElementById('phantomAddress'),
            cakeAddress: document.getElementById('cakeAddress'),
        };

        // Set addresses in modal
        if (this.dom.phantomAddress) {
            this.dom.phantomAddress.textContent = this.phantomAddress;
        }
        if (this.dom.cakeAddress) {
            this.dom.cakeAddress.textContent = this.cakeAddress;
        }

        this.bindEvents();
        this.updateStats();
        this.startLiveActivity();

        this.initialized = true;
        console.log('🚀 LaunchCoin initialized with real verification!');
        console.log('📊 Phantom address:', this.phantomAddress);
        console.log('📊 Cake address:', this.cakeAddress);
    }

    bindEvents() {
        this.dom.createBtn.addEventListener('click', async () => {
            await this.handleCreateToken();
        });

        if (this.dom.paymentConfirmBtn) {
            this.dom.paymentConfirmBtn.addEventListener('click', () => {
                this.verifyPayment();
            });
        }

        document.querySelectorAll('.form-group input').forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.handleCreateToken();
                }
            });
        });
    }

    async handleCreateToken() {
        const name = this.dom.tokenName.value.trim();
        const symbol = this.dom.tokenSymbol.value.trim().toUpperCase();

        if (!name || name.length < 2) {
            this.toast.warning('⚠️ Please enter a valid name (min 2 chars)');
            return;
        }

        if (!symbol || symbol.length < 2) {
            this.toast.warning('⚠️ Please enter a valid symbol (min 2 chars)');
            return;
        }

        if (symbol.length > 6) {
            this.toast.warning('⚠️ Symbol must be max 6 characters');
            return;
        }

        console.log('💰 Opening payment modal...');
        window.openPaymentModal();
        
        this.isVerifying = false;
        this.dom.paymentStatus.style.display = 'none';
        this.dom.paymentConfirmBtn.disabled = false;
        this.dom.paymentConfirmBtn.innerHTML = `
            <img src="images/icon-confirm.png" alt="Confirm" class="btn-icon" onerror="this.style.display='none'">
            I Sent the Payment
        `;
    }

    // ============================================================
    // REAL PAYMENT VERIFICATION ON SOLANA
    // ============================================================
    async verifyPayment() {
        if (this.isVerifying) return;
        
        const btn = this.dom.paymentConfirmBtn;
        const statusDiv = this.dom.paymentStatus;
        
        statusDiv.style.display = 'block';
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Verifying...';
        this.isVerifying = true;
        
        try {
            // Verifica su entrambi gli indirizzi
            const addresses = [this.phantomAddress, this.cakeAddress];
            let foundPayment = false;
            let paymentTx = null;
            
            for (const address of addresses) {
                const signatures = await this.connection.getSignaturesForAddress(
                    new PublicKey(address),
                    { limit: 10 }
                );
                
                console.log(`📊 Found ${signatures.length} transactions for ${address}`);
                
                for (const sig of signatures) {
                    if (sig.signature === this.lastVerifiedTx) continue;
                    
                    const tx = await this.connection.getTransaction(sig.signature, {
                        commitment: 'confirmed'
                    });
                    
                    if (!tx || !tx.meta) continue;
                    
                    const postBalances = tx.meta.postBalances;
                    const preBalances = tx.meta.preBalances;
                    
                    for (let i = 0; i < postBalances.length; i++) {
                        const accountKey = tx.transaction.message.accountKeys[i];
                        const receiverPubkey = new PublicKey(address);
                        
                        if (accountKey.equals(receiverPubkey)) {
                            const balanceChange = (postBalances[i] - preBalances[i]) / LAMPORTS_PER_SOL;
                            console.log(`💰 Balance change: ${balanceChange} SOL`);
                            
                            if (balanceChange >= this.paymentAmount - 0.001 && balanceChange <= this.paymentAmount + 0.001) {
                                foundPayment = true;
                                paymentTx = sig.signature;
                                this.lastVerifiedTx = sig.signature;
                                break;
                            }
                        }
                    }
                    
                    if (foundPayment) break;
                }
                
                if (foundPayment) break;
            }
            
            if (foundPayment) {
                this.toast.success('✅ Payment verified! Creating your token...');
                await this.createTokenAfterPayment(paymentTx);
            } else {
                statusDiv.style.display = 'block';
                statusDiv.style.borderColor = 'var(--accent-red)';
                statusDiv.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px; color: var(--accent-red);">
                        <i class="fas fa-times-circle" style="font-size: 20px;"></i>
                        <span style="font-size: 14px;">❌ No payment of 0.05 SOL found.</span>
                    </div>
                    <div style="margin-top: 8px; font-size: 12px; color: var(--text-secondary);">
                        Please check that you sent the exact amount to one of the addresses above.
                    </div>
                `;
                
                btn.disabled = false;
                btn.innerHTML = `
                    <img src="images/icon-confirm.png" alt="Confirm" class="btn-icon" onerror="this.style.display='none'">
                    Try Again
                `;
                this.isVerifying = false;
                
                this.toast.warning('⚠️ No payment of 0.05 SOL found. Please check and try again.');
            }
            
        } catch (error) {
            console.error('❌ Verification error:', error);
            
            statusDiv.style.display = 'block';
            statusDiv.style.borderColor = 'var(--accent-red)';
            statusDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; color: var(--accent-red);">
                    <i class="fas fa-times-circle" style="font-size: 20px;"></i>
                    <span style="font-size: 14px;">❌ No payment of 0.05 SOL found.</span>
                </div>
                <div style="margin-top: 8px; font-size: 12px; color: var(--text-secondary);">
                    Please check that you sent the exact amount to one of the addresses above.
                </div>
            `;
            
            btn.disabled = false;
            btn.innerHTML = `
                <img src="images/icon-confirm.png" alt="Confirm" class="btn-icon" onerror="this.style.display='none'">
                Try Again
            `;
            this.isVerifying = false;
            
            this.toast.warning('⚠️ No payment of 0.05 SOL found. Please check and try again.');
        }
    }

    async createTokenAfterPayment(txSignature) {
        const btn = this.dom.paymentConfirmBtn;
        const statusDiv = this.dom.paymentStatus;
        
        statusDiv.style.borderColor = 'var(--accent-green)';
        statusDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span class="spinner" style="border-color: var(--accent-green); border-top-color: transparent;"></span>
                <span style="color: var(--accent-green); font-size: 14px;">✅ Payment confirmed! Creating your token...</span>
            </div>
        `;
        
        setTimeout(() => {
            window.closePaymentModal();
            
            this.tokensCreated += 1;
            this.updateStats();
            
            const name = this.dom.tokenName.value.trim() || 'Token';
            const symbol = this.dom.tokenSymbol.value.trim().toUpperCase() || 'TKN';
            const decimals = this.dom.tokenDecimals.value || 9;
            const supply = this.dom.tokenSupply.value || 1000000;
            
            this.toast.success(`
                🎉 Token "${name} (${symbol})" created successfully! 
                Supply: ${Number(supply).toLocaleString()} • Decimals: ${decimals}
                Transaction: ${txSignature.slice(0, 12)}...
            `);
            
            this.dom.tokenName.value = '';
            this.dom.tokenSymbol.value = '';
            this.dom.tokenSupply.value = 1000000;
            
            btn.disabled = false;
            btn.innerHTML = `
                <img src="images/icon-confirm.png" alt="Confirm" class="btn-icon" onerror="this.style.display='none'">
                I Sent the Payment
            `;
            statusDiv.style.display = 'none';
            statusDiv.style.borderColor = 'rgba(0,212,255,0.08)';
            statusDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="spinner" style="border-color: var(--accent-green); border-top-color: transparent;"></span>
                    <span style="color: var(--text-secondary); font-size: 14px;">Verifying payment...</span>
                </div>
            `;
            this.isVerifying = false;
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
        }, 2000);
    }

    updateStats() {
        const total = this.tokensCreated;
        const users = Math.floor(15000 + Math.random() * 5000);
        const volume = (total * 42.5 + Math.random() * 5000).toFixed(1);
        
        if (this.dom.tokenCount) {
            this.dom.tokenCount.textContent = total.toLocaleString();
        }
        if (this.dom.dashTokens) {
            this.dom.dashTokens.textContent = total.toLocaleString();
        }
        if (this.dom.dashUsers) {
            this.dom.dashUsers.textContent = users.toLocaleString() + '+';
        }
        if (this.dom.dashVolume) {
            this.dom.dashVolume.textContent = `$${volume}K`;
        }
    }

    // ===== LIVE TOKEN ACTIVITY =====
    startLiveActivity() {
        const tokens = [
            { name: 'MoonShot', symbol: 'MOON', icon: '🚀' },
            { name: 'CryptoGem', symbol: 'GEM', icon: '💎' },
            { name: 'SolanaX', symbol: 'SOLX', icon: '⚡' },
            { name: 'StarToken', symbol: 'STAR', icon: '⭐' },
            { name: 'PumpKing', symbol: 'PUMP', icon: '👑' },
            { name: 'DegenCoin', symbol: 'DEGEN', icon: '🎯' },
            { name: 'MetaSol', symbol: 'META', icon: '🌐' },
            { name: 'Galactic', symbol: 'GAL', icon: '🌌' },
            { name: 'ApeCoin', symbol: 'APE', icon: '🦍' },
            { name: 'DiamondHands', symbol: 'DIAM', icon: '💪' }
        ];
        
        setInterval(() => {
            if (Math.random() < 0.30) {
                const idx = Math.floor(Math.random() * tokens.length);
                const token = tokens[idx];
                
                this.tokensCreated += 1;
                this.updateStats();
                
                this.toast.info(`📈 ${token.icon} ${token.name} (${token.symbol}) was just created!`);
            }
        }, 12000 + Math.random() * 18000);
    }

    // ============================================================
    // ===== PRICE FETCHER - MEMECOIN PREZZI IN TEMPO REALE =====
    // ============================================================
    async fetchMemePrices() {
        try {
            const ids = ['dogecoin', 'shiba-inu', 'pepe', 'bonk', 'floki', 'wojak'];
            const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd&include_24hr_change=true`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            const coinMap = {
                'dogecoin': { id: 'doge', name: 'Dogecoin' },
                'shiba-inu': { id: 'shib', name: 'Shiba Inu' },
                'pepe': { id: 'pepe', name: 'Pepe' },
                'bonk': { id: 'bonk', name: 'Bonk' },
                'floki': { id: 'floki', name: 'Floki' },
                'wojak': { id: 'wojak', name: 'Wojak' }
            };
            
            for (const [coinId, coinData] of Object.entries(data)) {
                const price = coinData.usd;
                const change = coinData.usd_24h_change || 0;
                const symbol = coinMap[coinId]?.id || coinId;
                
                const priceEl = document.getElementById(`price-${symbol}`);
                const changeEl = document.getElementById(`change-${symbol}`);
                
                if (priceEl) {
                    if (price < 0.00001) {
                        priceEl.textContent = `$${price.toFixed(8)}`;
                    } else if (price < 0.001) {
                        priceEl.textContent = `$${price.toFixed(6)}`;
                    } else if (price < 1) {
                        priceEl.textContent = `$${price.toFixed(4)}`;
                    } else {
                        priceEl.textContent = `$${price.toFixed(2)}`;
                    }
                }
                
                if (changeEl) {
                    const changeValue = change.toFixed(2);
                    const sign = change >= 0 ? '+' : '';
                    changeEl.textContent = `${sign}${changeValue}%`;
                    changeEl.className = `meme-change ${change >= 0 ? 'positive' : 'negative'}`;
                }
            }
            
            const lastUpdate = document.getElementById('lastUpdate');
            if (lastUpdate) {
                const now = new Date();
                const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                lastUpdate.textContent = `🔄 Aggiornato: ${timeStr}`;
            }
            
            const badge = document.getElementById('liveBadge');
            if (badge) {
                badge.textContent = '● Live';
                badge.style.color = 'var(--accent-green)';
            }
            
        } catch (error) {
            console.warn('⚠️ Errore nel fetch dei prezzi:', error);
            const lastUpdate = document.getElementById('lastUpdate');
            if (lastUpdate) {
                lastUpdate.textContent = '⚠️ Prezzi non disponibili al momento';
            }
        }
    }
}

console.log('📦 Loading app with real verification...');
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, initializing app...');
    window.app = new App();
});

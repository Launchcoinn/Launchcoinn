// ============================================================
// LAUNCHCOIN - SERVER PER RENDER (CON npm start)
// ============================================================

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

console.log('🚀 Avvio LaunchCoin Server...');
console.log(`📁 Directory: ${__dirname}`);

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(express.json({ limit: '50mb' }));

// Log delle richieste
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
    next();
});

// ============================================================
// SERVI FILE STATICI - CRITICAL FIX!
// ============================================================

// 1. Serve la directory corrente
app.use(express.static(__dirname));

// 2. Serve esplicitamente la cartella images
const imagesPath = path.join(__dirname, 'images');
if (fs.existsSync(imagesPath)) {
    app.use('/images', express.static(imagesPath));
    console.log('✅ Cartella images trovata e servita');
} else {
    console.log('❌ Cartella images NON trovata');
    // Prova percorso alternativo
    const altPath = path.join(__dirname, '..', 'images');
    if (fs.existsSync(altPath)) {
        app.use('/images', express.static(altPath));
        console.log('✅ Images trovata in percorso alternativo');
    }
}

// 3. Serve esplicitamente la cartella styles
const stylesPath = path.join(__dirname, 'styles');
if (fs.existsSync(stylesPath)) {
    app.use('/styles', express.static(stylesPath));
    console.log('✅ Cartella styles trovata e servita');
} else {
    console.log('❌ Cartella styles NON trovata');
}

// 4. Serve esplicitamente la cartella js
const jsPath = path.join(__dirname, 'js');
if (fs.existsSync(jsPath)) {
    app.use('/js', express.static(jsPath));
    console.log('✅ Cartella js trovata e servita');
} else {
    console.log('❌ Cartella js NON trovata');
}

// ============================================================
// DEBUG ENDPOINT - Controlla quali file esistono
// ============================================================
app.get('/debug', (req, res) => {
    try {
        const rootFiles = fs.existsSync(__dirname) ? fs.readdirSync(__dirname) : [];
        const imagesFiles = fs.existsSync(path.join(__dirname, 'images')) ? fs.readdirSync(path.join(__dirname, 'images')) : [];
        const stylesFiles = fs.existsSync(path.join(__dirname, 'styles')) ? fs.readdirSync(path.join(__dirname, 'styles')) : [];
        const jsFiles = fs.existsSync(path.join(__dirname, 'js')) ? fs.readdirSync(path.join(__dirname, 'js')) : [];
        
        res.json({
            status: 'ok',
            directory: __dirname,
            rootFiles: rootFiles.slice(0, 30),
            images: imagesFiles.slice(0, 20),
            styles: stylesFiles,
            js: jsFiles,
            imagesExist: fs.existsSync(path.join(__dirname, 'images'))
        });
    } catch(e) {
        res.json({
            status: 'error',
            message: e.message
        });
    }
});

// ============================================================
// ROTTA PRINCIPALE
// ============================================================
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
        console.log('✅ Servendo index.html');
        res.sendFile(indexPath);
    } else {
        console.log('❌ index.html non trovato');
        res.send(`
            <!DOCTYPE html>
            <html>
            <head><title>LaunchCoin</title></head>
            <body style="background:#0a0a1a;color:#fff;font-family:sans-serif;text-align:center;padding:50px;">
                <h1 style="color:#00ffa3;">🚀 LaunchCoin</h1>
                <p>Server attivo su Render!</p>
                <p>📁 <a href="/debug" style="color:#00d4ff;">Debug</a></p>
                <p style="color:#666;margin-top:30px;">Directory: ${__dirname}</p>
            </body>
            </html>
        `);
    }
});

// ============================================================
// ROTTE PER LE PAGINE HTML
// ============================================================
app.get('/:page.html', (req, res) => {
    const page = req.params.page;
    const filePath = path.join(__dirname, `${page}.html`);
    if (fs.existsSync(filePath)) {
        console.log(`✅ Servendo ${page}.html`);
        res.sendFile(filePath);
    } else {
        console.log(`❌ ${page}.html non trovato`);
        res.status(404).send(`<h1>404</h1><p>${page}.html non trovato</p>`);
    }
});

// ============================================================
// FALLBACK - Serve index.html per qualsiasi rotta sconosciuta
// ============================================================
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('<h1>404 - Pagina non trovata</h1>');
    }
});

// ============================================================
// AVVIA SERVER
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('🚀 LAUNCHCOIN SERVER');
    console.log(`📡 Porta: ${PORT}`);
    console.log(`📁 Directory: ${__dirname}`);
    console.log('='.repeat(60));
    
    // Mostra i file disponibili
    try {
        const files = fs.readdirSync(__dirname);
        console.log('📁 File nella root:');
        files.forEach(f => console.log(`   - ${f}`));
        
        // Controlla le immagini
        const imgPath = path.join(__dirname, 'images');
        if (fs.existsSync(imgPath)) {
            const imgs = fs.readdirSync(imgPath);
            console.log(`📷 Immagini trovate: ${imgs.length}`);
            imgs.slice(0, 10).forEach(img => console.log(`   - ${img}`));
        } else {
            console.log('❌ Nessuna cartella images trovata!');
        }
    } catch(e) {
        console.log('⚠️ Errore nella lettura directory:', e.message);
    }
    
    console.log('='.repeat(60));
    console.log('✅ Server pronto!');
});

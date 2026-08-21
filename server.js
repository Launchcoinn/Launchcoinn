// ============================================================
// LAUNCHCOIN - SERVER PER RENDER (CON SUPPORTO SLASH)
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

// ============================================================
// SERVI FILE STATICI - PERCORSI ASSOLUTI
// ============================================================

// 1. Servi la directory corrente
app.use(express.static(__dirname));

// 2. Servi le cartelle con percorsi assoluti
const folders = ['images', 'styles', 'js'];
folders.forEach(folder => {
    const folderPath = path.join(__dirname, folder);
    if (fs.existsSync(folderPath)) {
        app.use(`/${folder}`, express.static(folderPath));
        console.log(`✅ Cartella /${folder} servita`);
    } else {
        console.log(`❌ Cartella ${folder} NON trovata`);
    }
});

// 3. ROTTA PER LE IMMAGINI CON FALLBACK
app.get('/images/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'images', filename);
    
    console.log(`🔍 Richiesta immagine: ${filename}`);
    console.log(`   Percorso: ${filePath}`);
    console.log(`   Esiste: ${fs.existsSync(filePath) ? '✅ SI' : '❌ NO'}`);
    
    if (fs.existsSync(filePath)) {
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml'
        };
        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        return res.sendFile(filePath);
    }
    
    res.status(404).send(`Image not found: ${filename}`);
});

// 4. ROTTA PER IL CSS
app.get('/styles/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'styles', filename);
    if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'text/css');
        res.sendFile(filePath);
    } else {
        res.status(404).send('CSS not found');
    }
});

// 5. DEBUG ENDPOINT
app.get('/debug', (req, res) => {
    try {
        const imagesPath = path.join(__dirname, 'images');
        const imagesExist = fs.existsSync(imagesPath);
        const imagesFiles = imagesExist ? fs.readdirSync(imagesPath) : [];
        
        res.json({
            status: 'ok',
            directory: __dirname,
            imagesExist: imagesExist,
            imagesCount: imagesFiles.length,
            imagesFiles: imagesFiles.slice(0, 50),
            backgroundExists: imagesFiles.includes('background.jpg'),
            importantImages: {
                'background.jpg': imagesFiles.includes('background.jpg'),
                'logo-large.png': imagesFiles.includes('logo-large.png'),
                'logo-nav-full.png': imagesFiles.includes('logo-nav-full.png')
            }
        });
    } catch(e) {
        res.json({ status: 'error', message: e.message });
    }
});

// ============================================================
// ROTTA PRINCIPALE
// ============================================================
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head><title>LaunchCoin</title></head>
            <body style="background:#0a0a1a;color:#fff;font-family:sans-serif;text-align:center;padding:50px;">
                <h1 style="color:#00ffa3;">🚀 LaunchCoin</h1>
                <p>Server attivo su Render!</p>
                <p>📁 <a href="/debug" style="color:#00d4ff;">Debug</a></p>
            </body>
            </html>
        `);
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
    
    // Verifica le immagini
    const imagesPath = path.join(__dirname, 'images');
    if (fs.existsSync(imagesPath)) {
        const files = fs.readdirSync(imagesPath);
        console.log(`📷 Immagini (${files.length}):`);
        files.forEach(f => console.log(`   - ${f}`));
    }
    
    console.log('='.repeat(60));
});

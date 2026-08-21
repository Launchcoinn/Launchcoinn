// ============================================================
// LAUNCHCOIN - SERVER PER RENDER (VERSIONE DEFINITIVA)
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
// SERVI FILE STATICI - PERCORSI ESPLICITI
// ============================================================

// 1. Servi la directory corrente
app.use(express.static(__dirname));

// 2. Servi esplicitamente le cartelle con percorsi assoluti
const folders = ['images', 'styles', 'js'];
folders.forEach(folder => {
    const folderPath = path.join(__dirname, folder);
    if (fs.existsSync(folderPath)) {
        app.use(`/${folder}`, express.static(folderPath));
        console.log(`✅ Cartella ${folder} servita: ${folderPath}`);
        
        // Mostra i primi 10 file
        const files = fs.readdirSync(folderPath);
        console.log(`   📁 ${folder}/ (${files.length} file)`);
        files.slice(0, 10).forEach(f => console.log(`      - ${f}`));
    } else {
        console.log(`❌ Cartella ${folder} NON trovata: ${folderPath}`);
    }
});

// 3. ROTTA ESPLICITA PER background.jpg
app.get('/images/background.jpg', (req, res) => {
    const possiblePaths = [
        path.join(__dirname, 'images', 'background.jpg'),
        path.join(__dirname, 'public', 'images', 'background.jpg'),
        path.join(__dirname, 'dist', 'images', 'background.jpg'),
        path.join(__dirname, '..', 'images', 'background.jpg')
    ];
    
    for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
            console.log(`✅ background.jpg trovato: ${filePath}`);
            res.setHeader('Content-Type', 'image/jpeg');
            return res.sendFile(filePath);
        }
    }
    
    console.log('❌ background.jpg NON trovato');
    res.status(404).send('background.jpg not found');
});

// 4. ROTTA GENERICA PER LE IMMAGINI
app.get('/images/:filename', (req, res) => {
    const filename = req.params.filename;
    const possiblePaths = [
        path.join(__dirname, 'images', filename),
        path.join(__dirname, 'public', 'images', filename),
        path.join(__dirname, 'dist', 'images', filename),
        path.join(__dirname, '..', 'images', filename)
    ];
    
    for (const filePath of possiblePaths) {
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
    }
    
    console.log(`❌ Immagine non trovata: ${filename}`);
    res.status(404).send(`Image not found: ${filename}`);
});

// 5. DEBUG ENDPOINT
app.get('/debug', (req, res) => {
    try {
        const rootFiles = fs.readdirSync(__dirname);
        const imagesPath = path.join(__dirname, 'images');
        const imagesExist = fs.existsSync(imagesPath);
        const imagesFiles = imagesExist ? fs.readdirSync(imagesPath) : [];
        
        // Verifica background.jpg
        const bgPath = path.join(__dirname, 'images', 'background.jpg');
        const bgExists = fs.existsSync(bgPath);
        
        res.json({
            status: 'ok',
            directory: __dirname,
            rootFiles: rootFiles.slice(0, 30),
            imagesExist: imagesExist,
            imagesCount: imagesFiles.length,
            imagesFiles: imagesFiles.slice(0, 30),
            backgroundExists: bgExists,
            backgroundPath: bgPath,
            importantImages: {
                'background.jpg': imagesFiles.includes('background.jpg'),
                'logo-large.png': imagesFiles.includes('logo-large.png'),
                'logo-nav-full.png': imagesFiles.includes('logo-nav-full.png'),
                'features-bg.jpg': imagesFiles.includes('features-bg.jpg'),
                'dashboard-bg.jpg': imagesFiles.includes('dashboard-bg.jpg')
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
    
    // Verifica background.jpg
    const bgPath = path.join(__dirname, 'images', 'background.jpg');
    console.log(`🔍 Verifica background.jpg:`);
    console.log(`   Percorso: ${bgPath}`);
    console.log(`   Esiste: ${fs.existsSync(bgPath) ? '✅ SI' : '❌ NO'}`);
    
    // Mostra i file nella cartella images
    const imagesPath = path.join(__dirname, 'images');
    if (fs.existsSync(imagesPath)) {
        const files = fs.readdirSync(imagesPath);
        console.log(`📷 Immagini (${files.length}):`);
        files.forEach(f => console.log(`   - ${f}`));
    }
    
    console.log('='.repeat(60));
});

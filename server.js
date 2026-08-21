// ============================================================
// LAUNCHCOIN - SERVER PER RENDER (CON FALLBACK)
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
// SERVI FILE STATICI - CON FALLBACK
// ============================================================

// 1. Serve la directory corrente
app.use(express.static(__dirname));

// 2. Funzione per trovare un file in più percorsi
function findFile(filename, folders) {
    for (const folder of folders) {
        const fullPath = path.join(folder, filename);
        if (fs.existsSync(fullPath)) {
            return fullPath;
        }
    }
    return null;
}

// 3. ROTTA PER LE IMMAGINI - CON FALLBACK
app.get('/images/:filename', (req, res) => {
    const filename = req.params.filename;
    
    // Cerca in più cartelle
    const possiblePaths = [
        path.join(__dirname, 'images', filename),
        path.join(__dirname, 'public', 'images', filename),
        path.join(__dirname, 'dist', 'images', filename),
        path.join(__dirname, '..', 'images', filename)
    ];
    
    for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
            console.log(`✅ Immagine trovata: ${filePath}`);
            // Imposta il content type corretto
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
    
    // Se l'immagine non esiste, crea un'immagine di fallback
    console.log(`⚠️ Immagine non trovata: ${filename}`);
    res.status(404).send(`
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" fill="#0a0a1a"/>
            <text x="100" y="100" font-family="Arial" font-size="14" fill="#00ffa3" text-anchor="middle">
                ${filename}
            </text>
            <text x="100" y="120" font-family="Arial" font-size="10" fill="#666" text-anchor="middle">
                Immagine non trovata
            </text>
        </svg>
    `);
});

// 4. ROTTA PER I FILE CSS
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

// 5. ROTTA PER I FILE JS
app.get('/js/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'js', filename);
    
    if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/javascript');
        res.sendFile(filePath);
    } else {
        res.status(404).send('JS not found');
    }
});

// ============================================================
// DEBUG ENDPOINT - Verifica file presenti
// ============================================================
app.get('/debug', (req, res) => {
    try {
        const rootFiles = fs.readdirSync(__dirname);
        const imagesPath = path.join(__dirname, 'images');
        const imagesExist = fs.existsSync(imagesPath);
        const imagesFiles = imagesExist ? fs.readdirSync(imagesPath) : [];
        
        // Cerca specificamente background.jpg
        const bgPath = path.join(__dirname, 'images', 'background.jpg');
        const bgExists = fs.existsSync(bgPath);
        
        res.json({
            status: 'ok',
            directory: __dirname,
            rootFiles: rootFiles.slice(0, 30),
            imagesExist: imagesExist,
            imagesCount: imagesFiles.length,
            imagesFiles: imagesFiles.slice(0, 20),
            backgroundExists: bgExists,
            backgroundPath: bgPath
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
    console.log(`🔍 Controllo background.jpg: ${bgPath}`);
    console.log(`   Esiste: ${fs.existsSync(bgPath) ? '✅ SI' : '❌ NO'}`);
    
    // Mostra i file nella cartella images
    const imagesPath = path.join(__dirname, 'images');
    if (fs.existsSync(imagesPath)) {
        const files = fs.readdirSync(imagesPath);
        console.log(`📷 Immagini (${files.length}):`);
        files.forEach(f => console.log(`   - ${f}`));
    } else {
        console.log('❌ Cartella images NON ESISTE!');
    }
    
    console.log('='.repeat(60));
    console.log('✅ Server pronto!');
});

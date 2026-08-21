// ============================================================
// LAUNCHCOIN - SERVER PER RENDER (VERSIONE LEGGERA)
// ============================================================

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.json({ limit: '50mb' }));

// ============================================================
// SERVI FILE STATICI
// ============================================================

// Servi la cartella corrente
app.use(express.static(__dirname));

// Servi esplicitamente le cartelle
const folders = ['images', 'styles', 'js'];
folders.forEach(folder => {
    const folderPath = path.join(__dirname, folder);
    if (fs.existsSync(folderPath)) {
        app.use(`/${folder}`, express.static(folderPath));
        console.log(`✅ Cartella ${folder} servita`);
    } else {
        console.log(`⚠️ Cartella ${folder} non trovata`);
    }
});

// ============================================================
// ROTTE
// ============================================================

// Home
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.send(`
            <h1>🚀 LaunchCoin</h1>
            <p>Server attivo su Render!</p>
            <p>📁 File disponibili:</p>
            <ul>
                ${fs.readdirSync(__dirname).map(f => `<li>${f}</li>`).join('')}
            </ul>
        `);
    }
});

// Endpoint di test
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        directory: __dirname,
        files: fs.readdirSync(__dirname),
        images: fs.existsSync(path.join(__dirname, 'images')) 
            ? fs.readdirSync(path.join(__dirname, 'images')) 
            : []
    });
});

// Rotte per le pagine HTML
app.get('/:page.html', (req, res) => {
    const page = req.params.page;
    const filePath = path.join(__dirname, `${page}.html`);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send(`<h1>404</h1><p>${page}.html non trovato</p>`);
    }
});

// Fallback
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
        const imagesPath = path.join(__dirname, 'images');
        if (fs.existsSync(imagesPath)) {
            const images = fs.readdirSync(imagesPath);
            console.log(`📷 Immagini trovate: ${images.length}`);
            images.slice(0, 10).forEach(img => console.log(`   - ${img}`));
        }
    } catch(e) {
        console.log('⚠️ Errore nella lettura directory');
    }
});

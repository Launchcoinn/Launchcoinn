// ============================================================
// LAUNCHCOIN - SERVER FOR RENDER (FULLY WORKING)
// ============================================================

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(express.json({ limit: '50mb' }));

// ============================================================
// SERVE STATIC FILES - CRITICAL FIX!
// ============================================================

// 1. Serve the entire directory
app.use(express.static(__dirname));

// 2. Explicitly serve the images folder
const imagesPath = path.join(__dirname, 'images');
if (fs.existsSync(imagesPath)) {
    app.use('/images', express.static(imagesPath));
    console.log('✅ Images folder found and served');
} else {
    console.log('❌ Images folder NOT found');
    // Try alternative path
    const altPath = path.join(__dirname, '..', 'images');
    if (fs.existsSync(altPath)) {
        app.use('/images', express.static(altPath));
        console.log('✅ Images found at alternative path');
    }
}

// 3. Explicitly serve the styles folder
const stylesPath = path.join(__dirname, 'styles');
if (fs.existsSync(stylesPath)) {
    app.use('/styles', express.static(stylesPath));
    console.log('✅ Styles folder found and served');
} else {
    console.log('❌ Styles folder NOT found');
}

// 4. Explicitly serve the js folder
const jsPath = path.join(__dirname, 'js');
if (fs.existsSync(jsPath)) {
    app.use('/js', express.static(jsPath));
    console.log('✅ JS folder found and served');
} else {
    console.log('❌ JS folder NOT found');
}

// ============================================================
// DEBUG ENDPOINT - Check what files exist
// ============================================================
app.get('/debug', (req, res) => {
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
});

// ============================================================
// MAIN ROUTES
// ============================================================

// Home - serve index.html
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.send(`
            <h1>🚀 LaunchCoin</h1>
            <p>Server is running on Render!</p>
            <p>📁 <a href="/debug">Click here to debug</a></p>
        `);
    }
});

// Serve any HTML page
app.get('/:page.html', (req, res) => {
    const page = req.params.page;
    const filePath = path.join(__dirname, `${page}.html`);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send(`<h1>404</h1><p>${page}.html not found</p>`);
    }
});

// ============================================================
// FALLBACK - Serve index.html for any unknown route
// ============================================================
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('<h1>404 - Page not found</h1>');
    }
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('🚀 LAUNCHCOIN SERVER');
    console.log(`📡 Port: ${PORT}`);
    console.log(`📁 Directory: ${__dirname}`);
    console.log('='.repeat(60));
    
    // Show what files exist
    try {
        const files = fs.readdirSync(__dirname);
        console.log('📁 Files in root:');
        files.forEach(f => console.log(`   - ${f}`));
        
        // Check images
        const imgPath = path.join(__dirname, 'images');
        if (fs.existsSync(imgPath)) {
            const imgs = fs.readdirSync(imgPath);
            console.log(`📷 Images found: ${imgs.length}`);
            imgs.slice(0, 10).forEach(img => console.log(`   - ${img}`));
        } else {
            console.log('❌ No images folder found!');
        }
    } catch(e) {
        console.log('⚠️ Error reading directory:', e.message);
    }
});

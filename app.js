// app.js - NigerBac Tools 2026 - VERSION DÉFINITIVE

const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Créer dossiers nécessaires
['public/uploads','public/recus','public/flamme'].forEach(d => {
  const dir = path.join(__dirname, d);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));
app.use('/flamme-media', express.static(path.join(__dirname, 'public/flamme')));
app.use('/recus-media', express.static(path.join(__dirname, 'public/recus')));

// Sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'nigerbac2026-super-secret-definitif',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
  }
}));

// Routes
app.use('/', require('./routes/public'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/flamme', require('./routes/flamme'));
app.use('/admin', require('./routes/admin'));

// 404
app.use((req, res) => {
  res.status(404).send(`<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>404</title>
<style>body{background:#080D1A;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:'Syne',sans-serif;color:white;text-align:center;}
.flag{position:fixed;top:0;left:0;right:0;height:5px;background:linear-gradient(90deg,#FF7518 33.3%,#FFF 33.3%,#FFF 66.6%,#29AB47 66.6%);}</style>
</head><body><div class="flag"></div>
<div><div style="font-size:4rem;margin-bottom:12px;">🇳🇪</div>
<h1 style="font-size:3rem;color:#FF7518;margin-bottom:8px;">404</h1>
<p style="color:rgba(255,255,255,0.5);margin-bottom:20px;">Page introuvable</p>
<a href="/" style="background:linear-gradient(135deg,#FF7518,#FF4500);color:white;padding:12px 28px;border-radius:12px;text-decoration:none;font-weight:700;">← Accueil</a>
</div></body></html>`);
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Erreur serveur. Réessaie dans quelques instants.');
});

app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  🇳🇪 NigerBac Tools 2026 — v3.0      ║');
  console.log('║  VERSION DÉFINITIVE                  ║');
  console.log(`║  🌐 http://localhost:${PORT}            ║`);
  console.log('╚══════════════════════════════════════╝\n');
});

module.exports = app;

// routes/public.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const supabase = require('../db/supabase');
const { CSS, STARS_JS } = require('../utils/styles');

// Config upload reçus
const storageRecu = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/recus');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'recu-' + Date.now() + '-' + Math.random().toString(36).slice(2) + ext);
  }
});
const uploadRecu = multer({
  storage: storageRecu,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg','.jpeg','.png','.gif','.webp','.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Seules les images et PDF sont acceptés'));
  }
});

const WHATSAPP_NUM = '22781538341';
const ADMIN_TEL = '22799193823';
const ADMIN_CODE = 'ADMIN2026';

// Génération codes
function genCodeAnonyme() {
  const mots = ['LION','AIGLE','DUNE','SAHEL','FLEUVE','ORAGE','ETOILE','SOLEIL','LUNE','TIGRE','COBRA','FAUCON','GAZELLE','BERGER','NIGER','SAHARA','OASIS','DESERT','FLECHE','ECUEIL'];
  return mots[Math.floor(Math.random()*mots.length)] + Math.floor(100+Math.random()*900);
}

function genCodeAcces() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 8; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

// ========================= PAGE FESTIVE =========================
router.get('/', async (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  if (req.session.adminAuth) return res.redirect('/admin');

  // Compter les inscrits pour afficher
  let inscritCount = 0;
  try {
    const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
    inscritCount = count || 0;
  } catch(e) {}

  res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<meta name="theme-color" content="#080D1A">
<title>NigerBac Tools 2026 – Réussis ton BAC !</title>
<script src="https://cdn.tailwindcss.com"></script>
${CSS}
<style>
.confetti-piece{position:fixed;width:8px;height:8px;border-radius:2px;pointer-events:none;z-index:1;animation:confettiFall linear forwards;}
.hero-num{font-size:3.5rem;font-weight:800;line-height:1;background:linear-gradient(135deg,#FF7518,#FFD700);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.mission-card{background:linear-gradient(135deg,rgba(41,171,71,0.12),rgba(16,123,50,0.06));border:1px solid rgba(41,171,71,0.25);}
.promo-card{background:linear-gradient(135deg,rgba(255,117,24,0.12),rgba(255,69,0,0.06));border:1px solid rgba(255,117,24,0.3);}
.stat-chip{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);border-radius:14px;padding:14px;text-align:center;}
.cta-primary{background:linear-gradient(135deg,#FF7518,#FF4500);box-shadow:0 4px 20px rgba(255,117,24,0.35);}
</style>
</head>
<body>
<div class="stars-bg" id="stars"></div>
<div id="confettiContainer" style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;overflow:hidden;"></div>
<div class="flag"></div>

<div class="relative z-10" style="max-width:500px;margin:0 auto;padding:20px 18px 40px;">

  <!-- Logo Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;">
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="font-size:2rem;">🇳🇪</span>
      <div>
        <div class="ht" style="font-weight:800;font-size:1.1rem;color:white;line-height:1.1;">NigerBac Tools</div>
        <div class="mono" style="font-size:10px;color:#FF7518;">BAC 2026</div>
      </div>
    </div>
    <a href="/connexion" style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.7);padding:8px 14px;border-radius:10px;font-family:'Syne',sans-serif;font-size:12px;font-weight:700;text-decoration:none;">
      Connexion →
    </a>
  </div>

  <!-- Hero -->
  <div style="text-align:center;margin-bottom:28px;" class="fadeUp">
    <div class="float" style="font-size:4.5rem;margin-bottom:12px;">🎓</div>
    <h1 class="ht" style="font-size:1.9rem;font-weight:800;color:white;line-height:1.2;margin-bottom:10px;">
      Bienvenue dans<br>
      <span style="background:linear-gradient(135deg,#FF7518,#FFB347);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
        NigerBac Tools 2026
      </span>
    </h1>
    <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.7;">
      Le portail qui donne à <strong style="color:white;">chaque élève nigérien</strong><br>
      les mêmes armes pour réussir le BAC 🏆
    </p>
  </div>

  <!-- Stats -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;" class="fadeUp" style="animation-delay:0.1s;">
    <div class="stat-chip">
      <div class="hero-num" style="font-size:1.8rem;">26</div>
      <div style="color:rgba(255,255,255,0.5);font-size:10px;margin-top:2px;">Outils BAC</div>
    </div>
    <div class="stat-chip">
      <div class="hero-num" style="font-size:1.8rem;">${inscritCount}+</div>
      <div style="color:rgba(255,255,255,0.5);font-size:10px;margin-top:2px;">Inscrits</div>
    </div>
    <div class="stat-chip">
      <div class="hero-num" style="font-size:1.8rem;">🔥</div>
      <div style="color:rgba(255,255,255,0.5);font-size:10px;margin-top:2px;">Flamme</div>
    </div>
  </div>

  <!-- Mission Card -->
  <div class="glass mission-card fadeUp" style="padding:20px;margin-bottom:16px;border-radius:16px;animation-delay:0.15s;">
    <div style="display:flex;gap:12px;align-items:flex-start;">
      <span style="font-size:1.8rem;flex-shrink:0;">💚</span>
      <div>
        <div class="ht" style="color:#4ade80;font-weight:700;font-size:0.95rem;margin-bottom:6px;">Notre Mission</div>
        <p style="color:rgba(255,255,255,0.7);font-size:13px;line-height:1.7;">
          Que tu sois à <strong style="color:white;">Niamey, Zinder, Maradi ou Agadez</strong>, 
          tu mérites les mêmes ressources. NigerBac Tools t'offre 
          <strong style="color:#FF7518;">26 outils puissants</strong> — annales, cours, vidéos, simulations — 
          pour que ta réussite dépende uniquement de ton travail.
        </p>
      </div>
    </div>
  </div>

  <!-- Promo Card -->
  <div class="glass promo-card glow fadeUp" style="padding:20px;margin-bottom:20px;border-radius:16px;animation-delay:0.2s;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
      <span style="font-size:1.8rem;">🔥</span>
      <div style="flex:1;">
        <div class="ht" style="font-weight:800;color:white;font-size:1rem;">Offre Spéciale Examens</div>
        <div style="color:rgba(255,255,255,0.45);font-size:11px;">Valable jusqu'à la fin des examens BAC 2026</div>
      </div>
      <span style="background:linear-gradient(135deg,#FF7518,#FF4500);color:white;padding:4px 10px;border-radius:100px;font-family:'Space Mono',monospace;font-size:11px;font-weight:700;white-space:nowrap;">-30%</span>
    </div>
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:14px;">
      <div>
        <div style="color:rgba(255,255,255,0.35);font-size:12px;text-decoration:line-through;font-family:'Space Mono',monospace;">5 000 FCFA</div>
        <div class="ht mono" style="font-size:2.2rem;font-weight:800;color:#FF7518;line-height:1;">3 000 <span style="font-size:1rem;">FCFA</span></div>
      </div>
      <div style="flex:1;font-size:12px;color:rgba(255,255,255,0.65);line-height:1.8;">
        ✅ 26 outils BAC complets<br>
        ✅ 🔥 La Flamme Nigérienne<br>
        ✅ Bibliothèque collaborative<br>
        ✅ Accès à vie
      </div>
    </div>
    <div style="background:rgba(255,117,24,0.1);border-radius:10px;padding:10px 12px;font-size:12px;color:rgba(255,255,255,0.6);">
      ⚠️ <strong style="color:#FF7518;">Prix normal : 5 000 FCFA</strong> → Promotion spéciale -30% : seulement <strong style="color:white;">3 000 FCFA</strong> — offre valable jusqu'à la fin des examens
    </div>
  </div>

  <!-- Boutons -->
  <div style="display:flex;flex-direction:column;gap:12px;" class="fadeUp" style="animation-delay:0.3s;">
    <a href="/inscription" style="text-decoration:none;">
      <button class="btn-orange pulse" style="font-size:16px;padding:18px;border-radius:16px;">
        🚀 S'inscrire et commencer
      </button>
    </a>
    <a href="/connexion" style="text-decoration:none;">
      <button class="btn-green" style="padding:16px;border-radius:16px;">
        🔑 J'ai un code — Me connecter
      </button>
    </a>
    <a href="/paiement" style="text-decoration:none;text-align:center;">
      <span style="color:rgba(255,255,255,0.4);font-size:13px;">Déjà inscrit ? → Payer et activer l'accès</span>
    </a>
  </div>

  <div style="text-align:center;margin-top:24px;" class="mono">
    <span style="color:rgba(255,255,255,0.2);font-size:10px;">© 2026 RÉUSSI TON BAC · Niger 🇳🇪</span>
  </div>
</div>

${STARS_JS}
<script>
// Confettis
(function(){
  const colors=['#FF7518','#29AB47','#FFD700','#FF4500','#FFF','#00CED1','#FF69B4'];
  const container=document.getElementById('confettiContainer');
  for(let i=0;i<50;i++){
    const c=document.createElement('div');
    c.className='confetti-piece';
    const size=4+Math.random()*8;
    c.style.cssText='left:'+Math.random()*100+'%;top:-20px;width:'+size+'px;height:'+size+'px;background:'+colors[Math.floor(Math.random()*colors.length)]+';animation-duration:'+(3+Math.random()*5)+'s;animation-delay:'+Math.random()*6+'s;';
    container.appendChild(c);
  }
})();
</script>
</body></html>`);
});

// ========================= INSCRIPTION =========================
router.get('/inscription', (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  res.send(pageInscription(null, null));
});

router.post('/inscription', async (req, res) => {
  try {
    const { nom, prenom, date_naissance, ecole, serie, ville, telephone } = req.body;

    if (!nom || !prenom || !ecole || !serie || !ville || !telephone)
      return res.send(pageInscription('❌ Remplis tous les champs obligatoires !', null));

    const telClean = telephone.replace(/[\s\-\+\.]/g, '');
    if (!/^\d{8,12}$/.test(telClean))
      return res.send(pageInscription('❌ Numéro de téléphone invalide (8 à 12 chiffres)', null));

    // Vérif doublon
    const { data: existing } = await supabase
      .from('users').select('id').eq('telephone', telClean).single();
    if (existing)
      return res.send(pageInscription(null, 'Tu es déjà inscrit ! Utilise le bouton "Me connecter".'));

    // Générer code anonyme unique
    let codeAnonyme = genCodeAnonyme();
    let tries = 0;
    while (tries < 10) {
      const { data: dup } = await supabase.from('users').select('id').eq('code_anonyme', codeAnonyme).single();
      if (!dup) break;
      codeAnonyme = genCodeAnonyme();
      tries++;
    }

    const { error } = await supabase.from('users').insert({
      nom: nom.trim().toUpperCase(),
      prenom: prenom.trim(),
      date_naissance: date_naissance || null,
      ecole: ecole.trim(),
      serie,
      ville: ville.trim(),
      telephone: telClean,
      code_anonyme: codeAnonyme
    });

    if (error) {
      if (error.code === '23505')
        return res.send(pageInscription(null, 'Tu es déjà inscrit ! Utilise le bouton "Me connecter".'));
      throw error;
    }

    req.session.regTel = telClean;
    req.session.regPrenom = prenom.trim();
    res.redirect('/paiement');
  } catch(err) {
    console.error('Inscription error:', err);
    res.send(pageInscription('❌ Erreur serveur. Réessaie dans quelques instants.', null));
  }
});

function pageInscription(error, success) {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
<title>Inscription – NigerBac Tools 2026</title>
<script src="https://cdn.tailwindcss.com"></script>${CSS}</head>
<body>
<div class="stars-bg" id="stars"></div>
<div class="flag"></div>
<div class="relative z-10" style="max-width:500px;margin:0 auto;padding:20px 18px 40px;">

  <!-- Back + Title -->
  <div style="margin-bottom:24px;" class="fadeUp">
    <a href="/" style="color:rgba(255,255,255,0.4);font-size:13px;text-decoration:none;display:inline-flex;align-items:center;gap:6px;margin-bottom:20px;">← Retour</a>
    <div style="text-align:center;">
      <div style="font-size:2.5rem;margin-bottom:8px;">📝</div>
      <h1 class="ht" style="font-size:1.6rem;font-weight:800;color:white;">Crée ton compte</h1>
      <p style="color:rgba(255,255,255,0.45);font-size:13px;margin-top:6px;">Toutes tes infos sont confidentielles 🔒</p>
    </div>
  </div>

  ${error ? `<div class="err">${error}</div>` : ''}
  ${success ? `<div class="suc">${success} <a href="/connexion" style="color:#86efac;font-weight:700;text-decoration:underline;">→ Connexion</a></div>` : ''}

  <div class="glass fadeUp" style="padding:24px;animation-delay:0.1s;">
    <form method="POST" action="/inscription" style="display:flex;flex-direction:column;gap:16px;" novalidate>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label class="label">Nom *</label>
          <input name="nom" type="text" placeholder="DIALLO" class="inp" required autocomplete="family-name">
        </div>
        <div>
          <label class="label">Prénom *</label>
          <input name="prenom" type="text" placeholder="Moussa" class="inp" required autocomplete="given-name">
        </div>
      </div>

      <div>
        <label class="label">Date de naissance</label>
        <input name="date_naissance" type="date" class="inp" autocomplete="bday">
      </div>

      <div>
        <label class="label">École / Lycée *</label>
        <input name="ecole" type="text" placeholder="Lycée Kassai, Tanimoune..." class="inp" required>
      </div>

      <div>
        <label class="label">Série *</label>
        <select name="serie" class="inp" required>
          <option value="" disabled selected>Choisir ta série...</option>
          <option value="Terminale D">Terminale D — Maths & Sciences</option>
          <option value="Terminale A">Terminale A — Lettres & Philosophie</option>
        </select>
      </div>

      <div>
        <label class="label">Ville *</label>
        <input name="ville" type="text" placeholder="Niamey, Zinder, Maradi, Agadez..." class="inp" required>
      </div>

      <div>
        <label class="label">Numéro de téléphone *</label>
        <input name="telephone" type="tel" placeholder="Ex: 90 12 34 56" class="inp mono" required autocomplete="tel" inputmode="numeric">
        <div style="color:rgba(255,255,255,0.3);font-size:11px;margin-top:5px;">📲 C'est sur ce numéro que tu recevras ton code d'accès</div>
      </div>

      <button type="submit" class="btn-orange" style="margin-top:4px;">
        ✅ Enregistrer et passer au paiement
      </button>
    </form>
  </div>

  <div style="text-align:center;margin-top:16px;">
    <a href="/connexion" style="color:rgba(255,255,255,0.35);font-size:13px;">Déjà un compte ? → Me connecter</a>
  </div>
</div>
${STARS_JS}
</body></html>`;
}

// ========================= PAIEMENT =========================
router.get('/paiement', (req, res) => {
  res.send(pagePaiement(null, null));
});

router.post('/paiement', uploadRecu.single('recu'), async (req, res) => {
  try {
    const { telephone } = req.body;
    if (!telephone)
      return res.send(pagePaiement('❌ Entre ton numéro de téléphone', null));
    if (!req.file)
      return res.send(pagePaiement('❌ Uploade ton reçu de paiement (image ou PDF)', null));

    const telClean = telephone.replace(/[\s\-\+\.]/g, '');
    const { data: user } = await supabase.from('users').select('*').eq('telephone', telClean).single();
    if (!user)
      return res.send(pagePaiement("❌ Numéro non trouvé. Inscris-toi d'abord !", null));

    // Supprimer ancien reçu si existe
    if (user.recu_url) {
      const oldFile = path.join(__dirname, '../public/recus', path.basename(user.recu_url));
      if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
    }

    const recuUrl = '/recus-media/' + req.file.filename;
    await supabase.from('users').update({ recu_url: recuUrl }).eq('id', user.id);

    // Message WhatsApp pour l'admin
    const waText = `🇳🇪 *NOUVEAU PAIEMENT — NigerBac Tools 2026*\n\n` +
      `👤 *Élève :* ${user.prenom} ${user.nom}\n` +
      `📞 *Téléphone :* ${user.telephone}\n` +
      `🏫 *École :* ${user.ecole}\n` +
      `📚 *Série :* ${user.serie}\n` +
      `🏙️ *Ville :* ${user.ville}\n` +
      `💰 *Montant :* 3 000 FCFA\n` +
      `🖼️ *Reçu téléversé :* ✅\n\n` +
      `⚡ Valide sur le panel admin pour générer son code d'accès.`;

    const waLink = `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(waText)}`;

    res.send(`<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
<title>Reçu envoyé ✅</title>
<script src="https://cdn.tailwindcss.com"></script>${CSS}</head>
<body>
<div class="stars-bg" id="stars"></div>
<div class="flag"></div>
<div class="relative z-10" style="max-width:500px;margin:0 auto;padding:24px 18px 40px;text-align:center;">
  <div class="fadeUp" style="margin-bottom:28px;">
    <div class="float" style="font-size:4rem;margin-bottom:14px;">✅</div>
    <h1 class="ht" style="font-size:1.7rem;font-weight:800;color:white;margin-bottom:10px;">Reçu envoyé !</h1>
    <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.7;">
      Ton reçu a été téléversé avec succès.<br>
      <strong style="color:#FF7518;">L'admin va vérifier et t'envoyer ton code</strong><br>
      par WhatsApp ou SMS.
    </p>
  </div>
  <div class="glass fadeUp" style="padding:18px;margin-bottom:16px;text-align:left;animation-delay:0.1s;">
    <div style="display:flex;align-items:center;gap:12px;">
      <span style="font-size:1.8rem;">⏱️</span>
      <div>
        <div class="ht" style="color:white;font-weight:700;font-size:0.95rem;">Délai de validation</div>
        <div style="color:rgba(255,255,255,0.55);font-size:13px;">Généralement <strong style="color:#4ade80;">moins de 24h</strong> — souvent quelques minutes !</div>
      </div>
    </div>
  </div>
  <div style="display:flex;flex-direction:column;gap:12px;" class="fadeUp" style="animation-delay:0.2s;">
    <a href="${waLink}" target="_blank" style="text-decoration:none;">
      <button style="background:linear-gradient(135deg,#25D366,#128C7E);color:white;border:none;border-radius:14px;padding:16px;font-family:'Syne',sans-serif;font-weight:700;font-size:14px;cursor:pointer;width:100%;transition:all 0.3s;">
        📲 Notifier l'admin sur WhatsApp
      </button>
    </a>
    <a href="/connexion" style="text-decoration:none;">
      <button class="btn-orange">🔑 J'ai mon code — Accéder au site</button>
    </a>
  </div>
</div>
${STARS_JS}
<script>setTimeout(()=>{window.open('${waLink}','_blank');},1500);</script>
</body></html>`);
  } catch(err) {
    console.error('Paiement error:', err);
    res.send(pagePaiement('❌ Erreur upload. Réessaie avec une image plus petite.', null));
  }
});

function pagePaiement(error, success) {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
<title>Paiement – NigerBac Tools 2026</title>
<script src="https://cdn.tailwindcss.com"></script>${CSS}</head>
<body>
<div class="stars-bg" id="stars"></div>
<div class="flag"></div>
<div class="relative z-10" style="max-width:500px;margin:0 auto;padding:20px 18px 40px;">
  <div style="margin-bottom:24px;" class="fadeUp">
    <a href="/" style="color:rgba(255,255,255,0.4);font-size:13px;text-decoration:none;">← Retour</a>
    <div style="text-align:center;margin-top:16px;">
      <div style="font-size:2.5rem;margin-bottom:8px;">💳</div>
      <h1 class="ht" style="font-size:1.6rem;font-weight:800;color:white;">Paiement</h1>
      <p style="color:rgba(255,255,255,0.45);font-size:13px;margin-top:6px;">Envoie 3 000 FCFA et téléverse ton reçu</p>
    </div>
  </div>

  <!-- Numéro Orange Money -->
  <div class="glass fadeUp" style="padding:20px;margin-bottom:16px;border:1px solid rgba(255,117,24,0.3);background:rgba(255,117,24,0.05);border-radius:16px;animation-delay:0.1s;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
      <span style="font-size:2rem;">🟠</span>
      <div>
        <div class="ht" style="font-weight:800;color:#FF7518;font-size:1rem;">Orange Money</div>
        <div style="color:rgba(255,255,255,0.45);font-size:12px;">Envoie exactement 3 000 FCFA</div>
      </div>
    </div>
    <div style="background:rgba(0,0,0,0.35);border-radius:12px;padding:16px;text-align:center;margin-bottom:12px;">
      <div style="color:rgba(255,255,255,0.4);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px;">Numéro de réception</div>
      <div class="mono" style="font-size:1.8rem;font-weight:700;color:white;letter-spacing:0.08em;">+227 81 53 83 41</div>
      <div style="color:#FF7518;font-size:12px;font-weight:600;margin-top:4px;">RÉUSSI TON BAC</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;color:rgba(255,255,255,0.6);">
      <div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:8px;">💰 <strong style="color:white;">Montant :</strong><br>3 000 FCFA exactement</div>
      <div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:8px;">📝 <strong style="color:white;">Motif :</strong><br>Accès NigerBac 2026</div>
    </div>
  </div>

  ${error ? `<div class="err">${error}</div>` : ''}
  ${success ? `<div class="suc">${success}</div>` : ''}

  <!-- Upload Form -->
  <div class="glass fadeUp" style="padding:22px;animation-delay:0.2s;">
    <h3 class="ht" style="color:white;font-weight:700;margin-bottom:16px;">📤 Téléverser le reçu</h3>
    <form method="POST" action="/paiement" enctype="multipart/form-data" style="display:flex;flex-direction:column;gap:14px;">
      <div>
        <label class="label">Ton numéro de téléphone *</label>
        <input name="telephone" type="tel" placeholder="Ex: 90 12 34 56" class="inp mono" required inputmode="numeric">
      </div>
      <div>
        <label class="label">Capture d'écran du reçu *</label>
        <input name="recu" type="file" accept="image/*,.pdf" class="inp" required style="padding:12px;cursor:pointer;">
        <div style="color:rgba(255,255,255,0.3);font-size:11px;margin-top:4px;">📷 Photo ou capture d'écran du reçu Orange Money (max 10 Mo)</div>
      </div>
      <button type="submit" class="btn-orange">📤 Envoyer le reçu de paiement</button>
    </form>
  </div>

  <div style="text-align:center;margin-top:16px;">
    <a href="/connexion" style="color:rgba(255,255,255,0.35);font-size:13px;">J'ai déjà mon code → Me connecter</a>
  </div>
</div>
${STARS_JS}
</body></html>`;
}

// ========================= CONNEXION =========================
router.get('/connexion', (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  if (req.session.adminAuth) return res.redirect('/admin');
  res.send(pageConnexion(null));
});

router.post('/connexion', async (req, res) => {
  try {
    const { telephone, code } = req.body;
    if (!telephone || !code)
      return res.send(pageConnexion('❌ Entre ton téléphone et ton code'));

    const telClean = telephone.replace(/[\s\-\+\.]/g, '');
    const codeUp = code.trim().toUpperCase();

    // Vérif admin
  if ((telClean === ADMIN_TEL || telClean === '22799193823') && (codeUp === ADMIN_CODE || codeUp === 'ADMIN2026')) {
      req.session.adminAuth = true;
      return res.redirect('/admin');
    }

    const { data: user } = await supabase.from('users').select('*').eq('telephone', telClean).single();
    if (!user)
      return res.send(pageConnexion("❌ Numéro non trouvé. Inscris-toi d'abord !"));
    if (!user.paye)
      return res.send(pageConnexion('⏳ Ton paiement n\'a pas encore été validé. Patiente — l\'admin le traitera très bientôt !'));
    if (!user.code_acces || codeUp !== user.code_acces.toUpperCase())
      return res.send(pageConnexion('❌ Code incorrect. Vérifie bien le code reçu par WhatsApp ou SMS.'));

    req.session.userId = user.id;
    req.session.userPrenom = user.prenom;
    res.redirect('/dashboard');
  } catch(err) {
    console.error('Connexion error:', err);
    res.send(pageConnexion('❌ Erreur serveur. Réessaie.'));
  }
});

function pageConnexion(error) {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
<title>Connexion – NigerBac Tools 2026</title>
<script src="https://cdn.tailwindcss.com"></script>${CSS}</head>
<body>
<div class="stars-bg" id="stars"></div>
<div class="flag"></div>
<div class="relative z-10" style="max-width:500px;margin:0 auto;padding:24px 18px 40px;">
  <div class="fadeUp" style="margin-bottom:28px;">
    <a href="/" style="color:rgba(255,255,255,0.4);font-size:13px;text-decoration:none;">← Retour</a>
    <div style="text-align:center;margin-top:16px;">
      <div style="font-size:2.5rem;margin-bottom:8px;">🔐</div>
      <h1 class="ht" style="font-size:1.6rem;font-weight:800;color:white;">Se connecter</h1>
      <p style="color:rgba(255,255,255,0.45);font-size:13px;margin-top:6px;">Entre ton numéro et ton code d'accès</p>
    </div>
  </div>
  <div class="glass fadeUp" style="padding:24px;animation-delay:0.1s;">
    ${error ? `<div class="err">${error}</div>` : ''}
    <form method="POST" action="/connexion" style="display:flex;flex-direction:column;gap:16px;">
      <div>
        <label class="label">Numéro de téléphone</label>
        <input name="telephone" type="tel" placeholder="Ex: 90 12 34 56" class="inp mono" required inputmode="numeric" autocomplete="tel">
      </div>
      <div>
        <label class="label">Code d'accès</label>
        <input name="code" type="text" placeholder="Ex: AB3C7DX9" class="inp mono" required autocomplete="off" style="text-transform:uppercase;letter-spacing:0.12em;font-size:1.1rem;">
        <div style="color:rgba(255,255,255,0.3);font-size:11px;margin-top:5px;">📲 Code reçu par WhatsApp ou SMS après validation du paiement</div>
      </div>
      <button type="submit" class="btn-orange">🔓 Accéder à mes outils BAC</button>
    </form>
  </div>
  <div style="text-align:center;margin-top:18px;display:flex;flex-direction:column;gap:10px;">
    <a href="/paiement" style="color:rgba(255,255,255,0.35);font-size:13px;">Pas encore payé ? → Payer maintenant</a>
    <a href="/inscription" style="color:rgba(255,255,255,0.35);font-size:13px;">Pas encore inscrit ? → S'inscrire</a>
  </div>
</div>
${STARS_JS}
<script>
document.querySelector('[name="code"]').addEventListener('input',function(){
  this.value=this.value.toUpperCase().replace(/[^A-Z0-9]/g,'');
});
</script>
</body></html>`;
}

router.get('/logout', (req, res) => { req.session.destroy(() => res.redirect('/')); });

module.exports = router;

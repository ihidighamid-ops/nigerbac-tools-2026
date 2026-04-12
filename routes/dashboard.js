// routes/dashboard.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const supabase = require('../db/supabase');
const tools = require('../data/tools');
const { CSS, STARS_JS } = require('../utils/styles');

const storage = multer.diskStorage({
  destination: (req, file, cb) => { const d=path.join(__dirname,'../public/uploads'); if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true}); cb(null,d); },
  filename: (req, file, cb) => cb(null,'pdf-'+Date.now()+'-'+Math.random().toString(36).slice(2)+path.extname(file.originalname))
});
const upload = multer({
  storage,
  limits: { fileSize: 50*1024*1024 },
  fileFilter: (req,file,cb) => {
    if(path.extname(file.originalname).toLowerCase()==='.pdf') cb(null,true);
    else cb(new Error('Seuls les PDF sont acceptés'));
  }
});

function requireAuth(req,res,next){
  if(!req.session.userId) return res.redirect('/connexion');
  next();
}

router.get('/', requireAuth, async (req,res) => {
  try {
    const { data: user } = await supabase.from('users').select('*').eq('id',req.session.userId).single();
    if(!user){ req.session.destroy(); return res.redirect('/'); }
    const { data: pdfs } = await supabase.from('pdfs').select('*, users(prenom,nom)').order('uploaded_at',{ascending:false}).limit(24);
    res.send(renderDashboard(user, pdfs||[]));
  } catch(err){ console.error(err); res.redirect('/'); }
});

router.get('/redirect/:id', requireAuth, (req,res) => {
  const tool = tools.find(t=>t.id===parseInt(req.params.id));
  if(!tool) return res.status(404).send('Outil introuvable');
  res.redirect(tool.url);
});

router.post('/upload-pdf', requireAuth, upload.single('pdf_file'), async (req,res) => {
  try {
    const { title, pages } = req.body;
    if(!req.file||!title||!pages) return res.redirect('/dashboard?msg=err_champs');
    const pagesInt = parseInt(pages);
    if(pagesInt<10){ fs.unlinkSync(req.file.path); return res.redirect('/dashboard?msg=err_pages'); }
    await supabase.from('pdfs').insert({ user_id:req.session.userId, filename:req.file.filename, title:title.trim(), pages:pagesInt });
    await supabase.from('users').update({ pdf_count: supabase.rpc ? undefined : 0 }).eq('id',req.session.userId);
    // Incrémenter manuellement
    const { data: u } = await supabase.from('users').select('pdf_count').eq('id',req.session.userId).single();
    await supabase.from('users').update({ pdf_count: (u?.pdf_count||0)+1 }).eq('id',req.session.userId);
    res.redirect('/dashboard?msg=ok_pdf');
  } catch(err){ console.error(err); res.redirect('/dashboard?msg=err_upload'); }
});

function renderDashboard(user, pdfs) {
  const cats = [
    {id:'all',l:'🌟 Tous',n:tools.length},
    {id:'annales',l:'📚 Annales',n:tools.filter(t=>t.categorie==='annales').length},
    {id:'maths',l:'📐 Maths',n:tools.filter(t=>t.categorie==='maths').length},
    {id:'physique',l:'⚗️ PC',n:tools.filter(t=>t.categorie==='physique').length},
    {id:'svt',l:'🧬 SVT',n:tools.filter(t=>t.categorie==='svt').length},
    {id:'lettres',l:'✍️ Lettres',n:tools.filter(t=>t.categorie==='lettres').length},
    {id:'pluridisciplinaire',l:'🌍 Multi',n:tools.filter(t=>t.categorie==='pluridisciplinaire').length},
  ];

  return `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="theme-color" content="#080D1A">
<title>Dashboard – NigerBac Tools 2026</title>
<script src="https://cdn.tailwindcss.com"></script>${CSS}
<style>
.sidebar{position:fixed;left:0;top:0;bottom:0;width:250px;background:rgba(6,10,20,0.98);border-right:1px solid rgba(255,255,255,0.07);z-index:100;transition:transform 0.3s cubic-bezier(.4,0,.2,1);overflow-y:auto;display:flex;flex-direction:column;}
@media(max-width:900px){.sidebar{transform:translateX(-100%)}.sidebar.open{transform:translateX(0)}.overlay{display:block!important;}.main{margin-left:0!important;}}
.overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99;backdrop-filter:blur(3px);}
.main{margin-left:250px;min-height:100vh;}
.nav-item{display:flex;align-items:center;gap:10px;padding:11px 16px;border-radius:12px;color:rgba(255,255,255,0.5);font-size:13px;font-weight:600;font-family:'Syne',sans-serif;cursor:pointer;transition:all 0.2s;text-decoration:none;border:1px solid transparent;}
.nav-item:hover{background:rgba(255,117,24,0.08);color:rgba(255,255,255,0.8);}
.nav-item.active{background:rgba(255,117,24,0.12);color:#FF7518;border-color:rgba(255,117,24,0.2);}
.nav-flamme{background:linear-gradient(135deg,rgba(255,117,24,0.15),rgba(255,69,0,0.08));border-color:rgba(255,117,24,0.25)!important;color:#FF7518!important;}
.nav-flamme:hover{background:linear-gradient(135deg,rgba(255,117,24,0.25),rgba(255,69,0,0.15))!important;}
.tool-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;text-decoration:none;display:block;transition:all 0.25s;animation:cardIn 0.4s ease forwards;opacity:0;}
@keyframes cardIn{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
.tool-card:hover{transform:translateY(-3px);border-color:rgba(255,255,255,0.12);box-shadow:0 10px 30px rgba(0,0,0,0.35);}
.cat-btn{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.55);border-radius:100px;padding:7px 14px;font-size:12px;font-family:'Syne',sans-serif;font-weight:600;cursor:pointer;transition:all 0.2s;white-space:nowrap;-webkit-tap-highlight-color:transparent;}
.cat-btn.active,.cat-btn:hover{background:rgba(255,117,24,0.15);border-color:rgba(255,117,24,0.35);color:#FF7518;}
.search{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);color:white;transition:all 0.3s;}
.search:focus{border-color:#FF7518;outline:none;box-shadow:0 0 0 2px rgba(255,117,24,0.15);}
.search::placeholder{color:rgba(255,255,255,0.28);}
.fab{position:fixed;bottom:20px;right:20px;background:linear-gradient(135deg,#FF7518,#FF4500);color:white;border-radius:18px;padding:14px 18px;font-family:'Syne',sans-serif;font-weight:700;font-size:13px;cursor:pointer;box-shadow:0 6px 24px rgba(255,117,24,0.4);transition:all 0.3s;z-index:90;border:none;display:flex;align-items:center;gap:8px;}
.fab:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(255,117,24,0.5);}
.modal{position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);z-index:200;display:none;align-items:center;justify-content:center;padding:20px;}
.modal.open{display:flex;}
.modal-box{background:#0D1428;border:1px solid rgba(255,255,255,0.1);border-radius:22px;padding:26px;width:100%;max-width:440px;max-height:90vh;overflow-y:auto;}
.minp{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);color:white;border-radius:11px;padding:12px 14px;width:100%;font-size:14px;transition:all 0.3s;font-family:'Noto Sans',sans-serif;}
.minp:focus{border-color:#FF7518;outline:none;}
.minp::placeholder{color:rgba(255,255,255,0.28);}
</style>
</head><body>

<div class="overlay" id="overlay" onclick="closeSidebar()"></div>

<!-- SIDEBAR -->
<aside class="sidebar" id="sidebar">
  <div class="flag"></div>
  <div style="padding:18px;flex:1;display:flex;flex-direction:column;gap:4px;">

    <!-- Brand -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
      <span style="font-size:1.8rem;">🇳🇪</span>
      <div>
        <div class="ht" style="font-size:0.9rem;font-weight:800;color:white;line-height:1.1;">NigerBac Tools</div>
        <div class="mono" style="font-size:9px;color:#FF7518;">BAC 2026</div>
      </div>
    </div>

    <!-- User card -->
    <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px;margin-bottom:14px;">
      <div class="ht" style="color:white;font-weight:700;font-size:13px;">${user.prenom} ${user.nom}</div>
      <div style="color:rgba(255,255,255,0.4);font-size:11px;margin-top:2px;">${user.ville} · ${user.serie}</div>
      <div style="margin-top:6px;display:flex;align-items:center;gap:6px;">
        <div style="width:6px;height:6px;border-radius:50%;background:#29AB47;box-shadow:0 0 6px #29AB47;"></div>
        <span style="color:#4ade80;font-size:11px;">Accès actif ✅</span>
      </div>
    </div>

    <!-- Nav -->
    <a href="#tools" class="nav-item active" onclick="closeSidebar()"><span>🧰</span> Mes 26 outils</a>
    <a href="/flamme" class="nav-item nav-flamme"><span>🔥</span> La Flamme Nigérienne</a>
    <a href="#library" class="nav-item" onclick="closeSidebar()"><span>📚</span> Bibliothèque PDF</a>
    <a href="#" onclick="openModal();closeSidebar();" class="nav-item"><span>📤</span> Partager un PDF</a>

    <div style="flex:1;"></div>

    <!-- PDF Progress -->
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:12px;margin-top:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="color:rgba(255,255,255,0.45);font-size:11px;">PDF partagés</span>
        <span class="mono" style="font-size:11px;color:#FBBF24;">${user.pdf_count||0}/100</span>
      </div>
      <div style="background:rgba(255,255,255,0.1);border-radius:100px;height:5px;">
        <div style="background:linear-gradient(90deg,#FF7518,#FFD700);height:5px;border-radius:100px;width:${Math.min(user.pdf_count||0,100)}%;transition:width 0.5s;"></div>
      </div>
      <div style="color:#FBBF24;font-size:10px;margin-top:5px;">🎁 100 PDF qualifiés = 20 000 FCFA !</div>
    </div>

    <!-- Logout -->
    <a href="/logout" class="nav-item" style="color:#fca5a5;margin-top:6px;"><span>🚪</span> Déconnexion</a>
  </div>
</aside>

<!-- MAIN CONTENT -->
<div class="main">

  <!-- Top Header -->
  <header style="position:sticky;top:0;z-index:80;padding:12px 18px;display:flex;align-items:center;gap:12px;background:rgba(8,13,26,0.96);border-bottom:1px solid rgba(255,255,255,0.06);backdrop-filter:blur(20px);">
    <button onclick="toggleSidebar()" style="color:white;padding:9px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.09);cursor:pointer;font-size:16px;flex-shrink:0;" class="lg:hidden">☰</button>
    <input type="text" id="searchInput" placeholder="🔍 Rechercher un outil..." class="search" style="flex:1;max-width:380px;border-radius:12px;padding:10px 14px;font-size:14px;" oninput="filterTools()">
    <a href="/flamme" style="text-decoration:none;flex-shrink:0;">
      <button style="background:linear-gradient(135deg,#FF7518,#FF4500);color:white;border:none;border-radius:11px;padding:10px 14px;font-family:'Syne',sans-serif;font-weight:700;font-size:12px;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:5px;">🔥 Flamme</button>
    </a>
  </header>

  <main style="padding:18px;max-width:1300px;margin:0 auto;">

    <!-- Welcome Banner -->
    <div style="background:linear-gradient(135deg,rgba(255,117,24,0.1),rgba(255,69,0,0.05));border:1px solid rgba(255,117,24,0.18);border-radius:14px;padding:16px 18px;margin-bottom:18px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
      <span style="font-size:1.8rem;">🏆</span>
      <div style="flex:1;min-width:200px;">
        <div class="ht" style="color:white;font-weight:700;font-size:1rem;">Bienvenue ${user.prenom} ! 🚀</div>
        <div style="color:rgba(255,255,255,0.5);font-size:12px;margin-top:2px;">
          Ton code anonyme : <strong style="color:#FF7518;font-family:'Space Mono',monospace;">${user.code_anonyme||'N/A'}</strong> · Clique une carte pour accéder à l'outil
        </div>
      </div>
    </div>

    <!-- Flamme Banner -->
    <a href="/flamme" style="text-decoration:none;display:block;margin-bottom:18px;">
      <div style="background:linear-gradient(135deg,rgba(255,117,24,0.18),rgba(255,69,0,0.1));border:1px solid rgba(255,117,24,0.35);border-radius:14px;padding:14px 18px;display:flex;align-items:center;gap:14px;transition:all 0.25s;cursor:pointer;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
        <span style="font-size:2rem;flex-shrink:0;">🔥</span>
        <div style="flex:1;">
          <div class="ht" style="color:#FF7518;font-weight:800;font-size:1rem;">La Flamme Nigérienne</div>
          <div style="color:rgba(255,255,255,0.55);font-size:12px;margin-top:2px;">Messagerie anonyme — échange cours, exercices, messages avec tous les inscrits. Tu es <strong style="color:white;font-family:'Space Mono',monospace;">${user.code_anonyme||'?'}</strong></div>
        </div>
        <span style="color:#FF7518;font-size:1.3rem;flex-shrink:0;">→</span>
      </div>
    </a>

    <!-- Tools Section -->
    <section id="tools">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <h2 class="ht" style="font-size:1.2rem;font-weight:800;color:white;">🧰 Les 26 outils BAC</h2>
        <span class="mono" style="color:rgba(255,255,255,0.35);font-size:11px;" id="toolCount">26 outils</span>
      </div>
      <!-- Category filter -->
      <div style="display:flex;gap:7px;overflow-x:auto;padding-bottom:10px;margin-bottom:14px;-ms-overflow-style:none;scrollbar-width:none;">
        ${cats.map(c=>`<button class="cat-btn ${c.id==='all'?'active':''}" onclick="filterCat('${c.id}',this)">${c.l} <span style="opacity:0.5">(${c.n})</span></button>`).join('')}
      </div>
      <!-- Grid -->
      <div id="toolsGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px;">
        ${tools.map((t,i) => `
        <a href="/dashboard/redirect/${t.id}" target="_blank" rel="noopener noreferrer"
          class="tool-card" data-name="${t.nom.toLowerCase()} ${t.description.toLowerCase()}" data-cat="${t.categorie}"
          style="animation-delay:${i*0.03}s;">
          <div style="height:3px;background:${t.gradient};"></div>
          <div style="padding:14px;">
            <div style="width:48px;height:48px;border-radius:13px;background:${t.accent}22;display:flex;align-items:center;justify-content:center;font-size:1.7rem;margin-bottom:10px;">${t.icone}</div>
            <div class="ht" style="color:white;font-weight:700;font-size:13px;line-height:1.3;margin-bottom:6px;">${t.nom}</div>
            <p style="color:rgba(255,255,255,0.45);font-size:11px;line-height:1.5;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${t.description}</p>
            <div style="background:rgba(255,255,255,0.04);border-left:2px solid ${t.accent};padding:6px 8px;border-radius:0 7px 7px 0;font-size:10px;color:rgba(255,255,255,0.55);line-height:1.4;margin-bottom:8px;">${t.conseil}</div>
            <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:8px;">
              ${t.badges.map(b=>`<span style="font-size:9px;padding:2px 6px;border-radius:100px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.09);color:rgba(255,255,255,0.5);">${b}</span>`).join('')}
            </div>
            <div style="text-align:right;"><span style="font-size:10px;font-weight:700;color:${t.accent};">Accéder →</span></div>
          </div>
        </a>`).join('')}
      </div>
      <div id="noResults" style="display:none;text-align:center;padding:40px;color:rgba(255,255,255,0.3);">
        <div style="font-size:2.5rem;margin-bottom:8px;">🔍</div>
        <div class="ht">Aucun outil trouvé</div>
      </div>
    </section>

    <!-- Library Section -->
    <section id="library" style="margin-top:36px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <h2 class="ht" style="font-size:1.2rem;font-weight:800;color:white;">📚 Bibliothèque Collaborative</h2>
        <button onclick="openModal()" style="background:linear-gradient(135deg,#29AB47,#1a7a32);color:white;font-size:12px;font-weight:700;padding:8px 14px;border-radius:100px;border:none;cursor:pointer;font-family:'Syne',sans-serif;">📤 Partager</button>
      </div>
      <div style="background:linear-gradient(135deg,rgba(41,171,71,0.1),rgba(16,123,50,0.05));border:1px solid rgba(41,171,71,0.2);border-radius:14px;padding:16px;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <span style="font-size:2rem;">💰</span>
          <div>
            <div class="ht" style="color:white;font-weight:700;font-size:0.95rem;">Gagne 20 000 FCFA !</div>
            <div style="color:rgba(255,255,255,0.55);font-size:13px;">Partage <strong style="color:#4ade80;">100 PDF qualifiés</strong> (min. 10 pages chacun). Tu en es à <strong style="color:white;">${user.pdf_count||0}</strong>/100.</div>
          </div>
        </div>
        <div style="background:rgba(255,255,255,0.1);border-radius:100px;height:5px;margin-top:10px;">
          <div style="background:linear-gradient(90deg,#29AB47,#4ade80);height:5px;border-radius:100px;width:${Math.min(user.pdf_count||0,100)}%;"></div>
        </div>
      </div>
      ${pdfs.length===0?`
      <div style="text-align:center;padding:32px;color:rgba(255,255,255,0.3);">
        <div style="font-size:2.5rem;margin-bottom:8px;">📂</div>
        <div class="ht">Bibliothèque vide — Sois le premier à partager !</div>
      </div>`:`
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;">
        ${pdfs.map(p=>`
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:12px;">
          <div style="display:flex;gap:10px;align-items:flex-start;">
            <span style="font-size:1.5rem;flex-shrink:0;">📄</span>
            <div style="flex:1;min-width:0;">
              <div class="ht" style="color:white;font-weight:700;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.title}</div>
              <div style="color:rgba(255,255,255,0.35);font-size:10px;margin-top:2px;">${p.users?.prenom||''} ${p.users?.nom||''} · ${p.pages}p</div>
            </div>
          </div>
        </div>`).join('')}
      </div>`}
    </section>
  </main>
</div>

<!-- FAB -->
<button class="fab" onclick="openModal()">📤 Partager un PDF</button>

<!-- Upload Modal -->
<div class="modal" id="uploadModal">
  <div class="modal-box">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <h3 class="ht" style="color:white;font-weight:800;font-size:1.1rem;">📤 Partager un PDF</h3>
      <button onclick="closeModal()" style="color:rgba(255,255,255,0.4);font-size:1.6rem;background:none;border:none;cursor:pointer;line-height:1;">✕</button>
    </div>
    <div style="background:rgba(250,204,21,0.08);border:1px solid rgba(250,204,21,0.25);border-radius:10px;padding:10px 12px;margin-bottom:16px;font-size:12px;color:#fde047;line-height:1.5;">
      📌 Minimum <strong>10 pages</strong> par PDF pour être comptabilisé.<br>
      🎁 <strong>100 PDF qualifiés = 20 000 FCFA</strong> récompense !
    </div>
    <form method="POST" action="/dashboard/upload-pdf" enctype="multipart/form-data" style="display:flex;flex-direction:column;gap:14px;">
      <div><label style="color:rgba(255,255,255,0.4);font-size:11px;display:block;margin-bottom:5px;">Titre du document *</label>
        <input name="title" type="text" placeholder="Ex: Annales Maths BAC Niger 2024" class="minp" required></div>
      <div><label style="color:rgba(255,255,255,0.4);font-size:11px;display:block;margin-bottom:5px;">Nombre de pages *</label>
        <input name="pages" type="number" min="10" placeholder="Minimum 10" class="minp" required></div>
      <div><label style="color:rgba(255,255,255,0.4);font-size:11px;display:block;margin-bottom:5px;">Fichier PDF *</label>
        <input name="pdf_file" type="file" accept=".pdf" class="minp" required style="padding:10px;cursor:pointer;"></div>
      <button type="submit" style="background:linear-gradient(135deg,#FF7518,#FF4500);color:white;border:none;border-radius:12px;padding:14px;font-family:'Syne',sans-serif;font-weight:700;cursor:pointer;font-size:14px;">🚀 Publier dans la bibliothèque</button>
    </form>
  </div>
</div>

<script>
function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');document.getElementById('overlay').style.display=document.getElementById('sidebar').classList.contains('open')?'block':'none';}
function closeSidebar(){document.getElementById('sidebar').classList.remove('open');document.getElementById('overlay').style.display='none';}
function openModal(){document.getElementById('uploadModal').classList.add('open');}
function closeModal(){document.getElementById('uploadModal').classList.remove('open');}
document.getElementById('uploadModal').addEventListener('click',function(e){if(e.target===this)closeModal();});

let currentCat='all';
function filterTools(){filterAll(document.getElementById('searchInput').value.toLowerCase(),currentCat);}
function filterCat(cat,btn){currentCat=cat;document.querySelectorAll('.cat-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');filterAll(document.getElementById('searchInput').value.toLowerCase(),cat);}
function filterAll(q,cat){
  const cards=document.querySelectorAll('.tool-card');let v=0;
  cards.forEach(c=>{
    const match=(!q||c.dataset.name.includes(q))&&(cat==='all'||c.dataset.cat===cat);
    c.style.display=match?'':'none';if(match)v++;
  });
  document.getElementById('toolCount').textContent=v+' outil'+(v!==1?'s':'');
  document.getElementById('noResults').style.display=v===0?'block':'none';
}
// Messages
const msg=new URLSearchParams(window.location.search).get('msg');
const msgs={'ok_pdf':'✅ PDF partagé avec succès ! Merci pour ta contribution 🎉','err_champs':'❌ Remplis tous les champs','err_pages':'❌ Minimum 10 pages requis','err_upload':'❌ Erreur upload. Réessaie.'};
if(msg&&msgs[msg]){
  const t=document.createElement('div');
  t.style.cssText='position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:999;background:'+(msg.startsWith('ok')?'rgba(34,197,94,0.15)':'rgba(220,38,38,0.15)')+';border:1px solid '+(msg.startsWith('ok')?'rgba(34,197,94,0.4)':'rgba(220,38,38,0.4)')+';color:'+(msg.startsWith('ok')?'#86efac':'#fca5a5')+';padding:12px 20px;border-radius:12px;font-size:13px;font-family:Syne;font-weight:600;max-width:340px;text-align:center;';
  t.textContent=msgs[msg];
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),4000);
  history.replaceState({},document.title,'/dashboard');
}
</script>
</body></html>`;
}

module.exports = router;

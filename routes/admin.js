// routes/admin.js - Panel Admin
const express = require('express');
const router = express.Router();
const path = require('path');
const supabase = require('../db/supabase');
const { CSS } = require('../utils/styles');

const WHATSAPP_NUM = '22781538341';

function requireAdmin(req,res,next){
  if(!req.session.adminAuth) return res.redirect('/connexion');
  next();
}

function genCode(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c='';for(let i=0;i<8;i++) c+=chars[Math.floor(Math.random()*chars.length)];
  return c;
}

// GET /admin
router.get('/', requireAdmin, async (req,res) => {
  try {
    const { data: users } = await supabase.from('users').select('*').order('inscrit_le',{ascending:false});
    const { data: pdfs } = await supabase.from('pdfs').select('*, users(prenom,nom)').order('uploaded_at',{ascending:false});
    const { count: msgCount } = await supabase.from('messages').select('*',{count:'exact',head:true});
    const allUsers = users||[];
    const paidCount = allUsers.filter(u=>u.paye).length;
    res.send(renderAdmin(allUsers, pdfs||[], msgCount||0, paidCount, null, null));
  } catch(err){ console.error(err); res.send('Erreur admin: '+err.message); }
});

// POST /admin/gen-code
router.post('/gen-code', requireAdmin, async (req,res) => {
  try {
    const telClean = req.body.telephone.replace(/[\s\-\+\.]/g,'');
    const { data: user } = await supabase.from('users').select('*').eq('telephone',telClean).single();
    if(!user){
      const { data: users } = await supabase.from('users').select('*').order('inscrit_le',{ascending:false});
      const { data: pdfs } = await supabase.from('pdfs').select('*, users(prenom,nom)').order('uploaded_at',{ascending:false});
      const { count: mc } = await supabase.from('messages').select('*',{count:'exact',head:true});
      return res.send(renderAdmin(users||[], pdfs||[], mc||0, (users||[]).filter(u=>u.paye).length, 'Utilisateur introuvable !', null));
    }
    const code = genCode();
    await supabase.from('users').update({ code_acces: code, paye: true }).eq('id', user.id);

    const waText =
      `🇳🇪 *NIGERBAC TOOLS 2026 — CODE D'ACCÈS*\n\n` +
      `Bonjour *${user.prenom} ${user.nom}* ! 🎉\n\n` +
      `Ton paiement a été validé ✅\n\n` +
      `🔑 *Ton code d'accès :*\n` +
      `\`${code}\`\n\n` +
      `📱 *Comment te connecter :*\n` +
      `1. Va sur le site\n` +
      `2. Clique "Me connecter"\n` +
      `3. Entre ton numéro : *${user.telephone}*\n` +
      `4. Entre le code : *${code}*\n\n` +
      `🚀 Bonne réussite au BAC 2026 ! 🏆\n` +
      `— Équipe RÉUSSI TON BAC`;

    const waLink = `https://wa.me/${user.telephone.replace(/\D/g,'')}?text=${encodeURIComponent(waText)}`;
    const { data: users2 } = await supabase.from('users').select('*').order('inscrit_le',{ascending:false});
    const { data: pdfs2 } = await supabase.from('pdfs').select('*, users(prenom,nom)').order('uploaded_at',{ascending:false});
    const { count: mc2 } = await supabase.from('messages').select('*',{count:'exact',head:true});
    const u2 = users2||[];
    res.send(renderAdmin(u2, pdfs2||[], mc2||0, u2.filter(u=>u.paye).length, null, { user: {...user, code_acces:code}, code, waLink }));
  } catch(err){ console.error(err); res.redirect('/admin'); }
});

// POST /admin/toggle-paid/:id
router.post('/toggle-paid/:id', requireAdmin, async (req,res) => {
  try {
    const { data: u } = await supabase.from('users').select('paye').eq('id',req.params.id).single();
    if(u) await supabase.from('users').update({ paye: !u.paye }).eq('id',req.params.id);
    res.redirect('/admin');
  } catch(err){ res.redirect('/admin'); }
});

// POST /admin/delete/:id
router.post('/delete/:id', requireAdmin, async (req,res) => {
  try {
    await supabase.from('messages').delete().eq('user_id',req.params.id);
    await supabase.from('pdfs').delete().eq('user_id',req.params.id);
    await supabase.from('users').delete().eq('id',req.params.id);
    res.redirect('/admin');
  } catch(err){ res.redirect('/admin'); }
});

// Serve receipts (admin only)
router.get('/voir-recu/:filename', requireAdmin, (req,res) => {
  const f = path.join(__dirname,'../public/recus',path.basename(req.params.filename));
  if (!require('fs').existsSync(f)) return res.status(404).send('Fichier introuvable');
  res.sendFile(f);
});

router.get('/logout', (req,res) => { req.session.adminAuth=false; res.redirect('/'); });

function renderAdmin(users, pdfs, msgCount, paidCount, error, generated) {
  const totalRevenue = paidCount * 3000;
  const pendingPayment = users.filter(u=>u.recu_url && !u.paye).length;

  return `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="theme-color" content="#060A14">
<title>🔐 Admin — NigerBac Tools 2026</title>
<script src="https://cdn.tailwindcss.com"></script>${CSS}
<style>
body{background:#060A14;}
.card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;}
.minp{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);color:white;border-radius:11px;padding:12px 14px;font-size:14px;width:100%;transition:all 0.3s;font-family:'Noto Sans',sans-serif;}
.minp:focus{border-color:#FF7518;outline:none;}
.minp::placeholder{color:rgba(255,255,255,0.3);}
.btn{background:linear-gradient(135deg,#FF7518,#FF4500);color:white;border:none;border-radius:10px;padding:12px 18px;font-family:'Syne',sans-serif;font-weight:700;cursor:pointer;font-size:13px;transition:all 0.2s;}
.btn:hover{transform:translateY(-1px);}
table{width:100%;border-collapse:collapse;}
th{padding:10px 12px;font-size:10px;color:rgba(255,255,255,0.35);font-family:'Syne',sans-serif;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid rgba(255,255,255,0.06);text-align:left;white-space:nowrap;}
td{padding:10px 12px;font-size:12px;border-bottom:1px solid rgba(255,255,255,0.04);vertical-align:middle;}
tr:hover td{background:rgba(255,255,255,0.015);}
.tab-btn{padding:8px 16px;border-radius:10px;font-family:'Syne',sans-serif;font-weight:700;font-size:12px;cursor:pointer;transition:all 0.2s;border:none;}
.tab-btn.on{background:rgba(255,117,24,0.15);color:#FF7518;border:1px solid rgba(255,117,24,0.3);}
.tab-btn:not(.on){background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.45);border:1px solid rgba(255,255,255,0.07);}
.tab-c{display:none;}.tab-c.on{display:block;}
::-webkit-scrollbar{width:4px;height:4px;}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px;}
.code-reveal{background:rgba(255,117,24,0.1);border:2px solid rgba(255,117,24,0.4);border-radius:14px;padding:18px;}
.bs{font-size:11px;padding:4px 10px;border-radius:6px;font-family:'Syne',sans-serif;font-weight:700;cursor:pointer;border:none;}
.bspaid{background:rgba(34,197,94,0.15);color:#86efac;border:1px solid rgba(34,197,94,0.3);}
.bswarn{background:rgba(234,179,8,0.15);color:#fde047;border:1px solid rgba(234,179,8,0.3);}
.bsdanger{background:rgba(220,38,38,0.15);color:#fca5a5;border:1px solid rgba(220,38,38,0.3);}
.wa-btn{background:linear-gradient(135deg,#25D366,#128C7E);color:white;border:none;border-radius:8px;padding:6px 10px;font-family:'Syne',sans-serif;font-weight:700;font-size:11px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:4px;}
.notif-badge{background:rgba(220,38,38,0.8);color:white;font-size:9px;font-weight:700;padding:1px 5px;border-radius:100px;font-family:'Space Mono',monospace;}
</style>
</head><body>

<div class="flag"></div>

<!-- Header -->
<header style="position:sticky;top:0;z-index:50;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;background:rgba(6,10,20,0.97);border-bottom:1px solid rgba(255,255,255,0.06);backdrop-filter:blur(20px);">
  <div style="display:flex;align-items:center;gap:10px;">
    <span style="font-size:1.3rem;">🇳🇪</span>
    <div><div class="ht" style="font-size:0.9rem;font-weight:800;color:white;line-height:1.1;">Admin Panel</div><div class="mono" style="font-size:9px;color:#FF7518;">NigerBac Tools 2026</div></div>
  </div>
  <div style="display:flex;gap:8px;">
    <a href="/" style="background:rgba(41,171,71,0.12);border:1px solid rgba(41,171,71,0.25);color:#86efac;padding:7px 12px;border-radius:9px;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;text-decoration:none;">🌐 Site</a>
    <a href="/admin/logout" style="background:rgba(220,38,38,0.12);border:1px solid rgba(220,38,38,0.25);color:#fca5a5;padding:7px 12px;border-radius:9px;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;text-decoration:none;">🚪</a>
  </div>
</header>

<div style="max-width:1100px;margin:0 auto;padding:18px;">

  ${error?`<div style="background:rgba(220,38,38,0.12);border:1px solid rgba(220,38,38,0.3);color:#fca5a5;border-radius:12px;padding:14px;margin-bottom:16px;font-size:13px;">❌ ${error}</div>`:''}

  ${generated?`
  <div class="code-reveal" style="margin-bottom:18px;">
    <div class="ht" style="color:#FF7518;font-weight:800;font-size:1rem;margin-bottom:10px;">✅ Code généré pour ${generated.user.prenom} ${generated.user.nom}</div>
    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:12px;">
      <div class="mono" style="font-size:2rem;font-weight:700;color:white;letter-spacing:0.15em;background:rgba(0,0,0,0.4);padding:10px 20px;border-radius:12px;">${generated.code}</div>
      <button onclick="navigator.clipboard.writeText('${generated.code}');this.textContent='✅ Copié!';setTimeout(()=>this.textContent='📋 Copier',2000);" class="btn">📋 Copier le code</button>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
      <a href="${generated.waLink}" target="_blank" class="wa-btn" style="font-size:13px;padding:10px 16px;">📲 Envoyer par WhatsApp</a>
      <span style="color:rgba(255,255,255,0.35);font-size:12px;font-family:'Space Mono',monospace;">${generated.user.telephone}</span>
    </div>
  </div>`:''}

  <!-- Stats Grid -->
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:18px;" class="sm:grid-cols-5">
    ${[
      ['👥','Inscrits',users.length,'#60A5FA'],
      ['💳','Payés',paidCount,'#34D399'],
      ['⏳','En attente',pendingPayment,'#FBBF24'],
      ['📄','PDFs',pdfs.length,'#A78BFA'],
      ['💰','Revenus',totalRevenue.toLocaleString('fr-FR')+' F','#F472B6'],
    ].map(([ic,lb,vl,cl])=>`
      <div class="card" style="padding:14px;">
        <div style="font-size:1.4rem;margin-bottom:5px;">${ic}</div>
        <div class="mono" style="font-size:1.15rem;font-weight:700;color:${cl};">${vl}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.35);font-family:'Syne',sans-serif;font-weight:600;">${lb}</div>
      </div>`).join('')}
  </div>

  <!-- Generate Code -->
  <div class="card" style="padding:18px;margin-bottom:16px;">
    <h2 class="ht" style="font-size:0.95rem;font-weight:800;margin-bottom:12px;color:white;">🔑 Générer un code d'accès & Activer</h2>
    <form method="POST" action="/admin/gen-code" style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;">
      <div style="flex:1;min-width:180px;">
        <label style="font-size:11px;color:rgba(255,255,255,0.35);display:block;margin-bottom:4px;">Numéro de téléphone de l'élève</label>
        <input name="telephone" type="tel" placeholder="Ex: 90123456" class="minp" required inputmode="numeric">
      </div>
      <button type="submit" class="btn">⚡ Générer & Activer</button>
    </form>
    <p style="color:rgba(255,255,255,0.2);font-size:11px;margin-top:8px;line-height:1.5;">Le code est généré automatiquement, l'accès activé, et le bouton WhatsApp apparaît pour l'envoyer directement à l'élève.</p>
  </div>

  <!-- Tabs -->
  <div style="display:flex;gap:8px;margin-bottom:14px;overflow-x:auto;padding-bottom:4px;">
    <button class="tab-btn on" onclick="showTab('users',this)">
      👥 Élèves (${users.length})
      ${pendingPayment>0?`<span class="notif-badge">${pendingPayment}</span>`:''}
    </button>
    <button class="tab-btn" onclick="showTab('pdfs',this)">📄 PDFs (${pdfs.length})</button>
    <button class="tab-btn" onclick="showTab('recus',this)">🖼️ Reçus ${pendingPayment>0?`<span class="notif-badge">${pendingPayment}</span>`:''}</button>
    <button class="tab-btn" onclick="showTab('stats',this)">📊 Stats</button>
  </div>

  <!-- USERS TAB -->
  <div id="tab-users" class="tab-c on">
    <div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap;">
      <input type="text" placeholder="🔍 Rechercher..." oninput="filterTbl('tbl-u',this.value)" class="minp" style="max-width:260px;padding:10px 14px;">
      <select onchange="filterTblCol('tbl-u',7,this.value)" class="minp" style="max-width:160px;padding:10px 14px;">
        <option value="">Tous les statuts</option>
        <option value="✅ Payé">✅ Payés</option>
        <option value="⏳">⏳ En attente</option>
      </select>
    </div>
    <div class="card" style="overflow-x:auto;">
      <table id="tbl-u">
        <thead><tr>
          <th>#</th><th>Nom & Prénom</th><th>Série</th><th>École</th><th>Ville</th>
          <th>Téléphone</th><th>Date</th><th>Statut</th><th>Code</th><th>Reçu</th><th>Actions</th>
        </tr></thead>
        <tbody>
          ${users.map((u,i)=>`<tr>
            <td class="mono" style="color:rgba(255,255,255,0.25);font-size:10px;">${i+1}</td>
            <td>
              <div class="ht" style="color:white;font-weight:700;font-size:12px;">${u.prenom} ${u.nom}</div>
              <div style="color:rgba(255,255,255,0.3);font-size:10px;">${u.date_naissance||'—'}</div>
            </td>
            <td><span style="font-size:11px;color:${u.serie==='Terminale D'?'#60A5FA':'#F472B6'};font-weight:600;">${u.serie==='Terminale D'?'D':'A'}</span></td>
            <td style="color:rgba(255,255,255,0.45);font-size:11px;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${u.ecole}</td>
            <td style="color:rgba(255,255,255,0.5);font-size:11px;">${u.ville}</td>
            <td class="mono" style="color:#60A5FA;font-size:11px;">${u.telephone}</td>
            <td class="mono" style="color:rgba(255,255,255,0.3);font-size:10px;">${new Date(u.inscrit_le).toLocaleDateString('fr-FR')}</td>
            <td>
              <form method="POST" action="/admin/toggle-paid/${u.id}" style="display:inline;">
                <button type="submit" class="bs ${u.paye?'bspaid':'bswarn'}">${u.paye?'✅ Payé':'⏳ Attente'}</button>
              </form>
            </td>
            <td>
              ${u.code_acces?`<span class="mono" style="font-size:11px;color:#FBBF24;background:rgba(251,191,36,0.1);padding:3px 8px;border-radius:6px;">${u.code_acces}</span>
              <button onclick="navigator.clipboard.writeText('${u.code_acces}')" style="background:none;border:none;cursor:pointer;font-size:11px;margin-left:2px;">📋</button>`:'<span style="color:rgba(255,255,255,0.15);font-size:10px;">—</span>'}
            </td>
            <td>
              ${u.recu_url?`<a href="/admin/voir-recu/${u.recu_url.split('/').pop()}" target="_blank" style="background:rgba(96,165,250,0.12);color:#60A5FA;border:1px solid rgba(96,165,250,0.25);padding:3px 8px;border-radius:6px;font-size:11px;text-decoration:none;font-family:'Syne';font-weight:700;">🖼️ Voir</a>`:'<span style="color:rgba(255,255,255,0.15);font-size:10px;">—</span>'}
            </td>
            <td>
              <div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;">
                ${u.telephone?`<a href="https://wa.me/${u.telephone.replace(/\D/,'')}?text=${encodeURIComponent('Bonjour '+u.prenom+', ton code NigerBac Tools 2026 : '+(u.code_acces||'(à générer)'))}'" target="_blank" class="wa-btn">📲</a>`:''}
                <form method="POST" action="/admin/delete/${u.id}" onsubmit="return confirm('Supprimer ${u.prenom} ${u.nom} définitivement ?')" style="display:inline;">
                  <button type="submit" class="bs bsdanger">🗑️</button>
                </form>
              </div>
            </td>
          </tr>`).join('')}
          ${users.length===0?'<tr><td colspan="11" style="text-align:center;color:rgba(255,255,255,0.2);padding:40px;">Aucun élève inscrit</td></tr>':''}
        </tbody>
      </table>
    </div>
  </div>

  <!-- PDFS TAB -->
  <div id="tab-pdfs" class="tab-c">
    <div class="card" style="overflow-x:auto;">
      <table>
        <thead><tr><th>#</th><th>Titre</th><th>Partagé par</th><th>Pages</th><th>Date</th></tr></thead>
        <tbody>
          ${pdfs.map((p,i)=>`<tr>
            <td class="mono" style="color:rgba(255,255,255,0.25);font-size:10px;">${i+1}</td>
            <td class="ht" style="color:white;font-weight:600;font-size:12px;">${p.title}</td>
            <td style="color:rgba(255,255,255,0.5);font-size:12px;">${p.users?.prenom||''} ${p.users?.nom||''}</td>
            <td class="mono" style="color:#A78BFA;font-size:12px;">${p.pages}</td>
            <td class="mono" style="color:rgba(255,255,255,0.3);font-size:10px;">${new Date(p.uploaded_at).toLocaleDateString('fr-FR')}</td>
          </tr>`).join('')}
          ${pdfs.length===0?'<tr><td colspan="5" style="text-align:center;color:rgba(255,255,255,0.2);padding:40px;">Aucun PDF</td></tr>':''}
        </tbody>
      </table>
    </div>
  </div>

  <!-- RECUS TAB -->
  <div id="tab-recus" class="tab-c">
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;">
      ${users.filter(u=>u.recu_url).map(u=>`
      <div class="card" style="padding:12px;text-align:center;">
        <a href="/admin/voir-recu/${u.recu_url.split('/').pop()}" target="_blank">
          <img src="${u.recu_url}" style="width:100%;border-radius:8px;margin-bottom:8px;max-height:120px;object-fit:cover;" onerror="this.style.display='none'">
        </a>
        <div class="ht" style="color:white;font-size:11px;font-weight:700;">${u.prenom} ${u.nom}</div>
        <div class="mono" style="color:rgba(255,255,255,0.35);font-size:10px;margin-top:2px;">${u.telephone}</div>
        <div style="margin-top:8px;display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">
          <form method="POST" action="/admin/toggle-paid/${u.id}" style="display:inline;">
            <button type="submit" class="bs ${u.paye?'bspaid':'bswarn'}">${u.paye?'✅':'⏳ Valider'}</button>
          </form>
          ${u.telephone?`<a href="https://wa.me/${u.telephone.replace(/\D/g,'')}?text=${encodeURIComponent('Bonjour '+u.prenom+', ton code NigerBac : '+(u.code_acces||'(à générer)'))}" target="_blank" class="wa-btn" style="font-size:10px;padding:4px 8px;">📲</a>`:''}
        </div>
      </div>`).join('')}
      ${users.filter(u=>u.recu_url).length===0?'<div style="text-align:center;color:rgba(255,255,255,0.2);padding:40px;grid-column:1/-1;">Aucun reçu téléversé</div>':''}
    </div>
  </div>

  <!-- STATS TAB -->
  <div id="tab-stats" class="tab-c">
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;">
      <div class="card" style="padding:18px;">
        <div class="ht" style="color:#60A5FA;font-weight:700;margin-bottom:12px;">📊 Par série</div>
        ${['Terminale D','Terminale A'].map(s=>{
          const n=users.filter(u=>u.serie===s).length;
          const pct=users.length>0?Math.round(n/users.length*100):0;
          return `<div style="margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px;">
              <span style="color:rgba(255,255,255,0.6);">${s}</span>
              <span class="mono" style="color:white;">${n} (${pct}%)</span>
            </div>
            <div style="background:rgba(255,255,255,0.08);border-radius:4px;height:6px;">
              <div style="background:${s==='Terminale D'?'#60A5FA':'#F472B6'};height:6px;border-radius:4px;width:${pct}%;"></div>
            </div>
          </div>`;
        }).join('')}
      </div>
      <div class="card" style="padding:18px;">
        <div class="ht" style="color:#34D399;font-weight:700;margin-bottom:12px;">💰 Revenus</div>
        <div class="mono" style="font-size:1.8rem;font-weight:700;color:#34D399;">${totalRevenue.toLocaleString('fr-FR')}</div>
        <div style="color:rgba(255,255,255,0.35);font-size:12px;margin-top:4px;">FCFA collectés</div>
        <div style="color:rgba(255,255,255,0.35);font-size:11px;margin-top:8px;">${paidCount} élèves × 3 000 FCFA</div>
      </div>
      <div class="card" style="padding:18px;">
        <div class="ht" style="color:#FF7518;font-weight:700;margin-bottom:12px;">🏙️ Top villes</div>
        ${Object.entries(users.reduce((a,u)=>{a[u.ville]=(a[u.ville]||0)+1;return a;},{})).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([v,n])=>`
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;">
            <span style="color:rgba(255,255,255,0.6);">${v}</span>
            <span class="mono" style="color:#FF7518;">${n}</span>
          </div>`).join('')||'<div style="color:rgba(255,255,255,0.2);font-size:12px;">Aucune donnée</div>'}
      </div>
    </div>
  </div>

</div>

<script>
function showTab(t,btn){
  document.querySelectorAll('.tab-c').forEach(c=>c.classList.remove('on'));
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('on'));
  document.getElementById('tab-'+t).classList.add('on');
  btn.classList.add('on');
}
function filterTbl(id,q){
  document.getElementById(id).querySelectorAll('tbody tr').forEach(r=>{
    r.style.display=r.textContent.toLowerCase().includes(q.toLowerCase())?'':'none';
  });
}
function filterTblCol(id,col,q){
  document.getElementById(id).querySelectorAll('tbody tr').forEach(r=>{
    if(!q){r.style.display='';return;}
    const cell=r.cells[col];
    r.style.display=cell&&cell.textContent.includes(q)?'':'none';
  });
}
</script>
</body></html>`;
}

module.exports = router;

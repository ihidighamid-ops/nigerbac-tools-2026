// routes/flamme.js - La Flamme Nigérienne
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const supabase = require('../db/supabase');
const { CSS, STARS_JS } = require('../utils/styles');

const storage = multer.diskStorage({
  destination: (req, file, cb) => { const d=path.join(__dirname,'../public/flamme'); if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true}); cb(null,d); },
  filename: (req, file, cb) => cb(null,'media-'+Date.now()+'-'+Math.random().toString(36).slice(2)+path.extname(file.originalname))
});
const upload = multer({
  storage,
  limits:{fileSize:15*1024*1024},
  fileFilter:(req,file,cb)=>{
    const ok=['.jpg','.jpeg','.png','.gif','.webp','.pdf'];
    if(ok.includes(path.extname(file.originalname).toLowerCase())) cb(null,true);
    else cb(new Error('Format non supporté'));
  }
});

function requireAuth(req,res,next){ if(!req.session.userId) return res.redirect('/connexion'); next(); }

// GET /flamme
router.get('/', requireAuth, async (req,res) => {
  try {
    const { data: user } = await supabase.from('users').select('*').eq('id',req.session.userId).single();
    if(!user){ req.session.destroy(); return res.redirect('/'); }
    const { data: messages } = await supabase.from('messages').select('*').order('envoye_le',{ascending:true}).limit(100);
    res.send(renderFlamme(user, messages||[]));
  } catch(err){ console.error(err); res.redirect('/dashboard'); }
});

// POST /flamme/send
router.post('/send', requireAuth, upload.single('media'), async (req,res) => {
  try {
    const { data: user } = await supabase.from('users').select('id,code_anonyme').eq('id',req.session.userId).single();
    if(!user) return res.redirect('/connexion');

    const { contenu } = req.body;
    const hasMedia = !!req.file;
    const hasText = contenu && contenu.trim().length > 0;
    if(!hasText && !hasMedia) return res.redirect('/flamme');

    const type = hasMedia ? (req.file.mimetype.startsWith('image/') ? 'image' : 'fichier') : 'texte';
    const mediaUrl = hasMedia ? '/flamme-media/' + req.file.filename : null;

    await supabase.from('messages').insert({
      user_id: user.id,
      code_anonyme: user.code_anonyme,
      contenu: hasText ? contenu.trim().slice(0, 1000) : '',
      type,
      media_url: mediaUrl
    });

    res.redirect('/flamme');
  } catch(err){ console.error(err); res.redirect('/flamme'); }
});

// GET /flamme/api - JSON pour polling
router.get('/api', requireAuth, async (req,res) => {
  try {
    const since = req.query.since || '1970-01-01';
    const { data: messages } = await supabase.from('messages').select('*').gt('envoye_le',since).order('envoye_le',{ascending:true}).limit(50);
    res.json({ messages: messages||[], time: new Date().toISOString() });
  } catch(err){ res.json({ messages:[], time: new Date().toISOString() }); }
});

function renderFlamme(user, messages) {
  const myCode = user.code_anonyme || 'ANONYME';
  const messagesHtml = messages.map(msg => {
    const isMe = msg.user_id === user.id;
    const t = new Date(msg.envoye_le);
    const timeStr = t.toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'});
    const dateStr = t.toLocaleDateString('fr-FR', {day:'2-digit',month:'2-digit'});

    let content = '';
    if (msg.type === 'image' && msg.media_url) {
      content = `<img src="${msg.media_url}" style="max-width:200px;max-height:200px;border-radius:10px;display:block;cursor:pointer;" onclick="window.open('${msg.media_url}','_blank')" onerror="this.parentElement.style.display='none'">`;
      if (msg.contenu) content += `<div style="margin-top:6px;font-size:14px;line-height:1.5;">${escapeHtml(msg.contenu)}</div>`;
    } else if (msg.type === 'fichier' && msg.media_url) {
      content = `<a href="${msg.media_url}" target="_blank" style="color:#60A5FA;text-decoration:none;font-size:13px;display:flex;align-items:center;gap:6px;">📄 Voir le fichier</a>`;
      if (msg.contenu) content += `<div style="margin-top:6px;font-size:14px;">${escapeHtml(msg.contenu)}</div>`;
    } else {
      content = `<div style="font-size:14px;line-height:1.6;word-break:break-word;">${escapeHtml(msg.contenu)}</div>`;
    }

    return `
    <div class="msg-row ${isMe?'me':''}" data-id="${msg.id}" data-time="${msg.envoye_le}">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;${isMe?'justify-content:flex-end':''}">
        <span style="font-family:'Space Mono',monospace;font-size:10px;font-weight:700;padding:2px 8px;border-radius:100px;background:${isMe?'rgba(255,117,24,0.25)':'rgba(255,255,255,0.08)'};color:${isMe?'#FF7518':'rgba(255,255,255,0.55)'};">${escapeHtml(msg.code_anonyme)}</span>
        <span style="font-size:10px;color:rgba(255,255,255,0.25);">${timeStr} ${dateStr}</span>
      </div>
      <div style="display:flex;${isMe?'justify-content:flex-end':''}">
        <div style="max-width:72%;background:${isMe?'linear-gradient(135deg,rgba(255,117,24,0.22),rgba(255,69,0,0.14))':'rgba(255,255,255,0.06)'};border:1px solid ${isMe?'rgba(255,117,24,0.28)':'rgba(255,255,255,0.09)'};border-radius:${isMe?'16px 4px 16px 16px':'4px 16px 16px 16px'};padding:10px 14px;">
          ${content}
        </div>
      </div>
    </div>`;
  }).join('');

  const lastTime = messages.length > 0 ? messages[messages.length-1].envoye_le : '1970-01-01';

  return `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
<meta name="theme-color" content="#080D1A">
<title>🔥 La Flamme Nigérienne</title>
<script src="https://cdn.tailwindcss.com"></script>${CSS}
<style>
body{height:100vh;height:100dvh;display:flex;flex-direction:column;overflow:hidden;background:#080D1A;}
.chat-header{flex-shrink:0;background:rgba(8,13,26,0.98);border-bottom:1px solid rgba(255,255,255,0.08);padding:12px 16px;display:flex;align-items:center;gap:12px;backdrop-filter:blur(20px);}
.chat-body{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:10px;}
.chat-body::-webkit-scrollbar{width:3px;}
.chat-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px;}
.chat-footer{flex-shrink:0;background:rgba(8,13,26,0.98);border-top:1px solid rgba(255,255,255,0.08);padding:10px 14px;backdrop-filter:blur(20px);}
.msg-row{display:flex;flex-direction:column;animation:msgIn 0.25s ease forwards;}
@keyframes msgIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
.chat-input{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:white;border-radius:14px;padding:12px 14px;flex:1;font-size:14px;font-family:'Noto Sans',sans-serif;resize:none;overflow-y:hidden;line-height:1.4;max-height:100px;transition:border-color 0.2s;}
.chat-input:focus{border-color:#FF7518;outline:none;}
.chat-input::placeholder{color:rgba(255,255,255,0.28);}
.btn-send{background:linear-gradient(135deg,#FF7518,#FF4500);color:white;border:none;border-radius:12px;padding:12px 14px;cursor:pointer;transition:all 0.2s;flex-shrink:0;}
.btn-send:hover{transform:scale(1.05);}
.btn-media{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.7);border-radius:12px;padding:12px;cursor:pointer;transition:all 0.2s;flex-shrink:0;}
.online-dot{width:7px;height:7px;border-radius:50%;background:#29AB47;box-shadow:0 0 6px #29AB47;animation:od 2s infinite;}
@keyframes od{0%,100%{box-shadow:0 0 0 0 rgba(41,171,71,0.5);}50%{box-shadow:0 0 0 5px rgba(41,171,71,0);}}
.media-preview{background:rgba(255,117,24,0.1);border:1px solid rgba(255,117,24,0.25);border-radius:10px;padding:8px 12px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;font-size:12px;color:#FF7518;}
.anon-rule{background:rgba(255,117,24,0.06);border:1px solid rgba(255,117,24,0.15);border-radius:12px;padding:10px 14px;font-size:12px;color:rgba(255,255,255,0.55);text-align:center;margin-bottom:10px;line-height:1.5;}
</style>
</head><body>
<div class="flag"></div>

<!-- Header -->
<div class="chat-header">
  <a href="/dashboard" style="color:rgba(255,255,255,0.45);font-size:1.1rem;text-decoration:none;flex-shrink:0;padding:4px;">←</a>
  <span style="font-size:1.5rem;flex-shrink:0;">🔥</span>
  <div style="flex:1;min-width:0;">
    <div class="ht" style="font-weight:800;color:white;font-size:0.95rem;line-height:1.2;">La Flamme Nigérienne</div>
    <div style="color:rgba(255,255,255,0.4);font-size:11px;display:flex;align-items:center;gap:5px;margin-top:1px;">
      <div class="online-dot"></div>
      Messagerie anonyme BAC 2026
    </div>
  </div>
  <div style="flex-shrink:0;text-align:right;">
    <div style="font-family:'Space Mono',monospace;font-size:11px;font-weight:700;color:#FF7518;background:rgba(255,117,24,0.15);border:1px solid rgba(255,117,24,0.3);padding:3px 10px;border-radius:100px;">${escapeHtml(myCode)}</div>
    <div style="color:rgba(255,255,255,0.25);font-size:9px;margin-top:2px;">Ton code</div>
  </div>
</div>

<!-- Messages -->
<div class="chat-body" id="chatBody">
  <div class="anon-rule">
    🔒 Zone <strong style="color:#FF7518;">100% anonyme</strong> — Partage librement cours, exercices, questions.<br>
    Personne ne connaît ton identité. Seul l'admin peut voir qui est qui.
  </div>

  ${messages.length === 0 ? `
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:rgba(255,255,255,0.3);padding:30px;">
    <div style="font-size:3rem;margin-bottom:10px;">🔥</div>
    <div class="ht" style="font-size:1rem;margin-bottom:6px;">Sois le premier !</div>
    <div style="font-size:13px;">Lance la conversation et partage tes ressources BAC</div>
  </div>` : messagesHtml}

  <div id="bottomAnchor" style="height:1px;"></div>
</div>

<!-- Input -->
<div class="chat-footer">
  <div id="mediaPreview" class="media-preview" style="display:none;">
    <span id="mediaName">📎 Fichier sélectionné</span>
    <button onclick="clearMedia()" style="background:none;border:none;color:#fca5a5;cursor:pointer;font-size:1rem;padding:0 4px;">✕</button>
  </div>
  <form method="POST" action="/flamme/send" enctype="multipart/form-data" id="chatForm" style="display:flex;gap:8px;align-items:flex-end;">
    <label for="mediaInput" class="btn-media" title="Envoyer image ou fichier">📎</label>
    <input type="file" id="mediaInput" name="media" accept="image/*,.pdf" style="display:none;" onchange="onMedia(this)">
    <textarea name="contenu" id="chatInput" class="chat-input" placeholder="Écris un message, partage un cours..." rows="1" oninput="autoGrow(this)" onkeydown="onKey(event)"></textarea>
    <button type="submit" class="btn-send">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
    </button>
  </form>
</div>

<script>
// Scroll to bottom
function scrollBottom(){const b=document.getElementById('bottomAnchor');if(b)b.scrollIntoView();}
scrollBottom();

// Auto-grow textarea
function autoGrow(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,100)+'px';}

// Send on Enter (Shift+Enter = newline)
function onKey(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();document.getElementById('chatForm').submit();}}

// Media
function onMedia(input){
  if(input.files&&input.files[0]){
    document.getElementById('mediaName').textContent='📎 '+input.files[0].name;
    document.getElementById('mediaPreview').style.display='flex';
  }
}
function clearMedia(){
  document.getElementById('mediaInput').value='';
  document.getElementById('mediaPreview').style.display='none';
}

// Polling every 8 seconds
let lastTime = '${escapeHtml(lastTime)}';
let polling = true;

async function pollMessages(){
  if(!polling) return;
  try {
    const r = await fetch('/flamme/api?since='+encodeURIComponent(lastTime));
    const data = await r.json();
    if(data.messages && data.messages.length > 0){
      const body = document.getElementById('chatBody');
      const anchor = document.getElementById('bottomAnchor');
      const wasAtBottom = body.scrollHeight - body.scrollTop - body.clientHeight < 100;
      data.messages.forEach(msg => {
        const isMe = ${user.id} === msg.user_id;
        const t = new Date(msg.envoye_le);
        const timeStr = t.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
        const dateStr = t.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'});
        let content = '';
        if(msg.type==='image'&&msg.media_url){
          content='<img src="'+msg.media_url+'" style="max-width:200px;max-height:200px;border-radius:10px;display:block;cursor:pointer;" onclick="window.open(this.src,\\'_blank\\')"><br>';
        } else if(msg.type==='fichier'&&msg.media_url){
          content='<a href="'+msg.media_url+'" target="_blank" style="color:#60A5FA;font-size:13px;">📄 Voir le fichier</a>';
        } else {
          content='<div style="font-size:14px;line-height:1.6;word-break:break-word;">'+msg.contenu.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>';
        }
        const div = document.createElement('div');
        div.className='msg-row'+(isMe?' me':'');
        div.dataset.id=msg.id;
        div.innerHTML='<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;'+(isMe?'justify-content:flex-end':'')+'"><span style="font-family:Space Mono,monospace;font-size:10px;font-weight:700;padding:2px 8px;border-radius:100px;background:'+(isMe?'rgba(255,117,24,0.25)':'rgba(255,255,255,0.08)')+';color:'+(isMe?'#FF7518':'rgba(255,255,255,0.55)')+';">'+msg.code_anonyme+'</span><span style="font-size:10px;color:rgba(255,255,255,0.25);">'+timeStr+' '+dateStr+'</span></div><div style="display:flex;'+(isMe?'justify-content:flex-end':'')+'"><div style="max-width:72%;background:'+(isMe?'linear-gradient(135deg,rgba(255,117,24,0.22),rgba(255,69,0,0.14))':'rgba(255,255,255,0.06)')+';border:1px solid '+(isMe?'rgba(255,117,24,0.28)':'rgba(255,255,255,0.09)')+';border-radius:'+(isMe?'16px 4px 16px 16px':'4px 16px 16px 16px')+';padding:10px 14px;">'+content+'</div></div>';
        body.insertBefore(div, anchor);
        lastTime = msg.envoye_le;
      });
      if(wasAtBottom) scrollBottom();
    }
  } catch(e){}
  setTimeout(pollMessages, 8000);
}
setTimeout(pollMessages, 8000);

// Visibility change - pause polling when hidden
document.addEventListener('visibilitychange',()=>{polling=!document.hidden;if(!document.hidden)pollMessages();});
</script>
</body></html>`;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

module.exports = router;

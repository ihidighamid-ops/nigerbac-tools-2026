// utils/styles.js - CSS commun à toutes les pages
const CSS = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&family=Noto+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:'Noto Sans',sans-serif;background:#080D1A;min-height:100vh;color:white;}
.ht{font-family:'Syne',sans-serif;}
.mono{font-family:'Space Mono',monospace;}
.flag{background:linear-gradient(90deg,#FF7518 33.3%,#FFFFFF 33.3%,#FFFFFF 66.6%,#29AB47 66.6%);height:5px;width:100%;}

/* Glass card */
.glass{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:20px;backdrop-filter:blur(10px);}

/* Inputs */
.inp{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);color:white;border-radius:12px;padding:14px 16px;width:100%;font-size:14px;font-family:'Noto Sans',sans-serif;transition:all 0.3s;-webkit-appearance:none;}
.inp:focus{border-color:#FF7518;outline:none;background:rgba(255,255,255,0.1);box-shadow:0 0 0 3px rgba(255,117,24,0.15);}
.inp::placeholder{color:rgba(255,255,255,0.3);}
select.inp option{background:#1a1f35;color:white;}

/* Buttons */
.btn-orange{background:linear-gradient(135deg,#FF7518,#FF4500);color:white;border:none;border-radius:14px;padding:15px 24px;font-family:'Syne',sans-serif;font-weight:700;font-size:15px;cursor:pointer;width:100%;transition:all 0.3s;letter-spacing:0.02em;-webkit-tap-highlight-color:transparent;}
.btn-orange:hover,.btn-orange:active{transform:translateY(-2px);box-shadow:0 8px 25px rgba(255,117,24,0.4);}
.btn-green{background:linear-gradient(135deg,#29AB47,#1a7a32);color:white;border:none;border-radius:14px;padding:15px 24px;font-family:'Syne',sans-serif;font-weight:700;font-size:15px;cursor:pointer;width:100%;transition:all 0.3s;}
.btn-green:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(41,171,71,0.4);}

/* Alerts */
.err{background:rgba(220,38,38,0.12);border:1px solid rgba(220,38,38,0.3);color:#fca5a5;border-radius:12px;padding:14px 16px;font-size:13px;margin-bottom:16px;line-height:1.5;}
.suc{background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.3);color:#86efac;border-radius:12px;padding:14px 16px;font-size:13px;margin-bottom:16px;line-height:1.5;}
.info{background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.3);color:#93c5fd;border-radius:12px;padding:14px 16px;font-size:13px;margin-bottom:16px;}

/* Label */
.label{color:rgba(255,255,255,0.5);font-size:12px;margin-bottom:6px;display:block;font-weight:600;letter-spacing:0.02em;}

/* Stars background */
.stars-bg{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;overflow:hidden;}
.star{position:absolute;background:white;border-radius:50%;animation:twinkle linear infinite;}
@keyframes twinkle{0%,100%{opacity:0.06;}50%{opacity:0.45;}}

/* Animations */
@keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
@keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,117,24,0.4);}70%{box-shadow:0 0 0 16px rgba(255,117,24,0);}}
@keyframes glow{0%,100%{box-shadow:0 0 12px rgba(255,117,24,0.3);}50%{box-shadow:0 0 28px rgba(255,117,24,0.7);}}
@keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1;}100%{transform:translateY(110vh) rotate(720deg);opacity:0;}}

.fadeUp{animation:fadeUp 0.5s ease forwards;}
.float{animation:float 3s ease-in-out infinite;}
.pulse{animation:pulse 2s infinite;}
.glow{animation:glow 2s infinite;}

/* Scrollbar */
::-webkit-scrollbar{width:5px;height:5px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:3px;}

/* Mobile tap */
button,a{-webkit-tap-highlight-color:transparent;}
</style>`;

// Stars JS
const STARS_JS = `
<script>
(function(){
  const c=document.getElementById('stars');
  if(!c)return;
  for(let i=0;i<60;i++){
    const s=document.createElement('div');
    s.className='star';
    const sz=Math.random()*2+0.5;
    s.style.cssText='width:'+sz+'px;height:'+sz+'px;top:'+Math.random()*100+'%;left:'+Math.random()*100+'%;animation-duration:'+(2+Math.random()*5)+'s;animation-delay:'+Math.random()*5+'s;';
    c.appendChild(s);
  }
})();
</script>`;

module.exports = { CSS, STARS_JS };

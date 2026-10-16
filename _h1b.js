const fs=require('fs');
const p='appweb/index.html';
let h=fs.readFileSync(p,'utf8');
const oldH1='<h1><span class="hero-line1">Enverrais-tu</span><br><span class="hero-line2 blue">1 $</span><span class="hero-line3"> à un inconnu</span><span class="blue"> ?</span></h1>';
const newH1='<h1><span class="hero-line1">Enverrais-tu</span><br><span class="blue">1 $ à un inconnu ?</span></h1>';
if(h.indexOf(oldH1)<0)throw new Error('nf');
h=h.replace(oldH1,newH1);
// EN: h1L2 will be "$1", h1L3 " to a stranger", h1L4 " ?" -> line2 = h1L2+h1L3+h1L4 in the single blue span; line1 = h1L1
const oldEn="if(h1){var s=h1.querySelectorAll('span');if(s[0])s[0].textContent=D.h1L1||'';if(s[1])s[1].textContent=D.h1L2||'';if(s[2])s[2].textContent=D.h1L3||'';var br=h1.querySelector('br');if(lang==='en'&&!br){h1.innerHTML=s[0].outerHTML+'<br>'+s[1].outerHTML+s[2].outerHTML+s[3].outerHTML;}if(s[3])s[3].textContent=D.h1L4||'';}";
const newEn="if(h1){var s=h1.querySelectorAll('span');if(s[0])s[0].textContent=D.h1L1||'';if(s[1])s[1].textContent=[D.h1L2,D.h1L3,D.h1L4].filter(Boolean).join('');}";
if(h.indexOf(oldEn)<0)throw new Error('en nf');
h=h.replace(oldEn,newEn);
fs.writeFileSync(p,h);
console.log('ok');

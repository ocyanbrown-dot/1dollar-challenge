const fs=require('fs');
const p='appweb/index.html';
let h=fs.readFileSync(p,'utf8');
const oldH1='<h1><span class="hero-line1">Enverrais-tu</span> <span class="hero-line2 blue">1 $</span> à un inconnu<span class="blue"> ?</span></h1>';
const newH1='<h1><span class="hero-line1">Enverrais-tu</span><br><span class="hero-line2 blue">1 $</span><span class="hero-line3"> à un inconnu</span><span class="blue"> ?</span></h1>';
if(h.indexOf(oldH1)<0)throw new Error('h1 not found');
h=h.replace(oldH1,newH1);
// EN h1: add <br> after $1 for consistent 2-line layout
const enOld="if(s[1])s[1].textContent=D.h1L2||'';if(s[2])s[2].textContent=D.h1L3||'';";
const enNew="if(s[1])s[1].textContent=D.h1L2||'';if(s[2])s[2].textContent=D.h1L3||'';var br=h1.querySelector('br');if(lang==='en'&&!br){h1.innerHTML=s[0].outerHTML+'<br>'+s[1].outerHTML+s[2].outerHTML+s[3].outerHTML;}";
if(h.indexOf(enOld)<0)throw new Error('en h1 pattern not found');
h=h.replace(enOld,enNew);
fs.writeFileSync(p,h);
console.log('h1 fixed');

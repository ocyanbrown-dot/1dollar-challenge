const fs=require('fs');
const p='appweb/index.html';
let h=fs.readFileSync(p,'utf8');
let a="(D.s2h2||')+'</em>'";
let b="(D.s2h2||'')+'</em>'";
if(h.indexOf(a)<0)throw new Error('nf');
h=h.replace(a,b);
fs.writeFileSync(p,h);
console.log('ok');

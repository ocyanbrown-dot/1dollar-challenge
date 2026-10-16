const fs=require('fs');
const p='appweb/index.html';
let h=fs.readFileSync(p,'utf8');
let a="(D.s2h2||')+'</em>'";
let b="(D.s2h2||'')+'</em>'";
let n=0;
while(h.indexOf(a)>=0){ h=h.replace(a,b); n++; }
fs.writeFileSync(p,h);
console.log('replaced',n);

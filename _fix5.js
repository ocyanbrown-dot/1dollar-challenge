const fs=require('fs');
const p='appweb/index.html';
let h=fs.readFileSync(p,'utf8');
let a="L()==='en'?'The share didn't go through.':'Le partage n'a pas abouti.'";
let b="L()==='en'?'The share didn\\u2019t go through.':'Le partage n\\u2019a pas abouti.'";
if(h.indexOf(a)<0)throw new Error('nf');
h=h.replace(a,b);
fs.writeFileSync(p,h);
console.log('ok');

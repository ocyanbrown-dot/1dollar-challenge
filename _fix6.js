const fs=require('fs');
const p='appweb/index.html';
let h=fs.readFileSync(p,'utf8');
// find all "n'a" inside single-quoted EN-branch-ish strings (the FR branch of ternaries)
// The safe fix: replace every "n'a" that appears right after a single quote context within the main script
let count=0;
h=h.replace(/n'a pas/g,"n\\u2019a pas",()=>{count++;return "n\u2019a pas"});
// simpler: global replace of the specific known strings
const subs=[
 ["'Le partage n'a pas abouti.'","'Le partage n\\u2019a pas abouti.'"],
 ["'Paiement annulé. Aucun dollar n'a été envoyé.'","'Paiement annulé. Aucun dollar n\\u2019a été envoyé.'"],
];
for(const [a,b] of subs){ if(h.includes(a)){h=h.split(a).join(b);count++;} }
fs.writeFileSync(p,h);
console.log('replaced',count);

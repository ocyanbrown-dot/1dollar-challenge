const fs=require('fs');
const p='appweb/index.html';
let h=fs.readFileSync(p,'utf8');
// fix the mangled money line
let bad="const money=n=>Number(n||0).toLocaleString(L()==='en'?'en-CA':'fr-CA',{maximumFractionDigits:2})+' =money(d.totalIn);";
// find actual
const i=h.indexOf("const money=n=>");
console.log('found at',i);
console.log(JSON.stringify(h.slice(i,i+180)));

const fs=require('fs');
const p='appweb/index.html';
let h=fs.readFileSync(p,'utf8');
const bad="const money=n=>Number(n||0).toLocaleString(L()==='en'?'en-CA':'fr-CA',{maximumFractionDigits:2})+' $('totalIn').textContent";
const good="const money=n=>Number(n||0).toLocaleString(L()==='en'?'en-CA':'fr-CA',{maximumFractionDigits:2})+' $';$('totalIn').textContent";
if(h.indexOf(bad)<0)throw new Error('pattern not found');
h=h.replace(bad,good);
fs.writeFileSync(p,h);
console.log('fixed');

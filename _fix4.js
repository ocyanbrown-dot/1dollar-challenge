const fs=require('fs');
const p='appweb/index.html';
let h=fs.readFileSync(p,'utf8');
// 1) missing semicolon
let a="money(d.totalIn)$('totalRefunded')";
if(h.indexOf(a)>=0) h=h.replace(a,"money(d.totalIn);$('totalRefunded')");
// 2) i18n the ratio caption (FR hard-coded still)
let b="$('ratioCaption').textContent=percent.toLocaleString('fr-CA',{maximumFractionDigits:1})+' % des participations ont atteint trois partages';";
let c="$('ratioCaption').textContent=L()==='en'?percent.toLocaleString('en-CA',{maximumFractionDigits:1})+' % of takes reached three shares':percent.toLocaleString('fr-CA',{maximumFractionDigits:1})+' % des participations ont atteint trois partages';";
if(h.indexOf(b)>=0) h=h.replace(b,c);
fs.writeFileSync(p,h);
console.log('done');

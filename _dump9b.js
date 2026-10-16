const fs=require('fs');
const h=fs.readFileSync('appweb/index.html','utf8');
const m=h.match(/<script>([\s\S]*?)<\/script>/);
const s=m[1];
const lines=s.split('\n');
const l=lines[8];
const i=l.indexOf('totalRefunded');
console.log(JSON.stringify(l.slice(i-60,i+80)));
console.log(JSON.stringify(l.slice(i-120,i)));

const fs=require('fs');
const h=fs.readFileSync('appweb/index.html','utf8');
const m=h.match(/<script>([\s\S]*?)<\/script>/);
const s=m[1];
const lines=s.split('\n');
console.log(JSON.stringify(lines[8]));

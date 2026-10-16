const fs=require('fs');
const h=fs.readFileSync('appweb/index.html','utf8');
const m=h.match(/<script>([\s\S]*?)<\/script>/);
const s=m[1];
const lines=s.split('\n');
const l=lines[11];
// find apostrophe issues: look for "didn't" pattern
const i=l.indexOf("didn't");
console.log('didn at',i, JSON.stringify(l.slice(i-80,i+40)));

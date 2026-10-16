const fs=require('fs');
const h=fs.readFileSync('appweb/index.html','utf8');
const m=h.match(/<script>([\s\S]*?)<\/script>/);
const s=m[1];
// binary search for the first line range that fails
const lines=s.split('\n');
function ok(n){ try{ new (require('vm').Script)(lines.slice(0,n).join('\n')); return true }catch(e){ return /unexpected end|unexpected eof/i.test(e.message)?false:false } }
let lo=1,hi=lines.length;
// find first failing prefix
let firstFail=-1;
for(let i=1;i<=lines.length;i++){ try{ new (require('vm').Script)(lines.slice(0,i).join('\n')); }catch(e){ if(!/unexpected end|unexpected eof/i.test(e.message)){ firstFail=i; break; } } }
console.log('first hard fail at line',firstFail);
if(firstFail>0){ for(let i=Math.max(1,firstFail-4);i<=Math.min(lines.length,firstFail+2);i++) console.log(i,':',JSON.stringify(lines[i-1].slice(0,160))); }

const fs=require('fs');
const h=fs.readFileSync('appweb/index.html','utf8');
const scripts=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const s=scripts[1];
const lines=s.split('\n');
const vm=require('vm');
for(let i=1;i<=lines.length;i++){
  try{ new vm.Script(lines.slice(0,i).join('\n')); }
  catch(e){ if(!/unexpected end|unexpected eof/i.test(e.message)){ console.log('fail line',i); console.log(lines[i-1].slice(0,300)); break; } }
}

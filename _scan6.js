const fs=require('fs');
const h=fs.readFileSync('appweb/index.html','utf8');
const scripts=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const vm=require('vm');
scripts.forEach((s,i)=>{
 const lines=s.split('\n');
 for(let k=1;k<=lines.length;k++){
  try{ new vm.Script(lines.slice(0,k).join('\n')); }
  catch(e){ if(!/unexpected end|unexpected eof/i.test(e.message)){ console.log('script',i,'fail line',k); console.log(lines[k-1].slice(0,260)); return; } }
 }
 console.log('script',i,'fully OK');
});

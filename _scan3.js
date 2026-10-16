const fs=require('fs');
const h=fs.readFileSync('appweb/index.html','utf8');
const m=h.match(/<script>([\s\S]*?)<\/script>/);
const s=m[1];
const vm=require('vm');
const lines=s.split('\n');
let firstFail=-1;
for(let i=1;i<=lines.length;i++){
  try{ new vm.Script(lines.slice(0,i).join('\n')); }
  catch(e){ if(!/unexpected end|unexpected eof/i.test(e.message)){ firstFail=i; break; } }
}
console.log('first fail line',firstFail);
const l=lines[firstFail-1];
console.log(l.slice(0,600));

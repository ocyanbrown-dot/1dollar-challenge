const fs=require('fs');
const h=fs.readFileSync('appweb/index.html','utf8');
const m=h.match(/<script>([\s\S]*?)<\/script>/);
const s=m[1];
const vm=require('vm');
// binary search first hard-failing prefix
const lines=s.split('\n');
let firstFail=-1;
for(let i=1;i<=lines.length;i++){
  try{ new vm.Script(lines.slice(0,i).join('\n')); }
  catch(e){ if(!/unexpected end|unexpected eof/i.test(e.message)){ firstFail=i; break; } }
}
console.log('first fail line',firstFail,'total',lines.length);
if(firstFail>0){
  const l=lines[firstFail-1];
  // scan for suspicious patterns in the whole failing line
  const re=/\+\s*'[^$]*'\s*\$\(/g;
  let mm;
  while((mm=re.exec(l))!==null){ console.log('SUSPICIOUS at',mm.index,JSON.stringify(l.slice(mm.index-40,mm.index+60))); }
  console.log('LEN',l.length);
}

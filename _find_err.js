const fs=require('fs');
const h=fs.readFileSync('appweb/index.html','utf8');
const m=h.match(/<script>([\s\S]*?)<\/script>/);
const s=m[1];
const vm=require('vm');
try{ new vm.Script(s); }catch(e){
  const line=String(e.stack).split('\n').slice(0,3).join('\n');
  console.log(e.message);
  // find position
  const mm=e.stack.match(/<anonymous>:(\d+):(\d+)/);
  if(mm){ const ln=parseInt(mm[1]),col=parseInt(mm[2]); const lines=s.split('\n'); console.log('line',ln,'col',col); console.log(JSON.stringify(lines[ln-1].slice(Math.max(0,col-80),col+80))); }
}

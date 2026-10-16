const fs=require('fs');
const h=fs.readFileSync('appweb/index.html','utf8');
const m=h.match(/<script>([\s\S]*?)<\/script>/);
const s=m[1];
const lines=s.split('\n');
const l=lines[8];
// check quote balance
let inS=false,inD=false;
for(let i=0;i<l.length;i++){
  const c=l[i];
  if(c==="'"&&!inD)inS=!inS;
  else if(c==='"'&&!inS)inD=!inD;
}
console.log('end states single=',inS,'double=',inD);
// find position of every $ ( that is not preceded by ) or ; or { or , or = or ( or space? we want string-terminus issues
// Instead: print segments around each " + '"
const re=/\+\s*'[^']*'/g;
let mm;let n=0;
while((mm=re.exec(l))!==null){ n++; }
console.log('string concat count',n);
// print full line
console.log(l);

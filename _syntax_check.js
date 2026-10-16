const fs=require('fs');
const h=fs.readFileSync('appweb/index.html','utf8');
const scripts=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const vm=require('vm');
for(let i=0;i<scripts.length;i++){
  try{ new vm.Script(scripts[i]); console.log('script',i,'OK',scripts[i].length,'chars'); }
  catch(e){ console.log('script',i,'SYNTAX ERROR:',e.message); process.exit(1);}
}
// quick id check
const ids=['langToggle','heroPips','heroStamp','shareMsg','refundNote','myPips','ratioCaption','paidBanner','totalIn'];
for(const id of ids){ if(h.indexOf('id="'+id+'"')<0) console.log('MISSING id',id); }
console.log('all checks done');

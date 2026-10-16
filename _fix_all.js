const fs=require('fs');
const p='appweb/index.html';
let h=fs.readFileSync(p,'utf8');
const ids=['totalIn','totalRefunded','netKept','activeCodes','totalShares','ratioFill','ratioCaption','heroSerial','payBtn','joinError','emailInput','myPips','shareMsg','shareBtn','refundNote','heroStamp','heroPips','heroTicket','navPlay','joinBtn','footerPlay','closeModal','cancelBtn','doneBtn','modalOverlay','year','paidBanner','codeDisplay','copyBtn','unsubscribeLink','modalTitle','successBox','joinView','joinForm','langToggle'];
let count=0;
for(const id of ids){
  const bad=")+' $('+"+id+")";
  const good=")+' $';$('"+id+")";
  let idx;
  while((idx=h.indexOf(bad))>=0){ h=h.slice(0,idx)+good+h.slice(idx+bad.length); count++; }
}
fs.writeFileSync(p,h);
console.log('fixed',count,'occurrences');

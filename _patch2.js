const fs=require('fs');
const p='appweb/index.html';
let h=fs.readFileSync(p,'utf8');
const before=h.length;
// fix L() ordering: define it right after currentCode decl so all closures work
h=h.replace("window.__dcShares=function(){return shares};","window.__dcShares=function(){return shares};const L=()=>window._getLang?window._getLang():'fr';");
// remove later duplicate const L declarations inside updateStats
h=h.replace("const L=()=>window._getLang?window._getLang():'fr';const money=n=>","const money=n=>");
h=h.replace("function renderSuccess(code){if(!code)return;","function renderSuccess(code){if(!code)return;");
// remove duplicate L() from api() (it's fine, but const in function scope is ok) - keep
fs.writeFileSync(p,h);
console.log('ok',before,h.length);

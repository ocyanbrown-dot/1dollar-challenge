const fs=require('fs');
const p='appweb/index.html';
let h=fs.readFileSync(p,'utf8');
// find the h1 in the file
const i=h.indexOf('<h1>');
console.log(JSON.stringify(h.slice(i,i+220)));

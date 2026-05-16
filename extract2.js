const fs = require('fs');
const appJsPath = 'C:\\\\Users\\\\user\\\\Desktop\\\\Code\\\\citric ostatka bot\\\\app.js';
let appJs = fs.readFileSync(appJsPath, 'utf8');

const xlsx = require('xlsx');
const workbook = xlsx.readFile('C:\\\\Users\\\\user\\\\Desktop\\\\exce.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, {header: 1});
const products = [];

data.forEach(row => {
  if(row[0] && typeof row[0] === 'string') {
     products.push(row[0].trim());
  }
});

const formattedProducts = products.map((p, i) => `  { id: ${i+1}, name: '${p.replace(/'/g, "\\\\'")}', unit: 'dona' }`).join(',\\n');
const startIndex = appJs.indexOf('const PRODUCTS = [');
const endIndex = appJs.indexOf('];', startIndex) + 2;

const newAppJs = appJs.slice(0, startIndex) + 'const PRODUCTS = [\\n' + formattedProducts + '\\n];' + appJs.slice(endIndex);
fs.writeFileSync(appJsPath, newAppJs);
console.log('Done, length: ' + products.length);

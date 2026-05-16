const fs = require('fs');
const xlsx = require('xlsx');

const workbook = xlsx.readFile('C:\\\\Users\\\\user\\\\Desktop\\\\exce.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, {header: 1});

let count = 1;
const lines = [];

data.forEach(row => {
  if(row[0] && typeof row[0] === 'string') {
     lines.push(`// ${count}. ${row[0].trim()}`);
     count++;
  }
});

fs.writeFileSync('C:\\\\Users\\\\user\\\\Desktop\\\\Code\\\\citric ostatka bot\\\\citric tovarlar.txt', lines.join('\\n'));
console.log('Done!');

const fs = require('fs');
const code = fs.readFileSync('app.js', 'utf8');

try {
  new Function(code);
  console.log("No syntax errors");
} catch(e) {
  console.log("Global Syntax Error:", e.message);
  const lines = code.split('\\n');
  for (let i = 0; i < lines.length; i++) {
    try {
      new Function(lines[i]);
    } catch(err) {
      if (err.message !== 'Unexpected token }' && err.message !== 'Unexpected token )' && !err.message.includes('Unexpected identifier') && !err.message.includes('Unexpected token \\']\\'') && !err.message.includes('Unexpected string')) {
        console.log(`Line ${i+1}: ${err.message} -> ${lines[i]}`);
      }
    }
  }
}

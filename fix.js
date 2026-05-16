const fs = require('fs');

let b = fs.readFileSync('app_bottom.js', 'utf8');

// We just replace the broken line.
// The broken line in app_bottom is probably: alert('Iltimos, miqdorni to'g'ri kiriting');
b = b.replace("alert('Iltimos, miqdorni to'g'ri kiriting');", "alert('Iltimos, miqdorni to\\'g\\'ri kiriting');");

fs.writeFileSync('app_bottom.js', b);
console.log('Fixed app_bottom.js');

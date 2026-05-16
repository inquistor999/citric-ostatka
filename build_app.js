const fs = require('fs');
const xlsx = require('xlsx');

try {
    // 1. Read Excel
    const workbook = xlsx.readFile('C:\\Users\\user\\Desktop\\exce.xlsx');
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, {header: 1});

    let idCount = 1;
    const products = [];

    data.forEach(row => {
        if (row[0] && typeof row[0] === 'string') {
            // Escape backslashes first, then single quotes
            const safeName = row[0].trim()
                .replace(/\\/g, '\\\\')
                .replace(/'/g, "\\'");
            products.push(`  { id: ${idCount}, name: '${safeName}', unit: 'kg' }`);
            idCount++;
        }
    });

    // 2. Prepare the parts
    const productsArrayCode = `const PRODUCTS = [\n${products.join(',\n')}\n];\n\nlet selectedItems = [];\n\n`;

    // 3. Read the logic from app_bottom.js
    if (!fs.existsSync('app_bottom.js')) {
        console.error('app_bottom.js not found!');
        process.exit(1);
    }
    const bottomLogic = fs.readFileSync('app_bottom.js', 'utf8');

    // 4. Combine and write to public/app.js
    const finalCode = productsArrayCode + bottomLogic;
    fs.writeFileSync('public/app.js', finalCode, 'utf8');

    console.log(`Successfully rebuilt app.js with ${products.length} products.`);
} catch (error) {
    console.error('Error rebuilding app.js:', error);
}

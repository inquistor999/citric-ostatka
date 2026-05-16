require('dotenv').config();
const { Telegraf } = require('telegraf');
const express = require('express');
const path = require('path');
const ExcelJS = require('exceljs');

const bot = new Telegraf(process.env.BOT_TOKEN);

// /start command sends Web App button
bot.start((ctx) => {
  const webAppUrl = process.env.WEBAPP_URL || 'http://localhost:3000';
  ctx.reply('Citric Ostatka botiga hush kelibsiz!\nQuyidagi Web App orqali mahsulotlarni kuzating.', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Ostatka Web App', web_app: { url: webAppUrl } }]
      ]
    }
  });
});

// Express server to serve front‑end and handle Excel generation
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/health', (req, res) => res.send('OK'));

// Local development: use long polling instead of webhooks
const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

if (isVercel) {
  const webhookPath = '/api/bot';
  const url = process.env.WEBAPP_URL;
  if (url) {
    bot.telegram.setWebhook(`${url}${webhookPath}`).catch(err => {
      console.error('Error setting webhook:', err);
    });
  }
  app.use(bot.webhookCallback(webhookPath));
} else {
  bot.launch().then(() => console.log('Bot started with polling.'));
}

// Enable graceful stop (only for local)
if (!isVercel) {
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

// Endpoint to receive stock data and send Excel file to user
app.post('/export', async (req, res) => {
  const { chat_id, items } = req.body; // items: [{name, quantity, comment}]
  if (!chat_id || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ostatka');

    // Add header row
    const headerRow = worksheet.addRow(['Mahsulot', 'Qoldiq miqdori', 'Izoh']);
    
    // Style header row
    headerRow.eachCell((cell) => {
      cell.font = {
        name: 'Arial',
        size: 16,
        bold: true,
        color: { argb: 'FFFFFFFF' } // White
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2C3E50' } // Dark blue/grey
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    headerRow.height = 30;

    // Add data rows
    items.forEach((it) => {
      const row = worksheet.addRow([it.name, it.quantity, it.comment || '']);
      row.eachCell((cell, colNumber) => {
        cell.font = {
          name: 'Arial',
          size: 14
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: colNumber === 2 ? 'center' : 'left' // Center quantity, left for others
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      row.height = 25;
    });

    // Set column widths
    worksheet.getColumn(1).width = 50; // Mahsulot
    worksheet.getColumn(2).width = 20; // Qoldiq miqdori
    worksheet.getColumn(3).width = 40; // Izoh

    // Write to buffer
    const buf = await workbook.xlsx.writeBuffer();

    // Send document via Telegram bot
    await bot.telegram.sendDocument(chat_id, { source: buf, filename: 'ostatka.xlsx' });
    res.json({ status: 'sent' });
  } catch (e) {
    console.error('Export error:', e);
    res.status(500).json({ error: 'Failed to generate/send file' });
  }
});

// Start web server (only if not on Vercel)
if (!isVercel) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Web app listening on http://localhost:${PORT}`);
  });
}

module.exports = app;

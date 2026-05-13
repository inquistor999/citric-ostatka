require('dotenv').config();
const { Telegraf } = require('telegraf');
const express = require('express');
const path = require('path');
const XLSX = require('xlsx');

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
app.use(express.static(path.join(__dirname, '../')));

// Local development: use long polling instead of webhooks
const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

if (isVercel) {
  const webhookPath = '/api/bot';
  bot.telegram.setWebhook(`${process.env.WEBAPP_URL}${webhookPath}`);
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

  // Build worksheet data
  const wsData = [
    ['Mahsulot', 'Qoldiq miqdori', 'Izoh'],
    ...items.map((it) => [it.name, it.quantity, it.comment || '']),
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Ostatka');

  // Write workbook to buffer
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  // Send document via Telegram bot
  try {
    await bot.telegram.sendDocument(chat_id, { source: buf, filename: 'ostatka.xlsx' });
    res.json({ status: 'sent' });
  } catch (e) {
    console.error('Telegram send error:', e);
    res.status(500).json({ error: 'Failed to send file' });
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

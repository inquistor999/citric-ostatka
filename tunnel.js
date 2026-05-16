const localtunnel = require('localtunnel');
const { spawn } = require('child_process');

const PORT = 3000;

// 1. Start the server
const server = spawn('node', ['api/index.js'], { stdio: 'inherit' });

// 2. Start the tunnel
(async () => {
  try {
    const tunnel = await localtunnel({ port: PORT });
    console.log('\n\x1b[32m%s\x1b[0m', `Tunnel opened at: ${tunnel.url}`);
    console.log('\x1b[33m%s\x1b[0m', `1. .env faylidagi WEBAPP_URL ni ushbu manzilga almashtiring.`);
    console.log('\x1b[33m%s\x1b[0m', `2. Botga /start buyrug'ini yuboring va ochilgan tugmani bosing.`);
    
    tunnel.on('close', () => {
      console.log('Tunnel closed');
    });
  } catch (e) {
    console.error('Tunnel error:', e);
  }
})();

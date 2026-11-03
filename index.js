require('dotenv').config();

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
});

async function start() {
  try {
    const { startBot } = require('./src/bot');
    await startBot();
    console.log('[ZMB] Bot started.');
  } catch (error) {
    console.error('[ZMB] Bot startup failed:', error);
  }

  if (process.env.DASHBOARD_ENABLED === 'true') {
    try {
      const { startDashboard } = require('./src/dashboard/server');
      await startDashboard();
    } catch (error) {
      console.error('[Dashboard] Startup failed:', error);
    }
  }
}

start();
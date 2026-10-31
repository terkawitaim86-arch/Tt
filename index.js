require('dotenv').config();

const { startBot } = require('./src/bot');

// Process-level error handlers — log everything, never crash silently
process.on('uncaughtException', (err, origin) => {
  console.error('[FATAL] Uncaught Exception:');
  console.error('  Error:', err.message);
  console.error('  Stack:', err.stack);
  console.error('  Origin:', origin);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Promise Rejection:');
  console.error('  Reason:', reason);
  if (reason && reason.stack) console.error('  Stack:', reason.stack);
});

process.on('SIGTERM', () => {
  console.log('[Process] SIGTERM received — process is being terminated by the environment.');
});

process.on('SIGINT', () => {
  console.log('[Process] SIGINT received — process is being interrupted.');
});

startBot();

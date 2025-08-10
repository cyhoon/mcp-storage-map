import { startServer } from './server.js';

startServer().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

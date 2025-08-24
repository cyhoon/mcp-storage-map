import { startServer } from './server.js';

startServer()
  .then(() => {
    process.stdin.resume();
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

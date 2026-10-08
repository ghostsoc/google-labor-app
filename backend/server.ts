import * as dotenv from 'dotenv';
import { app } from './app.ts';

dotenv.config();

const portArgIndex = process.argv.indexOf('--port');
const portArg = portArgIndex !== -1 ? Number(process.argv[portArgIndex + 1]) : null;
const PORT = portArg || (process.env.PORT && process.env.PORT !== '8080' ? Number(process.env.PORT) : 3000);

export function startBackendServer() {
  return app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server listening on http://0.0.0.0:${PORT}`);
  });
}

// If run directly
if (process.argv[1] && process.argv[1].endsWith('backend/server.ts')) {
  startBackendServer();
}

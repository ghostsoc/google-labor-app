import express, { Express } from 'express';
import { apiRouter } from './routes/index.ts';

export function createBackendApp(): Express {
  const app = express();

  app.use(express.json());

  // Mount master /api router
  app.use('/api', apiRouter);

  return app;
}

export const app = createBackendApp();

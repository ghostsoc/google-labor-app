import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'In The Wind AV - Backend API',
    database: 'Cloud SQL PostgreSQL (Developer Edition)',
    timestamp: new Date().toISOString(),
  });
});

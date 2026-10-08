import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';

export const calendarRouter = Router();

// Calendar integration API status
calendarRouter.get('/status', (req, res) => {
  res.json({
    enabled: true,
    provider: 'Google Calendar API v3',
    features: ['Events sync', 'Shift call dispatch', 'Dedicated AV secondary calendar'],
  });
});

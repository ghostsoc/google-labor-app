import { Router } from 'express';
import { healthRouter } from './health.ts';
import { usersRouter } from './users.ts';
import { calendarRouter } from './calendar.ts';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/calendar', calendarRouter);

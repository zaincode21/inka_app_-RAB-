import { Router } from 'express';
import { authRouter } from './auth.js';
import {
  categoryRouter,
  cattleRouter,
  farmRouter,
  healthEventRouter,
  milkRecordRouter,
  transactionRouter,
} from './resources.js';
import { reportRouter } from './reports.js';

export const apiRouter = Router();

apiRouter.get('/health', (_request, response) => {
  response.json({ status: 'ok', version: 'v1' });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/farms', farmRouter);
apiRouter.use('/categories', categoryRouter);
apiRouter.use('/cattle', cattleRouter);
apiRouter.use('/milk-records', milkRecordRouter);
apiRouter.use('/events', healthEventRouter);
apiRouter.use('/transactions', transactionRouter);
apiRouter.use('/reports', reportRouter);

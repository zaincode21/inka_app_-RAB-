import { Router } from 'express';
import { authRouter } from './auth.js';
import { farmRouter } from './farms.js';
import { categoryRouter } from './categories.js';
import { cattleRouter } from './cattle.js';
import { milkRecordRouter } from './milkRecords.js';
import { healthEventRouter } from './events.js';
import { transactionRouter } from './transactions.js';
import { reportRouter } from './reports.js';
import { userRouter } from './users.js';
import { auditLogRouter } from './auditLogs.js';
import { authenticate } from '../middleware/auth.js';

export const apiRouter = Router();

apiRouter.get('/health', (_request, response) => {
  response.json({ status: 'ok', version: 'v1' });
});

apiRouter.use('/auth', authRouter);

apiRouter.use(authenticate);

apiRouter.use('/users', userRouter);
apiRouter.use('/farms', farmRouter);
apiRouter.use('/categories', categoryRouter);
apiRouter.use('/cattle', cattleRouter);
apiRouter.use('/milk-records', milkRecordRouter);
apiRouter.use('/events', healthEventRouter);
apiRouter.use('/transactions', transactionRouter);
apiRouter.use('/reports', reportRouter);
apiRouter.use('/audit-logs', auditLogRouter);

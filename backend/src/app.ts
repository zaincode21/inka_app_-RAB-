import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes/index.js';
import { ensureUploadDir } from './services/attachmentService.js';

export const app = express();

const uploadDir = ensureUploadDir();

app.use(cors({ origin: env.corsOrigin === '*' ? true : env.corsOrigin }));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(uploadDir));

app.get('/health', (_request, response) => {
  response.json({ status: 'ok', service: 'inka-backend' });
});

app.use('/api/v1', apiRouter);
app.use(errorHandler);

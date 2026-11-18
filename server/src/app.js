import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env, isProduction } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRouter from './routes/auth.js';
import budgetsRouter from './routes/budgets.js';
import categoriesRouter from './routes/categories.js';
import eventsRouter from './routes/events.js';
import funBudgetRouter from './routes/funBudget.js';
import healthRouter from './routes/health.js';
import summaryRouter from './routes/summary.js';
import transactionsRouter from './routes/transactions.js';

export function createApp() {
  const app = express();

  // Render/Railway sit behind a proxy; needed for secure cookies and rate limiting
  if (isProduction) app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/transactions', transactionsRouter);
  app.use('/api/summary', summaryRouter);
  app.use('/api/budgets', budgetsRouter);
  app.use('/api/fun-budget', funBudgetRouter);
  app.use('/api/events', eventsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

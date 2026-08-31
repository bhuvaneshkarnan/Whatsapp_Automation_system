import express from 'express';
import morgan from 'morgan';
import { register, collectDefaultMetrics } from 'prom-client';
import { webhookRouter } from './routes/webhook';
import { logger } from './lib/logger';
import { redis } from './lib/redis';

collectDefaultMetrics({ prefix: 'webhook_' });

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

// Don't use express.json() globally — webhook route needs raw body for HMAC
app.use(morgan('combined', { stream: { write: (m) => logger.info(m.trim()) } }));

// Routes
app.use('/webhooks/whatsapp', webhookRouter);

// Health & readiness
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'webhook-ingestion' }));
app.get('/ready', async (_req, res) => {
  try {
    await redis.ping();
    res.json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'not_ready', reason: 'redis_unavailable' });
  }
});
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

async function bootstrap() {
  // Connect Redis
  await redis.connect();
  logger.info('Redis connected');

  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Webhook ingestion started on :${PORT}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    logger.info('Shutting down gracefully...');
    server.close(() => {
      redis.quit();
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  logger.error('Bootstrap failed', { error: err });
  process.exit(1);
});

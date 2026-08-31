import Redis from 'ioredis';
import { logger } from './logger';

export const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 200, 5000),
});

redis.on('error', (err) => logger.error('Redis error', { error: err.message }));
redis.on('connect', () => logger.info('Redis connected'));
redis.on('ready', () => logger.info('Redis ready'));

/**
 * Publish a message to a Redis Stream.
 * Redis Streams replace RabbitMQ — lighter, already in our stack.
 */
export async function publishToStream(
  streamKey: string,
  payload: Record<string, string>,
): Promise<void> {
  // XADD with auto-generated ID and max stream length of 10,000
  await redis.xadd(streamKey, 'MAXLEN', '~', 10000, '*', ...Object.entries(payload).flat());
}

export const STREAMS = {
  INBOUND: 'stream:message.inbound',
  STATUS:  'stream:message.status',
};

import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { redis, publishToStream, STREAMS } from '../lib/redis';
import { getTenantWebhookConfig } from '../lib/tenantConfig';
import { logger } from '../lib/logger';
import { Counter, Histogram } from 'prom-client';

export const webhookRouter = Router();

// ── Metrics ──────────────────────────────────────────────────────────────────
const msgsReceived = new Counter({
  name: 'wa_messages_received_total',
  help: 'Inbound WhatsApp messages received',
  labelNames: ['tenant', 'type'],
});
const statusUpdates = new Counter({
  name: 'wa_status_updates_total',
  help: 'WhatsApp delivery status updates',
  labelNames: ['tenant', 'status'],
});
const duplicatesSkipped = new Counter({
  name: 'wa_duplicates_skipped_total',
  help: 'Duplicate messages skipped via Redis dedup',
  labelNames: ['tenant'],
});
const signatureErrors = new Counter({
  name: 'wa_signature_errors_total',
  help: 'Webhook requests rejected due to invalid HMAC',
  labelNames: ['tenant'],
});
const webhookDuration = new Histogram({
  name: 'wa_webhook_processing_seconds',
  help: 'Time to process and enqueue a webhook payload',
  labelNames: ['tenant'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
});

// ── GET — Meta webhook verification & browser health check ───────────────────
webhookRouter.get('/:tenantSlug', async (req: Request, res: Response) => {
  const { tenantSlug } = req.params;
  const config = await getTenantWebhookConfig(tenantSlug);

  if (!config) {
    return res.status(404).json({
      status: 'not_found',
      error: 'Tenant or WhatsApp credentials not found or tenant is inactive',
      tenant: tenantSlug,
      help: 'Please verify that this client exists and has WhatsApp credentials saved in Settings.'
    });
  }

  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // 1. Meta Webhook Subscription Handshake
  if (mode === 'subscribe') {
    if (token === config.verifyToken) {
      logger.info('Webhook verified successfully by Meta', { tenantSlug });
      return res.status(200).send(challenge);
    } else {
      logger.warn('Webhook verify token mismatch', { tenantSlug, expected: config.verifyToken, received: token });
      return res.status(403).send('Verify token mismatch');
    }
  }

  // 2. Direct Browser Inspection / Health Check
  return res.status(200).json({
    status: 'online',
    service: 'Boldlabs WhatsApp Webhook Ingestion',
    tenant: tenantSlug,
    ready: true,
    message: 'Webhook endpoint is active and ready for Meta Cloud API callbacks.'
  });
});

// ── POST — Inbound messages & status updates ──────────────────────────────────
webhookRouter.post(
  '/:tenantSlug',
  captureRawBody,          // Must run before express.json() parses body
  async (req: Request, res: Response) => {
    const { tenantSlug } = req.params;
    const end = webhookDuration.startTimer({ tenant: tenantSlug });

    const config = await getTenantWebhookConfig(tenantSlug);
    if (!config) return res.sendStatus(404);

    // ── 1. Validate Meta HMAC signature ──────────────────────────────────────
    const sig = req.headers['x-hub-signature-256'] as string | undefined;
    if (!sig || !verifyHmac(req.rawBody!, config.appSecret, sig)) {
      signatureErrors.inc({ tenant: tenantSlug });
      logger.warn('Invalid HMAC signature', { tenantSlug });
      return res.sendStatus(401);
    }

    // ── 2. Acknowledge immediately — Meta requires < 5s ───────────────────────
    res.sendStatus(200);

    // ── 3. Process asynchronously ────────────────────────────────────────────
    try {
      const value = req.body?.entry?.[0]?.changes?.[0]?.value ?? {};

      // Inbound messages
      for (const msg of (value.messages ?? []) as MetaMessage[]) {
        const dedupeKey = `dedup:wa:${msg.id}`;
        const isNew = await redis.set(dedupeKey, '1', 'EX', 86400, 'NX'); // 24h TTL

        if (!isNew) {
          duplicatesSkipped.inc({ tenant: tenantSlug });
          continue;
        }

        msgsReceived.inc({ tenant: tenantSlug, type: msg.type });

        // Publish to Redis Stream for core-worker to consume
        await publishToStream(STREAMS.INBOUND, {
          tenantId:      config.tenantId,
          tenantSlug,
          phoneNumberId: config.phoneNumberId,
          accessToken:   config.accessToken,
          waMessageId:   msg.id,
          from:          msg.from,
          type:          msg.type,
          body:          msg.text?.body ?? '',
          timestamp:     msg.timestamp,
          contactName:   value.contacts?.[0]?.profile?.name ?? '',
          rawJson:       JSON.stringify(msg),
        });

        logger.info('Message enqueued', {
          tenantSlug,
          waMessageId: msg.id,
          from: maskPhone(msg.from),
          type: msg.type,
        });
      }

      // Delivery status updates
      for (const status of (value.statuses ?? []) as MetaStatus[]) {
        statusUpdates.inc({ tenant: tenantSlug, status: status.status });

        await publishToStream(STREAMS.STATUS, {
          tenantId:    config.tenantId,
          tenantSlug,
          waMessageId: status.id,
          status:      status.status,
          timestamp:   status.timestamp,
          recipientId: status.recipient_id,
          errors:      JSON.stringify(status.errors ?? []),
        });
      }
    } catch (error) {
      logger.error('Error processing webhook', {
        tenantSlug,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      end();
    }
  },
);

// ── Helpers ──────────────────────────────────────────────────────────────────

function captureRawBody(req: Request, _res: Response, next: NextFunction): void {
  const chunks: Buffer[] = [];
  req.on('data', (chunk: Buffer) => chunks.push(chunk));
  req.on('end', () => {
    req.rawBody = Buffer.concat(chunks);
    // Manually parse JSON since we bypassed express.json()
    try {
      req.body = JSON.parse(req.rawBody.toString());
    } catch {
      req.body = {};
    }
    next();
  });
}

function verifyHmac(rawBody: Buffer, secret: string, header: string): boolean {
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(header));
  } catch {
    return false;
  }
}

/** Mask phone for logs: +919876543210 → +91****3210 */
function maskPhone(phone: string): string {
  if (phone.length <= 6) return '****';
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

// ── Type declarations ─────────────────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request { rawBody?: Buffer; }
  }
}

interface MetaMessage {
  id: string;
  from: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: { id: string; mime_type: string; caption?: string };
  audio?: { id: string; mime_type: string };
  document?: { id: string; mime_type: string; filename?: string };
  interactive?: { type: string; button_reply?: { id: string; title: string } };
}

interface MetaStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: Array<{ code: number; title: string }>;
}

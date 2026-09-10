import { Pool } from 'pg';
import { logger } from './logger';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://platform_user:devpassword@localhost:5432/whatsapp_platform',
  max: 5,
  idleTimeoutMillis: 30000,
});

export interface TenantWebhookConfig {
  tenantId: string;
  slug: string;
  phoneNumberId: string;   // Meta's Phone Number ID (per client)
  accessToken: string;     // Meta Access Token (per client)
  wabaId: string;          // WhatsApp Business Account ID
  verifyToken: string;     // Webhook verify token (per client)
  appSecret: string;       // Meta App Secret for HMAC validation
}

class LRUCache<K, V> {
  private readonly max: number;
  private readonly map = new Map<K, V>();

  constructor(max = 500) {
    this.max = max;
  }

  get(key: K): V | undefined {
    const item = this.map.get(key);
    if (item !== undefined) {
      this.map.delete(key);
      this.map.set(key, item);
    }
    return item;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.max) {
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }
    this.map.set(key, value);
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }
}

// In-memory LRU cache: slug → config (max 500 entries, TTL 5 min)
const cache = new LRUCache<string, { config: TenantWebhookConfig; expiresAt: number }>(500);
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Load per-tenant WhatsApp credentials from the database.
 * Each client has their own phone number, access token, and verify token.
 */
export async function getTenantWebhookConfig(
  tenantSlug: string,
): Promise<TenantWebhookConfig | null> {
  const now = Date.now();
  const cached = cache.get(tenantSlug);
  if (cached) {
    if (cached.expiresAt > now) {
      return cached.config;
    }
    cache.delete(tenantSlug);
  }

  try {
    const result = await pool.query(
      `SELECT t.id as tenant_id, t.slug,
              tc.credential_data
       FROM tenants t
       JOIN tenant_credentials tc ON tc.tenant_id = t.id
       WHERE t.slug = $1
         AND t.is_active = true
         AND tc.provider = 'whatsapp'
         AND tc.is_active = true`,
      [tenantSlug],
    );

    if (!result.rows[0]) {
      logger.warn('Tenant or WhatsApp credentials not found', { tenantSlug });
      return null;
    }

    const row = result.rows[0];
    const creds = row.credential_data;

    const config: TenantWebhookConfig = {
      tenantId: row.tenant_id,
      slug: row.slug,
      phoneNumberId: creds.phone_number_id,
      accessToken: creds.access_token,
      wabaId: creds.waba_id,
      verifyToken: creds.verify_token,
      appSecret: creds.app_secret ?? process.env.META_APP_SECRET ?? '',
    };

    cache.set(tenantSlug, { config, expiresAt: now + CACHE_TTL_MS });
    return config;
  } catch (err) {
    logger.error('Failed to load tenant webhook config', {
      tenantSlug,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export function invalidateTenantCache(tenantSlug: string): void {
  cache.delete(tenantSlug);
}

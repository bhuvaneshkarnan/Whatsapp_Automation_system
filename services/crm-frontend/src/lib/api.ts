// Central API client — all backend calls go through here.
// When deployed on Vercel, Next.js rewrites proxy /api directly to the Oracle backend.

const BASE = '';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  const tenantId = localStorage.getItem('tenant_id');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let errorMsg = `API Error (${res.status})`;
    try {
      const errorJson = await res.json();
      if (typeof errorJson.detail === 'string') {
        errorMsg = errorJson.detail;
      } else if (Array.isArray(errorJson.detail)) {
        errorMsg = errorJson.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
      } else if (errorJson.message) {
        errorMsg = errorJson.message;
      } else {
        errorMsg = JSON.stringify(errorJson);
      }
    } catch {
      const text = await res.text().catch(() => '');
      if (text) errorMsg = text;
    }
    throw new Error(errorMsg);
  }
  return res.json() as Promise<T>;
}

// ── Auth (/api/v1/auth) ───────────────────────────────────────────────────────
export const auth = {
  login: async (email: string, password: string) => {
    // OAuth2 form-encoded login
    const res = await fetch(`${BASE}/api/v1/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: email, password }),
    });
    if (!res.ok) throw new Error(`Login failed: ${res.status}`);
    return res.json() as Promise<{ access_token: string; token_type: string; tenant_id: string }>;
  },
  me: () => request<{ id: string; tenant_id: string; role: string }>('/api/v1/auth/users/me'),
  createUser: (data: { tenant_id: string; email: string; password: string; display_name?: string }) =>
    request<{ id: string; email: string }>('/api/v1/auth/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export interface Conversation {
  id: string;
  status: string;
  last_message_at?: string;
  unread_count?: number;
  name?: string | null;
  phone?: string;
  contact_name?: string | null;
  contact_phone?: string;
  ai_enabled?: boolean;
}

export interface Message {
  id: string;
  direction: 'inbound' | 'outbound' | string;
  body: string;
  status?: string;
  created_at?: string;
  ai_generated?: boolean;
}

export interface Booking {
  id: string;
  service: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed' | string;
  notes?: string;
  price?: number;
  currency?: string;
  contact_name?: string;
  contact_phone?: string;
  created_at?: string;
}

export interface Contact {
  id: string;
  phone: string;
  name?: string | null;
  wa_profile_name?: string | null;
  tags?: string[];
  notes?: string;
  created_at?: string;
}

export type TenantSettingsUpdate = Partial<TenantSettingsResponse>;

// ── CRM (/api/v1/crm) — all need X-Tenant-ID header (set automatically) ──────
export const crm = {
  getMe: () => auth.me(),

  contacts: (q?: string, limit = 50) =>
    crm.getContacts(q, limit),

  getContacts: async (q?: string, limit = 50): Promise<Contact[]> => {
    try {
      const rows = await request<Contact[]>(
        `/api/v1/crm/contacts${q ? `?q=${encodeURIComponent(q)}&limit=${limit}` : `?limit=${limit}`}`
      );
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  },

  bookings: (status?: string, limit = 50) =>
    crm.getBookings(status, limit),

  getBookings: async (status?: string, limit = 50): Promise<Booking[]> => {
    try {
      const rows = await request<Booking[]>(
        `/api/v1/crm/bookings${status ? `?status=${status}&limit=${limit}` : `?limit=${limit}`}`
      );
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  },

  createBooking: (data: {
    contact_name: string;
    contact_phone: string;
    service: string;
    start_time: string;
    end_time?: string;
    price?: number;
    notes?: string;
  }) =>
    request<{
      status: string;
      id: string;
      service: string;
      start_time: string;
      end_time: string;
      price: number;
      contact_name: string;
      contact_phone: string;
      whatsapp_confirmed: boolean;
    }>('/api/v1/crm/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateBookingStatus: (bookingId: string, status: string) =>
    request<{ status: string; id: string; new_status: string }>(
      `/api/v1/crm/bookings/${bookingId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    ),

  updateBookingPrice: (bookingId: string, price: number) =>
    request<{ status: string; id: string; price: number }>(
      `/api/v1/crm/bookings/${bookingId}/price`,
      {
        method: 'PATCH',
        body: JSON.stringify({ price }),
      }
    ),

  conversations: (status?: string, limit = 50) =>
    crm.getConversations(status, limit),

  getConversations: async (status?: string, limit = 50): Promise<Conversation[]> => {
    try {
      const raw = await request<any[]>(
        `/api/v1/crm/conversations${status ? `?status=${status}&limit=${limit}` : `?limit=${limit}`}`
      );
      if (!Array.isArray(raw)) return [];
      return raw.map((c) => ({
        id: c.id,
        status: c.status || 'open',
        last_message_at: c.last_message_at || '',
        unread_count: c.unread_count || 0,
        name: c.name || c.contact_name || '',
        phone: c.phone || c.contact_phone || '',
        contact_name: c.name || c.contact_name || '',
        contact_phone: c.phone || c.contact_phone || '',
        ai_enabled: c.status !== 'human',
      }));
    } catch {
      return [];
    }
  },

  messages: (convId: string, limit = 50) =>
    crm.getMessages(convId, limit),

  getMessages: async (convId: string, limit = 50): Promise<Message[]> => {
    try {
      const msgs = await request<Message[]>(
        `/api/v1/crm/conversations/${convId}/messages?limit=${limit}`
      );
      return Array.isArray(msgs) ? msgs.reverse() : [];
    } catch {
      return [];
    }
  },

  updateConversationStatus: (convId: string, status: string) =>
    request<{ status: string }>(`/api/v1/crm/conversations/${convId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  toggleAi: async (convId: string, enabled: boolean) => {
    const res = await request<{ status: string; conv_status: string; ai_enabled: boolean }>(`/api/v1/crm/conversations/${convId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: enabled ? 'bot' : 'human' }),
    });
    return { id: convId, ai_enabled: res.ai_enabled };
  },

  toggleAllAi: async (enabled: boolean) => {
    return request<{ status: string; ai_enabled: boolean; new_status: string }>(`/api/v1/crm/conversations/toggle-all`, {
      method: 'PATCH',
      body: JSON.stringify({ ai_enabled: enabled }),
    });
  },

  sendMessage: (convId: string, body: string) =>
    request<Message>(
      `/api/v1/crm/conversations/${convId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ body }),
      }
    ),

  deleteConversation: (convId: string, deleteType: 'for_me' | 'for_everyone' = 'for_everyone') =>
    request<{ status: string; id: string }>(
      `/api/v1/crm/conversations/${convId}?delete_type=${deleteType}`,
      {
        method: 'DELETE',
      }
    ),

  deleteMessage: (msgId: string, deleteType: 'for_me' | 'for_everyone' = 'for_everyone') =>
    request<{ status: string; id: string; body?: string }>(
      `/api/v1/crm/messages/${msgId}?delete_type=${deleteType}`,
      {
        method: 'DELETE',
      }
    ),

  searchMessages: (q: string, limit = 20) =>
    request<{ id: string; body: string; created_at: string; conversation_id: string; name: string | null }[]>(
      `/api/v1/crm/messages/search?q=${encodeURIComponent(q)}&limit=${limit}`
    ),

  getSettings: () =>
    request<TenantSettingsResponse>('/api/v1/crm/settings'),

  updateSettings: (data: Partial<TenantSettingsResponse>) =>
    request<TenantSettingsResponse>('/api/v1/crm/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  initGoogleOAuth: (data: { client_id: string; client_secret: string }) =>
    request<{ auth_url: string; redirect_uri: string }>('/api/v1/crm/oauth/google/init', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  disconnectGoogleCalendar: () =>
    request<{ status: string }>('/api/v1/crm/oauth/google/disconnect', {
      method: 'POST',
    }),
};

export interface TenantSettingsResponse {
  tenant_id: string;
  name: string;
  slug: string;
  logo_url?: string;
  webhook_url: string;
  
  meta_phone_id?: string;
  meta_waba_id?: string;
  meta_access_token?: string;
  meta_app_secret?: string;
  verify_token?: string;
  has_access_token?: boolean;
  has_app_secret?: boolean;
  
  primary_model_provider?: string;
  ai_model?: string;
  gemini_api_key?: string;
  groq_api_key?: string;
  opencode_api_key?: string;
  opencode_base_url?: string;
  has_gemini_key?: boolean;
  has_groq_key?: boolean;
  has_opencode_key?: boolean;
  assistant_name?: string;
  bot_goal?: string;
  services_text?: string;
  ai_prompt?: string;
  response_style?: string;
  methodology?: string;
  strict_rules?: string;
  objection_handling?: string;
  
  full_location_text?: string;
  timezone?: string;
  country_code?: string;
  currency?: string;
  currency_symbol?: string;
  admin_whatsapp_number?: string;
  template_booking_confirmation?: string;
  template_admin_notification?: string;
  template_admin_human_request?: string;
  template_cancellation_confirmation?: string;
  template_admin_cancellation_notice?: string;
  template_reschedule_confirmation?: string;
  template_post_service_review?: string;
  template_appointment_reminder?: string;
  template_reschedule_nudge?: string;
  template_review_request?: string;
  google_review_link?: string;
  
  google_client_id?: string;
  google_client_secret?: string;
  google_refresh_token?: string;
  google_calendar_id?: string;
  notification_email?: string;
  google_calendar_configured?: boolean;
}

// ── Super Admin (/api/v1/crm/admin) ───────────────────────────────────────────
export interface ClientTenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  created_at: string;
  admin_email: string;
  contact_count: number;
  conversation_count: number;
  message_count: number;
  whatsapp_configured: boolean;
  google_calendar_configured?: boolean;
  monthly_price?: number;
  billing_cycle_day?: number;
  razorpay_subscription_id?: string;
  next_renewal_date?: string;
  billing_method?: string;
}

export interface ClientCreatePayload {
  name: string;
  slug: string;
  admin_email: string;
  admin_password: string;
  plan?: string;
  meta_phone_id?: string;
  meta_access_token?: string;
  meta_app_secret?: string;
  verify_token?: string;
  ai_prompt?: string;
  ai_model?: string;
  primary_model_provider?: string;
  gemini_api_key?: string;
  groq_api_key?: string;
  opencode_api_key?: string;
  opencode_base_url?: string;
  assistant_name?: string;
  bot_goal?: string;
  services_text?: string;
  full_location_text?: string;
  admin_whatsapp_number?: string;
  template_booking_confirmation?: string;
  template_admin_notification?: string;
  template_admin_human_request?: string;
  template_cancellation_confirmation?: string;
  template_admin_cancellation_notice?: string;
  template_reschedule_confirmation?: string;
  google_client_id?: string;
  google_client_secret?: string;
  google_refresh_token?: string;
  google_calendar_id?: string;
  notification_email?: string;
}

export interface ClientCreatedResponse {
  id: string;
  name: string;
  slug: string;
  admin_email: string;
  webhook_url: string;
  verify_token: string;
  login_url: string;
  status: string;
}

export interface PlatformStats {
  total_tenants: number;
  active_tenants: number;
  paused_tenants: number;
  total_messages: number;
  total_conversations: number;
  total_bookings: number;
  estimated_mrr: number;
  mrr_currency: string;
  mrr_symbol: string;
  system_status: string;
  uptime: string;
}

export interface PaymentReminderData {
  amount: number;
  currency?: string;
  due_date?: string;
  payment_link?: string;
  custom_phone?: string;
  custom_message?: string;
}

export const admin = {
  listTenants: () => request<ClientTenant[]>('/api/v1/crm/admin/tenants'),
  getStats: () => request<PlatformStats>('/api/v1/crm/admin/stats'),
  createTenant: (data: ClientCreatePayload) =>
    request<ClientCreatedResponse>('/api/v1/crm/admin/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getTenant: (id: string) => request<any>(`/api/v1/crm/admin/tenants/${id}`),
  toggleTenantStatus: (id: string) =>
    request<{ id: string; name: string; is_active: boolean; status: string }>(
      `/api/v1/crm/admin/tenants/${id}/toggle-status`,
      { method: 'PATCH' }
    ),
  resetPassword: (id: string, newPassword: string) =>
    request<{ status: string }>(`/api/v1/crm/admin/tenants/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword }),
    }),
  updateTenantBilling: (tenantId: string, data: { plan?: string; monthly_price?: number; billing_cycle_day?: number; razorpay_subscription_id?: string; next_renewal_date?: string }) =>
    request<{ status: string; tenant_id: string; plan: string; settings: any }>(
      `/api/v1/crm/admin/tenants/${tenantId}/billing`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    ),
  sendAdminDueAlert: (data: { super_admin_phone: string; tenant_id?: string; custom_note?: string }) =>
    request<{ status: string; recipient_phone: string; message_preview: string }>(
      '/api/v1/crm/admin/alerts/send-due-alert',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
  deleteTenant: (id: string) =>
    request<{ status: string; tenant_id: string; name: string }>(
      `/api/v1/crm/admin/tenants/${id}`,
      { method: 'DELETE' }
    ),
  sendPaymentReminder: (tenantId: string, data: PaymentReminderData) =>
    request<{ status: string; tenant_name: string; message_preview: string; recipient_phone: string }>(
      `/api/v1/crm/admin/tenants/${tenantId}/payment-reminder`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
};

// ── Marketing / Broadcast Campaigns ──────────────────────────────────────────
export interface BroadcastCampaign {
  id?: string;
  campaign_name: string;
  target_audience: 'all' | 'attended' | 'important' | 'custom';
  message_text?: string;
  template_name?: string;
  template_params?: string[];
  total_recipients: number;
  sent_count?: number;
  failed_count?: number;
  status: 'queued' | 'completed' | 'in_progress' | 'failed';
  created_at?: string;
}

export const marketing = {
  sendBroadcast: (data: {
    campaign_name: string;
    recipient_phones: string[];
    message_text?: string;
    template_name?: string;
    template_params?: string[];
    target_audience?: string;
  }) =>
    request<{ success: boolean; campaign_name: string; total_recipients: number; status: string; message: string }>(
      '/marketing/broadcast',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
};

// ── Health ────────────────────────────────────────────────────────────────────
export const health = {
  check: () => request<{ status: string; service: string }>('/health'),
};




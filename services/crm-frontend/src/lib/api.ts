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
  const mergedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
  };
  if (init?.headers) {
    const custom = init.headers as Record<string, string>;
    for (const [k, v] of Object.entries(custom)) {
      if (k.toLowerCase() === 'x-tenant-id') {
        delete mergedHeaders['X-Tenant-ID'];
        delete mergedHeaders['x-tenant-id'];
      }
      mergedHeaders[k] = v;
    }
  }
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: mergedHeaders,
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
  login: async (email: string, password: string, rememberMe: boolean = false) => {
    // OAuth2 form-encoded login
    const body = new URLSearchParams({ 
      username: email, 
      password,
      remember_me: rememberMe.toString()
    });
    const res = await fetch(`${BASE}/api/v1/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) {
      let errData: any = null;
      try {
        errData = await res.json();
      } catch {}
      if (res.status === 402 && errData) {
        const detail = typeof errData.detail === 'object' ? errData.detail : { code: 'PAYMENT_REQUIRED', message: errData.detail || 'Payment required' };
        const paymentError: any = new Error(detail.message || 'Subscription payment required');
        paymentError.code = 'PAYMENT_REQUIRED';
        paymentError.status = 402;
        paymentError.paymentDetails = detail;
        throw paymentError;
      }
      let errorMsg = 'Invalid email or password. Please try again.';
      if (errData?.detail) {
        errorMsg = typeof errData.detail === 'string' 
          ? errData.detail 
          : (errData.detail.message || JSON.stringify(errData.detail));
      } else if (res.status === 401) {
        errorMsg = 'Incorrect email or password. Please verify your credentials.';
      } else if (res.status === 500) {
        errorMsg = 'Server error. Please try again shortly or contact support.';
      }
      throw new Error(errorMsg);
    }
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
  last_message?: string;
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
  appointment_time?: string;
  status: 'pending' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed' | string;
  notes?: string;
  price?: number;
  currency?: string;
  contact_name?: string;
  contact_phone?: string;
  created_at?: string;
}

export interface Customer {
  id: string;
  phone: string;
  name?: string | null;
  age?: number | null;
  location?: string | null;
  wa_profile_name?: string | null;
  preferred_doctor: string;
  status: 'new' | 'contacted' | 'follow-up' | 'converted' | 'lost';
  health_concern: string;
  lead_probability: 'hot' | 'warm' | 'cold';
  converted: boolean;
  followup_date?: string | null;
  followup_time?: string | null;
  google_task_id?: string | null;
  google_calendar_event_id?: string | null;
  last_visited?: string | null;
  notes_count?: number;
  latest_note?: string | null;
  last_chat_at?: string | null;
  last_message?: string | null;
  unread_count?: number;
  conversation_id?: string | null;
  created_at?: string;
}

export interface CustomerNote {
  id: string;
  customer_id: string;
  author: string;
  note_text: string;
  color?: string;
  customer_name?: string;
  customer_phone?: string;
  preferred_doctor?: string;
  customer_status?: string;
  created_at: string;
}

export interface CustomerChatHistory {
  customer_id: string;
  conversation_id?: string | null;
  phone: string;
  name?: string | null;
  first_message_at?: string | null;
  last_message_at?: string | null;
  unread_count: number;
  messages: Message[];
}

export interface FollowupTask {
  id: string;
  customer_id?: string | null;
  google_task_id?: string | null;
  google_event_id?: string | null;
  title: string;
  description?: string | null;
  due_date?: string | null;
  completed: boolean;
  is_overdue: boolean;
  customer_name?: string | null;
  customer_phone?: string | null;
  preferred_doctor?: string | null;
  health_concern?: string | null;
  lead_probability?: 'hot' | 'warm' | 'cold';
  created_at?: string;
}

export interface Contact {
  id: string;
  phone: string;
  name?: string | null;
  wa_profile_name?: string | null;
  tags?: string[];
  notes?: string;
  opt_in?: boolean;
  opt_in_at?: string;
  created_at?: string;
}

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

  updateContactConsent: (contactId: string, optIn: boolean) =>
    request<{ status: string; contact_id: string; opt_in: boolean }>(
      `/api/v1/crm/contacts/${contactId}/consent`,
      {
        method: 'PATCH',
        body: JSON.stringify({ opt_in: optIn }),
      }
    ),

  batchUpdateContactConsent: (contactIds: string[], optIn: boolean) =>
    request<{ status: string; updated_count: number; opt_in: boolean }>(
      '/api/v1/crm/contacts/batch-consent',
      {
        method: 'POST',
        body: JSON.stringify({ contact_ids: contactIds, opt_in: optIn }),
      }
    ),

  bookings: (status?: string, limit = 200) =>
    crm.getBookings(status, limit),

  getBookings: async (status?: string, limit = 200): Promise<Booking[]> => {
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
    }>('/api/v1/crm/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateBookingStatus: (bookingId: string, status: string, start_time?: string, end_time?: string) =>
    request<{ status: string; id: string; new_status: string }>(
      `/api/v1/crm/bookings/${bookingId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, start_time, end_time }),
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

  sendMessage: (convId: string, body: string, template_name?: string, template_params?: string[]) =>
    request<Message>(
      `/api/v1/crm/conversations/${convId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ body, template_name, template_params }),
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

  // Customer Follow-up & Tasks
  getCustomers: async (filters?: {
    status?: string;
    lead_probability?: string;
    preferred_doctor?: string;
    q?: string;
    limit?: number;
  }): Promise<Customer[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters?.lead_probability && filters.lead_probability !== 'all') params.set('lead_probability', filters.lead_probability);
      if (filters?.preferred_doctor && filters.preferred_doctor !== 'all') params.set('preferred_doctor', filters.preferred_doctor);
      if (filters?.q) params.set('q', filters.q);
      if (filters?.limit) params.set('limit', String(filters.limit));
      const qs = params.toString();
      const rows = await request<Customer[]>(`/api/v1/crm/customers${qs ? `?${qs}` : ''}`);
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  },

  createCustomer: (data: Partial<Customer>) =>
    request<{ status: string; id: string; phone: string }>('/api/v1/crm/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCustomer: (customerId: string, data: Partial<Customer>) =>
    request<Customer>(`/api/v1/crm/customers/${customerId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteCustomer: (customerId: string) =>
    request<{ status: string; deleted_id: string }>(`/api/v1/crm/customers/${customerId}`, {
      method: 'DELETE',
    }),

  deleteCustomerFollowup: (customerId: string) =>
    request<{ status: string; message: string; id: string }>(`/api/v1/crm/customers/${customerId}/followup`, {
      method: 'DELETE',
    }),

  getCustomerNotes: async (customerId: string): Promise<CustomerNote[]> => {
    try {
      const rows = await request<CustomerNote[]>(`/api/v1/crm/customers/${customerId}/notes`);
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  },

  getAllNotes: async (params?: { color?: string; q?: string; limit?: number; offset?: number }): Promise<CustomerNote[]> => {
    try {
      const qs = new URLSearchParams();
      if (params?.color && params.color !== 'all') qs.set('color', params.color);
      if (params?.q) qs.set('q', params.q);
      if (params?.limit) qs.set('limit', String(params.limit));
      if (params?.offset) qs.set('offset', String(params.offset));
      const url = `/api/v1/crm/notes${qs.toString() ? '?' + qs.toString() : ''}`;
      const rows = await request<CustomerNote[]>(url);
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  },

  addCustomerNote: (customerId: string, data: { author: string; note_text: string; color?: string }) =>
    request<{ status: string; id: string; customer_id: string; color: string }>(`/api/v1/crm/customers/${customerId}/notes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createOverallNote: (data: { customer_id: string; note_text: string; author?: string; color?: string }) =>
    request<{ status: string; id: string; customer_id: string; color: string }>('/api/v1/crm/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteCustomerNote: (noteId: string) =>
    request<{ status: string; id: string }>(`/api/v1/crm/notes/${noteId}`, {
      method: 'DELETE',
    }),

  getCustomerChat: async (customerId: string): Promise<CustomerChatHistory | null> => {
    try {
      return await request<CustomerChatHistory>(`/api/v1/crm/customers/${customerId}/chat`);
    } catch {
      return null;
    }
  },

  sendCustomerChat: (customerId: string, message: string) =>
    request<{ status: string; phone: string; message: string }>(`/api/v1/crm/customers/${customerId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  getCustomerBookings: async (customerId: string): Promise<{ bookings: any[]; total_revenue: number; total_sessions: number; completed_sessions: number } | null> => {
    try {
      return await request<any>(`/api/v1/crm/customers/${customerId}/bookings`);
    } catch {
      return null;
    }
  },

  getTasks: async (filter = 'all'): Promise<FollowupTask[]> => {
    try {
      const rows = await request<FollowupTask[]>(`/api/v1/crm/tasks?filter=${filter}`);
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  },

  createTask: (data: { customer_id?: string; title: string; description?: string; due_date?: string; sync_google_tasks?: boolean; sync_google_calendar?: boolean }) =>
    request<{
      status: string;
      id: string;
      title: string;
      due_date?: string;
      google_task_id?: string;
      google_event_id?: string;
      google_tasks_synced?: boolean;
      google_calendar_synced?: boolean;
      tasks_permission_needed?: boolean;
    }>('/api/v1/crm/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteTask: (taskId: string) =>
    request<{ status: string; id: string }>(`/api/v1/crm/tasks/${taskId}`, {
      method: 'DELETE',
    }),

  toggleTask: (taskId: string) =>
    request<{ status: string; id: string; completed: boolean }>(`/api/v1/crm/tasks/${taskId}/toggle`, {
      method: 'PATCH',
    }),

  syncCustomerToGoogleTasks: (customerId: string) =>
    request<{ status: string; google_task_id: string; customer_id: string; title: string; due_date: string }>(
      `/api/v1/crm/customers/${customerId}/google-tasks`,
      { method: 'POST' }
    ),
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
  template_admin_reschedule_notice?: string;
  template_post_service_review?: string;
  template_appointment_reminder?: string;
  template_reschedule_nudge?: string;
  template_review_request?: string;
  template_admin_daily_digest?: string;
  template_client_followup?: string;
  google_review_link?: string;
  
  google_client_id?: string;
  google_client_secret?: string;
  google_refresh_token?: string;
  google_calendar_id?: string;
  notification_email?: string;
  google_calendar_configured?: boolean;

  industry?: string;
  taxonomy?: {
    staff_label?: string;
    client_label?: string;
    client_plural?: string;
    requirement_label?: string;
    event_label?: string;
    event_plural?: string;
    service_label?: string;
    booking_cta?: string;
    revenue_label?: string;
    notes_label?: string;
    phone_label?: string;
    age_location_label?: string;
    status_label?: string;
    lead_label?: string;
    followup_label?: string;
    created_label?: string;
    actions_label?: string;
    requirement_presets?: string[];
    doctor_presets?: string[];
    staff_presets?: string[];
  };

  org_lifecycle_stage?: string;
  subscription_status?: string;
  razorpay_customer_id?: string;
  razorpay_subscription_id?: string;
  razorpay_short_url?: string;
  next_charge_at?: string;
  last_payment_status?: string;
  last_charge_at?: string;
}

export type TenantSettingsUpdate = Partial<TenantSettingsResponse>;

// ── Super Admin (/api/v1/crm/admin) ───────────────────────────────────────────
export interface Invoice {
  id: string;
  razorpay_invoice_id: string;
  razorpay_payment_id?: string;
  razorpay_subscription_id?: string;
  amount: number;
  currency: string;
  status: string;
  invoice_pdf_url?: string;
  created_at: string;
  paid_at?: string;
}

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
  razorpay_customer_id?: string;
  razorpay_subscription_id?: string;
  razorpay_short_url?: string;
  org_lifecycle_stage?: 'setup' | 'ready_to_activate' | 'billing_active' | string;
  subscription_status?: 'not_started' | 'active' | 'payment_failed' | 'paused' | 'cancelled' | string;
  next_charge_at?: string;
  last_payment_status?: string;
  last_charge_at?: string;
  next_renewal_date?: string;
  billing_method?: string;
  admin_whatsapp_number?: string;
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
  template_admin_reschedule_notice?: string;
  template_client_followup?: string;
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
  toggleTenantStatus: (id: string, active?: boolean) =>
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
  activateBilling: (tenantId: string, force?: boolean, customPhone?: string) => {
    const params = new URLSearchParams();
    if (force) params.set('force_new', 'true');
    if (customPhone) params.set('custom_phone', customPhone);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<{
      status: string;
      tenant_id: string;
      subscription_id: string;
      short_url: string;
      org_lifecycle_stage: string;
      subscription_status: string;
      message?: string;
    }>(`/api/v1/crm/admin/tenants/${tenantId}/activate-billing${qs}`, {
      method: 'POST',
    });
  },
  syncBilling: (tenantId: string) =>
    request<{
      status: string;
      tenant_id: string;
      razorpay_status: string;
      subscription_status: string;
      org_lifecycle_stage: string;
      next_charge_at?: string;
      invoices_synced: number;
    }>(`/api/v1/crm/admin/tenants/${tenantId}/sync-billing`, {
      method: 'POST',
    }),
  getInvoices: (tenantId: string) =>
    request<Invoice[]>(`/api/v1/crm/admin/tenants/${tenantId}/invoices`),
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
  getTenantSettings: (tenantId: string) =>
    request<TenantSettingsResponse>(`/api/v1/crm/admin/tenants/${tenantId}/settings`),
  updateTenantSettings: (tenantId: string, data: TenantSettingsUpdate) =>
    request<TenantSettingsResponse>(`/api/v1/crm/admin/tenants/${tenantId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ── Marketing / Broadcast Campaigns & Automations ───────────────────────────
export interface BroadcastCampaign {
  id?: string;
  campaign_name: string;
  target_audience: 'contacts_only' | 'sheet_only' | 'both' | 'all' | 'attended' | 'important' | 'custom' | string;
  message_mode?: 'template' | 'text';
  message_text?: string;
  template_name?: string;
  template_params?: string[];
  total_recipients: number;
  sent_count?: number;
  delivered_count?: number;
  read_count?: number;
  replied_count?: number;
  converted_count?: number;
  failed_count?: number;
  status: 'queued' | 'completed' | 'in_progress' | 'scheduled' | 'failed';
  scheduled_at?: string | null;
  created_at?: string;
}

export interface ReengagementTrigger {
  id: string;
  name: string;
  trigger_type: 'recall_reminder' | 'birthday_greeting' | 'post_treatment_followup' | 'seasonal_promo' | string;
  condition_label: string;
  condition_days: number;
  template_name: string;
  template_params?: string[];
  is_active: boolean;
  reached_count: number;
  last_triggered_at?: string | null;
  created_at?: string;
}

export interface MarketingAnalyticsSummary {
  total_broadcasts: number;
  total_sent: number;
  total_delivered: number;
  delivery_rate: number;
  total_read: number;
  read_rate: number;
  total_replied: number;
  reply_rate: number;
  total_converted: number;
  conversion_rate: number;
  attributed_revenue: number;
  average_ticket_size: number;
}

export const marketing = {
  getCampaigns: () =>
    request<BroadcastCampaign[]>('/api/v1/marketing/campaigns'),

  sendBroadcast: (data: {
    campaign_name: string;
    recipient_phones: string[];
    message_text?: string;
    template_name?: string;
    template_params?: string[];
    target_audience?: string;
    message_mode?: 'template' | 'text';
    is_scheduled?: boolean;
    scheduled_at?: string | null;
  }) =>
    request<{ success: boolean; campaign_id?: string; campaign_name: string; total_recipients: number; status: string; scheduled_at?: string; message: string }>(
      '/api/v1/marketing/broadcast',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  deleteCampaign: (campaignId: string) =>
    request<{ status: string; deleted_id: string }>(
      `/api/v1/marketing/campaigns/${campaignId}`,
      { method: 'DELETE' }
    ),

  getTriggers: () =>
    request<ReengagementTrigger[]>('/api/v1/marketing/triggers'),

  createTrigger: (data: {
    name: string;
    trigger_type: string;
    condition_label: string;
    condition_days?: number;
    template_name: string;
    template_params?: string[];
    is_active?: boolean;
  }) =>
    request<{ status: string; id: string; name: string }>(
      '/api/v1/marketing/triggers',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  toggleTrigger: (triggerId: string) =>
    request<{ status: string; id: string; is_active: boolean }>(
      `/api/v1/marketing/triggers/${triggerId}/toggle`,
      { method: 'PATCH' }
    ),

  testTrigger: (triggerId: string) =>
    request<{ status: string; trigger_name: string; recipient: string; template: string }>(
      `/api/v1/marketing/triggers/${triggerId}/test`,
      { method: 'POST' }
    ),

  getAnalytics: () =>
    request<{ summary: MarketingAnalyticsSummary; campaigns: BroadcastCampaign[] }>(
      '/api/v1/marketing/analytics'
    ),

  getTemplates: () =>
    request<Array<{
      id: string;
      name: string;
      label: string;
      category: string;
      status: string;
      language?: string;
      body?: string;
      variables_count: number;
    }>>('/api/v1/marketing/templates'),

  createTemplate: (data: {
    name: string;
    label?: string;
    category?: 'UTILITY' | 'MARKETING';
    language?: string;
    body: string;
    variables_count?: number;
  }) =>
    request<{
      id: string;
      name: string;
      label: string;
      category: string;
      status: string;
      body: string;
      variables_count: number;
    }>('/api/v1/marketing/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteTemplate: (templateName: string) =>
    request<{ status: string; deleted: string }>(
      `/api/v1/marketing/templates/${encodeURIComponent(templateName)}`,
      { method: 'DELETE' }
    ),
};

// ── Health ────────────────────────────────────────────────────────────────────
export const health = {
  check: () => request<{ status: string; service: string }>('/health'),
};

// ── Notifications & Web Push (/api/v1/crm/notifications) ──────────────────────
export interface CrmNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  data: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export const notificationsApi = {
  getVapidKey: () =>
    request<{ vapid_public_key: string }>('/api/v1/crm/notifications/vapid-public-key'),

  subscribe: (data: { endpoint: string; keys: { p256dh: string; auth: string }; user_agent?: string }) =>
    request<{ status: string; subscribed: boolean }>('/api/v1/crm/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  unsubscribe: (endpoint: string) =>
    request<{ status: string; unsubscribed: boolean }>('/api/v1/crm/notifications/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ endpoint }),
    }),

  list: (limit = 50) =>
    request<{
      unread_count: number;
      subscription_count: number;
      notifications: CrmNotification[];
    }>(`/api/v1/crm/notifications?limit=${limit}`),

  markRead: (id: string) =>
    request<{ status: string; id: string }>(`/api/v1/crm/notifications/${id}/read`, {
      method: 'PATCH',
    }),

  markAllRead: () =>
    request<{ status: string }>('/api/v1/crm/notifications/mark-all-read', {
      method: 'POST',
    }),

  sendTest: () =>
    request<{ status: string; notification_id: string; sent_count: number }>(
      '/api/v1/crm/notifications/test',
      { method: 'POST' }
    ),

  delete: (id: string) =>
    request<{ status: string; id: string }>(`/api/v1/crm/notifications/${id}`, {
      method: 'DELETE',
    }),

  clearAll: () =>
    request<{ status: string }>('/api/v1/crm/notifications/clear-all', {
      method: 'POST',
    }),
};

// ── Meta Template Provisioning & Sync (/api/v1/crm/templates) ────────────────
export interface MetaTemplateItem {
  name: string;
  label: string;
  description: string;
  category: string;
  status: string;
  exists_in_meta: boolean;
  meta_id?: string | null;
  language?: string;
}

export interface MetaTemplatesStatusResponse {
  success: boolean;
  industry?: string;
  waba_id?: string;
  error?: string;
  summary: {
    total: number;
    approved: number;
    pending: number;
    missing: number;
  };
  templates: MetaTemplateItem[];
}

export interface MetaTemplatesSyncResponse {
  success: boolean;
  industry: string;
  waba_id: string;
  total_required: number;
  already_present_count: number;
  created_count: number;
  failed_count: number;
  already_present: Array<{ name: string; label: string; status: string; category: string }>;
  created: Array<{ name: string; label: string; status: string; category: string }>;
  failed: Array<{ name: string; label: string; error: string }>;
}

export const metaTemplatesApi = {
  getStatus: (tenantId?: string) =>
    request<MetaTemplatesStatusResponse>(
      '/api/v1/crm/templates/meta-status',
      tenantId ? { headers: { 'x-tenant-id': tenantId } } : undefined
    ),

  syncAndProvision: (tenantId?: string) =>
    request<MetaTemplatesSyncResponse>(
      '/api/v1/crm/templates/sync-meta',
      {
        method: 'POST',
        headers: tenantId ? { 'x-tenant-id': tenantId } : undefined,
      }
    ),
};





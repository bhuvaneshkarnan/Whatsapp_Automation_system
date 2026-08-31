'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Plus,
  Copy,
  Check,
  Search,
  RefreshCw,
  Lock,
  Pause,
  Play,
  Calendar,
  Key,
  ExternalLink,
  X,
  CreditCard,
  Send,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Activity,
  MessageSquare,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Sliders,
  Bell,
  ShieldCheck,
  HelpCircle,
  Layers,
  Trash2,
} from 'lucide-react';
import { admin, ClientTenant, ClientCreatedResponse, PlatformStats } from '@/lib/api';

export default function SuperAdminClients() {
  const router = useRouter();
  const [tenants, setTenants] = useState<ClientTenant[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  
  // Navigation tabs in Super Admin
  const [activeTab, setActiveTab] = useState<'organizations' | 'razorpay' | 'webhooks' | 'admin_config'>('organizations');
  
  // Super Admin WhatsApp Notification Config (stored in localStorage & synced)
  const [superAdminPhone, setSuperAdminPhone] = useState<string>('');
  const [savedPhoneNotice, setSavedPhoneNotice] = useState(false);

  // Edit Client Razorpay Billing Modal
  const [editingBillingTenant, setEditingBillingTenant] = useState<ClientTenant | null>(null);
  const [billingPlan, setBillingPlan] = useState<string>('pro');
  const [billingPrice, setBillingPrice] = useState<number>(2999);
  const [billingDay, setBillingDay] = useState<number>(1);
  const [billingRazorpayId, setBillingRazorpayId] = useState<string>('');
  const [billingNextDate, setBillingNextDate] = useState<string>('');
  const [savingBilling, setSavingBilling] = useState(false);

  // Delete Tenant state
  const [deleteTenantTarget, setDeleteTenantTarget] = useState<ClientTenant | null>(null);
  const [deletingTenant, setDeletingTenant] = useState(false);

  // Send Alert to Admin Modal / Trigger
  const [alertTenant, setAlertTenant] = useState<ClientTenant | null>(null);
  const [sendingAdminAlert, setSendingAdminAlert] = useState(false);
  const [alertSuccessNotice, setAlertSuccessNotice] = useState<string | null>(null);

  // Onboard Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdClient, setCreatedClient] = useState<(ClientCreatedResponse & { password?: string }) | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // Password reset modal state
  const [resetTenantId, setResetTenantId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Form state for Onboarding
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const initialFormData = {
    name: '',
    slug: '',
    admin_email: '',
    admin_password: '',
    plan: 'pro',
    monthly_price: 2999,
    billing_cycle_day: 1,
    razorpay_subscription_id: '',
    meta_phone_id: '',
    meta_access_token: '',
    meta_app_secret: '',
    verify_token: '',
    ai_prompt: '',
    ai_model: 'gemini-2.0-flash',
    primary_model_provider: 'gemini',
    gemini_api_key: '',
    groq_api_key: '',
    opencode_api_key: '',
    opencode_base_url: 'https://api.openai.com/v1',
    assistant_name: 'Rakshaya',
    bot_goal: '',
    services_text: '',
    full_location_text: '',
    admin_whatsapp_number: '',
    template_booking_confirmation: 'booking_confirmationn',
    template_admin_notification: 'admin_notification',
    template_admin_human_request: 'admin_human_request',
    template_cancellation_confirmation: 'cancellation_confirmation',
    template_admin_cancellation_notice: 'admin_cancellation_notice',
    template_reschedule_confirmation: 'booking_confirmationn',
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    const saved = localStorage.getItem('boldlabs_super_admin_phone');
    if (saved) setSuperAdminPhone(saved);
    loadData();
  }, []);

  function handleSaveAdminPhone(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem('boldlabs_super_admin_phone', superAdminPhone);
    setSavedPhoneNotice(true);
    setTimeout(() => setSavedPhoneNotice(false), 2500);
  }

  function handleNameChange(name: string) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug === '' || prev.slug === name.slice(0, -1).toLowerCase().replace(/[^a-z0-9]+/g, '-') ? slug : prev.slug,
      verify_token: prev.verify_token === '' ? `${slug}_token` : prev.verify_token,
    }));
  }

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [tenantsData, statsData] = await Promise.allSettled([
        admin.listTenants(),
        admin.getStats()
      ]);
      
      if (tenantsData.status === 'fulfilled') {
        setTenants(tenantsData.value);
      } else {
        throw tenantsData.reason;
      }

      if (statsData.status === 'fulfilled') {
        setStats(statsData.value);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load client tenants.';
      setError(msg);
      if (msg.includes('Unauthorized') || msg.includes('401')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(tenantId: string, currentActive: boolean) {
    setTogglingId(tenantId);
    try {
      const updated = await admin.toggleTenantStatus(tenantId, !currentActive);
      setTenants((prev) =>
        prev.map((t) => (t.id === tenantId ? { ...t, status: updated.status } : t))
      );
      setActionSuccessNotice(`Tenant status updated to ${updated.status.toUpperCase()}`);
      setTimeout(() => setActionSuccessNotice(null), 3000);
      admin.getStats().then(setStats).catch(() => {});
    } catch (err) {
      console.error('Failed to toggle status:', err);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');
    try {
      const res = await admin.createTenant(formData);
      // Also update billing settings
      await admin.updateTenantBilling(res.id, {
        plan: formData.plan,
        monthly_price: Number(formData.monthly_price),
        billing_cycle_day: Number(formData.billing_cycle_day),
        razorpay_subscription_id: formData.razorpay_subscription_id,
        next_renewal_date: `Day ${formData.billing_cycle_day} of every month`,
      });

      setCreatedClient({ ...res, password: formData.admin_password });
      setActionSuccessNotice(`Organization "${res.name}" provisioned successfully!`);
      setTimeout(() => setActionSuccessNotice(null), 4000);
      setShowCreateModal(false);
      setFormData(initialFormData);
      loadData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create client tenant.');
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleSaveBilling(e: React.FormEvent) {
    e.preventDefault();
    if (!editingBillingTenant) return;
    setSavingBilling(true);
    try {
      await admin.updateTenantBilling(editingBillingTenant.id, {
        plan: billingPlan,
        monthly_price: Number(billingPrice),
        billing_cycle_day: Number(billingDay),
        razorpay_subscription_id: billingRazorpayId,
        next_renewal_date: billingNextDate || `Day ${billingDay} of every month`,
      });
      setActionSuccessNotice(`Razorpay billing settings updated for ${editingBillingTenant.name}!`);
      setTimeout(() => setActionSuccessNotice(null), 3000);
      setEditingBillingTenant(null);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save billing.');
    } finally {
      setSavingBilling(false);
    }
  }

  async function handleDeleteTenant() {
    if (!deleteTenantTarget) return;
    setDeletingTenant(true);
    try {
      await admin.deleteTenant(deleteTenantTarget.id);
      setActionSuccessNotice(`Organization "${deleteTenantTarget.name}" deleted permanently.`);
      setTimeout(() => setActionSuccessNotice(null), 3000);
      setDeleteTenantTarget(null);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete organization.');
    } finally {
      setDeletingTenant(false);
    }
  }

  async function handleSendAdminAlert(tenantId?: string) {
    setSendingAdminAlert(true);
    try {
      const res = await admin.sendAdminDueAlert({
        super_admin_phone: superAdminPhone,
        tenant_id: tenantId,
      });
      setAlertSuccessNotice(`WhatsApp renewal alert dispatched to Super Admin (+${superAdminPhone})!`);
      setTimeout(() => {
        setAlertSuccessNotice(null);
        setAlertTenant(null);
      }, 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to dispatch alert to Super Admin.');
    } finally {
      setSendingAdminAlert(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTenantId || !newPassword) return;
    try {
      await admin.resetPassword(resetTenantId, newPassword);
      setResetSuccess(true);
      setTimeout(() => {
        setResetTenantId(null);
        setNewPassword('');
        setResetSuccess(false);
      }, 2000);
    } catch (err) {
      alert('Failed to reset password.');
    }
  }

  function handleImpersonateTenant(tenantId: string) {
    localStorage.setItem('tenant_id', tenantId);
    router.push('/dashboard');
  }

  function copyToClipboard(text: string, fieldName: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  }

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.admin_email && t.admin_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.razorpay_subscription_id && t.razorpay_subscription_id.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (statusFilter === 'active') return matchesSearch && t.status === 'active';
    if (statusFilter === 'paused') return matchesSearch && t.status !== 'active';
    return matchesSearch;
  });

  const totalCalculatedMRR = tenants.reduce((acc, t) => {
    if (t.status !== 'active') return acc;
    if (t.monthly_price) return acc + t.monthly_price;
    const plan = (t.plan || 'pro').toLowerCase();
    if (plan === 'starter') return acc + 999;
    if (plan === 'enterprise') return acc + 9999;
    return acc + 2999;
  }, 0);

  return (
    <div className="flex h-screen bg-canvas text-text-primary font-sans antialiased overflow-hidden">
      
      {/* ── 1. SUPER ADMIN SIDEBAR ────────────────────────────────────────── */}
      <aside className="w-60 bg-surface text-text-secondary flex flex-col shrink-0 select-none border-r border-border">
        
        {/* Brand & Platform Name */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border">
          <div className="w-7 h-7 rounded-sm bg-accent text-white flex items-center justify-center shrink-0">
            <Building2 className="w-3.5 h-3.5 stroke-[1.5]" />
          </div>
          <div>
            <h1 className="font-semibold text-xs text-text-primary">
              Super Admin
            </h1>
            <p className="text-[11px] text-text-muted">Tenant management</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-2 py-1 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Platform
          </div>

          {[
            { id: 'organizations', label: 'Organizations', icon: Building2 },
            { id: 'razorpay', label: 'Billing & renewals', icon: CreditCard },
            { id: 'webhooks', label: 'Webhook registry', icon: Key },
            { id: 'admin_config', label: 'Admin notifications', icon: Bell },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-sm text-xs transition-colors duration-150 cursor-pointer text-left ${
                  active
                    ? 'bg-surface-subtle text-text-primary font-semibold border border-border-strong'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle font-medium border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 stroke-[1.5] ${active ? 'text-accent fill-accent' : 'text-text-muted'}`} />
                <span className="flex-1">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer: Quick switch back to CRM Dashboard */}
        <div className="p-3 border-t border-border">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface-subtle text-text-body rounded-sm text-xs font-medium transition-colors duration-150 cursor-pointer border border-border"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Return to CRM</span>
          </button>
        </div>

      </aside>

      {/* ── 2. MAIN SUPER ADMIN WORKSPACE ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-canvas">
        
        {/* Top Header */}
        <header className="h-14 border-b border-border bg-surface px-6 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-semibold text-xs text-text-primary">
              {activeTab === 'organizations' && 'Client organizations'}
              {activeTab === 'razorpay' && 'Razorpay subscriptions & renewal alerts'}
              {activeTab === 'webhooks' && 'Meta WhatsApp webhook registry'}
              {activeTab === 'admin_config' && 'Super admin notification settings'}
            </h2>
            <p className="text-xs text-text-muted">
              Manage client workspaces, configure renewal alerts, and inspect endpoints
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Super Admin Phone Pill */}
            <button
              onClick={() => setActiveTab('admin_config')}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-surface-subtle hover:bg-surface border border-border rounded-sm text-xs text-text-body transition-colors duration-150 cursor-pointer"
              title="Click to configure WhatsApp Alert recipient"
            >
              <Bell className="w-3.5 h-3.5 text-text-muted stroke-[1.5]" />
              <span>Admin alerts:</span>
              <span className="font-mono text-text-primary">
                {superAdminPhone ? `+${superAdminPhone}` : 'Configure'}
              </span>
            </button>

            <button
              onClick={() => loadData()}
              disabled={loading}
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-subtle rounded-sm transition-colors duration-150 cursor-pointer border border-border"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 stroke-[1.5] ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors duration-150 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Onboard organization</span>
            </button>
          </div>
        </header>

        {/* Global Action / Alert Toast Notice */}
        {(actionSuccessNotice || alertSuccessNotice) && (
          <div className="bg-status-success-bg border-b border-status-success-border px-6 py-2 text-xs text-status-success flex items-center justify-between font-medium shrink-0">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>{actionSuccessNotice || alertSuccessNotice}</span>
            </span>
          </div>
        )}

        {/* Scrollable Body */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* ── 4 KPI Metrics Row ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Total Organizations */}
            <div className="bg-surface border border-border rounded-md p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-muted">
                  Organizations
                </span>
                <Building2 className="w-4 h-4 text-text-muted stroke-[1.5]" />
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-text-primary font-mono tabular-nums">
                    {tenants.length}
                  </span>
                  <span className="text-xs font-medium text-status-success">
                    {tenants.filter((t) => t.status === 'active').length} Active
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {tenants.filter((t) => t.status !== 'active').length} paused
                </p>
              </div>
            </div>

            {/* 2. Platform MRR */}
            <div className="bg-surface border border-border rounded-md p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-muted">
                  Platform MRR
                </span>
                <DollarSign className="w-4 h-4 text-text-muted stroke-[1.5]" />
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-semibold text-text-primary font-mono tabular-nums">
                    ₹{totalCalculatedMRR.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-text-muted">/ mo</span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  Razorpay auto-debit
                </p>
              </div>
            </div>

            {/* 3. Razorpay Due Date Tracker */}
            <div className="bg-surface border border-border rounded-md p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-muted">
                  Admin WhatsApp alerts
                </span>
                <Bell className="w-4 h-4 text-text-muted stroke-[1.5]" />
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-text-primary">
                    {superAdminPhone ? 'Active' : 'Setup needed'}
                  </span>
                  <span className="text-xs font-medium text-status-success">Live</span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {superAdminPhone ? `To +${superAdminPhone}` : 'Configure below'}
                </p>
              </div>
            </div>

            {/* 4. Platform Traffic */}
            <div className="bg-surface border border-border rounded-md p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-muted">
                  WhatsApp messages
                </span>
                <Activity className="w-4 h-4 text-text-muted stroke-[1.5]" />
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-semibold text-text-primary font-mono tabular-nums">
                    {stats?.total_messages || 0}
                  </span>
                  <span className="text-xs text-text-muted">total</span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  Across all client instances
                </p>
              </div>
            </div>

          </div>

          {/* ── TAB 1: CLIENT ORGANIZATIONS DIRECTORY ─────────────────────────── */}
          {activeTab === 'organizations' && (
            <div className="bg-surface border border-border rounded-md overflow-hidden">
              
              {/* Search & Filter Bar */}
              <div className="p-3.5 border-b border-border flex items-center justify-between gap-3 flex-wrap bg-surface">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted stroke-[1.5]" />
                  <input
                    type="text"
                    placeholder="Search organizations, slug, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary placeholder:text-text-muted focus:bg-white focus:border-accent transition-colors duration-150"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent transition-colors duration-150 cursor-pointer"
                  >
                    <option value="all">All statuses</option>
                    <option value="active">Active only</option>
                    <option value="paused">Paused only</option>
                  </select>

                  <button
                    onClick={() => handleSendAdminAlert()}
                    disabled={sendingAdminAlert || !superAdminPhone}
                    className="px-3 py-1.5 bg-surface hover:bg-surface-subtle text-text-body text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer border border-border flex items-center gap-1.5 disabled:opacity-50"
                    title="Send consolidated Razorpay renewal digest to Super Admin WhatsApp"
                  >
                    <Send className="w-3 h-3 stroke-[1.5]" />
                    <span>Send digest to WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              {loading ? (
                <div className="p-12 text-center text-xs text-text-muted">Loading client organizations...</div>
              ) : filteredTenants.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <Building2 className="w-8 h-8 text-text-muted mx-auto stroke-[1.5]" />
                  <p className="text-xs font-medium text-text-primary">No organizations found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-surface-subtle text-xs font-medium text-text-muted">
                        <th className="py-2.5 px-4">Organization</th>
                        <th className="py-2.5 px-4">Plan & rate</th>
                        <th className="py-2.5 px-4">Razorpay renewal</th>
                        <th className="py-2.5 px-4">Admin contact</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs">
                      {filteredTenants.map((t) => {
                        const planFee = t.monthly_price || ((t.plan || 'pro').toLowerCase() === 'starter' ? 999 : (t.plan || 'pro').toLowerCase() === 'enterprise' ? 9999 : 2999);
                        const renewalDay = t.billing_cycle_day || 1;
                        return (
                          <tr key={t.id} className="hover:bg-surface-subtle/50 transition-colors duration-150">
                            
                            {/* Organization Name */}
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-sm bg-surface-subtle border border-border text-text-primary flex items-center justify-center font-medium text-xs shrink-0">
                                  {t.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium text-text-primary">{t.name}</p>
                                  <p className="text-[11px] font-mono text-text-muted">/{t.slug}</p>
                                </div>
                              </div>
                            </td>

                            {/* Plan & Rate */}
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono font-medium uppercase px-1.5 py-0.5 rounded-sm bg-surface-subtle text-text-secondary border border-border">
                                  {t.plan || 'PRO'}
                                </span>
                                <span className="text-xs font-mono tabular-nums text-text-body">
                                  ₹{planFee.toLocaleString('en-IN')}/mo
                                </span>
                              </div>
                            </td>

                            {/* Razorpay Renewal Date */}
                            <td className="py-2.5 px-4">
                              <div className="space-y-0.5">
                                <p className="text-xs text-text-primary flex items-center gap-1 font-sans">
                                  <Calendar className="w-3 h-3 text-text-muted stroke-[1.5]" />
                                  <span>Every {renewalDay}th of month</span>
                                </p>
                                <p className="text-[11px] font-mono text-text-muted">
                                  {t.razorpay_subscription_id ? `ID: ${t.razorpay_subscription_id}` : 'Auto-debit active'}
                                </p>
                              </div>
                            </td>

                            {/* Admin Contact */}
                            <td className="py-2.5 px-4">
                              <p className="text-xs text-text-primary">{t.admin_email || '—'}</p>
                              <p className="text-[11px] text-text-muted font-mono tabular-nums">{t.contact_count || 0} contacts &bull; {t.conversation_count || 0} chats</p>
                            </td>

                            {/* Status */}
                            <td className="py-2.5 px-4">
                              <button
                                onClick={() => handleToggleStatus(t.id, t.status === 'active')}
                                disabled={togglingId === t.id}
                                className={`text-[11px] font-medium px-2 py-0.5 rounded-sm flex items-center gap-1 transition-colors duration-150 cursor-pointer border ${
                                  t.status === 'active'
                                    ? 'bg-status-success-bg text-status-success border-status-success-border'
                                    : 'bg-status-error-bg text-status-error border-status-error-border'
                                }`}
                                title="Click to toggle status"
                              >
                                {t.status === 'active' ? <Play className="w-2.5 h-2.5 fill-current" /> : <Pause className="w-2.5 h-2.5 fill-current" />}
                                <span>{t.status === 'active' ? 'Active' : 'Paused'}</span>
                              </button>
                            </td>

                            {/* Actions */}
                            <td className="py-2.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                
                                {/* Send WhatsApp Alert */}
                                <button
                                  onClick={() => handleSendAdminAlert(t.id)}
                                  disabled={sendingAdminAlert || !superAdminPhone}
                                  className="px-2.5 py-1 bg-surface hover:bg-surface-subtle text-text-body border border-border rounded-sm text-xs font-medium transition-colors duration-150 cursor-pointer flex items-center gap-1 disabled:opacity-50"
                                  title="Send Razorpay due alert for this client to Super Admin WhatsApp"
                                >
                                  <Bell className="w-3 h-3 stroke-[1.5]" />
                                  <span>Alert</span>
                                </button>

                                {/* Edit Billing & Razorpay Config */}
                                <button
                                  onClick={() => {
                                    setEditingBillingTenant(t);
                                    setBillingPlan(t.plan || 'pro');
                                    setBillingPrice(planFee);
                                    setBillingDay(renewalDay);
                                    setBillingRazorpayId(t.razorpay_subscription_id || '');
                                    setBillingNextDate(t.next_renewal_date || `Day ${renewalDay} of this month`);
                                  }}
                                  className="px-2.5 py-1 bg-surface hover:bg-surface-subtle text-text-body border border-border rounded-sm text-xs font-medium transition-colors duration-150 cursor-pointer flex items-center gap-1"
                                  title="Configure Plan & Razorpay Settings"
                                >
                                  <Sliders className="w-3 h-3 stroke-[1.5]" />
                                  <span>Billing</span>
                                </button>

                                {/* Impersonate / Open CRM */}
                                <button
                                  onClick={() => handleImpersonateTenant(t.id)}
                                  className="px-2.5 py-1 bg-accent hover:bg-accent-hover text-white rounded-sm text-xs font-medium transition-colors duration-150 cursor-pointer flex items-center gap-1"
                                  title="Access this Tenant's CRM Workspace"
                                >
                                  <ExternalLink className="w-3 h-3 stroke-[1.5]" />
                                  <span>Open CRM</span>
                                </button>

                                {/* Password Reset */}
                                <button
                                  onClick={() => {
                                    setResetTenantId(t.id);
                                    setNewPassword('');
                                    setResetSuccess(false);
                                  }}
                                  className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-subtle rounded-sm transition-colors duration-150 cursor-pointer border border-border"
                                  title="Reset Admin Password"
                                >
                                  <Lock className="w-3.5 h-3.5 stroke-[1.5]" />
                                </button>

                                {/* Delete Organization */}
                                <button
                                  onClick={() => setDeleteTenantTarget(t)}
                                  className="p-1.5 text-text-muted hover:text-status-error hover:bg-status-error-bg rounded-sm transition-colors duration-150 cursor-pointer border border-border hover:border-status-error-border"
                                  title="Delete Organization Permanently"
                                >
                                  <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                                </button>

                              </div>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── TAB 2: RAZORPAY SUBSCRIPTIONS & ADMIN DUE ALERTS ─────────────────── */}
          {activeTab === 'razorpay' && (
            <div className="space-y-4">
              
              {/* Informative Explanation Banner */}
              <div className="bg-surface border border-border rounded-md p-4 flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-1 max-w-2xl">
                  <h3 className="text-xs font-semibold text-text-primary flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-accent stroke-[1.5]" />
                    <span>Razorpay subscription auto-debit and alert center</span>
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Clients are billed automatically via Razorpay Subscriptions. Automated due date reminders are delivered directly to your WhatsApp number ({superAdminPhone ? `+${superAdminPhone}` : 'Configure phone'}).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSendAdminAlert()}
                    disabled={sendingAdminAlert || !superAdminPhone}
                    className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors duration-150 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span>Send renewal digest to WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Client Razorpay Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tenants.map((t) => {
                  const planFee = t.monthly_price || ((t.plan || 'pro').toLowerCase() === 'starter' ? 999 : (t.plan || 'pro').toLowerCase() === 'enterprise' ? 9999 : 2999);
                  const renewalDay = t.billing_cycle_day || 1;
                  return (
                    <div key={t.id} className="bg-surface border border-border rounded-md p-4 space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-border">
                          <div>
                            <h4 className="font-semibold text-xs text-text-primary">{t.name}</h4>
                            <p className="text-[11px] text-text-muted font-mono">/{t.slug}</p>
                          </div>
                          <span className="text-[10px] font-mono uppercase font-medium bg-surface-subtle text-text-secondary px-1.5 py-0.5 rounded-sm border border-border">
                            {t.plan || 'PRO'}
                          </span>
                        </div>

                        <div className="mt-3 space-y-1.5 text-xs">
                          <div className="flex justify-between text-text-secondary">
                            <span>Subscription rate:</span>
                            <span className="font-medium font-mono tabular-nums text-text-primary">₹{planFee.toLocaleString('en-IN')} / mo</span>
                          </div>
                          <div className="flex justify-between text-text-secondary">
                            <span>Billing cycle:</span>
                            <span className="text-text-primary">Every {renewalDay}th of month</span>
                          </div>
                          <div className="flex justify-between text-text-secondary">
                            <span>Razorpay Sub ID:</span>
                            <span className="font-mono text-text-muted">{t.razorpay_subscription_id || 'Auto-debit active'}</span>
                          </div>
                          <div className="flex justify-between text-text-secondary">
                            <span>Payment method:</span>
                            <span className="text-status-success font-medium">Razorpay Auto-Debit</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingBillingTenant(t);
                              setBillingPlan(t.plan || 'pro');
                              setBillingPrice(planFee);
                              setBillingDay(renewalDay);
                              setBillingRazorpayId(t.razorpay_subscription_id || '');
                              setBillingNextDate(t.next_renewal_date || `Day ${renewalDay} of this month`);
                            }}
                            className="text-xs font-medium text-text-secondary hover:text-text-primary cursor-pointer"
                          >
                            Edit billing
                          </button>

                          <button
                            onClick={() => setDeleteTenantTarget(t)}
                            className="text-xs font-medium text-status-error hover:underline cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>

                        <button
                          onClick={() => handleSendAdminAlert(t.id)}
                          disabled={sendingAdminAlert || !superAdminPhone}
                          className="px-2.5 py-1 bg-surface hover:bg-surface-subtle text-text-primary text-xs font-medium rounded-sm border border-border transition-colors duration-150 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Bell className="w-3 h-3 stroke-[1.5]" />
                          <span>Alert</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* ── TAB 3: PLATFORM WEBHOOKS REGISTRY ─────────────────────────────── */}
          {activeTab === 'webhooks' && (
            <div className="space-y-4">
              <div className="bg-surface border border-border rounded-md p-5">
                <h3 className="text-xs font-semibold text-text-primary mb-1">
                  Meta WhatsApp webhook callback registry
                </h3>
                <p className="text-xs text-text-muted mb-4">
                  Copy each client organization's dedicated Webhook Callback URL and Verification Token into the Meta App Developer Portal (WhatsApp &rarr; Configuration).
                </p>

                <div className="space-y-2.5">
                  {tenants.map((t) => {
                    const url = `https://whatsapp-automation-system-eta.vercel.app/webhooks/whatsapp/${t.slug}`;
                    const token = `${t.slug}_token`;
                    return (
                      <div key={t.id} className="p-3 bg-surface-subtle border border-border rounded-sm flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-xs text-text-primary">{t.name}</span>
                            <span className="text-[11px] font-mono text-text-muted">({t.slug})</span>
                          </div>
                          <p className="text-xs font-mono text-text-secondary mt-0.5 break-all">{url}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyToClipboard(url, `url-${t.id}`)}
                            className="px-2.5 py-1 bg-surface hover:bg-surface-subtle text-text-body border border-border rounded-sm text-xs font-medium transition-colors duration-150 cursor-pointer flex items-center gap-1"
                          >
                            {copiedField === `url-${t.id}` ? <Check className="w-3 h-3 stroke-[1.5] text-status-success" /> : <Copy className="w-3 h-3 stroke-[1.5]" />}
                            <span>Copy URL</span>
                          </button>

                          <button
                            onClick={() => copyToClipboard(token, `token-${t.id}`)}
                            className="px-2.5 py-1 bg-surface hover:bg-surface-subtle text-text-body border border-border rounded-sm text-xs font-medium transition-colors duration-150 cursor-pointer flex items-center gap-1"
                          >
                            {copiedField === `token-${t.id}` ? <Check className="w-3 h-3 stroke-[1.5] text-status-success" /> : <Copy className="w-3 h-3 stroke-[1.5]" />}
                            <span>Copy verify token</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 4: SUPER ADMIN NOTIFICATION SETTINGS ──────────────────────── */}
          {activeTab === 'admin_config' && (
            <div className="max-w-xl bg-surface border border-border rounded-md p-5 space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-text-primary">
                  Super admin alert notification settings
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Configure where platform alerts, Razorpay client renewal reminders, and system notifications are dispatched.
                </p>
              </div>

              <form onSubmit={handleSaveAdminPhone} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    Super admin WhatsApp phone (with country code)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 917603807215"
                    value={superAdminPhone}
                    onChange={(e) => setSuperAdminPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    All upcoming Razorpay client auto-debit alerts and due date digests will be sent to this WhatsApp number.
                  </p>
                </div>

                <div className="p-3.5 bg-surface-subtle border border-border rounded-sm space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-success stroke-[1.5]" />
                    <span className="text-xs font-medium text-text-primary">Alert types enabled:</span>
                  </div>
                  <ul className="text-xs text-text-muted space-y-0.5 list-disc pl-5">
                    <li>2-Day prior notice before client's monthly Razorpay renewal.</li>
                    <li>Same-day auto-debit settlement confirmation.</li>
                    <li>Manual renewal digest on demand.</li>
                  </ul>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleSendAdminAlert()}
                    disabled={sendingAdminAlert || !superAdminPhone}
                    className="px-3 py-1.5 bg-surface hover:bg-surface-subtle text-text-body text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer border border-border flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span>Send test alert</span>
                  </button>

                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer"
                  >
                    {savedPhoneNotice ? 'Saved' : 'Save phone'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </main>
      </div>

      {/* ── MODAL: EDIT CLIENT RAZORPAY BILLING SETTINGS ──────────────────────── */}
      {editingBillingTenant && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-md w-full max-w-md overflow-hidden shadow-subtle">
            
            <div className="h-12 px-5 border-b border-border flex items-center justify-between bg-surface">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-accent stroke-[1.5]" />
                <h3 className="text-xs font-semibold text-text-primary">
                  Configure billing
                </h3>
              </div>
              <button
                onClick={() => setEditingBillingTenant(null)}
                className="p-1 text-text-muted hover:text-text-primary rounded-sm transition-colors duration-150 cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            <form onSubmit={handleSaveBilling} className="p-5 space-y-3.5">
              <div className="p-2.5 bg-surface-subtle border border-border rounded-sm">
                <p className="text-xs font-medium text-text-muted">Client organization</p>
                <p className="text-xs font-semibold text-text-primary mt-0.5">{editingBillingTenant.name} (/{editingBillingTenant.slug})</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Subscription plan</label>
                  <select
                    value={billingPlan}
                    onChange={(e) => {
                      const p = e.target.value;
                      setBillingPlan(p);
                      if (p === 'starter') setBillingPrice(999);
                      else if (p === 'pro') setBillingPrice(2999);
                      else if (p === 'enterprise') setBillingPrice(9999);
                    }}
                    className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-sans text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                  >
                    <option value="starter">Starter (₹999/mo)</option>
                    <option value="pro">Pro (₹2,999/mo)</option>
                    <option value="enterprise">Enterprise (₹9,999/mo)</option>
                    <option value="custom">Custom plan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Monthly rate (₹) *</label>
                  <input
                    type="number"
                    min={0}
                    value={billingPrice}
                    onChange={(e) => setBillingPrice(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono tabular-nums text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Billing day of month</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={billingDay}
                    onChange={(e) => setBillingDay(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono tabular-nums text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Razorpay sub ID</label>
                  <input
                    type="text"
                    placeholder="sub_N4x89192"
                    value={billingRazorpayId}
                    onChange={(e) => setBillingRazorpayId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBillingTenant(null)}
                  className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBilling}
                  className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer disabled:opacity-50"
                >
                  {savingBilling ? 'Saving...' : 'Save settings'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ── MODAL: DELETE CLIENT ORGANIZATION CONFIRMATION ───────────────────── */}
      {deleteTenantTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-md w-full max-w-md overflow-hidden shadow-subtle">
            <div className="h-12 px-5 border-b border-border flex items-center justify-between bg-surface">
              <div className="flex items-center gap-2 text-status-error">
                <Trash2 className="w-4 h-4 stroke-[1.5]" />
                <h3 className="text-xs font-semibold">
                  Delete organization
                </h3>
              </div>
              <button
                onClick={() => setDeleteTenantTarget(null)}
                className="p-1 text-text-muted hover:text-text-primary rounded-sm transition-colors duration-150 cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-text-body leading-relaxed">
                Are you sure you want to permanently delete <strong>{deleteTenantTarget.name}</strong> (/{deleteTenantTarget.slug})?
              </p>
              <div className="p-3 bg-status-error-bg border border-status-error-border rounded-sm text-xs text-status-error space-y-1">
                <p className="font-semibold">Warning: This action cannot be undone.</p>
                <p>All associated bookings, conversations, contacts, and credentials will be permanently erased.</p>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTenantTarget(null)}
                  className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deletingTenant}
                  onClick={handleDeleteTenant}
                  className="px-3.5 py-1.5 bg-status-error hover:bg-status-error text-white text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {deletingTenant ? <RefreshCw className="w-3.5 h-3.5 animate-spin stroke-[1.5]" /> : <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />}
                  <span>Delete organization</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ONBOARD CLIENT ORGANIZATION ────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-md w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-subtle">
            
            {/* Modal Header */}
            <div className="h-12 px-5 border-b border-border flex items-center justify-between shrink-0 bg-surface">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-accent stroke-[1.5]" />
                <h3 className="text-xs font-semibold text-text-primary">
                  Onboard client organization
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-text-muted hover:text-text-primary rounded-sm transition-colors duration-150 cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateClient} className="p-5 overflow-y-auto space-y-3.5 flex-1">
              {formError && (
                <div className="p-3 bg-status-error-bg border border-status-error-border text-status-error text-xs rounded-sm font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Company / Organization name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Health Clinic"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">URL Identifier (Slug) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. apex-health"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '') })}
                    className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Admin account email *</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@clientclinic.com"
                    value={formData.admin_email}
                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                    className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Admin initial password *</label>
                  <input
                    type="text"
                    required
                    placeholder="Initial password"
                    value={formData.admin_password}
                    onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                    className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                  />
                </div>
              </div>

              {/* Plan & Custom Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Subscription plan</label>
                  <select
                    value={formData.plan}
                    onChange={(e) => {
                      const p = e.target.value;
                      let price = formData.monthly_price;
                      if (p === 'starter') price = 999;
                      else if (p === 'pro') price = 2999;
                      else if (p === 'enterprise') price = 9999;
                      setFormData({ ...formData, plan: p, monthly_price: price });
                    }}
                    className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-sans text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                  >
                    <option value="starter">Starter (₹999/mo)</option>
                    <option value="pro">Pro (₹2,999/mo)</option>
                    <option value="enterprise">Enterprise (₹9,999/mo)</option>
                    <option value="custom">Custom plan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Monthly amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="2999"
                    value={formData.monthly_price}
                    onChange={(e) => setFormData({ ...formData, monthly_price: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono tabular-nums text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Billing day of month</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={formData.billing_cycle_day}
                    onChange={(e) => setFormData({ ...formData, billing_cycle_day: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono tabular-nums text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Razorpay subscription ID (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. sub_N4x89192"
                  value={formData.razorpay_subscription_id}
                  onChange={(e) => setFormData({ ...formData, razorpay_subscription_id: e.target.value })}
                  className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-border flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {formSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin stroke-[1.5]" /> : <Plus className="w-3.5 h-3.5 stroke-[1.5]" />}
                  <span>Provision organization</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ── MODAL: RESET CLIENT PASSWORD ──────────────────────────────────────── */}
      {resetTenantId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-md w-full max-w-sm overflow-hidden shadow-subtle">
            <div className="h-12 px-5 border-b border-border flex items-center justify-between bg-surface">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-accent stroke-[1.5]" />
                <h3 className="text-xs font-semibold text-text-primary">
                  Reset client password
                </h3>
              </div>
              <button
                onClick={() => setResetTenantId(null)}
                className="p-1 text-text-muted hover:text-text-primary rounded-sm transition-colors duration-150 cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-5 space-y-3.5">
              {resetSuccess ? (
                <div className="p-3 bg-status-success-bg border border-status-success-border text-status-success text-xs rounded-sm font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span>Password reset successfully</span>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">New password</label>
                    <input
                      type="text"
                      required
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setResetTenantId(null)}
                      className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newPassword || newPassword.length < 6}
                      className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer disabled:opacity-50"
                    >
                      Update password
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

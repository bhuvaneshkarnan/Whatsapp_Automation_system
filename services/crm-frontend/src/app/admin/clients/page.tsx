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
    <div className="flex h-screen bg-white text-slate-900 font-sans antialiased overflow-hidden">
      
      {/* ── 1. SUPER ADMIN SIDEBAR (Matching CRM Dashboard Design System) ────── */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 select-none border-r border-slate-800">
        
        {/* Brand & Platform Name */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-white text-slate-900 flex items-center justify-center font-bold text-sm shadow-sm">
            <Building2 className="w-4 h-4 text-slate-900" />
          </div>
          <div>
            <h1 className="font-headline font-bold text-xs text-white uppercase tracking-wider">
              Boldlabs Super Admin
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Multi-Tenant Platform Hub</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-headline">
            Platform Management
          </div>

          {[
            { id: 'organizations', label: 'Organizations & Workspaces', icon: Building2 },
            { id: 'razorpay', label: 'Razorpay Billing & Due Dates', icon: CreditCard },
            { id: 'webhooks', label: 'Platform Webhook URLs', icon: Key },
            { id: 'admin_config', label: 'Admin WhatsApp Alert Config', icon: Bell },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                  active
                    ? 'bg-white text-slate-900 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 stroke-[2] ${active ? 'text-slate-900' : 'text-slate-400'}`} />
                <span className="flex-1">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer: Quick switch back to CRM Dashboard */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer border border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to CRM Operations</span>
          </button>
        </div>

      </aside>

      {/* ── 2. MAIN SUPER ADMIN WORKSPACE ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-headline font-bold text-sm text-slate-900">
              {activeTab === 'organizations' && 'Client Organizations Directory'}
              {activeTab === 'razorpay' && 'Razorpay Subscriptions & Admin Due Alerts'}
              {activeTab === 'webhooks' && 'Meta WhatsApp Callback Webhook Registry'}
              {activeTab === 'admin_config' && 'Super Admin Notification Settings'}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Manage client accounts, configure automated Razorpay renewal alerts to your WhatsApp, and inspect endpoints.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Super Admin Phone Pill */}
            <button
              onClick={() => setActiveTab('admin_config')}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 transition cursor-pointer"
              title="Click to configure WhatsApp Alert recipient"
            >
              <Bell className="w-3.5 h-3.5 text-slate-900" />
              <span>Admin Alert WhatsApp:</span>
              <span className="font-mono font-bold text-slate-900">
                {superAdminPhone ? `+${superAdminPhone}` : 'Click to Configure'}
              </span>
            </button>

            <button
              onClick={() => loadData()}
              disabled={loading}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer border border-slate-200"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Onboard Organization</span>
            </button>
          </div>
        </header>

        {/* Global Action / Alert Toast Notice */}
        {(actionSuccessNotice || alertSuccessNotice) && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs text-emerald-800 flex items-center justify-between font-medium animate-fadeIn shrink-0">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{actionSuccessNotice || alertSuccessNotice}</span>
            </span>
          </div>
        )}

        {/* Scrollable Body */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* ── 4 KPI Metrics Row ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Total Organizations */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 font-headline uppercase tracking-wider">
                  Organizations
                </span>
                <Building2 className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-2.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-headline text-slate-900 font-mono">
                    {tenants.length}
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    {tenants.filter((t) => t.status === 'active').length} Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  {tenants.filter((t) => t.status !== 'active').length} paused
                </p>
              </div>
            </div>

            {/* 2. Platform MRR */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 font-headline uppercase tracking-wider">
                  Platform MRR
                </span>
                <DollarSign className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-2.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-headline text-slate-900 font-mono">
                    ₹{totalCalculatedMRR.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">/ mo</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  Razorpay Subscriptions (Auto-Debit)
                </p>
              </div>
            </div>

            {/* 3. Razorpay Due Date Tracker */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 font-headline uppercase tracking-wider">
                  Admin WhatsApp Alerts
                </span>
                <Bell className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-2.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-headline text-slate-900 font-mono">
                    {superAdminPhone ? 'Active' : 'Setup Required'}
                  </span>
                  <span className="text-xs font-bold text-emerald-700">● Live</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  {superAdminPhone ? `Alerts sent to +${superAdminPhone}` : 'Configure phone below'}
                </p>
              </div>
            </div>

            {/* 4. Platform Traffic */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 font-headline uppercase tracking-wider">
                  WhatsApp Activity
                </span>
                <Activity className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-2.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-headline text-slate-900 font-mono">
                    {stats?.total_messages || 0}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Msgs</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  Across all client instances
                </p>
              </div>
            </div>

          </div>

          {/* ── TAB 1: CLIENT ORGANIZATIONS DIRECTORY ─────────────────────────── */}
          {activeTab === 'organizations' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              
              {/* Search & Filter Bar */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap bg-slate-50/50">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search organizations, slug, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 font-medium"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-900"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="paused">Paused Only</option>
                  </select>

                  <button
                    onClick={() => handleSendAdminAlert()}
                    disabled={sendingAdminAlert || !superAdminPhone}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition cursor-pointer border border-slate-200 flex items-center gap-1.5 disabled:opacity-50"
                    title="Send consolidated Razorpay renewal digest to Super Admin WhatsApp"
                  >
                    <Send className="w-3 h-3 text-slate-700" />
                    <span>Send Due Digest to My WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              {loading ? (
                <div className="p-16 text-center text-xs text-slate-400">Loading client organizations...</div>
              ) : filteredTenants.length === 0 ? (
                <div className="p-16 text-center space-y-3">
                  <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 font-headline">No organizations matching filter</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-headline">
                        <th className="py-3 px-4">Organization</th>
                        <th className="py-3 px-4">Plan & Rate</th>
                        <th className="py-3 px-4">Razorpay Renewal</th>
                        <th className="py-3 px-4">Admin Contact</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Quick Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredTenants.map((t) => {
                        const planFee = t.monthly_price || ((t.plan || 'pro').toLowerCase() === 'starter' ? 999 : (t.plan || 'pro').toLowerCase() === 'enterprise' ? 9999 : 2999);
                        const renewalDay = t.billing_cycle_day || 1;
                        return (
                          <tr key={t.id} className="hover:bg-slate-50/60 transition group">
                            
                            {/* Organization Name */}
                            <td className="py-3 px-4 font-medium">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center font-bold text-[11px] font-headline">
                                  {t.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{t.name}</p>
                                  <p className="text-[10px] font-mono text-slate-400">/{t.slug}</p>
                                </div>
                              </div>
                            </td>

                            {/* Plan & Rate */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                                  {t.plan || 'PRO'}
                                </span>
                                <span className="text-[11px] font-mono font-semibold text-slate-700">
                                  ₹{planFee.toLocaleString('en-IN')}/m
                                </span>
                              </div>
                            </td>

                            {/* Razorpay Renewal Date */}
                            <td className="py-3 px-4">
                              <div className="space-y-0.5">
                                <p className="font-medium text-slate-800 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-500" />
                                  <span>Every {renewalDay}th of month</span>
                                </p>
                                <p className="text-[10px] font-mono text-slate-400">
                                  {t.razorpay_subscription_id ? `ID: ${t.razorpay_subscription_id}` : 'Auto-Debit Active'}
                                </p>
                              </div>
                            </td>

                            {/* Admin Contact */}
                            <td className="py-3 px-4">
                              <p className="font-medium text-slate-800">{t.admin_email || '—'}</p>
                              <p className="text-[10px] text-slate-400">{t.contact_count || 0} Contacts &bull; {t.conversation_count || 0} Chats</p>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleToggleStatus(t.id, t.status === 'active')}
                                disabled={togglingId === t.id}
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition cursor-pointer border ${
                                  t.status === 'active'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                }`}
                                title="Click to toggle status"
                              >
                                {t.status === 'active' ? <Play className="w-2.5 h-2.5 fill-emerald-700" /> : <Pause className="w-2.5 h-2.5 fill-rose-700" />}
                                <span>{t.status === 'active' ? 'ACTIVE' : 'PAUSED'}</span>
                              </button>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                
                                {/* Send WhatsApp Alert about this client directly to Super Admin */}
                                <button
                                  onClick={() => handleSendAdminAlert(t.id)}
                                  disabled={sendingAdminAlert || !superAdminPhone}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
                                  title="Send Razorpay due alert for this client to Super Admin WhatsApp"
                                >
                                  <Bell className="w-3 h-3 text-slate-700" />
                                  <span>Alert Admin</span>
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
                                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-medium transition cursor-pointer flex items-center gap-1"
                                  title="Configure Plan & Razorpay Settings"
                                >
                                  <Sliders className="w-3 h-3" />
                                  <span>Billing</span>
                                </button>

                                {/* Impersonate / Open CRM */}
                                <button
                                  onClick={() => handleImpersonateTenant(t.id)}
                                  className="px-2.5 py-1 bg-slate-900 hover:bg-black text-white rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                                  title="Access this Tenant's CRM Workspace"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Open CRM</span>
                                </button>

                                {/* Password Reset */}
                                <button
                                  onClick={() => {
                                    setResetTenantId(t.id);
                                    setNewPassword('');
                                    setResetSuccess(false);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer border border-slate-200"
                                  title="Reset Admin Password"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete Organization */}
                                <button
                                  onClick={() => setDeleteTenantTarget(t)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer border border-slate-200 hover:border-rose-200"
                                  title="Delete Organization Permanently"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
            <div className="space-y-6">
              
              {/* Informative Explanation Banner */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-1 max-w-2xl">
                  <h3 className="text-sm font-bold text-slate-900 font-headline flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-900" />
                    <span>Razorpay Subscription Auto-Debit & Admin Alert Center</span>
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Because your clients are billed automatically via Razorpay Subscriptions (Auto-Debit), no payment request is sent to the client. Instead, automated due date reminders are delivered directly to your <b>Super Admin WhatsApp number ({superAdminPhone ? `+${superAdminPhone}` : 'Configure phone'})</b> so you can track renewals effortlessly.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSendAdminAlert()}
                    disabled={sendingAdminAlert || !superAdminPhone}
                    className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Renewal Digest to My WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Client Razorpay Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tenants.map((t) => {
                  const planFee = t.monthly_price || ((t.plan || 'pro').toLowerCase() === 'starter' ? 999 : (t.plan || 'pro').toLowerCase() === 'enterprise' ? 9999 : 2999);
                  const renewalDay = t.billing_cycle_day || 1;
                  return (
                    <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div>
                            <h4 className="font-bold text-xs text-slate-900 font-headline">{t.name}</h4>
                            <p className="text-[10px] text-slate-400 font-mono">/{t.slug}</p>
                          </div>
                          <span className="text-[10px] font-mono uppercase font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200">
                            {t.plan || 'PRO'}
                          </span>
                        </div>

                        <div className="mt-3 space-y-2 text-xs">
                          <div className="flex justify-between text-slate-600">
                            <span>Subscription Rate:</span>
                            <span className="font-bold font-mono text-slate-900">₹{planFee.toLocaleString('en-IN')} / mo</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Billing Cycle:</span>
                            <span className="font-semibold text-slate-800">Every {renewalDay}th of month</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Razorpay Sub ID:</span>
                            <span className="font-mono text-slate-700">{t.razorpay_subscription_id || 'Auto-Debit Active'}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Payment Method:</span>
                            <span className="text-emerald-700 font-semibold">Razorpay Auto-Debit</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
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
                            className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                          >
                            Edit Billing
                          </button>

                          <button
                            onClick={() => setDeleteTenantTarget(t)}
                            className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>

                        <button
                          onClick={() => handleSendAdminAlert(t.id)}
                          disabled={sendingAdminAlert || !superAdminPhone}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Bell className="w-3 h-3" />
                          <span>Alert My WhatsApp</span>
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
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-slate-900 font-headline mb-1">
                  Centralized Meta WhatsApp Webhook Callback Registry
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Copy each client organization's dedicated Webhook Callback URL and Verification Token into the Meta App Developer Portal (WhatsApp &rarr; Configuration).
                </p>

                <div className="space-y-3">
                  {tenants.map((t) => {
                    const url = `https://whatsapp-automation-system-eta.vercel.app/webhooks/whatsapp/${t.slug}`;
                    const token = `${t.slug}_token`;
                    return (
                      <div key={t.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 font-headline">{t.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">({t.slug})</span>
                          </div>
                          <p className="text-[11px] font-mono text-slate-600 mt-0.5">{url}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyToClipboard(url, `url-${t.id}`)}
                            className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                          >
                            {copiedField === `url-${t.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>Copy Webhook URL</span>
                          </button>

                          <button
                            onClick={() => copyToClipboard(token, `token-${t.id}`)}
                            className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                          >
                            {copiedField === `token-${t.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>Copy Verify Token</span>
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
            <div className="max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-headline">
                  Super Admin Alert Notification Settings
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Configure where platform alerts, Razorpay client renewal reminders, and system notifications are dispatched.
                </p>
              </div>

              <form onSubmit={handleSaveAdminPhone} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Super Admin WhatsApp Phone Number (with Country Code)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 918870341570"
                    value={superAdminPhone}
                    onChange={(e) => setSuperAdminPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    All upcoming Razorpay client auto-debit alerts and due date digests will be sent to this WhatsApp number.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">What alerts will you receive?</span>
                  </div>
                  <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-5">
                    <li>2-Day Prior Notification before a client's monthly Razorpay renewal.</li>
                    <li>Same-Day Auto-Debit Settlement confirmation alerts.</li>
                    <li>Instant manual renewal digests whenever you click "Send Due Digest to My WhatsApp".</li>
                  </ul>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleSendAdminAlert()}
                    disabled={sendingAdminAlert || !superAdminPhone}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition cursor-pointer border border-slate-200 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5 text-slate-700" />
                    <span>Send Test WhatsApp Alert Now</span>
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    {savedPhoneNotice ? '✓ Saved!' : 'Save Phone Number'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </main>
      </div>

      {/* ── MODAL: EDIT CLIENT RAZORPAY BILLING SETTINGS ──────────────────────── */}
      {editingBillingTenant && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-md overflow-hidden animate-scaleIn">
            
            <div className="h-14 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-900" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-headline">
                  Configure Razorpay Billing
                </h3>
              </div>
              <button
                onClick={() => setEditingBillingTenant(null)}
                className="p-1 text-slate-400 hover:text-slate-900 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBilling} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[10px] font-bold uppercase text-slate-400">Client Organization</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{editingBillingTenant.name} (/{editingBillingTenant.slug})</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subscription Plan</label>
                  <select
                    value={billingPlan}
                    onChange={(e) => {
                      const p = e.target.value;
                      setBillingPlan(p);
                      if (p === 'starter') setBillingPrice(999);
                      else if (p === 'pro') setBillingPrice(2999);
                      else if (p === 'enterprise') setBillingPrice(9999);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-slate-900"
                  >
                    <option value="starter">Starter Plan (₹999/mo)</option>
                    <option value="pro">Pro Plan (₹2,999/mo)</option>
                    <option value="enterprise">Enterprise Plan (₹9,999/mo)</option>
                    <option value="custom">Custom Pricing Plan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Rate (₹) *</label>
                  <input
                    type="number"
                    min={0}
                    value={billingPrice}
                    onChange={(e) => setBillingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-slate-900"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Editable custom amount</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Billing Day of Month</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={billingDay}
                    onChange={(e) => setBillingDay(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-slate-900"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Day {billingDay} every month</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Razorpay Sub ID</label>
                  <input
                    type="text"
                    placeholder="sub_N4x89192"
                    value={billingRazorpayId}
                    onChange={(e) => setBillingRazorpayId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBillingTenant(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBilling}
                  className="px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {savingBilling ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ── MODAL: DELETE CLIENT ORGANIZATION CONFIRMATION ───────────────────── */}
      {deleteTenantTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="h-14 px-6 border-b border-slate-200 flex items-center justify-between bg-rose-50/60">
              <div className="flex items-center gap-2 text-rose-700">
                <Trash2 className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider font-headline">
                  Delete Organization
                </h3>
              </div>
              <button
                onClick={() => setDeleteTenantTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-900 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                Are you sure you want to permanently delete <b>{deleteTenantTarget.name}</b> (/{deleteTenantTarget.slug})?
              </p>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 space-y-1">
                <p className="font-bold">⚠️ Warning: This action cannot be undone.</p>
                <p>All associated bookings, conversations, contacts, and credentials will be permanently erased.</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTenantTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deletingTenant}
                  onClick={handleDeleteTenant}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {deletingTenant ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Yes, Delete Organization</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ONBOARD CLIENT ORGANIZATION ────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleIn">
            
            {/* Modal Header */}
            <div className="h-14 px-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-900" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-headline">
                  Onboard Client Organization
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-900 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateClient} className="p-6 overflow-y-auto space-y-4 flex-1">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company / Organization Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Health Clinic"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">URL Identifier (Slug) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. apex-health"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '') })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Admin Account Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@clientclinic.com"
                    value={formData.admin_email}
                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Admin Initial Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="Initial password"
                    value={formData.admin_password}
                    onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Plan & Custom Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subscription Plan</label>
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
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900 font-medium"
                  >
                    <option value="starter">Starter Plan (₹999/mo)</option>
                    <option value="pro">Pro Plan (₹2,999/mo)</option>
                    <option value="enterprise">Enterprise Plan (₹9,999/mo)</option>
                    <option value="custom">Custom Pricing Plan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="Enter custom amount"
                    value={formData.monthly_price}
                    onChange={(e) => setFormData({ ...formData, monthly_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Custom monthly rate for this client</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Billing Day of Month</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={formData.billing_cycle_day}
                    onChange={(e) => setFormData({ ...formData, billing_cycle_day: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Day {formData.billing_cycle_day} every month</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Razorpay Subscription ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. sub_N4x89192 (Leave empty if direct auto-debit)"
                  value={formData.razorpay_subscription_id}
                  onChange={(e) => setFormData({ ...formData, razorpay_subscription_id: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-900"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {formSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Provision Client Organization</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ── MODAL: RESET CLIENT PASSWORD ──────────────────────────────────────── */}
      {resetTenantId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-sm overflow-hidden animate-scaleIn">
            <div className="h-14 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-900" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-headline">
                  Reset Client Password
                </h3>
              </div>
              <button
                onClick={() => setResetTenantId(null)}
                className="p-1 text-slate-400 hover:text-slate-900 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              {resetSuccess ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Password reset successfully!</span>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">New Secure Password</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter new password (min 6 chars)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setResetTenantId(null)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newPassword || newPassword.length < 6}
                      className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
                    >
                      Update Password
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

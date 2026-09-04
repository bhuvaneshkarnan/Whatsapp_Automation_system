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
  Bot,
  Globe,
  Mail,
  MapPin,
  CalendarDays,
  Cpu,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  Shield,
  Smartphone,
  Info,
  Star,
  Database,
  Eye,
  EyeOff,
  Terminal,
  Hash,
  Server,
  KeyRound,
  Braces,
  FileCode,
  CheckSquare,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import {
  admin,
  ClientTenant,
  ClientCreatedResponse,
  PlatformStats,
  TenantSettingsResponse,
  TenantSettingsUpdate,
  Invoice,
} from '@/lib/api';


const COUNTRY_CODES = [
  { code: '+91', country: 'India (+91)' },
  { code: '+1', country: 'United States / Canada (+1)' },
  { code: '+44', country: 'United Kingdom (+44)' },
  { code: '+971', country: 'United Arab Emirates (+971)' },
  { code: '+966', country: 'Saudi Arabia (+966)' },
  { code: '+61', country: 'Australia (+61)' },
  { code: '+65', country: 'Singapore (+65)' },
  { code: '+60', country: 'Malaysia (+60)' },
  { code: '+974', country: 'Qatar (+974)' },
  { code: '+965', country: 'Kuwait (+965)' },
  { code: '+968', country: 'Oman (+968)' },
  { code: '+973', country: 'Bahrain (+973)' },
  { code: '+49', country: 'Germany (+49)' },
  { code: '+33', country: 'France (+33)' },
  { code: '+39', country: 'Italy (+39)' },
  { code: '+34', country: 'Spain (+34)' },
  { code: '+31', country: 'Netherlands (+31)' },
  { code: '+41', country: 'Switzerland (+41)' },
  { code: '+353', country: 'Ireland (+353)' },
  { code: '+64', country: 'New Zealand (+64)' },
  { code: '+27', country: 'South Africa (+27)' },
  { code: '+234', country: 'Nigeria (+234)' },
  { code: '+254', country: 'Kenya (+254)' },
  { code: '+20', country: 'Egypt (+20)' },
  { code: '+90', country: 'Turkey (+90)' },
  { code: '+81', country: 'Japan (+81)' },
  { code: '+82', country: 'South Korea (+82)' },
  { code: '+852', country: 'Hong Kong (+852)' },
  { code: '+63', country: 'Philippines (+63)' },
  { code: '+62', country: 'Indonesia (+62)' },
  { code: '+66', country: 'Thailand (+66)' },
  { code: '+84', country: 'Vietnam (+84)' },
  { code: '+94', country: 'Sri Lanka (+94)' },
  { code: '+880', country: 'Bangladesh (+880)' },
  { code: '+92', country: 'Pakistan (+92)' },
  { code: '+977', country: 'Nepal (+977)' },
  { code: '+55', country: 'Brazil (+55)' },
  { code: '+52', country: 'Mexico (+52)' },
  { code: '+54', country: 'Argentina (+54)' },
  { code: '+57', country: 'Colombia (+57)' },
  { code: '+46', country: 'Sweden (+46)' },
  { code: '+47', country: 'Norway (+47)' },
  { code: '+45', country: 'Denmark (+45)' },
  { code: '+358', country: 'Finland (+358)' },
  { code: '+48', country: 'Poland (+48)' },
  { code: '+972', country: 'Israel (+972)' },
];

const CURRENCY_LIST = [
  { code: 'INR', symbol: '₹', name: 'INR (₹) - Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'USD ($) - US Dollar' },
  { code: 'EUR', symbol: '€', name: 'EUR (€) - Euro' },
  { code: 'GBP', symbol: '£', name: 'GBP (£) - British Pound' },
  { code: 'AED', symbol: 'AED ', name: 'AED - UAE Dirham' },
  { code: 'SAR', symbol: 'SAR ', name: 'SAR - Saudi Riyal' },
  { code: 'CAD', symbol: 'C$', name: 'CAD (C$) - Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'AUD (A$) - Australian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'SGD (S$) - Singapore Dollar' },
  { code: 'MYR', symbol: 'RM ', name: 'MYR (RM) - Malaysian Ringgit' },
  { code: 'QAR', symbol: 'QAR ', name: 'QAR - Qatari Riyal' },
  { code: 'KWD', symbol: 'KWD ', name: 'KWD - Kuwaiti Dinar' },
  { code: 'OMR', symbol: 'OMR ', name: 'OMR - Omani Rial' },
  { code: 'BHD', symbol: 'BHD ', name: 'BHD - Bahraini Dinar' },
  { code: 'NZD', symbol: 'NZ$', name: 'NZD (NZ$) - New Zealand Dollar' },
  { code: 'JPY', symbol: '¥', name: 'JPY (¥) - Japanese Yen' },
  { code: 'CHF', symbol: 'CHF ', name: 'CHF - Swiss Franc' },
  { code: 'ZAR', symbol: 'R ', name: 'ZAR (R) - South African Rand' },
  { code: 'PHP', symbol: '₱', name: 'PHP (₱) - Philippine Peso' },
  { code: 'IDR', symbol: 'Rp ', name: 'IDR (Rp) - Indonesian Rupiah' },
  { code: 'THB', symbol: '฿', name: 'THB (฿) - Thai Baht' },
  { code: 'VND', symbol: '₫', name: 'VND (₫) - Vietnamese Dong' },
  { code: 'PKR', symbol: 'Rs ', name: 'PKR (Rs) - Pakistani Rupee' },
  { code: 'BDT', symbol: '৳', name: 'BDT (৳) - Bangladeshi Taka' },
  { code: 'NGN', symbol: '₦', name: 'NGN (₦) - Nigerian Naira' },
  { code: 'KES', symbol: 'KSh ', name: 'KES (KSh) - Kenyan Shilling' },
  { code: 'EGP', symbol: 'E£ ', name: 'EGP (E£) - Egyptian Pound' },
  { code: 'TRY', symbol: '₺', name: 'TRY (₺) - Turkish Lira' },
  { code: 'BRL', symbol: 'R$', name: 'BRL (R$) - Brazilian Real' },
  { code: 'MXN', symbol: 'Mex$', name: 'MXN (Mex$) - Mexican Peso' },
];

const TIMEZONE_LIST = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST - GMT+5:30) [India]' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT - GMT-5/-4) [US East]' },
  { value: 'America/Chicago', label: 'America/Chicago (CST/CDT - GMT-6/-5) [US Central]' },
  { value: 'America/Denver', label: 'America/Denver (MST/MDT - GMT-7/-6) [US Mountain]' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT - GMT-8/-7) [US West]' },
  { value: 'America/Toronto', label: 'America/Toronto (EST/EDT) [Canada East]' },
  { value: 'America/Vancouver', label: 'America/Vancouver (PST/PDT) [Canada West]' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST - GMT+0/+1) [UK]' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST - GMT+1/+2) [W. Europe]' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST - GMT+1/+2) [Germany]' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST - GMT+4) [UAE]' },
  { value: 'Asia/Riyadh', label: 'Asia/Riyadh (AST - GMT+3) [Saudi Arabia]' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT - GMT+8) [Singapore]' },
  { value: 'Asia/Kuala_Lumpur', label: 'Asia/Kuala_Lumpur (MYT - GMT+8) [Malaysia]' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST - GMT+9) [Japan]' },
  { value: 'Asia/Seoul', label: 'Asia/Seoul (KST - GMT+9) [South Korea]' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST - GMT+8) [China]' },
  { value: 'Asia/Bangkok', label: 'Asia/Bangkok (ICT - GMT+7) [Thailand/Vietnam]' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT) [Australia East]' },
  { value: 'Australia/Perth', label: 'Australia/Perth (AWST - GMT+8) [Australia West]' },
  { value: 'Pacific/Auckland', label: 'Pacific/Auckland (NZST - GMT+12/+13) [New Zealand]' },
  { value: 'Africa/Johannesburg', label: 'Africa/Johannesburg (SAST - GMT+2) [South Africa]' },
  { value: 'Africa/Nairobi', label: 'Africa/Nairobi (EAT - GMT+3) [East Africa]' },
  { value: 'UTC', label: 'UTC - Coordinated Universal Time' },
];

const PREBUILT_REQUIREMENTS_BY_INDUSTRY: Record<string, string[]> = {
  clinic: [
    'General Consultation',
    'Back Pain & Physio',
    'Dental Checkup & Cleaning',
    'Skin Health & Dermatology',
    'Orthopedic Pain',
    'Diabetes & Wellness',
  ],
  education: [
    'Class 10 Board Exam',
    'Class 12 IIT-JEE (Physics/Math)',
    'NEET Medical Entrance',
    'Spoken English & Fluency',
    'Foundation Course (Grade 6-9)',
    'Coding & STEM for Kids',
  ],
  real_estate: [
    '2 BHK Apartment (Mid-Budget)',
    '3 BHK Luxury Villa',
    'Commercial Office Space',
    'Residential Plot / Land',
    'Penthouse / Waterfront',
  ],
  salon_spa: [
    'Haircut & Styling',
    'Keratin / Hair Spa',
    'Facial & Skin Rejuvenation',
    'Bridal Makeup Package',
    'Aromatherapy Massage',
  ],
  automobile: [
    'Periodic General Service',
    'Brake & Suspension Check',
    'Engine Diagnostics & Oil Change',
    'AC Service & Detailing',
    'Accidental Repair / Bodywork',
  ],
  consulting: [
    'Digital Transformation',
    'Sales & Marketing Strategy',
    'Legal / Compliance Advisory',
    'Website & Software Development',
    'Financial Audit',
  ],
  gym_fitness: [
    'Weight Loss & Cardio',
    'Muscle Building & Hypertrophy',
    'Strength & Conditioning',
    'Yoga & Flexibility',
    'Personal Training 1-on-1',
  ],
  restaurant: [
    'Dinner Table (2 Guests)',
    'Family Dining (4-6 Guests)',
    'Private Party / Birthday (10+ Guests)',
    'Corporate Lunch Reservation',
  ],
  custom: [
    'General Inquiry',
    'Service Consultation',
    'Priority Support',
    'Follow-up Session',
  ],
};

const INDUSTRY_PRESETS = [
  {
    id: 'education',
    name: 'Education, Academies & Coaching Institutes',
    taxonomy: {
      staff_label: 'Tutor / Counselor / Faculty',
      client_label: 'Student / Parent',
      requirement_label: 'Target Course & Grade',
      event_label: 'Demo Class / Counseling Session',
      booking_cta: '+ Book Demo Class / Counseling',
      requirement_presets: PREBUILT_REQUIREMENTS_BY_INDUSTRY.education,
    },
  },
  {
    id: 'clinic',
    name: 'Healthcare, Clinics & Wellness Centers',
    taxonomy: {
      staff_label: 'Preferred Doctor / Staff',
      client_label: 'Patient',
      requirement_label: 'Health Concern / Symptoms',
      event_label: 'Clinic Appointment',
      booking_cta: '+ New Appointment',
      requirement_presets: PREBUILT_REQUIREMENTS_BY_INDUSTRY.clinic,
    },
  },
  {
    id: 'real_estate',
    name: 'Real Estate, Developers & Property Brokers',
    taxonomy: {
      staff_label: 'Property Agent / Consultant',
      client_label: 'Buyer / Lead',
      requirement_label: 'Budget, Location & Unit Size',
      event_label: 'Site Visit / Walkthrough',
      booking_cta: '+ Schedule Site Visit',
      requirement_presets: PREBUILT_REQUIREMENTS_BY_INDUSTRY.real_estate,
    },
  },
  {
    id: 'salon_spa',
    name: 'Salons, Spas & Beauty Parlors',
    taxonomy: {
      staff_label: 'Preferred Stylist / Therapist',
      client_label: 'Client',
      requirement_label: 'Hair/Skin Goal & Desired Service',
      event_label: 'Salon Session / Slot',
      booking_cta: '+ Book Salon Session',
      requirement_presets: PREBUILT_REQUIREMENTS_BY_INDUSTRY.salon_spa,
    },
  },
  {
    id: 'automobile',
    name: 'Automobile Dealerships & Garages',
    taxonomy: {
      staff_label: 'Service Advisor / Mechanic',
      client_label: 'Vehicle Owner',
      requirement_label: 'Vehicle Model & Issue',
      event_label: 'Service Slot / Test Drive',
      booking_cta: '+ Book Service Slot',
      requirement_presets: PREBUILT_REQUIREMENTS_BY_INDUSTRY.automobile,
    },
  },
  {
    id: 'consulting',
    name: 'Consulting, Legal & Digital Agencies',
    taxonomy: {
      staff_label: 'Assigned Consultant / Executive',
      client_label: 'Client / Prospect',
      requirement_label: 'Project Scope & Requirements',
      event_label: 'Strategy Call / Consultation',
      booking_cta: '+ Book Discovery Call',
      requirement_presets: PREBUILT_REQUIREMENTS_BY_INDUSTRY.consulting,
    },
  },
  {
    id: 'gym_fitness',
    name: 'Gyms, Fitness & Yoga Studios',
    taxonomy: {
      staff_label: 'Trainer / Coach',
      client_label: 'Member / Lead',
      requirement_label: 'Fitness Goal & Health Notes',
      event_label: 'Trial Class / Assessment',
      booking_cta: '+ Book Trial Class',
      requirement_presets: PREBUILT_REQUIREMENTS_BY_INDUSTRY.gym_fitness,
    },
  },
  {
    id: 'restaurant',
    name: 'Restaurants, Cafes & Fine Dining',
    taxonomy: {
      staff_label: 'Captain / Host',
      client_label: 'Guest',
      requirement_label: 'Party Size & Dietary Preferences',
      event_label: 'Table Reservation',
      booking_cta: '+ Reserve Table',
      requirement_presets: PREBUILT_REQUIREMENTS_BY_INDUSTRY.restaurant,
    },
  },
  {
    id: 'custom',
    name: 'Custom / General Business Services',
    taxonomy: {
      staff_label: 'Staff Member',
      client_label: 'Customer',
      requirement_label: 'Service Details',
      event_label: 'Appointment',
      booking_cta: '+ Book Appointment',
      requirement_presets: PREBUILT_REQUIREMENTS_BY_INDUSTRY.custom,
    },
  },
];

export default function SuperAdminClients() {
  const router = useRouter();
  const [tenants, setTenants] = useState<ClientTenant[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Navigation tabs in Super Admin (Webhooks merged directly into organizations)
  const [activeTab, setActiveTab] = useState<'organizations' | 'razorpay' | 'admin_config'>('organizations');
  const [showWebhooksRegistry, setShowWebhooksRegistry] = useState(false);

  // Super Admin WhatsApp Notification Config (stored in localStorage & synced)
  const [superAdminPhone, setSuperAdminPhone] = useState<string>('');
  const [savedPhoneNotice, setSavedPhoneNotice] = useState(false);

  // ── DATABASE RECORD INSPECTOR MODAL STATE ────────────────────────────────────
  const [viewingDbTenant, setViewingDbTenant] = useState<ClientTenant | null>(null);
  const [dbTenantSettings, setDbTenantSettings] = useState<TenantSettingsResponse | null>(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState('');
  const [dbViewSubtab, setDbViewSubtab] = useState<'overview' | 'ai' | 'credentials' | 'webhook' | 'calendar' | 'templates' | 'location' | 'raw_json'>('overview');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [dbSearchQuery, setDbSearchQuery] = useState('');

  // ── TENANT FULL CONFIGURATION MODAL / DRAWER STATE ──────────────────────────
  const [editingConfigTenant, setEditingConfigTenant] = useState<ClientTenant | null>(null);
  const [configTab, setConfigTab] = useState<'ai' | 'whatsapp' | 'templates' | 'location' | 'calendar' | 'billing'>('ai');
  const [configForm, setConfigForm] = useState<TenantSettingsUpdate>({});
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configError, setConfigError] = useState('');
  const [configSavedNotice, setConfigSavedNotice] = useState(false);

  // Edit Client Razorpay Billing Modal
  const [editingBillingTenant, setEditingBillingTenant] = useState<ClientTenant | null>(null);
  const [billingPlan, setBillingPlan] = useState<string>('pro');
  const [billingPrice, setBillingPrice] = useState<number>(3499);
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

  // Razorpay Active Billing & Invoices States
  const [activatingBillingId, setActivatingBillingId] = useState<string | null>(null);
  const [syncingBillingId, setSyncingBillingId] = useState<string | null>(null);
  const [activePaymentModalTenant, setActivePaymentModalTenant] = useState<ClientTenant | null>(null);
  const [viewingInvoicesTenant, setViewingInvoicesTenant] = useState<ClientTenant | null>(null);
  const [tenantInvoices, setTenantInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Onboard Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdClient, setCreatedClient] = useState<(ClientCreatedResponse & { password?: string }) | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // Password reset modal state
  const [resetTenantId, setResetTenantId] = useState<string | null>(null);
  const [resetTenantName, setResetTenantName] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  // Form state for Onboarding
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const initialFormData = {
    name: '',
    slug: '',
    admin_email: '',
    admin_password: '',
    plan: 'pro',
    monthly_price: 3499,
    billing_cycle_day: 1,
    razorpay_subscription_id: '',
    meta_phone_id: '',
    meta_access_token: '',
    meta_app_secret: '',
    verify_token: '',
    ai_prompt: '',
    ai_model: 'gemini-3.1-flash-lite',
    primary_model_provider: 'groq',
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
    template_reschedule_confirmation: 'booking_reschedule_confirmation',
    template_admin_reschedule_notice: 'admin_reschedule_notice',
    template_client_followup: 'client_followup_checkin',
  };

  const [formData, setFormData] = useState(initialFormData);

  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      router.replace('/bhuvanesh');
      return;
    }

    // Verify token and verify super_admin role against auth service
    fetch('/api/v1/auth/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Unauthorized');
        const user = await res.json();
        if (user.role !== 'super_admin') {
          router.replace('/dashboard');
          return;
        }
        setAuthChecking(false);
        const saved = localStorage.getItem('boldlabs_super_admin_phone');
        if (saved) setSuperAdminPhone(saved);
        loadData();
      })
      .catch(() => {
        router.replace('/bhuvanesh');
      });
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
        admin.getStats(),
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

  // ── Open Database Inspector Modal ──────────────────────────────────────────
  async function handleOpenDatabaseView(tenant: ClientTenant, initialSubtab: 'overview' | 'ai' | 'credentials' | 'webhook' | 'calendar' | 'templates' | 'location' | 'raw_json' = 'overview') {
    setViewingDbTenant(tenant);
    setDbViewSubtab(initialSubtab);
    setDbLoading(true);
    setDbError('');
    setShowSecrets({});
    setDbSearchQuery('');
    try {
      const data = await admin.getTenantSettings(tenant.id);
      setDbTenantSettings(data);
    } catch (err: unknown) {
      setDbError(err instanceof Error ? err.message : 'Failed to retrieve database records for this organization.');
    } finally {
      setDbLoading(false);
    }
  }

  function toggleSecretVisibility(key: string) {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // ── Open & Save Tenant Configuration ───────────────────────────────────────
  async function handleOpenConfig(tenant: ClientTenant, initialTab: 'ai' | 'whatsapp' | 'templates' | 'location' | 'calendar' | 'billing' = 'ai') {
    setEditingConfigTenant(tenant);
    setConfigTab(initialTab);
    setConfigLoading(true);
    setConfigError('');
    setConfigSavedNotice(false);
    try {
      const data = await admin.getTenantSettings(tenant.id);
      setConfigForm(data);
    } catch (err: unknown) {
      setConfigError(err instanceof Error ? err.message : 'Failed to load organization settings.');
    } finally {
      setConfigLoading(false);
    }
  }

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!editingConfigTenant) return;
    setConfigSaving(true);
    setConfigError('');
    try {
      const updated = await admin.updateTenantSettings(editingConfigTenant.id, configForm);
      setConfigForm(updated);
      setConfigSavedNotice(true);
      setActionSuccessNotice(`Settings saved for "${editingConfigTenant.name}"`);
      setTimeout(() => {
        setConfigSavedNotice(false);
        setActionSuccessNotice(null);
      }, 3000);
      loadData();
    } catch (err: unknown) {
      setConfigError(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setConfigSaving(false);
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

  async function handleActivateBilling(tenant: ClientTenant, force: boolean = false) {
    setActivatingBillingId(tenant.id);
    try {
      const res = await admin.activateBilling(tenant.id, force);
      const updatedTenant: ClientTenant = {
        ...tenant,
        org_lifecycle_stage: res.org_lifecycle_stage,
        subscription_status: res.subscription_status,
        razorpay_subscription_id: res.subscription_id,
        razorpay_short_url: res.short_url,
      };
      setTenants((prev) =>
        prev.map((t) => (t.id === tenant.id ? updatedTenant : t))
      );
      setActivePaymentModalTenant(updatedTenant);
      setActionSuccessNotice(`Billing link updated for ${tenant.name}! Live checkout is ready.`);
      setTimeout(() => setActionSuccessNotice(null), 5000);
    } catch (err: any) {
      alert(`Failed to activate billing: ${err?.message || err}`);
    } finally {
      setActivatingBillingId(null);
    }
  }

  async function handleSyncBilling(tenant: ClientTenant) {
    setSyncingBillingId(tenant.id);
    try {
      const res = await admin.syncBilling(tenant.id);
      setTenants((prev) =>
        prev.map((t) =>
          t.id === tenant.id
            ? {
                ...t,
                subscription_status: res.subscription_status,
                org_lifecycle_stage: res.org_lifecycle_stage,
                next_charge_at: res.next_charge_at,
              }
            : t
        )
      );
      setActionSuccessNotice(`Synced with Razorpay: ${res.subscription_status.toUpperCase()} (${res.invoices_synced} invoices updated)`);
      setTimeout(() => setActionSuccessNotice(null), 5000);
    } catch (err: any) {
      alert(`Sync failed: ${err?.message || err}`);
    } finally {
      setSyncingBillingId(null);
    }
  }

  async function handleViewInvoices(tenant: ClientTenant) {
    setViewingInvoicesTenant(tenant);
    setLoadingInvoices(true);
    try {
      const invs = await admin.getInvoices(tenant.id);
      setTenantInvoices(invs);
    } catch (err: any) {
      alert(`Failed to load invoices: ${err?.message || err}`);
    } finally {
      setLoadingInvoices(false);
    }
  }

  function handleCopyPaymentLink(url: string, id: string) {
    navigator.clipboard.writeText(url);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2500);
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
    setResettingPassword(true);
    setResetError('');
    try {
      await admin.resetPassword(resetTenantId, newPassword);
      setResetSuccess(true);
      setTimeout(() => {
        setResetTenantId(null);
        setNewPassword('');
        setResetSuccess(false);
      }, 2000);
    } catch (err: unknown) {
      setResetError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setResettingPassword(false);
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
    return acc + 3499;
  }, 0);

  if (authChecking) {
    return (
      <div className="h-screen w-full bg-canvas flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-xs text-text-secondary font-medium">Verifying Super Admin Access...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-canvas text-text-primary font-sans antialiased overflow-hidden">
      
      {/* ── 1. SUPER ADMIN SIDEBAR ────────────────────────────────────────── */}
      <aside className="w-60 bg-surface text-text-secondary flex flex-col shrink-0 select-none border-r border-border">
        
        {/* Brand & Platform Name */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border">
          <div className="w-7 h-7 rounded-sm bg-accent text-white flex items-center justify-center shrink-0 font-bold text-xs">
            B
          </div>
          <div>
            <h1 className="font-semibold text-xs text-text-primary">
              Boldlabs Admin
            </h1>
            <p className="text-[11px] text-text-muted">Master control plane</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-2 py-1 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Platform
          </div>

          {[
            { id: 'organizations', label: 'Organizations & Config', icon: Building2 },
            { id: 'razorpay', label: 'Billing & Renewals', icon: CreditCard },
            { id: 'admin_config', label: 'Admin Notifications', icon: Bell },
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
                <Icon className={`w-3.5 h-3.5 stroke-[1.5] ${active ? 'text-accent' : 'text-text-muted'}`} />
                <span className="flex-1">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer: Quick switch back to CRM Dashboard & /bhuvanesh */}
        <div className="p-3 border-t border-border space-y-1.5">
          <button
            onClick={() => router.push('/bhuvanesh')}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent rounded-sm text-xs font-semibold transition-colors duration-150 cursor-pointer border border-accent/20"
            title="Open /bhuvanesh Workspace"
          >
            <MessageSquare className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Open /bhuvanesh CRM</span>
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface-subtle text-text-muted hover:text-text-primary rounded-sm text-xs font-medium transition-colors duration-150 cursor-pointer border border-border"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Return to Dashboard</span>
          </button>
        </div>

      </aside>

      {/* ── 2. MAIN SUPER ADMIN WORKSPACE ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-canvas">
        
        {/* Top Header */}
        <header className="h-14 border-b border-border bg-surface px-6 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-semibold text-xs text-text-primary">
              {activeTab === 'organizations' && 'Client Organizations & Centralized Configuration'}
              {activeTab === 'razorpay' && 'Razorpay Subscriptions & Renewal Alerts'}
              {activeTab === 'admin_config' && 'Super Admin Notification Settings'}
            </h2>
            <p className="text-xs text-text-muted">
              {activeTab === 'organizations' && 'Manage client workspaces, inspect live database records, configure AI brains, WhatsApp APIs, templates & billing'}
              {activeTab === 'razorpay' && 'Inspect client recurring billing statuses, renewal schedules, and WhatsApp alert digests'}
              {activeTab === 'admin_config' && 'Set your phone number for receiving automated system alerts and renewal reminders'}
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
              className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors duration-150 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Onboard organization</span>
            </button>
          </div>
        </header>

        {/* Global Action / Alert Toast Notice */}
        {(actionSuccessNotice || alertSuccessNotice) && (
          <div className="bg-status-success-bg border-b border-status-success-border px-6 py-2 text-xs text-status-success flex items-center justify-between font-medium shrink-0 animate-in fade-in duration-200">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>{actionSuccessNotice || alertSuccessNotice}</span>
            </span>
            <button onClick={() => { setActionSuccessNotice(null); setAlertSuccessNotice(null); }} className="hover:opacity-75 cursor-pointer">
              <X className="w-3 h-3 stroke-[1.5]" />
            </button>
          </div>
        )}

        {/* Scrollable Body */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* ── 4 KPI Metrics Row ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Total Organizations */}
            <div className="bg-surface border border-border rounded-md p-4 flex flex-col justify-between shadow-xs">
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
            <div className="bg-surface border border-border rounded-md p-4 flex flex-col justify-between shadow-xs">
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
                  Razorpay recurring total
                </p>
              </div>
            </div>

            {/* 3. Razorpay Due Date Tracker */}
            <div className="bg-surface border border-border rounded-md p-4 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-muted">
                  Admin WhatsApp Alerts
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
                  {superAdminPhone ? `To +${superAdminPhone}` : 'Configure in settings'}
                </p>
              </div>
            </div>

            {/* 4. Platform Traffic */}
            <div className="bg-surface border border-border rounded-md p-4 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-muted">
                  WhatsApp Traffic
                </span>
                <Activity className="w-4 h-4 text-text-muted stroke-[1.5]" />
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-semibold text-text-primary font-mono tabular-nums">
                    {stats?.total_messages || 0}
                  </span>
                  <span className="text-xs text-text-muted">total messages</span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  Across all managed tenants
                </p>
              </div>
            </div>

          </div>

          {/* ── TAB 1: CLIENT ORGANIZATIONS DIRECTORY & CONFIGURATION ─────────── */}
          {activeTab === 'organizations' && (
            <div className="bg-surface border border-border rounded-md overflow-hidden shadow-xs">
              
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
                    type="button"
                    onClick={() => setShowWebhooksRegistry(!showWebhooksRegistry)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer border flex items-center gap-1.5 ${
                      showWebhooksRegistry
                        ? 'bg-accent text-white border-accent'
                        : 'bg-surface hover:bg-surface-subtle text-text-body border-border'
                    }`}
                    title="Show Meta WhatsApp Webhook Callback URLs and Verify Tokens for all organizations"
                  >
                    <Key className="w-3 h-3 stroke-[1.5]" />
                    <span>{showWebhooksRegistry ? 'Hide Webhooks' : 'Webhook Registry'}</span>
                  </button>

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

              {/* ── EMBEDDED META WEBHOOK REGISTRY (Directly in 1st Tab) ── */}
              {showWebhooksRegistry && (
                <div className="p-4 bg-surface-subtle border-b border-border space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-text-primary flex items-center gap-2">
                        <Key className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                        <span>Meta WhatsApp Webhook Callback Registry</span>
                      </h4>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Copy each client organization's dedicated Webhook Callback URL and Verify Token into the Meta App Developer Portal (WhatsApp &rarr; Configuration).
                      </p>
                    </div>
                    <button
                      onClick={() => setShowWebhooksRegistry(false)}
                      className="p-1 text-text-muted hover:text-text-primary cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 stroke-[1.5]" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                    {tenants.map((t) => {
                      const url = `https://whatsapp-automation-system-eta.vercel.app/webhooks/whatsapp/${t.slug}`;
                      const token = `${t.slug}_token`;
                      return (
                        <div key={t.id} className="p-2.5 bg-surface border border-border rounded-sm flex items-center justify-between gap-2 shadow-2xs">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs text-text-primary truncate">{t.name}</span>
                              <span className="text-[10px] font-mono text-text-muted bg-surface-subtle px-1 rounded border border-border">/{t.slug}</span>
                            </div>
                            <p className="text-[11px] font-mono text-text-muted truncate mt-0.5">{url}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => copyToClipboard(url, `emb-url-${t.id}`)}
                              className="px-2 py-1 bg-surface-subtle hover:bg-surface text-text-body border border-border rounded-sm text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                              title="Copy Webhook URL"
                            >
                              {copiedField === `emb-url-${t.id}` ? <Check className="w-3 h-3 text-status-success stroke-[1.5]" /> : <Copy className="w-3 h-3 stroke-[1.5]" />}
                              <span>URL</span>
                            </button>
                            <button
                              onClick={() => copyToClipboard(token, `emb-tok-${t.id}`)}
                              className="px-2 py-1 bg-surface-subtle hover:bg-surface text-text-body border border-border rounded-sm text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                              title="Copy Verify Token"
                            >
                              {copiedField === `emb-tok-${t.id}` ? <Check className="w-3 h-3 text-status-success stroke-[1.5]" /> : <Copy className="w-3 h-3 stroke-[1.5]" />}
                              <span>Token</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
                        <th className="py-2.5 px-4">Plan & Rate</th>
                        <th className="py-2.5 px-4">Subscription Status</th>
                        <th className="py-2.5 px-4">Integration Status</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 text-right">Actions & Configuration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs">
                      {filteredTenants.map((t) => {
                        const planFee = t.monthly_price || ((t.plan || 'pro').toLowerCase() === 'starter' ? 999 : (t.plan || 'pro').toLowerCase() === 'enterprise' ? 9999 : 2999);
                        const renewalDay = t.billing_cycle_day || 1;
                        return (
                          <tr key={t.id} className="hover:bg-surface-subtle/50 transition-colors duration-150">
                            
                            {/* Organization Name */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-sm bg-accent/10 border border-accent/20 text-accent flex items-center justify-center font-bold text-xs shrink-0">
                                  {t.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-semibold text-text-primary flex items-center gap-1.5">
                                    <span>{t.name}</span>
                                    <span className="text-[10px] font-mono text-text-muted bg-surface-subtle px-1 py-0.2 rounded border border-border">
                                      /{t.slug}
                                    </span>
                                  </p>
                                  <p className="text-[11px] text-text-muted">{t.admin_email || 'No email configured'}</p>
                                </div>
                              </div>
                            </td>

                            {/* Plan & Rate */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded-sm bg-surface-subtle text-text-secondary border border-border">
                                  {t.plan || 'PRO'}
                                </span>
                                <span className="text-xs font-mono font-medium tabular-nums text-text-body">
                                  ₹{planFee.toLocaleString('en-IN')}/mo
                                </span>
                              </div>
                            </td>

                            {/* Razorpay Subscription Lifecycle */}
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {(!t.org_lifecycle_stage || t.org_lifecycle_stage === 'setup') ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                      Setup
                                    </span>
                                  ) : t.org_lifecycle_stage === 'ready_to_activate' ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                      Ready to Activate
                                    </span>
                                  ) : t.subscription_status === 'active' ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                      Active
                                    </span>
                                  ) : t.subscription_status === 'payment_failed' ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                      Payment Failed
                                    </span>
                                  ) : t.subscription_status === 'paused' ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                                      Paused
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                                      {t.subscription_status || 'Cancelled'}
                                    </span>
                                  )}

                                  {t.razorpay_subscription_id && (
                                    <button
                                      onClick={() => handleSyncBilling(t)}
                                      disabled={syncingBillingId === t.id}
                                      className="p-1 text-text-muted hover:text-accent rounded transition-colors"
                                      title="Sync live status from Razorpay"
                                    >
                                      <RefreshCw className={`w-3 h-3 ${syncingBillingId === t.id ? 'animate-spin text-accent' : ''}`} />
                                    </button>
                                  )}
                                </div>

                                {t.next_renewal_date && (
                                  <p className="text-[11px] text-text-muted flex items-center gap-1">
                                    <Calendar className="w-2.5 h-2.5 text-text-muted" />
                                    <span>{t.next_renewal_date}</span>
                                  </p>
                                )}
                              </div>
                            </td>

                            {/* Integration Status */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-sm border ${
                                  t.whatsapp_configured
                                    ? 'bg-status-success-bg text-status-success border-status-success-border font-medium'
                                    : 'bg-surface-subtle text-text-muted border-border'
                                }`}>
                                  <Smartphone className="w-3 h-3 stroke-[1.5]" />
                                  <span>{t.whatsapp_configured ? 'WhatsApp Live' : 'No Meta API'}</span>
                                </span>
                                <span className="text-[11px] text-text-muted font-mono tabular-nums">
                                  {t.contact_count || 0} contacts &bull; {t.conversation_count || 0} chats
                                </span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4">
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
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">

                                {/* STAGE B ACTION: Activate & Start Billing */}
                                {(!t.org_lifecycle_stage || t.org_lifecycle_stage === 'setup') && (
                                  <button
                                    onClick={() => handleActivateBilling(t)}
                                    disabled={activatingBillingId === t.id}
                                    className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-sm text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center gap-1 shadow-xs disabled:opacity-50"
                                    title="Create Razorpay Customer & Subscription (₹3,499/mo)"
                                  >
                                    {activatingBillingId === t.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Sparkles className="w-3 h-3" />
                                    )}
                                    <span>Activate Billing</span>
                                  </button>
                                )}

                                {/* VIEW PAYMENT LINK MODAL */}
                                {t.razorpay_short_url && (
                                  <button
                                    onClick={() => setActivePaymentModalTenant(t)}
                                    className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20 rounded-sm text-xs font-medium transition-colors duration-150 cursor-pointer flex items-center gap-1 shadow-xs"
                                    title="Open Payment Link Modal & Test Checkout"
                                  >
                                    <CreditCard className="w-3 h-3" />
                                    <span>Payment Link</span>
                                  </button>
                                )}

                                {/* COPY PAYMENT LINK */}
                                {t.razorpay_short_url && (
                                  <button
                                    onClick={() => handleCopyPaymentLink(t.razorpay_short_url!, t.id)}
                                    className="px-2 py-1 bg-surface-subtle hover:bg-surface text-text-primary border border-border-strong hover:border-accent rounded-sm text-xs font-medium transition-colors duration-150 cursor-pointer flex items-center gap-1 shadow-xs"
                                    title="Copy Razorpay Payment Link for Client"
                                  >
                                    {copiedLink === t.id ? (
                                      <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3 text-text-muted" />
                                    )}
                                    <span>{copiedLink === t.id ? 'Copied' : 'Copy Link'}</span>
                                  </button>
                                )}

                                {/* INVOICES */}
                                {t.razorpay_subscription_id && (
                                  <button
                                    onClick={() => handleViewInvoices(t)}
                                    className="px-2 py-1 bg-surface-subtle hover:bg-surface text-text-primary border border-border-strong hover:border-accent rounded-sm text-xs font-medium transition-colors duration-150 cursor-pointer flex items-center gap-1 shadow-xs"
                                    title="View Razorpay Invoices & Receipts"
                                  >
                                    <FileText className="w-3 h-3 text-text-muted" />
                                    <span>Invoices</span>
                                  </button>
                                )}
                                
                                {/* DATABASE: Inspect all stored keys, business info & DB records */}
                                <button
                                  onClick={() => handleOpenDatabaseView(t)}
                                  className="px-2.5 py-1 bg-surface-subtle hover:bg-surface text-text-primary border border-border-strong hover:border-accent rounded-sm text-xs font-medium transition-colors duration-150 cursor-pointer flex items-center gap-1.5 shadow-xs"
                                  title="Inspect stored database records, credentials, AI system prompt & full config values"
                                >
                                  <Database className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                                  <span>Database</span>
                                </button>

                                {/* PRIMARY: Configure Settings (Super Admin central config) */}
                                <button
                                  onClick={() => handleOpenConfig(t)}
                                  className="px-2.5 py-1 bg-surface-subtle hover:bg-surface text-text-primary border border-border-strong hover:border-accent rounded-sm text-xs font-medium transition-colors duration-150 cursor-pointer flex items-center gap-1.5 shadow-xs"
                                  title="Configure AI Prompt Brain, WhatsApp API, Templates, Calendar & Billing"
                                >
                                  <Sliders className="w-3.5 h-3.5 text-text-secondary stroke-[1.5]" />
                                  <span>Configure</span>
                                </button>

                                {/* Open CRM as Client */}
                                <button
                                  onClick={() => handleImpersonateTenant(t.id)}
                                  className="px-2.5 py-1 bg-accent hover:bg-accent-hover text-white rounded-sm text-xs font-medium transition-colors duration-150 cursor-pointer flex items-center gap-1 shadow-xs"
                                  title="Access this Tenant's CRM Workspace"
                                >
                                  <ExternalLink className="w-3 h-3 stroke-[1.5]" />
                                  <span>Open CRM</span>
                                </button>

                                {/* Password Reset */}
                                <button
                                  onClick={() => {
                                    setResetTenantId(t.id);
                                    setResetTenantName(t.name);
                                    setNewPassword('');
                                    setResetSuccess(false);
                                    setResetError('');
                                  }}
                                  className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-subtle rounded-sm transition-colors duration-150 cursor-pointer border border-border"
                                  title="Reset Client Password"
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
                    <div key={t.id} className="bg-surface border border-border rounded-md p-4 space-y-3 flex flex-col justify-between shadow-xs">
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
                            onClick={() => handleOpenConfig(t, 'billing')}
                            className="text-xs font-medium text-text-secondary hover:text-text-primary cursor-pointer flex items-center gap-1"
                          >
                            <Sliders className="w-3 h-3 stroke-[1.5]" />
                            <span>Edit billing</span>
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


          {/* ── TAB 4: SUPER ADMIN NOTIFICATION SETTINGS ──────────────────────── */}
          {activeTab === 'admin_config' && (
            <div className="max-w-xl bg-surface border border-border rounded-md p-5 space-y-4 shadow-xs">
              <div>
                <h3 className="text-xs font-semibold text-text-primary">
                  Super Admin Alert Notification Settings
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Configure where platform alerts, Razorpay client renewal reminders, and system notifications are dispatched.
                </p>
              </div>

              <form onSubmit={handleSaveAdminPhone} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    Super Admin WhatsApp Phone (with Country Code)
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
                    <span className="text-xs font-medium text-text-primary">Alert Types Enabled:</span>
                  </div>
                  <ul className="text-xs text-text-muted space-y-0.5 list-disc pl-5">
                    <li>2-Day prior notice before client's monthly Razorpay renewal.</li>
                    <li>Same-day auto-debit settlement confirmation.</li>
                    <li>Manual renewal digest on demand.</li>
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-status-success font-medium">
                    {savedPhoneNotice && 'Saved successfully!'}
                  </span>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer shadow-xs"
                  >
                    Save Recipient Phone
                  </button>
                </div>
              </form>
            </div>
          )}

        </main>
      </div>

            {/* ── MODAL: DATABASE RECORD INSPECTOR (SUPER ADMIN) ───────────────────── */}
      {viewingDbTenant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-surface border border-border rounded-lg w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            
            {/* Modal Header */}
            <div className="h-16 px-6 border-b border-border flex items-center justify-between shrink-0 bg-surface">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-sm bg-accent/10 border border-accent/20 text-accent flex items-center justify-center font-bold text-sm shrink-0">
                  <Database className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-text-primary">
                      {viewingDbTenant.name} &mdash; Database Inspector
                    </h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-subtle border border-border text-text-muted">
                      /{viewingDbTenant.slug}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-subtle border border-border text-text-secondary uppercase">
                      Plan: {viewingDbTenant.plan || 'PRO'}
                    </span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                      viewingDbTenant.status === 'active'
                        ? 'bg-status-success-bg text-status-success'
                        : 'bg-status-error-bg text-status-error'
                    }`}>
                      {viewingDbTenant.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5 flex items-center gap-2">
                    <span>UUID:</span>
                    <span className="font-mono text-text-primary">{viewingDbTenant.id}</span>
                    <button
                      onClick={() => copyToClipboard(viewingDbTenant.id, 'db-uuid')}
                      className="hover:text-accent cursor-pointer text-text-muted"
                      title="Copy Organization UUID"
                    >
                      {copiedField === 'db-uuid' ? <Check className="w-3 h-3 text-status-success inline" /> : <Copy className="w-3 h-3 inline" />}
                    </button>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* 1-Click Copy Full JSON */}
                {dbTenantSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      const fullDbExport = {
                        organization_id: viewingDbTenant.id,
                        organization_name: viewingDbTenant.name,
                        slug: viewingDbTenant.slug,
                        status: viewingDbTenant.status,
                        plan: viewingDbTenant.plan,
                        created_at: viewingDbTenant.created_at,
                        admin_email: viewingDbTenant.admin_email,
                        monthly_price: viewingDbTenant.monthly_price,
                        billing_cycle_day: viewingDbTenant.billing_cycle_day,
                        razorpay_subscription_id: viewingDbTenant.razorpay_subscription_id,
                        database_settings: dbTenantSettings,
                      };
                      copyToClipboard(JSON.stringify(fullDbExport, null, 2), 'full-db-json');
                    }}
                    className="px-2.5 py-1 text-xs font-medium text-text-primary bg-surface-subtle hover:bg-surface border border-border rounded-sm transition-colors duration-150 flex items-center gap-1.5 cursor-pointer"
                    title="Copy full database record as JSON"
                  >
                    {copiedField === 'full-db-json' ? <Check className="w-3.5 h-3.5 text-status-success stroke-[1.5]" /> : <Braces className="w-3.5 h-3.5 text-accent stroke-[1.5]" />}
                    <span>{copiedField === 'full-db-json' ? 'Copied JSON!' : 'Copy Full JSON'}</span>
                  </button>
                )}

                {/* Edit in Configure Drawer */}
                <button
                  type="button"
                  onClick={() => {
                    const t = viewingDbTenant;
                    setViewingDbTenant(null);
                    handleOpenConfig(t);
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded-sm transition-colors duration-150 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Open configuration editor for this organization"
                >
                  <Sliders className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span>Edit in Configure</span>
                </button>

                <button
                  onClick={() => setViewingDbTenant(null)}
                  className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-subtle rounded-sm transition-colors duration-150 cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[1.5]" />
                </button>
              </div>
            </div>

            {/* Subtabs Bar */}
            <div className="px-6 border-b border-border bg-surface-subtle flex items-center justify-between gap-3 overflow-x-auto shrink-0">
              <div className="flex items-center gap-1">
                {[
                  { id: 'overview', label: 'Overview & Metadata', icon: Building2 },
                  { id: 'ai', label: 'AI Brain & Prompt Directives', icon: Bot },
                  { id: 'credentials', label: 'API Keys & Vault', icon: KeyRound },
                  { id: 'webhook', label: 'Meta WhatsApp & Webhooks', icon: Smartphone },
                  { id: 'templates', label: 'Message Templates', icon: FileText },
                  { id: 'calendar', label: 'Google Calendar Sync', icon: CalendarDays },
                  { id: 'location', label: 'Business & Taxonomy', icon: MapPin },
                  { id: 'raw_json', label: 'Raw Database JSON', icon: FileCode },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = dbViewSubtab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setDbViewSubtab(tab.id as any)}
                      className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-medium transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                        active
                          ? 'border-accent text-accent font-semibold bg-surface'
                          : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface/50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* In-Modal Search filter */}
              <div className="relative py-1 shrink-0">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted stroke-[1.5]" />
                <input
                  type="text"
                  placeholder="Filter keys or values..."
                  value={dbSearchQuery}
                  onChange={(e) => setDbSearchQuery(e.target.value)}
                  className="w-48 pl-7 pr-2.5 py-1 bg-surface border border-border rounded-sm text-xs text-text-primary placeholder:text-text-muted focus:border-accent transition-colors"
                />
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-canvas">
              {dbLoading ? (
                <div className="py-24 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-accent mx-auto stroke-[1.5]" />
                  <p className="text-xs text-text-muted">Fetching live database records from PostgreSQL...</p>
                </div>
              ) : dbError ? (
                <div className="p-4 bg-status-error-bg border border-status-error-border text-status-error text-xs rounded-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 stroke-[1.5]" />
                  <span>{dbError}</span>
                </div>
              ) : !dbTenantSettings ? (
                <div className="py-20 text-center text-xs text-text-muted">No database records found.</div>
              ) : (
                <div className="space-y-6">

                  {/* ── SUBTAB 1: OVERVIEW & METADATA ── */}
                  {(dbViewSubtab === 'overview' || dbSearchQuery) && (
                    <div className="bg-surface border border-border rounded-md p-5 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <h4 className="font-semibold text-xs text-text-primary flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-accent stroke-[1.5]" />
                          <span>Tenant Core Record (`tenants` & `users` tables)</span>
                        </h4>
                        <span className="text-[11px] font-mono text-text-muted">Schema: public.tenants</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                          { key: 'tenant_id', label: 'Tenant UUID', value: viewingDbTenant.id, copyable: true },
                          { key: 'organization_name', label: 'Organization Name', value: viewingDbTenant.name, copyable: true },
                          { key: 'slug', label: 'Slug Identifier', value: viewingDbTenant.slug, copyable: true },
                          { key: 'admin_email', label: 'Admin Login Email', value: viewingDbTenant.admin_email || 'Not configured', copyable: true },
                          { key: 'plan', label: 'Subscription Plan', value: (viewingDbTenant.plan || 'PRO').toUpperCase(), copyable: false },
                          { key: 'monthly_rate', label: 'Monthly Recurring Rate', value: `₹${(viewingDbTenant.monthly_price || 2999).toLocaleString('en-IN')}`, copyable: false },
                          { key: 'billing_cycle_day', label: 'Billing Cycle Day', value: `Day ${viewingDbTenant.billing_cycle_day || 1} of month`, copyable: false },
                          { key: 'razorpay_subscription_id', label: 'Razorpay Subscription ID', value: viewingDbTenant.razorpay_subscription_id || 'Auto-Debit Active', copyable: true },
                          { key: 'status', label: 'Active Status', value: viewingDbTenant.status.toUpperCase(), copyable: false },
                          { key: 'created_at', label: 'Created At', value: viewingDbTenant.created_at || 'Recorded in DB', copyable: false },
                        ]
                          .filter(item => !dbSearchQuery || item.label.toLowerCase().includes(dbSearchQuery.toLowerCase()) || String(item.value).toLowerCase().includes(dbSearchQuery.toLowerCase()))
                          .map((item) => (
                            <div key={item.key} className="p-2.5 bg-surface-subtle border border-border rounded-sm space-y-1">
                              <p className="text-[11px] font-medium text-text-muted">{item.label}</p>
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono text-xs font-semibold text-text-primary break-all">{String(item.value)}</span>
                                {item.copyable && (
                                  <button
                                    onClick={() => copyToClipboard(String(item.value), `db-core-${item.key}`)}
                                    className="p-1 hover:text-accent text-text-muted cursor-pointer shrink-0"
                                    title={`Copy ${item.label}`}
                                  >
                                    {copiedField === `db-core-${item.key}` ? <Check className="w-3 h-3 text-status-success stroke-[1.5]" /> : <Copy className="w-3 h-3 stroke-[1.5]" />}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* ── SUBTAB 2: AI BRAIN & PROMPT DIRECTIVES ── */}
                  {(dbViewSubtab === 'ai' || dbSearchQuery) && (
                    <div className="bg-surface border border-border rounded-md p-5 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div>
                          <h4 className="font-semibold text-xs text-text-primary flex items-center gap-2">
                            <Bot className="w-4 h-4 text-accent stroke-[1.5]" />
                            <span>AI Intelligence & Knowledge Base (`ai_config` table)</span>
                          </h4>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            Active system prompt, catalog, humanized directives, and objection handling instructions stored in database.
                          </p>
                        </div>
                        <span className="text-[11px] font-mono text-text-muted">Provider: {dbTenantSettings.primary_model_provider || 'groq'} &bull; Model: {dbTenantSettings.ai_model || 'gemini-3.1-flash-lite'}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-2.5 bg-surface-subtle border border-border rounded-sm">
                          <p className="text-[11px] font-medium text-text-muted">Assistant Name</p>
                          <p className="font-mono text-xs font-semibold text-text-primary mt-0.5">{dbTenantSettings.assistant_name || 'Rakshaya'}</p>
                        </div>
                        <div className="p-2.5 bg-surface-subtle border border-border rounded-sm">
                          <p className="text-[11px] font-medium text-text-muted">Primary Provider & Model</p>
                          <p className="font-mono text-xs font-semibold text-text-primary mt-0.5">{dbTenantSettings.primary_model_provider || 'groq'} ({dbTenantSettings.ai_model || 'gemini-3.1-flash-lite'})</p>
                        </div>
                        <div className="p-2.5 bg-surface-subtle border border-border rounded-sm">
                          <p className="text-[11px] font-medium text-text-muted">Response Style & Framework</p>
                          <p className="font-mono text-xs font-semibold text-text-primary mt-0.5">{dbTenantSettings.response_style || 'natural'} / {dbTenantSettings.methodology || 'consultative'}</p>
                        </div>
                      </div>

                      {/* Full Text Directives */}
                      {[
                        { key: 'ai_prompt', label: 'Master AI System Prompt (`system_prompt`)', value: dbTenantSettings.ai_prompt, desc: 'Base personality, company identity, role definition and workflow guidance' },
                        { key: 'services_text', label: 'Services, Treatments & Pricing Catalog (`services_text`)', value: dbTenantSettings.services_text, desc: 'Complete offerings catalog, doctor specialties, consultation pricing & packages' },
                        { key: 'bot_goal', label: 'Bot Conversion Goals & Instructions (`bot_goal`)', value: dbTenantSettings.bot_goal, desc: 'Target actions e.g. booking demo class, doctor consultation or site visit' },
                        { key: 'strict_rules', label: 'Strict Guardrails & Anti-Hyphen Directives (`strict_rules`)', value: dbTenantSettings.strict_rules, desc: 'Anti-hyphen formatting rules, forbidden tokens, character limits & safety bounds' },
                        { key: 'objection_handling', label: 'Objection Handling & Pricing Strategy (`objection_handling`)', value: dbTenantSettings.objection_handling, desc: 'Rebuttals, value propositions, discount policies and follow-up incentives' },
                      ]
                        .filter(item => !dbSearchQuery || item.label.toLowerCase().includes(dbSearchQuery.toLowerCase()) || (item.value && item.value.toLowerCase().includes(dbSearchQuery.toLowerCase())))
                        .map((item) => (
                          <div key={item.key} className="p-3.5 bg-surface-subtle border border-border rounded-sm space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-semibold text-text-primary">{item.label}</p>
                                <p className="text-[11px] text-text-muted">{item.desc}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-text-muted">
                                  {item.value ? `${item.value.length} chars` : 'Empty'}
                                </span>
                                {item.value && (
                                  <button
                                    onClick={() => copyToClipboard(item.value || '', `db-ai-${item.key}`)}
                                    className="px-2 py-0.5 bg-surface hover:bg-surface-subtle text-text-body border border-border rounded-sm text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                                    title="Copy text block"
                                  >
                                    {copiedField === `db-ai-${item.key}` ? <Check className="w-3 h-3 text-status-success stroke-[1.5]" /> : <Copy className="w-3 h-3 stroke-[1.5]" />}
                                    <span>Copy</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            <pre className="p-3 bg-canvas border border-border rounded-sm text-xs font-mono text-text-primary whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                              {item.value || <span className="text-text-muted italic">No custom text configured in database. System uses platform default.</span>}
                            </pre>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* ── SUBTAB 3: API KEYS & VAULT CREDENTIALS ── */}
                  {(dbViewSubtab === 'credentials' || dbSearchQuery) && (
                    <div className="bg-surface border border-border rounded-md p-5 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div>
                          <h4 className="font-semibold text-xs text-text-primary flex items-center gap-2">
                            <KeyRound className="w-4 h-4 text-accent stroke-[1.5]" />
                            <span>Vault API Credentials & Tokens (`tenant_credentials` table)</span>
                          </h4>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            Decrypted API keys for BYOK LLMs, Meta WhatsApp Cloud API credentials, and Admin alerts.
                          </p>
                        </div>
                        <span className="text-[11px] font-mono text-text-muted">Encrypted in Vault Storage</span>
                      </div>

                      <div className="space-y-3">
                        {[
                          { key: 'gemini_api_key', label: 'Google Gemini API Key', value: dbTenantSettings.gemini_api_key, isSecret: true, desc: 'BYOK Gemini Flash 2.0 / Pro multimodal key' },
                          { key: 'groq_api_key', label: 'Groq Cloud API Key', value: dbTenantSettings.groq_api_key, isSecret: true, desc: 'BYOK Groq LLaMA 3.3 70B fast inference key' },
                          { key: 'opencode_api_key', label: 'OpenCode / OpenAI API Key', value: dbTenantSettings.opencode_api_key, isSecret: true, desc: 'BYOK OpenAI / OpenCode custom endpoint key' },
                          { key: 'opencode_base_url', label: 'OpenCode Base URL', value: dbTenantSettings.opencode_base_url || 'https://api.openai.com/v1', isSecret: false, desc: 'API root URL for custom OpenAI-compatible server' },
                          { key: 'meta_access_token', label: 'Meta System User Permanent Access Token', value: dbTenantSettings.meta_access_token, isSecret: true, desc: 'Graph API Token used for sending WhatsApp messages' },
                          { key: 'meta_app_secret', label: 'Meta App Secret', value: dbTenantSettings.meta_app_secret, isSecret: true, desc: 'App secret used for validating incoming webhook HMAC-SHA256 signatures' },
                          { key: 'meta_phone_id', label: 'Meta Phone Number ID', value: dbTenantSettings.meta_phone_id, isSecret: false, desc: 'WhatsApp Cloud API Phone Number ID' },
                          { key: 'meta_waba_id', label: 'Meta WhatsApp Business Account ID (WABA ID)', value: dbTenantSettings.meta_waba_id, isSecret: false, desc: 'WhatsApp Business Account ID for template management' },
                          { key: 'admin_whatsapp_number', label: 'Admin Escalation WhatsApp Phone', value: dbTenantSettings.admin_whatsapp_number, isSecret: false, desc: 'Receives instant customer booking notices & human takeover requests' },
                        ]
                          .filter(item => !dbSearchQuery || item.label.toLowerCase().includes(dbSearchQuery.toLowerCase()) || (item.value && item.value.toLowerCase().includes(dbSearchQuery.toLowerCase())))
                          .map((item) => {
                            const isRevealed = showSecrets[item.key];
                            const displayVal = !item.value
                              ? 'Not configured'
                              : item.isSecret && !isRevealed
                              ? item.value.slice(0, 4) + '••••••••••••••••••••••••' + item.value.slice(-4)
                              : item.value;

                            return (
                              <div key={item.key} className="p-3 bg-surface-subtle border border-border rounded-sm flex items-center justify-between gap-3 flex-wrap">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-xs text-text-primary">{item.label}</span>
                                    {item.value ? (
                                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-status-success-bg text-status-success">Stored</span>
                                    ) : (
                                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-surface text-text-muted border border-border">Empty</span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-text-muted mt-0.5">{item.desc}</p>
                                  <p className="font-mono text-xs font-semibold text-text-primary mt-1 break-all bg-canvas p-1.5 rounded border border-border">
                                    {displayVal}
                                  </p>
                                </div>

                                {item.value && (
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {item.isSecret && (
                                      <button
                                        type="button"
                                        onClick={() => toggleSecretVisibility(item.key)}
                                        className="px-2.5 py-1 bg-surface hover:bg-surface-subtle text-text-body border border-border rounded-sm text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                                        title={isRevealed ? 'Mask secret' : 'Reveal secret'}
                                      >
                                        {isRevealed ? <EyeOff className="w-3.5 h-3.5 stroke-[1.5]" /> : <Eye className="w-3.5 h-3.5 stroke-[1.5]" />}
                                        <span>{isRevealed ? 'Hide' : 'Reveal'}</span>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(item.value || '', `db-cred-${item.key}`)}
                                      className="px-2.5 py-1 bg-surface hover:bg-surface-subtle text-text-body border border-border rounded-sm text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                                      title="Copy to clipboard"
                                    >
                                      {copiedField === `db-cred-${item.key}` ? <Check className="w-3.5 h-3.5 text-status-success stroke-[1.5]" /> : <Copy className="w-3.5 h-3.5 stroke-[1.5]" />}
                                      <span>Copy</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* ── SUBTAB 4: META WHATSAPP & WEBHOOKS ── */}
                  {(dbViewSubtab === 'webhook' || dbSearchQuery) && (
                    <div className="bg-surface border border-border rounded-md p-5 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div>
                          <h4 className="font-semibold text-xs text-text-primary flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-accent stroke-[1.5]" />
                            <span>Meta WhatsApp Cloud API & Webhook Configuration</span>
                          </h4>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            Exact endpoint URLs and verify tokens required for the Meta Developer App WhatsApp Configuration.
                          </p>
                        </div>
                        <span className="text-[10px] font-mono bg-status-success-bg text-status-success px-2 py-0.5 rounded border border-status-success-border font-semibold">
                          Webhook Ready
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="p-3.5 bg-surface-subtle border border-border rounded-sm space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-text-primary">Webhook Callback URL</span>
                            <button
                              onClick={() => copyToClipboard(dbTenantSettings.webhook_url, 'db-wa-url')}
                              className="px-2.5 py-1 bg-surface hover:bg-surface-subtle text-text-body border border-border rounded-sm text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                            >
                              {copiedField === 'db-wa-url' ? <Check className="w-3.5 h-3.5 text-status-success stroke-[1.5]" /> : <Copy className="w-3.5 h-3.5 stroke-[1.5]" />}
                              <span>Copy Callback URL</span>
                            </button>
                          </div>
                          <p className="p-2 bg-canvas border border-border rounded-sm font-mono text-xs text-text-primary break-all">
                            {dbTenantSettings.webhook_url}
                          </p>
                        </div>

                        <div className="p-3.5 bg-surface-subtle border border-border rounded-sm space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-text-primary">Webhook Verification Token</span>
                            <button
                              onClick={() => copyToClipboard(dbTenantSettings.verify_token || `${viewingDbTenant.slug}_token`, 'db-wa-tok')}
                              className="px-2.5 py-1 bg-surface hover:bg-surface-subtle text-text-body border border-border rounded-sm text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                            >
                              {copiedField === 'db-wa-tok' ? <Check className="w-3.5 h-3.5 text-status-success stroke-[1.5]" /> : <Copy className="w-3.5 h-3.5 stroke-[1.5]" />}
                              <span>Copy Verify Token</span>
                            </button>
                          </div>
                          <p className="p-2 bg-canvas border border-border rounded-sm font-mono text-xs text-text-primary">
                            {dbTenantSettings.verify_token || `${viewingDbTenant.slug}_token`}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-3 bg-surface-subtle border border-border rounded-sm">
                            <p className="text-[11px] font-medium text-text-muted">Meta Phone ID</p>
                            <p className="font-mono text-xs font-semibold text-text-primary mt-1">{dbTenantSettings.meta_phone_id || 'Not configured'}</p>
                          </div>
                          <div className="p-3 bg-surface-subtle border border-border rounded-sm">
                            <p className="text-[11px] font-medium text-text-muted">Meta WABA ID</p>
                            <p className="font-mono text-xs font-semibold text-text-primary mt-1">{dbTenantSettings.meta_waba_id || 'Not configured'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── SUBTAB 5: MESSAGE TEMPLATES ── */}
                  {(dbViewSubtab === 'templates' || dbSearchQuery) && (
                    <div className="bg-surface border border-border rounded-md p-5 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div>
                          <h4 className="font-semibold text-xs text-text-primary flex items-center gap-2">
                            <FileText className="w-4 h-4 text-accent stroke-[1.5]" />
                            <span>Meta WhatsApp Template Registry & Automated Triggers</span>
                          </h4>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            Approved Meta WhatsApp template identifiers registered for automated system dispatch.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          { key: 'template_booking_confirmation', label: '1. Customer Booking Confirmation', value: dbTenantSettings.template_booking_confirmation || 'booking_confirmationn' },
                          { key: 'template_admin_notification', label: '2. Admin Instant Booking Alert', value: dbTenantSettings.template_admin_notification || 'admin_notification' },
                          { key: 'template_admin_human_request', label: '3. Admin Human Takeover Alert', value: dbTenantSettings.template_admin_human_request || 'admin_human_request' },
                          { key: 'template_cancellation_confirmation', label: '4. Customer Cancellation Notice', value: dbTenantSettings.template_cancellation_confirmation || 'cancellation_confirmation' },
                          { key: 'template_admin_cancellation_notice', label: '5. Admin Cancellation Notice', value: dbTenantSettings.template_admin_cancellation_notice || 'admin_cancellation_notice' },
                          { key: 'template_reschedule_confirmation', label: '6. Customer Reschedule Confirmation', value: dbTenantSettings.template_reschedule_confirmation || 'booking_reschedule_confirmation' },
                          { key: 'template_admin_reschedule_notice', label: '7. Admin Reschedule Notice', value: dbTenantSettings.template_admin_reschedule_notice || 'admin_reschedule_notice' },
                          { key: 'template_appointment_reminder', label: '8. 24h Prior Appointment Reminder', value: dbTenantSettings.template_appointment_reminder || 'appointment_ramainder' },
                          { key: 'template_reschedule_nudge', label: '9. Automated Reschedule Follow-up', value: dbTenantSettings.template_reschedule_nudge || 'reschedule_nudge' },
                          { key: 'template_review_request', label: '10. Post-Service Review Request', value: dbTenantSettings.template_review_request || 'review_request' },
                          { key: 'template_admin_daily_digest', label: '11. Daily Admin Performance Digest', value: dbTenantSettings.template_admin_daily_digest || 'admin_daily_digest' },
                          { key: 'template_client_followup', label: '12. 24h Customer Re-engagement Follow-up', value: dbTenantSettings.template_client_followup || 'client_followup_checkin' },
                        ]
                          .filter(item => !dbSearchQuery || item.label.toLowerCase().includes(dbSearchQuery.toLowerCase()) || String(item.value).toLowerCase().includes(dbSearchQuery.toLowerCase()))
                          .map((item) => (
                            <div key={item.key} className="p-3 bg-surface-subtle border border-border rounded-sm flex items-center justify-between gap-2">
                              <div>
                                <p className="text-[11px] font-medium text-text-muted">{item.label}</p>
                                <p className="font-mono text-xs font-semibold text-text-primary mt-0.5">{item.value}</p>
                              </div>
                              <button
                                onClick={() => copyToClipboard(item.value, `db-tpl-${item.key}`)}
                                className="p-1 hover:text-accent text-text-muted cursor-pointer shrink-0"
                                title="Copy Template ID"
                              >
                                {copiedField === `db-tpl-${item.key}` ? <Check className="w-3 h-3 text-status-success stroke-[1.5]" /> : <Copy className="w-3 h-3 stroke-[1.5]" />}
                              </button>
                            </div>
                          ))}
                      </div>

                      {/* Google Review Link */}
                      <div className="p-3 bg-surface-subtle border border-border rounded-sm flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-medium text-text-muted">Google Review / Feedback URL</p>
                          <p className="font-mono text-xs font-semibold text-text-primary mt-0.5">{dbTenantSettings.google_review_link || 'Not configured'}</p>
                        </div>
                        {dbTenantSettings.google_review_link && (
                          <button
                            onClick={() => copyToClipboard(dbTenantSettings.google_review_link || '', 'db-rev-link')}
                            className="p-1 hover:text-accent text-text-muted cursor-pointer shrink-0"
                          >
                            {copiedField === 'db-rev-link' ? <Check className="w-3 h-3 text-status-success stroke-[1.5]" /> : <Copy className="w-3 h-3 stroke-[1.5]" />}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── SUBTAB 6: GOOGLE CALENDAR SYNC ── */}
                  {(dbViewSubtab === 'calendar' || dbSearchQuery) && (
                    <div className="bg-surface border border-border rounded-md p-5 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div>
                          <h4 className="font-semibold text-xs text-text-primary flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-accent stroke-[1.5]" />
                            <span>Google Calendar OAuth & Sync Credentials</span>
                          </h4>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            Automated 2-way booking synchronization with Google Calendar & Google Meet.
                          </p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          dbTenantSettings.google_calendar_configured
                            ? 'bg-status-success-bg text-status-success border-status-success-border'
                            : 'bg-surface-subtle text-text-muted border-border'
                        }`}>
                          {dbTenantSettings.google_calendar_configured ? 'Google Calendar Connected' : 'Not Connected'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          { key: 'google_client_id', label: 'Google OAuth Client ID', value: dbTenantSettings.google_client_id, isSecret: false },
                          { key: 'google_client_secret', label: 'Google OAuth Client Secret', value: dbTenantSettings.google_client_secret, isSecret: true },
                          { key: 'google_refresh_token', label: 'Google OAuth Refresh Token', value: dbTenantSettings.google_refresh_token, isSecret: true },
                          { key: 'google_calendar_id', label: 'Target Google Calendar ID', value: dbTenantSettings.google_calendar_id || 'primary', isSecret: false },
                          { key: 'notification_email', label: 'Calendar Notification Email', value: dbTenantSettings.notification_email, isSecret: false },
                        ]
                          .filter(item => !dbSearchQuery || item.label.toLowerCase().includes(dbSearchQuery.toLowerCase()) || (item.value && item.value.toLowerCase().includes(dbSearchQuery.toLowerCase())))
                          .map((item) => {
                            const isRevealed = showSecrets[item.key];
                            const displayVal = !item.value
                              ? 'Not configured'
                              : item.isSecret && !isRevealed
                              ? item.value.slice(0, 4) + '••••••••••••••••' + item.value.slice(-4)
                              : item.value;

                            return (
                              <div key={item.key} className="p-3 bg-surface-subtle border border-border rounded-sm space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-medium text-text-muted">{item.label}</span>
                                  <div className="flex items-center gap-1">
                                    {item.isSecret && item.value && (
                                      <button
                                        type="button"
                                        onClick={() => toggleSecretVisibility(item.key)}
                                        className="p-1 hover:text-accent text-text-muted cursor-pointer"
                                      >
                                        {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                      </button>
                                    )}
                                    {item.value && (
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(item.value || '', `db-gcal-${item.key}`)}
                                        className="p-1 hover:text-accent text-text-muted cursor-pointer"
                                      >
                                        {copiedField === `db-gcal-${item.key}` ? <Check className="w-3 h-3 text-status-success" /> : <Copy className="w-3 h-3" />}
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <p className="font-mono text-xs font-semibold text-text-primary break-all bg-canvas p-1.5 rounded border border-border">
                                  {displayVal}
                                </p>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* ── SUBTAB 7: BUSINESS LOCATION & TAXONOMY ── */}
                  {(dbViewSubtab === 'location' || dbSearchQuery) && (
                    <div className="bg-surface border border-border rounded-md p-5 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div>
                          <h4 className="font-semibold text-xs text-text-primary flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-accent stroke-[1.5]" />
                            <span>Business Location, Regional Settings & Taxonomy</span>
                          </h4>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            Business address, regional timezones, currency, and custom CRM terminology.
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 bg-surface-subtle border border-border rounded-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-text-primary">Full Business Location & Directions (`full_location_text`)</span>
                          {dbTenantSettings.full_location_text && (
                            <button
                              onClick={() => copyToClipboard(dbTenantSettings.full_location_text || '', 'db-loc-txt')}
                              className="px-2 py-0.5 bg-surface hover:bg-surface-subtle text-text-body border border-border rounded-sm text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                            >
                              {copiedField === 'db-loc-txt' ? <Check className="w-3 h-3 text-status-success stroke-[1.5]" /> : <Copy className="w-3 h-3 stroke-[1.5]" />}
                              <span>Copy Address</span>
                            </button>
                          )}
                        </div>
                        <pre className="p-3 bg-canvas border border-border rounded-sm text-xs font-mono text-text-primary whitespace-pre-wrap max-h-32 overflow-y-auto leading-relaxed">
                          {dbTenantSettings.full_location_text || <span className="text-text-muted italic">No custom location text entered.</span>}
                        </pre>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="p-2.5 bg-surface-subtle border border-border rounded-sm">
                          <p className="text-[11px] font-medium text-text-muted">Timezone</p>
                          <p className="font-mono text-xs font-semibold text-text-primary mt-0.5">{dbTenantSettings.timezone || 'Asia/Kolkata'}</p>
                        </div>
                        <div className="p-2.5 bg-surface-subtle border border-border rounded-sm">
                          <p className="text-[11px] font-medium text-text-muted">Country Code</p>
                          <p className="font-mono text-xs font-semibold text-text-primary mt-0.5">{dbTenantSettings.country_code || '+91'}</p>
                        </div>
                        <div className="p-2.5 bg-surface-subtle border border-border rounded-sm">
                          <p className="text-[11px] font-medium text-text-muted">Currency</p>
                          <p className="font-mono text-xs font-semibold text-text-primary mt-0.5">{dbTenantSettings.currency || 'INR'} ({dbTenantSettings.currency_symbol || '₹'})</p>
                        </div>
                        <div className="p-2.5 bg-surface-subtle border border-border rounded-sm">
                          <p className="text-[11px] font-medium text-text-muted">Industry</p>
                          <p className="font-mono text-xs font-semibold text-text-primary mt-0.5 uppercase">{dbTenantSettings.industry || 'CLINIC'}</p>
                        </div>
                      </div>

                      {/* CRM Custom Taxonomy */}
                      {dbTenantSettings.taxonomy && (
                        <div className="p-3.5 bg-surface-subtle border border-border rounded-sm space-y-2">
                          <p className="text-xs font-semibold text-text-primary">CRM Custom Taxonomy Labels</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                            {Object.entries(dbTenantSettings.taxonomy).map(([k, v]) => (
                              <div key={k} className="p-2 bg-canvas rounded border border-border">
                                <p className="text-[10px] font-medium text-text-muted uppercase">{k.replace('_', ' ')}</p>
                                <p className="font-semibold text-text-primary mt-0.5">{String(v)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── SUBTAB 8: RAW DATABASE JSON EXPORT ── */}
                  {(dbViewSubtab === 'raw_json' || dbSearchQuery) && (
                    <div className="bg-surface border border-border rounded-md p-5 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div>
                          <h4 className="font-semibold text-xs text-text-primary flex items-center gap-2">
                            <FileCode className="w-4 h-4 text-accent stroke-[1.5]" />
                            <span>Live PostgreSQL Database JSON Dump</span>
                          </h4>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            Combined raw database representation from tables `tenants`, `ai_config`, `tenant_credentials`, and `settings`.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const rawExport = {
                              tenant_core: viewingDbTenant,
                              database_settings: dbTenantSettings,
                            };
                            copyToClipboard(JSON.stringify(rawExport, null, 2), 'raw-db-json');
                          }}
                          className="px-3 py-1 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors duration-150 flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {copiedField === 'raw-db-json' ? <Check className="w-3.5 h-3.5 stroke-[1.5]" /> : <Copy className="w-3.5 h-3.5 stroke-[1.5]" />}
                          <span>{copiedField === 'raw-db-json' ? 'Copied JSON!' : 'Copy Full JSON'}</span>
                        </button>
                      </div>

                      <pre className="p-4 bg-canvas border border-border rounded-sm text-xs font-mono text-text-primary overflow-x-auto max-h-96 leading-relaxed">
                        {JSON.stringify({ tenant_core: viewingDbTenant, database_settings: dbTenantSettings }, null, 2)}
                      </pre>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="h-14 px-6 border-t border-border bg-surface flex items-center justify-between shrink-0">
              <span className="text-[11px] text-text-muted">
                Boldlabs Super Admin &bull; Live Database Inspector &bull; Tenant: <strong className="text-text-primary">{viewingDbTenant.slug}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingDbTenant(null)}
                  className="px-3 py-1.5 bg-surface hover:bg-surface-subtle text-text-body text-xs font-medium rounded-sm border border-border transition-colors cursor-pointer"
                >
                  Close Inspector
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const t = viewingDbTenant;
                    setViewingDbTenant(null);
                    handleOpenConfig(t);
                  }}
                  className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors duration-150 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Sliders className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span>Configure Settings</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

{/* ── MODAL: FULL TENANT CONFIGURATION DRAWER (SUPER ADMIN) ─────────────── */}
      {editingConfigTenant && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-surface border border-border rounded-lg w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            
            {/* Modal Header */}
            <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0 bg-surface">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-sm bg-accent/10 border border-accent/20 text-accent flex items-center justify-center font-bold text-xs">
                  {editingConfigTenant.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-text-primary">
                      Configure {editingConfigTenant.name}
                    </h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-subtle border border-border text-text-muted">
                      /{editingConfigTenant.slug}
                    </span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                      editingConfigTenant.status === 'active'
                        ? 'bg-status-success-bg text-status-success'
                        : 'bg-status-error-bg text-status-error'
                    }`}>
                      {editingConfigTenant.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted">
                    Centralized platform configuration & brain control for this organization
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleImpersonateTenant(editingConfigTenant.id)}
                  className="px-2.5 py-1 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle border border-border rounded-sm transition-colors duration-150 flex items-center gap-1 cursor-pointer"
                  title="Open Client CRM in another tab or view"
                >
                  <ExternalLink className="w-3 h-3 stroke-[1.5]" />
                  <span>Open CRM</span>
                </button>

                <button
                  onClick={() => setEditingConfigTenant(null)}
                  className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-subtle rounded-sm transition-colors duration-150 cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[1.5]" />
                </button>
              </div>
            </div>

            {/* Subtabs Bar (Exact Same Subtabs as Original Settings) */}
            <div className="px-6 border-b border-border bg-surface-subtle flex items-center gap-1 overflow-x-auto shrink-0">
              {[
                { id: 'ai', label: 'AI Intelligence & BYOK', icon: Bot },
                { id: 'whatsapp', label: 'Meta WhatsApp API', icon: Smartphone },
                { id: 'templates', label: 'Message templates', icon: FileText },
                { id: 'location', label: 'Branding & Localization', icon: Building2 },
                { id: 'calendar', label: 'Google Calendar', icon: CalendarDays },
                { id: 'billing', label: 'Billing & Access', icon: CreditCard },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = configTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setConfigTab(tab.id as any)}
                    className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-medium transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                      active
                        ? 'border-accent text-accent font-semibold bg-surface'
                        : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body / Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {configLoading ? (
                <div className="py-20 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-accent mx-auto stroke-[1.5]" />
                  <p className="text-xs text-text-muted">Loading organization configuration...</p>
                </div>
              ) : (
                <form id="tenant-config-form" onSubmit={handleSaveConfig} className="space-y-6">
                  {configError && (
                    <div className="p-3 bg-status-error-bg border border-status-error-border text-status-error text-xs rounded-sm font-medium flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0 stroke-[1.5]" />
                      <span>{configError}</span>
                    </div>
                  )}

                  {configSavedNotice && (
                    <div className="p-3 bg-status-success-bg border border-status-success-border text-status-success text-xs rounded-sm font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[1.5]" />
                      <span>Settings saved and synchronized successfully!</span>
                    </div>
                  )}

                  {/* ── 1. AI BRAIN & BYOK MODEL KEYS (EXACT ORIGINAL COMPONENT) ─── */}
                  {configTab === 'ai' && (
                    <div className="space-y-4 bg-surface p-5 rounded-md border border-border">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div>
                          <h4 className="font-semibold text-xs text-text-primary">AI intelligence & model routing</h4>
                          <p className="text-xs text-text-muted">Insert your own model API keys (BYOK) with automatic fallback redundancy.</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-sm text-xs font-medium bg-surface-subtle text-text-secondary border border-border">
                          Active: {configForm.primary_model_provider?.toUpperCase() || 'GEMINI'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-text-primary mb-1">Primary AI provider</label>
                          <select
                            value={configForm.primary_model_provider || 'gemini'}
                            onChange={(e) => setConfigForm({ ...configForm, primary_model_provider: e.target.value })}
                            className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent font-sans transition-colors duration-150"
                          >
                            <option value="gemini">Google Gemini (Recommended / Multimodal)</option>
                            <option value="groq">Groq Cloud (LLaMA 3.3)</option>
                            <option value="opencode">OpenCode / OpenAI Endpoint</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-text-primary mb-1">Assistant name</label>
                          <input
                            type="text"
                            placeholder="e.g. Reception Assistant"
                            value={configForm.assistant_name || ''}
                            onChange={(e) => setConfigForm({ ...configForm, assistant_name: e.target.value })}
                            className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent font-sans transition-colors duration-150"
                          />
                          <p className="text-xs text-text-muted mt-1">Name used when greeting customers.</p>
                        </div>
                      </div>

                      {/* 1 Single Master AI Prompt & Knowledge Field */}
                      <div className="space-y-4 pt-2">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-medium text-text-primary">
                              AI instructions & knowledge base
                            </label>
                            <span className="text-xs text-text-muted">Master prompt</span>
                          </div>
                          <textarea
                            rows={10}
                            placeholder="Provide everything your AI needs to know:&#10;&#10;1. About Your Business: What you do, who runs it.&#10;2. Services & Pricing: Services offered, exact pricing, consultation fees.&#10;3. Conversational Goal: How to greet, answer queries, handle objections, and guide customers to book.&#10;4. Tone: Friendly, natural, short WhatsApp texting style (1-2 lines)."
                            value={configForm.ai_prompt || ''}
                            onChange={(e) => setConfigForm({ ...configForm, ai_prompt: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent font-sans leading-relaxed resize-y transition-colors duration-150"
                          />
                        </div>

                        {/* Location Box */}
                        <div className="p-4 bg-surface rounded-md border border-border space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-text-primary">
                              Business address & Google Maps link
                            </label>
                            <span className="text-xs font-medium text-text-muted bg-surface-subtle px-2 py-0.5 rounded-sm border border-border">
                              Sent after booking
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            placeholder="e.g. 123 Health Ave, Anna Nagar, Chennai. Maps: https://maps.app.goo.gl/xyz"
                            value={configForm.full_location_text || ''}
                            onChange={(e) => setConfigForm({ ...configForm, full_location_text: e.target.value })}
                            className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent font-sans resize-none transition-colors duration-150"
                          />
                        </div>

                        {/* Admin Notification Alerts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          <div className="p-3.5 bg-surface rounded-md border border-border space-y-1.5">
                            <label className="block text-xs font-medium text-text-primary">
                              Admin WhatsApp phone (booking alerts)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. +917603807215"
                              value={configForm.admin_whatsapp_number || ''}
                              onChange={(e) => setConfigForm({ ...configForm, admin_whatsapp_number: e.target.value })}
                              className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                            <p className="text-xs text-text-muted">
                              Receives instant WhatsApp notifications when an appointment is booked.
                            </p>
                          </div>

                          <div className="p-3.5 bg-surface rounded-md border border-border space-y-1.5">
                            <label className="block text-xs font-medium text-text-primary">
                              Admin notification email
                            </label>
                            <input
                              type="email"
                              placeholder="e.g. bhuvaneshkarnan@gmail.com"
                              value={configForm.notification_email || ''}
                              onChange={(e) => setConfigForm({ ...configForm, notification_email: e.target.value })}
                              className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                            <p className="text-xs text-text-muted">
                              Receives email confirmations and Google Calendar invites.
                            </p>
                          </div>
                        </div>

                        {/* Business Industry & Dynamic CRM Terminology */}
                        <div className="p-4 bg-surface rounded-md border border-border space-y-3 pt-3">
                          <div className="flex items-center justify-between pb-2 border-b border-border">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-text-secondary stroke-[1.5]" />
                              <div>
                                <h5 className="font-medium text-xs text-text-primary">Business industry & CRM terminology</h5>
                                <p className="text-xs text-text-muted">Choose your industry preset or customize terminology for your business.</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                              {INDUSTRY_PRESETS.find((p) => p.id === (configForm.industry || 'clinic'))?.name || 'Custom'}
                            </span>
                          </div>

                          {/* Preset Dropdown */}
                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">
                              Industry Preset (Select to auto-fill CRM labels)
                            </label>
                            <select
                              value={configForm.industry || 'clinic'}
                              onChange={(e) => {
                                const selectedPreset = INDUSTRY_PRESETS.find((p) => p.id === e.target.value);
                                setConfigForm({
                                  ...configForm,
                                  industry: e.target.value,
                                  taxonomy: selectedPreset ? { ...selectedPreset.taxonomy, requirement_presets: [...(selectedPreset.taxonomy.requirement_presets || [])] } : configForm.taxonomy,
                                });
                              }}
                              className="w-full px-2.5 py-2 bg-surface-subtle border border-border rounded-sm text-xs font-sans text-text-primary focus:bg-white focus:border-accent transition-colors duration-150 cursor-pointer font-medium"
                            >
                              {INDUSTRY_PRESETS.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* 4 Customizable Label Fields */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                            <div>
                              <label className="block text-[11px] font-medium text-text-muted mb-1">
                                Staff / Specialist Label
                              </label>
                              <input
                                type="text"
                                value={configForm.taxonomy?.staff_label ?? 'Preferred Doctor / Staff'}
                                onChange={(e) =>
                                  setConfigForm({
                                    ...configForm,
                                    taxonomy: {
                                      ...(configForm.taxonomy || {}),
                                      staff_label: e.target.value,
                                    },
                                  })
                                }
                                placeholder="e.g. Tutor / Counselor"
                                className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium text-text-muted mb-1">
                                Customer / Client Label
                              </label>
                              <input
                                type="text"
                                value={configForm.taxonomy?.client_label ?? 'Patient / Customer'}
                                onChange={(e) =>
                                  setConfigForm({
                                    ...configForm,
                                    taxonomy: {
                                      ...(configForm.taxonomy || {}),
                                      client_label: e.target.value,
                                    },
                                  })
                                }
                                placeholder="e.g. Student / Parent"
                                className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium text-text-muted mb-1">
                                Requirement / Notes Label
                              </label>
                              <input
                                type="text"
                                value={configForm.taxonomy?.requirement_label ?? 'Health Concern / Treatment'}
                                onChange={(e) =>
                                  setConfigForm({
                                    ...configForm,
                                    taxonomy: {
                                      ...(configForm.taxonomy || {}),
                                      requirement_label: e.target.value,
                                    },
                                  })
                                }
                                placeholder="e.g. Target Course & Grade"
                                className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium text-text-muted mb-1">
                                Event / Booking Label
                              </label>
                              <input
                                type="text"
                                value={configForm.taxonomy?.event_label ?? 'Appointment'}
                                onChange={(e) =>
                                  setConfigForm({
                                    ...configForm,
                                    taxonomy: {
                                      ...(configForm.taxonomy || {}),
                                      event_label: e.target.value,
                                    },
                                  })
                                }
                                placeholder="e.g. Demo Class / Counseling"
                                className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent"
                              />
                            </div>
                          </div>

                          {/* Quick Concern / Requirement Presets Input */}
                          <div className="pt-3 border-t border-border space-y-1.5">
                            <label className="block text-[11px] font-medium text-text-primary">
                              Quick {configForm.taxonomy?.requirement_label || 'Requirement / Concern'} Presets (comma-separated quick-pick chips)
                            </label>
                            <input
                              type="text"
                              value={(configForm.taxonomy?.requirement_presets && configForm.taxonomy.requirement_presets.length > 0)
                                ? configForm.taxonomy.requirement_presets.join(', ')
                                : (PREBUILT_REQUIREMENTS_BY_INDUSTRY[configForm.industry || 'clinic'] || []).join(', ')
                              }
                              onChange={(e) => {
                                const presets = e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean);
                                setConfigForm({
                                  ...configForm,
                                  taxonomy: {
                                    ...(configForm.taxonomy || {}),
                                    requirement_presets: presets,
                                  },
                                });
                              }}
                              placeholder="e.g. General Consultation, Back Pain & Physio, Dental Checkup & Cleaning"
                              className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent font-sans"
                            />
                            <p className="text-[10px] text-text-muted">
                              These clickable chips appear when adding or editing a client/patient to rapidly assign their concern or inquiry. Selecting an Industry above automatically loads standard presets, or you can freely customize them here.
                            </p>
                            <div className="flex flex-wrap gap-1 pt-1">
                              {((configForm.taxonomy?.requirement_presets && configForm.taxonomy.requirement_presets.length > 0)
                                ? configForm.taxonomy.requirement_presets
                                : (PREBUILT_REQUIREMENTS_BY_INDUSTRY[configForm.industry || 'clinic'] || [])
                              ).map((chip: string) => (
                                <span key={chip} className="px-2 py-0.5 rounded-sm text-[10px] bg-white border border-border text-text-secondary font-medium shadow-2xs">
                                  {chip}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Regional & Localization */}
                        <div className="p-4 bg-surface rounded-md border border-border space-y-3 pt-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-border">
                            <Globe className="w-4 h-4 text-text-secondary stroke-[1.5]" />
                            <div>
                              <h5 className="font-medium text-xs text-text-primary">Regional & localization settings</h5>
                              <p className="text-xs text-text-muted">Configure timezone, currency, and dialing code for your clients.</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-text-primary mb-1">
                                Business timezone
                              </label>
                              <select
                                value={configForm.timezone || 'Asia/Kolkata'}
                                onChange={(e) => setConfigForm({ ...configForm, timezone: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-sans text-text-primary focus:bg-white focus:border-accent transition-colors duration-150 cursor-pointer"
                              >
                                {TIMEZONE_LIST.map((tz) => (
                                  <option key={tz.value} value={tz.value}>
                                    {tz.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-text-primary mb-1">
                                Default calling code
                              </label>
                              <select
                                value={configForm.country_code || '+91'}
                                onChange={(e) => setConfigForm({ ...configForm, country_code: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-sans text-text-primary focus:bg-white focus:border-accent transition-colors duration-150 cursor-pointer"
                              >
                                {COUNTRY_CODES.map((c) => (
                                  <option key={c.code} value={c.code}>
                                    {c.country}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-text-primary mb-1">
                                Display currency
                              </label>
                              <select
                                value={configForm.currency || 'INR'}
                                onChange={(e) => {
                                  const sel = CURRENCY_LIST.find((c) => c.code === e.target.value);
                                  setConfigForm({
                                    ...configForm,
                                    currency: e.target.value,
                                    currency_symbol: sel ? sel.symbol : configForm.currency_symbol || '₹',
                                  });
                                }}
                                className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-sans text-text-primary focus:bg-white focus:border-accent transition-colors duration-150 cursor-pointer"
                              >
                                {CURRENCY_LIST.map((c) => (
                                  <option key={c.code} value={c.code}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 3 BYOK Keys */}
                      <div className="space-y-3 pt-4 border-t border-border">
                        <h5 className="font-semibold text-xs text-text-primary uppercase tracking-wider">API keys vault (BYOK)</h5>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-medium text-text-primary">1. Google Gemini API key</label>
                            {configForm.has_gemini_key && (
                              <span className="text-xs text-status-success font-medium bg-status-success-bg px-2 py-0.5 rounded-sm border border-status-success-border">
                                Key saved
                              </span>
                            )}
                          </div>
                          <input
                            type="password"
                            placeholder="AIzaSy... (Leave empty to keep existing key)"
                            value={configForm.gemini_api_key || ''}
                            onChange={(e) => setConfigForm({ ...configForm, gemini_api_key: e.target.value })}
                            className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-medium text-text-primary">2. Groq Cloud API key</label>
                            {configForm.has_groq_key && (
                              <span className="text-xs text-status-success font-medium bg-status-success-bg px-2 py-0.5 rounded-sm border border-status-success-border">
                                Key saved
                              </span>
                            )}
                          </div>
                          <input
                            type="password"
                            placeholder="gsk_... (Leave empty to keep existing key)"
                            value={configForm.groq_api_key || ''}
                            onChange={(e) => setConfigForm({ ...configForm, groq_api_key: e.target.value })}
                            className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-xs font-medium text-text-primary">3. OpenCode / OpenAI key</label>
                              {configForm.has_opencode_key && (
                                <span className="text-xs text-status-success font-medium bg-status-success-bg px-2 py-0.5 rounded-sm border border-status-success-border">
                                  Key saved
                                </span>
                              )}
                            </div>
                            <input
                              type="password"
                              placeholder="sk-... (Leave empty to keep existing)"
                              value={configForm.opencode_api_key || ''}
                              onChange={(e) => setConfigForm({ ...configForm, opencode_api_key: e.target.value })}
                              className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">Base URL</label>
                            <input
                              type="text"
                              placeholder="https://api.openai.com/v1"
                              value={configForm.opencode_base_url || 'https://api.openai.com/v1'}
                              onChange={(e) => setConfigForm({ ...configForm, opencode_base_url: e.target.value })}
                              className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── 2. META WHATSAPP API CREDENTIALS ─────────────────────── */}
                  {configTab === 'whatsapp' && (
                    <div className="space-y-4 bg-surface p-5 rounded-md border border-border">
                      <div className="pb-2 border-b border-border">
                        <h4 className="font-semibold text-xs text-text-primary">Meta WhatsApp Cloud API configuration</h4>
                        <p className="text-xs text-text-muted">Configure your Meta App webhook callback and permanent system user token.</p>
                      </div>

                      {/* Callback URL Box */}
                      <div className="bg-surface-subtle border border-border p-3.5 rounded-sm space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-medium text-text-primary">Webhook callback URL</label>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(`https://whatsapp-automation-system-eta.vercel.app/webhooks/whatsapp/${editingConfigTenant.slug}`, 'drawer_url')}
                            className="text-xs font-medium text-accent hover:text-accent-hover flex items-center gap-1 cursor-pointer"
                          >
                            {copiedField === 'drawer_url' ? <Check className="w-3.5 h-3.5 stroke-[1.5]" /> : <Copy className="w-3.5 h-3.5 stroke-[1.5]" />}
                            <span>{copiedField === 'drawer_url' ? 'Copied' : 'Copy URL'}</span>
                          </button>
                        </div>
                        <p className="font-mono text-xs text-text-secondary break-all select-all">
                          {`https://whatsapp-automation-system-eta.vercel.app/webhooks/whatsapp/${editingConfigTenant.slug}`}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-text-primary mb-1">Webhook verify token</label>
                          <input
                            type="text"
                            placeholder="e.g. my_secure_verify_token_123"
                            value={configForm.verify_token || ''}
                            onChange={(e) => setConfigForm({ ...configForm, verify_token: e.target.value })}
                            className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-text-primary mb-1">Meta phone number ID</label>
                          <input
                            type="text"
                            placeholder="e.g. 102938475610293"
                            value={configForm.meta_phone_id || ''}
                            onChange={(e) => setConfigForm({ ...configForm, meta_phone_id: e.target.value })}
                            className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-text-primary mb-1">WhatsApp Business Account ID (WABA ID)</label>
                          <input
                            type="text"
                            placeholder="e.g. 987654321098765"
                            value={configForm.meta_waba_id || ''}
                            onChange={(e) => setConfigForm({ ...configForm, meta_waba_id: e.target.value })}
                            className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-medium text-text-primary">Meta App secret (HMAC validation)</label>
                            {configForm.has_app_secret && (
                              <span className="text-xs text-status-success font-medium bg-status-success-bg px-2 py-0.5 rounded-sm border border-status-success-border">
                                Configured
                              </span>
                            )}
                          </div>
                          <input
                            type="password"
                            placeholder="App secret (Leave empty to keep existing)"
                            value={configForm.meta_app_secret || ''}
                            onChange={(e) => setConfigForm({ ...configForm, meta_app_secret: e.target.value })}
                            className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-medium text-text-primary">Meta system user access token</label>
                          {configForm.has_access_token && (
                            <span className="text-xs text-status-success font-medium bg-status-success-bg px-2 py-0.5 rounded-sm border border-status-success-border">
                              Token configured
                            </span>
                          )}
                        </div>
                        <input
                          type="password"
                          placeholder="EAAB... (Leave empty to keep existing token)"
                          value={configForm.meta_access_token || ''}
                          onChange={(e) => setConfigForm({ ...configForm, meta_access_token: e.target.value })}
                          className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                        />
                      </div>
                    </div>
                  )}

                  {/* ── 3. LIFECYCLE MESSAGE TEMPLATES ───────────────────────── */}
                  {configTab === 'templates' && (
                    <div className="space-y-5 bg-surface p-5 rounded-md border border-border">
                      <div className="pb-2 border-b border-border flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-xs text-text-primary">WhatsApp message template identifiers</h4>
                          <p className="text-xs text-text-muted">
                            Meta WhatsApp approved templates used for confirmations, 2-hr reminders, 15-min reviews, no-show nudges, and admin alerts.
                          </p>
                        </div>
                        <span className="text-xs font-medium text-status-success bg-status-success-bg px-2 py-0.5 rounded-sm border border-status-success-border">
                          Automated lifecycles
                        </span>
                      </div>

                      {/* Google Review URL Card */}
                      <div className="p-4 bg-surface rounded-md border border-border space-y-2">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-accent stroke-[1.5]" />
                          <label className="text-xs font-medium text-text-primary">
                            Google review link (automated 15-min review request)
                          </label>
                        </div>
                        <p className="text-xs text-text-muted">
                          When an appointment is marked as Attended, the system will send this review request link to the customer after 15 minutes.
                        </p>
                        <input
                          type="text"
                          placeholder="https://g.page/r/your-business-id/review"
                          value={configForm.google_review_link || ''}
                          onChange={(e) => setConfigForm({ ...configForm, google_review_link: e.target.value })}
                          className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                        />
                      </div>

                      {/* Customer Automation Templates */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                          Customer lifecycle templates
                        </h5>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">1. Client booking confirmation</label>
                            <input
                              type="text"
                              placeholder="booking_confirmationn"
                              value={configForm.template_booking_confirmation || ''}
                              onChange={(e) => setConfigForm({ ...configForm, template_booking_confirmation: e.target.value })}
                              className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                            <p className="text-xs text-text-muted mt-1">Dispatched upon appointment confirmation.</p>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">2. Client reschedule confirmation</label>
                            <input
                              type="text"
                              placeholder="booking_reschedule_confirmation"
                              value={configForm.template_reschedule_confirmation || ''}
                              onChange={(e) => setConfigForm({ ...configForm, template_reschedule_confirmation: e.target.value })}
                              className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                            <p className="text-xs text-text-muted mt-1">Dispatched when customer reschedules slot.</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">3. Client cancellation notice</label>
                            <input
                              type="text"
                              placeholder="cancellation_confirmation"
                              value={configForm.template_cancellation_confirmation || ''}
                              onChange={(e) => setConfigForm({ ...configForm, template_cancellation_confirmation: e.target.value })}
                              className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                            <p className="text-xs text-text-muted mt-1">Dispatched when booking is cancelled.</p>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">4. 2-Hour appointment reminder</label>
                            <input
                              type="text"
                              placeholder="appointment_ramainder"
                              value={configForm.template_appointment_reminder || ''}
                              onChange={(e) => setConfigForm({ ...configForm, template_appointment_reminder: e.target.value })}
                              className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                            <p className="text-xs text-text-muted mt-1">Sent 2 hours before start time.</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">5. 15-Min post-attendance review</label>
                            <input
                              type="text"
                              placeholder="review_request"
                              value={configForm.template_review_request || ''}
                              onChange={(e) => setConfigForm({ ...configForm, template_review_request: e.target.value })}
                              className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                            <p className="text-xs text-text-muted mt-1">Sent 15 mins after marked Attended.</p>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">6. 15-Min no-show reschedule nudge</label>
                            <input
                              type="text"
                              placeholder="reschedule_nudge"
                              value={configForm.template_reschedule_nudge || ''}
                              onChange={(e) => setConfigForm({ ...configForm, template_reschedule_nudge: e.target.value })}
                              className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                            <p className="text-xs text-text-muted mt-1">Sent 15 mins after marked No Show.</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">7. Client 24h Re-engagement Follow-up</label>
                            <input
                              type="text"
                              placeholder="client_followup_checkin"
                              value={configForm.template_client_followup || ''}
                              onChange={(e) => setConfigForm({ ...configForm, template_client_followup: e.target.value })}
                              className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                            <p className="text-xs text-text-muted mt-1">Dispatched when following up with a client after the 24h Meta messaging window.</p>
                          </div>
                        </div>
                      </div>

                      {/* Admin & Staff Templates */}
                      <div className="space-y-3 pt-3 border-t border-border">
                        <h5 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                          Admin & staff notification templates
                        </h5>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">7. Admin booking alert</label>
                            <input
                              type="text"
                              placeholder="admin_notification"
                              value={configForm.template_admin_notification || ''}
                              onChange={(e) => setConfigForm({ ...configForm, template_admin_notification: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">8. Admin reschedule alert</label>
                            <input
                              type="text"
                              placeholder="admin_reschedule_notice"
                              value={configForm.template_admin_reschedule_notice || ''}
                              onChange={(e) => setConfigForm({ ...configForm, template_admin_reschedule_notice: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">9. Admin cancellation alert</label>
                            <input
                              type="text"
                              placeholder="admin_cancellation_notice"
                              value={configForm.template_admin_cancellation_notice || ''}
                              onChange={(e) => setConfigForm({ ...configForm, template_admin_cancellation_notice: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">10. Staff takeover alert</label>
                            <input
                              type="text"
                              placeholder="admin_human_request"
                              value={configForm.template_admin_human_request || ''}
                              onChange={(e) => setConfigForm({ ...configForm, template_admin_human_request: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">11. Daily morning digest</label>
                            <input
                              type="text"
                              placeholder="admin_daily_digest"
                              value={configForm.template_admin_daily_digest || ''}
                              onChange={(e) => setConfigForm({ ...configForm, template_admin_daily_digest: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── 4. BRANDING & LOCALIZATION ──────────────────────────── */}
                  {configTab === 'location' && (
                    <div className="space-y-5 bg-surface p-5 rounded-md border border-border">
                      <div className="pb-2 border-b border-border flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-xs text-text-primary">Brand identity & localization</h4>
                          <p className="text-xs text-text-muted">Configure dashboard brand name, company title, and regional defaults.</p>
                        </div>
                      </div>

                      {/* Live Brand Preview Card */}
                      <div className="p-4 bg-surface rounded-md border border-border space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                            Header preview
                          </label>
                          <span className="text-xs font-medium text-status-success bg-status-success-bg px-2 py-0.5 rounded-sm border border-status-success-border">
                            Instant sync
                          </span>
                        </div>

                        <div className="p-3 bg-surface-subtle rounded-sm border border-border flex items-center gap-2.5">
                          <span className="font-bold text-[17px] text-text-primary tracking-tight">
                            {configForm.name || editingConfigTenant.name}
                          </span>
                          <span className="text-[13px] font-medium text-text-muted">
                            / Overview
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-text-primary mb-1">Company / Brand name</label>
                        <input
                          type="text"
                          placeholder="e.g. Boldlabs CRM / Acme Studio"
                          value={configForm.name || ''}
                          onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
                          className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                        />
                        <p className="text-xs text-text-muted mt-1">Appears across header, email notifications, and customer templates.</p>
                      </div>

                      {/* Regional & Currency Localization Card */}
                      <div className="p-4 bg-surface rounded-md border border-border space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-border">
                          <Globe className="w-4 h-4 text-text-secondary stroke-[1.5]" />
                          <div>
                            <h5 className="font-medium text-xs text-text-primary">Regional localization</h5>
                            <p className="text-xs text-text-muted">Configure timezone, currency, and dialing code for this organization.</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                          {/* Timezone */}
                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">
                              Business timezone
                            </label>
                            <select
                              value={configForm.timezone || 'Asia/Kolkata'}
                              onChange={(e) => setConfigForm({ ...configForm, timezone: e.target.value })}
                              className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-sans text-text-primary focus:bg-white focus:border-accent transition-colors duration-150 cursor-pointer"
                            >
                              {TIMEZONE_LIST.map((tz) => (
                                <option key={tz.value} value={tz.value}>
                                  {tz.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Country Code */}
                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">
                              Default country code
                            </label>
                            <select
                              value={configForm.country_code || '+91'}
                              onChange={(e) => setConfigForm({ ...configForm, country_code: e.target.value })}
                              className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-sans text-text-primary focus:bg-white focus:border-accent transition-colors duration-150 cursor-pointer"
                            >
                              {COUNTRY_CODES.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.country}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Currency Selection */}
                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">
                              Display currency
                            </label>
                            <select
                              value={configForm.currency || 'INR'}
                              onChange={(e) => {
                                const sel = CURRENCY_LIST.find((c) => c.code === e.target.value);
                                setConfigForm({
                                  ...configForm,
                                  currency: e.target.value,
                                  currency_symbol: sel ? sel.symbol : configForm.currency_symbol || '₹',
                                });
                              }}
                              className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-sans text-text-primary focus:bg-white focus:border-accent transition-colors duration-150 cursor-pointer"
                            >
                              {CURRENCY_LIST.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-text-primary mb-1">Business address & Google Maps link</label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Suite 400, Innovation Tower, City Center. Maps: https://maps.app.goo.gl/..."
                          value={configForm.full_location_text || ''}
                          onChange={(e) => setConfigForm({ ...configForm, full_location_text: e.target.value })}
                          className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent resize-none transition-colors duration-150"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-text-primary mb-1">Admin WhatsApp alert phone</label>
                          <input
                            type="text"
                            placeholder="+919876543210"
                            value={configForm.admin_whatsapp_number || ''}
                            onChange={(e) => setConfigForm({ ...configForm, admin_whatsapp_number: e.target.value })}
                            className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-text-primary mb-1">Notification email</label>
                          <input
                            type="email"
                            placeholder="admin@business.com"
                            value={configForm.notification_email || ''}
                            onChange={(e) => setConfigForm({ ...configForm, notification_email: e.target.value })}
                            className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── 5. GOOGLE CALENDAR SYNC ─────────────────────────────── */}
                  {configTab === 'calendar' && (
                    <div className="space-y-5 bg-surface p-5 rounded-md border border-border">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div>
                          <h4 className="font-semibold text-xs text-text-primary">Google Calendar 2-way synchronization</h4>
                          <p className="text-xs text-text-muted">Sync WhatsApp bookings directly to Google Calendar schedules.</p>
                        </div>
                        {configForm.google_calendar_configured ? (
                          <span className="text-xs text-status-success font-medium bg-status-success-bg px-2 py-0.5 rounded-sm border border-status-success-border flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.5]" />
                            <span>Connected & synced</span>
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted font-medium bg-surface-subtle px-2 py-0.5 rounded-sm border border-border">
                            Not connected
                          </span>
                        )}
                      </div>

                      {/* Step 1: Authorized Redirect URI Box */}
                      <div className="bg-surface rounded-md border border-border p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-medium text-text-primary">
                            Authorized redirect URI
                          </label>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('https://whatsapp-automation-system-eta.vercel.app/api/v1/crm/oauth/google/callback', 'gcal_redirect')}
                            className="text-xs font-medium text-accent hover:text-accent-hover flex items-center gap-1 cursor-pointer"
                          >
                            {copiedField === 'gcal_redirect' ? <Check className="w-3.5 h-3.5 stroke-[1.5]" /> : <Copy className="w-3.5 h-3.5 stroke-[1.5]" />}
                            <span>{copiedField === 'gcal_redirect' ? 'Copied' : 'Copy URI'}</span>
                          </button>
                        </div>
                        <p className="font-mono text-xs text-text-secondary break-all select-all bg-surface-subtle p-2.5 rounded-sm border border-border">
                          https://whatsapp-automation-system-eta.vercel.app/api/v1/crm/oauth/google/callback
                        </p>
                      </div>

                      {/* Step 2: Client ID & Secret Inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-text-primary mb-1">Google OAuth Client ID</label>
                          <input
                            type="text"
                            placeholder="...apps.googleusercontent.com"
                            value={configForm.google_client_id || ''}
                            onChange={(e) => setConfigForm({ ...configForm, google_client_id: e.target.value })}
                            className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-text-primary mb-1">Google OAuth Client Secret</label>
                          <input
                            type="password"
                            placeholder="GOCSPX-..."
                            value={configForm.google_client_secret || ''}
                            onChange={(e) => setConfigForm({ ...configForm, google_client_secret: e.target.value })}
                            className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                          />
                        </div>
                      </div>

                      {/* Calendar ID Config */}
                      <div>
                        <label className="block text-xs font-medium text-text-primary mb-1">Target Google Calendar ID</label>
                        <input
                          type="text"
                          placeholder="primary"
                          value={configForm.google_calendar_id || 'primary'}
                          onChange={(e) => setConfigForm({ ...configForm, google_calendar_id: e.target.value })}
                          className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                        />
                        <p className="text-xs text-text-muted mt-1">Leave as <code>primary</code> to sync with main calendar.</p>
                      </div>
                    </div>
                  )}

                  {/* ── 6. BILLING & ACCESS CONTROL ───────────────────────────── */}
                  {configTab === 'billing' && (
                    <div className="space-y-4 bg-surface p-5 rounded-md border border-border">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div>
                          <h4 className="font-semibold text-xs text-text-primary">Subscription Plan & Organization Access</h4>
                          <p className="text-xs text-text-muted">Control client subscription plan, active status and reset access passwords.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-surface-subtle rounded-md border border-border space-y-2">
                          <label className="block text-xs font-medium text-text-primary">Subscription Tier</label>
                          <select
                            value={editingConfigTenant.plan || 'pro'}
                            onChange={(e) => setEditingConfigTenant({ ...editingConfigTenant, plan: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-border rounded-sm text-xs text-text-primary focus:border-accent cursor-pointer"
                          >
                            <option value="pro">Standard Automation Plan (₹3,499/mo) &mdash; Official Razorpay Sub</option>
                            <option value="starter">Starter Plan (₹999/mo)</option>
                            <option value="enterprise">Enterprise Plan (₹9,999/mo)</option>
                            <option value="custom">Custom Plan</option>
                          </select>
                        </div>

                        <div className="p-4 bg-surface-subtle rounded-md border border-border space-y-2">
                          <label className="block text-xs font-medium text-text-primary">Account Active Status</label>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs text-text-secondary">
                              Status: <span className="font-bold text-text-primary">{editingConfigTenant.status.toUpperCase()}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(editingConfigTenant.id, editingConfigTenant.status === 'active')}
                              className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                                editingConfigTenant.status === 'active'
                                  ? 'bg-status-error-bg text-status-error border border-status-error-border hover:bg-rose-100'
                                  : 'bg-status-success-bg text-status-success border border-status-success-border hover:bg-emerald-100'
                              }`}
                            >
                              {editingConfigTenant.status === 'active' ? 'Pause Client' : 'Activate Client'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Password Reset Box */}
                      <div className="p-4 bg-surface-subtle rounded-md border border-border space-y-3">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-accent stroke-[1.5]" />
                          <h5 className="font-semibold text-xs text-text-primary">Instant Admin Password Reset</h5>
                        </div>
                        <p className="text-xs text-text-muted">
                          Directly overwrite the client login password for email: <code>{editingConfigTenant.admin_email || `${editingConfigTenant.slug}@goboldlabs.com`}</code>
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Enter new strong password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-white border border-border rounded-sm text-xs font-mono text-text-primary focus:border-accent"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              if (!editingConfigTenant || !newPassword) return;
                              setResettingPassword(true);
                              setResetError('');
                              try {
                                await admin.resetPassword(editingConfigTenant.id, newPassword);
                                setResetSuccess(true);
                                setTimeout(() => {
                                  setNewPassword('');
                                  setResetSuccess(false);
                                }, 2500);
                              } catch (err: unknown) {
                                setResetError(err instanceof Error ? err.message : 'Failed to reset password.');
                              } finally {
                                setResettingPassword(false);
                              }
                            }}
                            disabled={resettingPassword || !newPassword}
                            className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {resettingPassword ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                            <span>Reset Password</span>
                          </button>
                        </div>
                        {resetSuccess && (
                          <p className="text-xs text-status-success font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Password reset successfully!
                          </p>
                        )}
                        {resetError && (
                          <p className="text-xs text-status-error font-medium flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> {resetError}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Drawer Bottom Actions */}
                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setEditingConfigTenant(null)}
                      className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle border border-border rounded-sm transition-colors duration-150 cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={configSaving}
                      className="px-5 py-2 bg-accent hover:bg-accent-hover text-white font-medium text-xs rounded-sm transition-colors duration-150 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      {configSaving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin stroke-[1.5]" />
                          <span>Saving configurations...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[1.5]" />
                          <span>Save & Apply Settings</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ONBOARD CLIENT ORGANIZATION ────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-md w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-subtle">
            
            {/* Modal Header */}
            <div className="h-12 px-5 border-b border-border flex items-center justify-between shrink-0 bg-surface">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-accent stroke-[1.5]" />
                <h3 className="text-xs font-semibold text-text-primary">
                  Onboard Client Organization
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
                  <label className="block text-xs font-medium text-text-primary mb-1">Company / Organization Name *</label>
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
                  <label className="block text-xs font-medium text-text-primary mb-1">Admin Account Email *</label>
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
                  <label className="block text-xs font-medium text-text-primary mb-1">Admin Initial Password *</label>
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
                  <label className="block text-xs font-medium text-text-primary mb-1">Subscription Plan</label>
                  <select
                    value={formData.plan}
                    onChange={(e) => {
                      const p = e.target.value;
                      let price = formData.monthly_price;
                      if (p === 'starter') price = 999;
                      else if (p === 'pro') price = 3499;
                      else if (p === 'enterprise') price = 9999;
                      setFormData({ ...formData, plan: p, monthly_price: price });
                    }}
                    className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-sans text-text-primary focus:bg-white focus:border-accent transition-colors duration-150 cursor-pointer"
                  >
                    <option value="pro">Standard Automation Plan (₹3,499/mo)</option>
                    <option value="starter">Starter (₹999/mo)</option>
                    <option value="enterprise">Enterprise (₹9,999/mo)</option>
                    <option value="custom">Custom plan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Monthly Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="3499"
                    value={formData.monthly_price}
                    onChange={(e) => setFormData({ ...formData, monthly_price: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono tabular-nums text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Billing Day of Month</label>
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
                <label className="block text-xs font-medium text-text-primary mb-1">Razorpay Subscription ID (Optional)</label>
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
                  <span>Provision Organization</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ── MODAL: RESET CLIENT PASSWORD ──────────────────────────────────────── */}
      {resetTenantId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-surface border border-border rounded-md w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="h-12 px-5 border-b border-border flex items-center justify-between bg-surface">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-accent stroke-[1.5]" />
                <h3 className="text-xs font-semibold text-text-primary">
                  Reset Client Password
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
              {resetTenantName && (
                <p className="text-xs text-text-muted">
                  Setting new login password for <strong className="text-text-primary">{resetTenantName}</strong>.
                </p>
              )}

              {resetError && (
                <div className="p-3 bg-status-error-bg border border-status-error-border text-status-error text-xs rounded-sm font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 stroke-[1.5]" />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccess ? (
                <div className="p-3 bg-status-success-bg border border-status-success-border text-status-success text-xs rounded-sm font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 stroke-[1.5]" />
                  <span>Password reset successfully!</span>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">New Password</label>
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
                      disabled={resettingPassword || !newPassword || newPassword.length < 6}
                      className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {resettingPassword ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>{resettingPassword ? 'Updating...' : 'Update Password'}</span>
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: DELETE CONFIRMATION ────────────────────────────────────────── */}
      {deleteTenantTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-md w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="h-12 px-5 border-b border-border flex items-center justify-between bg-surface">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-status-error stroke-[1.5]" />
                <h3 className="text-xs font-semibold text-text-primary">
                  Delete Organization
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
                  <span>Delete Organization</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: RAZORPAY PAYMENT LINK & ACTIVATION ──────────────────────────── */}
      {activePaymentModalTenant && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in duration-150">
            <div className="h-14 px-5 border-b border-border flex items-center justify-between bg-surface">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-text-primary">
                    Billing Activated: {activePaymentModalTenant.name}
                  </h3>
                  <p className="text-[10px] text-text-muted">
                    {activePaymentModalTenant.razorpay_subscription_id?.startsWith('plink_')
                      ? `Razorpay Payment Link #${activePaymentModalTenant.razorpay_subscription_id}`
                      : `Razorpay Subscription #${activePaymentModalTenant.razorpay_subscription_id}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActivePaymentModalTenant(null)}
                className="p-1 text-text-muted hover:text-text-primary rounded-sm transition-colors duration-150 cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-md text-xs text-purple-700 dark:text-purple-300 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ready to Activate (₹3,499/mo)</span>
                </p>
                <p className="text-text-secondary text-[11px] leading-relaxed">
                  The client organization has been moved to <strong>Ready to Activate</strong>.
                  Their WhatsApp automation runs freely until the customer completes the first payment.
                </p>
              </div>

              {activePaymentModalTenant.razorpay_short_url && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-text-primary">
                    Client Razorpay Payment Link
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={activePaymentModalTenant.razorpay_short_url}
                      className="w-full px-3 py-2 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary select-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyPaymentLink(activePaymentModalTenant.razorpay_short_url!, 'modal')}
                      className="px-3 py-2 bg-accent hover:bg-accent-hover text-white rounded-sm text-xs font-medium transition-colors duration-150 cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      {copiedLink === 'modal' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink === 'modal' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {activePaymentModalTenant.razorpay_short_url && (
                    <a
                      href={activePaymentModalTenant.razorpay_short_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-medium"
                    >
                      <span>Test Payment Page</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    type="button"
                    disabled={activatingBillingId === activePaymentModalTenant.id}
                    onClick={() => handleActivateBilling(activePaymentModalTenant, true)}
                    className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary underline cursor-pointer disabled:opacity-50"
                    title="Generate a brand new live payment link"
                  >
                    <RefreshCw className={`w-3 h-3 ${activatingBillingId === activePaymentModalTenant.id ? 'animate-spin' : ''}`} />
                    <span>Regenerate Link</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePaymentModalTenant(null)}
                  className="px-4 py-1.5 bg-surface-subtle hover:bg-surface border border-border text-xs font-medium text-text-primary rounded-sm transition-colors cursor-pointer ml-auto"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: VIEW INVOICES ──────────────────────────────────────────────── */}
      {viewingInvoicesTenant && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in duration-150">
            <div className="h-14 px-5 border-b border-border flex items-center justify-between bg-surface">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent stroke-[1.5]" />
                <div>
                  <h3 className="text-xs font-bold text-text-primary">
                    Billing Invoices: {viewingInvoicesTenant.name}
                  </h3>
                  <p className="text-[10px] text-text-muted">
                    Sub ID: {viewingInvoicesTenant.razorpay_subscription_id || 'None'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSyncBilling(viewingInvoicesTenant).then(() => handleViewInvoices(viewingInvoicesTenant))}
                  disabled={syncingBillingId === viewingInvoicesTenant.id}
                  className="px-2 py-1 text-xs bg-surface-subtle hover:bg-surface border border-border rounded-sm text-text-secondary flex items-center gap-1 cursor-pointer"
                  title="Sync with Razorpay"
                >
                  <RefreshCw className={`w-3 h-3 ${syncingBillingId === viewingInvoicesTenant.id ? 'animate-spin' : ''}`} />
                  <span>Sync Invoices</span>
                </button>
                <button
                  onClick={() => setViewingInvoicesTenant(null)}
                  className="p-1 text-text-muted hover:text-text-primary rounded-sm transition-colors duration-150 cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[1.5]" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {loadingInvoices ? (
                <div className="py-12 text-center text-xs text-text-muted flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-accent" />
                  <span>Loading invoice history...</span>
                </div>
              ) : tenantInvoices.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <FileText className="w-8 h-8 text-text-muted mx-auto stroke-[1.5]" />
                  <p className="text-xs font-medium text-text-primary">No invoices generated yet</p>
                  <p className="text-[11px] text-text-muted">
                    Invoices will appear here once recurring charges occur via Razorpay.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-surface-subtle text-text-muted">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Invoice ID</th>
                      <th className="py-2 px-3">Payment ID</th>
                      <th className="py-2 px-3">Amount</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {tenantInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-surface-subtle/40">
                        <td className="py-2.5 px-3 font-mono text-text-secondary text-[11px]">
                          {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('en-IN') : new Date(inv.created_at).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-text-primary text-[11px]">
                          {inv.razorpay_invoice_id || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-text-muted text-[11px]">
                          {inv.razorpay_payment_id || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-text-primary">
                          ₹{inv.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            inv.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}>
                            {inv.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {inv.invoice_pdf_url ? (
                            <a
                              href={inv.invoice_pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent hover:underline inline-flex items-center gap-1 text-[11px] font-medium"
                            >
                              <span>View Receipt</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-text-muted text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

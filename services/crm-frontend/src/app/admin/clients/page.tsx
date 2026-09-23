'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Briefcase,
  ShoppingBag,
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
  ArrowRight,
  DollarSign,
  TrendingUp,
  Activity,
  MessageSquare,
  Users,
  User,
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
  XCircle,
  ShieldAlert,
  Loader2,
  Stethoscope,
  Menu,
  PhoneCall,
  PhoneMissed,
  Share2,
  Download,
  MoreVertical,
  ListChecks,
  Zap,
  Phone,
} from 'lucide-react';
import {
  admin,
  crm,
  auth,
  ClientTenant,
  ClientCreatedResponse,
  PlatformStats,
  TenantSettingsResponse,
  TenantSettingsUpdate,
  Invoice,
  metaTemplatesApi,
  MetaTemplatesStatusResponse,
  MetaTemplatesSyncResponse,
  StaffUser,
  StaffPermissions,
  GlobalRulesResponse,
  LiveCalendarAvailabilityResponse,
  LiveCalendarSlot,
  PartnerAgencyTemplate,
  TenantOnboardingStatus,
  OnboardingStep,
} from '@/lib/api';
import WhatsAppEmbeddedSignupButton from '@/components/WhatsAppEmbeddedSignupButton';


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
  business: [
    'General Inquiry',
    'Service Consultation',
    'Project Scope Discussion',
    'Follow-up Session',
    'Priority Support',
  ],
  ecommerce: [
    'Product Inquiry / Sizing',
    'Order Status & Tracking',
    'Return / Exchange Request',
    'Restock & Repurchase Alert',
    'Bulk / Wholesale Order',
  ],
};

const INDUSTRY_PRESETS = [
  {
    id: 'business',
    name: 'Universal Business & Services',
    subtitle: 'Appointments, Leads, Retainers, Consulting & Clinics',
    taxonomy: {
      staff_label: 'Assigned Staff',
      client_label: 'Client',
      client_plural: 'Clients',
      requirement_label: 'Requirement / Service Focus',
      event_label: 'Meeting / Session',
      booking_cta: '+ Schedule Session',
      tab_chats_label: 'Chats',
      tab_clients_label: 'Clients',
      tab_repeat_label: 'Repeat Clients',
      tab_bookings_label: 'Bookings',
      tab_calendar_label: 'Calendar schedule',
      tab_marketing_label: 'Marketing',
      requirement_presets: PREBUILT_REQUIREMENTS_BY_INDUSTRY.business,
    },
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce & Retail',
    subtitle: 'Products, Orders, Shipments & Re-orders',
    taxonomy: {
      staff_label: 'Sales Rep / Support',
      client_label: 'Customer',
      client_plural: 'Customers',
      requirement_label: 'Interested Product / SKU',
      event_label: 'Order / Delivery',
      booking_cta: '+ New Order',
      tab_chats_label: 'Chats',
      tab_clients_label: 'Buyers',
      tab_repeat_label: 'Repeat Buyers',
      tab_bookings_label: 'Orders',
      tab_calendar_label: 'Dispatch Calendar',
      tab_marketing_label: 'Campaigns',
      requirement_presets: PREBUILT_REQUIREMENTS_BY_INDUSTRY.ecommerce,
    },
  },
  {
    id: 'custom',
    name: 'Custom / Other',
    subtitle: 'Fully custom entities, fields & tabs',
    taxonomy: {
      staff_label: 'Staff Member',
      client_label: 'Customer',
      client_plural: 'Customers',
      requirement_label: 'Service Details',
      event_label: 'Appointment',
      booking_cta: '+ New Booking',
      tab_chats_label: 'Chats',
      tab_clients_label: 'Customers',
      tab_repeat_label: 'Repeat Clients',
      tab_bookings_label: 'Bookings',
      tab_calendar_label: 'Calendar schedule',
      tab_marketing_label: 'Marketing',
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
  const [activeTab, setActiveTab] = useState<'organizations' | 'razorpay' | 'admin_config' | 'missed_call'>('organizations');
  
  // Segmented Organization Tabs: All Organizations, Mine (Direct), Partnered (White-Label)
  const [activeOrgTab, setActiveOrgTab] = useState<'all' | 'direct' | 'partnered'>('all');
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState<string>('all');
  const [isAddingNewPartner, setIsAddingNewPartner] = useState(false);
  const [newPartnerNameInput, setNewPartnerNameInput] = useState('');

  // ── PARTNER AGENCY TEMPLATES (Reusable White-Label Presets) ──
  const [partnerTemplates, setPartnerTemplates] = useState<PartnerAgencyTemplate[]>([]);
  const [showPartnerTemplateModal, setShowPartnerTemplateModal] = useState(false);
  const [savingPartnerTemplate, setSavingPartnerTemplate] = useState(false);
  const [partnerTemplateForm, setPartnerTemplateForm] = useState<PartnerAgencyTemplate>({
    partner_name: '',
    partner_share_pct: 50,
    owner_share_pct: 50,
    custom_domain: '',
    brand_name: '',
    brand_logo_url: '',
    brand_favicon_url: '',
    brand_primary_color: '#7C3AED',
    brand_support_email: '',
    brand_support_phone: '',
    hide_platform_branding: true,
    is_default: true,
  });

  const [showWebhooksRegistry, setShowWebhooksRegistry] = useState(false);
  const [oauthConnecting, setOauthConnecting] = useState(false);
  const [oauthDisconnecting, setOauthDisconnecting] = useState(false);

  // Live Google Calendar Slot Tester in Global Settings & Drawer
  const [testerTenantId, setTesterTenantId] = useState('');
  const [testerLoading, setTesterLoading] = useState(false);
  const [testerAvailability, setTesterAvailability] = useState<LiveCalendarAvailabilityResponse | null>(null);
  const [testerError, setTesterError] = useState('');

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
  const [configTab, setConfigTab] = useState<'ai' | 'whatsapp' | 'templates' | 'location' | 'calendar' | 'whitelabel' | 'billing' | 'team'>('ai');
  const [configForm, setConfigForm] = useState<TenantSettingsUpdate>({});
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configError, setConfigError] = useState('');
  const [configSavedNotice, setConfigSavedNotice] = useState(false);

  // ── AI PROMPT OPTIMIZER STATE ──────────────────────────────────
  const [showOptimizerModal, setShowOptimizerModal] = useState(false);
  const [optimizerDump, setOptimizerDump] = useState('');
  const [optimizerLoading, setOptimizerLoading] = useState(false);
  const [optimizerError, setOptimizerError] = useState('');
  const [optimizerPreview, setOptimizerPreview] = useState<{
    assistant_name: string;
    ai_prompt: string;
    services_text: string;
    bot_goal: string;
    strict_rules: string;
    objection_handling: string;
    response_style: string;
  } | null>(null);

  // ── STAFF & ROLES PERMISSIONS STATE ──────────────────────────
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [staffForm, setStaffForm] = useState<{
    email: string;
    password: string;
    display_name: string;
    role: string;
    is_active: boolean;
    permissions: StaffPermissions;
  }>({
    email: '',
    password: '',
    display_name: '',
    role: 'receptionist',
    is_active: true,
    permissions: {
      can_view_inbox: true,
      can_send_messages: true,
      can_manage_bookings: true,
      can_view_calendar: true,
      can_manage_customers: true,
      can_manage_marketing: false,
      can_view_analytics: false,
      can_manage_settings: false,
      assigned_doctor: '',
    }
  });

  async function loadTenantStaff(tenantId: string) {
    if (!tenantId) return;
    setStaffLoading(true);
    setStaffError('');
    try {
      const list = await admin.listStaff(tenantId);
      setStaffList(list);
    } catch (err: any) {
      setStaffError(err?.message || 'Failed to load staff list');
    } finally {
      setStaffLoading(false);
    }
  }

  function getRoleDefaultPermissions(role: string, assignedDoctor: string = ''): StaffPermissions {
    switch (role) {
      case 'admin':
        return {
          can_view_inbox: true,
          can_send_messages: true,
          can_manage_bookings: true,
          can_view_calendar: true,
          can_manage_customers: true,
          can_manage_marketing: true,
          can_view_analytics: true,
          can_manage_settings: true,
          assigned_doctor: '',
        };
      case 'sales':
        return {
          can_view_inbox: true,
          can_send_messages: true,
          can_manage_bookings: true,
          can_view_calendar: true,
          can_manage_customers: true,
          can_manage_marketing: false,
          can_view_analytics: false,
          can_manage_settings: false,
          assigned_doctor: '',
        };
      case 'doctor':
        return {
          can_view_inbox: true,
          can_send_messages: true,
          can_manage_bookings: true,
          can_view_calendar: true,
          can_manage_customers: true,
          can_manage_marketing: false,
          can_view_analytics: false,
          can_manage_settings: false,
          assigned_doctor: assignedDoctor || '',
        };
      case 'receptionist':
        return {
          can_view_inbox: true,
          can_send_messages: true,
          can_manage_bookings: true,
          can_view_calendar: true,
          can_manage_customers: true,
          can_manage_marketing: false,
          can_view_analytics: false,
          can_manage_settings: false,
          assigned_doctor: '',
        };
      case 'marketing':
        return {
          can_view_inbox: true,
          can_send_messages: false,
          can_manage_bookings: false,
          can_view_calendar: false,
          can_manage_customers: true,
          can_manage_marketing: true,
          can_view_analytics: true,
          can_manage_settings: false,
          assigned_doctor: '',
        };
      case 'agent':
        return {
          can_view_inbox: true,
          can_send_messages: true,
          can_manage_bookings: false,
          can_view_calendar: false,
          can_manage_customers: false,
          can_manage_marketing: false,
          can_view_analytics: false,
          can_manage_settings: false,
          assigned_doctor: '',
        };
      case 'viewer':
        return {
          can_view_inbox: true,
          can_send_messages: false,
          can_manage_bookings: false,
          can_view_calendar: true,
          can_manage_customers: false,
          can_manage_marketing: false,
          can_view_analytics: false,
          can_manage_settings: false,
          assigned_doctor: '',
        };
      default:
        return {
          can_view_inbox: true,
          can_send_messages: false,
          can_manage_bookings: false,
          can_view_calendar: false,
          can_manage_customers: false,
          can_manage_marketing: false,
          can_view_analytics: false,
          can_manage_settings: false,
          assigned_doctor: '',
        };
    }
  }

  function handleOpenCreateStaff() {
    setEditingStaff(null);
    setStaffForm({
      email: '',
      password: '',
      display_name: '',
      role: 'sales',
      is_active: true,
      permissions: getRoleDefaultPermissions('sales'),
    });
    setStaffError('');
    setShowStaffModal(true);
  }

  function handleOpenEditStaff(member: StaffUser) {
    setEditingStaff(member);
    const roleDefaults = getRoleDefaultPermissions(member.role, member.permissions?.assigned_doctor);
    setStaffForm({
      email: member.email,
      password: '',
      display_name: member.display_name || '',
      role: member.role,
      is_active: member.is_active,
      permissions: {
        can_view_inbox: member.permissions?.can_view_inbox !== undefined ? member.permissions.can_view_inbox : roleDefaults.can_view_inbox,
        can_send_messages: member.permissions?.can_send_messages !== undefined ? member.permissions.can_send_messages : roleDefaults.can_send_messages,
        can_manage_bookings: member.permissions?.can_manage_bookings !== undefined ? member.permissions.can_manage_bookings : roleDefaults.can_manage_bookings,
        can_view_calendar: member.permissions?.can_view_calendar !== undefined ? member.permissions.can_view_calendar : roleDefaults.can_view_calendar,
        can_manage_customers: member.permissions?.can_manage_customers !== undefined ? member.permissions.can_manage_customers : roleDefaults.can_manage_customers,
        can_manage_marketing: member.permissions?.can_manage_marketing !== undefined ? member.permissions.can_manage_marketing : roleDefaults.can_manage_marketing,
        can_view_analytics: member.permissions?.can_view_analytics !== undefined ? member.permissions.can_view_analytics : roleDefaults.can_view_analytics,
        can_manage_settings: member.permissions?.can_manage_settings !== undefined ? member.permissions.can_manage_settings : roleDefaults.can_manage_settings,
        assigned_doctor: member.permissions?.assigned_doctor || '',
      },
    });
    setStaffError('');
    setShowStaffModal(true);
  }

  async function handleSaveStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!editingConfigTenant) return;
    if (!staffForm.email.trim()) {
      setStaffError('Email address is required.');
      return;
    }
    if (!editingStaff && !staffForm.password.trim()) {
      setStaffError('Password is required when creating a new staff credential.');
      return;
    }
    setStaffSaving(true);
    setStaffError('');
    try {
      if (editingStaff) {
        await admin.updateStaff(editingConfigTenant.id, editingStaff.id, {
          display_name: staffForm.display_name.trim(),
          role: staffForm.role,
          permissions: staffForm.permissions,
          is_active: staffForm.is_active,
          ...(staffForm.password.trim() ? { password: staffForm.password.trim() } : {}),
        });
      } else {
        await admin.createStaff(editingConfigTenant.id, {
          email: staffForm.email.trim(),
          password: staffForm.password.trim(),
          display_name: staffForm.display_name.trim(),
          role: staffForm.role,
          permissions: staffForm.permissions,
        });
      }
      setShowStaffModal(false);
      setEditingStaff(null);
      await loadTenantStaff(editingConfigTenant.id);
      setActionSuccessNotice('Staff credentials updated successfully.');
      setTimeout(() => setActionSuccessNotice(null), 3000);
    } catch (err: any) {
      setStaffError(err?.message || 'Failed to save staff credentials.');
    } finally {
      setStaffSaving(false);
    }
  }

  async function handleDeleteStaff(userId: string, memberEmail: string) {
    if (!editingConfigTenant) return;
    if (!confirm(`Are you sure you want to delete staff account ${memberEmail}? This will permanently revoke their CRM login.`)) {
      return;
    }
    setStaffLoading(true);
    try {
      await admin.deleteStaff(editingConfigTenant.id, userId);
      await loadTenantStaff(editingConfigTenant.id);
      setActionSuccessNotice('Staff member removed successfully.');
      setTimeout(() => setActionSuccessNotice(null), 3000);
    } catch (err: any) {
      setStaffError(err?.message || 'Failed to delete staff member');
    } finally {
      setStaffLoading(false);
    }
  }

  // Meta Templates Sync state & Live Meta Status
  const [isSyncingMetaTemplates, setIsSyncingMetaTemplates] = useState(false);
  const [metaSyncResult, setMetaSyncResult] = useState<MetaTemplatesSyncResponse | null>(null);
  const [metaTemplatesStatus, setMetaTemplatesStatus] = useState<MetaTemplatesStatusResponse | null>(null);
  const [loadingMetaTemplates, setLoadingMetaTemplates] = useState(false);

  async function loadAdminMetaTemplatesStatus(tenantId?: string) {
    const tId = tenantId || editingConfigTenant?.id || viewingDbTenant?.id;
    if (!tId) return;
    setLoadingMetaTemplates(true);
    try {
      const res = await metaTemplatesApi.getStatus(tId);
      setMetaTemplatesStatus(res);
    } catch (err) {
      console.warn('Failed to load Meta templates status for admin:', err);
    } finally {
      setLoadingMetaTemplates(false);
    }
  }

  async function handleSyncMetaTemplates(tenantId: string) {
    setIsSyncingMetaTemplates(true);
    setMetaSyncResult(null);
    try {
      const res = await metaTemplatesApi.syncAndProvision(tenantId);
      setMetaSyncResult(res);
      await loadAdminMetaTemplatesStatus(tenantId);
      if (viewingDbTenant && viewingDbTenant.id === tenantId) {
        admin.getTenantSettings(tenantId).then(setDbTenantSettings).catch(() => {});
      }
      if (editingConfigTenant && editingConfigTenant.id === tenantId) {
        admin.getTenantSettings(tenantId).then(setConfigForm).catch(() => {});
      }
    } catch (err: any) {
      triggerErrorNotice(`Failed to sync Meta templates: ${err?.message || err}`);
    } finally {
      setIsSyncingMetaTemplates(false);
    }
  }

  function getAdminTemplateStatus(tplName?: string, defaultName?: string) {
    if (loadingMetaTemplates) {
      return { status: 'CHECKING', category: 'UTILITY', metaId: null };
    }
    const match = metaTemplatesStatus?.templates?.find(
      (t: any) => (tplName && t.name === tplName) || (defaultName && t.name === defaultName)
    );
    if (match) {
      return {
        status: match.status.toUpperCase(),
        category: match.category || 'UTILITY',
        metaId: match.meta_id,
      };
    }
    if (metaTemplatesStatus?.templates && metaTemplatesStatus.templates.length > 0) {
      return { status: 'MISSING', category: 'UTILITY', metaId: null };
    }
    return { status: 'READY', category: 'UTILITY', metaId: null };
  }

  function renderAdminStatusBadge(tplName?: string, defaultName?: string) {
    const { status, category } = getAdminTemplateStatus(tplName, defaultName);

    let badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
    let icon = null;
    let labelText = status;

    if (status === 'APPROVED') {
      badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      icon = <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />;
      labelText = 'Approved';
    } else if (status === 'PENDING') {
      badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
      icon = <Clock className="w-2.5 h-2.5 text-amber-600 shrink-0" />;
      labelText = 'Pending Meta';
    } else if (status === 'REJECTED') {
      badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
      icon = <AlertCircle className="w-2.5 h-2.5 text-rose-600 shrink-0" />;
      labelText = 'Rejected';
    } else if (status === 'CHECKING') {
      badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
      icon = <Loader2 className="w-2.5 h-2.5 text-blue-600 animate-spin shrink-0" />;
      labelText = 'Checking...';
    } else if (status === 'MISSING') {
      badgeColor = 'bg-slate-100 text-slate-500 border-slate-200';
      labelText = 'Not in Meta';
    } else if (status === 'READY') {
      badgeColor = 'bg-surface-subtle text-text-muted border-border';
      labelText = 'Meta Template';
    }

    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-subtle text-text-muted border border-border">
          {category}
        </span>
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeColor}`}>
          {icon}
          <span>{labelText}</span>
        </span>
      </div>
    );
  }

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
  const [clientPaymentPhone, setClientPaymentPhone] = useState<string>('');
  const [viewingInvoicesTenant, setViewingInvoicesTenant] = useState<ClientTenant | null>(null);
  const [tenantInvoices, setTenantInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Onboard Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState<'quick' | 'advanced'>('quick');
  const [selectedIndustryPreset, setSelectedIndustryPreset] = useState<string>('healthcare');
  const [welcomeMsgCopied, setWelcomeMsgCopied] = useState(false);
  const [createdClient, setCreatedClient] = useState<(ClientCreatedResponse & { password?: string; admin_whatsapp_number?: string }) | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);
  const [actionErrorNotice, setActionErrorNotice] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  function triggerErrorNotice(msg: string) {
    setActionErrorNotice(msg);
    setTimeout(() => setActionErrorNotice(null), 6000);
  }

  // ── Tenant Onboarding Checklist Modal State ──
  const [onboardingModalTenant, setOnboardingModalTenant] = useState<ClientTenant | null>(null);
  const [onboardingStatusData, setOnboardingStatusData] = useState<TenantOnboardingStatus | null>(null);
  const [loadingOnboardingStatus, setLoadingOnboardingStatus] = useState(false);

  async function openTenantOnboardingModal(tenant: ClientTenant) {
    setOnboardingModalTenant(tenant);
    setLoadingOnboardingStatus(true);
    setOnboardingStatusData(null);
    try {
      const data = await crm.getOnboardingStatus(tenant.id);
      setOnboardingStatusData(data);
    } catch (err) {
      console.error('Failed to load onboarding status for tenant:', err);
    } finally {
      setLoadingOnboardingStatus(false);
    }
  }

  // ── Automated Missed Call WhatsApp Outreach Helpers & State ──
  const [missedCallModalTenant, setMissedCallModalTenant] = useState<ClientTenant | null>(null);
  const [webhooksRegistryTab, setWebhooksRegistryTab] = useState<'meta' | 'missed_call'>('missed_call');
  const [missedCallActiveDevice, setMissedCallActiveDevice] = useState<'android' | 'iphone'>('android');
  const [actionMenuTenantId, setActionMenuTenantId] = useState<string | null>(null);

  // Unified Missed Call Operations State
  const [missedCallsList, setMissedCallsList] = useState<Array<{
    id: string;
    tenant_id: string;
    tenant_name: string;
    tenant_slug: string;
    caller_name: string;
    caller_phone: string;
    call_status: string;
    created_at: string;
    last_outbound_msg: string;
  }>>([]);
  const [loadingMissedCalls, setLoadingMissedCalls] = useState(false);
  const [activeTestRowTenantId, setActiveTestRowTenantId] = useState<string | null>(null);
  const [testCallerPhone, setTestCallerPhone] = useState('919876543210');
  const [testingWebhookTenantId, setTestingWebhookTenantId] = useState<string | null>(null);
  const [testWebhookResult, setTestWebhookResult] = useState<{
    success: boolean;
    tenantId: string;
    data?: any;
    error?: string;
  } | null>(null);
  const [editingTemplateByTenant, setEditingTemplateByTenant] = useState<Record<string, string>>({});
  const [savingTemplateTenantId, setSavingTemplateTenantId] = useState<string | null>(null);
  const [templateSaveSuccessId, setTemplateSaveSuccessId] = useState<string | null>(null);

  function getMissedCallUrls(slug: string, customToken?: string) {
    const base = 'https://crm.goboldlabs.com/api/v1/crm/webhooks/missed-call';
    const token = customToken || `${slug}_missed_call`;
    const androidUrl = `${base}?tenant=${slug}&token=${token}&caller=[call_number]`;
    const iphoneUrl = `${base}?tenant=${slug}&token=${token}&sms_text=ShortcutInput`;
    return { base, token, androidUrl, iphoneUrl };
  }

  function getMissedCallClientMessage(tenantName: string, slug: string, customToken?: string) {
    const { androidUrl, iphoneUrl } = getMissedCallUrls(slug, customToken);
    return `Hi from ${tenantName} Team!

Here is your 15-second setup for Automated Missed Call WhatsApp Follow-ups. Whenever someone calls your phone number and you cannot answer, our CRM will automatically send them a WhatsApp message so you never lose a lead or patient!

If you use ANDROID (Instant):
1. Install "MacroDroid" from Google Play Store (Free).
2. Tap "Add Macro" -> Trigger (+): Call/SMS -> Call Missed -> Select "Any Number".
3. Action (+): Connectivity -> Open Website / HTTP GET -> Paste this URL:
${androidUrl}
4. Turn Macro ON. Done!

If you use IPHONE (Built-in Shortcuts):
1. Open the built-in "Shortcuts" app -> Tap "Automation" -> New Automation (+).
2. Select "Message" -> When Message contains: "missed call" -> Select "Run Immediately".
3. Action (+): "Get Contents of URL" -> Paste this URL:
${iphoneUrl}
(Set ShortcutInput to Message).
4. Tap Done!

Any missed call will now automatically get followed up on WhatsApp!`;
  }

  function downloadMacroDroidFile(tenantName: string, slug: string, customToken?: string) {
    const { androidUrl } = getMissedCallUrls(slug, customToken);
    const macroContent = {
      macro: {
        name: `${tenantName} - Missed Call Auto WhatsApp`,
        description: `Automatically triggers instant WhatsApp message to missed callers via ${tenantName} CRM.`,
        enabled: true,
        triggerList: [
          {
            m_SIG: 4,
            m_classType: 'CallMissedTrigger',
            m_callType: 0,
            m_contactName: 'Any Number',
            m_contactSelection: 0
          }
        ],
        actionList: [
          {
            m_SIG: 105,
            m_classType: 'HttpRequestAction',
            m_url: androidUrl,
            m_requestMethod: 0,
            m_contentBody: '',
            m_contentType: 'application/json'
          }
        ],
        constraintList: []
      }
    };
    const blob = new Blob([JSON.stringify(macroContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}_missed_call_setup.macro`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function loadMissedCalls(targetTenantId?: string) {
    setLoadingMissedCalls(true);
    try {
      const data = await admin.getMissedCalls(targetTenantId);
      setMissedCallsList(data || []);
    } catch (err) {
      console.error('Failed to load missed calls:', err);
    } finally {
      setLoadingMissedCalls(false);
    }
  }

  async function handleSaveTenantTemplate(tenantId: string) {
    const tpl = (editingTemplateByTenant[tenantId] || '').trim();
    if (!tpl) return;
    setSavingTemplateTenantId(tenantId);
    try {
      await admin.updateTenantSettings(tenantId, { template_missed_call: tpl });
      setTenants((prev) =>
        prev.map((t) => (t.id === tenantId ? { ...t, template_missed_call: tpl } : t))
      );
      setTemplateSaveSuccessId(tenantId);
      setTimeout(() => setTemplateSaveSuccessId(null), 3000);
    } catch (err: any) {
      alert(`Failed to save template: ${err?.message || 'Unknown error'}`);
    } finally {
      setSavingTemplateTenantId(null);
    }
  }

  async function handleRunTestMissedCall(tenant: ClientTenant) {
    const phone = testCallerPhone.trim();
    if (!phone || phone.length < 10) {
      alert('Please enter a valid 10-digit phone number for testing.');
      return;
    }
    const token = tenant.missed_call_token || tenant.missed_call_webhook_token || `${tenant.slug}_missed_call`;
    setTestingWebhookTenantId(tenant.id);
    setTestWebhookResult(null);
    try {
      const res = await admin.testMissedCallWebhook(tenant.slug, token, phone);
      setTestWebhookResult({
        success: true,
        tenantId: tenant.id,
        data: res,
      });
      setTenants((prev) =>
        prev.map((t) =>
          t.id === tenant.id
            ? {
                ...t,
                missed_call_count: (t.missed_call_count || 0) + 1,
                last_missed_caller: phone,
                last_missed_at: new Date().toISOString(),
              }
            : t
        )
      );
      loadMissedCalls();
    } catch (err: any) {
      setTestWebhookResult({
        success: false,
        tenantId: tenant.id,
        error: err?.message || 'Webhook invocation failed',
      });
    } finally {
      setTestingWebhookTenantId(null);
    }
  }

  // Password reset modal state
  const [resetTenantId, setResetTenantId] = useState<string | null>(null);
  const [resetTenantName, setResetTenantName] = useState<string>('');
  const [resetTenantEmail, setResetTenantEmail] = useState<string>('');
  const [resetTenantDomain, setResetTenantDomain] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [showResetPasswordText, setShowResetPasswordText] = useState(true);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  // Form state for Onboarding
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const ONBOARDING_INDUSTRY_PRESETS = [
    {
      id: 'healthcare',
      label: 'Healthcare / Clinic',
      icon: Stethoscope,
      assistant_name: 'Dr. Assistant',
      bot_goal: 'Schedule patient consultations, provide clinic hours, and answer treatment inquiries.',
      taxonomy_role: 'Doctor',
    },
    {
      id: 'real_estate',
      label: 'Real Estate / Property',
      icon: Building2,
      assistant_name: 'Property Advisor',
      bot_goal: 'Qualify buyer leads, schedule site visits, and share brochure links.',
      taxonomy_role: 'Agent',
    },
    {
      id: 'services',
      label: 'Consulting & Services',
      icon: Briefcase,
      assistant_name: 'Client Coordinator',
      bot_goal: 'Qualify service inquiries, schedule strategy calls, and share pricing quotes.',
      taxonomy_role: 'Consultant',
    },
    {
      id: 'general',
      label: 'General Business / Retail',
      icon: ShoppingBag,
      assistant_name: 'Customer Support',
      bot_goal: 'Answer product inquiries, handle order tracking, and assist store visitors.',
      taxonomy_role: 'Specialist',
    },
  ];

  const initialFormData = {
    name: '',
    slug: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    plan: 'full_suite',
    monthly_price: 2630,
    billing_cycle_day: 1,
    sales_channel: 'direct',
    partner_name: '',
    partner_share_pct: 50,
    owner_share_pct: 50,
    custom_domain: '',
    brand_name: '',
    razorpay_subscription_id: 'plan_TeIaa7OueqVKIK',
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
    opencode_base_url: 'https://opencode.ai/zen/v1',
    assistant_name: '',
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
    template_admin_appointment_reminder: 'admin_appointment_reminder',
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

    auth.me()
      .then((user) => {
        if (user.role !== 'super_admin') {
          router.replace('/dashboard');
          return;
        }
        setAuthChecking(false);
        const saved = localStorage.getItem('boldlabs_super_admin_phone');
        if (saved) setSuperAdminPhone(saved);
        loadData();
      })
      .catch((err) => {
        console.warn('Super admin session verification failed:', err);
        router.replace('/bhuvanesh');
      });
  }, []);

  useEffect(() => {
    if (activeTab === 'missed_call') {
      loadMissedCalls();
    }
  }, [activeTab]);

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
      const [tenantsData, statsData, templatesData] = await Promise.allSettled([
        admin.listTenants(),
        admin.getStats(),
        admin.getPartnerTemplates(),
      ]);

      if (tenantsData.status === 'fulfilled') {
        setTenants(tenantsData.value);
      } else {
        throw tenantsData.reason;
      }

      if (statsData.status === 'fulfilled') {
        setStats(statsData.value);
      }

      if (templatesData.status === 'fulfilled') {
        setPartnerTemplates(templatesData.value);
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
      admin.getStats().then(setStats).catch((statErr) => console.warn('Failed to refresh stats:', statErr));
    } catch (err) {
      console.error('Failed to toggle status:', err);
      triggerErrorNotice(err instanceof Error ? err.message : 'Failed to update tenant status');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');
    try {
      const isPartner = formData.sales_channel === 'partner';
      const finalPartnerName = isPartner
        ? (isAddingNewPartner ? newPartnerNameInput.trim() : formData.partner_name.trim())
        : '';

      if (isPartner && !finalPartnerName) {
        throw new Error('Please specify or select a Partner Agency Name.');
      }

      let finalSlug = formData.slug.trim();
      if (!finalSlug) {
        finalSlug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      let finalEmail = formData.admin_email.trim();
      if (!finalEmail) {
        finalEmail = `admin@${finalSlug}.com`;
      }
      let finalPassword = formData.admin_password.trim();
      if (!finalPassword) {
        finalPassword = 'BoldAuto2026!';
      }

      const preset = ONBOARDING_INDUSTRY_PRESETS.find((p) => p.id === selectedIndustryPreset) || ONBOARDING_INDUSTRY_PRESETS[0];

      const clientPayload = {
        ...formData,
        slug: finalSlug,
        admin_email: finalEmail,
        admin_password: finalPassword,
        assistant_name: formData.assistant_name || preset.assistant_name,
        bot_goal: formData.bot_goal || preset.bot_goal,
        monthly_price: createMode === 'quick' ? 2630 : Number(formData.monthly_price),
        plan: createMode === 'quick' ? 'full_suite' : formData.plan,
        razorpay_subscription_id: formData.razorpay_subscription_id || 'plan_TeIaa7OueqVKIK',
        sales_channel: isPartner ? 'partner' : 'direct',
        partner_name: finalPartnerName,
        partner_share_pct: isPartner ? Number(formData.partner_share_pct) : 0,
        owner_share_pct: isPartner ? Number(formData.owner_share_pct) : 100,
      };

      const res = await admin.createTenant(clientPayload);
      // Also update billing settings
      await admin.updateTenantBilling(res.id, {
        plan: clientPayload.plan,
        monthly_price: Number(clientPayload.monthly_price),
        billing_cycle_day: Number(clientPayload.billing_cycle_day),
        razorpay_subscription_id: clientPayload.razorpay_subscription_id,
        next_renewal_date: `Day ${clientPayload.billing_cycle_day} of every month`,
        sales_channel: clientPayload.sales_channel,
        partner_name: finalPartnerName,
        partner_share_pct: clientPayload.partner_share_pct,
        owner_share_pct: clientPayload.owner_share_pct,
      });

      // If partnered, automatically apply white-label branding from the matching partner agency template
      if (isPartner && finalPartnerName) {
        const matchingTpl = partnerTemplates.find(
          (t) => t.partner_name.toLowerCase() === finalPartnerName.toLowerCase()
        ) || partnerTemplates.find((t) => t.is_default) || null;

        const brandingUpdates: Record<string, any> = {
          custom_domain: (formData.custom_domain || matchingTpl?.custom_domain || '').trim().toLowerCase(),
          brand_name: (formData.brand_name || matchingTpl?.brand_name || formData.name || '').trim(),
        };
        if (matchingTpl?.brand_logo_url) brandingUpdates.brand_logo_url = matchingTpl.brand_logo_url;
        if (matchingTpl?.brand_favicon_url) brandingUpdates.brand_favicon_url = matchingTpl.brand_favicon_url;
        if (matchingTpl?.brand_primary_color) brandingUpdates.brand_primary_color = matchingTpl.brand_primary_color;
        if (matchingTpl?.brand_support_email) brandingUpdates.brand_support_email = matchingTpl.brand_support_email;
        if (matchingTpl?.brand_support_phone) brandingUpdates.brand_support_phone = matchingTpl.brand_support_phone;
        if (typeof matchingTpl?.hide_platform_branding === 'boolean') {
          brandingUpdates.hide_platform_branding = matchingTpl.hide_platform_branding;
        }

        await admin.updateTenantSettings(res.id, brandingUpdates).catch((err) =>
          console.warn('Failed to apply partner template branding:', err)
        );
      } else if (formData.custom_domain || formData.brand_name) {
        await admin.updateTenantSettings(res.id, {
          custom_domain: (formData.custom_domain || '').trim().toLowerCase(),
          brand_name: (formData.brand_name || formData.name || '').trim(),
        }).catch((domainErr) => console.warn('Failed to set initial branding:', domainErr));
      }

      setCreatedClient({
        ...res,
        password: clientPayload.admin_password,
        admin_whatsapp_number: clientPayload.admin_whatsapp_number,
      });
      setActionSuccessNotice(`Organization "${res.name}" provisioned successfully!`);
      setTimeout(() => setActionSuccessNotice(null), 4000);
      setShowCreateModal(false);
      setFormData(initialFormData);
      setIsAddingNewPartner(false);
      setNewPartnerNameInput('');
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
    loadAdminMetaTemplatesStatus(tenant.id);
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
  async function handleOpenConfig(tenant: ClientTenant, initialTab: 'ai' | 'whatsapp' | 'templates' | 'location' | 'calendar' | 'whitelabel' | 'billing' | 'team' = 'ai') {
    setEditingConfigTenant(tenant);
    setConfigTab(initialTab);
    setConfigLoading(true);
    setConfigError('');
    setConfigSavedNotice(false);
    loadAdminMetaTemplatesStatus(tenant.id);
    if (initialTab === 'team') {
      loadTenantStaff(tenant.id);
    }
    try {
      const data = await admin.getTenantSettings(tenant.id);
      setConfigForm(data);
    } catch (err: unknown) {
      setConfigError(err instanceof Error ? err.message : 'Failed to load organization settings.');
    } finally {
      setConfigLoading(false);
    }
  }

  useEffect(() => {
    if (configTab === 'templates' && editingConfigTenant?.id) {
      loadAdminMetaTemplatesStatus(editingConfigTenant.id);
    }
    if (configTab === 'team' && editingConfigTenant?.id) {
      loadTenantStaff(editingConfigTenant.id);
    }
  }, [configTab, editingConfigTenant?.id]);

  useEffect(() => {
    if (dbViewSubtab === 'templates' && viewingDbTenant?.id) {
      loadAdminMetaTemplatesStatus(viewingDbTenant.id);
    }
  }, [dbViewSubtab, viewingDbTenant?.id]);

  const handleAdminInitGoogleOAuth = async () => {
    if (!editingConfigTenant) return;
    const cId = configForm.google_client_id?.trim() || '';
    const cSec = configForm.google_client_secret?.trim() || '';
    setOauthConnecting(true);
    setConfigError('');
    try {
      // Auto-save form first if custom keys were typed
      if (cId || cSec) {
        await admin.updateTenantSettings(editingConfigTenant.id, configForm);
      }
      const res = await admin.initGoogleOAuth(editingConfigTenant.id, {
        client_id: cId,
        client_secret: cSec,
      });
      if (res.auth_url) {
        window.open(res.auth_url, '_blank', 'width=600,height=700');
        setActionSuccessNotice('Google OAuth authorization window opened. Complete consent to connect calendar.');
        setTimeout(() => setActionSuccessNotice(null), 5000);
      }
    } catch (err: any) {
      setConfigError(err?.message || 'Failed to initialize Google OAuth');
    } finally {
      setOauthConnecting(false);
    }
  };

  const handleAdminDisconnectGoogle = async () => {
    if (!editingConfigTenant) return;
    if (!confirm(`Are you sure you want to disconnect Google Calendar synchronization for "${editingConfigTenant.name}"?`)) return;
    setOauthDisconnecting(true);
    try {
      await admin.disconnectGoogleCalendar(editingConfigTenant.id);
      setConfigForm(prev => ({ ...prev, google_calendar_configured: false }));
      setActionSuccessNotice(`Google Calendar disconnected for "${editingConfigTenant.name}".`);
      setTimeout(() => setActionSuccessNotice(null), 3000);
      loadData();
    } catch (err: any) {
      setConfigError(err?.message || 'Failed to disconnect Google Calendar');
    } finally {
      setOauthDisconnecting(false);
    }
  };

  const handleCopyGoogleCalendarLink = async () => {
    if (!editingConfigTenant) return;
    try {
      const res = await admin.getGoogleShareableLink(editingConfigTenant.id);
      if (res.auth_url) {
        navigator.clipboard.writeText(res.auth_url);
        alert('Copied 1-Click Google Calendar Link to clipboard!\n\nSend this link to your client via WhatsApp or Email. When they sign into their Google account, their calendar will automatically connect and sync with your CRM!');
      }
    } catch (err: any) {
      alert(`Failed to generate Google Calendar link: ${err?.message || err}`);
    }
  };

  const handleTestLiveCalendar = async (tenantId: string) => {
    if (!tenantId) return;
    setTesterLoading(true);
    setTesterError('');
    setTesterAvailability(null);
    try {
      const res = await crm.getLiveCalendarAvailability(tenantId);
      setTesterAvailability(res);
    } catch (err: any) {
      setTesterError(err?.message || 'Failed to query live Google Calendar.');
    } finally {
      setTesterLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('gcal_success') === 'true') {
        setActionSuccessNotice('Google Calendar authorization successful! Workspace calendar is connected.');
        setTimeout(() => setActionSuccessNotice(null), 5000);
        loadData();
      } else if (sp.get('gcal_error')) {
        setActionSuccessNotice(`Google OAuth error: ${sp.get('gcal_error')}`);
        setTimeout(() => setActionSuccessNotice(null), 7000);
      }
    }
  }, []);



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
      triggerErrorNotice(err instanceof Error ? err.message : 'Failed to save billing.');
    } finally {
      setSavingBilling(false);
    }
  }

  async function handleActivateBilling(tenant: ClientTenant, force: boolean = false, customPhone?: string) {
    setActivatingBillingId(tenant.id);
    try {
      const phoneToUse = customPhone !== undefined ? customPhone : (clientPaymentPhone || tenant.admin_whatsapp_number || '');
      const res = await admin.activateBilling(tenant.id, force, phoneToUse);
      const updatedTenant: ClientTenant = {
        ...tenant,
        org_lifecycle_stage: res.org_lifecycle_stage,
        subscription_status: res.subscription_status,
        razorpay_subscription_id: res.subscription_id,
        razorpay_short_url: res.short_url,
        admin_whatsapp_number: phoneToUse || tenant.admin_whatsapp_number,
      };
      setTenants((prev) =>
        prev.map((t) => (t.id === tenant.id ? updatedTenant : t))
      );
      setActivePaymentModalTenant(updatedTenant);
      setClientPaymentPhone(phoneToUse || updatedTenant.admin_whatsapp_number || '');
      setActionSuccessNotice(`Billing link updated for ${tenant.name}! Live checkout is ready.`);
      setTimeout(() => setActionSuccessNotice(null), 5000);
    } catch (err: any) {
      triggerErrorNotice(`Failed to activate billing: ${err?.message || err}`);
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
      triggerErrorNotice(`Sync failed: ${err?.message || err}`);
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
      triggerErrorNotice(`Failed to load invoices: ${err?.message || err}`);
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
      triggerErrorNotice(err instanceof Error ? err.message : 'Failed to delete organization.');
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
      triggerErrorNotice(err instanceof Error ? err.message : 'Failed to dispatch alert to Super Admin.');
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
    } catch (err: unknown) {
      setResetError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setResettingPassword(false);
    }
  }

  function handleImpersonateTenant(tenant: { id: string; slug: string; custom_domain?: string; partner_name?: string }) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : '';
    localStorage.setItem('tenant_id', tenant.id);
    localStorage.setItem('tenant_slug', tenant.slug);

    const matchingTpl = partnerTemplates.find(
      (tpl) => tpl.partner_name?.toLowerCase() === tenant.partner_name?.toLowerCase()
    );
    let domain = ((tenant as any).custom_domain || matchingTpl?.custom_domain || '').trim().toLowerCase();
    domain = domain.replace(/^https?:\/\//, '').replace(/\/+$/, '');

    if (domain && typeof window !== 'undefined' && domain !== window.location.hostname) {
      window.open(`https://${domain}/${tenant.slug}?token=${encodeURIComponent(token)}&tenant_id=${encodeURIComponent(tenant.id)}&tenant_slug=${encodeURIComponent(tenant.slug)}`, '_blank');
      return;
    }
    router.push(`/${tenant.slug}`);
  }

  function copyToClipboard(text: string, fieldName: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  }

  // Computed Organization Segments & Multi-Partner Aggregations
  const directTenants = tenants.filter((t) => t.sales_channel !== 'partner');
  const partnerTenants = tenants.filter((t) => t.sales_channel === 'partner');

  const existingPartners = Array.from(
    new Set([
      ...partnerTenants
        .map((t) => t.partner_name?.trim())
        .filter((name): name is string => Boolean(name)),
      ...partnerTemplates
        .map((t) => t.partner_name?.trim())
        .filter((name): name is string => Boolean(name)),
    ])
  ).sort();

  const defaultPartnerTemplate =
    partnerTemplates.find((t) => t.is_default) ||
    partnerTemplates[0] ||
    null;

  const directMRR = directTenants.reduce((acc, t) => {
    if (t.status !== 'active') return acc;
    if (t.monthly_price) return acc + t.monthly_price;
    const plan = (t.plan || 'pro').toLowerCase();
    if (plan === 'starter') return acc + 999;
    if (plan === 'enterprise') return acc + 9999;
    return acc + 3499;
  }, 0);

  const partnerGrossMRR = partnerTenants.reduce((acc, t) => {
    if (t.status !== 'active') return acc;
    const price = t.monthly_price || ((t.plan || 'pro').toLowerCase() === 'starter' ? 999 : (t.plan || 'pro').toLowerCase() === 'enterprise' ? 9999 : 3499);
    return acc + price;
  }, 0);

  const partnerCommissionMRR = partnerTenants.reduce((acc, t) => {
    if (t.status !== 'active') return acc;
    const price = t.monthly_price || ((t.plan || 'pro').toLowerCase() === 'starter' ? 999 : (t.plan || 'pro').toLowerCase() === 'enterprise' ? 9999 : 3499);
    const splitPct = t.partner_share_pct ?? 50;
    return acc + (price * (splitPct / 100));
  }, 0);

  const yourPartnerNetMRR = partnerGrossMRR - partnerCommissionMRR;
  const totalNetRetainedMRR = directMRR + yourPartnerNetMRR;

  function handleOpenCreateModal(overrideChannel?: 'direct' | 'partner') {
    const channel = overrideChannel || (activeOrgTab === 'partnered' ? 'partner' : 'direct');
    let defaultPartner = '';
    let defaultSplitPartner = 50;
    let defaultSplitOwner = 50;
    let defaultCustomDomain = '';
    let defaultBrandName = '';

    if (channel === 'partner') {
      if (selectedPartnerFilter && selectedPartnerFilter !== 'all') {
        defaultPartner = selectedPartnerFilter;
      } else if (defaultPartnerTemplate) {
        defaultPartner = defaultPartnerTemplate.partner_name;
      } else if (existingPartners.length > 0) {
        defaultPartner = existingPartners[0];
      }

      // Lookup matching template
      const matchingTpl =
        partnerTemplates.find((t) => t.partner_name.toLowerCase() === defaultPartner.toLowerCase()) ||
        defaultPartnerTemplate;

      if (matchingTpl) {
        defaultPartner = matchingTpl.partner_name;
        defaultSplitPartner = matchingTpl.partner_share_pct ?? 50;
        defaultSplitOwner = matchingTpl.owner_share_pct ?? 50;
        defaultCustomDomain = matchingTpl.custom_domain || '';
        defaultBrandName = matchingTpl.brand_name || matchingTpl.partner_name || '';
      }
    }

    setFormData({
      ...initialFormData,
      sales_channel: channel,
      partner_name: defaultPartner,
      partner_share_pct: channel === 'partner' ? defaultSplitPartner : 0,
      owner_share_pct: channel === 'partner' ? defaultSplitOwner : 100,
      custom_domain: channel === 'partner' ? defaultCustomDomain : '',
      brand_name: channel === 'partner' ? defaultBrandName : '',
    });
    setIsAddingNewPartner(channel === 'partner' && !defaultPartner && existingPartners.length === 0);
    setNewPartnerNameInput('');
    setFormError('');
    setShowCreateModal(true);
  }

  function handleOpenPartnerTemplateModal(templateToEdit?: PartnerAgencyTemplate) {
    if (templateToEdit) {
      setPartnerTemplateForm({ ...templateToEdit });
    } else {
      const defaultTpl = partnerTemplates.find((t) => t.is_default) || partnerTemplates[0];
      if (defaultTpl) {
        setPartnerTemplateForm({ ...defaultTpl });
      } else {
        setPartnerTemplateForm({
          partner_name: '',
          partner_share_pct: 50,
          owner_share_pct: 50,
          custom_domain: '',
          brand_name: '',
          brand_logo_url: '',
          brand_favicon_url: '',
          brand_primary_color: '#7C3AED',
          brand_support_email: '',
          brand_support_phone: '',
          hide_platform_branding: true,
          is_default: true,
        });
      }
    }
    setShowPartnerTemplateModal(true);
  }

  async function handleSavePartnerTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!partnerTemplateForm.partner_name?.trim()) {
      triggerErrorNotice('Partner Agency Name is required.');
      return;
    }
    setSavingPartnerTemplate(true);
    try {
      const payload: PartnerAgencyTemplate = {
        ...partnerTemplateForm,
        partner_name: partnerTemplateForm.partner_name.trim(),
        custom_domain: (partnerTemplateForm.custom_domain || '').trim().toLowerCase(),
        brand_name: (partnerTemplateForm.brand_name || partnerTemplateForm.partner_name).trim(),
      };
      await admin.savePartnerTemplate(payload);
      const updated = await admin.getPartnerTemplates();
      setPartnerTemplates(updated);
      setActionSuccessNotice(`Partner template "${payload.partner_name}" saved successfully!`);
      setTimeout(() => setActionSuccessNotice(null), 4000);
      setShowPartnerTemplateModal(false);
    } catch (err: unknown) {
      console.error('Failed to save partner template:', err);
      triggerErrorNotice(err instanceof Error ? err.message : 'Failed to save partner template.');
    } finally {
      setSavingPartnerTemplate(false);
    }
  }

  async function handleDeletePartnerTemplate(partnerName: string) {
    if (!confirm(`Are you sure you want to delete the template for "${partnerName}"?`)) return;
    try {
      await admin.deletePartnerTemplate(partnerName);
      const updated = await admin.getPartnerTemplates();
      setPartnerTemplates(updated);
      setActionSuccessNotice(`Template "${partnerName}" deleted.`);
      setTimeout(() => setActionSuccessNotice(null), 3000);
    } catch (err: unknown) {
      console.error('Failed to delete template:', err);
      triggerErrorNotice(err instanceof Error ? err.message : 'Failed to delete template.');
    }
  }

  const filteredTenants = tenants.filter((t) => {
    // 1. Tab segment filter
    if (activeOrgTab === 'direct' && t.sales_channel === 'partner') {
      return false;
    }
    if (activeOrgTab === 'partnered') {
      if (t.sales_channel !== 'partner') return false;
      if (selectedPartnerFilter !== 'all' && t.partner_name?.trim() !== selectedPartnerFilter) {
        return false;
      }
    }

    // 2. Status filter
    if (statusFilter === 'active' && t.status !== 'active') return false;
    if (statusFilter === 'paused' && t.status === 'active') return false;

    // 3. Search query
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    return (
      t.name.toLowerCase().includes(query) ||
      t.slug.toLowerCase().includes(query) ||
      (t.admin_email && t.admin_email.toLowerCase().includes(query)) ||
      (t.partner_name && t.partner_name.toLowerCase().includes(query)) ||
      (t.custom_domain && t.custom_domain.toLowerCase().includes(query)) ||
      (t.razorpay_subscription_id && t.razorpay_subscription_id.toLowerCase().includes(query))
    );
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
    <div className="flex h-[100dvh] min-h-[100dvh] bg-canvas text-text-primary font-sans antialiased overflow-hidden safari-scroll">
      
      {/* ── 1. SUPER ADMIN SIDEBAR (DESKTOP) ───────────────────────────────── */}
      <aside className="hidden md:flex w-60 bg-surface text-text-secondary flex-col shrink-0 select-none border-r border-border">
        
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
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto safari-scroll">
          <div className="px-2 py-1 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Platform
          </div>

          {[
            { id: 'organizations', label: 'Organizations & Config', icon: Building2 },
            { id: 'razorpay', label: 'Billing & Renewals', icon: CreditCard },
            { id: 'admin_config', label: 'Admin Notifications', icon: Bell },
            { id: 'missed_call', label: 'Missed Call Setup', icon: PhoneCall },
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

        {/* Footer: Quick switch back to CRM Dashboard */}
        <div className="p-3 border-t border-border space-y-1.5 safe-area-pb">
          <button
            onClick={() => router.push('/boldlabs')}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent rounded-sm text-xs font-semibold transition-colors duration-150 cursor-pointer border border-accent/20"
            title="Open Boldlabs Workspace"
          >
            <MessageSquare className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Open Boldlabs CRM</span>
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

      {/* ── MOBILE SLIDE-OUT DRAWER (< md) ─────────────────────────────────── */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" 
            onClick={() => setMobileNavOpen(false)} 
          />
          
          {/* Drawer Panel */}
          <div className="relative w-4/5 max-w-xs bg-surface text-text-secondary flex flex-col z-10 border-r border-border shadow-2xl safe-area-pt safe-area-pb animate-in slide-in-from-left duration-200">
            {/* Brand & Close */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-border">
              <div className="flex items-center gap-2.5">
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
              <button
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 text-text-muted hover:text-text-primary rounded-sm transition-colors"
                title="Close Navigation"
              >
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto safari-scroll">
              <div className="px-2 py-1 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                Platform Navigation
              </div>

              {[
                { id: 'organizations', label: 'Organizations & Config', icon: Building2 },
                { id: 'razorpay', label: 'Billing & Renewals', icon: CreditCard },
                { id: 'admin_config', label: 'Admin Notifications', icon: Bell },
                { id: 'missed_call', label: 'Missed Call Setup', icon: PhoneCall },
              ].map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-xs transition-colors duration-150 cursor-pointer text-left ${
                      active
                        ? 'bg-surface-subtle text-text-primary font-semibold border border-border-strong'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle font-medium border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 stroke-[1.5] ${active ? 'text-accent' : 'text-text-muted'}`} />
                    <span className="flex-1">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Footer in Drawer */}
            <div className="p-3 border-t border-border space-y-2">
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  router.push('/boldlabs');
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-sm text-xs font-semibold transition-colors duration-150 cursor-pointer border border-accent/20"
              >
                <MessageSquare className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Open Boldlabs CRM</span>
              </button>
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  router.push('/dashboard');
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface-subtle text-text-muted hover:text-text-primary rounded-sm text-xs font-medium transition-colors duration-150 cursor-pointer border border-border"
              >
                <ArrowLeft className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Return to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. MAIN SUPER ADMIN WORKSPACE ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-canvas">
        
        {/* Top Header */}
        <header className="h-14 border-b border-border bg-surface px-3 sm:px-6 flex items-center justify-between shrink-0 safe-area-pt">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            {/* Hamburger button on mobile */}
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-subtle border border-border rounded-sm transition-colors cursor-pointer shrink-0"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-4 h-4 stroke-[1.5]" />
            </button>
            <div className="min-w-0">
              <h2 className="font-semibold text-xs text-text-primary flex items-center gap-1.5 truncate">
                <span className="truncate">
                  {activeTab === 'organizations' && 'Organizations'}
                  {activeTab === 'razorpay' && 'Billing & Renewals'}
                  {activeTab === 'admin_config' && 'Admin Alerts'}
                  {activeTab === 'missed_call' && 'Missed Call Setup'}
                </span>
                <span className="hidden sm:inline-block text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-medium shrink-0">
                  v2.4
                </span>
              </h2>
              <p className="hidden lg:block text-xs text-text-muted truncate">
                {activeTab === 'organizations' && 'Manage client workspaces, inspect live database records, configure AI brains, WhatsApp APIs, templates & billing'}
                {activeTab === 'razorpay' && 'Inspect client recurring billing statuses, renewal schedules, and WhatsApp alert digests'}
                {activeTab === 'admin_config' && 'Set your phone number for receiving automated system alerts and renewal reminders'}
                {activeTab === 'missed_call' && 'Configure missed call → WhatsApp auto-reply webhook for each client tenant — one view, all clients'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Super Admin Phone Pill */}
            <button
              onClick={() => setActiveTab('admin_config')}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-surface-subtle hover:bg-surface border border-border rounded-sm text-xs text-text-body transition-colors duration-150 cursor-pointer"
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
              onClick={() => handleOpenCreateModal()}
              className={`px-2.5 sm:px-3 py-1.5 text-white text-xs font-semibold rounded-sm transition-colors duration-150 flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap ${
                activeOrgTab === 'direct'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : activeOrgTab === 'partnered'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-accent hover:bg-accent-hover'
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>
                {activeOrgTab === 'direct' ? 'Onboard Direct' : activeOrgTab === 'partnered' ? 'Onboard Partner' : 'Onboard'}
              </span>
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

        {actionErrorNotice && (
          <div className="bg-status-error-bg border-b border-status-error-border px-6 py-2 text-xs text-status-error flex items-center justify-between font-medium shrink-0 animate-in fade-in duration-200">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>{actionErrorNotice}</span>
            </span>
            <button onClick={() => setActionErrorNotice(null)} className="hover:opacity-75 cursor-pointer">
              <X className="w-3 h-3 stroke-[1.5]" />
            </button>
          </div>
        )}

        {/* Scrollable Body */}
        <main className="flex-1 overflow-y-auto safari-scroll touch-scroll p-3.5 sm:p-6 space-y-4 sm:space-y-6 pb-24 md:pb-6">
          
          {/* ── 4 KPI Metrics Row ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            
            {/* 1. Total Organizations */}
            <div className="bg-surface border border-border rounded-md p-3 sm:p-4 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-medium text-text-muted">
                  Organizations
                </span>
                <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-text-muted stroke-[1.5]" />
              </div>
              <div className="mt-1.5 sm:mt-2">
                <div className="flex items-baseline gap-1.5 sm:gap-2">
                  <span className="text-xl sm:text-2xl font-semibold text-text-primary font-mono tabular-nums">
                    {tenants.length}
                  </span>
                  <span className="text-[11px] sm:text-xs font-medium text-status-success">
                    {tenants.filter((t) => t.status === 'active').length} Active
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-text-muted mt-0.5">
                  {directTenants.length} Direct &bull; {partnerTenants.length} Partner
                </p>
              </div>
            </div>

            {/* 2. Platform MRR */}
            <div className="bg-surface border border-border rounded-md p-3 sm:p-4 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-medium text-text-muted">
                  Platform MRR
                </span>
                <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-text-muted stroke-[1.5]" />
              </div>
              <div className="mt-1.5 sm:mt-2">
                <div className="flex items-baseline gap-1 sm:gap-1.5">
                  <span className="text-xl sm:text-2xl font-semibold text-text-primary font-mono tabular-nums">
                    ₹{totalCalculatedMRR.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] sm:text-xs text-text-muted">/ mo</span>
                </div>
                <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  ₹{totalNetRetainedMRR.toLocaleString('en-IN')} net retained
                </p>
              </div>
            </div>

            {/* 3. Razorpay Due Date Tracker */}
            <div className="bg-surface border border-border rounded-md p-3 sm:p-4 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-medium text-text-muted">
                  Admin Alerts
                </span>
                <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-text-muted stroke-[1.5]" />
              </div>
              <div className="mt-1.5 sm:mt-2">
                <div className="flex items-baseline gap-1.5 sm:gap-2">
                  <span className="text-xl sm:text-2xl font-semibold text-text-primary">
                    {superAdminPhone ? 'Active' : 'Setup'}
                  </span>
                  <span className="text-[11px] sm:text-xs font-medium text-status-success">Live</span>
                </div>
                <p className="text-[10px] sm:text-xs text-text-muted mt-0.5 truncate">
                  {superAdminPhone ? `+${superAdminPhone}` : 'Configure'}
                </p>
              </div>
            </div>

            {/* 4. Platform Traffic */}
            <div className="bg-surface border border-border rounded-md p-3 sm:p-4 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-medium text-text-muted">
                  Traffic
                </span>
                <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-text-muted stroke-[1.5]" />
              </div>
              <div className="mt-1.5 sm:mt-2">
                <div className="flex items-baseline gap-1 sm:gap-1.5">
                  <span className="text-xl sm:text-2xl font-semibold text-text-primary font-mono tabular-nums">
                    {stats?.total_messages || 0}
                  </span>
                  <span className="text-[10px] sm:text-xs text-text-muted">msgs</span>
                </div>
                <p className="text-[10px] sm:text-xs text-text-muted mt-0.5">
                  All active tenants
                </p>
              </div>
            </div>

          </div>

          {/* ── TAB 4: MISSED CALL → WHATSAPP SETUP — ALL TENANTS ──────────────── */}
          {activeTab === 'missed_call' && (
            <div className="space-y-4">
              {/* ── METRICS SUMMARY CARDS ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-surface border border-border p-3.5 rounded-md shadow-2xs">
                  <div className="flex items-center justify-between text-text-muted mb-1.5">
                    <span className="text-[11px] font-medium uppercase tracking-wider">Total Clients</span>
                    <Building2 className="w-4 h-4 text-text-muted stroke-[1.5]" />
                  </div>
                  <div className="text-xl font-bold text-text-primary">{tenants.length}</div>
                  <p className="text-[10px] text-text-muted mt-0.5">Isolated multi-tenant workspaces</p>
                </div>

                <div className="bg-surface border border-border p-3.5 rounded-md shadow-2xs">
                  <div className="flex items-center justify-between text-text-muted mb-1.5">
                    <span className="text-[11px] font-medium uppercase tracking-wider">WhatsApp Ready</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[1.5]" />
                  </div>
                  <div className="text-xl font-bold text-emerald-600">
                    {tenants.filter((t) => t.whatsapp_configured).length}
                    <span className="text-xs font-normal text-text-muted"> / {tenants.length}</span>
                  </div>
                  <p className="text-[10px] text-text-muted mt-0.5">Ready for auto WhatsApp dispatch</p>
                </div>

                <div className="bg-surface border border-border p-3.5 rounded-md shadow-2xs">
                  <div className="flex items-center justify-between text-text-muted mb-1.5">
                    <span className="text-[11px] font-medium uppercase tracking-wider">Missed Calls Ingested</span>
                    <PhoneMissed className="w-4 h-4 text-amber-600 stroke-[1.5]" />
                  </div>
                  <div className="text-xl font-bold text-amber-600">
                    {tenants.reduce((sum, t) => sum + (t.missed_call_count || 0), 0)}
                  </div>
                  <p className="text-[10px] text-text-muted mt-0.5">Captured across all clients</p>
                </div>

                <div className="bg-surface border border-border p-3.5 rounded-md shadow-2xs">
                  <div className="flex items-center justify-between text-text-muted mb-1.5">
                    <span className="text-[11px] font-medium uppercase tracking-wider">Security Engine</span>
                    <ShieldCheck className="w-4 h-4 text-blue-600 stroke-[1.5]" />
                  </div>
                  <div className="text-sm font-bold text-text-primary mt-1">SHA-256 HMAC</div>
                  <p className="text-[10px] text-text-muted mt-0.5">Per-tenant cryptographic tokens</p>
                </div>
              </div>

              {/* ── HOW IT WORKS BANNER ── */}
              <div className="bg-surface border border-border rounded-md p-4 bg-gradient-to-r from-amber-500/5 via-surface to-surface">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Zap className="w-4 h-4 stroke-[2]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-text-primary">
                        Automated Missed Call Follow-Up — Zero Setup for Receptionists
                      </h4>
                      <p className="text-[11px] text-text-muted mt-0.5 max-w-3xl">
                        When a patient or client misses a call on the client&apos;s phone, MacroDroid triggers the webhook below.
                        Our CRM instantly creates a customer inquiry, records a note, sends a staff push alert, and fires an approved Meta WhatsApp template to the caller.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => loadMissedCalls()}
                      disabled={loadingMissedCalls}
                      className="px-2.5 py-1.5 bg-surface-subtle hover:bg-surface border border-border rounded text-xs text-text-body font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingMissedCalls ? 'animate-spin' : ''}`} />
                      <span>Refresh Activity</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── ALL CLIENTS CONFIGURATION TABLE (ONE-TAB VIEW) ── */}
              <div className="bg-surface border border-border rounded-md overflow-hidden shadow-xs">
                <div className="border-b border-border px-4 py-3 bg-surface-subtle/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-amber-600 stroke-[1.5]" />
                    <h3 className="font-semibold text-xs text-text-primary">All Clients Configuration & Webhook Endpoints</h3>
                  </div>
                  <span className="text-[10px] text-text-muted">Click Test to simulate live missed call for any client</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-surface-subtle border-b border-border">
                      <tr>
                        <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Client Organization</th>
                        <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">WhatsApp Status</th>
                        <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Webhook URL</th>
                        <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Security Token</th>
                        <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Meta Template Name</th>
                        <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Captured Calls</th>
                        <th className="text-right py-2.5 px-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {tenants.map((t) => {
                        const effectiveToken = t.missed_call_token || t.missed_call_webhook_token || `${t.slug}_missed_call`;
                        const webhookUrl = `https://crm.goboldlabs.com/api/v1/crm/webhooks/missed-call?tenant=${t.slug}&token=${effectiveToken}&caller=[call_number]`;
                        const currentTpl = editingTemplateByTenant[t.id] !== undefined
                          ? editingTemplateByTenant[t.id]
                          : (t.template_missed_call || 'missed_call_followup');
                        const isTesting = activeTestRowTenantId === t.id;
                        const isSavingTpl = savingTemplateTenantId === t.id;
                        const isSavedTpl = templateSaveSuccessId === t.id;

                        return (
                          <React.Fragment key={t.id}>
                            <tr className={`transition-colors ${isTesting ? 'bg-amber-500/5' : 'hover:bg-surface-subtle/50'}`}>
                              {/* 1. Client Name + Slug */}
                              <td className="py-3 px-3 min-w-[140px]">
                                <div className="font-semibold text-text-primary">{t.name}</div>
                                <div className="text-[10px] text-text-muted font-mono mt-0.5">{t.slug}</div>
                              </td>

                              {/* 2. WhatsApp Status */}
                              <td className="py-3 px-3 min-w-[120px]">
                                {t.whatsapp_configured ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Active
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenConfig(t, 'whatsapp')}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer"
                                    title="Click to configure WhatsApp credentials for this client"
                                  >
                                    <AlertCircle className="w-3 h-3" />
                                    Needs Setup
                                  </button>
                                )}
                              </td>

                              {/* 3. Webhook URL with Copy */}
                              <td className="py-3 px-3 max-w-xs">
                                <div className="flex items-center gap-1.5">
                                  <code className="text-[10px] font-mono text-text-secondary truncate max-w-[180px] sm:max-w-[220px] block" title={webhookUrl}>
                                    {webhookUrl}
                                  </code>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(webhookUrl, `mc-url-${t.id}`)}
                                    className="p-1 rounded hover:bg-surface-subtle shrink-0 transition-colors cursor-pointer"
                                    title="Copy Webhook URL"
                                  >
                                    {copiedField === `mc-url-${t.id}` ? (
                                      <Check className="w-3 h-3 text-green-600" />
                                    ) : (
                                      <Copy className="w-3 h-3 text-text-muted hover:text-text-primary" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              {/* 4. Security Token */}
                              <td className="py-3 px-3 min-w-[130px]">
                                <div className="flex items-center gap-1.5">
                                  <code className="text-[10px] font-mono font-medium text-text-primary bg-surface-subtle px-1.5 py-0.5 rounded border border-border">
                                    {effectiveToken}
                                  </code>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(effectiveToken, `mc-tok-${t.id}`)}
                                    className="p-1 rounded hover:bg-surface-subtle shrink-0 transition-colors cursor-pointer"
                                    title="Copy Token"
                                  >
                                    {copiedField === `mc-tok-${t.id}` ? (
                                      <Check className="w-3 h-3 text-green-600" />
                                    ) : (
                                      <Copy className="w-3 h-3 text-text-muted hover:text-text-primary" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              {/* 5. Meta Template Name (INLINE EDITABLE!) */}
                              <td className="py-3 px-3 min-w-[190px]">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={currentTpl}
                                    onChange={(e) =>
                                      setEditingTemplateByTenant((prev) => ({
                                        ...prev,
                                        [t.id]: e.target.value,
                                      }))
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveTenantTemplate(t.id);
                                    }}
                                    className="w-36 text-[10px] font-mono px-2 py-1 bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-amber-500"
                                    placeholder="template_name"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveTenantTemplate(t.id)}
                                    disabled={isSavingTpl}
                                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer shrink-0 ${
                                      isSavedTpl
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-surface-subtle hover:bg-surface border border-border text-text-primary'
                                    }`}
                                    title="Save template name for this tenant"
                                  >
                                    {isSavingTpl ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : isSavedTpl ? (
                                      'Saved'
                                    ) : (
                                      'Save'
                                    )}
                                  </button>
                                </div>
                              </td>

                              {/* 6. Captured Calls Stats */}
                              <td className="py-3 px-3 min-w-[100px]">
                                <div className="font-semibold text-text-primary">
                                  {t.missed_call_count || 0} <span className="text-[10px] text-text-muted font-normal">captured</span>
                                </div>
                                {t.last_missed_caller && (
                                  <div className="text-[10px] text-text-muted font-mono truncate max-w-[110px]" title={`Last caller: ${t.last_missed_caller}`}>
                                    {t.last_missed_caller}
                                  </div>
                                )}
                              </td>

                              {/* 7. Action Buttons */}
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Test simulator button */}
                                  <button
                                    type="button"
                                    onClick={() => setActiveTestRowTenantId(isTesting ? null : t.id)}
                                    className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                                      isTesting
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border border-amber-500/20'
                                    }`}
                                    title="Test missed call webhook for this client live"
                                  >
                                    <Zap className="w-3 h-3" />
                                    <span>{isTesting ? 'Close Test' : 'Test'}</span>
                                  </button>

                                  {/* MacroDroid file download */}
                                  <button
                                    type="button"
                                    onClick={() => downloadMacroDroidFile(t.name, t.slug, effectiveToken)}
                                    className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-subtle rounded transition-colors cursor-pointer"
                                    title="Download pre-configured MacroDroid .macro file"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Copy client setup message */}
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(getMissedCallClientMessage(t.name, t.slug, effectiveToken), `mc-msg-${t.id}`)}
                                    className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-subtle rounded transition-colors cursor-pointer"
                                    title="Copy client setup instructions for WhatsApp"
                                  >
                                    {copiedField === `mc-msg-${t.id}` ? (
                                      <Check className="w-3.5 h-3.5 text-green-600" />
                                    ) : (
                                      <Share2 className="w-3.5 h-3.5" />
                                    )}
                                  </button>

                                  {/* Open full tenant config */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenConfig(t, 'whatsapp')}
                                    className="px-2 py-1 bg-surface-subtle hover:bg-surface text-text-secondary hover:text-text-primary border border-border text-[10px] font-medium rounded transition-colors cursor-pointer"
                                    title="Open full tenant configuration"
                                  >
                                    Full Config
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* ── EXPANDABLE INLINE TEST SIMULATOR PANEL ── */}
                            {isTesting && (
                              <tr className="bg-amber-500/5 border-b-2 border-amber-500/30">
                                <td colSpan={7} className="p-4">
                                  <div className="bg-surface border border-amber-300 dark:border-amber-800/50 rounded-md p-3.5 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-amber-600" />
                                        <h4 className="font-semibold text-xs text-text-primary">
                                          Live Missed Call Simulator for <span className="text-amber-600">{t.name}</span>
                                        </h4>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setActiveTestRowTenantId(null)}
                                        className="text-text-muted hover:text-text-primary text-xs"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                      {/* Phone input */}
                                      <div className="md:col-span-2 space-y-1">
                                        <label className="text-[10px] font-semibold text-text-muted uppercase">
                                          Simulated Caller Phone Number
                                        </label>
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="text"
                                            value={testCallerPhone}
                                            onChange={(e) => setTestCallerPhone(e.target.value)}
                                            placeholder="919876543210"
                                            className="flex-1 text-xs font-mono px-3 py-1.5 bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-amber-500"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => handleRunTestMissedCall(t)}
                                            disabled={testingWebhookTenantId === t.id}
                                            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                                          >
                                            {testingWebhookTenantId === t.id ? (
                                              <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                <span>Triggering...</span>
                                              </>
                                            ) : (
                                              <>
                                                <Send className="w-3.5 h-3.5" />
                                                <span>Trigger Live Webhook</span>
                                              </>
                                            )}
                                          </button>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-text-muted mt-1">
                                          <span>Quick fill:</span>
                                          {superAdminPhone && (
                                            <button
                                              type="button"
                                              onClick={() => setTestCallerPhone(superAdminPhone)}
                                              className="underline hover:text-amber-600 cursor-pointer font-mono"
                                            >
                                              My Phone ({superAdminPhone})
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => setTestCallerPhone('919876543210')}
                                            className="underline hover:text-amber-600 cursor-pointer font-mono"
                                          >
                                            Demo 919876543210
                                          </button>
                                        </div>
                                      </div>

                                      {/* Info card */}
                                      <div className="bg-surface-subtle p-2.5 rounded border border-border text-[11px] text-text-muted space-y-1">
                                        <div><strong>Tenant:</strong> <code className="font-mono text-text-primary">{t.slug}</code></div>
                                        <div><strong>Security:</strong> <code className="font-mono text-text-primary">{effectiveToken}</code></div>
                                        <div><strong>Template:</strong> <code className="font-mono text-text-primary">{currentTpl}</code></div>
                                      </div>
                                    </div>

                                    {/* Test Result Display */}
                                    {testWebhookResult && testWebhookResult.tenantId === t.id && (
                                      <div
                                        className={`p-3 rounded border text-xs space-y-1.5 ${
                                          testWebhookResult.success
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                                            : 'bg-red-500/10 border-red-500/20 text-red-800 dark:text-red-300'
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5 font-semibold">
                                          {testWebhookResult.success ? (
                                            <>
                                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                              <span>HTTP 200 OK — Missed Call Webhook Successfully Processed!</span>
                                            </>
                                          ) : (
                                            <>
                                              <AlertCircle className="w-4 h-4 text-red-600" />
                                              <span>Webhook Trigger Failed: {testWebhookResult.error}</span>
                                            </>
                                          )}
                                        </div>

                                        {testWebhookResult.success && testWebhookResult.data && (
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] pt-1">
                                            <div>
                                              <span className="text-text-muted block">Caller Phone:</span>
                                              <code className="font-mono font-medium text-text-primary">{testWebhookResult.data.caller_phone}</code>
                                            </div>
                                            <div>
                                              <span className="text-text-muted block">CRM Customer:</span>
                                              <span className="font-medium text-text-primary">{testWebhookResult.data.patient_name || 'Inquiry'}</span>
                                            </div>
                                            <div>
                                              <span className="text-text-muted block">WhatsApp Dispatch:</span>
                                              <span className={`font-semibold ${testWebhookResult.data.whatsapp_sent ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                {testWebhookResult.data.whatsapp_sent ? 'Message Sent' : 'Credential Inactive'}
                                              </span>
                                            </div>
                                            <div>
                                              <span className="text-text-muted block">Template Used:</span>
                                              <code className="font-mono text-text-primary">{testWebhookResult.data.template_used || 'None'}</code>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 border-t border-border bg-surface-subtle/20 text-[11px] text-text-muted flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <strong>Pro Tip:</strong> Tokens shown are verified SHA-256 HMAC keys. You can edit any client&apos;s Meta template name right in the table and click <strong>Save</strong>.
                  </div>
                  <div className="text-[10px] text-text-muted">
                    MacroDroid trigger: <strong>HTTP GET / POST</strong> to webhook endpoint.
                  </div>
                </div>
              </div>

              {/* ── LIVE CAPTURED MISSED CALLS ACTIVITY FEED ── */}
              <div className="bg-surface border border-border rounded-md overflow-hidden shadow-xs">
                <div className="border-b border-border px-4 py-3 bg-surface-subtle/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PhoneMissed className="w-4 h-4 text-amber-600 stroke-[1.5]" />
                    <h3 className="font-semibold text-xs text-text-primary">Live Captured Missed Calls Feed</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted">{missedCallsList.length} recent events</span>
                    <button
                      type="button"
                      onClick={() => loadMissedCalls()}
                      disabled={loadingMissedCalls}
                      className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-subtle rounded transition-colors cursor-pointer"
                      title="Reload recent missed calls"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingMissedCalls ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {loadingMissedCalls ? (
                  <div className="p-8 text-center text-xs text-text-muted flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                    <span>Loading recent missed call events...</span>
                  </div>
                ) : missedCallsList.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <PhoneMissed className="w-8 h-8 text-amber-500/40 mx-auto stroke-[1.5]" />
                    <p className="text-xs font-medium text-text-secondary">No missed call events captured yet</p>
                    <p className="text-[11px] text-text-muted max-w-md mx-auto">
                      Click <strong>Test</strong> on any client row above to simulate a live missed call webhook, or install MacroDroid on a phone to start capturing real missed calls.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-surface-subtle border-b border-border">
                        <tr>
                          <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Time</th>
                          <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Client Tenant</th>
                          <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Caller Details</th>
                          <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Status</th>
                          <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Outbound WhatsApp Message</th>
                          <th className="text-right py-2.5 px-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Workspace</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {missedCallsList.map((call) => (
                          <tr key={call.id} className="hover:bg-surface-subtle/50 transition-colors">
                            <td className="py-2.5 px-3 text-text-muted text-[11px] whitespace-nowrap">
                              {call.created_at ? new Date(call.created_at).toLocaleString() : 'Just now'}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-text-primary">{call.tenant_name}</span>
                              <span className="text-[10px] text-text-muted font-mono block">{call.tenant_slug}</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-mono font-medium text-text-primary">{call.caller_phone}</div>
                              <div className="text-[10px] text-text-muted">{call.caller_name || 'Caller'}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                <PhoneMissed className="w-2.5 h-2.5" />
                                {call.call_status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 max-w-sm">
                              {call.last_outbound_msg ? (
                                <p className="text-[11px] text-text-secondary truncate font-mono" title={call.last_outbound_msg}>
                                  {call.last_outbound_msg}
                                </p>
                              ) : (
                                <span className="text-[10px] text-text-muted italic">Inquiry logged in CRM</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => router.push(`/${call.tenant_slug}`)}
                                className="px-2 py-1 bg-surface-subtle hover:bg-surface border border-border rounded text-[10px] font-medium text-text-primary transition-colors cursor-pointer inline-flex items-center gap-1"
                              >
                                <span>Open CRM</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 1: CLIENT ORGANIZATIONS DIRECTORY & CONFIGURATION ─────────── */}
          {activeTab === 'organizations' && (
            <div className="bg-surface border border-border rounded-md overflow-hidden shadow-xs">
              
              {/* ── SEGMENTED TOP TAB SWITCHER (Direct vs Partnered) ── */}
              <div className="border-b border-border bg-surface px-3 sm:px-4 py-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 bg-surface-subtle/30">
                <div className="flex items-center gap-1.5 overflow-x-auto safari-scroll py-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveOrgTab('all');
                      setSelectedPartnerFilter('all');
                    }}
                    className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      activeOrgTab === 'all'
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                        : 'bg-surface hover:bg-surface-subtle text-text-secondary border border-border'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span>All Organizations</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                      activeOrgTab === 'all' ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900' : 'bg-surface-subtle border border-border text-text-muted'
                    }`}>
                      {tenants.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveOrgTab('direct');
                      setSelectedPartnerFilter('all');
                    }}
                    className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      activeOrgTab === 'direct'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-surface hover:bg-surface-subtle text-text-secondary border border-border'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span>My Direct Clients</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                      activeOrgTab === 'direct' ? 'bg-white/20 text-white' : 'bg-surface-subtle border border-border text-text-muted'
                    }`}>
                      {directTenants.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveOrgTab('partnered');
                      setSelectedPartnerFilter('all');
                    }}
                    className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      activeOrgTab === 'partnered'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'bg-surface hover:bg-surface-subtle text-text-secondary border border-border'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span>Partnered / White-Label</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                      activeOrgTab === 'partnered' ? 'bg-white/20 text-white' : 'bg-surface-subtle border border-border text-text-muted'
                    }`}>
                      {partnerTenants.length}
                    </span>
                  </button>
                </div>

                {/* Tab-Aware Fast Action CTA */}
                <div className="flex items-center gap-2 shrink-0">
                  {activeOrgTab === 'direct' && (
                    <button
                      type="button"
                      onClick={() => handleOpenCreateModal('direct')}
                      className="w-full md:w-auto px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-sm transition-colors duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>+ Onboard Direct Client</span>
                    </button>
                  )}

                  {activeOrgTab === 'partnered' && (
                    <button
                      type="button"
                      onClick={() => handleOpenCreateModal('partner')}
                      className="w-full md:w-auto px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-sm transition-colors duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>+ Onboard Partner Client</span>
                    </button>
                  )}

                  {activeOrgTab === 'all' && (
                    <button
                      type="button"
                      onClick={() => handleOpenCreateModal()}
                      className="w-full md:w-auto px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-sm transition-colors duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>+ Onboard Organization</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ── PARTNER MULTI-AGENCY SUB-BAR & FINANCIAL RIBBON (When activeOrgTab === 'partnered') ── */}
              {activeOrgTab === 'partnered' && (
                <div className="bg-purple-500/5 border-b border-border px-3 sm:px-4 py-2.5 space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
                    {/* Agency Selector Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
                        <Users className="w-3 h-3 text-purple-500" />
                        <span>Agencies:</span>
                      </span>
                      
                      <button
                        type="button"
                        onClick={() => setSelectedPartnerFilter('all')}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer border ${
                          selectedPartnerFilter === 'all'
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-surface hover:bg-surface-subtle text-text-secondary border-border'
                        }`}
                      >
                        All ({partnerTenants.length})
                      </button>

                      {existingPartners.map((pName) => {
                        const count = partnerTenants.filter(t => t.partner_name?.trim() === pName).length;
                        const isSel = selectedPartnerFilter === pName;
                        return (
                          <button
                            key={pName}
                            type="button"
                            onClick={() => setSelectedPartnerFilter(pName)}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer border flex items-center gap-1 ${
                              isSel
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-surface hover:bg-surface-subtle text-text-secondary border-border'
                            }`}
                          >
                            <span>{pName}</span>
                            <span className={`text-[10px] font-mono px-1 rounded ${
                              isSel ? 'bg-white/20 text-white' : 'bg-surface-subtle text-text-muted'
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => {
                          handleOpenCreateModal('partner');
                          setIsAddingNewPartner(true);
                        }}
                        className="px-2 py-0.5 rounded text-[11px] font-medium text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-colors cursor-pointer flex items-center gap-1"
                        title="Add a new Partner Agency"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>+ Add Partner Agency</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenPartnerTemplateModal()}
                        className="px-2.5 py-0.5 rounded text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40 hover:bg-purple-200 dark:hover:bg-purple-900/60 border border-purple-300 dark:border-purple-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        title="Configure reusable white-label preset template (domain, branding, revenue split)"
                      >
                        <SlidersHorizontal className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        <span>Partner Preset Template</span>
                        {partnerTemplates.length > 0 && (
                          <span className="bg-purple-600 text-white text-[9px] px-1 rounded-full font-mono">
                            {partnerTemplates.length}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Partner Revenue Split Strip */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono bg-surface border border-border px-2.5 py-1 rounded-sm shadow-2xs">
                      <span className="text-text-muted">
                        Gross: <strong className="text-text-primary font-semibold">₹{partnerGrossMRR.toLocaleString('en-IN')}</strong>
                      </span>
                      <span className="text-border">&bull;</span>
                      <span className="text-purple-600 dark:text-purple-400">
                        Payouts: <strong className="font-semibold">₹{partnerCommissionMRR.toLocaleString('en-IN')}</strong>
                      </span>
                      <span className="text-border">&bull;</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Your Net: <strong>₹{yourPartnerNetMRR.toLocaleString('en-IN')}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Active Partner White-Label Preset Ribbon */}
                  {defaultPartnerTemplate ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-2.5 py-1.5 bg-white dark:bg-surface rounded border border-purple-500/20 text-xs shadow-2xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-purple-700 dark:text-purple-400 font-semibold text-[11px] uppercase tracking-wide">
                          <Sparkles className="w-3 h-3 text-purple-500" />
                          Active Preset:
                        </span>
                        <span className="font-semibold text-text-primary">{defaultPartnerTemplate.partner_name}</span>
                        <span className="text-text-muted">&bull;</span>
                        <span className="font-mono text-[11px] text-purple-700 dark:text-purple-300 flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {defaultPartnerTemplate.custom_domain || 'No custom domain'}
                        </span>
                        <span className="text-text-muted">&bull;</span>
                        <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                          {defaultPartnerTemplate.partner_share_pct}% Partner / {defaultPartnerTemplate.owner_share_pct}% Boldlabs
                        </span>
                        {defaultPartnerTemplate.brand_primary_color && (
                          <span className="inline-flex items-center gap-1">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/20"
                              style={{ backgroundColor: defaultPartnerTemplate.brand_primary_color }}
                            />
                            <span className="text-[10px] font-mono text-text-muted">{defaultPartnerTemplate.brand_primary_color}</span>
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenPartnerTemplateModal(defaultPartnerTemplate)}
                        className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer flex items-center gap-0.5 shrink-0"
                      >
                        <span>Edit Preset</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-2.5 py-1.5 bg-white dark:bg-surface rounded border border-purple-500/20 text-xs">
                      <span className="text-text-muted flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        No reusable partner preset configured yet. Set one up to auto-fill branding & domain when onboarding.
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenPartnerTemplateModal()}
                        className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                      >
                        + Create Partner Preset
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── DIRECT CLIENT PORTFOLIO RIBBON (When activeOrgTab === 'direct') ── */}
              {activeOrgTab === 'direct' && (
                <div className="bg-emerald-500/5 border-b border-border px-3 sm:px-4 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-text-primary">Boldlabs Direct Portfolio</span>
                    <span className="text-text-muted">&bull;</span>
                    <span>{directTenants.length} Direct Clients</span>
                    <span className="text-text-muted">&bull;</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">100% Retained Revenue</span>
                  </div>
                  <div className="text-xs font-mono text-emerald-700 dark:text-emerald-300 bg-surface border border-emerald-500/20 px-2.5 py-1 rounded-sm">
                    Direct MRR: <strong>₹{directMRR.toLocaleString('en-IN')}/mo</strong>
                  </div>
                </div>
              )}
              
              {/* Search & Filter Bar */}
              <div className="p-3 sm:p-3.5 border-b border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 bg-surface">
                <div className="relative flex-1 w-full sm:max-w-sm">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted stroke-[1.5]" />
                  <input
                    type="text"
                    placeholder="Search organizations, slug, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 sm:py-1.5 bg-surface-subtle border border-border rounded-sm text-base sm:text-xs text-text-primary placeholder:text-text-muted focus:bg-white focus:border-accent transition-colors duration-150"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
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
                    className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer border flex items-center gap-1.5 ${
                      showWebhooksRegistry
                        ? 'bg-accent text-white border-accent'
                        : 'bg-surface hover:bg-surface-subtle text-text-body border-border'
                    }`}
                    title="Show Meta WhatsApp Webhook Callback URLs and Verify Tokens for all organizations"
                  >
                    <Key className="w-3 h-3 stroke-[1.5]" />
                    <span>{showWebhooksRegistry ? 'Hide Webhooks' : 'Webhooks'}</span>
                  </button>

                  <button
                    onClick={() => handleSendAdminAlert()}
                    disabled={sendingAdminAlert || !superAdminPhone}
                    className="px-2.5 sm:px-3 py-1.5 bg-surface hover:bg-surface-subtle text-text-body text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer border border-border flex items-center gap-1.5 disabled:opacity-50"
                    title="Send consolidated Razorpay renewal digest to Super Admin WhatsApp"
                  >
                    <Send className="w-3 h-3 stroke-[1.5]" />
                    <span>Send digest</span>
                  </button>
                </div>
              </div>

              {/* ── EMBEDDED WEBHOOKS REGISTRY (Meta Inbound + Missed Call Outreach) ── */}
              {showWebhooksRegistry && (
                <div className="p-4 bg-surface-subtle border-b border-border space-y-3 animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                          {webhooksRegistryTab === 'missed_call' ? (
                            <PhoneCall className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[1.5]" />
                          ) : (
                            <Key className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                          )}
                          <span>{webhooksRegistryTab === 'missed_call' ? 'Pre-filled Missed Call WhatsApp Outreach Registry' : 'Meta WhatsApp Inbound Webhook Registry'}</span>
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                          {webhooksRegistryTab === 'missed_call' ? '100% Free Mobile Setup' : 'Inbound Cloud API'}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {webhooksRegistryTab === 'missed_call'
                          ? 'Pre-filled webhook endpoints for each client. Copy or send to client owners to activate 15-second missed call auto-replies on WhatsApp.'
                          : "Copy each client organization's dedicated Webhook Callback URL and Verify Token into the Meta App Developer Portal (WhatsApp → Configuration)."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Sub-tab Pill Switcher */}
                      <div className="inline-flex items-center p-0.5 bg-surface border border-border rounded-sm">
                        <button
                          type="button"
                          onClick={() => setWebhooksRegistryTab('missed_call')}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-xs transition-colors cursor-pointer flex items-center gap-1 ${
                            webhooksRegistryTab === 'missed_call'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-text-muted hover:text-text-primary'
                          }`}
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>Missed Calls (Pre-filled)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setWebhooksRegistryTab('meta')}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-xs transition-colors cursor-pointer flex items-center gap-1 ${
                            webhooksRegistryTab === 'meta'
                              ? 'bg-accent text-white shadow-xs'
                              : 'text-text-muted hover:text-text-primary'
                          }`}
                        >
                          <Key className="w-3 h-3" />
                          <span>Meta WhatsApp</span>
                        </button>
                      </div>

                      <button
                        onClick={() => setShowWebhooksRegistry(false)}
                        className="p-1 text-text-muted hover:text-text-primary cursor-pointer rounded hover:bg-surface"
                      >
                        <X className="w-3.5 h-3.5 stroke-[1.5]" />
                      </button>
                    </div>
                  </div>

                  {/* TAB 1: MISSED CALL PRE-FILLED REGISTRY */}
                  {webhooksRegistryTab === 'missed_call' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {tenants.map((t) => {
                        const { androidUrl, iphoneUrl } = getMissedCallUrls(t.slug);
                        return (
                          <div key={t.id} className="p-3 bg-surface border border-border rounded-md space-y-2.5 shadow-2xs">
                            <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-semibold text-xs text-text-primary truncate">{t.name}</span>
                                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                  /{t.slug}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => setMissedCallModalTenant(t)}
                                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                                  title="Open full setup guide & modal"
                                >
                                  <PhoneCall className="w-3 h-3" />
                                  <span>Setup Modal</span>
                                </button>
                                <button
                                  onClick={() => {
                                    const msg = getMissedCallClientMessage(t.name, t.slug);
                                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                                  }}
                                  className="p-1 bg-surface-subtle hover:bg-surface text-emerald-600 border border-border rounded text-[11px] transition-colors cursor-pointer"
                                  title="Share to Client on WhatsApp"
                                >
                                  <Share2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Android Option */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-text-muted font-medium flex items-center gap-1">
                                  <Smartphone className="w-3 h-3 text-emerald-600" />
                                  Android (MacroDroid):
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => copyToClipboard(androidUrl, `reg-and-${t.id}`)}
                                    className="px-1.5 py-0.5 bg-surface-subtle hover:bg-surface text-text-body border border-border rounded text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    {copiedField === `reg-and-${t.id}` ? <Check className="w-2.5 h-2.5 text-status-success" /> : <Copy className="w-2.5 h-2.5" />}
                                    <span>Copy URL</span>
                                  </button>
                                  <button
                                    onClick={() => downloadMacroDroidFile(t.name, t.slug)}
                                    className="px-1.5 py-0.5 bg-surface-subtle hover:bg-surface text-text-body border border-border rounded text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                                    title="Download 1-Click .macro file"
                                  >
                                    <Download className="w-2.5 h-2.5" />
                                    <span>.macro</span>
                                  </button>
                                </div>
                              </div>
                              <p className="p-1.5 bg-canvas border border-border rounded font-mono text-[10px] text-text-muted truncate select-all">
                                {androidUrl}
                              </p>
                            </div>

                            {/* iPhone Option */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-text-muted font-medium flex items-center gap-1">
                                  <Smartphone className="w-3 h-3 text-indigo-500" />
                                  iPhone (Shortcuts):
                                </span>
                                <button
                                  onClick={() => copyToClipboard(iphoneUrl, `reg-ios-${t.id}`)}
                                  className="px-1.5 py-0.5 bg-surface-subtle hover:bg-surface text-text-body border border-border rounded text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  {copiedField === `reg-ios-${t.id}` ? <Check className="w-2.5 h-2.5 text-status-success" /> : <Copy className="w-2.5 h-2.5" />}
                                  <span>Copy URL</span>
                                </button>
                              </div>
                              <p className="p-1.5 bg-canvas border border-border rounded font-mono text-[10px] text-text-muted truncate select-all">
                                {iphoneUrl}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* TAB 2: META INBOUND WEBHOOKS REGISTRY */}
                  {webhooksRegistryTab === 'meta' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                      {tenants.map((t) => {
                        const url = `https://crm.goboldlabs.com/webhooks/whatsapp/${t.slug}`;
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
                  )}
                </div>
              )}

              {/* Table */}
              {loading ? (
                <div className="p-12 text-center text-xs text-text-muted">Loading client organizations...</div>
              ) : filteredTenants.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <Building2 className="w-8 h-8 text-text-muted mx-auto stroke-[1.5]" />
                  <p className="text-xs font-medium text-text-primary">
                    {activeOrgTab === 'direct'
                      ? 'No direct client organizations found'
                      : activeOrgTab === 'partnered'
                      ? (selectedPartnerFilter !== 'all' ? `No client organizations found for partner "${selectedPartnerFilter}"` : 'No partnered white-label organizations found')
                      : 'No organizations found'}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    {activeOrgTab === 'direct'
                      ? 'Click "+ Onboard Direct Client" above to provision an organization for Boldlabs.'
                      : activeOrgTab === 'partnered'
                      ? 'Click "+ Onboard Partner Client" above to provision a client under a partner agency.'
                      : 'Adjust search query or onboard a new client organization.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto touch-scroll safari-scroll">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-surface-subtle/60 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                        <th className="py-2.5 px-4">Organization & Integration</th>
                        <th className="py-2.5 px-4 whitespace-nowrap">Plan & Rate</th>
                        <th className="py-2.5 px-4 whitespace-nowrap">Subscription Status</th>
                        <th className="py-2.5 px-4 text-right whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs">
                      {filteredTenants.map((t) => {
                        const planFee = t.monthly_price || ((t.plan || 'pro').toLowerCase() === 'starter' ? 999 : (t.plan || 'pro').toLowerCase() === 'enterprise' ? 9999 : 3499);
                        return (
                          <tr key={t.id} className="hover:bg-surface-subtle/50 transition-colors duration-150">
                            
                            {/* Organization Name & WhatsApp Integration */}
                            <td className="py-2.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                                  {t.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-text-primary text-xs">{t.name}</span>
                                    <span className="text-[10px] font-mono text-text-muted bg-surface-subtle px-1.5 py-0.2 rounded border border-border">
                                      /{t.slug}
                                    </span>
                                    {t.custom_domain && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.2 rounded" title={`White-Label Domain: ${t.custom_domain}`}>
                                        <Globe className="w-2.5 h-2.5" />
                                        {t.custom_domain}
                                      </span>
                                    )}
                                    {t.sales_channel === 'partner' && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.2 rounded" title={`Partner Agency: ${t.partner_name || 'Partner'}`}>
                                        <Users className="w-2.5 h-2.5" />
                                        Partner ({t.partner_share_pct ?? 50}%)
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[11px] text-text-muted mt-0.5">
                                    <span className="truncate max-w-[170px]" title={t.admin_email || ''}>
                                      {t.admin_email || 'No email configured'}
                                    </span>
                                    <span>&bull;</span>
                                    <span className={`inline-flex items-center gap-1 font-medium ${
                                      t.whatsapp_configured ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-muted'
                                    }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${t.whatsapp_configured ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                      {t.whatsapp_configured ? 'WhatsApp Live' : 'No API'}
                                    </span>
                                    <span>&bull;</span>
                                    <span className="font-mono tabular-nums">
                                      {t.contact_count || 0} contacts &bull; {t.conversation_count || 0} chats
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Plan & Rate */}
                            <td className="py-2.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-surface-subtle text-text-secondary border border-border">
                                  {t.plan || 'CUSTOM'}
                                </span>
                                <span className="text-xs font-mono font-semibold tabular-nums text-text-primary">
                                  ₹{planFee.toLocaleString('en-IN')}<span className="text-[10px] font-normal text-text-muted">/mo</span>
                                </span>
                              </div>
                              <div className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5 whitespace-nowrap">
                                <Calendar className="w-2.5 h-2.5 text-text-muted shrink-0" />
                                <span>{t.next_renewal_date || 'Renews 1st of month'}</span>
                              </div>
                            </td>

                            {/* Razorpay Subscription Lifecycle */}
                            <td className="py-2.5 px-4 whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                {t.status !== 'active' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                                    <Pause className="w-2.5 h-2.5 fill-current" />
                                    <span>Workspace Paused</span>
                                  </span>
                                ) : t.subscription_status === 'active' ? (
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                                    t.razorpay_subscription_id
                                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
                                      : 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/25'
                                  }`}>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>{t.razorpay_subscription_id ? 'Active (Paid)' : 'Active (Manual)'}</span>
                                  </span>
                                ) : t.subscription_status === 'payment_failed' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25">
                                    <AlertCircle className="w-3 h-3 text-amber-600" />
                                    <span>Payment Failed</span>
                                  </span>
                                ) : (!t.org_lifecycle_stage || t.org_lifecycle_stage === 'setup') ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/25">
                                    Initial Setup
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-200 text-slate-950 dark:bg-amber-950/80 dark:text-amber-100 border border-amber-400 dark:border-amber-600 shadow-xs" title="Payment link generated — waiting for client payment">
                                    <Clock className="w-3 h-3 text-slate-950 dark:text-amber-300 shrink-0" />
                                    <span>Unpaid • Payment Pending</span>
                                  </span>
                                )}

                                {t.razorpay_subscription_id && (
                                  <button
                                    onClick={() => handleSyncBilling(t)}
                                    disabled={syncingBillingId === t.id}
                                    className="p-1 text-text-muted hover:text-accent rounded hover:bg-surface-subtle transition-colors cursor-pointer"
                                    title="Sync live status from Razorpay"
                                  >
                                    <RefreshCw className={`w-3 h-3 ${syncingBillingId === t.id ? 'animate-spin text-accent' : ''}`} />
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Actions — Clean 3-item layout */}
                            <td className="py-2.5 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center justify-end gap-1.5">

                                {/* Open CRM - PRIMARY ACTION */}
                                <button
                                  onClick={() => handleImpersonateTenant(t)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-xs shrink-0"
                                  title="Access this Tenant's CRM Workspace"
                                >
                                  <ExternalLink className="w-3 h-3 stroke-[1.5]" />
                                  <span>Open CRM</span>
                                </button>

                                {/* Onboarding Checklist Quick Button */}
                                <button
                                  onClick={() => openTenantOnboardingModal(t)}
                                  className="px-2 py-1 bg-surface hover:bg-surface-subtle text-accent border border-border hover:border-accent rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 shadow-xs shrink-0"
                                  title="Inspect 4-Step Onboarding Checklist for this workspace"
                                >
                                  <ListChecks className="w-3.5 h-3.5 text-accent" />
                                  <span>Checklist</span>
                                </button>

                                {/* Configure */}
                                <button
                                  onClick={() => handleOpenConfig(t)}
                                  className="px-2 py-1 bg-surface hover:bg-surface-subtle text-text-primary border border-border hover:border-accent rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 shadow-xs shrink-0"
                                  title="Configure AI Brain, WhatsApp API, Templates, Calendar & Billing"
                                >
                                  <Sliders className="w-3.5 h-3.5 text-text-muted" />
                                  <span>Configure</span>
                                </button>

                                {/* ⋮ More Actions Dropdown */}
                                <div className="relative">
                                  <button
                                    onClick={() => setActionMenuTenantId(actionMenuTenantId === t.id ? null : t.id)}
                                    className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-subtle border border-border rounded transition-colors cursor-pointer"
                                    title="More actions"
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </button>

                                  {actionMenuTenantId === t.id && (
                                    <>
                                      {/* Backdrop to close */}
                                      <div className="fixed inset-0 z-40" onClick={() => setActionMenuTenantId(null)} />

                                      {/* Dropdown */}
                                      <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-surface border border-border rounded-lg shadow-xl py-1 animate-in fade-in slide-in-from-top-1 duration-100">

                                        {/* Sales & Staff */}
                                        <button
                                          onClick={() => { setActionMenuTenantId(null); handleOpenConfig(t, 'team'); }}
                                          className="w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 hover:bg-surface-subtle transition-colors cursor-pointer text-text-body"
                                        >
                                          <Users className="w-3.5 h-3.5 text-amber-600" />
                                          <span>Sales & Staff</span>
                                        </button>

                                        {/* Sync Meta Templates */}
                                        <button
                                          onClick={() => { setActionMenuTenantId(null); handleSyncMetaTemplates(t.id); }}
                                          disabled={isSyncingMetaTemplates}
                                          className="w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 hover:bg-surface-subtle transition-colors cursor-pointer text-text-body disabled:opacity-50"
                                        >
                                          <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncingMetaTemplates ? 'animate-spin' : ''}`} />
                                          <span>Sync Meta Templates</span>
                                        </button>

                                        {/* Pay Link */}
                                        {!t.razorpay_short_url ? (
                                          <button
                                            onClick={() => {
                                              setActionMenuTenantId(null);
                                              setClientPaymentPhone(t.admin_whatsapp_number || '');
                                              handleActivateBilling(t);
                                            }}
                                            disabled={activatingBillingId === t.id}
                                            className="w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 hover:bg-surface-subtle transition-colors cursor-pointer text-text-body disabled:opacity-50"
                                          >
                                            <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                                            <span>Generate Pay Link</span>
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              setActionMenuTenantId(null);
                                              setActivePaymentModalTenant(t);
                                              setClientPaymentPhone(t.admin_whatsapp_number || '');
                                            }}
                                            className="w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 hover:bg-surface-subtle transition-colors cursor-pointer text-text-body"
                                          >
                                            <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                                            <span>View Pay Link</span>
                                          </button>
                                        )}

                                        <div className="my-1 border-t border-border" />

                                        {/* Missed Call Setup */}
                                        <button
                                          onClick={() => { setActionMenuTenantId(null); setMissedCallModalTenant(t); }}
                                          className="w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 hover:bg-surface-subtle transition-colors cursor-pointer text-text-body"
                                        >
                                          <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>Missed Call Setup</span>
                                        </button>

                                        {/* Booking Page */}
                                        <a
                                          href={`/${t.slug}/book`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={() => setActionMenuTenantId(null)}
                                          className="w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 hover:bg-surface-subtle transition-colors cursor-pointer text-text-body"
                                        >
                                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                          <span>Booking Page</span>
                                          <ExternalLink className="w-2.5 h-2.5 text-text-muted ml-auto" />
                                        </a>

                                        {/* Database Inspector */}
                                        <button
                                          onClick={() => { setActionMenuTenantId(null); handleOpenDatabaseView(t); }}
                                          className="w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 hover:bg-surface-subtle transition-colors cursor-pointer text-text-body"
                                        >
                                          <Database className="w-3.5 h-3.5 text-text-muted" />
                                          <span>Database Inspector</span>
                                        </button>

                                        {/* View Invoices */}
                                        {t.razorpay_subscription_id && (
                                          <button
                                            onClick={() => { setActionMenuTenantId(null); handleViewInvoices(t); }}
                                            className="w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 hover:bg-surface-subtle transition-colors cursor-pointer text-text-body"
                                          >
                                            <FileText className="w-3.5 h-3.5 text-text-muted" />
                                            <span>Invoices</span>
                                          </button>
                                        )}

                                        <div className="my-1 border-t border-border" />

                                        {/* Pause / Resume */}
                                        <button
                                          onClick={() => { setActionMenuTenantId(null); handleToggleStatus(t.id, t.status === 'active'); }}
                                          disabled={togglingId === t.id}
                                          className="w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 hover:bg-surface-subtle transition-colors cursor-pointer text-text-body"
                                        >
                                          {t.status === 'active' ? (
                                            <><Pause className="w-3.5 h-3.5 text-amber-500" /><span>Pause Workspace</span></>
                                          ) : (
                                            <><Play className="w-3.5 h-3.5 text-emerald-500 fill-current" /><span>Resume Workspace</span></>
                                          )}
                                        </button>

                                        {/* Password Reset */}
                                        <button
                                          onClick={() => {
                                            setActionMenuTenantId(null);
                                            const matchingTpl = partnerTemplates.find(
                                              (tpl) => tpl.partner_name?.toLowerCase() === t.partner_name?.toLowerCase()
                                            );
                                            const effectiveDomain = (t as any).custom_domain || matchingTpl?.custom_domain || 'crm.goboldlabs.com';
                                            setResetTenantDomain(effectiveDomain);
                                            setResetTenantId(t.id);
                                            setResetTenantName(t.name);
                                            setResetTenantEmail(t.admin_email || `admin@${t.slug}.com`);
                                            setNewPassword('');
                                            setShowResetPasswordText(true);
                                            setResetSuccess(false);
                                            setResetError('');
                                          }}
                                          className="w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 hover:bg-surface-subtle transition-colors cursor-pointer text-text-body"
                                        >
                                          <Lock className="w-3.5 h-3.5 text-text-muted" />
                                          <span>Reset Password</span>
                                        </button>

                                        <div className="my-1 border-t border-border" />

                                        {/* Delete */}
                                        <button
                                          onClick={() => { setActionMenuTenantId(null); setDeleteTenantTarget(t); }}
                                          className="w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 hover:bg-red-500/5 transition-colors cursor-pointer text-red-600"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          <span>Delete Organization</span>
                                        </button>

                                      </div>
                                    </>
                                  )}
                                </div>

                              </div>
                            </td>


                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Responsive Cards (< md) */}
                <div className="md:hidden divide-y divide-border">
                  {filteredTenants.map((t) => {
                    const planFee = t.monthly_price || ((t.plan || 'pro').toLowerCase() === 'starter' ? 999 : (t.plan || 'pro').toLowerCase() === 'enterprise' ? 9999 : 3499);
                    return (
                      <div key={t.id} className="p-3.5 space-y-3 bg-surface">
                        {/* Top Header: Name, Avatar, Slug, Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                              {t.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-text-primary text-xs truncate">{t.name}</span>
                                <span className="text-[10px] font-mono text-text-muted bg-surface-subtle px-1.5 py-0.2 rounded border border-border">
                                  /{t.slug}
                                </span>
                                {t.custom_domain && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.2 rounded" title={`White-Label: ${t.custom_domain}`}>
                                    <Globe className="w-2.5 h-2.5" />
                                    {t.custom_domain}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-text-muted truncate mt-0.5" title={t.admin_email || ''}>
                                {t.admin_email || 'No email configured'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="shrink-0 flex items-center gap-1">
                            {t.status !== 'active' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                                <Pause className="w-2.5 h-2.5 fill-current" />
                                <span>Paused</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>Active</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Details Row: WhatsApp Live, Contacts, Plan & Pricing */}
                        <div className="grid grid-cols-2 gap-2 text-xs bg-surface-subtle/50 p-2.5 rounded-sm border border-border/80">
                          <div>
                            <span className="text-[10px] text-text-muted block">WhatsApp API</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.whatsapp_configured ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                              <span className={`text-[11px] font-medium truncate ${t.whatsapp_configured ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-muted'}`}>
                                {t.whatsapp_configured ? 'Live API' : 'No API'}
                              </span>
                              <span className="text-[10px] text-text-muted font-mono ml-auto">
                                {t.contact_count || 0}c &bull; {t.conversation_count || 0}m
                              </span>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] text-text-muted block">Plan & Price</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] font-mono font-semibold uppercase px-1 py-0.2 rounded bg-surface border border-border text-text-secondary">
                                {t.plan || 'PRO'}
                              </span>
                              <span className="text-[11px] font-mono font-semibold text-text-primary">
                                ₹{planFee.toLocaleString('en-IN')}<span className="text-[9px] font-normal text-text-muted">/m</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Subscription Status Pill */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-text-muted">Billing:</span>
                            {t.subscription_status === 'active' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                                <Check className="w-2.5 h-2.5 text-emerald-600" />
                                <span>{t.razorpay_subscription_id ? 'Paid (Auto)' : 'Active (Manual)'}</span>
                              </span>
                            ) : t.subscription_status === 'payment_failed' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25">
                                <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
                                <span>Payment Failed</span>
                              </span>
                            ) : (!t.org_lifecycle_stage || t.org_lifecycle_stage === 'setup') ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/25">
                                Initial Setup
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-slate-950 dark:bg-amber-950/80 dark:text-amber-100 border border-amber-400 dark:border-amber-600">
                                <Clock className="w-2.5 h-2.5" />
                                <span>Payment Pending</span>
                              </span>
                            )}
                          </div>

                          {t.razorpay_subscription_id && (
                            <button
                              onClick={() => handleSyncBilling(t)}
                              disabled={syncingBillingId === t.id}
                              className="p-1 text-text-muted hover:text-accent rounded hover:bg-surface-subtle transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                              title="Sync live status from Razorpay"
                            >
                              <RefreshCw className={`w-3 h-3 ${syncingBillingId === t.id ? 'animate-spin text-accent' : ''}`} />
                              <span>Sync</span>
                            </button>
                          )}
                        </div>

                        {/* Primary Actions Grid */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => handleImpersonateTenant(t)}
                            className="w-full py-2 px-3 bg-emerald-600 active:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs touch-manipulation"
                          >
                            <ExternalLink className="w-3.5 h-3.5 stroke-[1.5]" />
                            <span>Open CRM</span>
                          </button>

                          <button
                            onClick={() => handleOpenConfig(t)}
                            className="w-full py-2 px-3 bg-surface active:bg-surface-subtle text-text-primary border border-border hover:border-accent rounded text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs touch-manipulation"
                          >
                            <Sliders className="w-3.5 h-3.5 text-text-muted" />
                            <span>Configure</span>
                          </button>
                        </div>

                        {/* Secondary Actions Grid */}
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            onClick={() => handleOpenConfig(t, 'team')}
                            className="py-1.5 px-2 bg-amber-500/10 active:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs touch-manipulation"
                          >
                            <Users className="w-3 h-3 text-amber-700 dark:text-amber-400 stroke-[1.5]" />
                            <span>Staff</span>
                          </button>

                          <button
                            onClick={() => handleSyncMetaTemplates(t.id)}
                            disabled={isSyncingMetaTemplates}
                            className="py-1.5 px-2 bg-emerald-500/10 active:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs disabled:opacity-50 touch-manipulation"
                          >
                            <RefreshCw className={`w-3 h-3 text-emerald-700 dark:text-emerald-400 ${isSyncingMetaTemplates ? 'animate-spin' : ''}`} />
                            <span>Meta</span>
                          </button>

                          {!t.razorpay_short_url ? (
                            <button
                              onClick={() => {
                                setClientPaymentPhone(t.admin_whatsapp_number || '');
                                handleActivateBilling(t);
                              }}
                              disabled={activatingBillingId === t.id}
                              className="py-1.5 px-2 bg-purple-500/10 active:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-500/30 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs disabled:opacity-50 touch-manipulation"
                            >
                              <CreditCard className="w-3 h-3 text-purple-700" />
                              <span>Pay Link</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setActivePaymentModalTenant(t);
                                setClientPaymentPhone(t.admin_whatsapp_number || '');
                              }}
                              className="py-1.5 px-2 bg-purple-500/10 active:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-500/30 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs touch-manipulation"
                            >
                              <CreditCard className="w-3 h-3 text-purple-700" />
                              <span>Pay Link</span>
                            </button>
                          )}
                        </div>

                        {/* Action Icons Row (Booking, DB, Pause, Password, Delete) */}
                        <div className="flex items-center justify-between pt-1 border-t border-border/70 text-text-muted">
                          <div className="flex items-center gap-2">
                            <a
                              href={`/${t.slug}/book`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-text-muted hover:text-indigo-500 border border-border rounded transition-colors"
                              title="Booking Page"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                            </a>

                            <button
                              onClick={() => handleOpenDatabaseView(t)}
                              className="p-1.5 text-text-muted hover:text-accent border border-border rounded transition-colors cursor-pointer"
                              title="Database Record Inspector"
                            >
                              <Database className="w-3.5 h-3.5" />
                            </button>

                            {t.razorpay_subscription_id && (
                              <button
                                onClick={() => handleViewInvoices(t)}
                                className="p-1.5 text-text-muted hover:text-text-primary border border-border rounded transition-colors cursor-pointer"
                                title="View Invoices"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => handleToggleStatus(t.id, t.status === 'active')}
                              disabled={togglingId === t.id}
                              className={`p-1.5 rounded transition-colors cursor-pointer border ${
                                t.status === 'active'
                                  ? 'text-text-muted hover:text-amber-500 border-border'
                                  : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                              }`}
                              title={t.status === 'active' ? 'Pause Organization' : 'Resume Organization'}
                            >
                              {t.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                            </button>

                            <button
                              onClick={() => {
                                const matchingTpl = partnerTemplates.find(
                                  (tpl) => tpl.partner_name?.toLowerCase() === t.partner_name?.toLowerCase()
                                );
                                const effectiveDomain = (t as any).custom_domain || matchingTpl?.custom_domain || 'crm.goboldlabs.com';
                                setResetTenantDomain(effectiveDomain);
                                setResetTenantId(t.id);
                                setResetTenantName(t.name);
                                setResetTenantEmail(t.admin_email || `admin@${t.slug}.com`);
                                setNewPassword('');
                                setShowResetPasswordText(true);
                                setResetSuccess(false);
                                setResetError('');
                              }}
                              className="p-1.5 text-text-muted hover:text-text-primary border border-border rounded transition-colors cursor-pointer"
                              title="Reset Password"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            onClick={() => setDeleteTenantTarget(t)}
                            className="p-1.5 text-text-muted hover:text-red-500 rounded transition-colors cursor-pointer border border-border hover:border-red-500/20"
                            title="Delete Organization"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
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

        {/* ── MOBILE BOTTOM NAVIGATION BAR (< md) ────────────────────────── */}
        <div className="md:hidden border-t border-border bg-surface flex items-center justify-around py-1 px-2 safe-area-pb shrink-0 z-20 shadow-lg">
          {[
            { id: 'organizations', label: 'Orgs', icon: Building2 },
            { id: 'razorpay', label: 'Billing', icon: CreditCard },
            { id: 'admin_config', label: 'Alerts', icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-sm text-[10px] font-medium transition-colors touch-manipulation ${
                  active
                    ? 'text-accent font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Icon className={`w-4 h-4 stroke-[1.5] mb-0.5 ${active ? 'text-accent' : 'text-text-muted'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setMobileNavOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-sm text-[10px] font-medium text-text-muted hover:text-text-primary transition-colors touch-manipulation"
          >
            <Menu className="w-4 h-4 stroke-[1.5] mb-0.5" />
            <span>Menu</span>
          </button>
        </div>

      </div>

            {/* ── MODAL: DATABASE RECORD INSPECTOR (SUPER ADMIN) ───────────────────── */}
      {viewingDbTenant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-surface border border-border rounded-t-xl sm:rounded-lg w-full max-w-5xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl safe-area-pb">
            
            {/* Modal Header */}
            <div className="min-h-[4rem] p-3 sm:px-6 sm:h-16 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 bg-surface">
              <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-sm bg-accent/10 border border-accent/20 text-accent flex items-center justify-center font-bold text-sm shrink-0">
                    <Database className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.5]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-xs sm:text-sm font-semibold text-text-primary truncate">
                        {viewingDbTenant.name}
                      </h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-subtle border border-border text-text-muted">
                        /{viewingDbTenant.slug}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-subtle border border-border text-text-secondary uppercase hidden xs:inline">
                        {viewingDbTenant.plan || 'PRO'}
                      </span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                        viewingDbTenant.status === 'active'
                          ? 'bg-status-success-bg text-status-success'
                          : 'bg-status-error-bg text-status-error'
                      }`}>
                        {viewingDbTenant.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-text-muted mt-0.5 flex items-center gap-1.5">
                      <span>UUID:</span>
                      <span className="font-mono text-text-primary truncate max-w-[140px] sm:max-w-none">{viewingDbTenant.id}</span>
                      <button
                        onClick={() => copyToClipboard(viewingDbTenant.id, 'db-uuid')}
                        className="hover:text-accent cursor-pointer text-text-muted p-1"
                        title="Copy Organization UUID"
                      >
                        {copiedField === 'db-uuid' ? <Check className="w-3 h-3 text-status-success inline" /> : <Copy className="w-3 h-3 inline" />}
                      </button>
                    </p>
                  </div>
                </div>
                {/* Mobile close button */}
                <button
                  onClick={() => setViewingDbTenant(null)}
                  className="sm:hidden p-2 text-text-muted hover:text-text-primary hover:bg-surface-subtle rounded-sm transition-colors cursor-pointer shrink-0 touch-manipulation"
                >
                  <X className="w-5 h-5 stroke-[1.5]" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full sm:w-auto justify-start sm:justify-end">
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
                    className="px-2.5 py-1 text-xs font-medium text-text-primary bg-surface-subtle hover:bg-surface border border-border rounded-sm transition-colors duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 min-h-[36px]"
                    title="Copy full database record as JSON"
                  >
                    {copiedField === 'full-db-json' ? <Check className="w-3.5 h-3.5 text-status-success stroke-[1.5]" /> : <Braces className="w-3.5 h-3.5 text-accent stroke-[1.5]" />}
                    <span>{copiedField === 'full-db-json' ? 'Copied' : 'JSON'}</span>
                  </button>
                )}

                {/* Auto-Provision Meta Templates (Utility) */}
                <button
                  type="button"
                  disabled={isSyncingMetaTemplates}
                  onClick={() => handleSyncMetaTemplates(viewingDbTenant.id)}
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-sm transition-colors duration-150 flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 whitespace-nowrap shrink-0 min-h-[36px]"
                  title="Auto-Provision All 11 Meta Templates as 100% Utility"
                >
                  <Sparkles className={`w-3.5 h-3.5 stroke-[1.5] ${isSyncingMetaTemplates ? 'animate-spin' : ''}`} />
                  <span>{isSyncingMetaTemplates ? 'Syncing...' : 'Meta Sync'}</span>
                </button>

                {/* Edit in Configure Drawer */}
                <button
                  type="button"
                  onClick={() => {
                    const t = viewingDbTenant;
                    setViewingDbTenant(null);
                    handleOpenConfig(t);
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded-sm transition-colors duration-150 flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap shrink-0 min-h-[36px]"
                  title="Open configuration editor for this organization"
                >
                  <Sliders className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span>Configure</span>
                </button>

                <button
                  onClick={() => setViewingDbTenant(null)}
                  className="hidden sm:flex p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-subtle rounded-sm transition-colors duration-150 cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[1.5]" />
                </button>
              </div>
            </div>

            {/* Subtabs Bar */}
            <div className="px-3 sm:px-6 border-b border-border bg-surface-subtle flex items-center justify-between gap-2 overflow-x-auto safari-scroll no-scrollbar shrink-0">
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
                      className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-medium transition-colors duration-150 cursor-pointer whitespace-nowrap touch-manipulation ${
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
                  placeholder="Filter keys..."
                  value={dbSearchQuery}
                  onChange={(e) => setDbSearchQuery(e.target.value)}
                  className="w-28 sm:w-48 pl-7 pr-2.5 py-1 bg-surface border border-border rounded-sm text-xs text-text-primary placeholder:text-text-muted focus:border-accent transition-colors"
                />
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto safari-scroll p-3.5 sm:p-6 space-y-4 bg-canvas">
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
                          <p className="font-mono text-xs font-semibold text-text-primary mt-0.5">{dbTenantSettings.assistant_name || 'Assistant'}</p>
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
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-xs text-text-primary flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                              <span>Meta WhatsApp Template Registry</span>
                            </h4>
                            {metaTemplatesStatus?.summary && (
                              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                  {metaTemplatesStatus.summary.approved} Approved
                                </span>
                                {(metaTemplatesStatus.summary.pending > 0 || metaTemplatesStatus.summary.missing > 0) && (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold inline-flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5 text-amber-600" />
                                    {metaTemplatesStatus.summary.pending + metaTemplatesStatus.summary.missing} Pending
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <p className="text-[11px] text-text-muted">
                            Approved Meta WhatsApp template identifiers registered for automated system dispatch.
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {viewingDbTenant && (
                            <>
                              <button
                                type="button"
                                disabled={loadingMetaTemplates}
                                onClick={() => loadAdminMetaTemplatesStatus(viewingDbTenant.id)}
                                className="px-2.5 py-1 bg-surface hover:bg-surface-subtle text-text-secondary border border-border rounded-sm text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                                title="Refresh live status from Meta"
                              >
                                <RefreshCw className={`w-3 h-3 stroke-[1.5] ${loadingMetaTemplates ? 'animate-spin' : ''}`} />
                                <span>{loadingMetaTemplates ? 'Checking...' : 'Check Status'}</span>
                              </button>
                              <button
                                type="button"
                                disabled={isSyncingMetaTemplates}
                                onClick={() => handleSyncMetaTemplates(viewingDbTenant.id)}
                                className="px-3 py-1 bg-accent hover:bg-accent/90 text-white rounded-sm text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer shrink-0 disabled:opacity-50"
                              >
                                <Sparkles className={`w-3.5 h-3.5 stroke-[1.5] ${isSyncingMetaTemplates ? 'animate-spin' : ''}`} />
                                <span>{isSyncingMetaTemplates ? 'Syncing...' : 'Sync Meta'}</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {metaSyncResult && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-sm text-xs flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="font-semibold">Meta Template Auto-Sync Completed ({metaSyncResult.industry?.toUpperCase()} Industry Preset)</p>
                            <p className="text-emerald-700">
                              <strong>{metaSyncResult.already_present_count}</strong> active in Meta &bull; <strong>{metaSyncResult.created_count}</strong> newly provisioned as UTILITY &bull; <strong>{metaSyncResult.failed_count}</strong> failed.
                            </p>
                            {metaSyncResult.created_count > 0 && (
                              <p className="text-[11px] text-emerald-600 font-mono">
                                Newly Created: {metaSyncResult.created.map(c => c.name).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          { key: 'template_booking_confirmation', label: '1. Customer Booking Confirmation', value: dbTenantSettings.template_booking_confirmation || 'booking_confirmationn', defaultName: 'booking_confirmationn' },
                          { key: 'template_reschedule_confirmation', label: '2. Customer Reschedule Confirmation', value: dbTenantSettings.template_reschedule_confirmation || 'booking_reschedule_confirmation', defaultName: 'booking_reschedule_confirmation' },
                          { key: 'template_cancellation_confirmation', label: '3. Customer Cancellation Notice', value: dbTenantSettings.template_cancellation_confirmation || 'cancellation_confirmation', defaultName: 'cancellation_confirmation' },
                          { key: 'template_appointment_reminder', label: '4. 2-Hour Appointment Reminder', value: dbTenantSettings.template_appointment_reminder || 'appointment_ramainder', defaultName: 'appointment_ramainder' },
                          { key: 'template_review_request', label: '5. Post-Service Review Request', value: dbTenantSettings.template_review_request || 'review_request', defaultName: 'review_request' },
                          { key: 'template_reschedule_nudge', label: '6. Automated Reschedule Follow-up', value: dbTenantSettings.template_reschedule_nudge || 'reschedule_nudge', defaultName: 'reschedule_nudge' },
                          { key: 'template_client_followup', label: '7. 24h Customer Re-engagement Follow-up', value: dbTenantSettings.template_client_followup || 'client_followup_checkin', defaultName: 'client_followup_checkin' },
                          { key: 'template_admin_notification', label: '8. Admin Instant Booking Alert', value: dbTenantSettings.template_admin_notification || 'admin_notification', defaultName: 'admin_notification' },
                          { key: 'template_admin_reschedule_notice', label: '9. Admin Reschedule Notice', value: dbTenantSettings.template_admin_reschedule_notice || 'admin_reschedule_notice', defaultName: 'admin_reschedule_notice' },
                          { key: 'template_admin_cancellation_notice', label: '10. Admin Cancellation Notice', value: dbTenantSettings.template_admin_cancellation_notice || 'admin_cancellation_notice', defaultName: 'admin_cancellation_notice' },
                          { key: 'template_admin_human_request', label: '11. Admin Human Takeover Alert', value: dbTenantSettings.template_admin_human_request || 'admin_human_request', defaultName: 'admin_human_request' },
                          { key: 'template_admin_daily_digest', label: '12. Daily Admin Performance Digest', value: dbTenantSettings.template_admin_daily_digest || 'admin_daily_digest', defaultName: 'admin_daily_digest' },
                          { key: 'template_admin_appointment_reminder', label: '13. Admin Upcoming Appointment Reminder (30m)', value: (dbTenantSettings as any)?.template_admin_appointment_reminder || 'admin_appointment_reminder', defaultName: 'admin_appointment_reminder' },
                        ]
                          .filter(item => !dbSearchQuery || item.label.toLowerCase().includes(dbSearchQuery.toLowerCase()) || String(item.value).toLowerCase().includes(dbSearchQuery.toLowerCase()))
                          .map((item) => (
                            <div key={item.key} className="p-3 bg-surface-subtle border border-border rounded-sm flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <p className="text-[11px] font-medium text-text-muted truncate">{item.label}</p>
                                  {renderAdminStatusBadge(item.value, item.defaultName)}
                                </div>
                                <p className="font-mono text-xs font-semibold text-text-primary truncate">{item.value}</p>
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
            <div className="p-3 sm:px-6 sm:py-3 border-t border-border bg-surface flex items-center justify-between shrink-0 safe-area-pb">
              <span className="text-[11px] text-text-muted truncate max-w-[180px] sm:max-w-none">
                Super Admin &bull; <strong className="text-text-primary">{viewingDbTenant.slug}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingDbTenant(null)}
                  className="px-3 py-1.5 bg-surface hover:bg-surface-subtle text-text-body text-xs font-medium rounded-sm border border-border transition-colors cursor-pointer min-h-[38px] flex items-center touch-manipulation"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const t = viewingDbTenant;
                    setViewingDbTenant(null);
                    handleOpenConfig(t);
                  }}
                  className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors duration-150 flex items-center gap-1.5 cursor-pointer shadow-xs min-h-[38px] touch-manipulation"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-surface border border-border rounded-t-xl sm:rounded-lg w-full max-w-4xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden shadow-2xl safe-area-pb">
            
            {/* Modal Header */}
            <div className="min-h-[3.5rem] p-3 sm:px-6 sm:h-14 border-b border-border flex items-center justify-between shrink-0 bg-surface gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-sm bg-accent/10 border border-accent/20 text-accent flex items-center justify-center font-bold text-xs shrink-0">
                  {editingConfigTenant.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-xs sm:text-sm font-semibold text-text-primary truncate">
                      {editingConfigTenant.name}
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
                  <p className="text-[10px] sm:text-[11px] text-text-muted truncate hidden xs:block">
                    Centralized platform configuration & brain control
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={`/${editingConfigTenant.slug}/book`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 sm:px-2.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:bg-surface-subtle border border-border hover:border-indigo-500/40 rounded-sm transition-colors duration-150 flex items-center gap-1 cursor-pointer min-h-[34px]"
                  title="Open Public Web Booking Page in new tab"
                >
                  <Calendar className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span className="hidden sm:inline">Booking Page</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleImpersonateTenant(editingConfigTenant)}
                  className="px-2 py-1 sm:px-2.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle border border-border rounded-sm transition-colors duration-150 flex items-center gap-1 cursor-pointer min-h-[34px]"
                  title="Open Client CRM in another tab or view"
                >
                  <ExternalLink className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span className="hidden sm:inline">Open CRM</span>
                </button>

                <button
                  onClick={() => setEditingConfigTenant(null)}
                  className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-subtle rounded-sm transition-colors duration-150 cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center touch-manipulation"
                >
                  <X className="w-4 h-4 stroke-[1.5]" />
                </button>
              </div>
            </div>

            {/* Subtabs Bar */}
            <div className="px-3 sm:px-6 border-b border-border bg-surface-subtle flex items-center gap-1 overflow-x-auto safari-scroll no-scrollbar shrink-0">
              {[
                { id: 'ai', label: 'AI Intelligence & BYOK', icon: Bot },
                { id: 'whatsapp', label: 'Meta WhatsApp API', icon: Smartphone },
                { id: 'templates', label: 'Message templates', icon: FileText },
                { id: 'location', label: 'Branding & Localization', icon: Building2 },
                { id: 'calendar', label: 'Google Calendar', icon: CalendarDays },
                { id: 'whitelabel', label: 'White-Label & Domains', icon: Globe },
                { id: 'billing', label: 'Billing & Access', icon: CreditCard },
                { id: 'team', label: 'Team & Permissions', icon: Users },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = configTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setConfigTab(tab.id as any)}
                    className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-medium transition-colors duration-150 cursor-pointer whitespace-nowrap touch-manipulation ${
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
            <div className="flex-1 overflow-y-auto safari-scroll p-3.5 sm:p-6 space-y-4">
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
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-text-muted">Master prompt</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setOptimizerDump('');
                                  setOptimizerPreview(null);
                                  setOptimizerError('');
                                  setShowOptimizerModal(true);
                                }}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-sm bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent text-[11px] font-semibold transition-colors cursor-pointer"
                                title="Dump raw business info and let AI structure it into all prompt fields"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.364.293A1 1 0 0014 17H10a1 1 0 01-.707-.293l-.364-.293z" /></svg>
                                Smart Fill
                              </button>
                            </div>
                          </div>
                          <textarea
                            rows={10}
                            placeholder="Provide everything your AI needs to know:&#10;&#10;1. About Your Business: What you do, who runs it.&#10;2. Services & Pricing: Services offered, exact pricing, consultation fees.&#10;3. Conversational Goal: How to greet, answer queries, handle objections, and guide customers to book.&#10;4. Tone: Friendly, natural, short WhatsApp texting style (1-2 lines)."
                            value={configForm.ai_prompt || ''}
                            onChange={(e) => setConfigForm({ ...configForm, ai_prompt: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent font-sans leading-relaxed resize-y transition-colors duration-150"
                          />
                        </div>

                        {/* ── AI PROMPT OPTIMIZER MODAL ── */}
                        {showOptimizerModal && (
                          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
                            <div className="bg-surface border border-border rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

                              {/* Header */}
                              <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.364.293A1 1 0 0014 17H10a1 1 0 01-.707-.293l-.364-.293z" /></svg>
                                  </div>
                                  <div>
                                    <h3 className="text-sm font-semibold text-text-primary">AI Prompt Optimizer</h3>
                                    <p className="text-[11px] text-text-muted">Dump raw business info. AI structures it into all 7 prompt fields.</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => { setShowOptimizerModal(false); setOptimizerPreview(null); }}
                                  className="p-1.5 hover:bg-surface-subtle rounded-sm text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </div>

                              {/* Body */}
                              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                <div className="p-3 bg-surface-subtle border border-border rounded-sm">
                                  <p className="text-[11px] font-semibold text-text-primary mb-1">Auto-injected by system — do NOT include:</p>
                                  <p className="text-[11px] text-text-muted leading-relaxed">
                                    Date/time, calendar slots, booking tags, customer names/phone, format rules (no emojis, 1-2 lines), anti-hallucination, language mirroring — all handled globally.
                                  </p>
                                  <p className="text-[11px] font-semibold text-accent mt-1.5">
                                    Just dump: clinic name, services + prices, doctor info, rules, tone, discovery flow.
                                  </p>
                                </div>

                                {!optimizerPreview ? (
                                  <div className="space-y-3">
                                    <label className="block text-xs font-semibold text-text-primary">Paste everything about the business:</label>
                                    <textarea
                                      rows={14}
                                      autoFocus
                                      placeholder={"Example:\n\nWe are Dr. Priya's Dermatology Clinic in Coimbatore. Dr. Priya Shankar has 12 years exp in skin & hair.\n\nServices:\n- Acne treatment: Rs 800/session\n- Hair PRP: Rs 2500/session (3-session pack Rs 6500)\n- Laser hair removal: Rs 1200-3500 depending on area\n\nHours: Mon-Sat 10am-7pm.\n\nRules: Only book after asking skin concern. No home visits. Don't quote laser prices upfront.\n\nGoal: Get first consultation booking (free for new patients this month)."}
                                      value={optimizerDump}
                                      onChange={(e) => setOptimizerDump(e.target.value)}
                                      className="w-full px-3.5 py-2.5 bg-canvas border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent font-sans leading-relaxed resize-y transition-colors duration-150"
                                    />
                                    {optimizerError && (
                                      <p className="text-xs text-status-error bg-status-error-bg border border-status-error-border rounded-sm px-3 py-2">{optimizerError}</p>
                                    )}
                                    <button
                                      type="button"
                                      disabled={optimizerLoading || optimizerDump.trim().length < 30}
                                      onClick={async () => {
                                        setOptimizerLoading(true);
                                        setOptimizerError('');
                                        try {
                                          const res = await admin.optimizePrompt(optimizerDump);
                                          if (res?.success && res?.optimized) {
                                            setOptimizerPreview(res.optimized);
                                          } else {
                                            setOptimizerError('Unexpected response. Please try again.');
                                          }
                                        } catch (err: any) {
                                          setOptimizerError(err?.message || 'AI optimization failed. Please try again.');
                                        } finally {
                                          setOptimizerLoading(false);
                                        }
                                      }}
                                      className="w-full py-2.5 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white rounded-sm text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                                    >
                                      {optimizerLoading ? (
                                        <>
                                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                          Optimizing with Gemini...
                                        </>
                                      ) : (
                                        <>
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.364.293A1 1 0 0014 17H10a1 1 0 01-.707-.293l-.364-.293z" /></svg>
                                          Optimize &amp; Structure with AI
                                        </>
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs font-semibold text-status-success">AI structured into 7 fields. Review before applying:</p>
                                      <button
                                        type="button"
                                        onClick={() => setOptimizerPreview(null)}
                                        className="text-[11px] text-text-muted hover:text-accent transition-colors cursor-pointer underline"
                                      >
                                        Edit dump
                                      </button>
                                    </div>
                                    {(
                                      [
                                        { key: 'assistant_name', label: 'Assistant Name' },
                                        { key: 'ai_prompt', label: 'AI Instructions & Knowledge Base' },
                                        { key: 'services_text', label: 'Services & Pricing' },
                                        { key: 'bot_goal', label: 'Bot Goal' },
                                        { key: 'strict_rules', label: 'Strict Rules' },
                                        { key: 'objection_handling', label: 'Objection Handling' },
                                        { key: 'response_style', label: 'Response Style' },
                                      ] as const
                                    ).map(({ key, label }) => {
                                      const val = optimizerPreview[key as keyof typeof optimizerPreview];
                                      if (!val) return null;
                                      return (
                                        <div key={key} className="p-3 bg-surface-subtle border border-border rounded-sm space-y-1.5">
                                          <p className="text-[11px] font-semibold text-text-primary">{label}</p>
                                          <pre className="text-[11px] text-text-body font-sans whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto">{val}</pre>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Footer */}
                              {optimizerPreview && (
                                <div className="px-5 py-3.5 border-t border-border bg-surface flex items-center justify-between shrink-0 gap-3">
                                  <p className="text-[11px] text-text-muted">Overwrites current form values (not saved until you click Save Config).</p>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => { setShowOptimizerModal(false); setOptimizerPreview(null); }}
                                      className="px-3 py-1.5 bg-surface hover:bg-surface-subtle text-text-body text-xs font-medium rounded-sm border border-border transition-colors cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const p = optimizerPreview;
                                        setConfigForm((prev) => ({
                                          ...prev,
                                          ...(p.assistant_name ? { assistant_name: p.assistant_name } : {}),
                                          ...(p.ai_prompt ? { ai_prompt: p.ai_prompt } : {}),
                                          ...(p.services_text ? { services_text: p.services_text } : {}),
                                          ...(p.bot_goal ? { bot_goal: p.bot_goal } : {}),
                                          ...(p.strict_rules ? { strict_rules: p.strict_rules } : {}),
                                          ...(p.objection_handling ? { objection_handling: p.objection_handling } : {}),
                                          ...(p.response_style ? { response_style: p.response_style } : {}),
                                        }));
                                        setShowOptimizerModal(false);
                                        setOptimizerPreview(null);
                                      }}
                                      className="px-4 py-1.5 bg-accent hover:bg-accent/90 text-white text-xs font-semibold rounded-sm transition-colors cursor-pointer flex items-center gap-1.5"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                      Apply to Config
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

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
                          <div className="p-3.5 bg-surface rounded-md border border-border space-y-1.5 md:col-span-2">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-text-secondary stroke-[1.5]" />
                              <label className="block text-xs font-medium text-text-primary">
                                Admin Name (Personal / Doctor Name)
                              </label>
                            </div>
                            <input
                              type="text"
                              placeholder="e.g. Dr. Sameer or Bhuvanesh"
                              value={configForm.admin_name || ''}
                              onChange={(e) => setConfigForm({ ...configForm, admin_name: e.target.value })}
                              className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                            <p className="text-xs text-text-muted">
                              Personal admin name displayed in the top-right header and staff notifications.
                            </p>
                          </div>

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

                          {/* 2-Type Primary Business Model Selector */}
                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1.5">
                              Choose Business Engine (Auto-fills tabs & field terminology)
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* Card 1: Business & Services */}
                              <button
                                type="button"
                                onClick={() => {
                                  const selectedPreset = INDUSTRY_PRESETS.find((p) => p.id === 'business');
                                  setConfigForm({
                                    ...configForm,
                                    industry: 'business',
                                    taxonomy: selectedPreset
                                      ? { ...selectedPreset.taxonomy, requirement_presets: [...(selectedPreset.taxonomy.requirement_presets || [])] }
                                      : configForm.taxonomy,
                                  });
                                }}
                                className={`p-3 rounded-md border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                  (configForm.industry === 'business' || !configForm.industry || configForm.industry === 'custom' || configForm.industry === 'clinic')
                                    ? 'border-accent bg-accent/5 ring-1 ring-accent/30 shadow-2xs'
                                    : 'border-border bg-surface hover:border-text-muted/50 hover:bg-surface-subtle/50'
                                }`}
                              >
                                <div className="flex items-start justify-between w-full">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-sm bg-accent/10 border border-accent/20 flex items-center justify-center">
                                      <Building2 className="w-4 h-4 text-accent stroke-[1.8]" />
                                    </div>
                                    <div>
                                      <h5 className="font-semibold text-xs text-text-primary">Business & Services</h5>
                                      <span className="text-[10px] text-text-muted">Agencies, Consulting, Clinics, Real Estate</span>
                                    </div>
                                  </div>
                                  {(configForm.industry === 'business' || !configForm.industry || configForm.industry === 'custom' || configForm.industry === 'clinic') && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent text-white uppercase tracking-wider">Active</span>
                                  )}
                                </div>
                                <p className="text-[11px] text-text-secondary mt-2">
                                  For appointments, consultations, retainers, meetings, and repeat clients.
                                </p>
                              </button>

                              {/* Card 2: E-Commerce & Retail */}
                              <button
                                type="button"
                                onClick={() => {
                                  const selectedPreset = INDUSTRY_PRESETS.find((p) => p.id === 'ecommerce');
                                  setConfigForm({
                                    ...configForm,
                                    industry: 'ecommerce',
                                    taxonomy: selectedPreset
                                      ? { ...selectedPreset.taxonomy, requirement_presets: [...(selectedPreset.taxonomy.requirement_presets || [])] }
                                      : configForm.taxonomy,
                                  });
                                }}
                                className={`p-3 rounded-md border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                  configForm.industry === 'ecommerce'
                                    ? 'border-accent bg-accent/5 ring-1 ring-accent/30 shadow-2xs'
                                    : 'border-border bg-surface hover:border-text-muted/50 hover:bg-surface-subtle/50'
                                }`}
                              >
                                <div className="flex items-start justify-between w-full">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-sm bg-accent/10 border border-accent/20 flex items-center justify-center">
                                      <ShoppingBag className="w-4 h-4 text-accent stroke-[1.8]" />
                                    </div>
                                    <div>
                                      <h5 className="font-semibold text-xs text-text-primary">E-Commerce & Retail</h5>
                                      <span className="text-[10px] text-text-muted">Products, D2C, Orders, Catalog, Restocks</span>
                                    </div>
                                  </div>
                                  {configForm.industry === 'ecommerce' && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent text-white uppercase tracking-wider">Active</span>
                                  )}
                                </div>
                                <p className="text-[11px] text-text-secondary mt-2">
                                  For product inquiries, orders, deliveries, repeat buyers, and catalog sales.
                                </p>
                              </button>
                            </div>
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
                                  requirement_presets: presets,
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
                              placeholder="https://opencode.ai/zen/v1"
                              value={configForm.opencode_base_url || 'https://opencode.ai/zen/v1'}
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
                    <div className="space-y-4">
                      {/* 1-Click Meta WhatsApp Business Embedded Signup Card */}
                      <div className="bg-surface-subtle border border-border rounded-md p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-md bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 flex items-center justify-center shadow-xs">
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.23.9 2.43 1.03 2.6.13.17 1.77 2.7 4.28 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.12-.22-.19-.47-.31" />
                              </svg>
                            </div>
                            <div>
                              <h5 className="text-sm font-semibold text-text-primary">1-Click Meta WhatsApp Business Integration</h5>
                              <p className="text-xs text-text-muted">Onboard client WhatsApp numbers in seconds — No manual developer app setup needed.</p>
                            </div>
                          </div>
                          {configForm.meta_phone_id ? (
                            <span className="text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-sm flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Authorized & Live</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-sm">
                              Not Connected
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-text-secondary leading-relaxed">
                          Click below to launch official Meta Embedded Signup. The client or admin selects their Meta Business Portfolio, verifies their phone number via SMS, and the system auto-configures tokens, webhooks, and phone registration.
                        </p>

                        {configForm.meta_phone_id && (
                          <div className="bg-surface border border-border p-3 rounded-sm flex items-center justify-between text-xs font-mono">
                            <div className="flex items-center gap-3">
                              <div>
                                <span className="text-text-muted text-[10px] block">Phone Number ID</span>
                                <span className="font-semibold text-text-primary">{configForm.meta_phone_id}</span>
                              </div>
                              <div className="border-l border-border pl-3">
                                <span className="text-text-muted text-[10px] block">WABA ID</span>
                                <span className="font-semibold text-text-primary">{configForm.meta_waba_id || 'N/A'}</span>
                              </div>
                            </div>
                            <span className="text-emerald-600 text-[11px] font-sans font-medium flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              Connected to System
                            </span>
                          </div>
                        )}

                        <div className="pt-1">
                          <WhatsAppEmbeddedSignupButton
                            targetTenantId={editingConfigTenant.id}
                            label={configForm.meta_phone_id ? 'Re-connect / Change Number via Meta' : 'Connect WhatsApp Business with Meta'}
                            onSuccess={(data) => {
                              setConfigForm((prev) => ({
                                ...prev,
                                meta_phone_id: data.phone_number_id,
                                meta_waba_id: data.waba_id,
                              }));
                              loadData();
                            }}
                            onError={(err) => {
                              alert(`Meta Embedded Signup error: ${err}`);
                            }}
                          />
                        </div>

                        {/* Shareable Client Onboarding Link */}
                        <div className="mt-3 p-3 bg-surface border border-emerald-300/60 dark:border-emerald-700/60 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-text-primary flex items-center gap-1.5">
                              <Share2 className="w-3.5 h-3.5 text-emerald-600 stroke-[1.5]" />
                              <span>Shareable Client Onboarding Link</span>
                            </span>
                            <p className="text-[11px] text-text-muted">
                              Send this link to your client via WhatsApp or Email. They click it, sign into their own Meta account, and their WhatsApp is instantly activated in your CRM without them sharing passwords with you!
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const extras = JSON.stringify({
                                version: "v4",
                                sessionInfoVersion: "3",
                                featureType: "whatsapp_business_app_onboarding"
                              });
                              const link = `https://business.facebook.com/messaging/whatsapp/onboard/?app_id=966476346452663&config_id=2164202260830085&extras=${encodeURIComponent(extras)}&redirect_uri=${encodeURIComponent('https://crm.goboldlabs.com/dashboard')}&state=${encodeURIComponent(JSON.stringify({ target_tenant_id: editingConfigTenant.id }))}`;
                              navigator.clipboard.writeText(link);
                              alert('Copied 1-Click WhatsApp Onboarding Link to clipboard!\n\nYou can now send this link directly to your client via WhatsApp or Email.');
                            }}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 font-semibold rounded-sm text-xs shrink-0 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Link for Client</span>
                          </button>
                        </div>
                      </div>

                      {/* Advanced Accordion: Custom Meta App Credentials (Optional) */}
                      <details className="group border border-border/70 rounded-md bg-surface p-3.5 text-xs">
                        <summary className="cursor-pointer font-medium text-text-muted hover:text-text-primary flex items-center justify-between select-none">
                          <span className="flex items-center gap-1.5">
                            <SlidersHorizontal className="w-3.5 h-3.5 text-text-muted stroke-[1.5]" />
                            <span>Advanced: Custom Meta App Credentials (Manual Setup)</span>
                          </span>
                          <span className="text-[10px] text-text-muted group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
                          <p className="text-text-secondary leading-relaxed">
                            Only use this if this client has their own independent Meta Developer App and permanent system user token.
                          </p>

                          {/* Callback URL Box */}
                          <div className="bg-surface-subtle rounded-md border border-border p-3 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-text-primary">
                              <span>Meta Webhook Callback URL:</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(`https://crm.goboldlabs.com/webhooks/whatsapp/${editingConfigTenant.slug}`, 'drawer_url')}
                                className="text-xs font-medium text-accent hover:text-accent-hover flex items-center gap-1 cursor-pointer"
                              >
                                {copiedField === 'drawer_url' ? <Check className="w-3.5 h-3.5 stroke-[1.5]" /> : <Copy className="w-3.5 h-3.5 stroke-[1.5]" />}
                                <span>{copiedField === 'drawer_url' ? 'Copied' : 'Copy URL'}</span>
                              </button>
                            </div>
                            <p className="font-mono text-xs text-text-secondary break-all select-all">
                              {`https://crm.goboldlabs.com/webhooks/whatsapp/${editingConfigTenant.slug}`}
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
                      </details>

                      {/* ── Missed Call → WhatsApp Auto-Reply ── */}
                      {editingConfigTenant && (() => {
                        const slug = editingConfigTenant.slug;
                        const token = configForm.missed_call_webhook_token || getMissedCallUrls(slug).token;
                        const webhookUrl = `https://crm.goboldlabs.com/api/v1/crm/webhooks/missed-call?tenant=${slug}&token=${token}&caller=[call_number]`;
                        return (
                          <div className="bg-amber-50 border border-amber-200 rounded-md overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200 bg-amber-100/60">
                              <div className="flex items-center gap-2">
                                <PhoneCall className="w-4 h-4 text-amber-600 stroke-[1.5]" />
                                <span className="text-xs font-semibold text-amber-900">Missed Call → WhatsApp Auto-Reply</span>
                              </div>
                              <span className="text-[10px] font-medium bg-amber-500 text-white px-2 py-0.5 rounded-full">Auto-Reply</span>
                            </div>

                            <div className="p-4 space-y-4">
                              {/* How it works */}
                              <div className="bg-amber-100/70 border border-amber-200 rounded p-3 text-xs text-amber-800 space-y-1">
                                <p className="font-semibold mb-1">How it works</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                  <li>Missed call hits the phone → MacroDroid / iOS Shortcuts fires this webhook URL</li>
                                  <li>Backend looks up the tenant's WhatsApp template and sends it instantly</li>
                                  <li>Token below authenticates the request — keep it secret</li>
                                </ul>
                              </div>

                              {/* Webhook URL */}
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-amber-800">Webhook URL</label>
                                <div className="flex items-center gap-2 bg-white border border-amber-200 rounded px-3 py-2">
                                  <p className="text-[10px] font-mono text-text-secondary flex-1 overflow-x-auto whitespace-nowrap">
                                    {webhookUrl}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(webhookUrl, 'missed-call-url-config')}
                                    className="flex-shrink-0 p-1 rounded hover:bg-amber-100 transition-colors"
                                    title="Copy URL"
                                  >
                                    {copiedField === 'missed-call-url-config'
                                      ? <Check className="w-3.5 h-3.5 text-green-600" />
                                      : <Copy className="w-3.5 h-3.5 text-amber-600" />}
                                  </button>
                                </div>
                              </div>

                              {/* Security Token */}
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-amber-800">Security Token</label>
                                <div className="flex items-center gap-2 bg-white border border-amber-200 rounded px-3 py-2">
                                  <code className="text-[10px] font-mono text-text-secondary flex-1 break-all">{token}</code>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(token, 'missed-call-token-config')}
                                    className="flex-shrink-0 p-1 rounded hover:bg-amber-100 transition-colors"
                                    title="Copy token"
                                  >
                                    {copiedField === 'missed-call-token-config'
                                      ? <Check className="w-3.5 h-3.5 text-green-600" />
                                      : <Copy className="w-3.5 h-3.5 text-amber-600" />}
                                  </button>
                                </div>
                              </div>

                              {/* Two-column: Template Name + Custom Token Override */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <label className="text-[11px] font-medium text-amber-800">WhatsApp Template Name</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. missed_call_reply"
                                    value={configForm.template_missed_call || ''}
                                    onChange={(e) => setConfigForm({ ...configForm, template_missed_call: e.target.value })}
                                    className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-amber-400 transition-colors duration-150"
                                  />
                                  <p className="text-[10px] text-amber-700">Template used to send auto-reply WhatsApp message</p>
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[11px] font-medium text-amber-800">Custom Token Override <span className="font-normal">(optional)</span></label>
                                  <input
                                    type="text"
                                    placeholder="Leave empty to use auto-generated token"
                                    value={(configForm as any).missed_call_token || ''}
                                    onChange={(e) => setConfigForm({ ...configForm, missed_call_token: e.target.value } as any)}
                                    className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-amber-400 transition-colors duration-150"
                                  />
                                  <p className="text-[10px] text-amber-700">Override the SHA-256 auto-token for this tenant</p>
                                </div>
                              </div>

                              {/* Setup Buttons */}
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => downloadMacroDroidFile(editingConfigTenant.name, slug)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  Download MacroDroid File
                                </button>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(getMissedCallClientMessage(editingConfigTenant.name, slug), 'missed-call-setup-msg')}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-50 text-amber-800 text-xs font-medium rounded transition-colors"
                                >
                                  {copiedField === 'missed-call-setup-msg'
                                    ? <><Check className="w-3.5 h-3.5 text-green-600" /> Copied!</>
                                    : <><Share2 className="w-3.5 h-3.5" /> Copy Setup Message</>}
                                </button>
                              </div>

                              {/* Test Webhook */}
                              <div className="border-t border-amber-200 pt-3 space-y-2">
                                <label className="text-[11px] font-medium text-amber-800 flex items-center gap-1">
                                  <PhoneMissed className="w-3.5 h-3.5" /> Test Webhook
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="tel"
                                    placeholder="+91 98765 43210"
                                    id={`test-phone-${editingConfigTenant.id}`}
                                    className="flex-1 px-3 py-1.5 bg-white border border-amber-200 rounded-sm text-xs font-mono text-text-primary focus:border-amber-400 transition-colors duration-150"
                                  />
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const input = document.getElementById(`test-phone-${editingConfigTenant.id}`) as HTMLInputElement;
                                      const phone = input?.value?.trim();
                                      if (!phone) { alert('Enter a phone number to test'); return; }
                                      const testUrl = `https://crm.goboldlabs.com/api/v1/crm/webhooks/missed-call?tenant=${slug}&token=${token}&caller=${encodeURIComponent(phone)}`;
                                      try {
                                        const res = await fetch(testUrl);
                                        if (res.ok) {
                                          alert(`Webhook fired successfully for ${phone}!`);
                                        } else {
                                          const body = await res.text();
                                          alert(`Webhook error ${res.status}: ${body}`);
                                        }
                                      } catch (err) {
                                        alert(`Network error: ${err}`);
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded transition-colors whitespace-nowrap"
                                  >
                                    Send Test
                                  </button>
                                </div>
                                <p className="text-[10px] text-amber-700">Fires the missed call webhook with the number above — a WhatsApp message will actually be sent.</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* ── 3. LIFECYCLE MESSAGE TEMPLATES ───────────────────────── */}
                  {configTab === 'templates' && (
                    <div className="space-y-5 bg-surface p-5 rounded-md border border-border">
                      <div className="pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-xs text-text-primary flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                              <span>WhatsApp Message Templates</span>
                            </h4>
                            {metaTemplatesStatus?.summary && (
                              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                  {metaTemplatesStatus.summary.approved} Approved
                                </span>
                                {(metaTemplatesStatus.summary.pending > 0 || metaTemplatesStatus.summary.missing > 0) && (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold inline-flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5 text-amber-600" />
                                    {metaTemplatesStatus.summary.pending + metaTemplatesStatus.summary.missing} Pending
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <p className="text-[11px] text-text-muted">
                            Meta WhatsApp approved templates for customer lifecycles and staff notifications ({editingConfigTenant?.name || 'Client'}).
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {editingConfigTenant && (
                            <>
                              <button
                                type="button"
                                disabled={loadingMetaTemplates}
                                onClick={() => loadAdminMetaTemplatesStatus(editingConfigTenant.id)}
                                className="px-2.5 py-1 bg-surface hover:bg-surface-subtle text-text-secondary border border-border rounded-sm text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                                title="Refresh live status from Meta"
                              >
                                <RefreshCw className={`w-3 h-3 stroke-[1.5] ${loadingMetaTemplates ? 'animate-spin' : ''}`} />
                                <span>{loadingMetaTemplates ? 'Checking...' : 'Check Status'}</span>
                              </button>
                              <button
                                type="button"
                                disabled={isSyncingMetaTemplates}
                                onClick={() => handleSyncMetaTemplates(editingConfigTenant.id)}
                                className="px-3 py-1 bg-accent hover:bg-accent/90 text-white rounded-sm text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer shrink-0 disabled:opacity-50"
                                title="Provision all missing templates in Meta as UTILITY"
                              >
                                <Sparkles className={`w-3 h-3 stroke-[1.5] ${isSyncingMetaTemplates ? 'animate-spin' : ''}`} />
                                <span>{isSyncingMetaTemplates ? 'Syncing...' : 'Sync Meta'}</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Google Review URL Card */}
                      <div className="p-3 bg-surface-subtle rounded-md border border-border space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                            <label className="text-xs font-medium text-text-primary">
                              Google review link (automated 15-min review request)
                            </label>
                          </div>
                          <span className="text-[10px] text-text-muted">Sent 15 mins after marked Attended</span>
                        </div>
                        <input
                          type="text"
                          placeholder="https://g.page/r/your-business-id/review"
                          value={configForm.google_review_link || ''}
                          onChange={(e) => setConfigForm({ ...configForm, google_review_link: e.target.value })}
                          className="w-full px-3 py-1.5 bg-surface border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                        />
                      </div>

                      {/* Customer Automation Templates */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                            Customer lifecycle templates
                          </h5>
                          <span className="text-[10px] text-text-muted">Auto-dispatched to customer WhatsApp</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            {
                              key: 'template_booking_confirmation',
                              defaultName: 'booking_confirmationn',
                              label: '1. Client booking confirmation',
                              desc: 'Dispatched upon appointment confirmation.',
                            },
                            {
                              key: 'template_reschedule_confirmation',
                              defaultName: 'booking_reschedule_confirmation',
                              label: '2. Client reschedule confirmation',
                              desc: 'Dispatched when customer reschedules slot.',
                            },
                            {
                              key: 'template_cancellation_confirmation',
                              defaultName: 'cancellation_confirmation',
                              label: '3. Client cancellation notice',
                              desc: 'Dispatched when booking is cancelled.',
                            },
                            {
                              key: 'template_appointment_reminder',
                              defaultName: 'appointment_ramainder',
                              label: '4. 2-Hour appointment reminder',
                              desc: 'Sent 2 hours before start time.',
                            },
                            {
                              key: 'template_review_request',
                              defaultName: 'review_request',
                              label: '5. 15-Min post-attendance review',
                              desc: 'Sent 15 mins after marked Attended.',
                            },
                            {
                              key: 'template_reschedule_nudge',
                              defaultName: 'reschedule_nudge',
                              label: '6. 15-Min no-show reschedule nudge',
                              desc: 'Sent 15 mins after marked No Show (Quick-reply button).',
                            },
                            {
                              key: 'template_client_followup',
                              defaultName: 'client_followup_checkin',
                              label: '7. Client 24h Re-engagement Follow-up',
                              desc: 'Dispatched when following up with a client after 24h Meta messaging window.',
                            },
                          ].map((item) => (
                            <div key={item.key} className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <label className="text-xs font-medium text-text-primary truncate">{item.label}</label>
                                {renderAdminStatusBadge((configForm as any)[item.key], item.defaultName)}
                              </div>
                              <input
                                type="text"
                                placeholder={item.defaultName}
                                value={(configForm as any)[item.key] || ''}
                                onChange={(e) => setConfigForm({ ...configForm, [item.key]: e.target.value })}
                                className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                              />
                              <p className="text-[11px] text-text-muted">{item.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Admin & Staff Templates */}
                      <div className="space-y-3 pt-3 border-t border-border">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                            Admin & staff notification templates
                          </h5>
                          <span className="text-[10px] text-text-muted">Dispatched to team internal WhatsApp</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {[
                            {
                              key: 'template_admin_notification',
                              defaultName: 'admin_notification',
                              label: '8. Admin booking alert',
                              desc: 'Staff WhatsApp alert on new booking.',
                            },
                            {
                              key: 'template_admin_reschedule_notice',
                              defaultName: 'admin_reschedule_notice',
                              label: '9. Admin reschedule alert',
                              desc: 'Staff WhatsApp alert on reschedule.',
                            },
                            {
                              key: 'template_admin_cancellation_notice',
                              defaultName: 'admin_cancellation_notice',
                              label: '10. Admin cancellation alert',
                              desc: 'Staff WhatsApp alert on cancellation.',
                            },
                            {
                              key: 'template_admin_human_request',
                              defaultName: 'admin_human_request',
                              label: '11. Staff takeover alert',
                              desc: 'Alert when client asks for a human.',
                            },
                            {
                              key: 'template_admin_daily_digest',
                              defaultName: 'admin_daily_digest',
                              label: '12. Daily morning digest',
                              desc: '8:00 AM daily schedule overview.',
                            },
                            {
                              key: 'template_admin_appointment_reminder',
                              defaultName: 'admin_appointment_reminder',
                              label: '13. Admin 30m appointment reminder',
                              desc: '30 minutes before appointment alert.',
                            },
                          ].map((item) => (
                            <div key={item.key} className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <label className="text-xs font-medium text-text-primary truncate">{item.label}</label>
                                {renderAdminStatusBadge((configForm as any)[item.key], item.defaultName)}
                              </div>
                              <input
                                type="text"
                                placeholder={item.defaultName}
                                value={(configForm as any)[item.key] || ''}
                                onChange={(e) => setConfigForm({ ...configForm, [item.key]: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                              />
                              <p className="text-[11px] text-text-muted">{item.desc}</p>
                            </div>
                          ))}
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

                      {/* Step 1: Primary 1-Click Google Authorization Card */}
                      <div className="bg-surface-subtle border border-border rounded-md p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md bg-white dark:bg-zinc-800 border border-border flex items-center justify-center shadow-xs">
                              <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                              </svg>
                            </div>
                            <div>
                              <h5 className="text-sm font-semibold text-text-primary">Google Calendar & Tasks Synchronization</h5>
                              <p className="text-xs text-text-muted">1-Click integration via Platform Master App — No Google Cloud setup required.</p>
                            </div>
                          </div>
                          {configForm.google_calendar_configured ? (
                            <span className="text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-sm flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Authorized & Live</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-sm">
                              Not Connected
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-text-secondary leading-relaxed">
                          Click below to sign in with Google. The system will securely connect this client's Google Calendar and auto-sync appointment bookings and follow-up tasks.
                        </p>

                        <div className="flex items-center gap-3 pt-1">
                          <button
                            type="button"
                            onClick={handleAdminInitGoogleOAuth}
                            disabled={oauthConnecting}
                            className="px-4 py-2.5 bg-white hover:bg-gray-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-zinc-600 rounded-sm text-xs font-medium shadow-xs transition-colors duration-150 flex items-center gap-2.5 cursor-pointer disabled:opacity-50"
                          >
                            {oauthConnecting ? (
                              <Loader2 className="w-4 h-4 animate-spin text-accent" />
                            ) : (
                              <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                              </svg>
                            )}
                            <span className="font-semibold">{configForm.google_calendar_configured ? 'Re-authorize with Google' : 'Sign in with Google'}</span>
                          </button>

                          {configForm.google_calendar_configured && (
                            <button
                              type="button"
                              onClick={handleAdminDisconnectGoogle}
                              disabled={oauthDisconnecting}
                              className="px-3 py-2 bg-transparent hover:bg-status-error-bg text-status-error border border-status-error-border rounded-sm text-xs font-medium transition-colors duration-150 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {oauthDisconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5 stroke-[1.5]" />}
                              <span>Disconnect Calendar</span>
                            </button>
                          )}
                        </div>

                        {/* Shareable Client Google Calendar Link */}
                        <div className="mt-3 p-3 bg-surface border border-blue-300/60 dark:border-blue-700/60 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-text-primary flex items-center gap-1.5">
                              <ExternalLink className="w-3.5 h-3.5 text-blue-600 stroke-[1.5]" />
                              <span>Shareable Client Calendar Link</span>
                            </span>
                            <p className="text-[11px] text-text-muted">
                              Send this link to your client via WhatsApp or Email. They click it, sign into their Google account, and their calendar will automatically link and sync with your CRM!
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyGoogleCalendarLink}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/60 border border-blue-300 dark:border-blue-700 font-semibold rounded-sm text-xs shrink-0 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Link for Client</span>
                          </button>
                        </div>
                      </div>

                      {/* Advanced Accordion: Custom Google Cloud Credentials (Optional) */}
                      <details className="group border border-border/70 rounded-md bg-surface p-3.5 text-xs">
                        <summary className="cursor-pointer font-medium text-text-muted hover:text-text-primary flex items-center justify-between select-none">
                          <span className="flex items-center gap-1.5">
                            <SlidersHorizontal className="w-3.5 h-3.5 text-text-muted stroke-[1.5]" />
                            <span>Advanced: Custom Google Cloud Project (Optional)</span>
                          </span>
                          <span className="text-[10px] text-text-muted group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
                          <p className="text-text-secondary leading-relaxed">
                            Only fill these if this client requires their own independent Google Cloud Project instead of the central platform app.
                          </p>
                          <div className="bg-surface-subtle rounded-md border border-border p-3 space-y-1.5">
                            <div className="flex justify-between items-center">
                              <label className="text-[11px] font-medium text-text-primary">Authorized redirect URI</label>
                              <button
                                type="button"
                                onClick={() => copyToClipboard('https://crm.goboldlabs.com/api/v1/crm/oauth/google/callback', 'gcal_redirect')}
                                className="text-[11px] font-medium text-accent hover:text-accent-hover flex items-center gap-1 cursor-pointer"
                              >
                                {copiedField === 'gcal_redirect' ? <Check className="w-3 h-3 stroke-[1.5]" /> : <Copy className="w-3 h-3 stroke-[1.5]" />}
                                <span>{copiedField === 'gcal_redirect' ? 'Copied' : 'Copy URI'}</span>
                              </button>
                            </div>
                            <p className="font-mono text-[11px] text-text-secondary break-all select-all bg-white dark:bg-zinc-800 p-2 rounded-sm border border-border">
                              https://crm.goboldlabs.com/api/v1/crm/oauth/google/callback
                            </p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-medium text-text-primary mb-1">Custom Client ID</label>
                              <input
                                type="text"
                                placeholder="...apps.googleusercontent.com"
                                value={configForm.google_client_id || ''}
                                onChange={(e) => setConfigForm({ ...configForm, google_client_id: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-text-primary mb-1">Custom Client Secret</label>
                              <input
                                type="password"
                                placeholder="GOCSPX-..."
                                value={configForm.google_client_secret || ''}
                                onChange={(e) => setConfigForm({ ...configForm, google_client_secret: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                              />
                            </div>
                          </div>
                        </div>
                      </details>

                      {/* Step 4: Shop Opening & Closing Hours */}
                      <div className="bg-surface rounded-md border border-border p-4 space-y-3">
                        <div className="flex items-center justify-between pb-1 border-b border-border">
                          <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                            <span>Shop Operating Hours (Client Specific)</span>
                          </label>
                          <span className="text-[10px] text-text-muted">Enforced on WhatsApp AI</span>
                        </div>
                        <p className="text-xs text-text-secondary">
                          AI assistant will strictly propose and accept appointments only within this operating window for this organization.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          <div>
                            <label className="block text-[11px] font-medium text-text-primary mb-1">Shop Opening Time</label>
                            <input
                              type="time"
                              value={configForm.opening_time || '09:00'}
                              onChange={(e) => setConfigForm({ ...configForm, opening_time: e.target.value })}
                              className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                            <span className="text-[10px] text-text-muted mt-1 block">Default: 09:00 AM</span>
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-text-primary mb-1">Shop Closing Time</label>
                            <input
                              type="time"
                              value={configForm.closing_time || '20:00'}
                              onChange={(e) => setConfigForm({ ...configForm, closing_time: e.target.value })}
                              className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                            <span className="text-[10px] text-text-muted mt-1 block">Default: 08:00 PM</span>
                          </div>
                        </div>
                      </div>

                      {/* Slot Booking Capacity & Concurrency */}
                      <div className="bg-surface rounded-md border border-border p-4 space-y-4">
                        <div className="flex items-center justify-between pb-1 border-b border-border">
                          <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                            <span>Slot Booking Capacity & Concurrency</span>
                          </label>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 text-accent font-medium">
                            Configurable
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          Control whether customers can book overlapping appointments at the exact same time slot, or if each slot is exclusively reserved for 1 customer.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          <div
                            onClick={() => setConfigForm({ ...configForm, slot_booking_mode: 'single' })}
                            className={`p-3.5 rounded-md border cursor-pointer transition-all duration-150 relative ${
                              (configForm.slot_booking_mode || 'single') === 'single'
                                ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
                                : 'border-border bg-surface-subtle hover:border-border-hover'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-full ${
                                  (configForm.slot_booking_mode || 'single') === 'single'
                                    ? 'bg-accent text-white'
                                    : 'bg-surface border border-border text-text-muted'
                                }`}>
                                  <User className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-semibold text-text-primary">Single Booking per Slot</span>
                              </div>
                              <input
                                type="radio"
                                name="admin_slot_booking_mode"
                                checked={(configForm.slot_booking_mode || 'single') === 'single'}
                                onChange={() => setConfigForm({ ...configForm, slot_booking_mode: 'single' })}
                                className="text-accent focus:ring-accent h-3.5 w-3.5 mt-0.5"
                              />
                            </div>
                            <p className="text-[11px] text-text-secondary mt-2 leading-relaxed">
                              <strong>Strict 1-on-1:</strong> Once an appointment is booked for a time, that slot is instantly marked busy. No other customer can book the same time.
                            </p>
                            <div className="mt-2 text-[10px] text-text-muted flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-status-success" />
                              <span>Zero double-booking guarantee</span>
                            </div>
                          </div>

                          <div
                            onClick={() => setConfigForm({ ...configForm, slot_booking_mode: 'multiple' })}
                            className={`p-3.5 rounded-md border cursor-pointer transition-all duration-150 relative ${
                              configForm.slot_booking_mode === 'multiple'
                                ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
                                : 'border-border bg-surface-subtle hover:border-border-hover'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-full ${
                                  configForm.slot_booking_mode === 'multiple'
                                    ? 'bg-accent text-white'
                                    : 'bg-surface border border-border text-text-muted'
                                }`}>
                                  <Users className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-semibold text-text-primary">Multiple Bookings per Slot</span>
                              </div>
                              <input
                                type="radio"
                                name="admin_slot_booking_mode"
                                checked={configForm.slot_booking_mode === 'multiple'}
                                onChange={() => setConfigForm({ ...configForm, slot_booking_mode: 'multiple' })}
                                className="text-accent focus:ring-accent h-3.5 w-3.5 mt-0.5"
                              />
                            </div>
                            <p className="text-[11px] text-text-secondary mt-2 leading-relaxed">
                              <strong>Concurrent / Multi-patient:</strong> Multiple customers can book the same time slot simultaneously (ideal for clinics with multiple doctors/chairs or group sessions).
                            </p>
                            <div className="mt-2 text-[10px] text-text-muted flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-accent" />
                              <span>Multi-capacity scheduling</span>
                            </div>
                          </div>
                        </div>

                        {/* Concurrent capacity limit when 'multiple' is active */}
                        {configForm.slot_booking_mode === 'multiple' && (
                          <div className="p-3 bg-surface-subtle rounded-md border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 animate-in fade-in duration-150">
                            <div>
                              <label className="block text-xs font-medium text-text-primary">
                                Maximum Concurrent Bookings per Slot
                              </label>
                              <p className="text-[11px] text-text-muted">
                                The slot will be marked busy once this number of confirmed appointments is reached. (e.g. 2 for 2 simultaneous patients, or leave 0 for unlimited)
                              </p>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <input
                                type="number"
                                min="2"
                                max="100"
                                placeholder="Unlimited"
                                value={configForm.max_concurrent_bookings || ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                                  setConfigForm({ ...configForm, max_concurrent_bookings: val });
                                }}
                                className="w-24 px-3 py-1.5 bg-surface border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent text-center transition-colors duration-150"
                              />
                              <span className="text-xs text-text-muted whitespace-nowrap">slots</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Step 5: Calendar ID Config */}
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

                      {/* Real-Time Availability & Free-Time Booking Callout */}
                      <div className="bg-surface-subtle border border-border rounded-md p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-accent stroke-[1.5]" />
                            <h5 className="font-semibold text-xs text-text-primary">
                              Real-Time Free/Busy Availability & Zero Wrong Data Mandate
                            </h5>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                            Live Conflict Prevention
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          When customers text to book an appointment, the AI checks live availability directly from this organization's connected Google Calendar. 
                          The AI is strictly restricted to proposing and booking during verified open free time. Stating hallucinated or occupied slots is strictly blocked.
                        </p>

                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => handleTestLiveCalendar(editingConfigTenant.id)}
                            disabled={testerLoading}
                            className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {testerLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5 stroke-[1.5]" />}
                            <span>Verify Live Google Calendar Slots</span>
                          </button>
                        </div>

                        {testerAvailability && (
                          <div className="bg-surface border border-border rounded-sm p-3 space-y-2 text-xs mt-2 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                                {testerAvailability.google_calendar_connected ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
                                ) : (
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                )}
                                <span>{testerAvailability.google_calendar_connected ? 'Google Calendar Verified (Live Ground Truth)' : 'CRM Internal Schedule Active'}</span>
                              </span>
                              <span className="text-[10px] font-mono text-text-muted">
                                {testerAvailability.timezone}
                              </span>
                            </div>

                            <p className="text-[11px] text-text-muted">
                              Total Occupied Slots: <strong>{testerAvailability.total_occupied_slots}</strong> (Google Calendar: {testerAvailability.gcal_slots_count}, CRM: {testerAvailability.crm_slots_count})
                            </p>

                            {testerAvailability.occupied_slots.length > 0 ? (
                              <div className="max-h-32 overflow-y-auto space-y-1 pt-1">
                                {testerAvailability.occupied_slots.map((slot, i) => (
                                  <div key={i} className="p-1.5 bg-surface-subtle rounded border border-border flex items-center justify-between text-[10px]">
                                    <span className="font-medium text-text-primary">{slot.start_formatted} – {slot.end_formatted}</span>
                                    <span className="font-mono text-amber-600 dark:text-amber-400">{slot.source}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-status-success font-medium bg-status-success-bg p-2 rounded-sm border border-status-success-border">
                                All operating hours (09:00 AM – 08:00 PM) are open and free for booking!
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── WHITE-LABEL & CUSTOM DOMAINS ─────────────────────────── */}
                  {configTab === 'whitelabel' && (
                    <div className="space-y-5 bg-surface p-5 rounded-md border border-border">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div>
                          <h4 className="font-semibold text-xs text-text-primary flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-accent" />
                            <span>White-Label & Custom Domain Engine</span>
                          </h4>
                          <p className="text-xs text-text-muted">
                            Point your partner company's domain directly to this CRM portal with custom brand logo, primary colors, and complete visual isolation.
                          </p>
                        </div>
                        {configForm.custom_domain && (
                          <a
                            href={`https://${configForm.custom_domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-medium text-sky-400 hover:text-sky-300 bg-sky-500/10 border border-sky-500/20 transition-colors"
                          >
                            <span>Visit Domain</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {/* 1. Custom Domain Input & DNS Setup Instructions */}
                      <div className="space-y-3 p-4 bg-surface-subtle border border-border rounded-md">
                        <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
                          1. Domain Mapping & DNS Records
                        </label>
                        <p className="text-xs text-text-muted">
                          Enter the full subdomain or root domain where your partner's clients will access their dashboard.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-text-secondary mb-1">
                              Custom Domain (FQDN)
                            </label>
                            <input
                              type="text"
                              value={configForm.custom_domain || ''}
                              onChange={(e) => setConfigForm({ ...configForm, custom_domain: e.target.value.toLowerCase().trim() })}
                              placeholder="e.g. crm.partnercompany.com"
                              className="w-full px-2.5 py-1.5 bg-white border border-border rounded-sm text-xs font-mono text-text-primary focus:border-accent"
                            />
                            <p className="text-[10px] text-text-muted mt-0.5">
                              Do not include https:// or slashes.
                            </p>
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-text-secondary mb-1">
                              Organization Slug (Backend Routing Key)
                            </label>
                            <div className="px-2.5 py-1.5 bg-surface border border-border rounded-sm text-xs font-mono text-text-muted flex items-center justify-between">
                              <span>/{editingConfigTenant.slug}</span>
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.2 rounded font-sans">Active</span>
                            </div>
                            <p className="text-[10px] text-text-muted mt-0.5">
                              This organization can also be accessed via default domain: crm.goboldlabs.com/{editingConfigTenant.slug}
                            </p>
                          </div>
                        </div>

                        {/* Interactive DNS Setup Instructions */}
                        <div className="mt-3 p-3.5 bg-sky-950/20 border border-sky-500/30 rounded-md space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5" />
                              <span>Required DNS Record for Partner's Registrar</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard('cname.vercel-dns.com', 'cname_target')}
                              className="text-xs font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                            >
                              {copiedField === 'cname_target' ? <Check className="w-3.5 h-3.5 stroke-[1.5]" /> : <Copy className="w-3.5 h-3.5 stroke-[1.5]" />}
                              <span>{copiedField === 'cname_target' ? 'Copied' : 'Copy Target'}</span>
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            Have the partner add this single CNAME record at their DNS host (Cloudflare, GoDaddy, Hostinger, Route53, Namecheap):
                          </p>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-[11px] border border-sky-500/20 rounded bg-slate-900/60">
                              <thead>
                                <tr className="border-b border-sky-500/20 text-slate-400 text-[10px] uppercase font-mono">
                                  <th className="py-1 px-2.5">Type</th>
                                  <th className="py-1 px-2.5">Name / Host</th>
                                  <th className="py-1 px-2.5">Target / Value</th>
                                  <th className="py-1 px-2.5">TTL / Proxy</th>
                                </tr>
                              </thead>
                              <tbody className="font-mono text-slate-200">
                                <tr>
                                  <td className="py-1 px-2.5 font-bold text-sky-400">CNAME</td>
                                  <td className="py-1 px-2.5">
                                    {configForm.custom_domain && configForm.custom_domain.includes('.')
                                      ? configForm.custom_domain.split('.')[0]
                                      : 'crm'}
                                  </td>
                                  <td className="py-1 px-2.5 text-emerald-400">cname.vercel-dns.com</td>
                                  <td className="py-1 px-2.5 text-slate-400">DNS Only (Auto / 60s)</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          <p className="text-[10px] text-slate-400">
                            SSL: Vercel automatically manages and renews trusted HTTPS/SSL certificates at zero extra cost.
                          </p>
                        </div>
                      </div>

                      {/* 2. Visual Identity & Brand Styling */}
                      <div className="space-y-3 p-4 bg-surface-subtle border border-border rounded-md">
                        <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
                          2. Brand Identity & Theme Styling
                        </label>
                        <p className="text-xs text-text-muted">
                          Customize how the portal looks and feels when accessed through this partner's custom domain.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-medium text-text-secondary mb-1">
                              Brand Display Name
                            </label>
                            <input
                              type="text"
                              value={configForm.brand_name || ''}
                              onChange={(e) => setConfigForm({ ...configForm, brand_name: e.target.value })}
                              placeholder={`e.g. ${editingConfigTenant.name} CRM`}
                              className="w-full px-2.5 py-1.5 bg-white border border-border rounded-sm text-xs text-text-primary focus:border-accent"
                            />
                            <p className="text-[10px] text-text-muted mt-0.5">
                              Replaces "Boldlabs CRM" on the login page and page titles.
                            </p>
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-text-secondary mb-1">
                              Favicon URL (.ico or .png)
                            </label>
                            <input
                              type="text"
                              value={configForm.brand_favicon_url || ''}
                              onChange={(e) => setConfigForm({ ...configForm, brand_favicon_url: e.target.value })}
                              placeholder="https://.../favicon.ico"
                              className="w-full px-2.5 py-1.5 bg-white border border-border rounded-sm text-xs text-text-primary focus:border-accent"
                            />
                            <p className="text-[10px] text-text-muted mt-0.5">
                              Browser tab icon. Leave blank for default platform icon.
                            </p>
                          </div>
                        </div>

                        {/* Logo URL with Live Preview */}
                        <div>
                          <label className="block text-[11px] font-medium text-text-secondary mb-1">
                            Brand Logo URL
                          </label>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <input
                              type="text"
                              value={configForm.brand_logo_url || ''}
                              onChange={(e) => setConfigForm({ ...configForm, brand_logo_url: e.target.value })}
                              placeholder="https://.../partner-logo.png"
                              className="w-full px-2.5 py-1.5 bg-white border border-border rounded-sm text-xs text-text-primary focus:border-accent"
                            />
                            {configForm.brand_logo_url ? (
                              <div className="h-10 px-3 bg-slate-900 border border-border rounded flex items-center justify-center shrink-0">
                                <img
                                  src={configForm.brand_logo_url}
                                  alt="Logo Preview"
                                  className="h-7 max-w-[120px] object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : (
                              <span className="text-[10px] text-text-muted whitespace-nowrap">No logo preview</span>
                            )}
                          </div>
                          <p className="text-[10px] text-text-muted mt-0.5">
                            Recommended: PNG or SVG with transparent background, height around 48px.
                          </p>
                        </div>

                        {/* Theme Primary / Accent Color */}
                        <div className="p-3 bg-white rounded border border-border space-y-2">
                          <label className="block text-[11px] font-medium text-text-secondary">
                            Primary Theme / Accent Color
                          </label>
                          <div className="flex flex-wrap items-center gap-3">
                            <input
                              type="color"
                              value={configForm.brand_primary_color || '#059669'}
                              onChange={(e) => setConfigForm({ ...configForm, brand_primary_color: e.target.value })}
                              className="w-9 h-9 rounded border border-border cursor-pointer p-0.5"
                            />
                            <input
                              type="text"
                              value={configForm.brand_primary_color || '#059669'}
                              onChange={(e) => setConfigForm({ ...configForm, brand_primary_color: e.target.value })}
                              placeholder="#059669"
                              className="w-28 px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary uppercase"
                            />

                            {/* Color presets */}
                            <div className="flex items-center gap-1.5">
                              {[
                                { name: 'Emerald (Boldlabs)', hex: '#059669' },
                                { name: 'Royal Blue', hex: '#2563eb' },
                                { name: 'Indigo', hex: '#4f46e5' },
                                { name: 'Purple', hex: '#7c3aed' },
                                { name: 'Amber', hex: '#d97706' },
                                { name: 'Rose', hex: '#e11d48' },
                                { name: 'Slate Dark', hex: '#334155' },
                              ].map((preset) => (
                                <button
                                  key={preset.hex}
                                  type="button"
                                  onClick={() => setConfigForm({ ...configForm, brand_primary_color: preset.hex })}
                                  style={{ backgroundColor: preset.hex }}
                                  className="w-5 h-5 rounded-full border border-black/10 hover:scale-110 transition-transform cursor-pointer shadow-xs"
                                  title={preset.name}
                                />
                              ))}
                            </div>

                            {/* Live button sample */}
                            <div className="ml-auto">
                              <button
                                type="button"
                                style={{ backgroundColor: configForm.brand_primary_color || '#059669' }}
                                className="px-3.5 py-1.5 text-white font-medium text-xs rounded-sm shadow-xs flex items-center gap-1.5 pointer-events-none"
                              >
                                <span>Preview Button</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Support Email and Phone */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-text-secondary mb-1">
                              Partner Support Email
                            </label>
                            <input
                              type="email"
                              value={configForm.brand_support_email || ''}
                              onChange={(e) => setConfigForm({ ...configForm, brand_support_email: e.target.value })}
                              placeholder="support@partnercompany.com"
                              className="w-full px-2.5 py-1.5 bg-white border border-border rounded-sm text-xs text-text-primary focus:border-accent"
                            />
                            <p className="text-[10px] text-text-muted mt-0.5">
                              Shown on login footers and automated client emails.
                            </p>
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-text-secondary mb-1">
                              Partner Support WhatsApp / Phone
                            </label>
                            <input
                              type="text"
                              value={configForm.brand_support_phone || ''}
                              onChange={(e) => setConfigForm({ ...configForm, brand_support_phone: e.target.value })}
                              placeholder="+91 99999 99999"
                              className="w-full px-2.5 py-1.5 bg-white border border-border rounded-sm text-xs text-text-primary focus:border-accent"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. Security Isolation & Platform Shield */}
                      <div className="p-4 bg-surface-subtle border border-border rounded-md space-y-3">
                        <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
                          3. Security & Super Admin Isolation Guard
                        </label>

                        <label className="flex items-start gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={configForm.hide_platform_branding ?? true}
                            onChange={(e) => setConfigForm({ ...configForm, hide_platform_branding: e.target.checked })}
                            className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent mt-0.5 cursor-pointer"
                          />
                          <div className="text-xs space-y-1">
                            <span className="font-semibold text-text-primary">
                              Enforce Total Platform Shield (Recommended)
                            </span>
                            <p className="text-text-muted leading-relaxed">
                              When enabled, all references to Boldlabs are removed from login pages. The master Super Admin doorway (<code className="font-mono text-amber-500">/bhuvanesh</code>) is completely blocked on this custom domain, automatically redirecting any visitor straight to the partner's login page.
                            </p>
                          </div>
                        </label>
                      </div>

                      {/* 4. Commercial & Revenue Partner Connection */}
                      <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            <span>Commercial Sales Channel & Revenue Split</span>
                          </span>
                          <p className="text-xs text-slate-300">
                            Channel:{' '}
                            <strong className="text-white">
                              {editingConfigTenant.sales_channel === 'partner'
                                ? `Partner Agency (${editingConfigTenant.partner_name || 'Unspecified'})`
                                : 'Direct Sales'}
                            </strong>{' '}
                            &bull; Split:{' '}
                            <strong className="text-white">
                              {editingConfigTenant.sales_channel === 'partner'
                                ? `${editingConfigTenant.partner_share_pct ?? 50}% Partner / ${editingConfigTenant.owner_share_pct ?? 50}% Platform`
                                : '100% Platform'}
                            </strong>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setConfigTab('billing')}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-sm text-xs font-medium transition-colors shrink-0 cursor-pointer shadow-xs flex items-center gap-1"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Configure in Billing</span>
                        </button>
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
                        <div className="p-4 bg-surface-subtle rounded-md border border-border space-y-3 md:col-span-2">
                          <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">Feature Plan, Pricing & Sales Channel</label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[11px] font-medium text-text-secondary mb-1">Feature Suite Plan</label>
                              <select
                                value={editingConfigTenant.plan || 'full_suite'}
                                onChange={(e) => setEditingConfigTenant({ ...editingConfigTenant, plan: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-white border border-border rounded-sm text-xs text-text-primary focus:border-accent cursor-pointer"
                              >
                                <option value="full_suite">Full Suite (Automation + Reviews)</option>
                                <option value="automation_only">WhatsApp Automation Only</option>
                                <option value="review_only">AI Review System Only</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-text-secondary mb-1">Monthly Price (₹)</label>
                              <input
                                type="number"
                                value={editingConfigTenant.monthly_price || 3499}
                                onChange={(e) => setEditingConfigTenant({ ...editingConfigTenant, monthly_price: Number(e.target.value) })}
                                className="w-full px-2.5 py-1.5 bg-white border border-border rounded-sm text-xs font-mono text-text-primary focus:border-accent"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-text-secondary mb-1">Sales Channel</label>
                              <select
                                value={editingConfigTenant.sales_channel || 'direct'}
                                onChange={(e) => setEditingConfigTenant({ ...editingConfigTenant, sales_channel: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-white border border-border rounded-sm text-xs text-text-primary focus:border-accent cursor-pointer"
                              >
                                <option value="direct">Direct Sales ("I myself sell")</option>
                                <option value="partner">Partner Agency Sales ("Company Partner")</option>
                              </select>
                            </div>
                          </div>

                          {(editingConfigTenant.sales_channel === 'partner') && (
                            <div className="p-3 bg-white rounded border border-border space-y-2 mt-2">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-[10px] font-semibold text-text-muted mb-0.5">Partner Agency Name</label>
                                  <input
                                    type="text"
                                    placeholder="Partner Agency Name"
                                    value={editingConfigTenant.partner_name || ''}
                                    onChange={(e) => setEditingConfigTenant({ ...editingConfigTenant, partner_name: e.target.value })}
                                    className="w-full px-2 py-1 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-text-muted mb-0.5">Partner Share %</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={editingConfigTenant.partner_share_pct ?? 50}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      setEditingConfigTenant({ ...editingConfigTenant, partner_share_pct: val, owner_share_pct: 100 - val });
                                    }}
                                    className="w-full px-2 py-1 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-text-muted mb-0.5">Owner Share %</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={editingConfigTenant.owner_share_pct ?? 50}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      setEditingConfigTenant({ ...editingConfigTenant, owner_share_pct: val, partner_share_pct: 100 - val });
                                    }}
                                    className="w-full px-2 py-1 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
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
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-sm text-xs font-mono font-bold text-slate-950 focus:border-accent"
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

                  {configTab === 'team' && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-surface-subtle border border-border rounded-sm">
                        <div className="space-y-1">
                          <h4 className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-accent" />
                            <span>Sales & Staff Credentials & Granular Access Control</span>
                          </h4>
                          <p className="text-[11px] text-text-muted">
                            Create login credentials for Sales Executives, Doctors, Receptionists, and Staff. Configure exactly what tabs and actions each role can access.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleOpenCreateStaff}
                          className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[1.5]" />
                          <span>Add Staff / Sales Account</span>
                        </button>
                      </div>

                      {staffError && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-sm flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 stroke-[1.5]" />
                          <span>{staffError}</span>
                        </div>
                      )}

                      {/* Staff Table */}
                      {staffLoading ? (
                        <div className="py-12 text-center space-y-2">
                          <RefreshCw className="w-5 h-5 animate-spin text-accent mx-auto stroke-[1.5]" />
                          <p className="text-xs text-text-muted">Loading team credentials...</p>
                        </div>
                      ) : staffList.length === 0 ? (
                        <div className="py-12 text-center border border-dashed border-border rounded-sm space-y-2">
                          <Users className="w-8 h-8 text-text-muted mx-auto stroke-[1.5]" />
                          <p className="text-xs font-medium text-text-primary">No staff members created yet</p>
                          <p className="text-[11px] text-text-muted">Click &quot;Add Staff Member&quot; to issue doctor or receptionist logins for this clinic.</p>
                        </div>
                      ) : (
                        <div className="border border-border rounded-sm overflow-hidden">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-surface-subtle border-b border-border text-text-muted text-[11px] uppercase tracking-wider">
                                <th className="py-2.5 px-3 font-semibold">User</th>
                                <th className="py-2.5 px-3 font-semibold">Role</th>
                                <th className="py-2.5 px-3 font-semibold">Assigned Doctor</th>
                                <th className="py-2.5 px-3 font-semibold">Allowed Permissions</th>
                                <th className="py-2.5 px-3 font-semibold">Status</th>
                                <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {staffList.map((member) => {
                                const perms = member.permissions || {};
                                const activeCount = [
                                  perms.can_view_inbox,
                                  perms.can_send_messages,
                                  perms.can_manage_bookings,
                                  perms.can_view_calendar,
                                  perms.can_manage_customers,
                                  perms.can_manage_marketing,
                                  perms.can_view_analytics,
                                  perms.can_manage_settings,
                                ].filter(Boolean).length;

                                return (
                                  <tr key={member.id} className="hover:bg-surface-subtle/50 transition-colors">
                                    <td className="py-2.5 px-3">
                                      <div className="font-semibold text-text-primary">{member.display_name || member.email}</div>
                                      <div className="text-[11px] text-text-muted font-mono">{member.email}</div>
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${
                                        member.role === 'admin'
                                          ? 'bg-purple-500/10 text-purple-700 border-purple-300'
                                          : member.role === 'sales'
                                          ? 'bg-amber-500/15 text-amber-800 border-amber-400 font-bold'
                                          : member.role === 'marketing'
                                          ? 'bg-purple-500/10 text-purple-700 border-purple-300'
                                          : member.role === 'doctor'
                                          ? 'bg-blue-500/10 text-blue-700 border-blue-300'
                                          : member.role === 'receptionist'
                                          ? 'bg-emerald-500/10 text-emerald-700 border-emerald-300'
                                          : member.role === 'agent'
                                          ? 'bg-cyan-500/10 text-cyan-700 border-cyan-300'
                                          : 'bg-surface-subtle text-text-muted border-border'
                                      }`}>
                                        {member.role === 'super_admin' || member.role === 'admin' ? 'Admin' : member.role === 'sales' ? 'Sales Executive' : member.role === 'marketing' ? 'Marketing' : member.role}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3">
                                      {perms.assigned_doctor ? (
                                        <span className="text-text-primary font-medium text-xs flex items-center gap-1">
                                          <Stethoscope className="w-3 h-3 text-indigo-400 shrink-0" />
                                          <span>{perms.assigned_doctor}</span>
                                        </span>
                                      ) : (
                                        <span className="text-text-muted text-[11px]">All clinic / workspace-wide</span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <div className="flex flex-wrap gap-1 max-w-xs">
                                        {perms.can_view_inbox && <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] text-text-secondary">Inbox</span>}
                                        {perms.can_send_messages && <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] text-text-secondary">Send</span>}
                                        {perms.can_manage_bookings && <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] text-text-secondary">Bookings</span>}
                                        {perms.can_view_calendar && <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] text-text-secondary">Calendar</span>}
                                        {perms.can_manage_customers && <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] text-text-secondary">Customers</span>}
                                        {perms.can_manage_marketing && <span className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-medium">Marketing</span>}
                                        {perms.can_view_analytics && <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] text-text-secondary">Overview</span>}
                                        {perms.can_manage_settings && <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] text-text-secondary">Settings</span>}
                                        {activeCount === 0 && <span className="text-text-muted text-[10px]">None</span>}
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                                        member.is_active ? 'text-emerald-400' : 'text-rose-400'
                                      }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${member.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                        <span>{member.is_active ? 'Active' : 'Disabled'}</span>
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-right">
                                      <div className="inline-flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditStaff(member)}
                                          className="p-1 text-text-muted hover:text-text-primary hover:bg-surface rounded transition-colors cursor-pointer"
                                          title="Edit Roles & Permissions"
                                        >
                                          <SlidersHorizontal className="w-3.5 h-3.5 stroke-[1.5]" />
                                        </button>
                                        {member.role !== 'super_admin' && member.role !== 'admin' && (
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteStaff(member.id, member.email)}
                                            className="p-1 text-text-muted hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                                            title="Delete staff credentials"
                                          >
                                            <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                                          </button>
                                        )}
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

                  {/* Drawer Bottom Actions */}
                  <div className="sticky bottom-0 bg-surface/95 backdrop-blur-xs border-t border-border -mx-3.5 sm:-mx-6 -mb-3.5 sm:-mb-6 p-3 sm:p-4 flex items-center justify-between safe-area-pb z-20 shadow-lg mt-6">
                    <button
                      type="button"
                      onClick={() => setEditingConfigTenant(null)}
                      className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle border border-border rounded-sm transition-colors duration-150 cursor-pointer min-h-[44px] flex items-center touch-manipulation"
                    >
                      Cancel
                    </button>

                    {configTab !== 'team' && (
                      <button
                        type="submit"
                        disabled={configSaving}
                        className="px-5 py-2 bg-accent hover:bg-accent-hover text-white font-medium text-xs rounded-sm transition-colors duration-150 cursor-pointer flex items-center gap-2 disabled:opacity-50 min-h-[44px] touch-manipulation shadow-xs"
                      >
                        {configSaving ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin stroke-[1.5]" />
                            <span>Saving configurations...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[1.5]" />
                            <span>Save Configurations</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ONBOARD CLIENT ORGANIZATION ────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-surface border border-border rounded-t-xl sm:rounded-md w-full max-w-xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-subtle safe-area-pb">
            
            {/* Modal Header */}
            <div className="h-12 px-4 sm:px-5 border-b border-border flex items-center justify-between shrink-0 bg-surface">
              <div className="flex items-center gap-2">
                {formData.sales_channel === 'partner' ? (
                  <Globe className="w-4 h-4 text-purple-600 stroke-[1.5]" />
                ) : (
                  <Building2 className="w-4 h-4 text-emerald-600 stroke-[1.5]" />
                )}
                <h3 className="text-xs font-semibold text-text-primary">
                  {formData.sales_channel === 'partner'
                    ? 'Onboard Partner Client Organization (White-Label)'
                    : 'Onboard Direct Client Organization'}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-text-muted hover:text-text-primary rounded-sm transition-colors duration-150 cursor-pointer touch-manipulation"
              >
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            {/* Quick vs Advanced Switcher */}
            <div className="flex border-b border-border bg-surface-subtle/50 px-4 sm:px-5 py-2 items-center justify-between shrink-0">
              <div className="inline-flex p-0.5 bg-surface border border-border rounded-md text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setCreateMode('quick')}
                  className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                    createMode === 'quick' ? 'bg-accent text-white shadow-2xs font-semibold' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Quick Setup (30s)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCreateMode('advanced')}
                  className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                    createMode === 'advanced' ? 'bg-accent text-white shadow-2xs font-semibold' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Full Configuration</span>
                </button>
              </div>
              <span className="text-[11px] text-text-muted hidden sm:inline">
                {createMode === 'quick' ? '3 simple fields with auto defaults' : 'Custom credentials & templates'}
              </span>
            </div>

            {createMode === 'quick' ? (
              <form onSubmit={handleCreateClient} className="p-4 sm:p-5 overflow-y-auto safari-scroll space-y-4 flex-1">
                {formError && (
                  <div className="p-3 bg-status-error-bg border border-status-error-border text-status-error text-xs rounded-sm font-medium">
                    {formError}
                  </div>
                )}

                {/* Sales Channel Selector */}
                <div className="p-1 bg-surface-subtle border border-border rounded-sm grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        sales_channel: 'direct',
                        partner_name: '',
                        partner_share_pct: 0,
                        owner_share_pct: 100,
                      }));
                      setIsAddingNewPartner(false);
                    }}
                    className={`py-1.5 px-2 rounded-xs text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.sales_channel !== 'partner'
                        ? 'bg-white text-emerald-700 shadow-2xs font-semibold border border-border'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span>Direct Client (crm.goboldlabs.com)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const defaultTpl = defaultPartnerTemplate || partnerTemplates[0];
                      setFormData((prev) => ({
                        ...prev,
                        sales_channel: 'partner',
                        partner_name: prev.partner_name || defaultTpl?.partner_name || (existingPartners[0] || ''),
                        partner_share_pct: defaultTpl ? defaultTpl.partner_share_pct : 50,
                        owner_share_pct: defaultTpl ? defaultTpl.owner_share_pct : 50,
                        custom_domain: prev.custom_domain || defaultTpl?.custom_domain || '',
                        brand_name: prev.brand_name || defaultTpl?.brand_name || '',
                      }));
                      if (existingPartners.length === 0 && !defaultTpl) {
                        setIsAddingNewPartner(true);
                      }
                    }}
                    className={`py-1.5 px-2 rounded-xs text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.sales_channel === 'partner'
                        ? 'bg-white text-purple-700 shadow-2xs font-semibold border border-border'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span>Partner Agency Client</span>
                  </button>
                </div>

                {/* 1. Organization Name */}
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    Company / Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Health Clinic"
                    value={formData.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      const slugVal = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      setFormData((prev) => ({
                        ...prev,
                        name: val,
                        slug: slugVal,
                        admin_email: prev.admin_email || (slugVal ? `admin@${slugVal}.com` : ''),
                        admin_password: prev.admin_password || 'BoldAuto2026!',
                      }));
                    }}
                    className="w-full px-3 py-2 bg-surface-subtle border border-border rounded-md text-xs font-medium text-text-primary focus:bg-white focus:border-accent transition-colors"
                  />
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Identifier slug: <span className="font-mono text-text-primary font-semibold">{formData.slug || 'apex-health'}</span>
                  </p>
                </div>

                {/* 2. Admin WhatsApp Number */}
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1 flex items-center justify-between">
                    <span>Admin Mobile / WhatsApp Number *</span>
                    <span className="text-[10px] font-normal text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Receives Login & Setup Message
                    </span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.admin_whatsapp_number}
                      onChange={(e) => setFormData({ ...formData, admin_whatsapp_number: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-surface-subtle border border-border rounded-md text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors"
                    />
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    We'll generate a 1-click WhatsApp message to send credentials directly to this number.
                  </p>
                </div>

                {/* 3. Admin Account Email */}
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    Admin Login Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="admin@clientclinic.com"
                      value={formData.admin_email}
                      onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-surface-subtle border border-border rounded-md text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors"
                    />
                  </div>
                </div>

                {/* 4. Industry Preset Selection */}
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">
                    Select Industry Template (Auto-Configures AI Agent & Taxonomy)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {ONBOARDING_INDUSTRY_PRESETS.map((preset) => {
                      const PresetIcon = preset.icon;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => {
                            setSelectedIndustryPreset(preset.id);
                            setFormData((prev) => ({
                              ...prev,
                              assistant_name: preset.assistant_name,
                              bot_goal: preset.bot_goal,
                            }));
                          }}
                          className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                            selectedIndustryPreset === preset.id
                              ? 'bg-accent/5 border-accent shadow-2xs ring-1 ring-accent/30'
                              : 'bg-surface-subtle border border-border hover:border-border-hover'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <PresetIcon className="w-5 h-5 text-text-primary stroke-[1.5] shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-text-primary leading-tight">{preset.label}</p>
                              <p className="text-[10px] text-text-muted mt-0.5 leading-tight line-clamp-1">{preset.assistant_name} • {preset.taxonomy_role}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pricing & Plan Confirmation Notice */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-md text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900">Subscription Plan:</span>
                    <span className="font-mono font-bold text-emerald-800">Full Suite @ ₹2,630 / month</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Recurring plan <span className="font-mono font-bold">plan_TeIaa7OueqVKIK</span> auto-linked. Client can connect WhatsApp in 1 click after login.
                  </p>
                </div>

                {/* Modal Actions */}
                <div className="pt-3 border-t border-border flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3.5 py-2 text-xs font-medium text-text-secondary hover:text-text-primary cursor-pointer min-h-[44px] flex items-center touch-manipulation"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 min-h-[44px] shadow-sm touch-manipulation"
                  >
                    {formSubmitting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>Provision Client Workspace</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreateClient} className="p-4 sm:p-5 overflow-y-auto safari-scroll space-y-3.5 flex-1">
              {formError && (
                <div className="p-3 bg-status-error-bg border border-status-error-border text-status-error text-xs rounded-sm font-medium">
                  {formError}
                </div>
              )}

              {/* Segmented Sales Channel Mode Switcher */}
              <div className="p-1 bg-surface-subtle border border-border rounded-sm grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      sales_channel: 'direct',
                      partner_name: '',
                      partner_share_pct: 0,
                      owner_share_pct: 100,
                    }));
                    setIsAddingNewPartner(false);
                  }}
                  className={`py-1.5 px-2 rounded-xs text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.sales_channel !== 'partner'
                      ? 'bg-white text-emerald-700 shadow-2xs font-semibold border border-border'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span>My Direct Client</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const defaultTpl = defaultPartnerTemplate || partnerTemplates[0];
                    setFormData((prev) => ({
                      ...prev,
                      sales_channel: 'partner',
                      partner_name: prev.partner_name || defaultTpl?.partner_name || (existingPartners[0] || ''),
                      partner_share_pct: defaultTpl ? defaultTpl.partner_share_pct : 50,
                      owner_share_pct: defaultTpl ? defaultTpl.owner_share_pct : 50,
                      custom_domain: prev.custom_domain || defaultTpl?.custom_domain || '',
                      brand_name: prev.brand_name || defaultTpl?.brand_name || '',
                    }));
                    if (existingPartners.length === 0 && !defaultTpl) {
                      setIsAddingNewPartner(true);
                    }
                  }}
                  className={`py-1.5 px-2 rounded-xs text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.sales_channel === 'partner'
                      ? 'bg-white text-purple-700 shadow-2xs font-semibold border border-border'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span>Partner Agency Client</span>
                </button>
              </div>

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

              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Admin Name (e.g. Dr. Sameer / Bhuvanesh)</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Sameer"
                  value={formData.admin_name}
                  onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                />
                <p className="text-[11px] text-text-muted mt-0.5">Admin user display name shown in CRM header and alert notifications.</p>
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

              {/* Plan, Custom Pricing & Sales Channel */}
              <div className="space-y-3 p-3.5 bg-surface-subtle/70 rounded-md border border-border">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-accent" />
                  <span>Feature Plan, Custom Pricing & Sales Channel</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">Feature Suite Plan</label>
                    <select
                      value={formData.plan}
                      onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-border rounded-sm text-xs font-sans text-text-primary focus:border-accent transition-colors duration-150 cursor-pointer"
                    >
                      <option value="full_suite">Full Suite (Automation + Reviews)</option>
                      <option value="automation_only">WhatsApp Automation Only</option>
                      <option value="review_only">AI Review System Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">Custom Monthly Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="3499"
                      value={formData.monthly_price}
                      onChange={(e) => setFormData({ ...formData, monthly_price: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-border rounded-sm text-xs font-mono tabular-nums text-text-primary focus:border-accent transition-colors duration-150"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">Sales Channel</label>
                    <select
                      value={formData.sales_channel}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          sales_channel: val,
                          partner_share_pct: val === 'partner' ? 50 : 0,
                          owner_share_pct: val === 'partner' ? 50 : 100,
                        });
                        if (val === 'partner' && existingPartners.length === 0) {
                          setIsAddingNewPartner(true);
                        }
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-border rounded-sm text-xs font-sans text-text-primary focus:border-accent transition-colors duration-150 cursor-pointer"
                    >
                      <option value="direct">Direct Sales ("My Client - 100% Boldlabs")</option>
                      <option value="partner">Partner Agency ("White-Label Partner")</option>
                    </select>
                  </div>
                </div>

                {formData.sales_channel === 'partner' && (
                  <div className="p-3.5 bg-purple-500/5 rounded-md border border-purple-500/20 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-purple-600" />
                        <span>Partner Agency Assignment</span>
                      </label>
                      {existingPartners.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingNewPartner(!isAddingNewPartner);
                            if (!isAddingNewPartner) setNewPartnerNameInput('');
                          }}
                          className="text-[11px] text-purple-600 dark:text-purple-400 font-medium hover:underline cursor-pointer"
                        >
                          {isAddingNewPartner ? '← Pick existing partner agency' : '+ Add new partner agency'}
                        </button>
                      )}
                    </div>

                    {existingPartners.length > 0 && !isAddingNewPartner ? (
                      <div>
                        <select
                          value={formData.partner_name}
                          onChange={(e) => {
                            if (e.target.value === '__add_new__') {
                              setIsAddingNewPartner(true);
                              setNewPartnerNameInput('');
                            } else {
                              const selectedName = e.target.value;
                              const matchingTpl = partnerTemplates.find(
                                (t) => t.partner_name.toLowerCase() === selectedName.toLowerCase()
                              );
                              setFormData((prev) => ({
                                ...prev,
                                partner_name: selectedName,
                                partner_share_pct: matchingTpl ? matchingTpl.partner_share_pct : prev.partner_share_pct,
                                owner_share_pct: matchingTpl ? matchingTpl.owner_share_pct : prev.owner_share_pct,
                                custom_domain: matchingTpl?.custom_domain || prev.custom_domain,
                                brand_name: matchingTpl?.brand_name || prev.brand_name,
                              }));
                            }
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-border rounded-sm text-xs font-medium text-text-primary focus:border-accent cursor-pointer"
                        >
                          <option value="" disabled>Select partner agency...</option>
                          {existingPartners.map((p) => {
                            const hasTpl = partnerTemplates.some((t) => t.partner_name.toLowerCase() === p.toLowerCase());
                            return (
                              <option key={p} value={p}>
                                {p} {hasTpl ? '(Preset Template Available)' : ''}
                              </option>
                            );
                          })}
                          <option value="__add_new__">+ Add new partner agency...</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="text"
                          required={formData.sales_channel === 'partner'}
                          placeholder="Partner Agency Name * (e.g. Apex Media Group)"
                          value={isAddingNewPartner ? newPartnerNameInput : formData.partner_name}
                          onChange={(e) => {
                            if (isAddingNewPartner) {
                              setNewPartnerNameInput(e.target.value);
                            } else {
                              setFormData({ ...formData, partner_name: e.target.value });
                            }
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-border rounded-sm text-xs text-text-primary focus:border-accent"
                        />
                        <p className="text-[10px] text-text-muted mt-1">
                          This partner company will be saved and available for future client assignments.
                        </p>
                      </div>
                    )}

                    {/* Applied Template Indicator */}
                    {(() => {
                      const curName = (isAddingNewPartner ? newPartnerNameInput : formData.partner_name || '').trim();
                      const activeTpl = partnerTemplates.find(
                        (t) => t.partner_name.toLowerCase() === curName.toLowerCase()
                      ) || (partnerTemplates.length === 1 ? partnerTemplates[0] : null);

                      if (activeTpl) {
                        return (
                          <div className="flex items-center justify-between px-2.5 py-1.5 bg-purple-500/10 rounded border border-purple-500/20 text-xs">
                            <div className="flex items-center gap-1.5 text-purple-900 dark:text-purple-200">
                              <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span>
                                Preset Applied: <strong>{activeTpl.partner_name}</strong> (Domain: <code>{activeTpl.custom_domain || 'Platform default'}</code> • {activeTpl.partner_share_pct}/{activeTpl.owner_share_pct} Split)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenPartnerTemplateModal(activeTpl)}
                              className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 hover:underline cursor-pointer shrink-0 ml-2"
                            >
                              Edit Preset
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Revenue Split */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                          Partner Share %
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={formData.partner_share_pct}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setFormData({ ...formData, partner_share_pct: val, owner_share_pct: 100 - val });
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-border rounded-sm text-xs font-mono text-text-primary focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                          Your (Owner) Share %
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={formData.owner_share_pct}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setFormData({ ...formData, owner_share_pct: val, partner_share_pct: 100 - val });
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-border rounded-sm text-xs font-mono text-text-primary focus:border-accent"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 bg-white rounded border border-purple-500/20 text-[11px] font-mono flex items-center justify-between">
                      <span className="text-text-muted">On ₹{(formData.monthly_price || 0).toLocaleString('en-IN')}/mo:</span>
                      <span className="text-purple-700 dark:text-purple-300">Partner: ₹{((formData.monthly_price || 0) * (formData.partner_share_pct / 100)).toLocaleString('en-IN')}</span>
                      <span className="text-emerald-700 dark:text-emerald-300 font-semibold">Your Net: ₹{((formData.monthly_price || 0) * (formData.owner_share_pct / 100)).toLocaleString('en-IN')}</span>
                    </div>

                    {/* White-Label Custom Domain Setup (Optional) */}
                    <div className="pt-2 border-t border-purple-500/20 space-y-2">
                      <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-sky-500" />
                        <span>White-Label Custom Domain & Brand (Optional)</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <input
                            type="text"
                            placeholder="e.g. crm.partnerclinic.com"
                            value={formData.custom_domain}
                            onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value.toLowerCase().trim() })}
                            className="w-full px-2.5 py-1.5 bg-white border border-border rounded-sm text-xs font-mono text-text-primary placeholder:text-text-muted focus:border-accent"
                          />
                          <p className="text-[10px] text-text-muted mt-0.5">CNAME crm &rarr; cname.vercel-dns.com</p>
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Brand Name (e.g. Acme Health CRM)"
                            value={formData.brand_name}
                            onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border border-border rounded-sm text-xs text-text-primary placeholder:text-text-muted focus:border-accent"
                          />
                          <p className="text-[10px] text-text-muted mt-0.5">Overrides Boldlabs in portal header</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {formData.sales_channel !== 'partner' && (
                  <div className="p-2.5 bg-emerald-500/10 rounded border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Direct sales: You retain <strong>100%</strong> of client subscription revenue (₹{(formData.monthly_price || 0).toLocaleString('en-IN')}/mo).</span>
                  </div>
                )}
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
                  className="px-3.5 py-2 text-xs font-medium text-text-secondary hover:text-text-primary cursor-pointer min-h-[44px] flex items-center touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 min-h-[44px] touch-manipulation"
                >
                  {formSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin stroke-[1.5]" /> : <Plus className="w-3.5 h-3.5 stroke-[1.5]" />}
                  <span>Provision Organization</span>
                </button>
              </div>
            </form>
            )}

          </div>
        </div>
      )}

      {/* ── MODAL: CLIENT PROVISIONED SUCCESS & WHATSAPP WELCOME ─────────────────── */}
      {createdClient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">
                    Client Organization Provisioned!
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Workspace is live on <span className="font-semibold text-text-primary">{createdClient.slug}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreatedClient(null)}
                className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-subtle cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Credentials Card */}
            <div className="p-4 bg-surface-subtle border border-border rounded-lg space-y-2.5">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-border/60">
                <span className="font-semibold text-text-secondary">Login Portal URL:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-accent font-semibold">https://crm.goboldlabs.com/login</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('https://crm.goboldlabs.com/login');
                      setCopiedField('portal_url');
                      setTimeout(() => setCopiedField(null), 2000);
                    }}
                    className="p-1 text-text-muted hover:text-text-primary cursor-pointer"
                    title="Copy URL"
                  >
                    {copiedField === 'portal_url' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pb-2 border-b border-border/60">
                <span className="font-semibold text-text-secondary">Username / Email:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-text-primary">{createdClient.admin_email}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdClient.admin_email);
                      setCopiedField('email');
                      setTimeout(() => setCopiedField(null), 2000);
                    }}
                    className="p-1 text-text-muted hover:text-text-primary cursor-pointer"
                    title="Copy Email"
                  >
                    {copiedField === 'email' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-text-secondary">Initial Password:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-text-primary bg-white px-2 py-0.5 rounded border border-border">
                    {createdClient.password || 'BoldAuto2026!'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdClient.password || 'BoldAuto2026!');
                      setCopiedField('password');
                      setTimeout(() => setCopiedField(null), 2000);
                    }}
                    className="p-1 text-text-muted hover:text-text-primary cursor-pointer"
                    title="Copy Password"
                  >
                    {copiedField === 'password' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            {/* 1-Click WhatsApp Welcome Dispatch */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-text-primary">
                1-Click Welcome & Onboarding Guide for Client
              </label>
              {(() => {
                const welcomeMsg = `*Welcome to your AI WhatsApp Automation CRM!*\n\nYour organization workspace (*${createdClient.name}*) is live and ready.\n\n*Login Portal:* https://crm.goboldlabs.com/login\n*Username:* ${createdClient.admin_email}\n*Password:* ${createdClient.password || 'BoldAuto2026!'}\n\n*Quick 3-step setup once logged in:*\n1. Click *"1-Click WhatsApp Connect"* to link your WhatsApp Business number\n2. Connect Google Calendar for automated appointment bookings\n3. Send a test ping to verify your AI persona!\n\nNeed assistance? Reply directly to this message.`;
                const cleanPhone = (createdClient.admin_whatsapp_number || '').replace(/\D/g, '');
                const waUrl = cleanPhone
                  ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(welcomeMsg)}`
                  : `https://wa.me/?text=${encodeURIComponent(welcomeMsg)}`;

                return (
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-lg text-xs font-mono text-emerald-950 whitespace-pre-wrap max-h-36 overflow-y-auto">
                      {welcomeMsg}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 fill-current" />
                        <span>Share on WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(welcomeMsg);
                          setWelcomeMsgCopied(true);
                          setTimeout(() => setWelcomeMsgCopied(false), 2500);
                        }}
                        className="py-2.5 px-4 bg-surface hover:bg-surface-subtle text-text-primary border border-border text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        {welcomeMsgCopied ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Copied to Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-text-muted" />
                            <span>Copy Message</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 border-t border-border flex items-center justify-end">
              <button
                type="button"
                onClick={() => setCreatedClient(null)}
                className="px-4 py-2 bg-surface-subtle hover:bg-border text-text-primary text-xs font-semibold rounded-md transition-colors cursor-pointer"
              >
                Close & View Organization
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: RESET CLIENT PASSWORD & ACCESS CREDENTIALS ────────────────────────────── */}
      {resetTenantId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-surface border border-border rounded-t-xl sm:rounded-lg w-full max-w-md max-h-[92dvh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl safe-area-pb">
            <div className="h-12 px-4 sm:px-5 border-b border-border flex items-center justify-between bg-surface-subtle shrink-0">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-accent stroke-[1.5]" />
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Client Access & Credentials
                </h3>
              </div>
              <button
                onClick={() => {
                  setResetTenantId(null);
                  setResetSuccess(false);
                  setResetError('');
                }}
                className="p-1.5 text-text-muted hover:text-text-primary rounded-sm transition-colors duration-150 cursor-pointer touch-manipulation"
              >
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-4 sm:p-5 space-y-4 overflow-y-auto safari-scroll flex-1">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div>
                  <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold block">Organization</span>
                  <span className="text-sm font-bold text-slate-950 dark:text-slate-100">{resetTenantName}</span>
                </div>
                <a
                  href={`https://${resetTenantDomain || 'crm.goboldlabs.com'}/login`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-accent hover:underline bg-accent/10 border border-accent/20 rounded"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>{resetTenantDomain || 'crm.goboldlabs.com'}/login</span>
                </a>
              </div>

              {/* Login Email / Username Box - Visible Solid Black Text */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                  Client Username / Login Email
                </label>
                <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-md">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Mail className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 shrink-0" />
                    <span className="text-xs font-mono font-bold text-slate-950 dark:text-slate-100 select-all truncate">
                      {resetTenantEmail || 'admin@client.com'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(resetTenantEmail);
                      setCopiedField('login_email');
                      setTimeout(() => setCopiedField(null), 2000);
                    }}
                    className="p-1 text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white rounded transition-colors cursor-pointer"
                    title="Copy Username"
                  >
                    {copiedField === 'login_email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* New Password Input Box - Visible Solid Black Text */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                    Set Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
                      let pwd = '';
                      for (let i = 0; i < 10; i++) {
                        pwd += chars.charAt(Math.floor(Math.random() * chars.length));
                      }
                      setNewPassword(pwd);
                      setShowResetPasswordText(true);
                    }}
                    className="text-[11px] font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Random</span>
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showResetPasswordText ? 'text' : 'password'}
                    required
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-3 pr-16 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-mono font-bold text-slate-950 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowResetPasswordText(!showResetPasswordText)}
                      className="p-1 text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                      title={showResetPasswordText ? 'Hide password' : 'Show password'}
                    >
                      {showResetPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    {newPassword && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(newPassword);
                          setCopiedField('new_password');
                          setTimeout(() => setCopiedField(null), 2000);
                        }}
                        className="p-1 text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                        title="Copy Password"
                      >
                        {copiedField === 'new_password' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {resetError && (
                <div className="p-3 bg-status-error-bg border border-status-error-border text-status-error text-xs rounded-md font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 stroke-[1.5]" />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-slate-950 dark:text-emerald-100 text-xs rounded-md space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Password updated successfully!</span>
                  </div>
                  <p className="text-[11px] text-slate-800 dark:text-slate-200">
                    Client credentials ready. You can copy full login details below:
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const loginUrl = `https://${resetTenantDomain || 'crm.goboldlabs.com'}/login`;
                      const text = `Organization: ${resetTenantName}\nLogin Portal: ${loginUrl}\nUsername: ${resetTenantEmail}\nPassword: ${newPassword}`;
                      navigator.clipboard.writeText(text);
                      setCopiedField('all_creds');
                      setTimeout(() => setCopiedField(null), 2000);
                    }}
                    className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {copiedField === 'all_creds' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'all_creds' ? 'Copied Full Credentials!' : 'Copy Full Login Details'}</span>
                  </button>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setResetTenantId(null);
                    setResetSuccess(false);
                    setResetError('');
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary rounded cursor-pointer"
                >
                  {resetSuccess ? 'Close' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword || !newPassword || newPassword.length < 6}
                  className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded transition-colors duration-150 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {resettingPassword ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{resettingPassword ? 'Updating...' : (resetSuccess ? 'Update Again' : 'Save Password')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: DELETE CONFIRMATION ────────────────────────────────────────── */}
      {deleteTenantTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-surface border border-border rounded-t-xl sm:rounded-md w-full max-w-sm overflow-hidden shadow-2xl safe-area-pb">
            <div className="h-12 px-4 sm:px-5 border-b border-border flex items-center justify-between bg-surface shrink-0">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-status-error stroke-[1.5]" />
                <h3 className="text-xs font-semibold text-text-primary">
                  Delete Organization
                </h3>
              </div>
              <button
                onClick={() => setDeleteTenantTarget(null)}
                className="p-1.5 text-text-muted hover:text-text-primary rounded-sm transition-colors duration-150 cursor-pointer touch-manipulation"
              >
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3">
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
                  className="px-3.5 py-2 text-xs font-medium text-text-secondary hover:text-text-primary cursor-pointer min-h-[44px] flex items-center touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deletingTenant}
                  onClick={handleDeleteTenant}
                  className="px-4 py-2 bg-status-error hover:bg-status-error text-white text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 min-h-[44px] touch-manipulation"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-surface border border-border rounded-t-xl sm:rounded-lg w-full max-w-lg max-h-[92dvh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl safe-area-pb">
            <div className="min-h-[3.5rem] p-3 sm:px-5 sm:h-14 border-b border-border flex items-center justify-between bg-surface shrink-0 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-text-primary truncate">
                    Payment Link: {activePaymentModalTenant.name}
                  </h3>
                  <p className="text-[10px] text-text-muted truncate">
                    {activePaymentModalTenant.razorpay_subscription_id?.startsWith('plink_')
                      ? `Payment Link #${activePaymentModalTenant.razorpay_subscription_id}`
                      : `Subscription #${activePaymentModalTenant.razorpay_subscription_id || 'Not Generated'}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActivePaymentModalTenant(null)}
                className="p-1.5 text-text-muted hover:text-text-primary rounded-sm transition-colors duration-150 cursor-pointer touch-manipulation shrink-0"
              >
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto safari-scroll flex-1">
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-md text-xs text-purple-900 dark:text-purple-300 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Ready for Client Activation (₹{(activePaymentModalTenant.monthly_price || 3499).toLocaleString()}/mo)</span>
                </p>
                <p className="text-text-secondary text-[11px] leading-relaxed">
                  The client workspace is fully configured. Send this secure checkout link to the client/owner to complete their monthly subscription.
                </p>
              </div>

              {/* Payment Link Display */}
              {activePaymentModalTenant.razorpay_short_url ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-text-primary">
                    Live Razorpay Payment Link
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
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-sm text-xs font-medium transition-colors duration-150 cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      {copiedLink === 'modal' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink === 'modal' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-surface-subtle border border-border rounded text-center space-y-2">
                  <p className="text-xs text-text-muted">No payment link generated yet for this organization.</p>
                  <button
                    type="button"
                    disabled={activatingBillingId === activePaymentModalTenant.id}
                    onClick={() => handleActivateBilling(activePaymentModalTenant, true, clientPaymentPhone)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold cursor-pointer"
                  >
                    {activatingBillingId === activePaymentModalTenant.id ? 'Generating...' : 'Generate Razorpay Link Now'}
                  </button>
                </div>
              )}

              {/* Client Personal Phone Section */}
              <div className="space-y-2 pt-1 border-t border-border">
                <label className="block text-xs font-medium text-text-primary flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-accent" />
                    <span>Client Personal WhatsApp Phone (Owner / Doctor)</span>
                  </span>
                  <span className="text-[10px] text-text-muted">For Billing & Alerts</span>
                </label>
                <input
                  type="text"
                  placeholder="+919876543210"
                  value={clientPaymentPhone}
                  onChange={(e) => setClientPaymentPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary font-mono"
                />
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Important distinction:</strong> This is the client/owner&apos;s personal WhatsApp phone to receive invoices and payments. It is <strong>different</strong> from their customer-facing WhatsApp automation bot number.
                  </span>
                </div>
              </div>

              {/* Send Actions */}
              {activePaymentModalTenant.razorpay_short_url && (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-medium text-text-primary">
                    Send Link to Client
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Send via WhatsApp */}
                    <button
                      type="button"
                      onClick={() => {
                        const cleanPhone = clientPaymentPhone.replace(/\D/g, '');
                        if (!cleanPhone) {
                          triggerErrorNotice('Please enter the client personal WhatsApp phone number above.');
                          return;
                        }
                        const priceStr = (activePaymentModalTenant.monthly_price || 3499).toLocaleString();
                        const msg = `Hello ${activePaymentModalTenant.name},\n\nYour AI WhatsApp Automation System with Boldlabs is now fully setup and ready!\n\nYou can review and activate your monthly subscription (${activePaymentModalTenant.plan?.toUpperCase() || 'PRO'} - ₹${priceStr}/month) using your secure Razorpay checkout link below:\n\nPayment Link: ${activePaymentModalTenant.razorpay_short_url}\n\nPlease let us know once completed so we can confirm your live activation. Thank you!`;
                        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      className="px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs min-h-[44px] touch-manipulation"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Send via WhatsApp</span>
                    </button>

                    {/* Send via Email */}
                    <a
                      href={`mailto:${activePaymentModalTenant.admin_email || ''}?subject=${encodeURIComponent(`Your AI WhatsApp Automation System is Ready - ${activePaymentModalTenant.name}`)}&body=${encodeURIComponent(`Hello ${activePaymentModalTenant.name},\n\nYour AI WhatsApp Automation System with Boldlabs is now fully setup and ready!\n\nYou can review and activate your monthly subscription (${activePaymentModalTenant.plan?.toUpperCase() || 'PRO'} - ₹${(activePaymentModalTenant.monthly_price || 3499).toLocaleString()}/month) using your secure Razorpay checkout link below:\n\n${activePaymentModalTenant.razorpay_short_url}\n\nPlease let us know once completed so we can confirm your live activation.\n\nBest regards,\nBoldlabs Team`)}`}
                      className="px-3 py-2.5 bg-surface hover:bg-surface-subtle text-text-primary border border-border rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs text-center min-h-[44px] flex items-center touch-manipulation"
                    >
                      <Mail className="w-3.5 h-3.5 text-text-muted" />
                      <span>Send via Email</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-3 border-t border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  {activePaymentModalTenant.razorpay_short_url && (
                    <a
                      href={activePaymentModalTenant.razorpay_short_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-medium min-h-[38px]"
                    >
                      <span>Test Checkout</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    type="button"
                    disabled={activatingBillingId === activePaymentModalTenant.id}
                    onClick={() => handleActivateBilling(activePaymentModalTenant, true, clientPaymentPhone)}
                    className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary underline cursor-pointer disabled:opacity-50 min-h-[38px]"
                    title="Generate a brand new live payment link"
                  >
                    <RefreshCw className={`w-3 h-3 ${activatingBillingId === activePaymentModalTenant.id ? 'animate-spin' : ''}`} />
                    <span>Regenerate</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePaymentModalTenant(null)}
                  className="px-4 py-2 bg-surface-subtle hover:bg-surface border border-border text-xs font-medium text-text-primary rounded-sm transition-colors cursor-pointer ml-auto min-h-[44px] flex items-center touch-manipulation"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-surface border border-border rounded-t-xl sm:rounded-lg w-full max-w-2xl max-h-[92dvh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl safe-area-pb">
            <div className="min-h-[3.5rem] p-3 sm:px-5 sm:h-14 border-b border-border flex items-center justify-between bg-surface shrink-0 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-accent stroke-[1.5] shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-text-primary truncate">
                    Invoices: {viewingInvoicesTenant.name}
                  </h3>
                  <p className="text-[10px] text-text-muted truncate">
                    Sub ID: {viewingInvoicesTenant.razorpay_subscription_id || 'None'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleSyncBilling(viewingInvoicesTenant).then(() => handleViewInvoices(viewingInvoicesTenant))}
                  disabled={syncingBillingId === viewingInvoicesTenant.id}
                  className="px-2.5 py-1 text-xs bg-surface-subtle hover:bg-surface border border-border rounded-sm text-text-secondary flex items-center gap-1 cursor-pointer min-h-[36px]"
                  title="Sync with Razorpay"
                >
                  <RefreshCw className={`w-3 h-3 ${syncingBillingId === viewingInvoicesTenant.id ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Sync Invoices</span>
                </button>
                <button
                  onClick={() => setViewingInvoicesTenant(null)}
                  className="p-1.5 text-text-muted hover:text-text-primary rounded-sm transition-colors duration-150 cursor-pointer touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  <X className="w-4 h-4 stroke-[1.5]" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-4 max-h-[75dvh] overflow-y-auto safari-scroll flex-1">
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
                <div className="overflow-x-auto safari-scroll touch-scroll border border-border rounded-sm">
                  <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
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
                                <span>Receipt</span>
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT STAFF MEMBER MODAL ── */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-surface border border-border rounded-t-xl sm:rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh] safe-area-pb">
            <div className="p-3.5 sm:p-4 border-b border-border flex items-center justify-between bg-surface-subtle shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-text-primary">
                  {editingStaff ? 'Edit Staff Credentials & Access' : 'Create Staff Credential'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStaffModal(false)}
                className="text-text-muted hover:text-text-primary p-1.5 rounded transition-colors cursor-pointer touch-manipulation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="flex-1 overflow-y-auto safari-scroll p-4 sm:p-5 space-y-4 text-xs">
              {staffError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{staffError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary font-medium mb-1">
                    Display Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={staffForm.display_name}
                    onChange={(e) => setStaffForm({ ...staffForm, display_name: e.target.value })}
                    placeholder="e.g. Dr. Sarah Mitchell / Priya"
                    className="w-full px-3 py-1.5 bg-surface border border-border rounded text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-text-secondary font-medium mb-1">
                    Login Email <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    disabled={!!editingStaff}
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    placeholder="staff@clinic.com"
                    className="w-full px-3 py-1.5 bg-surface border border-border rounded text-text-primary focus:border-accent focus:outline-none disabled:opacity-60 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">
                  {editingStaff ? 'New Password (leave blank to keep unchanged)' : 'Initial Password'} <span className={editingStaff ? 'text-text-muted' : 'text-rose-400'}>{editingStaff ? '' : '*'}</span>
                </label>
                <input
                  type="password"
                  required={!editingStaff}
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  placeholder={editingStaff ? 'Leave blank to keep existing password' : '••••••••'}
                  className="w-full px-3 py-1.5 bg-surface border border-border rounded text-text-primary focus:border-accent focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-text-secondary font-medium mb-1">
                    Assigned Role Preset
                  </label>
                  <select
                    value={staffForm.role}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setStaffForm({
                        ...staffForm,
                        role: newRole,
                        permissions: getRoleDefaultPermissions(newRole, staffForm.permissions.assigned_doctor),
                      });
                    }}
                    className="w-full px-3 py-1.5 bg-surface border border-border rounded text-text-primary focus:border-accent focus:outline-none"
                  >
                    <option value="admin">Administrator (Full Access)</option>
                    <option value="sales">Sales Executive / Business Consultant</option>
                    <option value="doctor">Doctor / Practitioner</option>
                    <option value="receptionist">Receptionist / Front Desk</option>
                    <option value="agent">Support Agent (Chats Only)</option>
                    <option value="viewer">Viewer (Read-Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-text-secondary font-medium mb-1">
                    Assigned Doctor Filter
                  </label>
                  <select
                    value={staffForm.permissions.assigned_doctor || ''}
                    onChange={(e) => {
                      setStaffForm({
                        ...staffForm,
                        permissions: {
                          ...staffForm.permissions,
                          assigned_doctor: e.target.value,
                        }
                      });
                    }}
                    className="w-full px-3 py-1.5 bg-surface border border-border rounded text-text-primary focus:border-accent focus:outline-none"
                  >
                    <option value="">None / Clinic-wide (All Doctors)</option>
                    {(((configForm as any).doctors || configForm.taxonomy?.doctor_presets || []) as string[]).map((doc: string) => (
                      <option key={doc} value={doc}>{doc}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Granular Permissions Section */}
              <div className="pt-2 border-t border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-text-primary font-semibold uppercase tracking-wider text-[11px]">
                    Granular Permission Controls
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStaffForm({
                          ...staffForm,
                          permissions: {
                            ...staffForm.permissions,
                            can_view_inbox: true,
                            can_send_messages: true,
                            can_manage_bookings: true,
                            can_view_calendar: true,
                            can_manage_customers: true,
                            can_manage_marketing: true,
                            can_view_analytics: true,
                            can_manage_settings: true,
                          }
                        });
                      }}
                      className="text-[10px] text-accent hover:underline font-medium cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-text-muted text-[10px]">&bull;</span>
                    <button
                      type="button"
                      onClick={() => {
                        setStaffForm({
                          ...staffForm,
                          permissions: getRoleDefaultPermissions(staffForm.role, staffForm.permissions.assigned_doctor),
                        });
                      }}
                      className="text-[10px] text-text-muted hover:text-text-primary font-medium cursor-pointer"
                    >
                      Role Defaults
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-surface-subtle/60 p-3 rounded border border-border">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={staffForm.permissions.can_view_inbox ?? true}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setStaffForm({
                          ...staffForm,
                          permissions: {
                            ...staffForm.permissions,
                            can_view_inbox: checked,
                            ...(checked ? {} : { can_send_messages: false }),
                          },
                        });
                      }}
                      className="rounded border-border text-accent focus:ring-0"
                    />
                    <span className="text-text-primary font-medium">View Inbox & Chats</span>
                  </label>

                  <label className={`flex items-center gap-2 select-none ${
                    !(staffForm.permissions.can_view_inbox ?? true)
                      ? 'opacity-40 cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}>
                    <input
                      type="checkbox"
                      disabled={!(staffForm.permissions.can_view_inbox ?? true)}
                      checked={
                        !(staffForm.permissions.can_view_inbox ?? true)
                          ? false
                          : (staffForm.permissions.can_send_messages ?? true)
                      }
                      onChange={(e) => setStaffForm({
                        ...staffForm,
                        permissions: { ...staffForm.permissions, can_send_messages: e.target.checked }
                      })}
                      className="rounded border-border text-accent focus:ring-0 disabled:cursor-not-allowed"
                    />
                    <span className="text-text-primary font-medium flex items-center gap-1">
                      Send Outbound Messages
                      {!(staffForm.permissions.can_view_inbox ?? true) && (
                        <span className="text-[10px] text-text-muted font-normal italic">(Requires Inbox)</span>
                      )}
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={staffForm.permissions.can_manage_bookings ?? true}
                      onChange={(e) => setStaffForm({
                        ...staffForm,
                        permissions: { ...staffForm.permissions, can_manage_bookings: e.target.checked }
                      })}
                      className="rounded border-border text-accent focus:ring-0"
                    />
                    <span className="text-text-primary font-medium">Manage Bookings</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={staffForm.permissions.can_view_calendar ?? true}
                      onChange={(e) => setStaffForm({
                        ...staffForm,
                        permissions: { ...staffForm.permissions, can_view_calendar: e.target.checked }
                      })}
                      className="rounded border-border text-accent focus:ring-0"
                    />
                    <span className="text-text-primary font-medium">View Calendar & Schedules</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={staffForm.permissions.can_manage_customers ?? false}
                      onChange={(e) => setStaffForm({
                        ...staffForm,
                        permissions: { ...staffForm.permissions, can_manage_customers: e.target.checked }
                      })}
                      className="rounded border-border text-accent focus:ring-0"
                    />
                    <span className="text-text-primary font-medium">Manage Customer Directory</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={staffForm.permissions.can_manage_marketing ?? false}
                      onChange={(e) => setStaffForm({
                        ...staffForm,
                        permissions: { ...staffForm.permissions, can_manage_marketing: e.target.checked }
                      })}
                      className="rounded border-border text-accent focus:ring-0"
                    />
                    <span className="text-text-primary font-medium">Marketing & Broadcasts</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={staffForm.permissions.can_view_analytics ?? false}
                      onChange={(e) => setStaffForm({
                        ...staffForm,
                        permissions: { ...staffForm.permissions, can_view_analytics: e.target.checked }
                      })}
                      className="rounded border-border text-accent focus:ring-0"
                    />
                    <span className="text-text-primary font-medium">View Overview Dashboard</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={staffForm.permissions.can_manage_settings ?? false}
                      onChange={(e) => setStaffForm({
                        ...staffForm,
                        permissions: { ...staffForm.permissions, can_manage_settings: e.target.checked }
                      })}
                      className="rounded border-border text-accent focus:ring-0"
                    />
                    <span className="text-text-primary font-medium">Manage Workspace Settings</span>
                  </label>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <div>
                  <span className="text-text-primary font-medium">Login Access Active</span>
                  <p className="text-[11px] text-text-muted">Disable to temporarily revoke this member&apos;s ability to log in.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStaffForm({ ...staffForm, is_active: !staffForm.is_active })}
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                    staffForm.is_active ? 'bg-emerald-600 justify-end' : 'bg-surface-subtle border border-border justify-start'
                  }`}
                >
                  <span className="w-4 h-4 bg-white rounded-full shadow-xs block" />
                </button>
              </div>

              {/* Actions */}
              <div className="sticky bottom-0 bg-surface/95 backdrop-blur-xs border-t border-border -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 p-3 sm:p-4 flex items-center justify-end gap-2 safe-area-pb z-10 shadow-lg mt-4">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-3.5 py-2 text-xs text-text-muted hover:text-text-primary border border-border rounded transition-colors cursor-pointer min-h-[44px] flex items-center touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={staffSaving}
                  className="px-4 py-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold text-xs rounded transition-colors cursor-pointer flex items-center gap-1.5 min-h-[44px] touch-manipulation shadow-xs"
                >
                  {staffSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingStaff ? 'Save Changes' : 'Create Staff / Sales Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          PARTNER AGENCY TEMPLATE & WHITE-LABEL PRESET MODAL
          ══════════════════════════════════════════════════════════════════════════ */}
      {showPartnerTemplateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-surface border border-border rounded-lg shadow-xl w-full max-w-2xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-purple-500/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-600">
                  <SlidersHorizontal className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                    <span>Partner Agency Template & White-Label Preset</span>
                    {partnerTemplateForm.is_default && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-600 text-white">
                        Default Preset
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Save brand assets, custom domain, and rev-share splits. Auto-fills on every new client onboarded under this partner.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPartnerTemplateModal(false)}
                className="text-text-muted hover:text-text-primary p-1.5 rounded-sm hover:bg-surface-subtle transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Template Quick Switcher (If multiple templates exist) */}
            {partnerTemplates.length > 0 && (
              <div className="px-5 py-2.5 bg-surface-subtle border-b border-border flex items-center justify-between gap-2 overflow-x-auto">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    Saved Presets:
                  </span>
                  {partnerTemplates.map((tpl) => {
                    const isSelected = partnerTemplateForm.partner_name.toLowerCase() === tpl.partner_name.toLowerCase();
                    return (
                      <button
                        key={tpl.partner_name}
                        type="button"
                        onClick={() => setPartnerTemplateForm({ ...tpl })}
                        className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors border flex items-center gap-1 ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                            : 'bg-surface hover:bg-white text-text-secondary border-border'
                        }`}
                      >
                        <span>{tpl.partner_name}</span>
                        {tpl.is_default && <span className="text-[9px] bg-white/20 px-1 rounded">Default</span>}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPartnerTemplateForm({
                      partner_name: '',
                      partner_share_pct: 50,
                      owner_share_pct: 50,
                      custom_domain: '',
                      brand_name: '',
                      brand_logo_url: '',
                      brand_favicon_url: '',
                      brand_primary_color: '#7C3AED',
                      brand_support_email: '',
                      brand_support_phone: '',
                      hide_platform_branding: true,
                      is_default: partnerTemplates.length === 0,
                    })
                  }
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700 hover:underline cursor-pointer shrink-0"
                >
                  + Add Another Partner
                </button>
              </div>
            )}

            {/* Body Form */}
            <form onSubmit={handleSavePartnerTemplate} className="p-5 overflow-y-auto safari-scroll space-y-4 flex-1 text-xs">
              {/* Partner Name & Default Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    Partner Agency Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Marketing Group"
                    value={partnerTemplateForm.partner_name}
                    onChange={(e) => setPartnerTemplateForm({ ...partnerTemplateForm, partner_name: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-purple-600 transition-colors"
                  />
                  <p className="text-[10px] text-text-muted mt-0.5">
                    Clients onboarded under this agency name will automatically inherit this template's branding.
                  </p>
                </div>

                <div className="flex flex-col justify-between p-2.5 bg-purple-500/5 rounded border border-purple-500/20">
                  <span className="text-xs font-medium text-text-primary">Default Template</span>
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={Boolean(partnerTemplateForm.is_default)}
                      onChange={(e) => setPartnerTemplateForm({ ...partnerTemplateForm, is_default: e.target.checked })}
                      className="rounded border-border text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <span className="text-[11px] text-text-secondary">Pre-fill by default</span>
                  </label>
                </div>
              </div>

              {/* Revenue Split */}
              <div className="p-3.5 bg-purple-500/5 rounded-md border border-purple-500/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-purple-600" />
                    <span>Default Revenue Share Split</span>
                  </label>
                  <span className="text-[10px] text-purple-700 dark:text-purple-300 font-medium">Must total 100%</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-text-secondary mb-1">
                      Partner Agency Share (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={partnerTemplateForm.partner_share_pct}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(100, Number(e.target.value)));
                        setPartnerTemplateForm({
                          ...partnerTemplateForm,
                          partner_share_pct: val,
                          owner_share_pct: 100 - val,
                        });
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-border rounded-sm text-xs font-mono text-text-primary focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-text-secondary mb-1">
                      Your Share (Boldlabs %)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={partnerTemplateForm.owner_share_pct}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(100, Number(e.target.value)));
                        setPartnerTemplateForm({
                          ...partnerTemplateForm,
                          owner_share_pct: val,
                          partner_share_pct: 100 - val,
                        });
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-border rounded-sm text-xs font-mono text-text-primary focus:border-purple-600"
                    />
                  </div>
                </div>

                {/* Real-time Math Preview */}
                <div className="p-2 bg-white rounded border border-purple-500/20 text-[11px] font-mono flex items-center justify-between text-text-secondary">
                  <span>Example on ₹3,499/mo Pro Plan:</span>
                  <span className="text-purple-700 dark:text-purple-300 font-semibold">
                    Partner: ₹{(3499 * (partnerTemplateForm.partner_share_pct / 100)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                    Boldlabs Net: ₹{(3499 * (partnerTemplateForm.owner_share_pct / 100)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              {/* White-Label Custom Domain */}
              <div className="p-3.5 bg-sky-500/5 rounded-md border border-sky-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-sky-500" />
                    <span>White-Label Custom Domain</span>
                  </label>
                  <span className="text-[10px] text-sky-600 font-mono">DNS CNAME Setup</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. crm.partneragency.com"
                  value={partnerTemplateForm.custom_domain || ''}
                  onChange={(e) =>
                    setPartnerTemplateForm({ ...partnerTemplateForm, custom_domain: e.target.value.toLowerCase().trim() })
                  }
                  className="w-full px-3 py-1.5 bg-white border border-border rounded-sm text-xs font-mono text-text-primary focus:border-sky-500"
                />
                <div className="p-2 bg-sky-500/10 rounded text-[11px] text-sky-800 dark:text-sky-300 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    Partner points their DNS: <strong>Type CNAME</strong>, Host <code>crm</code> (or subdomain), Value <code>cname.vercel-dns.com</code>. Their clients can log in directly at this URL without seeing Boldlabs.
                  </span>
                </div>
              </div>

              {/* Brand Identity & Visual Styling */}
              <div className="p-3.5 bg-surface-subtle rounded-md border border-border space-y-3">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Brand Identity & Visual Styling</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">
                      Brand Display Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Health CRM"
                      value={partnerTemplateForm.brand_name || ''}
                      onChange={(e) => setPartnerTemplateForm({ ...partnerTemplateForm, brand_name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-border rounded-sm text-xs text-text-primary focus:border-purple-600"
                    />
                    <p className="text-[10px] text-text-muted mt-0.5">Replaces "Boldlabs" in header, titles, and portal.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">
                      Primary Brand Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={partnerTemplateForm.brand_primary_color || '#7C3AED'}
                        onChange={(e) => setPartnerTemplateForm({ ...partnerTemplateForm, brand_primary_color: e.target.value })}
                        className="w-8 h-8 rounded border border-border cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        placeholder="#7C3AED"
                        value={partnerTemplateForm.brand_primary_color || '#7C3AED'}
                        onChange={(e) => setPartnerTemplateForm({ ...partnerTemplateForm, brand_primary_color: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 bg-white border border-border rounded-sm text-xs font-mono text-text-primary focus:border-purple-600 uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">
                      Header Logo Image URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://partneragency.com/logo.png"
                      value={partnerTemplateForm.brand_logo_url || ''}
                      onChange={(e) => setPartnerTemplateForm({ ...partnerTemplateForm, brand_logo_url: e.target.value.trim() })}
                      className="w-full px-3 py-1.5 bg-white border border-border rounded-sm text-xs font-mono text-text-primary focus:border-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">
                      Favicon Image URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://partneragency.com/favicon.ico"
                      value={partnerTemplateForm.brand_favicon_url || ''}
                      onChange={(e) => setPartnerTemplateForm({ ...partnerTemplateForm, brand_favicon_url: e.target.value.trim() })}
                      className="w-full px-3 py-1.5 bg-white border border-border rounded-sm text-xs font-mono text-text-primary focus:border-purple-600"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-text-primary">Hide Platform Branding</span>
                    <p className="text-[10px] text-text-muted">Hides "Powered by Boldlabs" in footer and portal metadata.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(partnerTemplateForm.hide_platform_branding)}
                    onChange={(e) => setPartnerTemplateForm({ ...partnerTemplateForm, hide_platform_branding: e.target.checked })}
                    className="rounded border-border text-purple-600 focus:ring-purple-500 cursor-pointer w-4 h-4"
                  />
                </div>
              </div>

              {/* Support Contacts */}
              <div className="p-3.5 bg-surface-subtle rounded-md border border-border space-y-3">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-text-secondary" />
                  <span>Partner Support Contacts (Shown to Clients)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">
                      Support Email
                    </label>
                    <input
                      type="email"
                      placeholder="support@partneragency.com"
                      value={partnerTemplateForm.brand_support_email || ''}
                      onChange={(e) => setPartnerTemplateForm({ ...partnerTemplateForm, brand_support_email: e.target.value.trim() })}
                      className="w-full px-3 py-1.5 bg-white border border-border rounded-sm text-xs text-text-primary focus:border-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">
                      Support WhatsApp / Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={partnerTemplateForm.brand_support_phone || ''}
                      onChange={(e) => setPartnerTemplateForm({ ...partnerTemplateForm, brand_support_phone: e.target.value.trim() })}
                      className="w-full px-3 py-1.5 bg-white border border-border rounded-sm text-xs font-mono text-text-primary focus:border-purple-600"
                    />
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="sticky bottom-0 bg-surface/95 backdrop-blur-xs border-t border-border -mx-5 -mb-5 p-4 flex items-center justify-between gap-2 z-10 shadow-lg mt-4">
                {partnerTemplates.some((t) => t.partner_name.toLowerCase() === partnerTemplateForm.partner_name.toLowerCase()) ? (
                  <button
                    type="button"
                    onClick={() => handleDeletePartnerTemplate(partnerTemplateForm.partner_name)}
                    className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Preset</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPartnerTemplateModal(false)}
                    className="px-3.5 py-1.5 text-xs text-text-muted hover:text-text-primary border border-border rounded transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPartnerTemplate}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold text-xs rounded transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    {savingPartnerTemplate && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Partner Preset</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: MISSED CALL AUTOMATION PRE-FILLED SETUP ────────────────────── */}
      {missedCallModalTenant && (() => {
        const t = missedCallModalTenant;
        const { androidUrl, iphoneUrl, token } = getMissedCallUrls(t.slug);
        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
            <div className="bg-surface border border-border rounded-t-xl sm:rounded-lg w-full max-w-lg max-h-[92dvh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl safe-area-pb">
              {/* Header */}
              <div className="h-12 px-4 sm:px-5 border-b border-border flex items-center justify-between bg-emerald-600 shrink-0">
                <div className="flex items-center gap-2 text-white">
                  <PhoneCall className="w-4 h-4 stroke-[1.5]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    Missed Call Setup — {t.name}
                  </h3>
                  <span className="text-[10px] font-mono bg-white/20 px-1.5 py-0.5 rounded">100% Free</span>
                </div>
                <button
                  onClick={() => setMissedCallModalTenant(null)}
                  className="p-1 text-white/80 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[1.5]" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                <p className="text-[11px] text-text-muted">
                  Pre-filled webhook URLs for <strong>{t.name}</strong>. Copy or share directly to the client owner. Setup takes under 15 seconds on their phone.
                </p>

                {/* Device Switcher */}
                <div className="inline-flex items-center p-0.5 bg-surface-subtle border border-border rounded-sm w-full">
                  <button
                    type="button"
                    onClick={() => setMissedCallActiveDevice('android')}
                    className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      missedCallActiveDevice === 'android'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Android (MacroDroid)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMissedCallActiveDevice('iphone')}
                    className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      missedCallActiveDevice === 'iphone'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>iPhone (Shortcuts)</span>
                  </button>
                </div>

                {/* Android Guide */}
                {missedCallActiveDevice === 'android' && (
                  <div className="space-y-3">
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-md p-3 space-y-2">
                      <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5" />
                        Android Setup (MacroDroid — Free App)
                      </h4>
                      <ol className="text-[11px] text-text-body space-y-1.5 list-decimal list-inside">
                        <li>Install <strong>MacroDroid</strong> from Google Play Store (Free).</li>
                        <li>Tap <strong>Add Macro</strong> → Trigger (+): <strong>Call/SMS → Call Missed</strong> → Select <strong>Any Number</strong>.</li>
                        <li>Action (+): <strong>Connectivity → Open Website / HTTP GET</strong> → Paste the URL below.</li>
                        <li>Tap the checkmark to <strong>Save</strong> and turn the macro <strong>ON</strong>.</li>
                      </ol>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-text-primary">Pre-filled Webhook URL</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => copyToClipboard(androidUrl, 'mc-android-url')}
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                          >
                            {copiedField === 'mc-android-url' ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                            <span>Copy URL</span>
                          </button>
                          <button
                            onClick={() => downloadMacroDroidFile(t.name, t.slug)}
                            className="px-2 py-0.5 bg-surface-subtle hover:bg-surface text-text-body border border-border rounded text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                            title="Download 1-Click .macro import file"
                          >
                            <Download className="w-2.5 h-2.5" />
                            <span>.macro File</span>
                          </button>
                        </div>
                      </div>
                      <div className="p-2 bg-canvas border border-border rounded font-mono text-[10px] text-text-primary break-all select-all">
                        {androidUrl}
                      </div>
                    </div>
                  </div>
                )}

                {/* iPhone Guide */}
                {missedCallActiveDevice === 'iphone' && (
                  <div className="space-y-3">
                    <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-md p-3 space-y-2">
                      <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5" />
                        iPhone Setup (Built-in Shortcuts — No Download)
                      </h4>
                      <p className="text-[10px] text-text-muted italic">
                        Indian carriers (Jio, Airtel, Vi, BSNL) send a free SMS for every missed call. iOS Shortcuts reads this automatically.
                      </p>
                      <ol className="text-[11px] text-text-body space-y-1.5 list-decimal list-inside">
                        <li>Open <strong>Shortcuts</strong> app → <strong>Automation</strong> → Tap <strong>+</strong> (New Automation).</li>
                        <li>Select <strong>Message</strong> → Contains: <code className="bg-surface-subtle px-1 rounded text-[10px] font-mono">missed call</code> → <strong>Run Immediately</strong>.</li>
                        <li>Add Action: <strong>Get Contents of URL</strong> → Paste the URL below.</li>
                        <li>Set <code className="bg-surface-subtle px-1 rounded text-[10px] font-mono">ShortcutInput</code> to <strong>Message</strong> → Tap <strong>Done</strong>.</li>
                      </ol>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-text-primary">Pre-filled Webhook URL</span>
                        <button
                          onClick={() => copyToClipboard(iphoneUrl, 'mc-iphone-url')}
                          className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                        >
                          {copiedField === 'mc-iphone-url' ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                          <span>Copy URL</span>
                        </button>
                      </div>
                      <div className="p-2 bg-canvas border border-border rounded font-mono text-[10px] text-text-primary break-all select-all">
                        {iphoneUrl}
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Token */}
                <div className="p-2.5 bg-surface-subtle border border-border rounded-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-text-muted flex items-center gap-1">
                      <Shield className="w-3 h-3 text-amber-500" />
                      Security Token (Auto-Embedded)
                    </span>
                    <button
                      onClick={() => copyToClipboard(token, 'mc-token')}
                      className="px-1.5 py-0.5 bg-surface hover:bg-surface-subtle text-text-body border border-border rounded text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                    >
                      {copiedField === 'mc-token' ? <Check className="w-2.5 h-2.5 text-status-success" /> : <Copy className="w-2.5 h-2.5" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <p className="font-mono text-[10px] text-text-primary">{token}</p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-4 sm:px-5 py-3 border-t border-border flex items-center justify-between gap-2 bg-surface-subtle shrink-0">
                <button
                  type="button"
                  onClick={() => setMissedCallModalTenant(null)}
                  className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  Close
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const msg = getMissedCallClientMessage(t.name, t.slug);
                      copyToClipboard(msg, 'mc-full-msg');
                    }}
                    className="px-3 py-1.5 bg-surface hover:bg-surface-subtle text-text-primary border border-border rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {copiedField === 'mc-full-msg' ? <Check className="w-3 h-3 text-status-success" /> : <Copy className="w-3 h-3" />}
                    <span>Copy Full Guide</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const msg = getMissedCallClientMessage(t.name, t.slug);
                      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>Share on WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Onboarding Checklist Quick Modal ── */}
      {onboardingModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-3 bg-surface-subtle/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <ListChecks className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-text-primary">
                      {onboardingModalTenant.name}
                    </h3>
                    <span className="text-[10px] font-mono text-text-muted bg-surface px-1.5 py-0.5 rounded border border-border">
                      /{onboardingModalTenant.slug}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    Tenant Onboarding & Readiness Checklist
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openTenantOnboardingModal(onboardingModalTenant)}
                  disabled={loadingOnboardingStatus}
                  className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface rounded border border-border transition-colors cursor-pointer"
                  title="Refresh Status"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingOnboardingStatus ? 'animate-spin text-accent' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setOnboardingModalTenant(null)}
                  className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface rounded border border-border transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {loadingOnboardingStatus ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                  <span className="text-xs text-text-muted">Evaluating workspace onboarding readiness...</span>
                </div>
              ) : onboardingStatusData ? (
                <>
                  {/* Progress Banner */}
                  <div className={`p-4 rounded-lg border ${
                    onboardingStatusData.is_fully_onboarded
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                      : 'bg-surface-subtle border-border text-text-primary'
                  }`}>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {onboardingStatusData.is_fully_onboarded ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-accent" />
                        )}
                        <span className="font-bold text-xs">
                          {onboardingStatusData.is_fully_onboarded
                            ? '100% Client Workspace Ready'
                            : `${onboardingStatusData.completed_steps} of ${onboardingStatusData.total_steps} Setup Steps Completed`}
                        </span>
                      </div>
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        onboardingStatusData.is_fully_onboarded
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-accent/10 text-accent'
                      }`}>
                        {onboardingStatusData.completion_percentage}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-border/50 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          onboardingStatusData.is_fully_onboarded ? 'bg-emerald-600' : 'bg-accent'
                        }`}
                        style={{ width: `${onboardingStatusData.completion_percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Steps List */}
                  <div className="space-y-3">
                    {onboardingStatusData.steps.map((step, idx) => {
                      const isDone = step.is_completed;
                      const StepIcon =
                        step.id === 'whatsapp' ? MessageSquare :
                        step.id === 'calendar' ? CalendarDays :
                        step.id === 'ai_persona' ? Bot :
                        Send;

                      return (
                        <div
                          key={step.id}
                          className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isDone
                              ? 'bg-emerald-50/30 border-emerald-200/80'
                              : 'bg-surface border-border'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                              isDone
                                ? 'bg-emerald-600 text-white'
                                : 'bg-surface-subtle text-text-muted border border-border'
                            }`}>
                              <StepIcon className="w-3.5 h-3.5 stroke-[1.8]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-text-primary">
                                  {idx + 1}. {step.title}
                                </h4>
                                {isDone ? (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded border border-emerald-300">
                                    Completed
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                    Pending
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-text-muted mt-0.5">
                                {step.description}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const t = onboardingModalTenant;
                              setOnboardingModalTenant(null);
                              if (step.id === 'whatsapp') handleOpenConfig(t, 'whatsapp');
                              else if (step.id === 'calendar') handleOpenConfig(t, 'calendar');
                              else if (step.id === 'ai_persona') handleOpenConfig(t, 'ai');
                              else handleImpersonateTenant(t);
                            }}
                            className={`px-3 py-1.5 rounded text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1.5 ${
                              isDone
                                ? 'bg-surface hover:bg-surface-subtle border border-border text-text-secondary'
                                : 'bg-accent hover:bg-accent-hover text-white shadow-2xs'
                            }`}
                          >
                            <span>
                              {step.id === 'test_ping'
                                ? (isDone ? 'Send Test' : 'Open CRM to Ping')
                                : (isDone ? 'Edit Config' : step.action_label)}
                            </span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-xs text-text-muted">
                  Failed to load onboarding checklist for this workspace.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border flex items-center justify-between gap-2 bg-surface-subtle/50">
              <button
                type="button"
                onClick={() => setOnboardingModalTenant(null)}
                className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary border border-border rounded hover:bg-surface transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  const t = onboardingModalTenant;
                  setOnboardingModalTenant(null);
                  handleImpersonateTenant(t);
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Client Workspace CRM</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

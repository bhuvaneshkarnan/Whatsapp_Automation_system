'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
import {
  crm,
  marketing,
  BroadcastCampaign,
  ReengagementTrigger,
  MarketingAnalyticsSummary,
  Customer,
  CustomerNote,
  CustomerChatHistory,
  FollowupTask,
  Conversation,
  Message,
  Booking,
  Contact,
  TenantSettingsResponse,
  TenantSettingsUpdate,
  notificationsApi,
  CrmNotification,
  metaTemplatesApi,
  MetaTemplatesStatusResponse,
  MetaTemplatesSyncResponse,
} from '@/lib/api';
import {
  MessageSquare,
  Megaphone,
  Radio,
  Target,
  Bot,
  User,
  Send,
  Sparkles,
  Phone,
  Search,
  LogOut,
  RefreshCw,
  Sliders,
  Building2,
  CheckCircle2,
  Calendar,
  CalendarClock,
  CalendarCheck,
  Key,
  Mail,
  MapPin,
  FileText,
  Copy,
  Check,
  CheckCheck,
  ToggleLeft,
  ToggleRight,
  Clock,
  Mic,
  AlertCircle,
  Users,
  CheckCircle,
  XCircle,
  CalendarDays,
  ArrowUpRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Pencil,
  Star,
  UserX,
  RotateCcw,
  Bell,
  BellRing,
  BellOff,
  Volume2,
  MoreHorizontal,
  Folder,
  FolderOpen,
  Share2,
  Tag,
  Clock3,
  HardDrive,
  ChevronDown,
  LayoutGrid,
  List,
  Pin,
  Trash2,
  StickyNote,
  ShieldCheck,
  CheckSquare,
  Square,
  Activity,
  FileSpreadsheet,
  Download,
  Database,
  Edit2,
  Globe,
  DollarSign,
  Coins,
  TrendingUp,
  Stethoscope,
  Flame,
  Sun,
  Snowflake,
  SendHorizontal,
  UserCheck,
  UserPlus,
  MessageCircle,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Eye,
  FlaskConical,
  HeartPulse,
  Cake,
  Zap,
  Lightbulb,
  BarChart2,
  Save,
  Settings2,
  CreditCard,
  AlertTriangle,
  ExternalLink,
  Lock,
} from 'lucide-react';

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
  { code: 'AED', symbol: 'AED ', name: 'AED - UAE Dirham' },
  { code: 'SAR', symbol: 'SAR ', name: 'SAR - Saudi Riyal' },
  { code: 'CAD', symbol: 'C$', name: 'CAD (C$) - Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'AUD (A$) - Australian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'SGD (S$) - Singapore Dollar' },
  { code: 'MYR', symbol: 'RM ', name: 'MYR (RM) - Malaysian Ringgit' },
  { code: 'QAR', symbol: 'QAR ', name: 'QAR - Qatari Riyal' },
  { code: 'KWD', symbol: 'KWD ', name: 'KWD - Kuwaiti Dinar' },
  { code: 'OMR', symbol: 'OMR ', name: 'OMR - Omani Rial' },
  { code: 'BHD', symbol: 'BHD ', name: 'BHD - Bahraini Dinar' },
  { code: 'NZD', symbol: 'NZ$', name: 'NZD (NZ$) - New Zealand Dollar' },
  { code: 'JPY', symbol: '¥', name: 'JPY (¥) - Japanese Yen' },
  { code: 'CHF', symbol: 'CHF ', name: 'CHF - Swiss Franc' },
  { code: 'ZAR', symbol: 'R ', name: 'ZAR (R) - South African Rand' },
  { code: 'PHP', symbol: '₱', name: 'PHP (₱) - Philippine Peso' },
  { code: 'IDR', symbol: 'Rp ', name: 'IDR (Rp) - Indonesian Rupiah' },
  { code: 'THB', symbol: '฿', name: 'THB (฿) - Thai Baht' },
  { code: 'VND', symbol: '₫', name: 'VND (₫) - Vietnamese Dong' },
  { code: 'PKR', symbol: 'Rs ', name: 'PKR (Rs) - Pakistani Rupee' },
  { code: 'BDT', symbol: '৳', name: 'BDT (৳) - Bangladeshi Taka' },
  { code: 'NGN', symbol: '₦', name: 'NGN (₦) - Nigerian Naira' },
  { code: 'KES', symbol: 'KSh ', name: 'KES (KSh) - Kenyan Shilling' },
  { code: 'EGP', symbol: 'E£ ', name: 'EGP (E£) - Egyptian Pound' },
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



function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function formatTime12(dateStrOrObj: string | Date | null | undefined): string {
  if (!dateStrOrObj) return '';
  try {
    const d = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj;
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return '';
  }
}

function formatDateTime12(dateStrOrObj: string | Date | null | undefined): string {
  if (!dateStrOrObj) return '—';
  try {
    const d = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj;
    if (isNaN(d.getTime())) return '—';
    const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${datePart}, ${timePart}`;
  } catch {
    return '—';
  }
}

function formatMilitaryTo12(timeStr: string | null | undefined): string {
  if (!timeStr) return '';
  const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return timeStr;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 === 0 ? 12 : h % 12;
  return `${h}:${min} ${ampm}`;
}

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
      staff_label: 'Staff / Specialist',
      client_label: 'Customer',
      requirement_label: 'Primary Requirement / Notes',
      event_label: 'Booking / Session',
      booking_cta: '+ New Booking',
      requirement_presets: PREBUILT_REQUIREMENTS_BY_INDUSTRY.custom,
    },
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  
  // Navigation: overview | inbox | bookings | calendar | customers | followup | marketing | settings
  const [activeNav, setActiveNav] = useState<'overview' | 'inbox' | 'bookings' | 'calendar' | 'customers' | 'followup' | 'marketing' | 'settings'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const hash = window.location.hash.replace('#', '');
        const validTabs = ['overview', 'inbox', 'bookings', 'calendar', 'customers', 'followup', 'marketing', 'settings'];
        if (hash && validTabs.includes(hash)) {
          return hash as any;
        }
        const saved = localStorage.getItem('whatsapp_crm_active_nav');
        if (saved && validTabs.includes(saved)) {
          return saved as any;
        }
      } catch {}
    }
    return 'overview';
  });
  const [sidebarFilter, setSidebarFilter] = useState<'all' | 'recent' | 'favorites' | 'active'>('all');
  const [settingsTab, setSettingsTab] = useState<'branding' | 'notifications' | 'localization' | 'terminology' | 'templates' | 'account'>('branding');

  // Meta Templates state
  const [metaTemplatesStatus, setMetaTemplatesStatus] = useState<MetaTemplatesStatusResponse | null>(null);
  const [loadingMetaTemplates, setLoadingMetaTemplates] = useState(false);
  const [syncingMetaTemplates, setSyncingMetaTemplates] = useState(false);
  const [metaSyncBanner, setMetaSyncBanner] = useState<MetaTemplatesSyncResponse | null>(null);

  async function loadMetaTemplatesStatus() {
    setLoadingMetaTemplates(true);
    try {
      const res = await metaTemplatesApi.getStatus();
      setMetaTemplatesStatus(res);
    } catch (err: any) {
      console.warn('Failed to load Meta templates status:', err);
    } finally {
      setLoadingMetaTemplates(false);
    }
  }

  async function handleAutoSyncMetaTemplates() {
    setSyncingMetaTemplates(true);
    setMetaSyncBanner(null);
    try {
      const res = await metaTemplatesApi.syncAndProvision();
      setMetaSyncBanner(res);
      await loadMetaTemplatesStatus();
      await loadSettings();
    } catch (err: any) {
      alert(`Auto-provisioning failed: ${err?.message || err}`);
    } finally {
      setSyncingMetaTemplates(false);
    }
  }

  // Customer Follow-up & Task Calendar State
  const [followupView, setFollowupView] = useState<'list' | 'database' | 'tasks' | 'notes'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('whatsapp_crm_followup_view');
        if (saved && ['list', 'database', 'tasks', 'notes'].includes(saved)) {
          return saved as any;
        }
      } catch {}
    }
    return 'list';
  });

  // ── Web Push & Notification Center State ─────────────────────────────────────
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsList, setNotificationsList] = useState<CrmNotification[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default');

  // ── Quick Requirement / Concern Presets Editor Modal ───────────────────────
  const [presetEditModalOpen, setPresetEditModalOpen] = useState(false);
  const [presetEditList, setPresetEditList] = useState<string[]>([]);
  const [newPresetInput, setNewPresetInput] = useState('');
  const [savingPresets, setSavingPresets] = useState(false);

  function openPresetEditor() {
    const currentList = (settingsForm.taxonomy?.requirement_presets && settingsForm.taxonomy.requirement_presets.length > 0)
      ? settingsForm.taxonomy.requirement_presets
      : (PREBUILT_REQUIREMENTS_BY_INDUSTRY[settingsForm.industry || 'clinic'] || PREBUILT_REQUIREMENTS_BY_INDUSTRY.clinic);
    setPresetEditList([...currentList]);
    setNewPresetInput('');
    setPresetEditModalOpen(true);
  }

  function handleAddPreset() {
    const trimmed = newPresetInput.trim();
    if (!trimmed) return;
    if (!presetEditList.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
      setPresetEditList(prev => [...prev, trimmed]);
    }
    setNewPresetInput('');
  }

  function handleRemovePreset(presetToRemove: string) {
    setPresetEditList(prev => prev.filter(p => p !== presetToRemove));
  }

  function handleResetPresetDefaults() {
    const industryKey = settingsForm.industry || 'clinic';
    const defaults = PREBUILT_REQUIREMENTS_BY_INDUSTRY[industryKey] || PREBUILT_REQUIREMENTS_BY_INDUSTRY.clinic;
    setPresetEditList([...defaults]);
  }

  async function handleSavePresetsModal() {
    setSavingPresets(true);
    try {
      const updatedTaxonomy = {
        ...(settingsForm.taxonomy || currentTaxonomy),
        requirement_presets: presetEditList,
      };
      const updatedForm = {
        ...settingsForm,
        taxonomy: updatedTaxonomy,
      };
      const res = await crm.updateSettings(updatedForm);
      if (res && res.taxonomy) {
        setSettingsForm(res);
      } else {
        setSettingsForm(updatedForm);
      }
      setPresetEditModalOpen(false);
    } catch (err) {
      console.error('Failed to save presets:', err);
      alert('Failed to save presets: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSavingPresets(false);
    }
  }

  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsApi.list(50);
      setNotificationsList(res.notifications || []);
      setUnreadNotifCount(res.unread_count || 0);
    } catch {
      // Ignore background poll errors
    }
  };

  const checkPushStatus = async () => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushPermission('unsupported');
      return;
    }
    setPushPermission(Notification.permission);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        setIsPushSubscribed(!!sub);
      }
    } catch {
      setIsPushSubscribed(false);
    }
  };

  const subscribePushNotifications = async () => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setActionNotice('Web Push is not supported in this browser.');
      return;
    }

    setIsPushLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPushPermission(perm);
      if (perm !== 'granted') {
        setActionNotice('Notification permission denied. Please allow notifications in browser settings.');
        setIsPushLoading(false);
        return;
      }

      // Register and update /sw.js service worker
      const reg = await navigator.serviceWorker.register('/sw.js');
      await reg.update();
      await navigator.serviceWorker.ready;

      // Fetch VAPID Public Key from backend
      const { vapid_public_key } = await notificationsApi.getVapidKey();
      if (!vapid_public_key) {
        throw new Error('VAPID public key not configured on server');
      }

      const appServerKey = urlBase64ToUint8Array(vapid_public_key);
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey,
      });

      const subJson = subscription.toJSON();
      if (!subscription.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error('Incomplete push subscription generated');
      }

      await notificationsApi.subscribe({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        },
        user_agent: navigator.userAgent,
      });

      setIsPushSubscribed(true);
      setActionNotice('🔔 Real Web Push enabled! You will receive alerts even with the browser closed.');

      // Fire an immediate confirmation notification banner
      try {
        await reg.showNotification('🔔 Boldlabs Web Push Enabled', {
          body: 'Real-time notifications are now active on your laptop!',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'push-enabled-welcome',
          requireInteraction: true,
        });
      } catch (e) {
        console.warn(e);
      }

      fetchNotifications();
    } catch (err: any) {
      console.error('Push subscribe error:', err);
      setActionNotice(`Failed to enable push: ${err.message || err}`);
    } finally {
      setIsPushLoading(false);
    }
  };

  const sendTestNotification = async () => {
    setTestingPush(true);
    try {
      // 1. Direct browser popup test
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            if (reg) {
              await reg.showNotification('🔔 Boldlabs Live Alert', {
                body: 'Real notification is active on this device!',
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: `test-alert-${Date.now()}`,
                renotify: true,
                requireInteraction: true,
                data: { url: '/boldlabs' },
              } as any);
            }
          }
        } catch (localErr) {
          console.warn('Local showNotification warning:', localErr);
        }
      }

      // 2. Dispatches real backend VAPID Web Push via Google FCM / Apple Push
      await notificationsApi.sendTest();
      setActionNotice('🔔 Test push sent! If not visible on screen, check Windows Action Center (bottom right) or Mac Notifications.');
      setTimeout(fetchNotifications, 1000);
    } catch (err: any) {
      setActionNotice(`Test push failed: ${err.message || err}`);
    } finally {
      setTestingPush(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setUnreadNotifCount(0);
      setNotificationsList((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // Ignore
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const prevList = [...notificationsList];
    const prevCount = unreadNotifCount;
    const item = prevList.find((n) => n.id === id);
    if (item && !item.is_read) {
      setUnreadNotifCount((c) => Math.max(0, c - 1));
    }
    setNotificationsList((prev) => prev.filter((n) => n.id !== id));
    try {
      await notificationsApi.delete(id);
    } catch (err) {
      console.error('Failed to delete notification', err);
      setNotificationsList(prevList);
      setUnreadNotifCount(prevCount);
    }
  };

  const handleClearAllNotifications = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const prevList = [...notificationsList];
    const prevCount = unreadNotifCount;
    setNotificationsList([]);
    setUnreadNotifCount(0);
    try {
      await notificationsApi.clearAll();
    } catch (err) {
      console.error('Failed to clear notifications', err);
      setNotificationsList(prevList);
      setUnreadNotifCount(prevCount);
    }
  };

  const handleNotificationClick = async (notif: CrmNotification) => {
    try {
      if (!notif.is_read) {
        await notificationsApi.markRead(notif.id);
        setUnreadNotifCount((prev) => Math.max(0, prev - 1));
        setNotificationsList((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
      }
    } catch {}

    setShowNotifications(false);

    if (notif.data?.phone) {
      navigateTo('inbox');
      const targetPhone = notif.data.phone.replace('+', '').trim();
      const match = conversations.find(
        (c) => c.contact_phone && c.contact_phone.replace('+', '').trim() === targetPhone
      );
      if (match) {
        setSelectedConv(match);
      }
    } else if (notif.type === 'booking' || notif.type === 'cancellation' || notif.type === 'reschedule') {
      navigateTo('bookings');
    }
  };

  // Poll notifications and check push status on load
  useEffect(() => {
    fetchNotifications();
    checkPushStatus();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  // Synchronize active navigation tab and sub-views to localStorage & URL hash so page refreshes stay on same tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('whatsapp_crm_active_nav', activeNav);
        if (window.location.hash !== `#${activeNav}`) {
          window.history.replaceState(null, '', `${window.location.pathname}#${activeNav}`);
        }
      } catch {}
    }
  }, [activeNav]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('whatsapp_crm_followup_view', followupView);
      } catch {}
    }
  }, [followupView]);

  // Add Customer Modal State
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [addCustomerForm, setAddCustomerForm] = useState({
    name: '',
    phone: '',
    age: '',
    location: '',
    preferred_doctor: '',
    health_concern: '',
    lead_probability: 'warm' as 'hot' | 'warm' | 'cold',
    followup_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    followup_time: '10:00 AM',
    initial_note: '',
  });

  // 2-Step Customer Deletion State
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
  const [confirmDeleteStep, setConfirmDeleteStep] = useState(false);
  const [showCustomerHistoryModal, setShowCustomerHistoryModal] = useState(false);

  // Local Concern edit state for Drawer
  const [drawerConcern, setDrawerConcern] = useState('');
  const [drawerAge, setDrawerAge] = useState('');
  const [drawerLocation, setDrawerLocation] = useState('');
  const [drawerDoctor, setDrawerDoctor] = useState('');
  const [savingDrawerAttributes, setSavingDrawerAttributes] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [followupStatusFilter, setFollowupStatusFilter] = useState<string>('all');
  const [followupProbabilityFilter, setFollowupProbabilityFilter] = useState<string>('all');
  const [followupDoctorFilter, setFollowupDoctorFilter] = useState<string>('all');
  const [followupSearch, setFollowupSearch] = useState<string>('');

  // Selected Customer Detail Drawer
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const [customerNotes, setCustomerNotes] = useState<CustomerNote[]>([]);
  const [loadingCustomerNotes, setLoadingCustomerNotes] = useState(false);
  const [newCustomerNoteText, setNewCustomerNoteText] = useState('');
  const [newCustomerNoteAuthor, setNewCustomerNoteAuthor] = useState('Admin');
  const [newCustomerNoteColor, setNewCustomerNoteColor] = useState('slate');
  const [addingCustomerNote, setAddingCustomerNote] = useState(false);

  // Overall Notes (all customers combined)
  const [allNotes, setAllNotes] = useState<CustomerNote[]>([]);
  const [loadingAllNotes, setLoadingAllNotes] = useState(false);
  const [allNotesColorFilter, setAllNotesColorFilter] = useState('all');
  const [allNotesSearch, setAllNotesSearch] = useState('');
  const [showAddOverallNoteModal, setShowAddOverallNoteModal] = useState(false);
  const [overallNoteCustomerId, setOverallNoteCustomerId] = useState('');
  const [overallNoteAuthor, setOverallNoteAuthor] = useState('Staff');
  const [overallNoteText, setOverallNoteText] = useState('');
  const [overallNoteColor, setOverallNoteColor] = useState('slate');
  const [savingOverallNote, setSavingOverallNote] = useState(false);


  // Customer WhatsApp Chat in Detail Drawer
  const [customerChat, setCustomerChat] = useState<CustomerChatHistory | null>(null);
  const [loadingCustomerChat, setLoadingCustomerChat] = useState(false);
  const [customerReplyText, setCustomerReplyText] = useState('');
  const [sendingCustomerReply, setSendingCustomerReply] = useState(false);

  // Customer Bookings History in Detail Drawer
  const [customerBookingsData, setCustomerBookingsData] = useState<{
    bookings: any[];
    total_revenue: number;
    total_sessions: number;
    completed_sessions: number;
  } | null>(null);
  const [loadingCustomerBookings, setLoadingCustomerBookings] = useState(false);

  // Quick Add to CRM from Inbox/Bookings
  const [showQuickAddCrmModal, setShowQuickAddCrmModal] = useState(false);
  const [quickCrmName, setQuickCrmName] = useState('');
  const [quickCrmPhone, setQuickCrmPhone] = useState('');
  const [quickCrmConcern, setQuickCrmConcern] = useState('General Consultation');
  const [quickCrmLead, setQuickCrmLead] = useState<'hot' | 'warm' | 'cold'>('warm');
  const [quickCrmDoctor, setQuickCrmDoctor] = useState('');
  const [savingQuickCrm, setSavingQuickCrm] = useState(false);

  // Google Tasks Sync State
  const [syncingGoogleTasks, setSyncingGoogleTasks] = useState(false);

  // Customer Directory State (VIEW 4)
  const [dirSearch, setDirSearch] = useState('');
  const [dirSelectedCust, setDirSelectedCust] = useState<Customer | null>(null);

  // Sync local drawer fields when a customer is selected in the directory
  useEffect(() => {
    if (dirSelectedCust) {
      setDrawerConcern(dirSelectedCust.health_concern || '');
      setDrawerAge(dirSelectedCust.age != null ? String(dirSelectedCust.age) : '');
      setDrawerLocation(dirSelectedCust.location || '');
      setDrawerDoctor(dirSelectedCust.preferred_doctor || '');
      setConfirmDeleteStep(false);
    }
  }, [dirSelectedCust?.id]);

  // Tasks Calendar State
  const [tasks, setTasks] = useState<FollowupTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [taskFilter, setTaskFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'completed'>('all');
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [addTaskTitle, setAddTaskTitle] = useState('');
  const [addTaskDesc, setAddTaskDesc] = useState('');
  const [addTaskDueDate, setAddTaskDueDate] = useState('');
  const [addTaskDueTime, setAddTaskDueTime] = useState('10:00');
  const [addTaskCustomerId, setAddTaskCustomerId] = useState('');
  const [addTaskSyncGT, setAddTaskSyncGT] = useState(true);
  const [addTaskSyncCal, setAddTaskSyncCal] = useState(false);
  const [savingTask, setSavingTask] = useState(false);

  // Marketing Broadcast State
  const [marketingSubTab, setMarketingSubTab] = useState<'broadcasts' | 'templates' | 'reengagement' | 'analytics'>('broadcasts');
  const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  // Re-engagement triggers
  const [triggers, setTriggers] = useState<ReengagementTrigger[]>([]);
  const [loadingTriggers, setLoadingTriggers] = useState(false);
  const [newTriggerModal, setNewTriggerModal] = useState(false);
  const [triggerForm, setTriggerForm] = useState({
    name: '',
    trigger_type: 'recall_reminder',
    condition_label: '',
    condition_days: 30,
    template_name: 'reschedule_nudge',
    is_active: true,
  });
  const [togglingTriggerId, setTogglingTriggerId] = useState<string | null>(null);
  const [testingTriggerId, setTestingTriggerId] = useState<string | null>(null);

  // Campaign Analytics
  const [analyticsData, setAnalyticsData] = useState<{ summary: MarketingAnalyticsSummary; campaigns: BroadcastCampaign[] } | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Approved Templates List (Clean Utility & Marketing Templates)
  const [marketingTemplates, setMarketingTemplates] = useState<Array<{
    id: string;
    name: string;
    label: string;
    category: string;
    status: string;
    language?: string;
    body?: string;
    variables_count: number;
  }>>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showTemplateManagerModal, setShowTemplateManagerModal] = useState(false);
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [templateManagerError, setTemplateManagerError] = useState<string | null>(null);
  const [templateManagerSuccess, setTemplateManagerSuccess] = useState<string | null>(null);

  const [customTemplates, setCustomTemplates] = useState<{ id: string; name: string; label: string; variables_count: number }[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('whatsapp_crm_custom_templates');
        if (saved) {
          const parsed = JSON.parse(saved);
          const cleaned = parsed.filter((t: any) => !['booking_confirmationn', 'booking_reschedule_confirmation', 'admin_notification', 'cancellation_confirmation', 'admin_cancellation_notice', 'admin_reschedule_notice', 'appointment_ramainder', 'post_service_review', 'admin_daily_digest'].includes(t.name));
          if (cleaned.length > 0) return cleaned;
        }
      } catch {}
    }
    return [
      { id: 'utility_general_update', name: 'utility_general_update', label: 'General Utility Update (utility_general_update)', variables_count: 3 },
    ];
  });

  const [newTemplateModal, setNewTemplateModal] = useState(false);
  const [newTemplateForm, setNewTemplateForm] = useState<{
    name: string;
    label: string;
    category: 'UTILITY' | 'MARKETING';
    language: string;
    body: string;
    variables_count: number;
  }>({
    name: '',
    label: '',
    category: 'UTILITY',
    language: 'en_US',
    body: '',
    variables_count: 2,
  });

  // 3-Way Audience Selection State
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [sheetLeads, setSheetLeads] = useState<{ name: string; phone: string }[]>([]);
  const [sheetRawInput, setSheetRawInput] = useState('');
  const [sheetInputMode, setSheetInputMode] = useState<'upload' | 'paste'>('paste');
  const [sheetParsingError, setSheetParsingError] = useState<string | null>(null);

  const [campaignForm, setCampaignForm] = useState({
    campaign_name: '',
    target_audience: 'contacts_only' as 'contacts_only' | 'sheet_only' | 'both',
    message_mode: 'template' as 'template' | 'text',
    template_name: 'utility_general_update',
    template_param1: '',
    template_param2: '',
    template_param3: '',
    template_param4: '',
    message_text: '',
    // Scheduling
    send_mode: 'now' as 'now' | 'scheduled',
    schedule_date: new Date(Date.now() + 3600000).toISOString().split('T')[0],
    schedule_time: '10:00',
  });

  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState<{ total: number; sent: number } | null>(null);
  const [broadcastSuccessNotice, setBroadcastSuccessNotice] = useState<string | null>(null);

  // User state
  const [user, setUser] = useState<{ id?: string; tenant_id?: string; email?: string; role: string; name?: string } | null>(null);

  // Conversations & Chat State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'new' | 'important'>('all');
  const [importantConvIds, setImportantConvIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('whatsapp_crm_important_chats');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const toggleImportant = (convId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setImportantConvIds((prev) => {
      const updated = prev.includes(convId) ? prev.filter((id) => id !== convId) : [...prev, convId];
      try {
        localStorage.setItem('whatsapp_crm_important_chats', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [togglingAi, setTogglingAi] = useState(false);
  const [confirmSingleAiModal, setConfirmSingleAiModal] = useState<{
    isOpen: boolean;
    convId: string;
    name: string;
  } | null>(null);
  const [confirmAllAiModal, setConfirmAllAiModal] = useState<boolean>(false);
  const [deleteChatModal, setDeleteChatModal] = useState<{
    isOpen: boolean;
    convId: string;
    name: string;
  } | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  // Bookings State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingFilter, setBookingFilter] = useState<string>('upcoming');
  const [bookingSearch, setBookingSearch] = useState<string>('');
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const [selectedBookingDetail, setSelectedBookingDetail] = useState<Booking | null>(null);
  const [isBookingDetailModalOpen, setIsBookingDetailModalOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('10:00');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Price Editing State
  const [editingBookingPriceId, setEditingBookingPriceId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<string>('');
  const [updatingPrice, setUpdatingPrice] = useState(false);

  // Add Booking Modal State
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const [bookingCreating, setBookingCreating] = useState(false);
  const [bookingCreateError, setBookingCreateError] = useState('');
  const [bookingCreateSuccess, setBookingCreateSuccess] = useState('');
  const [newBookingForm, setNewBookingForm] = useState({
    contact_name: '',
    contact_phone: '',
    service: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    price: 500,
    notes: '',
  });

  // Right Drawer & Sticky Notes State
  const [showRightDrawer, setShowRightDrawer] = useState(false);
  const [stickyNotes, setStickyNotes] = useState<{
    id: string;
    text: string;
    color: 'yellow' | 'green' | 'blue' | 'purple' | 'pink';
    pinned?: boolean;
    done?: boolean;
    createdAt: string;
  }[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteColor, setNewNoteColor] = useState<'yellow' | 'green' | 'blue' | 'purple' | 'pink'>('yellow');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Calendar View State (day | week | month)
  const [calendarViewMode, setCalendarViewMode] = useState<'day' | 'week' | 'month'>('month');
  const [calendarLayerFilter, setCalendarLayerFilter] = useState<'all' | 'bookings' | 'followups' | 'tasks'>('all');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Customers State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState<string>('');

  // Settings State
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [settingsForm, setSettingsForm] = useState<TenantSettingsUpdate & {
    webhook_url?: string;
    has_access_token?: boolean;
    has_app_secret?: boolean;
    has_gemini_key?: boolean;
    has_groq_key?: boolean;
    has_opencode_key?: boolean;
    google_calendar_configured?: boolean;
  }>({
    name: '',
    logo_url: '',
    meta_phone_id: '',
    meta_waba_id: '',
    meta_access_token: '',
    meta_app_secret: '',
    verify_token: '',
    primary_model_provider: 'groq',
    ai_model: 'gemini-3.1-flash-lite',
    gemini_api_key: '',
    groq_api_key: '',
    opencode_api_key: '',
    opencode_base_url: 'https://opencode.ai/zen/v1',
    assistant_name: 'Rakshaya',
    bot_goal: '',
    services_text: '',
    ai_prompt: '',
    full_location_text: '',
    timezone: 'Asia/Kolkata',
    country_code: '+91',
    currency: 'INR',
    currency_symbol: '₹',
    admin_whatsapp_number: '',
    template_booking_confirmation: 'booking_confirmationn',
    template_reschedule_confirmation: 'booking_reschedule_confirmation',
    template_cancellation_confirmation: 'cancellation_confirmation',
    template_post_service_review: 'review_request',
    template_appointment_reminder: 'appointment_ramainder',
    template_reschedule_nudge: 'reschedule_nudge',
    template_review_request: 'review_request',
    template_client_followup: 'client_followup_checkin',
    google_review_link: '',
    template_admin_notification: 'admin_notification',
    template_admin_reschedule_notice: 'admin_reschedule_notice',
    template_admin_human_request: 'admin_human_request',
    template_admin_cancellation_notice: 'admin_cancellation_notice',
    template_admin_daily_digest: 'admin_daily_digest',
    google_client_id: '',
    google_client_secret: '',
    google_refresh_token: '',
    google_calendar_id: 'primary',
    notification_email: '',
  });

  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [disconnectingGoogle, setDisconnectingGoogle] = useState(false);

  // Check URL query parameters for Google OAuth result
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('gcal_success') === 'true') {
        setActionNotice('Google Calendar connected and synced successfully with your account!');
        setTimeout(() => setActionNotice(null), 5000);
        window.history.replaceState({}, document.title, window.location.pathname);
        loadSettings();
      } else if (params.get('gcal_error')) {
        const err = params.get('gcal_error');
        alert(`Google Calendar connection failed: ${err}`);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // ── Quick Preferred Doctors / Staff Presets Editor Modal ───────────────────
  const [doctorEditModalOpen, setDoctorEditModalOpen] = useState(false);
  const [doctorEditList, setDoctorEditList] = useState<string[]>([]);
  const [newDoctorInput, setNewDoctorInput] = useState('');
  const [savingDoctors, setSavingDoctors] = useState(false);

  const defaultDoctorList: string[] = [];
  const configuredDoctors = Array.isArray(settingsForm.taxonomy?.doctor_presets)
    ? settingsForm.taxonomy.doctor_presets
    : Array.isArray(settingsForm.taxonomy?.staff_presets)
    ? settingsForm.taxonomy.staff_presets
    : defaultDoctorList;

  // Combine configured doctors with any custom doctor already assigned to a customer
  const availableDoctors = Array.from(
    new Set([
      ...configuredDoctors,
      ...(customers || []).map((c) => c.preferred_doctor).filter(Boolean) as string[],
    ])
  );

  function openDoctorEditor() {
    setDoctorEditList([...configuredDoctors]);
    setNewDoctorInput('');
    setDoctorEditModalOpen(true);
  }

  function handleAddDoctor() {
    const trimmed = newDoctorInput.trim();
    if (!trimmed) return;
    if (!doctorEditList.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
      setDoctorEditList((prev) => [...prev, trimmed]);
    }
    setNewDoctorInput('');
  }

  function handleRemoveDoctor(doctorToRemove: string) {
    setDoctorEditList((prev) => prev.filter((d) => d !== doctorToRemove));
  }

  function handleResetDoctorDefaults() {
    setDoctorEditList([...defaultDoctorList]);
  }

  async function handleSaveDoctorsModal() {
    setSavingDoctors(true);
    try {
      const updatedTaxonomy = {
        ...(settingsForm.taxonomy || currentTaxonomy),
        doctor_presets: doctorEditList,
        staff_presets: doctorEditList,
      };
      // Send clean, focused payload to guarantee update without interference
      await crm.updateSettings({
        taxonomy: updatedTaxonomy,
      });
      setSettingsForm((prev) => ({
        ...prev,
        taxonomy: updatedTaxonomy,
      }));
      setDoctorEditModalOpen(false);
      setActionNotice('Preferred doctors list updated successfully.');
      setTimeout(() => setActionNotice(null), 2500);
    } catch (err) {
      console.error('Failed to save doctors list:', err);
      alert('Failed to save doctors list: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSavingDoctors(false);
    }
  }

  const handleConnectGoogle = async () => {
    if (!settingsForm.google_client_id?.trim() || !settingsForm.google_client_secret?.trim()) {
      alert('Please enter your Google OAuth Client ID and Client Secret first.');
      return;
    }
    setConnectingGoogle(true);
    try {
      const res = await crm.initGoogleOAuth({
        client_id: settingsForm.google_client_id.trim(),
        client_secret: settingsForm.google_client_secret.trim(),
      });
      if (res.auth_url) {
        window.location.href = res.auth_url;
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to initialize Google Sign-In.');
      setConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar?')) return;
    setDisconnectingGoogle(true);
    try {
      await crm.disconnectGoogleCalendar();
      setSettingsForm((prev) => ({
        ...prev,
        google_refresh_token: '',
        google_calendar_configured: false,
      }));
      setActionNotice('Google Calendar disconnected successfully.');
      setTimeout(() => setActionNotice(null), 3000);
      loadSettings();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to disconnect Google Calendar.');
    } finally {
      setDisconnectingGoogle(false);
    }
  };

  
  const exportCustomersToCsv = () => {
    if (!customers || customers.length === 0) {
      alert('No customer records to export.');
      return;
    }
    const headers = [
      'Name',
      'Phone',
      'Age',
      'Location',
      currentTaxonomy.requirement_label || 'Requirement',
      currentTaxonomy.staff_label || 'Staff',
      'Status',
      'Lead Probability',
      'Converted',
      'Follow-up Date',
      'Follow-up Time',
      'Latest Note',
      'Notes Count',
      'Created At'
    ];
    const rows = customers.map(c => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      c.age != null ? c.age : '',
      `"${(c.location || '').replace(/"/g, '""')}"`,
      `"${(c.health_concern || '').replace(/"/g, '""')}"`,
      `"${(c.preferred_doctor || '').replace(/"/g, '""')}"`,
      c.status || '',
      c.lead_probability || '',
      c.converted ? 'Yes' : 'No',
      c.followup_date || '',
      c.followup_time || '',
      `"${(c.latest_note || '').replace(/"/g, '""')}"`,
      c.notes_count || 0,
      c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customers_database_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentTaxonomy = {
    staff_label: settingsForm.taxonomy?.staff_label || (settingsForm.industry === 'education' ? 'Tutor / Counselor' : 'Preferred Doctor / Staff'),
    client_label: settingsForm.taxonomy?.client_label || (settingsForm.industry === 'education' ? 'Student / Parent' : 'Customer'),
    client_plural: settingsForm.taxonomy?.client_plural || (settingsForm.industry === 'education' ? 'Students' : settingsForm.industry === 'legal' ? 'Clients' : settingsForm.industry === 'realestate' ? 'Buyers' : settingsForm.industry === 'fitness' ? 'Members' : 'Customers'),
    requirement_label: settingsForm.taxonomy?.requirement_label || (settingsForm.industry === 'education' ? 'Target Course & Grade' : 'Health Concern / Symptoms'),
    event_label: settingsForm.taxonomy?.event_label || (settingsForm.industry === 'education' ? 'Demo Class / Counseling' : 'Appointment'),
    booking_cta: settingsForm.taxonomy?.booking_cta || (settingsForm.industry === 'education' ? '+ Book Demo Class' : '+ New Appointment'),
    phone_label: settingsForm.taxonomy?.phone_label || 'Phone',
    age_location_label: settingsForm.taxonomy?.age_location_label || 'Age & Location',
    status_label: settingsForm.taxonomy?.status_label || 'Status',
    lead_label: settingsForm.taxonomy?.lead_label || 'Lead',
    followup_label: settingsForm.taxonomy?.followup_label || 'Follow-up Due',
    created_label: settingsForm.taxonomy?.created_label || 'Added',
    notes_label: settingsForm.taxonomy?.notes_label || 'Latest Note',
    actions_label: settingsForm.taxonomy?.actions_label || 'Action',
  };

  const filteredTasks = tasks.filter((task) => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'completed') return task.completed;
    if (task.completed) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = task.due_date ? new Date(task.due_date) : null;
    if (!due) return taskFilter === 'upcoming';
    due.setHours(0, 0, 0, 0);
    if (taskFilter === 'today') return due.getTime() === today.getTime();
    if (taskFilter === 'overdue') return due.getTime() < today.getTime();
    if (taskFilter === 'upcoming') return due.getTime() > today.getTime();
    return true;
  });

  const filteredAllNotes = allNotes.filter((nt) => {
    const matchesColor = allNotesColorFilter === 'all' || nt.color === allNotesColorFilter;
    const matchesSearch = !allNotesSearch || (
      (nt.note_text && nt.note_text.toLowerCase().includes(allNotesSearch.toLowerCase())) ||
      (nt.author && nt.author.toLowerCase().includes(allNotesSearch.toLowerCase())) ||
      (nt.customer_name && nt.customer_name.toLowerCase().includes(allNotesSearch.toLowerCase()))
    );
    return matchesColor && matchesSearch;
  });

  const currentCurrencySymbol = settingsForm.currency_symbol || (
    settingsForm.currency === 'USD' ? '$' :
    settingsForm.currency === 'EUR' ? '€' :
    settingsForm.currency === 'GBP' ? '£' :
    settingsForm.currency === 'AED' ? 'AED ' :
    settingsForm.currency === 'AUD' ? 'A$' :
    settingsForm.currency === 'CAD' ? 'C$' :
    settingsForm.currency === 'SGD' ? 'S$' :
    settingsForm.currency === 'SAR' ? 'SAR ' :
    settingsForm.currency === 'MYR' ? 'RM ' :
    settingsForm.currency === 'QAR' ? 'QAR ' :
    settingsForm.currency === 'KWD' ? 'KWD ' :
    settingsForm.currency === 'NZD' ? 'NZ$' :
    settingsForm.currency === 'JPY' ? '¥' :
    settingsForm.currency === 'CHF' ? 'CHF ' :
    settingsForm.currency === 'ZAR' ? 'R ' :
    '₹'
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesCacheRef = useRef<Record<string, Message[]>>({});
  const activeConvIdRef = useRef<string | null>(null);
  const lastSelectedConvIdRef = useRef<string | null>(null);

  // Instant scroll to bottom before browser paint when switching chats or receiving messages
  useIsomorphicLayoutEffect(() => {
    const el = messagesContainerRef.current;
    if (!el || !selectedConv) return;

    el.style.scrollBehavior = 'auto';
    const isConvChange = lastSelectedConvIdRef.current !== selectedConv.id;
    lastSelectedConvIdRef.current = selectedConv.id;

    if (isConvChange) {
      // Switched chats: ALWAYS instantly jump straight to newest message at the bottom
      el.scrollTop = el.scrollHeight;
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight;
      });
    } else {
      // Stream update in same conversation: stay at bottom if already near bottom (within 200px)
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
      if (isNearBottom) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [selectedConv?.id, messages]);

  // Initial Auth & Load
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      if (typeof window !== 'undefined') {
        window.location.replace('/login');
      }
      return;
    }
    crm.getMe()
      .then((data) => {
        setUser(data);
        setIsAuthChecking(false);
        if (typeof window !== 'undefined') {
          const storedSlug = localStorage.getItem('tenant_slug') || 'boldlabs';
          if (window.location.pathname === '/dashboard' || window.location.pathname === '/') {
            window.history.replaceState(null, '', `/${storedSlug}${window.location.hash || ''}`);
          }
        }
        loadConversations();
        loadBookings();
        loadContacts();
        loadCustomers();
        loadSettings();
      })
      .catch(() => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          window.location.replace('/login');
        }
      });
  }, []);

  // Load Sticky Notes from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('boldlabs_sticky_notes');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setStickyNotes(parsed);
          }
        } catch (e) {
          console.error('Error parsing sticky notes', e);
        }
      }
    }
  }, []);

  const saveStickyNotes = (notes: typeof stickyNotes) => {
    setStickyNotes(notes);
    if (typeof window !== 'undefined') {
      localStorage.setItem('boldlabs_sticky_notes', JSON.stringify(notes));
    }
  };

  const handleAddStickyNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const now = new Date();
    const timeStr = formatTime12(now);
    const newNote = {
      id: `note-${Date.now()}`,
      text: newNoteText.trim(),
      color: newNoteColor,
      pinned: false,
      done: false,
      createdAt: `Today, ${timeStr}`,
    };
    const updated = [newNote, ...stickyNotes];
    saveStickyNotes(updated);
    setNewNoteText('');
    setIsAddingNote(false);
  };

  const handleTogglePin = (id: string) => {
    const updated = stickyNotes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n);
    updated.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    saveStickyNotes(updated);
  };

  const handleToggleDone = (id: string) => {
    const updated = stickyNotes.map(n => n.id === id ? { ...n, done: !n.done } : n);
    saveStickyNotes(updated);
  };

  const handleDeleteStickyNote = (id: string) => {
    const updated = stickyNotes.filter(n => n.id !== id);
    saveStickyNotes(updated);
  };

  const loadMarketingTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const list = await marketing.getTemplates();
      if (Array.isArray(list) && list.length > 0) {
        setMarketingTemplates(list);
        setCustomTemplates(list.map(t => ({
          id: t.id || t.name,
          name: t.name,
          label: t.label || `${t.name} (${t.category || 'UTILITY'})`,
          variables_count: t.variables_count || 0
        })));
      } else {
        const fallback = [
          {
            id: 'utility_general_update',
            name: 'utility_general_update',
            label: 'General Utility Update (utility_general_update)',
            category: 'UTILITY',
            status: 'APPROVED',
            variables_count: 3
          }
        ];
        setMarketingTemplates(fallback);
        setCustomTemplates(fallback.map(t => ({ id: t.id, name: t.name, label: t.label, variables_count: t.variables_count })));
      }
    } catch (err) {
      console.warn('Failed to load marketing templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Load section data based on active tab
  useEffect(() => {
    if (activeNav === 'bookings') {
      loadBookings();
    } else if (activeNav === 'calendar') {
      loadCalendarData();
    } else if (activeNav === 'customers') {
      loadContacts();
      loadCustomers();
    } else if (activeNav === 'followup') {
      loadCustomers();
      loadTasks();
    } else if (activeNav === 'settings') {
      loadSettings();
    } else if (activeNav === 'marketing') {
      loadMarketingTemplates();
      // Load campaigns from backend
      setLoadingCampaigns(true);
      marketing.getCampaigns()
        .then((data) => setCampaigns(Array.isArray(data) ? data : []))
        .catch(() => {})
        .finally(() => setLoadingCampaigns(false));
      // Load triggers from backend
      setLoadingTriggers(true);
      marketing.getTriggers()
        .then((data) => setTriggers(Array.isArray(data) ? data : []))
        .catch(() => {})
        .finally(() => setLoadingTriggers(false));
    }
  }, [activeNav]);

  // Refetch customers when filter state changes (Instant responsive filtering)
  useEffect(() => {
    if (activeNav === 'customers' || activeNav === 'followup') {
      loadCustomers();
    }
  }, [activeNav, followupStatusFilter, followupProbabilityFilter, followupDoctorFilter, followupSearch]);

  // Refetch tasks when task filter changes
  useEffect(() => {
    if (activeNav === 'customers' || activeNav === 'followup') {
      loadTasks();
    }
  }, [activeNav, taskFilter]);

  // Load analytics when sub-tab switches to analytics
  useEffect(() => {
    if (activeNav === 'marketing' && marketingSubTab === 'analytics') {
      setLoadingAnalytics(true);
      const timer = setTimeout(() => {
        setLoadingAnalytics(false);
      }, 5000);
      marketing.getAnalytics()
        .then((data) => {
          clearTimeout(timer);
          setAnalyticsData(data);
        })
        .catch((err) => {
          clearTimeout(timer);
          console.error('Failed to load marketing analytics:', err);
          setAnalyticsData({
            summary: {
              total_broadcasts: 0,
              total_sent: 0,
              total_delivered: 0,
              delivery_rate: 0,
              total_read: 0,
              read_rate: 0,
              total_replied: 0,
              reply_rate: 0,
              total_converted: 0,
              conversion_rate: 0,
              attributed_revenue: 0,
              average_ticket_size: 0,
            },
            campaigns: [],
          });
        })
        .finally(() => {
          clearTimeout(timer);
          setLoadingAnalytics(false);
        });
    }
  }, [activeNav, marketingSubTab]);

  const selectedConvRef = useRef<Conversation | null>(null);
  useEffect(() => {
    selectedConvRef.current = selectedConv;
  }, [selectedConv]);

  const selectedCustomerRef = useRef<Customer | null>(null);
  useEffect(() => {
    selectedCustomerRef.current = selectedCustomer;
  }, [selectedCustomer]);

  // Real-time live polling engine: fast 1.2s live sync for Inbox, 3s sync for Customers/Followup, gentle 5s sync for background tabs
  const isPollingRef = useRef(false);
  useEffect(() => {
    let isMounted = true;

    const poll = async () => {
      if (!isMounted || isPollingRef.current) return;
      if (typeof document !== 'undefined' && document.hidden) return; // Skip polling when tab is inactive

      isPollingRef.current = true;
      try {
        const activeId = selectedConvRef.current?.id;

        // 1. Live Chat: Real-time message synchronization (every 1.2s when on inbox tab)
        if (activeId && activeNav === 'inbox') {
          try {
            const msgs = await crm.getMessages(activeId);
            if (isMounted && Array.isArray(msgs) && selectedConvRef.current?.id === activeId) {
              messagesCacheRef.current[activeId] = msgs;
              setMessages((prev) => {
                const isDiff =
                  msgs.length !== prev.length ||
                  msgs.some(
                    (m, idx) =>
                      !prev[idx] ||
                      prev[idx].id !== m.id ||
                      prev[idx].status !== m.status ||
                      prev[idx].body !== m.body
                  );
                return isDiff ? msgs : prev;
              });
            }
          } catch {
            // silent
          }
        }

        // 2. Real-time conversations list & unread indicators
        try {
          const convs = await crm.getConversations();
          if (isMounted && Array.isArray(convs)) {
            const activeId = selectedConvRef.current?.id;
            const sanitizedConvs = convs.map((c) =>
              c.id === activeId ? { ...c, unread_count: 0 } : c
            );
            setConversations((prev) => {
              const isDiff =
                sanitizedConvs.length !== prev.length ||
                sanitizedConvs.some(
                  (c, idx) =>
                    !prev[idx] ||
                    prev[idx].id !== c.id ||
                    prev[idx].unread_count !== c.unread_count ||
                    prev[idx].last_message_at !== c.last_message_at ||
                    prev[idx].last_message !== c.last_message
                );
              return isDiff ? sanitizedConvs : prev;
            });
          }
        } catch {
          // silent
        }

        // 3. Real-time Customers directory automatic live sync (when on customers or followup tab)
        if (activeNav === 'customers' || activeNav === 'followup') {
          try {
            const fresh = await crm.getCustomers({
              status: followupStatusFilter,
              lead_probability: followupProbabilityFilter,
              preferred_doctor: followupDoctorFilter,
              q: followupSearch,
            });
            if (isMounted && Array.isArray(fresh)) {
              setCustomers((prev) => {
                const isDiff =
                  fresh.length !== prev.length ||
                  fresh.some(
                    (c, idx) =>
                      !prev[idx] ||
                      prev[idx].id !== c.id ||
                      prev[idx].last_message !== c.last_message ||
                      prev[idx].last_chat_at !== c.last_chat_at ||
                      prev[idx].unread_count !== c.unread_count ||
                      prev[idx].status !== c.status ||
                      prev[idx].lead_probability !== c.lead_probability ||
                      prev[idx].name !== c.name
                  );
                return isDiff ? fresh : prev;
              });
            }
          } catch {
            // silent
          }
        }

        // 4. Real-time live customer drawer chat polling (if drawer is open)
        const currentCustId = selectedCustomerRef.current?.id;
        if (currentCustId && (activeNav === 'customers' || activeNav === 'followup')) {
          try {
            const freshChat = await crm.getCustomerChat(currentCustId);
            if (isMounted && freshChat && selectedCustomerRef.current?.id === currentCustId) {
              setCustomerChat((prevChat) => {
                const prevMsgs = prevChat?.messages || [];
                const freshMsgs = freshChat.messages || [];
                const isDiff =
                  prevMsgs.length !== freshMsgs.length ||
                  freshMsgs.some(
                    (m, idx) =>
                      !prevMsgs[idx] ||
                      prevMsgs[idx].id !== m.id ||
                      prevMsgs[idx].status !== m.status ||
                      prevMsgs[idx].body !== m.body
                  );
                return isDiff ? freshChat : prevChat;
              });
            }
          } catch {
            // silent
          }
        }

        // 5. Real-time Bookings directory automatic live sync (when on bookings tab)
        if (activeNav === 'bookings') {
          try {
            const freshBookings = await crm.getBookings(undefined, 200);
            if (isMounted && Array.isArray(freshBookings)) {
              setBookings((prev) => {
                const isDiff =
                  freshBookings.length !== prev.length ||
                  freshBookings.some(
                    (b, idx) =>
                      !prev[idx] ||
                      prev[idx].id !== b.id ||
                      prev[idx].status !== b.status ||
                      prev[idx].start_time !== b.start_time ||
                      prev[idx].end_time !== b.end_time ||
                      prev[idx].service !== b.service ||
                      prev[idx].customer_name !== b.customer_name ||
                      prev[idx].staff_member !== b.staff_member
                  );
                return isDiff ? freshBookings : prev;
              });
            }
          } catch {
            // silent
          }
        }

        // 6. Real-time Calendar sync (when on calendar tab)
        if (activeNav === 'calendar') {
          try {
            const [bData, cData, tData] = await Promise.all([
              crm.getBookings(undefined, 500).catch(() => []),
              crm.getCustomers({ limit: 500 }).catch(() => []),
              crm.getTasks('all').catch(() => []),
            ]);
            if (isMounted) {
              if (Array.isArray(bData)) {
                setBookings((prev) => {
                  const isDiff =
                    bData.length !== prev.length ||
                    bData.some(
                      (b, idx) =>
                        !prev[idx] ||
                        prev[idx].id !== b.id ||
                        prev[idx].status !== b.status ||
                        prev[idx].start_time !== b.start_time
                    );
                  return isDiff ? bData : prev;
                });
              }
              if (Array.isArray(cData)) setCustomers(cData);
              if (Array.isArray(tData)) setTasks(tData);
            }
          } catch {
            // silent
          }
        }
      } finally {
        isPollingRef.current = false;
      }
    };

    // Fast 1200ms polling for live Inbox, 2500ms for Bookings / Calendar / Customers tabs, 5000ms for other sections
    const pollIntervalMs = activeNav === 'inbox' ? 1200 : (activeNav === 'customers' || activeNav === 'followup' || activeNav === 'bookings' || activeNav === 'calendar' ? 2500 : 5000);
    const interval = setInterval(poll, pollIntervalMs);

    // Instant poll on tab focus / visibility restore
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        poll();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeNav, followupStatusFilter, followupProbabilityFilter, followupDoctorFilter, followupSearch]);

  async function loadBookings(limit = 200) {
    setLoadingBookings(true);
    try {
      const data = await crm.getBookings(undefined, limit);
      const list = Array.isArray(data) ? data : [];
      setBookings(list);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  }

  async function loadCalendarData() {
    setLoadingBookings(true);
    try {
      const [bData, cData, tData] = await Promise.all([
        crm.getBookings(undefined, 500).catch(() => []),
        crm.getCustomers({ limit: 500 }).catch(() => []),
        crm.getTasks('all').catch(() => []),
      ]);
      if (Array.isArray(bData)) setBookings(bData);
      if (Array.isArray(cData) && cData.length > 0) setCustomers(cData);
      if (Array.isArray(tData)) setTasks(tData);
    } catch (err) {
      console.error('Error loading calendar data:', err);
    } finally {
      setLoadingBookings(false);
    }
  }

  async function handleCreateNewBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!newBookingForm.contact_phone || !newBookingForm.service || !newBookingForm.date || !newBookingForm.time) {
      setBookingCreateError('Please fill in all required fields (Client Phone, Service, Date, Time).');
      return;
    }
    setBookingCreating(true);
    setBookingCreateError('');
    setBookingCreateSuccess('');
    try {
      const startTime = `${newBookingForm.date}T${newBookingForm.time}:00`;
      await crm.createBooking({
        contact_name: newBookingForm.contact_name.trim(),
        contact_phone: newBookingForm.contact_phone.trim(),
        service: newBookingForm.service.trim(),
        start_time: startTime,
        price: Number(newBookingForm.price) || 0,
        notes: newBookingForm.notes.trim(),
      });
      setBookingCreateSuccess('Booking created successfully! WhatsApp confirmation & calendar sync triggered.');
      loadBookings();
      loadConversations();
      loadContacts();
      setTimeout(() => {
        setIsAddBookingOpen(false);
        setBookingCreateSuccess('');
        setNewBookingForm({
          contact_name: '',
          contact_phone: '',
          service: '',
          date: new Date().toISOString().split('T')[0],
          time: '10:00',
          price: 500,
          notes: '',
        });
      }, 1500);
    } catch (err: unknown) {
      setBookingCreateError(err instanceof Error ? err.message : 'Failed to create booking.');
    } finally {
      setBookingCreating(false);
    }
  }

  async function loadContacts(query?: string) {
    setLoadingContacts(true);
    try {
      const data = await crm.getContacts(query);
      setContacts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  }

  async function loadCustomers() {
    setLoadingCustomers(true);
    try {
      const data = await crm.getCustomers({
        status: followupStatusFilter,
        lead_probability: followupProbabilityFilter,
        preferred_doctor: followupDoctorFilter,
        q: followupSearch,
      });
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoadingCustomers(false);
    }
  }

  async function loadTasks() {
    setLoadingTasks(true);
    try {
      const data = await crm.getTasks(taskFilter);
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  }

  async function handleSelectCustomer(cust: Customer) {
    setSelectedCustomer(cust);
    setDrawerConcern(cust.health_concern || '');
    setDrawerAge(cust.age != null ? String(cust.age) : '');
    setDrawerLocation(cust.location || '');
    setDrawerDoctor(cust.preferred_doctor || '');
    setConfirmDeleteStep(false);
    setLoadingCustomerNotes(true);
    setLoadingCustomerChat(true);
    setLoadingCustomerBookings(true);
    setCustomerNotes([]);
    setCustomerChat(null);
    setCustomerBookingsData(null);
    try {
      const [notes, chat, bData] = await Promise.all([
        crm.getCustomerNotes(cust.id),
        crm.getCustomerChat(cust.id),
        crm.getCustomerBookings(cust.id),
      ]);
      setCustomerNotes(Array.isArray(notes) ? notes : []);
      setCustomerChat(chat);
      setCustomerBookingsData(bData);
    } catch (err) {
      console.error('Error loading customer details:', err);
    } finally {
      setLoadingCustomerNotes(false);
      setLoadingCustomerChat(false);
      setLoadingCustomerBookings(false);
    }
  }

  async function openCustomerProfileByPhone(phone: string, defaultName?: string) {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    let target = customers.find((c) => c.phone && c.phone.replace(/[^0-9]/g, '') === cleanPhone);
    if (!target) {
      try {
        const data = await crm.getCustomers();
        const list = Array.isArray(data) ? data : [];
        setCustomers(list);
        target = list.find((c) => c.phone && c.phone.replace(/[^0-9]/g, '') === cleanPhone);
      } catch (e) {}
    }
    if (target) {
      navigateTo('followup');
      handleSelectCustomer(target);
    } else {
      setQuickCrmPhone(phone);
      setQuickCrmName(defaultName || '');
      setQuickCrmConcern('General Consultation');
      setQuickCrmLead('warm');
      setQuickCrmDoctor(availableDoctors[0] || '');
      setShowQuickAddCrmModal(true);
    }
  }

  async function handleSaveQuickCrm(e: React.FormEvent) {
    e.preventDefault();
    if (!quickCrmPhone.trim()) return;
    setSavingQuickCrm(true);
    try {
      const newCust = await crm.createCustomer({
        phone: quickCrmPhone.trim(),
        name: quickCrmName.trim() || 'Customer',
        health_concern: quickCrmConcern.trim() || 'General Consultation',
        lead_probability: quickCrmLead,
        preferred_doctor: quickCrmDoctor.trim() || undefined,
        status: 'contacted',
      });
      setShowQuickAddCrmModal(false);
      const freshCustomers = await crm.getCustomers();
      const list = Array.isArray(freshCustomers) ? freshCustomers : [];
      setCustomers(list);
      const createdRecord = list.find((c) => c.id === newCust.id);
      if (createdRecord) {
        navigateTo('followup');
        handleSelectCustomer(createdRecord);
      }
      setActionNotice(`Customer ${quickCrmName || quickCrmPhone} added to CRM!`);
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      console.error('Failed to create customer:', err);
      setActionNotice('Failed to add customer to CRM.');
      setTimeout(() => setActionNotice(null), 3500);
    } finally {
      setSavingQuickCrm(false);
    }
  }

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!addCustomerForm.phone.trim()) {
      setActionNotice('Phone number is required.');
      return;
    }
    setAddingCustomer(true);
    try {
      const res = await crm.createCustomer({
        name: addCustomerForm.name.trim() || undefined,
        phone: addCustomerForm.phone.trim(),
        age: addCustomerForm.age ? parseInt(addCustomerForm.age, 10) : undefined,
        location: addCustomerForm.location.trim() || undefined,
        preferred_doctor: addCustomerForm.preferred_doctor.trim() || undefined,
        health_concern: addCustomerForm.health_concern.trim() || undefined,
        lead_probability: addCustomerForm.lead_probability,
        followup_date: addCustomerForm.followup_date || undefined,
        followup_time: addCustomerForm.followup_time || undefined,
        initial_note: addCustomerForm.initial_note.trim() || undefined,
      } as any);

      setActionNotice(`Customer ${addCustomerForm.name || addCustomerForm.phone} created successfully!`);
      setTimeout(() => setActionNotice(null), 3000);
      setShowAddCustomerModal(false);
      setAddCustomerForm({
        name: '',
        phone: '',
        age: '',
        location: '',
        preferred_doctor: '',
        health_concern: '',
        lead_probability: 'warm',
        followup_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        followup_time: '10:00 AM',
        initial_note: '',
      });
      await loadCustomers();
    } catch (err: any) {
      console.error('Failed to create customer:', err);
      setActionNotice('Failed to create customer: ' + (err.message || 'Error'));
      setTimeout(() => setActionNotice(null), 3000);
    } finally {
      setAddingCustomer(false);
    }
  }

  async function handleDeleteCustomer(customerId: string) {
    setDeletingCustomerId(customerId);
    try {
      await crm.deleteCustomer(customerId);
      setActionNotice('Customer permanently deleted.');
      setTimeout(() => setActionNotice(null), 3000);
      setCustomers(prev => prev.filter(c => c.id !== customerId));
      if (selectedCustomer && selectedCustomer.id === customerId) {
        setSelectedCustomer(null);
        setIsDrawerExpanded(false);
      }
      setConfirmDeleteStep(false);
    } catch (err: any) {
      console.error('Failed to delete customer:', err);
      setActionNotice('Failed to delete customer: ' + (err.message || 'Error'));
      setTimeout(() => setActionNotice(null), 3000);
    } finally {
      setDeletingCustomerId(null);
    }
  }

  async function handleSaveDrawerAttributes() {
    if (!selectedCustomer) return;
    setSavingDrawerAttributes(true);
    try {
      const patch = {
        health_concern: drawerConcern.trim() || undefined,
        age: drawerAge ? parseInt(drawerAge, 10) : undefined,
        location: drawerLocation.trim() || undefined,
        preferred_doctor: drawerDoctor.trim() || undefined,
      };
      await handleUpdateCustomer(selectedCustomer.id, patch as any);
      setActionNotice('Customer attributes saved successfully.');
      setTimeout(() => setActionNotice(null), 2500);
    } catch (err: any) {
      console.error('Failed to save attributes:', err);
    } finally {
      setSavingDrawerAttributes(false);
    }
  }

  async function handleDeleteCustomerFollowup(customerId: string) {
    if (!confirm('Are you sure you want to delete/clear this scheduled follow-up?')) return;
    const cleared = {
      followup_date: undefined,
      followup_time: undefined,
      google_task_id: undefined,
      google_calendar_event_id: undefined,
    };
    // Instant optimistic update
    setCustomers((prev) => prev.map((c) => (c.id === customerId ? { ...c, ...cleared } : c)));
    if (selectedCustomer && selectedCustomer.id === customerId) {
      setSelectedCustomer((prev) => (prev ? { ...prev, ...cleared } : null));
    }
    if (dirSelectedCust && dirSelectedCust.id === customerId) {
      setDirSelectedCust((prev) => (prev ? { ...prev, ...cleared } : null));
    }
    try {
      await crm.deleteCustomerFollowup(customerId);
      setActionNotice('Follow-up schedule deleted.');
      setTimeout(() => setActionNotice(null), 2500);
      loadTasks();
    } catch (err: any) {
      console.error('Failed to delete followup:', err);
      setActionNotice('Failed to delete follow-up: ' + (err.message || 'Error'));
      setTimeout(() => setActionNotice(null), 3000);
      loadCustomers();
    }
  }

  async function handleUpdateCustomer(customerId: string, patch: Partial<Customer>) {
    // Instant optimistic update
    setCustomers((prev) => prev.map((c) => (c.id === customerId ? { ...c, ...patch } : c)));
    if (selectedCustomer && selectedCustomer.id === customerId) {
      setSelectedCustomer((prev) => (prev ? { ...prev, ...patch } : null));
    }
    try {
      const updated = await crm.updateCustomer(customerId, patch);
      if (updated && updated.id) {
        setCustomers((prev) => prev.map((c) => (c.id === customerId ? { ...c, ...updated } : c)));
        if (selectedCustomer && selectedCustomer.id === customerId) {
          setSelectedCustomer((prev) => (prev ? { ...prev, ...updated } : null));
        }
      }
    } catch (err) {
      console.error('Failed to update customer:', err);
      setActionNotice('Failed to update customer field.');
      setTimeout(() => setActionNotice(null), 3000);
      loadCustomers();
    }
  }

  async function handleAddCustomerNote(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomer || !newCustomerNoteText.trim()) return;
    setAddingCustomerNote(true);
    try {
      await crm.addCustomerNote(selectedCustomer.id, {
        author: newCustomerNoteAuthor.trim() || 'Admin',
        note_text: newCustomerNoteText.trim(),
        color: newCustomerNoteColor,
      });
      const updatedNotes = await crm.getCustomerNotes(selectedCustomer.id);
      setCustomerNotes(Array.isArray(updatedNotes) ? updatedNotes : []);
      setNewCustomerNoteText('');
      setNewCustomerNoteColor('slate');
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === selectedCustomer.id
            ? { ...c, notes_count: (c.notes_count || 0) + 1, latest_note: newCustomerNoteText.trim() }
            : c
        )
      );
      setActionNotice('Note added successfully.');
      setTimeout(() => setActionNotice(null), 2500);
    } catch (err) {
      console.error('Error adding note:', err);
      alert('Failed to add note.');
    } finally {
      setAddingCustomerNote(false);
    }
  }

  async function handleSendCustomerReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomer || !customerReplyText.trim()) return;
    setSendingCustomerReply(true);
    try {
      await crm.sendCustomerChat(selectedCustomer.id, customerReplyText.trim());
      setCustomerReplyText('');
      const chat = await crm.getCustomerChat(selectedCustomer.id);
      setCustomerChat(chat);
      setActionNotice(`WhatsApp message sent to ${selectedCustomer.phone}!`);
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      console.error('Error sending WhatsApp message:', err);
      alert('Failed to send WhatsApp message.');
    } finally {
      setSendingCustomerReply(false);
    }
  }

  async function handleSyncCustomerToGoogleTasks(customerId: string) {
    setSyncingGoogleTasks(true);
    try {
      const res = await crm.syncCustomerToGoogleTasks(customerId);
      if (res && res.google_task_id) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === customerId ? { ...c, google_task_id: res.google_task_id } : c))
        );
        if (selectedCustomer && selectedCustomer.id === customerId) {
          setSelectedCustomer((prev) => (prev ? { ...prev, google_task_id: res.google_task_id } : null));
        }
        setActionNotice('Added to Google Tasks successfully!');
        setTimeout(() => setActionNotice(null), 4000);
        loadTasks();
      }
    } catch (err: any) {
      console.error('Error syncing Google Tasks:', err);
      alert(err.message || 'Failed to sync with Google Tasks. Please make sure Google is connected in Settings.');
    } finally {
      setSyncingGoogleTasks(false);
    }
  }

  async function handleToggleTask(taskId: string) {
    setTogglingTaskId(taskId);
    try {
      const res = await crm.toggleTask(taskId);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: res.completed, is_overdue: false } : t))
      );
    } catch (err) {
      console.error('Error toggling task:', err);
    } finally {
      setTogglingTaskId(null);
    }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!addTaskTitle.trim()) return;
    setSavingTask(true);
    try {
      let dueDateTimeISO: string | undefined;
      if (addTaskDueDate) {
        const [h, m] = (addTaskDueTime || '10:00').split(':').map(Number);
        const dt = new Date(addTaskDueDate + 'T00:00:00');
        dt.setHours(h || 10, m || 0, 0, 0);
        dueDateTimeISO = dt.toISOString();
      }
      const created = await crm.createTask({
        customer_id: addTaskCustomerId || undefined,
        title: addTaskTitle.trim(),
        description: addTaskDesc.trim() || undefined,
        due_date: dueDateTimeISO,
        sync_google_tasks: addTaskSyncGT,
        sync_google_calendar: addTaskSyncCal,
      });
      setShowAddTaskModal(false);
      setAddTaskTitle('');
      setAddTaskDesc('');
      setAddTaskDueDate('');
      setAddTaskDueTime('10:00');
      setAddTaskCustomerId('');
      setAddTaskSyncGT(true);
      setAddTaskSyncCal(false);
      // Reload tasks
      const refreshed = await crm.getTasks(taskFilter);
      setTasks(Array.isArray(refreshed) ? refreshed : []);

      let notice = 'Task created successfully.';
      if (created.google_task_id && created.google_event_id) {
        notice = 'Task created & synced to Google Tasks and Google Calendar.';
      } else if (created.google_task_id) {
        notice = 'Task created & synced to Google Tasks.';
      } else if (created.google_event_id) {
        notice = 'Task created & added to Google Calendar schedule.';
      }
      if (created.tasks_permission_needed) {
        notice += ' (Reconnect Google in Settings to grant Tasks permission)';
      }
      setActionNotice(notice);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err) {
      console.error('Error creating task:', err);
      alert('Failed to create task. Please try again.');
    } finally {
      setSavingTask(false);
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await crm.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setActionNotice('Task deleted successfully.');
      setTimeout(() => setActionNotice(null), 2500);
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Failed to delete task.');
    }
  }

  async function handleCreateOverallNote(e: React.FormEvent) {
    e.preventDefault();
    if (!overallNoteText.trim() || !overallNoteCustomerId) return;
    setSavingOverallNote(true);
    try {
      await crm.createOverallNote({
        customer_id: overallNoteCustomerId,
        note_text: overallNoteText.trim(),
        author: overallNoteAuthor.trim() || 'Staff',
        color: overallNoteColor,
      });
      setShowAddOverallNoteModal(false);
      setOverallNoteText('');
      setOverallNoteCustomerId('');
      setOverallNoteAuthor('Staff');
      setOverallNoteColor('slate');
      setLoadingAllNotes(true);
      const updated = await crm.getAllNotes({
        color: allNotesColorFilter === 'all' ? undefined : allNotesColorFilter,
        q: allNotesSearch || undefined,
      });
      setAllNotes(Array.isArray(updated) ? updated : []);
      if (selectedCustomer && selectedCustomer.id === overallNoteCustomerId) {
        const cNotes = await crm.getCustomerNotes(selectedCustomer.id);
        setCustomerNotes(Array.isArray(cNotes) ? cNotes : []);
      }
      setActionNotice('Note added successfully.');
      setTimeout(() => setActionNotice(null), 2500);
    } catch (err) {
      console.error('Failed to create note:', err);
      alert('Failed to add note. Please try again.');
    } finally {
      setSavingOverallNote(false);
      setLoadingAllNotes(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await crm.deleteCustomerNote(noteId);
      setAllNotes((prev) => prev.filter((n) => n.id !== noteId));
      setCustomerNotes((prev) => prev.filter((n) => n.id !== noteId));
      setActionNotice('Note deleted successfully.');
      setTimeout(() => setActionNotice(null), 2500);
    } catch (err) {
      console.error('Failed to delete note:', err);
      alert('Failed to delete note.');
    }
  }

  async function loadSettings() {
    setSettingsLoading(true);
    setSettingsError('');
    try {
      const data = await crm.getSettings();
      setSettingsForm(data);
      loadMetaTemplatesStatus();
      if (typeof window !== 'undefined') {
        const slug = data?.slug || localStorage.getItem('tenant_slug') || 'boldlabs';
        localStorage.setItem('tenant_slug', slug);
        if (window.location.pathname === '/dashboard' || window.location.pathname === '/') {
          window.history.replaceState(null, '', `/${slug}${window.location.hash || ''}`);
        }
      }
    } catch (err: unknown) {
      setSettingsError(err instanceof Error ? err.message : 'Failed to load client settings.');
    } finally {
      setSettingsLoading(false);
    }
  }

  async function handleSaveSettings(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSettingsSaving(true);
    setSettingsError('');
    setSettingsSaved(false);
    try {
      const payload: Partial<TenantSettingsResponse> = {
        name: settingsForm.name,
        logo_url: settingsForm.logo_url,
        admin_whatsapp_number: settingsForm.admin_whatsapp_number,
        notification_email: settingsForm.notification_email,
        timezone: settingsForm.timezone,
        country_code: settingsForm.country_code,
        currency: settingsForm.currency,
        currency_symbol: settingsForm.currency_symbol,
        full_location_text: settingsForm.full_location_text,
        industry: settingsForm.industry,
        taxonomy: {
          ...(settingsForm.taxonomy || currentTaxonomy),
        },
        ai_prompt: settingsForm.ai_prompt,
        ai_model: settingsForm.ai_model,
        primary_model_provider: settingsForm.primary_model_provider,
        assistant_name: settingsForm.assistant_name,
        bot_goal: settingsForm.bot_goal,
        services_text: settingsForm.services_text,
        response_style: settingsForm.response_style,
        methodology: settingsForm.methodology,
        strict_rules: settingsForm.strict_rules,
        objection_handling: settingsForm.objection_handling,
        google_review_link: settingsForm.google_review_link,
        template_booking_confirmation: settingsForm.template_booking_confirmation,
        template_reschedule_confirmation: settingsForm.template_reschedule_confirmation,
        template_cancellation_confirmation: settingsForm.template_cancellation_confirmation,
        template_post_service_review: settingsForm.template_post_service_review,
        template_appointment_reminder: settingsForm.template_appointment_reminder,
        template_reschedule_nudge: settingsForm.template_reschedule_nudge,
        template_review_request: settingsForm.template_review_request,
        template_client_followup: settingsForm.template_client_followup,
        template_admin_notification: settingsForm.template_admin_notification,
        template_admin_reschedule_notice: settingsForm.template_admin_reschedule_notice,
        template_admin_human_request: settingsForm.template_admin_human_request,
        template_admin_cancellation_notice: settingsForm.template_admin_cancellation_notice,
        template_admin_daily_digest: settingsForm.template_admin_daily_digest,
      };
      if (settingsForm.meta_phone_id) payload.meta_phone_id = settingsForm.meta_phone_id;
      if (settingsForm.meta_waba_id) payload.meta_waba_id = settingsForm.meta_waba_id;
      if (settingsForm.meta_access_token) payload.meta_access_token = settingsForm.meta_access_token;
      if (settingsForm.meta_app_secret) payload.meta_app_secret = settingsForm.meta_app_secret;
      if (settingsForm.verify_token) payload.verify_token = settingsForm.verify_token;
      if (settingsForm.gemini_api_key) payload.gemini_api_key = settingsForm.gemini_api_key;
      if (settingsForm.groq_api_key) payload.groq_api_key = settingsForm.groq_api_key;
      if (settingsForm.opencode_api_key) payload.opencode_api_key = settingsForm.opencode_api_key;
      if (settingsForm.opencode_base_url) payload.opencode_base_url = settingsForm.opencode_base_url;

      const updated = await crm.updateSettings(payload);
      if (updated && updated.name !== undefined) {
        setSettingsForm((prev) => ({ ...prev, ...updated }));
        if (typeof window !== 'undefined') {
          const slug = updated.slug || settingsForm.slug || localStorage.getItem('tenant_slug') || 'boldlabs';
          localStorage.setItem('tenant_slug', slug);
          if (window.location.pathname === '/dashboard' || window.location.pathname === '/') {
            window.history.replaceState(null, '', `/${slug}${window.location.hash || ''}`);
          }
        }
      } else {
        await loadSettings();
      }
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 4000);
    } catch (err: unknown) {
      console.error('Settings save error:', err);
      setSettingsError(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setSettingsSaving(false);
    }
  }

  async function loadConversations() {
    setIsRefreshing(true);
    try {
      const convs = await crm.getConversations();
      if (Array.isArray(convs)) {
        const activeId = selectedConvRef.current?.id;
        const sanitized = convs.map((c) =>
          c.id === activeId ? { ...c, unread_count: 0 } : c
        );
        setConversations(sanitized);
      } else {
        setConversations([]);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setIsRefreshing(false);
      setLoadingConvs(false);
    }
  }

  async function selectConversation(conv: Conversation) {
    const updatedConv = { ...conv, unread_count: 0 };
    setSelectedConv(updatedConv);
    activeConvIdRef.current = conv.id;

    // Immediately clear unread badge in conversation list
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
    );

    // Instant switch: if messages were already loaded, show them instantly with 0ms delay and NO loading spinner!
    const cached = messagesCacheRef.current[conv.id];
    if (cached && cached.length > 0) {
      setMessages(cached);
      setLoadingMessages(false);
    } else {
      setMessages([]);
      setLoadingMessages(true);
    }

    try {
      const msgs = await crm.getMessages(conv.id);
      const validMsgs = Array.isArray(msgs) ? msgs : [];
      if (activeConvIdRef.current === conv.id) {
        messagesCacheRef.current[conv.id] = validMsgs;
        setMessages(validMsgs);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      if (activeConvIdRef.current === conv.id) {
        setLoadingMessages(false);
      }
    }
  }

  function scrollToBottom(instant = true) {
    if (messagesContainerRef.current) {
      const el = messagesContainerRef.current;
      el.style.scrollBehavior = instant ? 'auto' : 'smooth';
      el.scrollTop = el.scrollHeight;
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv || sendingMessage) return;

    const text = newMessage;
    setNewMessage('');
    setSendingMessage(true);

    try {
      const sent = await crm.sendMessage(selectedConv.id, text);
      setMessages((prev) => {
        const next = [...prev, sent];
        if (selectedConv) {
          messagesCacheRef.current[selectedConv.id] = next;
        }
        return next;
      });
      scrollToBottom();
      loadConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Could not send WhatsApp message. Please verify your Meta credentials in Settings.');
    } finally {
      setSendingMessage(false);
    }
  }

  async function handleToggleAi(convId: string, currentStatus: boolean) {
    setTogglingAi(true);
    const newStatus = !currentStatus;
    try {
      // Optimistic update
      setSelectedConv((prev) => (prev && prev.id === convId ? { ...prev, ai_enabled: newStatus } : prev));
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, ai_enabled: newStatus } : c))
      );

      const updated = await crm.toggleAi(convId, newStatus);
      setSelectedConv((prev) => (prev && prev.id === convId ? { ...prev, ai_enabled: updated.ai_enabled } : prev));
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, ai_enabled: updated.ai_enabled } : c))
      );
      setActionNotice(newStatus ? 'AI Auto-Reply enabled for this chat!' : 'Switched to Human Mode (AI paused for this chat).');
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err) {
      console.error('Failed to toggle AI mode:', err);
      // Revert on error
      setSelectedConv((prev) => (prev && prev.id === convId ? { ...prev, ai_enabled: currentStatus } : prev));
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, ai_enabled: currentStatus } : c))
      );
    } finally {
      setTogglingAi(false);
    }
  }

  async function handleToggleAllAi(enable: boolean) {
    setTogglingAi(true);
    try {
      // Optimistic update
      setConversations((prev) => prev.map((c) => ({ ...c, ai_enabled: enable })));
      setSelectedConv((prev) => (prev ? { ...prev, ai_enabled: enable } : null));

      await crm.toggleAllAi(enable);
      setActionNotice(enable ? 'AI Auto-Reply enabled for ALL chats!' : 'AI Auto-Reply paused (Human Mode) for ALL chats!');
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      console.error('Failed to toggle all AI:', err);
      alert('Failed to update AI status for all chats.');
    } finally {
      setTogglingAi(false);
    }
  }

  async function handleDeleteConversation(convId: string, deleteType: 'for_me' | 'for_everyone') {
    setDeletingItem(true);
    try {
      await crm.deleteConversation(convId, deleteType);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (selectedConv?.id === convId) {
        setSelectedConv(null);
        setMessages([]);
      }
      setDeleteChatModal(null);
      setActionNotice(
        deleteType === 'for_everyone'
          ? 'Chat history deleted for everyone.'
          : 'Chat deleted from CRM.'
      );
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      alert('Could not delete conversation. Please try again.');
    } finally {
      setDeletingItem(false);
    }
  }

  useEffect(() => {
    if (selectedBookingDetail?.start_time) {
      const dt = new Date(selectedBookingDetail.start_time);
      if (!isNaN(dt.getTime())) {
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const d = String(dt.getDate()).padStart(2, '0');
        const hr = String(dt.getHours()).padStart(2, '0');
        const min = String(dt.getMinutes()).padStart(2, '0');
        setRescheduleDate(`${y}-${m}-${d}`);
        setRescheduleTime(`${hr}:${min}`);
      }
    }
  }, [selectedBookingDetail]);

  async function handleUpdateBookingStatus(bookingId: string, newStatus: string, newStartTime?: string) {
    setUpdatingBookingId(bookingId);
    setActionNotice(null);
    try {
      await crm.updateBookingStatus(bookingId, newStatus, newStartTime);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus, ...(newStartTime ? { start_time: newStartTime } : {}) } : b))
      );
      if (selectedBookingDetail && selectedBookingDetail.id === bookingId) {
        setSelectedBookingDetail({ ...selectedBookingDetail, status: newStatus, ...(newStartTime ? { start_time: newStartTime } : {}) });
      }

      if (newStatus === 'completed') {
        setActionNotice('Client marked Attended! Post-service review request template scheduled to send in 15 minutes via WhatsApp.');
      } else if (newStatus === 'no_show') {
        setActionNotice('Client marked No-Show! Reschedule nudge WhatsApp template sent to client.');
      } else if (newStatus === 'cancelled') {
        setActionNotice('Booking Cancelled. Cancellation notification WhatsApp template sent to client.');
      } else if (newStatus === 'confirmed') {
        setActionNotice('Booking Confirmed! Official confirmation WhatsApp template sent to client.');
      } else if (newStatus === 'rescheduled') {
        setActionNotice('Booking Rescheduled! Reschedule confirmation WhatsApp template sent to client.');
      }
      setTimeout(() => setActionNotice(null), 5500);
      loadBookings();
    } catch (err) {
      alert('Failed to update booking status.');
    } finally {
      setUpdatingBookingId(null);
    }
  }

  async function handleRescheduleBooking(bookingId: string, newDate: string, newTime: string) {
    if (!newDate || !newTime) {
      alert('Please select both a new date and time to reschedule.');
      return;
    }
    setIsRescheduling(true);
    try {
      const newStartTime = `${newDate}T${newTime}:00`;
      await handleUpdateBookingStatus(bookingId, 'rescheduled', newStartTime);
      setIsBookingDetailModalOpen(false);
      setSelectedBookingDetail(null);
      loadCalendarData();
    } catch (err: any) {
      alert(err instanceof Error ? err.message : 'Failed to reschedule booking.');
    } finally {
      setIsRescheduling(false);
    }
  }

  async function handleUpdatePrice(bookingId: string, newPrice: number) {
    if (isNaN(newPrice) || newPrice < 0) {
      setActionNotice('Please enter a valid non-negative price.');
      setTimeout(() => setActionNotice(null), 3000);
      return;
    }
    setUpdatingPrice(true);
    try {
      await crm.updateBookingPrice(bookingId, newPrice);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, price: newPrice } : b))
      );
      if (selectedBookingDetail && selectedBookingDetail.id === bookingId) {
        setSelectedBookingDetail({ ...selectedBookingDetail, price: newPrice });
      }
      setEditingBookingPriceId(null);
      setActionNotice(`Booking fee updated to ${currentCurrencySymbol}${newPrice}`);
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      console.error('Failed to update booking price:', err);
      setActionNotice('Failed to update price. Please try again.');
      setTimeout(() => setActionNotice(null), 3500);
    } finally {
      setUpdatingPrice(false);
    }
  }

  function navigateTo(tab: 'overview' | 'inbox' | 'bookings' | 'calendar' | 'customers' | 'followup' | 'marketing' | 'settings') {
    setActiveNav(tab);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('whatsapp_crm_active_nav', tab);
        window.history.replaceState(null, '', `${window.location.pathname}#${tab}`);
      } catch {}
    }
    setIsBookingDetailModalOpen(false);
    setSelectedBookingDetail(null);
    setIsAddBookingOpen(false);
    if (tab === 'inbox') setSelectedConv(null);
  }

  // Auto-select all contacts when contacts array is loaded
  useEffect(() => {
    if (contacts.length > 0 && selectedContactIds.length === 0) {
      setSelectedContactIds(contacts.map((c) => c.id));
    }
  }, [contacts]);

  // CSV / Google Sheet Lead Parser
  function handleParseCsv(text: string) {
    if (!text.trim()) {
      setSheetParsingError('Please paste or upload valid CSV or Google Sheet rows.');
      return;
    }
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const parsed: { name: string; phone: string }[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split(/[,\t;]+/).map((p) => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length === 0) continue;

      // Skip header row if matches common terms
      if (i === 0 && parts.some((p) => /^(name|phone|mobile|contact|lead|customer|number|tel)/i.test(p))) {
        continue;
      }

      let phone = '';
      let name = '';

      for (const p of parts) {
        const cleanDigits = p.replace(/[^\d+]/g, '');
        if (cleanDigits.length >= 7 && cleanDigits.length <= 15) {
          phone = cleanDigits;
        } else if (p.length > 0 && !name) {
          name = p;
        }
      }

      if (phone) {
        const cleanKey = phone.replace(/[^\d]/g, '');
        if (!seen.has(cleanKey)) {
          seen.add(cleanKey);
          parsed.push({ name: name || 'Lead', phone });
        }
      }
    }

    if (parsed.length === 0) {
      setSheetParsingError('No valid phone numbers found. Make sure each row contains a phone number.');
    } else {
      setSheetParsingError(null);
      setSheetLeads((prev) => {
        const combined = [...prev];
        parsed.forEach((p) => {
          if (!combined.some((existing) => existing.phone.replace(/[^\d]/g, '') === p.phone.replace(/[^\d]/g, ''))) {
            combined.push(p);
          }
        });
        return combined;
      });
      setSheetRawInput('');
      setActionNotice(`Parsed & added ${parsed.length} leads from Google Sheet / CSV!`);
      setTimeout(() => setActionNotice(null), 4000);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) handleParseCsv(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleCreateTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTemplateForm.name.trim() || !newTemplateForm.body.trim()) {
      setTemplateManagerError('Please enter a template name and message body.');
      return;
    }
    setCreatingTemplate(true);
    setTemplateManagerError(null);
    setTemplateManagerSuccess(null);
    try {
      const cleanName = newTemplateForm.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, '');
      const created = await marketing.createTemplate({
        name: cleanName,
        label: newTemplateForm.label.trim() || `${cleanName} (${newTemplateForm.category})`,
        category: newTemplateForm.category,
        language: newTemplateForm.language || 'en_US',
        body: newTemplateForm.body,
        variables_count: newTemplateForm.variables_count,
      });

      setTemplateManagerSuccess(`Template "${created.name}" created successfully with status ${created.status}!`);
      setNewTemplateForm({
        name: '',
        label: '',
        category: 'UTILITY',
        language: 'en_US',
        body: '',
        variables_count: 2,
      });
      await loadMarketingTemplates();
      setCampaignForm((prev) => ({ ...prev, template_name: created.name }));
    } catch (err: any) {
      setTemplateManagerError(err.message || 'Failed to create template.');
    } finally {
      setCreatingTemplate(false);
    }
  }

  async function handleDeleteTemplate(templateName: string) {
    if (!confirm(`Are you sure you want to delete template "${templateName}"? This action cannot be undone.`)) return;
    setTemplateManagerError(null);
    setTemplateManagerSuccess(null);
    try {
      await marketing.deleteTemplate(templateName);
      setTemplateManagerSuccess(`Template "${templateName}" deleted.`);
      await loadMarketingTemplates();
      if (campaignForm.template_name === templateName) {
        setCampaignForm((prev) => ({ ...prev, template_name: 'utility_general_update' }));
      }
    } catch (err: any) {
      setTemplateManagerError(err.message || 'Failed to delete template.');
    }
  }

  function handleAddCustomTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTemplateForm.name.trim()) return;
    const cleanName = newTemplateForm.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const newTpl = {
      id: cleanName,
      name: cleanName,
      label: newTemplateForm.label.trim() || cleanName,
      variables_count: Number(newTemplateForm.variables_count) || 2,
    };
    setCustomTemplates((prev) => {
      const updated = [...prev.filter((t) => t.name !== cleanName), newTpl];
      try {
        localStorage.setItem('whatsapp_crm_custom_templates', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setCampaignForm((prev) => ({ ...prev, template_name: cleanName }));
    setNewTemplateModal(false);
    setNewTemplateForm({ name: '', label: '', category: 'UTILITY', language: 'en_US', body: '', variables_count: 2 });
    setActionNotice(`Approved template "${cleanName}" saved and selected!`);
    setTimeout(() => setActionNotice(null), 4000);
  }

  async function handleLaunchBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!campaignForm.campaign_name.trim()) {
      setActionNotice('Please enter a campaign name.');
      setTimeout(() => setActionNotice(null), 3000);
      return;
    }

    // Resolve target recipients based on 3-way audience selection
    let targetList: { name: string; phone: string; source: 'crm' | 'sheet' }[] = [];

    if (campaignForm.target_audience === 'contacts_only' || campaignForm.target_audience === 'both') {
      const chosen = contacts.filter((c) => selectedContactIds.includes(c.id));
      chosen.forEach((c) => {
        if (c.phone) targetList.push({ name: c.name || 'Customer', phone: c.phone, source: 'crm' });
      });
      // Fallback to active conversations if contacts table is empty
      if (targetList.length === 0 && contacts.length === 0) {
        conversations.forEach((c) => {
          const ph = c.contact_phone || c.phone;
          if (ph) targetList.push({ name: c.contact_name || 'Customer', phone: ph, source: 'crm' });
        });
      }
    }

    if (campaignForm.target_audience === 'sheet_only' || campaignForm.target_audience === 'both') {
      sheetLeads.forEach((l) => {
        if (l.phone) targetList.push({ name: l.name || 'Lead', phone: l.phone, source: 'sheet' });
      });
    }

    // Deduplicate by clean phone digits
    const seen = new Set<string>();
    const uniqueTargets: { name: string; phone: string; source: 'crm' | 'sheet' }[] = [];
    for (const item of targetList) {
      const clean = item.phone.replace(/[^\d]/g, '');
      if (clean && !seen.has(clean)) {
        seen.add(clean);
        uniqueTargets.push(item);
      }
    }

    const targetPhones = uniqueTargets.map((t) => t.phone);

    if (targetPhones.length === 0) {
      setActionNotice('No target phone numbers selected. Please select contacts or load Google Sheet leads.');
      setTimeout(() => setActionNotice(null), 3500);
      return;
    }

    setSendingBroadcast(true);
    setBroadcastProgress({ total: targetPhones.length, sent: 0 });

    try {
      const currentTpl = customTemplates.find((t) => t.name === campaignForm.template_name);
      const varCount = currentTpl ? currentTpl.variables_count : 3;

      const rawParams = [
        campaignForm.template_param1 || 'Customer',
        campaignForm.template_param2 || settingsForm.name || 'Boldlabs',
        campaignForm.template_param3 || 'Special Promotion',
        campaignForm.template_param4 || 'Visit Us',
      ];

      const templateParams =
        campaignForm.message_mode === 'template'
          ? rawParams.slice(0, varCount).filter(Boolean)
          : undefined;

      // Build scheduled_at ISO string if scheduling is enabled
      let scheduledAt: string | null = null;
      const isScheduled = campaignForm.send_mode === 'scheduled';
      if (isScheduled && campaignForm.schedule_date && campaignForm.schedule_time) {
        scheduledAt = new Date(`${campaignForm.schedule_date}T${campaignForm.schedule_time}:00`).toISOString();
      }

      const res = await marketing.sendBroadcast({
        campaign_name: campaignForm.campaign_name,
        recipient_phones: targetPhones,
        message_text: campaignForm.message_mode === 'text' ? campaignForm.message_text : undefined,
        template_name:
          campaignForm.message_mode === 'template'
            ? (settingsForm[campaignForm.template_name as keyof typeof settingsForm] as string) ||
              campaignForm.template_name
            : undefined,
        template_params: templateParams,
        target_audience: campaignForm.target_audience,
        message_mode: campaignForm.message_mode,
        is_scheduled: isScheduled,
        scheduled_at: scheduledAt,
      });

      // Reload campaigns from backend to get real data
      marketing.getCampaigns()
        .then((data) => setCampaigns(Array.isArray(data) ? data : []))
        .catch(() => {});

      setBroadcastSuccessNotice(
        res.scheduled_at
          ? `Campaign "${campaignForm.campaign_name}" scheduled for ${formatDateTime12(res.scheduled_at)}!`
          : `Campaign "${campaignForm.campaign_name}" launched successfully to ${targetPhones.length} recipients!`
      );
      setTimeout(() => setBroadcastSuccessNotice(null), 6000);

      setCampaignForm({
        campaign_name: '',
        target_audience: 'contacts_only',
        message_mode: 'template',
        template_name: 'utility_general_update',
        template_param1: '',
        template_param2: '',
        template_param3: '',
        template_param4: '',
        message_text: '',
        send_mode: 'now',
        schedule_date: new Date(Date.now() + 3600000).toISOString().split('T')[0],
        schedule_time: '10:00',
      });
      setSelectedContactIds([]);
      setSheetLeads([]);
    } catch (err: any) {
      console.error('Failed to launch broadcast:', err);
      setActionNotice(`Broadcast error: ${err.message || 'Failed to dispatch'}`);
      setTimeout(() => setActionNotice(null), 4000);
    } finally {
      setSendingBroadcast(false);
      setBroadcastProgress(null);
    }
  }

  async function openChatForContact(phone: string) {
    if (!phone) return;
    setIsBookingDetailModalOpen(false);
    setSelectedBookingDetail(null);
    const cleanTarget = phone.replace(/[^0-9]/g, '');

    // 1. Search in current state
    let target = conversations.find((c) => {
      const cPhone = (c.contact_phone || c.phone || '').replace(/[^0-9]/g, '');
      return cPhone === cleanTarget || (cleanTarget.length >= 10 && cPhone.endsWith(cleanTarget.slice(-10)));
    });

    // 2. If not found in state (e.g. user started on Customers tab), fetch latest conversations
    if (!target) {
      try {
        const freshConvs = await crm.getConversations();
        if (Array.isArray(freshConvs)) {
          setConversations(freshConvs);
          target = freshConvs.find((c) => {
            const cPhone = (c.contact_phone || c.phone || '').replace(/[^0-9]/g, '');
            return cPhone === cleanTarget || (cleanTarget.length >= 10 && cPhone.endsWith(cleanTarget.slice(-10)));
          });
        }
      } catch (err) {
        console.error('Failed to load conversations for contact:', err);
      }
    }

    if (target) {
      setSelectedConv(target);
      selectConversation(target);
    }
    setActiveNav('inbox');
  }

  function handleLogout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('tenant_id');
    router.push('/login');
  }

  function copyToClipboard(text: string, fieldName: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(fieldName);
    setTimeout(() => setCopiedKey(null), 2500);
  }

  // Calendar Date Navigation Helpers
  function handlePrevDate() {
    const d = new Date(currentDate);
    if (calendarViewMode === 'day') d.setDate(d.getDate() - 1);
    else if (calendarViewMode === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  }

  function handleNextDate() {
    const d = new Date(currentDate);
    if (calendarViewMode === 'day') d.setDate(d.getDate() + 1);
    else if (calendarViewMode === 'week') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  }

  function handleToday() {
    setCurrentDate(new Date());
  }

  // Filtered lists
  const filteredConversations = (conversations || []).filter((c) => {
    if (!c) return false;
    const phone = c.contact_phone || c.phone || '';
    const name = c.contact_name || c.name || '';
    const matchesSearch =
      phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'new') {
      const isUnread = (c.unread_count || 0) > 0;
      const isRecent = c.last_message_at ? (Date.now() - new Date(c.last_message_at).getTime() < 86400000) : false;
      return isUnread || isRecent;
    }
    if (filter === 'important') {
      return importantConvIds.includes(c.id);
    }
    return true;
  });

  const filteredBookings = (bookings || []).filter((b) => {
    if (!b) return false;
    const matchesSearch =
      (b.contact_name || '').toLowerCase().includes(bookingSearch.toLowerCase()) ||
      (b.contact_phone || '').toLowerCase().includes(bookingSearch.toLowerCase()) ||
      (b.service || '').toLowerCase().includes(bookingSearch.toLowerCase());
    if (!matchesSearch) return false;

    const isPast = b.start_time ? new Date(b.start_time).getTime() < Date.now() : false;

    if (bookingFilter === 'upcoming') {
      // Upcoming: Active bookings (confirmed or pending) whose scheduled time has not passed yet
      return (b.status === 'confirmed' || b.status === 'pending') && !isPast;
    }
    if (bookingFilter === 'completed') {
      // Completed: explicitly completed/attended OR bookings whose scheduled time has passed and are not cancelled/no-show
      return (
        b.status === 'completed' ||
        b.status === 'attended' ||
        (isPast && b.status !== 'cancelled' && b.status !== 'no_show')
      );
    }
    if (bookingFilter === 'no_show') {
      return b.status === 'no_show';
    }
    if (bookingFilter === 'cancelled') {
      return b.status === 'cancelled';
    }
    return b.status === bookingFilter;
  });

  const filteredContacts = (contacts || []).filter((ct) => {
    if (!ct) return false;
    return (
      (ct.name || '').toLowerCase().includes(contactSearch.toLowerCase()) ||
      (ct.phone || '').toLowerCase().includes(contactSearch.toLowerCase())
    );
  });

  // Calendar View Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };
  const currentWeekDays = getWeekDays(currentDate);

  let calendarTitle = monthName;
  if (calendarViewMode === 'day') {
    calendarTitle = currentDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  } else if (calendarViewMode === 'week') {
    const first = currentWeekDays[0];
    const last = currentWeekDays[6];
    calendarTitle = `${first.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${last.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  const isSameDay = (d1: any, d2: any) => {
    if (!d1 || !d2) return false;
    const toDateObj = (val: any): Date | null => {
      if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
      const str = String(val).trim();
      if (!str) return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const [y, m, d] = str.split('-').map(Number);
        return new Date(y, m - 1, d);
      }
      const parsed = new Date(str);
      return isNaN(parsed.getTime()) ? null : parsed;
    };
    const date1 = toDateObj(d1);
    const date2 = toDateObj(d2);
    if (!date1 || !date2) return false;
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const parseEventTime = (timeStr: string | null | undefined): { hour: number; minute: number; formatted: string; isAllDay: boolean } => {
    if (!timeStr || typeof timeStr !== 'string') {
      return { hour: -1, minute: 0, formatted: 'All Day', isAllDay: true };
    }
    const s = timeStr.trim();
    if (!s || /^(all[\s-]?day|anytime|any[\s-]?time|today)$/i.test(s)) {
      return { hour: -1, minute: 0, formatted: 'All Day', isAllDay: true };
    }
    const m = s.match(/^(\d{1,2})(?::(\d{1,2}))?\s*(AM|PM)?$/i);
    if (!m) {
      return { hour: -1, minute: 0, formatted: s, isAllDay: true };
    }
    let h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2].padEnd(2, '0').slice(0, 2), 10) : 0;
    const ampm = m[3] ? m[3].toUpperCase() : null;
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    if (h < 0 || h > 23) {
      return { hour: -1, minute: 0, formatted: s, isAllDay: true };
    }
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayAmpm = h >= 12 ? 'PM' : 'AM';
    const displayMin = String(min).padStart(2, '0');
    return {
      hour: h,
      minute: min,
      formatted: `${displayH}:${displayMin} ${displayAmpm}`,
      isAllDay: false,
    };
  };

  const parseTaskTime = (dueDateStr: string | null | undefined): { hour: number; minute: number; formatted: string; isAllDay: boolean } => {
    if (!dueDateStr) return { hour: -1, minute: 0, formatted: 'All Day', isAllDay: true };
    if (!dueDateStr.includes('T') && !dueDateStr.includes(' ')) {
      return { hour: -1, minute: 0, formatted: 'All Day', isAllDay: true };
    }
    const d = new Date(dueDateStr);
    if (isNaN(d.getTime())) return { hour: -1, minute: 0, formatted: 'All Day', isAllDay: true };
    const h = d.getHours();
    const m = d.getMinutes();
    if (h === 0 && m === 0 && d.getSeconds() === 0) {
      return { hour: -1, minute: 0, formatted: 'All Day', isAllDay: true };
    }
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayAmpm = h >= 12 ? 'PM' : 'AM';
    const displayMin = String(m).padStart(2, '0');
    return {
      hour: h,
      minute: m,
      formatted: `${displayH}:${displayMin} ${displayAmpm}`,
      isAllDay: false,
    };
  };

  if (isAuthChecking) {
    return (
      <div className="h-screen w-screen bg-[#0a0f1d] flex flex-col items-center justify-center gap-3 select-none">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (!localStorage.getItem('auth_token')) {
                  window.location.replace('/login');
                }
              } catch (e) {}
            `,
          }}
        />
        <div className="w-9 h-9 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-sm font-semibold text-white tracking-wide">Boldlabs CRM</span>
          <span className="text-xs text-slate-400">Verifying authorized access...</span>
        </div>
      </div>
    );
  }

  const isWorkspaceLocked =
    user?.role !== 'superadmin' &&
    Boolean(
      settingsForm.subscription_status === 'payment_failed' ||
      settingsForm.subscription_status === 'paused' ||
      settingsForm.subscription_status === 'cancelled' ||
      settingsForm.org_lifecycle_stage === 'payment_failed' ||
      settingsForm.org_lifecycle_stage === 'paused'
    );

  if (isWorkspaceLocked) {
    return (
      <div className="min-h-screen bg-[#090d16] text-text-primary flex flex-col justify-center items-center px-4 font-sans select-none">
        <div className="w-full max-w-md bg-surface border border-amber-500/30 rounded-xl p-6 shadow-2xl space-y-5 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 mx-auto">
            <CreditCard className="w-7 h-7 stroke-[1.5]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Workspace Access Paused
            </h1>
            <p className="text-xs text-text-muted mt-1">
              Organization: <span className="text-amber-400 font-semibold">{settingsForm.name || 'Boldlabs CRM'}</span>
            </p>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-left text-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Subscription Payment Required</span>
            </div>
            <p className="text-text-secondary leading-relaxed">
              Your monthly subscription for this workspace has an outstanding or pending payment. Your customer records, chat histories, and configurations remain completely secure.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {settingsForm.razorpay_short_url ? (
              <a
                href={settingsForm.razorpay_short_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg transition-colors duration-150 flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-600/20"
              >
                <CreditCard className="w-4 h-4" />
                <span>Complete Payment via Razorpay</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <div className="p-3 bg-white/5 border border-border rounded-lg text-xs text-text-muted">
                Please contact support or your account manager to renew access.
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('auth_token');
                  window.location.replace('/login');
                }
              }}
              className="w-full py-2.5 px-4 bg-transparent hover:bg-surface-hover text-text-secondary hover:text-text-primary text-xs rounded-lg transition-colors duration-150 flex items-center justify-center gap-2 border border-border"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out of account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderMetaTemplatesView = () => (
    <div className="space-y-5 bg-surface p-5 rounded-md border border-border">
      <div className="pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-xs text-text-primary flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent stroke-[1.5]" />
              <span>Meta WhatsApp Message Templates</span>
            </h4>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              100% Utility (Low Cost)
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Standardized transactional templates for appointment lifecycle, interactive reschedule nudges, reviews, and staff alerts. Auto-tailored to your industry ({settingsForm.industry?.toUpperCase() || 'CLINIC'}).
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={loadingMetaTemplates}
            onClick={() => loadMetaTemplatesStatus()}
            className="px-2.5 py-1.5 bg-surface hover:bg-surface-subtle text-text-secondary border border-border rounded-sm text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh template statuses from Meta"
          >
            <RefreshCw className={`w-3.5 h-3.5 stroke-[1.5] ${loadingMetaTemplates ? 'animate-spin' : ''}`} />
            <span>Check Status</span>
          </button>
          <button
            type="button"
            disabled={syncingMetaTemplates}
            onClick={handleAutoSyncMetaTemplates}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-sm text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer shrink-0 disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 stroke-[1.5] ${syncingMetaTemplates ? 'animate-spin' : ''}`} />
            <span>{syncingMetaTemplates ? 'Auto-Provisioning in Meta...' : '⚡ Auto-Provision in Meta (Utility)'}</span>
          </button>
        </div>
      </div>

      {/* Sync Result Banner */}
      {metaSyncBanner && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-md text-xs flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-semibold text-emerald-900">
              Meta Template Auto-Provision Complete ({metaSyncBanner.industry?.toUpperCase()} Preset)
            </p>
            <p className="text-emerald-700 text-xs">
              ✓ <strong>{metaSyncBanner.already_present_count}</strong> verified active in Meta &bull; <strong>{metaSyncBanner.created_count}</strong> newly provisioned as UTILITY &bull; <strong>{metaSyncBanner.failed_count}</strong> failed.
            </p>
            {metaSyncBanner.created_count > 0 && (
              <p className="text-[11px] font-mono text-emerald-600">
                Newly Created: {metaSyncBanner.created.map((c) => c.name).join(', ')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-surface-subtle border border-border rounded-sm">
          <span className="text-[11px] font-medium text-text-muted">Total Core Templates</span>
          <p className="text-lg font-bold text-text-primary mt-0.5">
            {metaTemplatesStatus?.summary?.total || 11}
          </p>
        </div>
        <div className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-sm">
          <span className="text-[11px] font-medium text-emerald-700">Approved in Meta (Active)</span>
          <p className="text-lg font-bold text-emerald-700 mt-0.5">
            {metaTemplatesStatus?.summary?.approved ?? 10}
          </p>
        </div>
        <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-sm">
          <span className="text-[11px] font-medium text-amber-700">Pending / Missing</span>
          <p className="text-lg font-bold text-amber-700 mt-0.5">
            {(metaTemplatesStatus?.summary?.pending ?? 1) + (metaTemplatesStatus?.summary?.missing ?? 0)}
          </p>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {[
          {
            key: 'template_booking_confirmation',
            defaultName: 'booking_confirmationn',
            label: '1. Customer Booking Confirmation',
            desc: 'Sent immediately when customer books an appointment or slot.',
            isButton: false,
          },
          {
            key: 'template_reschedule_confirmation',
            defaultName: 'booking_reschedule_confirmation',
            label: '2. Customer Reschedule Confirmation',
            desc: 'Dispatched when customer or staff changes an appointment time.',
            isButton: false,
          },
          {
            key: 'template_cancellation_confirmation',
            defaultName: 'cancellation_confirmation',
            label: '3. Customer Cancellation Notice',
            desc: 'Sent when an appointment is cancelled.',
            isButton: false,
          },
          {
            key: 'template_appointment_reminder',
            defaultName: 'appointment_ramainder',
            label: '4. 2-Hour Appointment Reminder',
            desc: 'Automatic reminder sent 2 hours before scheduled slot to prevent no-shows.',
            isButton: false,
          },
          {
            key: 'template_reschedule_nudge',
            defaultName: 'reschedule_nudge',
            label: '5. No-Show Reschedule Nudge',
            desc: 'Sent if customer misses slot. Features native WhatsApp quick-reply button.',
            isButton: true,
            buttonLabel: 'Reschedule Now',
          },
          {
            key: 'template_review_request',
            defaultName: 'review_request',
            label: '6. 15-Min Post-Service Review',
            desc: 'Sent 15 minutes after appointment completion with Google Review link.',
            isButton: false,
          },
          {
            key: 'template_admin_notification',
            defaultName: 'admin_notification',
            label: '7. Staff Instant Booking Alert',
            desc: 'Dispatched to staff WhatsApp as soon as a new booking is registered.',
            isButton: false,
          },
          {
            key: 'template_admin_reschedule_notice',
            defaultName: 'admin_reschedule_notice',
            label: '8. Staff Reschedule Notice',
            desc: 'Alerts staff WhatsApp when a customer modifies their time slot.',
            isButton: false,
          },
          {
            key: 'template_admin_cancellation_notice',
            defaultName: 'admin_cancellation_notice',
            label: '9. Staff Cancellation Alert',
            desc: 'Alerts staff WhatsApp immediately when a customer cancels.',
            isButton: false,
          },
          {
            key: 'template_admin_human_request',
            defaultName: 'admin_human_request',
            label: '10. Staff Human Handover Request',
            desc: 'Alerts staff when customer requests a human or AI detects urgent assistance.',
            isButton: false,
          },
          {
            key: 'template_admin_daily_digest',
            defaultName: 'admin_daily_digest',
            label: '11. Staff Daily Morning Digest',
            desc: 'Sent at 8:00 AM with count and schedule of all appointments for the day.',
            isButton: false,
          },
        ].map((item) => {
          const currentVal = (settingsForm as any)[item.key] || item.defaultName;
          const metaMatch = metaTemplatesStatus?.templates?.find((t) => t.name === currentVal || t.name === item.defaultName);
          const status = metaMatch ? metaMatch.status : (currentVal ? 'APPROVED' : 'MISSING');

          return (
            <div key={item.key} className="p-3.5 bg-surface rounded-md border border-border space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-xs text-text-primary">{item.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-surface-subtle text-text-muted border border-border">
                    UTILITY
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {status}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">{item.desc}</p>
              {item.isButton && (
                <div className="flex items-center gap-1.5 text-[10px] text-accent bg-accent/5 px-2 py-1 rounded-sm border border-accent/20">
                  <Sparkles className="w-3 h-3 stroke-[1.5]" />
                  <span>Interactive WhatsApp Button: <strong>[{item.buttonLabel}]</strong></span>
                </div>
              )}
              <div>
                <label className="block text-[10px] font-mono text-text-muted mb-1">Meta Template Identifier</label>
                <input
                  type="text"
                  value={currentVal}
                  onChange={(e) => setSettingsForm({ ...settingsForm, [item.key]: e.target.value })}
                  placeholder={item.defaultName}
                  className="w-full px-2.5 py-1 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-3 border-t border-border flex items-center justify-between">
        <p className="text-[11px] text-text-muted">
          Templates are linked automatically to the automated lifecycle triggers in your CRM.
        </p>
        <button
          type="button"
          onClick={() => handleSaveSettings()}
          disabled={settingsSaving}
          className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-white font-medium text-xs rounded-sm transition-colors duration-150 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
        >
          {settingsSaving ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin stroke-[1.5]" />
              <span>Saving templates...</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Save Template Identifiers</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full h-screen bg-canvas flex flex-col overflow-hidden font-sans text-text-body">
      {/* ── Top Header Navigation Bar ───────────────────────────────────────── */}
      <header className="h-12 sm:h-14 px-3 sm:px-6 border-b border-border flex items-center justify-between shrink-0 bg-surface/95 backdrop-blur-sm z-30">
        {/* Logo & Current View Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-[17px] text-text-primary tracking-tight">
              {settingsForm.name || 'Boldlabs CRM'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-border">
            <span className="text-[13px] font-medium text-text-muted">
              / {activeNav === 'overview' ? 'Overview' : activeNav === 'inbox' ? 'Chats' : activeNav === 'bookings' ? 'Bookings' : activeNav === 'calendar' ? 'Calendar schedule' : activeNav === 'customers' ? 'Customer directory' : activeNav === 'followup' ? 'Customer Followup' : activeNav === 'marketing' ? 'Marketing' : 'Settings'}
            </span>
          </div>
        </div>

        {/* Right Action Profile */}
        <div className="flex items-center gap-2.5">
          {/* Search Input */}
          <div className="relative hidden md:block">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted stroke-[1.5]" />
            <input
              type="text"
              placeholder="Search..."
              value={bookingSearch || searchQuery}
              onChange={(e) => {
                setBookingSearch(e.target.value);
                setSearchQuery(e.target.value);
              }}
              className="w-48 pl-8 pr-3 py-1 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary placeholder:text-text-muted focus:bg-white focus:border-accent transition-colors duration-150"
            />
          </div>

          {/* Toggle Sticky Notes button in header */}
          <button
            onClick={() => setShowRightDrawer(!showRightDrawer)}
            className={`px-2.5 py-1 rounded-sm transition-colors duration-150 flex items-center gap-1.5 text-xs font-medium border ${
              showRightDrawer ? 'bg-surface-subtle text-text-primary border-border-strong' : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-subtle border-border'
            }`}
            title="Toggle notes"
          >
            <StickyNote className="w-3.5 h-3.5 stroke-[1.5]" />
            <span className="hidden sm:inline text-xs">Notes</span>
            {stickyNotes.length > 0 && (
              <span className="w-4 h-4 rounded-sm text-xs flex items-center justify-center font-mono font-medium bg-surface-subtle text-text-secondary border border-border">
                {stickyNotes.length}
              </span>
            )}
          </button>

          {/* Notification Bell with Dropdown Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) {
                  fetchNotifications();
                  checkPushStatus();
                }
              }}
              className={`p-1.5 rounded-sm transition-colors duration-150 relative border cursor-pointer ${
                showNotifications
                  ? 'bg-surface-subtle text-text-primary border-border-strong ring-1 ring-border-strong'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle border-border'
              }`}
              title="Notifications & Background Web Push"
            >
              <Bell className="w-3.5 h-3.5 stroke-[1.5]" />
              {unreadNotifCount > 0 ? (
                <span className="min-w-[15px] h-3.5 px-1 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center absolute -top-1 -right-1 ring-1 ring-canvas">
                  {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                </span>
              ) : isPushSubscribed ? (
                <span className="w-1.5 h-1.5 rounded-full bg-status-success absolute top-1 right-1" />
              ) : null}
            </button>

            {/* Notification Center Popover */}
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border border-border rounded-lg shadow-2xl z-50 overflow-hidden text-left flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
                  {/* Popover Header */}
                  <div className="px-4 py-3 border-b border-border bg-surface-subtle/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-accent stroke-[1.5]" />
                      <span className="text-xs font-semibold text-text-primary">Notifications & Alerts</span>
                      {unreadNotifCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-accent/10 text-accent rounded-full border border-accent/20">
                          {unreadNotifCount} unread
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadNotifCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-text-muted hover:text-text-primary cursor-pointer transition-colors"
                        >
                          Mark all read
                        </button>
                      )}
                      {notificationsList.length > 0 && (
                        <button
                          onClick={handleClearAllNotifications}
                          className="text-[11px] text-text-muted hover:text-status-danger cursor-pointer transition-colors"
                          title="Clear all notifications"
                        >
                          Clear all
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-text-muted hover:text-text-primary p-0.5 rounded-sm hover:bg-surface-subtle cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5 stroke-[1.5]" />
                      </button>
                    </div>
                  </div>

                  {/* Web Push Background Alert Status Card */}
                  <div className="p-3 bg-surface border-b border-border">
                    {isPushSubscribed ? (
                      <div className="p-2.5 rounded-md bg-status-success/5 border border-status-success/20 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
                            <span className="text-xs font-semibold text-status-success">Real Web Push Active</span>
                          </div>
                          <span className="text-[10px] text-text-muted font-mono">Background Alerts</span>
                        </div>
                        <p className="text-[11px] text-text-secondary leading-tight">
                          You will receive real-time push notifications for new WhatsApp messages and bookings even when your browser is closed.
                        </p>
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-status-success/10">
                          <button
                            onClick={sendTestNotification}
                            disabled={testingPush}
                            className="px-2.5 py-1 text-[11px] font-medium bg-surface text-text-primary border border-border hover:bg-surface-subtle rounded flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                          >
                            <Zap className="w-3 h-3 text-accent" />
                            <span>{testingPush ? 'Sending...' : 'Send Test Alert'}</span>
                          </button>
                        </div>
                      </div>
                    ) : pushPermission === 'denied' ? (
                      <div className="p-2.5 rounded-md bg-status-warning/5 border border-status-warning/20 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-status-warning">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span className="text-xs font-semibold">Notifications Blocked</span>
                        </div>
                        <p className="text-[11px] text-text-muted leading-tight">
                          Browser notifications are blocked. Please click the padlock/tune icon in your browser address bar and allow Notifications for this site.
                        </p>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-md bg-accent/5 border border-accent/20 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <BellRing className="w-3.5 h-3.5 text-accent" />
                          <span className="text-xs font-semibold text-text-primary">Enable Background Push Alerts</span>
                        </div>
                        <p className="text-[11px] text-text-muted leading-tight">
                          Never miss a client! Receive real instant desktop & mobile alerts even when your browser is closed or inactive.
                        </p>
                        <button
                          onClick={subscribePushNotifications}
                          disabled={isPushLoading}
                          className="w-full py-1.5 px-3 rounded text-xs font-semibold bg-accent hover:bg-accent-hover text-white flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors disabled:opacity-50"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>{isPushLoading ? 'Enabling...' : 'Enable Real Web Push Notifications'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Notification List Body */}
                  <div className="overflow-y-auto flex-1 max-h-72 divide-y divide-border">
                    {notificationsList.length === 0 ? (
                      <div className="py-8 px-4 text-center">
                        <CheckCircle2 className="w-6 h-6 text-text-muted/40 mx-auto mb-2 stroke-[1.5]" />
                        <p className="text-xs font-medium text-text-primary">All caught up!</p>
                        <p className="text-[11px] text-text-muted mt-0.5">No recent notifications.</p>
                      </div>
                    ) : (
                      notificationsList.map((notif) => {
                        const isMsg = notif.type === 'message';
                        const isBkg = notif.type === 'booking';
                        const isCan = notif.type === 'cancellation';
                        return (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-3 flex items-start gap-3 hover:bg-surface-subtle/70 transition-colors cursor-pointer text-left ${
                              !notif.is_read ? 'bg-surface-subtle/30' : ''
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isMsg ? (
                                <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                                  <MessageSquare className="w-3.5 h-3.5 stroke-[1.5]" />
                                </div>
                              ) : isBkg ? (
                                <div className="w-7 h-7 rounded-full bg-status-success/10 border border-status-success/20 flex items-center justify-center text-status-success">
                                  <Calendar className="w-3.5 h-3.5 stroke-[1.5]" />
                                </div>
                              ) : isCan ? (
                                <div className="w-7 h-7 rounded-full bg-status-danger/10 border border-status-danger/20 flex items-center justify-center text-status-danger">
                                  <AlertCircle className="w-3.5 h-3.5 stroke-[1.5]" />
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-surface-subtle border border-border flex items-center justify-center text-text-secondary">
                                  <Bell className="w-3.5 h-3.5 stroke-[1.5]" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className={`text-xs truncate ${!notif.is_read ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary'}`}>
                                  {notif.title}
                                </p>
                                <div className="flex items-center gap-1 shrink-0">
                                  {!notif.is_read && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteNotification(e, notif.id)}
                                    className="w-6 h-6 flex items-center justify-center text-text-muted hover:text-status-danger rounded hover:bg-surface-subtle transition-colors cursor-pointer"
                                    title="Delete notification"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-[11px] text-text-muted line-clamp-2 mt-0.5">
                                {notif.body}
                              </p>
                              <div className="flex items-center justify-between mt-1 text-[10px] text-text-muted">
                                <span>{formatRelativeTime(notif.created_at)}</span>
                                {notif.data?.phone && (
                                  <span className="text-accent hover:underline font-mono">
                                    {notif.data.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Action Notice Toast ────────────────────────────────────────────── */}
      {actionNotice && (
        <div className="bg-surface border-b border-border px-6 py-2 text-xs text-text-primary flex items-center justify-between font-medium">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-status-success stroke-[1.5]" />
            <span>{actionNotice}</span>
          </span>
          <button onClick={() => setActionNotice(null)} className="text-text-muted hover:text-text-primary">
            <X className="w-3.5 h-3.5 stroke-[1.5]" />
          </button>
        </div>
      )}

      {/* ── 3-Column Body Container ────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ── 1. LEFT SIDEBAR ──────────────────────────────────────────────── */}
        <aside className="hidden md:flex w-56 bg-surface border-r border-border flex-col shrink-0 p-3 justify-between">
          <div className="space-y-1">
            {/* Sidebar Menu Items */}
            <nav className="space-y-0.5">
              <button
                onClick={() => navigateTo('overview')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs transition-colors duration-150 cursor-pointer ${
                  activeNav === 'overview'
                    ? 'bg-surface-subtle text-text-primary font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle font-medium'
                }`}
              >
                <LayoutGrid className="w-4 h-4 stroke-[1.5] shrink-0" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => navigateTo('inbox')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs transition-colors duration-150 cursor-pointer ${
                  activeNav === 'inbox'
                    ? 'bg-surface-subtle text-text-primary font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle font-medium'
                }`}
              >
                <MessageSquare className="w-4 h-4 stroke-[1.5] shrink-0" />
                <span>Chats</span>
              </button>

              <button
                onClick={() => navigateTo('customers')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs transition-colors duration-150 cursor-pointer ${
                  activeNav === 'customers' || activeNav === 'followup'
                    ? 'bg-surface-subtle text-text-primary font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle font-medium'
                }`}
              >
                <Users className="w-4 h-4 stroke-[1.5] shrink-0" />
                <span>{currentTaxonomy.client_plural || 'Customers'}</span>
              </button>

              <button
                onClick={() => navigateTo('bookings')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs transition-colors duration-150 cursor-pointer ${
                  activeNav === 'bookings'
                    ? 'bg-surface-subtle text-text-primary font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle font-medium'
                }`}
              >
                <CalendarDays className="w-4 h-4 stroke-[1.5] shrink-0" />
                <span>Bookings</span>
              </button>

              <button
                onClick={() => navigateTo('calendar')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs transition-colors duration-150 cursor-pointer ${
                  activeNav === 'calendar'
                    ? 'bg-surface-subtle text-text-primary font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle font-medium'
                }`}
              >
                <Calendar className="w-4 h-4 stroke-[1.5] shrink-0" />
                <span>Calendar schedule</span>
              </button>

              <button
                onClick={() => navigateTo('marketing')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs transition-colors duration-150 cursor-pointer ${
                  activeNav === 'marketing'
                    ? 'bg-surface-subtle text-text-primary font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle font-medium'
                }`}
              >
                <Megaphone className="w-4 h-4 stroke-[1.5] shrink-0" />
                <span>Marketing</span>
              </button>

              <button
                onClick={() => {
                  navigateTo('settings');
                  setSettingsTab('templates');
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs transition-colors duration-150 cursor-pointer ${
                  activeNav === 'settings' && settingsTab === 'templates'
                    ? 'bg-surface-subtle text-text-primary font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle font-medium'
                }`}
              >
                <FileText className="w-4 h-4 stroke-[1.5] shrink-0 text-accent" />
                <div className="flex items-center justify-between flex-1">
                  <span>WhatsApp Templates</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                    Utility
                  </span>
                </div>
              </button>
            </nav>
          </div>

          {/* Bottom Settings Link & Powered By Footer */}
          <div className="pt-2 border-t border-border">
            {/* Powered by Boldlabs Link */}
            <a
              href="https://goboldlabs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between px-2 py-1.5 mb-2 rounded-sm bg-surface-subtle/50 hover:bg-surface-subtle text-[11px] text-text-muted hover:text-text-primary transition-colors duration-150 border border-border/60 hover:border-border cursor-pointer"
              title="Visit goboldlabs.com"
            >
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-text-muted tracking-tight">Powered by</span>
                <span className="font-semibold text-text-primary group-hover:text-accent transition-colors">Boldlabs</span>
              </div>
              <ArrowUpRight className="w-3 h-3 text-text-muted group-hover:text-accent transition-colors stroke-[1.5]" />
            </a>

            <button
              onClick={() => navigateTo('settings')}
              className={`w-full text-left p-2 rounded-sm border transition-colors duration-150 cursor-pointer flex items-center justify-between ${
                activeNav === 'settings'
                  ? 'bg-surface-subtle border-border-strong text-text-primary font-semibold'
                  : 'bg-surface border-border hover:bg-surface-subtle text-text-secondary font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 stroke-[1.5] text-text-secondary" />
                <div>
                  <p className="text-xs font-medium text-text-primary">Preferences</p>
                  <p className="text-[11px] text-text-muted">Workspace & Branding</p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 stroke-[1.5] text-text-muted" />
            </button>
          </div>
        </aside>

          {/* ── 2. CENTER / MAIN VIEW AREA ───────────────────────────────────── */}
          <main className="flex-1 flex flex-col overflow-hidden bg-canvas p-2 sm:p-6 space-y-2.5 sm:space-y-6 pb-20 md:pb-6">
            
            {/* ── VIEW 0: DEDICATED OVERVIEW DASHBOARD ─────────────────────────── */}
            {activeNav === 'overview' && (
              <div className="flex-1 flex flex-col overflow-y-auto space-y-6 pr-1">
                {/* Welcome Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">
                      Workspace overview
                    </h2>
                    <p className="text-xs text-text-muted mt-0.5">
                      Summary of WhatsApp automation, bookings, and customer activity
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        loadConversations();
                        loadBookings();
                        loadContacts();
                      }}
                      className="px-3 py-1.5 bg-surface hover:bg-surface-subtle text-text-body font-medium text-xs rounded-sm transition-colors duration-150 cursor-pointer flex items-center gap-1.5 border border-border"
                    >
                      <RotateCcw className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>Refresh</span>
                    </button>
                    <button
                      onClick={() => setActiveNav('inbox')}
                      className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white font-medium text-xs rounded-sm transition-colors duration-150 cursor-pointer flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>Open inbox</span>
                    </button>
                  </div>
                </div>

                {/* Quick Access Metric Cards */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
                    {/* Card 1: Active Conversations */}
                    <div
                      onClick={() => setActiveNav('inbox')}
                      className="bg-surface border border-border hover:border-border-strong rounded-md p-4 transition-colors duration-150 cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-text-muted">Chats</span>
                        <MessageSquare className="w-4 h-4 stroke-[1.5] text-text-muted" />
                      </div>
                      <p className="text-2xl font-semibold text-text-primary font-mono tabular-nums">
                        {conversations.length}
                      </p>
                      <p className="text-xs text-text-muted">
                        Active conversations
                      </p>
                    </div>

                    {/* Card 2: Upcoming Bookings */}
                    <div
                      onClick={() => setActiveNav('bookings')}
                      className="bg-surface border border-border hover:border-border-strong rounded-md p-4 transition-colors duration-150 cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-text-muted">Upcoming bookings</span>
                        <CalendarDays className="w-4 h-4 stroke-[1.5] text-text-muted" />
                      </div>
                      <p className="text-2xl font-semibold text-text-primary font-mono tabular-nums">
                        {bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending').length}
                      </p>
                      <p className="text-xs text-text-muted">
                        Scheduled appointments
                      </p>
                    </div>

                    {/* Card 3: Attended / Completed */}
                    <div
                      onClick={() => {
                        setActiveNav('bookings');
                        setBookingFilter('completed');
                      }}
                      className="bg-surface border border-border hover:border-border-strong rounded-md p-4 transition-colors duration-150 cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-text-muted">Completed visits</span>
                        <Star className="w-4 h-4 stroke-[1.5] text-text-muted" />
                      </div>
                      <p className="text-2xl font-semibold text-text-primary font-mono tabular-nums">
                        {bookings.filter((b) => b.status === 'completed').length}
                      </p>
                      <p className="text-xs text-text-muted">
                        Attended appointments
                      </p>
                    </div>

                    {/* Card 4: Customer Directory */}
                    <div
                      onClick={() => setActiveNav('customers')}
                      className="bg-surface border border-border hover:border-border-strong rounded-md p-4 transition-colors duration-150 cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-text-muted">Customer directory</span>
                        <Users className="w-4 h-4 stroke-[1.5] text-text-muted" />
                      </div>
                      <p className="text-2xl font-semibold text-text-primary font-mono tabular-nums">
                        {contacts.length}
                      </p>
                      <p className="text-xs text-text-muted">
                        Total contacts on file
                      </p>
                    </div>

                    {/* Card 5: Total Revenue */}
                    <div
                      onClick={() => {
                        setActiveNav('bookings');
                        setBookingFilter('completed');
                      }}
                      className="bg-surface border border-border hover:border-border-strong rounded-md p-4 transition-colors duration-150 cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-text-muted">Total revenue</span>
                        <TrendingUp className="w-4 h-4 stroke-[1.5] text-text-muted" />
                      </div>
                      <p className="text-2xl font-semibold text-emerald-700 font-mono tabular-nums">
                        {currentCurrencySymbol}{bookings.filter((b) => b.status === 'completed' || b.status === 'attended').reduce((sum, b) => sum + (Number(b.price) || 0), 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-text-muted">
                        From {bookings.filter((b) => b.status === 'completed' || b.status === 'attended').length} attended bookings
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2-Column Overview Widgets */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                  {/* Widget 1: Recent Inbound Conversations */}
                  <div className="bg-surface border border-border rounded-md p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-text-secondary stroke-[1.5]" />
                        <h4 className="font-medium text-xs text-text-primary">Recent inbound chats</h4>
                      </div>
                      <button
                        onClick={() => setActiveNav('inbox')}
                        className="text-xs font-medium text-accent hover:text-accent-hover cursor-pointer"
                      >
                        View all
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {conversations.length === 0 ? (
                        <div className="text-center py-8 text-xs text-text-muted">
                          No WhatsApp conversations yet.
                        </div>
                      ) : (
                        conversations.slice(0, 4).map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedConv(c);
                              selectConversation(c);
                              setActiveNav('inbox');
                            }}
                            className="p-2.5 rounded-sm border border-border hover:bg-surface-subtle transition-colors duration-150 cursor-pointer flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-sm bg-surface-subtle text-text-secondary flex items-center justify-center font-medium text-xs">
                                {(c.contact_name || c.contact_phone || 'W').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-xs text-text-primary">
                                  {c.contact_name || c.contact_phone || 'WhatsApp Client'}
                                </p>
                                <p className="text-xs text-text-muted line-clamp-1 max-w-[200px]">
                                  {c.last_message || 'Active conversation'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {c.ai_enabled ? (
                                <span className="px-1.5 py-0.5 bg-status-success-bg text-status-success border border-status-success-border text-xs font-medium rounded-sm">
                                  AI Auto
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-surface-subtle text-text-muted border border-border text-xs font-medium rounded-sm">
                                  Human
                                </span>
                              )}
                              <ChevronRight className="w-3.5 h-3.5 text-text-muted stroke-[1.5]" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Widget 2: Next Upcoming Bookings */}
                  <div className="bg-surface border border-border rounded-md p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-text-secondary stroke-[1.5]" />
                        <h4 className="font-medium text-xs text-text-primary">Upcoming appointments</h4>
                      </div>
                      <button
                        onClick={() => setActiveNav('bookings')}
                        className="text-xs font-medium text-accent hover:text-accent-hover cursor-pointer"
                      >
                        View all
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending').length === 0 ? (
                        <div className="text-center py-8 text-xs text-text-muted">
                          No upcoming bookings scheduled.
                        </div>
                      ) : (
                        bookings
                          .filter((b) => b.status === 'confirmed' || b.status === 'pending')
                          .slice(0, 4)
                          .map((b) => (
                            <div
                              key={b.id}
                              className="p-2.5 rounded-sm border border-border hover:bg-surface-subtle transition-colors duration-150 flex items-center justify-between"
                            >
                              <div>
                                <p className="font-medium text-xs text-text-primary">
                                  {b.contact_name || b.contact_phone || 'Client'}
                                </p>
                                <p className="text-xs text-text-muted">
                                  {b.service} &bull; {new Date(b.start_time || b.appointment_time || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {formatTime12(b.start_time || b.appointment_time || Date.now())}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-text-primary font-mono tabular-nums">{currentCurrencySymbol}{b.price || 0}</span>
                                <span className={`px-1.5 py-0.5 text-xs font-medium rounded-sm capitalize border ${
                                  b.status === 'confirmed' ? 'bg-status-success-bg text-status-success border-status-success-border' : 'bg-status-warning-bg text-status-warning border-status-warning-border'
                                }`}>
                                  {b.status}
                                </span>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── VIEW 1: BOOKINGS LIST & ATTENDANCE ───────────────────────────── */}
            {activeNav === 'bookings' && (
              <div className="flex-1 flex flex-col overflow-hidden space-y-4">
                {/* Breadcrumb & Action Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span>Home</span>
                    <ChevronRight className="w-3 h-3 text-text-muted stroke-[1.5]" />
                    <span>Bookings</span>
                    <ChevronRight className="w-3 h-3 text-text-muted stroke-[1.5]" />
                    <span className="text-text-primary font-medium">Schedule</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Filter Segmented Control (Upcoming, Completed, No-Show, Cancelled) */}
                    <div className="flex overflow-x-auto no-scrollbar gap-0.5 bg-surface-subtle p-0.5 rounded-md border border-border shrink-0 max-w-full">
                      {[
                        { id: 'upcoming', label: 'Upcoming' },
                        { id: 'completed', label: 'Completed' },
                        { id: 'no_show', label: 'No-Show' },
                        { id: 'cancelled', label: 'Cancelled' },
                      ].map((st) => {
                        const count = (bookings || []).filter((b) => {
                          const isPast = b.start_time ? new Date(b.start_time).getTime() < Date.now() : false;
                          if (st.id === 'upcoming') return (b.status === 'confirmed' || b.status === 'pending') && !isPast;
                          if (st.id === 'completed') {
                            return (
                              b.status === 'completed' ||
                              b.status === 'attended' ||
                              (isPast && b.status !== 'cancelled' && b.status !== 'no_show')
                            );
                          }
                          if (st.id === 'no_show') return b.status === 'no_show';
                          if (st.id === 'cancelled') return b.status === 'cancelled';
                          return false;
                        }).length;

                        return (
                          <button
                            key={st.id}
                            onClick={() => setBookingFilter(st.id)}
                            className={`px-3 py-1 text-xs rounded-sm transition-colors duration-150 cursor-pointer flex items-center gap-1.5 ${
                              bookingFilter === st.id
                                ? 'bg-surface text-text-primary font-semibold border border-border shadow-subtle'
                                : 'text-text-secondary hover:text-text-primary font-medium'
                            }`}
                          >
                            <span>{st.label}</span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-xs ${
                                bookingFilter === st.id
                                  ? 'bg-surface-subtle text-text-primary font-semibold'
                                  : 'text-text-muted'
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Switch to Calendar Schedule Button */}
                    <button
                      onClick={() => navigateTo('calendar')}
                      className="px-3 py-1.5 bg-surface hover:bg-surface-subtle text-text-primary font-medium text-xs rounded-sm transition-colors duration-150 flex items-center gap-1.5 border border-border cursor-pointer shadow-xs"
                      title="Switch to Calendar Schedule view"
                    >
                      <CalendarDays className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                      <span>Calendar Schedule</span>
                    </button>

                    {/* Add Booking Button */}
                    <button
                      onClick={() => setIsAddBookingOpen(true)}
                      className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white font-medium text-xs rounded-sm transition-colors duration-150 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>Add booking</span>
                    </button>
                  </div>
                </div>

                {/* Bookings Data Table */}
                <div className="flex-1 overflow-y-auto border border-border rounded-md bg-surface">
                  {loadingBookings ? (
                    <div className="p-12 text-center text-xs text-text-muted">Loading bookings...</div>
                  ) : filteredBookings.length === 0 ? (
                    <div className="p-12 text-center space-y-2">
                      <CalendarDays className="w-8 h-8 text-text-muted mx-auto stroke-[1.5]" />
                      <p className="text-sm font-medium text-text-primary">No bookings in this filter</p>
                      <p className="text-xs text-text-muted">Appointments booked via WhatsApp will appear here automatically.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs min-w-[620px]">
                      <thead className="bg-surface-subtle border-b border-border text-text-secondary font-medium text-xs">
                        <tr>
                          <th className="p-3 pl-4">Client</th>
                          <th className="p-3">Service</th>
                          <th className="p-3">Scheduled date & time</th>
                          <th className="p-3">Fee</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right pr-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredBookings.map((b) => {
                          const isPast = b.start_time ? new Date(b.start_time).getTime() < Date.now() : false;
                          const isAttended = b.status === 'completed' || b.status === 'attended';
                          const isNoShow = b.status === 'no_show';
                          const isCancelled = b.status === 'cancelled';

                          return (
                            <tr
                              key={b.id}
                              onClick={() => {
                                setSelectedBookingDetail(b);
                                setEditPriceValue(String(b.price || 0));
                                setIsBookingDetailModalOpen(true);
                              }}
                              className="hover:bg-surface-subtle transition-colors duration-150 cursor-pointer"
                            >
                              <td className="p-3 pl-4 flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-sm bg-surface-subtle text-text-secondary border border-border flex items-center justify-center font-medium text-xs shrink-0">
                                  {b.contact_name ? b.contact_name[0].toUpperCase() : 'C'}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-xs text-text-primary truncate">{b.contact_name || 'Client'}</p>
                                  <p className="text-[11px] text-text-muted font-mono mt-0.5">{b.contact_phone || '—'}</p>
                                </div>
                              </td>

                              <td className="p-3 text-xs text-text-body">
                                {b.service}
                              </td>

                              <td className="p-3 font-mono text-xs text-text-muted">
                                {formatDateTime12(b.start_time)}
                              </td>

                              <td className="p-3 font-mono font-medium text-xs text-text-primary tabular-nums">
                                {currentCurrencySymbol}{b.price || 0}
                              </td>

                              <td className="p-3">
                                {isAttended ? (
                                  <span className="px-2 py-0.5 rounded-sm text-[11px] font-semibold border bg-status-success-bg text-status-success border-status-success-border">
                                    Attended
                                  </span>
                                ) : isNoShow ? (
                                  <span className="px-2 py-0.5 rounded-sm text-[11px] font-semibold border bg-status-warning-bg text-status-warning border-status-warning-border">
                                    No-Show
                                  </span>
                                ) : isCancelled ? (
                                  <span className="px-2 py-0.5 rounded-sm text-[11px] font-semibold border bg-status-error-bg text-status-error border-status-error-border">
                                    Cancelled
                                  </span>
                                ) : isPast ? (
                                  <span className="px-2 py-0.5 rounded-sm text-[11px] font-medium border bg-amber-50 text-amber-800 border-amber-200">
                                    Past (Pending)
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-sm text-[11px] font-medium border bg-blue-50 text-blue-700 border-blue-200">
                                    Upcoming
                                  </span>
                                )}
                              </td>

                              <td className="p-3 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Quick Attendance Action Buttons */}
                                  {!isAttended && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateBookingStatus(b.id, 'completed')}
                                      disabled={updatingBookingId === b.id}
                                      className="px-2 py-1 text-[11px] font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-sm transition-colors duration-150 flex items-center gap-1 cursor-pointer"
                                      title="Mark client as Attended (Sends review request)"
                                    >
                                      <Check className="w-3 h-3 stroke-[2]" />
                                      <span>Attended</span>
                                    </button>
                                  )}

                                  {!isNoShow && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateBookingStatus(b.id, 'no_show')}
                                      disabled={updatingBookingId === b.id}
                                      className="px-2 py-1 text-[11px] font-medium bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-sm transition-colors duration-150 flex items-center gap-1 cursor-pointer"
                                      title="Mark client as No-Show (Sends reschedule nudge)"
                                    >
                                      <UserX className="w-3 h-3 stroke-[2]" />
                                      <span>No-Show</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => openCustomerProfileByPhone(b.contact_phone || '', b.contact_name)}
                                    className="px-2 py-1 text-[11px] font-medium bg-surface hover:bg-surface-subtle text-accent border border-border rounded-sm transition-colors duration-150 flex items-center gap-1 cursor-pointer"
                                    title="View full customer profile & notes in CRM"
                                  >
                                    <User className="w-3 h-3 stroke-[1.5]" />
                                    <span>Manage</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedBookingDetail(b);
                                      setEditPriceValue(String(b.price || 0));
                                      setIsBookingDetailModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 text-xs font-medium bg-surface hover:bg-surface-subtle text-text-primary border border-border rounded-sm transition-colors duration-150 flex items-center gap-1 cursor-pointer"
                                    title="Update booking details, fee & attendance"
                                  >
                                    <Sliders className="w-3.5 h-3.5 stroke-[1.5]" />
                                    <span>Details</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ── VIEW 2: CALENDAR VIEW ───────────────────────────────────────── */}
            {activeNav === 'calendar' && (
              <div className="flex-1 flex flex-col overflow-hidden space-y-3">
                {/* Calendar Top Controls & Unified Filter Layer */}
                <div className="flex flex-col gap-2 pt-1 pb-0.5">
                  {/* Row 1: Date Navigation on Left, View Switcher & Action Buttons on Right */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {/* Left: Date Navigation & Title */}
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-semibold text-sm text-text-primary flex items-center gap-1.5 whitespace-nowrap">
                        <CalendarDays className="w-4 h-4 text-accent stroke-[1.5]" />
                        <span>{calendarTitle}</span>
                      </h3>
                      <div className="flex items-center gap-0.5 bg-surface-subtle p-0.5 rounded-sm border border-border">
                        <button
                          type="button"
                          onClick={handlePrevDate}
                          className="p-1 text-text-secondary hover:text-text-primary hover:bg-surface rounded-sm transition-colors duration-150 cursor-pointer"
                          title="Previous"
                        >
                          <ChevronLeft className="w-3.5 h-3.5 stroke-[1.5]" />
                        </button>
                        <button
                          type="button"
                          onClick={handleToday}
                          className="px-2 py-0.5 text-xs font-medium text-text-body hover:text-text-primary hover:bg-surface rounded-sm transition-colors duration-150 cursor-pointer"
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          onClick={handleNextDate}
                          className="p-1 text-text-secondary hover:text-text-primary hover:bg-surface rounded-sm transition-colors duration-150 cursor-pointer"
                          title="Next"
                        >
                          <ChevronRight className="w-3.5 h-3.5 stroke-[1.5]" />
                        </button>
                      </div>
                    </div>

                    {/* Right: View Switcher (Day/Week/Month) & Actions */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className="flex gap-0.5 bg-surface-subtle p-0.5 rounded-sm border border-border">
                        {(['day', 'week', 'month'] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setCalendarViewMode(mode)}
                            className={`px-2 py-0.5 text-xs rounded-sm capitalize transition-colors duration-150 cursor-pointer ${
                              calendarViewMode === mode
                                ? 'bg-surface text-text-primary font-semibold border border-border shadow-subtle'
                                : 'text-text-secondary hover:text-text-primary font-medium'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => navigateTo('bookings')}
                        className="px-2 py-1 text-xs rounded-sm bg-surface hover:bg-surface-subtle border border-border text-text-secondary hover:text-text-primary flex items-center gap-1 cursor-pointer font-medium shadow-2xs whitespace-nowrap"
                        title="Switch to Bookings Table list view"
                      >
                        <List className="w-3.5 h-3.5 stroke-[1.5]" />
                        <span>Table</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowAddTaskModal(true)}
                        className="px-2 py-1 bg-surface hover:bg-surface-subtle text-text-primary border border-border font-medium text-xs rounded-sm transition-colors duration-150 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        title="Create a new task"
                      >
                        <CheckSquare className="w-3.5 h-3.5 stroke-[1.5] text-amber-600" />
                        <span>+ Task</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsAddBookingOpen(true)}
                        className="px-2.5 py-1 bg-accent hover:bg-accent-hover text-white font-medium text-xs rounded-sm transition-colors duration-150 flex items-center gap-1 cursor-pointer shadow-xs whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[1.5]" />
                        <span>{currentTaxonomy.booking_cta || '+ Appointment'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Unified Layer / Filter Selector Pills (All, Appointments, Follow-ups, Tasks) */}
                  <div className="flex items-center gap-1 bg-surface-subtle border border-border rounded-sm p-0.5 w-fit">
                    {[
                      { key: 'all', label: 'All Schedule', icon: LayoutGrid, count: (bookings?.length || 0) + (customers?.filter(c => c.followup_date).length || 0) + (tasks?.filter(t => !t.completed).length || 0) },
                      { key: 'bookings', label: currentTaxonomy.event_label || 'Appointments', icon: Calendar, count: bookings?.length || 0 },
                      { key: 'followups', label: 'Follow-ups', icon: Phone, count: customers?.filter(c => c.followup_date).length || 0 },
                      { key: 'tasks', label: 'Tasks', icon: CheckSquare, count: tasks?.filter(t => !t.completed).length || 0 },
                    ].map((tab) => {
                      const IconComp = tab.icon;
                      const isActive = calendarLayerFilter === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setCalendarLayerFilter(tab.key as any)}
                          className={`flex items-center gap-1.5 px-2 py-0.5 text-[11px] rounded-sm transition-colors cursor-pointer whitespace-nowrap ${
                            isActive
                              ? 'bg-surface text-text-primary font-semibold border border-border shadow-xs'
                              : 'text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          <IconComp className="w-3 h-3 stroke-[1.5]" />
                          <span>{tab.label}</span>
                          <span className="text-[10px] text-text-muted bg-surface-subtle border border-border px-1 py-0.2 rounded-xs font-mono">{tab.count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── 1. MONTH VIEW (Unified Schedule) ────────────────────────── */}
                {calendarViewMode === 'month' && (
                  <div className="flex-1 overflow-y-auto border border-border rounded-md bg-surface flex flex-col">
                    <div className="grid grid-cols-7 bg-surface-subtle border-b border-border text-center text-xs font-medium text-text-muted py-2">
                      <span>Sun</span>
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                    </div>

                    <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border flex-1">
                      {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`offset-${i}`} className="min-h-[100px] p-2 bg-surface-subtle/30" />
                      ))}

                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const cellDate = new Date(year, month, dayNum);
                        const isToday = isSameDay(new Date(), cellDate);

                        // 1. Matching Bookings
                        const cellBookings = (bookings || []).filter((b) => {
                          if (!b || !b.start_time) return false;
                          return isSameDay(b.start_time, cellDate);
                        });

                        // 2. Matching Customer Follow-ups (timezone-safe)
                        const cellFollowups = (customers || []).filter((c) => {
                          if (!c || !c.followup_date) return false;
                          return isSameDay(c.followup_date, cellDate);
                        });

                        // 3. Matching Tasks
                        const cellTasks = (tasks || []).filter((t) => {
                          if (!t || !t.due_date) return false;
                          return isSameDay(t.due_date, cellDate);
                        });

                        const showBookings = calendarLayerFilter === 'all' || calendarLayerFilter === 'bookings';
                        const showFollowups = calendarLayerFilter === 'all' || calendarLayerFilter === 'followups';
                        const showTasks = calendarLayerFilter === 'all' || calendarLayerFilter === 'tasks';

                        const allCellItems: Array<
                          | { type: 'booking'; data: Booking }
                          | { type: 'followup'; data: Customer }
                          | { type: 'task'; data: FollowupTask }
                        > = [
                          ...(showBookings ? cellBookings.map((b) => ({ type: 'booking' as const, data: b })) : []),
                          ...(showFollowups ? cellFollowups.map((f) => ({ type: 'followup' as const, data: f })) : []),
                          ...(showTasks ? cellTasks.map((t) => ({ type: 'task' as const, data: t })) : []),
                        ];

                        const totalEvents = allCellItems.length;
                        const visibleItems = allCellItems.slice(0, 3);
                        const overflowCount = totalEvents - visibleItems.length;

                        return (
                          <div
                            key={dayNum}
                            onClick={() => {
                              setCurrentDate(cellDate);
                              setCalendarViewMode('day');
                            }}
                            className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors duration-150 cursor-pointer ${
                              isToday ? 'bg-surface-subtle' : 'hover:bg-surface-subtle/60'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs font-medium ${
                                  isToday
                                    ? 'w-5 h-5 rounded-sm bg-accent text-white flex items-center justify-center'
                                    : 'text-text-secondary'
                                }`}
                              >
                                {dayNum}
                              </span>
                              {totalEvents > 0 && (
                                <span className="text-[10px] font-mono text-text-muted bg-surface px-1.5 py-0.2 rounded-sm border border-border font-medium">
                                  {totalEvents} {totalEvents === 1 ? 'item' : 'items'}
                                </span>
                              )}
                            </div>

                            <div className="space-y-1 mt-1 overflow-hidden pr-0.5">
                              {visibleItems.map((item) => {
                                if (item.type === 'booking') {
                                  const b = item.data;
                                  return (
                                    <button
                                      type="button"
                                      key={`b-${b.id}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedBookingDetail(b);
                                        setIsBookingDetailModalOpen(true);
                                      }}
                                      className={`w-full text-left px-1.5 py-0.5 rounded-sm text-[10px] truncate block font-medium transition-colors duration-150 border cursor-pointer ${
                                        b.status === 'completed'
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                          : b.status === 'no_show'
                                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                                          : b.status === 'cancelled'
                                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                                          : 'bg-accent text-white border-accent'
                                      }`}
                                      title={`Appointment: ${b.contact_name || b.service} (${b.status})`}
                                    >
                                      {formatTime12(b.start_time)} · {b.contact_name || b.service}
                                    </button>
                                  );
                                }
                                if (item.type === 'followup') {
                                  const cust = item.data;
                                  const timeInfo = parseEventTime(cust.followup_time);
                                  return (
                                    <button
                                      type="button"
                                      key={`f-${cust.id}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openCustomerProfileByPhone(cust.phone, cust.name || undefined);
                                      }}
                                      className="w-full text-left px-1.5 py-0.5 rounded-sm text-[10px] truncate block font-medium bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                                      title={`Follow-up with ${cust.name || cust.phone} (${timeInfo.formatted})`}
                                    >
                                      {timeInfo.formatted} · 📞 {cust.name || cust.phone}
                                    </button>
                                  );
                                }
                                const t = item.data;
                                return (
                                  <button
                                    type="button"
                                    key={`t-${t.id}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleTask(t.id);
                                    }}
                                    className={`w-full text-left px-1.5 py-0.5 rounded-sm text-[10px] truncate block font-medium transition-colors border cursor-pointer ${
                                      t.completed
                                        ? 'bg-surface text-text-muted border-border line-through opacity-70'
                                        : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                                    }`}
                                    title={`Task: ${t.title} (Click to toggle completed)`}
                                  >
                                    {t.completed ? '✓' : '□'} {t.title}
                                  </button>
                                );
                              })}

                              {overflowCount > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentDate(cellDate);
                                    setCalendarViewMode('day');
                                  }}
                                  className="w-full text-center py-0.5 text-[9px] font-semibold text-accent hover:underline bg-accent/5 hover:bg-accent/10 rounded-xs transition-colors cursor-pointer block"
                                  title="View full day schedule"
                                >
                                  +{overflowCount} more &rarr;
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── 2. WEEK VIEW (Unified Schedule) ─────────────────────────── */}
                {calendarViewMode === 'week' && (
                  <div className="flex-1 overflow-y-auto border border-border rounded-md bg-surface flex flex-col">
                    {/* Week Days Header */}
                    <div className="grid grid-cols-8 bg-surface-subtle border-b border-border text-center py-2 shrink-0">
                      <div className="text-xs font-medium text-text-muted font-mono flex items-center justify-center">Time</div>
                      {currentWeekDays.map((day, idx) => {
                        const isToday = isSameDay(new Date(), day);
                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              setCurrentDate(day);
                              setCalendarViewMode('day');
                            }}
                            className="flex flex-col items-center gap-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            <span className="text-[11px] font-medium text-text-muted">
                              {day.toLocaleDateString([], { weekday: 'short' })}
                            </span>
                            <span
                              className={`text-xs font-semibold px-1.5 py-0.5 rounded-sm ${
                                isToday ? 'bg-accent text-white' : 'text-text-primary'
                              }`}
                            >
                              {day.getDate()}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* All-Day / Anytime Row */}
                    <div className="grid grid-cols-8 min-h-[38px] divide-x divide-border bg-surface-subtle/30 border-b border-border shrink-0">
                      <div className="p-1.5 text-right text-[10px] font-medium text-text-muted bg-surface-subtle/50 flex items-center justify-end">
                        All-Day
                      </div>
                      {currentWeekDays.map((day, dIdx) => {
                        const showFollowups = calendarLayerFilter === 'all' || calendarLayerFilter === 'followups';
                        const showTasks = calendarLayerFilter === 'all' || calendarLayerFilter === 'tasks';

                        const dayAllDayFollowups = (customers || []).filter((c) => {
                          if (!c || !c.followup_date || !isSameDay(c.followup_date, day)) return false;
                          const t = parseEventTime(c.followup_time);
                          return t.isAllDay || t.hour < 6;
                        });

                        const dayAllDayTasks = (tasks || []).filter((t) => {
                          if (!t || !t.due_date || !isSameDay(t.due_date, day)) return false;
                          const tInfo = parseTaskTime(t.due_date);
                          return tInfo.isAllDay || tInfo.hour < 6;
                        });

                        const hasAllDay = (showFollowups && dayAllDayFollowups.length > 0) || (showTasks && dayAllDayTasks.length > 0);

                        return (
                          <div key={`allday-${dIdx}`} className="p-1 space-y-1 min-h-[38px]">
                            {showFollowups && dayAllDayFollowups.map((cust) => (
                              <div
                                key={`adf-${cust.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCustomerProfileByPhone(cust.phone, cust.name || undefined);
                                }}
                                className="px-1.5 py-0.5 rounded-xs bg-blue-50 border border-blue-200 text-blue-800 text-[10px] flex items-center justify-between gap-1 cursor-pointer hover:bg-blue-100 transition-colors"
                                title={`Follow-up: ${cust.name || cust.phone}`}
                              >
                                <span className="truncate font-medium">📞 {cust.name || cust.phone}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openChatForContact(cust.phone);
                                  }}
                                  className="text-blue-700 hover:text-blue-900 shrink-0 cursor-pointer"
                                  title="WhatsApp chat"
                                >
                                  <MessageSquare className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ))}

                            {showTasks && dayAllDayTasks.map((t) => (
                              <div
                                key={`adt-${t.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleTask(t.id);
                                }}
                                className={`px-1.5 py-0.5 rounded-xs border text-[10px] flex items-center justify-between gap-1 cursor-pointer transition-colors ${
                                  t.completed
                                    ? 'bg-surface text-text-muted border-border line-through'
                                    : 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
                                }`}
                                title={`Task: ${t.title}`}
                              >
                                <span className="truncate font-medium">{t.completed ? '✓' : '□'} {t.title}</span>
                                {t.customer_phone && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openChatForContact(t.customer_phone!);
                                    }}
                                    className="text-amber-800 hover:text-amber-950 shrink-0 cursor-pointer"
                                    title={`Chat with ${t.customer_name || t.customer_phone}`}
                                  >
                                    <MessageSquare className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            ))}

                            {!hasAllDay && <div className="h-full" />}
                          </div>
                        );
                      })}
                    </div>

                    {/* Week Hours Grid (6 AM to 11 PM) */}
                    <div className="divide-y divide-border flex-1 overflow-y-auto">
                      {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map((hour) => (
                        <div key={hour} className="grid grid-cols-8 min-h-[64px] divide-x divide-border">
                          {/* Hour Label */}
                          <div className="p-2 text-right text-xs font-mono text-text-muted bg-surface-subtle/30">
                            {hour % 12 === 0 ? 12 : hour % 12} {hour >= 12 ? 'PM' : 'AM'}
                          </div>

                          {/* 7 Day Slots for this Hour */}
                          {currentWeekDays.map((day, dIdx) => {
                            const slotBookings = (bookings || []).filter((b) => {
                              if (!b || !b.start_time) return false;
                              const bDate = new Date(b.start_time);
                              return isSameDay(bDate, day) && bDate.getHours() === hour;
                            });

                            const slotFollowups = (customers || []).filter((c) => {
                              if (!c || !c.followup_date) return false;
                              if (!isSameDay(c.followup_date, day)) return false;
                              const t = parseEventTime(c.followup_time);
                              return !t.isAllDay && t.hour === hour;
                            });

                            const slotTasks = (tasks || []).filter((t) => {
                              if (!t || !t.due_date) return false;
                              if (!isSameDay(t.due_date, day)) return false;
                              const tInfo = parseTaskTime(t.due_date);
                              return !tInfo.isAllDay && tInfo.hour === hour;
                            });

                            const showBookings = calendarLayerFilter === 'all' || calendarLayerFilter === 'bookings';
                            const showFollowups = calendarLayerFilter === 'all' || calendarLayerFilter === 'followups';
                            const showTasks = calendarLayerFilter === 'all' || calendarLayerFilter === 'tasks';

                            const hasAny = (showBookings && slotBookings.length > 0) ||
                                           (showFollowups && slotFollowups.length > 0) ||
                                           (showTasks && slotTasks.length > 0);

                            return (
                              <div
                                key={dIdx}
                                className="p-1 relative group hover:bg-surface-subtle/50 transition-colors duration-150 min-h-[64px]"
                              >
                                {!hasAny ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const dStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                                      const tStr = `${String(hour).padStart(2, '0')}:00`;
                                      setNewBookingForm((prev) => ({ ...prev, date: dStr, time: tStr }));
                                      setIsAddBookingOpen(true);
                                    }}
                                    className="w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors duration-150 text-xs font-medium rounded-sm cursor-pointer"
                                    title="Add appointment at this time"
                                  >
                                    <Plus className="w-3.5 h-3.5 stroke-[1.5]" />
                                  </button>
                                ) : (
                                  <div className="space-y-1">
                                    {showBookings && slotBookings.map((b) => (
                                      <div
                                        key={b.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedBookingDetail(b);
                                          setIsBookingDetailModalOpen(true);
                                        }}
                                        className={`p-1 rounded-sm border text-left cursor-pointer transition-colors duration-150 text-[10px] ${
                                          b.status === 'completed'
                                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                            : b.status === 'no_show'
                                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                                            : b.status === 'cancelled'
                                            ? 'bg-rose-50 border-rose-300 text-rose-800'
                                            : 'bg-accent border-accent text-white'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between gap-1 font-medium">
                                          <span className="truncate">{b.contact_name || 'Client'}</span>
                                          <span className="font-mono opacity-80">{formatTime12(b.start_time)}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-1 mt-0.5">
                                          <p className="truncate opacity-90">{b.service}</p>
                                          {b.contact_phone && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openChatForContact(b.contact_phone || '');
                                              }}
                                              className="p-0.5 hover:opacity-100 opacity-80 transition-opacity cursor-pointer shrink-0"
                                              title="WhatsApp Chat"
                                            >
                                              <MessageSquare className="w-2.5 h-2.5" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}

                                    {showFollowups && slotFollowups.map((cust) => {
                                      const tInfo = parseEventTime(cust.followup_time);
                                      return (
                                        <div
                                          key={cust.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openCustomerProfileByPhone(cust.phone, cust.name || undefined);
                                          }}
                                          className="p-1 rounded-sm border bg-blue-50 border-blue-200 text-blue-800 text-left cursor-pointer hover:bg-blue-100 text-[10px] transition-colors"
                                          title={`Follow-up with ${cust.name || cust.phone} (${tInfo.formatted})`}
                                        >
                                          <div className="flex items-center justify-between gap-1 font-semibold">
                                            <span className="truncate">📞 {cust.name || cust.phone}</span>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openChatForContact(cust.phone);
                                              }}
                                              className="p-0.5 text-blue-700 hover:text-blue-950 rounded hover:bg-blue-200/50 transition-colors cursor-pointer shrink-0"
                                              title="WhatsApp Chat"
                                            >
                                              <MessageSquare className="w-2.5 h-2.5" />
                                            </button>
                                          </div>
                                          <p className="truncate text-blue-700 mt-0.5">{cust.health_concern || 'Follow-up Call'}</p>
                                        </div>
                                      );
                                    })}

                                    {showTasks && slotTasks.map((t) => (
                                      <div
                                        key={t.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleTask(t.id);
                                        }}
                                        className={`p-1 rounded-sm border text-left cursor-pointer text-[10px] transition-colors ${
                                          t.completed
                                            ? 'bg-surface text-text-muted border-border line-through'
                                            : 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between gap-1">
                                          <p className="font-medium truncate">{t.completed ? '✓' : '□'} {t.title}</p>
                                          {t.customer_phone && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openChatForContact(t.customer_phone!);
                                              }}
                                              className="p-0.5 text-amber-800 hover:text-amber-950 rounded hover:bg-amber-200/50 transition-colors cursor-pointer shrink-0"
                                              title={`WhatsApp chat with ${t.customer_name || t.customer_phone}`}
                                            >
                                              <MessageSquare className="w-2.5 h-2.5" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── 3. DAY VIEW (Unified Schedule) ──────────────────────────── */}
                {calendarViewMode === 'day' && (
                  <div className="flex-1 overflow-y-auto border border-border rounded-md bg-surface flex flex-col p-4 space-y-4">
                    {/* Day Overview Summary Cards */}
                    {(() => {
                      const dayBookings = (bookings || []).filter((b) => {
                        if (!b || !b.start_time) return false;
                        return isSameDay(b.start_time, currentDate);
                      });
                      const dayFollowups = (customers || []).filter((c) => {
                        if (!c || !c.followup_date) return false;
                        return isSameDay(c.followup_date, currentDate);
                      });
                      const dayTasks = (tasks || []).filter((t) => {
                        if (!t || !t.due_date) return false;
                        return isSameDay(t.due_date, currentDate);
                      });

                      const totalRev = dayBookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
                      const pendingTasks = dayTasks.filter((t) => !t.completed).length;

                      const currentDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

                      return (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                          <div className="p-2.5 bg-surface border border-border rounded-md">
                            <p className="text-[11px] font-medium text-text-muted flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-accent" />
                              <span>{currentTaxonomy.event_label || 'Appointments'} ({dayBookings.length})</span>
                            </p>
                            <p className="text-base font-semibold text-text-primary font-mono tabular-nums mt-0.5">{currentCurrencySymbol}{totalRev} <span className="text-[10px] text-text-muted font-normal">exp.</span></p>
                          </div>
                          <div className="p-2.5 bg-surface border border-border rounded-md">
                            <p className="text-[11px] font-medium text-blue-700 flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-blue-600" />
                              <span>Follow-ups Today</span>
                            </p>
                            <p className="text-base font-semibold text-text-primary font-mono tabular-nums mt-0.5">{dayFollowups.length} scheduled</p>
                          </div>
                          <div className="p-2.5 bg-surface border border-border rounded-md">
                            <p className="text-[11px] font-medium text-amber-800 flex items-center gap-1">
                              <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
                              <span>Tasks Due</span>
                            </p>
                            <p className="text-base font-semibold text-text-primary font-mono tabular-nums mt-0.5">{pendingTasks} pending <span className="text-[10px] text-text-muted font-normal">({dayTasks.length})</span></p>
                          </div>
                          <div className="p-2.5 bg-surface border border-border rounded-md flex items-center justify-between">
                            <div>
                              <p className="text-[11px] font-medium text-text-muted">Quick Action</p>
                              <p className="text-[10px] text-text-secondary mt-0.5">Schedule for today</p>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setAddTaskDueDate(currentDateStr);
                                  setShowAddTaskModal(true);
                                }}
                                className="px-2 py-0.5 bg-surface-subtle hover:bg-surface border border-border rounded-sm text-[11px] font-medium cursor-pointer transition-colors"
                              >
                                + Task
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setNewBookingForm((prev) => ({ ...prev, date: currentDateStr, time: '10:00' }));
                                  setIsAddBookingOpen(true);
                                }}
                                className="px-2 py-0.5 bg-accent hover:bg-accent-hover text-white rounded-sm text-[11px] font-medium cursor-pointer transition-colors"
                              >
                                + Booking
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* All-Day / Unscheduled Items Panel (if any exist for currentDate) */}
                    {(() => {
                      const showFollowups = calendarLayerFilter === 'all' || calendarLayerFilter === 'followups';
                      const showTasks = calendarLayerFilter === 'all' || calendarLayerFilter === 'tasks';

                      const allDayFollowups = (customers || []).filter((c) => {
                        if (!c || !c.followup_date || !isSameDay(c.followup_date, currentDate)) return false;
                        const t = parseEventTime(c.followup_time);
                        return t.isAllDay || t.hour < 6;
                      });

                      const allDayTasks = (tasks || []).filter((t) => {
                        if (!t || !t.due_date || !isSameDay(t.due_date, currentDate)) return false;
                        const tInfo = parseTaskTime(t.due_date);
                        return tInfo.isAllDay || tInfo.hour < 6;
                      });

                      if ((!showFollowups || allDayFollowups.length === 0) && (!showTasks || allDayTasks.length === 0)) {
                        return null;
                      }

                      return (
                        <div className="p-3 bg-surface-subtle/50 rounded-md border border-border space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                              <LayoutGrid className="w-3.5 h-3.5 text-text-muted" />
                              <span>All-Day & Anytime Items for Today</span>
                            </span>
                            <span className="text-[10px] font-mono text-text-muted">
                              {(showFollowups ? allDayFollowups.length : 0) + (showTasks ? allDayTasks.length : 0)} items
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {showFollowups && allDayFollowups.map((cust) => (
                              <div
                                key={`dadf-${cust.id}`}
                                onClick={() => openCustomerProfileByPhone(cust.phone, cust.name || undefined)}
                                className="p-2.5 rounded-sm border bg-blue-50/70 border-blue-200 text-blue-900 flex items-center justify-between gap-2 cursor-pointer hover:bg-blue-100/70 transition-colors"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold truncate">📞 {cust.name || cust.phone}</p>
                                  <p className="text-[11px] text-blue-700 truncate">{cust.health_concern || 'Follow-up Call'}</p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openChatForContact(cust.phone);
                                    }}
                                    className="p-1 text-blue-700 hover:text-blue-950 hover:bg-blue-200 rounded cursor-pointer"
                                    title="WhatsApp Chat"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}

                            {showTasks && allDayTasks.map((t) => (
                              <div
                                key={`dadt-${t.id}`}
                                onClick={() => handleToggleTask(t.id)}
                                className={`p-2.5 rounded-sm border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                                  t.completed
                                    ? 'bg-surface text-text-muted border-border line-through'
                                    : 'bg-amber-50/70 border-amber-200 text-amber-950 hover:bg-amber-100/70'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <input
                                    type="checkbox"
                                    checked={t.completed}
                                    onChange={() => handleToggleTask(t.id)}
                                    className="rounded-xs text-accent cursor-pointer shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold truncate">{t.title}</p>
                                    {t.description && <p className="text-[11px] text-text-muted truncate">{t.description}</p>}
                                  </div>
                                </div>
                                {t.customer_phone && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openChatForContact(t.customer_phone!);
                                    }}
                                    className="p-1 text-amber-800 hover:text-amber-950 hover:bg-amber-200/60 rounded cursor-pointer shrink-0"
                                    title={`Chat with ${t.customer_name || t.customer_phone}`}
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Hourly Timeline (6 AM to 11 PM) */}
                    <div className="space-y-2 pt-2 divide-y divide-border">
                      {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map((hour) => {
                        const hourBookings = (bookings || []).filter((b) => {
                          if (!b || !b.start_time) return false;
                          const bDate = new Date(b.start_time);
                          return isSameDay(bDate, currentDate) && bDate.getHours() === hour;
                        });

                        const hourFollowups = (customers || []).filter((c) => {
                          if (!c || !c.followup_date) return false;
                          if (!isSameDay(c.followup_date, currentDate)) return false;
                          const t = parseEventTime(c.followup_time);
                          return !t.isAllDay && t.hour === hour;
                        });

                        const hourTasks = (tasks || []).filter((t) => {
                          if (!t || !t.due_date) return false;
                          if (!isSameDay(t.due_date, currentDate)) return false;
                          const tInfo = parseTaskTime(t.due_date);
                          return !tInfo.isAllDay && tInfo.hour === hour;
                        });

                        const showBookings = calendarLayerFilter === 'all' || calendarLayerFilter === 'bookings';
                        const showFollowups = calendarLayerFilter === 'all' || calendarLayerFilter === 'followups';
                        const showTasks = calendarLayerFilter === 'all' || calendarLayerFilter === 'tasks';

                        const totalHourItems = (showBookings ? hourBookings.length : 0) +
                                               (showFollowups ? hourFollowups.length : 0) +
                                               (showTasks ? hourTasks.length : 0);

                        return (
                          <div key={hour} className="pt-2 flex items-start gap-4">
                            <div className="w-16 shrink-0 text-right font-mono text-xs text-text-muted pt-1">
                              {hour % 12 === 0 ? 12 : hour % 12} {hour >= 12 ? 'PM' : 'AM'}
                            </div>

                            <div className="flex-1 space-y-2">
                              {totalHourItems === 0 ? (
                                <div className="h-6 flex items-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const dStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                                      const tStr = `${String(hour).padStart(2, '0')}:00`;
                                      setNewBookingForm((prev) => ({ ...prev, date: dStr, time: tStr }));
                                      setIsAddBookingOpen(true);
                                    }}
                                    className="text-[11px] text-text-muted hover:text-text-primary transition-colors flex items-center gap-1 opacity-0 hover:opacity-100 cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3 stroke-[1.5]" />
                                    <span>Add booking at {hour % 12 === 0 ? 12 : hour % 12} {hour >= 12 ? 'PM' : 'AM'}</span>
                                  </button>
                                </div>
                              ) : (
                                <>
                                  {/* Bookings */}
                                  {showBookings && hourBookings.map((b) => (
                                    <div
                                      key={`hb-${b.id}`}
                                      onClick={() => {
                                        setSelectedBookingDetail(b);
                                        setIsBookingDetailModalOpen(true);
                                      }}
                                      className="p-3 bg-surface hover:bg-surface-subtle border border-border rounded-md flex items-center justify-between cursor-pointer transition-colors duration-150"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${
                                          b.status === 'completed' ? 'bg-emerald-500' :
                                          b.status === 'no_show' ? 'bg-amber-500' :
                                          b.status === 'cancelled' ? 'bg-rose-500' : 'bg-accent'
                                        }`} />
                                        <div>
                                          <p className="text-xs font-semibold text-text-primary">{b.contact_name || 'Client'}</p>
                                          <p className="text-[11px] text-text-secondary">{b.service} &bull; {b.contact_phone}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <div className="text-right">
                                          <p className="text-xs font-mono font-medium text-text-primary">{currentCurrencySymbol}{b.price || 0}</p>
                                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-sm border ${
                                            b.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                            b.status === 'no_show' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                            b.status === 'cancelled' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                                            'bg-blue-50 text-blue-800 border-blue-200'
                                          }`}>
                                            {b.status}
                                          </span>
                                        </div>
                                        {b.contact_phone && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openChatForContact(b.contact_phone || '');
                                            }}
                                            className="p-1.5 bg-surface-subtle hover:bg-accent hover:text-white text-text-secondary rounded border border-border transition-colors cursor-pointer"
                                            title="WhatsApp Chat"
                                          >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}

                                  {/* Follow-ups */}
                                  {showFollowups && hourFollowups.map((cust) => {
                                    const tInfo = parseEventTime(cust.followup_time);
                                    return (
                                      <div
                                        key={`hf-${cust.id}`}
                                        onClick={() => openCustomerProfileByPhone(cust.phone, cust.name || undefined)}
                                        className="p-3 bg-blue-50/70 hover:bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between cursor-pointer transition-colors duration-150"
                                      >
                                        <div className="flex items-center gap-3">
                                          <Phone className="w-4 h-4 text-blue-600" />
                                          <div>
                                            <p className="text-xs font-semibold text-blue-950">Follow-up: {cust.name || cust.phone}</p>
                                            <p className="text-[11px] text-blue-800">{cust.health_concern || 'Follow-up Call'} &bull; Assigned: {cust.preferred_doctor || 'Staff'}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-medium bg-blue-100 text-blue-900 px-2 py-0.5 rounded-sm border border-blue-300">
                                            {tInfo.formatted}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openChatForContact(cust.phone);
                                            }}
                                            className="p-1.5 bg-blue-100 hover:bg-blue-600 hover:text-white text-blue-800 rounded border border-blue-300 transition-colors cursor-pointer"
                                            title="Chat on WhatsApp"
                                          >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {/* Tasks */}
                                  {showTasks && hourTasks.map((t) => (
                                    <div
                                      key={`ht-${t.id}`}
                                      onClick={() => handleToggleTask(t.id)}
                                      className={`p-3 border rounded-md flex items-center justify-between cursor-pointer transition-colors duration-150 ${
                                        t.completed
                                          ? 'bg-surface-subtle text-text-muted border-border line-through opacity-70'
                                          : 'bg-amber-50/70 hover:bg-amber-50 border-amber-200 text-amber-950'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <input
                                          type="checkbox"
                                          checked={t.completed}
                                          onChange={() => handleToggleTask(t.id)}
                                          className="rounded-xs text-accent cursor-pointer"
                                        />
                                        <div>
                                          <p className="text-xs font-semibold">{t.title}</p>
                                          {t.description && <p className="text-[11px] text-text-muted">{t.description}</p>}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded-sm border border-amber-300">
                                          {t.completed ? 'Completed' : 'Pending Task'}
                                        </span>
                                        {t.customer_phone && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openChatForContact(t.customer_phone!);
                                            }}
                                            className="p-1.5 bg-amber-100 hover:bg-amber-700 hover:text-white text-amber-900 rounded border border-amber-300 transition-colors cursor-pointer"
                                            title={`WhatsApp chat with ${t.customer_name || t.customer_phone}`}
                                          >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* ── VIEW 3: INBOX / CONVERSATIONS ───────────────────────────────── */}
            {activeNav === 'inbox' && (
              <div className="flex-1 flex overflow-hidden border border-border md:rounded-md bg-surface h-full">
                {/* Conversations List */}
                <div className={`${selectedConv ? 'hidden md:flex' : 'flex'} w-full md:w-80 bg-surface border-r border-border flex-col shrink-0 h-full`}>
                  <div className="p-3 border-b border-border space-y-2.5 bg-surface">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">Chats</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-text-muted font-medium">All AI:</span>
                        <button
                          onClick={() => {
                            const anyOn = conversations.some((c) => c.ai_enabled);
                            if (anyOn) {
                              setConfirmAllAiModal(true);
                            } else {
                              handleToggleAllAi(true);
                            }
                          }}
                          disabled={togglingAi}
                          className={`px-2 py-0.5 rounded-sm text-xs font-medium transition-colors duration-150 cursor-pointer border ${
                            conversations.some((c) => c.ai_enabled)
                              ? 'bg-status-success-bg text-status-success border-status-success-border'
                              : 'bg-surface-subtle text-text-muted border-border'
                          }`}
                          title="Toggle AI auto-reply for all conversations"
                        >
                          {conversations.some((c) => c.ai_enabled) ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Search chats..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary placeholder:text-text-muted focus:bg-white focus:border-accent font-sans transition-colors duration-150"
                    />

                    {/* ── Compact & Clean Segmentation Filter Bar ── */}
                    <div className="flex items-center p-0.5 bg-surface-subtle rounded-sm border border-border gap-1">
                      <button
                        type="button"
                        onClick={() => setFilter('all')}
                        className={`flex-1 py-1 px-1.5 text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                          filter === 'all'
                            ? 'bg-surface text-text-primary border border-border-strong font-semibold shadow-subtle'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <span>All</span>
                        <span className={`text-[10px] font-mono px-1 rounded-sm ${filter === 'all' ? 'bg-surface-subtle text-text-primary font-semibold' : 'text-text-muted'}`}>
                          {conversations.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFilter('new')}
                        className={`flex-1 py-1 px-1.5 text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                          filter === 'new'
                            ? 'bg-surface text-text-primary border border-border-strong font-semibold shadow-subtle'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <span>New</span>
                        {conversations.filter((c) => (c.unread_count || 0) > 0 || (c.last_message_at && (Date.now() - new Date(c.last_message_at).getTime() < 86400000))).length > 0 && (
                          <span className={`text-[10px] font-mono px-1 rounded-sm ${filter === 'new' ? 'bg-accent/10 text-accent font-semibold' : 'bg-surface-subtle text-text-muted'}`}>
                            {conversations.filter((c) => (c.unread_count || 0) > 0 || (c.last_message_at && (Date.now() - new Date(c.last_message_at).getTime() < 86400000))).length}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setFilter('important')}
                        className={`flex-1 py-1 px-1.5 text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap ${
                          filter === 'important'
                            ? 'bg-surface text-text-primary border border-border-strong font-semibold shadow-subtle'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <Star className={`w-3 h-3 stroke-[1.5] shrink-0 ${importantConvIds.length > 0 ? 'text-amber-500 fill-amber-500' : 'text-text-muted'}`} />
                        <span>Important</span>
                        {importantConvIds.length > 0 && (
                          <span className={`text-[10px] font-mono px-1 rounded-sm ${filter === 'important' ? 'bg-amber-100 text-amber-800 font-semibold' : 'bg-surface-subtle text-text-muted'}`}>
                            {importantConvIds.length}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-border">
                    {filteredConversations.length === 0 ? (
                      <div className="p-6 text-center text-xs text-text-muted space-y-1">
                        <p className="font-medium text-text-secondary">No conversations</p>
                        <p>No chats match the &quot;{filter}&quot; filter</p>
                      </div>
                    ) : (
                      filteredConversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => selectConversation(conv)}
                          className={`group w-full p-3 text-left transition-colors duration-150 cursor-pointer flex gap-2 items-center justify-between ${
                            selectedConv?.id === conv.id ? 'bg-surface-subtle border-l-2 border-accent' : 'hover:bg-surface-subtle/50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-full bg-surface-subtle text-text-secondary border border-border flex items-center justify-center font-semibold text-xs shrink-0">
                              {conv.contact_name ? conv.contact_name[0].toUpperCase() : 'C'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <p className="font-medium text-xs text-text-primary truncate">{conv.contact_name || conv.contact_phone}</p>
                                  {(() => {
                                    const cleanP = conv.contact_phone ? conv.contact_phone.replace(/[^0-9]/g, '') : '';
                                    if (!cleanP) return null;
                                    const inCrm = Array.isArray(customers) && customers.some((c) => c && c.phone && c.phone.replace(/[^0-9]/g, '') === cleanP);
                                    return inCrm ? (
                                      <span className="text-[9px] font-semibold px-1 py-0.2 rounded-xs bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                        CRM
                                      </span>
                                    ) : null;
                                  })()}
                                </div>
                                <span className="text-[11px] text-text-muted font-mono shrink-0">
                                  {formatTime12(conv.last_message_at)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-0.5">
                                <p className="text-xs text-text-muted truncate font-mono">{conv.contact_phone}</p>
                                <div className="flex items-center gap-1.5">
                                  {(conv.unread_count || 0) > 0 && selectedConv?.id !== conv.id && (
                                    <span className="px-1.5 py-0.2 rounded-full bg-accent text-white text-[10px] font-bold min-w-[18px] text-center">
                                      {conv.unread_count}
                                    </span>
                                  )}
                                  <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded-xs border ${
                                    conv.ai_enabled
                                      ? 'bg-status-success-bg text-status-success border-status-success-border'
                                      : 'bg-status-warning-bg text-status-warning border-status-warning-border'
                                  }`}>
                                    {conv.ai_enabled ? 'AI' : 'Human'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0">
                            {/* Star as Important Toggle Button */}
                            <button
                              type="button"
                              onClick={(e) => toggleImportant(conv.id, e)}
                              className={`p-1 rounded-sm transition-colors duration-150 cursor-pointer ${
                                importantConvIds.includes(conv.id)
                                  ? 'text-amber-500'
                                  : 'text-text-muted hover:text-amber-500 opacity-0 group-hover:opacity-100'
                              }`}
                              title={importantConvIds.includes(conv.id) ? 'Marked as Important (Click to remove)' : 'Mark as Important'}
                            >
                              <Star className={`w-3.5 h-3.5 stroke-[1.5] ${importantConvIds.includes(conv.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteChatModal({
                                  isOpen: true,
                                  convId: conv.id,
                                  name: conv.contact_name || conv.contact_phone || 'this customer',
                                });
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-status-error hover:bg-status-error-bg rounded-sm transition-colors duration-150 shrink-0 cursor-pointer"
                              title="Delete chat"
                            >
                              <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Active Chat Conversation Area */}
                <div className={`${selectedConv ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-surface h-full min-w-0 overflow-hidden`}>
                  {selectedConv ? (
                    <>
                      {/* Chat Header (Responsive) */}
                      <div className="h-14 px-3 sm:px-4 border-b border-border flex items-center justify-between bg-surface shrink-0 z-10">
                        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                          <button
                            type="button"
                            onClick={() => setSelectedConv(null)}
                            className="md:hidden p-1.5 -ml-1 text-text-secondary hover:text-text-primary rounded-sm hover:bg-surface-subtle cursor-pointer shrink-0"
                            title="Back to conversation list"
                          >
                            <ArrowLeft className="w-5 h-5 stroke-[1.8]" />
                          </button>
                          <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {selectedConv.contact_name ? selectedConv.contact_name[0].toUpperCase() : 'C'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-semibold text-xs sm:text-sm text-text-primary truncate">{selectedConv.contact_name || selectedConv.contact_phone}</h4>
                              {(() => {
                                const cleanP = selectedConv?.contact_phone ? selectedConv.contact_phone.replace(/[^0-9]/g, '') : '';
                                if (!cleanP) return null;
                                const inCrm = Array.isArray(customers) && customers.some((c) => c && c.phone && c.phone.replace(/[^0-9]/g, '') === cleanP);
                                return inCrm ? (
                                  <span className="text-[9px] font-semibold px-1 py-0.2 rounded-xs bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                    CRM
                                  </span>
                                ) : null;
                              })()}
                            </div>
                            <p className="text-[10px] text-text-muted font-mono truncate">{selectedConv.contact_phone}</p>
                          </div>
                        </div>

                        {/* Right Action Icons (Compact & Responsive) */}
                        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                          {/* Cross-tab CRM profile button */}
                          {(() => {
                            const cleanP = selectedConv?.contact_phone ? selectedConv.contact_phone.replace(/[^0-9]/g, '') : '';
                            const existingCust = cleanP && Array.isArray(customers) ? customers.find((c) => c && c.phone && c.phone.replace(/[^0-9]/g, '') === cleanP) : null;
                            if (existingCust) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => openCustomerProfileByPhone(selectedConv.contact_phone || '', selectedConv.contact_name || undefined)}
                                  className="px-2 py-1 rounded-sm text-xs font-medium border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1 transition-colors cursor-pointer"
                                  title="View customer profile and bookings"
                                >
                                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="hidden sm:inline">Manage</span>
                                </button>
                              );
                            } else {
                              return (
                                <button
                                  type="button"
                                  onClick={() => openCustomerProfileByPhone(selectedConv.contact_phone || '', selectedConv.contact_name || undefined)}
                                  className="px-2 py-1 rounded-sm text-xs font-medium border border-accent bg-accent/10 text-accent hover:bg-accent hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Add this contact to CRM"
                                >
                                  <UserPlus className="w-3.5 h-3.5 shrink-0" />
                                  <span className="hidden sm:inline">+ CRM</span>
                                </button>
                              );
                            }
                          })()}

                          {/* AI Toggle Button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedConv.ai_enabled) {
                                setConfirmSingleAiModal({
                                  isOpen: true,
                                  convId: selectedConv.id,
                                  name: selectedConv.contact_name || selectedConv.contact_phone || 'this customer',
                                });
                              } else {
                                handleToggleAi(selectedConv.id, false);
                              }
                            }}
                            disabled={togglingAi}
                            className={`px-2 py-1 rounded-sm text-xs font-medium border flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50 ${
                              selectedConv.ai_enabled
                                ? 'bg-status-success-bg text-status-success border-status-success-border'
                                : 'bg-status-warning-bg text-status-warning border-status-warning-border'
                            }`}
                            title={selectedConv.ai_enabled ? 'AI is ON (Click to pause)' : 'AI is OFF (Click to resume)'}
                          >
                            <Bot className="w-3.5 h-3.5 stroke-[1.5] shrink-0" />
                            <span className="text-[11px] font-semibold">{selectedConv.ai_enabled ? 'AI' : 'Human'}</span>
                          </button>

                          {/* Star Important */}
                          <button
                            type="button"
                            onClick={() => toggleImportant(selectedConv.id)}
                            className={`p-1.5 rounded-sm border transition-colors cursor-pointer ${
                              importantConvIds.includes(selectedConv.id)
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-subtle border-border'
                            }`}
                            title={importantConvIds.includes(selectedConv.id) ? 'Remove Important' : 'Mark Important'}
                          >
                            <Star className={`w-3.5 h-3.5 stroke-[1.5] ${importantConvIds.includes(selectedConv.id) ? 'fill-amber-500 text-amber-500' : 'text-text-muted'}`} />
                          </button>

                          {/* Delete Chat */}
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteChatModal({
                                isOpen: true,
                                convId: selectedConv.id,
                                name: selectedConv.contact_name || selectedConv.contact_phone || 'this customer',
                              })
                            }
                            className="p-1.5 text-text-muted hover:text-status-error hover:bg-status-error-bg rounded-sm transition-colors cursor-pointer"
                            title="Delete chat"
                          >
                            <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                          </button>
                        </div>
                      </div>

                      {/* Chat Messages Stream */}
                      <div
                        ref={messagesContainerRef}
                        style={{ scrollBehavior: 'auto' }}
                        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 bg-canvas/40"
                      >
                        {loadingMessages && (!messages || messages.length === 0) ? (
                          <div className="h-full flex items-center justify-center py-12">
                            <div className="flex items-center gap-2 text-xs text-text-muted bg-surface/80 px-3 py-1.5 rounded-full border border-border shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                              <span>Loading chat...</span>
                            </div>
                          </div>
                        ) : !loadingMessages && (!messages || messages.length === 0) ? (
                          <div className="h-full flex items-center justify-center py-12 text-xs text-text-muted">
                            No messages in this chat yet.
                          </div>
                        ) : (
                          messages.map((msg) => {
                            const isInbound = msg.direction === 'inbound';
                            const isVoice = msg.body?.startsWith('[Voice Note:');
                            return (
                              <div key={msg.id} className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}>
                                <div
                                  className={`max-w-[85%] sm:max-w-[70%] rounded-2xl ${isInbound ? 'rounded-tl-xs bg-surface text-text-body border border-border shadow-xs' : 'rounded-tr-xs bg-accent text-white shadow-xs'} px-3.5 py-2.5 text-xs`}
                                >
                                  {isVoice && (
                                    <div className="flex items-center gap-1 text-accent-light font-mono text-[10px] mb-1">
                                      <Mic className="w-3 h-3 stroke-[1.5]" />
                                      <span>Voice note transcribed</span>
                                    </div>
                                  )}
                                  <p className="leading-relaxed whitespace-pre-wrap font-sans">{msg.body}</p>
                                  <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 font-mono ${isInbound ? 'text-text-muted' : 'text-teal-100/90'}`}>
                                    <span>{formatTime12(msg.created_at)}</span>
                                    {!isInbound && (
                                      <span className="inline-flex items-center ml-0.5" title={msg.status === 'read' ? 'Read (seen)' : msg.status === 'delivered' ? 'Delivered' : msg.status === 'failed' ? 'Failed' : 'Sent'}>
                                        {msg.status === 'read' ? (
                                          <CheckCheck className="w-3.5 h-3.5 stroke-[2.2] text-[#53bdeb] shrink-0" />
                                        ) : msg.status === 'delivered' ? (
                                          <CheckCheck className="w-3.5 h-3.5 stroke-[2] text-teal-200/80 shrink-0" />
                                        ) : msg.status === 'failed' ? (
                                          <AlertCircle className="w-3 h-3 stroke-[2] text-rose-300 shrink-0" />
                                        ) : (
                                          <Check className="w-3.5 h-3.5 stroke-[2] text-teal-200/80 shrink-0" />
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Chat Input */}
                      <form onSubmit={handleSendMessage} className="p-2 sm:p-3 border-t border-border flex items-center gap-2 bg-surface shrink-0">
                        <input
                          type="text"
                          placeholder="Type WhatsApp reply..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="flex-1 px-3.5 py-2 bg-surface-subtle border border-border rounded-full text-xs text-text-primary focus:outline-none focus:bg-white focus:border-accent font-sans transition-colors duration-150"
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim() || sendingMessage}
                          className="w-8 h-8 rounded-full bg-accent hover:bg-accent-hover text-white font-medium flex items-center justify-center transition-colors duration-150 cursor-pointer disabled:opacity-50 shrink-0 shadow-xs"
                        >
                          <Send className="w-3.5 h-3.5 stroke-[1.8]" />
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-2 bg-surface-subtle/30">
                      <div className="w-10 h-10 rounded-sm bg-surface border border-border flex items-center justify-center text-text-secondary">
                        <MessageSquare className="w-5 h-5 stroke-[1.5]" />
                      </div>
                      <div>
                        <h4 className="font-medium text-xs text-text-primary">No conversation selected</h4>
                        <p className="text-xs text-text-muted max-w-xs mt-0.5">
                          Select a conversation from the left to view customer messages and send replies.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* ── UNIFIED VIEW: CUSTOMERS & FOLLOW-UP ───────────────────── */}
            {(activeNav === 'customers' || activeNav === 'followup') && (
              <div className="flex-1 flex flex-col overflow-hidden space-y-3">
                {/* Header with Title, Dynamic Taxonomy, + Add Customer, and Sub-Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border pb-2.5 pt-1">
                  <div>
                    <h3 className="font-semibold text-sm text-text-primary flex items-center gap-2">
                      <Users className="w-4 h-4 text-accent stroke-[1.5]" />
                      <span>{currentTaxonomy.client_plural || 'Customers'}</span>
                    </h3>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      Manage all {(currentTaxonomy.client_plural || 'customers').toLowerCase()}, follow-ups, tasks, and notes.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* View Switcher Pills */}
                    <div className="flex items-center gap-1 bg-surface-subtle border border-border rounded-md p-0.5 overflow-x-auto no-scrollbar shrink-0">
                      <button
                        onClick={() => setFollowupView('list')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                          followupView === 'list'
                            ? 'bg-surface text-text-primary border border-border font-semibold shadow-xs'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <List className="w-3.5 h-3.5 stroke-[1.5]" />
                        <span>Follow-up</span>
                        <span className="text-[10px] text-text-muted bg-surface-subtle border border-border px-1 py-0.2 rounded-xs font-mono">{customers.length}</span>
                      </button>
                      <button
                        onClick={() => setFollowupView('tasks')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                          followupView === 'tasks'
                            ? 'bg-surface text-text-primary border border-border font-semibold shadow-xs'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <CalendarCheck className="w-3.5 h-3.5 stroke-[1.5]" />
                        <span>Tasks</span>
                        <span className="text-[10px] text-text-muted bg-surface-subtle border border-border px-1 py-0.2 rounded-xs font-mono">{tasks.filter(t => !t.completed).length}</span>
                      </button>
                      <button
                        onClick={() => {
                          setFollowupView('notes');
                          setLoadingAllNotes(true);
                          crm.getAllNotes().then(n => { setAllNotes(Array.isArray(n) ? n : []); setLoadingAllNotes(false); }).catch(() => setLoadingAllNotes(false));
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                          followupView === 'notes'
                            ? 'bg-surface text-text-primary border border-border font-semibold shadow-xs'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <StickyNote className="w-3.5 h-3.5 stroke-[1.5]" />
                        <span>Notes</span>
                        <span className="text-[10px] text-text-muted bg-surface-subtle border border-border px-1 py-0.2 rounded-xs font-mono">{allNotes.length}</span>
                      </button>
                    </div>

                    {/* Export CSV Button */}
                    <button
                      onClick={exportCustomersToCsv}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary border border-border text-xs font-medium rounded-sm transition-colors cursor-pointer"
                      title="Export customer records to CSV"
                    >
                      <Download className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>Export CSV</span>
                    </button>

                    {/* + Add Customer Button */}
                    <button
                      onClick={() => setShowAddCustomerModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors cursor-pointer shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5 stroke-[1.5]" />
                      Add {currentTaxonomy.client_label || 'Customer'}
                    </button>

                    {/* Refresh Button */}
                    <button
                      onClick={() => {
                        loadCustomers();
                        loadTasks();
                        if (followupView === 'notes') {
                          setLoadingAllNotes(true);
                          crm.getAllNotes().then(n => { setAllNotes(Array.isArray(n) ? n : []); setLoadingAllNotes(false); }).catch(() => setLoadingAllNotes(false));
                        }
                      }}
                      className="px-2.5 py-1.5 bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary border border-border rounded-sm text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      title="Refresh"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${loadingCustomers || loadingTasks || loadingAllNotes ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* ── SUB-VIEW A: FOLLOW-UP PIPELINE ──────────────────────────────── */}
                {followupView === 'list' && (
                  <div className="flex-1 flex flex-col overflow-hidden space-y-3">
                    {/* Filter & Segment Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 bg-surface border border-border rounded-sm">
                      {/* Left: Status Filter Pills */}
                      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full shrink-0">
                        <span className="text-[11px] font-medium text-text-muted mr-1">Status:</span>
                        {[
                          { key: 'all', label: 'All' },
                          { key: 'new', label: 'New' },
                          { key: 'contacted', label: 'Contacted' },
                          { key: 'follow-up', label: 'Follow-up' },
                          { key: 'converted', label: 'Converted' },
                          { key: 'lost', label: 'Lost' },
                        ].map((st) => (
                          <button
                            key={st.key}
                            onClick={() => setFollowupStatusFilter(st.key)}
                            className={`px-2.5 py-0.5 text-xs rounded-sm border transition-colors cursor-pointer ${
                              followupStatusFilter === st.key
                                ? 'bg-surface-subtle border-text-primary font-semibold text-text-primary'
                                : 'bg-surface border-border text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>

                      {/* Middle: Lead Probability Badges */}
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-medium text-text-muted mr-1">Lead:</span>
                        {[
                          { key: 'all', label: 'All' },
                          { key: 'hot', label: 'Hot', dot: 'bg-rose-500' },
                          { key: 'warm', label: 'Warm', dot: 'bg-amber-500' },
                          { key: 'cold', label: 'Cold', dot: 'bg-blue-400' },
                        ].map((prob) => (
                          <button
                            key={prob.key}
                            onClick={() => setFollowupProbabilityFilter(prob.key)}
                            className={`px-2 py-0.5 text-xs rounded-sm border transition-colors cursor-pointer flex items-center gap-1 ${
                              followupProbabilityFilter === prob.key
                                ? 'bg-surface-subtle border-text-primary font-semibold text-text-primary'
                                : 'bg-surface border-border text-text-secondary hover:text-text-primary'
                            }`}
                          >
                            {prob.dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${prob.dot}`} />}
                            <span>{prob.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Right: Staff Selector & Search */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <select
                            value={followupDoctorFilter}
                            onChange={(e) => setFollowupDoctorFilter(e.target.value)}
                            className="px-2.5 py-1 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent max-w-[160px]"
                          >
                            <option value="all">All {currentTaxonomy.staff_label ? currentTaxonomy.staff_label.split('/')[0].trim() + 's' : 'Staff'}</option>
                            {availableDoctors.map((doc) => (
                              <option key={doc} value={doc}>{doc}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={openDoctorEditor}
                            title={`Manage ${currentTaxonomy.staff_label || 'Doctors / Staff'}`}
                            className="p-1 text-text-muted hover:text-accent hover:bg-surface-subtle border border-border rounded-sm transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3 h-3 stroke-[1.8]" />
                          </button>
                        </div>

                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                          <input
                            type="text"
                            placeholder={`Filter ${(currentTaxonomy.client_plural || 'customers').toLowerCase()}, phone...`}
                            value={followupSearch}
                            onChange={(e) => setFollowupSearch(e.target.value)}
                            className="pl-8 pr-3 py-1 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:outline-none focus:border-accent w-48"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick KPI Summary Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-surface border border-border rounded-sm flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-text-muted font-medium">Total {currentTaxonomy.client_plural || 'Customers'}</p>
                          <p className="text-base font-semibold text-text-primary mt-0.5">{customers.length}</p>
                        </div>
                        <Users className="w-4 h-4 text-text-muted stroke-[1.5]" />
                      </div>

                      <div className="p-3 bg-surface border border-border rounded-sm flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-amber-700 font-medium">Pending Follow-ups</p>
                          <p className="text-base font-semibold text-amber-900 mt-0.5">
                            {customers.filter(c => c.status === 'follow-up' || c.status === 'new').length}
                          </p>
                        </div>
                        <Clock3 className="w-4 h-4 text-amber-600 stroke-[1.5]" />
                      </div>

                      <div className="p-3 bg-surface border border-border rounded-sm flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-rose-700 font-medium">Hot Leads</p>
                          <p className="text-base font-semibold text-rose-900 mt-0.5">
                            {customers.filter(c => c.lead_probability === 'hot').length}
                          </p>
                        </div>
                        <Flame className="w-4 h-4 text-rose-600 stroke-[1.5]" />
                      </div>

                      <div className="p-3 bg-surface border border-border rounded-sm flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-emerald-700 font-medium">Converted {currentTaxonomy.client_plural || 'Customers'}</p>
                          <p className="text-base font-semibold text-emerald-900 mt-0.5">
                            {customers.filter(c => c.converted).length}
                            <span className="text-[10px] text-emerald-600 ml-1.5 font-normal">
                              ({customers.length ? Math.round((customers.filter(c => c.converted).length / customers.length) * 100) : 0}%)
                            </span>
                          </p>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[1.5]" />
                      </div>
                    </div>

                    {/* Main Table + Customer Detail Drawer */}
                    <div className="flex-1 flex overflow-hidden gap-3">
                      {/* Customers Table */}
                      <div className={`flex-1 overflow-y-auto border border-border rounded-sm bg-surface ${selectedCustomer ? 'hidden md:block min-w-0' : ''}`}>
                        <table className="w-full text-left text-xs min-w-[720px]">
                          <thead className="bg-surface-subtle border-b border-border text-text-secondary font-medium text-[11px] sticky top-0 z-10">
                            <tr>
                              <th className="p-2.5 pl-4">{currentTaxonomy.client_label || 'Customer'}</th>
                              <th className="p-2.5">{currentTaxonomy.staff_label || 'Staff'}</th>
                              <th className="p-2.5">{currentTaxonomy.requirement_label || 'Requirement'}</th>
                              <th className="p-2.5">{currentTaxonomy.status_label || 'Status'}</th>
                              <th className="p-2.5">{currentTaxonomy.lead_label || 'Lead'}</th>
                              <th className="p-2.5">{currentTaxonomy.followup_label || 'Follow-up Due'}</th>
                              <th className="p-2.5">{currentTaxonomy.notes_label || 'Latest Note'}</th>
                              <th className="p-2.5 text-right pr-4">{currentTaxonomy.actions_label || 'Action'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {loadingCustomers ? (
                              <tr>
                                <td colSpan={8} className="p-8 text-center text-text-muted">
                                  Loading {(currentTaxonomy.client_plural || 'customers').toLowerCase()}...
                                </td>
                              </tr>
                            ) : customers.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="p-8 text-center text-text-muted">
                                  No {(currentTaxonomy.client_plural || 'customers').toLowerCase()} match the selected filters.
                                </td>
                              </tr>
                            ) : (
                              customers.map((cust) => {
                                const isSelected = selectedCustomer?.id === cust.id;
                                let fuBadge: React.ReactNode = <span className="text-text-muted text-[11px]">—</span>;
                                if (cust.followup_date) {
                                  const today = new Date(); today.setHours(0,0,0,0);
                                  const fuDate = new Date(cust.followup_date); fuDate.setHours(0,0,0,0);
                                  const diff = Math.round((fuDate.getTime() - today.getTime()) / 86400000);
                                  if (diff < 0) fuBadge = <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-semibold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1 w-fit"><AlertCircle className="w-2.5 h-2.5" />Overdue</span>;
                                  else if (diff === 0) fuBadge = <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit"><Clock className="w-2.5 h-2.5" />Today</span>;
                                  else if (diff === 1) fuBadge = <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1 w-fit"><CalendarClock className="w-2.5 h-2.5" />Tomorrow</span>;
                                  else fuBadge = <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1 w-fit"><Calendar className="w-2.5 h-2.5" />{cust.followup_date}</span>;
                                }

                                return (
                                  <tr
                                    key={cust.id}
                                    onClick={() => handleSelectCustomer(cust)}
                                    className={`cursor-pointer transition-colors duration-150 ${
                                      isSelected ? 'bg-blue-50/50 border-l-2 border-l-accent' : 'hover:bg-surface-subtle/70'
                                    }`}
                                  >
                                    <td className="p-2.5 pl-4">
                                      <div className="font-medium text-text-primary text-[11px]">{cust.name || 'Customer'}</div>
                                      <div className="font-mono text-[10px] text-text-muted mt-0.5">{cust.phone}</div>
                                      {(cust.age || cust.location) && (
                                        <div className="text-[10px] text-text-muted mt-0.5 flex items-center gap-1">
                                          {cust.age && <span>{cust.age}y</span>}
                                          {cust.age && cust.location && <span>·</span>}
                                          {cust.location && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{cust.location}</span>}
                                        </div>
                                      )}
                                    </td>

                                    <td className="p-2.5 text-text-secondary whitespace-nowrap text-[11px]" onClick={(e) => e.stopPropagation()}>
                                      <select
                                        value={cust.preferred_doctor || ''}
                                        onChange={(e) => handleUpdateCustomer(cust.id, { preferred_doctor: e.target.value })}
                                        className="px-1.5 py-0.5 text-[11px] bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent cursor-pointer max-w-[135px]"
                                      >
                                        <option value="">— Unassigned —</option>
                                        {availableDoctors.map((doc) => (
                                          <option key={doc} value={doc}>{doc}</option>
                                        ))}
                                      </select>
                                    </td>

                                    <td className="p-2.5 text-text-secondary max-w-[150px] truncate" title={cust.health_concern}>
                                      <span className="text-[11px]">{cust.health_concern || '—'}</span>
                                    </td>

                                    {/* Status Selector */}
                                    <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                                      <select
                                        value={cust.status}
                                        onChange={(e) => handleUpdateCustomer(cust.id, { status: e.target.value as any, converted: e.target.value === 'converted' })}
                                        className={`px-2 py-0.5 rounded-sm text-[11px] font-medium border focus:outline-none cursor-pointer ${
                                          cust.status === 'converted'
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                            : cust.status === 'follow-up'
                                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                                            : cust.status === 'contacted'
                                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                                            : cust.status === 'lost'
                                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                                            : 'bg-slate-100 text-slate-800 border-slate-200'
                                        }`}
                                      >
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="follow-up">Follow-up</option>
                                        <option value="converted">Converted</option>
                                        <option value="lost">Lost</option>
                                      </select>
                                    </td>

                                    {/* Lead Probability Selector */}
                                    <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                                      <select
                                        value={cust.lead_probability}
                                        onChange={(e) => handleUpdateCustomer(cust.id, { lead_probability: e.target.value as any })}
                                        className={`px-2 py-0.5 rounded-sm text-[11px] font-medium border focus:outline-none cursor-pointer ${
                                          cust.lead_probability === 'hot'
                                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                                            : cust.lead_probability === 'warm'
                                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                                            : 'bg-blue-50 text-blue-800 border-blue-200'
                                        }`}
                                      >
                                        <option value="hot">Hot</option>
                                        <option value="warm">Warm</option>
                                        <option value="cold">Cold</option>
                                      </select>
                                    </td>

                                    {/* Follow-up Due Badge */}
                                    <td className="p-2.5">{fuBadge}</td>

                                    {/* Latest Note */}
                                    <td className="p-2.5 max-w-[160px]">
                                      {cust.latest_note ? (
                                        <div className="truncate text-text-secondary text-[11px]" title={cust.latest_note}>
                                          {cust.latest_note}
                                        </div>
                                      ) : (
                                        <span className="text-text-muted text-[11px]">No notes</span>
                                      )}
                                    </td>

                                    {/* Actions */}
                                    <td className="p-2.5 pr-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex items-center gap-1.5 justify-end">
                                        <button
                                          onClick={() => openChatForContact(cust.phone)}
                                          className="px-2 py-1 bg-surface hover:bg-surface-subtle text-text-primary text-[11px] rounded-sm border border-border transition-colors cursor-pointer flex items-center gap-1"
                                        >
                                          <MessageSquare className="w-3 h-3 stroke-[1.5]" /> Chat
                                        </button>
                                        <button
                                          onClick={() => handleSelectCustomer(cust)}
                                          className="px-2 py-1 bg-accent hover:bg-accent-hover text-white text-[11px] rounded-sm transition-colors cursor-pointer flex items-center gap-1"
                                        >
                                          <User className="w-3 h-3 stroke-[1.5]" /> Manage
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Customer Detail Drawer / Profile Panel */}
                      {selectedCustomer && (
                        <div className={`fixed inset-0 z-50 md:relative md:inset-auto md:z-auto w-full ${isDrawerExpanded ? 'md:w-[740px] md:max-w-[55vw]' : 'md:w-[480px] xl:w-[540px]'} bg-surface border border-border md:rounded-sm flex flex-col shrink-0 overflow-hidden transition-all duration-200 shadow-2xl md:shadow-sm`}>
                          {/* Panel Header */}
                          <div className="p-3 border-b border-border flex items-center justify-between bg-surface-subtle/50">
                            <div>
                              <h4 className="font-semibold text-xs text-text-primary flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                                <span>{selectedCustomer.name || 'Customer Profile'}</span>
                              </h4>
                              <p className="text-[10px] font-mono text-text-muted mt-0.5">{selectedCustomer.phone}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => openChatForContact(selectedCustomer.phone)}
                                className="px-2 py-1 bg-surface hover:bg-surface-subtle text-text-primary text-[11px] font-medium rounded-sm border border-border flex items-center gap-1 transition-colors cursor-pointer"
                                title="Open WhatsApp chat"
                              >
                                <MessageSquare className="w-3 h-3 text-accent stroke-[1.5]" />
                                <span>Chat</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsDrawerExpanded(!isDrawerExpanded)}
                                className="p-1 text-text-muted hover:text-text-primary rounded-sm hover:bg-surface-subtle transition-colors cursor-pointer"
                                title={isDrawerExpanded ? 'Collapse panel' : 'Expand full width'}
                              >
                                {isDrawerExpanded ? <Minimize2 className="w-3.5 h-3.5 stroke-[1.5]" /> : <Maximize2 className="w-3.5 h-3.5 stroke-[1.5]" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => { setSelectedCustomer(null); setIsDrawerExpanded(false); }}
                                className="p-1 text-text-muted hover:text-text-primary rounded-sm hover:bg-surface-subtle transition-colors cursor-pointer"
                                title="Close profile"
                              >
                                <X className="w-3.5 h-3.5 stroke-[1.5]" />
                              </button>
                            </div>
                          </div>

                          {/* Latest WhatsApp message bar if available */}
                          {selectedCustomer.last_message && (
                            <div
                              onClick={() => openChatForContact(selectedCustomer.phone)}
                              className="px-3 py-1.5 bg-blue-50/70 hover:bg-blue-100/60 border-b border-blue-100 flex items-center justify-between gap-2 text-[11px] text-blue-900 cursor-pointer transition-colors"
                              title="Click to open full conversation in Inbox"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <MessageSquare className="w-3 h-3 text-accent shrink-0" />
                                <span className="font-semibold text-text-muted shrink-0">Latest WhatsApp:</span>
                                <span className="truncate italic text-text-primary">"{selectedCustomer.last_message}"</span>
                              </div>
                              {selectedCustomer.last_chat_at && (
                                <span className="text-[10px] text-text-muted shrink-0 font-mono">
                                  {formatRelativeTime(selectedCustomer.last_chat_at)}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Panel Body */}
                          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
                            {/* 1. Identity & Attributes Card */}
                            <div className="space-y-2 p-3 bg-surface-subtle border border-border rounded-sm">
                              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">Customer Details</p>
                              
                              <div>
                                <label className="text-[10px] text-text-muted block mb-1">{currentTaxonomy.requirement_label || 'Requirement / Concern'}</label>
                                <textarea
                                  value={drawerConcern}
                                  onChange={(e) => setDrawerConcern(e.target.value)}
                                  rows={2}
                                  placeholder={`Enter ${(currentTaxonomy.requirement_label || 'requirement').toLowerCase()}...`}
                                  className="w-full px-2.5 py-1.5 text-[11px] bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent resize-none"
                                />
                                {/* Prebuilt Chips */}
                                {((settingsForm.taxonomy?.requirement_presets && settingsForm.taxonomy.requirement_presets.length > 0)
                                  ? settingsForm.taxonomy.requirement_presets
                                  : (PREBUILT_REQUIREMENTS_BY_INDUSTRY[settingsForm.industry || 'clinic'] || PREBUILT_REQUIREMENTS_BY_INDUSTRY.clinic)
                                ) && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {((settingsForm.taxonomy?.requirement_presets && settingsForm.taxonomy.requirement_presets.length > 0)
                                      ? settingsForm.taxonomy.requirement_presets
                                      : (PREBUILT_REQUIREMENTS_BY_INDUSTRY[settingsForm.industry || 'clinic'] || PREBUILT_REQUIREMENTS_BY_INDUSTRY.clinic)
                                    ).map((chip) => (
                                      <button
                                        key={chip}
                                        type="button"
                                        onClick={() => setDrawerConcern(chip)}
                                        className={`px-2 py-0.5 rounded-sm text-[10px] border cursor-pointer transition-colors ${
                                          drawerConcern === chip ? 'bg-accent text-white border-accent' : 'bg-surface text-text-secondary border-border hover:border-accent hover:text-accent'
                                        }`}
                                      >
                                        {chip}
                                      </button>
                                    ))}
                                                                        <button
                                        type="button"
                                        onClick={openPresetEditor}
                                        title="Edit presets (add or remove)"
                                        className="px-1.5 py-0.5 rounded-sm text-[10px] border border-dashed border-border hover:border-accent text-text-muted hover:text-accent flex items-center gap-1 transition-colors cursor-pointer bg-surface font-medium"
                                      >
                                        <Pencil className="w-2.5 h-2.5 stroke-[1.8]" />
                                        <span>Edit</span>
                                      </button>
                                    </div>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <div>
                                  <label className="text-[10px] text-text-muted block mb-1">Age</label>
                                  <input
                                    type="number" min="1" max="120"
                                    value={drawerAge}
                                    onChange={(e) => setDrawerAge(e.target.value)}
                                    placeholder="e.g. 35"
                                    className="w-full px-2 py-1 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-text-muted block mb-1">Location</label>
                                  <input
                                    type="text"
                                    value={drawerLocation}
                                    onChange={(e) => setDrawerLocation(e.target.value)}
                                    placeholder="e.g. Mumbai"
                                    className="w-full px-2 py-1 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                                  />
                                </div>
                              </div>

                              <div className="pt-1">
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-[10px] text-text-muted">{currentTaxonomy.staff_label || 'Assigned Staff / Doctor'}</label>
                                  <button
                                    type="button"
                                    onClick={openDoctorEditor}
                                    className="text-[10px] text-accent hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                                  >
                                    <Pencil className="w-2.5 h-2.5 stroke-[1.8]" />
                                    <span>Manage {currentTaxonomy.staff_label ? currentTaxonomy.staff_label.split('/')[0].trim() + 's' : 'Staff'}</span>
                                  </button>
                                </div>
                                <div className="space-y-1">
                                  <select
                                    value={drawerDoctor}
                                    onChange={(e) => setDrawerDoctor(e.target.value)}
                                    className="w-full px-2 py-1 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent cursor-pointer"
                                  >
                                    <option value="">— Unassigned —</option>
                                    {availableDoctors.map((doc) => (
                                      <option key={doc} value={doc}>{doc}</option>
                                    ))}
                                  </select>
                                  {drawerDoctor && !availableDoctors.includes(drawerDoctor) && (
                                    <input
                                      type="text"
                                      value={drawerDoctor}
                                      onChange={(e) => setDrawerDoctor(e.target.value)}
                                      placeholder="Custom staff name..."
                                      className="w-full px-2 py-1 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                                    />
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={handleSaveDrawerAttributes}
                                disabled={savingDrawerAttributes}
                                className="w-full py-1.5 px-3 bg-accent hover:bg-accent-hover disabled:opacity-60 text-white text-[11px] font-medium rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                              >
                                <Save className="w-3 h-3 stroke-[1.5]" />
                                {savingDrawerAttributes ? 'Saving...' : 'Save Attributes'}
                              </button>
                            </div>

                            {/* 2. Schedule Follow-up Card */}
                            <div className="p-3 bg-surface-subtle border border-border rounded-sm space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                                  <CalendarClock className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                                  <span>Schedule Follow-up</span>
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {selectedCustomer.google_task_id && (
                                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-sm font-medium">
                                      Tasks Synced
                                    </span>
                                  )}
                                  {selectedCustomer.google_calendar_event_id && (
                                    <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-sm font-medium">
                                      Calendar Synced
                                    </span>
                                  )}
                                  {selectedCustomer.followup_date && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCustomerFollowup(selectedCustomer.id)}
                                      className="px-2 py-0.5 text-[10px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-sm font-medium transition-colors cursor-pointer flex items-center gap-1"
                                      title="Delete scheduled follow-up"
                                    >
                                      <Trash2 className="w-2.5 h-2.5 stroke-[1.5]" />
                                      <span>Delete Follow-up</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] text-text-muted block mb-1">Follow-up Date</label>
                                  <input
                                    type="date"
                                    value={selectedCustomer.followup_date || ''}
                                    onChange={(e) => handleUpdateCustomer(selectedCustomer.id, { followup_date: e.target.value })}
                                    className="w-full px-2 py-1 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-text-muted block mb-1">Follow-up Time</label>
                                  <input
                                    type="text"
                                    value={selectedCustomer.followup_time || '10:00 AM'}
                                    onChange={(e) => handleUpdateCustomer(selectedCustomer.id, { followup_time: e.target.value })}
                                    placeholder="e.g. 10:30 AM"
                                    className="w-full px-2 py-1 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                                  />
                                </div>
                              </div>

                              <button
                                type="button"
                                disabled={syncingGoogleTasks}
                                onClick={() => handleSyncCustomerToGoogleTasks(selectedCustomer.id)}
                                className="w-full py-1.5 px-2.5 bg-surface hover:bg-surface-subtle text-text-primary text-xs font-medium border border-border rounded-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <CalendarCheck className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                                <span>
                                  {syncingGoogleTasks
                                    ? 'Syncing with Google Calendar & Tasks...'
                                    : (selectedCustomer.google_task_id || selectedCustomer.google_calendar_event_id)
                                    ? 'Re-sync with Google Calendar & Tasks'
                                    : 'Sync to Google Calendar & Tasks'}
                                </span>
                              </button>
                            </div>

                            {/* 3. Notes History & Add Note */}
                            <div className="space-y-2 border-t border-border pt-3">
                              <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                                <StickyNote className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                                <span>Staff Notes ({customerNotes.length})</span>
                              </span>

                              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                {loadingCustomerNotes ? (
                                  <p className="text-[11px] text-text-muted text-center py-2">Loading notes...</p>
                                ) : customerNotes.length === 0 ? (
                                  <p className="text-[11px] text-text-muted text-center py-2 bg-surface-subtle/50 rounded-sm border border-border">
                                    No notes added yet.
                                  </p>
                                ) : (
                                  customerNotes.map((nt) => {
                                    const noteColor = nt.color || 'slate';
                                    const colorMap: Record<string, string> = {
                                      slate: 'border-l-slate-400 bg-slate-50',
                                      blue: 'border-l-blue-400 bg-blue-50',
                                      amber: 'border-l-amber-400 bg-amber-50',
                                      rose: 'border-l-rose-400 bg-rose-50',
                                      emerald: 'border-l-emerald-400 bg-emerald-50',
                                      violet: 'border-l-violet-400 bg-violet-50',
                                    };
                                    const badgeMap: Record<string, string> = {
                                      slate: 'bg-slate-200 text-slate-700',
                                      blue: 'bg-blue-100 text-blue-700',
                                      amber: 'bg-amber-100 text-amber-700',
                                      rose: 'bg-rose-100 text-rose-700',
                                      emerald: 'bg-emerald-100 text-emerald-700',
                                      violet: 'bg-violet-100 text-violet-700',
                                    };
                                    return (
                                      <div key={nt.id} className={`pl-2.5 pr-2.5 py-2 border border-border border-l-2 rounded-sm space-y-1 ${colorMap[noteColor] || colorMap.slate}`}>
                                        <div className="flex items-center justify-between text-[10px]">
                                          <span className={`font-semibold px-1.5 py-0.5 rounded-sm text-[10px] ${badgeMap[noteColor] || badgeMap.slate}`}>{nt.author}</span>
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-text-muted font-mono">
                                              {formatDateTime12(nt.created_at)}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteNote(nt.id)}
                                              title="Delete note"
                                              className="p-0.5 text-text-muted hover:text-rose-600 rounded cursor-pointer"
                                            >
                                              <Trash2 className="w-3 h-3 stroke-[1.5]" />
                                            </button>
                                          </div>
                                        </div>
                                        <p className="text-xs text-text-body whitespace-pre-wrap leading-relaxed font-sans">{nt.note_text}</p>
                                      </div>
                                    );
                                  })
                                )}
                              </div>

                              <form onSubmit={handleAddCustomerNote} className="space-y-2 pt-1">
                                <div className="flex gap-1.5">
                                  <input
                                    type="text"
                                    value={newCustomerNoteAuthor}
                                    onChange={(e) => setNewCustomerNoteAuthor(e.target.value)}
                                    placeholder="Author"
                                    className="w-24 px-2 py-1 text-[11px] bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                                  />
                                  <input
                                    type="text"
                                    value={newCustomerNoteText}
                                    onChange={(e) => setNewCustomerNoteText(e.target.value)}
                                    placeholder="Add a staff note..."
                                    className="flex-1 px-2.5 py-1 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                                  />
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-text-muted">Color:</span>
                                    {(['slate','blue','amber','rose','emerald','violet'] as const).map(c => {
                                      const dotClasses: Record<string, string> = {
                                        slate:'bg-slate-400', blue:'bg-blue-400', amber:'bg-amber-400',
                                        rose:'bg-rose-400', emerald:'bg-emerald-400', violet:'bg-violet-400'
                                      };
                                      return (
                                        <button
                                          type="button"
                                          key={c}
                                          title={`Note color: ${c}`}
                                          onClick={() => setNewCustomerNoteColor(c)}
                                          className={`w-4 h-4 rounded-full ${dotClasses[c]} cursor-pointer transition-transform ${newCustomerNoteColor === c ? 'ring-2 ring-offset-1 ring-text-primary scale-115' : 'opacity-60 hover:opacity-100'}`}
                                        />
                                      );
                                    })}
                                  </div>
                                  <button
                                    type="submit"
                                    disabled={!newCustomerNoteText.trim() || addingCustomerNote}
                                    className="px-3 py-1 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                                  >
                                    {addingCustomerNote ? 'Saving...' : '+ Save Note'}
                                  </button>
                                </div>
                              </form>
                            </div>

                            {/* 4. WhatsApp Chat History & Reply */}
                            <div className="space-y-2 border-t border-border pt-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                                  <MessageSquare className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                                  <span>WhatsApp Chat History</span>
                                </span>
                                <div className="flex items-center gap-2">
                                  {customerChat?.unread_count ? (
                                    <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                                      {customerChat.unread_count} unread
                                    </span>
                                  ) : null}
                                  <button
                                    type="button"
                                    onClick={() => openChatForContact(selectedCustomer.phone)}
                                    className="text-[11px] text-accent hover:underline flex items-center gap-0.5 font-medium cursor-pointer"
                                    title="Open full conversation in Inbox"
                                  >
                                    <span>Open in Inbox</span>
                                    <ArrowUpRight className="w-3 h-3 stroke-[2]" />
                                  </button>
                                </div>
                              </div>

                              <div className="h-44 overflow-y-auto p-2 bg-canvas border border-border rounded-sm space-y-2">
                                {loadingCustomerChat ? (
                                  <p className="text-[11px] text-text-muted text-center py-6">Loading chat history...</p>
                                ) : !customerChat || !customerChat.messages || customerChat.messages.length === 0 ? (
                                  <p className="text-[11px] text-text-muted text-center py-6">No WhatsApp messages yet.</p>
                                ) : (
                                  customerChat.messages.map((msg) => {
                                    const isInbound = msg.direction === 'inbound';
                                    return (
                                      <div key={msg.id} className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}>
                                        <div className={`max-w-[85%] rounded-md px-2.5 py-1.5 text-xs ${isInbound ? 'bg-surface text-text-body border border-border' : 'bg-accent text-white'}`}>
                                          <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                                          <div className={`text-[9px] mt-0.5 flex items-center justify-end gap-1 font-mono ${isInbound ? 'text-text-muted' : 'text-teal-100'}`}>
                                            <span>{formatTime12(msg.created_at)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>

                              <form onSubmit={handleSendCustomerReply} className="flex gap-1.5 pt-1">
                                <input
                                  type="text"
                                  value={customerReplyText}
                                  onChange={(e) => setCustomerReplyText(e.target.value)}
                                  placeholder="Type WhatsApp follow-up reply..."
                                  className="flex-1 px-2.5 py-1.5 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                                />
                                <button
                                  type="submit"
                                  disabled={!customerReplyText.trim() || sendingCustomerReply}
                                  className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  <Send className="w-3.5 h-3.5 stroke-[1.5]" />
                                </button>
                              </form>
                            </div>

                            {/* 5. Bookings & Revenue */}
                            <div className="space-y-2 border-t border-border pt-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                                  <CalendarDays className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                                  <span>Bookings & Revenue</span>
                                </span>
                                {customerBookingsData && (
                                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-sm">
                                    Total: {currentCurrencySymbol}{customerBookingsData.total_revenue ?? 0}
                                  </span>
                                )}
                              </div>

                              {loadingCustomerBookings ? (
                                <p className="text-[11px] text-text-muted text-center py-2">Loading bookings...</p>
                              ) : !customerBookingsData || !Array.isArray(customerBookingsData.bookings) || customerBookingsData.bookings.length === 0 ? (
                                <p className="text-[11px] text-text-muted text-center py-2 bg-surface-subtle/50 rounded-sm border border-border">No appointments booked yet.</p>
                              ) : (
                                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                  {(customerBookingsData?.bookings || []).map((bk) => (
                                    <div key={bk.id} className="p-2 bg-surface-subtle border border-border rounded-sm flex items-center justify-between gap-2 text-xs">
                                      <div className="min-w-0">
                                        <p className="font-medium text-text-primary truncate">{bk.service}</p>
                                        <p className="text-[10px] text-text-muted font-mono mt-0.5">
                                          {formatDateTime12(bk.start_time)}
                                        </p>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <p className="font-mono font-medium text-text-primary">{currentCurrencySymbol}{bk.price || 0}</p>
                                        <span className={`text-[9px] font-semibold px-1 py-0.2 rounded-sm border ${
                                          bk.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                          bk.status === 'no_show' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                          'bg-blue-50 text-blue-800 border-blue-200'
                                        }`}>
                                          {bk.status}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Customer Data Full History Button */}
                            <div className="border-t border-border pt-3 mt-2">
                              <button
                                type="button"
                                onClick={() => setShowCustomerHistoryModal(true)}
                                className="w-full py-1.5 px-3 bg-surface border border-border hover:bg-surface-subtle text-text-primary text-[11px] font-medium rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 mb-2"
                              >
                                <FileText className="w-3 h-3 stroke-[1.5]" />
                                View Full Customer History
                              </button>
                            </div>

                            {/* 6. 2-Step Permanent Deletion */}
                            <div className="border-t border-border pt-3 mt-2">
                              {!confirmDeleteStep ? (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteStep(true)}
                                  className="w-full py-1.5 px-3 bg-surface border border-rose-200 hover:bg-rose-50 text-rose-600 text-[11px] font-medium rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <Trash2 className="w-3 h-3 stroke-[1.5]" />
                                  Delete {currentTaxonomy.client_label || 'Customer'}
                                </button>
                              ) : (
                                <div className="bg-rose-50 border border-rose-200 rounded-sm p-2.5 space-y-2">
                                  <p className="text-[11px] text-rose-800 font-medium flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    Permanently delete <strong>{selectedCustomer.name || 'this customer'}</strong> and all their notes, tasks, and history?
                                  </p>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteStep(false)}
                                      className="flex-1 py-1 px-2 bg-surface border border-border hover:bg-surface-subtle text-text-primary text-[11px] rounded-sm transition-colors cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                                      disabled={deletingCustomerId === selectedCustomer.id}
                                      className="flex-1 py-1 px-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-[11px] font-semibold rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-1"
                                    >
                                      <Trash2 className="w-3 h-3 stroke-[1.5]" />
                                      {deletingCustomerId === selectedCustomer.id ? 'Deleting...' : 'Yes, Delete'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── SUB-VIEW B: COMPLETE CUSTOMER DATABASE ───────────────────── */}
                {followupView === 'database' && (
                  <div className="flex-1 flex flex-col overflow-hidden space-y-3">
                    {/* Database Filters & Quick Search Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 bg-surface border border-border rounded-sm">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                          <input
                            type="text"
                            placeholder="Search name, phone, city, requirement..."
                            value={followupSearch}
                            onChange={(e) => setFollowupSearch(e.target.value)}
                            className="pl-8 pr-3 py-1 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:outline-none focus:border-accent w-64"
                          />
                        </div>

                        <select
                          value={followupStatusFilter}
                          onChange={(e) => setFollowupStatusFilter(e.target.value)}
                          className="px-2.5 py-1 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                        >
                          <option value="all">All Statuses</option>
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="follow-up">Follow-up</option>
                          <option value="converted">Converted</option>
                          <option value="lost">Lost</option>
                        </select>

                        <select
                          value={followupProbabilityFilter}
                          onChange={(e) => setFollowupProbabilityFilter(e.target.value)}
                          className="px-2.5 py-1 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                        >
                          <option value="all">All Leads</option>
                          <option value="hot">Hot</option>
                          <option value="warm">Warm</option>
                          <option value="cold">Cold</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted font-mono">
                          {customers.length} total records
                        </span>
                        <button
                          onClick={exportCustomersToCsv}
                          className="flex items-center gap-1.5 px-3 py-1 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 stroke-[1.5]" />
                          <span>Export to CSV</span>
                        </button>
                      </div>
                    </div>

                    {/* Database Table & Profile Drawer */}
                    <div className="flex-1 flex overflow-hidden gap-3">
                      <div className={`flex-1 overflow-y-auto border border-border rounded-sm bg-surface ${selectedCustomer ? 'hidden md:block min-w-0' : ''}`}>
                        <table className="w-full text-left text-xs min-w-[860px]">
                          <thead className="bg-surface-subtle border-b border-border text-text-secondary font-medium text-[11px] sticky top-0 z-10">
                            <tr>
                              <th className="p-2.5 pl-4">{currentTaxonomy.client_label || 'Customer'}</th>
                              <th className="p-2.5">{currentTaxonomy.phone_label || 'Phone'}</th>
                              <th className="p-2.5">{currentTaxonomy.age_location_label || 'Age & Location'}</th>
                              <th className="p-2.5">{currentTaxonomy.requirement_label || 'Requirement / Concern'}</th>
                              <th className="p-2.5">{currentTaxonomy.staff_label || 'Staff'}</th>
                              <th className="p-2.5">{currentTaxonomy.status_label || 'Status'}</th>
                              <th className="p-2.5">{currentTaxonomy.lead_label || 'Lead'}</th>
                              <th className="p-2.5">{currentTaxonomy.followup_label || 'Follow-up'}</th>
                              <th className="p-2.5">{currentTaxonomy.created_label || 'Added'}</th>
                              <th className="p-2.5 text-right pr-4">{currentTaxonomy.actions_label || 'Action'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {loadingCustomers ? (
                              <tr>
                                <td colSpan={10} className="p-8 text-center text-text-muted">
                                  Loading database records...
                                </td>
                              </tr>
                            ) : customers.length === 0 ? (
                              <tr>
                                <td colSpan={10} className="p-8 text-center text-text-muted">
                                  No customer records found matching your filters.
                                </td>
                              </tr>
                            ) : (
                              customers.map((cust) => {
                                const isSelected = selectedCustomer?.id === cust.id;
                                return (
                                  <tr
                                    key={cust.id}
                                    onClick={() => handleSelectCustomer(cust)}
                                    className={`cursor-pointer transition-colors duration-150 ${
                                      isSelected ? 'bg-blue-50/50 border-l-2 border-l-accent' : 'hover:bg-surface-subtle/70'
                                    }`}
                                  >
                                    <td className="p-2.5 pl-4">
                                      <div className="font-semibold text-text-primary text-[11px]">{cust.name || 'Customer'}</div>
                                    </td>
                                    <td className="p-2.5 font-mono text-[11px] text-text-muted whitespace-nowrap">{cust.phone}</td>
                                    <td className="p-2.5 text-text-secondary text-[11px] whitespace-nowrap">
                                      {cust.age || cust.location ? (
                                        <div className="flex items-center gap-1.5">
                                          {cust.age && <span className="font-medium">{cust.age} yrs</span>}
                                          {cust.age && cust.location && <span>·</span>}
                                          {cust.location && <span className="flex items-center gap-0.5 text-text-muted"><MapPin className="w-2.5 h-2.5" />{cust.location}</span>}
                                        </div>
                                      ) : (
                                        <span className="text-text-muted">—</span>
                                      )}
                                    </td>
                                    <td className="p-2.5 text-text-secondary max-w-[160px] truncate text-[11px]" title={cust.health_concern}>
                                      {cust.health_concern || '—'}
                                    </td>
                                    <td className="p-2.5 text-text-secondary whitespace-nowrap text-[11px]">
                                      {cust.preferred_doctor || '—'}
                                    </td>
                                    <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-medium uppercase border ${
                                        cust.status === 'converted'
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                          : cust.status === 'follow-up'
                                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                                          : cust.status === 'contacted'
                                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                                          : cust.status === 'lost'
                                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                                          : 'bg-slate-100 text-slate-800 border-slate-200'
                                      }`}>
                                        {cust.status}
                                      </span>
                                    </td>
                                    <td className="p-2.5">
                                      <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-medium border uppercase ${
                                        cust.lead_probability === 'hot'
                                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                                          : cust.lead_probability === 'warm'
                                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                                          : 'bg-blue-50 text-blue-800 border-blue-200'
                                      }`}>
                                        {cust.lead_probability}
                                      </span>
                                    </td>
                                    <td className="p-2.5 font-mono text-[10px] text-text-secondary whitespace-nowrap">
                                      {cust.followup_date || '—'}
                                    </td>
                                    <td className="p-2.5 font-mono text-[10px] text-text-muted whitespace-nowrap">
                                      {cust.created_at ? new Date(cust.created_at).toLocaleDateString() : '—'}
                                    </td>
                                    <td className="p-2.5 pr-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex items-center gap-1.5 justify-end">
                                        <button
                                          onClick={() => openChatForContact(cust.phone)}
                                          className="px-2 py-1 bg-surface hover:bg-surface-subtle text-text-primary text-[11px] rounded-sm border border-border transition-colors cursor-pointer flex items-center gap-1"
                                        >
                                          <MessageSquare className="w-3 h-3 stroke-[1.5]" /> Chat
                                        </button>
                                        <button
                                          onClick={() => handleSelectCustomer(cust)}
                                          className="px-2 py-1 bg-accent hover:bg-accent-hover text-white text-[11px] rounded-sm transition-colors cursor-pointer flex items-center gap-1"
                                        >
                                          <User className="w-3 h-3 stroke-[1.5]" /> Details
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Customer Profile Drawer in Database View */}
                      {selectedCustomer && (
                        <div className={`fixed inset-0 z-50 md:relative md:inset-auto md:z-auto w-full ${isDrawerExpanded ? 'md:w-[740px] md:max-w-[55vw]' : 'md:w-[480px] xl:w-[540px]'} bg-surface border border-border md:rounded-sm flex flex-col shrink-0 overflow-hidden transition-all duration-200 shadow-2xl md:shadow-sm`}>
                          <div className="p-3 border-b border-border flex items-center justify-between bg-surface-subtle/50">
                            <div>
                              <h4 className="font-semibold text-xs text-text-primary flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                                <span>{selectedCustomer.name || 'Customer Profile'}</span>
                              </h4>
                              <p className="text-[10px] font-mono text-text-muted mt-0.5">{selectedCustomer.phone}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => openChatForContact(selectedCustomer.phone)}
                                className="px-2 py-1 bg-surface hover:bg-surface-subtle text-text-primary text-[11px] font-medium rounded-sm border border-border flex items-center gap-1 transition-colors cursor-pointer"
                                title="Open WhatsApp chat"
                              >
                                <MessageSquare className="w-3 h-3 text-accent stroke-[1.5]" />
                                <span>Chat</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsDrawerExpanded(!isDrawerExpanded)}
                                className="p-1 text-text-muted hover:text-text-primary rounded-sm hover:bg-surface-subtle transition-colors cursor-pointer"
                                title={isDrawerExpanded ? 'Collapse panel' : 'Expand full width'}
                              >
                                {isDrawerExpanded ? <Minimize2 className="w-3.5 h-3.5 stroke-[1.5]" /> : <Maximize2 className="w-3.5 h-3.5 stroke-[1.5]" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => { setSelectedCustomer(null); setIsDrawerExpanded(false); }}
                                className="p-1 text-text-muted hover:text-text-primary rounded-sm hover:bg-surface-subtle transition-colors cursor-pointer"
                                title="Close profile"
                              >
                                <X className="w-3.5 h-3.5 stroke-[1.5]" />
                              </button>
                            </div>
                          </div>

                          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
                            <div className="space-y-2 p-3 bg-surface-subtle border border-border rounded-sm">
                              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">Customer Details</p>
                              <div>
                                <label className="text-[10px] text-text-muted block mb-1">{currentTaxonomy.requirement_label || 'Requirement / Concern'}</label>
                                <textarea
                                  value={drawerConcern}
                                  onChange={(e) => setDrawerConcern(e.target.value)}
                                  rows={2}
                                  placeholder={`Enter ${(currentTaxonomy.requirement_label || 'requirement').toLowerCase()}...`}
                                  className="w-full px-2.5 py-1.5 text-[11px] bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent resize-none"
                                />
                                {((settingsForm.taxonomy?.requirement_presets && settingsForm.taxonomy.requirement_presets.length > 0)
                                  ? settingsForm.taxonomy.requirement_presets
                                  : (PREBUILT_REQUIREMENTS_BY_INDUSTRY[settingsForm.industry || 'clinic'] || PREBUILT_REQUIREMENTS_BY_INDUSTRY.clinic)
                                ) && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {((settingsForm.taxonomy?.requirement_presets && settingsForm.taxonomy.requirement_presets.length > 0)
                                      ? settingsForm.taxonomy.requirement_presets
                                      : (PREBUILT_REQUIREMENTS_BY_INDUSTRY[settingsForm.industry || 'clinic'] || PREBUILT_REQUIREMENTS_BY_INDUSTRY.clinic)
                                    ).map((chip) => (
                                      <button
                                        key={chip}
                                        type="button"
                                        onClick={() => setDrawerConcern(chip)}
                                        className={`px-2 py-0.5 rounded-sm text-[10px] border cursor-pointer transition-colors ${
                                          drawerConcern === chip ? 'bg-accent text-white border-accent' : 'bg-surface text-text-secondary border-border hover:border-accent hover:text-accent'
                                        }`}
                                      >
                                        {chip}
                                      </button>
                                    ))}
                                                                        <button
                                        type="button"
                                        onClick={openPresetEditor}
                                        title="Edit presets (add or remove)"
                                        className="px-1.5 py-0.5 rounded-sm text-[10px] border border-dashed border-border hover:border-accent text-text-muted hover:text-accent flex items-center gap-1 transition-colors cursor-pointer bg-surface font-medium"
                                      >
                                        <Pencil className="w-2.5 h-2.5 stroke-[1.8]" />
                                        <span>Edit</span>
                                      </button>
                                    </div>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <div>
                                  <label className="text-[10px] text-text-muted block mb-1">Age</label>
                                  <input
                                    type="number" min="1" max="120"
                                    value={drawerAge}
                                    onChange={(e) => setDrawerAge(e.target.value)}
                                    placeholder="e.g. 35"
                                    className="w-full px-2 py-1 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-text-muted block mb-1">Location</label>
                                  <input
                                    type="text"
                                    value={drawerLocation}
                                    onChange={(e) => setDrawerLocation(e.target.value)}
                                    placeholder="e.g. Mumbai"
                                    className="w-full px-2 py-1 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                                  />
                                </div>
                              </div>
                              <div className="pt-1">
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-[10px] text-text-muted">{currentTaxonomy.staff_label || 'Assigned Staff / Doctor'}</label>
                                  <button
                                    type="button"
                                    onClick={openDoctorEditor}
                                    className="text-[10px] text-accent hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                                  >
                                    <Pencil className="w-2.5 h-2.5 stroke-[1.8]" />
                                    <span>Manage {currentTaxonomy.staff_label ? currentTaxonomy.staff_label.split('/')[0].trim() + 's' : 'Staff'}</span>
                                  </button>
                                </div>
                                <div className="space-y-1">
                                  <select
                                    value={drawerDoctor}
                                    onChange={(e) => setDrawerDoctor(e.target.value)}
                                    className="w-full px-2 py-1 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent cursor-pointer"
                                  >
                                    <option value="">— Unassigned —</option>
                                    {availableDoctors.map((doc) => (
                                      <option key={doc} value={doc}>{doc}</option>
                                    ))}
                                  </select>
                                  {drawerDoctor && !availableDoctors.includes(drawerDoctor) && (
                                    <input
                                      type="text"
                                      value={drawerDoctor}
                                      onChange={(e) => setDrawerDoctor(e.target.value)}
                                      placeholder="Custom staff name..."
                                      className="w-full px-2 py-1 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                                    />
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={handleSaveDrawerAttributes}
                                disabled={savingDrawerAttributes}
                                className="w-full py-1.5 px-3 bg-accent hover:bg-accent-hover disabled:opacity-60 text-white text-[11px] font-medium rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                              >
                                <Save className="w-3 h-3 stroke-[1.5]" />
                                {savingDrawerAttributes ? 'Saving...' : 'Save Attributes'}
                              </button>
                            </div>

                            <div className="p-3 bg-surface-subtle border border-border rounded-sm space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                                  <CalendarClock className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                                  <span>Schedule Follow-up</span>
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {selectedCustomer.google_task_id && (
                                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-sm font-medium">
                                      Tasks Synced
                                    </span>
                                  )}
                                  {selectedCustomer.google_calendar_event_id && (
                                    <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-sm font-medium">
                                      Calendar Synced
                                    </span>
                                  )}
                                  {selectedCustomer.followup_date && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCustomerFollowup(selectedCustomer.id)}
                                      className="px-2 py-0.5 text-[10px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-sm font-medium transition-colors cursor-pointer flex items-center gap-1"
                                      title="Delete scheduled follow-up"
                                    >
                                      <Trash2 className="w-2.5 h-2.5 stroke-[1.5]" />
                                      <span>Delete Follow-up</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] text-text-muted block mb-1">Follow-up Date</label>
                                  <input
                                    type="date"
                                    value={selectedCustomer.followup_date || ''}
                                    onChange={(e) => handleUpdateCustomer(selectedCustomer.id, { followup_date: e.target.value })}
                                    className="w-full px-2 py-1 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-text-muted block mb-1">Follow-up Time</label>
                                  <input
                                    type="text"
                                    value={selectedCustomer.followup_time || '10:00 AM'}
                                    onChange={(e) => handleUpdateCustomer(selectedCustomer.id, { followup_time: e.target.value })}
                                    placeholder="e.g. 10:30 AM"
                                    className="w-full px-2 py-1 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                disabled={syncingGoogleTasks}
                                onClick={() => handleSyncCustomerToGoogleTasks(selectedCustomer.id)}
                                className="w-full py-1.5 px-2.5 bg-surface hover:bg-surface-subtle text-text-primary text-xs font-medium border border-border rounded-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <CalendarCheck className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                                <span>{syncingGoogleTasks ? 'Syncing...' : 'Sync with Google Tasks'}</span>
                              </button>
                            </div>

                            {/* WhatsApp Chat History & Reply */}
                            <div className="space-y-2 border-t border-border pt-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                                  <MessageSquare className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                                  <span>WhatsApp Chat History</span>
                                </span>
                                <div className="flex items-center gap-2">
                                  {customerChat?.unread_count ? (
                                    <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                                      {customerChat.unread_count} unread
                                    </span>
                                  ) : null}
                                  <button
                                    type="button"
                                    onClick={() => openChatForContact(selectedCustomer.phone)}
                                    className="text-[11px] text-accent hover:underline flex items-center gap-0.5 font-medium cursor-pointer"
                                    title="Open full conversation in Inbox"
                                  >
                                    <span>Open in Inbox</span>
                                    <ArrowUpRight className="w-3 h-3 stroke-[2]" />
                                  </button>
                                </div>
                              </div>

                              <div className="h-44 overflow-y-auto p-2 bg-canvas border border-border rounded-sm space-y-2">
                                {loadingCustomerChat ? (
                                  <p className="text-[11px] text-text-muted text-center py-6">Loading chat history...</p>
                                ) : !customerChat || !customerChat.messages || customerChat.messages.length === 0 ? (
                                  <p className="text-[11px] text-text-muted text-center py-6">No WhatsApp messages yet.</p>
                                ) : (
                                  customerChat.messages.map((msg) => {
                                    const isInbound = msg.direction === 'inbound';
                                    return (
                                      <div key={msg.id} className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}>
                                        <div className={`max-w-[85%] rounded-md px-2.5 py-1.5 text-xs ${isInbound ? 'bg-surface text-text-body border border-border' : 'bg-accent text-white'}`}>
                                          <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                                          <div className={`text-[9px] mt-0.5 flex items-center justify-end gap-1 font-mono ${isInbound ? 'text-text-muted' : 'text-teal-100'}`}>
                                            <span>{formatTime12(msg.created_at)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>

                              <form onSubmit={handleSendCustomerReply} className="flex gap-1.5 pt-1">
                                <input
                                  type="text"
                                  value={customerReplyText}
                                  onChange={(e) => setCustomerReplyText(e.target.value)}
                                  placeholder="Type WhatsApp follow-up reply..."
                                  className="flex-1 px-2.5 py-1.5 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                                />
                                <button
                                  type="submit"
                                  disabled={!customerReplyText.trim() || sendingCustomerReply}
                                  className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  <Send className="w-3.5 h-3.5 stroke-[1.5]" />
                                </button>
                              </form>
                            </div>

                            {/* Customer Data Full History Button */}
                            <div className="border-t border-border pt-3 mt-2">
                              <button
                                type="button"
                                onClick={() => setShowCustomerHistoryModal(true)}
                                className="w-full py-1.5 px-3 bg-surface border border-border hover:bg-surface-subtle text-text-primary text-[11px] font-medium rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 mb-2"
                              >
                                <FileText className="w-3 h-3 stroke-[1.5]" />
                                View Full Customer History
                              </button>
                            </div>

                            <div className="border-t border-border pt-3 mt-2">
                              {!confirmDeleteStep ? (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteStep(true)}
                                  className="w-full py-1.5 px-3 bg-surface border border-rose-200 hover:bg-rose-50 text-rose-600 text-[11px] font-medium rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <Trash2 className="w-3 h-3 stroke-[1.5]" />
                                  Delete {currentTaxonomy.client_label || 'Customer'}
                                </button>
                              ) : (
                                <div className="bg-rose-50 border border-rose-200 rounded-sm p-2.5 space-y-2">
                                  <p className="text-[11px] text-rose-800 font-medium">
                                    Delete <strong>{selectedCustomer.name || 'this customer'}</strong> permanently?
                                  </p>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteStep(false)}
                                      className="flex-1 py-1 px-2 bg-surface border border-border text-text-primary text-[11px] rounded-sm"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                                      disabled={deletingCustomerId === selectedCustomer.id}
                                      className="flex-1 py-1 px-2 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold rounded-sm"
                                    >
                                      {deletingCustomerId === selectedCustomer.id ? 'Deleting...' : 'Yes, Delete'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── SUB-VIEW C: TASK CALENDAR VIEW ─────────────────────────── */}
                {followupView === 'tasks' && (
                  <div className="flex-1 flex flex-col overflow-y-auto space-y-4 max-w-5xl">
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-surface border border-border rounded-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-medium text-text-muted mr-1">Filter:</span>
                        {[
                          { key: 'all', label: 'All Tasks' },
                          { key: 'today', label: 'Due Today' },
                          { key: 'upcoming', label: 'Upcoming' },
                          { key: 'overdue', label: 'Overdue' },
                          { key: 'completed', label: 'Completed' },
                        ].map((tf) => (
                          <button
                            key={tf.key}
                            onClick={() => setTaskFilter(tf.key as any)}
                            className={`px-2.5 py-1 text-xs rounded-sm border transition-colors cursor-pointer ${
                              taskFilter === tf.key
                                ? 'bg-surface-subtle border-text-primary font-semibold text-text-primary'
                                : 'bg-surface border-border text-text-secondary hover:text-text-primary'
                            }`}
                          >
                            {tf.label}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setShowAddTaskModal(true)}
                        className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[1.5]" />
                        <span>Add Task</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {loadingTasks ? (
                        <p className="text-xs text-text-muted text-center py-8">Loading tasks...</p>
                      ) : filteredTasks.length === 0 ? (
                        <div className="p-8 text-center bg-surface border border-border rounded-sm space-y-1">
                          <CheckSquare className="w-8 h-8 text-text-muted mx-auto stroke-[1]" />
                          <p className="text-xs text-text-secondary font-medium">No tasks found</p>
                          <p className="text-[11px] text-text-muted">You have no tasks matching this filter.</p>
                        </div>
                      ) : (
                        filteredTasks.map((task) => {
                          const isTaskOverdue = task.due_date && new Date(task.due_date) < new Date(new Date().setHours(0, 0, 0, 0)) && !task.completed;
                          const isTaskToday = task.due_date && new Date(task.due_date).toDateString() === new Date().toDateString();

                          return (
                            <div
                              key={task.id}
                              className={`p-3.5 bg-surface border rounded-sm flex items-start gap-3 transition-colors ${
                                task.completed
                                  ? 'border-border opacity-60'
                                  : isTaskOverdue
                                  ? 'border-rose-300 bg-rose-50/20'
                                  : 'border-border hover:border-border-strong'
                              }`}
                            >
                              <button
                                onClick={() => handleToggleTask(task.id)}
                                className="mt-0.5 text-text-muted hover:text-accent cursor-pointer transition-colors"
                              >
                                {task.completed ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-600 stroke-[2]" />
                                ) : (
                                  <Square className="w-4 h-4 stroke-[1.5]" />
                                )}
                              </button>

                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className={`text-xs font-semibold ${task.completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                                    {task.title}
                                  </p>
                                  {task.google_task_id && (
                                    <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded-xs font-medium">
                                      Google Tasks
                                    </span>
                                  )}
                                </div>

                                {(task.description || (task as any).notes) && (
                                  <p className="text-[11px] text-text-secondary whitespace-pre-wrap">{task.description || (task as any).notes}</p>
                                )}

                                <div className="flex items-center gap-3 text-[10px] text-text-muted flex-wrap pt-0.5">
                                  {task.due_date && (
                                    <span className={`flex items-center gap-1 font-mono ${
                                      isTaskOverdue ? 'text-rose-600 font-semibold' : isTaskToday ? 'text-amber-600 font-semibold' : ''
                                    }`}>
                                      <Clock className="w-3 h-3 stroke-[1.5]" />
                                      <span>Due: {task.due_date}</span>
                                    </span>
                                  )}
                                  {task.customer_name && (
                                    <span className="flex items-center gap-1">
                                      <User className="w-3 h-3 stroke-[1.5]" />
                                      <span>{task.customer_name}</span>
                                      {task.customer_phone && <span className="font-mono text-text-muted">({task.customer_phone})</span>}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-text-muted hover:text-rose-600 p-1 rounded-sm cursor-pointer transition-colors"
                                title="Delete task"
                              >
                                <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* ── SUB-VIEW D: OVERALL NOTES VIEW ──────────────────────────── */}
                {followupView === 'notes' && (
                  <div className="flex-1 flex flex-col overflow-y-auto space-y-4 max-w-5xl">
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-surface border border-border rounded-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-text-muted">Color:</span>
                        <div className="flex items-center gap-1">
                          {['all', 'slate', 'blue', 'amber', 'rose', 'emerald', 'violet'].map((c) => (
                            <button
                              key={c}
                              onClick={() => setAllNotesColorFilter(c)}
                              className={`px-2 py-0.5 text-xs rounded-sm border capitalize transition-colors cursor-pointer ${
                                allNotesColorFilter === c
                                  ? 'bg-surface-subtle border-text-primary font-semibold text-text-primary'
                                  : 'bg-surface border-border text-text-secondary hover:text-text-primary'
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                          <input
                            type="text"
                            placeholder="Search all notes..."
                            value={allNotesSearch}
                            onChange={(e) => setAllNotesSearch(e.target.value)}
                            className="pl-8 pr-3 py-1 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:outline-none focus:border-accent w-48"
                          />
                        </div>
                        <button
                          onClick={() => setShowAddOverallNoteModal(true)}
                          className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[1.5]" />
                          <span>Add Note</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {loadingAllNotes ? (
                        <p className="text-xs text-text-muted col-span-full text-center py-8">Loading notes...</p>
                      ) : filteredAllNotes.length === 0 ? (
                        <div className="col-span-full p-8 text-center bg-surface border border-border rounded-sm space-y-1">
                          <StickyNote className="w-8 h-8 text-text-muted mx-auto stroke-[1]" />
                          <p className="text-xs text-text-secondary font-medium">No notes found</p>
                          <p className="text-[11px] text-text-muted">No customer notes match the current search / color filter.</p>
                        </div>
                      ) : (
                        filteredAllNotes.map((nt) => {
                          const noteColor = nt.color || 'slate';
                          const colorMap: Record<string, string> = {
                            slate: 'border-l-slate-400 bg-slate-50',
                            blue: 'border-l-blue-400 bg-blue-50',
                            amber: 'border-l-amber-400 bg-amber-50',
                            rose: 'border-l-rose-400 bg-rose-50',
                            emerald: 'border-l-emerald-400 bg-emerald-50',
                            violet: 'border-l-violet-400 bg-violet-50',
                          };
                          const badgeMap: Record<string, string> = {
                            slate: 'bg-slate-200 text-slate-700',
                            blue: 'bg-blue-100 text-blue-700',
                            amber: 'bg-amber-100 text-amber-700',
                            rose: 'bg-rose-100 text-rose-700',
                            emerald: 'bg-emerald-100 text-emerald-700',
                            violet: 'bg-violet-100 text-violet-700',
                          };

                          return (
                            <div
                              key={nt.id}
                              className={`p-3.5 border border-border border-l-4 rounded-sm space-y-2 flex flex-col justify-between ${
                                colorMap[noteColor] || colorMap.slate
                              }`}
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className={`font-semibold px-1.5 py-0.5 rounded-sm text-[10px] ${badgeMap[noteColor] || badgeMap.slate}`}>
                                    {nt.author}
                                  </span>
                                  <span className="text-[10px] text-text-muted font-mono">
                                    {nt.created_at ? new Date(nt.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                                  </span>
                                </div>
                                <p className="text-xs text-text-body whitespace-pre-wrap leading-relaxed">{nt.note_text}</p>
                              </div>

                              <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
                                {nt.customer_name ? (
                                  <span className="font-medium text-text-primary flex items-center gap-1">
                                    <User className="w-3 h-3 text-accent stroke-[1.5]" />
                                    <span className="truncate max-w-[140px]">{nt.customer_name}</span>
                                  </span>
                                ) : (
                                  <span className="text-text-muted">General</span>
                                )}
                                <button
                                  onClick={() => handleDeleteNote(nt.id)}
                                  className="text-text-muted hover:text-rose-600 p-0.5 rounded cursor-pointer"
                                  title="Delete note"
                                >
                                  <Trash2 className="w-3 h-3 stroke-[1.5]" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
{/* ── ADD CUSTOMER MODAL ─────────────────────────────────────── */}
            {showAddCustomerModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAddCustomerModal(false)}>
                <div className="bg-surface border border-border rounded-sm shadow-xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-text-primary flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-accent stroke-[1.5]" />
                      Add {currentTaxonomy.client_label || 'Customer'}
                    </h3>
                    <button onClick={() => setShowAddCustomerModal(false)} className="p-1 text-text-muted hover:text-text-primary rounded-sm cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <form onSubmit={handleCreateCustomer} className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-text-muted mb-1">Name</label>
                        <input
                          type="text"
                          value={addCustomerForm.name}
                          onChange={(e) => setAddCustomerForm(p => ({...p, name: e.target.value}))}
                          placeholder="Full name"
                          className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-text-muted mb-1">Phone <span className="text-rose-500">*</span></label>
                        <input
                          type="tel"
                          value={addCustomerForm.phone}
                          onChange={(e) => setAddCustomerForm(p => ({...p, phone: e.target.value}))}
                          placeholder="e.g. 919876543210"
                          required
                          className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-text-muted mb-1">Age</label>
                        <input
                          type="number" min="1" max="120"
                          value={addCustomerForm.age}
                          onChange={(e) => setAddCustomerForm(p => ({...p, age: e.target.value}))}
                          placeholder="e.g. 35"
                          className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-text-muted mb-1">Location</label>
                        <input
                          type="text"
                          value={addCustomerForm.location}
                          onChange={(e) => setAddCustomerForm(p => ({...p, location: e.target.value}))}
                          placeholder="City / Area"
                          className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-text-muted mb-1">{currentTaxonomy.requirement_label || 'Requirement'}</label>
                      <input
                        type="text"
                        value={addCustomerForm.health_concern}
                        onChange={(e) => setAddCustomerForm(p => ({...p, health_concern: e.target.value}))}
                        placeholder={`Enter ${(currentTaxonomy.requirement_label || 'requirement').toLowerCase()}...`}
                        className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                      />
                      {((settingsForm.taxonomy?.requirement_presets && settingsForm.taxonomy.requirement_presets.length > 0)
                        ? settingsForm.taxonomy.requirement_presets
                        : (PREBUILT_REQUIREMENTS_BY_INDUSTRY[settingsForm.industry || 'clinic'] || PREBUILT_REQUIREMENTS_BY_INDUSTRY.clinic)
                      ) && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {((settingsForm.taxonomy?.requirement_presets && settingsForm.taxonomy.requirement_presets.length > 0)
                            ? settingsForm.taxonomy.requirement_presets
                            : (PREBUILT_REQUIREMENTS_BY_INDUSTRY[settingsForm.industry || 'clinic'] || PREBUILT_REQUIREMENTS_BY_INDUSTRY.clinic)
                          ).map((chip) => (
                            <button key={chip} type="button" onClick={() => setAddCustomerForm(p => ({...p, health_concern: chip}))}
                              className={`px-2 py-0.5 rounded-sm text-[10px] border cursor-pointer transition-colors ${addCustomerForm.health_concern === chip ? 'bg-accent text-white border-accent' : 'bg-surface text-text-secondary border-border hover:border-accent hover:text-accent'}`}>
                              {chip}
                            </button>
                          ))}
                                                  <button
                            type="button"
                            onClick={openPresetEditor}
                            title="Edit presets (add or remove)"
                            className="px-1.5 py-0.5 rounded-sm text-[10px] border border-dashed border-border hover:border-accent text-text-muted hover:text-accent flex items-center gap-1 transition-colors cursor-pointer bg-surface font-medium"
                          >
                            <Pencil className="w-2.5 h-2.5 stroke-[1.8]" />
                            <span>Edit</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] text-text-muted">{currentTaxonomy.staff_label || 'Preferred Staff'}</label>
                          <button
                            type="button"
                            onClick={openDoctorEditor}
                            className="text-[10px] text-accent hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <Pencil className="w-2.5 h-2.5 stroke-[1.8]" />
                            <span>Manage</span>
                          </button>
                        </div>
                        <select
                          value={addCustomerForm.preferred_doctor}
                          onChange={(e) => setAddCustomerForm(p => ({...p, preferred_doctor: e.target.value}))}
                          className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                        >
                          <option value="">— Select {currentTaxonomy.staff_label || 'Staff'} —</option>
                          {availableDoctors.map((doc) => (
                            <option key={doc} value={doc}>{doc}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-text-muted mb-1">Lead</label>
                        <select
                          value={addCustomerForm.lead_probability}
                          onChange={(e) => setAddCustomerForm(p => ({...p, lead_probability: e.target.value as 'hot'|'warm'|'cold'}))}
                          className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                        >
                          <option value="hot">Hot</option>
                          <option value="warm">Warm</option>
                          <option value="cold">Cold</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-text-muted mb-1">Follow-up Date</label>
                        <input
                          type="date"
                          value={addCustomerForm.followup_date}
                          onChange={(e) => setAddCustomerForm(p => ({...p, followup_date: e.target.value}))}
                          className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-text-muted mb-1">Follow-up Time</label>
                        <input
                          type="text"
                          value={addCustomerForm.followup_time}
                          onChange={(e) => setAddCustomerForm(p => ({...p, followup_time: e.target.value}))}
                          placeholder="10:00 AM"
                          className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-text-muted mb-1">Initial Note</label>
                      <textarea
                        value={addCustomerForm.initial_note}
                        onChange={(e) => setAddCustomerForm(p => ({...p, initial_note: e.target.value}))}
                        rows={2}
                        placeholder="Optional note about this customer..."
                        className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent resize-none"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={() => setShowAddCustomerModal(false)}
                        className="flex-1 py-1.5 px-3 bg-surface border border-border hover:bg-surface-subtle text-text-primary text-xs font-medium rounded-sm transition-colors cursor-pointer">
                        Cancel
                      </button>
                      <button type="submit" disabled={addingCustomer}
                        className="flex-1 py-1.5 px-3 bg-accent hover:bg-accent-hover disabled:opacity-60 text-white text-xs font-semibold rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5">
                        <UserPlus className="w-3.5 h-3.5 stroke-[1.5]" />
                        {addingCustomer ? 'Adding...' : `Add ${currentTaxonomy.client_label || 'Customer'}`}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

{/* ── VIEW 6: MARKETING HUB ─────────────────────────────────────── */}
            {activeNav === 'marketing' && (
              <div className="flex-1 flex flex-col overflow-y-auto space-y-4 max-w-6xl pb-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <h3 className="font-semibold text-base text-text-primary flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-accent stroke-[1.5]" />
                      <span>Marketing Hub</span>
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      Broadcasts, automated re-engagement triggers, and campaign analytics — all in one place.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-status-success-bg text-status-success border border-status-success-border text-xs font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Meta Cloud API Anti-Ban Active
                  </span>
                </div>

                {/* Sub-Tab Switcher */}
                <div className="flex items-center gap-1 bg-surface-subtle border border-border rounded-sm p-0.5 w-fit">
                  {([
                    { key: 'broadcasts', Icon: Megaphone, label: 'Broadcasts' },
                    { key: 'templates', Icon: FileText, label: 'WhatsApp Templates (Utility)' },
                    { key: 'reengagement', Icon: RotateCcw, label: 'Re-engagement' },
                    { key: 'analytics', Icon: BarChart2, label: 'Analytics' },
                  ] as const).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setMarketingSubTab(tab.key)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer flex items-center gap-1.5 ${
                        marketingSubTab === tab.key
                          ? 'bg-surface text-text-primary border border-border-strong shadow-subtle font-semibold'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <tab.Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Success Notice */}
                {broadcastSuccessNotice && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-sm font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{broadcastSuccessNotice}</span>
                    </div>
                    <button onClick={() => setBroadcastSuccessNotice(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                    SUB-TAB 1: BROADCASTS
                â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                {marketingSubTab === 'broadcasts' && (
                  <div className="space-y-4">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-surface border border-border rounded-md space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-text-secondary">Targetable audience</span>
                          <Users className="w-4 h-4 text-text-muted" />
                        </div>
                        <p className="text-2xl font-semibold text-text-primary font-headline">
                          {contacts.length > 0 ? contacts.length : conversations.length}
                        </p>
                        <p className="text-[11px] text-text-muted">
                          {contacts.filter((c) => c.opt_in !== false).length} opted-in · {contacts.filter((c) => c.opt_in === false).length} opted-out
                        </p>
                      </div>
                      <div className="p-4 bg-surface border border-border rounded-md space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-text-secondary">Campaigns launched</span>
                          <Megaphone className="w-4 h-4 text-text-muted" />
                        </div>
                        <p className="text-2xl font-semibold text-text-primary font-headline">
                          {campaigns.filter((c) => c.status === 'completed').length}
                        </p>
                        <p className="text-[11px] text-text-muted">
                          {campaigns.filter((c) => c.status === 'scheduled').length} scheduled · {campaigns.length} total
                        </p>
                      </div>
                      <div className="p-4 bg-surface border border-border rounded-md space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-text-secondary">Messages delivered</span>
                          <CheckCheck className="w-4 h-4 text-text-muted" />
                        </div>
                        <p className="text-2xl font-semibold text-text-primary font-headline">
                          {campaigns.reduce((acc, c) => acc + (c.delivered_count || c.sent_count || 0), 0)}
                        </p>
                        <p className="text-[11px] text-text-muted">Via Meta Cloud API (98%+ delivery)</p>
                      </div>
                    </div>

                    {/* Main 2-Column Workspace */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left: Composer */}
                      <div className="lg:col-span-7 bg-surface border border-border rounded-md p-5 space-y-4">
                        <div className="border-b border-border pb-3">
                          <h4 className="font-semibold text-sm text-text-primary flex items-center gap-2">
                            <Plus className="w-4 h-4 text-text-secondary" />
                            <span>Create new broadcast campaign</span>
                          </h4>
                          <p className="text-xs text-text-muted mt-0.5">Configure audience, message, and send now or schedule for later.</p>
                        </div>

                        <form onSubmit={handleLaunchBroadcast} className="space-y-4 text-xs">
                          {/* Campaign Name */}
                          <div className="space-y-1">
                            <label className="font-medium text-text-primary">Campaign name *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Weekend Flash Sale 20% Off"
                              value={campaignForm.campaign_name}
                              onChange={(e) => setCampaignForm({ ...campaignForm, campaign_name: e.target.value })}
                              className="w-full px-3 py-2 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary placeholder:text-text-muted focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                          </div>

                          {/* 3-Way Audience */}
                          <div className="space-y-3 pt-1 border-t border-border">
                            <div>
                              <label className="font-medium text-text-primary">Target Audience</label>
                              <p className="text-[11px] text-text-muted mt-0.5">Choose CRM contacts, CSV leads, or both.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {(['contacts_only', 'sheet_only', 'both'] as const).map((opt) => (
                                <label
                                  key={opt}
                                  onClick={() => setCampaignForm({ ...campaignForm, target_audience: opt })}
                                  className={`p-3 rounded-sm border cursor-pointer flex flex-col justify-between transition-colors duration-150 ${
                                    campaignForm.target_audience === opt
                                      ? 'bg-surface border-border-strong ring-1 ring-border-strong'
                                      : 'bg-surface-subtle border-border hover:bg-surface'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-accent" />
                                    <span className="font-semibold text-text-primary">
                                      {opt === 'contacts_only' ? '1. CRM Contacts' : opt === 'sheet_only' ? '2. CSV Sheet' : '3. Both'}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-text-muted mt-1.5">
                                    {opt === 'contacts_only'
                                      ? `${selectedContactIds.length} of ${contacts.length} selected`
                                      : opt === 'sheet_only'
                                      ? `${sheetLeads.length} leads loaded`
                                      : `${selectedContactIds.length + sheetLeads.length} combined`}
                                  </span>
                                </label>
                              ))}
                            </div>

                            {/* CRM Contact Picker with Opt-In Badges */}
                            {(campaignForm.target_audience === 'contacts_only' || campaignForm.target_audience === 'both') && (
                              <div className="p-3 bg-surface-subtle/50 rounded-sm border border-border space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-accent" />
                                    <span className="text-xs font-semibold text-text-primary">CRM Contacts</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedContactIds(contacts.filter((c) => c.opt_in !== false).map((c) => c.id))}
                                      className="text-[11px] text-accent hover:underline cursor-pointer font-medium"
                                    >
                                      Select opted-in
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedContactIds(contacts.map((c) => c.id))}
                                      className="text-[11px] text-accent hover:underline cursor-pointer font-medium"
                                    >
                                      All
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedContactIds([])}
                                      className="text-[11px] text-text-muted hover:underline cursor-pointer"
                                    >
                                      Clear
                                    </button>
                                  </div>
                                </div>
                                <div className="relative">
                                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                                  <input
                                    type="text"
                                    placeholder="Filter contacts by name or phone..."
                                    value={contactSearchQuery}
                                    onChange={(e) => setContactSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1 bg-surface border border-border rounded-sm text-xs text-text-primary placeholder:text-text-muted"
                                  />
                                </div>
                                <div className="max-h-48 overflow-y-auto divide-y divide-border border border-border rounded-sm bg-surface">
                                  {(contacts.length > 0 ? contacts : conversations.map((c) => ({ id: c.id, name: c.contact_name, phone: c.contact_phone || c.phone, wa_profile_name: '', opt_in: true } as Contact)))
                                    .filter((ct) => {
                                      const q = contactSearchQuery.toLowerCase();
                                      return (ct.name || '').toLowerCase().includes(q) || (ct.phone || '').toLowerCase().includes(q);
                                    })
                                    .map((ct) => {
                                      const isSelected = selectedContactIds.includes(ct.id);
                                      const hasOptIn = ct.opt_in !== false;
                                      return (
                                        <div
                                          key={ct.id}
                                          onClick={() => setSelectedContactIds((prev) => prev.includes(ct.id) ? prev.filter((id) => id !== ct.id) : [...prev, ct.id])}
                                          className="p-2 flex items-center justify-between hover:bg-surface-subtle cursor-pointer transition-colors duration-150 text-xs"
                                        >
                                          <div className="flex items-center gap-2 min-w-0">
                                            <input type="checkbox" checked={isSelected} onChange={() => {}} className="rounded-sm text-accent cursor-pointer" />
                                            <div className="min-w-0">
                                              <p className="font-medium text-text-primary truncate">{ct.name || 'Unnamed'}</p>
                                              <p className="text-[11px] font-mono text-text-muted">{ct.phone}</p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            {/* Opt-In Consent Badge */}
                                            {hasOptIn ? (
                                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                <CheckCircle2 className="w-2.5 h-2.5" />
                                                Opted in
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700 border border-red-200">
                                                <XCircle className="w-2.5 h-2.5" />
                                                Opted out
                                              </span>
                                            )}
                                            {importantConvIds.includes(ct.id) && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                                          </div>
                                        </div>
                                      );
                                    })}
                                </div>
                                <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-sm px-2 py-1 flex items-center gap-1">
                                  WhatsApp marketing messages require explicit opt-in. Only opted-in contacts will receive campaigns.
                                </p>
                              </div>
                            )}

                            {/* Sheet / CSV Importer */}
                            {(campaignForm.target_audience === 'sheet_only' || campaignForm.target_audience === 'both') && (
                              <div className="p-3 bg-surface-subtle/50 rounded-sm border border-border space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                    <span className="text-xs font-semibold text-text-primary">Google Sheet / CSV Lead Importer</span>
                                  </div>
                                  <div className="flex items-center gap-1 bg-surface p-0.5 rounded-sm border border-border">
                                    {(['paste', 'upload'] as const).map((mode) => (
                                      <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setSheetInputMode(mode)}
                                        className={`px-2 py-0.5 text-[11px] font-medium rounded-sm cursor-pointer ${sheetInputMode === mode ? 'bg-surface-subtle text-text-primary font-semibold' : 'text-text-secondary'}`}
                                      >
                                        {mode === 'paste' ? 'Paste Rows' : 'Upload .CSV'}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                {sheetInputMode === 'paste' ? (
                                  <div className="space-y-2">
                                    <textarea
                                      rows={3}
                                      placeholder="Copy & paste rows from Google Sheet or Excel (e.g. John Doe, +919876543210)"
                                      value={sheetRawInput}
                                      onChange={(e) => setSheetRawInput(e.target.value)}
                                      className="w-full p-2 bg-surface border border-border rounded-sm font-mono text-xs text-text-primary placeholder:text-text-muted"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleParseCsv(sheetRawInput)}
                                      className="px-3 py-1.5 bg-surface hover:bg-surface-subtle text-text-primary font-medium text-xs rounded-sm border border-border cursor-pointer transition-colors duration-150"
                                    >
                                      + Parse & Add Leads
                                    </button>
                                  </div>
                                ) : (
                                  <div className="border-2 border-dashed border-border rounded-sm p-4 text-center bg-surface hover:bg-surface-subtle transition-colors duration-150 cursor-pointer relative">
                                    <input type="file" accept=".csv,.txt,.tsv" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                                    <p className="text-xs font-medium text-text-primary">Click or drop a .csv file here</p>
                                    <p className="text-[11px] text-text-muted mt-0.5">Supports CSV / Google Sheet exports with Phone and Name columns</p>
                                  </div>
                                )}
                                {sheetParsingError && <p className="text-[11px] text-status-error">{sheetParsingError}</p>}
                                {sheetLeads.length > 0 && (
                                  <div className="space-y-1.5 pt-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-semibold text-text-primary">Loaded Leads ({sheetLeads.length})</span>
                                      <button type="button" onClick={() => setSheetLeads([])} className="text-[11px] text-status-error hover:underline cursor-pointer">Clear all</button>
                                    </div>
                                    <div className="max-h-36 overflow-y-auto divide-y divide-border border border-border rounded-sm bg-surface">
                                      {sheetLeads.map((ld, idx) => (
                                        <div key={idx} className="p-1.5 px-2.5 flex items-center justify-between text-xs">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium text-text-primary">{ld.name}</span>
                                            <span className="font-mono text-text-muted text-[11px]">{ld.phone}</span>
                                          </div>
                                          <button type="button" onClick={() => setSheetLeads((prev) => prev.filter((_, i) => i !== idx))} className="text-text-muted hover:text-status-error p-0.5 cursor-pointer">
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Message Mode */}
                          <div className="space-y-2 pt-1 border-t border-border">
                            <div className="flex items-center justify-between">
                              <label className="font-medium text-text-primary">Message Type</label>
                              <div className="flex items-center gap-1 bg-surface-subtle p-0.5 rounded-sm border border-border">
                                {(['template', 'text'] as const).map((mode) => (
                                  <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setCampaignForm({ ...campaignForm, message_mode: mode })}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer ${
                                      campaignForm.message_mode === mode
                                        ? 'bg-surface text-text-primary border border-border-strong font-semibold shadow-subtle'
                                        : 'text-text-secondary hover:text-text-primary'
                                    }`}
                                  >
                                    {mode === 'template' ? 'Meta Template' : 'Direct Text'}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {campaignForm.message_mode === 'template' ? (
                              <div className="space-y-3 bg-surface-subtle/50 p-3.5 rounded-sm border border-border">
                                <div className="flex items-center justify-between">
                                  <label className="text-[11px] font-medium text-text-secondary">Approved WhatsApp Broadcast Template</label>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setShowTemplateManagerModal(true)}
                                      className="text-[11px] text-accent hover:underline font-medium flex items-center gap-1 cursor-pointer"
                                    >
                                      <Settings2 className="w-3 h-3" />
                                      <span>Manage / Create Templates</span>
                                    </button>
                                  </div>
                                </div>
                                <select
                                  value={campaignForm.template_name}
                                  onChange={(e) => setCampaignForm({ ...campaignForm, template_name: e.target.value })}
                                  className="w-full px-3 py-2 bg-surface border border-border rounded-sm text-xs text-text-primary font-medium"
                                >
                                  {marketingTemplates.length > 0 ? (
                                    marketingTemplates.map((tpl) => (
                                      <option key={tpl.id} value={tpl.name}>
                                        [{tpl.category || 'UTILITY'}] {tpl.label || tpl.name} ({tpl.status || 'APPROVED'})
                                      </option>
                                    ))
                                  ) : (
                                    customTemplates.map((tpl) => (
                                      <option key={tpl.id} value={tpl.name}>{tpl.label}</option>
                                    ))
                                  )}
                                </select>
                                <div className="space-y-1.5">
                                  <span className="text-[11px] font-medium text-text-muted">Template Dynamic Variables</span>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {(['template_param1', 'template_param2', 'template_param3'] as const).map((param, i) => (
                                      <div key={param} className="space-y-1">
                                        <label className="text-[10px] font-medium text-text-muted">Variable {i + 1} {`({{${i + 1}}})`}</label>
                                        <input
                                          type="text"
                                          placeholder={i === 0 ? 'e.g. Valued Customer' : i === 1 ? settingsForm.name || 'Boldlabs' : 'e.g. FLAT20'}
                                          value={campaignForm[param]}
                                          onChange={(e) => setCampaignForm({ ...campaignForm, [param]: e.target.value })}
                                          className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-sm text-xs text-text-primary"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2 bg-surface-subtle/50 p-3.5 rounded-sm border border-border">
                                <label className="text-[11px] font-medium text-text-secondary">Custom Message Text</label>
                                <textarea
                                  rows={4}
                                  required
                                  placeholder="Hello! We are excited to announce our new services and special offers. Reply to book now!"
                                  value={campaignForm.message_text}
                                  onChange={(e) => setCampaignForm({ ...campaignForm, message_text: e.target.value })}
                                  className="w-full p-2.5 bg-surface border border-border rounded-sm text-xs text-text-primary placeholder:text-text-muted focus:border-accent"
                                />
                                <p className="text-[10px] text-text-muted flex items-center gap-1"><Lightbulb className="w-3 h-3 shrink-0" />Direct text only works within Meta's 24-hour customer care window.</p>
                              </div>
                            )}
                          </div>

                          {/* Send Mode: Now vs Schedule */}
                          <div className="space-y-2 pt-1 border-t border-border">
                            <label className="font-medium text-text-primary">Send Options</label>
                            <div className="flex items-center gap-3">
                              {(['now', 'scheduled'] as const).map((mode) => (
                                <label
                                  key={mode}
                                  className="flex items-center gap-2 cursor-pointer text-xs"
                                  onClick={() => setCampaignForm({ ...campaignForm, send_mode: mode })}
                                >
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${campaignForm.send_mode === mode ? 'border-accent bg-accent' : 'border-border'}`}>
                                    {campaignForm.send_mode === mode && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                  <span className={`font-medium ${campaignForm.send_mode === mode ? 'text-text-primary' : 'text-text-secondary'}`}>
                                    <span className="flex items-center justify-center gap-1.5">{mode === 'now' ? <><Zap className="w-3.5 h-3.5" />Send Immediately</> : <><Calendar className="w-3.5 h-3.5" />Schedule for Later</>}</span>
                                  </span>
                                </label>
                              ))}
                            </div>
                            {campaignForm.send_mode === 'scheduled' && (
                              <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50 border border-blue-200 rounded-sm">
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-blue-800">Date</label>
                                  <input
                                    type="date"
                                    value={campaignForm.schedule_date}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setCampaignForm({ ...campaignForm, schedule_date: e.target.value })}
                                    className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-sm text-xs text-text-primary"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-blue-800">Time</label>
                                  <input
                                    type="time"
                                    value={campaignForm.schedule_time}
                                    onChange={(e) => setCampaignForm({ ...campaignForm, schedule_time: e.target.value })}
                                    className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-sm text-xs text-text-primary"
                                  />
                                </div>
                                <p className="col-span-2 text-[10px] text-blue-700">Campaign will be queued and dispatched at the selected date and time.</p>
                              </div>
                            )}
                          </div>

                          {/* Anti-Ban Info */}
                          <div className="flex items-center gap-2 p-2.5 bg-surface-subtle border border-border rounded-sm text-[11px] text-text-muted">
                            <ShieldCheck className="w-4 h-4 text-status-success shrink-0" />
                            <span>Dispatches sequentially with automatic 500ms safety interval to prevent WhatsApp rate limits.</span>
                          </div>

                          {/* Submit */}
                          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <span className="text-xs text-text-secondary font-medium">
                              Total Audience:{' '}
                              <strong className="text-text-primary font-semibold">
                                {campaignForm.target_audience === 'contacts_only'
                                  ? `${selectedContactIds.length} CRM contacts`
                                  : campaignForm.target_audience === 'sheet_only'
                                  ? `${sheetLeads.length} leads`
                                  : `${selectedContactIds.length + sheetLeads.length} recipients`}
                              </strong>
                            </span>
                            <button
                              type="submit"
                              disabled={sendingBroadcast}
                              className="px-5 py-2 bg-accent hover:bg-accent/90 text-white font-semibold text-xs rounded-sm transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-subtle"
                            >
                              {sendingBroadcast ? (
                                <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Dispatching...</span></>
                              ) : campaignForm.send_mode === 'scheduled' ? (
                                <><CalendarDays className="w-3.5 h-3.5" /><span>Schedule Campaign</span></>
                              ) : (
                                <><Send className="w-3.5 h-3.5" /><span>Send Campaign Now</span></>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Right: Preview + History */}
                      <div className="lg:col-span-5 space-y-6">
                        {/* WhatsApp Preview */}
                        <div className="bg-surface border border-border rounded-md p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-border pb-2">
                            <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">Live WhatsApp Preview</span>
                            <span className="text-[10px] text-text-muted font-mono">Recipient View</span>
                          </div>
                          <div className="bg-[#EFEAE2] p-3.5 rounded-md border border-slate-200 shadow-inner space-y-2">
                            <div className="bg-white rounded-md p-3 max-w-[90%] shadow-sm text-xs space-y-2 text-slate-800 ml-auto border border-slate-100">
                              <div className="font-semibold text-emerald-800 text-[11px] pb-1 border-b border-slate-100">{settingsForm.name || 'Boldlabs'}</div>
                              <div className="text-slate-700 leading-relaxed text-xs">
                                {campaignForm.message_mode === 'template' ? (
                                  <p>Hello <strong>{campaignForm.template_param1 || 'Valued Customer'}</strong>! {campaignForm.template_param3 ? `Here is your special offer: ${campaignForm.template_param3}.` : 'Thank you for being our customer.'} Reply to claim or book now!</p>
                                ) : (
                                  <p className="whitespace-pre-wrap">{campaignForm.message_text || 'Your custom message preview will appear here.'}</p>
                                )}
                              </div>
                              <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 font-mono pt-1">
                                <span>{formatTime12(new Date())}</span>
                                <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] stroke-[2.2]" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Campaign History */}
                        <div className="bg-surface border border-border rounded-md p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-border pb-2">
                            <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">Campaign History</span>
                            <span className="text-[11px] text-text-muted font-mono">{campaigns.length} total</span>
                          </div>
                          <div className="divide-y divide-border overflow-y-auto max-h-72">
                            {loadingCampaigns ? (
                              <p className="text-xs text-text-muted py-4 text-center flex items-center justify-center gap-2"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading...</p>
                            ) : campaigns.length === 0 ? (
                              <p className="text-xs text-text-muted py-4 text-center">No past campaigns yet. Send your first broadcast!</p>
                            ) : (
                              campaigns.map((cmp) => (
                                <div key={cmp.id} className="py-2.5 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <p className="font-semibold text-xs text-text-primary">{cmp.campaign_name}</p>
                                    <span className={`text-[10px] font-medium px-1.5 rounded-sm border ${
                                      cmp.status === 'completed' ? 'bg-status-success-bg text-status-success border-status-success-border'
                                      : cmp.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-surface-subtle text-text-muted border-border'
                                    }`}>
                                      {cmp.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-[11px] text-text-muted">
                                    <span>{cmp.total_recipients} recipients · {cmp.template_name || 'text'}</span>
                                    <span className="font-mono text-[10px]">
                                      {cmp.scheduled_at ? `Scheduled: ${new Date(cmp.scheduled_at).toLocaleDateString()}` : cmp.created_at ? new Date(cmp.created_at).toLocaleDateString() : 'Just now'}
                                    </span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SUB-TAB 1B: WHATSAPP MESSAGE TEMPLATES (UTILITY PRESET) ── */}
                {marketingSubTab === 'templates' && renderMetaTemplatesView()}

                {/* ── SUB-TAB 2: RE-ENGAGEMENT TRIGGERS ── */}
                {marketingSubTab === 'reengagement' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">Automated Re-engagement Triggers</h4>
                        <p className="text-xs text-text-muted mt-0.5">Set up intelligent, trigger-based campaigns that run automatically based on customer behavior.</p>
                      </div>
                      <button
                        onClick={() => setNewTriggerModal(true)}
                        className="px-3 py-1.5 bg-accent text-white text-xs font-semibold rounded-sm flex items-center gap-1.5 cursor-pointer hover:bg-accent/90 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        New Trigger
                      </button>
                    </div>

                    {loadingTriggers ? (
                      <div className="flex items-center justify-center py-12 text-text-muted text-xs gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Loading triggers...
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {triggers.map((trigger) => {
                          const TriggerIcon = trigger.trigger_type === 'birthday_greeting' ? Cake
                            : trigger.trigger_type === 'post_treatment_followup' ? HeartPulse
                            : trigger.trigger_type === 'seasonal_promo' ? Sparkles
                            : Calendar;
                          return (
                            <div key={trigger.id} className={`bg-surface border rounded-md p-4 space-y-3 transition-all duration-150 ${trigger.is_active ? 'border-border' : 'border-border opacity-70'}`}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded-full bg-surface-subtle border border-border flex items-center justify-center shrink-0"><TriggerIcon className="w-3.5 h-3.5 text-accent" /></div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-sm text-text-primary truncate">{trigger.name}</p>
                                    <p className="text-[11px] text-text-muted mt-0.5">{trigger.condition_label}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                    trigger.is_active
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-surface-subtle text-text-muted border-border'
                                  }`}>
                                    {trigger.is_active ? 'Active' : 'Paused'}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-surface-subtle rounded-sm p-2 border border-border">
                                  <p className="text-sm font-semibold text-text-primary">{trigger.reached_count}</p>
                                  <p className="text-[10px] text-text-muted">Reached</p>
                                </div>
                                <div className="bg-surface-subtle rounded-sm p-2 border border-border">
                                  <p className="text-sm font-semibold text-text-primary">{trigger.condition_days || '—'}</p>
                                  <p className="text-[10px] text-text-muted">Days trigger</p>
                                </div>
                                <div className="bg-surface-subtle rounded-sm p-2 border border-border">
                                  <p className="text-[10px] font-mono font-semibold text-text-primary truncate">{trigger.template_name}</p>
                                  <p className="text-[10px] text-text-muted">Template</p>
                                </div>
                              </div>

                              {trigger.last_triggered_at && (
                                <p className="text-[10px] text-text-muted flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Last fired: {new Date(trigger.last_triggered_at).toLocaleDateString()}
                                </p>
                              )}

                              <div className="flex items-center gap-2 pt-1 border-t border-border">
                                <button
                                  onClick={async () => {
                                    setTogglingTriggerId(trigger.id);
                                    try {
                                      const res = await marketing.toggleTrigger(trigger.id);
                                      setTriggers((prev) => prev.map((t) => t.id === trigger.id ? { ...t, is_active: res.is_active } : t));
                                    } catch {}
                                    setTogglingTriggerId(null);
                                  }}
                                  disabled={togglingTriggerId === trigger.id}
                                  className={`flex-1 py-1.5 text-[11px] font-medium rounded-sm border transition-colors cursor-pointer ${
                                    trigger.is_active
                                      ? 'bg-surface-subtle text-text-secondary border-border hover:border-border-strong'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  } disabled:opacity-50`}
                                >
                                  <span className="flex items-center justify-center gap-1">{togglingTriggerId === trigger.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : trigger.is_active ? <><Pause className="w-3 h-3" />Pause</> : <><Play className="w-3 h-3" />Activate</>}</span>
                                </button>
                                <button
                                  onClick={async () => {
                                    setTestingTriggerId(trigger.id);
                                    try {
                                      await marketing.testTrigger(trigger.id);
                                      setTriggers((prev) => prev.map((t) => t.id === trigger.id ? { ...t, reached_count: t.reached_count + 1 } : t));
                                      setBroadcastSuccessNotice(`Test trigger "${trigger.name}" dispatched to admin WhatsApp!`);
                                      setTimeout(() => setBroadcastSuccessNotice(null), 5000);
                                    } catch {}
                                    setTestingTriggerId(null);
                                  }}
                                  disabled={testingTriggerId === trigger.id}
                                  className="flex-1 py-1.5 text-[11px] font-medium rounded-sm border border-border bg-surface hover:bg-surface-subtle text-text-secondary cursor-pointer transition-colors disabled:opacity-50"
                                >
                                  <span className="flex items-center justify-center gap-1">{testingTriggerId === trigger.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <><FlaskConical className="w-3 h-3" />Test Fire</>}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {triggers.length === 0 && !loadingTriggers && (
                          <div className="md:col-span-2 py-12 text-center text-text-muted text-xs">
                            <RotateCcw className="w-6 h-6 mx-auto mb-2 text-text-muted" />
                            <p className="font-medium">No triggers configured yet.</p>
                            <p>Click "New Trigger" to set up your first automated re-engagement campaign.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* New Trigger Modal */}
                    {newTriggerModal && (
                      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-md shadow-lg w-full max-w-md space-y-4 p-6">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm text-text-primary">New Re-engagement Trigger</h4>
                            <button onClick={() => setNewTriggerModal(false)} className="text-text-muted hover:text-text-primary cursor-pointer"><X className="w-4 h-4" /></button>
                          </div>
                          <div className="space-y-3 text-xs">
                            <div className="space-y-1">
                              <label className="font-medium text-text-primary">Trigger Name *</label>
                              <input type="text" placeholder="e.g. 3-Month Re-activation" value={triggerForm.name} onChange={(e) => setTriggerForm({ ...triggerForm, name: e.target.value })} className="w-full px-3 py-2 bg-surface-subtle border border-border rounded-sm text-xs" />
                            </div>
                            <div className="space-y-1">
                              <label className="font-medium text-text-primary">Trigger Type *</label>
                              <select value={triggerForm.trigger_type} onChange={(e) => setTriggerForm({ ...triggerForm, trigger_type: e.target.value })} className="w-full px-3 py-2 bg-surface-subtle border border-border rounded-sm text-xs">
                                <option value="recall_reminder">Recall Reminder</option>
                                <option value="birthday_greeting">Birthday Greeting</option>
                                <option value="post_treatment_followup">Post-Treatment Follow-up</option>
                                <option value="seasonal_promo">Seasonal Promotion</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="font-medium text-text-primary">Condition Description *</label>
                              <input type="text" placeholder="e.g. No visit in 90 days" value={triggerForm.condition_label} onChange={(e) => setTriggerForm({ ...triggerForm, condition_label: e.target.value })} className="w-full px-3 py-2 bg-surface-subtle border border-border rounded-sm text-xs" />
                            </div>
                            <div className="space-y-1">
                              <label className="font-medium text-text-primary">Days Condition</label>
                              <input type="number" min={0} value={triggerForm.condition_days} onChange={(e) => setTriggerForm({ ...triggerForm, condition_days: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface-subtle border border-border rounded-sm text-xs" />
                            </div>
                            <div className="space-y-1">
                              <label className="font-medium text-text-primary">WhatsApp Template Name *</label>
                              <select value={triggerForm.template_name} onChange={(e) => setTriggerForm({ ...triggerForm, template_name: e.target.value })} className="w-full px-3 py-2 bg-surface-subtle border border-border rounded-sm text-xs">
                                {customTemplates.map((t) => <option key={t.id} value={t.name}>{t.label}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              onClick={async () => {
                                if (!triggerForm.name || !triggerForm.condition_label || !triggerForm.template_name) return;
                                try {
                                  await marketing.createTrigger(triggerForm);
                                  const updated = await marketing.getTriggers();
                                  setTriggers(Array.isArray(updated) ? updated : []);
                                  setNewTriggerModal(false);
                                  setTriggerForm({ name: '', trigger_type: 'recall_reminder', condition_label: '', condition_days: 30, template_name: 'reschedule_nudge', is_active: true });
                                  setBroadcastSuccessNotice('New trigger created successfully!');
                                  setTimeout(() => setBroadcastSuccessNotice(null), 4000);
                                } catch {}
                              }}
                              className="flex-1 py-2 bg-accent text-white font-semibold text-xs rounded-sm cursor-pointer hover:bg-accent/90 transition-colors"
                            >
                              Create Trigger
                            </button>
                            <button onClick={() => setNewTriggerModal(false)} className="flex-1 py-2 bg-surface-subtle text-text-secondary font-medium text-xs rounded-sm border border-border cursor-pointer hover:bg-surface transition-colors">
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                    SUB-TAB 3: ANALYTICS
                â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                {marketingSubTab === 'analytics' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary">Campaign Performance Analytics</h4>
                      <p className="text-xs text-text-muted mt-0.5">Aggregated funnel metrics across all broadcast campaigns.</p>
                    </div>

                    {loadingAnalytics ? (
                      <div className="flex items-center justify-center py-12 text-text-muted text-xs gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Loading analytics...
                      </div>
                    ) : (
                      <>
                        {/* Summary KPI Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                          {[
                            { label: 'Total Sent', value: analyticsData?.summary?.total_sent ?? campaigns.reduce((a, c) => a + (c.sent_count || 0), 0), suffix: '', Icon: SendHorizontal, color: 'text-text-primary' },
                            { label: 'Delivery Rate', value: analyticsData?.summary?.delivery_rate ?? 0, suffix: '%', Icon: CheckCircle, color: 'text-emerald-700' },
                            { label: 'Read Rate', value: analyticsData?.summary?.read_rate ?? 0, suffix: '%', Icon: Eye, color: 'text-blue-700' },
                            { label: 'Reply Rate', value: analyticsData?.summary?.reply_rate ?? 0, suffix: '%', Icon: MessageSquare, color: 'text-purple-700' },
                            { label: 'Conversions', value: analyticsData?.summary?.total_converted ?? 0, suffix: '', Icon: TrendingUp, color: 'text-orange-700' },
                            { label: 'Revenue', value: analyticsData?.summary?.attributed_revenue ?? 0, suffix: '', prefix: currentCurrencySymbol, Icon: Coins, color: 'text-emerald-700' },
                          ].map((kpi) => (
                            <div key={kpi.label} className="bg-surface border border-border rounded-md p-3 space-y-1 text-center">
                              <kpi.Icon className="w-4 h-4 mx-auto text-text-muted" />
                              <p className={`text-xl font-semibold font-headline ${kpi.color}`}>
                                {(kpi as any).prefix || ''}{typeof kpi.value === 'number' ? (kpi.suffix === '%' ? kpi.value.toFixed(1) : kpi.value.toLocaleString()) : kpi.value}{kpi.suffix}
                              </p>
                              <p className="text-[10px] text-text-muted leading-tight">{kpi.label}</p>
                            </div>
                          ))}
                        </div>

                        {/* Per-Campaign Performance Table */}
                        <div className="bg-surface border border-border rounded-md overflow-hidden">
                          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                            <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">Per-Campaign Breakdown</span>
                            <button
                              onClick={() => { setLoadingAnalytics(true); marketing.getAnalytics().then((d) => setAnalyticsData(d)).catch(() => {}).finally(() => setLoadingAnalytics(false)); }}
                              className="text-[11px] text-accent hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" /> Refresh
                            </button>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead className="bg-surface-subtle border-b border-border">
                                <tr>
                                  <th className="px-3 py-2 text-left font-medium text-text-secondary">Campaign</th>
                                  <th className="px-3 py-2 text-right font-medium text-text-secondary">Sent</th>
                                  <th className="px-3 py-2 text-right font-medium text-text-secondary">Delivered</th>
                                  <th className="px-3 py-2 text-right font-medium text-text-secondary">Read</th>
                                  <th className="px-3 py-2 text-right font-medium text-text-secondary">Replied</th>
                                  <th className="px-3 py-2 text-right font-medium text-text-secondary">Converted</th>
                                  <th className="px-3 py-2 text-left font-medium text-text-secondary">Funnel</th>
                                  <th className="px-3 py-2 text-left font-medium text-text-secondary">Date</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {(analyticsData?.campaigns ?? campaigns).length === 0 ? (
                                  <tr><td colSpan={8} className="text-center py-8 text-text-muted">No campaigns yet. Launch your first broadcast!</td></tr>
                                ) : (
                                  (analyticsData?.campaigns ?? campaigns).map((cmp) => {
                                    const sent = cmp.sent_count || cmp.total_recipients || 0;
                                    const deliv = cmp.delivered_count || 0;
                                    const read = cmp.read_count || 0;
                                    const replied = cmp.replied_count || 0;
                                    const converted = cmp.converted_count || 0;
                                    const delivPct = sent > 0 ? Math.round(deliv / sent * 100) : 0;
                                    const readPct = deliv > 0 ? Math.round(read / deliv * 100) : 0;
                                    return (
                                      <tr key={cmp.id} className="hover:bg-surface-subtle transition-colors">
                                        <td className="px-3 py-2.5">
                                          <p className="font-medium text-text-primary truncate max-w-[150px]">{cmp.campaign_name}</p>
                                          <p className="text-[10px] text-text-muted font-mono">{cmp.template_name || 'text'}</p>
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-mono text-text-primary">{sent}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-emerald-700">{deliv}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-blue-700">{read}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-purple-700">{replied}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-orange-700 font-semibold">{converted}</td>
                                        <td className="px-3 py-2.5 min-w-[100px]">
                                          <div className="space-y-0.5">
                                            <div className="flex items-center gap-1">
                                              <div className="h-1 rounded-full bg-emerald-500 transition-all" style={{ width: `${delivPct}%`, maxWidth: '80px' }} />
                                              <span className="text-[10px] text-text-muted">{delivPct}%</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <div className="h-1 rounded-full bg-blue-500 transition-all" style={{ width: `${readPct}%`, maxWidth: '80px' }} />
                                              <span className="text-[10px] text-text-muted">{readPct}%</span>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-[10px] text-text-muted font-mono whitespace-nowrap">
                                          {cmp.created_at ? new Date(cmp.created_at).toLocaleDateString() : '—'}
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* ── VIEW 5: WORKSPACE PREFERENCES (WHITE-LABEL CLIENT VIEW) ────────── */}
            {activeNav === 'settings' && (
              <div className="flex-1 overflow-y-auto space-y-6 max-w-4xl">
                {/* Managed Platform Banner */}
                <div className="p-4 bg-surface rounded-md border border-border flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-md bg-accent/10 text-accent flex items-center justify-center shrink-0 mt-0.5 border border-accent/20">
                    <Sparkles className="w-4 h-4 stroke-[1.5]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-text-primary">Managed Client Workspace</h4>
                      <span className="text-[10px] font-medium bg-surface-subtle text-text-muted px-2 py-0.5 rounded-sm border border-border">
                        Platform Managed
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      Your AI language models, WhatsApp Meta Cloud API webhooks, and core integrations are securely managed by your platform administrator. Customize your business branding, alert channels, regional defaults, and CRM labels below.
                    </p>
                  </div>
                </div>

                {settingsSaved && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Workspace preferences saved successfully!</span>
                  </div>
                )}

                {settingsError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{settingsError}</span>
                  </div>
                )}

                {/* Subtabs Bar */}
                <div className="flex gap-1 border-b border-border pb-3 flex-wrap">
                  {[
                    { id: 'branding', label: 'Profile & Branding', icon: Building2 },
                    { id: 'notifications', label: 'Alert Channels', icon: Bell },
                    { id: 'localization', label: 'Regional & Currency', icon: Globe },
                    { id: 'terminology', label: 'CRM Terminology', icon: Sliders },
                    { id: 'templates', label: 'WhatsApp Templates (Utility)', icon: FileText },
                    { id: 'account', label: 'Account & Session', icon: LogOut },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setSettingsTab(tab.id as any)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs transition-colors duration-150 cursor-pointer ${
                          settingsTab === tab.id
                            ? 'bg-surface-subtle text-text-primary font-semibold border border-border-strong'
                            : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-subtle font-medium border border-border'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 stroke-[1.5]" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-6">
                  
                  {/* ── 1. PROFILE & BRANDING ─────────────────────────────────── */}
                  {settingsTab === 'branding' && (
                    <div className="space-y-5 bg-surface p-5 rounded-md border border-border">
                      <div className="pb-2 border-b border-border flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-xs text-text-primary">Business Profile & Brand Identity</h4>
                          <p className="text-xs text-text-muted">Set your business name, assistant greeting name, and customer-facing links.</p>
                        </div>
                      </div>

                      {/* Header Brand Preview */}
                      <div className="p-4 bg-surface rounded-md border border-border space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                            CRM Header Preview
                          </label>
                          <span className="text-xs font-medium text-status-success bg-status-success-bg px-2 py-0.5 rounded-sm border border-status-success-border">
                            Live Sync
                          </span>
                        </div>
                        <div className="p-3 bg-surface-subtle rounded-sm border border-border flex items-center gap-2.5">
                          <span className="font-bold text-[16px] text-text-primary tracking-tight">
                            {settingsForm.name || 'Boldlabs CRM'}
                          </span>
                          <span className="text-[13px] font-medium text-text-muted">
                            / Overview
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-text-primary mb-1">Company / Brand Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Boldlabs Studio / City Health Clinic"
                            value={settingsForm.name || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                            className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                          />
                          <p className="text-xs text-text-muted mt-1">Displayed in your header and customer notifications.</p>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-text-primary mb-1">Assistant Display Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Reception Assistant"
                            value={settingsForm.assistant_name || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, assistant_name: e.target.value })}
                            className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                          />
                          <p className="text-xs text-text-muted mt-1">Name used when introducing your assistant to customers.</p>
                        </div>
                      </div>

                      {/* Business Address */}
                      <div className="p-4 bg-surface rounded-md border border-border space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-text-primary">
                            Business Address & Google Maps Link
                          </label>
                          <span className="text-xs font-medium text-text-muted bg-surface-subtle px-2 py-0.5 rounded-sm border border-border">
                            Sent after booking
                          </span>
                        </div>
                        <p className="text-xs text-text-muted">
                          Automatically shared with customers in WhatsApp booking confirmations and calendar invites.
                        </p>
                        <textarea
                          rows={2}
                          placeholder="e.g. 123 Innovation Tower, Anna Nagar, Chennai. Maps: https://maps.app.goo.gl/xyz"
                          value={settingsForm.full_location_text || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, full_location_text: e.target.value })}
                          className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent font-sans resize-none transition-colors duration-150"
                        />
                      </div>

                      {/* Google Review Link */}
                      <div className="p-4 bg-surface rounded-md border border-border space-y-2">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-accent stroke-[1.5]" />
                          <label className="text-xs font-medium text-text-primary">
                            Google Review Link (Post-Attendance Feedback)
                          </label>
                        </div>
                        <p className="text-xs text-text-muted">
                          When an appointment is marked as Attended, the system will automatically send this review link to the customer 15 minutes later.
                        </p>
                        <input
                          type="text"
                          placeholder="https://g.page/r/your-business-id/review"
                          value={settingsForm.google_review_link || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, google_review_link: e.target.value })}
                          className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                        />
                      </div>
                    </div>
                  )}

                  {/* ── 2. ALERT CHANNELS & NOTIFICATIONS ───────────────────── */}
                  {settingsTab === 'notifications' && (
                    <div className="space-y-5 bg-surface p-5 rounded-md border border-border">
                      <div className="pb-2 border-b border-border">
                        <h4 className="font-semibold text-xs text-text-primary">Staff Alert Channels</h4>
                        <p className="text-xs text-text-muted">Receive real-time WhatsApp and email alerts when appointments are booked or changed.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-surface rounded-md border border-border space-y-2">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-text-secondary stroke-[1.5]" />
                            <label className="block text-xs font-medium text-text-primary">
                              Staff WhatsApp Phone (Instant Alerts)
                            </label>
                          </div>
                          <input
                            type="text"
                            placeholder="e.g. +917603807215"
                            value={settingsForm.admin_whatsapp_number || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, admin_whatsapp_number: e.target.value })}
                            className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                          />
                          <p className="text-xs text-text-muted">
                            Receives instant WhatsApp notification templates whenever a customer books, cancels, or reschedules.
                          </p>
                        </div>

                        <div className="p-4 bg-surface rounded-md border border-border space-y-2">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-text-secondary stroke-[1.5]" />
                            <label className="block text-xs font-medium text-text-primary">
                              Notification Email
                            </label>
                          </div>
                          <input
                            type="email"
                            placeholder="e.g. contact@business.com"
                            value={settingsForm.notification_email || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, notification_email: e.target.value })}
                            className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                          />
                          <p className="text-xs text-text-muted">
                            Receives email booking receipts, daily digest reports, and Google Calendar event invites.
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border flex items-center justify-between">
                        <p className="text-[11px] text-text-muted">Changes take effect immediately for all automated WhatsApp and email alerts.</p>
                        <button
                          type="button"
                          onClick={() => handleSaveSettings()}
                          disabled={settingsSaving}
                          className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-white font-medium text-xs rounded-sm transition-colors duration-150 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {settingsSaving ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin stroke-[1.5]" />
                              <span>Saving alerts...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[1.5]" />
                              <span>Save Alert Channels</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── 3. REGIONAL & LOCALIZATION ──────────────────────────── */}
                  {settingsTab === 'localization' && (
                    <div className="space-y-5 bg-surface p-5 rounded-md border border-border">
                      <div className="pb-2 border-b border-border">
                        <h4 className="font-semibold text-xs text-text-primary">Regional Localization & Currency</h4>
                        <p className="text-xs text-text-muted">Configure timezone, currency symbols, and country dialing prefixes.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-text-primary mb-1">
                            Business Timezone
                          </label>
                          <select
                            value={settingsForm.timezone || 'Asia/Kolkata'}
                            onChange={(e) => setSettingsForm({ ...settingsForm, timezone: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-sans text-text-primary focus:bg-white focus:border-accent transition-colors duration-150 cursor-pointer"
                          >
                            {TIMEZONE_LIST.map((tz) => (
                              <option key={tz.value} value={tz.value}>
                                {tz.label}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-text-muted mt-1">Controls booking slot hours and customer timestamps.</p>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-text-primary mb-1">
                            Default Calling Code
                          </label>
                          <select
                            value={settingsForm.country_code || '+91'}
                            onChange={(e) => setSettingsForm({ ...settingsForm, country_code: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-sans text-text-primary focus:bg-white focus:border-accent transition-colors duration-150 cursor-pointer"
                          >
                            {COUNTRY_CODES.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.country}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-text-muted mt-1">Default prefix for new phone numbers entered without country code.</p>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-text-primary mb-1">
                            Display Currency
                          </label>
                          <select
                            value={settingsForm.currency || 'INR'}
                            onChange={(e) => {
                              const sel = CURRENCY_LIST.find((c) => c.code === e.target.value);
                              setSettingsForm({
                                ...settingsForm,
                                currency: e.target.value,
                                currency_symbol: sel ? sel.symbol : settingsForm.currency_symbol || '₹',
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
                          <p className="text-xs text-text-muted mt-1">Currency symbol shown across payments and service catalog.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── 4. CRM INDUSTRY & DYNAMIC TERMINOLOGY ────────────────── */}
                  {settingsTab === 'terminology' && (
                    <div className="space-y-5 bg-surface p-5 rounded-md border border-border">
                      <div className="pb-2 border-b border-border flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-xs text-text-primary">Business Industry & CRM Terminology</h4>
                          <p className="text-xs text-text-muted">Adapt labels across tables, dialogs, and filters to match your business terminology.</p>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                          {INDUSTRY_PRESETS.find((p) => p.id === (settingsForm.industry || 'clinic'))?.name || 'Custom'}
                        </span>
                      </div>

                      {/* Preset Dropdown */}
                      <div>
                        <label className="block text-xs font-medium text-text-primary mb-1">
                          Industry Preset (Select to auto-fill CRM labels)
                        </label>
                        <select
                          value={settingsForm.industry || 'clinic'}
                          onChange={(e) => {
                            const selectedPreset = INDUSTRY_PRESETS.find((p) => p.id === e.target.value);
                            setSettingsForm({
                              ...settingsForm,
                              industry: e.target.value,
                              taxonomy: selectedPreset ? { ...selectedPreset.taxonomy, requirement_presets: [...(selectedPreset.taxonomy.requirement_presets || [])] } : settingsForm.taxonomy,
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

                      {/* Full CRM Custom Fields & Terminology */}
                      <div className="space-y-4 pt-1">
                        <div>
                          <h5 className="text-[11px] font-semibold text-text-primary uppercase tracking-wider mb-2">1. Core Business Entities & Actions</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[11px] font-medium text-text-muted mb-1">Customer / Client (Singular)</label>
                              <input
                                type="text"
                                value={settingsForm.taxonomy?.client_label ?? currentTaxonomy.client_label}
                                onChange={(e) => setSettingsForm({ ...settingsForm, taxonomy: { ...(settingsForm.taxonomy || currentTaxonomy), client_label: e.target.value } })}
                                placeholder="e.g. Patient / Student / Buyer"
                                className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-text-muted mb-1">Customers / Clients (Plural)</label>
                              <input
                                type="text"
                                value={settingsForm.taxonomy?.client_plural ?? currentTaxonomy.client_plural}
                                onChange={(e) => setSettingsForm({ ...settingsForm, taxonomy: { ...(settingsForm.taxonomy || currentTaxonomy), client_plural: e.target.value } })}
                                placeholder="e.g. Patients / Students / Buyers"
                                className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-text-muted mb-1">Staff / Specialist Label</label>
                              <input
                                type="text"
                                value={settingsForm.taxonomy?.staff_label ?? currentTaxonomy.staff_label}
                                onChange={(e) => setSettingsForm({ ...settingsForm, taxonomy: { ...(settingsForm.taxonomy || currentTaxonomy), staff_label: e.target.value } })}
                                placeholder="e.g. Doctor / Tutor / Specialist"
                                className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-text-muted mb-1">Requirement / Concern / Inquiry</label>
                              <input
                                type="text"
                                value={settingsForm.taxonomy?.requirement_label ?? currentTaxonomy.requirement_label}
                                onChange={(e) => setSettingsForm({ ...settingsForm, taxonomy: { ...(settingsForm.taxonomy || currentTaxonomy), requirement_label: e.target.value } })}
                                placeholder="e.g. Health Concern / Target Course"
                                className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-text-muted mb-1">Booking / Event Singular</label>
                              <input
                                type="text"
                                value={settingsForm.taxonomy?.event_label ?? currentTaxonomy.event_label}
                                onChange={(e) => setSettingsForm({ ...settingsForm, taxonomy: { ...(settingsForm.taxonomy || currentTaxonomy), event_label: e.target.value } })}
                                placeholder="e.g. Appointment / Demo Class"
                                className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-text-muted mb-1">Booking Button CTA Label</label>
                              <input
                                type="text"
                                value={settingsForm.taxonomy?.booking_cta ?? currentTaxonomy.booking_cta}
                                onChange={(e) => setSettingsForm({ ...settingsForm, taxonomy: { ...(settingsForm.taxonomy || currentTaxonomy), booking_cta: e.target.value } })}
                                placeholder="e.g. + New Appointment / + Book Demo"
                                className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border">
                          <h5 className="text-[11px] font-semibold text-text-primary uppercase tracking-wider mb-2">2. Customer Table Columns & Field Headers (Fully Customizable)</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[11px] font-medium text-text-muted mb-1">Phone Column</label>
                              <input
                                type="text"
                                value={settingsForm.taxonomy?.phone_label ?? currentTaxonomy.phone_label}
                                onChange={(e) => setSettingsForm({ ...settingsForm, taxonomy: { ...(settingsForm.taxonomy || currentTaxonomy), phone_label: e.target.value } })}
                                placeholder="Phone"
                                className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-text-muted mb-1">Age & Location Column</label>
                              <input
                                type="text"
                                value={settingsForm.taxonomy?.age_location_label ?? currentTaxonomy.age_location_label}
                                onChange={(e) => setSettingsForm({ ...settingsForm, taxonomy: { ...(settingsForm.taxonomy || currentTaxonomy), age_location_label: e.target.value } })}
                                placeholder="Age & Location"
                                className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-text-muted mb-1">Status / Pipeline Stage</label>
                              <input
                                type="text"
                                value={settingsForm.taxonomy?.status_label ?? currentTaxonomy.status_label}
                                onChange={(e) => setSettingsForm({ ...settingsForm, taxonomy: { ...(settingsForm.taxonomy || currentTaxonomy), status_label: e.target.value } })}
                                placeholder="Status"
                                className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-text-muted mb-1">Lead Priority Column</label>
                              <input
                                type="text"
                                value={settingsForm.taxonomy?.lead_label ?? currentTaxonomy.lead_label}
                                onChange={(e) => setSettingsForm({ ...settingsForm, taxonomy: { ...(settingsForm.taxonomy || currentTaxonomy), lead_label: e.target.value } })}
                                placeholder="Lead"
                                className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-text-muted mb-1">Follow-up Due Column</label>
                              <input
                                type="text"
                                value={settingsForm.taxonomy?.followup_label ?? currentTaxonomy.followup_label}
                                onChange={(e) => setSettingsForm({ ...settingsForm, taxonomy: { ...(settingsForm.taxonomy || currentTaxonomy), followup_label: e.target.value } })}
                                placeholder="Follow-up Due"
                                className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-text-muted mb-1">Added / Joined Date Column</label>
                              <input
                                type="text"
                                value={settingsForm.taxonomy?.created_label ?? currentTaxonomy.created_label}
                                onChange={(e) => setSettingsForm({ ...settingsForm, taxonomy: { ...(settingsForm.taxonomy || currentTaxonomy), created_label: e.target.value } })}
                                placeholder="Added"
                                className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-text-muted mb-1">Latest Note Column</label>
                              <input
                                type="text"
                                value={settingsForm.taxonomy?.notes_label ?? currentTaxonomy.notes_label}
                                onChange={(e) => setSettingsForm({ ...settingsForm, taxonomy: { ...(settingsForm.taxonomy || currentTaxonomy), notes_label: e.target.value } })}
                                placeholder="Latest Note"
                                className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-text-muted mb-1">Action Column</label>
                              <input
                                type="text"
                                value={settingsForm.taxonomy?.actions_label ?? currentTaxonomy.actions_label}
                                onChange={(e) => setSettingsForm({ ...settingsForm, taxonomy: { ...(settingsForm.taxonomy || currentTaxonomy), actions_label: e.target.value } })}
                                placeholder="Action"
                                className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Concern / Requirement Presets Input */}
                      <div className="pt-3 border-t border-border space-y-1.5">
                        <label className="block text-[11px] font-medium text-text-primary">
                          Quick {settingsForm.taxonomy?.requirement_label || currentTaxonomy.requirement_label || 'Requirement / Concern'} Presets (comma-separated quick-pick chips)
                        </label>
                        <input
                          type="text"
                          value={(settingsForm.taxonomy?.requirement_presets && settingsForm.taxonomy.requirement_presets.length > 0)
                            ? settingsForm.taxonomy.requirement_presets.join(', ')
                            : (PREBUILT_REQUIREMENTS_BY_INDUSTRY[settingsForm.industry || 'clinic'] || []).join(', ')
                          }
                          onChange={(e) => {
                            const presets = e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean);
                            setSettingsForm({
                              ...settingsForm,
                              taxonomy: {
                                ...(settingsForm.taxonomy || currentTaxonomy),
                                requirement_presets: presets,
                              },
                            });
                          }}
                          placeholder="e.g. General Consultation, Back Pain & Physio, Dental Checkup & Cleaning"
                          className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent font-sans"
                        />
                        <p className="text-[10px] text-text-muted">
                          These clickable chips appear under the requirement box when adding or editing a client/patient to rapidly assign their concern or inquiry. Selecting an Industry above automatically loads standard presets, or you can freely customize them here.
                        </p>
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          {((settingsForm.taxonomy?.requirement_presets && settingsForm.taxonomy.requirement_presets.length > 0)
                            ? settingsForm.taxonomy.requirement_presets
                            : (PREBUILT_REQUIREMENTS_BY_INDUSTRY[settingsForm.industry || 'clinic'] || [])
                          ).map((chip: string) => (
                            <span key={chip} className="px-2 py-0.5 rounded-sm text-[10px] bg-white border border-border text-text-secondary font-medium shadow-2xs">
                              {chip}
                            </span>
                          ))}
                          <button
                            type="button"
                            onClick={openPresetEditor}
                            title="Edit presets (add or remove)"
                            className="px-2 py-0.5 rounded-sm text-[10px] border border-dashed border-border hover:border-accent text-accent flex items-center gap-1 transition-colors cursor-pointer bg-surface font-medium"
                          >
                            <Pencil className="w-2.5 h-2.5 stroke-[1.8]" />
                            <span>Manage Presets</span>
                          </button>
                        </div>
                        <div className="pt-3 border-t border-border flex items-center justify-between">
                          <p className="text-[11px] text-text-muted">All tables, forms, drawers, and exports instantly update with your custom terminology.</p>
                          <button
                            type="button"
                            onClick={() => handleSaveSettings()}
                            disabled={settingsSaving}
                            className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-white font-medium text-xs rounded-sm transition-colors duration-150 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {settingsSaving ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin stroke-[1.5]" />
                                <span>Saving labels...</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[1.5]" />
                                <span>Save CRM Terminology</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── 4B. META WHATSAPP TEMPLATES (UTILITY PRESET) ──────────── */}
                  {settingsTab === 'templates' && renderMetaTemplatesView()}

                  {/* ── 5. ACCOUNT & SESSION ──────────────────────────────────── */}
                  {settingsTab === 'account' && (
                    <div className="space-y-4 bg-surface p-5 rounded-md border border-border">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div>
                          <h4 className="font-semibold text-xs text-text-primary">Active Account & Session</h4>
                          <p className="text-xs text-text-muted">Manage your active CRM login credentials and session.</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-sm text-xs font-medium bg-status-success-bg text-status-success border border-status-success-border">
                          Active Session
                        </span>
                      </div>

                      <div className="bg-surface p-4 rounded-md border border-border space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-text-muted">Signed In Email</p>
                            <p className="font-medium text-sm text-text-primary mt-0.5">{user?.email || 'Logged in user'}</p>
                          </div>
                          <span className="text-xs font-mono font-medium bg-surface-subtle text-text-secondary px-2.5 py-1 rounded-sm border border-border uppercase">
                            Role: {user?.role || 'Staff'}
                          </span>
                        </div>

                        <div className="pt-3 border-t border-border flex items-center justify-between">
                          <div>
                            <p className="font-medium text-xs text-text-primary">Sign Out</p>
                            <p className="text-xs text-text-muted">End your current session on this device securely.</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="px-3.5 py-1.5 bg-surface hover:bg-status-error-bg text-status-error border border-border hover:border-status-error-border text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer flex items-center gap-1.5"
                          >
                            <LogOut className="w-3.5 h-3.5 stroke-[1.5]" />
                            <span>Sign out</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  {settingsTab !== 'account' && (
                    <div className="pt-2 flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={settingsSaving}
                        className="px-4 py-2 bg-accent hover:bg-accent-hover text-white font-medium text-xs rounded-sm transition-colors duration-150 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                      >
                        {settingsSaving ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin stroke-[1.5]" />
                            <span>Saving preferences...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[1.5]" />
                            <span>Save Preferences</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}
          </main>

          {/* ── 3. RIGHT STICKY NOTES & SCRATCHPAD DRAWER ─────────────────────── */}
          {showRightDrawer ? (
            <aside className="w-80 bg-surface border-l border-border flex flex-col shrink-0 p-4 overflow-y-auto space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-text-secondary stroke-[1.5]" />
                  <div>
                    <h4 className="font-medium text-xs text-text-primary flex items-center gap-1.5">
                      <span>Notes</span>
                      <span className="text-[11px] font-mono text-text-muted bg-surface-subtle px-1.5 py-0.2 rounded-sm border border-border">
                        {stickyNotes.length}
                      </span>
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsAddingNote(!isAddingNote)}
                    className="px-2 py-1 bg-surface hover:bg-surface-subtle text-text-primary text-xs font-medium rounded-sm transition-colors duration-150 flex items-center gap-1 cursor-pointer border border-border"
                    title="Add new note"
                  >
                    <Plus className="w-3 h-3 stroke-[1.5]" />
                    <span>Note</span>
                  </button>
                  <button
                    onClick={() => setShowRightDrawer(false)}
                    className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-subtle rounded-sm transition-colors duration-150 cursor-pointer"
                    title="Hide notes panel"
                  >
                    <X className="w-3.5 h-3.5 stroke-[1.5]" />
                  </button>
                </div>
              </div>

              {/* Add New Note Box */}
              {isAddingNote && (
                <form onSubmit={handleAddStickyNote} className="bg-surface-subtle border border-border rounded-md p-3 space-y-2.5 shadow-subtle">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-text-secondary">Color Theme</span>
                    <div className="flex items-center gap-1.5">
                      {[
                        { id: 'yellow', bg: 'bg-[#fef08a]', border: 'border-amber-300' },
                        { id: 'green', bg: 'bg-[#bbf7d0]', border: 'border-emerald-300' },
                        { id: 'blue', bg: 'bg-[#bae6fd]', border: 'border-sky-300' },
                        { id: 'purple', bg: 'bg-[#e9d5ff]', border: 'border-purple-300' },
                        { id: 'pink', bg: 'bg-[#fecdd3]', border: 'border-rose-300' },
                      ].map((c) => (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => setNewNoteColor(c.id as any)}
                          className={`w-4.5 h-4.5 rounded-full ${c.bg} ${c.border} border transition-all cursor-pointer ${
                            newNoteColor === c.id ? 'ring-2 ring-accent ring-offset-1 scale-110 shadow-xs' : 'hover:scale-105 opacity-80 hover:opacity-100'
                          }`}
                          title={`Select ${c.id} note`}
                        />
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    autoFocus
                    placeholder="Write a client follow-up or reminder note..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-border rounded-sm text-xs focus:outline-none focus:border-accent resize-none text-text-primary placeholder:text-text-muted font-sans transition-colors duration-150"
                  />

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingNote(false)}
                      className="px-2 py-1 text-xs font-medium text-text-muted hover:text-text-primary cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newNoteText.trim()}
                      className="px-3 py-1 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white text-xs font-semibold rounded-sm transition-colors duration-150 cursor-pointer shadow-subtle"
                    >
                      Add Note
                    </button>
                  </div>
                </form>
              )}

              {/* Sticky Notes Cards List */}
              <div className="space-y-2.5">
                {stickyNotes.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-surface rounded-md border border-dashed border-border">
                    <StickyNote className="w-6 h-6 text-text-muted mx-auto mb-1.5 stroke-[1.5]" />
                    <p className="text-xs font-medium text-text-primary">No notes yet</p>
                    <p className="text-xs text-text-muted mt-0.5">Click "+ Note" above to write a reminder.</p>
                  </div>
                ) : (
                  stickyNotes.map((note) => {
                    const colorStyles: Record<string, { bg: string; border: string; text: string; badge: string }> = {
                      yellow: { bg: 'bg-[#fefce8]', border: 'border-[#fef08a]', text: 'text-amber-950', badge: 'bg-[#fef08a] text-amber-900 border-[#fde047]' },
                      green: { bg: 'bg-[#f0fdf4]', border: 'border-[#bbf7d0]', text: 'text-emerald-950', badge: 'bg-[#bbf7d0] text-emerald-900 border-[#86efac]' },
                      blue: { bg: 'bg-[#f0f9ff]', border: 'border-[#bae6fd]', text: 'text-sky-950', badge: 'bg-[#bae6fd] text-sky-900 border-[#7dd3fc]' },
                      purple: { bg: 'bg-[#faf5ff]', border: 'border-[#e9d5ff]', text: 'text-purple-950', badge: 'bg-[#e9d5ff] text-purple-900 border-[#d8b4fe]' },
                      pink: { bg: 'bg-[#fff1f2]', border: 'border-[#fecdd3]', text: 'text-rose-950', badge: 'bg-[#fecdd3] text-rose-900 border-[#fda4af]' },
                    };
                    const currentStyle = colorStyles[note.color] || colorStyles.yellow;

                    return (
                      <div
                        key={note.id}
                        className={`p-3 rounded-md border transition-all duration-150 relative group ${currentStyle.bg} ${currentStyle.border} ${
                          note.done ? 'opacity-55' : 'shadow-2xs'
                        }`}
                      >
                        {/* Pin & Actions bar */}
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleTogglePin(note.id)}
                              className="text-xs transition cursor-pointer text-text-muted hover:text-text-primary"
                              title={note.pinned ? 'Unpin' : 'Pin to top'}
                            >
                              <Pin className={`w-3.5 h-3.5 stroke-[1.5] ${note.pinned ? 'fill-accent text-accent' : ''}`} />
                            </button>
                            {note.pinned && (
                              <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded-sm border ${currentStyle.badge}`}>
                                Pinned
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition">
                            <button
                              onClick={() => handleToggleDone(note.id)}
                              className="text-text-muted hover:text-text-primary transition cursor-pointer p-0.5"
                              title={note.done ? 'Mark pending' : 'Mark completed'}
                            >
                              {note.done ? (
                                <CheckSquare className="w-3.5 h-3.5 stroke-[1.5] text-accent" />
                              ) : (
                                <Square className="w-3.5 h-3.5 stroke-[1.5]" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteStickyNote(note.id)}
                              className="text-text-muted hover:text-status-error transition cursor-pointer p-0.5 ml-1"
                              title="Delete note"
                            >
                              <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                            </button>
                          </div>
                        </div>

                        {/* Note Content */}
                        <p className={`text-xs font-normal leading-relaxed break-words ${currentStyle.text} ${note.done ? 'line-through opacity-70' : ''}`}>
                          {note.text}
                        </p>

                        {/* Timestamp */}
                        <div className="mt-2 pt-1 border-t border-black/5 flex items-center justify-between text-[10px] text-text-muted">
                          <span>{note.createdAt}</span>
                          {note.done && <span className="text-emerald-700 font-semibold">Done</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </aside>
          ) : null}
        </div>

        {/* ── CREATE BOOKING MODAL ─────────────────────────────────────────── */}
        {isAddBookingOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-surface rounded-md border border-border w-full max-w-lg overflow-hidden shadow-subtle p-6 space-y-4 my-auto">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="w-5 h-5 text-accent stroke-[1.5]" />
                  <div>
                    <h3 className="font-semibold text-sm text-text-primary">Create appointment</h3>
                    <p className="text-xs text-text-muted">
                      Book appointment and trigger notifications
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsAddBookingOpen(false);
                    setBookingCreateError('');
                    setBookingCreateSuccess('');
                  }}
                  className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-subtle rounded-sm transition-colors duration-150 cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[1.5]" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCreateNewBooking} className="space-y-3.5">
                {bookingCreateError && (
                  <div className="p-3 bg-status-error-bg border border-status-error-border text-status-error text-xs rounded-sm font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 stroke-[1.5] shrink-0" />
                    <span>{bookingCreateError}</span>
                  </div>
                )}

                {bookingCreateSuccess && (
                  <div className="p-3 bg-status-success-bg border border-status-success-border text-status-success text-xs rounded-sm font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 stroke-[1.5] shrink-0" />
                    <span>{bookingCreateSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">
                      Client name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={newBookingForm.contact_name}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, contact_name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent font-sans transition-colors duration-150"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">
                      WhatsApp phone *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 919876543210"
                      value={newBookingForm.contact_phone}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, contact_phone: e.target.value })}
                      className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    Service / Booking title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Consultation"
                    value={newBookingForm.service}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, service: e.target.value })}
                    className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent font-sans transition-colors duration-150"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={newBookingForm.date}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, date: e.target.value })}
                      className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-sans text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-text-primary">
                        Time *
                      </label>
                      {newBookingForm.time && (
                        <span className="text-[11px] font-mono font-medium text-accent bg-accent/10 px-1.5 py-0.2 rounded-xs">
                          {formatMilitaryTo12(newBookingForm.time)}
                        </span>
                      )}
                    </div>
                    <input
                      type="time"
                      required
                      value={newBookingForm.time}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, time: e.target.value })}
                      className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-sans text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">Fee ({currentCurrencySymbol})</label>
                    <input
                      type="number"
                      placeholder="500"
                      value={newBookingForm.price}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, price: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono tabular-nums text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Notes / Instructions (optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Add client notes or preferences..."
                    value={newBookingForm.notes}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, notes: e.target.value })}
                    className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent resize-none font-sans transition-colors duration-150"
                  />
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddBookingOpen(false);
                      setBookingCreateError('');
                      setBookingCreateSuccess('');
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle rounded-sm transition-colors duration-150 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={bookingCreating}
                    className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-medium text-xs rounded-sm transition-colors duration-150 flex items-center gap-1.5 cursor-pointer"
                  >
                    {bookingCreating ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin stroke-[1.5]" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[1.5]" />
                        <span>Create booking</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── BOOKING DETAIL MODAL / DRAWER ─────────────────────────────────── */}
        {isBookingDetailModalOpen && selectedBookingDetail && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-surface rounded-md border border-border w-full max-w-lg overflow-hidden shadow-subtle p-6 space-y-4 my-auto">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-sm bg-accent text-white flex items-center justify-center font-medium text-xs shrink-0">
                    {selectedBookingDetail.contact_name ? selectedBookingDetail.contact_name[0].toUpperCase() : 'C'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-text-primary">
                      {selectedBookingDetail.contact_name || 'Client appointment'}
                    </h3>
                    <p className="text-xs text-text-muted font-mono">
                      {selectedBookingDetail.contact_phone || 'No phone recorded'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-sm text-xs font-medium border ${
                      selectedBookingDetail.status === 'completed'
                        ? 'bg-status-success-bg text-status-success border-status-success-border'
                        : selectedBookingDetail.status === 'no_show'
                        ? 'bg-status-warning-bg text-status-warning border-status-warning-border'
                        : selectedBookingDetail.status === 'cancelled'
                        ? 'bg-status-error-bg text-status-error border-status-error-border'
                        : 'bg-surface-subtle text-text-secondary border-border'
                    }`}
                  >
                    {selectedBookingDetail.status === 'completed' ? 'Attended' : selectedBookingDetail.status === 'no_show' ? 'No-Show' : selectedBookingDetail.status}
                  </span>
                  <button
                    onClick={() => {
                      setIsBookingDetailModalOpen(false);
                      setSelectedBookingDetail(null);
                    }}
                    className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-subtle rounded-sm transition-colors duration-150 cursor-pointer"
                  >
                    <X className="w-4 h-4 stroke-[1.5]" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 p-3 bg-surface-subtle rounded-sm border border-border text-xs">
                  <div>
                    <p className="text-xs font-medium text-text-muted">Service</p>
                    <p className="font-medium text-text-primary mt-0.5">{selectedBookingDetail.service}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-muted">Scheduled date & time</p>
                    <p className="font-mono text-xs text-text-primary mt-0.5">
                      {formatDateTime12(selectedBookingDetail.start_time)}
                    </p>
                  </div>
                </div>

                {/* Edit Fee / Price Section */}
                <div className="p-3 bg-surface-subtle rounded-sm border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-text-primary flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>Booking fee ({currentCurrencySymbol})</span>
                    </label>
                    <span className="text-xs font-mono font-medium text-text-primary tabular-nums">
                      Current: {currentCurrencySymbol}{selectedBookingDetail.price || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-text-muted font-mono">
                        {currentCurrencySymbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0.00"
                        value={editPriceValue !== '' && editingBookingPriceId === selectedBookingDetail.id ? editPriceValue : (selectedBookingDetail.price || 0)}
                        onChange={(e) => {
                          setEditingBookingPriceId(selectedBookingDetail.id);
                          setEditPriceValue(e.target.value);
                        }}
                        className="w-full pl-7 pr-3 py-1.5 bg-white border border-border rounded-sm text-xs font-mono font-medium text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const val = editingBookingPriceId === selectedBookingDetail.id ? parseFloat(editPriceValue) : selectedBookingDetail.price;
                        handleUpdatePrice(selectedBookingDetail.id, Number(val) || 0);
                      }}
                      disabled={updatingPrice}
                      className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-sm text-xs font-medium transition-colors duration-150 cursor-pointer flex items-center gap-1 disabled:opacity-50"
                    >
                      {updatingPrice ? (
                        <RotateCcw className="w-3.5 h-3.5 animate-spin stroke-[1.5]" />
                      ) : (
                        <Check className="w-3.5 h-3.5 stroke-[1.5]" />
                      )}
                      <span>Update price</span>
                    </button>
                  </div>
                </div>

                {/* Associate Actions: Chat & CRM Profile */}
                <div className="grid grid-cols-2 gap-2">
                  {selectedBookingDetail.contact_phone && (
                    <button
                      onClick={() => {
                        const phone = selectedBookingDetail.contact_phone || '';
                        setIsBookingDetailModalOpen(false);
                        setSelectedBookingDetail(null);
                        openChatForContact(phone);
                      }}
                      className="p-2 bg-surface hover:bg-surface-subtle text-text-primary font-medium text-xs rounded-sm transition-colors duration-150 flex items-center justify-center gap-1.5 border border-border cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>WhatsApp Chat</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const phone = selectedBookingDetail.contact_phone || '';
                      const name = selectedBookingDetail.contact_name || undefined;
                      setIsBookingDetailModalOpen(false);
                      setSelectedBookingDetail(null);
                      openCustomerProfileByPhone(phone, name);
                    }}
                    className="p-2 bg-accent/10 hover:bg-accent/20 text-accent font-medium text-xs rounded-sm transition-colors duration-150 flex items-center justify-center gap-1.5 border border-accent/30 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span>View Client Profile</span>
                  </button>
                </div>

                {/* Interactive Reschedule Slot Section */}
                <div className="p-3 bg-blue-50/50 rounded-sm border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
                      <CalendarClock className="w-3.5 h-3.5 text-blue-700" />
                      <span>Reschedule Appointment</span>
                    </label>
                    <span className="text-[10px] text-blue-700 font-mono">Triggers WhatsApp & Calendar Sync</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-text-muted font-medium block mb-0.5">New Date</label>
                      <input
                        type="date"
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        className="w-full p-1.5 bg-white border border-border rounded-sm text-xs text-text-primary font-medium focus:border-accent"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[10px] text-text-muted font-medium">New Time</label>
                        {rescheduleTime && (
                          <span className="text-[10px] font-mono font-semibold text-blue-700">
                            {formatMilitaryTo12(rescheduleTime)}
                          </span>
                        )}
                      </div>
                      <input
                        type="time"
                        value={rescheduleTime}
                        onChange={(e) => setRescheduleTime(e.target.value)}
                        className="w-full p-1.5 bg-white border border-border rounded-sm text-xs text-text-primary font-medium focus:border-accent"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleRescheduleBooking(selectedBookingDetail.id, rescheduleDate, rescheduleTime)}
                    disabled={isRescheduling}
                    className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                  >
                    {isRescheduling ? 'Rescheduling & Syncing...' : '🔄 Confirm Reschedule & Send Confirmation'}
                  </button>
                </div>

                {/* Attendance Action Buttons */}
                <div className="pt-2 border-t border-border space-y-2">
                  <p className="text-xs font-medium text-text-muted">Update status:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => handleUpdateBookingStatus(selectedBookingDetail.id, 'completed')}
                      disabled={updatingBookingId === selectedBookingDetail.id}
                      className={`py-1.5 px-2 text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1.5 border ${
                        selectedBookingDetail.status === 'completed'
                          ? 'bg-status-success-bg text-status-success border-status-success-border font-semibold'
                          : 'bg-surface hover:bg-surface-subtle text-text-body border-border'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>Attended</span>
                    </button>
                    <button
                      onClick={() => handleUpdateBookingStatus(selectedBookingDetail.id, 'no_show')}
                      disabled={updatingBookingId === selectedBookingDetail.id}
                      className={`py-1.5 px-2 text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1.5 border ${
                        selectedBookingDetail.status === 'no_show'
                          ? 'bg-status-warning-bg text-status-warning border-status-warning-border font-semibold'
                          : 'bg-surface hover:bg-surface-subtle text-text-body border-border'
                      }`}
                    >
                      <UserX className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>No-Show</span>
                    </button>
                    <button
                      onClick={() => handleUpdateBookingStatus(selectedBookingDetail.id, 'confirmed')}
                      disabled={updatingBookingId === selectedBookingDetail.id}
                      className={`py-1.5 px-2 text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1.5 border ${
                        selectedBookingDetail.status === 'confirmed'
                          ? 'bg-surface-subtle text-text-primary border-border-strong font-semibold'
                          : 'bg-surface hover:bg-surface-subtle text-text-body border-border'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>Confirmed</span>
                    </button>
                    <button
                      onClick={() => handleUpdateBookingStatus(selectedBookingDetail.id, 'cancelled')}
                      disabled={updatingBookingId === selectedBookingDetail.id}
                      className={`py-1.5 px-2 text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1.5 border ${
                        selectedBookingDetail.status === 'cancelled'
                          ? 'bg-status-error-bg text-status-error border-status-error-border font-semibold'
                          : 'bg-surface hover:bg-surface-subtle text-text-body border-border'
                      }`}
                    >
                      <X className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL 1: CONFIRM SINGLE CHAT TAKE HUMAN ACTION ───────────────── */}
        {confirmSingleAiModal?.isOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface rounded-md border border-border w-full max-w-md overflow-hidden shadow-subtle p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <UserX className="w-5 h-5 text-status-warning stroke-[1.5]" />
                <div>
                  <h3 className="font-semibold text-sm text-text-primary">Pause AI for this customer?</h3>
                  <p className="text-xs text-text-muted">Switch this chat to manual human mode</p>
                </div>
              </div>

              <div className="p-3.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-body space-y-2 leading-relaxed">
                <p>
                  You are switching <span className="font-semibold text-text-primary">{confirmSingleAiModal.name}</span> to Human Takeover Mode.
                </p>
                <div className="text-xs text-text-muted space-y-1">
                  <p>&bull; AI auto-reply will be paused for this customer only.</p>
                  <p>&bull; All other customer conversations will continue running with AI.</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmSingleAiModal(null)}
                  className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle rounded-sm transition-colors duration-150 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const convId = confirmSingleAiModal.convId;
                    setConfirmSingleAiModal(null);
                    handleToggleAi(convId, true);
                  }}
                  className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-white font-medium text-xs rounded-sm transition-colors duration-150 cursor-pointer flex items-center gap-1.5"
                >
                  <UserX className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span>Switch to human mode</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL 2: CONFIRM GLOBAL ALL CHATS TAKE HUMAN ACTION ─────────────── */}
        {confirmAllAiModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface rounded-md border border-border w-full max-w-md overflow-hidden shadow-subtle p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-status-warning stroke-[1.5]" />
                <div>
                  <h3 className="font-semibold text-sm text-text-primary">Pause AI for all chats?</h3>
                  <p className="text-xs text-text-muted">Global human takeover override</p>
                </div>
              </div>

              <div className="p-3.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-body space-y-2 leading-relaxed">
                <p className="font-semibold text-text-primary">
                  Global AI pause warning
                </p>
                <p className="text-xs text-text-muted leading-relaxed">
                  This will pause automated AI replies across <strong>every conversation</strong> on your CRM. No incoming WhatsApp leads will receive automated replies until turned back on.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmAllAiModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle rounded-sm transition-colors duration-150 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmAllAiModal(false);
                    handleToggleAllAi(false);
                  }}
                  className="px-3.5 py-1.5 bg-status-error hover:bg-status-error text-white font-medium text-xs rounded-sm transition-colors duration-150 cursor-pointer flex items-center gap-1.5"
                >
                  <UserX className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span>Turn off AI for all chats</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── CUSTOMER FULL HISTORY MODAL ─────────────────────────────── */}
        {showCustomerHistoryModal && selectedCustomer && (
          <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-surface rounded-lg border border-border w-full max-w-4xl my-6 shadow-lg overflow-hidden flex flex-col">

              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-subtle">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-accent stroke-[1.5]" />
                  <div>
                    <h2 className="text-sm font-semibold text-text-primary">{selectedCustomer.name || 'Customer'} — Complete History</h2>
                    <p className="text-[11px] text-text-muted">{selectedCustomer.phone}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomerHistoryModal(false)}
                  className="p-1.5 rounded-sm hover:bg-surface text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[80vh] p-5 space-y-6">

                {/* Section 1: Profile Summary */}
                <div>
                  <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-accent" /> Profile
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[
                      { label: 'Name', value: selectedCustomer.name || '—' },
                      { label: 'Phone', value: selectedCustomer.phone },
                      { label: 'Age', value: selectedCustomer.age ? String(selectedCustomer.age) : '—' },
                      { label: 'Location', value: selectedCustomer.location || '—' },
                      { label: currentTaxonomy.requirement_label || 'Concern', value: selectedCustomer.health_concern || '—' },
                      { label: currentTaxonomy.staff_label || 'Staff', value: selectedCustomer.preferred_doctor || '—' },
                      { label: 'CRM Status', value: selectedCustomer.status || '—' },
                      { label: 'Lead Grade', value: selectedCustomer.lead_probability || '—' },
                      { label: 'Converted', value: selectedCustomer.converted ? 'Yes' : 'No' },
                      { label: 'Follow-up Date', value: selectedCustomer.followup_date || '—' },
                      { label: 'Follow-up Time', value: selectedCustomer.followup_time || '—' },
                      { label: 'Created', value: selectedCustomer.created_at ? new Date(selectedCustomer.created_at).toLocaleDateString() : '—' },
                    ].map((item) => (
                      <div key={item.label} className="bg-surface-subtle rounded-sm px-3 py-2 border border-border">
                        <p className="text-[10px] text-text-muted uppercase tracking-wide mb-0.5">{item.label}</p>
                        <p className="text-xs font-medium text-text-primary truncate">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2: WhatsApp Chat History */}
                <div>
                  <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-accent" /> WhatsApp Conversation
                  </h3>
                  {loadingCustomerChat ? (
                    <div className="text-xs text-text-muted text-center py-4">Loading chat...</div>
                  ) : customerChat && customerChat.messages && customerChat.messages.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {customerChat.messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] px-3 py-2 rounded-md text-[11px] ${
                            msg.direction === 'outbound'
                              ? 'bg-accent text-white'
                              : 'bg-surface-subtle border border-border text-text-primary'
                          }`}>
                            <p className="leading-relaxed">{msg.body}</p>
                            <p className={`text-[9px] mt-1 ${msg.direction === 'outbound' ? 'text-white/70' : 'text-text-muted'}`}>
                              {formatDateTime12(msg.created_at)} {msg.ai_generated ? '· AI' : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted text-center py-4 bg-surface-subtle rounded-sm border border-border">No chat messages yet.</p>
                  )}
                </div>

                {/* Section 3: Notes */}
                <div>
                  <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <StickyNote className="w-3.5 h-3.5 text-accent" /> Notes ({customerNotes.length})
                  </h3>
                  {loadingCustomerNotes ? (
                    <div className="text-xs text-text-muted text-center py-4">Loading notes...</div>
                  ) : customerNotes.length > 0 ? (
                    <div className="space-y-2">
                      {customerNotes.map((note) => (
                        <div key={note.id} className="bg-surface-subtle border border-border rounded-sm px-3 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold text-accent">{note.author}</span>
                            <span className="text-[10px] text-text-muted">{note.created_at ? new Date(note.created_at).toLocaleDateString() : ''}</span>
                          </div>
                          <p className="text-xs text-text-primary leading-relaxed">{note.note_text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted text-center py-4 bg-surface-subtle rounded-sm border border-border">No notes yet.</p>
                  )}
                </div>

                {/* Section 4: Bookings & Revenue */}
                <div>
                  <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5 text-accent" /> {currentTaxonomy.event_label || 'Appointments'} & Revenue
                  </h3>
                  {loadingCustomerBookings ? (
                    <div className="text-xs text-text-muted text-center py-4">Loading bookings...</div>
                  ) : customerBookingsData && customerBookingsData.bookings && customerBookingsData.bookings.length > 0 ? (
                    <div>
                      {/* Revenue Summary */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[
                          { label: 'Total Sessions', value: customerBookingsData.total_sessions },
                          { label: 'Completed', value: customerBookingsData.completed_sessions },
                          { label: 'Total Revenue', value: `${currentCurrencySymbol}${customerBookingsData.total_revenue || 0}` },
                        ].map((stat) => (
                          <div key={stat.label} className="bg-surface-subtle border border-border rounded-sm px-3 py-2 text-center">
                            <p className="text-[10px] text-text-muted">{stat.label}</p>
                            <p className="text-sm font-semibold text-text-primary">{stat.value}</p>
                          </div>
                        ))}
                      </div>
                      {/* Booking list */}
                      <div className="space-y-2">
                        {customerBookingsData.bookings.map((bk: any) => (
                          <div key={bk.id} className="flex items-center justify-between bg-surface-subtle border border-border rounded-sm px-3 py-2">
                            <div>
                              <p className="text-xs font-medium text-text-primary">{bk.service}</p>
                              <p className="text-[10px] text-text-muted font-mono">{formatDateTime12(bk.start_time)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-semibold text-text-primary">{currentCurrencySymbol}{bk.price || 0}</p>
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-sm border ${
                                bk.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                bk.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>{bk.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted text-center py-4 bg-surface-subtle rounded-sm border border-border">No appointments booked yet.</p>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface-subtle">
                <p className="text-[10px] text-text-muted">Customer ID: {selectedCustomer.id}</p>
                <button
                  type="button"
                  onClick={() => setShowCustomerHistoryModal(false)}
                  className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL 3: DELETE CONVERSATION CONFIRMATION ───── */}
        {deleteChatModal?.isOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface rounded-md border border-border w-full max-w-md overflow-hidden shadow-subtle p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-5 h-5 text-status-error stroke-[1.5]" />
                <div>
                  <h3 className="font-semibold text-sm text-text-primary">Delete conversation?</h3>
                  <p className="text-xs text-text-muted">Delete chat with {deleteChatModal.name}</p>
                </div>
              </div>

              <div className="p-3.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-body space-y-1.5 leading-relaxed">
                <p className="font-semibold text-text-primary">
                  Are you sure you want to delete this chat?
                </p>
                <p className="text-xs text-text-muted leading-relaxed">
                  This will permanently clear the message history from your CRM. Any booked appointments and contact information will remain safely preserved.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={deletingItem}
                  onClick={() => setDeleteChatModal(null)}
                  className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle rounded-sm transition-colors duration-150 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deletingItem}
                  onClick={() => handleDeleteConversation(deleteChatModal.convId, 'for_everyone')}
                  className="px-3.5 py-1.5 bg-status-error hover:bg-status-error text-white font-medium text-xs rounded-sm transition-colors duration-150 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span>{deletingItem ? 'Deleting...' : 'Delete chat'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL 4: ADD APPROVED WHATSAPP TEMPLATE NAME ───── */}
        {/* ── MODAL 4: WHATSAPP MESSAGE TEMPLATE MANAGER ───── */}
        {(showTemplateManagerModal || newTemplateModal) && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface rounded-md border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-accent stroke-[1.5]" />
                  <div>
                    <h3 className="font-semibold text-sm text-text-primary">Message Template Manager</h3>
                    <p className="text-xs text-text-muted">Create, inspect, and delete WhatsApp broadcast message templates (UTILITY & MARKETING)</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTemplateManagerModal(false);
                    setNewTemplateModal(false);
                    setTemplateManagerError(null);
                    setTemplateManagerSuccess(null);
                  }}
                  className="text-text-muted hover:text-text-primary cursor-pointer p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Feedback banners */}
              {templateManagerSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{templateManagerSuccess}</span>
                </div>
              )}
              {templateManagerError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{templateManagerError}</span>
                </div>
              )}

              {/* SECTION 1: ACTIVE TEMPLATES LIST */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-text-primary uppercase tracking-wider">
                    Active Templates ({marketingTemplates.length > 0 ? marketingTemplates.length : customTemplates.length})
                  </h4>
                  <span className="text-[10px] text-text-muted">Transactional confirmations are safely excluded</span>
                </div>

                <div className="border border-border rounded-sm overflow-hidden bg-surface-subtle/30">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-subtle border-b border-border text-[11px] font-semibold text-text-secondary">
                      <tr>
                        <th className="p-2.5">Template Name</th>
                        <th className="p-2.5">Type / Category</th>
                        <th className="p-2.5">Approval Status</th>
                        <th className="p-2.5">Variables</th>
                        <th className="p-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(marketingTemplates.length > 0 ? marketingTemplates : customTemplates).map((tpl: any) => (
                        <tr key={tpl.id || tpl.name} className="hover:bg-surface-subtle/60 transition-colors">
                          <td className="p-2.5 font-mono text-[11px] font-medium text-text-primary">
                            <div>{tpl.name}</div>
                            {tpl.label && tpl.label !== tpl.name && (
                              <div className="text-[10px] font-sans text-text-muted truncate max-w-[200px]">{tpl.label}</div>
                            )}
                          </td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded-sm text-[10px] font-semibold border ${
                              tpl.category === 'MARKETING'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {tpl.category || 'UTILITY'}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded-sm text-[10px] font-semibold border ${
                              tpl.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : tpl.status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {tpl.status || 'APPROVED'}
                            </span>
                          </td>
                          <td className="p-2.5 text-text-secondary text-[11px] font-mono">
                            {tpl.variables_count || 0} var{tpl.variables_count !== 1 ? 's' : ''}
                          </td>
                          <td className="p-2.5 text-right">
                            {tpl.name === 'utility_general_update' ? (
                              <span className="text-[10px] text-text-muted italic">System Default</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDeleteTemplate(tpl.name)}
                                className="p-1 text-text-muted hover:text-status-error hover:bg-surface-subtle rounded-sm transition-colors cursor-pointer"
                                title="Delete Template"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 2: CREATE NEW TEMPLATE FORM */}
              <div className="space-y-3 pt-3 border-t border-border">
                <div>
                  <h4 className="font-semibold text-xs text-text-primary uppercase tracking-wider">
                    Create New Message Template
                  </h4>
                  <p className="text-xs text-text-muted">Directly create and submit message templates (UTILITY or MARKETING) to Meta Cloud API.</p>
                </div>

                <form onSubmit={handleCreateTemplate} className="space-y-3.5 text-xs bg-surface-subtle/50 p-4 rounded-sm border border-border">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-medium text-text-primary">Template Name in Meta *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. spring_admission_alert or special_sale_v1"
                        value={newTemplateForm.name}
                        onChange={(e) => setNewTemplateForm({ ...newTemplateForm, name: e.target.value })}
                        className="w-full px-3 py-1.5 bg-surface border border-border rounded-sm text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                      />
                      <p className="text-[10px] text-text-muted">Lowercase letters, numbers, and underscores only.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="font-medium text-text-primary">Template Type / Category *</label>
                      <select
                        value={newTemplateForm.category}
                        onChange={(e) => setNewTemplateForm({ ...newTemplateForm, category: e.target.value as any })}
                        className="w-full px-3 py-1.5 bg-surface border border-border rounded-sm text-xs text-text-primary font-medium"
                      >
                        <option value="UTILITY">UTILITY (Updates, notifications, account/billing)</option>
                        <option value="MARKETING">MARKETING (Promotions, special offers, announcements)</option>
                      </select>
                      <p className="text-[10px] text-text-muted">UTILITY messages have highest delivery rate & lowest friction.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-medium text-text-primary">Display Label / Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Weekend Flash Offer (20% Off)"
                        value={newTemplateForm.label}
                        onChange={(e) => setNewTemplateForm({ ...newTemplateForm, label: e.target.value })}
                        className="w-full px-3 py-1.5 bg-surface border border-border rounded-sm text-xs text-text-primary focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-medium text-text-primary">Language Code</label>
                      <select
                        value={newTemplateForm.language}
                        onChange={(e) => setNewTemplateForm({ ...newTemplateForm, language: e.target.value })}
                        className="w-full px-3 py-1.5 bg-surface border border-border rounded-sm text-xs text-text-primary"
                      >
                        <option value="en_US">English (US) - en_US</option>
                        <option value="en">English - en</option>
                        <option value="en_GB">English (UK) - en_GB</option>
                        <option value="hi">Hindi - hi</option>
                        <option value="ta">Tamil - ta</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-medium text-text-primary">Message Body Content *</label>
                      <span className="text-[10px] font-mono text-text-muted">
                        Dynamic tags detected: {Array.from(new Set(newTemplateForm.body.match(/\{\{(\d+)\}\}/g) || [])).length}
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      required
                      placeholder="Hello {{1}}, we have an important announcement regarding {{2}}. Contact {{3}} to learn more!"
                      value={newTemplateForm.body}
                      onChange={(e) => {
                        const bodyVal = e.target.value;
                        const detected = Array.from(new Set(bodyVal.match(/\{\{(\d+)\}\}/g) || [])).length;
                        setNewTemplateForm({ ...newTemplateForm, body: bodyVal, variables_count: detected || 1 });
                      }}
                      className="w-full p-2.5 bg-surface border border-border rounded-sm text-xs text-text-primary focus:outline-none focus:border-accent font-sans"
                    />
                    <p className="text-[10px] text-text-muted">
                      Use <code className="bg-surface px-1 py-0.5 rounded border border-border font-mono">{'{{1}}'}</code>, <code className="bg-surface px-1 py-0.5 rounded border border-border font-mono">{'{{2}}'}</code> to inject contact name, discount code, or business details automatically.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                    <button
                      type="button"
                      onClick={() => {
                        setShowTemplateManagerModal(false);
                        setNewTemplateModal(false);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle rounded-sm transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={creatingTemplate}
                      className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-white font-medium text-xs rounded-sm transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {creatingTemplate ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Submitting to Meta...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create & Register Template</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ADD TASK MODAL */}
        {showAddTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAddTaskModal(false)}>
            <div className="w-full max-w-md bg-surface border border-border rounded-sm shadow-xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-subtle/50">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-accent stroke-[1.5]" />Add Task
                </h3>
                <button onClick={() => setShowAddTaskModal(false)} className="p-1 text-text-muted hover:text-text-primary rounded-sm hover:bg-surface-subtle cursor-pointer">
                  <X className="w-4 h-4 stroke-[1.5]" />
                </button>
              </div>
              <form onSubmit={handleCreateTask} className="p-4 space-y-3.5 text-xs">
                <div>
                  <label className="text-[10px] text-text-muted block mb-1 font-medium">Task Title *</label>
                  <input type="text" required value={addTaskTitle} onChange={e => setAddTaskTitle(e.target.value)} placeholder="e.g. Follow-up call with customer" className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-text-muted block mb-1 font-medium">Notes / Description</label>
                  <textarea rows={2} value={addTaskDesc} onChange={e => setAddTaskDesc(e.target.value)} placeholder="Add context or notes..." className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent text-xs resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-text-muted block mb-1 font-medium">Due Date</label>
                    <input type="date" value={addTaskDueDate} onChange={e => setAddTaskDueDate(e.target.value)} className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted block mb-1 font-medium">Time</label>
                    <input type="time" value={addTaskDueTime} onChange={e => setAddTaskDueTime(e.target.value)} className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent text-xs" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-text-muted block mb-1 font-medium">Link to Customer (optional)</label>
                  <select value={addTaskCustomerId} onChange={e => setAddTaskCustomerId(e.target.value)} className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent text-xs">
                    <option value="">— No customer linked —</option>
                    {customers.map(c => (<option key={c.id} value={c.id}>{c.name} ({c.phone})</option>))}
                  </select>
                </div>
                <div className="border-t border-border pt-3 space-y-2">
                  <p className="text-[10px] font-medium text-text-muted">Google Sync</p>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={addTaskSyncGT} onChange={e => setAddTaskSyncGT(e.target.checked)} className="w-3.5 h-3.5 accent-accent cursor-pointer" /><span className="text-xs text-text-body">Sync to Google Tasks</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={addTaskSyncCal} onChange={e => setAddTaskSyncCal(e.target.checked)} className="w-3.5 h-3.5 accent-accent cursor-pointer" /><span className="text-xs text-text-body">Add to Google Calendar</span></label>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowAddTaskModal(false)} className="flex-1 py-1.5 border border-border text-text-secondary hover:text-text-primary rounded-sm text-xs font-medium cursor-pointer">Cancel</button>
                  <button type="submit" disabled={!addTaskTitle.trim() || savingTask} className="flex-1 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-sm text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5" />
                    {savingTask ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD OVERALL NOTE MODAL */}
        {showAddOverallNoteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAddOverallNoteModal(false)}>
            <div className="w-full max-w-md bg-surface border border-border rounded-sm shadow-xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-subtle/50">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-accent stroke-[1.5]" />Add Customer Note
                </h3>
                <button onClick={() => setShowAddOverallNoteModal(false)} className="p-1 text-text-muted hover:text-text-primary rounded-sm hover:bg-surface-subtle cursor-pointer">
                  <X className="w-4 h-4 stroke-[1.5]" />
                </button>
              </div>
              <form onSubmit={handleCreateOverallNote} className="p-4 space-y-3 text-xs">
                <div>
                  <label className="text-[10px] text-text-muted block mb-1 font-medium">Select Customer / Contact *</label>
                  <select
                    required
                    value={overallNoteCustomerId}
                    onChange={e => setOverallNoteCustomerId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent text-xs"
                  >
                    <option value="">— Choose Customer —</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-text-muted block mb-1 font-medium">Author / Staff Name</label>
                  <input
                    type="text"
                    value={overallNoteAuthor}
                    onChange={e => setOverallNoteAuthor(e.target.value)}
                    placeholder="e.g. Staff Name"
                    className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-text-muted block mb-1 font-medium">Note Content *</label>
                  <textarea
                    required
                    rows={3}
                    value={overallNoteText}
                    onChange={e => setOverallNoteText(e.target.value)}
                    placeholder="Enter clinical notes, patient preferences, follow-up remarks..."
                    className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent text-xs resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-text-muted block mb-1 font-medium">Color Category</label>
                  <div className="flex items-center gap-2">
                    {(['slate','blue','amber','rose','emerald','violet'] as const).map(c => {
                      const dotClasses: Record<string, string> = {
                        slate:'bg-slate-400', blue:'bg-blue-400', amber:'bg-amber-400',
                        rose:'bg-rose-400', emerald:'bg-emerald-400', violet:'bg-violet-400'
                      };
                      return (
                        <button
                          type="button"
                          key={c}
                          title={c}
                          onClick={() => setOverallNoteColor(c)}
                          className={`w-5 h-5 rounded-full ${dotClasses[c]} cursor-pointer transition-transform ${overallNoteColor === c ? 'ring-2 ring-offset-2 ring-text-primary scale-110' : 'opacity-60 hover:opacity-100'}`}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-border">
                  <button type="button" onClick={() => setShowAddOverallNoteModal(false)} className="flex-1 py-1.5 border border-border text-text-secondary hover:text-text-primary rounded-sm text-xs font-medium cursor-pointer">Cancel</button>
                  <button type="submit" disabled={!overallNoteText.trim() || !overallNoteCustomerId || savingOverallNote} className="flex-1 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-sm text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5">
                    <StickyNote className="w-3.5 h-3.5" />
                    {savingOverallNote ? 'Saving...' : 'Save Note'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        
        {/* CUSTOMIZE QUICK PRESETS MODAL */}
        {presetEditModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4" onClick={() => setPresetEditModalOpen(false)}>
            <div className="w-full max-w-lg bg-surface border border-border rounded-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface-subtle/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-sm bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                    <Pencil className="w-3.5 h-3.5 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">
                      Customize Quick Presets
                    </h3>
                    <p className="text-[11px] text-text-muted">
                      Add, remove, or customize one-click {(settingsForm.taxonomy?.requirement_label || 'requirement').toLowerCase()} options.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPresetEditModalOpen(false)}
                  className="p-1 text-text-muted hover:text-text-primary rounded-sm hover:bg-surface-subtle cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4 stroke-[1.5]" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Input to Add Preset */}
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Add New Preset
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPresetInput}
                      onChange={(e) => setNewPresetInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddPreset();
                        }
                      }}
                      placeholder="Type a new preset option..."
                      className="flex-1 px-3 py-1.5 text-xs bg-surface-subtle border border-border rounded-sm text-text-primary focus:bg-white focus:border-accent focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleAddPreset}
                      disabled={!newPresetInput.trim()}
                      className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2]" />
                      <span>Add</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-text-muted mt-1">
                    Press Enter or click Add to append to your preset buttons.
                  </p>
                </div>

                {/* Active Presets */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                      Current Presets ({presetEditList.length})
                    </label>
                    <span className="text-[10px] text-text-muted">Click ✕ to remove any preset</span>
                  </div>
                  <div className="p-3 bg-surface-subtle border border-border rounded-sm min-h-[90px] max-h-[220px] overflow-y-auto flex flex-wrap gap-1.5 items-start content-start">
                    {presetEditList.length === 0 ? (
                      <p className="text-xs text-text-muted italic py-4 text-center w-full">
                        No presets in list. Add an option above or restore industry defaults below.
                      </p>
                    ) : (
                      presetEditList.map((preset) => (
                        <span
                          key={preset}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs bg-white border border-border text-text-primary font-medium shadow-2xs group hover:border-status-error-border transition-colors"
                        >
                          <span>{preset}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePreset(preset)}
                            title={`Remove "${preset}"`}
                            className="text-text-muted hover:text-status-error transition-colors p-0.5 rounded cursor-pointer"
                          >
                            <X className="w-3 h-3 stroke-[2.5]" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Restore Defaults button */}
                <div className="flex justify-between items-center pt-1">
                  <button
                    type="button"
                    onClick={handleResetPresetDefaults}
                    className="text-[11px] text-accent hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3 stroke-[1.8]" />
                    <span>Reset to {(INDUSTRY_PRESETS.find(p => p.id === (settingsForm.industry || 'clinic'))?.name) || 'Industry'} Defaults</span>
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3 bg-surface-subtle/50 border-t border-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPresetEditModalOpen(false)}
                  className="px-3 py-1.5 bg-surface hover:bg-surface-subtle text-text-secondary border border-border text-xs font-medium rounded-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePresetsModal}
                  disabled={savingPresets}
                  className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
                >
                  {savingPresets ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2]" />
                      <span>Save & Apply</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMIZE PREFERRED DOCTORS / STAFF PRESETS MODAL */}
        {doctorEditModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4" onClick={() => setDoctorEditModalOpen(false)}>
            <div className="w-full max-w-lg bg-surface border border-border rounded-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface-subtle/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-sm bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                    <UserCheck className="w-3.5 h-3.5 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">
                      Manage {currentTaxonomy.staff_label || 'Doctors / Staff'}
                    </h3>
                    <p className="text-[11px] text-text-muted">
                      Add, remove, or customize available {currentTaxonomy.staff_label ? currentTaxonomy.staff_label.toLowerCase() : 'staff'} members.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDoctorEditModalOpen(false)}
                  className="p-1 text-text-muted hover:text-text-primary rounded-sm hover:bg-surface-subtle cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4 stroke-[1.5]" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Input to Add Doctor */}
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Add New {currentTaxonomy.staff_label || 'Doctor / Staff'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newDoctorInput}
                      onChange={(e) => setNewDoctorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddDoctor();
                        }
                      }}
                      placeholder={`e.g. Dr. Jane Doe or Staff Name...`}
                      className="flex-1 px-3 py-1.5 text-xs bg-surface-subtle border border-border rounded-sm text-text-primary focus:bg-white focus:border-accent focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleAddDoctor}
                      disabled={!newDoctorInput.trim()}
                      className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2]" />
                      <span>Add</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-text-muted mt-1">
                    Press Enter or click Add to append to your staff selection list.
                  </p>
                </div>

                {/* Active Doctors */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                      Current {currentTaxonomy.staff_label ? currentTaxonomy.staff_label.split('/')[0].trim() + 's' : 'Staff'} ({doctorEditList.length})
                    </label>
                    <span className="text-[10px] text-text-muted">Click ✕ to remove</span>
                  </div>
                  <div className="p-3 bg-surface-subtle border border-border rounded-sm min-h-[90px] max-h-[220px] overflow-y-auto flex flex-wrap gap-1.5 items-start content-start">
                    {doctorEditList.length === 0 ? (
                      <p className="text-xs text-text-muted italic py-4 text-center w-full">
                        No doctors or staff members in list. Add a member above or restore defaults.
                      </p>
                    ) : (
                      doctorEditList.map((doc) => (
                        <span
                          key={doc}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface border border-border rounded-sm text-xs font-medium text-text-primary group hover:border-rose-300 transition-colors"
                        >
                          <span>{doc}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDoctor(doc)}
                            className="text-text-muted group-hover:text-rose-600 hover:bg-rose-50 rounded-xs p-0.5 transition-colors cursor-pointer"
                            title={`Remove ${doc}`}
                          >
                            <X className="w-3 h-3 stroke-[2]" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Reset to Defaults */}
                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleResetDoctorDefaults}
                    className="text-[11px] text-accent hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3 stroke-[1.8]" />
                    <span>Reset to Defaults</span>
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3 bg-surface-subtle/50 border-t border-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDoctorEditModalOpen(false)}
                  className="px-3 py-1.5 bg-surface hover:bg-surface-subtle text-text-secondary border border-border text-xs font-medium rounded-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDoctorsModal}
                  disabled={savingDoctors}
                  className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
                >
                  {savingDoctors ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2]" />
                      <span>Save & Apply</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QUICK ADD TO CRM MODAL */}
        {showQuickAddCrmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowQuickAddCrmModal(false)}>
            <div className="w-full max-w-md bg-surface border border-border rounded-sm shadow-xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-subtle/50">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-accent stroke-[1.5]" />
                  <span>Add Customer to CRM</span>
                </h3>
                <button onClick={() => setShowQuickAddCrmModal(false)} className="p-1 text-text-muted hover:text-text-primary rounded-sm hover:bg-surface-subtle cursor-pointer">
                  <X className="w-4 h-4 stroke-[1.5]" />
                </button>
              </div>
              <form onSubmit={handleSaveQuickCrm} className="p-4 space-y-3 text-xs">
                <div>
                  <label className="text-[10px] text-text-muted block mb-1 font-medium">WhatsApp Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={quickCrmPhone}
                    onChange={e => setQuickCrmPhone(e.target.value)}
                    placeholder="e.g. 918870341570"
                    className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-text-muted block mb-1 font-medium">Client / Patient Name</label>
                  <input
                    type="text"
                    value={quickCrmName}
                    onChange={e => setQuickCrmName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-text-muted block mb-1 font-medium">{currentTaxonomy.requirement_label || 'Requirement / Concern'}</label>
                  <input
                    type="text"
                    value={quickCrmConcern}
                    onChange={e => setQuickCrmConcern(e.target.value)}
                    placeholder={`Enter ${(currentTaxonomy.requirement_label || 'requirement').toLowerCase()}...`}
                    className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent text-xs"
                  />
                  {((settingsForm.taxonomy?.requirement_presets && settingsForm.taxonomy.requirement_presets.length > 0)
                    ? settingsForm.taxonomy.requirement_presets
                    : (PREBUILT_REQUIREMENTS_BY_INDUSTRY[settingsForm.industry || 'clinic'] || PREBUILT_REQUIREMENTS_BY_INDUSTRY.clinic)
                  ) && (
                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      {((settingsForm.taxonomy?.requirement_presets && settingsForm.taxonomy.requirement_presets.length > 0)
                        ? settingsForm.taxonomy.requirement_presets
                        : (PREBUILT_REQUIREMENTS_BY_INDUSTRY[settingsForm.industry || 'clinic'] || PREBUILT_REQUIREMENTS_BY_INDUSTRY.clinic)
                      ).map((chip) => (
                        <button key={chip} type="button" onClick={() => setQuickCrmConcern(chip)}
                          className={`px-2 py-0.5 rounded-sm text-[10px] border cursor-pointer transition-colors ${quickCrmConcern === chip ? 'bg-accent text-white border-accent' : 'bg-surface text-text-secondary border-border hover:border-accent hover:text-accent'}`}>
                          {chip}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={openPresetEditor}
                        title="Edit presets (add or remove)"
                        className="px-1.5 py-0.5 rounded-sm text-[10px] border border-dashed border-border hover:border-accent text-text-muted hover:text-accent flex items-center gap-1 transition-colors cursor-pointer bg-surface font-medium"
                      >
                        <Pencil className="w-2.5 h-2.5 stroke-[1.8]" />
                        <span>Edit</span>
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-text-muted block mb-1 font-medium">Lead Priority</label>
                    <select
                      value={quickCrmLead}
                      onChange={e => setQuickCrmLead(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent text-xs"
                    >
                      <option value="hot">Hot (Ready to convert)</option>
                      <option value="warm">Warm (Interested)</option>
                      <option value="cold">Cold (Inquiry)</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-text-muted block font-medium">Assigned Staff / Doctor</label>
                      <button
                        type="button"
                        onClick={openDoctorEditor}
                        className="text-[10px] text-accent hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Pencil className="w-2.5 h-2.5 stroke-[1.8]" />
                        <span>Manage</span>
                      </button>
                    </div>
                    <select
                      value={quickCrmDoctor}
                      onChange={e => setQuickCrmDoctor(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent text-xs"
                    >
                      <option value="">— Select Staff —</option>
                      {availableDoctors.map((doc) => (
                        <option key={doc} value={doc}>{doc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-border">
                  <button type="button" onClick={() => setShowQuickAddCrmModal(false)} className="flex-1 py-1.5 border border-border text-text-secondary hover:text-text-primary rounded-sm text-xs font-medium cursor-pointer">Cancel</button>
                  <button type="submit" disabled={!quickCrmPhone.trim() || savingQuickCrm} className="flex-1 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-sm text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" />
                    {savingQuickCrm ? 'Saving...' : 'Add to CRM'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      {/* ── Mobile Bottom Navigation Bar (md:hidden) ────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border flex items-center justify-around h-14 px-1 safe-area-pb shadow-lg">
        <button
          type="button"
          onClick={() => navigateTo('overview')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-sm transition-colors cursor-pointer ${
            activeNav === 'overview'
              ? 'text-accent font-semibold'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <LayoutGrid className="w-5 h-5 stroke-[1.5]" />
          <span className="text-[10px] mt-0.5 tracking-tight">Overview</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('inbox')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-sm transition-colors cursor-pointer relative ${
            activeNav === 'inbox'
              ? 'text-accent font-semibold'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 stroke-[1.5]" />
            {conversations.filter(c => (c.unread_count || 0) > 0).length > 0 && (
              <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-accent text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {conversations.filter(c => (c.unread_count || 0) > 0).length}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Chats</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('customers')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-sm transition-colors cursor-pointer ${
            activeNav === 'customers' || activeNav === 'followup'
              ? 'text-accent font-semibold'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <Users className="w-5 h-5 stroke-[1.5]" />
          <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[64px]">{currentTaxonomy.client_plural || 'Customers'}</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('bookings')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-sm transition-colors cursor-pointer ${
            activeNav === 'bookings'
              ? 'text-accent font-semibold'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <CalendarDays className="w-5 h-5 stroke-[1.5]" />
          <span className="text-[10px] mt-0.5 tracking-tight">Bookings</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('calendar')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-sm transition-colors cursor-pointer ${
            activeNav === 'calendar'
              ? 'text-accent font-semibold'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <Calendar className="w-5 h-5 stroke-[1.5]" />
          <span className="text-[10px] mt-0.5 tracking-tight">Calendar</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('settings')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-sm transition-colors cursor-pointer ${
            activeNav === 'settings'
              ? 'text-accent font-semibold'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <Sliders className="w-5 h-5 stroke-[1.5]" />
          <span className="text-[10px] mt-0.5 tracking-tight">Settings</span>
        </button>
      </nav>

      </div>
  );
}

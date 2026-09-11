'use client';

import { useState, useEffect, useLayoutEffect, useMemo, useRef, Fragment } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';

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
  StaffPermissions,
  StaffUser,
  LiveCalendarAvailabilityResponse,
  LiveCalendarSlot,
  registerTenantSlug,
  getCachedTenantId,
  CrmDropdownOptions,
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
  ArrowDownLeft,
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

function formatFullDateTimeDetailed(dateStrOrObj: string | Date | null | undefined): string {
  if (!dateStrOrObj) return '';
  try {
    const d = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj;
    if (isNaN(d.getTime())) return '';
    const datePart = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
    return `${datePart} at ${timePart}`;
  } catch {
    return '';
  }
}

function getMessageDateKey(dateStrOrObj: string | Date | null | undefined): string {
  if (!dateStrOrObj) return '';
  try {
    const d = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj;
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

function formatMessageDateDivider(dateStrOrObj: string | Date | null | undefined): string {
  if (!dateStrOrObj) return '';
  try {
    const d = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj;
    if (isNaN(d.getTime())) return '';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    
    const diffMs = today.getTime() - msgDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    const dateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    
    if (diffDays === 0) {
      return 'TODAY';
    } else if (diffDays === 1) {
      return 'YESTERDAY';
    } else if (diffDays > 1 && diffDays < 7) {
      return d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    } else {
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
    }
  } catch {
    return '';
  }
}

function getDisplayMessageBody(msg: { body?: string | null; content_type?: string | null; template_name?: string | null }): string {
  if (msg.body && msg.body.trim()) {
    return msg.body;
  }
  const ct = msg.content_type;
  if (ct === 'image') return '📷 [Photo]';
  if (ct === 'video') return '🎥 [Video]';
  if (ct === 'document') return '📄 [Document]';
  if (ct === 'audio') return '🎵 [Audio]';
  if (ct === 'sticker') return '🏷️ [Sticker]';
  if (ct === 'location') return '📍 [Location]';
  if (msg.template_name) return `📋 [Template: ${msg.template_name}]`;
  return '[Message]';
}

function formatWhatsAppHeaderDate(dateStrOrObj: string | Date | null | undefined): string {
  if (!dateStrOrObj) return '';
  try {
    const d = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj;
    if (isNaN(d.getTime())) return '';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    
    const diffMs = today.getTime() - msgDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    if (diffDays === 0) {
      return `Today at ${timeStr} (${dateStr})`;
    } else if (diffDays === 1) {
      return `Yesterday at ${timeStr} (${dateStr})`;
    } else if (diffDays > 1 && diffDays < 7) {
      const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
      return `${weekday} at ${timeStr} (${dateStr})`;
    } else {
      return `${dateStr} at ${timeStr}`;
    }
  } catch {
    return '';
  }
}

function normalizeNoteColor(raw?: string | null): 'slate' | 'blue' | 'amber' | 'rose' | 'emerald' | 'violet' {
  const c = (raw || '').trim().toLowerCase();
  if (c === 'red' || c === 'rose') return 'rose';
  if (c === 'yellow' || c === 'amber') return 'amber';
  if (c === 'green' || c === 'emerald') return 'emerald';
  if (c === 'purple' || c === 'violet') return 'violet';
  if (c === 'blue') return 'blue';
  return 'slate';
}

function getNoteBadgeStyle(rawColor?: string | null) {
  const c = normalizeNoteColor(rawColor);
  switch (c) {
    case 'rose':
      return {
        badge: 'bg-rose-50/90 hover:bg-rose-100 text-rose-800 border-rose-300',
        icon: 'text-rose-600',
        leftBorder: 'border-l-rose-400 bg-rose-50/50',
      };
    case 'amber':
      return {
        badge: 'bg-amber-50/90 hover:bg-amber-100 text-amber-800 border-amber-300',
        icon: 'text-amber-600',
        leftBorder: 'border-l-amber-400 bg-amber-50/50',
      };
    case 'blue':
      return {
        badge: 'bg-blue-50/90 hover:bg-blue-100 text-blue-800 border-blue-300',
        icon: 'text-blue-600',
        leftBorder: 'border-l-blue-400 bg-blue-50/50',
      };
    case 'emerald':
      return {
        badge: 'bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: 'text-emerald-600',
        leftBorder: 'border-l-emerald-400 bg-emerald-50/50',
      };
    case 'violet':
      return {
        badge: 'bg-violet-50/90 hover:bg-violet-100 text-violet-800 border-violet-300',
        icon: 'text-violet-600',
        leftBorder: 'border-l-violet-400 bg-violet-50/50',
      };
    case 'slate':
    default:
      return {
        badge: 'bg-slate-100/90 hover:bg-slate-200 text-slate-800 border-slate-300',
        icon: 'text-slate-600',
        leftBorder: 'border-l-slate-400 bg-slate-50/50',
      };
  }
}

function formatWhatsAppRelativeDate(dateStrOrObj: string | Date | null | undefined): string {
  if (!dateStrOrObj) return '';
  try {
    const d = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj;
    if (isNaN(d.getTime())) return '';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    
    const diffMs = today.getTime() - msgDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    
    if (diffDays === 0) {
      return `Today, ${timeStr}`;
    } else if (diffDays === 1) {
      return `Yesterday, ${timeStr}`;
    } else if (diffDays > 1 && diffDays < 7) {
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
      return `${weekday}, ${timeStr}`;
    } else {
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${dateStr}, ${timeStr}`;
    }
  } catch {
    return '';
  }
}

function formatConversationDate(dateStrOrObj: string | Date | null | undefined): string {
  if (!dateStrOrObj) return '';
  try {
    const d = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj;
    if (isNaN(d.getTime())) return '';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    
    const diffMs = today.getTime() - msgDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays > 1 && diffDays < 7) {
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (d.getFullYear() === now.getFullYear()) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
    }
  } catch {
    return '';
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

function formatRoleName(role?: string): string {
  if (!role) return 'Staff';
  const r = role.toLowerCase().trim();
  if (r === 'super_admin' || r === 'superadmin') return 'Super Admin';
  if (r === 'admin') return 'Admin';
  if (r === 'sales') return 'Sales Executive';
  if (r === 'marketing') return 'Marketing Specialist';
  if (r === 'doctor') return 'Doctor / Consultant';
  if (r === 'receptionist') return 'Receptionist';
  if (r === 'agent') return 'Support Agent';
  if (r === 'viewer') return 'Viewer';
  return role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ');
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

function FollowupTimeInput({
  value,
  onChange,
  placeholder = '10:00 AM',
  size = 'sm',
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  size?: 'sm' | 'md';
}) {
  const parseTime = (str: string) => {
    const raw = (str || '').trim();
    const match = raw.match(/^(\d{1,2})(?::(\d{1,2}))?\s*(AM|PM)?$/i);
    let h = 10;
    let m = 0;
    let p: 'AM' | 'PM' = 'AM';
    if (match) {
      let parsedH = parseInt(match[1], 10);
      m = match[2] ? parseInt(match[2], 10) : 0;
      if (match[3]) {
        p = match[3].toUpperCase() === 'PM' ? 'PM' : 'AM';
      } else if (parsedH >= 12) {
        p = 'PM';
        if (parsedH > 12) parsedH -= 12;
      }
      if (parsedH === 0) parsedH = 12;
      h = Math.min(Math.max(1, parsedH), 12);
      m = Math.min(Math.max(0, m), 59);
    }
    return { hour: h, minute: m, period: p };
  };

  const parsed = parseTime(value);

  const handlePeriodToggle = (targetPeriod: 'AM' | 'PM') => {
    if (parsed.period === targetPeriod) return;
    const hStr = String(parsed.hour).padStart(2, '0');
    const mStr = String(parsed.minute).padStart(2, '0');
    onChange(`${hStr}:${mStr} ${targetPeriod}`);
  };

  const handleRawChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleBlur = () => {
    if (value && value.trim()) {
      const p = parseTime(value);
      const hStr = String(p.hour).padStart(2, '0');
      const mStr = String(p.minute).padStart(2, '0');
      onChange(`${hStr}:${mStr} ${p.period}`);
    }
  };

  const isSmall = size === 'sm';

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        value={value || ''}
        onChange={handleRawChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`flex-1 min-w-0 ${
          isSmall ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-xs'
        } bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent font-mono`}
      />
      <div className="flex border border-border rounded-sm overflow-hidden text-[10px] font-semibold tracking-wider shrink-0 bg-surface">
        <button
          type="button"
          onClick={() => handlePeriodToggle('AM')}
          className={`px-2 py-1 transition-all cursor-pointer select-none ${
            parsed.period === 'AM'
              ? 'bg-accent text-white font-bold shadow-xs'
              : 'text-text-muted hover:text-text-primary hover:bg-surface-subtle'
          }`}
          title="Switch to Morning (AM)"
        >
          AM
        </button>
        <button
          type="button"
          onClick={() => handlePeriodToggle('PM')}
          className={`px-2 py-1 transition-all cursor-pointer select-none ${
            parsed.period === 'PM'
              ? 'bg-accent text-white font-bold shadow-xs'
              : 'text-text-muted hover:text-text-primary hover:bg-surface-subtle'
          }`}
          title="Switch to Evening (PM)"
        >
          PM
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage({ routeSlug }: { routeSlug?: string } = {}) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  
  // Navigation: overview | inbox | bookings | calendar | customers | repeat_clients | followup | marketing | settings | team
  const [activeNav, setActiveNav] = useState<'overview' | 'inbox' | 'bookings' | 'calendar' | 'customers' | 'repeat_clients' | 'followup' | 'marketing' | 'settings' | 'team'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const hash = window.location.hash.replace('#', '');
        const validTabs = ['overview', 'inbox', 'bookings', 'calendar', 'customers', 'repeat_clients', 'followup', 'marketing', 'settings', 'team'];
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
  const [settingsTab, setSettingsTab] = useState<'branding' | 'notifications' | 'localization' | 'terminology' | 'calendar' | 'account' | 'team'>('branding');

  // Live Google Calendar Slot Availability Tester in Dashboard Settings
  const [dashCalendarLoading, setDashCalendarLoading] = useState(false);
  const [dashCalendarAvailability, setDashCalendarAvailability] = useState<LiveCalendarAvailabilityResponse | null>(null);
  const [dashCalendarError, setDashCalendarError] = useState('');

  const handleTestDashCalendar = async () => {
    setDashCalendarLoading(true);
    setDashCalendarError('');
    try {
      const res = await crm.getLiveCalendarAvailability();
      setDashCalendarAvailability(res);
    } catch (err: any) {
      setDashCalendarError(err?.message || 'Failed to check Google Calendar availability.');
    } finally {
      setDashCalendarLoading(false);
    }
  };

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

  // ── Specialty / Department Filter State (Admin Department Switcher) ───────────
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

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
      setActionNotice('Real Web Push enabled! You will receive alerts even with the browser closed.');

      // Fire an immediate confirmation notification banner
      try {
        await reg.showNotification(`${settingsForm.name || 'CRM'} Web Push Enabled`, {
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
              await reg.showNotification(`${settingsForm.name || 'CRM'} Live Alert`, {
                body: 'Real notification is active on this device!',
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: `test-alert-${Date.now()}`,
                renotify: true,
                requireInteraction: true,
                data: { url: `/${settingsForm.slug || (typeof window !== 'undefined' ? localStorage.getItem('tenant_slug') : '') || 'dashboard'}` },
              } as any);
            }
          }
        } catch (localErr) {
          console.warn('Local showNotification warning:', localErr);
        }
      }

      // 2. Dispatches real backend VAPID Web Push via Google FCM / Apple Push
      await notificationsApi.sendTest();
      setActionNotice('Test push sent! If not visible on screen, check Windows Action Center (bottom right) or Mac Notifications.');
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

  // Notification polling is initialized after auth and tenant resolution are verified (see initWorkspace)

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

  // Floating Staff / Doctor Assignment Popover state (unified with Chat Header design)
  const [custAssignPopover, setCustAssignPopover] = useState<{
    targetType: 'customer' | 'drawer' | 'add_form' | 'quick_crm';
    customerId?: string;
    currentValue: string;
    top?: number;
    bottom?: number;
    left: number;
  } | null>(null);
  const [custAssignSearch, setCustAssignSearch] = useState('');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [followupStatusFilter, setFollowupStatusFilter] = useState<string>('all');
  const [followupProbabilityFilter, setFollowupProbabilityFilter] = useState<string>('all');
  const [followupDoctorFilter, setFollowupDoctorFilter] = useState<string>('all');
  const [followupActionFilter, setFollowupActionFilter] = useState<string>('all');
  const [followupSearch, setFollowupSearch] = useState<string>('');
  const [followupSearchInput, setFollowupSearchInput] = useState<string>('');
  const [customerClientTypeFilter, setCustomerClientTypeFilter] = useState<string>('all');

  // Debounce customer search input to prevent rapid request thrashing & race conditions
  useEffect(() => {
    const timer = setTimeout(() => {
      setFollowupSearch(followupSearchInput);
    }, 250);
    return () => clearTimeout(timer);
  }, [followupSearchInput]);

  // Repeat Clients Workspace State
  const [repeatHealthFilter, setRepeatHealthFilter] = useState<'all' | 'active' | 'due' | 'lapsed' | 'vip'>('all');
  const [repeatDoctorFilter, setRepeatDoctorFilter] = useState<string>('all');
  const [repeatSearch, setRepeatSearch] = useState<string>('');

  // Selected Customer Detail Drawer
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const [customerNotes, setCustomerNotes] = useState<CustomerNote[]>([]);
  const [loadingCustomerNotes, setLoadingCustomerNotes] = useState(false);
  const [newCustomerNoteText, setNewCustomerNoteText] = useState('');
  const [newCustomerNoteAuthor, setNewCustomerNoteAuthor] = useState('Admin');
  const [newCustomerNoteColor, setNewCustomerNoteColor] = useState('slate');
  const [addingCustomerNote, setAddingCustomerNote] = useState(false);
  const [drawerActiveTab, setDrawerActiveTab] = useState<'chat' | 'profile'>('chat');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // CRM Dropdown Options (Outcome statuses, Next actions, Services, Concerns)
  const [crmDropdowns, setCrmDropdowns] = useState<CrmDropdownOptions>({
    outcome_statuses: [
      'New (Fresh)', 'Not Picked', 'Out of Service / Busy', 'Wrong Number',
      'Info Given & Taken', 'Requirements Gathered', 'Pricing Sent',
      'Booking Requested', 'Confirmed', 'Converted'
    ],
    next_actions: [
      'Call Again', 'WhatsApp Only', 'Final Call Attempt',
      'Send Brochure / Info', 'Ask for Booking', 'Send Reminder',
      'Reschedule', 'No-Show Follow-up'
    ],
    services_list: [
      'Foot Reflexology', 'Acupuncture', 'Cupping', 'Ayurvedic', 'Consultation', 'Package'
    ],
    concerns_list: [
      'Knee pain', 'Neck pain', 'Sciatica', 'Diabetes', 'Stress', 'Sleep', 'Gut issue', 'Weight'
    ]
  });

  // Table row quick interaction states
  const [activeRatePopover, setActiveRatePopover] = useState<{ customerId: string; currentRate?: number } | null>(null);
  const [activeTimePopover, setActiveTimePopover] = useState<{ customerId: string; currentTime?: string } | null>(null);
  const [customTimeInput, setCustomTimeInput] = useState('');
  const [quickNoteCustomer, setQuickNoteCustomer] = useState<{ customerId: string; name: string } | null>(null);
  const [quickNoteText, setQuickNoteText] = useState('');
  const [quickNoteColor, setQuickNoteColor] = useState('slate');
  const [savingQuickNote, setSavingQuickNote] = useState(false);

  // ── CRM Dropdown Options Manager Modal ──────────────────────────────────────
  const [dropdownOptionsModalOpen, setDropdownOptionsModalOpen] = useState(false);
  const [dropdownActiveTab, setDropdownActiveTab] = useState<'outcome_statuses' | 'next_actions' | 'services_list' | 'concerns_list'>('outcome_statuses');
  const [editingDropdowns, setEditingDropdowns] = useState<CrmDropdownOptions>({
    outcome_statuses: [],
    next_actions: [],
    services_list: [],
    concerns_list: [],
  });
  const [newDropdownItemInput, setNewDropdownItemInput] = useState('');
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingItemText, setEditingItemText] = useState('');
  const [savingDropdownOptions, setSavingDropdownOptions] = useState(false);

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
  const [marketingSubTab, setMarketingSubTab] = useState<'broadcasts' | 'reengagement' | 'analytics'>('broadcasts');
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
  const [user, setUser] = useState<{ id?: string; tenant_id?: string; email?: string; role: string; name?: string; display_name?: string; permissions?: StaffPermissions } | null>(null);

  // Granular role-based permissions derived from logged-in user
  const perms = user?.permissions;
  const canViewInbox = perms ? perms.can_view_inbox !== false : true;
  const canSendMessages = perms ? perms.can_send_messages !== false : true;
  const canManageBookings = perms ? perms.can_manage_bookings !== false : true;
  const canViewCalendar = perms ? perms.can_view_calendar !== false : true;
  const canManageCustomers = perms ? perms.can_manage_customers !== false : true;
  const canManageMarketing = perms ? perms.can_manage_marketing !== false : true;
  const canViewAnalytics = perms ? perms.can_view_analytics !== false : true;
  const canManageSettings = perms ? perms.can_manage_settings !== false : true;

  // Conversations & Chat State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'new' | 'new_lead' | 'repeat' | 'important'>('all');

  // Feature 1: Analytics & Reports State
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'7d' | '30d' | '90d' | 'this_month' | 'all'>('30d');
  const [dashboardAnalyticsData, setDashboardAnalyticsData] = useState<DashboardAnalyticsData | null>(null);
  const [loadingDashboardAnalytics, setLoadingDashboardAnalytics] = useState(false);

  // Feature 2: WhatsApp Template Picker in Live Chat State
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedChatTemplate, setSelectedChatTemplate] = useState<any | null>(null);
  const [templateVariableValues, setTemplateVariableValues] = useState<Record<string, string>>({});
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [sendingChatTemplate, setSendingChatTemplate] = useState(false);

  // Feature 4: Staff Assignment Dropdown State
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
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
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);
  const [selectedBookingDetail, setSelectedBookingDetail] = useState<Booking | null>(null);
  const [isBookingDetailModalOpen, setIsBookingDetailModalOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('10:00');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [pendingAttendedBooking, setPendingAttendedBooking] = useState<{
    id: string;
    customer_name: string;
    service: string;
  } | null>(null);

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
    staff_member: '',
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
    admin_email?: string;
  }>({
    name: '',
    admin_name: '',
    admin_email: '',
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
    assistant_name: '',
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
    enable_auto_review: true,
    template_admin_notification: 'admin_notification',
    template_admin_reschedule_notice: 'admin_reschedule_notice',
    template_admin_human_request: 'admin_human_request',
    template_admin_cancellation_notice: 'admin_cancellation_notice',
    template_admin_daily_digest: 'admin_daily_digest',
    google_client_id: '',
    google_client_secret: '',
    google_refresh_token: '',
    google_calendar_id: 'primary',
    opening_time: '09:00',
    closing_time: '20:00',
    notification_email: '',
  });

  const availableHealthConcerns = useMemo(() => {
    const baseList = (settingsForm.taxonomy?.requirement_presets && settingsForm.taxonomy.requirement_presets.length > 0)
      ? settingsForm.taxonomy.requirement_presets
      : (PREBUILT_REQUIREMENTS_BY_INDUSTRY[settingsForm.industry || 'clinic'] || PREBUILT_REQUIREMENTS_BY_INDUSTRY.clinic);
    const fromCustomers = (customers || []).map((c) => c.health_concern).filter((c): c is string => Boolean(c && c.trim()));
    const set = new Set([...baseList, ...fromCustomers]);
    return Array.from(set).filter(Boolean);
  }, [settingsForm.taxonomy?.requirement_presets, settingsForm.industry, customers]);

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

  async function handleSaveDoctorPresetsList(newList: string[]) {
    setSavingDoctors(true);
    try {
      const updatedTaxonomy = {
        ...(settingsForm.taxonomy || currentTaxonomy),
        doctor_presets: newList,
        staff_presets: newList,
      };
      await crm.updateSettings({
        taxonomy: updatedTaxonomy,
      });
      setSettingsForm((prev) => ({
        ...prev,
        taxonomy: updatedTaxonomy,
      }));
      setActionNotice('Doctor & staff presets updated successfully.');
      setTimeout(() => setActionNotice(null), 2500);
    } catch (err) {
      console.error('Failed to save doctor presets list:', err);
      alert('Failed to save presets: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSavingDoctors(false);
    }
  }

  async function handleSaveDoctorsModal() {
    await handleSaveDoctorPresetsList(doctorEditList);
    setDoctorEditModalOpen(false);
  }

  // ── Team & Sales Credentials Management (Client / Tenant) ───────────────────
  const [teamList, setTeamList] = useState<StaffUser[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamSaving, setTeamSaving] = useState(false);
  const [teamError, setTeamError] = useState('');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState<StaffUser | null>(null);
  const [copiedLoginUrl, setCopiedLoginUrl] = useState(false);
  const [teamForm, setTeamForm] = useState<{
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
    role: 'sales',
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
      assigned_health_concerns: [],
    },
  });

  // Unified available doctors and staff across team accounts, presets, and customer records
  const availableDoctors = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();

    (teamList || []).forEach((m) => {
      const val = (m.display_name || m.email || '').trim();
      if (val && !seen.has(val.toLowerCase())) {
        seen.add(val.toLowerCase());
        list.push(val);
      }
    });

    (configuredDoctors || []).forEach((doc) => {
      const val = (doc || '').trim();
      if (val && !seen.has(val.toLowerCase())) {
        seen.add(val.toLowerCase());
        list.push(val);
      }
    });

    (customers || []).forEach((c) => {
      const val = (c.preferred_doctor || '').trim();
      if (val && !seen.has(val.toLowerCase())) {
        seen.add(val.toLowerCase());
        list.push(val);
      }
    });

    return list;
  }, [teamList, configuredDoctors, customers]);

  function getClientRoleDefaultPermissions(role: string, assignedDoctor: string = ''): StaffPermissions {
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

  async function loadTeamList() {
    setTeamLoading(true);
    setTeamError('');
    try {
      const list = await crm.listStaff();
      setTeamList(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setTeamError(err?.message || 'Failed to load organization team credentials.');
    } finally {
      setTeamLoading(false);
    }
  }

  function handleOpenCreateTeam(prefill?: { display_name?: string; role?: string; assigned_doctor?: string }) {
    setEditingTeamMember(null);
    const role = (prefill?.role as any) || 'sales';
    const assignedDoc = prefill?.assigned_doctor || (role === 'doctor' ? (prefill?.display_name || '') : '');
    setTeamForm({
      email: '',
      password: '',
      display_name: prefill?.display_name || '',
      role: role,
      is_active: true,
      permissions: {
        ...getClientRoleDefaultPermissions(role, assignedDoc),
        assigned_doctor: assignedDoc,
        assigned_health_concerns: [],
      },
    });
    setTeamError('');
    setShowTeamModal(true);
  }

  function handleOpenEditTeam(member: StaffUser) {
    setEditingTeamMember(member);
    const roleDefaults = getClientRoleDefaultPermissions(member.role, member.permissions?.assigned_doctor);
    const rawConcerns = member.permissions?.assigned_health_concerns;
    const assignedConcerns = Array.isArray(rawConcerns) ? rawConcerns : [];
    setTeamForm({
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
        assigned_health_concerns: assignedConcerns,
      },
    });
    setTeamError('');
    setShowTeamModal(true);
  }

  async function handleSaveTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!teamForm.email.trim()) {
      alert('Email address is required.');
      return;
    }
    if (!editingTeamMember && !teamForm.password.trim()) {
      alert('Password is required when creating a new team member.');
      return;
    }
    setTeamSaving(true);
    setTeamError('');
    try {
      if (editingTeamMember) {
        await crm.updateStaff(editingTeamMember.id, {
          display_name: teamForm.display_name.trim(),
          role: teamForm.role,
          permissions: teamForm.permissions,
          is_active: teamForm.is_active,
          ...(teamForm.password.trim() ? { password: teamForm.password.trim() } : {}),
        });
      } else {
        await crm.createStaff({
          email: teamForm.email.trim(),
          password: teamForm.password.trim(),
          display_name: teamForm.display_name.trim(),
          role: teamForm.role,
          permissions: teamForm.permissions,
        });
      }
      setShowTeamModal(false);
      setEditingTeamMember(null);
      await loadTeamList();
      setActionNotice('Team member credentials saved successfully.');
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      setTeamError(err?.message || 'Failed to save team member credentials.');
    } finally {
      setTeamSaving(false);
    }
  }

  async function handleDeleteTeam(userId: string, email: string) {
    if (!confirm(`Are you sure you want to remove login access for ${email}? This action cannot be undone.`)) {
      return;
    }
    setTeamLoading(true);
    try {
      await crm.deleteStaff(userId);
      await loadTeamList();
      setActionNotice(`Removed access for ${email}`);
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete team member');
    } finally {
      setTeamLoading(false);
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

  // ── Teams & Staff that were ACTUALLY added by the user / clinic ─────────────────
  const addedTeams = useMemo(() => {
    // Helper to normalize staff names and avoid duplicate entries like "Dr. Sameer" and "Dr. Sameer (Lead Consultant)"
    const normalizeName = (s: string) => s.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();

    // 1. All team members in this workspace
    const addedMembers = (teamList || []);
    
    // If the clinic has not created/added any team members yet, show 0 added teams
    if (addedMembers.length === 0) {
      return [];
    }

    const list: { id: string; label: string; kind: 'team' | 'staff' | 'specialty' }[] = [];
    const rolesPresent = new Set<string>();

    addedMembers.forEach((m) => {
      // Role-based functional team grouping
      if (m.role === 'sales') rolesPresent.add('Sales Team');
      else if (m.role === 'marketing') rolesPresent.add('Marketing Team');
      else if (m.role === 'receptionist') rolesPresent.add('Front Desk Team');
      else if (m.role === 'agent') rolesPresent.add('Support Team');
      else if (m.role && m.role !== 'admin' && m.role !== 'super_admin' && m.role !== 'doctor') {
        rolesPresent.add(`${m.role.charAt(0).toUpperCase() + m.role.slice(1)} Team`);
      }

      // Any explicit specialties/concerns assigned to this added member
      if (Array.isArray(m.permissions?.assigned_health_concerns)) {
        m.permissions.assigned_health_concerns.forEach((c: string) => {
          if (c && c.trim()) {
            const val = c.trim();
            const label = val.toLowerCase().endsWith('team') ? val : `${val} Team`;
            if (!list.some((item) => item.label.toLowerCase() === label.toLowerCase())) {
              list.push({ id: `specialty:${val}`, label, kind: 'specialty' });
            }
          }
        });
      }

      // Individual added staff/doctor member by name (cleaned of parenthesized suffixes)
      if (m.display_name && m.display_name.trim()) {
        const cleanName = m.display_name.replace(/\s*\([^)]*\)/g, '').trim();
        const norm = cleanName.toLowerCase();
        if (cleanName && !list.some((item) => normalizeName(item.label) === norm)) {
          list.push({ id: `staff:${cleanName}`, label: cleanName, kind: 'staff' });
        }
      }
    });

    rolesPresent.forEach((roleLabel) => {
      if (!list.some((item) => item.label.toLowerCase() === roleLabel.toLowerCase())) {
        list.push({ id: `role:${roleLabel}`, label: roleLabel, kind: 'team' });
      }
    });

    return list;
  }, [teamList, user?.id, currentTaxonomy.staff_label]);

  // Reset selectedDepartment to 'all' if selected option is no longer present
  useEffect(() => {
    if (selectedDepartment !== 'all' && !addedTeams.some((t) => t.label === selectedDepartment)) {
      setSelectedDepartment('all');
    }
  }, [addedTeams, selectedDepartment]);

  // Categorized staff options for Customer directory, Repeat Clients, Followups, Bookings, and Modals
  // Distinguishes Team Doctors (login), Sales Team (login), Doctor Presets (no login), and Administration
  const categorizedStaffOptions = useMemo(() => {
    const teamDoctors: { value: string; label: string; id?: string }[] = [];
    const salesMembers: { value: string; label: string; id?: string }[] = [];
    const otherMembers: { value: string; label: string; id?: string }[] = [];
    const predefinedDoctors: { value: string; label: string }[] = [];
    const seenValues = new Set<string>();

    // 1. From teamList (actual login users)
    (teamList || []).forEach((m) => {
      if (!m) return;
      const val = (m.display_name || m.email || '').trim();
      if (!val || seenValues.has(val.toLowerCase())) return;
      seenValues.add(val.toLowerCase());

      const roleLabel = formatRoleName(m.role);
      const item = { value: val, label: `${val} (${roleLabel})`, id: m.id };

      if (m.role === 'doctor') {
        teamDoctors.push(item);
      } else if (m.role === 'sales' || m.role === 'marketing') {
        salesMembers.push(item);
      } else {
        otherMembers.push(item);
      }
    });

    // 2. From configured doctor presets (names without login credentials)
    (configuredDoctors || []).forEach((doc) => {
      const trimmed = (doc || '').trim();
      if (!trimmed || seenValues.has(trimmed.toLowerCase())) return;
      seenValues.add(trimmed.toLowerCase());
      predefinedDoctors.push({ value: trimmed, label: `${trimmed} (Doctor Preset)` });
    });

    // 3. Custom assigned doctor from existing customers
    (customers || []).forEach((c) => {
      const doc = (c.preferred_doctor || '').trim();
      if (!doc || seenValues.has(doc.toLowerCase())) return;
      seenValues.add(doc.toLowerCase());
      predefinedDoctors.push({ value: doc, label: doc });
    });

    return {
      teamDoctors,
      sales: salesMembers,
      predefinedDoctors,
      other: otherMembers,
    };
  }, [teamList, configuredDoctors, customers]);

  function renderStaffSelectOptions(placeholder = '— Unassigned —') {
    return (
      <>
        <option value="">{placeholder}</option>
        {categorizedStaffOptions.teamDoctors.length > 0 && (
          <optgroup label="Doctors (Team Login)">
            {categorizedStaffOptions.teamDoctors.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </optgroup>
        )}
        {categorizedStaffOptions.sales.length > 0 && (
          <optgroup label="Sales & Support (Team Login)">
            {categorizedStaffOptions.sales.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </optgroup>
        )}
        {categorizedStaffOptions.predefinedDoctors.length > 0 && (
          <optgroup label="Doctors & Consultants (Predefined Presets)">
            {categorizedStaffOptions.predefinedDoctors.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </optgroup>
        )}
        {categorizedStaffOptions.other.length > 0 && (
          <optgroup label="Staff & Administration">
            {categorizedStaffOptions.other.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </optgroup>
        )}
      </>
    );
  }

  function getStaffRoleMeta(nameOrId?: string | null) {
    if (!nameOrId || !nameOrId.trim()) {
      return {
        role: 'unassigned' as const,
        label: 'Unassigned',
        badge: '',
        colorClass: 'border-border bg-surface hover:bg-surface-subtle text-text-muted hover:text-text-primary',
        icon: Users,
      };
    }
    const clean = nameOrId.trim().toLowerCase();

    // Check teamDoctors
    const teamDoc = categorizedStaffOptions.teamDoctors.find(
      (d) => d.value.toLowerCase() === clean || (d.id && d.id === nameOrId)
    );
    if (teamDoc) {
      return {
        role: 'team_doctor' as const,
        label: teamDoc.value,
        badge: 'Doctor',
        colorClass: 'border-blue-300 dark:border-blue-800/60 bg-blue-50/70 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/70',
        icon: Stethoscope,
      };
    }

    // Check sales
    const sales = categorizedStaffOptions.sales.find(
      (s) => s.value.toLowerCase() === clean || (s.id && s.id === nameOrId)
    );
    if (sales) {
      return {
        role: 'sales' as const,
        label: sales.value,
        badge: 'Sales',
        colorClass: 'border-amber-300 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/70',
        icon: User,
      };
    }

    // Check predefinedDoctors
    const presetDoc = categorizedStaffOptions.predefinedDoctors.find(
      (p) => p.value.toLowerCase() === clean
    );
    if (presetDoc) {
      return {
        role: 'preset_doctor' as const,
        label: presetDoc.value,
        badge: 'Preset',
        colorClass: 'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/70',
        icon: Stethoscope,
      };
    }

    // Check other (admin/staff)
    const other = categorizedStaffOptions.other.find(
      (o) => o.value.toLowerCase() === clean || (o.id && o.id === nameOrId)
    );
    if (other) {
      return {
        role: 'admin' as const,
        label: other.value,
        badge: 'Admin',
        colorClass: 'border-purple-300 dark:border-purple-800/60 bg-purple-50/70 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/70',
        icon: ShieldCheck,
      };
    }

    // Fallback: custom preset doctor name
    return {
      role: 'preset_doctor' as const,
      label: nameOrId,
      badge: 'Doctor',
      colorClass: 'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/70',
      icon: Stethoscope,
    };
  }

  const openCustomerAssignPopover = (
    targetType: 'customer' | 'drawer' | 'add_form' | 'quick_crm',
    customerId: string | undefined,
    currentValue: string,
    element: HTMLElement
  ) => {
    const rect = element.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const popoverHeight = 320;
    const openUpwards = spaceBelow < popoverHeight && rect.top > popoverHeight;

    const popoverWidth = 256;
    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - popoverWidth - 12);
    }

    setCustAssignPopover({
      targetType,
      customerId,
      currentValue: currentValue || '',
      top: openUpwards ? undefined : Math.min(window.innerHeight - popoverHeight, rect.bottom + 4),
      bottom: openUpwards ? window.innerHeight - rect.top + 4 : undefined,
      left,
    });
    setCustAssignSearch('');
  };

  const handleSelectCustAssignStaff = async (staffVal: string) => {
    if (!custAssignPopover) return;
    const { targetType, customerId } = custAssignPopover;
    setCustAssignPopover(null);
    setCustAssignSearch('');

    if (targetType === 'customer' && customerId) {
      await handleUpdateCustomer(customerId, { preferred_doctor: staffVal });
    } else if (targetType === 'drawer') {
      setDrawerDoctor(staffVal);
      if (selectedCustomer?.id) {
        await handleUpdateCustomer(selectedCustomer.id, { preferred_doctor: staffVal });
      }
    } else if (targetType === 'add_form') {
      setAddCustomerForm((prev) => ({ ...prev, preferred_doctor: staffVal }));
    } else if (targetType === 'quick_crm') {
      setQuickCrmDoctor(staffVal);
    }
  };

  function renderStaffAssignTrigger({
    value,
    onClick,
    className = '',
    placeholder = 'Unassigned',
    fullWidth = false,
  }: {
    value?: string | null;
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
    className?: string;
    placeholder?: string;
    fullWidth?: boolean;
  }) {
    const meta = getStaffRoleMeta(value);
    const IconComponent = meta.icon;
    const isAssigned = !!(value && value.trim());

    return (
      <button
        type="button"
        onClick={onClick}
        className={`px-2 py-0.5 rounded-sm text-[11px] font-medium border transition-colors cursor-pointer inline-flex items-center justify-between gap-1.5 shadow-xs ${meta.colorClass} ${
          fullWidth ? 'w-full py-1.5 text-xs' : 'max-w-[155px]'
        } ${className}`}
        title={isAssigned ? `Assigned to: ${meta.label} (${meta.badge || 'Staff'})` : 'Click to assign staff or doctor'}
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <IconComponent className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate text-[11px] font-medium">
            {isAssigned ? meta.label : placeholder}
          </span>
        </div>
        <ChevronDown className="w-3 h-3 opacity-60 shrink-0 ml-0.5" />
      </button>
    );
  }

  function renderCustomerAssignPopover() {
    if (!custAssignPopover) return null;
    const q = custAssignSearch.trim().toLowerCase();
    const currentVal = (custAssignPopover.currentValue || '').trim().toLowerCase();

    const filteredTeamDoctors = categorizedStaffOptions.teamDoctors.filter((d) => !q || d.value.toLowerCase().includes(q));
    const filteredSales = categorizedStaffOptions.sales.filter((s) => !q || s.value.toLowerCase().includes(q));
    const filteredPresets = categorizedStaffOptions.predefinedDoctors.filter((p) => !q || p.value.toLowerCase().includes(q));
    const filteredOther = categorizedStaffOptions.other.filter((o) => !q || o.value.toLowerCase().includes(q));

    const totalCount =
      categorizedStaffOptions.teamDoctors.length +
      categorizedStaffOptions.sales.length +
      categorizedStaffOptions.predefinedDoctors.length +
      categorizedStaffOptions.other.length;

    return (
      <>
        <div
          className="fixed inset-0 z-[100]"
          onClick={() => {
            setCustAssignPopover(null);
            setCustAssignSearch('');
          }}
        />
        <div
          className="fixed z-[101] w-64 bg-surface border border-border rounded-md shadow-2xl py-1 text-xs divide-y divide-border/40 animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: custAssignPopover.top !== undefined ? `${custAssignPopover.top}px` : undefined,
            bottom: custAssignPopover.bottom !== undefined ? `${custAssignPopover.bottom}px` : undefined,
            left: `${custAssignPopover.left}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-2.5 py-1.5 flex items-center justify-between bg-surface-subtle/40">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Assign Staff / Doctor
            </span>
            {teamLoading && <RefreshCw className="w-2.5 h-2.5 animate-spin text-accent" />}
          </div>

          {/* Quick search input */}
          {totalCount > 4 && (
            <div className="p-1.5 bg-surface">
              <div className="relative">
                <Search className="w-3 h-3 text-text-muted absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={custAssignSearch}
                  onChange={(e) => setCustAssignSearch(e.target.value)}
                  placeholder="Search staff or doctor..."
                  className="w-full pl-6 pr-2 py-0.5 text-[11px] bg-surface-subtle border border-border rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Scrollable list */}
          <div className="max-h-64 overflow-y-auto py-1 divide-y divide-border/20">
            {/* Unassigned Option */}
            {(!q || 'unassigned'.includes(q)) && (
              <button
                type="button"
                onClick={() => handleSelectCustAssignStaff('')}
                className={`w-full text-left px-2.5 py-1.5 flex items-center justify-between text-xs hover:bg-surface-subtle transition-colors cursor-pointer ${
                  !currentVal ? 'text-accent font-semibold bg-accent/5' : 'text-text-secondary'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <UserX className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <span className="truncate text-[11px]">Unassigned</span>
                </div>
                {!currentVal && <Check className="w-3 h-3 text-accent shrink-0" />}
              </button>
            )}

            {/* 1. Doctors (Team Login) */}
            {filteredTeamDoctors.length > 0 && (
              <div className="py-1">
                <div className="px-2.5 py-0.5 text-[9px] font-bold text-text-muted uppercase tracking-wider">
                  Doctors (Team Login)
                </div>
                {filteredTeamDoctors.map((doc) => {
                  const isActive = currentVal === doc.value.toLowerCase() || (doc.id && custAssignPopover.currentValue === doc.id);
                  return (
                    <button
                      key={doc.value}
                      type="button"
                      onClick={() => handleSelectCustAssignStaff(doc.value)}
                      className={`w-full text-left px-2.5 py-1 flex items-center justify-between text-xs hover:bg-surface-subtle transition-colors cursor-pointer ${
                        isActive ? 'text-accent font-semibold bg-accent/5' : 'text-text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Stethoscope className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="truncate text-[11px]">{doc.value}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <span className="text-[9px] px-1 py-0.2 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-medium">Doctor</span>
                        {isActive && <Check className="w-3 h-3 text-accent shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 2. Sales & Support */}
            {filteredSales.length > 0 && (
              <div className="py-1">
                <div className="px-2.5 py-0.5 text-[9px] font-bold text-text-muted uppercase tracking-wider">
                  Sales & Support
                </div>
                {filteredSales.map((mem) => {
                  const isActive = currentVal === mem.value.toLowerCase() || (mem.id && custAssignPopover.currentValue === mem.id);
                  return (
                    <button
                      key={mem.value}
                      type="button"
                      onClick={() => handleSelectCustAssignStaff(mem.value)}
                      className={`w-full text-left px-2.5 py-1 flex items-center justify-between text-xs hover:bg-surface-subtle transition-colors cursor-pointer ${
                        isActive ? 'text-accent font-semibold bg-accent/5' : 'text-text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="truncate text-[11px]">{mem.value}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 font-medium">Sales</span>
                        {isActive && <Check className="w-3 h-3 text-accent shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 3. Doctors (Presets) */}
            {filteredPresets.length > 0 && (
              <div className="py-1">
                <div className="px-2.5 py-0.5 text-[9px] font-bold text-text-muted uppercase tracking-wider">
                  Doctors (Presets)
                </div>
                {filteredPresets.map((preset) => {
                  const isActive = currentVal === preset.value.toLowerCase();
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handleSelectCustAssignStaff(preset.value)}
                      className={`w-full text-left px-2.5 py-1 flex items-center justify-between text-xs hover:bg-surface-subtle transition-colors cursor-pointer ${
                        isActive ? 'text-accent font-semibold bg-accent/5' : 'text-text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Stethoscope className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="truncate text-[11px]">{preset.value}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-medium">Preset</span>
                        {isActive && <Check className="w-3 h-3 text-accent shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 4. Staff & Administration */}
            {filteredOther.length > 0 && (
              <div className="py-1">
                <div className="px-2.5 py-0.5 text-[9px] font-bold text-text-muted uppercase tracking-wider">
                  Staff & Administration
                </div>
                {filteredOther.map((mem) => {
                  const isActive = currentVal === mem.value.toLowerCase() || (mem.id && custAssignPopover.currentValue === mem.id);
                  return (
                    <button
                      key={mem.value}
                      type="button"
                      onClick={() => handleSelectCustAssignStaff(mem.value)}
                      className={`w-full text-left px-2.5 py-1 flex items-center justify-between text-xs hover:bg-surface-subtle transition-colors cursor-pointer ${
                        isActive ? 'text-accent font-semibold bg-accent/5' : 'text-text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                        <span className="truncate text-[11px]">{mem.value}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <span className="text-[9px] px-1 py-0.2 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 font-medium">Admin</span>
                        {isActive && <Check className="w-3 h-3 text-accent shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Empty search results */}
            {q && !filteredTeamDoctors.length && !filteredSales.length && !filteredPresets.length && !filteredOther.length && (
              <div className="py-4 text-center text-text-muted text-[11px]">
                No staff or doctors found matching &ldquo;{custAssignSearch}&rdquo;
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-2.5 py-1.5 bg-surface-subtle/30 flex items-center justify-between text-[10px]">
            <button
              type="button"
              onClick={() => {
                setCustAssignPopover(null);
                openDoctorEditor();
              }}
              className="text-accent hover:underline font-medium flex items-center gap-1 cursor-pointer"
            >
              <Users className="w-3 h-3" /> Manage Staff & Presets
            </button>
          </div>
        </div>
      </>
    );
  }

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
  const convScrolledToBottomRef = useRef<Record<string, boolean>>({});
  const hasAutoSelectedInitialChatRef = useRef<boolean>(false);

  // Instant scroll to bottom when opening/switching chats or receiving messages
  useIsomorphicLayoutEffect(() => {
    const el = messagesContainerRef.current;
    if (!el || !selectedConv) return;

    const convId = selectedConv.id;
    const isConvChange = lastSelectedConvIdRef.current !== convId;
    if (isConvChange) {
      lastSelectedConvIdRef.current = convId;
    }

    const hasMessages = Array.isArray(messages) && messages.length > 0;
    const hasScrolledThisConv = !!convScrolledToBottomRef.current[convId];

    const doScrollToBottom = (instant = true) => {
      if (!el) return;
      el.style.scrollBehavior = instant ? 'auto' : 'smooth';
      el.scrollTop = el.scrollHeight + 10000;
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'end' });
      }
    };

    // If switched chats OR if messages have loaded and haven't scrolled to bottom yet for this chat:
    if (isConvChange || (hasMessages && !hasScrolledThisConv)) {
      if (hasMessages) {
        convScrolledToBottomRef.current[convId] = true;
      }
      doScrollToBottom(true);
      requestAnimationFrame(() => doScrollToBottom(true));
      const t1 = setTimeout(() => doScrollToBottom(true), 30);
      const t2 = setTimeout(() => doScrollToBottom(true), 100);
      const t3 = setTimeout(() => doScrollToBottom(true), 250);
      const t4 = setTimeout(() => doScrollToBottom(true), 500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    } else {
      // In-stream update within same chat: stay pinned to bottom if user is already near bottom (within 350px)
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 350;
      if (isNearBottom) {
        doScrollToBottom(false);
      }
    }
  }, [selectedConv?.id, messages]);

  const getStickyNotesKey = (targetTenantId?: string) => {
    const tid = targetTenantId || settingsForm.tenant_id || (typeof window !== 'undefined' ? localStorage.getItem('tenant_id') || localStorage.getItem('tenant_slug') : '') || 'default';
    return `crm_sticky_notes_${tid}`;
  };

  // Initial Auth & Workspace Resolution
  useEffect(() => {
    let isCancelled = false;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const redirectParam = currentPath && currentPath !== '/' && currentPath !== '/login'
          ? `?redirect=${encodeURIComponent(currentPath)}`
          : '';
        window.location.replace(`/login${redirectParam}`);
      }
      return;
    }

    async function initWorkspace() {
      try {
        const data = await crm.getMe();
        if (isCancelled) return;

        // Determine effective target slug from props, params, or URL path
        const rawSlug = routeSlug || (params?.slug as string) || (typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : '') || '';
        const targetSlug = rawSlug && !['dashboard', 'login', 'bhuvanesh', 'admin'].includes(rawSlug.toLowerCase().trim())
          ? rawSlug.toLowerCase().trim()
          : '';

        let activeTenantId = targetSlug ? getCachedTenantId(targetSlug) : null;

        // 1. Regular client admin / agent: STRICT WORKSPACE LOCK
        if (data.role !== 'super_admin') {
          const userSlug = (data.tenant_slug || '').toLowerCase().trim();
          if (data.tenant_id) {
            localStorage.setItem('tenant_id', data.tenant_id);
            if (userSlug) registerTenantSlug(userSlug, data.tenant_id);
          }
          if (userSlug) {
            localStorage.setItem('tenant_slug', userSlug);
            // If user attempts to view a different tenant slug, bounce them back to their assigned workspace
            if (targetSlug && targetSlug !== userSlug && typeof window !== 'undefined') {
              window.location.replace(`/${userSlug}${window.location.hash || ''}`);
              return;
            }
            if (typeof window !== 'undefined' && (window.location.pathname === '/dashboard' || window.location.pathname === '/')) {
              window.history.replaceState(null, '', `/${userSlug}${window.location.hash || ''}`);
            }
          }
        } 
        // 2. Super Admin: Dynamic workspace resolution and switching
        else if (data.role === 'super_admin') {
          if (targetSlug) {
            if (!activeTenantId) {
              try {
                // Dynamically resolve target slug to tenant_id before executing any scoped API queries
                const resolved = await crm.resolveTenantBySlug(targetSlug);
                if (resolved && resolved.id) {
                  activeTenantId = resolved.id;
                  registerTenantSlug(targetSlug, resolved.id);
                  localStorage.setItem('tenant_id', resolved.id);
                  localStorage.setItem('tenant_slug', resolved.slug || targetSlug);
                }
              } catch (err) {
                console.warn('Could not resolve tenant by slug:', targetSlug, err);
              }
            } else {
              localStorage.setItem('tenant_id', activeTenantId);
              localStorage.setItem('tenant_slug', targetSlug);
            }
          } else if (typeof window !== 'undefined') {
            // Visiting /dashboard without slug: default to user's home tenant or resolved boldlabs
            const defaultSlug = data.tenant_slug || 'boldlabs';
            let defaultId = data.tenant_id || getCachedTenantId(defaultSlug);
            if (!defaultId) {
              try {
                const resolved = await crm.resolveTenantBySlug(defaultSlug);
                if (resolved?.id) {
                  defaultId = resolved.id;
                  registerTenantSlug(defaultSlug, resolved.id);
                }
              } catch {}
            }
            if (defaultId) localStorage.setItem('tenant_id', defaultId);
            if (defaultSlug) {
              localStorage.setItem('tenant_slug', defaultSlug);
              if (window.location.pathname === '/dashboard' || window.location.pathname === '/') {
                window.history.replaceState(null, '', `/${defaultSlug}${window.location.hash || ''}`);
              }
            }
          }
        }

        if (isCancelled) return;

        if (data.permissions) {
          const p = data.permissions;
          if (p.assigned_doctor) {
            setFollowupDoctorFilter(p.assigned_doctor);
          }
          if (p.can_view_analytics === false && activeNav === 'overview') {
            if (p.can_view_inbox !== false) setActiveNav('inbox');
            else if (p.can_manage_bookings !== false) setActiveNav('bookings');
            else if (p.can_view_calendar !== false) setActiveNav('calendar');
            else if (p.can_manage_customers !== false) setActiveNav('customers');
            else if (p.can_manage_marketing !== false) setActiveNav('marketing');
          }
        }

        // Preload global settings in background so terminology, branding, and theme load cleanly
        loadSettings();

        // Complete auth check and set user
        setUser(data);
        setIsAuthChecking(false);
      } catch {
        if (isCancelled) return;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          const currentPath = window.location.pathname;
          const redirectParam = currentPath && currentPath !== '/' && currentPath !== '/login'
            ? `?redirect=${encodeURIComponent(currentPath)}`
            : '';
          window.location.replace(`/login${redirectParam}`);
        }
      }
    }

    initWorkspace();

    return () => {
      isCancelled = true;
    };
  }, [routeSlug]);

  // Poll notifications and check push status once auth is established
  useEffect(() => {
    if (isAuthChecking || !user) return;
    fetchNotifications();
    checkPushStatus();
    const interval = setInterval(fetchNotifications, 12000);
    return () => clearInterval(interval);
  }, [isAuthChecking, user]);

  // Load Sticky Notes from localStorage (strictly isolated per tenant)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = getStickyNotesKey();
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setStickyNotes(parsed);
          }
        } catch (e) {
          console.error('Error parsing sticky notes', e);
        }
      } else {
        setStickyNotes([]);
      }
    }
  }, [settingsForm.tenant_id]);

  const saveStickyNotes = (notes: typeof stickyNotes) => {
    setStickyNotes(notes);
    if (typeof window !== 'undefined') {
      const key = getStickyNotesKey();
      localStorage.setItem(key, JSON.stringify(notes));
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

  // Load section data based on active tab (Coordinated Lazy Loading)
  useEffect(() => {
    if (isAuthChecking || !user) return;

    if (activeNav === 'overview') {
      loadDashboardAnalytics(analyticsPeriod);
      loadConversations();
      loadBookings(10);
      loadTeamList();
    } else if (activeNav === 'inbox') {
      loadConversations();
      loadTeamList();
    } else if (activeNav === 'bookings') {
      loadBookings();
    } else if (activeNav === 'calendar') {
      loadCalendarData();
    } else if (activeNav === 'customers' || activeNav === 'repeat_clients') {
      loadContacts();
      loadCustomers();
      crm.getCrmDropdownOptions().then((res) => { if (res && res.outcome_statuses) setCrmDropdowns(res); }).catch(() => {});
    } else if (activeNav === 'followup') {
      loadCustomers();
      loadTasks();
      crm.getCrmDropdownOptions().then((res) => { if (res && res.outcome_statuses) setCrmDropdowns(res); }).catch(() => {});
    } else if (activeNav === 'settings') {
      loadSettings();
      if (settingsTab === 'team') {
        loadTeamList();
      }
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
    } else if (activeNav === 'team') {
      loadTeamList();
    }
  }, [activeNav, isAuthChecking, user]);

  // Ensure team list is immediately loaded upon user authentication so staff assignment,
  // top-bar department filters, and role badges are ready across all tabs
  useEffect(() => {
    if (isAuthChecking || !user) return;
    loadTeamList();
  }, [isAuthChecking, user]);

  useEffect(() => {
    if (isAuthChecking || !user) return;
    if (activeNav === 'settings' && settingsTab === 'team') {
      loadTeamList();
    }
  }, [activeNav, settingsTab, isAuthChecking, user]);

  useEffect(() => {
    if (isAuthChecking || !user) return;
    if (activeNav === 'overview') {
      loadDashboardAnalytics(analyticsPeriod);
    }
  }, [analyticsPeriod, activeNav, isAuthChecking, user]);

  // Refetch customers when filter state changes (Instant responsive filtering)
  useEffect(() => {
    if (isAuthChecking || !user) return;
    if (activeNav === 'customers' || activeNav === 'followup' || activeNav === 'repeat_clients') {
      loadCustomers();
    }
  }, [followupStatusFilter, followupProbabilityFilter, followupDoctorFilter, followupActionFilter, followupSearch, customerClientTypeFilter, selectedDepartment, isAuthChecking, user]);

  // Refetch tasks when task filter changes
  useEffect(() => {
    if (isAuthChecking || !user) return;
    if (activeNav === 'customers' || activeNav === 'followup' || activeNav === 'repeat_clients') {
      loadTasks();
    }
  }, [taskFilter, isAuthChecking, user]);

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

  // Real-time live polling engine: fast 2.5s live sync for Inbox, 5s sync for Customers/Followup/Bookings, gentle sync for background
  const isPollingRef = useRef(false);
  useEffect(() => {
    if (isAuthChecking || !user) return;
    let isMounted = true;

    const poll = async () => {
      if (!isMounted || isPollingRef.current) return;
      if (typeof document !== 'undefined' && document.hidden) return; // Skip polling when tab is inactive
      if (isAuthChecking || !user) return;

      isPollingRef.current = true;
      try {
        const activeId = selectedConvRef.current?.id;

        // 1. Live Chat: Real-time message synchronization (every 2.5s when on inbox tab with open conversation)
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

        // 2. Real-time conversations list & unread indicators (ONLY when on inbox or overview tab)
        if (activeNav === 'inbox' || activeNav === 'overview') {
          try {
            const convs = await crm.getConversations();
            if (isMounted && Array.isArray(convs)) {
              const activeId = selectedConvRef.current?.id;
              const sanitizedConvs = convs.map((c) =>
                c.id === activeId ? { ...c, unread_count: 0 } : c
              );
              sanitizedConvs.sort((a, b) => {
                const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
                const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
                return timeB - timeA;
              });
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
        }

        // 3. Real-time Customers directory automatic live sync (when on customers, followup, or repeat_clients tab)
        if (activeNav === 'customers' || activeNav === 'followup' || activeNav === 'repeat_clients') {
          try {
            const fresh = await crm.getCustomers({
              status: followupStatusFilter,
              lead_probability: followupProbabilityFilter,
              preferred_doctor: followupDoctorFilter,
              next_action: followupActionFilter,
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
        if (currentCustId && (activeNav === 'customers' || activeNav === 'followup' || activeNav === 'repeat_clients')) {
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

    // 2500ms for live Inbox, 5000ms for Bookings / Customers, 8000ms for Calendar, 6000ms for Overview, 20000ms for other sections
    const pollIntervalMs = activeNav === 'inbox' ? 2500 : (activeNav === 'customers' || activeNav === 'followup' || activeNav === 'repeat_clients' || activeNav === 'bookings' ? 5000 : activeNav === 'calendar' ? 8000 : activeNav === 'overview' ? 6000 : 20000);
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
  }, [activeNav, followupStatusFilter, followupProbabilityFilter, followupDoctorFilter, followupActionFilter, followupSearch, isAuthChecking, user]);

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
      const staffVal = newBookingForm.staff_member.trim() || undefined;
      await crm.createBooking({
        contact_name: newBookingForm.contact_name.trim(),
        contact_phone: newBookingForm.contact_phone.trim(),
        service: newBookingForm.service.trim(),
        staff_member: staffVal,
        doctor_name: staffVal,
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
          staff_member: '',
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
      const selected = addedTeams.find((item) => item.label === selectedDepartment || item.id === selectedDepartment);
      let depConcern: string | undefined = undefined;
      let depDoctor: string | undefined = undefined;
      if (selectedDepartment !== 'all' && selected) {
        if (selected.kind === 'specialty') {
          depConcern = selected.id.replace('specialty:', '');
        } else if (selected.kind === 'staff') {
          depDoctor = selected.id.replace('staff:', '');
        }
      }

      const data = await crm.getCustomers({
        status: followupStatusFilter,
        lead_probability: followupProbabilityFilter,
        preferred_doctor: depDoctor || followupDoctorFilter,
        health_concern: depConcern,
        next_action: followupActionFilter,
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
        status: 'new',
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

  const handleSaveQuickNote = async () => {
    if (!quickNoteCustomer || !quickNoteText.trim()) return;
    setSavingQuickNote(true);
    try {
      await crm.addCustomerNote(quickNoteCustomer.customerId, {
        author: 'Staff',
        note_text: quickNoteText.trim(),
        color: quickNoteColor,
      });
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === quickNoteCustomer.customerId
            ? { ...c, notes_count: (c.notes_count || 0) + 1, latest_note: quickNoteText.trim(), latest_note_color: quickNoteColor }
            : c
        )
      );
      if (selectedCustomer && selectedCustomer.id === quickNoteCustomer.customerId) {
        setSelectedCustomer((prev) =>
          prev
            ? { ...prev, notes_count: (prev.notes_count || 0) + 1, latest_note: quickNoteText.trim(), latest_note_color: quickNoteColor }
            : null
        );
        crm.getCustomerNotes(quickNoteCustomer.customerId).then((nts) => {
          if (Array.isArray(nts)) setCustomerNotes(nts);
        }).catch(() => {});
      }
      setQuickNoteCustomer(null);
      setQuickNoteText('');
      setActionNotice('Note saved.');
      setTimeout(() => setActionNotice(null), 2500);
    } catch (err) {
      console.error('Failed to save quick note:', err);
      alert('Failed to save note.');
    } finally {
      setSavingQuickNote(false);
    }
  };

  function openDropdownOptionsModal() {
    setEditingDropdowns({
      outcome_statuses: [...(crmDropdowns.outcome_statuses || [])],
      next_actions: [...(crmDropdowns.next_actions || [])],
      services_list: [...(crmDropdowns.services_list || [])],
      concerns_list: [...(crmDropdowns.concerns_list || [])],
    });
    setNewDropdownItemInput('');
    setEditingItemIndex(null);
    setEditingItemText('');
    setDropdownOptionsModalOpen(true);
  }

  function handleAddDropdownItem() {
    const trimmed = newDropdownItemInput.trim();
    if (!trimmed) return;
    const currentList = editingDropdowns[dropdownActiveTab] || [];
    if (!currentList.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      setEditingDropdowns((prev) => ({
        ...prev,
        [dropdownActiveTab]: [...(prev[dropdownActiveTab] || []), trimmed],
      }));
    }
    setNewDropdownItemInput('');
  }

  function handleRemoveDropdownItem(itemToRemove: string) {
    setEditingDropdowns((prev) => ({
      ...prev,
      [dropdownActiveTab]: (prev[dropdownActiveTab] || []).filter((item) => item !== itemToRemove),
    }));
  }

  function handleStartEditItem(index: number, currentVal: string) {
    setEditingItemIndex(index);
    setEditingItemText(currentVal);
  }

  function handleSaveEditItem(index: number) {
    const trimmed = editingItemText.trim();
    if (!trimmed) return;
    setEditingDropdowns((prev) => {
      const list = [...(prev[dropdownActiveTab] || [])];
      list[index] = trimmed;
      return { ...prev, [dropdownActiveTab]: list };
    });
    setEditingItemIndex(null);
    setEditingItemText('');
  }

  function handleResetCategoryDefaults() {
    const defaults: Record<string, string[]> = {
      outcome_statuses: [
        'New (Fresh)', 'Not Picked', 'Out of Service / Busy', 'Wrong Number',
        'Info Given & Taken', 'Requirements Gathered', 'Pricing Sent',
        'Booking Requested', 'Confirmed', 'Converted'
      ],
      next_actions: [
        'Call Again', 'WhatsApp Only', 'Final Call Attempt',
        'Send Brochure / Info', 'Ask for Booking', 'Send Reminder',
        'Reschedule', 'No-Show Follow-up'
      ],
      services_list: [
        'Foot Reflexology', 'Acupuncture', 'Cupping', 'Ayurvedic', 'Consultation', 'Package'
      ],
      concerns_list: [
        'Knee pain', 'Neck pain', 'Sciatica', 'Diabetes', 'Stress', 'Sleep', 'Gut issue', 'Weight'
      ]
    };
    if (defaults[dropdownActiveTab]) {
      setEditingDropdowns((prev) => ({
        ...prev,
        [dropdownActiveTab]: [...defaults[dropdownActiveTab]],
      }));
    }
  }

  async function handleSaveAllDropdowns() {
    setSavingDropdownOptions(true);
    try {
      const res = await crm.updateCrmDropdownOptions(editingDropdowns);
      if (res && res.crm_dropdowns) {
        setCrmDropdowns(res.crm_dropdowns);
      } else {
        setCrmDropdowns(editingDropdowns);
      }
      setDropdownOptionsModalOpen(false);
      setActionNotice('Dropdown options saved successfully.');
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      console.error('Failed to save dropdown options:', err);
      alert('Failed to save dropdown options: ' + (err.message || 'Error'));
    } finally {
      setSavingDropdownOptions(false);
    }
  }

  async function handleSaveDrawerAttributes() {
    if (!selectedCustomer) return;
    setSavingDrawerAttributes(true);
    try {
      const docVal = drawerDoctor.trim();
      const patch = {
        health_concern: drawerConcern.trim() || undefined,
        age: drawerAge ? parseInt(drawerAge, 10) : undefined,
        location: drawerLocation.trim() || undefined,
        preferred_doctor: docVal || undefined,
      };
      await handleUpdateCustomer(selectedCustomer.id, patch as any);

      // Auto-assign active conversation if preferred doctor matches a team member
      if (docVal && selectedConv) {
        const matchedTeam = (teamList || []).find(
          (m) =>
            m.is_active !== false &&
            ((m.display_name || '').trim().toLowerCase() === docVal.toLowerCase() ||
             (m.email || '').trim().toLowerCase() === docVal.toLowerCase())
        );
        if (matchedTeam && selectedConv.assigned_to !== matchedTeam.id) {
          try {
            await handleAssignConversation(selectedConv.id, matchedTeam.id);
          } catch (assignErr) {
            console.warn('Auto-assign conversation from drawer doctor failed:', assignErr);
          }
        }
      }

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
        if (patch.followup_date !== undefined || patch.followup_time !== undefined) {
          loadTasks();
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
            ? { ...c, notes_count: (c.notes_count || 0) + 1, latest_note: newCustomerNoteText.trim(), latest_note_color: newCustomerNoteColor }
            : c
        )
      );
      setSelectedCustomer((prev) =>
        prev && prev.id === selectedCustomer.id
          ? { ...prev, notes_count: (prev.notes_count || 0) + 1, latest_note: newCustomerNoteText.trim(), latest_note_color: newCustomerNoteColor }
          : prev
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
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      console.error('Error sending WhatsApp message:', err);
      alert('Failed to send WhatsApp message.');
    } finally {
      setSendingCustomerReply(false);
    }
  }

  useEffect(() => {
    if (drawerActiveTab === 'chat' && customerChat?.messages?.length) {
      const timer = setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [drawerActiveTab, customerChat?.messages?.length, selectedCustomer?.id]);

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
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === overallNoteCustomerId
            ? { ...c, notes_count: (c.notes_count || 0) + 1, latest_note: overallNoteText.trim(), latest_note_color: overallNoteColor }
            : c
        )
      );
      if (selectedCustomer && selectedCustomer.id === overallNoteCustomerId) {
        setSelectedCustomer((prev) =>
          prev
            ? { ...prev, notes_count: (prev.notes_count || 0) + 1, latest_note: overallNoteText.trim(), latest_note_color: overallNoteColor }
            : null
        );
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
      if (typeof window !== 'undefined') {
        const slug = data?.slug || localStorage.getItem('tenant_slug');
        if (slug) {
          localStorage.setItem('tenant_slug', slug);
          if (window.location.pathname === '/dashboard' || window.location.pathname === '/') {
            window.history.replaceState(null, '', `/${slug}${window.location.hash || ''}`);
          }
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
        admin_name: settingsForm.admin_name,
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
        enable_auto_review: settingsForm.enable_auto_review,
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
        opening_time: settingsForm.opening_time,
        closing_time: settingsForm.closing_time,
        google_client_id: settingsForm.google_client_id,
        google_client_secret: settingsForm.google_client_secret,
        google_calendar_id: settingsForm.google_calendar_id,
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
      if (payload.admin_name) {
        setUser((prev) => (prev ? { ...prev, display_name: payload.admin_name } : null));
      }
      if (updated && updated.name !== undefined) {
        setSettingsForm((prev) => ({ ...prev, ...updated }));
        if (typeof window !== 'undefined') {
          const slug = updated.slug || settingsForm.slug || localStorage.getItem('tenant_slug');
          if (slug) {
            localStorage.setItem('tenant_slug', slug);
            if (window.location.pathname === '/dashboard' || window.location.pathname === '/') {
              window.history.replaceState(null, '', `/${slug}${window.location.hash || ''}`);
            }
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

  async function handleDashboardInitGoogleOAuth() {
    const cId = settingsForm.google_client_id?.trim();
    const cSec = settingsForm.google_client_secret?.trim();
    if (!cId || !cSec) {
      alert('Please enter both Google OAuth Client ID and Client Secret before signing in with Google.');
      return;
    }
    setConnectingGoogle(true);
    try {
      await handleSaveSettings();
      const res = await crm.initGoogleOAuth({
        client_id: cId,
        client_secret: cSec,
      });
      if (res.auth_url) {
        window.open(res.auth_url, '_blank', 'width=600,height=700');
        setActionNotice('Google OAuth authorization window opened. Complete consent to connect calendar.');
        setTimeout(() => setActionNotice(null), 5000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to initiate Google OAuth');
    } finally {
      setConnectingGoogle(false);
    }
  }

  async function handleDashboardDisconnectGoogle() {
    if (!confirm('Are you sure you want to disconnect your Google Calendar?')) return;
    setDisconnectingGoogle(true);
    try {
      await crm.disconnectGoogleCalendar();
      setSettingsForm(prev => ({ ...prev, google_calendar_configured: false }));
      setActionNotice('Google Calendar disconnected successfully.');
      setTimeout(() => setActionNotice(null), 3000);
      loadSettings();
    } catch (err: any) {
      alert(err.message || 'Failed to disconnect Google Calendar');
    } finally {
      setDisconnectingGoogle(false);
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
        sanitized.sort((a, b) => {
          const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
          const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
          return timeB - timeA;
        });
        setConversations(sanitized);

        // On desktop, only on very first load if on inbox tab and no conversation selected, auto-select the latest active conversation once
        if (
          !hasAutoSelectedInitialChatRef.current &&
          typeof window !== 'undefined' &&
          window.innerWidth >= 768 &&
          !selectedConvRef.current &&
          sanitized.length > 0 &&
          (activeNav === 'inbox' || window.location.hash === '#inbox')
        ) {
          hasAutoSelectedInitialChatRef.current = true;
          selectConversation(sanitized[0]);
        }
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

    // Reset scrolled flag so layout effect guarantees scroll to bottom for this conversation
    convScrolledToBottomRef.current[conv.id] = false;

    // Immediately clear unread badge in conversation list
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
    );

    // Instant switch: if messages were already loaded, show them instantly with 0ms delay and NO loading spinner!
    const cached = messagesCacheRef.current[conv.id];
    if (cached && cached.length > 0) {
      setMessages(cached);
      setLoadingMessages(false);
      scrollToBottom(true);
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
        scrollToBottom(true);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      if (activeConvIdRef.current === conv.id) {
        setLoadingMessages(false);
        scrollToBottom(true);
      }
    }
  }

  function scrollToBottom(instant = true) {
    const doScroll = () => {
      const el = messagesContainerRef.current;
      if (el) {
        el.style.scrollBehavior = instant ? 'auto' : 'smooth';
        el.scrollTop = el.scrollHeight + 10000;
      }
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'end' });
      }
    };
    doScroll();
    requestAnimationFrame(doScroll);
    setTimeout(doScroll, 20);
    setTimeout(doScroll, 80);
    setTimeout(doScroll, 180);
    setTimeout(doScroll, 350);
    setTimeout(doScroll, 600);
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

  async function handleDeleteMessage(msgId: string) {
    if (!selectedConv) return;
    try {
      const res = await crm.deleteMessage(msgId, 'for_me');
      setMessages((prev) => {
        const next = prev.filter((m) => m.id !== msgId);
        if (selectedConv) {
          messagesCacheRef.current[selectedConv.id] = next;
        }
        return next;
      });
    } catch (err) {
      console.error('Failed to delete message:', err);
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

  // ── Feature 1: Analytics & Reports Handlers ────────────────────────────────
  async function loadDashboardAnalytics(period: string = analyticsPeriod) {
    setLoadingDashboardAnalytics(true);
    try {
      const data = await crm.getDashboardAnalytics(period);
      setDashboardAnalyticsData(data);
    } catch (err) {
      console.error('Failed to load dashboard analytics:', err);
    } finally {
      setLoadingDashboardAnalytics(false);
    }
  }

  function exportAnalyticsToCsv() {
    if (!dashboardAnalyticsData) return;
    const s = dashboardAnalyticsData.summary;
    const rows = [
      ['Metric', 'Value'],
      ['Period', dashboardAnalyticsData.period],
      ['Total Messages', String(s.total_messages)],
      ['Inbound Messages', String(s.inbound_messages)],
      ['Outbound Messages', String(s.outbound_messages)],
      ['AI Handled Messages', String(s.ai_messages)],
      ['Human Handled Messages', String(s.human_messages)],
      ['Total Inbound Leads', String(s.total_leads)],
      ['Converted Leads', String(s.converted_leads)],
      ['Lead Conversion Rate (%)', String(s.conversion_rate)],
      ['Total Bookings', String(s.total_bookings)],
      ['Completed/Attended Visits', String(s.completed_bookings)],
      ['Attendance Rate (%)', String(s.attendance_rate)],
      ['Total Attended Revenue (INR)', String(s.total_revenue)],
      ['Average Ticket Size (INR)', String(s.average_ticket_size)],
      ['AI Autonomy Rate (%)', String(s.ai_autonomous_rate)],
      [],
      ['Date', 'Inbound Messages', 'Outbound Messages', 'Total Messages'],
      ...dashboardAnalyticsData.time_series.map((t) => [t.day, String(t.inbound), String(t.outbound), String(t.total)]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `whatsapp_crm_analytics_${analyticsPeriod}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ── Feature 2: WhatsApp Live Chat Template Picker Handlers ──────────────────
  function is24HourWindowExpired(conv?: Conversation | null): boolean {
    if (!conv) return false;
    const timeVal = conv.last_inbound_at || conv.last_message_at;
    if (!timeVal) return false;
    const diffMs = Date.now() - new Date(timeVal).getTime();
    return diffMs > 24 * 60 * 60 * 1000;
  }

  async function openChatTemplatePicker() {
    setShowTemplateModal(true);
    setTemplateSearchQuery('');
    setSelectedChatTemplate(null);
    setTemplateVariableValues({});
    if (marketingTemplates.length === 0) {
      await loadMarketingTemplates();
    }
  }

  function handleSelectTemplate(tpl: any) {
    setSelectedChatTemplate(tpl);
    const initialValues: Record<string, string> = {};
    if (selectedConv?.contact_name || selectedConv?.name) {
      initialValues['1'] = (selectedConv.contact_name || selectedConv.name || '').trim();
    }
    setTemplateVariableValues(initialValues);
  }

  async function handleSendSelectedTemplate() {
    if (!selectedConv || !selectedChatTemplate || sendingChatTemplate) return;
    setSendingChatTemplate(true);
    try {
      const varCount = selectedChatTemplate.variables_count || 0;
      const params: string[] = [];
      for (let i = 1; i <= varCount; i++) {
        params.push(templateVariableValues[String(i)] || '');
      }

      let resolvedBody = selectedChatTemplate.body || `[Template: ${selectedChatTemplate.name}]`;
      params.forEach((val, idx) => {
        resolvedBody = resolvedBody.replace(new RegExp(`\\{\\{${idx + 1}\\}\\}`, 'g'), val);
      });

      const sent = await crm.sendMessage(
        selectedConv.id,
        resolvedBody,
        selectedChatTemplate.name,
        params
      );

      setMessages((prev) => {
        const next = [...prev, sent];
        if (selectedConv) {
          messagesCacheRef.current[selectedConv.id] = next;
        }
        return next;
      });
      scrollToBottom();
      loadConversations();
      setShowTemplateModal(false);
      setSelectedChatTemplate(null);
      setTemplateVariableValues({});
      setActionNotice(`Template "${selectedChatTemplate.name}" dispatched successfully!`);
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      console.error('Failed to send template:', err);
      alert('Could not send WhatsApp template. Please verify your Meta Business template setup.');
    } finally {
      setSendingChatTemplate(false);
    }
  }

  // ── Feature 4: Multi-Staff & Doctor Assignment Handlers ───────────────────────
  async function handleAssignChatStaff(option: {
    type: 'unassign' | 'team' | 'preset';
    id?: string;
    name?: string;
  }) {
    if (!selectedConv) return;
    setShowAssignDropdown(false);
    const convId = selectedConv.id;
    const cleanPhone = (selectedConv.contact_phone || selectedConv.phone || '').replace(/[^0-9]/g, '');
    const matchedCust = cleanPhone && Array.isArray(customers)
      ? customers.find((c) => c && c.phone && c.phone.replace(/[^0-9]/g, '') === cleanPhone)
      : (selectedCustomer && selectedCustomer.phone && selectedCustomer.phone.replace(/[^0-9]/g, '') === cleanPhone ? selectedCustomer : null);

    if (option.type === 'unassign') {
      setSelectedConv((prev) => (prev && prev.id === convId ? { ...prev, assigned_to: null, assigned_staff_name: null, preferred_doctor: '' } : prev));
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, assigned_to: null, assigned_staff_name: null, preferred_doctor: '' } : c))
      );
      try {
        await crm.assignConversation(convId, null);
        if (matchedCust) {
          await handleUpdateCustomer(matchedCust.id, { preferred_doctor: '' });
        }
        setActionNotice('Chat unassigned');
        setTimeout(() => setActionNotice(null), 2500);
      } catch (err) {
        console.error('Failed to unassign conversation:', err);
        loadConversations();
      }
    } else if (option.type === 'team') {
      const staffId = option.id!;
      const staffName = option.name!;
      setSelectedConv((prev) => (prev && prev.id === convId ? { ...prev, assigned_to: staffId, assigned_staff_name: staffName, preferred_doctor: staffName } : prev));
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, assigned_to: staffId, assigned_staff_name: staffName, preferred_doctor: staffName } : c))
      );
      try {
        await crm.assignConversation(convId, staffId);
        if (matchedCust) {
          await handleUpdateCustomer(matchedCust.id, { preferred_doctor: staffName });
        }
        setActionNotice(`Chat assigned to ${staffName}`);
        setTimeout(() => setActionNotice(null), 2500);
      } catch (err) {
        console.error('Failed to assign conversation:', err);
        loadConversations();
      }
    } else if (option.type === 'preset') {
      const docName = option.name!;
      const matchingTeam = (teamList || []).find(
        (m) =>
          m.is_active !== false &&
          ((m.display_name || '').trim().toLowerCase() === docName.toLowerCase() ||
           (m.email || '').trim().toLowerCase() === docName.toLowerCase())
      );

      if (matchingTeam) {
        await handleAssignChatStaff({ type: 'team', id: matchingTeam.id, name: matchingTeam.display_name || matchingTeam.email });
        return;
      }

      setSelectedConv((prev) => (prev && prev.id === convId ? { ...prev, assigned_to: null, assigned_staff_name: null, preferred_doctor: docName } : prev));
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, assigned_to: null, assigned_staff_name: null, preferred_doctor: docName } : c))
      );
      try {
        await crm.assignConversation(convId, null);
        if (matchedCust) {
          await handleUpdateCustomer(matchedCust.id, { preferred_doctor: docName });
        } else if (cleanPhone) {
          try {
            const newCust = await crm.createCustomer({
              phone: selectedConv.contact_phone || selectedConv.phone || cleanPhone,
              name: selectedConv.contact_name || selectedConv.name || undefined,
              preferred_doctor: docName,
            });
            if (newCust && newCust.id) {
              setCustomers((prev) => [newCust, ...prev]);
            }
          } catch (e) {
            console.error('Failed to auto-create customer for preset doctor:', e);
          }
        }
        setActionNotice(`Assigned to ${docName}`);
        setTimeout(() => setActionNotice(null), 2500);
      } catch (err) {
        console.error('Failed to assign preset doctor:', err);
        loadConversations();
      }
    }
  }

  async function handleAssignConversation(convId: string, staffId: string | null) {
    if (staffId) {
      const assignedMember = teamList.find((m) => m.id === staffId);
      const staffName = assignedMember ? (assignedMember.display_name || assignedMember.email) : 'Staff';
      await handleAssignChatStaff({ type: 'team', id: staffId, name: staffName });
    } else {
      await handleAssignChatStaff({ type: 'unassign' });
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

  function promptMarkAttended(booking: { id: string; customer_name?: string; service?: string }) {
    setPendingAttendedBooking({
      id: booking.id,
      customer_name: booking.customer_name || 'Client',
      service: booking.service || 'Appointment',
    });
  }

  async function handleUpdateBookingStatus(bookingId: string, newStatus: string, newStartTime?: string, sendReview?: boolean) {
    setUpdatingBookingId(bookingId);
    setActionNotice(null);
    try {
      await crm.updateBookingStatus(bookingId, newStatus, newStartTime, undefined, sendReview);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus, ...(newStartTime ? { start_time: newStartTime } : {}) } : b))
      );
      if (selectedBookingDetail && selectedBookingDetail.id === bookingId) {
        setSelectedBookingDetail({ ...selectedBookingDetail, status: newStatus, ...(newStartTime ? { start_time: newStartTime } : {}) });
      }

      if (newStatus === 'completed') {
        if (sendReview === false) {
          setActionNotice('Client marked Attended! Review template was skipped.');
        } else {
          setActionNotice('Client marked Attended! Post-service review request template scheduled via WhatsApp.');
        }
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

  async function handleDeleteBooking(bookingId: string) {
    if (!window.confirm('Are you sure you want to permanently delete this cancelled booking? This action cannot be undone.')) {
      return;
    }
    setDeletingBookingId(bookingId);
    setActionNotice(null);
    try {
      await crm.deleteBooking(bookingId);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      setTotalBookings((prev) => Math.max(0, prev - 1));
      if (selectedBookingDetail && selectedBookingDetail.id === bookingId) {
        setIsBookingDetailModalOpen(false);
        setSelectedBookingDetail(null);
      }
      setActionNotice('Cancelled booking permanently deleted.');
      setTimeout(() => setActionNotice(null), 4000);
      loadBookings();
    } catch (err: any) {
      alert(err instanceof Error ? err.message : 'Failed to delete cancelled booking. Only cancelled bookings can be deleted.');
    } finally {
      setDeletingBookingId(null);
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

  function navigateTo(tab: 'overview' | 'inbox' | 'bookings' | 'calendar' | 'customers' | 'repeat_clients' | 'followup' | 'marketing' | 'settings' | 'team') {
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
    if (tab === 'inbox') {
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        if (!selectedConvRef.current && conversations.length > 0 && !hasAutoSelectedInitialChatRef.current) {
          hasAutoSelectedInitialChatRef.current = true;
          selectConversation(conversations[0]);
        }
      } else {
        setSelectedConv(null);
      }
    }
  }

  // Allow closing the active chat with the Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedConv) {
        setSelectedConv(null);
        activeConvIdRef.current = null;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedConv]);

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
        campaignForm.template_param2 || settingsForm.name || 'Our Team',
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
    localStorage.removeItem('tenant_slug');
    const noteKey = getStickyNotesKey();
    localStorage.removeItem(noteKey);
    localStorage.removeItem('boldlabs_sticky_notes');
    localStorage.removeItem('whatsapp_crm_important_chats');
    localStorage.removeItem('whatsapp_crm_custom_templates');
    localStorage.removeItem('whatsapp_crm_active_nav');
    localStorage.removeItem('whatsapp_crm_followup_view');
    try { sessionStorage.clear(); } catch {}
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
  const filteredConversations = (conversations || [])
    .filter((c) => {
      if (!c) return false;
      const phone = c.contact_phone || c.phone || '';
      const name = c.contact_name || c.name || '';
      const matchesSearch =
        phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (selectedDepartment !== 'all') {
        const selected = addedTeams.find((item) => item.label === selectedDepartment || item.id === selectedDepartment);
        const term = (selected ? selected.label : selectedDepartment).toLowerCase().replace(/\s+team$/i, '').trim();

        const phone = c.contact_phone || c.phone || '';
        const normPhone = phone.replace(/[^0-9]/g, '').slice(-10);
        const linkedCust = (customers || []).find((cu) => {
          const cuPhone = (cu.phone || '').replace(/[^0-9]/g, '').slice(-10);
          return cuPhone && cuPhone === normPhone;
        });

        const assignedStaff = (c.assigned_staff_name || '').toLowerCase();
        const preferredDoc = (linkedCust?.preferred_doctor || '').toLowerCase();
        const concern = (c.health_concern || linkedCust?.health_concern || '').toLowerCase();

        const matchesStaff = (assignedStaff && (assignedStaff.includes(term) || term.includes(assignedStaff))) ||
                             (preferredDoc && (preferredDoc.includes(term) || term.includes(preferredDoc)));
        const matchesConcern = concern && (concern.includes(term) || term.includes(concern));

        let matchesRole = false;
        if (selected?.kind === 'team') {
          if (selected.label.toLowerCase().includes('sales')) {
            const salesStaffNames = (teamList || []).filter(m => m.role === 'sales').map(m => (m.display_name || '').toLowerCase());
            matchesRole = salesStaffNames.some(name => name && (assignedStaff.includes(name) || preferredDoc.includes(name)));
          } else if (selected.label.toLowerCase().includes('marketing')) {
            const mktStaffNames = (teamList || []).filter(m => m.role === 'marketing').map(m => (m.display_name || '').toLowerCase());
            matchesRole = mktStaffNames.some(name => name && (assignedStaff.includes(name) || preferredDoc.includes(name)));
          }
        }

        if (!matchesStaff && !matchesConcern && !matchesRole) {
          return false;
        }
      }
      if (filter === 'new') {
        return (c.unread_count || 0) > 0;
      }
      if (filter === 'new_lead') {
        return c.client_type === 'new_lead' || (c.completed_bookings_count ?? 0) === 0;
      }
      if (filter === 'repeat') {
        return c.client_type === 'repeat' || (c.completed_bookings_count ?? 0) > 0;
      }
      if (filter === 'important') {
        return importantConvIds.includes(c.id);
      }
      return true;
    })
    .sort((a, b) => {
      const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return timeB - timeA;
    });

  const filteredBookings = (bookings || []).filter((b) => {
    if (!b) return false;
    const matchesSearch =
      (b.contact_name || '').toLowerCase().includes(bookingSearch.toLowerCase()) ||
      (b.contact_phone || '').toLowerCase().includes(bookingSearch.toLowerCase()) ||
      (b.service || '').toLowerCase().includes(bookingSearch.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedDepartment !== 'all') {
      const selected = addedTeams.find((item) => item.label === selectedDepartment || item.id === selectedDepartment);
      if (selected) {
        const bPhone = (b.contact_phone || '').replace(/[^0-9]/g, '').slice(-10);
        const linkedCust = (customers || []).find((cu) => {
          const cuPhone = (cu.phone || '').replace(/[^0-9]/g, '').slice(-10);
          return cuPhone && cuPhone === bPhone;
        });

        const doc = ((b as any).doctor || (b as any).assigned_doctor || (b as any).staff_member || linkedCust?.preferred_doctor || '').toLowerCase();
        const concern = ((b as any).health_concern || (b as any).service || linkedCust?.health_concern || '').toLowerCase();

        if (selected.kind === 'staff') {
          const term = selected.id.replace('staff:', '').toLowerCase();
          if (!doc.includes(term) && !term.includes(doc)) return false;
        } else if (selected.kind === 'specialty') {
          const term = selected.id.replace('specialty:', '').toLowerCase();
          if (!concern.includes(term) && !term.includes(concern)) return false;
        } else if (selected.kind === 'team') {
          if (selected.label.toLowerCase().includes('sales')) {
            const salesMembers = (teamList || []).filter(m => m.role === 'sales');
            const salesConcerns = salesMembers.flatMap(m => m.permissions?.assigned_health_concerns || []).map(c => c.toLowerCase());
            if (salesConcerns.length > 0) {
              if (!salesConcerns.some(sc => concern.includes(sc) || sc.includes(concern))) return false;
            }
          }
        }
      }
    }

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
          <span className="text-sm font-semibold text-white tracking-wide">{settingsForm.name ? `${settingsForm.name} CRM` : 'Client CRM'}</span>
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
              Organization: <span className="text-amber-400 font-semibold">{settingsForm.name || 'Your Organization'}</span>
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

  function renderTeamManagementView() {
    const loginPortalUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://crm.goboldlabs.com/login';
    // All staff accounts for this organization
    const addedMembers = teamList;
    const salesCount = addedMembers.filter((m) => m.role === 'sales').length;
    const marketingCount = addedMembers.filter((m) => m.role === 'marketing').length;
    const doctorCount = addedMembers.filter((m) => m.role === 'doctor').length;
    const adminCount = addedMembers.filter((m) => m.role === 'admin' || m.role === 'super_admin').length;
    const staffLabel = currentTaxonomy.staff_label ? currentTaxonomy.staff_label.split('/')[0].trim() : 'Staff';

    return (
      <div className="space-y-3">
        {/* Compact Clean Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
          <div>
            <h3 className="font-semibold text-sm text-text-primary flex items-center gap-2">
              <Users className="w-4 h-4 text-accent stroke-[1.5]" />
              <span>Team & Sales Access</span>
              <span className="text-[11px] font-mono text-text-muted bg-surface-subtle px-1.5 py-0.2 rounded border border-border">
                {addedMembers.length} {addedMembers.length === 1 ? 'member' : 'members'}
              </span>
            </h3>
            <p className="text-[11px] text-text-muted mt-0.5">
              Manage organization team credentials, login access, and role permissions.
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap shrink-0">
            {/* Quick role counts pill */}
            {addedMembers.length > 0 && (
              <div className="hidden md:flex items-center gap-1 mr-1 text-[11px]">
                {salesCount > 0 && (
                  <span className="px-2 py-0.5 rounded-sm bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
                    {salesCount} Sales
                  </span>
                )}
                {marketingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-sm bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-medium">
                    {marketingCount} Marketing
                  </span>
                )}
                {doctorCount > 0 && (
                  <span className="px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                    {doctorCount} {doctorCount === 1 ? staffLabel : `${staffLabel}s`}
                  </span>
                )}
                {adminCount > 0 && (
                  <span className="px-2 py-0.5 rounded-sm bg-surface-subtle text-text-muted border border-border font-medium">
                    {adminCount} Admin
                  </span>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(loginPortalUrl);
                  setCopiedLoginUrl(true);
                  setTimeout(() => setCopiedLoginUrl(false), 2500);
                }
              }}
              className="px-2.5 py-1 bg-surface hover:bg-surface-subtle border border-border text-text-secondary hover:text-text-primary text-xs font-medium rounded-sm transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              title="Copy login portal link"
            >
              {copiedLoginUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-medium text-[11px]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span className="text-[11px]">Copy Portal</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={loadTeamList}
              disabled={teamLoading}
              className="p-1 bg-surface hover:bg-surface-subtle border border-border text-text-muted hover:text-text-primary rounded-sm transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh team list"
            >
              <RefreshCw className={`w-3.5 h-3.5 stroke-[1.5] ${teamLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleOpenCreateTeam}
              className="px-3 py-1 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-sm transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {teamError && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-sm text-xs text-red-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{teamError}</span>
            </div>
            <button
              type="button"
              onClick={() => setTeamError('')}
              className="text-text-muted hover:text-text-primary p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Single Clean Table Card */}
        <div className="bg-surface rounded-sm border border-border overflow-hidden shadow-xs">
          <div className="px-3 py-1.5 border-b border-border bg-surface-subtle/50 flex items-center justify-between text-[11px] text-text-muted">
            <span className="font-medium text-text-secondary">Staff Accounts & Credentials</span>
            <span className="font-mono text-[10px]">Portal: {loginPortalUrl}</span>
          </div>

          {teamLoading ? (
            <div className="p-8 flex flex-col items-center justify-center gap-2 text-text-muted">
              <RefreshCw className="w-5 h-5 animate-spin text-accent" />
              <p className="text-xs">Loading team accounts...</p>
            </div>
          ) : addedMembers.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-surface-subtle border border-border flex items-center justify-center text-text-muted">
                <Users className="w-5 h-5 stroke-[1.5]" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-text-primary">No team accounts yet</h4>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Create accounts for your Sales Executives, {staffLabel}s, or Support Agents so they can log in directly.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenCreateTeam}
                className="px-3 py-1 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-sm transition-colors cursor-pointer flex items-center gap-1.5 mt-1 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-subtle/40 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    <th className="py-2 px-3">Staff Member</th>
                    <th className="py-2 px-2.5">Role</th>
                    <th className="py-2 px-2.5">Assignment</th>
                    <th className="py-2 px-2.5">Permissions</th>
                    <th className="py-2 px-2.5">Status</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {addedMembers.map((member) => {
                    const isSales = member.role === 'sales';
                    const isMarketing = member.role === 'marketing';
                    const isDoctor = member.role === 'doctor';
                    const isAdmin = member.role === 'admin' || member.role === 'super_admin';
                    const isReceptionist = member.role === 'receptionist';
                    const p = member.permissions || {};

                    return (
                      <tr key={member.id} className="hover:bg-surface-subtle/40 transition-colors">
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                              isSales ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' :
                              isMarketing ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30' :
                              isDoctor ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' :
                              isAdmin ? 'bg-accent/15 text-accent border border-accent/30' :
                              'bg-surface-subtle text-text-secondary border border-border'
                            }`}>
                              {(member.display_name || member.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-text-primary text-xs flex items-center gap-1.5">
                                <span>{member.display_name || 'Staff User'}</span>
                                {member.id === user?.id && (
                                  <span className="text-[10px] text-accent font-semibold bg-accent/10 px-1 py-0.2 rounded border border-accent/20">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-text-muted font-mono flex items-center gap-1">
                                <span>{member.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-2 px-2.5 whitespace-nowrap">
                          {isSales ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                              <Zap className="w-2.5 h-2.5" />
                              <span>Sales Executive</span>
                            </span>
                          ) : isMarketing ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25">
                              <Megaphone className="w-2.5 h-2.5" />
                              <span>Marketing</span>
                            </span>
                          ) : isDoctor ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                              <Stethoscope className="w-2.5 h-2.5" />
                              <span>{staffLabel}</span>
                            </span>
                          ) : isAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-accent/10 text-accent border border-accent/25">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              <span>Admin</span>
                            </span>
                          ) : isReceptionist ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25">
                              <span>Receptionist</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-surface-subtle text-text-secondary border border-border capitalize">
                              {member.role}
                            </span>
                          )}
                        </td>

                        <td className="py-2 px-2.5 text-xs">
                          {Array.isArray(p.assigned_health_concerns) && p.assigned_health_concerns.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[220px]">
                              {p.assigned_health_concerns.map((c: string) => (
                                <span
                                  key={c}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium whitespace-nowrap"
                                  title={c}
                                >
                                  <HeartPulse className="w-2.5 h-2.5 shrink-0" />
                                  <span>{c}</span>
                                </span>
                              ))}
                            </div>
                          ) : p.assigned_doctor ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-medium whitespace-nowrap">
                              <Stethoscope className="w-2.5 h-2.5" />
                              <span>{p.assigned_doctor}</span>
                            </span>
                          ) : isDoctor ? (
                            <span className="text-text-muted text-[11px] italic">All {staffLabel}s</span>
                          ) : isSales ? (
                            <span className="text-[10px] text-text-muted italic">All Concerns (General)</span>
                          ) : (
                            <span className="text-text-muted text-xs">—</span>
                          )}
                        </td>

                        <td className="py-2 px-2.5">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {p.can_view_inbox !== false && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-surface-subtle border border-border text-text-secondary">Inbox</span>
                            )}
                            {p.can_send_messages !== false && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-surface-subtle border border-border text-text-secondary">Send</span>
                            )}
                            {p.can_manage_bookings !== false && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-surface-subtle border border-border text-text-secondary">Bookings</span>
                            )}
                            {p.can_view_calendar !== false && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-surface-subtle border border-border text-text-secondary">Calendar</span>
                            )}
                            {p.can_manage_customers !== false && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-surface-subtle border border-border text-text-secondary">CRM</span>
                            )}
                            {p.can_manage_marketing && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 font-medium">Marketing</span>
                            )}
                            {p.can_view_analytics && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-accent/10 border border-accent/20 text-accent font-medium">Overview</span>
                            )}
                            {p.can_manage_settings && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-accent/10 border border-accent/20 text-accent font-medium">Settings</span>
                            )}
                          </div>
                        </td>

                        <td className="py-2 px-2.5 whitespace-nowrap">
                          {member.is_active ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-text-muted">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                              <span>Inactive</span>
                            </span>
                          )}
                        </td>

                        <td className="py-2 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditTeam(member)}
                              className="p-1 rounded hover:bg-surface-subtle text-text-secondary hover:text-text-primary border border-transparent hover:border-border transition-colors cursor-pointer"
                              title="Edit role & permissions"
                            >
                              <Edit2 className="w-3.5 h-3.5 stroke-[1.5]" />
                            </button>
                            {member.id !== user?.id && member.role !== 'super_admin' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTeam(member.id, member.email)}
                                className="p-1 rounded hover:bg-red-500/10 text-text-muted hover:text-red-500 border border-transparent hover:border-red-500/20 transition-colors cursor-pointer"
                                title="Remove team account"
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

        {/* Predefined Doctor & Staff Presets Section */}
        <div className="bg-surface rounded-sm border border-border overflow-hidden shadow-xs">
          <div className="px-3.5 py-2.5 border-b border-border bg-surface-subtle/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[1.5]" />
                <h4 className="font-semibold text-xs text-text-primary">
                  {staffLabel} Presets (Predefined Names &bull; No Login Required)
                </h4>
                <span className="text-[10px] font-mono text-text-muted bg-surface px-1.5 py-0.2 rounded border border-border">
                  {configuredDoctors.length} {configuredDoctors.length === 1 ? 'preset' : 'presets'}
                </span>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">
                Predefined doctor & staff names for solo clinics or visiting specialists without login accounts. To give someone their own login credentials & inbox, click <strong>Create Login Account</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={openDoctorEditor}
              className="px-2.5 py-1 bg-surface hover:bg-surface-subtle text-text-primary border border-border rounded-sm text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2]" />
              <span>Manage Presets</span>
            </button>
          </div>

          {configuredDoctors.length === 0 ? (
            <div className="p-6 text-center text-xs text-text-muted">
              No predefined doctor presets configured. Click &quot;Manage Presets&quot; to add names.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-subtle/30 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    <th className="py-2 px-3">{staffLabel} Name</th>
                    <th className="py-2 px-2.5">Account Status</th>
                    <th className="py-2 px-2.5">Assigned Patients</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {configuredDoctors.map((doc) => {
                    const matchedTeam = (teamList || []).find(
                      (m) =>
                        m.is_active !== false &&
                        ((m.display_name || '').trim().toLowerCase() === doc.trim().toLowerCase() ||
                         (m.email || '').trim().toLowerCase() === doc.trim().toLowerCase())
                    );
                    const patientCount = (customers || []).filter(
                      (c) => (c.preferred_doctor || '').trim().toLowerCase() === doc.trim().toLowerCase()
                    ).length;

                    return (
                      <tr key={doc} className="hover:bg-surface-subtle/30 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {doc.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-text-primary text-xs">{doc}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2.5">
                          {matchedTeam ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                              <span>Has Login Account ({formatRoleName(matchedTeam.role)})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                              <span>Preset (No Login)</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2.5 font-mono text-[11px] text-text-secondary">
                          {patientCount} {patientCount === 1 ? 'patient' : 'patients'}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {!matchedTeam ? (
                              <button
                                type="button"
                                onClick={() => {
                                  handleOpenCreateTeam({
                                    display_name: doc,
                                    role: 'doctor',
                                    assigned_doctor: doc,
                                  });
                                }}
                                className="px-2 py-0.5 bg-accent/10 hover:bg-accent text-accent hover:text-white border border-accent/30 hover:border-accent rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <UserPlus className="w-3 h-3" />
                                <span>Create Login Account</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenEditTeam(matchedTeam)}
                                className="text-[11px] text-text-muted hover:text-text-primary underline cursor-pointer"
                              >
                                Manage Account
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Remove preset "${doc}" from presets?`)) {
                                  const updated = configuredDoctors.filter((d) => d !== doc);
                                  handleSaveDoctorPresetsList(updated);
                                }
                              }}
                              className="p-1 text-text-muted hover:text-red-500 rounded hover:bg-red-500/10 cursor-pointer transition-colors"
                              title={`Remove ${doc}`}
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
      </div>
    );
  }

  function renderCustomerDetailDrawer() {
    if (!selectedCustomer) return null;

    const currentCustIndex = customers.findIndex((c) => c.id === selectedCustomer.id);
    const hasPrevCust = currentCustIndex > 0;
    const hasNextCust = currentCustIndex >= 0 && currentCustIndex < customers.length - 1;

    const goToPrevCustomer = () => {
      if (hasPrevCust) {
        handleSelectCustomer(customers[currentCustIndex - 1]);
      }
    };

    const goToNextCustomer = () => {
      if (hasNextCust) {
        handleSelectCustomer(customers[currentCustIndex + 1]);
      }
    };

    return (
      <div
        className={`fixed inset-0 z-50 md:relative md:inset-auto md:z-auto w-full ${
          isDrawerExpanded ? 'md:w-[760px] md:max-w-[60vw]' : 'md:w-[500px] xl:w-[560px]'
        } bg-surface border border-border md:rounded-sm flex flex-col shrink-0 overflow-hidden transition-all duration-200 shadow-2xl md:shadow-sm safe-area-pt safe-area-pb md:pt-0 md:pb-0`}
      >
        {/* Top Header: Customer info, Stepper navigation & controls */}
        <div className="p-3 border-b border-border flex items-center justify-between bg-surface-subtle/70 shrink-0 gap-2">
          {/* Left: Customer Name & Phone */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-bold text-xs text-text-primary flex items-center gap-1.5 truncate">
                <User className="w-3.5 h-3.5 text-accent stroke-[1.8] shrink-0" />
                <span className="truncate">{selectedCustomer.name || 'Customer Profile'}</span>
              </h4>
              {selectedCustomer.lead_probability && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-xs uppercase tracking-wider ${
                    selectedCustomer.lead_probability === 'hot'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : selectedCustomer.lead_probability === 'warm'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {selectedCustomer.lead_probability}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-text-muted mt-0.5 flex-wrap">
              <span>{selectedCustomer.phone}</span>
              {(selectedCustomer.age || selectedCustomer.location) && (
                <>
                  <span className="opacity-40">•</span>
                  <span className="font-sans">
                    {[selectedCustomer.age ? `${selectedCustomer.age}y` : null, selectedCustomer.location]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Stepper Navigation: [< Prev] [X / Y] [Next >] */}
          <div className="flex items-center gap-1.5 shrink-0">
            {customers.length > 1 && (
              <div className="flex items-center bg-surface border border-border rounded-md px-1 py-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={goToPrevCustomer}
                  disabled={!hasPrevCust}
                  className="p-1 text-text-secondary hover:text-text-primary hover:bg-surface-subtle rounded disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-colors"
                  title="Previous customer in list"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono font-medium text-text-muted select-none px-1.5 whitespace-nowrap">
                  {currentCustIndex >= 0 ? `${currentCustIndex + 1} / ${customers.length}` : '—'}
                </span>
                <button
                  type="button"
                  onClick={goToNextCustomer}
                  disabled={!hasNextCust}
                  className="p-1 text-text-secondary hover:text-text-primary hover:bg-surface-subtle rounded disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-colors"
                  title="Next customer in list"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Expand / Minimize */}
            <button
              type="button"
              onClick={() => setIsDrawerExpanded(!isDrawerExpanded)}
              className="p-1.5 text-text-muted hover:text-text-primary rounded-md hover:bg-surface-subtle transition-colors cursor-pointer"
              title={isDrawerExpanded ? 'Standard width' : 'Expand panel width'}
            >
              {isDrawerExpanded ? <Minimize2 className="w-3.5 h-3.5 stroke-[1.8]" /> : <Maximize2 className="w-3.5 h-3.5 stroke-[1.8]" />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={() => {
                setSelectedCustomer(null);
                setIsDrawerExpanded(false);
              }}
              className="p-1.5 text-text-muted hover:text-text-primary rounded-md hover:bg-surface-subtle transition-colors cursor-pointer"
              title="Close panel"
            >
              <X className="w-3.5 h-3.5 stroke-[1.8]" />
            </button>
          </div>
        </div>

        {/* Segmented Tab Header: [💬 WhatsApp Chat] and [📋 Profile & Notes] */}
        <div className="flex items-center border-b border-border bg-surface px-3 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setDrawerActiveTab('chat')}
            className={`pb-2 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              drawerActiveTab === 'chat'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp Chat</span>
            {customerChat?.messages && customerChat.messages.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-mono">
                {customerChat.messages.length}
              </span>
            )}
            {customerChat?.unread_count ? (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[9px] font-bold">
                {customerChat.unread_count} new
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setDrawerActiveTab('profile')}
            className={`pb-2 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              drawerActiveTab === 'profile'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <User className="w-3.5 h-3.5 text-accent" />
            <span>Profile & Notes</span>
            {customerNotes.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-subtle text-text-secondary border border-border font-mono">
                {customerNotes.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: WhatsApp Chat View */}
        {drawerActiveTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 bg-surface">
            {/* Top Sub-Bar with quick actions & Inbox link */}
            <div className="px-3 py-2 bg-surface-subtle/50 border-b border-border flex items-center justify-between gap-2 shrink-0 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[11px] text-text-secondary truncate">
                  {selectedCustomer.health_concern ? (
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-medium mr-1.5">
                      {selectedCustomer.health_concern}
                    </span>
                  ) : null}
                  {selectedCustomer.last_chat_at ? (
                    <span className="text-text-muted text-[10px] font-mono">
                      Active {formatWhatsAppRelativeDate(selectedCustomer.last_chat_at)}
                    </span>
                  ) : (
                    <span className="text-text-muted text-[10px]">WhatsApp conversation</span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    setLoadingCustomerChat(true);
                    try {
                      const chat = await crm.getCustomerChat(selectedCustomer.id);
                      setCustomerChat(chat);
                    } catch (e) {
                      console.error('Failed to refresh customer chat:', e);
                    } finally {
                      setLoadingCustomerChat(false);
                    }
                  }}
                  className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-surface transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                  title="Refresh conversation"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingCustomerChat ? 'animate-spin' : ''}`} />
                  <span className="text-[10px] hidden sm:inline">Refresh</span>
                </button>

                <button
                  type="button"
                  onClick={() => openChatForContact(selectedCustomer.phone)}
                  className="text-[11px] text-accent hover:underline flex items-center gap-0.5 font-medium cursor-pointer"
                  title="Open full conversation in Inbox tab"
                >
                  <span>Open in Inbox</span>
                  <ArrowUpRight className="w-3 h-3 stroke-[2]" />
                </button>
              </div>
            </div>

            {/* Chat Messages Thread */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-canvas/40 dark:bg-canvas/80 min-h-0">
              {loadingCustomerChat ? (
                <div className="flex flex-col items-center justify-center py-12 text-text-muted gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-accent" />
                  <p className="text-xs">Loading WhatsApp conversation...</p>
                </div>
              ) : !customerChat || !customerChat.messages || customerChat.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-text-muted text-center px-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 border border-emerald-200">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-text-primary">No WhatsApp messages yet</p>
                  <p className="text-[11px] text-text-muted mt-1 max-w-[260px]">
                    Use the reply box below to send a WhatsApp message directly to {selectedCustomer.name || selectedCustomer.phone}.
                  </p>
                </div>
              ) : (
                customerChat.messages.map((msg, idx) => {
                  const isInbound = msg.direction === 'inbound';
                  const currentDateKey = getMessageDateKey(msg.created_at);
                  const prevDateKey = idx > 0 ? getMessageDateKey(customerChat.messages[idx - 1]?.created_at) : null;
                  const showDateDivider = idx === 0 || (Boolean(currentDateKey) && currentDateKey !== prevDateKey);

                  return (
                    <Fragment key={msg.id || idx}>
                      {showDateDivider && (
                        <div className="flex justify-center my-2 select-none pointer-events-none">
                          <span
                            className="px-2.5 py-0.5 rounded-md text-[10px] font-medium tracking-wide uppercase bg-surface/90 dark:bg-zinc-800/90 backdrop-blur-xs text-text-secondary border border-border/70 shadow-2xs pointer-events-auto"
                            title={formatFullDateTimeDetailed(msg.created_at)}
                          >
                            {formatMessageDateDivider(msg.created_at)}
                          </span>
                        </div>
                      )}
                      <div className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}>
                        <div
                          className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-3 py-2 text-xs shadow-2xs ${
                            isInbound
                              ? 'bg-surface text-text-body border border-border rounded-bl-xs'
                              : 'bg-emerald-600 text-white rounded-br-xs'
                          }`}
                        >
                          {msg.media_url && (
                            <div className="mb-1.5 rounded-lg overflow-hidden max-w-[240px]">
                              <img src={msg.media_url} alt="Media" className="w-full h-auto object-cover max-h-48" />
                            </div>
                          )}
                          <p className="leading-relaxed whitespace-pre-wrap">{getDisplayMessageBody(msg)}</p>
                          <div
                            className={`text-[9px] mt-1 flex items-center justify-end gap-1 font-mono ${
                              isInbound ? 'text-text-muted' : 'text-emerald-100'
                            }`}
                            title={formatFullDateTimeDetailed(msg.created_at)}
                          >
                            <span>{formatTime12(msg.created_at)}</span>
                            {!isInbound && (
                              <CheckCheck className="w-3 h-3 stroke-[2] text-emerald-200" />
                            )}
                          </div>
                        </div>
                      </div>
                    </Fragment>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Reply Form */}
            <form onSubmit={handleSendCustomerReply} className="p-2.5 border-t border-border bg-surface flex gap-2 items-center shrink-0">
              <input
                type="text"
                value={customerReplyText}
                onChange={(e) => setCustomerReplyText(e.target.value)}
                placeholder={`Reply to ${selectedCustomer.name || selectedCustomer.phone} on WhatsApp...`}
                className="flex-1 px-3 py-2 text-xs bg-surface-subtle border border-border rounded-md text-text-primary focus:outline-none focus:border-emerald-600 focus:bg-surface transition-colors"
              />
              <button
                type="submit"
                disabled={!customerReplyText.trim() || sendingCustomerReply}
                className="h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs"
              >
                <Send className="w-3.5 h-3.5 stroke-[2]" />
                <span>{sendingCustomerReply ? 'Sending...' : 'Send'}</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: Profile, Notes & Follow-up View */}
        {drawerActiveTab === 'profile' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
            {/* WhatsApp Quick Jump Banner */}
            <div
              onClick={() => setDrawerActiveTab('chat')}
              className="p-2.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-sm flex items-center justify-between cursor-pointer transition-colors group"
              title="Switch to WhatsApp Chat tab"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-emerald-950 flex items-center gap-1.5">
                    <span>WhatsApp Conversation</span>
                    {customerChat?.unread_count ? (
                      <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[9px] font-bold">
                        {customerChat.unread_count} new
                      </span>
                    ) : null}
                  </p>
                  {selectedCustomer.last_message ? (
                    <p className="text-[11px] text-emerald-800 truncate italic">
                      "{selectedCustomer.last_message}"
                    </p>
                  ) : (
                    <p className="text-[10px] text-emerald-700">
                      Click to read conversation & send replies
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 group-hover:text-emerald-800 shrink-0">
                <span>View Chat</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

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
                  {renderStaffAssignTrigger({
                    value: drawerDoctor,
                    onClick: (e) => {
                      e.stopPropagation();
                      openCustomerAssignPopover('drawer', selectedCustomer?.id, drawerDoctor, e.currentTarget);
                    },
                    placeholder: `— Select ${currentTaxonomy.staff_label || 'Staff / Doctor'} —`,
                    fullWidth: true,
                  })}
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
                  <FollowupTimeInput
                    value={selectedCustomer.followup_time || '10:00 AM'}
                    onChange={(newTime) => handleUpdateCustomer(selectedCustomer.id, { followup_time: newTime })}
                    size="sm"
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
                    const noteStyle = getNoteBadgeStyle(nt.color);
                    return (
                      <div key={nt.id} className={`pl-2.5 pr-2.5 py-2 border rounded-sm space-y-1 ${noteStyle.leftBorder}`}>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className={`font-semibold px-1.5 py-0.5 rounded-sm text-[10px] ${noteStyle.badge}`}>{nt.author}</span>
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

            {/* 4. Bookings & Revenue */}
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

            {/* 5. 2-Step Permanent Deletion */}
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
        )}
      </div>
    );
  }


  return (
    <div className="w-full h-screen bg-canvas flex flex-col overflow-hidden font-sans text-text-body">
      {/* ── Top Header Navigation Bar ───────────────────────────────────────── */}
      <header className="h-12 sm:h-14 px-3 sm:px-6 border-b border-border flex items-center justify-between shrink-0 bg-surface/95 backdrop-blur-sm z-30">
        {/* Logo & Current View Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-[17px] text-text-primary tracking-tight">
              {settingsForm.name || 'Client CRM'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-border">
            <span className="text-[13px] font-medium text-text-muted">
              / {activeNav === 'overview' ? 'Overview' : activeNav === 'inbox' ? 'Chats' : activeNav === 'bookings' ? 'Bookings' : activeNav === 'calendar' ? 'Calendar schedule' : activeNav === 'customers' ? 'Customer directory' : activeNav === 'repeat_clients' ? 'Repeat Clients' : activeNav === 'followup' ? 'Customer Followup' : activeNav === 'marketing' ? 'Marketing' : activeNav === 'team' ? 'Team & Sales' : 'Settings'}
            </span>
          </div>

          {/* Admin Department Switcher */}
          {(user?.role === 'admin' || user?.role === 'super_admin') && (
            <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-border">
              <Building2 className="w-3.5 h-3.5 text-text-muted stroke-[1.5]" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="bg-surface-subtle border border-border rounded-sm px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent cursor-pointer font-medium"
                title="Filter entire CRM workspace by team or staff"
              >
                <option value="all">All Departments (Admin View)</option>
                {addedTeams.length === 0 ? (
                  <option value="" disabled>
                    No teams added yet
                  </option>
                ) : (
                  addedTeams.map((item) => (
                    <option key={item.id} value={item.label}>
                      {item.label}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* Sales Rep Active Specialty Indicator */}
          {user?.role !== 'admin' && user?.role !== 'super_admin' && (user?.permissions?.assigned_health_concerns?.length ?? 0) > 0 && (
            <div className="hidden md:flex items-center gap-1 pl-3 border-l border-border text-[11px]">
              <span className="text-text-muted">Specialty:</span>
              <span className="px-1.5 py-0.5 bg-accent/10 text-accent font-medium rounded-sm border border-accent/20">
                {user?.permissions?.assigned_health_concerns?.join(', ')}
              </span>
            </div>
          )}
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

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-text-primary leading-none">
                {user?.display_name || user?.email?.split('@')[0] || 'Staff'}
              </span>
              <span className="text-[10px] text-text-muted capitalize">
                {user?.permissions?.assigned_doctor ? user.permissions.assigned_doctor : formatRoleName(user?.role)}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-sm transition-colors duration-150 cursor-pointer"
              title="Log out of session"
            >
              <LogOut className="w-4 h-4 stroke-[1.5]" />
            </button>
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
              {canViewAnalytics && (
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
              )}

              {canViewInbox && (
                <button
                  onClick={() => {
                    if (activeNav === 'inbox') {
                      if (selectedConv) {
                        setSelectedConv(null);
                        activeConvIdRef.current = null;
                      } else {
                        navigateTo('overview');
                      }
                    } else {
                      navigateTo('inbox');
                    }
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs transition-colors duration-150 cursor-pointer ${
                    activeNav === 'inbox'
                      ? 'bg-surface-subtle text-text-primary font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle font-medium'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 stroke-[1.5] shrink-0" />
                  <span>Chats</span>
                </button>
              )}

              {canManageCustomers && (
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
              )}

              {canManageCustomers && (
                <button
                  onClick={() => navigateTo('repeat_clients')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-sm text-xs transition-colors duration-150 cursor-pointer ${
                    activeNav === 'repeat_clients'
                      ? 'bg-surface-subtle text-text-primary font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UserCheck className={`w-4 h-4 stroke-[1.5] shrink-0 ${activeNav === 'repeat_clients' ? 'text-amber-500' : 'text-text-muted'}`} />
                    <span>Repeat Clients</span>
                  </div>
                  {customers.filter(c => (c.completed_bookings_count ?? 0) > 0 || c.client_type === 'repeat').length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 font-semibold border border-amber-500/20 font-mono">
                      {customers.filter(c => (c.completed_bookings_count ?? 0) > 0 || c.client_type === 'repeat').length}
                    </span>
                  )}
                </button>
              )}

              {canManageBookings && (
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
              )}

              {canViewCalendar && (
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
              )}

              {canManageMarketing && (
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
              )}

              {(user?.role === 'admin' || user?.role === 'super_admin' || canManageSettings) && (
                <button
                  onClick={() => navigateTo('team')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs transition-colors duration-150 cursor-pointer ${
                    activeNav === 'team'
                      ? 'bg-surface-subtle text-text-primary font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle font-medium'
                  }`}
                >
                  <Users className="w-4 h-4 stroke-[1.5] shrink-0" />
                  <span>Team & Sales</span>
                </button>
              )}
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

            {canManageSettings && (
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
            )}
          </div>
        </aside>

          {/* ── 2. CENTER / MAIN VIEW AREA ───────────────────────────────────── */}
          <main className="flex-1 flex flex-col overflow-hidden bg-canvas p-2 sm:p-6 space-y-2.5 sm:space-y-6 pb-24 md:pb-6">
            
            {/* ── VIEW 0: DEDICATED OVERVIEW DASHBOARD ─────────────────────────── */}
            {activeNav === 'overview' && (
              <div className="flex-1 flex flex-col overflow-y-auto space-y-6 pr-1">
                {/* Welcome & Period Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border">
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-accent stroke-[1.8]" />
                      <span>Workspace Overview & Analytics</span>
                    </h2>
                    <p className="text-xs text-text-muted mt-0.5">
                      Real-time WhatsApp volume, appointment conversion funnel, and revenue ROI
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Period Selector Pills */}
                    <div className="flex items-center p-0.5 bg-surface-subtle rounded-sm border border-border">
                      {(['7d', '30d', 'this_month', 'all'] as const).map((p) => {
                        const labels: Record<string, string> = {
                          '7d': '7 Days',
                          '30d': '30 Days',
                          'this_month': 'This Month',
                          'all': 'All Time',
                        };
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setAnalyticsPeriod(p)}
                            className={`px-2 py-1 text-xs font-medium rounded-xs transition-colors cursor-pointer ${
                              analyticsPeriod === p
                                ? 'bg-surface text-text-primary shadow-2xs font-semibold border border-border-strong'
                                : 'text-text-muted hover:text-text-primary'
                            }`}
                          >
                            {labels[p]}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={exportAnalyticsToCsv}
                      disabled={!dashboardAnalyticsData}
                      className="px-2.5 py-1.5 bg-surface hover:bg-surface-subtle text-text-body font-medium text-xs rounded-sm transition-colors duration-150 cursor-pointer flex items-center gap-1.5 border border-border disabled:opacity-50"
                      title="Export Analytics to CSV"
                    >
                      <Download className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span className="hidden sm:inline">Export CSV</span>
                    </button>

                    <button
                      onClick={() => {
                        loadDashboardAnalytics(analyticsPeriod);
                        loadConversations();
                        loadBookings();
                        loadContacts();
                      }}
                      className="px-2.5 py-1.5 bg-surface hover:bg-surface-subtle text-text-body font-medium text-xs rounded-sm transition-colors duration-150 cursor-pointer flex items-center gap-1.5 border border-border"
                      title="Refresh analytics and data"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 stroke-[1.5] ${loadingDashboardAnalytics ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Refresh</span>
                    </button>

                    <button
                      onClick={() => setActiveNav('inbox')}
                      className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white font-medium text-xs rounded-sm transition-colors duration-150 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>Open inbox</span>
                    </button>
                  </div>
                </div>

                {/* 5 Top Summary Metric Cards */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
                    {/* Card 1: WhatsApp Messages */}
                    <div
                      onClick={() => setActiveNav('inbox')}
                      className="bg-surface border border-border hover:border-border-strong rounded-md p-4 transition-colors duration-150 cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-text-muted">Total messages</span>
                        <MessageSquare className="w-4 h-4 stroke-[1.5] text-accent" />
                      </div>
                      <p className="text-2xl font-semibold text-text-primary font-mono tabular-nums">
                        {dashboardAnalyticsData ? dashboardAnalyticsData.summary.total_messages : conversations.length}
                      </p>
                      <p className="text-[11px] text-text-muted truncate">
                        {dashboardAnalyticsData
                          ? `${dashboardAnalyticsData.summary.inbound_messages} in • ${dashboardAnalyticsData.summary.outbound_messages} out`
                          : 'Active conversations'}
                      </p>
                    </div>

                    {/* Card 2: Leads & Conversion */}
                    <div
                      onClick={() => setActiveNav('customers')}
                      className="bg-surface border border-border hover:border-border-strong rounded-md p-4 transition-colors duration-150 cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-text-muted">Leads & conversion</span>
                        <Users className="w-4 h-4 stroke-[1.5] text-blue-600" />
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <p className="text-2xl font-semibold text-text-primary font-mono tabular-nums">
                          {dashboardAnalyticsData ? dashboardAnalyticsData.summary.total_leads : contacts.length}
                        </p>
                        {dashboardAnalyticsData && (
                          <span className="text-xs font-semibold px-1.5 py-0.2 rounded-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {dashboardAnalyticsData.summary.conversion_rate}%
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted truncate">
                        {dashboardAnalyticsData ? `${dashboardAnalyticsData.summary.converted_leads} converted of ${dashboardAnalyticsData.summary.total_leads} leads` : 'Contacts on file'}
                      </p>
                    </div>

                    {/* Card 3: Scheduled Bookings */}
                    <div
                      onClick={() => setActiveNav('bookings')}
                      className="bg-surface border border-border hover:border-border-strong rounded-md p-4 transition-colors duration-150 cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-text-muted">Bookings</span>
                        <CalendarDays className="w-4 h-4 stroke-[1.5] text-indigo-600" />
                      </div>
                      <p className="text-2xl font-semibold text-text-primary font-mono tabular-nums">
                        {dashboardAnalyticsData ? dashboardAnalyticsData.summary.total_bookings : bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending').length}
                      </p>
                      <p className="text-[11px] text-text-muted truncate">
                        {dashboardAnalyticsData
                          ? `${dashboardAnalyticsData.summary.completed_bookings} attended (${dashboardAnalyticsData.summary.attendance_rate}%)`
                          : 'Scheduled appointments'}
                      </p>
                    </div>

                    {/* Card 4: Attended Revenue */}
                    <div
                      onClick={() => {
                        setActiveNav('bookings');
                        setBookingFilter('completed');
                      }}
                      className="bg-surface border border-border hover:border-border-strong rounded-md p-4 transition-colors duration-150 cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-text-muted">Attended revenue</span>
                        <TrendingUp className="w-4 h-4 stroke-[1.5] text-emerald-600" />
                      </div>
                      <p className="text-2xl font-semibold text-emerald-700 font-mono tabular-nums">
                        {currentCurrencySymbol}{dashboardAnalyticsData
                          ? dashboardAnalyticsData.summary.total_revenue.toLocaleString()
                          : bookings.filter((b) => b.status === 'completed' || b.status === 'attended').reduce((sum, b) => sum + (Number(b.price) || 0), 0).toLocaleString()}
                      </p>
                      <p className="text-[11px] text-text-muted truncate">
                        {dashboardAnalyticsData && dashboardAnalyticsData.summary.completed_bookings > 0
                          ? `Avg ticket: ${currentCurrencySymbol}${dashboardAnalyticsData.summary.average_ticket_size.toLocaleString()}`
                          : dashboardAnalyticsData && dashboardAnalyticsData.summary.confirmed_bookings > 0
                          ? `${dashboardAnalyticsData.summary.confirmed_bookings} session pending attendance`
                          : 'No completed visits yet'}
                      </p>
                    </div>

                    {/* Card 5: AI Autonomy */}
                    <div
                      className="bg-surface border border-border hover:border-border-strong rounded-md p-4 transition-colors duration-150 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-text-muted">AI automation</span>
                        <Zap className="w-4 h-4 stroke-[1.5] text-amber-500" />
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <p className="text-2xl font-semibold text-text-primary font-mono tabular-nums">
                          {dashboardAnalyticsData ? `${dashboardAnalyticsData.summary.ai_autonomous_rate}%` : '0%'}
                        </p>
                        <span className="text-[10px] px-1 py-0.2 rounded-xs bg-status-success-bg text-status-success border border-status-success-border font-medium">
                          {dashboardAnalyticsData && dashboardAnalyticsData.summary.ai_autonomous_rate >= 50 ? 'Active' : 'Assisted'}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted truncate">
                        {dashboardAnalyticsData
                          ? `${dashboardAnalyticsData.summary.ai_conversations} AI replies • ${dashboardAnalyticsData.summary.human_conversations} staff replies`
                          : 'Messages automated'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Interactive Visual Analytics Suite ── */}
                {dashboardAnalyticsData && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Chart: Daily WhatsApp Message Traffic (Span 2 cols) */}
                    <div className="lg:col-span-2 bg-surface border border-border rounded-md p-4 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-text-secondary stroke-[1.8]" />
                          <h4 className="font-semibold text-xs text-text-primary">WhatsApp Message Traffic</h4>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-text-muted">
                          <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                            <span>Inbound ({dashboardAnalyticsData.summary.inbound_messages})</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-xs bg-accent inline-block" />
                            <span>Outbound ({dashboardAnalyticsData.summary.outbound_messages})</span>
                          </span>
                        </div>
                      </div>

                      {dashboardAnalyticsData.time_series.length === 0 ? (
                        <div className="h-44 flex items-center justify-center text-xs text-text-muted">
                          No message activity recorded in this time range.
                        </div>
                      ) : (
                        <div className="h-44 flex items-end gap-2 pt-4 px-2">
                          {(() => {
                            const series = dashboardAnalyticsData.time_series;
                            const maxVal = Math.max(1, ...series.map((t) => Math.max(t.inbound, t.outbound, t.total)));
                            const barMaxW = series.length <= 3 ? 'max-w-[120px]' : series.length <= 7 ? 'max-w-[72px]' : series.length <= 14 ? 'max-w-[52px]' : 'max-w-[40px]';
                            const barGap = series.length <= 7 ? 'gap-1.5' : 'gap-0.5';
                            return series.map((t, i) => {
                              const inPct = Math.round((t.inbound / maxVal) * 100);
                              const outPct = Math.round((t.outbound / maxVal) * 100);
                              const dayLabel = t.day.slice(5); // MM-DD
                              return (
                                <div key={t.day || i} className={`flex-1 min-w-[28px] ${barMaxW} flex flex-col items-center gap-1 group relative`}>
                                  {/* Tooltip on hover */}
                                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-gray-900 text-white text-[10px] rounded-md px-2.5 py-1.5 shadow-xl pointer-events-none z-20 whitespace-nowrap border border-white/10">
                                    <span className="font-semibold border-b border-white/20 pb-0.5 mb-0.5">{t.day}</span>
                                    <span className="flex items-center gap-1.5"><ArrowDownLeft className="w-3 h-3 text-emerald-400 stroke-[2]" /> Inbound: {t.inbound}</span>
                                    <span className="flex items-center gap-1.5"><ArrowUpRight className="w-3 h-3 text-blue-400 stroke-[2]" /> Outbound: {t.outbound}</span>
                                    <span className="font-medium pt-0.5 border-t border-white/20 mt-0.5">Total: {t.total}</span>
                                  </div>
                                  {/* Bars */}
                                  <div className={`w-full h-32 flex items-end justify-center ${barGap}`}>
                                    <div
                                      style={{ height: `${Math.max(inPct, 6)}%` }}
                                      className="w-1/2 bg-emerald-500 rounded-t-sm transition-all duration-300 hover:brightness-110 cursor-pointer"
                                    />
                                    <div
                                      style={{ height: `${Math.max(outPct, 6)}%` }}
                                      className="w-1/2 bg-accent rounded-t-sm transition-all duration-300 hover:brightness-110 cursor-pointer"
                                    />
                                  </div>
                                  <span className="text-[10px] text-text-muted font-mono truncate w-full text-center font-medium">
                                    {dayLabel}
                                  </span>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Funnel: Lead & Conversion Funnel (1 col) */}
                    <div className="bg-surface border border-border rounded-md p-4 space-y-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-text-secondary stroke-[1.8]" />
                          <h4 className="font-semibold text-xs text-text-primary">Conversion Funnel</h4>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                          {dashboardAnalyticsData.summary.conversion_rate}% Conv.
                        </span>
                      </div>

                      <div className="space-y-2.5 py-1">
                        {/* Step 1: Inbound Contacts */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-text-secondary">Inbound Inquiries</span>
                            <span className="font-mono font-semibold text-text-primary">{dashboardAnalyticsData.pipeline.new}</span>
                          </div>
                          <div className="w-full bg-surface-subtle rounded-full h-2 overflow-hidden border border-border">
                            <div className="bg-blue-500 h-full rounded-full" style={{ width: '100%' }} />
                          </div>
                        </div>

                        {/* Step 2: Contacted */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-text-secondary">Engaged in Chat</span>
                            <span className="font-mono font-semibold text-text-primary">{dashboardAnalyticsData.pipeline.contacted}</span>
                          </div>
                          <div className="w-full bg-surface-subtle rounded-full h-2 overflow-hidden border border-border">
                            <div
                              className="bg-indigo-500 h-full rounded-full"
                              style={{ width: `${dashboardAnalyticsData.pipeline.new > 0 ? Math.min(100, Math.round((dashboardAnalyticsData.pipeline.contacted / dashboardAnalyticsData.pipeline.new) * 100)) : 0}%` }}
                            />
                          </div>
                        </div>

                        {/* Step 3: Qualified / Follow-up */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-text-secondary">Tracked in CRM</span>
                            <span className="font-mono font-semibold text-text-primary">{dashboardAnalyticsData.pipeline.qualified}</span>
                          </div>
                          <div className="w-full bg-surface-subtle rounded-full h-2 overflow-hidden border border-border">
                            <div
                              className="bg-amber-500 h-full rounded-full"
                              style={{ width: `${dashboardAnalyticsData.pipeline.new > 0 ? Math.min(100, Math.round((dashboardAnalyticsData.pipeline.qualified / dashboardAnalyticsData.pipeline.new) * 100)) : 0}%` }}
                            />
                          </div>
                        </div>

                        {/* Step 4: Booked Visits */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-text-secondary">Booked Appointments</span>
                            <span className="font-mono font-semibold text-text-primary">{dashboardAnalyticsData.summary.total_bookings}</span>
                          </div>
                          <div className="w-full bg-surface-subtle rounded-full h-2 overflow-hidden border border-border">
                            <div
                              className="bg-purple-500 h-full rounded-full"
                              style={{ width: `${dashboardAnalyticsData.pipeline.new > 0 ? Math.min(100, Math.round((dashboardAnalyticsData.summary.total_bookings / dashboardAnalyticsData.pipeline.new) * 100)) : 0}%` }}
                            />
                          </div>
                        </div>

                        {/* Step 5: Completed Visits */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-emerald-700 font-medium">Attended / Completed</span>
                            <span className="font-mono font-semibold text-emerald-700">{dashboardAnalyticsData.summary.completed_bookings}</span>
                          </div>
                          <div className="w-full bg-surface-subtle rounded-full h-2 overflow-hidden border border-border">
                            <div
                              className="bg-emerald-600 h-full rounded-full"
                              style={{ width: `${dashboardAnalyticsData.pipeline.new > 0 ? Math.min(100, Math.round((dashboardAnalyticsData.summary.completed_bookings / dashboardAnalyticsData.pipeline.new) * 100)) : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Status Badges Row */}
                      <div className="pt-2 border-t border-border grid grid-cols-3 gap-1 text-center">
                        <div className="p-1 rounded bg-surface-subtle">
                          <p className="text-[10px] text-text-muted">Confirmed</p>
                          <p className="text-xs font-semibold text-text-primary font-mono">{dashboardAnalyticsData.bookings_by_status.confirmed}</p>
                        </div>
                        <div className="p-1 rounded bg-emerald-50 text-emerald-800">
                          <p className="text-[10px] text-emerald-700">Attended</p>
                          <p className="text-xs font-semibold font-mono">{dashboardAnalyticsData.bookings_by_status.completed}</p>
                        </div>
                        <div className="p-1 rounded bg-rose-50 text-rose-800">
                          <p className="text-[10px] text-rose-700">No-Show</p>
                          <p className="text-xs font-semibold font-mono">{dashboardAnalyticsData.bookings_by_status.no_show}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
                                  {b.service} &bull; {new Date(b.start_time || b.appointment_time || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {formatTime12(b.start_time || b.appointment_time || new Date())}
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

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
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
                            className={`px-3 py-1 text-xs rounded-sm transition-colors duration-150 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
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
                      className="px-3 py-1.5 bg-surface hover:bg-surface-subtle text-text-primary font-medium text-xs rounded-sm transition-colors duration-150 flex items-center gap-1.5 border border-border cursor-pointer shadow-xs whitespace-nowrap shrink-0"
                      title="Switch to Calendar Schedule view"
                    >
                      <CalendarDays className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                      <span>Calendar Schedule</span>
                    </button>

                    {/* Add Booking Button */}
                    <button
                      onClick={() => setIsAddBookingOpen(true)}
                      className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white font-medium text-xs rounded-sm transition-colors duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>Add booking</span>
                    </button>
                  </div>
                </div>

                {/* Bookings Data Table */}
                <div className="flex-1 overflow-y-auto overflow-x-auto border border-border rounded-md bg-surface">
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
                                      onClick={() => promptMarkAttended(b)}
                                      disabled={updatingBookingId === b.id}
                                      className="px-2 py-1 text-[11px] font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-sm transition-colors duration-150 flex items-center gap-1 cursor-pointer"
                                      title="Mark client as Attended"
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

                                  {b.status === 'cancelled' && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteBooking(b.id)}
                                      disabled={deletingBookingId === b.id}
                                      className="px-2 py-1 text-[11px] font-medium bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-sm transition-colors duration-150 flex items-center gap-1 cursor-pointer"
                                      title="Permanently delete this cancelled booking"
                                    >
                                      <Trash2 className="w-3 h-3 stroke-[2]" />
                                      <span>Delete</span>
                                    </button>
                                  )}
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
                        const cellBookings = (filteredBookings || []).filter((b) => {
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
                                      <span className="inline-flex items-center gap-1 truncate"><Phone className="w-2.5 h-2.5 shrink-0 stroke-[1.8]" /> {timeInfo.formatted} · {cust.name || cust.phone}</span>
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
                                    <span className="inline-flex items-center gap-1 truncate">{t.completed ? <CheckSquare className="w-2.5 h-2.5 shrink-0 stroke-[1.8]" /> : <Square className="w-2.5 h-2.5 shrink-0 stroke-[1.8]" />} {t.title}</span>
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
                                <span className="truncate font-medium flex items-center gap-1"><Phone className="w-2.5 h-2.5 shrink-0 stroke-[1.8]" /> {cust.name || cust.phone}</span>
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
                                <span className="truncate font-medium flex items-center gap-1">{t.completed ? <CheckSquare className="w-2.5 h-2.5 shrink-0 stroke-[1.8]" /> : <Square className="w-2.5 h-2.5 shrink-0 stroke-[1.8]" />} {t.title}</span>
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
                            const slotBookings = (filteredBookings || []).filter((b) => {
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
                                            <span className="truncate flex items-center gap-1"><Phone className="w-2.5 h-2.5 shrink-0 stroke-[1.8]" /> {cust.name || cust.phone}</span>
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
                                          <p className="font-medium truncate flex items-center gap-1">{t.completed ? <CheckSquare className="w-2.5 h-2.5 shrink-0 stroke-[1.8]" /> : <Square className="w-2.5 h-2.5 shrink-0 stroke-[1.8]" />} {t.title}</p>
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
                      const dayBookings = (filteredBookings || []).filter((b) => {
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
                                  <p className="text-xs font-semibold truncate flex items-center gap-1.5"><Phone className="w-3 h-3 shrink-0 stroke-[1.8]" /> {cust.name || cust.phone}</p>
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
                        const hourBookings = (filteredBookings || []).filter((b) => {
                          if (!b || !b.start_time) return false;
                          return isSameDay(b.start_time, currentDate) && new Date(b.start_time).getHours() === hour;
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
                    <div className="flex items-center p-0.5 bg-surface-subtle rounded-sm border border-border gap-0.5 overflow-x-auto no-scrollbar">
                      <button
                        type="button"
                        onClick={() => setFilter('all')}
                        className={`flex-1 py-1 px-1.5 text-[11px] font-medium rounded-sm transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap ${
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
                        onClick={() => setFilter('new_lead')}
                        className={`flex-1 py-1 px-1.5 text-[11px] font-medium rounded-sm transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap ${
                          filter === 'new_lead'
                            ? 'bg-surface text-emerald-800 border border-emerald-300 font-semibold shadow-subtle'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                        title="First-time leads / inquiries"
                      >
                        <span className="flex items-center gap-1"><UserPlus className="w-3.5 h-3.5 stroke-[1.8] shrink-0" /> Leads</span>
                        {(() => {
                          const count = conversations.filter((c) => c.client_type === 'new_lead' || (!c.client_type && (c.completed_bookings_count ?? 0) === 0)).length;
                          return count > 0 ? (
                            <span className={`text-[10px] font-mono px-1 rounded-sm ${filter === 'new_lead' ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'bg-surface-subtle text-text-muted'}`}>
                              {count}
                            </span>
                          ) : null;
                        })()}
                      </button>

                      <button
                        type="button"
                        onClick={() => setFilter('repeat')}
                        className={`flex-1 py-1 px-1.5 text-[11px] font-medium rounded-sm transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap ${
                          filter === 'repeat'
                            ? 'bg-surface text-amber-900 border border-amber-300 font-semibold shadow-subtle'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                        title="Repeat clients with completed bookings"
                      >
                        <span className="flex items-center gap-1"><UserCheck className="w-3.5 h-3.5 stroke-[1.8] shrink-0" /> Repeat</span>
                        {(() => {
                          const count = conversations.filter((c) => c.client_type === 'repeat' || (c.completed_bookings_count ?? 0) > 0).length;
                          return count > 0 ? (
                            <span className={`text-[10px] font-mono px-1 rounded-sm ${filter === 'repeat' ? 'bg-amber-100 text-amber-800 font-semibold' : 'bg-surface-subtle text-text-muted'}`}>
                              {count}
                            </span>
                          ) : null;
                        })()}
                      </button>

                      <button
                        type="button"
                        onClick={() => setFilter('new')}
                        className={`flex-1 py-1 px-1.5 text-[11px] font-medium rounded-sm transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap ${
                          filter === 'new'
                            ? 'bg-surface text-text-primary border border-border-strong font-semibold shadow-subtle'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                        title="Unread messages"
                      >
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 stroke-[1.8] shrink-0" /> Unread</span>
                        {conversations.filter((c) => (c.unread_count || 0) > 0).length > 0 && (
                          <span className={`text-[10px] font-mono px-1 rounded-sm ${filter === 'new' ? 'bg-accent/10 text-accent font-semibold' : 'bg-surface-subtle text-text-muted'}`}>
                            {conversations.filter((c) => (c.unread_count || 0) > 0).length}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setFilter('important')}
                        className={`py-1 px-1.5 text-[11px] font-medium rounded-sm transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap ${
                          filter === 'important'
                            ? 'bg-surface text-amber-800 border border-border-strong font-semibold shadow-subtle'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                        title="Starred conversations"
                      >
                        <Star className={`w-3 h-3 stroke-[1.5] shrink-0 ${importantConvIds.length > 0 ? 'text-amber-500 fill-amber-500' : 'text-text-muted'}`} />
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
                      filteredConversations.map((conv) => {
                        const isSelected = selectedConv?.id === conv.id;
                        const cleanPhone = (conv.contact_phone || '').replace(/[^0-9]/g, '');
                        const matchedCust = customers.find((c) => c.phone && c.phone.replace(/[^0-9]/g, '') === cleanPhone);
                        const isRepeat = conv.client_type === 'repeat' || (conv.completed_bookings_count ?? 0) > 0 || (matchedCust?.completed_bookings_count ?? 0) > 0;
                        const visitCount = conv.completed_bookings_count ?? matchedCust?.completed_bookings_count ?? 0;
                        const staffName = conv.assigned_staff_name || conv.preferred_doctor || matchedCust?.preferred_doctor || '';
                        const concern = conv.health_concern || matchedCust?.health_concern || '';
                        const lastMsg = conv.last_message || matchedCust?.last_message || '';
                        const unreadCount = conv.unread_count || 0;
                        const isStarred = importantConvIds.includes(conv.id);

                        return (
                          <div
                            key={conv.id}
                            onClick={() => {
                              if (selectedConv?.id === conv.id) {
                                setSelectedConv(null);
                                activeConvIdRef.current = null;
                              } else {
                                selectConversation(conv);
                              }
                            }}
                            className={`group relative w-full py-2.5 px-3 text-left transition-colors duration-150 cursor-pointer flex gap-2.5 items-start border-b border-border/40 ${
                              isSelected
                                ? 'bg-blue-50/70 dark:bg-slate-800/80 border-l-2 border-l-accent'
                                : 'hover:bg-surface-subtle/70'
                            }`}
                          >
                            {/* Left: Avatar with Status Dot */}
                            <div className="relative shrink-0 mt-0.5">
                              <div className="w-8 h-8 rounded-full bg-surface-subtle text-text-secondary border border-border flex items-center justify-center font-bold text-xs shadow-2xs">
                                {conv.contact_name ? conv.contact_name[0].toUpperCase() : (conv.contact_phone ? conv.contact_phone.slice(-1) : 'C')}
                              </div>
                              {/* Avatar Dot: 🟢 Green = AI Active, 🟡 Amber = Human Mode */}
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-surface ${
                                  conv.ai_enabled !== false
                                    ? 'bg-emerald-500'
                                    : 'bg-amber-500'
                                }`}
                                title={conv.ai_enabled !== false ? 'AI Assistant Active' : 'Human Takeover Mode'}
                              />
                            </div>

                            {/* Middle: Clean WhatsApp-style 3-Line Stack */}
                            <div className="flex-1 min-w-0 space-y-0.5">
                              {/* Line 1: Name + Star + Timestamp / Hover Actions */}
                              <div className="flex items-center justify-between gap-1.5 min-w-0">
                                <div className="flex items-center gap-1 min-w-0">
                                  <p className={`text-xs truncate ${unreadCount > 0 ? 'font-bold text-text-primary' : 'font-semibold text-text-primary'}`}>
                                    {conv.contact_name || conv.contact_phone || 'Customer'}
                                  </p>
                                  {isStarred && (
                                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500 shrink-0" />
                                  )}
                                </div>

                                {/* Right: Timestamp by default, Star & Delete on Hover (zero empty space reserved) */}
                                <div className="relative shrink-0 flex items-center justify-end h-4">
                                  <span
                                    className="text-[10px] text-text-muted font-mono shrink-0 group-hover:opacity-0 transition-opacity duration-150"
                                    title={formatFullDateTimeDetailed(conv.last_message_at)}
                                  >
                                    {formatConversationDate(conv.last_message_at)}
                                  </span>
                                  <div className="absolute right-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-150 bg-surface/90 backdrop-blur-xs rounded px-0.5">
                                    <button
                                      type="button"
                                      onClick={(e) => toggleImportant(conv.id, e)}
                                      className={`p-1 rounded-sm transition-colors duration-150 cursor-pointer ${
                                        isStarred
                                          ? 'text-amber-500'
                                          : 'text-text-muted hover:text-amber-500'
                                      }`}
                                      title={isStarred ? 'Marked as Important (Click to remove)' : 'Mark as Important'}
                                    >
                                      <Star className={`w-3.5 h-3.5 stroke-[1.5] ${isStarred ? 'fill-amber-500 text-amber-500' : ''}`} />
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
                                      className="p-1 text-text-muted hover:text-status-error hover:bg-status-error-bg rounded-sm transition-colors duration-150 cursor-pointer"
                                      title="Delete chat"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Line 2: Latest Message Snippet + Unread Bubble */}
                              <div className="flex items-center justify-between gap-1.5 min-w-0">
                                <p className={`text-[11px] truncate leading-tight flex-1 min-w-0 ${
                                  unreadCount > 0
                                    ? 'font-semibold text-text-primary'
                                    : 'text-text-muted group-hover:text-text-secondary'
                                }`}>
                                  {lastMsg ? (
                                    <span className="italic font-medium text-text-secondary dark:text-text-secondary">"{lastMsg}"</span>
                                  ) : (
                                    <span className="font-mono text-text-muted/70">{conv.contact_phone}</span>
                                  )}
                                </p>
                                {unreadCount > 0 && !isSelected && (
                                  <span className="px-1.5 py-0.2 rounded-full bg-accent text-white text-[9px] font-bold min-w-[16px] text-center leading-tight shrink-0 shadow-2xs">
                                    {unreadCount}
                                  </span>
                                )}
                              </div>

                              {/* Line 3: Subtle Minimal Context Line (Lead/Repeat + Staff + Concern) */}
                              <div className="flex items-center gap-1.5 pt-0.5 text-[10px] text-text-muted leading-none flex-wrap">
                                {isRepeat ? (
                                  <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200/70 inline-flex items-center gap-0.5 shrink-0" title={`Repeat client (${visitCount} completed visits)`}>
                                    <UserCheck className="w-2.5 h-2.5 stroke-[2]" />
                                    <span>Repeat{visitCount > 0 ? ` (${visitCount})` : ''}</span>
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60 inline-flex items-center gap-0.5 shrink-0" title="First-time lead">
                                    <UserPlus className="w-2.5 h-2.5 stroke-[2]" />
                                    <span>Lead</span>
                                  </span>
                                )}

                                {staffName && (
                                  <>
                                    <span className="text-border text-[9px]">•</span>
                                    <span className="truncate max-w-[80px] text-text-secondary font-medium" title={`Assigned: ${staffName}`}>
                                      {staffName.split(' ')[0]}
                                    </span>
                                  </>
                                )}

                                {concern && (
                                  <>
                                    <span className="text-border text-[9px]">•</span>
                                    <span className="truncate max-w-[95px] text-text-muted" title={concern}>
                                      {concern}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
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
                            onClick={() => {
                              setSelectedConv(null);
                              activeConvIdRef.current = null;
                            }}
                            className="p-1.5 -ml-1 text-text-secondary hover:text-text-primary rounded-sm hover:bg-surface-subtle cursor-pointer shrink-0"
                            title="Close chat / Back to list"
                          >
                            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8]" />
                          </button>
                          <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {selectedConv.contact_name ? selectedConv.contact_name[0].toUpperCase() : 'C'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-semibold text-xs sm:text-sm text-text-primary truncate">
                                {selectedConv.contact_name || selectedConv.contact_phone || selectedConv.name || selectedConv.phone}
                              </h4>
                              {(() => {
                                const cleanP = (selectedConv?.contact_phone || selectedConv?.phone || '').replace(/[^0-9]/g, '');
                                if (!cleanP) return null;
                                const inCrm = Array.isArray(customers) && customers.some((c) => c && c.phone && c.phone.replace(/[^0-9]/g, '') === cleanP);
                                return inCrm ? (
                                  <span className="text-[9px] font-semibold px-1 py-0.2 rounded-xs bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                    CRM
                                  </span>
                                ) : null;
                              })()}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-mono truncate">
                              <span>{selectedConv.contact_phone || selectedConv.phone}</span>
                              {(() => {
                                const lastActive = selectedConv.last_message_at || (messages && messages.length > 0 ? messages[messages.length - 1]?.created_at : null);
                                if (!lastActive) return null;
                                return (
                                  <>
                                    <span className="text-text-muted/60">•</span>
                                    <span
                                      className="text-text-secondary font-medium tracking-tight truncate"
                                      title={formatFullDateTimeDetailed(lastActive)}
                                    >
                                      Last contacted: {formatWhatsAppHeaderDate(lastActive)}
                                    </span>
                                  </>
                                );
                              })()}
                            </div>
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

                          {/* Staff & Doctor Assignment Dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setShowAssignDropdown((prev) => {
                                  const next = !prev;
                                  if (next) {
                                    loadTeamList();
                                    setAssignSearchQuery('');
                                  }
                                  return next;
                                });
                              }}
                              className={`px-2 py-1 rounded-sm text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs ${
                                selectedConv.assigned_staff_name
                                  ? 'border-accent/30 bg-accent/5 text-text-primary hover:bg-accent/10'
                                  : (selectedConv.preferred_doctor || selectedCustomer?.preferred_doctor)
                                  ? 'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/70'
                                  : 'border-border bg-surface hover:bg-surface-subtle text-text-muted hover:text-text-primary'
                              }`}
                              title={
                                selectedConv.assigned_staff_name
                                  ? `Assigned to: ${selectedConv.assigned_staff_name}`
                                  : (selectedConv.preferred_doctor || selectedCustomer?.preferred_doctor)
                                  ? `Doctor: ${selectedConv.preferred_doctor || selectedCustomer?.preferred_doctor}`
                                  : 'Assign staff or doctor to this conversation'
                              }
                            >
                              {selectedConv.assigned_staff_name ? (
                                <User className="w-3.5 h-3.5 text-accent shrink-0" />
                              ) : (selectedConv.preferred_doctor || selectedCustomer?.preferred_doctor) ? (
                                <Stethoscope className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              ) : (
                                <Users className="w-3.5 h-3.5 text-text-muted shrink-0" />
                              )}
                              <span className="hidden sm:inline max-w-[100px] truncate text-[11px] font-medium">
                                {selectedConv.assigned_staff_name ||
                                  (selectedConv.assigned_to
                                    ? teamList.find((m) => m.id === selectedConv.assigned_to)?.display_name ||
                                      teamList.find((m) => m.id === selectedConv.assigned_to)?.email ||
                                      'Assigned'
                                    : selectedConv.preferred_doctor || selectedCustomer?.preferred_doctor || 'Unassigned')}
                              </span>
                              <ChevronDown className="w-3 h-3 text-text-muted shrink-0" />
                            </button>
                            {showAssignDropdown && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={() => setShowAssignDropdown(false)}
                                />
                                <div className="absolute right-0 mt-1 w-60 bg-surface border border-border rounded-md shadow-xl z-50 py-1 text-xs divide-y divide-border/40">
                                  {/* Header */}
                                  <div className="px-2.5 py-1.5 flex items-center justify-between bg-surface-subtle/40">
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                      Assign Staff / Doctor
                                    </span>
                                    {teamLoading && <RefreshCw className="w-2.5 h-2.5 animate-spin text-accent" />}
                                  </div>

                                  {/* Quick search input */}
                                  {(categorizedStaffOptions.teamDoctors.length +
                                    categorizedStaffOptions.sales.length +
                                    categorizedStaffOptions.predefinedDoctors.length +
                                    categorizedStaffOptions.other.length > 4) && (
                                    <div className="p-1.5 bg-surface">
                                      <div className="relative">
                                        <Search className="w-3 h-3 text-text-muted absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        <input
                                          type="text"
                                          value={assignSearchQuery}
                                          onChange={(e) => setAssignSearchQuery(e.target.value)}
                                          placeholder="Search staff or doctor..."
                                          className="w-full pl-6 pr-2 py-0.5 text-[11px] bg-surface-subtle border border-border rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                                          onClick={(e) => e.stopPropagation()}
                                          autoFocus
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Scrollable list */}
                                  <div className="max-h-64 overflow-y-auto py-1 divide-y divide-border/20">
                                    {/* Unassigned Option */}
                                    {(!assignSearchQuery || 'unassigned'.includes(assignSearchQuery.toLowerCase())) && (() => {
                                      const isUnassigned = !selectedConv.assigned_to && !selectedConv.assigned_staff_name && !selectedConv.preferred_doctor && !selectedCustomer?.preferred_doctor;
                                      return (
                                        <button
                                          type="button"
                                          onClick={() => handleAssignChatStaff({ type: 'unassign' })}
                                          className={`w-full text-left px-2.5 py-1.5 flex items-center justify-between text-xs hover:bg-surface-subtle transition-colors cursor-pointer ${
                                            isUnassigned ? 'text-accent font-semibold bg-accent/5' : 'text-text-secondary'
                                          }`}
                                        >
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <UserX className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                            <span className="truncate text-[11px]">Unassigned</span>
                                          </div>
                                          {isUnassigned && <Check className="w-3 h-3 text-accent shrink-0" />}
                                        </button>
                                      );
                                    })()}

                                    {/* 1. Doctors (Team Login) */}
                                    {(() => {
                                      const q = assignSearchQuery.trim().toLowerCase();
                                      const list = categorizedStaffOptions.teamDoctors.filter((d) => !q || d.value.toLowerCase().includes(q));
                                      if (list.length === 0) return null;
                                      return (
                                        <div className="py-1">
                                          <div className="px-2.5 py-0.5 text-[9px] font-bold text-text-muted uppercase tracking-wider">
                                            Doctors (Team Login)
                                          </div>
                                          {list.map((doc) => {
                                            const isActive = selectedConv.assigned_to === doc.id || (selectedConv.assigned_staff_name && selectedConv.assigned_staff_name.toLowerCase() === doc.value.toLowerCase());
                                            return (
                                              <button
                                                key={doc.value}
                                                type="button"
                                                onClick={() => handleAssignChatStaff({ type: 'team', id: doc.id!, name: doc.value })}
                                                className={`w-full text-left px-2.5 py-1 flex items-center justify-between text-xs hover:bg-surface-subtle transition-colors cursor-pointer ${
                                                  isActive ? 'text-accent font-semibold bg-accent/5' : 'text-text-primary'
                                                }`}
                                              >
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                  <Stethoscope className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                                  <span className="truncate text-[11px]">{doc.value}</span>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0 ml-1">
                                                  <span className="text-[9px] px-1 py-0.2 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-medium">Doctor</span>
                                                  {isActive && <Check className="w-3 h-3 text-accent shrink-0" />}
                                                </div>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      );
                                    })()}

                                    {/* 2. Sales & Support (Team Login) */}
                                    {(() => {
                                      const q = assignSearchQuery.trim().toLowerCase();
                                      const list = categorizedStaffOptions.sales.filter((s) => !q || s.value.toLowerCase().includes(q));
                                      if (list.length === 0) return null;
                                      return (
                                        <div className="py-1">
                                          <div className="px-2.5 py-0.5 text-[9px] font-bold text-text-muted uppercase tracking-wider">
                                            Sales & Support
                                          </div>
                                          {list.map((mem) => {
                                            const isActive = selectedConv.assigned_to === mem.id || (selectedConv.assigned_staff_name && selectedConv.assigned_staff_name.toLowerCase() === mem.value.toLowerCase());
                                            return (
                                              <button
                                                key={mem.value}
                                                type="button"
                                                onClick={() => handleAssignChatStaff({ type: 'team', id: mem.id!, name: mem.value })}
                                                className={`w-full text-left px-2.5 py-1 flex items-center justify-between text-xs hover:bg-surface-subtle transition-colors cursor-pointer ${
                                                  isActive ? 'text-accent font-semibold bg-accent/5' : 'text-text-primary'
                                                }`}
                                              >
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                  <User className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                                  <span className="truncate text-[11px]">{mem.value}</span>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0 ml-1">
                                                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 font-medium">Sales</span>
                                                  {isActive && <Check className="w-3 h-3 text-accent shrink-0" />}
                                                </div>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      );
                                    })()}

                                    {/* 3. Doctors & Consultants (Predefined Presets) */}
                                    {(() => {
                                      const q = assignSearchQuery.trim().toLowerCase();
                                      const list = categorizedStaffOptions.predefinedDoctors.filter((p) => !q || p.value.toLowerCase().includes(q));
                                      if (list.length === 0) return null;
                                      const currentDoc = (selectedConv.preferred_doctor || selectedCustomer?.preferred_doctor || '').trim().toLowerCase();
                                      return (
                                        <div className="py-1">
                                          <div className="px-2.5 py-0.5 text-[9px] font-bold text-text-muted uppercase tracking-wider">
                                            Doctors (Presets)
                                          </div>
                                          {list.map((preset) => {
                                            const isActive = !selectedConv.assigned_to && currentDoc === preset.value.toLowerCase();
                                            return (
                                              <button
                                                key={preset.value}
                                                type="button"
                                                onClick={() => handleAssignChatStaff({ type: 'preset', name: preset.value })}
                                                className={`w-full text-left px-2.5 py-1 flex items-center justify-between text-xs hover:bg-surface-subtle transition-colors cursor-pointer ${
                                                  isActive ? 'text-accent font-semibold bg-accent/5' : 'text-text-primary'
                                                }`}
                                              >
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                  <Stethoscope className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                  <span className="truncate text-[11px]">{preset.value}</span>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0 ml-1">
                                                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-medium">Preset</span>
                                                  {isActive && <Check className="w-3 h-3 text-accent shrink-0" />}
                                                </div>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      );
                                    })()}

                                    {/* 4. Staff & Administration */}
                                    {(() => {
                                      const q = assignSearchQuery.trim().toLowerCase();
                                      const list = categorizedStaffOptions.other.filter((o) => !q || o.value.toLowerCase().includes(q));
                                      if (list.length === 0) return null;
                                      return (
                                        <div className="py-1">
                                          <div className="px-2.5 py-0.5 text-[9px] font-bold text-text-muted uppercase tracking-wider">
                                            Staff & Administration
                                          </div>
                                          {list.map((mem) => {
                                            const isActive = selectedConv.assigned_to === mem.id || (selectedConv.assigned_staff_name && selectedConv.assigned_staff_name.toLowerCase() === mem.value.toLowerCase());
                                            return (
                                              <button
                                                key={mem.value}
                                                type="button"
                                                onClick={() => handleAssignChatStaff({ type: 'team', id: mem.id!, name: mem.value })}
                                                className={`w-full text-left px-2.5 py-1 flex items-center justify-between text-xs hover:bg-surface-subtle transition-colors cursor-pointer ${
                                                  isActive ? 'text-accent font-semibold bg-accent/5' : 'text-text-primary'
                                                }`}
                                              >
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                                                  <span className="truncate text-[11px]">{mem.value}</span>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0 ml-1">
                                                  <span className="text-[9px] px-1 py-0.2 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 font-medium">Admin</span>
                                                  {isActive && <Check className="w-3 h-3 text-accent shrink-0" />}
                                                </div>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      );
                                    })()}

                                    {/* Loading state */}
                                    {teamLoading && teamList.length === 0 && (
                                      <div className="px-3 py-3 text-[11px] text-text-muted text-center flex items-center justify-center gap-1.5">
                                        <RefreshCw className="w-3 h-3 animate-spin text-accent" />
                                        <span>Loading staff members...</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Footer */}
                                  <div className="px-2.5 py-1.5 bg-surface-subtle/30 flex items-center justify-between text-[10px]">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setShowAssignDropdown(false);
                                        setActiveNav('team');
                                      }}
                                      className="text-accent hover:underline font-medium flex items-center gap-1 cursor-pointer"
                                    >
                                      <Users className="w-3 h-3" /> Manage Staff & Presets
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

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

                          {/* Close / Exit Chat */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedConv(null);
                              activeConvIdRef.current = null;
                            }}
                            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-subtle rounded-sm transition-colors cursor-pointer"
                            title="Close chat (Esc)"
                          >
                            <X className="w-3.5 h-3.5 stroke-[1.8]" />
                          </button>
                        </div>
                      </div>

                      {/* ── Active Chat Customer Intelligence Banner ── */}
                      {(() => {
                        const cleanPhone = (selectedConv.contact_phone || '').replace(/[^0-9]/g, '');
                        const matchedCust = customers.find((c) => c.phone && c.phone.replace(/[^0-9]/g, '') === cleanPhone);
                        const isRepeat = selectedConv.client_type === 'repeat' || (selectedConv.completed_bookings_count ?? 0) > 0 || (matchedCust?.completed_bookings_count ?? 0) > 0;
                        const visitCount = selectedConv.completed_bookings_count ?? matchedCust?.completed_bookings_count ?? 0;
                        const lastDate = selectedConv.last_visit_date || matchedCust?.last_visit_date || matchedCust?.last_visited;
                        const lastService = selectedConv.last_visit_service || matchedCust?.last_visit_service;
                        const lastDoctor = selectedConv.last_visit_doctor || matchedCust?.last_visit_doctor || selectedConv.preferred_doctor || matchedCust?.preferred_doctor;
                        const retentionStatus = matchedCust?.retention_status;
                        const daysSince = matchedCust?.days_since_last_visit;

                        return (
                          <div className={`px-3.5 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-xs transition-colors shrink-0 ${
                            isRepeat
                              ? 'bg-amber-50/70 border-amber-200/80 text-amber-950'
                              : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
                          }`}>
                            {/* Left: Intelligence Status & Details */}
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              <div className="flex items-center gap-1.5 shrink-0">
                                {isRepeat ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                    <UserCheck className="w-3 h-3 text-amber-700 stroke-[2]" />
                                    <span>Repeat Client</span>
                                    {visitCount > 0 && <span className="font-mono">({visitCount} sessions)</span>}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                    <UserPlus className="w-3 h-3 text-emerald-700 stroke-[2]" />
                                    <span>New Lead</span>
                                  </span>
                                )}
                              </div>

                              {isRepeat ? (
                                <div className="flex items-center gap-1.5 text-[11px] text-amber-900/90 font-medium">
                                  {lastDate && (
                                    <span>Last visited: <strong className="font-semibold">{new Date(lastDate).toLocaleDateString()}</strong>{daysSince != null ? ` (${daysSince}d ago)` : ''}</span>
                                  )}
                                  {lastService && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate max-w-[130px] font-medium" title={lastService}>{lastService}</span>
                                    </>
                                  )}
                                  {lastDoctor && (
                                    <>
                                      <span>•</span>
                                      <span className="text-amber-800 font-medium">Dr. {lastDoctor}</span>
                                    </>
                                  )}
                                  {retentionStatus === 'active' && (
                                    <span className="px-1.5 py-0.2 rounded-xs bg-emerald-100 text-emerald-800 text-[10px] font-semibold border border-emerald-200">Active Regular</span>
                                  )}
                                  {retentionStatus === 'due' && (
                                    <span className="px-1.5 py-0.2 rounded-xs bg-amber-200 text-amber-900 text-[10px] font-semibold border border-amber-300">Due for Checkup</span>
                                  )}
                                  {retentionStatus === 'lapsed' && (
                                    <span className="px-1.5 py-0.2 rounded-xs bg-rose-100 text-rose-800 text-[10px] font-semibold border border-rose-200">Lapsed (&gt;60d)</span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-[11px] text-emerald-900/90 font-medium">
                                  <span>First-time inquiry</span>
                                  {matchedCust?.lead_probability && (
                                    <>
                                      <span>•</span>
                                      <span className="capitalize font-semibold">{matchedCust.lead_probability} Lead</span>
                                    </>
                                  )}
                                  {matchedCust?.health_concern && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate max-w-[140px]">{matchedCust.health_concern}</span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Right: Instant 1-Click Action Buttons */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  const tomorrow = new Date();
                                  tomorrow.setDate(tomorrow.getDate() + 1);
                                  const dStr = tomorrow.toISOString().split('T')[0];
                                  setNewBookingForm({
                                    contact_name: selectedConv.contact_name || matchedCust?.name || '',
                                    contact_phone: selectedConv.contact_phone || matchedCust?.phone || '',
                                    service: lastService || currentTaxonomy.default_service || 'General Consultation',
                                    date: dStr,
                                    time: '10:00',
                                    price: 0,
                                    notes: isRepeat ? 'Follow-up session for repeat client' : 'First appointment for new lead',
                                  });
                                  setIsAddBookingOpen(true);
                                }}
                                className="px-2 py-1 rounded-sm text-[11px] font-medium bg-white/90 hover:bg-white text-text-primary border border-border shadow-2xs hover:border-accent flex items-center gap-1 transition-colors cursor-pointer"
                                title="Schedule next session for this client"
                              >
                                <CalendarClock className="w-3 h-3 text-accent stroke-[1.8]" />
                                <span>Book Session</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (matchedCust) {
                                    handleSelectCustomer(matchedCust);
                                    setShowCustomerHistoryModal(true);
                                  } else {
                                    openCustomerProfileByPhone(selectedConv.contact_phone, selectedConv.contact_name);
                                  }
                                }}
                                className="px-2 py-1 rounded-sm text-[11px] font-medium bg-white/90 hover:bg-white text-text-primary border border-border shadow-2xs hover:border-accent flex items-center gap-1 transition-colors cursor-pointer"
                                title="View complete customer history, past bookings and notes"
                              >
                                <FileText className="w-3 h-3 text-text-muted stroke-[1.8]" />
                                <span>Profile & History</span>
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Chat Messages Stream */}
                      <div
                        ref={messagesContainerRef}
                        style={{ scrollBehavior: 'auto' }}
                        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 bg-canvas/40 min-h-0"
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
                          messages.map((msg, idx) => {
                            const isInbound = msg.direction === 'inbound';
                            const displayBody = getDisplayMessageBody(msg);
                            const isVoice = msg.body?.startsWith('[Voice Note:') || msg.body?.startsWith('🎤 [Voice Note:') || msg.content_type === 'audio';
                            const currentDateKey = getMessageDateKey(msg.created_at);
                            const prevDateKey = idx > 0 ? getMessageDateKey(messages[idx - 1]?.created_at) : null;
                            const showDateDivider = idx === 0 || (Boolean(currentDateKey) && currentDateKey !== prevDateKey);

                            return (
                              <Fragment key={msg.id}>
                                {showDateDivider && (
                                  <div className="flex justify-center my-1.5 select-none pointer-events-none">
                                    <span
                                      className="px-2.5 py-0.5 rounded-md text-[10px] font-medium tracking-wide uppercase bg-surface/90 dark:bg-zinc-800/90 backdrop-blur-xs text-text-secondary border border-border/70 shadow-2xs pointer-events-auto"
                                      title={formatFullDateTimeDetailed(msg.created_at)}
                                    >
                                      {formatMessageDateDivider(msg.created_at)}
                                    </span>
                                  </div>
                                )}
                                <div className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`} title={formatFullDateTimeDetailed(msg.created_at)}>
                                  <div className={`group/msg flex items-center gap-1 max-w-[85%] sm:max-w-[70%] ${isInbound ? '' : 'flex-row-reverse'}`}>
                                    <div
                                      className={`rounded-2xl ${isInbound ? 'rounded-tl-xs bg-surface text-text-body border border-border shadow-xs' : 'rounded-tr-xs bg-accent text-white shadow-xs'} px-3.5 py-2.5 text-xs`}
                                    >
                                    {isVoice && (
                                      <div className="flex items-center gap-1 text-accent-light font-mono text-[10px] mb-1">
                                        <Mic className="w-3 h-3 stroke-[1.5]" />
                                        <span>Voice note</span>
                                      </div>
                                    )}
                                    {msg.media_url && (
                                      <div className="mb-2 rounded-lg overflow-hidden border border-border/50 max-w-xs">
                                        <img src={msg.media_url} alt="Media attachment" className="w-full h-auto object-cover max-h-60" />
                                      </div>
                                    )}
                                    <p className="leading-relaxed whitespace-pre-wrap font-sans">{displayBody}</p>
                                    <div
                                      className={`text-[10px] mt-1 flex items-center justify-end gap-1 font-mono ${isInbound ? 'text-text-muted' : 'text-teal-100/90'}`}
                                      title={formatFullDateTimeDetailed(msg.created_at)}
                                    >
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
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMessage(msg.id)}
                                      className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 text-text-muted hover:text-rose-500 cursor-pointer shrink-0"
                                      title="Delete message"
                                    >
                                      <Trash2 className="w-3 h-3 stroke-[1.5]" />
                                    </button>
                                  </div>
                                </div>
                              </Fragment>
                            );
                          })
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* 24-Hour Customer Window Expiration Banner */}
                      {is24HourWindowExpired(selectedConv) && (
                        <div className="px-3 py-2 bg-amber-50 dark:bg-amber-950/40 border-t border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200 shrink-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span className="truncate">
                              24h customer window expired. Regular messages may fail. Send a template to re-open window.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={openChatTemplatePicker}
                            className="ml-2 px-2.5 py-1 text-[11px] font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors cursor-pointer shrink-0 shadow-xs"
                          >
                            Send Template
                          </button>
                        </div>
                      )}

                      {/* Chat Input */}
                      {canSendMessages ? (
                        <form onSubmit={handleSendMessage} className="p-2 sm:p-3 border-t border-border flex items-center gap-2 bg-surface shrink-0">
                          <button
                            type="button"
                            onClick={openChatTemplatePicker}
                            className="p-2 text-text-secondary hover:text-accent hover:bg-surface-subtle rounded-full transition-colors cursor-pointer shrink-0"
                            title="Send pre-approved WhatsApp template"
                          >
                            <FileText className="w-4 h-4 stroke-[1.8]" />
                          </button>
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
                      ) : (
                        <div className="p-3 border-t border-border bg-surface-subtle text-text-muted text-xs text-center flex items-center justify-center gap-2 shrink-0">
                          <Lock className="w-3.5 h-3.5 text-text-muted" />
                          <span>Read-only access: outbound messaging is restricted for your role.</span>
                        </div>
                      )}
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
              <div className="flex-1 flex flex-col overflow-hidden space-y-1.5">
                {/* Compact Header with Title, Dynamic Taxonomy, + Add Customer, and Sub-Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-1.5 pt-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-text-primary flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-accent stroke-[1.8]" />
                      <span>{currentTaxonomy.client_plural || 'Customers'}</span>
                    </h3>
                    <span className="text-xs text-text-muted font-mono">({customers.length})</span>
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

                    {/* Manage Dropdown Options Button */}
                    <button
                      type="button"
                      onClick={openDropdownOptionsModal}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary border border-border text-xs font-medium rounded-sm transition-colors cursor-pointer shrink-0"
                      title="Add, remove, or update CRM dropdown options"
                    >
                      <Sliders className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>Dropdown Options</span>
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
                  <div className="flex-1 flex flex-col overflow-hidden space-y-1.5">
                    {/* Dedicated Mobile Search Input (Prominently visible on mobile screens) */}
                    <div className="md:hidden relative w-full shrink-0">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                      <input
                        type="text"
                        placeholder={`Search ${(currentTaxonomy.client_plural || 'customers').toLowerCase()}, phone, staff...`}
                        value={followupSearchInput}
                        onChange={(e) => setFollowupSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setFollowupSearch(followupSearchInput);
                          }
                        }}
                        className="w-full pl-8 pr-7 py-1 bg-surface border border-border rounded-md text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent h-8 shadow-2xs"
                      />
                      {followupSearchInput && (
                        <button
                          type="button"
                          onClick={() => {
                            setFollowupSearchInput('');
                            setFollowupSearch('');
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1"
                          title="Clear search"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Filter & Segment Controls - Streamlined Single Compact Bar */}
                    <div className="flex items-center gap-2 p-1 px-2 bg-surface border border-border rounded-sm overflow-x-auto no-scrollbar">
                      {/* Outcome Filter Pills & Specific Outcome Selector */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[11px] font-medium text-text-secondary mr-0.5">Outcome:</span>
                        <div className="inline-flex items-center p-0.5 bg-surface-subtle border border-border/80 rounded-sm gap-0.5">
                          {[
                            { key: 'all', label: 'All' },
                            { key: 'new', label: 'New' },
                            { key: 'follow-up', label: 'Follow-up' },
                            { key: 'converted', label: 'Converted' },
                            { key: 'lost', label: 'Lost' },
                          ].map((st) => {
                            const isActive = followupStatusFilter.toLowerCase() === st.key;
                            return (
                              <button
                                key={st.key}
                                type="button"
                                onClick={() => setFollowupStatusFilter(st.key)}
                                className={`px-2 py-0.5 text-[11px] rounded-xs transition-colors cursor-pointer font-medium ${
                                  isActive
                                    ? 'bg-surface border border-border text-text-primary font-semibold shadow-2xs'
                                    : 'text-text-muted hover:text-text-primary hover:bg-surface/50'
                                }`}
                              >
                                {st.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Specific Outcome Dropdown */}
                        <select
                          value={
                            ['all', 'new', 'follow-up', 'converted', 'lost'].includes(followupStatusFilter.toLowerCase())
                              ? ''
                              : followupStatusFilter
                          }
                          onChange={(e) => {
                            if (e.target.value) {
                              setFollowupStatusFilter(e.target.value);
                            } else {
                              setFollowupStatusFilter('all');
                            }
                          }}
                          className={`px-1.5 py-0.5 text-[11px] rounded-sm border transition-colors cursor-pointer max-w-[105px] truncate h-[26px] ${
                            !['all', 'new', 'follow-up', 'converted', 'lost'].includes(followupStatusFilter.toLowerCase()) && followupStatusFilter !== ''
                              ? 'bg-surface-subtle border-text-primary font-semibold text-text-primary shadow-2xs'
                              : 'bg-surface border-border text-text-secondary hover:text-text-primary'
                          }`}
                          title="Filter by specific outcome status"
                        >
                          <option value="">More...</option>
                          {crmDropdowns.outcome_statuses.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>

                      {/* Divider */}
                      <div className="h-4 w-px bg-border/80 shrink-0" />

                      {/* Lead Warmth Badges (Minimal Clean Icons) */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[11px] font-medium text-text-secondary mr-0.5">Lead:</span>
                        <div className="inline-flex items-center p-0.5 bg-surface-subtle border border-border/80 rounded-sm gap-0.5">
                          {[
                            { key: 'all', label: 'All' },
                            { key: 'hot', label: 'Hot', icon: Flame, color: 'text-amber-500 fill-amber-500/20' },
                            { key: 'warm', label: 'Warm', icon: Sun, color: 'text-amber-500 stroke-[2.2]' },
                            { key: 'cold', label: 'Cold', icon: Snowflake, color: 'text-sky-500 stroke-[2.2]' },
                          ].map((prob) => {
                            const isActive = followupProbabilityFilter === prob.key;
                            const ProbIcon = prob.icon;
                            return (
                              <button
                                key={prob.key}
                                type="button"
                                onClick={() => setFollowupProbabilityFilter(prob.key)}
                                className={`px-1.5 py-0.5 text-[11px] rounded-xs transition-colors cursor-pointer flex items-center gap-1 font-medium ${
                                  isActive
                                    ? 'bg-surface border border-border text-text-primary font-semibold shadow-2xs'
                                    : 'text-text-muted hover:text-text-primary hover:bg-surface/50'
                                }`}
                              >
                                {ProbIcon && <ProbIcon className={`w-3 h-3 ${prob.color}`} />}
                                <span>{prob.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-4 w-px bg-border/80 shrink-0" />

                      {/* Staff & Next Action Selectors & Search */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Staff / Doctor Selector */}
                        <div className="flex items-center gap-0.5">
                          <select
                            value={followupDoctorFilter}
                            onChange={(e) => setFollowupDoctorFilter(e.target.value)}
                            className="px-2 py-0.5 text-[11px] bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent max-w-[125px] h-[26px]"
                          >
                            <option value="all">All {currentTaxonomy.staff_label ? currentTaxonomy.staff_label.split('/')[0].trim() + 's' : 'Staff & Doctors'}</option>
                            <option value="unassigned">Unassigned</option>
                            {categorizedStaffOptions.teamDoctors.length > 0 && (
                              <optgroup label="Doctors (Team Login)">
                                {categorizedStaffOptions.teamDoctors.map((s) => (
                                  <option key={s.value} value={s.value}>{s.value}</option>
                                ))}
                              </optgroup>
                            )}
                            {categorizedStaffOptions.sales.length > 0 && (
                              <optgroup label="Sales & Support">
                                {categorizedStaffOptions.sales.map((s) => (
                                  <option key={s.value} value={s.value}>{s.value}</option>
                                ))}
                              </optgroup>
                            )}
                            {categorizedStaffOptions.predefinedDoctors.length > 0 && (
                              <optgroup label="Doctors & Consultants (Presets)">
                                {categorizedStaffOptions.predefinedDoctors.map((s) => (
                                  <option key={s.value} value={s.value}>{s.value}</option>
                                ))}
                              </optgroup>
                            )}
                            {categorizedStaffOptions.other.length > 0 && (
                              <optgroup label="Staff & Administration">
                                {categorizedStaffOptions.other.map((s) => (
                                  <option key={s.value} value={s.value}>{s.value}</option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                          <button
                            type="button"
                            onClick={openDoctorEditor}
                            title={`Manage ${currentTaxonomy.staff_label || 'Doctors / Staff'}`}
                            className="p-1 text-text-muted hover:text-accent hover:bg-surface-subtle border border-border rounded-sm transition-colors cursor-pointer h-[26px] w-[26px] flex items-center justify-center"
                          >
                            <Pencil className="w-2.5 h-2.5 stroke-[1.8]" />
                          </button>
                        </div>

                        {/* Next Action Filter */}
                        <select
                          value={followupActionFilter}
                          onChange={(e) => setFollowupActionFilter(e.target.value)}
                          className={`px-2 py-0.5 text-[11px] bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent max-w-[110px] h-[26px] ${
                            followupActionFilter !== 'all' ? 'border-text-primary font-semibold bg-surface-subtle' : ''
                          }`}
                          title="Filter by Next Action"
                        >
                          <option value="all">All Actions</option>
                          {crmDropdowns.next_actions.map((act) => (
                            <option key={act} value={act}>{act}</option>
                          ))}
                        </select>
                      </div>

                      {/* Divider (Desktop) */}
                      <div className="h-4 w-px bg-border/80 shrink-0 hidden md:block" />

                      {/* Search Input (Desktop) */}
                      <div className="relative shrink-0 hidden md:block">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        <input
                          type="text"
                          placeholder={`Search ${(currentTaxonomy.client_plural || 'customers').toLowerCase()}, phone, staff...`}
                          value={followupSearchInput}
                          onChange={(e) => setFollowupSearchInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setFollowupSearch(followupSearchInput);
                            }
                          }}
                          className="pl-8 pr-7 py-0.5 bg-surface-subtle border border-border rounded-sm text-[11px] text-text-primary focus:outline-none focus:border-accent w-44 lg:w-56 h-[26px]"
                        />
                        {followupSearchInput && (
                          <button
                            type="button"
                            onClick={() => {
                              setFollowupSearchInput('');
                              setFollowupSearch('');
                            }}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5"
                            title="Clear search"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Quick Reset All Filters Button */}
                      {(followupStatusFilter !== 'all' || followupProbabilityFilter !== 'all' || followupDoctorFilter !== 'all' || followupActionFilter !== 'all' || followupSearchInput.trim()) && (
                        <button
                          type="button"
                          onClick={() => {
                            setFollowupStatusFilter('all');
                            setFollowupProbabilityFilter('all');
                            setFollowupDoctorFilter('all');
                            setFollowupActionFilter('all');
                            setFollowupSearchInput('');
                            setFollowupSearch('');
                          }}
                          className="text-[11px] text-accent hover:underline flex items-center gap-0.5 px-1 py-0.5 rounded hover:bg-surface-subtle font-medium cursor-pointer shrink-0 ml-auto"
                          title="Reset all filters"
                        >
                          <X className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>

                    {/* Compact KPI Summary Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1 bg-surface border border-border rounded-sm text-xs">
                      <div className="flex items-center gap-3.5 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-text-muted stroke-[1.8]" />
                          <span className="text-[11px] text-text-muted">Total:</span>
                          <span className="font-bold text-text-primary font-mono text-xs">{customers.length}</span>
                        </div>
                        <span className="text-border text-xs hidden sm:inline">•</span>
                        <div className="flex items-center gap-1.5">
                          <Clock3 className="w-3.5 h-3.5 text-amber-600 stroke-[1.8]" />
                          <span className="text-[11px] text-amber-800 font-medium">Pending:</span>
                          <span className="font-bold text-amber-900 font-mono text-xs">
                            {customers.filter(c => c.status === 'follow-up' || c.status === 'new').length}
                          </span>
                        </div>
                        <span className="text-border text-xs hidden sm:inline">•</span>
                        <div className="flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20 stroke-[1.8]" />
                          <span className="text-[11px] text-rose-700 font-medium">Hot Leads:</span>
                          <span className="font-bold text-rose-900 font-mono text-xs">
                            {customers.filter(c => c.lead_probability === 'hot').length}
                          </span>
                        </div>
                        <span className="text-border text-xs hidden sm:inline">•</span>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[1.8]" />
                          <span className="text-[11px] text-emerald-800 font-medium">Converted:</span>
                          <span className="font-bold text-emerald-900 font-mono text-xs">
                            {customers.filter(c => c.converted).length}
                            <span className="text-[10px] text-emerald-600 ml-1 font-normal">
                              ({customers.length ? Math.round((customers.filter(c => c.converted).length / customers.length) * 100) : 0}%)
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Main Table + Customer Detail Drawer */}
                    <div className="flex-1 flex overflow-hidden gap-3">
                      {/* Customers Table */}
                      <div className={`flex-1 overflow-y-auto overflow-x-auto border border-border rounded-sm bg-surface ${selectedCustomer ? 'hidden md:block min-w-0' : ''}`}>
                        <table className="w-full text-left text-xs min-w-0">
                          <thead className="bg-surface-subtle border-b border-border text-text-secondary font-semibold text-[11px] sticky top-0 z-10">
                            <tr>
                              <th className="p-3 pl-4 w-[48%] min-w-[280px]">{currentTaxonomy.client_label || 'Customer'} & Tags</th>
                              <th className="p-3 w-[26%] min-w-[160px]">{(currentTaxonomy.staff_label ? currentTaxonomy.staff_label.split('/')[0].trim() : 'Assigned')} & {(currentTaxonomy.status_label || 'Outcome')}</th>
                              <th className="p-3 pr-4 w-[26%] min-w-[170px]">{(currentTaxonomy.followup_label || 'Follow-up')} & {(currentTaxonomy.actions_label || 'Action')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {loadingCustomers ? (
                              <tr>
                                <td colSpan={3} className="p-8 text-center text-text-muted">
                                  Loading {(currentTaxonomy.client_plural || 'customers').toLowerCase()}...
                                </td>
                              </tr>
                            ) : customers.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="p-8 text-center text-text-muted">
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
                                  if (diff < 0) fuBadge = <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-semibold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1 shrink-0"><AlertCircle className="w-2.5 h-2.5" />Overdue</span>;
                                  else if (diff === 0) fuBadge = <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1 shrink-0"><Clock className="w-2.5 h-2.5" />Today</span>;
                                  else if (diff === 1) fuBadge = <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1 shrink-0"><CalendarClock className="w-2.5 h-2.5" />Tomorrow</span>;
                                  else fuBadge = <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1 shrink-0"><Calendar className="w-2.5 h-2.5" />{cust.followup_date}</span>;
                                }

                                const concerns = Array.isArray(cust.primary_concerns) && cust.primary_concerns.length > 0
                                  ? cust.primary_concerns
                                  : (cust.health_concern ? [cust.health_concern] : []);
                                const services = Array.isArray(cust.interested_services) ? cust.interested_services : [];
                                const allTags = [
                                  ...concerns.map(c => ({ label: c, type: 'concern' as const })),
                                  ...services.map(s => ({ label: s, type: 'service' as const }))
                                ];

                                const rate = cust.conversion_rate != null
                                  ? cust.conversion_rate
                                  : (cust.lead_probability === 'hot' ? 90 : (cust.lead_probability === 'cold' ? 20 : 50));

                                return (
                                  <tr
                                    key={cust.id}
                                    onClick={() => handleSelectCustomer(cust)}
                                    className={`cursor-pointer transition-colors duration-150 ${
                                      isSelected ? 'bg-blue-50/50 border-l-2 border-l-accent' : 'hover:bg-surface-subtle/70'
                                    }`}
                                  >
                                    {/* 1. Customer & Tags (With inline Conversion Emoji + WhatsApp & Profile icons) */}
                                    <td className="p-3 pl-4 align-top">
                                      <div className="space-y-1.5 min-w-0">
                                        {/* Customer Identity & Phone */}
                                        <div className="space-y-0.5">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-bold text-text-primary text-[13px] tracking-tight">
                                              {cust.name || 'Customer'}
                                            </span>
                                            {(cust.completed_bookings_count ?? 0) > 0 || cust.client_type === 'repeat' ? (
                                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-0.5" title={`Repeat client (${cust.completed_bookings_count ?? 0} completed visits)`}>
                                                <UserCheck className="w-2.5 h-2.5 stroke-[2] shrink-0" />
                                                <span>Repeat</span>
                                                {(cust.completed_bookings_count ?? 0) > 0 && <span className="font-mono">({cust.completed_bookings_count})</span>}
                                              </span>
                                            ) : (
                                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-0.5" title="First-time lead">
                                                <UserPlus className="w-2.5 h-2.5 stroke-[2] shrink-0" />
                                                <span>Lead</span>
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2 font-mono text-[11px] text-text-muted flex-wrap">
                                            <span>{cust.phone}</span>
                                            {(cust.age || cust.location) && (
                                              <>
                                                <span className="opacity-40">•</span>
                                                <span className="font-sans text-[11px]">{[cust.age ? `${cust.age}y` : null, cust.location].filter(Boolean).join(', ')}</span>
                                              </>
                                            )}
                                            {(cust.last_chat_at || (cust as any).last_messaged_at) && (
                                              <>
                                                <span className="opacity-40">•</span>
                                                <span className="text-[10px] text-text-secondary flex items-center gap-1 font-sans font-medium">
                                                  <Clock className="w-2.5 h-2.5 text-text-muted shrink-0" />
                                                  <span>Last: {formatWhatsAppRelativeDate(cust.last_chat_at || (cust as any).last_messaged_at)}</span>
                                                </span>
                                              </>
                                            )}
                                          </div>
                                          {cust.last_message && (
                                            <div
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelectCustomer(cust);
                                                setDrawerActiveTab('chat');
                                              }}
                                              className="flex items-center gap-1.5 text-[11px] text-text-secondary hover:text-emerald-700 dark:hover:text-emerald-400 group cursor-pointer max-w-[340px] truncate pt-0.5"
                                              title={`Latest WhatsApp: "${cust.last_message}" (Click to view chat)`}
                                            >
                                              <MessageSquare className="w-3 h-3 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                                              <span className="truncate italic font-medium">"{cust.last_message}"</span>
                                            </div>
                                          )}
                                        </div>

                                        {/* Tags & Inline Note Row (Cleanly Left-Aligned) */}
                                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5" onClick={(e) => e.stopPropagation()}>
                                          {allTags.map((t, idx) => (
                                            <span
                                              key={idx}
                                              className={`text-[9px] px-1.5 py-0.5 rounded-sm font-semibold border ${
                                                t.type === 'concern'
                                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                              }`}
                                            >
                                              {t.label}
                                            </span>
                                          ))}

                                          {/* Inline Note Preview / Add Note Trigger */}
                                          {cust.latest_note ? (() => {
                                            const noteStyle = getNoteBadgeStyle(cust.latest_note_color);
                                            return (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setQuickNoteCustomer({ customerId: cust.id, name: cust.name || 'Customer' });
                                                  setQuickNoteText(cust.latest_note || '');
                                                  setQuickNoteColor((cust.latest_note_color || 'slate').toLowerCase());
                                                }}
                                                className={`text-[10px] font-medium flex items-center gap-1 group truncate max-w-[260px] border px-1.5 py-0.5 rounded transition-colors ${noteStyle.badge}`}
                                                title={`Note: ${cust.latest_note} (Click to view/edit)`}
                                              >
                                                <StickyNote className={`w-2.5 h-2.5 shrink-0 ${noteStyle.icon}`} />
                                                <span className="truncate italic">"{cust.latest_note}"</span>
                                              </button>
                                            );
                                          })() : (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setQuickNoteCustomer({ customerId: cust.id, name: cust.name || 'Customer' });
                                                setQuickNoteText('');
                                                setQuickNoteColor('slate');
                                              }}
                                              className="text-[10px] font-semibold text-accent hover:underline flex items-center gap-0.5 px-1 py-0.5 rounded hover:bg-surface-subtle transition-colors"
                                            >
                                              <Plus className="w-2.5 h-2.5 stroke-[2.5]" />
                                              <span>Add Notes</span>
                                            </button>
                                          )}
                                        </div>

                                          {/* Bottom Row: Minimal Warmth Box with Dropdown Chevron + WhatsApp & Profile Icons */}
                                          <div className="flex items-center gap-2 pt-2 border-t border-border/40" onClick={(e) => e.stopPropagation()}>
                                            {/* Warm / Cold / Hot Dropdown Button */}
                                            <div className="relative">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setActiveRatePopover(activeRatePopover?.customerId === cust.id ? null : { customerId: cust.id, currentRate: rate });
                                                }}
                                                className={`h-7 px-2 rounded-md border flex items-center gap-1.5 text-xs transition-all hover:scale-102 active:scale-95 shadow-2xs cursor-pointer ${
                                                  rate >= 75
                                                    ? 'bg-amber-50/90 border-amber-300 text-amber-700 hover:bg-amber-100'
                                                    : rate >= 40
                                                    ? 'bg-yellow-50/90 border-yellow-300 text-yellow-700 hover:bg-yellow-100'
                                                    : 'bg-blue-50/90 border-blue-200 text-blue-700 hover:bg-blue-100'
                                                }`}
                                                title={`Lead Warmth: ${rate >= 75 ? 'Hot (90%)' : rate >= 40 ? 'Warm (50%)' : 'Cold (20%)'} — Click to change`}
                                              >
                                                {rate >= 75 ? (
                                                  <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500/20 stroke-[2.2]" />
                                                ) : rate >= 40 ? (
                                                  <Sun className="w-3.5 h-3.5 text-amber-600 stroke-[2.2]" />
                                                ) : (
                                                  <Snowflake className="w-3.5 h-3.5 text-sky-500 stroke-[2.2]" />
                                                )}
                                                <ChevronDown className="w-3 h-3 opacity-60 shrink-0 stroke-[2.2]" />
                                              </button>

                                              {/* Quick Rate Picker Popover */}
                                              {activeRatePopover?.customerId === cust.id && (
                                                <div className="absolute left-0 bottom-full mb-1.5 z-30 w-44 bg-surface border border-border rounded-lg shadow-xl p-2 animate-in fade-in zoom-in-95 duration-150">
                                                    <div className="flex items-center justify-between text-[10px] text-text-muted mb-1.5 font-semibold">
                                                      <span>Set Lead Warmth</span>
                                                      <button onClick={() => setActiveRatePopover(null)} className="text-text-muted hover:text-text-primary p-0.5">
                                                        <X className="w-3 h-3" />
                                                      </button>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-1">
                                                      {[
                                                        { pct: 90, icon: Flame, label: 'Hot', color: 'text-amber-500 fill-amber-500/20' },
                                                        { pct: 50, icon: Sun, label: 'Warm', color: 'text-amber-500 stroke-[2.2]' },
                                                        { pct: 20, icon: Snowflake, label: 'Cold', color: 'text-sky-500 stroke-[2.2]' },
                                                      ].map((item) => {
                                                        const isSelected = (item.pct >= 75 && rate >= 75) || (item.pct === 50 && rate >= 40 && rate < 75) || (item.pct === 20 && rate < 40);
                                                        const IconComponent = item.icon;
                                                        return (
                                                          <button
                                                            key={item.pct}
                                                            type="button"
                                                            onClick={() => {
                                                              handleUpdateCustomer(cust.id, {
                                                                conversion_rate: item.pct,
                                                                lead_probability: item.pct >= 75 ? 'hot' : (item.pct <= 35 ? 'cold' : 'warm'),
                                                                converted: item.pct === 100,
                                                                status: item.pct === 100 ? 'converted' : undefined
                                                              });
                                                              setActiveRatePopover(null);
                                                            }}
                                                            className={`px-1 py-1.5 text-[10px] font-bold rounded-md border flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                                                              isSelected
                                                                ? 'bg-accent text-white border-accent shadow-xs'
                                                                : 'bg-surface hover:bg-surface-subtle border-border text-text-primary'
                                                            }`}
                                                          >
                                                            <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-white fill-white/20 stroke-[2.2]' : item.color}`} />
                                                            <span className="text-[9px] font-medium leading-none">{item.pct}%</span>
                                                          </button>
                                                        );
                                                      })}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                          {/* Action Icons: Small WhatsApp Icon & Small Profile Icon */}
                                          <div className="flex items-center gap-1.5">
                                            {/* WhatsApp Chat Trigger (opens side chat drawer directly) */}
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelectCustomer(cust);
                                                setDrawerActiveTab('chat');
                                              }}
                                              className="h-7 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md flex items-center gap-1 text-[11px] font-semibold transition-colors hover:shadow-2xs cursor-pointer"
                                              title="View & reply to WhatsApp chat alongside table"
                                            >
                                              <MessageSquare className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600 stroke-[1.8]" />
                                              <span className="text-[10px]">WhatsApp</span>
                                            </button>

                                            {/* Profile & Notes Trigger */}
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelectCustomer(cust);
                                                setDrawerActiveTab('profile');
                                              }}
                                              className="h-7 w-7 bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary border border-border rounded-md flex items-center justify-center transition-colors hover:shadow-2xs cursor-pointer"
                                              title="Open Customer Profile & Notes"
                                            >
                                              <User className="w-3.5 h-3.5 stroke-[2]" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </td>

                                    {/* 2. Assigned & Outcome */}
                                    <td className="p-3 align-top" onClick={(e) => e.stopPropagation()}>
                                      <div className="space-y-1.5 max-w-[200px]">
                                        {/* Assigned Staff Trigger */}
                                        <div>
                                          {renderStaffAssignTrigger({
                                            value: cust.preferred_doctor || '',
                                            onClick: (e) => {
                                              e.stopPropagation();
                                              openCustomerAssignPopover('customer', cust.id, cust.preferred_doctor || '', e.currentTarget);
                                            },
                                            placeholder: 'Unassigned',
                                            fullWidth: true,
                                          })}
                                        </div>

                                        {/* Outcome Status Dropdown */}
                                        <div className="relative">
                                          <select
                                            value={cust.call_status || (cust.status === 'converted' ? 'Converted' : (cust.status === 'follow-up' ? 'Info Given & Taken' : (cust.status === 'contacted' ? 'Requirements Gathered' : 'New (Fresh)')))}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              const lower = val.toLowerCase();
                                              const mappedStatus = lower.includes('converted') || lower.includes('confirmed')
                                                ? 'converted'
                                                : (lower.includes('info') || lower.includes('requirement') || lower.includes('pricing') || lower.includes('booked')
                                                  ? 'follow-up'
                                                  : (lower.includes('picked') || lower.includes('busy') || lower.includes('wrong')
                                                    ? 'contacted'
                                                    : 'new'));
                                              handleUpdateCustomer(cust.id, {
                                                call_status: val,
                                                status: mappedStatus as any,
                                                converted: mappedStatus === 'converted'
                                              });
                                            }}
                                            className="w-full h-7 px-2 py-0.5 rounded-md text-[11px] leading-tight font-semibold bg-surface border border-border shadow-2xs text-text-primary hover:border-border-hover focus:outline-none focus:ring-1 focus:ring-accent transition-colors table-control"
                                          >
                                            {crmDropdowns.outcome_statuses.map((st) => (
                                              <option key={st} value={st}>{st}</option>
                                            ))}
                                          </select>
                                        </div>
                                      </div>
                                    </td>

                                    {/* 3. Follow up & Action */}
                                    <td className="p-3 pr-4 align-top relative" onClick={(e) => e.stopPropagation()}>
                                      <div className="space-y-1.5 max-w-[200px]">
                                        {/* Date & Time Row */}
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          {fuBadge}
                                          <input
                                            type="date"
                                            value={cust.followup_date || ''}
                                            onChange={(e) => {
                                              const d = e.target.value;
                                              handleUpdateCustomer(cust.id, {
                                                followup_date: d,
                                                ...(d && !cust.followup_time ? { followup_time: '10:00 AM' } : {})
                                              });
                                            }}
                                            className="text-[11px] font-medium bg-surface border border-border rounded-md px-1.5 py-0.5 h-6 text-text-primary hover:border-border-hover shadow-2xs focus:outline-none focus:ring-1 focus:ring-accent table-control"
                                            title="Click to change follow-up date"
                                          />
                                          {cust.followup_date && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const curr = cust.followup_time || '10:00 AM';
                                                setActiveTimePopover(activeTimePopover?.customerId === cust.id ? null : { customerId: cust.id, currentTime: curr });
                                                setCustomTimeInput(curr);
                                              }}
                                              className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-medium bg-surface-subtle hover:bg-surface border border-border text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors"
                                              title="Click to adjust scheduled follow-up time"
                                            >
                                              <Clock className="w-2.5 h-2.5 text-accent shrink-0" />
                                              <span>{cust.followup_time || '10:00 AM'}</span>
                                            </button>
                                          )}
                                        </div>

                                        {/* Floating Quick Time Picker Popover */}
                                        {activeTimePopover?.customerId === cust.id && (
                                          <div className="absolute right-4 top-full mt-1 z-30 w-52 bg-surface border border-border rounded-lg shadow-xl p-2.5 animate-in fade-in zoom-in-95 duration-150">
                                            <div className="flex items-center justify-between text-[10px] text-text-muted mb-2">
                                              <span className="flex items-center gap-1 font-semibold text-text-primary">
                                                <Clock className="w-3 h-3 text-accent" />
                                                <span>Set Follow-up Time</span>
                                              </span>
                                              <button onClick={() => setActiveTimePopover(null)} className="text-text-muted hover:text-text-primary p-0.5">
                                                <X className="w-3 h-3" />
                                              </button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-1 mb-2">
                                              {[
                                                '09:00 AM', '10:00 AM', '11:00 AM',
                                                '12:00 PM', '02:00 PM', '03:00 PM',
                                                '04:00 PM', '05:00 PM', '06:00 PM'
                                              ].map((tStr) => (
                                                <button
                                                  key={tStr}
                                                  type="button"
                                                  onClick={() => {
                                                    handleUpdateCustomer(cust.id, { followup_time: tStr });
                                                    setActiveTimePopover(null);
                                                  }}
                                                  className={`px-1 py-1 text-[10px] font-mono font-semibold rounded border transition-colors ${
                                                    (cust.followup_time || '10:00 AM') === tStr
                                                      ? 'bg-accent text-white border-accent shadow-xs'
                                                      : 'bg-surface hover:bg-surface-subtle border-border text-text-primary'
                                                  }`}
                                                >
                                                  {tStr}
                                                </button>
                                              ))}
                                            </div>
                                            <div className="pt-1.5 border-t border-border flex gap-1">
                                              <input
                                                type="text"
                                                placeholder="e.g. 10:30 AM"
                                                value={customTimeInput}
                                                onChange={(e) => setCustomTimeInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (customTimeInput.trim()) {
                                                      handleUpdateCustomer(cust.id, { followup_time: customTimeInput.trim() });
                                                      setActiveTimePopover(null);
                                                    }
                                                  }
                                                }}
                                                className="flex-1 px-2 py-1 text-[11px] bg-surface-subtle border border-border rounded text-text-primary placeholder:text-text-muted"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  if (customTimeInput.trim()) {
                                                    handleUpdateCustomer(cust.id, { followup_time: customTimeInput.trim() });
                                                    setActiveTimePopover(null);
                                                  }
                                                }}
                                                className="px-2.5 py-1 bg-accent hover:bg-accent-hover text-white text-[10px] font-semibold rounded"
                                              >
                                                Set
                                              </button>
                                            </div>
                                          </div>
                                        )}

                                        {/* Next Action Dropdown */}
                                        <select
                                          value={cust.next_action || 'Call Again'}
                                          onChange={(e) => handleUpdateCustomer(cust.id, { next_action: e.target.value })}
                                          className="w-full h-7 px-2 py-0.5 rounded-md text-[11px] leading-tight font-semibold bg-surface-subtle border border-border text-text-primary hover:border-border-hover shadow-2xs focus:outline-none focus:ring-1 focus:ring-accent transition-colors table-control"
                                        >
                                          {crmDropdowns.next_actions.map((act) => (
                                            <option key={act} value={act}>{act}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Customer Detail Drawer */}
                      {renderCustomerDetailDrawer()}
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
                            value={followupSearchInput}
                            onChange={(e) => setFollowupSearchInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setFollowupSearch(followupSearchInput);
                              }
                            }}
                            className="pl-8 pr-3 py-1 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:outline-none focus:border-accent w-64"
                          />
                        </div>

                        <select
                          value={followupStatusFilter}
                          onChange={(e) => setFollowupStatusFilter(e.target.value)}
                          className="px-2.5 py-1 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                        >
                          <option value="all">All Outcomes / Statuses</option>
                          <optgroup label="Standard Statuses">
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="follow-up">Follow-up</option>
                            <option value="converted">Converted</option>
                            <option value="lost">Lost</option>
                          </optgroup>
                          {crmDropdowns.outcome_statuses.length > 0 && (
                            <optgroup label="Configured Outcomes">
                              {crmDropdowns.outcome_statuses.map((st) => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                            </optgroup>
                          )}
                        </select>

                        <select
                          value={followupProbabilityFilter}
                          onChange={(e) => setFollowupProbabilityFilter(e.target.value)}
                          className="px-2.5 py-1 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                        >
                          <option value="all">All Leads</option>
                          <option value="hot">Hot (90%)</option>
                          <option value="warm">Warm (50%)</option>
                          <option value="cold">Cold (20%)</option>
                        </select>

                        <select
                          value={followupActionFilter}
                          onChange={(e) => setFollowupActionFilter(e.target.value)}
                          className={`px-2.5 py-1 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent ${
                            followupActionFilter !== 'all' ? 'border-text-primary font-semibold' : ''
                          }`}
                        >
                          <option value="all">All Actions</option>
                          {crmDropdowns.next_actions.map((act) => (
                            <option key={act} value={act}>{act}</option>
                          ))}
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
                      <div className={`flex-1 overflow-y-auto overflow-x-auto border border-border rounded-sm bg-surface ${selectedCustomer ? 'hidden md:block min-w-0' : ''}`}>
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
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-semibold text-text-primary text-[11px]">{cust.name || 'Customer'}</span>
                                        {(cust.completed_bookings_count ?? 0) > 0 || cust.client_type === 'repeat' ? (
                                          <span className="text-[9px] font-bold px-1 py-0.2 rounded-xs bg-amber-50 text-amber-700 border border-amber-200 shrink-0 flex items-center gap-0.5">
                                            <UserCheck className="w-2.5 h-2.5 stroke-[2] shrink-0" />
                                            <span>Repeat</span>
                                            {(cust.completed_bookings_count ?? 0) > 0 && <span className="font-mono">({cust.completed_bookings_count})</span>}
                                          </span>
                                        ) : (
                                          <span className="text-[9px] font-semibold px-1 py-0.2 rounded-xs bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 flex items-center gap-0.5">
                                            <UserPlus className="w-2.5 h-2.5 stroke-[2] shrink-0" />
                                            <span>Lead</span>
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="p-2.5 font-mono text-[11px] text-text-muted whitespace-nowrap">
                                      <div>{cust.phone}</div>
                                      {cust.last_chat_at && (
                                        <div className="text-[10px] text-text-secondary mt-0.5 flex items-center gap-1 font-mono" title={`Last WhatsApp: ${formatFullDateTimeDetailed(cust.last_chat_at)}`}>
                                          <Clock className="w-2.5 h-2.5 text-text-muted shrink-0" />
                                          <span>Last: {formatWhatsAppRelativeDate(cust.last_chat_at)}</span>
                                        </div>
                                      )}
                                      {cust.last_message && (
                                        <div
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectCustomer(cust);
                                            setDrawerActiveTab('chat');
                                          }}
                                          className="text-[10px] font-sans text-text-secondary hover:text-emerald-700 dark:hover:text-emerald-400 mt-0.5 flex items-center gap-1 cursor-pointer max-w-[200px] truncate"
                                          title={`Latest WhatsApp: "${cust.last_message}" (Click to view chat)`}
                                        >
                                          <MessageSquare className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                          <span className="truncate italic font-medium">"{cust.last_message}"</span>
                                        </div>
                                      )}
                                    </td>
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
                                    <td className="p-2.5 text-text-secondary whitespace-nowrap text-[11px]" onClick={(e) => e.stopPropagation()}>
                                      {renderStaffAssignTrigger({
                                        value: cust.preferred_doctor || '',
                                        onClick: (e) => {
                                          e.stopPropagation();
                                          openCustomerAssignPopover('customer', cust.id, cust.preferred_doctor || '', e.currentTarget);
                                        },
                                        placeholder: 'Unassigned',
                                      })}
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
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectCustomer(cust);
                                            setDrawerActiveTab('chat');
                                          }}
                                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold rounded-sm border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
                                          title="Open WhatsApp chat alongside table"
                                        >
                                          <MessageSquare className="w-3 h-3 fill-emerald-600 text-emerald-600 stroke-[1.5]" /> Chat
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectCustomer(cust);
                                            setDrawerActiveTab('profile');
                                          }}
                                          className="px-2 py-1 bg-accent hover:bg-accent-hover text-white text-[11px] rounded-sm transition-colors cursor-pointer flex items-center gap-1"
                                          title="View customer profile and notes"
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

                      {/* Customer Detail Drawer in Database View */}
                      {renderCustomerDetailDrawer()}
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
{/* ── MANAGE CRM DROPDOWN OPTIONS MODAL ───────────────────────── */}
            {dropdownOptionsModalOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4"
                onClick={() => setDropdownOptionsModalOpen(false)}
              >
                <div
                  className="w-full max-w-xl bg-surface border border-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface-subtle/60 shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                        <Sliders className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-text-primary">
                          Manage CRM Dropdown Options
                        </h3>
                        <p className="text-[11px] text-text-muted">
                          Add, edit, or remove options used across customer table dropdowns.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDropdownOptionsModalOpen(false)}
                      className="p-1 text-text-muted hover:text-text-primary rounded-md hover:bg-surface-subtle transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4 stroke-[1.8]" />
                    </button>
                  </div>

                  {/* Category Tabs */}
                  <div className="px-5 pt-3 border-b border-border bg-surface shrink-0">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                      {[
                        { id: 'outcome_statuses' as const, label: 'Outcome Statuses', count: editingDropdowns.outcome_statuses?.length || 0 },
                        { id: 'next_actions' as const, label: 'Next Actions', count: editingDropdowns.next_actions?.length || 0 },
                        { id: 'services_list' as const, label: 'Services', count: editingDropdowns.services_list?.length || 0 },
                        { id: 'concerns_list' as const, label: 'Concerns / Requirements', count: editingDropdowns.concerns_list?.length || 0 },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setDropdownActiveTab(tab.id);
                            setEditingItemIndex(null);
                            setEditingItemText('');
                          }}
                          className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                            dropdownActiveTab === tab.id
                              ? 'bg-accent text-white shadow-xs'
                              : 'bg-surface-subtle hover:bg-surface border border-border text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                              dropdownActiveTab === tab.id
                                ? 'bg-white/20 text-white'
                                : 'bg-surface text-text-muted border border-border'
                            }`}
                          >
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Modal Body / Items List */}
                  <div className="p-5 overflow-y-auto space-y-4 flex-1">
                    {/* Add New Item Input */}
                    <div>
                      <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                        Add New {
                          dropdownActiveTab === 'outcome_statuses' ? 'Outcome Status' :
                          dropdownActiveTab === 'next_actions' ? 'Next Action' :
                          dropdownActiveTab === 'services_list' ? 'Service' : 'Concern'
                        }
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newDropdownItemInput}
                          onChange={(e) => setNewDropdownItemInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddDropdownItem();
                            }
                          }}
                          placeholder={`Type a new ${
                            dropdownActiveTab === 'outcome_statuses' ? 'outcome status (e.g. Needs Follow-up)' :
                            dropdownActiveTab === 'next_actions' ? 'next action (e.g. Schedule Call)' :
                            dropdownActiveTab === 'services_list' ? 'service (e.g. Physiotherapy)' : 'concern (e.g. Shoulder pain)'
                          }...`}
                          className="flex-1 px-3 py-1.5 text-xs bg-surface-subtle border border-border rounded-md text-text-primary focus:bg-surface focus:border-accent focus:outline-none transition-colors"
                        />
                        <button
                          type="button"
                          onClick={handleAddDropdownItem}
                          disabled={!newDropdownItemInput.trim()}
                          className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-md transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5 shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2]" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>

                    {/* Current Items List */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                          Current Items ({(editingDropdowns[dropdownActiveTab] || []).length})
                        </span>
                        <button
                          type="button"
                          onClick={handleResetCategoryDefaults}
                          className="text-[11px] text-text-muted hover:text-accent flex items-center gap-1 cursor-pointer transition-colors"
                          title="Reset this category to default options"
                        >
                          <RotateCcw className="w-3 h-3 stroke-[1.8]" />
                          <span>Reset to Defaults</span>
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                        {(editingDropdowns[dropdownActiveTab] || []).length === 0 ? (
                          <div className="p-4 text-center border border-dashed border-border rounded-md text-text-muted text-xs">
                            No items configured. Type above to add your first option.
                          </div>
                        ) : (
                          (editingDropdowns[dropdownActiveTab] || []).map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-2 px-3 py-2 bg-surface-subtle border border-border rounded-md hover:border-border-hover transition-colors group"
                            >
                              {editingItemIndex === idx ? (
                                <div className="flex items-center gap-1.5 flex-1">
                                  <input
                                    type="text"
                                    value={editingItemText}
                                    onChange={(e) => setEditingItemText(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSaveEditItem(idx);
                                      } else if (e.key === 'Escape') {
                                        setEditingItemIndex(null);
                                      }
                                    }}
                                    className="flex-1 px-2 py-0.5 text-xs bg-surface border border-accent rounded text-text-primary focus:outline-none font-medium"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditItem(idx)}
                                    className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                                    title="Save change"
                                  >
                                    <Check className="w-3 h-3 stroke-[2.5]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingItemIndex(null)}
                                    className="p-1 bg-surface-subtle hover:bg-surface text-text-muted hover:text-text-primary border border-border rounded cursor-pointer"
                                    title="Cancel"
                                  >
                                    <X className="w-3 h-3 stroke-[2]" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-xs font-semibold text-text-primary truncate">
                                    {item}
                                  </span>
                                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditItem(idx, item)}
                                      className="p-1 text-text-muted hover:text-accent rounded hover:bg-surface cursor-pointer transition-colors"
                                      title="Rename / Update this option"
                                    >
                                      <Pencil className="w-3 h-3 stroke-[2]" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveDropdownItem(item)}
                                      className="p-1 text-text-muted hover:text-rose-600 rounded hover:bg-surface cursor-pointer transition-colors"
                                      title="Remove this option"
                                    >
                                      <Trash2 className="w-3 h-3 stroke-[1.8]" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface-subtle/50 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDropdownOptionsModalOpen(false)}
                      className="px-3.5 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary rounded-md hover:bg-surface-subtle transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={savingDropdownOptions}
                      onClick={handleSaveAllDropdowns}
                      className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-md transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
                    >
                      <Save className="w-3.5 h-3.5 stroke-[1.8]" />
                      <span>{savingDropdownOptions ? 'Saving Options...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── QUICK NOTE MODAL (TABLE INLINE TRIGGER) ─────────────────────── */}
            {quickNoteCustomer && (
              <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs" onClick={() => setQuickNoteCustomer(null)}>
                <div className="bg-surface border border-border rounded-lg shadow-2xl w-full max-w-md p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <StickyNote className={`w-4 h-4 transition-colors ${getNoteBadgeStyle(quickNoteColor).icon}`} />
                      <h3 className="text-xs font-bold text-text-primary">Note for {quickNoteCustomer.name}</h3>
                    </div>
                    <button
                      onClick={() => setQuickNoteCustomer(null)}
                      className="text-text-muted hover:text-text-primary p-1 rounded-md hover:bg-surface-subtle"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] text-text-muted font-medium block mb-1">Note Content</label>
                    <textarea
                      rows={3}
                      value={quickNoteText}
                      onChange={(e) => setQuickNoteText(e.target.value)}
                      placeholder="e.g. Needs consultation on lower back pain. Free after 4 PM."
                      className="w-full px-3 py-2 text-xs bg-surface-subtle border border-border rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-accent resize-none placeholder:text-text-muted"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-text-muted">Color:</span>
                      {['slate', 'blue', 'amber', 'rose', 'emerald', 'violet'].map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setQuickNoteColor(col)}
                          className={`w-4 h-4 rounded-full border transition-all ${
                            col === 'slate' ? 'bg-slate-400' :
                            col === 'blue' ? 'bg-blue-400' :
                            col === 'amber' ? 'bg-amber-400' :
                            col === 'rose' ? 'bg-rose-400' :
                            col === 'emerald' ? 'bg-emerald-400' : 'bg-violet-400'
                          } ${quickNoteColor === col ? 'ring-2 ring-accent ring-offset-1 scale-110' : 'opacity-70 hover:opacity-100'}`}
                          title={col}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuickNoteCustomer(null)}
                        className="px-3 py-1 text-xs font-medium text-text-secondary hover:text-text-primary rounded-md hover:bg-surface-subtle"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!quickNoteText.trim() || savingQuickNote}
                        onClick={handleSaveQuickNote}
                        className="px-3 py-1 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-md transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
                      >
                        <Save className="w-3 h-3" />
                        <span>{savingQuickNote ? 'Saving...' : 'Save Note'}</span>
                      </button>
                    </div>
                  </div>
                </div>
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
                        {renderStaffAssignTrigger({
                          value: addCustomerForm.preferred_doctor,
                          onClick: (e) => {
                            e.stopPropagation();
                            openCustomerAssignPopover('add_form', undefined, addCustomerForm.preferred_doctor, e.currentTarget);
                          },
                          placeholder: `— Select ${currentTaxonomy.staff_label || 'Staff / Doctor'} —`,
                          fullWidth: true,
                        })}
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
                        <FollowupTimeInput
                          value={addCustomerForm.followup_time || '10:00 AM'}
                          onChange={(newTime) => setAddCustomerForm(p => ({...p, followup_time: newTime}))}
                          size="md"
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

            {/* ── VIEW: REPEAT CLIENTS WORKSPACE ───────────────────── */}
            {activeNav === 'repeat_clients' && (
              <div className="flex-1 flex flex-col overflow-hidden space-y-3">
                {/* Header with Title, Retention Strategy Overview, and Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border pb-2.5 pt-1">
                  <div>
                    <h3 className="font-semibold text-sm text-text-primary flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-amber-500 stroke-[1.8]" />
                      <span>Repeat & Retained {currentTaxonomy.client_plural || 'Clients'}</span>
                    </h3>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      Monitor patient retention, checkup velocity, track recurring visits, and re-engage regular clients.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Export Repeat Clients CSV */}
                    <button
                      type="button"
                      onClick={() => {
                        const repeatList = customers.filter(c => (c.completed_bookings_count ?? 0) > 0 || c.client_type === 'repeat');
                        const headers = ['Name', 'Phone', 'Age', 'Location', 'Completed Visits', 'Total Bookings', 'Last Visit Date', 'Last Visit Service', 'Days Since Last Visit', 'Retention Status', 'Preferred Doctor'];
                        const rows = repeatList.map(c => [
                          `"${(c.name || '').replace(/"/g, '""')}"`,
                          `"${c.phone}"`,
                          c.age || '',
                          `"${(c.location || '').replace(/"/g, '""')}"`,
                          c.completed_bookings_count || 0,
                          c.total_bookings_count || 0,
                          (c.last_visit_date || c.last_visited) ? new Date(c.last_visit_date || c.last_visited!).toLocaleDateString() : '',
                          `"${(c.last_visit_service || '').replace(/"/g, '""')}"`,
                          c.days_since_last_visit != null ? c.days_since_last_visit : '',
                          c.retention_status || '',
                          `"${(c.preferred_doctor || '').replace(/"/g, '""')}"`
                        ]);
                        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement('a');
                        link.setAttribute('href', encodedUri);
                        link.setAttribute('download', `repeat_clients_${new Date().toISOString().split('T')[0]}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary border border-border text-xs font-medium rounded-sm transition-colors cursor-pointer"
                      title="Export repeat client records to CSV"
                    >
                      <Download className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>Export CSV</span>
                    </button>

                    {/* Schedule Booking */}
                    <button
                      type="button"
                      onClick={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        const dStr = tomorrow.toISOString().split('T')[0];
                        setNewBookingForm({
                          contact_name: '',
                          contact_phone: '',
                          service: currentTaxonomy.default_service || 'Consultation',
                          date: dStr,
                          time: '10:00',
                          price: 0,
                          notes: 'Repeat client appointment',
                        });
                        setIsAddBookingOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors cursor-pointer shrink-0"
                    >
                      <CalendarClock className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>Book Appointment</span>
                    </button>

                    {/* Refresh */}
                    <button
                      type="button"
                      onClick={() => {
                        loadCustomers();
                        loadBookings();
                      }}
                      className="px-2.5 py-1.5 bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary border border-border rounded-sm text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      title="Refresh"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${loadingCustomers ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* ── KPI Retention Metric Cards ── */}
                {(() => {
                  const allRepeat = customers.filter(c => (c.completed_bookings_count ?? 0) > 0 || c.client_type === 'repeat');
                  const activeCount = allRepeat.filter(c => c.retention_status === 'active' || (c.days_since_last_visit != null && c.days_since_last_visit <= 30)).length;
                  const dueCount = allRepeat.filter(c => c.retention_status === 'due' || (c.days_since_last_visit != null && c.days_since_last_visit > 30 && c.days_since_last_visit <= 60)).length;
                  const lapsedCount = allRepeat.filter(c => c.retention_status === 'lapsed' || (c.days_since_last_visit != null && c.days_since_last_visit > 60)).length;
                  const vipCount = allRepeat.filter(c => (c.completed_bookings_count ?? 0) >= 3).length;

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      <div className="p-3 bg-surface border border-border rounded-sm flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-text-muted font-medium">Total Repeat</p>
                          <p className="text-base font-bold text-text-primary mt-0.5">
                            {allRepeat.length}
                            <span className="text-[10px] text-amber-600 font-normal ml-1">
                              ({customers.length ? Math.round((allRepeat.length / customers.length) * 100) : 0}% of base)
                            </span>
                          </p>
                        </div>
                        <UserCheck className="w-4 h-4 text-amber-500 stroke-[1.5]" />
                      </div>

                      <div className="p-3 bg-surface border border-emerald-200/70 bg-emerald-50/20 rounded-sm flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-emerald-800 font-medium">Active (&lt;30d)</p>
                          <p className="text-base font-bold text-emerald-900 mt-0.5">{activeCount}</p>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[1.5]" />
                      </div>

                      <div className="p-3 bg-surface border border-amber-200/70 bg-amber-50/20 rounded-sm flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-amber-800 font-medium">Due for Checkup (30-60d)</p>
                          <p className="text-base font-bold text-amber-900 mt-0.5">{dueCount}</p>
                        </div>
                        <Clock className="w-4 h-4 text-amber-600 stroke-[1.5]" />
                      </div>

                      <div className="p-3 bg-surface border border-rose-200/70 bg-rose-50/20 rounded-sm flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-rose-800 font-medium">At-Risk / Lapsed (&gt;60d)</p>
                          <p className="text-base font-bold text-rose-900 mt-0.5">{lapsedCount}</p>
                        </div>
                        <AlertCircle className="w-4 h-4 text-rose-600 stroke-[1.5]" />
                      </div>

                      <div className="p-3 bg-surface border border-purple-200/70 bg-purple-50/20 rounded-sm flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-purple-800 font-medium">VIP Loyalists (3+)</p>
                          <p className="text-base font-bold text-purple-900 mt-0.5">{vipCount}</p>
                        </div>
                        <Star className="w-4 h-4 text-purple-600 fill-purple-400 stroke-[1.5]" />
                      </div>
                    </div>
                  );
                })()}

                {/* ── Retention Health Filter & Search Controls ── */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 bg-surface border border-border rounded-sm">
                  {/* Health Filter Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full shrink-0">
                    <span className="text-[11px] font-medium text-text-muted mr-1">Retention:</span>
                    {[
                      { key: 'all', label: 'All Repeat' },
                      { key: 'active', label: 'Active (<30d)', dot: 'bg-emerald-500' },
                      { key: 'due', label: 'Due for Checkup (30-60d)', dot: 'bg-amber-500' },
                      { key: 'lapsed', label: 'At-Risk (>60d)', dot: 'bg-rose-500' },
                      { key: 'vip', label: 'VIPs (3+ Visits)', dot: 'bg-purple-500' },
                    ].map((st) => (
                      <button
                        key={st.key}
                        type="button"
                        onClick={() => setRepeatHealthFilter(st.key as any)}
                        className={`px-2.5 py-0.5 text-xs rounded-sm border transition-colors cursor-pointer flex items-center gap-1.5 ${
                          repeatHealthFilter === st.key
                            ? 'bg-surface-subtle border-text-primary font-semibold text-text-primary'
                            : 'bg-surface border-border text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
                        }`}
                      >
                        {st.dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />}
                        <span>{st.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Doctor Filter & Search */}
                  <div className="flex items-center gap-2">
                    <select
                      value={repeatDoctorFilter}
                      onChange={(e) => setRepeatDoctorFilter(e.target.value)}
                      className="px-2.5 py-1 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent max-w-[160px]"
                    >
                      <option value="all">All Doctors / Staff</option>
                      {categorizedStaffOptions.teamDoctors.length > 0 && (
                        <optgroup label="Doctors (Team Login)">
                          {categorizedStaffOptions.teamDoctors.map((s) => (
                            <option key={s.value} value={s.value}>{s.value}</option>
                          ))}
                        </optgroup>
                      )}
                      {categorizedStaffOptions.sales.length > 0 && (
                        <optgroup label="Sales & Support">
                          {categorizedStaffOptions.sales.map((s) => (
                            <option key={s.value} value={s.value}>{s.value}</option>
                          ))}
                        </optgroup>
                      )}
                      {categorizedStaffOptions.predefinedDoctors.length > 0 && (
                        <optgroup label="Doctors & Consultants (Presets)">
                          {categorizedStaffOptions.predefinedDoctors.map((s) => (
                            <option key={s.value} value={s.value}>{s.value}</option>
                          ))}
                        </optgroup>
                      )}
                      {categorizedStaffOptions.other.length > 0 && (
                        <optgroup label="Staff & Administration">
                          {categorizedStaffOptions.other.map((s) => (
                            <option key={s.value} value={s.value}>{s.value}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        type="text"
                        placeholder="Search repeat clients..."
                        value={repeatSearch}
                        onChange={(e) => setRepeatSearch(e.target.value)}
                        className="pl-8 pr-3 py-1 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:outline-none focus:border-accent w-48"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Repeat Clients Table & Drawer ── */}
                <div className="flex-1 flex overflow-hidden gap-3">
                  <div className="flex-1 overflow-y-auto overflow-x-auto border border-border rounded-sm bg-surface">
                    <table className="w-full text-left text-xs min-w-[760px]">
                      <thead className="bg-surface-subtle border-b border-border text-text-secondary font-medium text-[11px] sticky top-0 z-10">
                        <tr>
                          <th className="p-2.5 pl-4">Client & Contact</th>
                          <th className="p-2.5">Visits & Loyalty</th>
                          <th className="p-2.5">Last Visit Details</th>
                          <th className="p-2.5">Retention Status</th>
                          <th className="p-2.5">Assigned Staff</th>
                          <th className="p-2.5">Health Requirement</th>
                          <th className="p-2.5 text-right pr-4">Direct Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {loadingCustomers ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-text-muted">
                              <div className="flex items-center justify-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                                <span>Loading repeat clients...</span>
                              </div>
                            </td>
                          </tr>
                        ) : (() => {
                          const repeatList = (customers || []).filter((c) => {
                            if (!c) return false;
                            const isRepeat = (c.completed_bookings_count ?? 0) > 0 || c.client_type === 'repeat';
                            if (!isRepeat) return false;

                            if (repeatSearch) {
                              const q = repeatSearch.toLowerCase();
                              const matches =
                                (c.name || '').toLowerCase().includes(q) ||
                                (c.phone || '').toLowerCase().includes(q) ||
                                (c.health_concern || '').toLowerCase().includes(q) ||
                                (c.last_visit_service || '').toLowerCase().includes(q) ||
                                (c.preferred_doctor || '').toLowerCase().includes(q);
                              if (!matches) return false;
                            }

                            if (repeatDoctorFilter !== 'all') {
                              const doc = c.last_visit_doctor || c.preferred_doctor || '';
                              if (doc !== repeatDoctorFilter) return false;
                            }

                            if (repeatHealthFilter === 'active') {
                              return c.retention_status === 'active' || (c.days_since_last_visit != null && c.days_since_last_visit <= 30);
                            }
                            if (repeatHealthFilter === 'due') {
                              return c.retention_status === 'due' || (c.days_since_last_visit != null && c.days_since_last_visit > 30 && c.days_since_last_visit <= 60);
                            }
                            if (repeatHealthFilter === 'lapsed') {
                              return c.retention_status === 'lapsed' || (c.days_since_last_visit != null && c.days_since_last_visit > 60);
                            }
                            if (repeatHealthFilter === 'vip') {
                              return (c.completed_bookings_count ?? 0) >= 3;
                            }

                            return true;
                          });

                          if (repeatList.length === 0) {
                            return (
                              <tr>
                                <td colSpan={7} className="p-8 text-center text-text-muted space-y-1">
                                  <UserCheck className="w-6 h-6 mx-auto text-text-muted stroke-[1.2] mb-1" />
                                  <p className="font-medium text-text-secondary">No repeat clients found</p>
                                  <p className="text-[11px]">
                                    {repeatSearch || repeatHealthFilter !== 'all' || repeatDoctorFilter !== 'all'
                                      ? 'Try clearing your filters or search term'
                                      : 'Clients who complete appointments will automatically appear here as repeat clients.'}
                                  </p>
                                </td>
                              </tr>
                            );
                          }

                          return repeatList.map((cust) => {
                            const completedVisits = cust.completed_bookings_count ?? 0;
                            const isVip = completedVisits >= 3;
                            const isSelected = selectedCustomer?.id === cust.id;

                            return (
                              <tr
                                key={cust.id}
                                onClick={() => handleSelectCustomer(cust)}
                                className={`cursor-pointer transition-colors duration-150 ${
                                  isSelected ? 'bg-amber-50/40 border-l-2 border-l-amber-500' : 'hover:bg-surface-subtle/70'
                                }`}
                              >
                                {/* Client & Contact */}
                                <td className="p-2.5 pl-4">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-text-primary text-[12px]">{cust.name || 'Client'}</span>
                                    {isVip && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-xs bg-purple-50 text-purple-700 border border-purple-200 shrink-0 flex items-center gap-0.5">
                                        <Star className="w-2.5 h-2.5 text-purple-600 fill-purple-400" />
                                        <span>VIP</span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="font-mono text-[10px] text-text-muted mt-0.5">{cust.phone}</div>
                                  {(cust.age || cust.location) && (
                                    <div className="text-[10px] text-text-muted mt-0.5 flex items-center gap-1">
                                      {cust.age && <span>{cust.age}y</span>}
                                      {cust.age && cust.location && <span>·</span>}
                                      {cust.location && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{cust.location}</span>}
                                    </div>
                                  )}
                                </td>

                                {/* Visits & Loyalty */}
                                <td className="p-2.5 whitespace-nowrap">
                                  <div className="flex items-center gap-1">
                                    <span className="font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-sm border border-amber-300/80 text-[11px]">
                                      {completedVisits} completed
                                    </span>
                                    {cust.total_bookings_count != null && cust.total_bookings_count > completedVisits && (
                                      <span className="text-[10px] text-text-muted font-mono" title={`${cust.total_bookings_count} total booked`}>
                                        ({cust.total_bookings_count} total)
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Last Visit Details */}
                                <td className="p-2.5 text-[11px]">
                                  {(() => {
                                    const visitDate = cust.last_visit_date || cust.last_visited;
                                    if (visitDate) {
                                      const d = new Date(visitDate);
                                      const formattedDate = !isNaN(d.getTime())
                                        ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                        : visitDate;
                                      const docRaw = cust.last_visit_doctor || cust.preferred_doctor;
                                      const docName = docRaw ? docRaw.replace(/^Dr\.\s*/i, '').trim() : null;
                                      return (
                                        <div>
                                          <div className="font-medium text-text-primary flex items-center gap-1">
                                            <span>{formattedDate}</span>
                                            {cust.days_since_last_visit != null && (
                                              <span className="text-[10px] text-text-muted font-normal font-mono">
                                                {cust.days_since_last_visit === 0 ? '(Today)' : cust.days_since_last_visit === 1 ? '(1d ago)' : `(${cust.days_since_last_visit}d ago)`}
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-[10px] text-text-secondary truncate max-w-[170px] mt-0.5">
                                            {cust.last_visit_service || 'Consultation'}
                                            {docName && <span> • Dr. {docName}</span>}
                                          </div>
                                        </div>
                                      );
                                    }
                                    return <span className="text-text-muted text-[11px]">—</span>;
                                  })()}
                                </td>

                                {/* Retention Status */}
                                <td className="p-2.5 whitespace-nowrap">
                                  {cust.retention_status === 'active' || (cust.days_since_last_visit != null && cust.days_since_last_visit <= 30) ? (
                                    <span className="px-2 py-0.5 rounded-sm text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 w-fit">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                      <span>Active Regular (&lt;30d)</span>
                                    </span>
                                  ) : cust.retention_status === 'due' || (cust.days_since_last_visit != null && cust.days_since_last_visit > 30 && cust.days_since_last_visit <= 60) ? (
                                    <span className="px-2 py-0.5 rounded-sm text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 w-fit">
                                      <Clock className="w-2.5 h-2.5 text-amber-700" />
                                      <span>Due for Checkup (30-60d)</span>
                                    </span>
                                  ) : cust.retention_status === 'lapsed' || (cust.days_since_last_visit != null && cust.days_since_last_visit > 60) ? (
                                    <span className="px-2 py-0.5 rounded-sm text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 w-fit">
                                      <AlertCircle className="w-2.5 h-2.5 text-rose-700" />
                                      <span>At-Risk / Lapsed (&gt;60d)</span>
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-sm text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                      Repeat
                                    </span>
                                  )}
                                </td>

                                {/* Assigned Staff */}
                                <td className="p-2.5 text-text-secondary whitespace-nowrap text-[11px]" onClick={(e) => e.stopPropagation()}>
                                  {renderStaffAssignTrigger({
                                    value: cust.preferred_doctor || '',
                                    onClick: (e) => {
                                      e.stopPropagation();
                                      openCustomerAssignPopover('customer', cust.id, cust.preferred_doctor || '', e.currentTarget);
                                    },
                                    placeholder: 'Unassigned',
                                  })}
                                </td>

                                {/* Health Requirement */}
                                <td className="p-2.5 text-[11px] text-text-secondary max-w-[150px] truncate" title={cust.health_concern || ''}>
                                  {cust.health_concern || '—'}
                                </td>

                                {/* Direct Actions */}
                                <td className="p-2.5 text-right pr-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1">
                                    {/* Book Next Session */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const tomorrow = new Date();
                                        tomorrow.setDate(tomorrow.getDate() + 1);
                                        const dStr = tomorrow.toISOString().split('T')[0];
                                        setNewBookingForm({
                                          contact_name: cust.name || '',
                                          contact_phone: cust.phone || '',
                                          service: cust.last_visit_service || currentTaxonomy.default_service || 'Consultation',
                                          date: dStr,
                                          time: '10:00',
                                          price: 0,
                                          notes: `Follow-up session for repeat client (${completedVisits} previous visits)`,
                                        });
                                        setIsAddBookingOpen(true);
                                      }}
                                      className="px-2 py-1 text-[11px] font-medium bg-surface hover:bg-surface-subtle text-text-primary border border-border rounded-sm flex items-center gap-1 transition-colors cursor-pointer shadow-2xs hover:border-accent"
                                      title="Book next appointment for this repeat client"
                                    >
                                      <CalendarClock className="w-3 h-3 text-accent stroke-[1.8]" />
                                      <span>Book Next</span>
                                    </button>

                                    {/* Open WhatsApp Chat */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const cleanTarget = (cust.phone || '').replace(/[^0-9]/g, '');
                                        const conv = conversations.find((c) => {
                                          const p = (c.contact_phone || c.phone || '').replace(/[^0-9]/g, '');
                                          return p === cleanTarget;
                                        });
                                        if (conv) {
                                          selectConversation(conv);
                                        } else {
                                          setSearchQuery(cust.phone);
                                        }
                                        navigateTo('inbox');
                                      }}
                                      className="p-1 text-text-muted hover:text-accent hover:bg-surface-subtle border border-border rounded-sm transition-colors cursor-pointer"
                                      title="Chat on WhatsApp"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5 stroke-[1.5]" />
                                    </button>

                                    {/* View History Drawer */}
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await handleSelectCustomer(cust);
                                        setShowCustomerHistoryModal(true);
                                      }}
                                      className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-subtle border border-border rounded-sm transition-colors cursor-pointer"
                                      title="View customer session & revenue history"
                                    >
                                      <FileText className="w-3.5 h-3.5 stroke-[1.5]" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

{/* ── VIEW 6: MARKETING HUB ─────────────────────────────────────── */}
            {activeNav === 'marketing' && canManageMarketing && (
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
                <div className="flex items-center gap-1 bg-surface-subtle border border-border rounded-sm p-0.5 max-w-full overflow-x-auto no-scrollbar shrink-0">
                  {([
                    { key: 'broadcasts', Icon: Megaphone, label: 'Broadcasts' },
                    { key: 'reengagement', Icon: RotateCcw, label: 'Re-engagement' },
                    { key: 'analytics', Icon: BarChart2, label: 'Analytics' },
                  ] as const).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setMarketingSubTab(tab.key)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
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
                                          placeholder={i === 0 ? 'e.g. Valued Customer' : i === 1 ? settingsForm.name || 'Our Company' : 'e.g. FLAT20'}
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
                              <div className="font-semibold text-emerald-800 text-[11px] pb-1 border-b border-slate-100">{settingsForm.name || 'Our Company'}</div>
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

                {/* Subtabs Bar - Horizontally Scrollable Strip on Mobile */}
                <div className="flex gap-1 border-b border-border pb-3 overflow-x-auto no-scrollbar flex-nowrap shrink-0 max-w-full">
                  {[
                    { id: 'branding', label: 'Profile & Branding', icon: Building2 },
                    { id: 'calendar', label: 'Google Calendar & Scheduling', icon: CalendarDays },
                    { id: 'notifications', label: 'Alert Channels', icon: Bell },
                    { id: 'localization', label: 'Regional & Currency', icon: Globe },
                    { id: 'terminology', label: 'CRM Terminology', icon: Sliders },
                    { id: 'team', label: 'Team & Roles', icon: Users },
                    { id: 'account', label: 'Account & Session', icon: LogOut },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setSettingsTab(tab.id as any)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
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
                            {settingsForm.name || 'Client CRM'}
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

                      {/* Google Review Settings & Toggle */}
                      <div className="p-4 bg-surface rounded-md border border-border space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-accent stroke-[1.5]" />
                            <label className="text-xs font-semibold text-text-primary">
                              Post-Service Review WhatsApp Template
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSettingsForm({ ...settingsForm, enable_auto_review: settingsForm.enable_auto_review === false ? true : false })}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                              settingsForm.enable_auto_review !== false ? 'bg-accent' : 'bg-surface-subtle border-border'
                            }`}
                            title={settingsForm.enable_auto_review !== false ? 'Review template sending is Enabled' : 'Review template sending is Disabled'}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                settingsForm.enable_auto_review !== false ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed">
                          {settingsForm.enable_auto_review !== false ? (
                            <span className="text-status-success font-medium">✓ Enabled: </span>
                          ) : (
                            <span className="text-text-muted font-medium">✕ Disabled: </span>
                          )}
                          Send an automated Google Review request template on WhatsApp after an appointment is marked as Attended. When changing status, you will also be prompted with the choice to send or skip for each client.
                        </p>
                        {settingsForm.enable_auto_review !== false && (
                          <div className="pt-1">
                            <label className="block text-[11px] font-medium text-text-secondary mb-1">
                              Google Review Link
                            </label>
                            <input
                              type="text"
                              placeholder="https://g.page/r/your-business-id/review"
                              value={settingsForm.google_review_link || ''}
                              onChange={(e) => setSettingsForm({ ...settingsForm, google_review_link: e.target.value })}
                              className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── GOOGLE CALENDAR & SCHEDULING SETTINGS ───────────────── */}
                  {settingsTab === 'calendar' && (
                    <div className="space-y-5 bg-surface p-5 rounded-md border border-border">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div>
                          <h4 className="font-semibold text-xs text-text-primary">Google Calendar & Live Scheduling Settings</h4>
                          <p className="text-xs text-text-muted">Real-time Free/Busy synchronization, free-time only appointment booking, and zero wrong data policy.</p>
                        </div>
                        {settingsForm?.google_calendar_configured ? (
                          <span className="text-xs text-status-success font-medium bg-status-success-bg px-2.5 py-1 rounded-sm border border-status-success-border flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.5]" />
                            <span>Connected & Active</span>
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted font-medium bg-surface-subtle px-2.5 py-1 rounded-sm border border-border">
                            Not connected
                          </span>
                        )}
                      </div>

                      {/* 2 Feature Callout Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Policy 1: Real-Time Availability & Conflict Prevention */}
                        <div className="p-4 bg-surface-subtle rounded-md border border-border space-y-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-sm bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center justify-center">
                              <CalendarDays className="w-3.5 h-3.5 stroke-[1.5]" />
                            </div>
                            <span className="text-xs font-semibold text-text-primary">
                              Live Google Calendar Availability Engine
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary leading-relaxed">
                            When customers want to book an appointment, the AI checks live availability directly from your connected Google Calendar.
                          </p>
                          <ul className="text-[11px] text-text-muted space-y-1 list-disc pl-4">
                            <li><strong>Free-Time Booking Only:</strong> The AI proposes and books exclusively during open, unoccupied business hours (09:00 AM – 08:00 PM).</li>
                            <li><strong>Zero Wrong Data:</strong> Occupied events and existing CRM bookings are strictly rejected. The AI never invents or guesses times.</li>
                            <li><strong>12-Hour Format:</strong> All dates and times are quoted in 12-hour AM/PM format (e.g. 10:00 AM, 06:30 PM).</li>
                          </ul>
                        </div>

                        {/* Policy 2: Continuous Conversation & Zero Re-Greeting */}
                        <div className="p-4 bg-surface-subtle rounded-md border border-border space-y-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-sm bg-purple-500/10 text-purple-600 border border-purple-500/20 flex items-center justify-center">
                              <MessageSquare className="w-3.5 h-3.5 stroke-[1.5]" />
                            </div>
                            <span className="text-xs font-semibold text-text-primary">
                              Continuous Conversation Intelligence
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary leading-relaxed">
                            The assistant recognizes multi-turn conversation depth and converses naturally like a real human texting on WhatsApp.
                          </p>
                          <ul className="text-[11px] text-text-muted space-y-1 list-disc pl-4">
                            <li><strong>Zero Re-Greeting:</strong> Once you and the customer have already greeted, the bot will NEVER say <em>"Hi again!"</em> or <em>"Hello again!"</em>.</li>
                            <li><strong>Direct & Empathetic:</strong> Dives straight into answers or clarifying questions (1–2 concise lines).</li>
                            <li><strong>Human Texting:</strong> Strips em dashes (—), robotic formatting, and corporate jargon.</li>
                          </ul>
                        </div>
                      </div>

                      {/* Live Google Calendar Free/Busy Checker */}
                      <div className="p-4 bg-surface rounded-md border border-border space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-accent stroke-[1.5]" />
                            <h5 className="font-semibold text-xs text-text-primary">
                              Verify Real-Time Google Calendar Free/Busy Slots
                            </h5>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-subtle border border-border text-text-secondary">
                            Live Query
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary">
                          Test live Google Calendar Free/Busy query right now to see the exact occupied slots the AI sees when checking availability.
                        </p>

                        <button
                          type="button"
                          onClick={handleTestDashCalendar}
                          disabled={dashCalendarLoading}
                          className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {dashCalendarLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 stroke-[1.5]" />}
                          <span>Check Real-Time Google Calendar Slots</span>
                        </button>

                        {dashCalendarError && (
                          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-sm">
                            {dashCalendarError}
                          </div>
                        )}

                        {dashCalendarAvailability && (
                          <div className="bg-surface-subtle border border-border rounded-sm p-3.5 space-y-2 text-xs mt-2 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                                {dashCalendarAvailability.google_calendar_connected ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
                                ) : (
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                )}
                                <span>{dashCalendarAvailability.google_calendar_connected ? 'Google Calendar Live Connected (Ground Truth Active)' : 'CRM Local Schedule Active'}</span>
                              </span>
                              <span className="text-[10px] font-mono text-text-muted">
                                Timezone: {dashCalendarAvailability.timezone}
                              </span>
                            </div>

                            <p className="text-[11px] text-text-muted">
                              Total Occupied Slots (Next 7 Days): <strong>{dashCalendarAvailability.total_occupied_slots}</strong> &bull; Google Calendar: {dashCalendarAvailability.gcal_slots_count}, CRM Bookings: {dashCalendarAvailability.crm_slots_count}
                            </p>

                            {dashCalendarAvailability.occupied_slots.length > 0 ? (
                              <div className="max-h-36 overflow-y-auto space-y-1.5 pt-1">
                                {dashCalendarAvailability.occupied_slots.map((slot, i) => (
                                  <div key={i} className="p-2 bg-surface rounded-sm border border-border flex items-center justify-between text-[11px]">
                                    <div>
                                      <div className="font-medium text-text-primary">{slot.start_formatted} – {slot.end_formatted}</div>
                                      <div className="text-text-muted text-[10px]">{slot.desc}</div>
                                    </div>
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
                                      {slot.source}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-2.5 bg-status-success-bg border border-status-success-border rounded-sm text-status-success text-[11px] font-medium">
                                All operating hours (09:00 AM – 08:00 PM) over the next 7 days are open and available for booking!
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Google Calendar Credentials Settings */}
                      <div className="space-y-4 pt-2">
                        <div className="bg-surface rounded-md border border-border p-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-medium text-text-primary">
                              Authorized redirect URI (for Google Cloud Console)
                            </label>
                            <button
                              type="button"
                              onClick={() => copyToClipboard('https://crm.goboldlabs.com/api/v1/crm/oauth/google/callback', 'gcal_redirect')}
                              className="text-xs font-medium text-accent hover:text-accent-hover flex items-center gap-1 cursor-pointer"
                            >
                              {copiedKey === 'gcal_redirect' ? <Check className="w-3.5 h-3.5 stroke-[1.5]" /> : <Copy className="w-3.5 h-3.5 stroke-[1.5]" />}
                              <span>{copiedKey === 'gcal_redirect' ? 'Copied' : 'Copy URI'}</span>
                            </button>
                          </div>
                          <p className="font-mono text-xs text-text-secondary break-all select-all bg-surface-subtle p-2.5 rounded-sm border border-border">
                            https://crm.goboldlabs.com/api/v1/crm/oauth/google/callback
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">Google OAuth Client ID</label>
                            <input
                              type="text"
                              placeholder="...apps.googleusercontent.com"
                              value={settingsForm.google_client_id || ''}
                              onChange={(e) => setSettingsForm({ ...settingsForm, google_client_id: e.target.value })}
                              className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">Google OAuth Client Secret</label>
                            <input
                              type="password"
                              placeholder="GOCSPX-..."
                              value={settingsForm.google_client_secret || ''}
                              onChange={(e) => setSettingsForm({ ...settingsForm, google_client_secret: e.target.value })}
                              className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                          </div>
                        </div>

                        {/* Google 1-Click OAuth Authorization Button */}
                        <div className="bg-surface-subtle border border-border rounded-md p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 flex items-center justify-center">
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                </svg>
                              </div>
                              <h5 className="text-xs font-semibold text-text-primary">Google Calendar Authorization (1-Click OAuth)</h5>
                            </div>
                            {settingsForm.google_calendar_configured ? (
                              <span className="text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-sm">
                                Authorized & Live
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-sm">
                                Authorization Required
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-text-secondary leading-relaxed">
                            Save Client ID & Secret above, then click below to authorize Google Calendar synchronization with your account.
                          </p>

                          <div className="flex items-center gap-2.5 pt-1">
                            <button
                              type="button"
                              onClick={handleDashboardInitGoogleOAuth}
                              disabled={connectingGoogle}
                              className="px-3.5 py-2 bg-white hover:bg-gray-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-zinc-600 rounded-sm text-xs font-medium shadow-xs transition-colors duration-150 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                              {connectingGoogle ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-accent" />
                              ) : (
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                </svg>
                              )}
                              <span>{settingsForm.google_calendar_configured ? 'Re-authorize with Google' : 'Sign in with Google'}</span>
                            </button>

                            {settingsForm.google_calendar_configured && (
                              <button
                                type="button"
                                onClick={handleDashboardDisconnectGoogle}
                                disabled={disconnectingGoogle}
                                className="px-3 py-2 bg-transparent hover:bg-status-error-bg text-status-error border border-status-error-border rounded-sm text-xs font-medium transition-colors duration-150 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                {disconnectingGoogle ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5 stroke-[1.5]" />}
                                <span>Disconnect Calendar</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Shop Operating Hours */}
                        <div className="bg-surface rounded-md border border-border p-4 space-y-3">
                          <div className="flex items-center justify-between pb-1 border-b border-border">
                            <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                              <span>Shop Operating Hours</span>
                            </label>
                            <span className="text-[10px] text-text-muted">Enforced on WhatsApp AI</span>
                          </div>
                          <p className="text-xs text-text-secondary">
                            Your WhatsApp AI assistant strictly proposes and accepts appointments only within these operating hours.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                            <div>
                              <label className="block text-[11px] font-medium text-text-primary mb-1">Shop Opening Time</label>
                              <input
                                type="time"
                                value={settingsForm.opening_time || '09:00'}
                                onChange={(e) => setSettingsForm({ ...settingsForm, opening_time: e.target.value })}
                                className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                              />
                              <span className="text-[10px] text-text-muted mt-1 block">Default: 09:00 AM</span>
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium text-text-primary mb-1">Shop Closing Time</label>
                              <input
                                type="time"
                                value={settingsForm.closing_time || '20:00'}
                                onChange={(e) => setSettingsForm({ ...settingsForm, closing_time: e.target.value })}
                                className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                              />
                              <span className="text-[10px] text-text-muted mt-1 block">Default: 08:00 PM</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-text-primary mb-1">Target Google Calendar ID</label>
                          <input
                            type="text"
                            placeholder="primary"
                            value={settingsForm.google_calendar_id || 'primary'}
                            onChange={(e) => setSettingsForm({ ...settingsForm, google_calendar_id: e.target.value })}
                            className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                          />
                          <p className="text-xs text-text-muted mt-1">Leave as <code>primary</code> to sync with your main Google Calendar.</p>
                        </div>
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
                        <div className="p-4 bg-surface rounded-md border border-border space-y-2 md:col-span-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-text-secondary stroke-[1.5]" />
                            <label className="block text-xs font-medium text-text-primary">
                              Admin Name (Personal / Doctor Name)
                            </label>
                          </div>
                          <input
                            type="text"
                            placeholder="e.g. Dr. Sameer or Bhuvanesh"
                            value={settingsForm.admin_name || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, admin_name: e.target.value })}
                            className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                          />
                          <p className="text-xs text-text-muted">
                            Your personal name displayed in the top-right user profile header, staff alerts, and reports.
                          </p>
                        </div>

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
                        {/* Super Admin Notice if inspecting workspace */}
                        {user?.role === 'super_admin' && (
                          <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-md text-xs text-blue-700 dark:text-blue-300 flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-semibold">Super Admin Master Session</p>
                                <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                                  You are viewing this workspace with Super Admin privileges. You can manage all client organizations and subscriptions from the Platform Master Console.
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => router.push('/bhuvanesh')}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-[11px] font-medium shrink-0 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                              title="Go to Platform Super Admin Portal"
                            >
                              <span>Master Console</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {/* Organization Registered Admin Account */}
                        {settingsForm.admin_email && (
                          <div className="flex items-center justify-between pb-3 border-b border-border">
                            <div>
                              <p className="text-xs font-medium text-text-muted">Organization Primary Admin Account</p>
                              <p className="font-medium text-sm text-text-primary mt-0.5">
                                {settingsForm.admin_name ? `${settingsForm.admin_name} • ` : ''}{settingsForm.admin_email}
                              </p>
                              <p className="text-[11px] text-text-muted mt-0.5">
                                Registered account used by the client to sign in to this CRM.
                              </p>
                            </div>
                            <span className="text-xs font-mono font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-sm border border-emerald-500/20">
                              Client Admin
                            </span>
                          </div>
                        )}

                        {/* Active Session */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-text-muted">
                              {user?.role === 'super_admin' ? 'Active Super Admin Session' : 'Signed In Email'}
                            </p>
                            <p className="font-medium text-sm text-text-primary mt-0.5">{user?.email || 'Logged in user'}</p>
                            {user?.role === 'super_admin' && (
                              <p className="text-[11px] text-text-muted mt-0.5">
                                Your personal Super Admin account currently authenticated in this browser.
                              </p>
                            )}
                          </div>
                          <span className="text-xs font-mono font-medium bg-surface-subtle text-text-secondary px-2.5 py-1 rounded-sm border border-border">
                            Role: {formatRoleName(user?.role)}
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

                  {/* ── 5. TEAM & ROLES SUBTAB ─────────────────────────────────── */}
                  {settingsTab === 'team' && renderTeamManagementView()}

                  {/* Save Button */}
                  {settingsTab !== 'account' && settingsTab !== 'team' && (
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

            {/* ── VIEW 6: TEAM & SALES CREDENTIALS (DIRECT NAVIGATION) ────────── */}
            {activeNav === 'team' && (
              <div className="flex-1 overflow-y-auto space-y-6 max-w-5xl">
                {renderTeamManagementView()}
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
              {isAddingNote && (() => {
                const noteColors: { id: 'yellow' | 'green' | 'blue' | 'purple' | 'pink'; name: string; swatch: string; border: string; previewBg: string; text: string }[] = [
                  { id: 'yellow', name: 'Yellow', swatch: '#fde047', border: '#ca8a04', previewBg: '#fefce8', text: '#713f12' },
                  { id: 'green', name: 'Green', swatch: '#86efac', border: '#16a34a', previewBg: '#f0fdf4', text: '#064e3b' },
                  { id: 'blue', name: 'Blue', swatch: '#7dd3fc', border: '#0284c7', previewBg: '#f0f9ff', text: '#0c4a6e' },
                  { id: 'purple', name: 'Purple', swatch: '#d8b4fe', border: '#9333ea', previewBg: '#faf5ff', text: '#581c87' },
                  { id: 'pink', name: 'Pink', swatch: '#fda4af', border: '#e11d48', previewBg: '#fff1f2', text: '#881337' },
                ];
                const activeColor = noteColors.find(c => c.id === newNoteColor) || noteColors[0];

                return (
                  <form
                    onSubmit={handleAddStickyNote}
                    className="rounded-md p-3 space-y-2.5 shadow-subtle border-2 transition-colors duration-150"
                    style={{ backgroundColor: activeColor.previewBg, borderColor: activeColor.border }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold" style={{ color: activeColor.text }}>Color:</span>
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full border shadow-2xs"
                          style={{ backgroundColor: activeColor.swatch, borderColor: activeColor.border, color: activeColor.text }}
                        >
                          {activeColor.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {noteColors.map((c) => {
                          const isSelected = newNoteColor === c.id;
                          return (
                            <button
                              type="button"
                              key={c.id}
                              onClick={() => setNewNoteColor(c.id)}
                              style={{ backgroundColor: c.swatch, borderColor: c.border }}
                              className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                                isSelected
                                  ? 'ring-2 ring-text-primary ring-offset-2 scale-110 shadow-xs'
                                  : 'hover:scale-105 opacity-80 hover:opacity-100'
                              }`}
                              title={`${c.name} Note`}
                            >
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" style={{ color: c.text }} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <textarea
                      rows={3}
                      autoFocus
                      placeholder={`Write a ${activeColor.name.toLowerCase()} reminder or note...`}
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white/95 border rounded-sm text-xs focus:outline-none resize-none placeholder:text-text-muted font-sans transition-colors duration-150 shadow-2xs"
                      style={{ borderColor: activeColor.border, color: activeColor.text }}
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
                );
              })()}

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
                    const colorStyles: Record<string, { bg: string; border: string; text: string; badge: string; badgeText: string; badgeBorder: string }> = {
                      yellow: { bg: '#fefce8', border: '#fde047', text: '#713f12', badge: '#fef08a', badgeText: '#854d0e', badgeBorder: '#fde047' },
                      green: { bg: '#f0fdf4', border: '#bbf7d0', text: '#064e3b', badge: '#bbf7d0', badgeText: '#065f46', badgeBorder: '#86efac' },
                      blue: { bg: '#f0f9ff', border: '#bae6fd', text: '#0c4a6e', badge: '#bae6fd', badgeText: '#0369a1', badgeBorder: '#7dd3fc' },
                      purple: { bg: '#faf5ff', border: '#e9d5ff', text: '#581c87', badge: '#e9d5ff', badgeText: '#6b21a8', badgeBorder: '#d8b4fe' },
                      pink: { bg: '#fff1f2', border: '#fecdd3', text: '#881337', badge: '#fecdd3', badgeText: '#9f1239', badgeBorder: '#fda4af' },
                    };
                    const currentStyle = colorStyles[note.color] || colorStyles.yellow;

                    return (
                      <div
                        key={note.id}
                        style={{ backgroundColor: currentStyle.bg, borderColor: currentStyle.border }}
                        className={`p-3 rounded-md border-2 transition-all duration-150 relative group ${
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
                              <span
                                style={{ backgroundColor: currentStyle.badge, color: currentStyle.badgeText, borderColor: currentStyle.badgeBorder }}
                                className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded-sm border"
                              >
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
                        <p
                          style={{ color: currentStyle.text }}
                          className={`text-xs font-normal leading-relaxed break-words ${note.done ? 'line-through opacity-70' : ''}`}
                        >
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
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    Assigned {currentTaxonomy.staff_label || 'Staff / Doctor'} (optional)
                  </label>
                  <select
                    value={newBookingForm.staff_member}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, staff_member: e.target.value })}
                    className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent font-sans transition-colors duration-150 cursor-pointer"
                  >
                    {renderStaffSelectOptions('— Any / Unassigned —')}
                  </select>
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
                    {isRescheduling ? (
                      'Rescheduling & Syncing...'
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 stroke-[2] shrink-0" />
                        <span>Confirm Reschedule & Send Confirmation</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Attendance Action Buttons */}
                <div className="pt-2 border-t border-border space-y-2">
                  <p className="text-xs font-medium text-text-muted">Update status:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => promptMarkAttended(selectedBookingDetail)}
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

                  {selectedBookingDetail.status === 'cancelled' && (
                    <div className="pt-3 border-t border-border flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleDeleteBooking(selectedBookingDetail.id)}
                        disabled={deletingBookingId === selectedBookingDetail.id}
                        className="py-1.5 px-3 text-xs font-semibold rounded-sm bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors duration-150 cursor-pointer flex items-center gap-1.5"
                        title="Permanently delete this cancelled booking"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                        <span>Delete Cancelled Booking</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: CONFIRM ATTENDED & SEND REVIEW DECISION ───────────────── */}
        {pendingAttendedBooking && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 select-none">
            <div className="bg-surface rounded-lg border border-border w-full max-w-md overflow-hidden shadow-xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Star className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-text-primary">Mark Appointment as Attended</h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {pendingAttendedBooking.customer_name} &bull; {pendingAttendedBooking.service}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-surface-subtle border border-border rounded-sm text-xs text-text-body space-y-1.5 leading-relaxed">
                <p className="font-medium text-text-primary">
                  Would you like to send the post-service Google Review request to this client?
                </p>
                <p className="text-[11px] text-text-muted">
                  Sending the review template invites the client to leave public feedback. If you prefer not to message them right now, select &quot;Mark Attended Only&quot;.
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPendingAttendedBooking(null)}
                  className="w-full sm:w-auto px-3 py-1.5 text-xs text-text-muted hover:text-text-primary rounded-sm border border-border bg-surface transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={updatingBookingId === pendingAttendedBooking.id}
                  onClick={async () => {
                    const b = pendingAttendedBooking;
                    setPendingAttendedBooking(null);
                    await handleUpdateBookingStatus(b.id, 'completed', undefined, false);
                  }}
                  className="w-full sm:w-auto px-3 py-1.5 text-xs font-medium text-text-body hover:bg-surface-subtle rounded-sm border border-border bg-surface transition-colors cursor-pointer"
                >
                  Mark Attended Only
                </button>
                <button
                  type="button"
                  disabled={updatingBookingId === pendingAttendedBooking.id}
                  onClick={async () => {
                    const b = pendingAttendedBooking;
                    setPendingAttendedBooking(null);
                    await handleUpdateBookingStatus(b.id, 'completed', undefined, true);
                  }}
                  className="w-full sm:w-auto px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-sm shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Star className="w-3.5 h-3.5 fill-white/20" />
                  <span>Mark Attended &amp; Send Review</span>
                </button>
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
                            {msg.media_url && (
                              <div className="mb-1 rounded overflow-hidden max-w-[200px]">
                                <img src={msg.media_url} alt="Media" className="w-full h-auto object-cover max-h-40" />
                              </div>
                            )}
                            <p className="leading-relaxed">{getDisplayMessageBody(msg)}</p>
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
                      {customerNotes.map((note) => {
                        const noteStyle = getNoteBadgeStyle(note.color);
                        return (
                          <div key={note.id} className={`border border-border border-l-4 rounded-sm px-3 py-2 space-y-1 ${noteStyle.leftBorder}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm border ${noteStyle.badge}`}>{note.author}</span>
                              <span className="text-[10px] text-text-muted">{note.created_at ? new Date(note.created_at).toLocaleDateString() : ''}</span>
                            </div>
                            <p className="text-xs text-text-primary leading-relaxed">{note.note_text}</p>
                          </div>
                        );
                      })}
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
                    <span className="inline-flex items-center gap-1 text-[10px] text-text-muted">Click <X className="w-2.5 h-2.5 inline stroke-[2]" /> to remove any preset</span>
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
                {/* Bridge Notice to Team & Sales */}
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-sm text-xs text-blue-800 dark:text-blue-300 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold flex items-center gap-1.5 text-xs">
                      <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>Need this {currentTaxonomy.staff_label ? currentTaxonomy.staff_label.toLowerCase() : 'staff member'} to log in to WhatsApp CRM?</span>
                    </p>
                    <p className="text-[11px] text-blue-700/80 dark:text-blue-400 mt-0.5 leading-relaxed">
                      Names added here are presets for assignment without login (ideal for visiting doctors or solo clinics). To give someone their own login credentials &amp; inbox, invite them in Team &amp; Sales.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDoctorEditModalOpen(false);
                      setActiveNav('team');
                    }}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xs text-[11px] shrink-0 transition-colors cursor-pointer"
                  >
                    Go to Team &amp; Sales &rarr;
                  </button>
                </div>

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
                    <span className="inline-flex items-center gap-1 text-[10px] text-text-muted">Click <X className="w-2.5 h-2.5 inline stroke-[2]" /> to remove</span>
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
                    {renderStaffAssignTrigger({
                      value: quickCrmDoctor,
                      onClick: (e) => {
                        e.stopPropagation();
                        openCustomerAssignPopover('quick_crm', undefined, quickCrmDoctor, e.currentTarget);
                      },
                      placeholder: '— Select Staff / Doctor —',
                      fullWidth: true,
                    })}
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

        {/* ── WHATSAPP TEMPLATE PICKER MODAL (FEATURE 2) ─────────────────────────── */}
        {showTemplateModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 overflow-y-auto"
            onClick={() => setShowTemplateModal(false)}
          >
            <div
              className="w-full max-w-2xl bg-surface border border-border rounded-lg shadow-2xl overflow-hidden my-4 flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface-subtle/50 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                    <FileText className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">Send WhatsApp Template</h3>
                    <p className="text-[11px] text-text-muted">
                      Recipient: <span className="font-medium text-text-secondary">{selectedConv?.contact_name || selectedConv?.contact_phone || 'Customer'}</span>
                      {selectedConv?.contact_phone && <span className="ml-1 font-mono text-[10px]">({selectedConv.contact_phone})</span>}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="p-1 text-text-muted hover:text-text-primary rounded-sm hover:bg-surface transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body - 2 Columns (Template Selection & Preview/Variables) */}
              <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border min-h-[400px]">
                {/* Column 1: Search & Template List */}
                <div className="flex flex-col h-full overflow-hidden bg-surface-subtle/30">
                  <div className="p-3 border-b border-border">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        type="text"
                        placeholder="Search approved templates..."
                        value={templateSearchQuery}
                        onChange={(e) => setTemplateSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                    {loadingTemplates ? (
                      <div className="p-6 text-center text-xs text-text-muted">
                        <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-accent border-t-transparent animate-spin mr-2" />
                        Loading templates...
                      </div>
                    ) : marketingTemplates.filter((t) =>
                        !templateSearchQuery.trim() ||
                        t.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
                        (t.body && t.body.toLowerCase().includes(templateSearchQuery.toLowerCase()))
                      ).length === 0 ? (
                      <div className="p-6 text-center text-xs text-text-muted">
                        No approved templates found.
                      </div>
                    ) : (
                      marketingTemplates
                        .filter((t) =>
                          !templateSearchQuery.trim() ||
                          t.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
                          (t.body && t.body.toLowerCase().includes(templateSearchQuery.toLowerCase()))
                        )
                        .map((tpl) => {
                          const isSelected = selectedChatTemplate?.name === tpl.name;
                          return (
                            <button
                              key={tpl.id || tpl.name}
                              type="button"
                              onClick={() => handleSelectTemplate(tpl)}
                              className={`w-full text-left p-2.5 rounded-md border transition-all cursor-pointer flex flex-col gap-1 ${
                                isSelected
                                  ? 'bg-accent/10 border-accent text-accent shadow-xs'
                                  : 'bg-surface hover:bg-surface-subtle/70 border-border text-text-primary'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-semibold text-xs truncate">{tpl.label || tpl.name}</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-surface-subtle border border-border uppercase font-mono tracking-wider text-text-muted shrink-0">
                                  {tpl.category || 'UTILITY'}
                                </span>
                              </div>
                              <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed">
                                {tpl.body || tpl.name}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-text-muted mt-0.5">
                                <span>{tpl.variables_count || 0} variable{tpl.variables_count !== 1 ? 's' : ''}</span>
                                {tpl.language && (
                                  <>
                                    <span>•</span>
                                    <span className="uppercase font-mono">{tpl.language}</span>
                                  </>
                                )}
                              </div>
                            </button>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* Column 2: Parameters Form & Live Preview */}
                <div className="flex flex-col h-full overflow-y-auto p-4 bg-surface">
                  {selectedChatTemplate ? (
                    <div className="space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-text-primary">{selectedChatTemplate.label || selectedChatTemplate.name}</h4>
                            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-xs border border-emerald-200">
                              APPROVED
                            </span>
                          </div>
                          <p className="text-[10px] text-text-muted font-mono mt-0.5">{selectedChatTemplate.name}</p>
                        </div>

                        {/* Variable Inputs */}
                        {(selectedChatTemplate.variables_count || 0) > 0 && (
                          <div className="space-y-2.5 pt-2 border-t border-border">
                            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
                              Template Variables
                            </label>
                            {Array.from({ length: selectedChatTemplate.variables_count || 0 }, (_, i) => i + 1).map((idx) => (
                              <div key={idx} className="space-y-1">
                                <label className="text-[10px] text-text-muted block font-medium">
                                  Variable {"{{"}{idx}{"}}"} {idx === 1 ? '(Customer Name)' : ''}
                                </label>
                                <input
                                  type="text"
                                  placeholder={idx === 1 ? 'e.g. Rahul Sharma' : `Value for {{${idx}}}`}
                                  value={templateVariableValues[String(idx)] || ''}
                                  onChange={(e) =>
                                    setTemplateVariableValues((prev) => ({
                                      ...prev,
                                      [String(idx)]: e.target.value,
                                    }))
                                  }
                                  className="w-full px-2.5 py-1.5 text-xs bg-surface-subtle border border-border rounded-md text-text-primary focus:outline-none focus:border-accent"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Live WhatsApp Bubble Preview */}
                        <div className="pt-2 border-t border-border space-y-1.5">
                          <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
                            Live Message Preview
                          </label>
                          <div className="p-3 bg-[#efeae2] dark:bg-zinc-900 rounded-lg border border-border/80 flex flex-col items-end">
                            <div className="bg-white dark:bg-emerald-950 text-text-primary rounded-xl rounded-tr-xs p-3 text-xs shadow-xs max-w-[95%] space-y-1">
                              <p className="whitespace-pre-wrap leading-relaxed">
                                {(() => {
                                  let text = selectedChatTemplate.body || `[Template: ${selectedChatTemplate.name}]`;
                                  const count = selectedChatTemplate.variables_count || 0;
                                  for (let i = 1; i <= count; i++) {
                                    const val = templateVariableValues[String(i)];
                                    text = text.replace(new RegExp(`\\{\\{${i}\\}\\}`, 'g'), val && val.trim() ? val : `{{${i}}}`);
                                  }
                                  return text;
                                })()}
                              </p>
                              <div className="flex items-center justify-end gap-1 text-[9px] text-text-muted font-mono pt-1">
                                <span>Now</span>
                                <CheckCheck className="w-3 h-3 text-emerald-500" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Modal Actions */}
                      <div className="pt-4 border-t border-border flex items-center justify-end gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowTemplateModal(false)}
                          className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-subtle rounded-md cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={sendingChatTemplate}
                          onClick={handleSendSelectedTemplate}
                          className="px-4 py-1.5 text-xs font-semibold bg-accent hover:bg-accent-hover text-white rounded-md shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {sendingChatTemplate ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5 stroke-[2]" />
                              <span>Send Template</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-muted space-y-2">
                      <FileText className="w-8 h-8 text-text-muted/50 stroke-[1.5]" />
                      <p className="text-xs">Select a template from the list on the left to preview and edit variables.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CLIENT TEAM MEMBER / SALES ACCOUNT MODAL ─────────────────────────── */}
        {showTeamModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 overflow-y-auto"
            onClick={() => setShowTeamModal(false)}
          >
            <div
              className="w-full max-w-md bg-surface border border-border rounded-md shadow-xl overflow-hidden my-4 flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface-subtle/50 shrink-0">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent stroke-[1.5]" />
                  <div>
                    <h3 className="font-semibold text-xs text-text-primary">
                      {editingTeamMember ? 'Edit Team Member' : 'Add Team Member'}
                    </h3>
                    <p className="text-[10px] text-text-muted">
                      {editingTeamMember
                        ? `Credentials & permissions for ${editingTeamMember.email}`
                        : 'Create direct login credentials and assign role permissions'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="p-1 text-text-muted hover:text-text-primary rounded-sm hover:bg-surface-subtle transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 stroke-[1.5]" />
                </button>
              </div>

              <form onSubmit={handleSaveTeam} className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
                {teamError && (
                  <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-sm text-xs text-red-500 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{teamError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-medium text-text-primary mb-1">
                    Display Name <span className="text-text-muted font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma (Sales Executive)"
                    value={teamForm.display_name}
                    onChange={(e) => setTeamForm({ ...teamForm, display_name: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent text-xs transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-text-primary mb-1">
                    Login Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. sales@yourdomain.com"
                    value={teamForm.email}
                    disabled={!!editingTeamMember}
                    onChange={(e) => setTeamForm({ ...teamForm, email: e.target.value })}
                    className={`w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent text-xs transition-colors ${
                      editingTeamMember ? 'opacity-60 cursor-not-allowed bg-surface' : ''
                    }`}
                  />
                  {editingTeamMember && (
                    <p className="text-[10px] text-text-muted mt-0.5">
                      Login email address cannot be modified once created.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-text-primary mb-1">
                    {editingTeamMember ? 'Update Password' : 'Login Password'}{' '}
                    {!editingTeamMember && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="password"
                    required={!editingTeamMember}
                    placeholder={
                      editingTeamMember
                        ? 'Leave blank to retain current password'
                        : 'Minimum 6 characters'
                    }
                    value={teamForm.password}
                    onChange={(e) => setTeamForm({ ...teamForm, password: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent text-xs transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-text-primary mb-1">Role Preset</label>
                  <select
                    value={teamForm.role}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      const defaultPerms = getClientRoleDefaultPermissions(
                        newRole,
                        teamForm.permissions.assigned_doctor
                      );
                      setTeamForm({
                        ...teamForm,
                        role: newRole,
                        permissions: defaultPerms,
                      });
                    }}
                    className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent text-xs transition-colors cursor-pointer"
                  >
                    <option value="sales">Sales Executive (Full CRM, Chats, Bookings & Followups)</option>
                    <option value="doctor">{(currentTaxonomy.staff_label ? currentTaxonomy.staff_label.split('/')[0].trim() : 'Staff')} / Consultant (Assigned Bookings)</option>
                    <option value="receptionist">Front Desk / Receptionist (Bookings & Calendar)</option>
                    <option value="marketing">Marketing Specialist (Broadcasts & Overview)</option>
                    <option value="agent">Support Agent (Live Chats & Replies)</option>
                    <option value="viewer">Viewer (Read-Only Calendar & Schedule)</option>
                    <option value="admin">Administrator (Full Workspace Permissions)</option>
                  </select>
                </div>

                {(teamForm.role === 'doctor' || teamForm.permissions.assigned_doctor) && (
                  <div>
                    <label className="block text-[11px] font-medium text-text-primary mb-1">
                      Assigned {currentTaxonomy.staff_label ? currentTaxonomy.staff_label.split('/')[0].trim() : 'Staff'} Filter <span className="text-text-muted font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder={`e.g. ${settingsForm.industry === 'education' ? 'Prof. Alan Turing' : 'Dr. Jane Smith'}`}
                      value={teamForm.permissions.assigned_doctor || ''}
                      onChange={(e) =>
                        setTeamForm({
                          ...teamForm,
                          permissions: { ...teamForm.permissions, assigned_doctor: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent text-xs transition-colors"
                    />
                    <p className="text-[10px] text-text-muted mt-0.5">
                      Limits visible appointments and follow-ups to this {(currentTaxonomy.staff_label ? currentTaxonomy.staff_label.split('/')[0].trim() : 'staff member').toLowerCase()}. Leave blank for all.
                    </p>
                  </div>
                )}

                {(teamForm.role === 'sales' || teamForm.role === 'doctor' || (teamForm.permissions.assigned_health_concerns && teamForm.permissions.assigned_health_concerns.length > 0)) && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-medium text-text-primary">
                        Assigned Health Concerns / Specialty Teams
                      </label>
                      <span className="text-[10px] text-text-muted">
                        {(teamForm.permissions.assigned_health_concerns || []).length === 0
                          ? 'All concerns visible'
                          : `${teamForm.permissions.assigned_health_concerns?.length} selected`}
                      </span>
                    </div>
                    <p className="text-[10px] text-text-muted mb-1.5">
                      When assigned, this rep only sees chats, patients, and bookings matching these specialties. Leave unselected to grant access to all inquiries.
                    </p>
                    <div className="flex flex-wrap gap-1 p-2 bg-surface-subtle/50 border border-border rounded-sm">
                      {availableHealthConcerns.map((concern) => {
                        const currentAssigned: string[] = teamForm.permissions.assigned_health_concerns || [];
                        const isSelected = currentAssigned.includes(concern);
                        return (
                          <button
                            key={concern}
                            type="button"
                            onClick={() => {
                              const next = isSelected
                                ? currentAssigned.filter((c) => c !== concern)
                                : [...currentAssigned, concern];
                              setTeamForm({
                                ...teamForm,
                                permissions: {
                                  ...teamForm.permissions,
                                  assigned_health_concerns: next,
                                },
                              });
                            }}
                            className={`px-2 py-0.5 rounded-sm text-[10px] border cursor-pointer transition-colors flex items-center gap-1 ${
                              isSelected
                                ? 'bg-accent text-white border-accent font-semibold shadow-xs'
                                : 'bg-surface text-text-secondary border-border hover:border-accent/60 hover:text-text-primary'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[2]" />}
                            <span>{concern}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-semibold text-text-primary">
                      Granular Access Permissions
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTeamForm({
                            ...teamForm,
                            permissions: {
                              ...teamForm.permissions,
                              can_view_inbox: true,
                              can_send_messages: true,
                              can_manage_customers: true,
                              can_manage_bookings: true,
                              can_view_calendar: true,
                              can_manage_marketing: true,
                              can_view_analytics: true,
                              can_manage_settings: true,
                            },
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
                          setTeamForm({
                            ...teamForm,
                            permissions: getClientRoleDefaultPermissions(teamForm.role, teamForm.permissions.assigned_doctor),
                          });
                        }}
                        className="text-[10px] text-text-muted hover:text-text-primary font-medium cursor-pointer"
                      >
                        Role Defaults
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 bg-surface-subtle/50 p-2.5 rounded-sm border border-border">
                    {[
                      { key: 'can_view_inbox', label: 'Chats & WhatsApp Inbox' },
                      { key: 'can_send_messages', label: 'Send WhatsApp Replies', parentKey: 'can_view_inbox' },
                      { key: 'can_manage_customers', label: `${currentTaxonomy.client_plural || 'Customer'} Directory & Follow-ups` },
                      { key: 'can_manage_bookings', label: 'Bookings & Appointments' },
                      { key: 'can_view_calendar', label: 'Calendar Schedule' },
                      { key: 'can_manage_marketing', label: 'Marketing & Broadcasts' },
                      { key: 'can_view_analytics', label: 'Overview Dashboard' },
                      { key: 'can_manage_settings', label: 'Workspace Preferences' },
                    ].map((item) => {
                      const isParentDisabled = item.key === 'can_send_messages' && !teamForm.permissions.can_view_inbox;
                      const isChecked = isParentDisabled ? false : Boolean((teamForm.permissions as any)?.[item.key]);
                      return (
                        <label
                          key={item.key}
                          className={`flex items-center gap-1.5 p-1 rounded transition-colors select-none text-xs ${
                            isParentDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-surface cursor-pointer'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isParentDisabled}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const updatedPerms: any = {
                                ...teamForm.permissions,
                                [item.key]: checked,
                              };
                              if (item.key === 'can_view_inbox' && !checked) {
                                updatedPerms.can_send_messages = false;
                              }
                              setTeamForm({
                                ...teamForm,
                                permissions: updatedPerms,
                              });
                            }}
                            className="w-3.5 h-3.5 rounded text-accent focus:ring-accent accent-accent cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span className="text-text-primary text-[10px] font-medium flex items-center gap-1">
                            {item.label}
                            {isParentDisabled && (
                              <span className="text-[9px] text-text-muted font-normal italic">(Requires Inbox)</span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {editingTeamMember && (
                  <div className="flex items-center justify-between p-2 bg-surface-subtle/40 rounded-sm border border-border">
                    <div>
                      <span className="text-[11px] font-medium text-text-primary block">Active Account Status</span>
                      <span className="text-[10px] text-text-muted">Disable to temporarily suspend login</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTeamForm({ ...teamForm, is_active: !teamForm.is_active })}
                      className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors cursor-pointer ${
                        teamForm.is_active ? 'bg-accent' : 'bg-zinc-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                          teamForm.is_active ? 'translate-x-3.5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                )}

                <div className="sticky bottom-0 bg-surface -mx-4 -mb-4 px-4 py-3 border-t border-border flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowTeamModal(false)}
                    className="px-3 py-1.5 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-subtle rounded-sm text-xs font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={teamSaving}
                    className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-sm text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs whitespace-nowrap"
                  >
                    {teamSaving ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3" />
                        <span>{editingTeamMember ? 'Save Changes' : 'Create Account'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      {/* ── Mobile Bottom Navigation Bar (md:hidden) ────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border flex items-center justify-around min-h-[56px] py-1 px-1 safe-area-pb shadow-lg">
        {canViewAnalytics && (
          <button
            type="button"
            onClick={() => navigateTo('overview')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 min-h-[44px] rounded-sm transition-colors cursor-pointer touch-manipulation ${
              activeNav === 'overview'
                ? 'text-accent font-semibold'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <LayoutGrid className="w-5 h-5 stroke-[1.5]" />
            <span className="text-[10px] mt-0.5 tracking-tight">Overview</span>
          </button>
        )}

        {canViewInbox && (
          <button
            type="button"
            onClick={() => {
              if (activeNav === 'inbox') {
                if (selectedConv) {
                  setSelectedConv(null);
                  activeConvIdRef.current = null;
                } else {
                  navigateTo('overview');
                }
              } else {
                navigateTo('inbox');
              }
            }}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 min-h-[44px] rounded-sm transition-colors cursor-pointer relative touch-manipulation ${
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
        )}

        {canManageCustomers && (
          <button
            type="button"
            onClick={() => navigateTo('customers')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 min-h-[44px] rounded-sm transition-colors cursor-pointer touch-manipulation ${
              activeNav === 'customers' || activeNav === 'followup' || activeNav === 'repeat_clients'
                ? 'text-accent font-semibold'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Users className="w-5 h-5 stroke-[1.5]" />
            <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[64px]">{currentTaxonomy.client_plural || 'Customers'}</span>
          </button>
        )}

        {canManageBookings && (
          <button
            type="button"
            onClick={() => navigateTo('bookings')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 min-h-[44px] rounded-sm transition-colors cursor-pointer touch-manipulation ${
              activeNav === 'bookings'
                ? 'text-accent font-semibold'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <CalendarDays className="w-5 h-5 stroke-[1.5]" />
            <span className="text-[10px] mt-0.5 tracking-tight">Bookings</span>
          </button>
        )}

        {canViewCalendar && (
          <button
            type="button"
            onClick={() => navigateTo('calendar')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 min-h-[44px] rounded-sm transition-colors cursor-pointer touch-manipulation ${
              activeNav === 'calendar'
                ? 'text-accent font-semibold'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Calendar className="w-5 h-5 stroke-[1.5]" />
            <span className="text-[10px] mt-0.5 tracking-tight">Calendar</span>
          </button>
        )}

        {canManageSettings && (
          <button
            type="button"
            onClick={() => navigateTo('settings')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 min-h-[44px] rounded-sm transition-colors cursor-pointer touch-manipulation ${
              activeNav === 'settings'
                ? 'text-accent font-semibold'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Sliders className="w-5 h-5 stroke-[1.5]" />
            <span className="text-[10px] mt-0.5 tracking-tight">Settings</span>
          </button>
        )}
      </nav>

      {renderCustomerAssignPopover()}

      </div>
  );
}

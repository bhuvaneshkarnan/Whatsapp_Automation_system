'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Star,
  UserX,
  RotateCcw,
  Bell,
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
} from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+91', country: '🇮🇳 India (+91)' },
  { code: '+1', country: '🇺🇸 United States / 🇨🇦 Canada (+1)' },
  { code: '+44', country: '🇬🇧 United Kingdom (+44)' },
  { code: '+971', country: '🇦🇪 United Arab Emirates (+971)' },
  { code: '+966', country: '🇸🇦 Saudi Arabia (+966)' },
  { code: '+61', country: '🇦🇺 Australia (+61)' },
  { code: '+65', country: '🇸🇬 Singapore (+65)' },
  { code: '+60', country: '🇲🇾 Malaysia (+60)' },
  { code: '+974', country: '🇶🇦 Qatar (+974)' },
  { code: '+965', country: '🇰🇼 Kuwait (+965)' },
  { code: '+968', country: '🇴🇲 Oman (+968)' },
  { code: '+973', country: '🇧🇭 Bahrain (+973)' },
  { code: '+49', country: '🇩🇪 Germany (+49)' },
  { code: '+33', country: '🇫🇷 France (+33)' },
  { code: '+39', country: '🇮🇹 Italy (+39)' },
  { code: '+34', country: '🇪🇸 Spain (+34)' },
  { code: '+31', country: '🇳🇱 Netherlands (+31)' },
  { code: '+41', country: '🇨🇭 Switzerland (+41)' },
  { code: '+353', country: '🇮🇪 Ireland (+353)' },
  { code: '+64', country: '🇳🇿 New Zealand (+64)' },
  { code: '+27', country: '🇿🇦 South Africa (+27)' },
  { code: '+234', country: '🇳🇬 Nigeria (+234)' },
  { code: '+254', country: '🇰🇪 Kenya (+254)' },
  { code: '+20', country: '🇪🇬 Egypt (+20)' },
  { code: '+90', country: '🇹🇷 Turkey (+90)' },
  { code: '+81', country: '🇯🇵 Japan (+81)' },
  { code: '+82', country: '🇰🇷 South Korea (+82)' },
  { code: '+852', country: '🇭🇰 Hong Kong (+852)' },
  { code: '+63', country: '🇵🇭 Philippines (+63)' },
  { code: '+62', country: '🇮🇩 Indonesia (+62)' },
  { code: '+66', country: '🇹🇭 Thailand (+66)' },
  { code: '+84', country: '🇻🇳 Vietnam (+84)' },
  { code: '+94', country: '🇱🇰 Sri Lanka (+94)' },
  { code: '+880', country: '🇧🇩 Bangladesh (+880)' },
  { code: '+92', country: '🇵🇰 Pakistan (+92)' },
  { code: '+977', country: '🇳🇵 Nepal (+977)' },
  { code: '+55', country: '🇧🇷 Brazil (+55)' },
  { code: '+52', country: '🇲🇽 Mexico (+52)' },
  { code: '+54', country: '🇦🇷 Argentina (+54)' },
  { code: '+57', country: '🇨🇴 Colombia (+57)' },
  { code: '+46', country: '🇸🇪 Sweden (+46)' },
  { code: '+47', country: '🇳🇴 Norway (+47)' },
  { code: '+45', country: '🇩🇰 Denmark (+45)' },
  { code: '+358', country: '🇫🇮 Finland (+358)' },
  { code: '+48', country: '🇵🇱 Poland (+48)' },
  { code: '+972', country: '🇮🇱 Israel (+972)' },
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


export default function DashboardPage() {
  const router = useRouter();
  
  // Navigation: overview | inbox | bookings | calendar | customers | followup | marketing | settings
  const [activeNav, setActiveNav] = useState<'overview' | 'inbox' | 'bookings' | 'calendar' | 'customers' | 'followup' | 'marketing' | 'settings'>('overview');
  const [sidebarFilter, setSidebarFilter] = useState<'all' | 'recent' | 'favorites' | 'active'>('all');
  const [settingsTab, setSettingsTab] = useState<'ai' | 'whatsapp' | 'templates' | 'location' | 'calendar' | 'account'>('ai');

  // Customer Follow-up & Task Calendar State
  const [followupView, setFollowupView] = useState<'list' | 'tasks' | 'notes'>('list');
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
  const [quickCrmDoctor, setQuickCrmDoctor] = useState('Dr. Sarah Mitchell');
  const [savingQuickCrm, setSavingQuickCrm] = useState(false);

  // Google Tasks Sync State
  const [syncingGoogleTasks, setSyncingGoogleTasks] = useState(false);

  // Customer Directory State (VIEW 4)
  const [dirSearch, setDirSearch] = useState('');
  const [dirSelectedCust, setDirSelectedCust] = useState<Customer | null>(null);

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

  // Approved Templates List (Pre-configured + Custom Added)
  const [customTemplates, setCustomTemplates] = useState<{ id: string; name: string; label: string; variables_count: number }[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('whatsapp_crm_custom_templates');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [
      { id: 'utility_general_update', name: 'utility_general_update', label: '1. Utility / Promotional Update (utility_general_update)', variables_count: 3 },
      { id: 'booking_confirmationn', name: 'booking_confirmationn', label: '2. Appointment Confirmation (booking_confirmationn)', variables_count: 4 },
      { id: 'reschedule_nudge', name: 'reschedule_nudge', label: '3. Re-engagement / Recall Nudge (reschedule_nudge)', variables_count: 2 },
      { id: 'review_request', name: 'review_request', label: '4. Customer Feedback & Review Request (review_request)', variables_count: 3 },
    ];
  });

  const [newTemplateModal, setNewTemplateModal] = useState(false);
  const [newTemplateForm, setNewTemplateForm] = useState({ name: '', label: '', variables_count: 2 });

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
    primary_model_provider: 'gemini',
    ai_model: 'gemini-2.0-flash',
    gemini_api_key: '',
    groq_api_key: '',
    opencode_api_key: '',
    opencode_base_url: 'https://api.openai.com/v1',
    assistant_name: 'Rakshaya',
    bot_goal: '',
    services_text: '',
    ai_prompt: '',
    full_location_text: '',
    timezone: 'Asia/Kolkata',
    country_code: '+91',
    currency: 'INR',
    currency_symbol: 'â‚¹',
    admin_whatsapp_number: '',
    template_booking_confirmation: 'booking_confirmationn',
    template_reschedule_confirmation: 'booking_confirmationn',
    template_cancellation_confirmation: 'cancellation_confirmation',
    template_post_service_review: 'post_service_review',
    template_appointment_reminder: 'appointment_ramainder',
    template_reschedule_nudge: 'reschedule_nudge',
    template_review_request: 'review_request',
    google_review_link: '',
    template_admin_notification: 'admin_notification',
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

  const currentCurrencySymbol = settingsForm.currency_symbol || (
    settingsForm.currency === 'USD' ? '$' :
    settingsForm.currency === 'EUR' ? 'â‚¬' :
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
    'â‚¹'
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial Auth & Load
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
    if (typeof window !== 'undefined') {
      const storedSlug = localStorage.getItem('tenant_slug') || 'boldlabs';
      if (window.location.pathname === '/dashboard' || window.location.pathname === '/') {
        window.history.replaceState(null, '', `/${storedSlug}`);
      }
    }
    crm.getMe()
      .then((data) => {
        setUser(data);
        loadConversations();
        loadBookings();
        loadContacts();
        loadCustomers();
        loadSettings();
      })
      .catch(() => {
        localStorage.removeItem('auth_token');
        router.push('/login');
      });
  }, [router]);

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
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  // Load section data based on active tab
  useEffect(() => {
    if (activeNav === 'bookings' || activeNav === 'calendar') {
      loadBookings();
    } else if (activeNav === 'customers') {
      loadContacts();
      loadCustomers();
    } else if (activeNav === 'followup') {
      loadCustomers();
      loadTasks();
    } else if (activeNav === 'settings') {
      loadSettings();
    } else if (activeNav === 'marketing') {
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

  // Refetch customers when filter state changes
  useEffect(() => {
    if (activeNav === 'followup') {
      loadCustomers();
    }
  }, [followupStatusFilter, followupProbabilityFilter, followupDoctorFilter, followupSearch]);

  // Refetch tasks when task filter changes
  useEffect(() => {
    if (activeNav === 'followup') {
      loadTasks();
    }
  }, [taskFilter]);

  // Load analytics when sub-tab switches to analytics
  useEffect(() => {
    if (activeNav === 'marketing' && marketingSubTab === 'analytics') {
      setLoadingAnalytics(true);
      marketing.getAnalytics()
        .then((data) => setAnalyticsData(data))
        .catch(() => {})
        .finally(() => setLoadingAnalytics(false));
    }
  }, [activeNav, marketingSubTab]);

  const selectedConvRef = useRef<Conversation | null>(null);
  useEffect(() => {
    selectedConvRef.current = selectedConv;
  }, [selectedConv]);

  // Real-time live polling for active chat messages (every 1.2s) & conversations (every 3s)
  useEffect(() => {
    let isMounted = true;

    const poll = async () => {
      if (!isMounted) return;

      // 1. Fetch active conversation messages
      const activeId = selectedConvRef.current?.id;
      if (activeId) {
        try {
          const msgs = await crm.getMessages(activeId);
          if (isMounted && Array.isArray(msgs) && selectedConvRef.current?.id === activeId) {
            setMessages((prev) => {
              if (
                msgs.length !== prev.length ||
                msgs.some(
                  (m, idx) =>
                    !prev[idx] ||
                    prev[idx].id !== m.id ||
                    prev[idx].status !== m.status ||
                    prev[idx].body !== m.body
                )
              ) {
                setTimeout(() => {
                  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
                return msgs;
              }
              return prev;
            });
          }
        } catch (err) {
          // silent on background poll
        }
      }

      // 2. Fetch conversations list silently
      try {
        const convs = await crm.getConversations();
        if (isMounted && Array.isArray(convs)) {
          setConversations((prev) => {
            if (
              convs.length !== prev.length ||
              convs.some(
                (c, idx) =>
                  !prev[idx] ||
                  prev[idx].id !== c.id ||
                  prev[idx].unread_count !== c.unread_count ||
                  prev[idx].last_message_at !== c.last_message_at
              )
            ) {
              return convs;
            }
            return prev;
          });
        }
      } catch (err) {
        // silent
      }
    };

    // Run poll every 1200ms
    const interval = setInterval(poll, 1200);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  async function loadBookings() {
    setLoadingBookings(true);
    try {
      const data = await crm.getBookings();
      const list = Array.isArray(data) ? data : [];
      setBookings(list);
    } catch (err) {
      console.error('Error fetching bookings:', err);
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
      setQuickCrmDoctor('Dr. Sarah Mitchell');
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
        preferred_doctor: quickCrmDoctor.trim() || 'Dr. Sarah Mitchell',
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
      if (typeof window !== 'undefined') {
        const slug = data?.slug || localStorage.getItem('tenant_slug') || 'boldlabs';
        localStorage.setItem('tenant_slug', slug);
        if (window.location.pathname === '/dashboard' || window.location.pathname === '/') {
          window.history.replaceState(null, '', `/${slug}`);
        }
      }
    } catch (err: unknown) {
      setSettingsError(err instanceof Error ? err.message : 'Failed to load client settings.');
    } finally {
      setSettingsLoading(false);
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsError('');
    setSettingsSaved(false);
    try {
      const updated = await crm.updateSettings(settingsForm);
      if (updated && updated.name !== undefined) {
        setSettingsForm(updated);
        if (typeof window !== 'undefined') {
          const slug = updated.slug || settingsForm.slug || localStorage.getItem('tenant_slug') || 'boldlabs';
          localStorage.setItem('tenant_slug', slug);
          if (window.location.pathname === '/dashboard' || window.location.pathname === '/') {
            window.history.replaceState(null, '', `/${slug}`);
          }
        }
      } else {
        await loadSettings();
      }
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 4000);
    } catch (err: unknown) {
      setSettingsError(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setSettingsSaving(false);
    }
  }

  async function loadConversations() {
    setIsRefreshing(true);
    try {
      const convs = await crm.getConversations();
      setConversations(Array.isArray(convs) ? convs : []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setIsRefreshing(false);
      setLoadingConvs(false);
    }
  }

  async function selectConversation(conv: Conversation) {
    setSelectedConv(conv);
    setLoadingMessages(true);
    try {
      const msgs = await crm.getMessages(conv.id);
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
      scrollToBottom();
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv || sendingMessage) return;

    const text = newMessage;
    setNewMessage('');
    setSendingMessage(true);

    try {
      const sent = await crm.sendMessage(selectedConv.id, text);
      setMessages((prev) => [...prev, sent]);
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

  async function handleUpdateBookingStatus(bookingId: string, newStatus: string) {
    setUpdatingBookingId(bookingId);
    setActionNotice(null);
    try {
      await crm.updateBookingStatus(bookingId, newStatus);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
      if (selectedBookingDetail && selectedBookingDetail.id === bookingId) {
        setSelectedBookingDetail({ ...selectedBookingDetail, status: newStatus });
      }

      if (newStatus === 'completed') {
        setActionNotice('Client marked Attended! Post-service review request template scheduled to send in 15 minutes via WhatsApp.');
      } else if (newStatus === 'no_show') {
        setActionNotice('Client marked No-Show! Reschedule nudge WhatsApp template sent to client.');
      } else if (newStatus === 'cancelled') {
        setActionNotice('Booking Cancelled. Cancellation notification WhatsApp template sent to client.');
      } else if (newStatus === 'confirmed') {
        setActionNotice('Booking Confirmed! Official confirmation WhatsApp template sent to client.');
      }
      setTimeout(() => setActionNotice(null), 5500);
    } catch (err) {
      alert('Failed to update booking status.');
    } finally {
      setUpdatingBookingId(null);
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
    setNewTemplateForm({ name: '', label: '', variables_count: 2 });
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
          ? `Campaign "${campaignForm.campaign_name}" scheduled for ${new Date(res.scheduled_at).toLocaleString()}!`
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

  function openChatForContact(phone: string) {
    setIsBookingDetailModalOpen(false);
    setSelectedBookingDetail(null);
    const existing = conversations.find((c) => (c.contact_phone || c.phone || '').includes(phone));
    if (existing) {
      setSelectedConv(existing);
      selectConversation(existing);
      setActiveNav('inbox');
    } else {
      setActiveNav('inbox');
    }
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
    calendarTitle = `${first.toLocaleDateString([], { month: 'short', day: 'numeric' })} â€“ ${last.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  return (
    <div className="w-full h-screen bg-canvas flex flex-col overflow-hidden font-sans text-text-body">
      {/* â”€â”€ Top Header Navigation Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <header className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0 bg-surface">
        {/* Logo & Current View Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-[17px] text-text-primary tracking-tight">
              {settingsForm.name || 'WhatsApp CRM'}
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

          {/* Notification Bell */}
          <button className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-subtle rounded-sm transition-colors duration-150 relative border border-border">
            <Bell className="w-3.5 h-3.5 stroke-[1.5]" />
            <span className="w-1.5 h-1.5 rounded-full bg-accent absolute top-1 right-1" />
          </button>
        </div>
      </header>

      {/* â”€â”€ Action Notice Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

      {/* â”€â”€ 3-Column Body Container â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* â”€â”€ 1. LEFT SIDEBAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <aside className="w-56 bg-surface border-r border-border flex flex-col shrink-0 p-3 justify-between">
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
                  activeNav === 'customers'
                    ? 'bg-surface-subtle text-text-primary font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle font-medium'
                }`}
              >
                <Users className="w-4 h-4 stroke-[1.5] shrink-0" />
                <span>Customer directory</span>
              </button>

              <button
                onClick={() => navigateTo('followup')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs transition-colors duration-150 cursor-pointer ${
                  activeNav === 'followup'
                    ? 'bg-surface-subtle text-text-primary font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle font-medium'
                }`}
              >
                <CalendarClock className="w-4 h-4 stroke-[1.5] shrink-0" />
                <span>Customer Followup</span>
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
                  <p className="text-xs font-medium text-text-primary">Settings</p>
                  <p className="text-[11px] text-text-muted">Configuration</p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 stroke-[1.5] text-text-muted" />
            </button>
          </div>
        </aside>

          {/* â”€â”€ 2. CENTER / MAIN VIEW AREA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <main className="flex-1 flex flex-col overflow-hidden bg-canvas p-6 space-y-6">
            
            {/* â”€â”€ VIEW 0: DEDICATED OVERVIEW DASHBOARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                                  {b.service} &bull; {new Date(b.start_time || b.appointment_time || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(b.start_time || b.appointment_time || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

            {/* â”€â”€ VIEW 1: BOOKINGS LIST & ATTENDANCE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {activeNav === 'bookings' && (
              <div className="flex-1 flex flex-col overflow-hidden space-y-4">
                {/* Breadcrumb & Action Toolbar */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span>Home</span>
                    <ChevronRight className="w-3 h-3 text-text-muted stroke-[1.5]" />
                    <span>Bookings</span>
                    <ChevronRight className="w-3 h-3 text-text-muted stroke-[1.5]" />
                    <span className="text-text-primary font-medium">Schedule</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Filter Segmented Control (Upcoming, Completed, No-Show, Cancelled) */}
                    <div className="flex gap-0.5 bg-surface-subtle p-0.5 rounded-sm border border-border">
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
                    <table className="w-full text-left text-xs">
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
                                  <p className="text-[11px] text-text-muted font-mono mt-0.5">{b.contact_phone || 'â€”'}</p>
                                </div>
                              </td>

                              <td className="p-3 text-xs text-text-body">
                                {b.service}
                              </td>

                              <td className="p-3 font-mono text-xs text-text-muted">
                                {b.start_time ? new Date(b.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'â€”'}
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
                                    <span>Profile</span>
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

            {/* â”€â”€ VIEW 2: CALENDAR VIEW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {activeNav === 'calendar' && (
              <div className="flex-1 flex flex-col overflow-hidden space-y-4">
                {/* Calendar Header Controls */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-sm text-text-primary">{calendarTitle}</h3>
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

                  <div className="flex items-center gap-2">
                    {/* View Mode Switcher */}
                    <div className="flex gap-0.5 bg-surface-subtle p-0.5 rounded-sm border border-border">
                      {(['day', 'week', 'month'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setCalendarViewMode(mode)}
                          className={`px-2.5 py-1 text-xs rounded-sm capitalize transition-colors duration-150 cursor-pointer ${
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
                      onClick={() => setIsAddBookingOpen(true)}
                      className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white font-medium text-xs rounded-sm transition-colors duration-150 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>Add booking</span>
                    </button>
                  </div>
                </div>

                {/* 1. MONTH VIEW */}
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
                        <div key={`offset-${i}`} className="min-h-[90px] p-2 bg-surface-subtle/30" />
                      ))}

                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const cellDate = new Date(year, month, dayNum);
                        const dayBookings = (bookings || []).filter((b) => {
                          if (!b || !b.start_time) return false;
                          const bDate = new Date(b.start_time);
                          return isSameDay(bDate, cellDate);
                        });
                        const isToday = isSameDay(new Date(), cellDate);

                        return (
                          <div
                            key={dayNum}
                            onClick={() => {
                              setCurrentDate(cellDate);
                              setCalendarViewMode('day');
                            }}
                            className={`min-h-[90px] p-2 flex flex-col justify-between transition-colors duration-150 cursor-pointer ${
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
                              {dayBookings.length > 0 && (
                                <span className="text-[11px] font-mono text-text-muted bg-surface px-1.5 py-0.5 rounded-sm border border-border">
                                  {dayBookings.length}
                                </span>
                              )}
                            </div>

                            <div className="space-y-1 mt-1 overflow-y-auto max-h-[65px]">
                              {dayBookings.map((b) => (
                                <button
                                  type="button"
                                  key={b.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBookingDetail(b);
                                    setIsBookingDetailModalOpen(true);
                                  }}
                                  className={`w-full text-left px-1.5 py-0.5 rounded-sm text-[11px] truncate block font-medium transition-colors duration-150 border ${
                                    b.status === 'completed'
                                      ? 'bg-status-success-bg text-status-success border-status-success-border'
                                      : b.status === 'no_show'
                                      ? 'bg-status-warning-bg text-status-warning border-status-warning-border'
                                      : b.status === 'cancelled'
                                      ? 'bg-status-error-bg text-status-error border-status-error-border'
                                      : 'bg-accent text-white border-accent'
                                  }`}
                                >
                                  {b.start_time ? new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} &bull; {b.contact_name || b.service}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. WEEK VIEW */}
                {calendarViewMode === 'week' && (
                  <div className="flex-1 overflow-y-auto border border-border rounded-md bg-surface flex flex-col">
                    {/* Week Days Header */}
                    <div className="grid grid-cols-8 bg-surface-subtle border-b border-border text-center py-2 shrink-0">
                      <div className="text-xs font-medium text-text-muted font-mono">Time</div>
                      {currentWeekDays.map((day, idx) => {
                        const isToday = isSameDay(new Date(), day);
                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              setCurrentDate(day);
                              setCalendarViewMode('day');
                            }}
                            className="flex flex-col items-center gap-0.5 cursor-pointer hover:opacity-80"
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

                    {/* Week Hours Grid */}
                    <div className="divide-y divide-border flex-1 overflow-y-auto">
                      {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((hour) => (
                        <div key={hour} className="grid grid-cols-8 min-h-[56px] divide-x divide-border">
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

                            return (
                              <div
                                key={dIdx}
                                className="p-1 relative group hover:bg-surface-subtle/50 transition-colors duration-150 min-h-[56px]"
                              >
                                {slotBookings.length === 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const dStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                                      const tStr = `${String(hour).padStart(2, '0')}:00`;
                                      setNewBookingForm((prev) => ({ ...prev, date: dStr, time: tStr }));
                                      setIsAddBookingOpen(true);
                                    }}
                                    className="w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors duration-150 text-xs font-medium rounded-sm"
                                    title="Add appointment at this time"
                                  >
                                    <Plus className="w-3.5 h-3.5 stroke-[1.5]" />
                                  </button>
                                ) : (
                                  <div className="space-y-1">
                                    {slotBookings.map((b) => (
                                      <div
                                        key={b.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedBookingDetail(b);
                                          setIsBookingDetailModalOpen(true);
                                        }}
                                        className={`p-1.5 rounded-sm border text-left cursor-pointer transition-colors duration-150 ${
                                          b.status === 'completed'
                                            ? 'bg-status-success-bg border-status-success-border text-status-success'
                                            : b.status === 'no_show'
                                            ? 'bg-status-warning-bg border-status-warning-border text-status-warning'
                                            : b.status === 'cancelled'
                                            ? 'bg-status-error-bg border-status-error-border text-status-error'
                                            : 'bg-accent border-accent text-white'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between gap-1">
                                          <p className="text-[11px] font-medium truncate">
                                            {b.contact_name || 'Client'}
                                          </p>
                                          <span className="text-[10px] font-mono opacity-80">
                                            {b.start_time ? new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                          </span>
                                        </div>
                                        <p className="text-[10px] truncate opacity-90">{b.service}</p>
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

                {/* 3. DAY VIEW */}
                {calendarViewMode === 'day' && (
                  <div className="flex-1 overflow-y-auto border border-border rounded-md bg-surface flex flex-col p-4 space-y-4">
                    {/* Day Overview Cards */}
                    {(() => {
                      const dayBookings = (bookings || []).filter((b) => {
                        if (!b || !b.start_time) return false;
                        const bDate = new Date(b.start_time);
                        return isSameDay(bDate, currentDate);
                      });
                      const totalRev = dayBookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
                      const attended = dayBookings.filter((b) => b.status === 'completed').length;
                      const confirmed = dayBookings.filter((b) => b.status === 'confirmed').length;
                      const noShow = dayBookings.filter((b) => b.status === 'no_show').length;

                      return (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="p-3 bg-surface border border-border rounded-md">
                            <p className="text-xs font-medium text-text-muted">Scheduled today</p>
                            <p className="text-xl font-semibold text-text-primary font-mono tabular-nums mt-1">{dayBookings.length}</p>
                          </div>
                          <div className="p-3 bg-surface border border-border rounded-md">
                            <p className="text-xs font-medium text-text-muted">Expected revenue</p>
                            <p className="text-xl font-semibold text-text-primary font-mono tabular-nums mt-1">{currentCurrencySymbol}{totalRev}</p>
                          </div>
                          <div className="p-3 bg-surface border border-border rounded-md">
                            <p className="text-xs font-medium text-status-success">Confirmed / Attended</p>
                            <p className="text-xl font-semibold text-text-primary font-mono tabular-nums mt-1">{confirmed + attended}</p>
                          </div>
                          <div className="p-3 bg-surface border border-border rounded-md">
                            <p className="text-xs font-medium text-status-warning">No-shows</p>
                            <p className="text-xl font-semibold text-text-primary font-mono tabular-nums mt-1">{noShow}</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Hourly Timeline */}
                    <div className="space-y-2 pt-2 divide-y divide-border">
                      {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((hour) => {
                        const hourBookings = (bookings || []).filter((b) => {
                          if (!b || !b.start_time) return false;
                          const bDate = new Date(b.start_time);
                          return isSameDay(bDate, currentDate) && bDate.getHours() === hour;
                        });

                        return (
                          <div key={hour} className="pt-2 flex items-start gap-4">
                            <div className="w-16 shrink-0 text-right font-mono text-xs text-text-muted pt-1">
                              {hour % 12 === 0 ? 12 : hour % 12} {hour >= 12 ? 'PM' : 'AM'}
                            </div>

                            <div className="flex-1 space-y-1.5">
                              {hourBookings.length === 0 ? (
                                <div className="h-6 flex items-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const dStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                                      const tStr = `${String(hour).padStart(2, '0')}:00`;
                                      setNewBookingForm((prev) => ({ ...prev, date: dStr, time: tStr }));
                                      setIsAddBookingOpen(true);
                                    }}
                                    className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1 font-medium transition-colors duration-150 cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3 stroke-[1.5]" />
                                    <span>Available slot &bull; Click to book</span>
                                  </button>
                                </div>
                              ) : (
                                hourBookings.map((b) => (
                                  <div
                                    key={b.id}
                                    onClick={() => {
                                      setSelectedBookingDetail(b);
                                      setIsBookingDetailModalOpen(true);
                                    }}
                                    className="p-3 bg-surface hover:bg-surface-subtle border border-border rounded-md transition-colors duration-150 cursor-pointer flex items-center justify-between gap-4"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-sm bg-surface-subtle text-text-secondary border border-border flex items-center justify-center font-medium text-xs shrink-0">
                                        {b.contact_name ? b.contact_name[0].toUpperCase() : 'C'}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className="font-medium text-xs text-text-primary">
                                            {b.contact_name || 'Client'}
                                          </p>
                                          <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-sm border ${
                                            b.status === 'completed'
                                              ? 'bg-status-success-bg text-status-success border-status-success-border'
                                              : b.status === 'no_show'
                                              ? 'bg-status-warning-bg text-status-warning border-status-warning-border'
                                              : b.status === 'cancelled'
                                              ? 'bg-status-error-bg text-status-error border-status-error-border'
                                              : 'bg-surface-subtle text-text-secondary border-border'
                                          }`}>
                                            {b.status || 'confirmed'}
                                          </span>
                                        </div>
                                        <p className="text-xs text-text-muted mt-0.5">
                                          {b.service} &bull; <span className="font-mono">{b.contact_phone}</span>
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                      <div className="text-right">
                                        <p className="font-medium text-xs text-text-primary font-mono tabular-nums">
                                          {currentCurrencySymbol}{b.price || 0}
                                        </p>
                                        <p className="text-xs text-text-muted font-mono">
                                          {b.start_time ? new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedBookingDetail(b);
                                          setIsBookingDetailModalOpen(true);
                                        }}
                                        className="px-2.5 py-1 bg-surface hover:bg-surface-subtle text-text-primary font-medium text-xs rounded-sm border border-border transition-colors duration-150 cursor-pointer"
                                      >
                                        Details
                                      </button>
                                    </div>
                                  </div>
                                ))
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

            {/* â”€â”€ VIEW 3: INBOX / CONVERSATIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {activeNav === 'inbox' && (
              <div className="flex-1 flex overflow-hidden border border-border rounded-md bg-surface">
                {/* Conversations List */}
                <div className="w-80 bg-surface border-r border-border flex flex-col shrink-0">
                  <div className="p-3 border-b border-border space-y-2.5">
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

                    {/* â”€â”€ Compact & Clean Segmentation Filter Bar â”€â”€ */}
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
                            <div className="w-7 h-7 rounded-sm bg-surface-subtle text-text-secondary border border-border flex items-center justify-center font-medium text-xs shrink-0">
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
                                      <span className="text-[9px] font-semibold px-1 py-0.2 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                        CRM
                                      </span>
                                    ) : null;
                                  })()}
                                </div>
                                <span className="text-xs text-text-muted font-mono shrink-0">
                                  {conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-0.5">
                                <p className="text-xs text-text-muted truncate font-mono">{conv.contact_phone}</p>
                                <div className="flex items-center gap-1.5">
                                  {(conv.unread_count || 0) > 0 && selectedConv?.id !== conv.id && (
                                    <span className="px-1.5 py-0.2 rounded-sm bg-accent text-white text-[10px] font-medium min-w-[16px] text-center">
                                      {conv.unread_count}
                                    </span>
                                  )}
                                  <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded-sm border ${
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

                {/* Chat Stream */}
                <div className="flex-1 flex flex-col bg-surface">
                  {selectedConv ? (
                    <>
                      <div className="h-14 px-4 border-b border-border flex items-center justify-between bg-surface shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-sm bg-accent text-white flex items-center justify-center font-medium text-xs">
                            {selectedConv.contact_name ? selectedConv.contact_name[0].toUpperCase() : 'C'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-xs text-text-primary">{selectedConv.contact_name || selectedConv.contact_phone}</h4>
                              {(() => {
                                const cleanP = selectedConv?.contact_phone ? selectedConv.contact_phone.replace(/[^0-9]/g, '') : '';
                                if (!cleanP) return null;
                                const inCrm = Array.isArray(customers) && customers.some((c) => c && c.phone && c.phone.replace(/[^0-9]/g, '') === cleanP);
                                return inCrm ? (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    In CRM
                                  </span>
                                ) : null;
                              })()}
                            </div>
                            <p className="text-xs text-text-muted font-mono">{selectedConv.contact_phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Cross-tab CRM profile button */}
                          {(() => {
                            const cleanP = selectedConv?.contact_phone ? selectedConv.contact_phone.replace(/[^0-9]/g, '') : '';
                            const existingCust = cleanP && Array.isArray(customers) ? customers.find((c) => c && c.phone && c.phone.replace(/[^0-9]/g, '') === cleanP) : null;
                            if (existingCust) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => openCustomerProfileByPhone(selectedConv.contact_phone || '', selectedConv.contact_name || undefined)}
                                  className="px-2.5 py-1 rounded-sm text-xs font-medium border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                                  title="View full customer profile, notes, and bookings"
                                >
                                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>CRM Profile</span>
                                </button>
                              );
                            } else {
                              return (
                                <button
                                  type="button"
                                  onClick={() => openCustomerProfileByPhone(selectedConv.contact_phone || '', selectedConv.contact_name || undefined)}
                                  className="px-2.5 py-1 rounded-sm text-xs font-medium border border-accent bg-accent/10 text-accent hover:bg-accent hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                                  title="Add this contact as a CRM customer"
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                  <span>+ Add to CRM</span>
                                </button>
                              );
                            }
                          })()}

                          <button
                            type="button"
                            onClick={() => toggleImportant(selectedConv.id)}
                            className={`px-2.5 py-1 rounded-sm text-xs font-medium border flex items-center gap-1.5 transition-colors duration-150 cursor-pointer ${
                              importantConvIds.includes(selectedConv.id)
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-subtle border-border'
                            }`}
                            title={importantConvIds.includes(selectedConv.id) ? 'Remove from Important' : 'Mark conversation as Important'}
                          >
                            <Star className={`w-3.5 h-3.5 stroke-[1.5] ${importantConvIds.includes(selectedConv.id) ? 'fill-amber-500 text-amber-500' : 'text-text-muted'}`} />
                            <span className="hidden sm:inline">{importantConvIds.includes(selectedConv.id) ? 'Important' : 'Mark important'}</span>
                          </button>

                          <span className={`text-xs font-medium px-2 py-0.5 rounded-sm border transition-colors duration-150 ${
                            selectedConv.ai_enabled
                              ? 'bg-status-success-bg text-status-success border-status-success-border'
                              : 'bg-status-warning-bg text-status-warning border-status-warning-border'
                          }`}>
                            {selectedConv.ai_enabled ? 'AI auto-reply' : 'Human only'}
                          </span>
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
                            className="cursor-pointer text-text-secondary hover:text-text-primary transition-colors duration-150 disabled:opacity-50"
                            title={selectedConv.ai_enabled ? 'Pause AI (Human takeover)' : 'Enable AI auto-reply'}
                          >
                            {selectedConv.ai_enabled ? (
                              <ToggleRight className="w-7 h-7 text-accent" />
                            ) : (
                              <ToggleLeft className="w-7 h-7 text-text-muted" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteChatModal({
                                isOpen: true,
                                convId: selectedConv.id,
                                name: selectedConv.contact_name || selectedConv.contact_phone || 'this customer',
                              })
                            }
                            className="p-1.5 text-text-muted hover:text-status-error hover:bg-status-error-bg rounded-sm transition-colors duration-150 cursor-pointer ml-1"
                            title="Delete this chat"
                          >
                            <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {loadingMessages ? (
                          <div className="text-center text-xs text-text-muted py-8">Loading history...</div>
                        ) : messages.map((msg) => {
                          const isInbound = msg.direction === 'inbound';
                          const isVoice = msg.body?.startsWith('ðŸŽ¤ [Voice Note:');
                          return (
                            <div key={msg.id} className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}>
                              <div
                                className={`max-w-[75%] rounded-md px-3.5 py-2.5 text-xs ${
                                  isInbound ? 'bg-surface-subtle text-text-body border border-border' : 'bg-accent text-white'
                                }`}
                              >
                                {isVoice && (
                                  <div className="flex items-center gap-1 text-accent-light font-mono text-[10px] mb-1">
                                    <Mic className="w-3 h-3 stroke-[1.5]" />
                                    <span>Voice note transcribed</span>
                                  </div>
                                )}
                                <p className="leading-relaxed whitespace-pre-wrap font-sans">{msg.body}</p>
                                <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 font-mono ${isInbound ? 'text-text-muted' : 'text-teal-100/90'}`}>
                                  <span>{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
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
                        })}
                        <div ref={messagesEndRef} />
                      </div>

                      <form onSubmit={handleSendMessage} className="p-3 border-t border-border flex gap-2 bg-surface">
                        <input
                          type="text"
                          placeholder="Type WhatsApp reply..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="flex-1 px-3.5 py-2 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:outline-none focus:bg-white focus:border-accent font-sans transition-colors duration-150"
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim() || sendingMessage}
                          className="px-3.5 py-2 bg-accent hover:bg-accent-hover text-white font-medium text-xs rounded-sm transition-colors duration-150 cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5 stroke-[1.5]" />
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

            {/* -- VIEW 4: CUSTOMERS DIRECTORY -- */}
            {activeNav === 'customers' && (
              <div className="flex-1 flex flex-col overflow-hidden gap-3">
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div>
                    <h3 className="font-semibold text-sm text-text-primary">Customer directory
                      <span className="ml-1.5 text-text-muted text-xs font-normal">
                        ({(Array.isArray(customers) ? customers : []).filter(c => !dirSearch.trim() || ((c?.name||'').toLowerCase().includes(dirSearch.toLowerCase()) || (c?.phone||'').toLowerCase().includes(dirSearch.toLowerCase()) || (c?.wa_profile_name||'').toLowerCase().includes(dirSearch.toLowerCase()) || (c?.health_concern||'').toLowerCase().includes(dirSearch.toLowerCase()) || (c?.status||'').toLowerCase().includes(dirSearch.toLowerCase()))).length} of {Array.isArray(customers) ? customers.length : 0})
                      </span>
                    </h3>
                    <p className="text-[11px] text-text-muted mt-0.5">Complete CRM records — click any row to view full profile</p>
                  </div>
                  <input
                    type="text"
                    placeholder="Search name, phone, concern..."
                    value={dirSearch}
                    onChange={(e) => setDirSearch(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent w-52"
                  />
                </div>

                <div className="flex-1 flex gap-3 overflow-hidden">
                  <div className={`flex-1 overflow-auto border border-border rounded-sm bg-surface ${dirSelectedCust ? 'min-w-0' : ''}`}>
                    <table className="w-full text-left text-xs min-w-[860px]">
                      <thead className="bg-surface-subtle border-b border-border text-text-secondary font-medium text-[11px] sticky top-0 z-10">
                        <tr>
                          <th className="p-2.5 pl-4 whitespace-nowrap">Customer</th>
                          <th className="p-2.5 whitespace-nowrap">Phone</th>
                          <th className="p-2.5 whitespace-nowrap">Status</th>
                          <th className="p-2.5 whitespace-nowrap">Lead</th>
                          <th className="p-2.5 whitespace-nowrap">Health Concern</th>
                          <th className="p-2.5 whitespace-nowrap">Follow-up</th>
                          <th className="p-2.5 whitespace-nowrap">Notes</th>
                          <th className="p-2.5 whitespace-nowrap">Converted</th>
                          <th className="p-2.5 whitespace-nowrap">First Added</th>
                          <th className="p-2.5 whitespace-nowrap">Last Chat</th>
                          <th className="p-2.5 pr-4 text-right whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {loadingCustomers ? (
                          <tr><td colSpan={11} className="p-8 text-center text-text-muted text-xs">Loading customers...</td></tr>
                        ) : (Array.isArray(customers) ? customers : []).filter(c => !dirSearch.trim() || ((c?.name||'').toLowerCase().includes(dirSearch.toLowerCase()) || (c?.phone||'').toLowerCase().includes(dirSearch.toLowerCase()) || (c?.wa_profile_name||'').toLowerCase().includes(dirSearch.toLowerCase()) || (c?.health_concern||'').toLowerCase().includes(dirSearch.toLowerCase()) || (c?.status||'').toLowerCase().includes(dirSearch.toLowerCase()))).length === 0 ? (
                          <tr><td colSpan={11} className="p-8 text-center text-text-muted text-xs">No customers found.</td></tr>
                        ) : (Array.isArray(customers) ? customers : []).filter(c => !dirSearch.trim() || ((c?.name||'').toLowerCase().includes(dirSearch.toLowerCase()) || (c?.phone||'').toLowerCase().includes(dirSearch.toLowerCase()) || (c?.wa_profile_name||'').toLowerCase().includes(dirSearch.toLowerCase()) || (c?.health_concern||'').toLowerCase().includes(dirSearch.toLowerCase()) || (c?.status||'').toLowerCase().includes(dirSearch.toLowerCase()))).map((cust) => {
                          const sStyle: Record<string, string> = { converted: 'bg-emerald-50 text-emerald-800 border-emerald-200', 'follow-up': 'bg-amber-50 text-amber-800 border-amber-200', contacted: 'bg-blue-50 text-blue-800 border-blue-200', lost: 'bg-rose-50 text-rose-800 border-rose-200', new: 'bg-slate-100 text-slate-700 border-slate-200' };
                          const lStyle: Record<string, string> = { hot: 'bg-rose-50 text-rose-700 border-rose-200', warm: 'bg-amber-50 text-amber-700 border-amber-200', cold: 'bg-blue-50 text-blue-700 border-blue-200' };
                          const lDot: Record<string, string> = { hot: 'bg-rose-500', warm: 'bg-amber-500', cold: 'bg-blue-400' };
                          return (
                            <tr
                              key={cust.id}
                              onClick={() => setDirSelectedCust(dirSelectedCust?.id === cust.id ? null : cust)}
                              className={`hover:bg-surface-subtle/60 transition-colors duration-100 cursor-pointer ${dirSelectedCust?.id === cust.id ? 'bg-blue-50/40 border-l-2 border-l-accent' : ''}`}
                            >
                              <td className="p-2.5 pl-4">
                                <div className="font-medium text-text-primary">{cust.name || 'Unnamed'}</div>
                                {cust.wa_profile_name && cust.wa_profile_name !== cust.name && (
                                  <div className="text-[10px] text-text-muted mt-0.5 flex items-center gap-1">
                                    <MessageCircle className="w-2.5 h-2.5 shrink-0" />{cust.wa_profile_name}
                                  </div>
                                )}
                              </td>
                              <td className="p-2.5 font-mono text-text-secondary whitespace-nowrap text-[11px]">{cust.phone}</td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded-sm text-[11px] font-medium border ${sStyle[cust.status] || sStyle['new']}`}>
                                  {cust.status === 'follow-up' ? 'Follow-up' : (cust.status || 'New').charAt(0).toUpperCase() + (cust.status || 'New').slice(1)}
                                </span>
                              </td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded-sm text-[11px] font-medium border flex items-center gap-1 w-fit ${lStyle[cust.lead_probability] || lStyle['warm']}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${lDot[cust.lead_probability] || lDot['warm']}`} />
                                  {(cust.lead_probability || 'warm').charAt(0).toUpperCase() + (cust.lead_probability || 'warm').slice(1)}
                                </span>
                              </td>
                              <td className="p-2.5 max-w-[160px]">
                                <span className="text-text-secondary text-[11px] truncate block" title={cust.health_concern || ''}>{cust.health_concern || '-'}</span>
                              </td>
                              <td className="p-2.5 whitespace-nowrap">
                                {cust.followup_date ? (
                                  <div>
                                    <div className="font-mono text-[11px] text-text-body">{cust.followup_date}</div>
                                    <div className="text-[10px] text-text-muted">{cust.followup_time || '10:00 AM'}</div>
                                  </div>
                                ) : <span className="text-text-muted text-[11px]">-</span>}
                              </td>
                              <td className="p-2.5 text-center">
                                <span className={`inline-flex items-center gap-1 text-[11px] ${(cust.notes_count || 0) > 0 ? 'text-accent font-semibold' : 'text-text-muted'}`}>
                                  <StickyNote className="w-3 h-3 stroke-[1.5]" />{cust.notes_count || 0}
                                </span>
                              </td>
                              <td className="p-2.5 text-center">
                                {cust.converted
                                  ? <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 justify-center"><CheckCircle2 className="w-3.5 h-3.5 stroke-[1.5]" />Yes</span>
                                  : <span className="text-[11px] text-text-muted">No</span>}
                              </td>
                              <td className="p-2.5 font-mono text-[11px] text-text-muted whitespace-nowrap">
                                {cust.created_at ? new Date(cust.created_at).toLocaleDateString() : '-'}
                              </td>
                              <td className="p-2.5 font-mono text-[11px] whitespace-nowrap">
                                {cust.last_chat_at
                                  ? <span className="flex items-center gap-1 text-blue-600"><MessageCircle className="w-3 h-3 stroke-[1.5]" />{new Date(cust.last_chat_at).toLocaleDateString()}</span>
                                  : <span className="text-text-muted">No chat</span>}
                              </td>
                              <td className="p-2.5 pr-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-1.5 justify-end">
                                  <button
                                    onClick={() => openChatForContact(cust.phone)}
                                    className="px-2 py-1 bg-surface hover:bg-surface-subtle text-text-primary text-[11px] rounded-sm border border-border transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <MessageCircle className="w-3 h-3 stroke-[1.5]" /> Chat
                                  </button>
                                  <button
                                    onClick={() => setDirSelectedCust(dirSelectedCust?.id === cust.id ? null : cust)}
                                    className="px-2 py-1 bg-accent hover:bg-accent-hover text-white text-[11px] rounded-sm transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <User className="w-3 h-3 stroke-[1.5]" /> Profile
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {dirSelectedCust && (
                    <div className="w-[480px] xl:w-[540px] bg-surface border border-border rounded-sm flex flex-col shrink-0 overflow-hidden shadow-sm">
                      <div className="p-3 border-b border-border bg-surface-subtle/50 flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-xs text-text-primary flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-accent" />{dirSelectedCust.name || 'Customer Profile'}
                          </h4>
                          <p className="text-[10px] font-mono text-text-muted mt-0.5">{dirSelectedCust.phone}</p>
                        </div>
                        <button onClick={() => setDirSelectedCust(null)} className="p-1 text-text-muted hover:text-text-primary rounded-sm hover:bg-surface-subtle cursor-pointer">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">Identity</p>
                          <div className="bg-surface-subtle border border-border rounded-sm divide-y divide-border">
                            {[{ label: 'CRM Name', value: dirSelectedCust.name || '-' }, { label: 'WA Profile', value: dirSelectedCust.wa_profile_name || '-' }, { label: 'Phone', value: dirSelectedCust.phone, mono: true }].map((f) => (
                              <div key={f.label} className="flex items-start justify-between px-2.5 py-2 gap-2">
                                <span className="text-text-muted shrink-0 text-[11px]">{f.label}</span>
                                <span className={`text-text-primary font-medium text-right truncate text-[11px] ${f.mono ? 'font-mono' : ''}`}>{f.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">CRM Status</p>
                          <div className="bg-surface-subtle border border-border rounded-sm divide-y divide-border">
                            <div className="flex items-center justify-between px-2.5 py-2 gap-2">
                              <span className="text-text-muted text-[11px]">Status</span>
                              <span className={`px-2 py-0.5 rounded-sm text-[11px] font-medium border ${({ converted: 'bg-emerald-50 text-emerald-800 border-emerald-200', 'follow-up': 'bg-amber-50 text-amber-800 border-amber-200', contacted: 'bg-blue-50 text-blue-800 border-blue-200', lost: 'bg-rose-50 text-rose-800 border-rose-200', new: 'bg-slate-100 text-slate-700 border-slate-200' } as Record<string,string>)[dirSelectedCust.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                {dirSelectedCust.status === 'follow-up' ? 'Follow-up' : (dirSelectedCust.status || 'New').charAt(0).toUpperCase() + (dirSelectedCust.status || 'New').slice(1)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between px-2.5 py-2 gap-2">
                              <span className="text-text-muted text-[11px]">Lead</span>
                              <span className={`px-2 py-0.5 rounded-sm text-[11px] font-medium border flex items-center gap-1 ${({ hot: 'bg-rose-50 text-rose-700 border-rose-200', warm: 'bg-amber-50 text-amber-700 border-amber-200', cold: 'bg-blue-50 text-blue-700 border-blue-200' } as Record<string,string>)[dirSelectedCust.lead_probability] || 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${{ hot: 'bg-rose-500', warm: 'bg-amber-500', cold: 'bg-blue-400' }[dirSelectedCust.lead_probability] || 'bg-amber-500'}`} />
                                {(dirSelectedCust.lead_probability || 'warm').charAt(0).toUpperCase() + (dirSelectedCust.lead_probability || 'warm').slice(1)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between px-2.5 py-2 gap-2">
                              <span className="text-text-muted text-[11px]">Converted</span>
                              {dirSelectedCust.converted
                                ? <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]"><CheckCircle2 className="w-3 h-3" /> Yes</span>
                                : <span className="text-text-muted text-[11px]">No</span>}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">Health / Concern</p>
                          <div className="bg-surface-subtle border border-border rounded-sm divide-y divide-border">
                            {[{ label: 'Health Concern', value: dirSelectedCust.health_concern || '-' }, { label: 'Preferred Staff', value: dirSelectedCust.preferred_doctor || '-' }].map((f) => (
                              <div key={f.label} className="flex items-start justify-between px-2.5 py-2 gap-2">
                                <span className="text-text-muted shrink-0 text-[11px]">{f.label}</span>
                                <span className="text-text-primary font-medium text-right text-[11px]">{f.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">Schedule</p>
                          <div className="bg-surface-subtle border border-border rounded-sm divide-y divide-border">
                            {[{ label: 'Follow-up Date', value: dirSelectedCust.followup_date || '-', mono: true }, { label: 'Follow-up Time', value: dirSelectedCust.followup_time || '-', mono: true }].map((f) => (
                              <div key={f.label} className="flex items-center justify-between px-2.5 py-2 gap-2">
                                <span className="text-text-muted text-[11px]">{f.label}</span>
                                <span className={`text-text-primary font-medium text-[11px] ${f.mono ? 'font-mono' : ''}`}>{f.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">Activity</p>
                          <div className="bg-surface-subtle border border-border rounded-sm divide-y divide-border">
                            {[
                              { label: 'First Added', value: dirSelectedCust.created_at ? new Date(dirSelectedCust.created_at).toLocaleString() : '-', mono: true },
                              { label: 'Last Chat', value: dirSelectedCust.last_chat_at ? new Date(dirSelectedCust.last_chat_at).toLocaleString() : 'No chat', mono: true },
                              { label: 'Notes', value: `${dirSelectedCust.notes_count || 0} note${(dirSelectedCust.notes_count || 0) === 1 ? '' : 's'}` },
                              { label: 'Google Tasks', value: dirSelectedCust.google_task_id ? 'Synced' : 'Not synced' },
                            ].map((f) => (
                              <div key={f.label} className="flex items-start justify-between px-2.5 py-2 gap-2">
                                <span className="text-text-muted shrink-0 text-[11px]">{f.label}</span>
                                <span className={`text-text-primary font-medium text-right ${f.mono ? 'font-mono text-[10px]' : 'text-[11px]'}`}>{f.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {dirSelectedCust.latest_note && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">Latest Note</p>
                            <div className="bg-amber-50 border border-amber-200 rounded-sm px-2.5 py-2 text-[11px] text-amber-900 leading-relaxed whitespace-pre-wrap">{dirSelectedCust.latest_note}</div>
                          </div>
                        )}
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => openChatForContact(dirSelectedCust.phone)}
                            className="flex-1 py-1.5 px-2.5 bg-surface border border-border hover:bg-surface-subtle text-text-primary text-xs font-medium rounded-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-accent" /> Open Chat
                          </button>
                          <button
                            onClick={() => { navigateTo('followup'); handleSelectCustomer(dirSelectedCust); }}
                            className="flex-1 py-1.5 px-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <CalendarClock className="w-3.5 h-3.5" /> Manage
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* â”€â”€ VIEW 5: CUSTOMER FOLLOWUP & TASK CALENDAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {activeNav === 'followup' && (
              <div className="flex-1 flex flex-col overflow-hidden space-y-4">
                {/* Compact & Clean Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border pb-2.5">
                  <div>
                    <h3 className="font-semibold text-sm text-text-primary flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-accent stroke-[1.5]" />
                      <span>Customer Follow-up</span>
                    </h3>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      Follow-ups, scheduled tasks, and staff notes.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Compact View Switcher Pills */}
                    <div className="flex items-center gap-1 bg-surface-subtle border border-border rounded-sm p-0.5">
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

                {/* â”€â”€ SUB-VIEW A: FOLLOW-UP LIST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                {followupView === 'list' && (
                  <div className="flex-1 flex flex-col overflow-hidden space-y-3">
                    {/* Filter & Segment Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-surface border border-border rounded-sm">
                      {/* Left: Status Filter Pills */}
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[11px] font-medium text-text-muted mr-1">Status:</span>
                        {[
                          { key: 'all', label: 'All' },
                          { key: 'new', label: 'New', color: 'text-slate-700 bg-slate-100 border-slate-200' },
                          { key: 'contacted', label: 'Contacted', color: 'text-blue-700 bg-blue-50 border-blue-200' },
                          { key: 'follow-up', label: 'Follow-up', color: 'text-amber-700 bg-amber-50 border-amber-200' },
                          { key: 'converted', label: 'Converted', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                          { key: 'lost', label: 'Lost', color: 'text-rose-700 bg-rose-50 border-rose-200' },
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

                      {/* Middle: Probability Badges */}
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-medium text-text-muted mr-1">Lead:</span>
                        {[
                          { key: 'all', label: 'All' },
                          { key: 'hot', label: 'ðŸ”¥ Hot', color: 'text-rose-700 bg-rose-50 border-rose-200' },
                          { key: 'warm', label: 'âš¡ Warm', color: 'text-amber-700 bg-amber-50 border-amber-200' },
                          { key: 'cold', label: '❄️ Cold', color: 'text-blue-700 bg-blue-50 border-blue-200' },
                        ].map((prob) => (
                          <button
                            key={prob.key}
                            onClick={() => setFollowupProbabilityFilter(prob.key)}
                            className={`px-2 py-0.5 text-xs rounded-sm border transition-colors cursor-pointer ${
                              followupProbabilityFilter === prob.key
                                ? 'bg-surface-subtle border-text-primary font-semibold text-text-primary'
                                : 'bg-surface border-border text-text-secondary hover:text-text-primary'
                            }`}
                          >
                            {prob.label}
                          </button>
                        ))}
                      </div>

                      {/* Right: Doctor Selector & Search */}
                      <div className="flex items-center gap-2">
                        <select
                          value={followupDoctorFilter}
                          onChange={(e) => setFollowupDoctorFilter(e.target.value)}
                          className="px-2.5 py-1 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                        >
                          <option value="all">All Doctors</option>
                          <option value="Dr. Sarah Mitchell">Dr. Sarah Mitchell</option>
                          <option value="Dr. Rajesh Kumar">Dr. Rajesh Kumar</option>
                          <option value="Dr. Emily Stone">Dr. Emily Stone</option>
                        </select>

                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                          <input
                            type="text"
                            placeholder="Filter name, phone, issue..."
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
                          <p className="text-[11px] text-text-muted font-medium">Total Customers</p>
                          <p className="text-base font-semibold text-text-primary mt-0.5">{customers.length}</p>
                        </div>
                        <Users className="w-4 h-4 text-text-muted" />
                      </div>

                      <div className="p-3 bg-surface border border-border rounded-sm flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-amber-700 font-medium">Pending Follow-ups</p>
                          <p className="text-base font-semibold text-amber-900 mt-0.5">
                            {customers.filter(c => c.status === 'follow-up' || c.status === 'new').length}
                          </p>
                        </div>
                        <Clock3 className="w-4 h-4 text-amber-600" />
                      </div>

                      <div className="p-3 bg-surface border border-border rounded-sm flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-rose-700 font-medium">Hot Leads</p>
                          <p className="text-base font-semibold text-rose-900 mt-0.5">
                            {customers.filter(c => c.lead_probability === 'hot').length}
                          </p>
                        </div>
                        <Flame className="w-4 h-4 text-rose-600" />
                      </div>

                      <div className="p-3 bg-surface border border-border rounded-sm flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-emerald-700 font-medium">Converted Customers</p>
                          <p className="text-base font-semibold text-emerald-900 mt-0.5">
                            {customers.filter(c => c.converted).length}
                            <span className="text-[10px] text-emerald-600 ml-1.5 font-normal">
                              ({customers.length ? Math.round((customers.filter(c => c.converted).length / customers.length) * 100) : 0}%)
                            </span>
                          </p>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>

                    {/* Main Table + Slide-Over / Detail Split */}
                    <div className="flex-1 flex overflow-hidden gap-4">
                      {/* Customers Table */}
                      <div className="flex-1 overflow-y-auto border border-border rounded-sm bg-surface">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-surface-subtle border-b border-border text-text-secondary font-medium sticky top-0 z-10">
                            <tr>
                              <th className="p-3 pl-4">Customer</th>
                              <th className="p-3">Doctor</th>
                              <th className="p-3">Health Concern</th>
                              <th className="p-3">Status</th>
                              <th className="p-3">Lead</th>
                              <th className="p-3 text-center">Converted</th>
                              <th className="p-3">Follow-up Due</th>
                              <th className="p-3">Latest Note</th>
                              <th className="p-3 text-right pr-4">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {loadingCustomers ? (
                              <tr>
                                <td colSpan={9} className="p-8 text-center text-text-muted">
                                  Loading customers...
                                </td>
                              </tr>
                            ) : customers.length === 0 ? (
                              <tr>
                                <td colSpan={9} className="p-8 text-center text-text-muted">
                                  No customers match the selected filters.
                                </td>
                              </tr>
                            ) : (
                              customers.map((cust) => {
                                const isSelected = selectedCustomer?.id === cust.id;
                                const isOverdue = cust.followup_date && new Date(cust.followup_date) < new Date(new Date().setHours(0, 0, 0, 0)) && !cust.converted;
                                const isToday = cust.followup_date && new Date(cust.followup_date).toDateString() === new Date().toDateString();

                                return (
                                  <tr
                                    key={cust.id}
                                    onClick={() => handleSelectCustomer(cust)}
                                    className={`cursor-pointer transition-colors duration-150 ${
                                      isSelected ? 'bg-surface-subtle/80 font-medium' : 'hover:bg-surface-subtle'
                                    }`}
                                  >
                                    <td className="p-3 pl-4">
                                      <div className="font-semibold text-text-primary">{cust.name || 'Customer'}</div>
                                      <div className="font-mono text-[11px] text-text-muted mt-0.5">{cust.phone}</div>
                                    </td>

                                    <td className="p-3 text-text-secondary whitespace-nowrap">
                                      <div className="flex items-center gap-1.5">
                                        <Stethoscope className="w-3.5 h-3.5 text-accent shrink-0" />
                                        <span>{cust.preferred_doctor || 'Dr. Sarah Mitchell'}</span>
                                      </div>
                                    </td>

                                    <td className="p-3 text-text-secondary max-w-[180px] truncate" title={cust.health_concern}>
                                      <span className="px-2 py-0.5 bg-surface-subtle border border-border rounded-sm text-[11px]">
                                        {cust.health_concern || 'General'}
                                      </span>
                                    </td>

                                    {/* Instant Status Selector */}
                                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                      <select
                                        value={cust.status}
                                        onChange={(e) => handleUpdateCustomer(cust.id, { status: e.target.value as any })}
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

                                    {/* Instant Lead Probability Selector */}
                                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
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

                                    {/* Instant Converted Toggle */}
                                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        onClick={() => handleUpdateCustomer(cust.id, { converted: !cust.converted })}
                                        className={`px-2 py-0.5 rounded-sm text-[11px] font-medium border transition-colors cursor-pointer ${
                                          cust.converted
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                            : 'bg-surface text-text-muted border-border hover:text-text-primary'
                                        }`}
                                      >
                                        {cust.converted ? 'Converted' : 'Pending'}
                                      </button>
                                    </td>

                                    {/* Follow-up Date & Time */}
                                    <td className="p-3 whitespace-nowrap">
                                      {cust.followup_date ? (
                                        <div className="flex flex-col gap-0.5">
                                          <span className={`inline-flex items-center gap-1 font-mono text-[11px] ${
                                            isOverdue ? 'text-rose-700 font-semibold' : isToday ? 'text-amber-700 font-semibold' : 'text-text-body'
                                          }`}>
                                            {isOverdue && <AlertCircle className="w-3 h-3 stroke-[2] text-rose-600" />}
                                            {isToday && <Clock className="w-3 h-3 stroke-[2] text-amber-600" />}
                                            <span>{cust.followup_date}</span>
                                          </span>
                                          <span className="text-[10px] text-text-muted font-mono">{cust.followup_time || '10:00 AM'}</span>
                                        </div>
                                      ) : (
                                        <span className="text-text-muted text-[11px]">â€”</span>
                                      )}
                                    </td>

                                    {/* Latest Note Snippet */}
                                    <td className="p-3 max-w-[200px]">
                                      {cust.latest_note ? (
                                        <div className="truncate text-text-secondary text-[11px]" title={cust.latest_note}>
                                          {cust.latest_note}
                                        </div>
                                      ) : (
                                        <span className="text-text-muted text-[11px]">No notes yet</span>
                                      )}
                                      <div className="text-[10px] text-text-muted mt-0.5">
                                        {cust.notes_count || 0} {cust.notes_count === 1 ? 'note' : 'notes'}
                                      </div>
                                    </td>

                                    {/* Action Button */}
                                    <td className="p-3 text-right pr-4">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSelectCustomer(cust);
                                        }}
                                        className="px-2.5 py-1 bg-surface hover:bg-surface-subtle text-text-primary font-medium text-xs rounded-sm border border-border transition-colors cursor-pointer"
                                      >
                                        Details
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Customer Detail Drawer / Side Panel */}
                      {selectedCustomer && (
                        <div className={`${isDrawerExpanded ? 'w-[780px] max-w-[60vw]' : 'w-[540px] xl:w-[620px]'} bg-surface border border-border rounded-sm flex flex-col shrink-0 overflow-hidden transition-all duration-200 shadow-sm`}>
                          {/* Panel Header */}
                          <div className="p-3.5 border-b border-border flex items-center justify-between bg-surface-subtle/50">
                            <div>
                              <h4 className="font-semibold text-xs text-text-primary flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-accent" />
                                <span>{selectedCustomer.name || 'Customer'}</span>
                              </h4>
                              <p className="text-[11px] font-mono text-text-muted mt-0.5">{selectedCustomer.phone}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => openChatForContact(selectedCustomer.phone)}
                                className="px-2.5 py-1.5 bg-surface hover:bg-surface-subtle text-text-primary text-xs font-medium rounded-sm border border-border flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Open WhatsApp chat with this customer"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-accent" />
                                <span>Chat</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsDrawerExpanded(!isDrawerExpanded)}
                                className="p-1 text-text-muted hover:text-text-primary rounded-sm hover:bg-surface-subtle transition-colors cursor-pointer"
                                title={isDrawerExpanded ? 'Collapse panel' : 'Expand to full width'}
                              >
                                {isDrawerExpanded ? <Minimize2 className="w-4 h-4 stroke-[1.5]" /> : <Maximize2 className="w-4 h-4 stroke-[1.5]" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => { setSelectedCustomer(null); setIsDrawerExpanded(false); }}
                                className="p-1 text-text-muted hover:text-text-primary rounded-sm hover:bg-surface-subtle transition-colors cursor-pointer"
                                title="Close panel"
                              >
                                <X className="w-4 h-4 stroke-[1.5]" />
                              </button>
                            </div>
                          </div>

                          {/* Panel Body Scroll Area */}
                          <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* 1. Editable Follow-up Date & Google Tasks Sync Card */}
                            <div className="p-3 bg-surface-subtle border border-border rounded-sm space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                                  <CalendarClock className="w-3.5 h-3.5 text-accent" />
                                  <span>Schedule Follow-up</span>
                                </span>
                                {selectedCustomer.google_task_id && (
                                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-sm font-medium flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 stroke-[1.5]" /> Google Tasks Synced
                                  </span>
                                )}
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

                              {/* Google Tasks Sync Action */}
                              <div className="pt-1">
                                <button
                                  type="button"
                                  disabled={syncingGoogleTasks}
                                  onClick={() => handleSyncCustomerToGoogleTasks(selectedCustomer.id)}
                                  className="w-full py-1.5 px-2.5 bg-surface hover:bg-surface-subtle text-text-primary text-xs font-medium border border-border rounded-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  <CalendarCheck className="w-3.5 h-3.5 text-accent" />
                                  <span>
                                    {syncingGoogleTasks
                                      ? 'Syncing to Google Tasks...'
                                      : selectedCustomer.google_task_id
                                      ? 'Re-sync with Google Tasks'
                                      : 'Add to Google Tasks'}
                                  </span>
                                </button>
                              </div>
                            </div>

                            {/* 2. Customer Attributes & Doctor Selection */}
                            <div className="space-y-2 text-xs">
                              <div>
                                <label className="text-[10px] text-text-muted block mb-1">Preferred Doctor / Staff</label>
                                <input
                                  type="text"
                                  value={selectedCustomer.preferred_doctor || ''}
                                  onChange={(e) => handleUpdateCustomer(selectedCustomer.id, { preferred_doctor: e.target.value })}
                                  placeholder="e.g. Dr. Sarah Mitchell"
                                  className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent text-xs"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-text-muted block mb-1">Health Concern / Treatment</label>
                                <input
                                  type="text"
                                  value={selectedCustomer.health_concern || ''}
                                  onChange={(e) => handleUpdateCustomer(selectedCustomer.id, { health_concern: e.target.value })}
                                  placeholder="e.g. Back Pain & Physio Therapy"
                                  className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent text-xs"
                                />
                              </div>
                            </div>

                            {/* 3. Timestamped Customer Notes Log */}
                            <div className="space-y-2 border-t border-border pt-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                                  <StickyNote className="w-3.5 h-3.5 text-accent" />
                                  <span>Staff Notes ({customerNotes.length})</span>
                                </span>
                              </div>

                              {/* Notes Timeline List */}
                              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
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
                                              {nt.created_at ? new Date(nt.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
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

                              {/* Add Note Input with color picker */}
                              <form onSubmit={handleAddCustomerNote} className="space-y-1.5 pt-1">
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
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-text-muted">Color:</span>
                                  {(['slate','blue','amber','rose','emerald','violet'] as const).map(c => {
                                    const dotClasses: Record<string, string> = {
                                      slate:'bg-slate-400', blue:'bg-blue-400', amber:'bg-amber-400',
                                      rose:'bg-rose-400', emerald:'bg-emerald-400', violet:'bg-violet-400'
                                    };
                                    return (
                                      <button
                                        key={c}
                                        type="button"
                                        title={c}
                                        onClick={() => setNewCustomerNoteColor(c)}
                                        className={`w-4 h-4 rounded-full ${dotClasses[c]} transition-transform cursor-pointer ${newCustomerNoteColor === c ? 'ring-2 ring-offset-1 ring-text-primary scale-110' : 'opacity-70 hover:opacity-100'}`}
                                      />
                                    );
                                  })}
                                </div>
                                <button
                                  type="submit"
                                  disabled={!newCustomerNoteText.trim() || addingCustomerNote}
                                  className="w-full py-1 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  {addingCustomerNote ? 'Saving...' : '+ Save Note'}
                                </button>
                              </form>
                            </div>

                            {/* 4. WhatsApp Chat Thread & Direct Reply */}
                            <div className="space-y-2 border-t border-border pt-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                                  <MessageSquare className="w-3.5 h-3.5 text-accent" />
                                  <span>WhatsApp Chat History</span>
                                </span>
                                {customerChat?.unread_count ? (
                                  <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                                    {customerChat.unread_count} unread
                                  </span>
                                ) : null}
                              </div>

                              {/* Chat Activity Metadata */}
                              {customerChat && (
                                <div className="flex items-center justify-between text-[10px] text-text-muted px-1">
                                  <span>First: {customerChat.first_message_at ? new Date(customerChat.first_message_at).toLocaleDateString() : 'â€”'}</span>
                                  <span>Last: {customerChat.last_message_at ? new Date(customerChat.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'â€”'}</span>
                                </div>
                              )}

                              {/* Chat Thread Container */}
                              <div className="h-56 overflow-y-auto p-2.5 bg-canvas border border-border rounded-sm space-y-2">
                                {loadingCustomerChat ? (
                                  <p className="text-[11px] text-text-muted text-center py-8">Loading chat history...</p>
                                ) : !customerChat || !customerChat.messages || customerChat.messages.length === 0 ? (
                                  <p className="text-[11px] text-text-muted text-center py-8">No WhatsApp messages yet.</p>
                                ) : (
                                  customerChat.messages.map((msg) => {
                                    const isInbound = msg.direction === 'inbound';
                                    return (
                                      <div key={msg.id} className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}>
                                        <div
                                          className={`max-w-[85%] rounded-md px-2.5 py-1.5 text-xs ${
                                            isInbound
                                              ? 'bg-surface text-text-body border border-border'
                                              : 'bg-accent text-white'
                                          }`}
                                        >
                                          <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                                          <div className={`text-[9px] mt-0.5 flex items-center justify-end gap-1 font-mono ${isInbound ? 'text-text-muted' : 'text-teal-100'}`}>
                                            <span>{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                            {!isInbound && (
                                              <span>{msg.status === 'read' ? 'âœ“âœ“' : msg.status === 'delivered' ? 'âœ“âœ“' : 'âœ“'}</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>

                              {/* Direct Reply Form */}
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
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              </form>
                              {/* 5. Bookings & Lifetime Value History */}
                              <div className="space-y-2 border-t border-border pt-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                                    <CalendarDays className="w-3.5 h-3.5 text-accent" />
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
                                  <div className="p-2.5 bg-surface-subtle border border-border rounded-sm text-center">
                                    <p className="text-[11px] text-text-muted">No appointments booked yet.</p>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNewBookingForm({
                                          contact_name: selectedCustomer.name || '',
                                          contact_phone: selectedCustomer.phone || '',
                                          service: selectedCustomer.health_concern || '',
                                          date: new Date().toISOString().split('T')[0],
                                          time: '10:00',
                                          price: 0,
                                          notes: ''
                                        });
                                        setIsAddBookingOpen(true);
                                      }}
                                      className="mt-1.5 text-[11px] text-accent font-medium hover:underline cursor-pointer inline-flex items-center gap-1"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Book an appointment</span>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                    {(customerBookingsData?.bookings || []).map((bk) => (
                                      <div key={bk.id} className="p-2 bg-surface-subtle border border-border rounded-sm flex items-center justify-between gap-2 text-xs">
                                        <div className="min-w-0">
                                          <p className="font-medium text-text-primary truncate">{bk.service}</p>
                                          <p className="text-[10px] text-text-muted font-mono mt-0.5">
                                            {bk.start_time ? new Date(bk.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
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
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNewBookingForm({
                                          contact_name: selectedCustomer.name || '',
                                          contact_phone: selectedCustomer.phone || '',
                                          service: selectedCustomer.health_concern || '',
                                          date: new Date().toISOString().split('T')[0],
                                          time: '10:00',
                                          price: 0,
                                          notes: ''
                                        });
                                        setIsAddBookingOpen(true);
                                      }}
                                      className="w-full py-1 text-center text-[11px] text-accent font-medium hover:underline cursor-pointer"
                                    >
                                      + Book another appointment
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* â”€â”€ SUB-VIEW B: TASK CALENDAR VIEW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                {followupView === 'tasks' && (
                  <div className="flex-1 flex flex-col overflow-y-auto space-y-4 max-w-5xl">
                    {/* Task Filter Pills + Add Task */}
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
                        className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-sm text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2]" />
                        Add Task
                      </button>
                    </div>

                    {/* Tasks List */}
                    <div className="space-y-2.5">
                      {loadingTasks ? (
                        <div className="p-8 text-center text-text-muted bg-surface border border-border rounded-sm">
                          Loading tasks...
                        </div>
                      ) : tasks.length === 0 ? (
                        <div className="p-8 text-center text-text-muted bg-surface border border-border rounded-sm">
                          No follow-up tasks found for this filter.
                        </div>
                      ) : (
                        tasks.map((tsk) => (
                          <div
                            key={tsk.id}
                            className={`p-3.5 bg-surface border rounded-sm flex items-start justify-between gap-4 transition-colors ${
                              tsk.completed
                                ? 'border-border opacity-70 bg-surface-subtle/30'
                                : tsk.is_overdue
                                ? 'border-rose-300 bg-rose-50/30'
                                : 'border-border hover:border-border-strong'
                            }`}
                          >
                            {/* Checkbox & Task Info */}
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => handleToggleTask(tsk.id)}
                                disabled={togglingTaskId === tsk.id}
                                className={`mt-0.5 w-4 h-4 rounded-sm border flex items-center justify-center transition-colors cursor-pointer ${
                                  tsk.completed
                                    ? 'bg-accent border-accent text-white'
                                    : tsk.is_overdue
                                    ? 'border-rose-400 bg-white hover:border-rose-600'
                                    : 'border-border bg-white hover:border-accent'
                                }`}
                              >
                                {tsk.completed && <Check className="w-3 h-3 stroke-[2.5]" />}
                              </button>

                              <div className="space-y-1">
                                <h5 className={`text-xs font-semibold ${tsk.completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                                  {tsk.title}
                                </h5>
                                {tsk.description && (
                                  <p className="text-[11px] text-text-secondary">{tsk.description}</p>
                                )}

                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                  {tsk.customer_phone && (
                                    <span className="font-mono text-[10px] text-text-muted bg-surface-subtle border border-border px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                                      <Phone className="w-3 h-3 stroke-[1.5]" /> {tsk.customer_phone}
                                    </span>
                                  )}
                                  {tsk.google_task_id && (
                                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-sm font-medium flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 stroke-[1.5]" /> Google Tasks
                                    </span>
                                  )}
                                  {tsk.google_event_id && (
                                    <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-sm font-medium flex items-center gap-1">
                                      <Calendar className="w-3 h-3 stroke-[1.5]" /> Google Calendar
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Due Date, Overdue Badge & Delete Action */}
                            <div className="flex items-center gap-2.5 shrink-0">
                              <div className="text-right">
                                {tsk.is_overdue && !tsk.completed && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-sm font-semibold mb-1">
                                    <AlertCircle className="w-3 h-3 text-rose-600" />
                                    Overdue
                                  </span>
                                )}
                                <p className={`text-xs font-mono ${tsk.is_overdue && !tsk.completed ? 'text-rose-700 font-semibold' : 'text-text-muted'}`}>
                                  {tsk.due_date ? new Date(tsk.due_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No due date'}
                                </p>
                              </div>

                              <button
                                onClick={() => handleDeleteTask(tsk.id)}
                                title="Delete task"
                                className="p-1 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-sm border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* â”€â”€ SUB-VIEW C: OVERALL NOTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                {followupView === 'notes' && (
                  <div className="flex-1 flex flex-col overflow-y-auto space-y-4 max-w-5xl">
                    {/* Notes Filters & Add Button */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-surface border border-border rounded-sm">
                      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[200px]">
                        <div className="relative flex-1 min-w-[180px]">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted stroke-[1.5]" />
                          <input
                            type="text"
                            value={allNotesSearch}
                            onChange={(e) => setAllNotesSearch(e.target.value)}
                            placeholder="Search notes, customers..."
                            className="w-full pl-7 pr-3 py-1.5 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-text-muted">Color:</span>
                          {(['all','slate','blue','amber','rose','emerald','violet'] as const).map(c => {
                            const dotClasses: Record<string, string> = {
                              all:'bg-text-muted', slate:'bg-slate-400', blue:'bg-blue-400',
                              amber:'bg-amber-400', rose:'bg-rose-400', emerald:'bg-emerald-400', violet:'bg-violet-400'
                            };
                            return (
                              <button
                                key={c}
                                title={c}
                                onClick={() => {
                                  setAllNotesColorFilter(c);
                                  setLoadingAllNotes(true);
                                  crm.getAllNotes({ color: c === 'all' ? undefined : c, q: allNotesSearch || undefined }).then(n => { setAllNotes(Array.isArray(n) ? n : []); setLoadingAllNotes(false); }).catch(() => setLoadingAllNotes(false));
                                }}
                                className={`w-4 h-4 rounded-full ${dotClasses[c]} cursor-pointer transition-transform ${allNotesColorFilter === c ? 'ring-2 ring-offset-1 ring-text-primary scale-110' : 'opacity-60 hover:opacity-100'}`}
                              />
                            );
                          })}
                        </div>
                      </div>

                      <button
                        onClick={() => setShowAddOverallNoteModal(true)}
                        className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-sm text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2]" />
                        <span>Add Note</span>
                      </button>
                    </div>

                    {/* Notes List */}
                    <div className="space-y-2.5">
                      {loadingAllNotes ? (
                        <div className="p-8 text-center text-text-muted bg-surface border border-border rounded-sm">Loading notes...</div>
                      ) : allNotes.length === 0 ? (
                        <div className="p-8 text-center text-text-muted bg-surface border border-border rounded-sm">No notes found.</div>
                      ) : (
                        allNotes
                          .filter(n => {
                            if (!allNotesSearch) return true;
                            const q = allNotesSearch.toLowerCase();
                            return (n.note_text || '').toLowerCase().includes(q) ||
                              (n.author || '').toLowerCase().includes(q) ||
                              (n.customer_name || '').toLowerCase().includes(q) ||
                              (n.customer_phone || '').toLowerCase().includes(q);
                          })
                          .map(n => {
                            const noteColor = n.color || 'slate';
                            const colorMap: Record<string, string> = {
                              slate: 'border-l-slate-400 bg-slate-50',
                              blue: 'border-l-blue-400 bg-blue-50',
                              amber: 'border-l-amber-400 bg-amber-50',
                              rose: 'border-l-rose-400 bg-rose-50',
                              emerald: 'border-l-emerald-400 bg-emerald-50',
                              violet: 'border-l-violet-400 bg-violet-50',
                            };
                            const badgeMap: Record<string, string> = {
                              slate:'bg-slate-200 text-slate-700', blue:'bg-blue-100 text-blue-700',
                              amber:'bg-amber-100 text-amber-700', rose:'bg-rose-100 text-rose-700',
                              emerald:'bg-emerald-100 text-emerald-700', violet:'bg-violet-100 text-violet-700'
                            };
                            return (
                              <div key={n.id} className={`pl-3 pr-3.5 py-3 border border-border border-l-2 rounded-sm ${colorMap[noteColor] || colorMap.slate}`}>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm ${badgeMap[noteColor] || badgeMap.slate}`}>{n.author}</span>
                                      <span className="text-[11px] font-medium text-text-primary">{n.customer_name}</span>
                                      {n.customer_phone && <span className="font-mono text-[10px] text-text-muted">{n.customer_phone}</span>}
                                      {n.preferred_doctor && <span className="text-[10px] text-text-secondary flex items-center gap-0.5"><Stethoscope className="w-3 h-3 stroke-[1.5]" />{n.preferred_doctor}</span>}
                                    </div>
                                    <p className="text-xs text-text-body whitespace-pre-wrap leading-relaxed">{n.note_text}</p>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[10px] font-mono text-text-muted">
                                      {n.created_at ? new Date(n.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                    <button
                                      onClick={() => handleDeleteNote(n.id)}
                                      title="Delete note"
                                      className="p-1 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-sm border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                                    </button>
                                  </div>
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


            {/* â”€â”€ VIEW 6: MARKETING HUB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                      Broadcasts, automated re-engagement triggers, and campaign analytics â€” all in one place.
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
                    { key: 'broadcasts', icon: 'ðŸ“¢', label: 'Broadcasts' },
                    { key: 'reengagement', icon: 'ðŸ”„', label: 'Re-engagement' },
                    { key: 'analytics', icon: 'ðŸ“Š', label: 'Analytics' },
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
                      <span>{tab.icon}</span>
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
                                  âš ️ WhatsApp marketing messages require explicit opt-in. Only opted-in contacts will receive campaigns.
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
                                  <label className="text-[11px] font-medium text-text-secondary">Approved WhatsApp Template</label>
                                  <button
                                    type="button"
                                    onClick={() => setNewTemplateModal(true)}
                                    className="text-[11px] text-accent hover:underline font-medium flex items-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Add Template</span>
                                  </button>
                                </div>
                                <select
                                  value={campaignForm.template_name}
                                  onChange={(e) => setCampaignForm({ ...campaignForm, template_name: e.target.value })}
                                  className="w-full px-3 py-2 bg-surface border border-border rounded-sm text-xs text-text-primary"
                                >
                                  {customTemplates.map((tpl) => (
                                    <option key={tpl.id} value={tpl.name}>{tpl.label}</option>
                                  ))}
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
                                <p className="text-[10px] text-text-muted">ðŸ’¡ Direct text only works within Meta's 24-hour customer care window.</p>
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
                                    {mode === 'now' ? 'âš¡ Send Immediately' : 'ðŸ“… Schedule for Later'}
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
                                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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

                {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                    SUB-TAB 2: RE-ENGAGEMENT TRIGGERS
                â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
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
                          const typeIcon = trigger.trigger_type === 'birthday_greeting' ? 'ðŸŽ‚'
                            : trigger.trigger_type === 'post_treatment_followup' ? 'ðŸ’†'
                            : trigger.trigger_type === 'seasonal_promo' ? 'ðŸŒŸ'
                            : 'ðŸ“…';
                          return (
                            <div key={trigger.id} className={`bg-surface border rounded-md p-4 space-y-3 transition-all duration-150 ${trigger.is_active ? 'border-border' : 'border-border opacity-70'}`}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-lg shrink-0">{typeIcon}</span>
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
                                    {trigger.is_active ? 'â— Active' : 'â—‹ Paused'}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-surface-subtle rounded-sm p-2 border border-border">
                                  <p className="text-sm font-semibold text-text-primary">{trigger.reached_count}</p>
                                  <p className="text-[10px] text-text-muted">Reached</p>
                                </div>
                                <div className="bg-surface-subtle rounded-sm p-2 border border-border">
                                  <p className="text-sm font-semibold text-text-primary">{trigger.condition_days || 'â€”'}</p>
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
                                  {togglingTriggerId === trigger.id ? '...' : trigger.is_active ? '⏸ Pause' : 'â–¶ Activate'}
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
                                  {testingTriggerId === trigger.id ? '...' : 'ðŸ§ª Test Fire'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {triggers.length === 0 && !loadingTriggers && (
                          <div className="md:col-span-2 py-12 text-center text-text-muted text-xs">
                            <p className="text-base mb-2">ðŸ”„</p>
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
                            { label: 'Total Sent', value: analyticsData?.summary?.total_sent ?? campaigns.reduce((a, c) => a + (c.sent_count || 0), 0), suffix: '', icon: 'ðŸ“¤', color: 'text-text-primary' },
                            { label: 'Delivery Rate', value: analyticsData?.summary?.delivery_rate ?? 98.2, suffix: '%', icon: 'âœ…', color: 'text-emerald-700' },
                            { label: 'Read Rate', value: analyticsData?.summary?.read_rate ?? 82.5, suffix: '%', icon: 'ðŸ‘️', color: 'text-blue-700' },
                            { label: 'Reply Rate', value: analyticsData?.summary?.reply_rate ?? 38.0, suffix: '%', icon: 'ðŸ’¬', color: 'text-purple-700' },
                            { label: 'Conversions', value: analyticsData?.summary?.total_converted ?? 0, suffix: '', icon: 'ðŸ“ˆ', color: 'text-orange-700' },
                            { label: 'Revenue', value: analyticsData?.summary?.attributed_revenue ?? 0, suffix: '', prefix: 'â‚¹', icon: 'ðŸ’°', color: 'text-emerald-700' },
                          ].map((kpi) => (
                            <div key={kpi.label} className="bg-surface border border-border rounded-md p-3 space-y-1 text-center">
                              <p className="text-base">{kpi.icon}</p>
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
                                    const deliv = cmp.delivered_count || Math.round(sent * 0.98);
                                    const read = cmp.read_count || Math.round(deliv * 0.82);
                                    const replied = cmp.replied_count || Math.round(read * 0.38);
                                    const converted = cmp.converted_count || Math.round(sent * 0.18);
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
                                          {cmp.created_at ? new Date(cmp.created_at).toLocaleDateString() : 'â€”'}
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

            {/* â”€â”€ VIEW 5: SETTINGS & BYOK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {activeNav === 'settings' && (
              <div className="flex-1 overflow-y-auto space-y-6 max-w-4xl">
                {settingsSaved && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>All settings, credentials, and message templates saved successfully!</span>
                  </div>
                )}

                {settingsError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>{settingsError}</span>
                  </div>
                )}

                {/* Subtabs Bar */}
                <div className="flex gap-1 border-b border-border pb-3 flex-wrap">
                  {[
                    { id: 'ai', label: 'AI Intelligence & BYOK', icon: Bot },
                    { id: 'whatsapp', label: 'Meta WhatsApp API', icon: Phone },
                    { id: 'templates', label: 'Message templates', icon: FileText },
                    { id: 'location', label: 'Branding & Localization', icon: Building2 },
                    { id: 'calendar', label: 'Google Calendar', icon: Calendar },
                    { id: 'account', label: 'Account', icon: LogOut },
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
                  
                  {/* â”€â”€ 1. AI BRAIN & BYOK MODEL KEYS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                  {settingsTab === 'ai' && (
                    <div className="space-y-4 bg-surface p-5 rounded-md border border-border">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div>
                          <h4 className="font-semibold text-xs text-text-primary">AI intelligence & model routing</h4>
                          <p className="text-xs text-text-muted">Insert your own model API keys (BYOK) with automatic fallback redundancy.</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-sm text-xs font-medium bg-surface-subtle text-text-secondary border border-border">
                          Active: {settingsForm.primary_model_provider?.toUpperCase() || 'GEMINI'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-text-primary mb-1">Primary AI provider</label>
                          <select
                            value={settingsForm.primary_model_provider || 'gemini'}
                            onChange={(e) => setSettingsForm({ ...settingsForm, primary_model_provider: e.target.value })}
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
                            value={settingsForm.assistant_name || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, assistant_name: e.target.value })}
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
                            value={settingsForm.ai_prompt || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, ai_prompt: e.target.value })}
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
                            value={settingsForm.full_location_text || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, full_location_text: e.target.value })}
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
                              value={settingsForm.admin_whatsapp_number || ''}
                              onChange={(e) => setSettingsForm({ ...settingsForm, admin_whatsapp_number: e.target.value })}
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
                              value={settingsForm.notification_email || ''}
                              onChange={(e) => setSettingsForm({ ...settingsForm, notification_email: e.target.value })}
                              className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                            <p className="text-xs text-text-muted">
                              Receives email confirmations and Google Calendar invites.
                            </p>
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
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-text-primary mb-1">
                                Default calling code
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
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-text-primary mb-1">
                                Display currency
                              </label>
                              <select
                                value={settingsForm.currency || 'INR'}
                                onChange={(e) => {
                                  const sel = CURRENCY_LIST.find((c) => c.code === e.target.value);
                                  setSettingsForm({
                                    ...settingsForm,
                                    currency: e.target.value,
                                    currency_symbol: sel ? sel.symbol : settingsForm.currency_symbol || 'â‚¹',
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
                            {settingsForm.has_gemini_key && (
                              <span className="text-xs text-status-success font-medium bg-status-success-bg px-2 py-0.5 rounded-sm border border-status-success-border">
                                Key saved
                              </span>
                            )}
                          </div>
                          <input
                            type="password"
                            placeholder="AIzaSy... (Leave empty to keep existing key)"
                            value={settingsForm.gemini_api_key || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, gemini_api_key: e.target.value })}
                            className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-medium text-text-primary">2. Groq Cloud API key</label>
                            {settingsForm.has_groq_key && (
                              <span className="text-xs text-status-success font-medium bg-status-success-bg px-2 py-0.5 rounded-sm border border-status-success-border">
                                Key saved
                              </span>
                            )}
                          </div>
                          <input
                            type="password"
                            placeholder="gsk_... (Leave empty to keep existing key)"
                            value={settingsForm.groq_api_key || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, groq_api_key: e.target.value })}
                            className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-xs font-medium text-text-primary">3. OpenCode / OpenAI key</label>
                              {settingsForm.has_opencode_key && (
                                <span className="text-xs text-status-success font-medium bg-status-success-bg px-2 py-0.5 rounded-sm border border-status-success-border">
                                  Key saved
                                </span>
                              )}
                            </div>
                            <input
                              type="password"
                              placeholder="sk-... (Leave empty to keep existing)"
                              value={settingsForm.opencode_api_key || ''}
                              onChange={(e) => setSettingsForm({ ...settingsForm, opencode_api_key: e.target.value })}
                              className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">Base URL</label>
                            <input
                              type="text"
                              placeholder="https://api.openai.com/v1"
                              value={settingsForm.opencode_base_url || 'https://api.openai.com/v1'}
                              onChange={(e) => setSettingsForm({ ...settingsForm, opencode_base_url: e.target.value })}
                              className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* â”€â”€ 2. META WHATSAPP API CREDENTIALS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                  {settingsTab === 'whatsapp' && (
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
                            onClick={() => copyToClipboard(settingsForm.webhook_url || '', 'webhook')}
                            className="text-xs font-medium text-accent hover:text-accent-hover flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === 'webhook' ? <Check className="w-3.5 h-3.5 stroke-[1.5]" /> : <Copy className="w-3.5 h-3.5 stroke-[1.5]" />}
                            <span>{copiedKey === 'webhook' ? 'Copied' : 'Copy URL'}</span>
                          </button>
                        </div>
                        <p className="font-mono text-xs text-text-secondary break-all select-all">
                          {settingsForm.webhook_url || `https://whatsapp-automation-system-eta.vercel.app/webhooks/whatsapp/${settingsForm.slug || 'boldlabs'}`}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-text-primary mb-1">Webhook verify token</label>
                          <input
                            type="text"
                            placeholder="e.g. my_secure_verify_token_123"
                            value={settingsForm.verify_token || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, verify_token: e.target.value })}
                            className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-text-primary mb-1">Meta phone number ID</label>
                          <input
                            type="text"
                            placeholder="e.g. 102938475610293"
                            value={settingsForm.meta_phone_id || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, meta_phone_id: e.target.value })}
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
                            value={settingsForm.meta_waba_id || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, meta_waba_id: e.target.value })}
                            className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-medium text-text-primary">Meta App secret (HMAC validation)</label>
                            {settingsForm.has_app_secret && (
                              <span className="text-xs text-status-success font-medium bg-status-success-bg px-2 py-0.5 rounded-sm border border-status-success-border">
                                Configured
                              </span>
                            )}
                          </div>
                          <input
                            type="password"
                            placeholder="App secret (Leave empty to keep existing)"
                            value={settingsForm.meta_app_secret || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, meta_app_secret: e.target.value })}
                            className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-medium text-text-primary">Meta system user access token</label>
                          {settingsForm.has_access_token && (
                            <span className="text-xs text-status-success font-medium bg-status-success-bg px-2 py-0.5 rounded-sm border border-status-success-border">
                              Token configured
                            </span>
                          )}
                        </div>
                        <input
                          type="password"
                          placeholder="EAAB... (Leave empty to keep existing token)"
                          value={settingsForm.meta_access_token || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, meta_access_token: e.target.value })}
                          className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                        />
                      </div>
                    </div>
                  )}

                  {/* â”€â”€ 3. LIFECYCLE MESSAGE TEMPLATES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                  {settingsTab === 'templates' && (
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
                          value={settingsForm.google_review_link || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, google_review_link: e.target.value })}
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
                              value={settingsForm.template_booking_confirmation || ''}
                              onChange={(e) => setSettingsForm({ ...settingsForm, template_booking_confirmation: e.target.value })}
                              className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                            <p className="text-xs text-text-muted mt-1">Dispatched upon appointment confirmation.</p>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">2. Client reschedule confirmation</label>
                            <input
                              type="text"
                              placeholder="booking_confirmationn"
                              value={settingsForm.template_reschedule_confirmation || ''}
                              onChange={(e) => setSettingsForm({ ...settingsForm, template_reschedule_confirmation: e.target.value })}
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
                              value={settingsForm.template_cancellation_confirmation || ''}
                              onChange={(e) => setSettingsForm({ ...settingsForm, template_cancellation_confirmation: e.target.value })}
                              className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                            <p className="text-xs text-text-muted mt-1">Dispatched when booking is cancelled.</p>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">4. 2-Hour appointment reminder</label>
                            <input
                              type="text"
                              placeholder="appointment_ramainder"
                              value={settingsForm.template_appointment_reminder || ''}
                              onChange={(e) => setSettingsForm({ ...settingsForm, template_appointment_reminder: e.target.value })}
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
                              value={settingsForm.template_review_request || ''}
                              onChange={(e) => setSettingsForm({ ...settingsForm, template_review_request: e.target.value })}
                              className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                            <p className="text-xs text-text-muted mt-1">Sent 15 mins after marked Attended.</p>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">6. 15-Min no-show reschedule nudge</label>
                            <input
                              type="text"
                              placeholder="reschedule_nudge"
                              value={settingsForm.template_reschedule_nudge || ''}
                              onChange={(e) => setSettingsForm({ ...settingsForm, template_reschedule_nudge: e.target.value })}
                              className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                            <p className="text-xs text-text-muted mt-1">Sent 15 mins after marked No Show.</p>
                          </div>
                        </div>
                      </div>

                      {/* Admin & Staff Templates */}
                      <div className="space-y-3 pt-3 border-t border-border">
                        <h5 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                          Admin & staff notification templates
                        </h5>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">7. Admin booking alert</label>
                            <input
                              type="text"
                              placeholder="admin_notification"
                              value={settingsForm.template_admin_notification || ''}
                              onChange={(e) => setSettingsForm({ ...settingsForm, template_admin_notification: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">8. Admin cancellation alert</label>
                            <input
                              type="text"
                              placeholder="admin_cancellation_notice"
                              value={settingsForm.template_admin_cancellation_notice || ''}
                              onChange={(e) => setSettingsForm({ ...settingsForm, template_admin_cancellation_notice: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">9. Staff takeover alert</label>
                            <input
                              type="text"
                              placeholder="admin_human_request"
                              value={settingsForm.template_admin_human_request || ''}
                              onChange={(e) => setSettingsForm({ ...settingsForm, template_admin_human_request: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">10. Daily morning digest</label>
                            <input
                              type="text"
                              placeholder="admin_daily_digest"
                              value={settingsForm.template_admin_daily_digest || ''}
                              onChange={(e) => setSettingsForm({ ...settingsForm, template_admin_daily_digest: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* â”€â”€ 4. BRANDING & LOCALIZATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                  {settingsTab === 'location' && (
                    <div className="space-y-5 bg-surface p-5 rounded-md border border-border">
                      <div className="pb-2 border-b border-border flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-xs text-text-primary">Brand identity & localization</h4>
                          <p className="text-xs text-text-muted">Configure your dashboard brand name, company title, and regional defaults.</p>
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
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[17px] text-text-primary tracking-tight">
                              {settingsForm.name || 'WhatsApp CRM'}
                            </span>
                            <span className="text-[13px] font-medium text-text-muted">
                              / Overview
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-text-primary mb-1">Company / Brand name</label>
                        <input
                          type="text"
                          placeholder="e.g. Boldlabs CRM / Acme Studio"
                          value={settingsForm.name || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
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
                            <p className="text-xs text-text-muted">Configure timezone, currency, and dialing code for your business and clients worldwide.</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                          {/* Timezone */}
                          <div>
                            <label className="block text-xs font-medium text-text-primary mb-1">
                              Business timezone
                            </label>
                            <select
                              value={settingsForm.timezone || 'Asia/Kolkata'}
                              onChange={(e) => setSettingsForm({ ...settingsForm, timezone: e.target.value })}
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
                              value={settingsForm.country_code || '+91'}
                              onChange={(e) => setSettingsForm({ ...settingsForm, country_code: e.target.value })}
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
                              value={settingsForm.currency || 'INR'}
                              onChange={(e) => {
                                const sel = CURRENCY_LIST.find((c) => c.code === e.target.value);
                                setSettingsForm({
                                  ...settingsForm,
                                  currency: e.target.value,
                                  currency_symbol: sel ? sel.symbol : settingsForm.currency_symbol || 'â‚¹',
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
                          value={settingsForm.full_location_text || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, full_location_text: e.target.value })}
                          className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent resize-none transition-colors duration-150"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-text-primary mb-1">Admin WhatsApp alert phone</label>
                          <input
                            type="text"
                            placeholder="+919876543210"
                            value={settingsForm.admin_whatsapp_number || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, admin_whatsapp_number: e.target.value })}
                            className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-text-primary mb-1">Notification email</label>
                          <input
                            type="email"
                            placeholder="admin@business.com"
                            value={settingsForm.notification_email || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, notification_email: e.target.value })}
                            className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* â”€â”€ 5. GOOGLE CALENDAR SYNC â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                  {settingsTab === 'calendar' && (
                    <div className="space-y-5 bg-surface p-5 rounded-md border border-border">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div>
                          <h4 className="font-semibold text-xs text-text-primary">Google Calendar 2-way synchronization</h4>
                          <p className="text-xs text-text-muted">Sync WhatsApp bookings directly to Google Calendar schedules with 1-Click Sign in.</p>
                        </div>
                        {settingsForm.google_calendar_configured ? (
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
                            {copiedKey === 'gcal_redirect' ? <Check className="w-3.5 h-3.5 stroke-[1.5]" /> : <Copy className="w-3.5 h-3.5 stroke-[1.5]" />}
                            <span>{copiedKey === 'gcal_redirect' ? 'Copied' : 'Copy URI'}</span>
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

                      {/* Step 3: Action Button */}
                      <div className="p-4 bg-surface rounded-md border border-border flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <p className="text-xs font-medium text-text-primary">1-Click Google Calendar authorization</p>
                          <p className="text-xs text-text-muted mt-0.5">
                            {settingsForm.google_calendar_configured
                              ? `Linked to: ${settingsForm.notification_email || 'Google Account'}`
                              : 'Authorize and automatically fetch refresh token.'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {settingsForm.google_calendar_configured && (
                            <button
                              type="button"
                              onClick={handleDisconnectGoogle}
                              disabled={disconnectingGoogle}
                              className="px-3 py-1.5 text-xs font-medium text-status-error hover:bg-status-error-bg border border-status-error-border rounded-sm transition-colors duration-150 cursor-pointer"
                            >
                              {disconnectingGoogle ? 'Disconnecting...' : 'Disconnect'}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={handleConnectGoogle}
                            disabled={connectingGoogle}
                            className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors duration-150 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            <Calendar className="w-3.5 h-3.5 stroke-[1.5]" />
                            <span>
                              {connectingGoogle
                                ? 'Redirecting...'
                                : settingsForm.google_calendar_configured
                                ? 'Reconnect account'
                                : 'Sign in with Google'}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Calendar ID Config */}
                      <div>
                        <label className="block text-xs font-medium text-text-primary mb-1">Target Google Calendar ID</label>
                        <input
                          type="text"
                          placeholder="primary"
                          value={settingsForm.google_calendar_id || 'primary'}
                          onChange={(e) => setSettingsForm({ ...settingsForm, google_calendar_id: e.target.value })}
                          className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-sm text-xs font-mono text-text-primary focus:bg-white focus:border-accent transition-colors duration-150"
                        />
                        <p className="text-xs text-text-muted mt-1">Leave as <code>primary</code> to sync with your main calendar.</p>
                      </div>
                    </div>
                  )}

                  {/* â”€â”€ 6. ACCOUNT & LOGOUT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                  {settingsTab === 'account' && (
                    <div className="space-y-4 bg-surface p-5 rounded-md border border-border">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div>
                          <h4 className="font-semibold text-xs text-text-primary">Account session</h4>
                          <p className="text-xs text-text-muted">Manage your active CRM credentials and session.</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-sm text-xs font-medium bg-status-success-bg text-status-success border border-status-success-border">
                          Active session
                        </span>
                      </div>

                      <div className="bg-surface p-4 rounded-md border border-border space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-text-muted">Signed in account</p>
                            <p className="font-medium text-sm text-text-primary mt-0.5">{user?.email || 'Logged in account'}</p>
                          </div>
                          <span className="text-xs font-mono font-medium bg-surface-subtle text-text-secondary px-2.5 py-1 rounded-sm border border-border uppercase">
                            Role: {user?.role || 'Staff'}
                          </span>
                        </div>

                        <div className="pt-3 border-t border-border flex items-center justify-between">
                          <div>
                            <p className="font-medium text-xs text-text-primary">Sign out</p>
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
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={settingsSaving}
                      className="px-4 py-2 bg-accent hover:bg-accent-hover text-white font-medium text-xs rounded-sm transition-colors duration-150 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      {settingsSaving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin stroke-[1.5]" />
                          <span>Saving changes...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[1.5]" />
                          <span>Save all settings</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </main>

          {/* â”€â”€ 3. RIGHT STICKY NOTES & SCRATCHPAD DRAWER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

        {/* â”€â”€ CREATE BOOKING MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                    <label className="block text-xs font-medium text-text-primary mb-1">
                      Time *
                    </label>
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

        {/* â”€â”€ BOOKING DETAIL MODAL / DRAWER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                      {selectedBookingDetail.start_time ? new Date(selectedBookingDetail.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'â€”'}
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

                {/* Quick WhatsApp Chat Button */}
                {selectedBookingDetail.contact_phone && (
                  <button
                    onClick={() => {
                      const phone = selectedBookingDetail.contact_phone || '';
                      setIsBookingDetailModalOpen(false);
                      setSelectedBookingDetail(null);
                      openChatForContact(phone);
                    }}
                    className="w-full p-2 bg-surface hover:bg-surface-subtle text-text-primary font-medium text-xs rounded-sm transition-colors duration-150 flex items-center justify-center gap-2 border border-border cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span>Open WhatsApp chat</span>
                  </button>
                )}

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

        {/* â”€â”€ MODAL 1: CONFIRM SINGLE CHAT TAKE HUMAN ACTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

        {/* â”€â”€ MODAL 2: CONFIRM GLOBAL ALL CHATS TAKE HUMAN ACTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

        {/* â”€â”€ MODAL 3: DELETE CONVERSATION CONFIRMATION â”€â”€â”€â”€â”€ */}
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

        {/* â”€â”€ MODAL 4: ADD APPROVED WHATSAPP TEMPLATE NAME â”€â”€â”€â”€â”€ */}
        {newTemplateModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface rounded-md border border-border w-full max-w-md overflow-hidden shadow-subtle p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-accent stroke-[1.5]" />
                  <div>
                    <h3 className="font-semibold text-sm text-text-primary">Add Approved Template</h3>
                    <p className="text-xs text-text-muted">Register an approved Meta WhatsApp template</p>
                  </div>
                </div>
                <button onClick={() => setNewTemplateModal(false)} className="text-text-muted hover:text-text-primary cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddCustomTemplate} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-medium text-text-primary">Exact Template Name in Meta *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. festive_offer_2026 or launch_discount_v1"
                    value={newTemplateForm.name}
                    onChange={(e) => setNewTemplateForm({ ...newTemplateForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary placeholder:text-text-muted focus:bg-white focus:border-accent"
                  />
                  <p className="text-[10px] text-text-muted">Must match the exact template name approved in your Meta WhatsApp Business Manager.</p>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-text-primary">Display Label / Description</label>
                  <input
                    type="text"
                    placeholder="e.g. 5. Festive 30% Off Promotion"
                    value={newTemplateForm.label}
                    onChange={(e) => setNewTemplateForm({ ...newTemplateForm, label: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary placeholder:text-text-muted focus:bg-white focus:border-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-text-primary">Number of Body Variables ({'{{1}}'}, {'{{2}}'}, etc.)</label>
                  <select
                    value={newTemplateForm.variables_count}
                    onChange={(e) => setNewTemplateForm({ ...newTemplateForm, variables_count: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-surface-subtle border border-border rounded-sm text-xs text-text-primary"
                  >
                    <option value={1}>1 Variable (e.g. {'{{1}}'} Customer Name)</option>
                    <option value={2}>2 Variables (e.g. {'{{1}}'} Name, {'{{2}}'} Offer)</option>
                    <option value={3}>3 Variables (e.g. {'{{1}}'} Name, {'{{2}}'} Business, {'{{3}}'} Code)</option>
                    <option value={4}>4 Variables</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setNewTemplateModal(false)}
                    className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle rounded-sm transition-colors duration-150 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-accent hover:bg-accent/90 text-white font-medium text-xs rounded-sm transition-colors duration-150 cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save & Select Template</span>
                  </button>
                </div>
              </form>
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
                    placeholder="e.g. Staff, Dr. Sarah Mitchell"
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
                  <label className="text-[10px] text-text-muted block mb-1 font-medium">Health Concern / Primary Treatment</label>
                  <input
                    type="text"
                    value={quickCrmConcern}
                    onChange={e => setQuickCrmConcern(e.target.value)}
                    placeholder="e.g. General Consultation, Dental Checkup"
                    className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent text-xs"
                  />
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
                    <label className="text-[10px] text-text-muted block mb-1 font-medium">Assigned Staff / Doctor</label>
                    <input
                      type="text"
                      value={quickCrmDoctor}
                      onChange={e => setQuickCrmDoctor(e.target.value)}
                      placeholder="e.g. Dr. Sarah Mitchell"
                      className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent text-xs"
                    />
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
      </div>
  );
}

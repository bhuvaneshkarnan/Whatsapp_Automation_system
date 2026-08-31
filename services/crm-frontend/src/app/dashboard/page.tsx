'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  crm,
  Conversation,
  Message,
  Booking,
  Contact,
  TenantSettingsResponse,
  TenantSettingsUpdate,
} from '@/lib/api';
import {
  MessageSquare,
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
} from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+91', country: '🇮🇳 India (+91)' },
  { code: '+1', country: '🇺🇸 / 🇨🇦 United States & Canada (+1)' },
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
  { code: '+56', country: '🇨🇱 Chile (+56)' },
  { code: '+46', country: '🇸🇪 Sweden (+46)' },
  { code: '+47', country: '🇳🇴 Norway (+47)' },
  { code: '+45', country: '🇩🇰 Denmark (+45)' },
  { code: '+358', country: '🇫🇮 Finland (+358)' },
  { code: '+351', country: '🇵🇹 Portugal (+351)' },
  { code: '+43', country: '🇦🇹 Austria (+43)' },
  { code: '+32', country: '🇧🇪 Belgium (+32)' },
  { code: '+48', country: '🇵🇱 Poland (+48)' },
  { code: '+972', country: '🇮🇱 Israel (+972)' },
];

const CURRENCY_LIST = [
  { code: 'INR', symbol: '₹', name: 'INR (₹) — Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'USD ($) — US Dollar' },
  { code: 'EUR', symbol: '€', name: 'EUR (€) — Euro' },
  { code: 'GBP', symbol: '£', name: 'GBP (£) — British Pound' },
  { code: 'AED', symbol: 'AED ', name: 'AED (AED) — UAE Dirham' },
  { code: 'SAR', symbol: 'SAR ', name: 'SAR (SAR) — Saudi Riyal' },
  { code: 'CAD', symbol: 'C$', name: 'CAD (C$) — Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'AUD (A$) — Australian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'SGD (S$) — Singapore Dollar' },
  { code: 'MYR', symbol: 'RM ', name: 'MYR (RM) — Malaysian Ringgit' },
  { code: 'QAR', symbol: 'QAR ', name: 'QAR (QAR) — Qatari Riyal' },
  { code: 'KWD', symbol: 'KWD ', name: 'KWD (KWD) — Kuwaiti Dinar' },
  { code: 'OMR', symbol: 'OMR ', name: 'OMR (OMR) — Omani Rial' },
  { code: 'BHD', symbol: 'BHD ', name: 'BHD (BHD) — Bahraini Dinar' },
  { code: 'NZD', symbol: 'NZ$', name: 'NZD (NZ$) — New Zealand Dollar' },
  { code: 'JPY', symbol: '¥', name: 'JPY (¥) — Japanese Yen' },
  { code: 'CHF', symbol: 'CHF ', name: 'CHF (CHF) — Swiss Franc' },
  { code: 'ZAR', symbol: 'R ', name: 'ZAR (R) — South African Rand' },
  { code: 'PHP', symbol: '₱', name: 'PHP (₱) — Philippine Peso' },
  { code: 'IDR', symbol: 'Rp ', name: 'IDR (Rp) — Indonesian Rupiah' },
  { code: 'THB', symbol: '฿', name: 'THB (฿) — Thai Baht' },
  { code: 'VND', symbol: '₫', name: 'VND (₫) — Vietnamese Dong' },
  { code: 'PKR', symbol: 'Rs ', name: 'PKR (Rs) — Pakistani Rupee' },
  { code: 'BDT', symbol: '৳', name: 'BDT (৳) — Bangladeshi Taka' },
  { code: 'LKR', symbol: 'Rs ', name: 'LKR (Rs) — Sri Lankan Rupee' },
  { code: 'NGN', symbol: '₦', name: 'NGN (₦) — Nigerian Naira' },
  { code: 'KES', symbol: 'KSh ', name: 'KES (KSh) — Kenyan Shilling' },
  { code: 'EGP', symbol: 'E£ ', name: 'EGP (E£) — Egyptian Pound' },
  { code: 'TRY', symbol: '₺', name: 'TRY (₺) — Turkish Lira' },
  { code: 'BRL', symbol: 'R$', name: 'BRL (R$) — Brazilian Real' },
  { code: 'MXN', symbol: 'Mex$', name: 'MXN (Mex$) — Mexican Peso' },
];

const TIMEZONE_LIST = [
  { value: 'Asia/Kolkata', label: '🇮🇳 Asia/Kolkata (IST — GMT+5:30) [India]' },
  { value: 'America/New_York', label: '🇺🇸 America/New_York (EST/EDT — GMT-5/-4) [US East]' },
  { value: 'America/Chicago', label: '🇺🇸 America/Chicago (CST/CDT — GMT-6/-5) [US Central]' },
  { value: 'America/Denver', label: '🇺🇸 America/Denver (MST/MDT — GMT-7/-6) [US Mountain]' },
  { value: 'America/Los_Angeles', label: '🇺🇸 America/Los_Angeles (PST/PDT — GMT-8/-7) [US West / California]' },
  { value: 'America/Toronto', label: '🇨🇦 America/Toronto (EST/EDT) [Canada East]' },
  { value: 'America/Vancouver', label: '🇨🇦 America/Vancouver (PST/PDT) [Canada West]' },
  { value: 'Europe/London', label: '🇬🇧 Europe/London (GMT/BST — GMT+0/+1) [UK & Ireland]' },
  { value: 'Europe/Paris', label: '🇪🇺 Europe/Paris (CET/CEST — GMT+1/+2) [France, Germany, Italy]' },
  { value: 'Asia/Dubai', label: '🇦🇪 Asia/Dubai (GST — GMT+4) [UAE & Gulf]' },
  { value: 'Asia/Riyadh', label: '🇸🇦 Asia/Riyadh (AST — GMT+3) [Saudi Arabia]' },
  { value: 'Asia/Singapore', label: '🇸🇬 Asia/Singapore (SGT — GMT+8) [Singapore & Malaysia]' },
  { value: 'Asia/Tokyo', label: '🇯🇵 Asia/Tokyo (JST — GMT+9) [Japan]' },
  { value: 'Australia/Sydney', label: '🇦🇺 Australia/Sydney (AEST/AEDT — GMT+10/+11) [Australia East]' },
  { value: 'Australia/Perth', label: '🇦🇺 Australia/Perth (AWST — GMT+8) [Australia West]' },
  { value: 'Pacific/Auckland', label: '🇳🇿 Pacific/Auckland (NZST/NZDT — GMT+12/+13) [New Zealand]' },
  { value: 'Africa/Johannesburg', label: '🇿🇦 Africa/Johannesburg (SAST — GMT+2) [South Africa]' },
  { value: 'UTC', label: '🌐 UTC (Coordinated Universal Time)' },
];

export default function DashboardPage() {
  const router = useRouter();
  
  // Navigation: overview | inbox | bookings | calendar | customers | settings
  const [activeNav, setActiveNav] = useState<'overview' | 'inbox' | 'bookings' | 'calendar' | 'customers' | 'settings'>('overview');
  const [sidebarFilter, setSidebarFilter] = useState<'all' | 'recent' | 'favorites' | 'active'>('all');
  const [settingsTab, setSettingsTab] = useState<'ai' | 'whatsapp' | 'templates' | 'location' | 'calendar' | 'account'>('ai');

  // User state
  const [user, setUser] = useState<{ email: string; role: string; name?: string } | null>(null);

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
  const [bookingFilter, setBookingFilter] = useState<string>('all');
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
    currency_symbol: '₹',
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

  // Initial Auth & Load
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
    crm.getMe()
      .then((data) => {
        setUser(data);
        loadConversations();
        loadBookings();
        loadContacts();
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
    } else if (activeNav === 'settings') {
      loadSettings();
    }
  }, [activeNav]);

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

  async function loadSettings() {
    setSettingsLoading(true);
    setSettingsError('');
    try {
      const data = await crm.getSettings();
      setSettingsForm(data);
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

  function navigateTo(tab: 'overview' | 'inbox' | 'bookings' | 'calendar' | 'customers' | 'settings') {
    setActiveNav(tab);
    setIsBookingDetailModalOpen(false);
    setSelectedBookingDetail(null);
    setIsAddBookingOpen(false);
    if (tab === 'inbox') setSelectedConv(null);
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
    if (bookingFilter === 'all') return true;
    if (bookingFilter === 'upcoming') return b.status === 'confirmed' || b.status === 'pending';
    if (bookingFilter === 'completed') return b.status === 'completed';
    if (bookingFilter === 'no_show') return b.status === 'no_show';
    if (bookingFilter === 'rescheduled') return b.status === 'rescheduled';
    if (bookingFilter === 'cancelled') return b.status === 'cancelled';
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

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  return (
    <div className="w-full h-screen bg-canvas flex flex-col overflow-hidden font-sans text-text-body">
      {/* ── Top Header Navigation Bar ───────────────────────────────────────── */}
      <header className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0 bg-surface">
        {/* Logo & Current View Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-sm bg-accent flex items-center justify-center text-white shrink-0">
              <span className="font-semibold text-xs">
                {(settingsForm.name || 'CRM').charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="font-semibold text-sm text-text-primary">
              {settingsForm.name || 'WhatsApp CRM'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-border">
            <span className="text-xs text-text-muted">
              / {activeNav === 'overview' ? 'Overview' : activeNav === 'inbox' ? 'Chats' : activeNav === 'bookings' ? 'Bookings' : activeNav === 'calendar' ? 'Calendar schedule' : activeNav === 'customers' ? 'Customer directory' : 'Settings'}
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
            </nav>
          </div>

          {/* Bottom Settings Link */}
          <div className="pt-2 border-t border-border">
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

          {/* ── 2. CENTER / MAIN VIEW AREA ───────────────────────────────────── */}
          <main className="flex-1 flex flex-col overflow-hidden bg-canvas p-6 space-y-6">
            
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                  {b.service} &bull; {new Date(b.appointment_time).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(b.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span>Home</span>
                    <ChevronRight className="w-3 h-3 text-text-muted stroke-[1.5]" />
                    <span>Bookings</span>
                    <ChevronRight className="w-3 h-3 text-text-muted stroke-[1.5]" />
                    <span className="text-text-primary font-medium">Schedule</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Filter Segmented Control */}
                    <div className="flex gap-0.5 bg-surface-subtle p-0.5 rounded-sm border border-border">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'upcoming', label: 'Upcoming' },
                        { id: 'completed', label: 'Attended' },
                        { id: 'no_show', label: 'No-Show' },
                        { id: 'cancelled', label: 'Cancelled' },
                      ].map((st) => (
                        <button
                          key={st.id}
                          onClick={() => setBookingFilter(st.id)}
                          className={`px-2.5 py-1 text-xs rounded-sm transition-colors duration-150 cursor-pointer ${
                            bookingFilter === st.id
                              ? 'bg-surface text-text-primary font-semibold border border-border shadow-subtle'
                              : 'text-text-secondary hover:text-text-primary font-medium'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
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
                        {filteredBookings.map((b) => (
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
                              {b.start_time ? new Date(b.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                            </td>

                            <td className="p-3 font-mono font-medium text-xs text-text-primary tabular-nums">
                              {currentCurrencySymbol}{b.price || 0}
                            </td>

                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-sm text-[11px] font-medium border ${
                                  b.status === 'completed'
                                    ? 'bg-status-success-bg text-status-success border-status-success-border'
                                    : b.status === 'no_show'
                                    ? 'bg-status-warning-bg text-status-warning border-status-warning-border'
                                    : b.status === 'cancelled'
                                    ? 'bg-status-error-bg text-status-error border-status-error-border'
                                    : 'bg-surface-subtle text-text-secondary border-border'
                                }`}
                              >
                                {b.status === 'completed' ? 'Attended' : b.status === 'no_show' ? 'No-Show' : b.status}
                              </span>
                            </td>

                            <td className="p-3 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setSelectedBookingDetail(b);
                                  setEditPriceValue(String(b.price || 0));
                                  setIsBookingDetailModalOpen(true);
                                }}
                                className="px-2.5 py-1 text-xs font-medium bg-surface hover:bg-surface-subtle text-text-primary border border-border rounded-sm transition-colors duration-150 flex items-center gap-1.5 ml-auto cursor-pointer"
                                title="Update booking details, fee & attendance"
                              >
                                <Sliders className="w-3.5 h-3.5 stroke-[1.5]" />
                                <span>Update</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ── VIEW 2: CALENDAR VIEW ───────────────────────────────────────── */}
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

            {/* ── VIEW 3: INBOX / CONVERSATIONS ───────────────────────────────── */}
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
                            <div className="w-7 h-7 rounded-sm bg-surface-subtle text-text-secondary border border-border flex items-center justify-center font-medium text-xs shrink-0">
                              {conv.contact_name ? conv.contact_name[0].toUpperCase() : 'C'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center">
                                <p className="font-medium text-xs text-text-primary truncate">{conv.contact_name || conv.contact_phone}</p>
                                <span className="text-xs text-text-muted font-mono">
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
                            <h4 className="font-medium text-xs text-text-primary">{selectedConv.contact_name || selectedConv.contact_phone}</h4>
                            <p className="text-xs text-text-muted font-mono">{selectedConv.contact_phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
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
                          const isVoice = msg.body?.startsWith('🎤 [Voice Note:');
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

            {/* ── VIEW 4: CUSTOMERS DIRECTORY ─────────────────────────────────── */}
            {activeNav === 'customers' && (
              <div className="flex-1 flex flex-col overflow-hidden space-y-4">
                <div className="flex justify-between items-center pt-1">
                  <h3 className="font-semibold text-sm text-text-primary">Customer directory ({contacts.length})</h3>
                </div>

                <div className="flex-1 overflow-y-auto border border-border rounded-md bg-surface">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-subtle border-b border-border text-text-secondary font-medium text-xs">
                      <tr>
                        <th className="p-3 pl-4">Client name</th>
                        <th className="p-3">WhatsApp phone</th>
                        <th className="p-3">WhatsApp profile</th>
                        <th className="p-3">First seen</th>
                        <th className="p-3 text-right pr-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {contacts.map((ct) => (
                        <tr key={ct.id} className="hover:bg-surface-subtle transition-colors duration-150">
                          <td className="p-3 pl-4 font-medium text-text-primary">{ct.name || 'Unnamed contact'}</td>
                          <td className="p-3 font-mono text-text-secondary">{ct.phone}</td>
                          <td className="p-3 text-text-muted">{ct.wa_profile_name || '—'}</td>
                          <td className="p-3 font-mono text-xs text-text-muted">
                            {ct.created_at ? new Date(ct.created_at).toLocaleDateString() : '—'}
                          </td>
                          <td className="p-3 text-right pr-4">
                            <button
                              onClick={() => openChatForContact(ct.phone)}
                              className="px-2.5 py-1 bg-surface hover:bg-surface-subtle text-text-primary font-medium text-xs rounded-sm transition-colors duration-150 border border-border cursor-pointer"
                            >
                              Open chat
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── VIEW 5: SETTINGS & BYOK ─────────────────────────────────────── */}
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
                  
                  {/* ── 1. AI BRAIN & BYOK MODEL KEYS ──────────────────────── */}
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

                  {/* ── 2. META WHATSAPP API CREDENTIALS ─────────────────────── */}
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

                  {/* ── 3. LIFECYCLE MESSAGE TEMPLATES ───────────────────────── */}
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

                  {/* ── 4. BRANDING & LOCALIZATION ──────────────────────────── */}
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
                          <div className="w-7 h-7 rounded-sm bg-accent flex items-center justify-center text-white shrink-0">
                            <span className="font-semibold text-xs">
                              {(settingsForm.name || 'CRM').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-text-primary">
                              {settingsForm.name || 'WhatsApp CRM'}
                            </span>
                            <span className="text-xs text-text-muted">
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
                                  currency_symbol: sel ? sel.symbol : settingsForm.currency_symbol || '₹',
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

                  {/* ── 5. GOOGLE CALENDAR SYNC ─────────────────────────────── */}
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

                  {/* ── 6. ACCOUNT & LOGOUT ───────────────────────────────── */}
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
                <form onSubmit={handleAddStickyNote} className="bg-surface-subtle border border-border rounded-md p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-text-muted">Color</span>
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
                          className={`w-4 h-4 rounded-full ${c.bg} ${c.border} border transition cursor-pointer ${
                            newNoteColor === c.id ? 'ring-2 ring-accent scale-110' : 'hover:scale-105'
                          }`}
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
                      className="px-2.5 py-1 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </form>
              )}

              {/* Sticky Notes Cards List */}
              <div className="space-y-2">
                {stickyNotes.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-surface rounded-md border border-dashed border-border">
                    <StickyNote className="w-6 h-6 text-text-muted mx-auto mb-1.5 stroke-[1.5]" />
                    <p className="text-xs font-medium text-text-primary">No notes yet</p>
                    <p className="text-xs text-text-muted mt-0.5">Click "+ Note" above to write a reminder.</p>
                  </div>
                ) : (
                  stickyNotes.map((note) => {
                    return (
                      <div
                        key={note.id}
                        className={`p-3 rounded-md border transition-colors duration-150 relative group bg-surface border-border ${
                          note.done ? 'opacity-50' : ''
                        }`}
                      >
                        {/* Pin & Actions bar */}
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleTogglePin(note.id)}
                              className="text-xs transition cursor-pointer text-text-muted hover:text-text-primary"
                              title={note.pinned ? 'Unpin' : 'Pin to top'}
                            >
                              <Pin className={`w-3.5 h-3.5 stroke-[1.5] ${note.pinned ? 'fill-accent text-accent' : ''}`} />
                            </button>
                            {note.pinned && (
                              <span className="text-[10px] font-medium uppercase tracking-wider bg-surface-subtle text-text-secondary px-1.5 py-0.2 rounded-sm border border-border">
                                Pinned
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
                            <button
                              onClick={() => handleToggleDone(note.id)}
                              className="text-text-muted hover:text-text-primary transition cursor-pointer"
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
                              className="text-text-muted hover:text-status-error transition cursor-pointer ml-1"
                              title="Delete note"
                            >
                              <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                            </button>
                          </div>
                        </div>

                        {/* Note Content */}
                        <p className={`text-xs font-normal leading-relaxed break-words text-text-body ${note.done ? 'line-through text-text-muted' : ''}`}>
                          {note.text}
                        </p>

                        {/* Timestamp */}
                        <div className="mt-2 pt-1 border-t border-border flex items-center justify-between text-[10px] text-text-muted font-mono">
                          <span>{note.createdAt}</span>
                          {note.done && <span className="text-status-success font-medium">Done</span>}
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
                      {selectedBookingDetail.start_time ? new Date(selectedBookingDetail.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
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
    </div>
  );
}

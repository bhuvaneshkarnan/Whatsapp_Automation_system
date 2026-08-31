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
  { code: '+91', country: 'India (+91)' },
  { code: '+1', country: 'United States & Canada (+1)' },
  { code: '+44', country: 'United Kingdom (+44)' },
  { code: '+971', country: 'United Arab Emirates (+971)' },
  { code: '+61', country: 'Australia (+61)' },
  { code: '+65', country: 'Singapore (+65)' },
  { code: '+49', country: 'Germany (+49)' },
  { code: '+33', country: 'France (+33)' },
  { code: '+966', country: 'Saudi Arabia (+966)' },
  { code: '+60', country: 'Malaysia (+60)' },
  { code: '+974', country: 'Qatar (+974)' },
  { code: '+965', country: 'Kuwait (+965)' },
  { code: '+968', country: 'Oman (+968)' },
  { code: '+973', country: 'Bahrain (+973)' },
  { code: '+27', country: 'South Africa (+27)' },
  { code: '+55', country: 'Brazil (+55)' },
  { code: '+81', country: 'Japan (+81)' },
  { code: '+64', country: 'New Zealand (+64)' },
  { code: '+353', country: 'Ireland (+353)' },
  { code: '+34', country: 'Spain (+34)' },
  { code: '+39', country: 'Italy (+39)' },
  { code: '+31', country: 'Netherlands (+31)' },
  { code: '+41', country: 'Switzerland (+41)' },
];

const CURRENCY_LIST = [
  { code: 'INR', symbol: '₹', name: 'INR (₹) — Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'USD ($) — US Dollar' },
  { code: 'EUR', symbol: '€', name: 'EUR (€) — Euro' },
  { code: 'GBP', symbol: '£', name: 'GBP (£) — British Pound' },
  { code: 'AED', symbol: 'AED ', name: 'AED (AED) — UAE Dirham' },
  { code: 'AUD', symbol: 'A$', name: 'AUD (A$) — Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'CAD (C$) — Canadian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'SGD (S$) — Singapore Dollar' },
  { code: 'SAR', symbol: 'SAR ', name: 'SAR (SAR) — Saudi Riyal' },
  { code: 'MYR', symbol: 'RM ', name: 'MYR (RM) — Malaysian Ringgit' },
  { code: 'QAR', symbol: 'QAR ', name: 'QAR (QAR) — Qatari Riyal' },
  { code: 'KWD', symbol: 'KWD ', name: 'KWD (KWD) — Kuwaiti Dinar' },
  { code: 'NZD', symbol: 'NZ$', name: 'NZD (NZ$) — New Zealand Dollar' },
  { code: 'JPY', symbol: '¥', name: 'JPY (¥) — Japanese Yen' },
  { code: 'CHF', symbol: 'CHF ', name: 'CHF (CHF) — Swiss Franc' },
  { code: 'ZAR', symbol: 'R ', name: 'ZAR (R) — South African Rand' },
];

const TIMEZONE_LIST = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST — GMT+5:30) [India]' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT — GMT-5/-4) [US East]' },
  { value: 'America/Chicago', label: 'America/Chicago (CST/CDT — GMT-6/-5) [US Central]' },
  { value: 'America/Denver', label: 'America/Denver (MST/MDT — GMT-7/-6) [US Mountain]' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT — GMT-8/-7) [US West / California]' },
  { value: 'America/Toronto', label: 'America/Toronto (EST/EDT) [Canada East]' },
  { value: 'America/Vancouver', label: 'America/Vancouver (PST/PDT) [Canada West]' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST — GMT+0/+1) [UK & Ireland]' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST — GMT+1/+2) [France, Germany, Italy]' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST — GMT+4) [UAE & Gulf]' },
  { value: 'Asia/Riyadh', label: 'Asia/Riyadh (AST — GMT+3) [Saudi Arabia]' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT — GMT+8) [Singapore & Malaysia]' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST — GMT+9) [Japan]' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT — GMT+10/+11) [Australia East]' },
  { value: 'Australia/Perth', label: 'Australia/Perth (AWST — GMT+8) [Australia West]' },
  { value: 'Pacific/Auckland', label: 'Pacific/Auckland (NZST/NZDT — GMT+12/+13) [New Zealand]' },
  { value: 'Africa/Johannesburg', label: 'Africa/Johannesburg (SAST — GMT+2) [South Africa]' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
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
  const [filter, setFilter] = useState<'all' | 'unread' | 'human'>('all');
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
    country_code: '+91',
    currency: 'INR',
    currency_symbol: '₹',
    admin_whatsapp_number: '',
    template_booking_confirmation: 'booking_confirmationn',
    template_reschedule_confirmation: 'booking_confirmationn',
    template_cancellation_confirmation: 'cancellation_confirmation',
    template_post_service_review: 'post_service_review',
    template_admin_notification: 'admin_notification',
    template_admin_human_request: 'admin_human_request',
    template_admin_cancellation_notice: 'admin_cancellation_notice',
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
    if (filter === 'unread') return (c.unread_count || 0) > 0;
    if (filter === 'human') return !c.ai_enabled;
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
    <div className="w-full h-screen bg-white flex flex-col overflow-hidden font-sans text-slate-800">
      {/* ── Top Header Navigation Bar ───────────────────────────────────────── */}
        <header className="h-16 px-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          {/* Logo & Current View Title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0">
                <span className="font-bold text-xs font-headline">
                  {(settingsForm.name || 'Boldlabs CRM').charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="font-bold text-base text-slate-900 tracking-tight font-headline">
                {settingsForm.name || 'Boldlabs CRM'}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-200">
              <span className="text-xs font-semibold text-slate-400 capitalize font-sans">
                / {activeNav === 'overview' ? 'Overview' : activeNav === 'inbox' ? 'Live WhatsApp' : activeNav === 'bookings' ? 'Bookings' : activeNav === 'calendar' ? 'Calendar Schedule' : activeNav === 'customers' ? 'Customer Directory' : 'Settings & BYOK'}
              </span>
            </div>
          </div>

          {/* Right Action Profile */}
          <div className="flex items-center gap-3">
            {/* Search Pill */}
            <div className="relative hidden md:block">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-900 stroke-[2]" />
              <input
                type="text"
                placeholder="Search anything..."
                value={bookingSearch || searchQuery}
                onChange={(e) => {
                  setBookingSearch(e.target.value);
                  setSearchQuery(e.target.value);
                }}
                className="w-56 pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 transition font-medium"
              />
            </div>

            {/* Toggle Sticky Notes button in header */}
            <button
              onClick={() => setShowRightDrawer(!showRightDrawer)}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold border ${
                showRightDrawer ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 text-slate-700 hover:text-slate-950 hover:bg-slate-200 border-slate-200/60'
              }`}
              title="Toggle Sticky Notes"
            >
              <StickyNote className={`w-4 h-4 stroke-[2] ${showRightDrawer ? 'text-white' : 'text-slate-900'}`} />
              <span className="hidden sm:inline text-xs font-semibold">Notes</span>
              {stickyNotes.length > 0 && (
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono font-bold ${
                  showRightDrawer ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
                }`}>
                  {stickyNotes.length}
                </span>
              )}
            </button>

            {/* Notification Bell */}
            <button className="p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition cursor-pointer relative border border-slate-200/60">
              <Bell className="w-4 h-4 text-slate-900 stroke-[2]" />
              <span className="w-2 h-2 rounded-full bg-slate-900 absolute top-1.5 right-1.5 ring-2 ring-white" />
            </button>
          </div>
        </header>

        {/* ── Action Notice Toast ────────────────────────────────────────────── */}
        {actionNotice && (
          <div className="bg-slate-100 border-b border-slate-200 px-6 py-2 text-xs text-slate-900 flex items-center justify-between font-medium animate-fadeIn">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-900" />
              <span>{actionNotice}</span>
            </span>
            <button onClick={() => setActionNotice(null)} className="text-slate-500 hover:text-slate-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── 3-Column Body Container ────────────────────────────────────────── */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* ── 1. LEFT SIDEBAR ──────────────────────────────────────────────── */}
          <aside className="w-60 bg-white border-r border-slate-100 flex flex-col shrink-0 p-4 justify-between">
            <div className="space-y-2">
              {/* Sidebar Menu Items */}
              <nav className="space-y-1">
                <button
                  onClick={() => navigateTo('overview')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition cursor-pointer group ${
                    activeNav === 'overview'
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <LayoutGrid className={`w-4 h-4 stroke-[2] shrink-0 ${activeNav === 'overview' ? 'text-white' : 'text-slate-900'}`} />
                  <span>Overview</span>
                </button>

                <button
                  onClick={() => navigateTo('inbox')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition cursor-pointer group ${
                    activeNav === 'inbox'
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <MessageSquare className={`w-4 h-4 stroke-[2] shrink-0 ${activeNav === 'inbox' ? 'text-white' : 'text-slate-900'}`} />
                  <span>Live WhatsApp</span>
                </button>

                <button
                  onClick={() => navigateTo('bookings')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition cursor-pointer group ${
                    activeNav === 'bookings'
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <CalendarDays className={`w-4 h-4 stroke-[2] shrink-0 ${activeNav === 'bookings' ? 'text-white' : 'text-slate-900'}`} />
                  <span>Bookings</span>
                </button>

                <button
                  onClick={() => navigateTo('calendar')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition cursor-pointer group ${
                    activeNav === 'calendar'
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <Calendar className={`w-4 h-4 stroke-[2] shrink-0 ${activeNav === 'calendar' ? 'text-white' : 'text-slate-900'}`} />
                  <span>Calendar Schedule</span>
                </button>

                <button
                  onClick={() => navigateTo('customers')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition cursor-pointer group ${
                    activeNav === 'customers'
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <Users className={`w-4 h-4 stroke-[2] shrink-0 ${activeNav === 'customers' ? 'text-white' : 'text-slate-900'}`} />
                  <span>Customer Directory</span>
                </button>

                {/* Super Admin link if applicable */}
                {user?.role === 'super_admin' && (
                  <a
                    href="/admin/clients"
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition mt-2 pt-2 border-t border-slate-100 group"
                  >
                    <Building2 className="w-4 h-4 text-slate-900 stroke-[2] shrink-0" />
                    <span>Manage Tenants</span>
                  </a>
                )}
              </nav>
            </div>

            {/* Bottom Settings & Customization Card */}
            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={() => navigateTo('settings')}
                className={`w-full text-left p-2.5 rounded-2xl border transition cursor-pointer flex items-center justify-between group ${
                  activeNav === 'settings'
                    ? 'bg-slate-900 border-slate-900 text-white font-semibold'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
                    activeNav === 'settings'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-900 group-hover:bg-slate-200'
                  }`}>
                    <Sliders className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div>
                    <p className={`font-semibold text-xs ${activeNav === 'settings' ? 'text-white' : 'text-slate-900'}`}>Settings & BYOK</p>
                    <p className={`text-[10px] font-medium ${activeNav === 'settings' ? 'text-slate-400' : 'text-slate-500'}`}>Credentials & Config</p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition ${
                  activeNav === 'settings' ? 'text-white translate-x-0.5' : 'text-slate-400 group-hover:text-slate-700'
                }`} />
              </button>
            </div>
          </aside>

          {/* ── 2. CENTER / MAIN VIEW AREA ───────────────────────────────────── */}
          <main className="flex-1 flex flex-col overflow-hidden bg-white p-6 space-y-6">
            
            {/* ── VIEW 0: DEDICATED OVERVIEW DASHBOARD ─────────────────────────── */}
            {activeNav === 'overview' && (
              <div className="flex-1 flex flex-col overflow-y-auto space-y-6 pr-1">
                {/* Welcome Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold font-headline text-slate-900 tracking-tight">
                      Workspace Overview
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Real-time summary of WhatsApp automation, bookings, and customer interactions.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        loadConversations();
                        loadBookings();
                        loadContacts();
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-slate-200/60"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Refresh</span>
                    </button>
                    <button
                      onClick={() => setActiveNav('inbox')}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Open Live Inbox</span>
                    </button>
                  </div>
                </div>

                {/* Quick Access Metric Cards */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider font-headline">Quick Access</h3>
                    <MoreHorizontal className="w-4 h-4 text-slate-400 cursor-pointer" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Active Conversations */}
                    <div
                      onClick={() => setActiveNav('inbox')}
                      className="bg-white border border-slate-200 hover:border-slate-400 rounded-2xl p-4 transition cursor-pointer space-y-3 group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center text-slate-900 transition">
                        <MessageSquare className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 group-hover:text-slate-950 transition font-headline">Live WhatsApp</h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {conversations.length} Active Conversations
                        </p>
                      </div>
                    </div>

                    {/* Card 2: Upcoming Bookings */}
                    <div
                      onClick={() => setActiveNav('bookings')}
                      className="bg-white border border-slate-200 hover:border-slate-400 rounded-2xl p-4 transition cursor-pointer space-y-3 group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center text-slate-900 transition">
                        <CalendarDays className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 group-hover:text-slate-950 transition font-headline">Upcoming Bookings</h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending').length} Appointments
                        </p>
                      </div>
                    </div>

                    {/* Card 3: Attended / Reviews */}
                    <div
                      onClick={() => {
                        setActiveNav('bookings');
                        setBookingFilter('completed');
                      }}
                      className="bg-white border border-slate-200 hover:border-slate-400 rounded-2xl p-4 transition cursor-pointer space-y-3 group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center text-slate-900 transition">
                        <Star className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 group-hover:text-slate-950 transition font-headline">Attended (Reviews)</h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {bookings.filter((b) => b.status === 'completed').length} Completed
                        </p>
                      </div>
                    </div>

                    {/* Card 4: Customer Directory */}
                    <div
                      onClick={() => setActiveNav('customers')}
                      className="bg-white border border-slate-200 hover:border-slate-400 rounded-2xl p-4 transition cursor-pointer space-y-3 group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center text-slate-900 transition">
                        <Users className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 group-hover:text-slate-950 transition font-headline">Customer Directory</h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {contacts.length} Leads & Clients
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2-Column Overview Widgets */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
                  {/* Widget 1: Recent Inbound Conversations */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-slate-900 stroke-[2]" />
                        <h4 className="font-bold text-xs text-slate-900 font-headline">Recent WhatsApp Inbound</h4>
                      </div>
                      <button
                        onClick={() => setActiveNav('inbox')}
                        className="text-xs font-semibold text-slate-900 hover:text-black cursor-pointer flex items-center gap-1"
                      >
                        <span>View All</span>
                        <ArrowUpRight className="w-3.5 h-3.5 stroke-[2]" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {conversations.length === 0 ? (
                        <div className="text-center py-8 text-xs text-slate-400">
                          No WhatsApp conversations yet. Send a test message to your WhatsApp number!
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
                            className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition cursor-pointer flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold text-xs font-headline">
                                {(c.contact_name || c.contact_phone || 'W').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-xs text-slate-900">
                                  {c.contact_name || c.contact_phone || 'WhatsApp Client'}
                                </p>
                                <p className="text-[11px] text-slate-500 line-clamp-1 max-w-[200px]">
                                  {c.last_message || 'Active conversation'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {c.ai_enabled ? (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold rounded-full">
                                  AI Auto
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold rounded-full">
                                  Human
                                </span>
                              )}
                              <ChevronRight className="w-3.5 h-3.5 text-slate-900 stroke-[2]" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Widget 2: Next Upcoming Bookings */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-slate-900 stroke-[2]" />
                        <h4 className="font-bold text-xs text-slate-900 font-headline">Next Upcoming Bookings</h4>
                      </div>
                      <button
                        onClick={() => setActiveNav('bookings')}
                        className="text-xs font-semibold text-slate-900 hover:text-black cursor-pointer flex items-center gap-1"
                      >
                        <span>View All</span>
                        <ArrowUpRight className="w-3.5 h-3.5 stroke-[2]" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending').length === 0 ? (
                        <div className="text-center py-8 text-xs text-slate-400">
                          No upcoming bookings scheduled today.
                        </div>
                      ) : (
                        bookings
                          .filter((b) => b.status === 'confirmed' || b.status === 'pending')
                          .slice(0, 4)
                          .map((b) => (
                            <div
                              key={b.id}
                              className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition flex items-center justify-between"
                            >
                              <div>
                                <p className="font-bold text-xs text-slate-900">
                                  {b.contact_name || b.contact_phone || 'Client'}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {b.service} • {new Date(b.appointment_time).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(b.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900 font-mono">{currentCurrencySymbol}{b.price || 0}</span>
                                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full capitalize border ${
                                  b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
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
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span>Home</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <span>Bookings</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-900 font-bold">Schedule</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Filter Pills */}
                    <div className="flex gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200/60">
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
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg capitalize transition cursor-pointer ${
                            bookingFilter === st.id
                              ? 'bg-slate-900 text-white font-semibold'
                              : 'text-slate-600 hover:text-slate-950 font-medium'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>

                    {/* Add Booking Button */}
                    <button
                      onClick={() => setIsAddBookingOpen(true)}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2]" />
                      <span>Add Booking</span>
                    </button>
                  </div>
                </div>

                {/* Bookings Data Table */}
                <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl bg-white">
                  {loadingBookings ? (
                    <div className="p-12 text-center text-xs text-slate-400">Loading bookings...</div>
                  ) : filteredBookings.length === 0 ? (
                    <div className="p-12 text-center space-y-2">
                      <CalendarDays className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-semibold text-slate-700 font-headline">No bookings in this filter</p>
                      <p className="text-[11px] text-slate-500">Appointments booked via WhatsApp will appear here automatically.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                        <tr>
                          <th className="p-3.5 pl-4">Client / Contact</th>
                          <th className="p-3.5">Service / Request</th>
                          <th className="p-3.5">Scheduled Date & Time</th>
                          <th className="p-3.5">Fee</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 text-right pr-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredBookings.map((b) => (
                          <tr
                            key={b.id}
                            onClick={() => {
                              setSelectedBookingDetail(b);
                              setEditPriceValue(String(b.price || 0));
                              setIsBookingDetailModalOpen(true);
                            }}
                            className="hover:bg-slate-50 transition cursor-pointer"
                          >
                            <td className="p-3.5 pl-4 flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-900 border border-slate-300 flex items-center justify-center font-bold text-xs shrink-0 font-headline">
                                {b.contact_name ? b.contact_name[0].toUpperCase() : 'C'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate">{b.contact_name || 'Client'}</p>
                                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{b.contact_phone || '—'}</p>
                              </div>
                            </td>

                            <td className="p-3.5 font-medium text-slate-700">
                              {b.service}
                            </td>

                            <td className="p-3.5 font-mono text-[11px] text-slate-500">
                              {b.start_time ? new Date(b.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                            </td>

                            <td className="p-3.5 font-mono font-bold text-slate-900">
                              {currentCurrencySymbol}{b.price || 0}
                            </td>

                            <td className="p-3.5">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                                  b.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : b.status === 'no_show'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : b.status === 'cancelled'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-slate-100 text-slate-800 border-slate-200'
                                }`}
                              >
                                {b.status === 'completed' ? 'Attended' : b.status === 'no_show' ? 'No-Show' : b.status}
                              </span>
                            </td>

                            <td className="p-3.5 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setSelectedBookingDetail(b);
                                  setEditPriceValue(String(b.price || 0));
                                  setIsBookingDetailModalOpen(true);
                                }}
                                className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-black text-white rounded-xl transition cursor-pointer flex items-center gap-1.5 ml-auto"
                                title="Update Booking Details, Price & Attendance"
                              >
                                <Sliders className="w-3.5 h-3.5 stroke-[2]" />
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
                    <h3 className="font-bold text-sm text-slate-900 font-headline">{calendarTitle}</h3>
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200/60">
                      <button
                        type="button"
                        onClick={handlePrevDate}
                        className="p-1 text-slate-600 hover:text-slate-950 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
                        title="Previous"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleToday}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={handleNextDate}
                        className="p-1 text-slate-600 hover:text-slate-950 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
                        title="Next"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Mode Switcher */}
                    <div className="flex gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200/60">
                      {(['day', 'week', 'month'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setCalendarViewMode(mode)}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition cursor-pointer ${
                            calendarViewMode === mode
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-950 font-medium'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddBookingOpen(true)}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2]" />
                      <span>Add Booking</span>
                    </button>
                  </div>
                </div>

                {/* 1. MONTH VIEW */}
                {calendarViewMode === 'month' && (
                  <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl bg-white flex flex-col">
                    <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center text-[11px] font-bold text-slate-600 py-2">
                      <span>Sun</span>
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                    </div>

                    <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 flex-1">
                      {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`offset-${i}`} className="min-h-[90px] p-2 bg-slate-50/40" />
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
                            className={`min-h-[90px] p-2 flex flex-col justify-between transition cursor-pointer ${
                              isToday ? 'bg-slate-100/70' : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs font-bold ${
                                  isToday
                                    ? 'w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center'
                                    : 'text-slate-700'
                                }`}
                              >
                                {dayNum}
                              </span>
                              {dayBookings.length > 0 && (
                                <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                                  {dayBookings.length} apt{dayBookings.length > 1 ? 's' : ''}
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
                                  className={`w-full text-left px-2 py-1 rounded-lg text-[10px] truncate block font-medium transition border shadow-2xs ${
                                    b.status === 'completed'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                      : b.status === 'no_show'
                                      ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                      : b.status === 'cancelled'
                                      ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                                      : 'bg-slate-900 text-white border-slate-900 hover:bg-black'
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
                  <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl bg-white flex flex-col">
                    {/* Week Days Header */}
                    <div className="grid grid-cols-8 bg-slate-50 border-b border-slate-200 text-center py-2.5 shrink-0">
                      <div className="text-[11px] font-bold text-slate-400 font-mono">Time</div>
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
                            <span className="text-[10px] font-bold uppercase text-slate-500">
                              {day.toLocaleDateString([], { weekday: 'short' })}
                            </span>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                                isToday ? 'bg-slate-900 text-white' : 'text-slate-900'
                              }`}
                            >
                              {day.getDate()}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Week Hours Grid */}
                    <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
                      {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((hour) => (
                        <div key={hour} className="grid grid-cols-8 min-h-[64px] divide-x divide-slate-100">
                          {/* Hour Label */}
                          <div className="p-2 text-right text-[11px] font-mono text-slate-400 font-medium bg-slate-50/40">
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
                                className="p-1 relative group hover:bg-slate-50/60 transition min-h-[60px]"
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
                                    className="w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition text-xs font-bold rounded"
                                    title="Add appointment at this time"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
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
                                        className={`p-1.5 rounded-xl border text-left cursor-pointer transition shadow-2xs ${
                                          b.status === 'completed'
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950 hover:bg-emerald-100'
                                            : b.status === 'no_show'
                                            ? 'bg-amber-50 border-amber-200 text-amber-950 hover:bg-amber-100'
                                            : b.status === 'cancelled'
                                            ? 'bg-rose-50 border-rose-200 text-rose-950 hover:bg-rose-100'
                                            : 'bg-slate-900 border-slate-900 text-white hover:bg-black'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between gap-1">
                                          <p className="text-[10px] font-bold truncate">
                                            {b.contact_name || 'Client'}
                                          </p>
                                          <span className="text-[9px] font-mono opacity-80">
                                            {b.start_time ? new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                          </span>
                                        </div>
                                        <p className="text-[9px] truncate opacity-90">{b.service}</p>
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
                  <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl bg-white flex flex-col p-5 space-y-4">
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
                          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                            <p className="text-[10px] font-bold uppercase text-slate-500">Scheduled Today</p>
                            <p className="text-lg font-bold text-slate-900 font-headline mt-0.5">{dayBookings.length}</p>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                            <p className="text-[10px] font-bold uppercase text-slate-500">Expected Revenue</p>
                            <p className="text-lg font-bold text-slate-900 font-mono mt-0.5">{currentCurrencySymbol}{totalRev}</p>
                          </div>
                          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                            <p className="text-[10px] font-bold uppercase text-emerald-800">Confirmed / Attended</p>
                            <p className="text-lg font-bold text-emerald-950 font-headline mt-0.5">{confirmed + attended}</p>
                          </div>
                          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                            <p className="text-[10px] font-bold uppercase text-amber-800">No-Shows</p>
                            <p className="text-lg font-bold text-amber-950 font-headline mt-0.5">{noShow}</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Hourly Timeline */}
                    <div className="space-y-3 pt-2 divide-y divide-slate-100">
                      {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((hour) => {
                        const hourBookings = (bookings || []).filter((b) => {
                          if (!b || !b.start_time) return false;
                          const bDate = new Date(b.start_time);
                          return isSameDay(bDate, currentDate) && bDate.getHours() === hour;
                        });

                        return (
                          <div key={hour} className="pt-3 flex items-start gap-4">
                            <div className="w-16 shrink-0 text-right font-mono text-xs text-slate-400 font-bold pt-1">
                              {hour % 12 === 0 ? 12 : hour % 12} {hour >= 12 ? 'PM' : 'AM'}
                            </div>

                            <div className="flex-1 space-y-2">
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
                                    className="text-[11px] text-slate-400 hover:text-slate-800 flex items-center gap-1 font-medium transition cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Available &bull; Click to book slot</span>
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
                                    className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-slate-300 rounded-2xl transition cursor-pointer flex items-center justify-between gap-4 shadow-2xs"
                                  >
                                    <div className="flex items-center gap-3.5">
                                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs font-headline shrink-0">
                                        {b.contact_name ? b.contact_name[0].toUpperCase() : 'C'}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className="font-bold text-xs text-slate-900 font-headline">
                                            {b.contact_name || 'Client'}
                                          </p>
                                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                                            b.status === 'completed'
                                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                              : b.status === 'no_show'
                                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                                              : b.status === 'cancelled'
                                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                                              : 'bg-slate-100 text-slate-800 border-slate-200'
                                          }`}>
                                            {b.status ? b.status.toUpperCase() : 'CONFIRMED'}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                          {b.service} &bull; <span className="font-mono">{b.contact_phone}</span>
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                      <div className="text-right">
                                        <p className="font-bold text-xs text-slate-900 font-mono">
                                          {currentCurrencySymbol}{b.price || 0}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-mono">
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
                                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs rounded-xl border border-slate-200 transition shadow-2xs cursor-pointer"
                                      >
                                        View Details
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
              <div className="flex-1 flex overflow-hidden border border-slate-200 rounded-2xl bg-white">
                {/* Conversations List */}
                <div className="w-72 bg-slate-50/60 border-r border-slate-200 flex flex-col shrink-0">
                  <div className="p-3 border-b border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-headline">WhatsApp Chats</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-semibold">All AI:</span>
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
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer border ${
                            conversations.some((c) => c.ai_enabled)
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                          title="Toggle AI Auto-Reply on or off for ALL conversations"
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
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 font-medium"
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                    {filteredConversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => selectConversation(conv)}
                        className={`group w-full p-3 text-left transition cursor-pointer flex gap-2.5 items-center justify-between ${
                          selectedConv?.id === conv.id ? 'bg-slate-100 border-l-2 border-slate-900' : 'hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-900 border border-slate-300 flex items-center justify-center font-bold text-xs shrink-0 font-headline">
                            {conv.contact_name ? conv.contact_name[0].toUpperCase() : 'C'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <p className="font-bold text-xs text-slate-900 truncate">{conv.contact_name || conv.contact_phone}</p>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <p className="text-[11px] text-slate-500 truncate font-mono">{conv.contact_phone}</p>
                              <div className="flex items-center gap-1.5">
                                {(conv.unread_count || 0) > 0 && selectedConv?.id !== conv.id && (
                                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[9px] font-bold min-w-[16px] text-center shadow-xs">
                                    {conv.unread_count}
                                  </span>
                                )}
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                  conv.ai_enabled
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}>
                                  {conv.ai_enabled ? 'AI' : 'Human'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
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
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0 cursor-pointer ml-1"
                          title="Delete Chat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chat Stream */}
                <div className="flex-1 flex flex-col bg-white">
                  {selectedConv ? (
                    <>
                      <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                            {selectedConv.contact_name ? selectedConv.contact_name[0].toUpperCase() : 'C'}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-900 font-headline">{selectedConv.contact_name || selectedConv.contact_phone}</h4>
                            <p className="text-[10px] text-slate-400 font-mono">{selectedConv.contact_phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition ${
                            selectedConv.ai_enabled
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {selectedConv.ai_enabled ? '● AI Auto-Reply' : '● Human Only'}
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
                            className="cursor-pointer text-slate-900 hover:text-black transition disabled:opacity-50"
                            title={selectedConv.ai_enabled ? 'Click to pause AI (Take over as human)' : 'Click to enable AI Auto-Reply'}
                          >
                            {selectedConv.ai_enabled ? (
                              <ToggleRight className="w-8 h-8 text-emerald-600" />
                            ) : (
                              <ToggleLeft className="w-8 h-8 text-slate-400" />
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
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer ml-1"
                            title="Delete this entire chat"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {loadingMessages ? (
                          <div className="text-center text-xs text-slate-400 py-8">Loading history...</div>
                        ) : messages.map((msg) => {
                          const isInbound = msg.direction === 'inbound';
                          const isVoice = msg.body?.startsWith('🎤 [Voice Note:');
                          const isDeleted = msg.body === '🚫 This message was deleted' || msg.status === 'deleted';
                          return (
                            <div key={msg.id} className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}>
                              <div
                                className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs ${
                                  isInbound ? 'bg-slate-100 text-slate-900 border border-slate-200/60' : 'bg-slate-900 text-white'
                                }`}
                              >
                                {isVoice && (
                                  <div className="flex items-center gap-1 text-amber-300 font-mono text-[10px] mb-1">
                                    <Mic className="w-3 h-3" />
                                    <span>Transcribed Voice Note</span>
                                  </div>
                                )}
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                                <div className={`text-[10px] mt-1.5 flex items-center justify-end gap-1 font-mono ${isInbound ? 'text-slate-400' : 'text-slate-300'}`}>
                                  <span>{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                  {!isInbound && (
                                    <span className="inline-flex items-center ml-0.5" title={msg.status === 'read' ? 'Read (Seen)' : msg.status === 'delivered' ? 'Delivered' : msg.status === 'sent' ? 'Sent' : 'Pending'}>
                                      {msg.status === 'read' ? (
                                        <span className="text-sky-400 font-bold text-[11px] leading-none select-none">✓✓</span>
                                      ) : msg.status === 'delivered' ? (
                                        <span className="text-slate-400 font-semibold text-[11px] leading-none select-none">✓✓</span>
                                      ) : msg.status === 'failed' ? (
                                        <span className="text-rose-400 font-bold text-[11px] leading-none select-none">!</span>
                                      ) : (
                                        <span className="text-slate-400 font-semibold text-[11px] leading-none select-none">✓</span>
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

                      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 flex gap-2 bg-white">
                        <input
                          type="text"
                          placeholder="Type WhatsApp reply..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 font-medium"
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim() || sendingMessage}
                          className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-semibold text-xs rounded-xl transition cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3 bg-slate-50/40">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-900">
                        <MessageSquare className="w-6 h-6 stroke-[2]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 font-headline">No Conversation Selected</h4>
                        <p className="text-xs text-slate-500 max-w-xs mt-1 font-medium">
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
                <div className="flex justify-between items-center pt-2">
                  <h3 className="font-bold text-sm text-slate-900 font-headline">Customer & Client Directory ({contacts.length})</h3>
                </div>

                <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                      <tr>
                        <th className="p-3.5 pl-4">Client Name</th>
                        <th className="p-3.5">WhatsApp Phone</th>
                        <th className="p-3.5">WhatsApp Profile</th>
                        <th className="p-3.5">First Seen</th>
                        <th className="p-3.5 text-right pr-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {contacts.map((ct) => (
                        <tr key={ct.id} className="hover:bg-slate-50 transition">
                          <td className="p-3.5 pl-4 font-bold text-slate-900">{ct.name || 'Unnamed Contact'}</td>
                          <td className="p-3.5 font-mono text-slate-600">{ct.phone}</td>
                          <td className="p-3.5 text-slate-500">{ct.wa_profile_name || '—'}</td>
                          <td className="p-3.5 font-mono text-[11px] text-slate-400">
                            {ct.created_at ? new Date(ct.created_at).toLocaleDateString() : '—'}
                          </td>
                          <td className="p-3.5 text-right pr-4">
                            <button
                              onClick={() => openChatForContact(ct.phone)}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-xs rounded-lg transition border border-slate-200"
                            >
                              Open Chat
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
                <div className="flex gap-2 border-b border-slate-100 pb-3 flex-wrap">
                  {[
                    { id: 'ai', label: '1. AI Brain & BYOK Keys', icon: Bot },
                    { id: 'whatsapp', label: '2. Meta WhatsApp API', icon: Phone },
                    { id: 'templates', label: '3. Message Templates', icon: FileText },
                    { id: 'location', label: '4. White-Label Branding', icon: Building2 },
                    { id: 'calendar', label: '5. Google Calendar', icon: Calendar },
                    { id: 'account', label: '6. Account & Logout', icon: LogOut },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setSettingsTab(tab.id as any)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition cursor-pointer ${
                          settingsTab === tab.id
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'bg-slate-100 text-slate-700 hover:text-slate-950 hover:bg-slate-200 font-medium'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 stroke-[2] ${settingsTab === tab.id ? 'text-white' : 'text-slate-900'}`} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-6">
                  
                  {/* ── 1. AI BRAIN & BYOK MODEL KEYS ──────────────────────── */}
                  {settingsTab === 'ai' && (
                    <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 font-headline">AI Intelligence & Multi-Model Routing</h4>
                          <p className="text-[11px] text-slate-500">Insert your own model API keys (BYOK) with automatic fallback redundancy.</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          Active: {settingsForm.primary_model_provider?.toUpperCase() || 'GEMINI'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Primary AI Provider</label>
                          <select
                            value={settingsForm.primary_model_provider || 'gemini'}
                            onChange={(e) => setSettingsForm({ ...settingsForm, primary_model_provider: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900 font-medium"
                          >
                            <option value="gemini">Google Gemini (Recommended / Fast Multimodal)</option>
                            <option value="groq">Groq Cloud (Ultra-Low Latency LLaMA 3.3)</option>
                            <option value="opencode">OpenCode / OpenAI Custom Endpoint</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Bot Name / Assistant Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Rakshaya / Reception Assistant"
                            value={settingsForm.assistant_name || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, assistant_name: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900 font-medium"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">The name your AI uses when greeting or chatting with customers.</p>
                        </div>
                      </div>

                      {/* 1 Single Master AI Prompt & Knowledge Field */}
                      <div className="space-y-4 pt-2">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-headline">
                              <span>🤖 AI Assistant Instructions & Knowledge Base</span>
                            </label>
                            <span className="text-[10px] text-slate-400 font-medium">All-in-One Master Prompt</span>
                          </div>
                          <textarea
                            rows={10}
                            placeholder="Provide everything your AI needs to know in one place:&#10;&#10;1. About Your Business: What you do, who runs it, team background.&#10;2. Services & Pricing: Services offered, exact pricing, packages, consultation fees.&#10;3. Conversational Goal: How to greet, answer queries, handle objections, and guide customers to book an appointment/call.&#10;4. Tone: Friendly, natural, short WhatsApp texting style (1-2 lines)."
                            value={settingsForm.ai_prompt || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, ai_prompt: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-slate-900 leading-relaxed shadow-sm resize-y"
                          />
                          <p className="text-[10px] text-slate-400 mt-1.5">
                            Everything the AI knows, sells, and aims to accomplish is guided by this single field.
                          </p>
                        </div>

                        {/* Location Box */}
                        <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 font-headline">
                              <span>📍 Business Address & Google Maps Location</span>
                            </label>
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                              Auto-sent after booking
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            placeholder="e.g. 123 Health Ave, Anna Nagar, Chennai. Landmark: Near Roundtana. Maps: https://maps.app.goo.gl/xyz"
                            value={settingsForm.full_location_text || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, full_location_text: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600 font-medium resize-none"
                          />
                          <p className="text-[10px] text-emerald-800/80">
                            Whenever a booking is confirmed by AI or CRM, this address and maps link is automatically sent to the customer on WhatsApp.
                          </p>
                        </div>

                        {/* Admin Notification Alerts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                          <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-1.5">
                            <label className="block text-xs font-bold text-slate-900">
                              📱 Admin WhatsApp Number (Instant Booking Alerts)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. +918870341570"
                              value={settingsForm.admin_whatsapp_number || ''}
                              onChange={(e) => setSettingsForm({ ...settingsForm, admin_whatsapp_number: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs font-mono focus:outline-none focus:border-slate-900"
                            />
                            <p className="text-[10px] text-amber-900/80">
                              Whenever a customer books an appointment, an instant WhatsApp alert is sent to this admin number.
                            </p>
                          </div>

                          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-1.5">
                            <label className="block text-xs font-bold text-slate-900">
                              📧 Admin Email Address (Calendar Invites)
                            </label>
                            <input
                              type="email"
                              placeholder="e.g. bhuvaneshkarnan@gmail.com"
                              value={settingsForm.notification_email || ''}
                              onChange={(e) => setSettingsForm({ ...settingsForm, notification_email: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs font-medium focus:outline-none focus:border-slate-900"
                            />
                            <p className="text-[10px] text-blue-900/80">
                              Booking notification emails and Google Calendar event invites will be sent to this email.
                            </p>
                          </div>
                        </div>

                        {/* 🌍 International Client Localization Card */}
                        <div className="p-4 bg-slate-100/70 rounded-2xl border border-slate-200/90 space-y-3 pt-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                            <Globe className="w-4 h-4 text-slate-900 stroke-[2]" />
                            <div>
                              <h5 className="font-bold text-xs text-slate-900 font-headline">🌍 International & Regional Configuration</h5>
                              <p className="text-[10px] text-slate-500">Configure timezone, currency, and dialing code for your clients in India or Globally.</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* Timezone */}
                            <div>
                              <label className="block text-[11px] font-bold text-slate-800 mb-1">
                                ⏰ Business Timezone
                              </label>
                              <select
                                value={settingsForm.timezone || 'Asia/Kolkata'}
                                onChange={(e) => setSettingsForm({ ...settingsForm, timezone: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-slate-900 cursor-pointer"
                              >
                                {TIMEZONE_LIST.map((tz) => (
                                  <option key={tz.value} value={tz.value}>
                                    {tz.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Country Calling Code */}
                            <div>
                              <label className="block text-[11px] font-bold text-slate-800 mb-1">
                                📞 Default Phone Code
                              </label>
                              <select
                                value={settingsForm.country_code || '+91'}
                                onChange={(e) => setSettingsForm({ ...settingsForm, country_code: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-slate-900 cursor-pointer"
                              >
                                {COUNTRY_CODES.map((c) => (
                                  <option key={c.code} value={c.code}>
                                    {c.country}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Currency */}
                            <div>
                              <label className="block text-[11px] font-bold text-slate-800 mb-1">
                                💳 Display Currency
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
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-slate-900 cursor-pointer"
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
                      <div className="space-y-3 pt-4 border-t border-slate-200">
                        <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider font-headline">API Keys Vault (BYOK)</h5>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-slate-700">1. Google Gemini API Key</label>
                            {settingsForm.has_gemini_key && (
                              <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                ✓ Key Saved in Vault
                              </span>
                            )}
                          </div>
                          <input
                            type="password"
                            placeholder="AIzaSy... (Leave empty to keep existing key)"
                            value={settingsForm.gemini_api_key || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, gemini_api_key: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-900"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-slate-700">2. Groq Cloud API Key (Fast Fallback)</label>
                            {settingsForm.has_groq_key && (
                              <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                ✓ Key Saved in Vault
                              </span>
                            )}
                          </div>
                          <input
                            type="password"
                            placeholder="gsk_... (Leave empty to keep existing key)"
                            value={settingsForm.groq_api_key || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, groq_api_key: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-900"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-xs font-bold text-slate-700">3. OpenCode / OpenAI Key</label>
                              {settingsForm.has_opencode_key && (
                                <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  ✓ Key Saved
                                </span>
                              )}
                            </div>
                            <input
                              type="password"
                              placeholder="sk-... (Leave empty to keep existing)"
                              value={settingsForm.opencode_api_key || ''}
                              onChange={(e) => setSettingsForm({ ...settingsForm, opencode_api_key: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">OpenCode API Base URL</label>
                            <input
                              type="text"
                              placeholder="https://api.openai.com/v1"
                              value={settingsForm.opencode_base_url || 'https://api.openai.com/v1'}
                              onChange={(e) => setSettingsForm({ ...settingsForm, opencode_base_url: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-900"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── 2. META WHATSAPP API CREDENTIALS ─────────────────────── */}
                  {settingsTab === 'whatsapp' && (
                    <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-200">
                      <div className="pb-2 border-b border-slate-200">
                        <h4 className="font-bold text-xs text-slate-900 font-headline">Meta WhatsApp Cloud API Configuration</h4>
                        <p className="text-[11px] text-slate-500">Configure your Meta App webhook callback and permanent system user token.</p>
                      </div>

                      {/* Callback URL Box */}
                      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-900">Webhook Callback URL (Add to Meta Developer Portal)</label>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(settingsForm.webhook_url || '', 'webhook')}
                            className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === 'webhook' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedKey === 'webhook' ? 'Copied!' : 'Copy URL'}</span>
                          </button>
                        </div>
                        <p className="font-mono text-xs text-slate-700 break-all select-all">
                          {settingsForm.webhook_url || `https://whatsapp-automation-system-eta.vercel.app/webhooks/whatsapp/${settingsForm.slug || 'boldlabs'}`}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Webhook Verify Token</label>
                          <input
                            type="text"
                            placeholder="e.g. my_secure_verify_token_123"
                            value={settingsForm.verify_token || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, verify_token: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Meta Phone Number ID</label>
                          <input
                            type="text"
                            placeholder="e.g. 102938475610293"
                            value={settingsForm.meta_phone_id || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, meta_phone_id: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Business Account ID (WABA ID)</label>
                          <input
                            type="text"
                            placeholder="e.g. 987654321098765"
                            value={settingsForm.meta_waba_id || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, meta_waba_id: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-900"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-slate-700">Meta App Secret (HMAC Validation)</label>
                            {settingsForm.has_app_secret && (
                              <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                ✓ Configured
                              </span>
                            )}
                          </div>
                          <input
                            type="password"
                            placeholder="App secret (Leave empty to keep existing)"
                            value={settingsForm.meta_app_secret || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, meta_app_secret: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-slate-700">Meta System User Access Token (Permanent Token)</label>
                          {settingsForm.has_access_token && (
                            <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              ✓ Token Configured
                            </span>
                          )}
                        </div>
                        <input
                          type="password"
                          placeholder="EAAB... (Leave empty to keep existing token)"
                          value={settingsForm.meta_access_token || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, meta_access_token: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-900"
                        />
                      </div>
                    </div>
                  )}

                  {/* ── 3. LIFECYCLE MESSAGE TEMPLATES ───────────────────────── */}
                  {settingsTab === 'templates' && (
                    <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-200">
                      <div className="pb-2 border-b border-slate-200">
                        <h4 className="font-bold text-xs text-slate-900 font-headline">WhatsApp Message Template Identifiers</h4>
                        <p className="text-[11px] text-slate-500">
                          Template names approved in your Meta Business Manager used for automated customer confirmations & staff alerts.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">1. Client Booking Confirmation Template</label>
                          <input
                            type="text"
                            placeholder="booking_confirmationn"
                            value={settingsForm.template_booking_confirmation || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, template_booking_confirmation: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">2. Client Reschedule Confirmation Template</label>
                          <input
                            type="text"
                            placeholder="booking_confirmationn"
                            value={settingsForm.template_reschedule_confirmation || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, template_reschedule_confirmation: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">3. Client Cancellation Confirmation Template</label>
                          <input
                            type="text"
                            placeholder="cancellation_confirmation"
                            value={settingsForm.template_cancellation_confirmation || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, template_cancellation_confirmation: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">4. Post-Service Review Request Template</label>
                          <input
                            type="text"
                            placeholder="post_service_review"
                            value={settingsForm.template_post_service_review || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, template_post_service_review: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">5. Admin New Booking Alert</label>
                          <input
                            type="text"
                            placeholder="admin_notification"
                            value={settingsForm.template_admin_notification || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, template_admin_notification: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">6. Admin Staff Takeover Alert</label>
                          <input
                            type="text"
                            placeholder="admin_human_request"
                            value={settingsForm.template_admin_human_request || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, template_admin_human_request: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">7. Admin Cancellation Notice</label>
                          <input
                            type="text"
                            placeholder="admin_cancellation_notice"
                            value={settingsForm.template_admin_cancellation_notice || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, template_admin_cancellation_notice: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── 4. WHITE-LABEL BRANDING & PROFILE ───────────────────── */}
                  {settingsTab === 'location' && (
                    <div className="space-y-5 bg-slate-50/50 p-5 rounded-2xl border border-slate-200">
                      <div className="pb-2 border-b border-slate-200 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 font-headline">White-Label Brand Identity & Customization</h4>
                          <p className="text-[11px] text-slate-500">Whitelabel your CRM dashboard name and logo for your business and clients.</p>
                        </div>
                      </div>

                      {/* Live Brand Preview Card */}
                      <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-headline">
                            Live Header Preview
                          </label>
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            ✓ Instant Top Header Sync
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0">
                            <span className="font-bold text-xs font-headline">
                              {(settingsForm.name || 'Boldlabs CRM').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base text-slate-900 tracking-tight font-headline">
                              {settingsForm.name || 'Boldlabs CRM'}
                            </span>
                            <span className="text-xs font-semibold text-slate-400 font-sans">
                              / Overview
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Company / Brand Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Boldlabs CRM / Acme Studio / Luxe Care"
                          value={settingsForm.name || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-slate-900"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">Appears across your dashboard header, emails, and WhatsApp signatures.</p>
                      </div>

                      {/* Regional & Currency Localization Card */}
                      <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                          <Globe className="w-4 h-4 text-slate-900 stroke-[2]" />
                          <h5 className="font-bold text-xs text-slate-900 font-headline">Country Calling Code & Currency Localization</h5>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                          {/* Country Code */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Default Country Calling Code
                            </label>
                            <select
                              value={settingsForm.country_code || '+91'}
                              onChange={(e) => setSettingsForm({ ...settingsForm, country_code: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-slate-900 focus:bg-white transition cursor-pointer"
                            >
                              {COUNTRY_CODES.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.country}
                                </option>
                              ))}
                            </select>
                            <p className="text-[10px] text-slate-500 mt-1 font-medium">Used for parsing customer phone numbers and new booking creations.</p>
                          </div>

                          {/* Currency Selection */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
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
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-slate-900 focus:bg-white transition cursor-pointer"
                            >
                              {CURRENCY_LIST.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                            <p className="text-[10px] text-slate-500 mt-1 font-medium">Applied across bookings, calendar fees, invoices, and analytics.</p>
                          </div>
                        </div>

                        {/* Currency Symbol Override & Live Preview */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Currency Symbol
                            </label>
                            <input
                              type="text"
                              placeholder="₹ / $ / € / AED / £"
                              value={settingsForm.currency_symbol || '₹'}
                              onChange={(e) => setSettingsForm({ ...settingsForm, currency_symbol: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Fee Format Preview
                            </label>
                            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 flex items-center justify-between">
                              <span>Standard Consultation:</span>
                              <span className="text-emerald-800">{currentCurrencySymbol}500.00</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Business Address & Google Maps Link</label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Suite 400, Innovation Tower, City Center. Maps: https://maps.app.goo.gl/..."
                          value={settingsForm.full_location_text || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, full_location_text: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900 resize-none font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Admin WhatsApp Alert Phone</label>
                          <input
                            type="text"
                            placeholder="+919876543210"
                            value={settingsForm.admin_whatsapp_number || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, admin_whatsapp_number: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Notification Email</label>
                          <input
                            type="email"
                            placeholder="admin@business.com"
                            value={settingsForm.notification_email || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, notification_email: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900 font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── 5. GOOGLE CALENDAR SYNC (1-CLICK GOOGLE SIGN-IN) ────── */}
                  {settingsTab === 'calendar' && (
                    <div className="space-y-5 bg-slate-50/50 p-5 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 font-headline">Google Calendar 2-Way Synchronization</h4>
                          <p className="text-[11px] text-slate-500">Sync WhatsApp bookings directly to Google Calendar schedules with 1-Click Sign in.</p>
                        </div>
                        {settingsForm.google_calendar_configured ? (
                          <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Connected & Synced</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            Not Connected
                          </span>
                        )}
                      </div>

                      {/* Step 1: Authorized Redirect URI Box */}
                      <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-900">
                            Authorized Redirect URI (Add to your Google Cloud Console)
                          </label>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('https://whatsapp-automation-system-eta.vercel.app/api/v1/crm/oauth/google/callback', 'gcal_redirect')}
                            className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === 'gcal_redirect' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedKey === 'gcal_redirect' ? 'Copied!' : 'Copy URI'}</span>
                          </button>
                        </div>
                        <p className="font-mono text-xs text-slate-700 break-all select-all bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          https://whatsapp-automation-system-eta.vercel.app/api/v1/crm/oauth/google/callback
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Paste this in Google Cloud Console &rarr; Credentials &rarr; OAuth 2.0 Client IDs &rarr; Authorized redirect URIs.
                        </p>
                      </div>

                      {/* Step 2: Client ID & Secret Inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Google OAuth Client ID *</label>
                          <input
                            type="text"
                            placeholder="...apps.googleusercontent.com"
                            value={settingsForm.google_client_id || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, google_client_id: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-900 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Google OAuth Client Secret *</label>
                          <input
                            type="password"
                            placeholder="GOCSPX-..."
                            value={settingsForm.google_client_secret || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, google_client_secret: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-900 font-medium"
                          />
                        </div>
                      </div>

                      {/* Step 3: 1-Click Sign in with Google Action Button */}
                      <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-900 font-headline">1-Click Google Calendar Connection</p>
                          <p className="text-[11px] text-slate-500">
                            {settingsForm.google_calendar_configured
                              ? `Currently linked to: ${settingsForm.notification_email || 'Your Google Account'}`
                              : 'Click to authorize and automatically fetch your refresh token without OAuth Playground.'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {settingsForm.google_calendar_configured && (
                            <button
                              type="button"
                              onClick={handleDisconnectGoogle}
                              disabled={disconnectingGoogle}
                              className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition cursor-pointer"
                            >
                              {disconnectingGoogle ? 'Disconnecting...' : 'Disconnect'}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={handleConnectGoogle}
                            disabled={connectingGoogle}
                            className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                          >
                            <span className="w-3.5 h-3.5 rounded-full bg-white text-slate-900 flex items-center justify-center font-bold text-[10px]">
                              G
                            </span>
                            <span>
                              {connectingGoogle
                                ? 'Redirecting to Google...'
                                : settingsForm.google_calendar_configured
                                ? 'Reconnect Google Account'
                                : 'Sign in with Google & Connect'}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Calendar ID Config */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Target Google Calendar ID</label>
                        <input
                          type="text"
                          placeholder="primary (Default primary personal calendar)"
                          value={settingsForm.google_calendar_id || 'primary'}
                          onChange={(e) => setSettingsForm({ ...settingsForm, google_calendar_id: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-900 font-medium"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">Leave as <code>primary</code> to sync with your main Google Calendar.</p>
                      </div>
                    </div>
                  )}

                  {/* ── 6. ACCOUNT & LOGOUT ───────────────────────────────── */}
                  {settingsTab === 'account' && (
                    <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 font-headline">Account & Session Management</h4>
                          <p className="text-[11px] text-slate-500">Manage your active CRM credentials and securely log out.</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ● Active Session
                        </span>
                      </div>

                      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold uppercase text-slate-400">Signed In Account</p>
                            <p className="font-bold text-sm text-slate-900 mt-0.5">{user?.email || 'Logged In Account'}</p>
                          </div>
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 uppercase">
                            Role: {user?.role || 'Staff'}
                          </span>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-xs text-slate-900">Sign Out</p>
                            <p className="text-[11px] text-slate-500">End your current session on this device securely.</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-2"
                          >
                            <LogOut className="w-3.5 h-3.5 text-rose-700 stroke-[2]" />
                            <span>Sign Out / Log Out</span>
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
                      className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-2"
                    >
                      {settingsSaving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Save All Settings & Credentials</span>
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
            <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 p-5 overflow-y-auto space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                    <StickyNote className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5 font-headline">
                      <span>Sticky Notes</span>
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded-full border border-slate-200">
                        {stickyNotes.length}
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">Quick scratchpad & reminders</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsAddingNote(!isAddingNote)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 text-[11px] font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer border border-slate-200"
                    title="Add new note"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Note</span>
                  </button>
                  <button
                    onClick={() => setShowRightDrawer(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    title="Hide notes panel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add New Note Box */}
              {isAddingNote && (
                <form onSubmit={handleAddStickyNote} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700">Choose Note Color</span>
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
                          className={`w-5 h-5 rounded-full ${c.bg} ${c.border} border transition cursor-pointer ${
                            newNoteColor === c.id ? 'ring-2 ring-slate-900 scale-110' : 'hover:scale-105'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    autoFocus
                    placeholder="Write a client follow-up, reminder, or scratchpad note..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900 resize-none text-slate-900 placeholder-slate-400 font-medium"
                  />

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingNote(false)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newNoteText.trim()}
                      className="px-3 py-1 bg-slate-900 hover:bg-black disabled:opacity-50 text-white text-[11px] font-semibold rounded-lg transition cursor-pointer"
                    >
                      Add Note
                    </button>
                  </div>
                </form>
              )}

              {/* Sticky Notes Cards List */}
              <div className="space-y-3">
                {stickyNotes.length === 0 ? (
                  <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <StickyNote className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700 font-headline">No sticky notes yet</p>
                    <p className="text-[11px] text-slate-500 mt-1">Click "+ Note" above to write your first reminder or to-do.</p>
                  </div>
                ) : (
                  stickyNotes.map((note) => {
                    const colorStyles = {
                      yellow: 'bg-[#fef9c3] border-amber-300 text-amber-950',
                      green: 'bg-[#dcfce7] border-emerald-300 text-emerald-950',
                      blue: 'bg-[#e0f2fe] border-sky-300 text-sky-950',
                      purple: 'bg-[#f3e8ff] border-purple-300 text-purple-950',
                      pink: 'bg-[#ffe4e6] border-rose-300 text-rose-950',
                    }[note.color] || 'bg-[#fef9c3] border-amber-300 text-amber-950';

                    return (
                      <div
                        key={note.id}
                        className={`p-3.5 rounded-2xl border transition relative group ${colorStyles} ${
                          note.done ? 'opacity-60' : ''
                        }`}
                      >
                        {/* Pin & Actions bar */}
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleTogglePin(note.id)}
                              className={`text-xs transition cursor-pointer ${
                                note.pinned ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-700 opacity-40 group-hover:opacity-100'
                              }`}
                              title={note.pinned ? 'Unpin note' : 'Pin to top'}
                            >
                              <Pin className={`w-3.5 h-3.5 ${note.pinned ? 'fill-slate-900 text-slate-900' : ''}`} />
                            </button>
                            {note.pinned && (
                              <span className="text-[9px] font-bold uppercase tracking-wider bg-black/10 text-slate-900 px-1.5 py-0.2 rounded-md">
                                Pinned
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
                            <button
                              onClick={() => handleToggleDone(note.id)}
                              className="text-slate-700 hover:text-black transition cursor-pointer"
                              title={note.done ? 'Mark pending' : 'Mark completed'}
                            >
                              {note.done ? (
                                <CheckSquare className="w-3.5 h-3.5 text-slate-900" />
                              ) : (
                                <Square className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteStickyNote(note.id)}
                              className="text-slate-400 hover:text-rose-600 transition cursor-pointer ml-1"
                              title="Delete note"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Note Content */}
                        <p className={`text-xs font-medium leading-relaxed break-words ${note.done ? 'line-through text-slate-500' : ''}`}>
                          {note.text}
                        </p>

                        {/* Timestamp */}
                        <div className="mt-2 pt-1 border-t border-black/10 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>{note.createdAt}</span>
                          {note.done && <span className="text-emerald-800 font-bold">Done</span>}
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
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl border border-slate-100 w-full max-w-lg overflow-hidden shadow-2xl p-7 space-y-5 my-auto animate-in fade-in zoom-in-95 duration-150">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm shrink-0">
                    <CalendarDays className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 font-headline">Create New Appointment</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Book appointment & trigger WhatsApp, Admin & Calendar automations.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsAddBookingOpen(false);
                    setBookingCreateError('');
                    setBookingCreateSuccess('');
                  }}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCreateNewBooking} className="space-y-4">
                {bookingCreateError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl font-medium flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{bookingCreateError}</span>
                  </div>
                )}

                {bookingCreateSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-2xl font-medium flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{bookingCreateSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Client Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={newBookingForm.contact_name}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, contact_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:bg-white focus:border-slate-900 font-medium transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      WhatsApp Phone <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 919876543210"
                      value={newBookingForm.contact_phone}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, contact_phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-mono focus:outline-none focus:bg-white focus:border-slate-900 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Service / Booking Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Consultation / VIP Session / Treatment"
                    value={newBookingForm.service}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, service: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:bg-white focus:border-slate-900 font-medium transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={newBookingForm.date}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, date: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:bg-white focus:border-slate-900 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Time <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={newBookingForm.time}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, time: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:bg-white focus:border-slate-900 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Fee ({currentCurrencySymbol})</label>
                    <input
                      type="number"
                      placeholder="500"
                      value={newBookingForm.price}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, price: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-mono focus:outline-none focus:bg-white focus:border-slate-900 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Notes / Instructions (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Add any client notes, preferences, or location details..."
                    value={newBookingForm.notes}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:bg-white focus:border-slate-900 resize-none font-medium transition"
                  />
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddBookingOpen(false);
                      setBookingCreateError('');
                      setBookingCreateSuccess('');
                    }}
                    className="px-5 py-3 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={bookingCreating}
                    className="px-6 py-3 bg-slate-900 hover:bg-black disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-2xl transition flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    {bookingCreating ? (
                      <>
                        <RotateCcw className="w-4 h-4 animate-spin" />
                        <span>Creating & Syncing...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Create Booking & Sync</span>
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
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl border border-slate-100 w-full max-w-lg overflow-hidden shadow-2xl p-7 space-y-5 my-auto animate-in fade-in zoom-in-95 duration-150">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm font-headline shadow-sm shrink-0">
                    {selectedBookingDetail.contact_name ? selectedBookingDetail.contact_name[0].toUpperCase() : 'C'}
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 font-headline">
                      {selectedBookingDetail.contact_name || 'Client Appointment'}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {selectedBookingDetail.contact_phone || 'No phone recorded'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                      selectedBookingDetail.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : selectedBookingDetail.status === 'no_show'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : selectedBookingDetail.status === 'cancelled'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    {selectedBookingDetail.status === 'completed' ? 'Attended' : selectedBookingDetail.status === 'no_show' ? 'No-Show' : selectedBookingDetail.status}
                  </span>
                  <button
                    onClick={() => {
                      setIsBookingDetailModalOpen(false);
                      setSelectedBookingDetail(null);
                    }}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3.5 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 text-xs">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Service</p>
                    <p className="font-bold text-slate-900 mt-1 text-[13px]">{selectedBookingDetail.service}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scheduled Date & Time</p>
                    <p className="font-bold text-slate-900 mt-1 font-mono text-xs">
                      {selectedBookingDetail.start_time ? new Date(selectedBookingDetail.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                    </p>
                  </div>
                </div>

                {/* Edit Fee / Price Section */}
                <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-slate-900 stroke-[2]" />
                      <span>Booking Fee ({currentCurrencySymbol})</span>
                    </label>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      Current: {currentCurrencySymbol}{selectedBookingDetail.price || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono">
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
                        className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const val = editingBookingPriceId === selectedBookingDetail.id ? parseFloat(editPriceValue) : selectedBookingDetail.price;
                        handleUpdatePrice(selectedBookingDetail.id, Number(val) || 0);
                      }}
                      disabled={updatingPrice}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                    >
                      {updatingPrice ? (
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      )}
                      <span>Update Price</span>
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
                    className="w-full p-3 bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2 border border-slate-200 shadow-sm cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 stroke-[2]" />
                    <span>Open Live WhatsApp Chat with Client</span>
                  </button>
                )}

                {/* Attendance Action Buttons */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Update Booking & Lifecycle Status:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => handleUpdateBookingStatus(selectedBookingDetail.id, 'completed')}
                      disabled={updatingBookingId === selectedBookingDetail.id}
                      className={`py-2.5 px-3 text-xs font-bold rounded-2xl transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                        selectedBookingDetail.status === 'completed'
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 stroke-[2]" />
                      <span>Attended</span>
                    </button>
                    <button
                      onClick={() => handleUpdateBookingStatus(selectedBookingDetail.id, 'no_show')}
                      disabled={updatingBookingId === selectedBookingDetail.id}
                      className={`py-2.5 px-3 text-xs font-bold rounded-2xl transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                        selectedBookingDetail.status === 'no_show'
                          ? 'bg-amber-700 text-white border-amber-700 shadow-sm'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                      }`}
                    >
                      <UserX className="w-3.5 h-3.5 stroke-[2]" />
                      <span>No-Show</span>
                    </button>
                    <button
                      onClick={() => handleUpdateBookingStatus(selectedBookingDetail.id, 'confirmed')}
                      disabled={updatingBookingId === selectedBookingDetail.id}
                      className={`py-2.5 px-3 text-xs font-bold rounded-2xl transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                        selectedBookingDetail.status === 'confirmed'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-200'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2]" />
                      <span>Confirmed</span>
                    </button>
                    <button
                      onClick={() => handleUpdateBookingStatus(selectedBookingDetail.id, 'cancelled')}
                      disabled={updatingBookingId === selectedBookingDetail.id}
                      className={`py-2.5 px-3 text-xs font-bold rounded-2xl transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                        selectedBookingDetail.status === 'cancelled'
                          ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                      }`}
                    >
                      <X className="w-3.5 h-3.5 stroke-[2]" />
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
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-100 w-full max-w-md overflow-hidden shadow-2xl p-7 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-100/80 text-amber-800 flex items-center justify-center shrink-0">
                  <UserX className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 font-headline">Pause AI for this customer?</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Switch this chat to manual human mode</p>
                </div>
              </div>

              <div className="p-5 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs sm:text-[13px] text-amber-950 space-y-2.5 leading-relaxed">
                <p>
                  You are switching <span className="font-bold text-slate-900">{confirmSingleAiModal.name}</span> to <span className="font-bold text-amber-900">Human Takeover Mode</span>.
                </p>
                <div className="text-[12px] text-amber-900/90 space-y-1.5 pt-0.5">
                  <p>• <strong>AI Auto-Reply will be paused</strong> for this specific customer only.</p>
                  <p>• Your staff can send messages manually from the CRM.</p>
                  <p>• <strong>All other customer conversations will continue running with AI as normal.</strong></p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmSingleAiModal(null)}
                  className="px-5 py-3 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-2xl hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel (Keep AI Running)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const convId = confirmSingleAiModal.convId;
                    setConfirmSingleAiModal(null);
                    handleToggleAi(convId, true);
                  }}
                  className="px-6 py-3 bg-[#d97706] hover:bg-[#b45309] text-white font-bold text-xs sm:text-sm rounded-2xl transition cursor-pointer shadow-md flex items-center gap-2"
                >
                  <UserX className="w-4 h-4" />
                  <span>Yes, Switch to Human Only</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL 2: CONFIRM GLOBAL ALL CHATS TAKE HUMAN ACTION ─────────────── */}
        {confirmAllAiModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-100 w-full max-w-md overflow-hidden shadow-2xl p-7 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-100/80 text-rose-800 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 font-headline">Pause AI for ALL chats?</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Global human takeover override</p>
                </div>
              </div>

              <div className="p-5 bg-rose-50/70 border border-rose-200/80 rounded-2xl text-xs sm:text-[13px] text-rose-950 space-y-2.5 leading-relaxed">
                <p className="font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>Global AI Pause Warning</span>
                </p>
                <p className="text-[12px] text-rose-900/90 leading-relaxed">
                  This will pause automated AI replies across <strong>every single customer conversation</strong> on your WhatsApp CRM. None of your incoming WhatsApp leads will receive automated replies until you turn AI back on.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmAllAiModal(false)}
                  className="px-5 py-3 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-2xl hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel (Keep AI Running)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmAllAiModal(false);
                    handleToggleAllAi(false);
                  }}
                  className="px-6 py-3 bg-[#e11d48] hover:bg-[#be123c] text-white font-bold text-xs sm:text-sm rounded-2xl transition cursor-pointer shadow-md flex items-center gap-2"
                >
                  <UserX className="w-4 h-4" />
                  <span>Yes, Turn Off AI for All Chats</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL 3: DELETE CONVERSATION CONFIRMATION ───── */}
        {deleteChatModal?.isOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-100 w-full max-w-md overflow-hidden shadow-2xl p-7 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-100/80 text-rose-800 flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 font-headline">Delete Conversation?</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Delete chat with {deleteChatModal.name}</p>
                </div>
              </div>

              <div className="p-5 bg-rose-50/70 border border-rose-200/80 rounded-2xl text-xs sm:text-[13px] text-rose-950 space-y-2.5 leading-relaxed">
                <p className="font-bold text-rose-900">
                  Are you sure you want to delete this conversation?
                </p>
                <p className="text-[12px] text-rose-900/90 leading-relaxed">
                  This will permanently clear the message history and chat thread from your CRM. Any booked appointments and contact information will remain safely preserved.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={deletingItem}
                  onClick={() => setDeleteChatModal(null)}
                  className="px-5 py-3 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-2xl hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deletingItem}
                  onClick={() => handleDeleteConversation(deleteChatModal.convId, 'for_everyone')}
                  className="px-6 py-3 bg-[#e11d48] hover:bg-[#be123c] text-white font-bold text-xs sm:text-sm rounded-2xl transition cursor-pointer shadow-md flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{deletingItem ? 'Deleting...' : 'Yes, Delete Chat'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

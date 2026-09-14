'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Flame,
  Sun,
  Snowflake,
  Clock,
  Calendar,
  CalendarCheck,
  CalendarClock,
  Search,
  Plus,
  X,
  ChevronDown,
  Download,
  RotateCcw,
  MessageSquare,
  User,
  UserPlus,
  UserCheck,
  MoreHorizontal,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  LayoutGrid,
  List,
  Phone,
  StickyNote,
  Tag,
  Trash2,
  Sliders,
  Check,
  Edit2,
  MapPin,
  CalendarPlus,
  GripVertical,
} from 'lucide-react';
import { Customer, FollowupTask, CrmDropdownOptions } from '@/lib/api';

// Date string helper for follow-up scheduling
function getFollowupDateString(offsetDays: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// WhatsApp SVG Icon
function WhatsAppIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.96.541 1.78.82 2.79.82 3.18 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.767-5.766zm3.393 8.167c-.145.407-.847.773-1.182.809-.327.035-.745.059-2.39-.623-1.979-.82-3.247-2.83-3.344-2.961-.097-.132-.806-1.074-.806-2.043 0-.969.508-1.446.689-1.644.181-.198.396-.247.528-.247.132 0 .265.001.382.007.123.006.287-.046.45.344.163.39.558 1.359.607 1.458.049.099.082.215.016.347-.066.132-.099.214-.197.33-.099.115-.208.257-.297.345-.1.099-.204.207-.088.406.116.199.516.852 1.109 1.38.763.679 1.407.888 1.606.987.199.099.314.082.43-.05.116-.132.496-.578.628-.776.132-.198.265-.165.446-.099.181.066 1.157.545 1.355.644.198.099.33.149.38.231.05.082.05.479-.095.886z" />
    </svg>
  );
}

// Flexible date parser allowing user to type YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY, DD-MM, words like today/tomorrow, etc.
function parseFlexibleDate(str: string): string | null {
  const trimmed = str.trim().toLowerCase();
  if (!trimmed) return null;

  if (trimmed === 'today') return getFollowupDateString(0);
  if (trimmed === 'tomorrow') return getFollowupDateString(1);

  // YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // DD-MM or DD/MM (assume current year)
  const dmMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})$/);
  if (dmMatch) {
    const d = dmMatch[1].padStart(2, '0');
    const m = dmMatch[2].padStart(2, '0');
    const y = String(new Date().getFullYear());
    return `${y}-${m}-${d}`;
  }

  // Fallback: standard Date parse
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return null;
}

// Formats friendly date preview like "Mon, Sep 14, 2026"
function formatDateFriendlyPreview(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (!y || !m || !d) return null;
    const dt = new Date(y, m - 1, d);
    if (isNaN(dt.getTime())) return null;
    return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return null;
  }
}

// Clean Minimalist Shopify-Style Follow-up Scheduler Popover with Direct Typing
function FollowupSchedulerPopover({
  currentDate,
  currentTime,
  onSelect,
  onClear,
  onClose,
}: {
  currentDate?: string | null;
  currentTime?: string | null;
  onSelect: (dateStr: string, timeStr?: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [dateInput, setDateInput] = useState(currentDate || getFollowupDateString(1));
  const [timeInput, setTimeInput] = useState(currentTime || '10:00 AM');
  const [error, setError] = useState<string | null>(null);
  const hiddenDateRef = React.useRef<HTMLInputElement | null>(null);

  const parsedDate = parseFlexibleDate(dateInput);
  const friendlyPreview = formatDateFriendlyPreview(parsedDate);

  const handleSave = () => {
    if (!parsedDate) {
      setError('Please enter a valid date (e.g. 2026-09-15 or 15-09-2026)');
      return;
    }
    setError(null);
    onSelect(parsedDate, timeInput.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-30"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div
        className="absolute left-0 top-full mt-1.5 z-40 w-72 bg-surface border border-border rounded-md shadow-xl p-3 text-xs space-y-3 animate-in fade-in zoom-in-95 duration-100 font-sans"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between pb-1.5 border-b border-border">
          <div className="flex items-center gap-1.5 font-bold text-text-primary text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-accent stroke-[1.8]" />
            <span>Schedule Follow-up</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-0.5 rounded cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 1. Direct Type Date & Time Inputs (Primary) */}
        <div className="space-y-2.5">
          {/* Date Input with typing & visual picker trigger */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold uppercase text-text-muted tracking-wider block">
                Type Date
              </label>
              {friendlyPreview && (
                <span className="text-[10px] text-emerald-600 font-semibold truncate max-w-[150px]">
                  ✓ {friendlyPreview}
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <input
                type="text"
                autoFocus
                value={dateInput}
                onChange={(e) => {
                  setDateInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="YYYY-MM-DD or DD-MM-YYYY"
                className={`w-full pl-2.5 pr-8 py-1.5 text-xs bg-surface-subtle border rounded text-text-primary focus:outline-none focus:bg-surface font-mono transition-all ${
                  error
                    ? 'border-rose-400 ring-1 ring-rose-300'
                    : 'border-border focus:border-accent focus:ring-1 focus:ring-accent/30'
                }`}
              />
              {/* Native Date Picker trigger button */}
              <button
                type="button"
                onClick={() => {
                  if (hiddenDateRef.current) {
                    try {
                      hiddenDateRef.current.showPicker();
                    } catch {
                      hiddenDateRef.current.click();
                    }
                  }
                }}
                className="absolute right-2 p-1 text-text-muted hover:text-accent cursor-pointer transition-colors"
                title="Open calendar picker"
              >
                <Calendar className="w-3.5 h-3.5 stroke-[1.8]" />
              </button>
              {/* Hidden native date input for picker */}
              <input
                ref={hiddenDateRef}
                type="date"
                value={parsedDate || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setDateInput(e.target.value);
                    if (error) setError(null);
                  }
                }}
                className="sr-only"
                tabIndex={-1}
              />
            </div>
            {error && (
              <p className="text-[10px] text-rose-600 mt-1 font-medium leading-tight">
                {error}
              </p>
            )}
          </div>

          {/* Time Input - Fully Editable Type */}
          <div>
            <label className="text-[10px] font-bold uppercase text-text-muted tracking-wider block mb-1">
              Type Time
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                placeholder="e.g. 10:00 AM, 02:30 PM, 14:00"
                list="followup-time-suggestions"
                className="w-full pl-2.5 pr-8 py-1.5 text-xs bg-surface-subtle border border-border rounded text-text-primary focus:outline-none focus:bg-surface focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all font-mono"
              />
              <Clock className="w-3.5 h-3.5 text-text-muted absolute right-2.5 pointer-events-none stroke-[1.8]" />
            </div>
            <datalist id="followup-time-suggestions">
              <option value="09:00 AM" />
              <option value="10:00 AM" />
              <option value="11:00 AM" />
              <option value="12:00 PM" />
              <option value="01:00 PM" />
              <option value="02:00 PM" />
              <option value="03:00 PM" />
              <option value="04:00 PM" />
              <option value="05:00 PM" />
              <option value="06:00 PM" />
              <option value="07:00 PM" />
              <option value="08:00 PM" />
            </datalist>
          </div>
        </div>

        {/* 2. Optional Quick Fill Chips */}
        <div className="pt-2 border-t border-border/70">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] uppercase font-bold text-text-muted tracking-wider">
              Quick Fill (optional)
            </span>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {[
              { label: 'Today', offset: 0 },
              { label: 'Tomorrow', offset: 1 },
              { label: '+2 Days', offset: 2 },
              { label: '+1 Week', offset: 7 },
            ].map((p) => {
              const dStr = getFollowupDateString(p.offset);
              const isSelected = parsedDate === dStr;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setDateInput(dStr);
                    if (error) setError(null);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-accent/10 text-accent border-accent/40 font-semibold'
                      : 'bg-surface-subtle hover:bg-surface text-text-secondary border-border/80 hover:border-border-strong'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Action Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          {currentDate ? (
            <button
              type="button"
              onClick={onClear}
              className="text-[11px] text-rose-600 hover:text-rose-700 hover:underline font-medium cursor-pointer"
            >
              Remove
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onClose}
              className="px-2 py-1 text-[11px] rounded border border-border text-text-secondary hover:bg-surface-subtle cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-3 py-1 text-[11px] font-semibold rounded bg-accent hover:bg-accent-hover text-white transition-colors shadow-2xs cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const STAGES: { id: Customer['status']; label: string; bg: string; text: string; border: string; dot: string }[] = [
  { id: 'new', label: 'New Inquiry', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  { id: 'contacted', label: 'Contacted / In Progress', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  { id: 'follow-up', label: 'Follow-up Due', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' },
  { id: 'converted', label: 'Booked / Converted', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  { id: 'lost', label: 'Lost / Inactive', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-400' },
];

interface ModernCustomerViewProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customerId: string, patch: Partial<Customer>) => Promise<void>;
  onOpenChat: (customer: Customer) => void;
  onOpenDetails: (customer: Customer) => void;
  onAddCustomer: () => void;
  onExportCsv: () => void;
  onRefresh: () => void;
  loading: boolean;
  tasks?: FollowupTask[];
  allNotes?: any[];
  taxonomy?: any;
  renderDrawer: () => React.ReactNode;
  categorizedStaffOptions?: {
    all?: { value: string; label: string; isDoctor?: boolean }[];
    predefinedDoctors?: { value: string; label: string }[];
    regularStaff?: { value: string; label: string }[];
    teamDoctors?: { value: string; label: string; id?: string }[];
    sales?: { value: string; label: string; id?: string }[];
    other?: { value: string; label: string; id?: string }[];
  };
  crmDropdowns?: CrmDropdownOptions;
  openDropdownOptionsModal?: () => void;
  loadingTasks?: boolean;
  loadingNotes?: boolean;
  onDeleteNote?: (noteId: string) => void;
  onAddTask?: () => void;
  onOpenQuickNote?: (cust: { id: string; name?: string | null; latest_note?: string | null; latest_note_id?: string | null; latest_note_color?: string | null }) => void;
  onDeleteLatestNote?: (cust: { id: string; name?: string | null; latest_note_id?: string | null }) => void;
}

export function ModernCustomerView({
  customers,
  selectedCustomer,
  onSelectCustomer,
  onUpdateCustomer,
  onOpenChat,
  onOpenDetails,
  onAddCustomer,
  onExportCsv,
  onRefresh,
  loading,
  tasks,
  allNotes,
  taxonomy,
  renderDrawer,
  categorizedStaffOptions,
  crmDropdowns,
  openDropdownOptionsModal,
  loadingTasks,
  loadingNotes,
  onDeleteNote,
  onAddTask,
  onOpenQuickNote,
  onDeleteLatestNote,
}: ModernCustomerViewProps) {
  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'tasks' | 'notes'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [warmthFilter, setWarmthFilter] = useState<string>('all');
  const [staffFilter, setStaffFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [schedulingCustomerId, setSchedulingCustomerId] = useState<string | null>(null);
  const [draggedCustomerId, setDraggedCustomerId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Safe fallback collections
  const safeTasks = useMemo(() => (Array.isArray(tasks) ? tasks : []), [tasks]);
  const safeAllNotes = useMemo(() => (Array.isArray(allNotes) ? allNotes : []), [allNotes]);
  const staffList = useMemo(() => {
    if (!categorizedStaffOptions) return [];
    if (Array.isArray(categorizedStaffOptions.all) && categorizedStaffOptions.all.length > 0) {
      return categorizedStaffOptions.all;
    }
    if (Array.isArray(categorizedStaffOptions.predefinedDoctors) && categorizedStaffOptions.predefinedDoctors.length > 0) {
      return categorizedStaffOptions.predefinedDoctors;
    }
    return [];
  }, [categorizedStaffOptions]);
  const outcomeStatuses = useMemo(() => {
    return Array.isArray(crmDropdowns?.outcome_statuses) ? crmDropdowns.outcome_statuses : [];
  }, [crmDropdowns]);
  const nextActions = useMemo(() => {
    return Array.isArray(crmDropdowns?.next_actions) ? crmDropdowns.next_actions : [];
  }, [crmDropdowns]);

  // Computed Executive KPI Stats
  const kpis = useMemo(() => {
    const total = customers.length;
    const hotLeads = customers.filter((c) => c.lead_probability === 'hot').length;
    const warmLeads = customers.filter((c) => c.lead_probability === 'warm').length;
    const converted = customers.filter((c) => c.status === 'converted' || c.converted).length;

    const todayStr = new Date().toISOString().split('T')[0];
    const followupsDue = customers.filter((c) => {
      if (!c.followup_date) return false;
      return c.followup_date <= todayStr && c.status !== 'converted' && c.status !== 'lost';
    }).length;

    const winRate = total > 0 ? Math.round((converted / total) * 100) : 0;

    return { total, hotLeads, warmLeads, converted, followupsDue, winRate };
  }, [customers]);

  // Filtered customers with instant live search across all fields
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const cleanQ = q.replace(/\D/g, ''); // phone digit matching

    return customers.filter((c) => {
      // 1. Live Search Filter
      if (q) {
        const name = (c.name || '').toLowerCase();
        const waName = (c.wa_profile_name || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        const cleanPhone = phone.replace(/\D/g, '');
        const location = (c.location || '').toLowerCase();
        const concern = (c.health_concern || '').toLowerCase();
        const service = (c.last_visit_service || '').toLowerCase();
        const doctor = (c.preferred_doctor || '').toLowerCase();
        const note = (c.latest_note || '').toLowerCase();
        const nextAction = (c.next_action || '').toLowerCase();
        const status = (c.status || '').toLowerCase();
        const leadProb = (c.lead_probability || '').toLowerCase();

        // Check across all customer notes
        const hasMatchingNote = (safeAllNotes || []).some(
          (n) =>
            (n.customer_id === c.id || (c.phone && n.customer_phone === c.phone)) &&
            (n.note_text || '').toLowerCase().includes(q)
        );

        const matches =
          name.includes(q) ||
          waName.includes(q) ||
          phone.includes(q) ||
          (cleanQ.length >= 3 && cleanPhone.includes(cleanQ)) ||
          location.includes(q) ||
          concern.includes(q) ||
          service.includes(q) ||
          doctor.includes(q) ||
          note.includes(q) ||
          nextAction.includes(q) ||
          status.includes(q) ||
          leadProb.includes(q) ||
          hasMatchingNote;

        if (!matches) return false;
      }

      // 2. Stage Filter
      if (stageFilter === 'action_due') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (!c.followup_date || c.followup_date > todayStr || c.status === 'converted' || c.status === 'lost') {
          return false;
        }
      } else if (stageFilter !== 'all') {
        if (c.status !== stageFilter) return false;
      }

      // 3. Warmth Filter
      if (warmthFilter !== 'all') {
        if (c.lead_probability !== warmthFilter) return false;
      }

      // 4. Staff Filter
      if (staffFilter !== 'all') {
        if (staffFilter === 'unassigned') {
          if (c.preferred_doctor) return false;
        } else if (c.preferred_doctor !== staffFilter) {
          return false;
        }
      }

      return true;
    });
  }, [customers, searchQuery, stageFilter, warmthFilter, staffFilter, safeAllNotes]);

  // Quick field updates
  const handleQuickUpdate = async (customerId: string, patch: Partial<Customer>) => {
    try {
      setUpdatingId(customerId);
      await onUpdateCustomer(customerId, patch);
    } finally {
      setUpdatingId(null);
    }
  };

  // Drag and Drop lead handler
  const handleDropLead = async (targetStage: string, customerIdToMove?: string) => {
    const custId = customerIdToMove || draggedCustomerId;
    if (!custId) return;
    const targetCustomer = customers.find((c) => c.id === custId);
    if (!targetCustomer) return;

    if (targetCustomer.status !== targetStage) {
      await handleQuickUpdate(custId, {
        status: targetStage as any,
        ...(targetStage === 'converted'
          ? { converted: true }
          : targetCustomer.converted && targetStage !== 'converted'
          ? { converted: false }
          : {}),
      });
    }
    setDraggedCustomerId(null);
    setDragOverStage(null);
  };

  // Relative WhatsApp time helper
  const formatTimeAgo = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Follow-up relative tag helper
  const getFollowupBadge = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-xs shrink-0">
          <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
          <span>Overdue ({Math.abs(diffDays)}d)</span>
        </span>
      );
    }
    if (diffDays === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded-xs animate-pulse shrink-0">
          <Clock className="w-2.5 h-2.5 shrink-0" />
          <span>Due Today</span>
        </span>
      );
    }
    if (diffDays === 1) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-xs shrink-0">
          <Calendar className="w-2.5 h-2.5 shrink-0" />
          <span>Tomorrow</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-text-secondary bg-surface-subtle border border-border px-1.5 py-0.5 rounded-xs font-mono shrink-0">
        <Calendar className="w-2.5 h-2.5 shrink-0 text-text-muted" />
        <span>{dateStr}</span>
      </span>
    );
  };

  // Dynamic color for note cards
  const getNoteCardStyle = (color?: string | null) => {
    switch ((color || '').toLowerCase()) {
      case 'purple':
        return 'bg-purple-50/80 border-purple-200 text-purple-900 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-200';
      case 'amber':
      case 'yellow':
        return 'bg-amber-50/80 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200';
      case 'emerald':
      case 'green':
        return 'bg-emerald-50/80 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200';
      case 'rose':
      case 'red':
        return 'bg-rose-50/80 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200';
      case 'blue':
        return 'bg-blue-50/80 border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-200';
      default:
        return 'bg-indigo-50/50 border-indigo-200/80 text-indigo-950 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-2">
      {/* ── 1. ULTRA-SLIM KPI STATS STRIP ───────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 flex-wrap bg-surface border border-border rounded-md px-3 py-1.5 shadow-2xs shrink-0 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-text-secondary font-medium">
            <Users className="w-3.5 h-3.5 text-text-muted stroke-[1.8]" />
            <span className="font-bold text-text-primary">{kpis.total}</span>
            <span className="text-text-muted">Total</span>
          </div>

          <div className="h-3 w-px bg-border/80" />

          <button
            type="button"
            onClick={() => setWarmthFilter(warmthFilter === 'hot' ? 'all' : 'hot')}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all cursor-pointer ${
              warmthFilter === 'hot'
                ? 'bg-rose-50 text-rose-700 font-semibold border border-rose-200'
                : 'text-text-secondary hover:text-rose-600 hover:bg-rose-50/50'
            }`}
            title="Click to toggle Hot Intent filter"
          >
            <Flame className="w-3.5 h-3.5 text-rose-500 stroke-[1.8]" />
            <span className="font-bold text-rose-600">{kpis.hotLeads}</span>
            <span>Hot</span>
          </button>

          <div className="h-3 w-px bg-border/80" />

          <button
            type="button"
            onClick={() => setStageFilter(stageFilter === 'action_due' ? 'all' : 'action_due')}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all cursor-pointer ${
              stageFilter === 'action_due'
                ? 'bg-amber-50 text-amber-800 font-semibold border border-amber-300'
                : 'text-text-secondary hover:text-amber-700 hover:bg-amber-50/50'
            }`}
            title="Click to toggle Follow-ups Due filter"
          >
            <CalendarClock className="w-3.5 h-3.5 text-amber-600 stroke-[1.8]" />
            <span className="font-bold text-amber-700">{kpis.followupsDue}</span>
            <span>Follow-ups Due</span>
          </button>

          <div className="h-3 w-px bg-border/80" />

          <button
            type="button"
            onClick={() => setStageFilter(stageFilter === 'converted' ? 'all' : 'converted')}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all cursor-pointer ${
              stageFilter === 'converted'
                ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-300'
                : 'text-text-secondary hover:text-emerald-700 hover:bg-emerald-50/50'
            }`}
            title="Click to toggle Converted filter"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 stroke-[1.8]" />
            <span className="font-bold text-emerald-700">{kpis.converted}</span>
            <span>Converted ({kpis.winRate}%)</span>
          </button>
        </div>

        {(warmthFilter !== 'all' || stageFilter !== 'all' || staffFilter !== 'all' || searchQuery.trim()) && (
          <button
            type="button"
            onClick={() => {
              setWarmthFilter('all');
              setStageFilter('all');
              setStaffFilter('all');
              setSearchQuery('');
            }}
            className="text-[11px] text-rose-600 hover:text-rose-700 hover:underline font-medium flex items-center gap-1 cursor-pointer transition-colors ml-auto"
          >
            <X className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* ── 2. UNIFIED COMPACT TOOLBAR (Live Search, View Switcher & Actions) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 bg-surface border border-border rounded-md p-1.5 shadow-2xs shrink-0">
        {/* Left: View Modes & LIVE SEARCH BAR */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-0.5 bg-surface-subtle border border-border rounded-md p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-sm transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-surface text-text-primary border border-border shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <List className="w-3.5 h-3.5 stroke-[2]" />
              <span>Table</span>
              <span className="text-[10px] text-text-muted font-mono ml-0.5">({filteredCustomers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-sm transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-surface text-text-primary border border-border shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 stroke-[2]" />
              <span>Pipeline</span>
            </button>
            {safeTasks.length > 0 && (
              <button
                type="button"
                onClick={() => setViewMode('tasks')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-sm transition-all cursor-pointer ${
                  viewMode === 'tasks'
                    ? 'bg-surface text-text-primary border border-border shadow-2xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5 stroke-[2]" />
                <span>Tasks</span>
                <span className="text-[10px] text-text-muted font-mono ml-0.5">
                  ({safeTasks.filter((t) => !t.completed).length})
                </span>
              </button>
            )}
          </div>

          {/* Live Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none stroke-[1.8]" />
            <input
              type="text"
              autoComplete="off"
              placeholder="Search by name, phone, notes, service, staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1 bg-surface-subtle border border-border rounded-md text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:bg-surface h-8 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {searchQuery && (
            <span className="text-[11px] text-text-muted font-medium shrink-0 hidden lg:inline">
              {filteredCustomers.length} of {customers.length} contacts
            </span>
          )}
        </div>

        {/* Right: Filters & Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-2 py-1 bg-surface hover:bg-surface-subtle border border-border rounded-sm text-xs font-medium text-text-secondary focus:outline-none focus:border-accent cursor-pointer h-8"
            title="Filter by stage"
          >
            <option value="all">All Stages</option>
            <option value="new">New Inquiry</option>
            <option value="contacted">Contacted / In Progress</option>
            <option value="follow-up">Follow-up Due</option>
            <option value="converted">Booked / Converted</option>
            <option value="lost">Lost / Inactive</option>
          </select>

          <select
            value={warmthFilter}
            onChange={(e) => setWarmthFilter(e.target.value)}
            className="px-2 py-1 bg-surface hover:bg-surface-subtle border border-border rounded-sm text-xs font-medium text-text-secondary focus:outline-none focus:border-accent cursor-pointer h-8"
            title="Filter by buying intent"
          >
            <option value="all">All Intent</option>
            <option value="hot">Hot Intent</option>
            <option value="warm">Warm Intent</option>
            <option value="cold">Cold Intent</option>
          </select>

          {openDropdownOptionsModal && (
            <button
              type="button"
              onClick={openDropdownOptionsModal}
              className="p-1.5 bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary border border-border rounded-sm transition-colors cursor-pointer h-8 w-8 flex items-center justify-center"
              title="Customize CRM stages and options"
            >
              <Sliders className="w-3.5 h-3.5 stroke-[1.8]" />
            </button>
          )}

          <div className="h-4 w-px bg-border/80 mx-0.5" />

          <button
            type="button"
            onClick={onExportCsv}
            className="flex items-center gap-1 px-2.5 py-1 bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary border border-border text-xs font-medium rounded-sm transition-colors cursor-pointer h-8"
            title="Export contacts to CSV"
          >
            <Download className="w-3.5 h-3.5 stroke-[1.8]" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="p-1.5 bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary border border-border rounded-sm transition-colors cursor-pointer h-8 w-8 flex items-center justify-center"
            title="Refresh contacts"
          >
            <RotateCcw className={`w-3.5 h-3.5 stroke-[1.8] ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onAddCustomer}
            className="flex items-center gap-1.5 px-3 py-1 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-sm transition-all shadow-2xs hover:shadow-xs cursor-pointer h-8"
          >
            <UserPlus className="w-3.5 h-3.5 stroke-[2]" />
            <span>+ Add {taxonomy?.client_label || 'Contact'}</span>
          </button>
        </div>
      </div>

      {/* ── 4. VIEW CONTENT AREA ────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden gap-3">
        {/* TABLE VIEW - CLEAN, HORIZONTAL, COMPACT & MODERN */}
        {viewMode === 'table' && (
          <div className="flex-1 flex flex-col border border-border rounded-md bg-surface overflow-hidden">
            <div className="flex-1 overflow-y-auto overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle/80 border-b border-border text-text-secondary font-semibold text-[10.5px] uppercase tracking-wider sticky top-0 z-10 select-none">
                  <tr>
                    <th className="py-2.5 pl-3 pr-2 min-w-[155px]">Client / Contact</th>
                    <th className="py-2.5 px-2 min-w-[130px] max-w-[190px]">Notes</th>
                    <th className="py-2.5 px-2 min-w-[95px]">Status</th>
                    <th className="py-2.5 px-2 min-w-[90px]">Service / Inquiry</th>
                    <th className="py-2.5 px-2 min-w-[90px]">Assigned To</th>
                    <th className="py-2.5 px-2 min-w-[95px]">Follow-up</th>
                    <th className="py-2.5 pl-2 pr-3 text-right min-w-[110px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-text-muted">
                        <RotateCcw className="w-5 h-5 animate-spin mx-auto mb-2 text-accent" />
                        <span>Loading directory records...</span>
                      </td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-text-muted">
                        <Users className="w-8 h-8 mx-auto mb-2 text-text-muted/40 stroke-[1.5]" />
                        <p className="font-semibold text-text-primary text-sm">No contacts found</p>
                        <p className="text-xs text-text-secondary mt-1">Try adjusting your search terms or filter chips.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust) => {
                      const isSelected = selectedCustomer?.id === cust.id;
                      const stageObj = STAGES.find((s) => s.id === cust.status) || STAGES[0];
                      const initials = (cust.name || cust.wa_profile_name || 'C')
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();

                      return (
                        <tr
                          key={cust.id}
                          onClick={() => onSelectCustomer(cust)}
                          className={`cursor-pointer transition-colors duration-150 group ${
                            isSelected ? 'bg-accent-subtle/40 border-l-2 border-l-accent' : 'hover:bg-surface-subtle/60'
                          }`}
                        >
                          {/* 1. Client & Contact (with Buying Intent below phone) */}
                          <td className="py-2 pl-3 pr-2">
                            <div className="flex items-start gap-2">
                              <div className="w-7 h-7 rounded-full bg-slate-100 border border-border flex items-center justify-center text-text-primary font-bold text-[10px] shrink-0 font-headline group-hover:border-accent/40 transition-colors mt-0.5">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-text-primary text-xs truncate max-w-[125px] sm:max-w-[140px]" title={cust.name || cust.wa_profile_name || 'Contact'}>
                                    {cust.name || cust.wa_profile_name || 'Contact'}
                                  </span>
                                  {(cust.completed_bookings_count ?? 0) > 0 || cust.client_type === 'repeat' ? (
                                    <span className="text-[9px] font-semibold px-1 py-0.2 rounded-xs bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 flex items-center gap-0.5">
                                      <UserCheck className="w-2.5 h-2.5" />
                                      <span>Repeat</span>
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-semibold px-1 py-0.2 rounded-xs bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                      New
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-text-muted font-mono flex items-center gap-1 mt-0.5">
                                  <Phone className="w-2.5 h-2.5 text-text-muted shrink-0" />
                                  <span className="truncate">{cust.phone}</span>
                                  {cust.location && (
                                    <>
                                      <span className="opacity-40">•</span>
                                      <span className="font-sans text-text-secondary truncate max-w-[80px]">{cust.location}</span>
                                    </>
                                  )}
                                </div>
                                {/* Buying Intent below phone number - Clean Minimalist Icon Badge (Zero Emojis) */}
                                <div className="mt-1 flex items-center" onClick={(e) => e.stopPropagation()}>
                                  <div
                                    className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.2 rounded-xs border shadow-2xs ${
                                      cust.lead_probability === 'hot'
                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                        : cust.lead_probability === 'cold'
                                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}
                                  >
                                    {cust.lead_probability === 'hot' ? (
                                      <Flame className="w-2.5 h-2.5 text-rose-600 stroke-[2] shrink-0" />
                                    ) : cust.lead_probability === 'cold' ? (
                                      <Snowflake className="w-2.5 h-2.5 text-sky-600 stroke-[2] shrink-0" />
                                    ) : (
                                      <Sun className="w-2.5 h-2.5 text-amber-600 stroke-[2] shrink-0" />
                                    )}
                                    <select
                                      value={cust.lead_probability || 'warm'}
                                      onChange={(e) => handleQuickUpdate(cust.id, { lead_probability: e.target.value as any })}
                                      disabled={updatingId === cust.id}
                                      className="bg-transparent text-[9px] font-bold uppercase tracking-wider cursor-pointer focus:outline-none border-none p-0 pr-0.5 text-inherit leading-none"
                                    >
                                      <option value="hot">Hot</option>
                                      <option value="warm">Warm</option>
                                      <option value="cold">Cold</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Notes (Visible right next to Client / Contact!) */}
                          <td className="py-2 px-2 max-w-[190px]" onClick={(e) => e.stopPropagation()}>
                            {cust.latest_note ? (
                              <div
                                onClick={() => (onOpenQuickNote ? onOpenQuickNote(cust) : onOpenDetails(cust))}
                                className="group/note flex items-start gap-1 p-1 px-1.5 rounded bg-amber-50/90 hover:bg-amber-100/90 border border-amber-200/90 cursor-pointer transition-all text-[10.5px] text-amber-950 shadow-2xs"
                                title="Click to view or edit this note"
                              >
                                <StickyNote className="w-2.5 h-2.5 text-amber-600 mt-0.5 shrink-0 stroke-[1.8]" />
                                <div className="min-w-0 flex-1">
                                  <p className="line-clamp-2 italic font-normal leading-snug break-words">
                                    "{cust.latest_note}"
                                  </p>
                                </div>
                                {onDeleteLatestNote && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteLatestNote(cust);
                                    }}
                                    className="opacity-0 group-hover/note:opacity-100 text-text-muted hover:text-rose-600 p-0.5 transition-opacity shrink-0 cursor-pointer"
                                    title="Delete note"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => (onOpenQuickNote ? onOpenQuickNote(cust) : onOpenDetails(cust))}
                                className="text-[10px] text-text-muted hover:text-accent font-medium flex items-center gap-1 px-1.5 py-0.5 rounded border border-dashed border-border hover:border-accent transition-colors cursor-pointer"
                                title="Add note"
                              >
                                <Plus className="w-2.5 h-2.5" />
                                <span>+ Note</span>
                              </button>
                            )}
                          </td>

                          {/* 3. Status Dropdown - Single Universal Business Stages */}
                          <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={cust.status || 'new'}
                              onChange={(e) => handleQuickUpdate(cust.id, { status: e.target.value as any })}
                              disabled={updatingId === cust.id}
                              className={`text-[10.5px] font-semibold px-1.5 py-1 h-7 rounded-sm border cursor-pointer transition-all shadow-2xs w-full max-w-[115px] truncate ${stageObj.bg} ${stageObj.text} ${stageObj.border}`}
                            >
                              {STAGES.map((st) => (
                                <option key={st.id} value={st.id}>
                                  {st.label}
                                </option>
                              ))}
                              {/* Support existing legacy custom outcome if present */}
                              {cust.status && !STAGES.some((s) => s.id === cust.status) && (
                                <option value={cust.status}>
                                  {cust.status}
                                </option>
                              )}
                            </select>
                          </td>

                          {/* 4. Service / Inquiry */}
                          <td className="py-2 px-2">
                            {cust.health_concern || cust.last_visit_service ? (
                              <span
                                className="text-[10.5px] font-medium text-text-secondary bg-surface-subtle border border-border/80 px-1.5 py-0.5 rounded-sm inline-block max-w-[115px] truncate"
                                title={cust.health_concern || cust.last_visit_service || ''}
                              >
                                {cust.health_concern || cust.last_visit_service}
                              </span>
                            ) : (
                              <span className="text-text-muted text-[11px]">—</span>
                            )}
                          </td>

                          {/* 5. Assigned To Dropdown */}
                          <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={cust.preferred_doctor || ''}
                              onChange={(e) => handleQuickUpdate(cust.id, { preferred_doctor: e.target.value })}
                              disabled={updatingId === cust.id}
                              className="text-[10.5px] font-medium px-1.5 py-1 h-7 rounded-sm border border-border bg-surface text-text-primary focus:outline-none focus:border-accent cursor-pointer w-full max-w-[105px] truncate shadow-2xs"
                            >
                              <option value="">Unassigned</option>
                              {staffList.map((st) => (
                                <option key={st.value} value={st.value}>
                                  {st.label}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* 6. Follow-up Date & Schedule Button */}
                          <td className="py-2 px-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-col gap-1 items-start relative">
                              {cust.followup_date ? (
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setSchedulingCustomerId(schedulingCustomerId === cust.id ? null : cust.id)}
                                    className="cursor-pointer hover:opacity-80 transition-opacity text-[10px]"
                                    title="Click to reschedule follow-up"
                                  >
                                    {getFollowupBadge(cust.followup_date)}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickUpdate(cust.id, { followup_date: null as any, followup_time: null as any })}
                                    className="p-0.5 rounded text-text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Clear follow-up"
                                  >
                                    <X className="w-2.5 h-2.5 stroke-[1.8]" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setSchedulingCustomerId(schedulingCustomerId === cust.id ? null : cust.id)}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm border border-dashed border-border hover:border-accent bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary text-[10px] font-medium transition-colors shadow-2xs group cursor-pointer h-6"
                                  title="Click to schedule a follow-up date"
                                >
                                  <CalendarPlus className="w-2.5 h-2.5 text-accent stroke-[2]" />
                                  <span>Schedule</span>
                                </button>
                              )}

                              {/* Next Action Dropdown */}
                              <select
                                value={cust.next_action || 'Call Again'}
                                onChange={(e) => handleQuickUpdate(cust.id, { next_action: e.target.value })}
                                disabled={updatingId === cust.id}
                                className="text-[9.5px] text-text-secondary bg-surface-subtle hover:bg-surface border border-border/70 px-1 py-0.5 h-6 rounded-xs font-medium cursor-pointer focus:outline-none focus:border-accent transition-colors w-full max-w-[105px] truncate shadow-2xs"
                                title="Next Action"
                              >
                                {nextActions.length > 0 ? (
                                  nextActions.map((act) => (
                                    <option key={act} value={act}>
                                      {act}
                                    </option>
                                  ))
                                ) : (
                                  <>
                                    <option value="Call Again">Call Again</option>
                                    <option value="WhatsApp Follow-up">WhatsApp Follow-up</option>
                                    <option value="Send Info / Proposal">Send Info / Proposal</option>
                                    <option value="Schedule Meeting / Booking">Schedule Meeting / Booking</option>
                                    <option value="Send Reminder">Send Reminder</option>
                                    <option value="Waiting on Client">Waiting on Client</option>
                                    <option value="Final Attempt">Final Attempt</option>
                                  </>
                                )}
                              </select>

                              {/* Floating Schedule Popover */}
                              {schedulingCustomerId === cust.id && (
                                <FollowupSchedulerPopover
                                  currentDate={cust.followup_date}
                                  currentTime={cust.followup_time}
                                  onSelect={(newDate, newTime) => {
                                    handleQuickUpdate(cust.id, {
                                      followup_date: newDate,
                                      followup_time: newTime || '10:00 AM',
                                    });
                                    setSchedulingCustomerId(null);
                                  }}
                                  onClear={() => {
                                    handleQuickUpdate(cust.id, {
                                      followup_date: null as any,
                                      followup_time: null as any,
                                    });
                                    setSchedulingCustomerId(null);
                                  }}
                                  onClose={() => setSchedulingCustomerId(null)}
                                />
                              )}
                            </div>
                          </td>

                          {/* 7. Actions */}
                          <td className="py-2 pl-2 pr-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                type="button"
                                onClick={() => onOpenChat(cust)}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold rounded-sm border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="Open live WhatsApp chat in popup"
                              >
                                <WhatsAppIcon className="w-3 h-3 text-[#25D366]" />
                                <span>Chat</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenDetails(cust)}
                                className="px-2 py-1 bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary text-[11px] font-medium rounded-sm border border-border transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="View customer details in popup"
                              >
                                <User className="w-3 h-3 stroke-[1.5]" />
                                <span>Details</span>
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
          </div>
        )}

        {/* KANBAN FUNNEL VIEW - COMPLETE WITH PHASE COLORS & SINGLE-VIEW RESPONSIVENESS */}
        {viewMode === 'kanban' && (
          <div className="flex-1 min-h-0 flex md:grid md:grid-cols-5 gap-2 pb-1 w-full overflow-x-auto md:overflow-x-hidden">
            {[
              {
                id: 'new',
                label: 'New Inquiry',
                dot: 'bg-blue-500 shadow-xs shadow-blue-500/40',
                topBar: 'bg-blue-500',
                colBg: 'bg-blue-50/40 dark:bg-blue-950/20',
                headerBg: 'bg-blue-50/90 dark:bg-blue-900/40',
                headerBorder: 'border-blue-200/70 dark:border-blue-800/40',
                headerText: 'text-blue-950 dark:text-blue-100',
                border: 'border-blue-200/60 dark:border-blue-800/30',
                badge: 'bg-blue-100/90 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border border-blue-200/60',
                cardHover: 'hover:border-blue-400/50',
              },
              {
                id: 'contacted',
                label: 'Contacted / In Progress',
                dot: 'bg-indigo-500 shadow-xs shadow-indigo-500/40',
                topBar: 'bg-indigo-500',
                colBg: 'bg-indigo-50/40 dark:bg-indigo-950/20',
                headerBg: 'bg-indigo-50/90 dark:bg-indigo-900/40',
                headerBorder: 'border-indigo-200/70 dark:border-indigo-800/40',
                headerText: 'text-indigo-950 dark:text-indigo-100',
                border: 'border-indigo-200/60 dark:border-indigo-800/30',
                badge: 'bg-indigo-100/90 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 border border-indigo-200/60',
                cardHover: 'hover:border-indigo-400/50',
              },
              {
                id: 'follow-up',
                label: 'Follow-up Due',
                dot: 'bg-amber-500 shadow-xs shadow-amber-500/40',
                topBar: 'bg-amber-500',
                colBg: 'bg-amber-50/40 dark:bg-amber-950/20',
                headerBg: 'bg-amber-50/90 dark:bg-amber-900/40',
                headerBorder: 'border-amber-200/70 dark:border-amber-800/40',
                headerText: 'text-amber-950 dark:text-amber-100',
                border: 'border-amber-200/60 dark:border-amber-800/30',
                badge: 'bg-amber-100/90 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-200/60',
                cardHover: 'hover:border-amber-400/50',
              },
              {
                id: 'converted',
                label: 'Booked / Converted',
                dot: 'bg-emerald-500 shadow-xs shadow-emerald-500/40',
                topBar: 'bg-emerald-500',
                colBg: 'bg-emerald-50/40 dark:bg-emerald-950/20',
                headerBg: 'bg-emerald-50/90 dark:bg-emerald-900/40',
                headerBorder: 'border-emerald-200/70 dark:border-emerald-800/40',
                headerText: 'text-emerald-950 dark:text-emerald-100',
                border: 'border-emerald-200/60 dark:border-emerald-800/30',
                badge: 'bg-emerald-100/90 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-200/60',
                cardHover: 'hover:border-emerald-400/50',
              },
              {
                id: 'lost',
                label: 'Lost / Inactive',
                dot: 'bg-slate-400 shadow-xs shadow-slate-400/40',
                topBar: 'bg-slate-400',
                colBg: 'bg-slate-50/50 dark:bg-slate-900/30',
                headerBg: 'bg-slate-100/80 dark:bg-slate-900/50',
                headerBorder: 'border-slate-200/70 dark:border-slate-800/40',
                headerText: 'text-slate-800 dark:text-slate-200',
                border: 'border-slate-200/70 dark:border-slate-800/30',
                badge: 'bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300/60',
                cardHover: 'hover:border-slate-400/50',
              },
            ].map((col) => {
              const colLeads = filteredCustomers.filter((c) => c.status === col.id);
              const isDropTarget = dragOverStage === col.id;
              return (
                <div
                  key={col.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverStage !== col.id) {
                      setDragOverStage(col.id);
                    }
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setDragOverStage(col.id);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setDragOverStage((current) => (current === col.id ? null : current));
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const droppedId = e.dataTransfer.getData('text/plain') || draggedCustomerId;
                    if (droppedId) {
                      handleDropLead(col.id, droppedId);
                    }
                  }}
                  className={`w-[260px] shrink-0 md:w-auto md:shrink md:flex-1 ${col.colBg} border ${
                    isDropTarget ? 'border-accent ring-2 ring-accent/40 bg-accent/5' : col.border
                  } rounded-md flex flex-col h-full overflow-hidden shadow-2xs transition-colors`}
                >
                  {/* Phase Top Accent Bar */}
                  <div className={`h-1 w-full ${col.topBar}`} />

                  {/* Column Header */}
                  <div className={`p-2 border-b ${col.headerBorder} ${col.headerBg} flex items-center justify-between shrink-0`}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
                      <h4 className={`font-bold text-[11px] ${col.headerText} truncate font-headline`} title={col.label}>
                        {col.label}
                      </h4>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono shrink-0 ml-1 ${col.badge}`}>
                      {colLeads.length}
                    </span>
                  </div>

                  {/* Column Card List */}
                  <div className="p-1.5 flex-1 overflow-y-auto space-y-1.5 min-h-0 scrollbar-thin">
                    {/* Active Drop Guide */}
                    {isDropTarget && draggedCustomerId && !colLeads.some((c) => c.id === draggedCustomerId) && (
                      <div className="p-2 border-2 border-dashed border-accent/70 bg-accent/10 rounded-sm text-center text-[10px] font-semibold text-accent animate-pulse">
                        Drop to move here
                      </div>
                    )}
                    {colLeads.length === 0 && (!isDropTarget || !draggedCustomerId) ? (
                      <div className="p-4 text-center text-text-muted text-[11px] border border-dashed border-border/70 rounded-sm bg-surface/40">
                        No contacts
                      </div>
                    ) : (
                      colLeads.map((cust) => {
                        const isSelected = selectedCustomer?.id === cust.id;
                        const isDragging = draggedCustomerId === cust.id;
                        return (
                          <div
                            key={cust.id}
                            draggable
                            onDragStart={(e) => {
                              setDraggedCustomerId(cust.id);
                              e.dataTransfer.setData('text/plain', cust.id);
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragEnd={() => {
                              setDraggedCustomerId(null);
                              setDragOverStage(null);
                            }}
                            onClick={() => onSelectCustomer(cust)}
                            className={`p-2 bg-surface dark:bg-surface border rounded-sm shadow-2xs hover:shadow-xs ${col.cardHover} transition-all cursor-grab active:cursor-grabbing select-none space-y-1.5 ${
                              isSelected ? 'border-accent ring-1 ring-accent' : 'border-border/80'
                            } ${isDragging ? 'opacity-40 border-dashed border-accent' : ''}`}
                          >
                            {/* Card Header: Drag Handle, Name & Temperature */}
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex items-center gap-1 min-w-0 flex-1">
                                <GripVertical className="w-3 h-3 text-text-muted/50 hover:text-text-muted shrink-0 -ml-0.5 cursor-grab" />
                                <div className="min-w-0 flex-1">
                                  <h5 className="font-bold text-[11px] text-text-primary hover:text-accent transition-colors truncate leading-tight">
                                    {cust.name || cust.wa_profile_name || 'Contact'}
                                  </h5>
                                  <p className="text-[9.5px] text-text-muted font-mono leading-none mt-0.5 truncate">{cust.phone}</p>
                                </div>
                              </div>
                              <span
                                className={`inline-flex items-center gap-0.5 text-[8.5px] font-bold px-1 py-0.2 rounded-xs uppercase tracking-wider shrink-0 ${
                                  cust.lead_probability === 'hot'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                                    : cust.lead_probability === 'cold'
                                    ? 'bg-sky-50 text-sky-700 border border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                }`}
                              >
                                {cust.lead_probability === 'hot' ? (
                                  <Flame className="w-2.5 h-2.5 text-rose-600 stroke-[2] shrink-0" />
                                ) : cust.lead_probability === 'cold' ? (
                                  <Snowflake className="w-2.5 h-2.5 text-sky-600 stroke-[2] shrink-0" />
                                ) : (
                                  <Sun className="w-2.5 h-2.5 text-amber-600 stroke-[2] shrink-0" />
                                )}
                                <span>{cust.lead_probability || 'warm'}</span>
                              </span>
                            </div>

                            {/* Service / Inquiry tag */}
                            {(cust.health_concern || cust.last_visit_service) && (
                              <p className="text-[9px] text-text-secondary bg-surface-subtle px-1.5 py-0.5 rounded-xs border border-border/50 truncate font-medium block">
                                {cust.health_concern || cust.last_visit_service}
                              </p>
                            )}

                            {/* Inline Note Snippet */}
                            {cust.latest_note && (
                              <div className="px-1.5 py-1 rounded-xs bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/40 text-amber-950 dark:text-amber-200 text-[9.5px] leading-snug line-clamp-2 italic">
                                "{cust.latest_note}"
                              </div>
                            )}

                            {/* Card Footer: Follow-up & Chat Button */}
                            <div
                              draggable={false}
                              onDragStart={(e) => e.stopPropagation()}
                              className="flex items-center justify-between pt-1 border-t border-border/50 text-[9.5px] relative"
                            >
                              <div className="min-w-0">
                                {cust.followup_date ? (
                                  <button
                                    type="button"
                                    draggable={false}
                                    onDragStart={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSchedulingCustomerId(schedulingCustomerId === cust.id ? null : cust.id);
                                    }}
                                    className="cursor-pointer hover:opacity-80 truncate block text-[9.5px]"
                                    title="Click to reschedule"
                                  >
                                    {getFollowupBadge(cust.followup_date)}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    draggable={false}
                                    onDragStart={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSchedulingCustomerId(schedulingCustomerId === cust.id ? null : cust.id);
                                    }}
                                    className="inline-flex items-center gap-1 text-[9.5px] text-text-muted hover:text-accent font-medium cursor-pointer"
                                    title="Click to schedule follow-up"
                                  >
                                    <CalendarPlus className="w-3 h-3 text-accent stroke-[1.8]" />
                                    <span>Schedule</span>
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  draggable={false}
                                  onDragStart={(e) => e.stopPropagation()}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenChat(cust);
                                  }}
                                  className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold rounded-xs border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1 shadow-2xs text-[9.5px] cursor-pointer"
                                  title="Open live WhatsApp chat in popup"
                                >
                                  <WhatsAppIcon className="w-2.5 h-2.5 text-[#25D366]" />
                                  <span>Chat</span>
                                </button>
                              </div>

                              {/* Popover inside Kanban card */}
                              {schedulingCustomerId === cust.id && (
                                <FollowupSchedulerPopover
                                  currentDate={cust.followup_date}
                                  currentTime={cust.followup_time}
                                  onSelect={(newDate, newTime) => {
                                    handleQuickUpdate(cust.id, {
                                      followup_date: newDate,
                                      followup_time: newTime || '10:00 AM',
                                    });
                                    setSchedulingCustomerId(null);
                                  }}
                                  onClear={() => {
                                    handleQuickUpdate(cust.id, {
                                      followup_date: null as any,
                                      followup_time: null as any,
                                    });
                                    setSchedulingCustomerId(null);
                                  }}
                                  onClose={() => setSchedulingCustomerId(null)}
                                />
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TASKS VIEW */}
        {viewMode === 'tasks' && (
          <div className="flex-1 flex flex-col border border-border rounded-md bg-surface p-4 overflow-y-auto space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h4 className="font-bold text-sm text-text-primary">Scheduled Follow-up Tasks</h4>
                <p className="text-xs text-text-muted">Manage scheduled follow-ups, calls, and appointments.</p>
              </div>
              {onAddTask && (
                <button
                  type="button"
                  onClick={onAddTask}
                  className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Task</span>
                </button>
              )}
            </div>

            {loadingTasks ? (
              <p className="text-xs text-text-muted text-center py-8">Loading tasks...</p>
            ) : safeTasks.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-xs">No pending tasks found.</div>
            ) : (
              <div className="space-y-2">
                {safeTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 bg-surface-subtle border border-border rounded-md flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-text-primary">{t.title}</p>
                      {t.description && <p className="text-[11px] text-text-secondary mt-0.5">{t.description}</p>}
                      <div className="flex items-center gap-2 text-[10px] text-text-muted font-mono mt-1">
                        {t.due_date && <span>Due: {t.due_date}</span>}
                        {t.assigned_to && <span>• Assigned: {t.assigned_to}</span>}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase ${
                        t.completed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {t.completed ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NOTES VIEW */}
        {viewMode === 'notes' && (
          <div className="flex-1 flex flex-col border border-border rounded-md bg-surface p-4 overflow-y-auto space-y-3">
            <div className="border-b border-border pb-3">
              <h4 className="font-bold text-sm text-text-primary">Client Activity & Discussion Notes</h4>
              <p className="text-xs text-text-muted">Chronological history of notes logged across all customer profiles.</p>
            </div>

            {loadingNotes ? (
              <p className="text-xs text-text-muted text-center py-8">Loading notes...</p>
            ) : safeAllNotes.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-xs">No activity notes recorded yet.</div>
            ) : (
              <div className="space-y-2">
                {safeAllNotes.map((nt) => (
                  <div key={nt.id} className="p-3 bg-surface-subtle border border-border rounded-md space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-text-primary">{nt.customer_name || 'Customer'}</span>
                      <span className="text-[10px] text-text-muted font-mono">
                        {nt.created_at ? new Date(nt.created_at).toLocaleString() : ''}
                      </span>
                    </div>
                    <p className="text-xs text-text-body whitespace-pre-wrap">{nt.note_text}</p>
                    <div className="flex items-center justify-between text-[10px] text-text-muted pt-1 border-t border-border/60">
                      <span>By: {nt.author || 'Admin'}</span>
                      {onDeleteNote && (
                        <button
                          type="button"
                          onClick={() => onDeleteNote(nt.id)}
                          className="text-text-muted hover:text-rose-600 transition-colors p-0.5"
                          title="Delete note"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Integrated Customer Detail & WhatsApp Drawer */}
        {renderDrawer()}
      </div>
    </div>
  );
}

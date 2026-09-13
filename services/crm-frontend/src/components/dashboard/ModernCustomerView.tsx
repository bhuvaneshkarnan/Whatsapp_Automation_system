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
} from 'lucide-react';
import { Customer, FollowupTask, CrmDropdownOptions } from '@/lib/api';

// WhatsApp SVG Icon
function WhatsAppIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.96.541 1.78.82 2.79.82 3.18 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.767-5.766zm3.393 8.167c-.145.407-.847.773-1.182.809-.327.035-.745.059-2.39-.623-1.979-.82-3.247-2.83-3.344-2.961-.097-.132-.806-1.074-.806-2.043 0-.969.508-1.446.689-1.644.181-.198.396-.247.528-.247.132 0 .265.001.382.007.123.006.287-.046.45.344.163.39.558 1.359.607 1.458.049.099.082.215.016.347-.066.132-.099.214-.197.33-.099.115-.208.257-.297.345-.1.099-.204.207-.088.406.116.199.516.852 1.109 1.38.763.679 1.407.888 1.606.987.199.099.314.082.43-.05.116-.132.496-.578.628-.776.132-.198.265-.165.446-.099.181.066 1.157.545 1.355.644.198.099.33.149.38.231.05.082.05.479-.095.886z" />
    </svg>
  );
}

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
  tasks: FollowupTask[];
  allNotes: any[];
  taxonomy: any;
  renderDrawer: () => React.ReactNode;
  categorizedStaffOptions: {
    all: { value: string; label: string; isDoctor?: boolean }[];
    predefinedDoctors: { value: string; label: string }[];
    regularStaff: { value: string; label: string }[];
  };
  crmDropdowns: CrmDropdownOptions;
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

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (c.name || '').toLowerCase().includes(q);
        const matchesPhone = (c.phone || '').toLowerCase().includes(q);
        const matchesLocation = (c.location || '').toLowerCase().includes(q);
        const matchesConcern = (c.health_concern || '').toLowerCase().includes(q);
        const matchesService = (c.last_visit_service || '').toLowerCase().includes(q);
        const matchesStaff = (c.preferred_doctor || '').toLowerCase().includes(q);
        const matchesNote = (c.latest_note || '').toLowerCase().includes(q);
        const matchesNextAction = (c.next_action || '').toLowerCase().includes(q);
        if (
          !matchesName &&
          !matchesPhone &&
          !matchesLocation &&
          !matchesConcern &&
          !matchesService &&
          !matchesStaff &&
          !matchesNote &&
          !matchesNextAction
        ) {
          return false;
        }
      }

      // Stage
      if (stageFilter === 'action_due') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (!c.followup_date || c.followup_date > todayStr || c.status === 'converted' || c.status === 'lost') {
          return false;
        }
      } else if (stageFilter !== 'all') {
        if (c.status !== stageFilter) return false;
      }

      // Warmth
      if (warmthFilter !== 'all') {
        if (c.lead_probability !== warmthFilter) return false;
      }

      // Staff
      if (staffFilter !== 'all') {
        if (staffFilter === 'unassigned') {
          if (c.preferred_doctor) return false;
        } else if (c.preferred_doctor !== staffFilter) {
          return false;
        }
      }

      return true;
    });
  }, [customers, searchQuery, stageFilter, warmthFilter, staffFilter]);

  // Quick field updates
  const handleQuickUpdate = async (customerId: string, patch: Partial<Customer>) => {
    try {
      setUpdatingId(customerId);
      await onUpdateCustomer(customerId, patch);
    } finally {
      setUpdatingId(null);
    }
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
    <div className="flex-1 flex flex-col overflow-hidden space-y-2.5">
      {/* ── 1. EXECUTIVE KPI SUMMARY BAR ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {/* Total Leads */}
        <div className="bg-surface border border-border rounded-md p-3 shadow-2xs hover:border-border-strong transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Total Pipeline</span>
            <div className="w-7 h-7 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Users className="w-3.5 h-3.5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-text-primary tracking-tight font-headline">{kpis.total}</span>
            <span className="text-[11px] text-text-secondary font-medium">active leads</span>
          </div>
        </div>

        {/* Hot Opportunities */}
        <div
          onClick={() => setWarmthFilter(warmthFilter === 'hot' ? 'all' : 'hot')}
          className={`bg-surface border rounded-md p-3 shadow-2xs transition-all cursor-pointer ${
            warmthFilter === 'hot' ? 'border-rose-400 ring-1 ring-rose-400 bg-rose-50/20' : 'border-border hover:border-rose-300'
          }`}
          title="Click to toggle Hot Leads filter"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Hot Intent</span>
            <div className="w-7 h-7 rounded-md bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <Flame className="w-3.5 h-3.5 fill-rose-500/20 stroke-[2]" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-rose-600 tracking-tight font-headline">{kpis.hotLeads}</span>
            <span className="text-[11px] text-text-secondary font-medium">ready to convert</span>
          </div>
        </div>

        {/* Action Due */}
        <div
          onClick={() => setStageFilter(stageFilter === 'action_due' ? 'all' : 'action_due')}
          className={`bg-surface border rounded-md p-3 shadow-2xs transition-all cursor-pointer ${
            stageFilter === 'action_due' ? 'border-amber-400 ring-1 ring-amber-400 bg-amber-50/20' : 'border-border hover:border-amber-300'
          }`}
          title="Click to toggle Follow-ups Due filter"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Follow-ups Due</span>
            <div className="w-7 h-7 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <CalendarClock className="w-3.5 h-3.5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-amber-700 tracking-tight font-headline">{kpis.followupsDue}</span>
            <span className="text-[11px] text-text-secondary font-medium">today or overdue</span>
          </div>
        </div>

        {/* Converted / Win Rate */}
        <div className="bg-surface border border-border rounded-md p-3 shadow-2xs hover:border-border-strong transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Deals Closed</span>
            <div className="w-7 h-7 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-700 tracking-tight font-headline">{kpis.converted}</span>
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-xs">
              {kpis.winRate}% win rate
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. VIEW SWITCHER & TOOLBAR ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-surface border border-border rounded-md p-2 shadow-2xs shrink-0">
        {/* Left: View Mode Pills & Total Count */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 bg-surface-subtle border border-border rounded-md p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-sm transition-all cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-sm transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-surface text-text-primary border border-border shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 stroke-[2]" />
              <span>Pipeline Funnel</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tasks')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-sm transition-all cursor-pointer ${
                viewMode === 'tasks'
                  ? 'bg-surface text-text-primary border border-border shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5 stroke-[2]" />
              <span>Tasks</span>
              <span className="text-[10px] text-text-muted font-mono ml-0.5">
                ({tasks.filter((t) => !t.completed).length})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('notes')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-sm transition-all cursor-pointer ${
                viewMode === 'notes'
                  ? 'bg-surface text-text-primary border border-border shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <StickyNote className="w-3.5 h-3.5 stroke-[2]" />
              <span>Notes</span>
              <span className="text-[10px] text-text-muted font-mono ml-0.5">({allNotes.length})</span>
            </button>
          </div>

          {openDropdownOptionsModal && (
            <button
              type="button"
              onClick={openDropdownOptionsModal}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary border border-border text-xs font-medium rounded-sm transition-colors cursor-pointer"
              title="Customize CRM stages and options"
            >
              <Sliders className="w-3.5 h-3.5 stroke-[1.8]" />
              <span className="hidden sm:inline">Options</span>
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            type="button"
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary border border-border text-xs font-medium rounded-sm transition-colors cursor-pointer"
            title="Export leads to CSV"
          >
            <Download className="w-3.5 h-3.5 stroke-[1.8]" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="p-1.5 bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary border border-border rounded-sm transition-colors cursor-pointer"
            title="Refresh Leads"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onAddCustomer}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-sm transition-all shadow-2xs hover:shadow-xs cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 stroke-[2]" />
            <span>+ Add Lead</span>
          </button>
        </div>
      </div>

      {/* ── 3. SEARCH & QUICK FILTER BAR ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-surface border border-border rounded-md p-2 shrink-0">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search leads, phone, notes, requirement, staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1 bg-surface-subtle border border-border rounded-md text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:bg-surface h-8"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {/* Stage pills */}
          <div className="flex items-center gap-0.5 bg-surface-subtle border border-border/80 rounded-sm p-0.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'new', label: 'New' },
              { id: 'contacted', label: 'Discussion' },
              { id: 'follow-up', label: 'Follow-up' },
              { id: 'converted', label: 'Won' },
              { id: 'lost', label: 'Lost' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStageFilter(st.id)}
                className={`px-2 py-0.5 text-[11px] rounded-xs font-medium cursor-pointer transition-colors ${
                  stageFilter === st.id
                    ? 'bg-surface border border-border text-text-primary font-semibold shadow-2xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-border/80" />

          {/* Temperature pills */}
          <div className="flex items-center gap-0.5 bg-surface-subtle border border-border/80 rounded-sm p-0.5">
            {[
              { id: 'all', label: 'All Temp' },
              { id: 'hot', label: '🔥 Hot' },
              { id: 'warm', label: '⚡ Warm' },
              { id: 'cold', label: '❄️ Cold' },
            ].map((tp) => (
              <button
                key={tp.id}
                type="button"
                onClick={() => setWarmthFilter(tp.id)}
                className={`px-2 py-0.5 text-[11px] rounded-xs font-medium cursor-pointer transition-colors ${
                  warmthFilter === tp.id
                    ? 'bg-surface border border-border text-text-primary font-semibold shadow-2xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tp.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 4. VIEW CONTENT AREA ────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden gap-3">
        {/* TABLE VIEW - CLEAN, COMPREHENSIVE WITH INLINE NOTES */}
        {viewMode === 'table' && (
          <div className={`flex-1 flex flex-col border border-border rounded-md bg-surface overflow-hidden ${selectedCustomer ? 'hidden md:flex min-w-0' : ''}`}>
            <div className="flex-1 overflow-y-auto overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[1000px]">
                <thead className="bg-surface-subtle/80 border-b border-border text-text-secondary font-semibold text-[11px] uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="p-3 pl-4 w-[42%]">Lead, Requirements & Activity Notes</th>
                    <th className="p-3 w-[26%]">Status & Account Owner</th>
                    <th className="p-3 w-[32%] pr-4">Follow-up Schedule & Next Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="p-12 text-center text-text-muted">
                        <RotateCcw className="w-5 h-5 animate-spin mx-auto mb-2 text-accent" />
                        <span>Loading pipeline data...</span>
                      </td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-12 text-center text-text-muted">
                        <Users className="w-8 h-8 mx-auto mb-2 text-text-muted/40 stroke-[1.5]" />
                        <p className="font-semibold text-text-primary text-sm">No leads found</p>
                        <p className="text-xs text-text-secondary mt-1">Try adjusting your search terms or filter chips.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust) => {
                      const isSelected = selectedCustomer?.id === cust.id;
                      const initials = (cust.name || cust.wa_profile_name || 'L')
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();

                      return (
                        <tr
                          key={cust.id}
                          onClick={() => onSelectCustomer(cust)}
                          className={`cursor-pointer transition-colors duration-150 ${
                            isSelected ? 'bg-accent-subtle/40 border-l-4 border-l-accent' : 'hover:bg-surface-subtle/60'
                          }`}
                        >
                          {/* ── COL 1: LEAD IDENTITY, REQUIREMENT & NOTES ── */}
                          <td className="pt-3 pb-3.5 pl-4 pr-3 align-top">
                            <div className="space-y-2 min-w-0">
                              {/* Row 1: Avatar, Name & Lead Badges */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded-full bg-slate-100 border border-border flex items-center justify-center text-text-primary font-bold text-xs shrink-0 font-headline">
                                    {initials}
                                  </div>
                                  <span className="font-bold text-text-primary text-[13px] tracking-tight truncate">
                                    {cust.name || cust.wa_profile_name || 'Lead'}
                                  </span>
                                  {(cust.completed_bookings_count ?? 0) > 0 || cust.client_type === 'repeat' ? (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-0.5 shrink-0">
                                      <UserCheck className="w-2.5 h-2.5" />
                                      <span>Repeat</span>
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-0.5 shrink-0">
                                      <UserPlus className="w-2.5 h-2.5" />
                                      <span>Lead</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Row 2: Phone, Location & Last WhatsApp relative time */}
                              <div className="flex items-center gap-2 font-mono text-[11px] text-text-muted flex-wrap">
                                <span className="font-medium text-text-secondary">{cust.phone}</span>
                                {cust.location && (
                                  <>
                                    <span className="opacity-40">•</span>
                                    <span className="font-sans text-[11px] text-text-secondary flex items-center gap-1">
                                      <MapPin className="w-2.5 h-2.5 text-text-muted" />
                                      {cust.location}
                                    </span>
                                  </>
                                )}
                                {cust.last_chat_at && (
                                  <>
                                    <span className="opacity-40">•</span>
                                    <span className="text-[10px] text-text-secondary flex items-center gap-1 font-sans">
                                      <Clock className="w-2.5 h-2.5 text-text-muted" />
                                      <span>Last: {formatTimeAgo(cust.last_chat_at)}</span>
                                    </span>
                                  </>
                                )}
                              </div>

                              {/* Row 3: Latest WhatsApp Message Snippet */}
                              {cust.last_message && (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenChat(cust);
                                  }}
                                  className="flex items-center gap-1.5 text-[11px] text-text-secondary hover:text-emerald-700 group cursor-pointer max-w-full truncate pt-0.5"
                                  title={`Latest WhatsApp: "${cust.last_message}" (Click to view chat)`}
                                >
                                  <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366] shrink-0 group-hover:scale-110 transition-transform" />
                                  <span className="truncate italic font-medium">"{cust.last_message}"</span>
                                </div>
                              )}

                              {/* Row 4: Requirement Tag & Add Note Button */}
                              <div className="flex items-center gap-1.5 flex-wrap pt-0.5" onClick={(e) => e.stopPropagation()}>
                                {(cust.health_concern || cust.last_visit_service) && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-sm font-semibold border bg-blue-50 text-blue-700 border-blue-200">
                                    {cust.health_concern || cust.last_visit_service}
                                  </span>
                                )}

                                {!cust.latest_note && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onOpenQuickNote) {
                                        onOpenQuickNote(cust);
                                      } else {
                                        onOpenDetails(cust);
                                      }
                                    }}
                                    className="text-[10px] font-semibold text-accent hover:underline flex items-center gap-1 px-2 py-0.5 rounded border border-dashed border-accent/50 hover:bg-surface-subtle transition-colors cursor-pointer"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                    <span>+ Add Note</span>
                                  </button>
                                )}
                              </div>

                              {/* Row 5: INLINE NOTE CARD (Full, clean, and visible) */}
                              {cust.latest_note && (
                                <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                                  <div
                                    className={`group/note inline-flex items-start gap-2 py-1.5 px-2.5 rounded-md border text-[11px] leading-relaxed transition-all shadow-2xs w-full max-w-full ${getNoteCardStyle(
                                      cust.latest_note_color
                                    )}`}
                                  >
                                    <StickyNote className="w-3.5 h-3.5 mt-0.5 shrink-0 text-accent opacity-80" />
                                    <div
                                      className="cursor-pointer select-text flex-1 min-w-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onOpenQuickNote) {
                                          onOpenQuickNote(cust);
                                        } else {
                                          onOpenDetails(cust);
                                        }
                                      }}
                                      title="Click to edit this note"
                                    >
                                      <p className="font-normal whitespace-pre-wrap break-words italic">
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
                                        className="p-1 rounded text-text-muted hover:text-rose-600 hover:bg-rose-100/70 transition-colors opacity-70 group-hover/note:opacity-100 cursor-pointer shrink-0"
                                        title="Delete this note"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Row 6: Bottom Quick Actions Bar */}
                              <div className="flex items-center gap-2 pt-1 border-t border-border/40" onClick={(e) => e.stopPropagation()}>
                                {/* Warmth Selector */}
                                <select
                                  value={cust.lead_probability || 'warm'}
                                  onChange={(e) => handleQuickUpdate(cust.id, { lead_probability: e.target.value as any })}
                                  disabled={updatingId === cust.id}
                                  className={`h-6 text-[10px] font-bold px-2 py-0.5 rounded-md border cursor-pointer uppercase tracking-wider ${
                                    cust.lead_probability === 'hot'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : cust.lead_probability === 'cold'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}
                                >
                                  <option value="hot">🔥 Hot (90%)</option>
                                  <option value="warm">⚡ Warm (50%)</option>
                                  <option value="cold">❄️ Cold (20%)</option>
                                </select>

                                {/* WhatsApp Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenChat(cust);
                                  }}
                                  className="h-6 px-2.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] border border-[#25D366]/30 rounded-md flex items-center gap-1 text-[10px] font-bold transition-all shadow-2xs cursor-pointer"
                                  title="Open live WhatsApp chat in drawer"
                                >
                                  <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
                                  <span>WhatsApp</span>
                                </button>

                                {/* Details Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenDetails(cust);
                                  }}
                                  className="h-6 px-2 bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary border border-border rounded-md flex items-center gap-1 text-[10px] font-medium transition-colors shadow-2xs cursor-pointer"
                                  title="View customer profile & history"
                                >
                                  <User className="w-3 h-3 stroke-[1.8]" />
                                  <span>Details</span>
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* ── COL 2: STATUS & ACCOUNT OWNER ── */}
                          <td className="pt-3 pb-3 px-3 align-top" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-2 max-w-[220px]">
                              {/* Account Owner Dropdown */}
                              <div>
                                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                                  Account Owner
                                </label>
                                <select
                                  value={cust.preferred_doctor || ''}
                                  onChange={(e) => handleQuickUpdate(cust.id, { preferred_doctor: e.target.value })}
                                  disabled={updatingId === cust.id}
                                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-md border border-border bg-surface text-text-primary focus:outline-none focus:border-accent cursor-pointer shadow-2xs"
                                >
                                  <option value="">Unassigned</option>
                                  {categorizedStaffOptions.all.map((st) => (
                                    <option key={st.value} value={st.value}>
                                      {st.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Status / Outcome Dropdown */}
                              <div>
                                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                                  Outcome / Status
                                </label>
                                <select
                                  value={cust.status || 'new'}
                                  onChange={(e) => handleQuickUpdate(cust.id, { status: e.target.value as any })}
                                  disabled={updatingId === cust.id}
                                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-md border border-border bg-surface text-text-primary focus:outline-none focus:border-accent cursor-pointer shadow-2xs"
                                >
                                  <optgroup label="Standard Stages">
                                    <option value="new">New Inquiry</option>
                                    <option value="contacted">In Discussion</option>
                                    <option value="follow-up">Follow-up Due</option>
                                    <option value="converted">Closed / Won</option>
                                    <option value="lost">Lost / Closed</option>
                                  </optgroup>
                                  {crmDropdowns.outcome_statuses && crmDropdowns.outcome_statuses.length > 0 && (
                                    <optgroup label="Configured Outcomes">
                                      {crmDropdowns.outcome_statuses.map((st) => (
                                        <option key={st} value={st}>
                                          {st}
                                        </option>
                                      ))}
                                    </optgroup>
                                  )}
                                </select>
                              </div>
                            </div>
                          </td>

                          {/* ── COL 3: FOLLOW-UP SCHEDULE & NEXT ACTION ── */}
                          <td className="pt-3 pb-3 pr-4 pl-3 align-top" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-2 max-w-[240px]">
                              {/* Follow-up Date Picker & Relative Badge */}
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                    Follow-up Schedule
                                  </label>
                                  {getFollowupBadge(cust.followup_date)}
                                </div>
                                <input
                                  type="date"
                                  value={cust.followup_date || ''}
                                  onChange={(e) => handleQuickUpdate(cust.id, { followup_date: e.target.value || null })}
                                  disabled={updatingId === cust.id}
                                  className="w-full text-xs font-mono px-2.5 py-1.5 rounded-md border border-border bg-surface text-text-primary focus:outline-none focus:border-accent cursor-pointer shadow-2xs"
                                />
                              </div>

                              {/* Next Action Dropdown */}
                              <div>
                                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                                  Next Action
                                </label>
                                <select
                                  value={cust.next_action || ''}
                                  onChange={(e) => handleQuickUpdate(cust.id, { next_action: e.target.value || null })}
                                  disabled={updatingId === cust.id}
                                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-md border border-border bg-surface text-text-primary focus:outline-none focus:border-accent cursor-pointer shadow-2xs"
                                >
                                  <option value="">No Action Set</option>
                                  {crmDropdowns.next_actions && crmDropdowns.next_actions.map((act) => (
                                    <option key={act} value={act}>
                                      {act}
                                    </option>
                                  ))}
                                </select>
                              </div>
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

        {/* KANBAN FUNNEL VIEW - COMPLETE WITH NOTES & ACTION BUTTONS */}
        {viewMode === 'kanban' && (
          <div className={`flex-1 flex overflow-x-auto gap-3 pb-2 ${selectedCustomer ? 'hidden md:flex min-w-0' : ''}`}>
            {[
              { id: 'new', label: 'New Inquiry', dot: 'bg-blue-500' },
              { id: 'contacted', label: 'In Discussion', dot: 'bg-indigo-500' },
              { id: 'follow-up', label: 'Follow-up Due', dot: 'bg-amber-500' },
              { id: 'converted', label: 'Closed / Won', dot: 'bg-emerald-500' },
              { id: 'lost', label: 'Lost / Closed', dot: 'bg-rose-400' },
            ].map((col) => {
              const colLeads = filteredCustomers.filter((c) => c.status === col.id);
              return (
                <div
                  key={col.id}
                  className="w-80 shrink-0 bg-surface-subtle/60 border border-border rounded-md flex flex-col max-h-full overflow-hidden"
                >
                  {/* Column Header */}
                  <div className="p-2.5 border-b border-border bg-surface flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                      <h4 className="font-bold text-xs text-text-primary font-headline">{col.label}</h4>
                    </div>
                    <span className="text-xs font-bold text-text-muted bg-surface-subtle border border-border px-2 py-0.2 rounded-full font-mono">
                      {colLeads.length}
                    </span>
                  </div>

                  {/* Column Card List */}
                  <div className="p-2 flex-1 overflow-y-auto space-y-2.5">
                    {colLeads.length === 0 ? (
                      <div className="p-6 text-center text-text-muted text-xs border border-dashed border-border rounded-md">
                        No leads in this stage
                      </div>
                    ) : (
                      colLeads.map((cust) => {
                        const isSelected = selectedCustomer?.id === cust.id;
                        return (
                          <div
                            key={cust.id}
                            onClick={() => onSelectCustomer(cust)}
                            className={`p-3 bg-surface border rounded-md shadow-2xs hover:shadow-xs hover:border-accent/40 transition-all cursor-pointer space-y-2 ${
                              isSelected ? 'border-accent ring-1 ring-accent' : 'border-border'
                            }`}
                          >
                            {/* Card Header: Name & Temperature */}
                            <div className="flex items-start justify-between gap-1.5">
                              <div>
                                <h5 className="font-bold text-xs text-text-primary hover:text-accent transition-colors">
                                  {cust.name || cust.wa_profile_name || 'Lead'}
                                </h5>
                                <p className="text-[11px] text-text-muted font-mono mt-0.5">{cust.phone}</p>
                              </div>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-xs uppercase tracking-wider ${
                                  cust.lead_probability === 'hot'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : cust.lead_probability === 'cold'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {cust.lead_probability || 'warm'}
                              </span>
                            </div>

                            {/* Requirement tag */}
                            {(cust.health_concern || cust.last_visit_service) && (
                              <p className="text-[10px] text-text-secondary bg-surface-subtle p-1.5 rounded-sm border border-border/60">
                                {cust.health_concern || cust.last_visit_service}
                              </p>
                            )}

                            {/* Inline Note Snippet */}
                            {cust.latest_note && (
                              <div className="p-2 rounded bg-amber-50/80 border border-amber-200 text-amber-950 text-[11px] leading-snug italic">
                                "{cust.latest_note}"
                              </div>
                            )}

                            {/* Card Footer: Follow-up & Chat Button */}
                            <div className="flex items-center justify-between pt-1 border-t border-border/60 text-[10px]">
                              <div>{getFollowupBadge(cust.followup_date) || <span className="text-text-muted">—</span>}</div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenChat(cust);
                                  }}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-xs border border-emerald-200 transition-colors flex items-center gap-1 shadow-2xs"
                                >
                                  <WhatsAppIcon className="w-3 h-3 text-[#25D366]" />
                                  <span>Chat</span>
                                </button>
                              </div>
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
                <p className="text-xs text-text-muted">Manage scheduled follow-up calls and tasks for leads.</p>
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
            ) : tasks.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-xs">No pending tasks found.</div>
            ) : (
              <div className="space-y-2">
                {tasks.map((t) => (
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
            ) : allNotes.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-xs">No activity notes recorded yet.</div>
            ) : (
              <div className="space-y-2">
                {allNotes.map((nt) => (
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

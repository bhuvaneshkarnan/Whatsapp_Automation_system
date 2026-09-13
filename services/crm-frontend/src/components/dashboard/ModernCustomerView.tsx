'use client';

import React, { useState, useMemo } from 'react';
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
  ChevronRight,
  ChevronDown,
  Download,
  RotateCcw,
  MessageSquare,
  User,
  UserPlus,
  UserCheck,
  MoreHorizontal,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  LayoutGrid,
  List,
  Phone,
  Sparkles,
  StickyNote,
  Tag,
  Activity,
  Trash2,
  Building2,
  Sliders,
  Check,
  Zap,
} from 'lucide-react';
import { Customer, FollowupTask, CrmDropdownOptions } from '@/lib/api';

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
}

const STAGES: { id: Customer['status']; label: string; bg: string; text: string; border: string; dot: string }[] = [
  { id: 'new', label: 'New Inquiry', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  { id: 'contacted', label: 'In Discussion', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  { id: 'follow-up', label: 'Follow-up Due', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' },
  { id: 'converted', label: 'Closed / Won', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  { id: 'lost', label: 'Lost / Closed', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-400' },
];

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

    // Follow-up due today or overdue
    const todayStr = new Date().toISOString().split('T')[0];
    const followupsDue = customers.filter((c) => {
      if (!c.followup_date) return false;
      return c.followup_date <= todayStr && c.status !== 'converted' && c.status !== 'lost';
    }).length;

    const winRate = total > 0 ? Math.round((converted / total) * 100) : 0;

    return { total, hotLeads, warmLeads, converted, followupsDue, winRate };
  }, [customers]);

  // Filtered customers list
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
        if (!matchesName && !matchesPhone && !matchesLocation && !matchesConcern && !matchesService && !matchesStaff) {
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

      // Staff / Rep
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

  // Helper for inline updates
  const handleQuickUpdate = async (customerId: string, patch: Partial<Customer>) => {
    try {
      setUpdatingId(customerId);
      await onUpdateCustomer(customerId, patch);
    } finally {
      setUpdatingId(null);
    }
  };

  // Format relative WhatsApp time
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
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-xs">
          <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
          <span>Overdue ({Math.abs(diffDays)}d)</span>
        </span>
      );
    }
    if (diffDays === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded-xs animate-pulse">
          <Clock className="w-2.5 h-2.5 shrink-0" />
          <span>Due Today</span>
        </span>
      );
    }
    if (diffDays === 1) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-xs">
          <Calendar className="w-2.5 h-2.5 shrink-0" />
          <span>Tomorrow</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-text-secondary bg-surface-subtle border border-border px-1.5 py-0.5 rounded-xs font-mono">
        <Calendar className="w-2.5 h-2.5 shrink-0 text-text-muted" />
        <span>{dateStr}</span>
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-3">
      {/* ── 1. EXECUTIVE KPI SUMMARY BAR ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {/* Total Leads */}
        <div className="bg-surface border border-border rounded-md p-3 shadow-2xs hover:border-border-strong transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Total Pipeline</span>
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
            warmthFilter === 'hot' ? 'border-amber-400 ring-1 ring-amber-400 bg-amber-50/20' : 'border-border hover:border-amber-300'
          }`}
          title="Click to toggle Hot Leads filter"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Hot Intent</span>
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
          title="Click to toggle Action Due filter"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Follow-ups Due</span>
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
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Deals Closed</span>
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
            placeholder="Search by name, phone, company, requirement..."
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
        {/* TABLE VIEW */}
        {viewMode === 'table' && (
          <div className={`flex-1 flex flex-col border border-border rounded-md bg-surface overflow-hidden ${selectedCustomer ? 'hidden md:flex min-w-0' : ''}`}>
            <div className="flex-1 overflow-y-auto overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[900px]">
                <thead className="bg-surface-subtle/80 border-b border-border text-text-secondary font-semibold text-[11px] uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="p-3 pl-4">Lead & Organization</th>
                    <th className="p-3">Stage / Status</th>
                    <th className="p-3">Buying Intent</th>
                    <th className="p-3">Requirement / Interest</th>
                    <th className="p-3">Account Owner</th>
                    <th className="p-3">Follow-up</th>
                    <th className="p-3">Last WhatsApp</th>
                    <th className="p-3 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-text-muted">
                        <RotateCcw className="w-5 h-5 animate-spin mx-auto mb-2 text-accent" />
                        <span>Loading pipeline data...</span>
                      </td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-text-muted">
                        <Users className="w-8 h-8 mx-auto mb-2 text-text-muted/40 stroke-[1.5]" />
                        <p className="font-semibold text-text-primary text-sm">No leads found</p>
                        <p className="text-xs text-text-secondary mt-1">Try adjusting your search terms or filter chips.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust) => {
                      const isSelected = selectedCustomer?.id === cust.id;
                      const stageObj = STAGES.find((s) => s.id === cust.status) || STAGES[0];
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
                          className={`cursor-pointer transition-colors duration-150 group ${
                            isSelected ? 'bg-accent-subtle/40 border-l-2 border-l-accent' : 'hover:bg-surface-subtle/60'
                          }`}
                        >
                          {/* Lead & Org */}
                          <td className="p-3 pl-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-100 border border-border flex items-center justify-center text-text-primary font-bold text-xs shrink-0 font-headline group-hover:border-accent/40 transition-colors">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-text-primary text-xs truncate max-w-[150px]">
                                    {cust.name || cust.wa_profile_name || 'Lead'}
                                  </span>
                                  {(cust.completed_bookings_count ?? 0) > 0 && (
                                    <span className="text-[9px] font-semibold px-1 py-0.2 rounded-xs bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 flex items-center gap-0.5">
                                      <UserCheck className="w-2.5 h-2.5" />
                                      <span>Repeat</span>
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-text-muted font-mono flex items-center gap-1 mt-0.5">
                                  <Phone className="w-2.5 h-2.5 text-text-muted" />
                                  <span>{cust.phone}</span>
                                  {cust.location && (
                                    <>
                                      <span>•</span>
                                      <span className="font-sans text-text-secondary">{cust.location}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Stage / Status Dropdown */}
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={cust.status || 'new'}
                              onChange={(e) => handleQuickUpdate(cust.id, { status: e.target.value as any })}
                              disabled={updatingId === cust.id}
                              className={`text-[11px] font-semibold px-2 py-1 rounded-sm border cursor-pointer transition-all ${stageObj.bg} ${stageObj.text} ${stageObj.border}`}
                            >
                              {STAGES.map((st) => (
                                <option key={st.id} value={st.id}>
                                  {st.label}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Buying Intent / Temperature */}
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={cust.lead_probability || 'warm'}
                              onChange={(e) => handleQuickUpdate(cust.id, { lead_probability: e.target.value as any })}
                              disabled={updatingId === cust.id}
                              className={`text-[11px] font-bold px-2 py-1 rounded-sm border cursor-pointer uppercase tracking-wider ${
                                cust.lead_probability === 'hot'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : cust.lead_probability === 'cold'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              <option value="hot">🔥 Hot</option>
                              <option value="warm">⚡ Warm</option>
                              <option value="cold">❄️ Cold</option>
                            </select>
                          </td>

                          {/* Requirement / Primary Concern */}
                          <td className="p-3">
                            <span className="text-xs text-text-secondary font-medium line-clamp-1">
                              {cust.health_concern || cust.last_visit_service || '—'}
                            </span>
                          </td>

                          {/* Staff / Account Rep */}
                          <td className="p-3">
                            <span className="text-xs text-text-primary font-medium">
                              {cust.preferred_doctor || <span className="text-text-muted italic">Unassigned</span>}
                            </span>
                          </td>

                          {/* Follow-up Date */}
                          <td className="p-3 whitespace-nowrap">
                            {getFollowupBadge(cust.followup_date) || <span className="text-text-muted text-[11px]">—</span>}
                          </td>

                          {/* Last WhatsApp */}
                          <td className="p-3 whitespace-nowrap">
                            {cust.last_chat_at ? (
                              <div className="flex flex-col">
                                <span className="text-[11px] text-text-primary font-medium flex items-center gap-1 font-mono">
                                  <Clock className="w-2.5 h-2.5 text-text-muted" />
                                  {formatTimeAgo(cust.last_chat_at)}
                                </span>
                                {cust.last_message && (
                                  <span className="text-[10px] text-text-muted truncate max-w-[130px] font-sans">
                                    {cust.last_message}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-text-muted text-[11px]">—</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-3 pr-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => onOpenChat(cust)}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-sm border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="Open live WhatsApp chat in drawer"
                              >
                                <MessageSquare className="w-3 h-3 fill-emerald-600 text-emerald-600 stroke-[1.5]" />
                                <span>Chat</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenDetails(cust)}
                                className="px-2.5 py-1 bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary text-xs font-medium rounded-sm border border-border transition-colors cursor-pointer flex items-center gap-1"
                                title="View details and notes"
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

        {/* KANBAN FUNNEL VIEW */}
        {viewMode === 'kanban' && (
          <div className={`flex-1 flex overflow-x-auto gap-3 pb-2 ${selectedCustomer ? 'hidden md:flex min-w-0' : ''}`}>
            {STAGES.map((col) => {
              const colLeads = filteredCustomers.filter((c) => c.status === col.id);
              return (
                <div
                  key={col.id}
                  className="w-72 shrink-0 bg-surface-subtle/60 border border-border rounded-md flex flex-col max-h-full overflow-hidden"
                >
                  {/* Column Header */}
                  <div className="p-2.5 border-b border-border bg-surface flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                      <h4 className="font-bold text-xs text-text-primary font-headline">{col.label}</h4>
                    </div>
                    <span className="text-xs font-bold text-text-muted bg-surface-subtle border border-border px-2 py-0.2 rounded-full font-mono">
                      {colLeads.length}
                    </span>
                  </div>

                  {/* Column Card List */}
                  <div className="p-2 flex-1 overflow-y-auto space-y-2">
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
                              <p className="text-[11px] text-text-secondary bg-surface-subtle p-1.5 rounded-sm line-clamp-2 border border-border/60">
                                {cust.health_concern || cust.last_visit_service}
                              </p>
                            )}

                            {/* Card Footer: Follow-up & Chat Button */}
                            <div className="flex items-center justify-between pt-1 border-t border-border/60 text-[10px]">
                              <div>{getFollowupBadge(cust.followup_date) || <span className="text-text-muted">—</span>}</div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenChat(cust);
                                }}
                                className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-xs border border-emerald-200 transition-colors flex items-center gap-1"
                              >
                                <MessageSquare className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
                                <span>Chat</span>
                              </button>
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

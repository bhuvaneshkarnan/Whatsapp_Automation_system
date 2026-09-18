'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  GitMerge,
  ArrowRightLeft,
  Calendar,
  MessageSquare,
  StickyNote,
  Phone,
  User,
  AlertTriangle,
  CheckCircle2,
  Search,
  Check,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { Customer, crm as api } from '@/lib/api';

interface MergeCustomersModalProps {
  primaryCustomer: Customer;
  initialSecondaryId?: string | null;
  allCustomers: Customer[];
  onClose: () => void;
  onSuccess: (primaryId: string) => void;
}

export function MergeCustomersModal({
  primaryCustomer,
  initialSecondaryId,
  allCustomers,
  onClose,
  onSuccess,
}: MergeCustomersModalProps) {
  const [primary, setPrimary] = useState<Customer>(primaryCustomer);
  const [secondaryId, setSecondaryId] = useState<string>(initialSecondaryId || '');
  const [secondarySearch, setSecondarySearch] = useState('');
  const [internalName, setInternalName] = useState<string>(
    primaryCustomer.internal_name || primaryCustomer.name || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const secondary = useMemo(() => {
    return allCustomers.find((c) => c.id === secondaryId) || null;
  }, [allCustomers, secondaryId]);

  // Clean candidate matches (excluding primary)
  const candidateOptions = useMemo(() => {
    const q = secondarySearch.trim().toLowerCase();
    const cleanQ = q.replace(/\D/g, '');
    const pCleanPhone = primary.phone.replace(/\D/g, '');
    const pLast10 = pCleanPhone.slice(-10);
    const pName = (primary.name || '').trim().toLowerCase();

    return allCustomers
      .filter((c) => c.id !== primary.id)
      .filter((c) => {
        if (!q) return true;
        const name = (c.name || '').toLowerCase();
        const intName = (c.internal_name || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        const phoneClean = phone.replace(/\D/g, '');
        return (
          name.includes(q) ||
          intName.includes(q) ||
          phone.includes(q) ||
          (cleanQ.length >= 3 && phoneClean.includes(cleanQ))
        );
      })
      .sort((a, b) => {
        // Boost potential duplicates to top of list
        const aClean = a.phone.replace(/\D/g, '');
        const bClean = b.phone.replace(/\D/g, '');
        const aIsPhoneMatch = pLast10 && aClean.slice(-10) === pLast10;
        const bIsPhoneMatch = pLast10 && bClean.slice(-10) === pLast10;
        if (aIsPhoneMatch && !bIsPhoneMatch) return -1;
        if (!aIsPhoneMatch && bIsPhoneMatch) return 1;

        const aIsNameMatch = pName && pName.length >= 3 && (a.name || '').toLowerCase().trim() === pName;
        const bIsNameMatch = pName && pName.length >= 3 && (b.name || '').toLowerCase().trim() === pName;
        if (aIsNameMatch && !bIsNameMatch) return -1;
        if (!aIsNameMatch && bIsNameMatch) return 1;

        return (a.name || '').localeCompare(b.name || '');
      })
      .slice(0, 25);
  }, [allCustomers, primary, secondarySearch]);

  const handleSwap = () => {
    if (!secondary) return;
    const oldPrimary = primary;
    setPrimary(secondary);
    setSecondaryId(oldPrimary.id);
    setInternalName(secondary.internal_name || secondary.name || oldPrimary.internal_name || oldPrimary.name || '');
  };

  const handleConfirmMerge = async () => {
    if (!secondary) {
      setError('Please select a duplicate patient profile to merge.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await api.mergeCustomers(
        primary.id,
        [secondary.id],
        internalName.trim() || undefined
      );
      onSuccess(primary.id);
      onClose();
    } catch (err: any) {
      console.error('Merge failed:', err);
      setError(err?.message || 'Failed to merge patient records. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-surface border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-border bg-surface-subtle/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600">
              <GitMerge className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Merge Patient Records</h3>
              <p className="text-[11px] text-text-muted">
                Combine duplicate profiles into a unified patient record without losing appointments or chat history.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary rounded-md hover:bg-surface-subtle transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Select Duplicate Patient Search if secondary not selected */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
              Step 1: Select Duplicate Record to Merge
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search duplicate by name, internal label, or phone..."
                value={secondarySearch}
                onChange={(e) => setSecondarySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            {/* Candidate list (quick-pick) */}
            <div className="max-h-36 overflow-y-auto divide-y divide-border border border-border rounded-md bg-surface-subtle/30">
              {candidateOptions.length === 0 ? (
                <div className="p-3 text-center text-xs text-text-muted">
                  No matching duplicate candidates found.
                </div>
              ) : (
                candidateOptions.map((cand) => {
                  const isCandSelected = secondaryId === cand.id;
                  const isCleanMatch =
                    primary.phone.replace(/\D/g, '').slice(-10) ===
                    cand.phone.replace(/\D/g, '').slice(-10);

                  return (
                    <div
                      key={cand.id}
                      onClick={() => setSecondaryId(cand.id)}
                      className={`p-2.5 px-3 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                        isCandSelected
                          ? 'bg-indigo-50/80 border-l-2 border-l-indigo-600'
                          : 'hover:bg-surface-subtle'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-border flex items-center justify-center font-bold text-[10px] text-text-primary shrink-0">
                          {(cand.name || 'C')[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-text-primary truncate">
                              {cand.internal_name || cand.name || 'Contact'}
                            </span>
                            {cand.internal_name && (
                              <span className="text-[9px] px-1 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded">
                                Internal
                              </span>
                            )}
                            {isCleanMatch && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-bold">
                                Same Mobile Number
                              </span>
                            )}
                          </div>
                          <span className="text-[10.5px] font-mono text-text-muted">{cand.phone}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-text-muted text-[11px]">
                        <span>{cand.total_bookings_count ?? 0} bookings</span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isCandSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-border'
                          }`}
                        >
                          {isCandSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Step 2: Side-by-Side Comparison Cards with Swap Action */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                Step 2: Compare Records & Confirm Primary
              </label>
              {secondary && (
                <button
                  type="button"
                  onClick={handleSwap}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Click to swap which record is kept as Primary"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Swap Primary / Secondary</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative">
              {/* PRIMARY CARD (KEEP) */}
              <div className="p-3.5 bg-emerald-50/50 border-2 border-emerald-500/50 rounded-lg space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-emerald-200/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Primary Profile (Target — Kept)</span>
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-text-primary">
                    {primary.internal_name || primary.name || 'Customer'}
                  </h4>
                  <p className="text-xs font-mono text-text-muted mt-0.5 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-text-muted" />
                    <span>{primary.phone}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="bg-surface/80 p-2 rounded border border-emerald-200/40">
                    <span className="text-text-muted block text-[10px]">Total Bookings</span>
                    <span className="font-bold text-text-primary">
                      {primary.total_bookings_count ?? 0}
                    </span>
                  </div>
                  <div className="bg-surface/80 p-2 rounded border border-emerald-200/40">
                    <span className="text-text-muted block text-[10px]">Medical Notes</span>
                    <span className="font-bold text-text-primary">{primary.notes_count ?? 0}</span>
                  </div>
                </div>

                <div className="text-[11px] text-text-secondary space-y-0.5 pt-1">
                  <div>
                    <span className="text-text-muted">Preferred Doctor: </span>
                    <span className="font-medium">{primary.preferred_doctor || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Health Concern: </span>
                    <span className="font-medium">{primary.health_concern || 'General'}</span>
                  </div>
                </div>
              </div>

              {/* SECONDARY CARD (ABSORB & DELETE) */}
              <div className="p-3.5 bg-slate-50 border border-border rounded-lg space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-border">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                    Secondary Profile (Absorbed & Consolidated)
                  </span>
                </div>

                {secondary ? (
                  <>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">
                        {secondary.internal_name || secondary.name || 'Customer'}
                      </h4>
                      <p className="text-xs font-mono text-text-muted mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-text-muted" />
                        <span>{secondary.phone}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="bg-surface p-2 rounded border border-border">
                        <span className="text-text-muted block text-[10px]">Total Bookings</span>
                        <span className="font-bold text-text-primary">
                          {secondary.total_bookings_count ?? 0}
                        </span>
                      </div>
                      <div className="bg-surface p-2 rounded border border-border">
                        <span className="text-text-muted block text-[10px]">Medical Notes</span>
                        <span className="font-bold text-text-primary">
                          {secondary.notes_count ?? 0}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-text-secondary space-y-0.5 pt-1">
                      <div>
                        <span className="text-text-muted">Preferred Doctor: </span>
                        <span className="font-medium">{secondary.preferred_doctor || 'None'}</span>
                      </div>
                      <div>
                        <span className="text-text-muted">Health Concern: </span>
                        <span className="font-medium">{secondary.health_concern || 'General'}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center text-xs text-text-muted">
                    <User className="w-8 h-8 mx-auto mb-1.5 opacity-40 stroke-[1.5]" />
                    <p className="font-medium">No secondary record selected yet</p>
                    <p className="text-[10.5px] mt-0.5 text-text-muted">
                      Select a duplicate record in Step 1 above.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Set Unified Internal Name */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                Step 3: Set Unified Internal Patient Name / Label
              </label>
              <span className="text-[10px] text-text-muted">Internal to CRM only</span>
            </div>
            <input
              type="text"
              value={internalName}
              onChange={(e) => setInternalName(e.target.value)}
              placeholder="e.g. Ramesh Kumar (VIP / Father of Priya)"
              className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          {/* Merge Guarantee Box */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-md text-[11px] text-indigo-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-indigo-900">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>What happens upon confirmation:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-indigo-900/80">
              <li>
                All past and upcoming appointments from both records are unified under the primary profile.
              </li>
              <li>
                WhatsApp chats are unified. Future messages from either phone number will link to this patient.
              </li>
              <li>
                All clinical notes, tasks, and tags are preserved with an automatic audit trail.
              </li>
              <li>
                The secondary duplicate profile is safely removed from the directory to prevent confusion.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 px-5 border-t border-border bg-surface-subtle/80 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary font-medium rounded border border-border hover:bg-surface transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmMerge}
            disabled={!secondary || isSubmitting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded shadow-sm flex items-center gap-2 cursor-pointer transition-all"
          >
            {isSubmitting ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Merging Records...</span>
              </>
            ) : (
              <>
                <GitMerge className="w-3.5 h-3.5" />
                <span>Confirm & Merge Records</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

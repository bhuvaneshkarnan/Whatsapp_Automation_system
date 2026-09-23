'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Check,
  Phone,
  Sun,
  Sunset,
  ArrowRight,
  ArrowLeft,
  Layers,
  FileText,
  CheckCircle
} from 'lucide-react';
import { publicBooking, PublicBookingInfo } from '@/lib/api';
import { useBranding, enforceDomainRedirect } from '@/lib/branding';


export default function BookingClient() {
  const params = useParams();
  const { branding, isCustomDomain } = useBranding();

  // Extract slug from route or pathname fallback
  let slug = '';
  if (params?.slug) {
    slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  } else if (typeof window !== 'undefined') {
    const parts = window.location.pathname.split('/').filter(Boolean);
    slug = parts[0] || 'boldlabs';
  }

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState<PublicBookingInfo | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [hideHeader, setHideHeader] = useState(false);
  const [sourceParam, setSourceParam] = useState('website_form');

  // View mode: 'steps' (paginated pages wizard) or 'single' (all-in-one scrollable page)
  const [layoutMode, setLayoutMode] = useState<'steps' | 'single'>('steps');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form selections - Multi-select for health concerns/services, NO doctor selection
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientNotes, setPatientNotes] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState<{
    booking_id: string;
    doctor_name?: string;
    health_concern: string;
    appointment_date: string;
    appointment_time: string;
    patient_name: string;
    patient_phone: string;
    message: string;
  } | null>(null);

  // Check URL parameters: embed, mode (steps vs single), hide_header, and source
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isIframe = window.self !== window.top;
      const searchParams = new URLSearchParams(window.location.search);
      const embedParam = searchParams.get('embed') === 'true' || searchParams.get('compact') === 'true';
      setIsEmbedded(isIframe || embedParam);

      const mode = (searchParams.get('mode') || searchParams.get('layout') || '').toLowerCase();
      if (mode === 'single' || mode === 'full') {
        setLayoutMode('single');
      } else {
        setLayoutMode('steps'); // Default to multi-step pages mode
      }

      const hide = searchParams.get('hide_header') === 'true' || searchParams.get('hide_header') === '1';
      setHideHeader(hide);

      const src = searchParams.get('source') || 'website_form';
      setSourceParam(src);
    }
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);

  // Dispatch postMessage for host websites (auto-resize iframe height to eliminate white space)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isIframe = window.self !== window.top;
    if (!isIframe && !isEmbedded) return;

    const dispatchHeight = () => {
      try {
        const el = containerRef.current || document.body;
        const rect = el.getBoundingClientRect();
        const contentHeight = Math.ceil(rect.height || el.offsetHeight);
        if (contentHeight > 50 && window.parent) {
          window.parent.postMessage(
            {
              type: 'CRM_FRAME_RESIZE',
              height: contentHeight + (hideHeader ? 14 : 24),
            },
            '*'
          );
        }
      } catch (_) {}
    };

    dispatchHeight();
    const t1 = setTimeout(dispatchHeight, 50);
    const t2 = setTimeout(dispatchHeight, 180);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      observer = new ResizeObserver(() => {
        dispatchHeight();
      });
      observer.observe(containerRef.current);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (observer) observer.disconnect();
    };
  }, [currentStep, layoutMode, selectedConcerns, selectedDate, bookingSuccess, formError, info, isEmbedded, hideHeader]);

  // Load clinic/tenant public info
  useEffect(() => {
    async function loadInfo() {
      if (!slug) return;
      setLoading(true);
      setError('');
      try {
        const data = await publicBooking.getInfo(slug);
        if (typeof window !== 'undefined' && enforceDomainRedirect(window.location.hostname, data.custom_domain)) {
          return;
        }
        setInfo(data);
        // Default to first health concern if available
        if (data.health_concerns && data.health_concerns.length > 0) {
          setSelectedConcerns([data.health_concerns[0]]);
        }
        // Default to tomorrow's date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');
        setSelectedDate(`${yyyy}-${mm}-${dd}`);
        setSelectedTime('10:00 AM');
      } catch (err: any) {
        setError(err?.message || 'Unable to load appointment booking info for this organization.');
      } finally {
        setLoading(false);
      }
    }
    loadInfo();
  }, [slug]);

  // Generate next 14 available booking dates
  const availableDates = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const iso = `${yyyy}-${mm}-${dd}`;
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    return { iso, weekday, dayNum, month, isWeekend: d.getDay() === 0 };
  });

  // Clinic appointment slots grouped by time of day
  const morningSlots = [
    '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM'
  ];
  const afternoonSlots = [
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM'
  ];

  // Toggle multi-selection for health concern / therapy service
  const toggleConcern = (concern: string) => {
    setFormError('');
    setSelectedConcerns((prev) => {
      if (prev.includes(concern)) {
        return prev.filter((c) => c !== concern);
      } else {
        return [...prev, concern];
      }
    });
  };

  // Step 1 Validation & Next
  const handleNextFromStep1 = () => {
    setFormError('');
    if (selectedConcerns.length === 0) {
      setFormError('Please select at least one health concern or therapy service.');
      return;
    }
    setCurrentStep(2);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Step 2 Validation & Next
  const handleNextFromStep2 = () => {
    setFormError('');
    if (!selectedDate || !selectedTime) {
      setFormError('Please choose your preferred appointment date and time slot.');
      return;
    }
    setCurrentStep(3);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Final Submission
  async function handleConfirmBooking(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (selectedConcerns.length === 0) {
      setFormError('Please select at least one health concern or therapy service.');
      if (layoutMode === 'steps') setCurrentStep(1);
      return;
    }
    if (!selectedDate || !selectedTime) {
      setFormError('Please choose a preferred appointment date and time slot.');
      if (layoutMode === 'steps') setCurrentStep(2);
      return;
    }
    if (!patientName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    const cleanDigits = patientPhone.replace(/[^0-9]/g, '');
    if (cleanDigits.length < 10) {
      setFormError('Please enter a valid 10-digit WhatsApp phone number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await publicBooking.createBooking(slug, {
        patient_name: patientName.trim(),
        patient_phone: patientPhone.trim(),
        patient_email: patientEmail.trim() || undefined,
        health_concern: selectedConcerns.join(', '),
        booking_date: selectedDate,
        booking_time: selectedTime,
        notes: patientNotes.trim() || undefined,
        source: sourceParam || 'website_form',
      });

      setBookingSuccess(res);

      // PostMessage for host websites (embed auto-resize / conversion tracking)
      if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        try {
          window.parent.postMessage(
            {
              type: 'CRM_BOOKING_SUCCESS',
              booking_id: res.booking_id,
              patient_phone: res.patient_phone,
              appointment_date: res.appointment_date,
              appointment_time: res.appointment_time,
              health_concern: res.health_concern,
              source: sourceParam || 'website_form',
            },
            '*'
          );
        } catch (_) {}
      }
    } catch (err: any) {
      setFormError(err?.message || 'Failed to book appointment. Please try another slot or contact clinic support.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[360px] py-16 bg-canvas flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto stroke-[1.5]" />
          <p className="text-xs font-medium text-text-muted">Loading appointment schedule...</p>
        </div>
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="min-h-[360px] py-16 bg-canvas flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-surface border border-border rounded-lg p-6 text-center space-y-3 shadow-subtle">
          <div className="w-10 h-10 rounded-full bg-status-error-bg text-status-error flex items-center justify-center mx-auto border border-status-error-border">
            <AlertCircle className="w-5 h-5 stroke-[1.5]" />
          </div>
          <h2 className="text-sm font-semibold text-text-primary">Appointment Portal Unavailable</h2>
          <p className="text-xs text-text-secondary leading-relaxed">{error || 'This booking portal is currently offline.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-3.5 py-1.5 bg-surface-subtle hover:bg-border text-text-primary text-xs font-medium rounded-md transition-colors cursor-pointer border border-border"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // ── Success State Screen ──────────────────────────────────────────────────
  if (bookingSuccess) {
    const cleanBot = (info.bot_phone || '').replace(/[^0-9]/g, '');
    const waChatUrl = `https://wa.me/${cleanBot}?text=Hello%20${encodeURIComponent(info.name)}%2C%20I%20have%20booked%20an%20appointment%20for%20${encodeURIComponent(bookingSuccess.health_concern)}%20on%20${encodeURIComponent(bookingSuccess.appointment_date)}%20at%20${encodeURIComponent(bookingSuccess.appointment_time)}.%20Reference%3A%20${encodeURIComponent(bookingSuccess.booking_id.slice(0, 8))}`;

    return (
      <div className={`bg-canvas text-text-body flex flex-col font-sans ${isEmbedded ? 'min-h-0' : 'min-h-screen'}`}>
        {/* Minimal Header */}
        {!isEmbedded && !hideHeader && (
          <header className="h-12 px-4 sm:px-8 border-b border-border bg-surface flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {info.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold text-xs text-text-primary tracking-tight truncate max-w-[200px] sm:max-w-none">
                {info.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-status-success-bg text-status-success border border-status-success-border text-[11px] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Confirmed</span>
            </div>
          </header>
        )}

        <div className={`${isEmbedded ? 'p-1 sm:p-2' : 'flex-1 flex items-center justify-center p-3 sm:p-6'}`}>
          <div ref={containerRef} className="w-full max-w-lg bg-surface border border-border rounded-xl p-5 sm:p-7 shadow-sm space-y-4">
            {/* Header check icon */}
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto ring-4 ring-emerald-50">
                <CheckCircle2 className="w-7 h-7 stroke-[2]" />
              </div>
              <h1 className="text-base sm:text-lg font-bold text-text-primary">Appointment Confirmed!</h1>
              <p className="text-xs text-text-muted">
                Your booking request has been confirmed. Instant notification has been dispatched to your WhatsApp.
              </p>
            </div>

            {/* Appointment Details Card */}
            <div className="p-3.5 sm:p-4 bg-surface-subtle border border-border rounded-lg space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="text-text-muted font-medium">Organization / Clinic</span>
                <span className="font-semibold text-text-primary">{info.name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="text-text-muted font-medium">Service / Concern</span>
                <span className="font-semibold text-emerald-800 text-right max-w-[240px] truncate">
                  {bookingSuccess.health_concern}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="text-text-muted font-medium">Date & Time</span>
                <span className="font-semibold text-text-primary">
                  {bookingSuccess.appointment_date} at {bookingSuccess.appointment_time}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="text-text-muted font-medium">Patient Name</span>
                <span className="font-semibold text-text-primary">{bookingSuccess.patient_name}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-text-muted font-medium">WhatsApp Phone</span>
                <span className="font-semibold text-text-primary font-mono">{bookingSuccess.patient_phone}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {cleanBot && (
                <a
                  href={waChatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Open WhatsApp Confirmation</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  setBookingSuccess(null);
                  setCurrentStep(1);
                  setPatientName('');
                  setPatientPhone('');
                  setPatientEmail('');
                  setPatientNotes('');
                  setFormError('');
                }}
                className="w-full py-2 px-4 bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary border border-border font-medium text-xs rounded-lg transition-colors cursor-pointer"
              >
                Book Another Appointment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Booking Intake Screen ─────────────────────────────────────────────────
  return (
    <div className={`bg-canvas text-text-body font-sans flex flex-col ${isEmbedded ? 'min-h-0 p-0' : 'min-h-screen'}`}>
      
      {/* ── Top Header Navigation Bar (Hidden when embedded in website or hideHeader=true) ── */}
      {!isEmbedded && !hideHeader && (
        <header className="h-12 px-4 sm:px-8 border-b border-border bg-surface flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {info.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-text-primary tracking-tight truncate max-w-[200px] sm:max-w-none">
                {info.name}
              </span>
              <span className="text-text-muted text-xs hidden sm:inline">&bull;</span>
              <span className="text-xs text-text-muted hidden sm:inline">Online Appointment Booking</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block animate-pulse" />
              <span>Instant Confirmation</span>
            </div>
          </div>
        </header>
      )}

      {/* ── Main Intake Form Container ── */}
      <div className={`${isEmbedded ? 'py-1 px-1' : 'flex-1 py-4 sm:py-6 px-2 sm:px-4'}`}>
        <div ref={containerRef} className="max-w-xl mx-auto space-y-3">
          
          {/* Clinic Information Compact Banner (Can be hidden via ?hide_header=true for website contact section) */}
          {!hideHeader && (
            <div className="bg-surface border border-border rounded-xl p-3 sm:p-3.5 shadow-xs flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    {info.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-xs sm:text-[13px] text-text-primary truncate">
                      {info.name}
                    </h2>
                    <div className="flex items-center gap-2 text-[11px] text-text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{info.operating_hours || '09:00 AM – 08:00 PM'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-[11px] font-medium shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 stroke-[1.5]" />
                  <span>Verified Clinic</span>
                </div>
              </div>

              {info.full_location_text && (
                <div className="pt-2 border-t border-border/70 flex items-start gap-1.5 text-[11px] text-text-secondary leading-relaxed">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 hover:line-clamp-none transition-all">{info.full_location_text}</span>
                </div>
              )}
            </div>
          )}

          {/* Optional Mode Toggle Switcher Pill */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-medium text-text-muted">
              {layoutMode === 'steps' ? `Step ${currentStep} of 3` : 'All-in-One Form'}
            </span>
            <div className="inline-flex p-0.5 bg-surface border border-border rounded-lg shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  setLayoutMode('steps');
                  setFormError('');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors cursor-pointer ${
                  layoutMode === 'steps'
                    ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                title="Multi-step guided wizard - best for website contact sections"
              >
                <Layers className="w-3 h-3" />
                <span>Pages (3 Steps)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLayoutMode('single');
                  setFormError('');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors cursor-pointer ${
                  layoutMode === 'single'
                    ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                title="Single scrollable page"
              >
                <FileText className="w-3 h-3" />
                <span>Single Page</span>
              </button>
            </div>
          </div>

          {/* Wizard Step Progress Indicator (Shown when in Multi-Step mode) */}
          {layoutMode === 'steps' && (
            <div className="bg-surface border border-border rounded-xl p-2.5 sm:p-3 shadow-2xs">
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                {/* Step 1 Pill */}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    setFormError('');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                    currentStep === 1
                      ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-300 ring-1 ring-emerald-500/20'
                      : currentStep > 1
                      ? 'bg-emerald-50/50 text-emerald-700 font-medium hover:bg-emerald-50'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    currentStep > 1
                      ? 'bg-emerald-700 text-white'
                      : currentStep === 1
                      ? 'bg-emerald-700 text-white'
                      : 'bg-surface-subtle text-text-muted'
                  }`}>
                    {currentStep > 1 ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '1'}
                  </span>
                  <span className="truncate">Service</span>
                </button>

                {/* Step 2 Pill */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedConcerns.length > 0) {
                      setCurrentStep(2);
                      setFormError('');
                    } else {
                      setFormError('Please select at least one health concern or therapy service.');
                    }
                  }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                    currentStep === 2
                      ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-300 ring-1 ring-emerald-500/20'
                      : currentStep > 2
                      ? 'bg-emerald-50/50 text-emerald-700 font-medium hover:bg-emerald-50'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    currentStep > 2
                      ? 'bg-emerald-700 text-white'
                      : currentStep === 2
                      ? 'bg-emerald-700 text-white'
                      : 'bg-surface-subtle text-text-muted'
                  }`}>
                    {currentStep > 2 ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '2'}
                  </span>
                  <span className="truncate">Date & Time</span>
                </button>

                {/* Step 3 Pill */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedConcerns.length === 0) {
                      setFormError('Please select at least one health concern.');
                      setCurrentStep(1);
                    } else if (!selectedDate || !selectedTime) {
                      setFormError('Please choose an appointment date and time slot.');
                      setCurrentStep(2);
                    } else {
                      setCurrentStep(3);
                      setFormError('');
                    }
                  }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                    currentStep === 3
                      ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-300 ring-1 ring-emerald-500/20'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    currentStep === 3 ? 'bg-emerald-700 text-white' : 'bg-surface-subtle text-text-muted'
                  }`}>
                    3
                  </span>
                  <span className="truncate">Your Details</span>
                </button>
              </div>
            </div>
          )}

          {/* Form Error Notice */}
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Booking Card Form */}
          <form onSubmit={handleConfirmBooking} className="bg-surface border border-border rounded-xl shadow-xs divide-y divide-border overflow-hidden">
            
            {/* ══════════════════════════════════════════════════════════════════
                STEP 1: Select Health Concern / Therapy Service
               ══════════════════════════════════════════════════════════════════ */}
            {(layoutMode === 'single' || currentStep === 1) && (
              <div id="section-concerns" className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 stroke-[2]" />
                    <span>1. Select Health Concern / Therapy Service</span>
                  </label>
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {selectedConcerns.length > 0 ? `${selectedConcerns.length} selected` : 'Select one or more'}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted">
                  Tap to select all conditions or therapies you would like to consult for:
                </p>

                <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1">
                  {info.health_concerns.map((concern) => {
                    const active = selectedConcerns.includes(concern);
                    return (
                      <button
                        key={concern}
                        type="button"
                        onClick={() => toggleConcern(concern)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 text-left ${
                          active
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs font-semibold ring-1 ring-emerald-600/30'
                            : 'bg-surface hover:bg-emerald-50/50 text-text-secondary hover:text-text-primary border-border hover:border-emerald-600/40'
                        }`}
                      >
                        <span>{concern}</span>
                        {active ? (
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-border/80 flex items-center justify-center text-[9px] text-text-muted font-bold">
                            +
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Multi-step Mode: Navigation to Step 2 */}
                {layoutMode === 'steps' && (
                  <div className="pt-3 border-t border-border/70 flex justify-end">
                    <button
                      type="button"
                      onClick={handleNextFromStep1}
                      className="py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <span>Choose Date & Time Slot</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                STEP 2: Select Date & Time Slot
               ══════════════════════════════════════════════════════════════════ */}
            {(layoutMode === 'single' || currentStep === 2) && (
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-emerald-600 stroke-[2]" />
                    <span>2. Choose Date & Time Slot</span>
                  </label>
                  {layoutMode === 'steps' && selectedConcerns.length > 0 && (
                    <span className="text-[11px] font-medium text-text-muted truncate max-w-[180px]">
                      For: <strong className="text-emerald-800">{selectedConcerns[0]}</strong>
                      {selectedConcerns.length > 1 && ` +${selectedConcerns.length - 1}`}
                    </span>
                  )}
                </div>

                {/* Date Scroll Strip */}
                <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                  {availableDates.map((d) => {
                    const active = selectedDate === d.iso;
                    return (
                      <button
                        key={d.iso}
                        type="button"
                        onClick={() => {
                          setSelectedDate(d.iso);
                          setFormError('');
                        }}
                        className={`flex flex-col items-center justify-center min-w-[58px] sm:min-w-[64px] py-1.5 px-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                          active
                            ? 'border-emerald-700 bg-emerald-700 text-white shadow-xs font-semibold'
                            : 'border-border bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-semibold tracking-wider opacity-85">{d.weekday}</span>
                        <span className="text-sm sm:text-base font-bold my-0.5">{d.dayNum}</span>
                        <span className="text-[10px] opacity-85">{d.month}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Time Slots Grid with Morning / Afternoon Grouping */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-text-muted">
                    <span className="font-medium">Slots for {selectedDate}</span>
                    <span>30 min session</span>
                  </div>

                  {/* Morning Slots */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-text-secondary">
                      <Sun className="w-3 h-3 text-amber-500" />
                      <span>Morning</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                      {morningSlots.map((slot) => {
                        const active = selectedTime === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => {
                              setSelectedTime(slot);
                              setFormError('');
                            }}
                            className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                              active
                                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs font-semibold'
                                : 'bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary border-border hover:border-emerald-600/40'
                            }`}
                          >
                            <Clock className="w-3 h-3 opacity-70" />
                            <span>{slot}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Afternoon / Evening Slots */}
                  <div className="space-y-1 pt-1.5">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-text-secondary">
                      <Sunset className="w-3 h-3 text-indigo-500" />
                      <span>Afternoon & Evening</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                      {afternoonSlots.map((slot) => {
                        const active = selectedTime === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => {
                              setSelectedTime(slot);
                              setFormError('');
                            }}
                            className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                              active
                                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs font-semibold'
                                : 'bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary border-border hover:border-emerald-600/40'
                            }`}
                          >
                            <Clock className="w-3 h-3 opacity-70" />
                            <span>{slot}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Multi-step Mode: Navigation to Step 3 / Back to Step 1 */}
                {layoutMode === 'steps' && (
                  <div className="pt-3 border-t border-border/70 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStep(1);
                        setFormError('');
                      }}
                      className="py-2 px-3 bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary border border-border font-medium text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextFromStep2}
                      className="py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <span>Enter Contact Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                STEP 3: Patient Contact Details & Summary
               ══════════════════════════════════════════════════════════════════ */}
            {(layoutMode === 'single' || currentStep === 3) && (
              <div className="p-4 sm:p-5 space-y-3">
                <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600 stroke-[2]" />
                  <span>3. Patient Contact Details</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-text-secondary block mb-1">
                      Full Name <span className="text-status-error">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={patientName}
                      onChange={(e) => {
                        setPatientName(e.target.value);
                        setFormError('');
                      }}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm sm:text-xs text-text-primary placeholder:text-text-muted focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-text-secondary block mb-1">
                      WhatsApp Phone Number <span className="text-status-error">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={patientPhone}
                        onChange={(e) => {
                          setPatientPhone(e.target.value);
                          setFormError('');
                        }}
                        className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm sm:text-xs text-text-primary placeholder:text-text-muted focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 focus:outline-none transition-colors font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-emerald-800 mt-1 flex items-center gap-1">
                      <MessageSquare className="w-2.5 h-2.5 text-emerald-600" />
                      <span>Instant confirmation will be sent on this WhatsApp</span>
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-text-secondary block mb-1">
                      Email Address <span className="text-text-muted font-normal">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="ramesh@example.com"
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm sm:text-xs text-text-primary placeholder:text-text-muted focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-text-secondary block mb-1">
                      Special Notes / Symptoms <span className="text-text-muted font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Back pain since 2 weeks"
                      value={patientNotes}
                      onChange={(e) => setPatientNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm sm:text-xs text-text-primary placeholder:text-text-muted focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Summary Box */}
                <div className="p-3 bg-surface-subtle border border-border rounded-lg space-y-1.5 text-xs shadow-2xs mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Appointment Slot:</span>
                    <span className="font-semibold text-text-primary">
                      {selectedDate} at {selectedTime}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2 pt-1 border-t border-border/60">
                    <span className="text-text-muted shrink-0">Selected Concerns:</span>
                    <span className="font-medium text-emerald-800 text-right">
                      {selectedConcerns.length > 0 ? selectedConcerns.join(', ') : 'None selected'}
                    </span>
                  </div>
                </div>

                {/* Navigation and Submit Buttons */}
                <div className="pt-2 flex items-center justify-between gap-2">
                  {layoutMode === 'steps' && (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStep(2);
                        setFormError('');
                      }}
                      className="py-2.5 px-3 bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary border border-border font-medium text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-[0.99]"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin stroke-[2]" />
                        <span>Confirming Appointment Slot...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 stroke-[2]" />
                        <span>Confirm & Book Appointment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Clean Minimal Footer */}
          <p className="text-center text-[10px] text-text-muted pt-1">
            {branding.hide_platform_branding || isCustomDomain
              ? `Instant WhatsApp Confirmation • © ${new Date().getFullYear()} ${info.name}`
              : `Powered by Boldlabs CRM • Instant WhatsApp Confirmation • © ${new Date().getFullYear()} ${info.name}`}
          </p>
        </div>
      </div>
    </div>
  );
}

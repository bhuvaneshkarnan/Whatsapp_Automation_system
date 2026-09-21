'use client';

import React, { useState, useEffect } from 'react';
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
  Sunset
} from 'lucide-react';
import { publicBooking, PublicBookingInfo } from '@/lib/api';
import { useBranding } from '@/lib/branding';

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

  // Check if embedded in iframe or embed query param
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isIframe = window.self !== window.top;
      const searchParams = new URLSearchParams(window.location.search);
      const embedParam = searchParams.get('embed') === 'true' || searchParams.get('compact') === 'true';
      setIsEmbedded(isIframe || embedParam);
    }
  }, []);

  // Load clinic/tenant public info
  useEffect(() => {
    async function loadInfo() {
      if (!slug) return;
      setLoading(true);
      setError('');
      try {
        const data = await publicBooking.getInfo(slug);
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

  async function handleConfirmBooking(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (selectedConcerns.length === 0) {
      setFormError('Please select at least one health concern or therapy service.');
      const el = document.getElementById('section-concerns');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!selectedDate || !selectedTime) {
      setFormError('Please choose a preferred appointment date and time slot.');
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
      <div className="min-h-screen bg-canvas text-text-body flex flex-col font-sans">
        {/* Minimal Header */}
        {!isEmbedded && (
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

        <div className="flex-1 flex items-center justify-center p-3 sm:p-6">
          <div className="w-full max-w-lg bg-surface border border-border rounded-xl p-5 sm:p-7 shadow-sm space-y-4">
            {/* Header check icon */}
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-6 h-6 stroke-[2]" />
              </div>
              <h1 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                Appointment Successfully Confirmed!
              </h1>
              <p className="text-xs text-text-muted">
                Booking Reference:{' '}
                <span className="font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                  {bookingSuccess.booking_id.slice(0, 8)}
                </span>
              </p>
            </div>

            {/* Appointment Summary Box (Clean, without doctor) */}
            <div className="bg-surface-subtle border border-border rounded-lg p-4 space-y-2.5 text-xs divide-y divide-border">
              <div className="flex items-center justify-between pb-2">
                <span className="text-text-muted font-medium">Centre / Clinic</span>
                <span className="font-semibold text-text-primary text-right">{info.name}</span>
              </div>

              <div className="flex items-start justify-between pt-2 pb-2 gap-3">
                <span className="text-text-muted font-medium shrink-0">Selected Service(s)</span>
                <span className="font-medium text-emerald-800 text-right">{bookingSuccess.health_concern}</span>
              </div>

              <div className="flex items-center justify-between pt-2 pb-2">
                <span className="text-text-muted font-medium">Scheduled Date & Time</span>
                <span className="font-semibold text-text-primary">
                  {bookingSuccess.appointment_date} at {bookingSuccess.appointment_time}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-text-muted font-medium">Patient Contact</span>
                <span className="font-mono font-medium text-text-primary">{bookingSuccess.patient_phone}</span>
              </div>
            </div>

            {/* WhatsApp Confirmation Notice */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5">
              <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 stroke-[1.5]" />
              <p className="text-xs text-emerald-900 leading-relaxed">
                Confirmation alert was dispatched to your WhatsApp (<strong>{bookingSuccess.patient_phone}</strong>). Please arrive 10 minutes prior to your slot.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1 border-t border-border">
              {cleanBot && (
                <a
                  href={waChatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span>Chat with Clinic on WhatsApp</span>
                  <ExternalLink className="w-3 h-3 stroke-[1.5]" />
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  setBookingSuccess(null);
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
    <div className={`bg-canvas text-text-body font-sans flex flex-col ${isEmbedded ? 'p-1 sm:p-2' : 'min-h-screen'}`}>
      
      {/* ── Top Header Navigation Bar (Hidden when embedded in website) ── */}
      {!isEmbedded && (
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

      {/* ── Main Intake Form Container (Optimized width & compact layout) ── */}
      <div className={`flex-1 ${isEmbedded ? 'py-2 px-1 sm:px-2' : 'py-5 sm:py-7 px-3 sm:px-6'}`}>
        <div className="max-w-xl mx-auto space-y-3.5">
          
          {/* Clinic Information Compact Banner */}
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

          {/* Form Error Notice */}
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Booking Card Form */}
          <form onSubmit={handleConfirmBooking} className="bg-surface border border-border rounded-xl shadow-xs divide-y divide-border overflow-hidden">
            
            {/* STEP 1: Select Health Concern / Therapy Service (Multi-Select) */}
            <div id="section-concerns" className="p-4 sm:p-5 space-y-2.5">
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
            </div>

            {/* STEP 2: Select Date & Time Slot */}
            <div className="p-4 sm:p-5 space-y-3">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-emerald-600 stroke-[2]" />
                <span>2. Choose Date & Time Slot</span>
              </label>

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
            </div>

            {/* STEP 3: Patient Contact Details */}
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
            </div>

            {/* Summary & Submit */}
            <div className="p-4 sm:p-5 bg-surface-subtle/60 space-y-3.5">
              <div className="p-3 bg-surface border border-border rounded-lg space-y-1.5 text-xs shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Appointment Slot:</span>
                  <span className="font-semibold text-text-primary">{selectedDate} at {selectedTime}</span>
                </div>
                <div className="flex items-start justify-between gap-2 pt-1 border-t border-border/60">
                  <span className="text-text-muted shrink-0">Selected Concerns:</span>
                  <span className="font-medium text-emerald-800 text-right">
                    {selectedConcerns.length > 0 ? selectedConcerns.join(', ') : 'None selected'}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-[0.99]"
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

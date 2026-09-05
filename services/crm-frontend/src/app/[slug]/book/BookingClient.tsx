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
  Building2,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Check,
  Stethoscope,
  ChevronRight
} from 'lucide-react';
import { publicBooking, PublicBookingInfo } from '@/lib/api';

export default function BookingClient() {
  const params = useParams();

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

  // Form selections
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedConcern, setSelectedConcern] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientNotes, setPatientNotes] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<{
    booking_id: string;
    doctor_name: string;
    health_concern: string;
    appointment_date: string;
    appointment_time: string;
    patient_name: string;
    patient_phone: string;
    message: string;
  } | null>(null);

  // Load clinic/tenant public info
  useEffect(() => {
    async function loadInfo() {
      if (!slug) return;
      setLoading(true);
      setError('');
      try {
        const data = await publicBooking.getInfo(slug);
        setInfo(data);
        if (data.doctors && data.doctors.length > 0) {
          setSelectedDoctor(data.doctors[0]);
        }
        if (data.health_concerns && data.health_concerns.length > 0) {
          setSelectedConcern(data.health_concerns[0]);
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

  // Generate standard clinic appointment slots
  const availableTimeSlots = [
    '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM',
    '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM'
  ];

  async function handleConfirmBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!patientName.trim()) {
      alert('Please enter your full name.');
      return;
    }
    const cleanDigits = patientPhone.replace(/[^0-9]/g, '');
    if (cleanDigits.length < 10) {
      alert('Please enter a valid 10-digit WhatsApp phone number.');
      return;
    }
    if (!selectedDoctor) {
      alert('Please select a doctor or specialist.');
      return;
    }
    if (!selectedConcern) {
      alert('Please select your consultation reason / health concern.');
      return;
    }
    if (!selectedDate || !selectedTime) {
      alert('Please choose a preferred appointment date and time slot.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await publicBooking.createBooking(slug, {
        patient_name: patientName.trim(),
        patient_phone: patientPhone.trim(),
        patient_email: patientEmail.trim() || undefined,
        doctor_name: selectedDoctor,
        health_concern: selectedConcern,
        booking_date: selectedDate,
        booking_time: selectedTime,
        notes: patientNotes.trim() || undefined,
      });
      setBookingSuccess(res);
    } catch (err: any) {
      alert(err?.message || 'Failed to book appointment. Please try another slot or contact clinic support.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-accent animate-spin mx-auto stroke-[1.5]" />
          <p className="text-xs font-medium text-text-muted">Loading appointment schedule...</p>
        </div>
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-surface border border-border rounded-sm p-6 text-center space-y-3 shadow-subtle">
          <div className="w-10 h-10 rounded-full bg-status-error-bg text-status-error flex items-center justify-center mx-auto border border-status-error-border">
            <AlertCircle className="w-5 h-5 stroke-[1.5]" />
          </div>
          <h2 className="text-sm font-semibold text-text-primary">Clinic Portal Unavailable</h2>
          <p className="text-xs text-text-secondary leading-relaxed">{error || 'This appointment booking portal is currently offline.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-3.5 py-1.5 bg-surface-subtle hover:bg-border text-text-primary text-xs font-medium rounded-sm transition-colors cursor-pointer border border-border"
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
    const waChatUrl = `https://wa.me/${cleanBot}?text=Hello%20${encodeURIComponent(info.name)}%2C%20I%20have%20booked%20an%20appointment%20with%20${encodeURIComponent(bookingSuccess.doctor_name)}%20for%20${encodeURIComponent(bookingSuccess.appointment_date)}%20at%20${encodeURIComponent(bookingSuccess.appointment_time)}.%20Reference%3A%20${encodeURIComponent(bookingSuccess.booking_id.slice(0, 8))}`;

    return (
      <div className="min-h-screen bg-canvas text-text-body flex flex-col font-sans">
        {/* Clean Dashboard Top Nav Header */}
        <header className="h-14 px-4 sm:px-8 border-b border-border bg-surface flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-sm bg-accent text-white flex items-center justify-center font-bold text-xs shrink-0">
              {info.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-text-primary tracking-tight">{info.name}</span>
              <span className="text-text-muted text-xs hidden sm:inline">&bull;</span>
              <span className="text-xs text-text-muted hidden sm:inline">Appointment Confirmed</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-status-success-bg text-status-success border border-status-success-border text-[11px] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Confirmed</span>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-lg bg-surface border border-border rounded-sm p-6 sm:p-8 shadow-subtle space-y-5">
            {/* Header check icon */}
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-full bg-status-success-bg text-status-success border border-status-success-border flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-6 h-6 stroke-[2]" />
              </div>
              <h1 className="text-base font-semibold text-text-primary tracking-tight">
                Appointment Successfully Confirmed
              </h1>
              <p className="text-xs text-text-muted">
                Booking Reference: <span className="font-mono font-semibold text-text-primary bg-surface-subtle px-1.5 py-0.5 rounded-sm border border-border uppercase">{bookingSuccess.booking_id.slice(0, 8)}</span>
              </p>
            </div>

            {/* Appointment Summary Box */}
            <div className="bg-surface-subtle border border-border rounded-sm p-4 space-y-2.5 text-xs divide-y divide-border">
              <div className="flex items-center justify-between pb-2">
                <span className="text-text-muted font-medium">Clinic</span>
                <span className="font-semibold text-text-primary">{info.name}</span>
              </div>

              <div className="flex items-center justify-between pt-2 pb-2">
                <span className="text-text-muted font-medium">Assigned {info.doctor_label || 'Doctor'}</span>
                <span className="font-semibold text-accent">{bookingSuccess.doctor_name}</span>
              </div>

              <div className="flex items-center justify-between pt-2 pb-2">
                <span className="text-text-muted font-medium">Reason / Service</span>
                <span className="font-medium text-text-primary">{bookingSuccess.health_concern}</span>
              </div>

              <div className="flex items-center justify-between pt-2 pb-2">
                <span className="text-text-muted font-medium">Scheduled Date & Time</span>
                <span className="font-semibold text-text-primary">{bookingSuccess.appointment_date} at {bookingSuccess.appointment_time}</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-text-muted font-medium">Patient Contact</span>
                <span className="font-mono text-text-primary">{bookingSuccess.patient_phone}</span>
              </div>
            </div>

            {/* WhatsApp Confirmation Notice */}
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-sm flex items-start gap-2.5">
              <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 stroke-[1.5]" />
              <p className="text-xs text-emerald-900 leading-relaxed">
                A confirmation alert was dispatched to your WhatsApp ({bookingSuccess.patient_phone}). Please arrive 10 minutes prior to your slot.
              </p>
            </div>

            {/* Location info if available */}
            {info.full_location_text && (
              <div className="flex items-start gap-2 text-xs text-text-secondary bg-surface-subtle p-3 rounded-sm border border-border">
                <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5 stroke-[1.5]" />
                <span className="leading-relaxed break-words font-medium">{info.full_location_text}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-border">
              {cleanBot && (
                <a
                  href={waChatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
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
                }}
                className="w-full py-2 px-4 bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary border border-border font-medium text-xs rounded-sm transition-colors cursor-pointer"
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
    <div className="min-h-screen bg-canvas text-text-body font-sans flex flex-col">
      
      {/* ── 1. Top Header Navigation Bar (Identical to Dashboard Style) ── */}
      <header className="h-14 px-4 sm:px-8 border-b border-border bg-surface flex items-center justify-between shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-sm bg-accent text-white flex items-center justify-center font-bold text-xs shrink-0">
            {info.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-text-primary tracking-tight">{info.name}</span>
            <span className="text-text-muted text-xs hidden sm:inline">&bull;</span>
            <span className="text-xs text-text-muted hidden sm:inline capitalize">{info.industry} Direct Booking</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-subtle border border-border rounded-sm text-text-secondary text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-status-success inline-block animate-pulse" />
            <span>Direct Booking Active</span>
          </div>
          <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-accent-subtle border border-accent-border rounded-sm text-accent text-[11px] font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
            <span>Verified Portal</span>
          </div>
        </div>
      </header>

      {/* ── 2. Main Intake Form Container ── */}
      <div className="flex-1 py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-4">
          
          {/* Clinic Address & Hours Banner */}
          {info.full_location_text && (
            <div className="bg-surface border border-border rounded-sm p-3.5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 text-xs">
              <div className="flex items-start gap-2 text-text-secondary flex-1 min-w-0">
                <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5 stroke-[1.5]" />
                <span className="leading-relaxed break-words font-medium">{info.full_location_text}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-text-muted shrink-0 pt-1 sm:pt-0 sm:border-l sm:border-border sm:pl-3.5">
                <Clock className="w-3.5 h-3.5 text-text-muted shrink-0 stroke-[1.5]" />
                <span>Open {info.business_hours?.open || '09:00'} - {info.business_hours?.close || '19:00'}</span>
              </div>
            </div>
          )}

          {/* Booking Card Form */}
          <form onSubmit={handleConfirmBooking} className="bg-surface border border-border rounded-sm shadow-subtle divide-y divide-border">
            
            {/* STEP 1: Select Doctor / Specialist */}
            <div className="p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                  <span>1. Select {info.doctor_label || 'Doctor / Specialist'}</span>
                </label>
                <span className="text-[11px] text-text-muted font-normal">{info.doctors.length} available</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {info.doctors.map((doc) => {
                  const active = selectedDoctor === doc;
                  return (
                    <button
                      key={doc}
                      type="button"
                      onClick={() => setSelectedDoctor(doc)}
                      className={`p-3 rounded-sm border text-left transition-colors cursor-pointer flex items-center justify-between gap-2.5 ${
                        active
                          ? 'border-accent bg-accent-subtle text-accent font-semibold shadow-subtle'
                          : 'border-border bg-surface hover:bg-surface-subtle text-text-primary hover:border-border-strong'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-sm flex items-center justify-center shrink-0 text-xs ${
                          active ? 'bg-accent text-white font-semibold' : 'bg-surface-subtle text-text-muted border border-border'
                        }`}>
                          <User className="w-3.5 h-3.5 stroke-[1.5]" />
                        </div>
                        <span className="text-xs leading-snug truncate">{doc}</span>
                      </div>
                      {active && <Check className="w-4 h-4 text-accent shrink-0 stroke-[2]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: Select Health Concern / Reason */}
            <div className="p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                  <span>2. Select {info.concern_label || 'Health Concern / Service'}</span>
                </label>
                <span className="text-[11px] text-text-muted font-normal">Catalog</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {info.health_concerns.map((concern) => {
                  const active = selectedConcern === concern;
                  return (
                    <button
                      key={concern}
                      type="button"
                      onClick={() => setSelectedConcern(concern)}
                      className={`px-3 py-1.5 rounded-sm text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                        active
                          ? 'bg-accent text-white border-accent shadow-subtle'
                          : 'bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary border-border hover:border-border-strong'
                      }`}
                    >
                      <span>{concern}</span>
                      {active && <Check className="w-3 h-3 stroke-[2]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 3: Select Date & Time Slot */}
            <div className="p-5 sm:p-6 space-y-4">
              <label className="text-[11px] font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                <span>3. Choose Date & Time Slot</span>
              </label>

              {/* Date Scroll Strip */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {availableDates.map((d) => {
                  const active = selectedDate === d.iso;
                  return (
                    <button
                      key={d.iso}
                      type="button"
                      onClick={() => setSelectedDate(d.iso)}
                      className={`flex flex-col items-center justify-center min-w-[64px] py-2 px-2 rounded-sm border transition-colors cursor-pointer shrink-0 ${
                        active
                          ? 'border-accent bg-accent text-white shadow-subtle font-semibold'
                          : 'border-border bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-semibold tracking-wider opacity-80">{d.weekday}</span>
                      <span className="text-sm font-bold my-0.5">{d.dayNum}</span>
                      <span className="text-[10px] opacity-80">{d.month}</span>
                    </button>
                  );
                })}
              </div>

              {/* Time Slots Grid */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
                    Available Slots for {selectedDate}
                  </span>
                  <span className="text-[11px] text-text-muted">30 min duration</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableTimeSlots.map((slot) => {
                    const active = selectedTime === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={`py-2 px-2.5 rounded-sm text-xs font-medium border text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                          active
                            ? 'bg-accent text-white border-accent shadow-subtle font-semibold'
                            : 'bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary border-border hover:border-border-strong'
                        }`}
                      >
                        <Clock className="w-3 h-3 opacity-60 stroke-[1.5]" />
                        <span>{slot}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* STEP 4: Patient Details */}
            <div className="p-5 sm:p-6 space-y-4">
              <label className="text-[11px] font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                <span>4. Patient Contact Details</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">
                    Full Name <span className="text-status-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-sm text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">
                    WhatsApp Phone Number <span className="text-status-error">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-sm text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none transition-colors font-mono"
                  />
                  <p className="text-[10px] text-text-muted mt-1">Instant confirmation and alerts will be sent here.</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">
                    Email Address <span className="text-text-muted font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-sm text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">
                    Special Notes / Symptoms <span className="text-text-muted font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Follow-up consultation"
                    value={patientNotes}
                    onChange={(e) => setPatientNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-sm text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Summary & Submit */}
            <div className="p-5 sm:p-6 bg-surface-subtle/50 space-y-4">
              <div className="p-3.5 bg-surface border border-border rounded-sm space-y-1.5 text-xs shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Selected Slot:</span>
                  <span className="font-semibold text-text-primary">{selectedDate} at {selectedTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Practitioner:</span>
                  <span className="font-medium text-accent">{selectedDoctor || 'Not selected'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Reason:</span>
                  <span className="font-medium text-text-primary">{selectedConcern || 'Not selected'}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold text-xs uppercase tracking-wider rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin stroke-[1.5]" />
                    <span>Confirming Appointment Slot...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span>Confirm & Book Appointment</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <p className="text-center text-[11px] text-text-muted pt-2">
            Powered by Boldlabs CRM &bull; Instant WhatsApp Confirmation &bull; &copy; 2026 {info.name}
          </p>
        </div>
      </div>
    </div>
  );
}

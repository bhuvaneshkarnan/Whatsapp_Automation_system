'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { crm, TenantSettingsResponse } from '@/lib/api';
import {
  Star,
  Check,
  ExternalLink,
  Copy,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Heart,
  ThumbsUp,
  Sparkles,
  Edit3,
} from 'lucide-react';

function cleanClientReview(text: string): string {
  if (!text) return '';
  return text
    .replace(/["“”`]/g, '')
    .replace(/[-—–]/g, ' ')
    .replace(/\b(highlights|notes|review|service):\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const DEFAULT_EXPERIENCE_TAGS = [
  'Friendly & Caring Staff',
  'Clean & Hygienic Space',
  'Quick & Prompt Service',
  'Detailed Explanation',
  'Great Results & Treatment',
  'Value for Money',
  'Comfortable & Relaxing',
  'Easy Booking & Response',
];

function GoogleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

function getExperienceTags(settings: TenantSettingsResponse | null): string[] {
  const custom = (settings as any)?.review_experience_tags;
  if (custom && Array.isArray(custom) && custom.length > 0) return custom;
  return DEFAULT_EXPERIENCE_TAGS;
}

export default function ReviewClient() {
  const params = useParams();
  const searchParams = useSearchParams();

  const slugParam = (params?.slug as string) || searchParams.get('tenant') || 'boldlabs';

  const [settings, setSettings] = useState<TenantSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Result State
  const [submitting, setSubmitting] = useState(false);
  const [editedReviewText, setEditedReviewText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [formError, setFormError] = useState('');
  const [result, setResult] = useState<{
    destination: 'gmb' | 'crm_internal';
    generated_review_text: string;
    gmb_review_url: string;
    copied: boolean;
  } | null>(null);


  useEffect(() => {
    const urlName = searchParams.get('name');
    const urlPhone = searchParams.get('phone');
    if (urlName) setCustomerName(decodeURIComponent(urlName));
    if (urlPhone) setCustomerPhone(decodeURIComponent(urlPhone));
  }, [searchParams]);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const data = await crm.getPublicReviewInfo(slugParam);
        setSettings(data as any);
        const presets =
          (data as any).services ||
          (data as any).requirement_presets ||
          (data as any).taxonomy?.requirement_presets ||
          [];
        if (presets.length > 0) {
          setServiceName(presets[0]);
        }
      } catch (err) {
        console.error('Failed to load business settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [slugParam]);

  const businessName = settings?.name || (settings as any)?.business_name || 'Our Service Team';
  const presets = (
    (settings as any)?.services ||
    (settings as any)?.requirement_presets ||
    settings?.taxonomy?.requirement_presets || [
      'General Service',
      'Consultation',
      'Treatment',
    ]
  ).filter(Boolean);

  // Determine guaranteed Google Review URL
  const targetGmbUrl =
    result?.gmb_review_url ||
    settings?.gmb_review_url ||
    (settings as any)?.google_review_link ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessName)}`;


  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const copyReviewText = async (text: string) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        setResult((prev) => (prev ? { ...prev, copied: true } : null));
        setTimeout(() => {
          setResult((prev) => (prev ? { ...prev, copied: false } : null));
        }, 3000);
      } catch (e) {
        console.warn('Clipboard copy error:', e);
      }
    }
  };

  const handleGenerateAndSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (rating < 1) return;

    if (!customerName.trim()) {
      setFormError('Please enter your name so we can attribute your review.');
      return;
    }

    if (rating <= 3 && !customerPhone.trim()) {
      setFormError('Please enter your WhatsApp/phone number so management can reach out and resolve your issue.');
      return;
    }

    setFormError('');
    setSubmitting(true);
    setRedirectCancelled(false);

    const cleanNotes = [
      selectedTags.join(', '),
      notes.trim(),
    ]
      .filter(Boolean)
      .join('. ');

    try {
      const res = await crm.submitPublicReview({
        tenant_slug: slugParam,
        customer_name: customerName,
        customer_phone: customerPhone,
        service_name: serviceName,
        rating,
        experience_notes: cleanNotes,
      });

      const effectiveGmbUrl =
        res.gmb_review_url ||
        settings?.gmb_review_url ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessName)}`;

      const cleanText = cleanClientReview(res.generated_review_text);
      setEditedReviewText(cleanText);

      let copied = false;
      if (res.destination === 'gmb') {
        if (typeof window !== 'undefined' && navigator.clipboard) {
          try {
            await navigator.clipboard.writeText(cleanText);
            copied = true;
          } catch (e) {
            console.warn('Clipboard write failed:', e);
          }
        }
      }

      setResult({
        destination: res.destination,
        generated_review_text: cleanText,
        gmb_review_url: effectiveGmbUrl,
        copied,
      });
    } catch (err) {
      console.error('Failed to submit review:', err);
      // Fallback local review generation if network error occurs
      const fallbackText = cleanClientReview(
        rating >= 4
          ? `Really happy with the ${serviceName || 'service'} at ${businessName}. Everything was smooth, professional, and very well taken care of. Will definitely be returning again.`
          : `Customer feedback regarding ${serviceName || 'service'}: ${cleanNotes || 'Service review.'}`
      );

      const fallbackGmb = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessName)}`;

      if (rating >= 4 && typeof window !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(fallbackText).catch(() => null);
      }

      setEditedReviewText(fallbackText);
      setResult({
        destination: rating >= 4 ? 'gmb' : 'crm_internal',
        generated_review_text: fallbackText,
        gmb_review_url: fallbackGmb,
        copied: rating >= 4,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegenerateReview = async () => {
    setRegenerating(true);
    cancelAutoRedirect();

    const cleanNotes = [
      selectedTags.join(', '),
      notes.trim(),
    ]
      .filter(Boolean)
      .join('. ');

    try {
      const res = await crm.submitPublicReview({
        tenant_slug: slugParam,
        customer_name: customerName,
        customer_phone: customerPhone,
        service_name: serviceName,
        rating,
        experience_notes: cleanNotes,
      });

      const cleanText = cleanClientReview(res.generated_review_text);
      setEditedReviewText(cleanText);

      if (typeof window !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(cleanText).catch(() => {});
      }

      setResult((prev) =>
        prev
          ? {
              ...prev,
              generated_review_text: cleanText,
              copied: true,
            }
          : null
      );
    } catch (err) {
      console.error('Failed to regenerate review:', err);
    } finally {
      setRegenerating(false);
    }
  };

  const effectiveRating = hoverRating || rating;

  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col items-center justify-center p-3 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-xs overflow-hidden my-4 sm:my-8 transition-all">
        
        {/* Header - Clean Minimal Dashboard Theme */}
        <div className="p-5 border-b border-border bg-surface text-center space-y-2">
          <div className="w-11 h-11 rounded-xl bg-accent/10 text-accent font-headline font-bold text-lg flex items-center justify-center mx-auto border border-accent/20 shadow-2xs">
            {businessName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-base font-bold text-text-primary tracking-tight font-headline">
              {businessName}
            </h1>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-accent stroke-[2]" />
              <p className="text-xs text-text-muted font-medium">Customer Experience & Review Portal</p>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 sm:p-6">
          {loading ? (
            <div className="text-center py-12 text-text-muted text-xs space-y-2.5">
              <RefreshCw className="w-5 h-5 animate-spin text-accent mx-auto stroke-[1.5]" />
              <p className="font-medium">Loading experience portal...</p>
            </div>
          ) : result ? (
            /* Result Screen */
            <div className="space-y-4">
              {result.destination === 'gmb' ? (
                /* 4-5 Stars Result Screen */
                <div className="space-y-4 text-center">
                  
                  {/* Status Banner */}
                  <div className="space-y-1">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/80 mb-1">
                      <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    </div>
                    <h3 className="text-sm font-bold text-text-primary font-headline">
                      Thank You for the {rating}-Star Rating!
                    </h3>
                    <p className="text-xs text-text-muted max-w-xs mx-auto leading-relaxed">
                      Your review has been copied to your clipboard. Tap below to post on Google Maps.
                    </p>
                  </div>

                  {/* Generated Review Box (Clean & Minimal Dashboard Style, No Quotes) */}
                  <div className="p-4 bg-surface-subtle/60 rounded-xl border border-border text-left text-xs font-sans text-text-primary space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px] pb-2 border-b border-border/70">
                      <span className="flex items-center gap-1.5 font-semibold text-text-secondary">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>AI Generated Human Review</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleRegenerateReview}
                        disabled={regenerating}
                        className="inline-flex items-center gap-1.5 text-accent hover:text-accent-hover font-semibold cursor-pointer transition-colors disabled:opacity-50"
                        title="Generate another unique variation"
                      >
                        <RefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} />
                        <span>{regenerating ? 'Generating...' : 'Try Another Version'}</span>
                      </button>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editedReviewText}
                          onChange={(e) => setEditedReviewText(cleanClientReview(e.target.value))}
                          rows={4}
                          className="w-full text-xs font-sans p-2.5 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent text-text-primary resize-none leading-relaxed"
                          placeholder="Your customized review..."
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditing(false);
                              if (result) {
                                setResult({ ...result, generated_review_text: editedReviewText });
                              }
                              copyReviewText(editedReviewText);
                            }}
                            className="px-2.5 py-1 text-[11px] bg-accent text-white font-medium rounded-md hover:bg-accent-hover transition-colors cursor-pointer"
                          >
                            Done Editing
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="leading-relaxed text-text-body select-all font-sans text-[13px] whitespace-pre-wrap">
                        {cleanClientReview(result.generated_review_text)}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-text-muted border-t border-border/70 pt-2.5">
                      <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        {result.copied ? 'Copied to Clipboard' : 'Ready to Paste'}
                      </span>
                      <div className="flex items-center gap-3">
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => {
                              cancelAutoRedirect();
                              setIsEditing(true);
                            }}
                            className="inline-flex items-center gap-1 text-text-muted hover:text-text-primary font-medium cursor-pointer transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => copyReviewText(isEditing ? editedReviewText : result.generated_review_text)}
                          className="inline-flex items-center gap-1 text-accent hover:text-accent-hover font-semibold cursor-pointer transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy Again</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* HOW TO PASTE INSTRUCTION BANNER */}
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-left flex items-start gap-2.5 shadow-2xs">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                      ✓
                    </div>
                    <div className="space-y-0.5 text-emerald-950">
                      <p className="text-xs font-semibold">Review Copied & Ready to Paste</p>
                      <p className="text-[11px] text-emerald-800 leading-normal">
                        When Google Maps opens, tap the review box and select <strong>Paste</strong> (or press <strong>Ctrl+V</strong>) to post it instantly.
                      </p>
                    </div>
                  </div>

                  {/* PROMINENT SUBMIT / REDIRECT TO GOOGLE BUTTON */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const text = isEditing ? editedReviewText : result.generated_review_text;
                        copyReviewText(text);
                        window.open(targetGmbUrl, '_blank', 'noopener,noreferrer');
                      }}
                      className="w-full py-3.5 px-4 bg-[#1a73e8] hover:bg-[#1557b0] active:scale-[0.99] text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                      <GoogleIcon className="w-4 h-4 fill-white" />
                      <span>Open Google Maps & Paste Review</span>
                      <ExternalLink className="w-3.5 h-3.5 text-white/80" />
                    </button>
                  </div>

                  {/* Minimal reset / back link */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setResult(null)}
                      className="text-xs text-text-muted hover:text-text-primary underline cursor-pointer"
                    >
                      Submit another response
                    </button>
                  </div>
                </div>
              ) : (
                /* 1-3 Stars Internal Result Screen */
                <div className="p-5 bg-surface-subtle/50 border border-border rounded-xl text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-surface text-accent flex items-center justify-center mx-auto border border-border shadow-2xs">
                    <Heart className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-text-primary font-headline">
                      Thank You for Your Honest Feedback
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed max-w-sm mx-auto">
                      Your feedback has been sent directly to our management team for private review and continuous improvement. We truly appreciate your time.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResult(null)}
                    className="mt-2 px-4 py-2 bg-surface hover:bg-surface-subtle text-text-primary text-xs font-semibold rounded-lg border border-border transition-colors cursor-pointer"
                  >
                    Submit another response
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Review Form - Clean & Minimal Dashboard Style */
            <form onSubmit={handleGenerateAndSubmit} className="space-y-4">
              
              {/* Service Selection */}
              {presets.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                    Service Experienced
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {presets.map((srv: string) => (
                      <button
                        key={srv}
                        type="button"
                        onClick={() => setServiceName(srv)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          serviceName === srv
                            ? 'bg-accent text-white border-accent shadow-xs font-semibold'
                            : 'bg-surface text-text-secondary border-border hover:border-border-strong hover:text-text-primary'
                        }`}
                      >
                        {srv}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Star Rating Card */}
              <div className="text-center p-4 bg-surface-subtle/40 rounded-xl border border-border space-y-2">
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                  How was your experience?
                </label>
                <div className="flex justify-center items-center gap-2 py-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-115 cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                          effectiveRating >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-border fill-transparent'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* Rating Badge */}
                <div className="pt-0.5">
                  <span
                    className={`inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold border ${
                      rating === 5
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                        : rating === 4
                        ? 'bg-teal-50 text-teal-700 border-teal-200/80'
                        : rating === 3
                        ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                        : 'bg-rose-50 text-rose-700 border-rose-200/80'
                    }`}
                  >
                    {rating === 5
                      ? 'Exceptional! (5/5)'
                      : rating === 4
                      ? 'Great Service (4/5)'
                      : rating === 3
                      ? 'Neutral / Fair (3/5)'
                      : rating === 2
                      ? 'Needs Improvement (2/5)'
                      : 'Unsatisfactory (1/5)'}
                  </span>
                </div>
              </div>

              {/* Multi-Select Experience Tags */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <ThumbsUp className="w-3.5 h-3.5 text-accent" />
                  <span>
                    What stood out?{' '}
                    <span className="font-normal text-text-muted lowercase">(optional)</span>
                  </span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {getExperienceTags(settings).map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-accent/10 text-accent border-accent/30 font-semibold shadow-2xs'
                            : 'bg-surface text-text-secondary border-border hover:border-border-strong hover:text-text-primary'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                        <span>{tag}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customer Notes */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                  Experience Notes <span className="text-text-muted font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Prompt service, friendly staff, clean space..."
                  className="w-full p-3 text-xs bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-sans transition-all"
                />
              </div>

              {/* Customer Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-text-secondary flex items-center justify-between">
                    <span>Your Name</span>
                    <span className="text-[10px] text-rose-500 font-semibold">*Required</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="e.g. John Doe"
                    className={`w-full p-2.5 text-xs bg-surface border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all ${
                      formError && !customerName.trim() ? 'border-rose-400 bg-rose-50/20' : 'border-border'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-text-secondary flex items-center justify-between">
                    <span>WhatsApp Number</span>
                    <span className={`text-[10px] font-semibold ${rating <= 3 ? 'text-rose-500' : 'text-text-muted'}`}>
                      {rating <= 3 ? '*Required to Resolve' : 'Optional'}
                    </span>
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="e.g. 98765 43210"
                    className={`w-full p-2.5 text-xs bg-surface border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-mono transition-all ${
                      formError && rating <= 3 && !customerPhone.trim() ? 'border-rose-400 bg-rose-50/20' : 'border-border'
                    }`}
                  />
                </div>
              </div>

              {/* Form Validation Error Banner */}
              {formError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-left flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                  <div className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 text-[10px] font-bold">
                    !
                  </div>
                  <p className="text-[11px] font-medium text-rose-700 dark:text-rose-300">
                    {formError}
                  </p>
                </div>
              )}

              {/* Primary Submit Button */}
              <div className="space-y-2 pt-1">
                {rating >= 4 ? (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-accent hover:bg-accent-hover active:scale-[0.99] disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <GoogleIcon className="w-4 h-4 fill-white" />
                    <span>
                      {submitting ? 'Generating AI Review...' : 'Post Review on Google'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-text-primary hover:bg-text-body active:scale-[0.99] disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {submitting ? 'Submitting Feedback...' : 'Submit Private Feedback'}
                    </span>
                  </button>
                )}

                <p className="text-[10px] text-center text-text-muted">
                  {rating >= 4
                    ? 'Generates your review, copies it to clipboard, and opens Google Maps.'
                    : 'Your feedback will be sent privately to management for review.'}
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { crm, TenantSettingsResponse } from '@/lib/api';
import { Star, Sparkles, Check, ExternalLink, Heart, ThumbsUp, ShieldCheck, RefreshCw } from 'lucide-react';

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

// Helper: get experience tags from tenant settings or defaults
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
  const [result, setResult] = useState<{
    destination: 'gmb' | 'crm_internal';
    generated_review_text: string;
    gmb_review_url?: string;
    copied: boolean;
  } | null>(null);

  useEffect(() => {
    // Pre-fill customer details from URL params (sent by WhatsApp review nudge)
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
        const presets = (data as any).services || (data as any).requirement_presets || (data as any).taxonomy?.requirement_presets || [];
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

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleGenerateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) return;

    setSubmitting(true);

    const combinedNotes = [
      selectedTags.length > 0 ? `Highlights: ${selectedTags.join(', ')}` : '',
      notes.trim() ? `Notes: ${notes.trim()}` : '',
    ].filter(Boolean).join('. ');

    try {
      const res = await crm.submitPublicReview({
        tenant_slug: slugParam,
        customer_name: customerName,
        customer_phone: customerPhone,
        service_name: serviceName,
        rating,
        experience_notes: combinedNotes,
      });

      let copied = false;
      if (res.destination === 'gmb') {
        if (typeof window !== 'undefined' && navigator.clipboard) {
          try {
            await navigator.clipboard.writeText(res.generated_review_text);
            copied = true;
          } catch (e) {
            console.warn('Clipboard write failed:', e);
          }
        }
      }

      setResult({
        destination: res.destination,
        generated_review_text: res.generated_review_text,
        gmb_review_url: res.gmb_review_url || '',
        copied,
      });

      if (res.destination === 'gmb' && res.gmb_review_url) {
        setTimeout(() => {
          window.open(res.gmb_review_url, '_blank', 'noopener,noreferrer');
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert('Network error. Please try submitting again.');
    } finally {
      setSubmitting(false);
    }
  };

  const businessName = settings?.name || (settings as any)?.business_name || 'Our Service Team';
  const presets = ((settings as any)?.services || (settings as any)?.requirement_presets || settings?.taxonomy?.requirement_presets || ['General Service', 'Consultation', 'Treatment']).filter(Boolean);

  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col items-center justify-center p-3 sm:p-6 font-sans">
      <div className="w-full max-w-lg bg-surface border border-border rounded-xl shadow-xs overflow-hidden my-4 sm:my-8">
        
        {/* Top Header - Clean Dashboard Theme */}
        <div className="p-5 sm:p-6 border-b border-border bg-surface text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-accent/10 text-accent font-headline font-bold text-xl flex items-center justify-center mx-auto border border-accent/20">
            {businessName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">{businessName}</h1>
            <p className="text-xs text-text-muted mt-0.5">Customer Experience & Review Portal</p>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {loading ? (
            <div className="text-center py-12 text-text-muted text-xs space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin text-accent mx-auto stroke-[1.5]" />
              <p>Loading review portal...</p>
            </div>
          ) : result ? (
            /* Result Screen */
            <div className="space-y-4">
              {result.destination === 'gmb' ? (
                /* 4-5 Stars Result */
                <div className="p-5 bg-emerald-50/60 border border-emerald-200 rounded-lg text-center space-y-3.5">
                  <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">Thank you for the {rating}-Star Rating!</h3>
                    <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                      We generated your review text below and copied it to your clipboard.
                    </p>
                  </div>

                  {/* Generated Review Box */}
                  <div className="p-3.5 bg-surface rounded-md border border-border text-left text-xs font-sans text-text-primary space-y-2 shadow-2xs">
                    <p className="italic leading-relaxed text-text-body">"{result.generated_review_text}"</p>
                    <div className="flex items-center justify-between text-[11px] text-text-muted border-t border-border pt-2">
                      <span className="flex items-center gap-1 font-semibold text-emerald-700">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Text Copied to Clipboard
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.clipboard) navigator.clipboard.writeText(result.generated_review_text);
                        }}
                        className="text-accent hover:underline font-semibold cursor-pointer"
                      >
                        Copy Again
                      </button>
                    </div>
                  </div>

                  {result.gmb_review_url ? (
                    <a
                      href={result.gmb_review_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-accent hover:bg-accent-hover text-white font-bold text-xs rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Post Review on Google</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <p className="text-[11px] text-text-muted">
                      Your feedback has been saved successfully!
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => setResult(null)}
                    className="text-xs text-text-muted hover:text-text-primary underline cursor-pointer pt-1 block mx-auto"
                  >
                    Submit another response
                  </button>
                </div>
              ) : (
                /* 1-3 Stars Internal Result */
                <div className="p-5 bg-surface-subtle border border-border rounded-lg text-center space-y-3">
                  <div className="w-11 h-11 rounded-full bg-surface text-accent flex items-center justify-center mx-auto border border-border">
                    <Heart className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">Thank you for your feedback</h3>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed max-w-sm mx-auto">
                      Your feedback has been sent directly to our management team for private review and resolution. We appreciate your honest input.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResult(null)}
                    className="px-4 py-2 bg-surface hover:bg-border text-text-primary text-xs font-semibold rounded-md border border-border transition-colors cursor-pointer"
                  >
                    Submit another response
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Review Form */
            <form onSubmit={handleGenerateAndSubmit} className="space-y-4">
              
              {/* Service Selection */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                  Select Service Experienced
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((srv: string) => (
                    <button
                      key={srv}
                      type="button"
                      onClick={() => setServiceName(srv)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                        serviceName === srv
                          ? 'bg-accent text-white border-accent shadow-2xs font-semibold'
                          : 'bg-surface-subtle text-text-secondary border-border hover:bg-surface hover:text-text-primary hover:border-border-strong'
                      }`}
                    >
                      {srv}
                    </button>
                  ))}
                </div>
              </div>

              {/* Star Rating Bar */}
              <div className="text-center p-4 bg-surface-subtle/70 rounded-lg border border-border space-y-2">
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                  How was your experience?
                </label>
                <div className="flex justify-center items-center gap-2 py-1">
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
                        className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors ${
                          (hoverRating || rating) >= star
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-border fill-surface'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className={`text-xs font-bold ${rating >= 4 ? 'text-amber-600' : 'text-text-secondary'}`}>
                  {rating === 5 ? '⭐ Exceptional! (5/5)' :
                   rating === 4 ? '⭐ Great Service (4/5)' :
                   rating === 3 ? 'Neutral / Fair (3/5)' :
                   rating === 2 ? 'Needs Improvement (2/5)' : 'Unsatisfactory (1/5)'}
                </p>
              </div>

              {/* Multi-Select Experience Feeling Tags */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <ThumbsUp className="w-3.5 h-3.5 text-accent" />
                  <span>How did you feel about the service? <span className="font-normal text-text-muted lowercase">(select multiple)</span></span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {getExperienceTags(settings).map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer flex items-center gap-1 ${
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
                  Customer Experience Notes <span className="text-text-muted font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Clean facility, prompt response, helpful team..."
                  className="w-full p-3 text-xs bg-surface border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent font-sans transition-colors"
                />
              </div>

              {/* Customer Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-text-muted">Your Name (Optional)</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full p-2.5 text-xs bg-surface border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-text-muted">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 98765 43210"
                    className="w-full p-2.5 text-xs bg-surface border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent font-mono"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-bold text-xs rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{submitting ? 'Generating Review...' : 'Generate & Submit Review'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Minimal Trust Footer */}
        <div className="py-3 px-5 border-t border-border bg-surface-subtle/50 flex items-center justify-center gap-1.5 text-[11px] text-text-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-accent" />
          <span>Verified Feedback Portal · {businessName}</span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { crm, TenantSettingsResponse } from '@/lib/api';
import { Star, Sparkles, Check, ExternalLink, Heart, MessageSquare, ThumbsUp, Tag, ShieldCheck } from 'lucide-react';

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

export default function ReviewClient() {
  const params = useParams();
  const searchParams = useSearchParams();

  const slugParam = (params?.slug as string) || searchParams.get('tenant') || 'mindbodyrecovery';

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
    async function loadSettings() {
      setLoading(true);
      try {
        const data = await crm.getTenantSettings(slugParam);
        setSettings(data);
        const presets = data.taxonomy?.requirement_presets || data.requirement_presets || [];
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
        gmb_review_url: res.gmb_review_url || 'https://google.com',
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

  const businessName = settings?.name || settings?.business_name || 'Our Service Team';
  const presets = (settings?.taxonomy?.requirement_presets || settings?.requirement_presets || ['General Service', 'Consultation', 'Treatment']).filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-emerald-500 selection:text-white">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white text-center space-y-2 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-md text-white flex items-center justify-center mx-auto mb-2.5 font-extrabold text-2xl shadow-lg border border-white/25">
              {businessName.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-xl font-bold tracking-tight">{businessName}</h1>
            <p className="text-xs text-emerald-100/90 font-medium">Customer Experience & Review Portal</p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs space-y-2">
              <Sparkles className="w-6 h-6 animate-spin text-emerald-400 mx-auto" />
              <p>Loading review portal...</p>
            </div>
          ) : result ? (
            /* Result Screen */
            <div className="space-y-5 animate-in zoom-in-95 duration-200">
              {result.destination === 'gmb' ? (
                /* 4-5 Stars Result */
                <div className="p-5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-xs border border-emerald-500/30">
                    <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-emerald-200">Thank you for the {rating}-Star Rating!</h3>
                    <p className="text-xs text-emerald-300/80 mt-1">
                      We auto-generated your review text below and copied it to your clipboard.
                    </p>
                  </div>

                  {/* Generated Review Box */}
                  <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-left text-xs font-sans text-slate-200 space-y-2 relative shadow-inner">
                    <p className="italic leading-relaxed">"{result.generated_review_text}"</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2.5">
                      <span className="flex items-center gap-1 font-semibold text-emerald-400">
                        <Check className="w-3.5 h-3.5" /> Text Copied to Clipboard
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.clipboard) navigator.clipboard.writeText(result.generated_review_text);
                        }}
                        className="text-emerald-400 hover:underline font-medium cursor-pointer"
                      >
                        Copy Again
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-emerald-300/90">
                    Click below to open our Google Review page and paste your review in 1 click!
                  </p>

                  <a
                    href={result.gmb_review_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Paste Review on Google My Business</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setResult(null)}
                    className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer pt-2 block mx-auto"
                  >
                    Submit another response
                  </button>
                </div>
              ) : (
                /* 1-3 Stars Internal Result */
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center mx-auto border border-slate-700">
                    <Heart className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Thank you for your feedback</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Your feedback has been sent directly to our management team for private review and resolution. We value your input to continuously improve our services.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResult(null)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Submit another response
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Review Form */
            <form onSubmit={handleGenerateAndSubmit} className="space-y-5">
              
              {/* Service Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Select Service Experienced
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((srv) => (
                    <button
                      key={srv}
                      type="button"
                      onClick={() => setServiceName(srv)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        serviceName === srv
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md font-semibold'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {srv}
                    </button>
                  ))}
                </div>
              </div>

              {/* Star Rating Bar */}
              <div className="text-center p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
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
                      className="p-1 transition-transform hover:scale-125 cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          (hoverRating || rating) >= star
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-700 fill-transparent'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs font-bold text-emerald-400">
                  {rating === 5 ? '⭐ Exceptional! (5/5)' :
                   rating === 4 ? '⭐ Great Service (4/5)' :
                   rating === 3 ? 'Neutral / Fair (3/5)' :
                   rating === 2 ? 'Needs Improvement (2/5)' : 'Unsatisfactory (1/5)'}
                </p>
              </div>

              {/* Multi-Select Experience Feeling Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>How did you feel about the service? (Select multiple)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_EXPERIENCE_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-2.5 py-1.2 rounded-full text-[11px] font-medium border transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-xs'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
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
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Customer Experience Notes <span className="text-slate-500 font-normal uppercase">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Clean facility, fast appointment response, helpful staff..."
                  className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              {/* Customer Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Your Name (Optional)</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 98765 43210"
                    className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{submitting ? 'Generating Review...' : 'Generate & Submit Review'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

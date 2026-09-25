'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { crm } from '@/lib/api';
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Phone,
  Copy,
  Check,
  MessageSquare,
  CalendarCheck,
  Bot,
  BellRing
} from 'lucide-react';

declare global {
  interface Window {
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

function OnboardingContent() {
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenant_id') || '';
  const tenantName = searchParams.get('tenant_name') || 'Your Business';

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'action_required' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [actionNotice, setActionNotice] = useState<{ message: string; metaUrl?: string; phoneStatus?: string; nameStatus?: string; verifiedName?: string } | null>(null);
  const [phoneId, setPhoneId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [copied, setCopied] = useState(false);
  const [metaConfig, setMetaConfig] = useState<{ app_id: string; config_id?: string; version: string } | null>(null);

  const capturedData = useRef<{ phone_number_id?: string; waba_id?: string }>({});

  const activeAppId = metaConfig?.app_id || '966476346452663';
  const activeConfigId = metaConfig?.config_id || '2164202260830085';
  const activeVersion = metaConfig?.version || 'v19.0';

  useEffect(() => {
    crm.getWhatsAppOAuthConfig()
      .then((cfg) => {
        setMetaConfig(cfg);
        initFbSdk(cfg.app_id, cfg.version);
      })
      .catch(() => {
        const fallback = { app_id: '966476346452663', config_id: '2164202260830085', version: 'v19.0' };
        setMetaConfig(fallback);
        initFbSdk(fallback.app_id, fallback.version);
      });

    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin !== 'https://www.facebook.com' &&
        event.origin !== 'https://web.facebook.com' &&
        event.origin !== 'https://business.facebook.com'
      ) {
        return;
      }
      try {
        let payload = event.data;
        if (typeof payload === 'string') {
          payload = JSON.parse(payload);
        }
        if (
          payload?.type === 'WA_EMBEDDED_SIGNUP' &&
          (payload.event === 'FINISH' || payload.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING') &&
          payload.data
        ) {
          capturedData.current = {
            phone_number_id: payload.data.phone_number_id,
            waba_id: payload.data.waba_id,
          };
          if (payload.data.phone_number_id) setPhoneId(payload.data.phone_number_id);
          if (payload.data.waba_id) setWabaId(payload.data.waba_id);
        }

      } catch {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Auto-handle redirect fallback with ?code=...
  useEffect(() => {
    const urlCode = searchParams.get('code');
    const stateParam = searchParams.get('state');
    let resolvedTenantId = tenantId;
    if (!resolvedTenantId && stateParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(stateParam));
        if (parsed.target_tenant_id) resolvedTenantId = parsed.target_tenant_id;
      } catch {}
    }

    if (urlCode && resolvedTenantId && status === 'idle' && !loading) {
      setLoading(true);
      setStatus('processing');
      crm.submitWhatsAppEmbeddedSignup({
        code: urlCode,
        target_tenant_id: resolvedTenantId,
      })
        .then((res: any) => {
          setLoading(false);
          setPhoneId(res.phone_number_id || '');
          setWabaId(res.waba_id || '');
          if (res.status === 'action_required' || res.has_issue) {
            setStatus('action_required');
            setActionNotice({
              message: res.issue_message || res.message || 'Meta flagged the business display name or number.',
              metaUrl: res.meta_manager_url || `https://business.facebook.com/wa/manage/phone-numbers/?waba_id=${res.waba_id}`,
              phoneStatus: res.phone_status,
              nameStatus: res.name_status,
              verifiedName: res.verified_name
            });
          } else {
            setStatus('success');
          }
        })
        .catch((err) => {
          setLoading(false);
          setStatus('error');
          setErrorMessage(err instanceof Error ? err.message : 'WhatsApp registration failed.');
        });
    }
  }, [searchParams, tenantId, status, loading]);

  const initFbSdk = (appId: string, version: string) => {
    if (typeof window === 'undefined') return;

    if (window.FB) {
      try {
        window.FB.init({
          appId: appId || '966476346452663',
          autoLogAppEvents: true,
          xfbml: true,
          version: version || 'v19.0',
        });
      } catch {}
      return;
    }

    window.fbAsyncInit = function () {
      try {
        window.FB.init({
          appId: appId || '966476346452663',
          autoLogAppEvents: true,
          xfbml: true,
          version: version || 'v19.0',
        });
      } catch {}
    };

    if (!document.getElementById('facebook-jssdk')) {
      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      js.src = 'https://connect.facebook.net/en_US/sdk.js';
      js.async = true;
      js.defer = true;
      document.body.appendChild(js);
    }
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartSignup = () => {
    if (!tenantId) {
      setStatus('error');
      setErrorMessage('Missing tenant identifier. Please open the link sent by your administrator.');
      return;
    }

    setLoading(true);
    setStatus('processing');
    capturedData.current = {};

    if (typeof window !== 'undefined' && window.FB) {
      try {
        window.FB.login(
          (response: any) => {
            if (response?.authResponse?.code) {
              const code = response.authResponse.code;
              crm.submitWhatsAppEmbeddedSignup({
                code,
                phone_number_id: capturedData.current.phone_number_id || '',
                waba_id: capturedData.current.waba_id || '',
                target_tenant_id: tenantId,
              })
                .then((res: any) => {
                  setLoading(false);
                  setPhoneId(res.phone_number_id || capturedData.current.phone_number_id || '');
                  setWabaId(res.waba_id || capturedData.current.waba_id || '');

                  if (res.status === 'action_required' || res.has_issue) {
                    setStatus('action_required');
                    setActionNotice({
                      message: res.issue_message || res.message || 'Meta flagged the business display name or number.',
                      metaUrl: res.meta_manager_url || `https://business.facebook.com/wa/manage/phone-numbers/?waba_id=${res.waba_id || capturedData.current.waba_id}`,
                      phoneStatus: res.phone_status,
                      nameStatus: res.name_status,
                      verifiedName: res.verified_name
                    });
                  } else {
                    setStatus('success');
                  }
                })
                .catch((err) => {
                  setLoading(false);
                  setStatus('error');
                  setErrorMessage(err instanceof Error ? err.message : 'WhatsApp registration failed.');
                });
            } else {
              setLoading(false);
              setStatus('idle');
            }
          },
          {
            config_id: activeConfigId,
            response_type: 'code',
            override_default_response_type: true,
            extras: {
              version: 'v4',
              featureType: 'whatsapp_business_app_onboarding',
              sessionInfoVersion: '3',
            },

          }
        );
        return;
      } catch (e) {
        console.warn('FB.login failed, falling back:', e);
      }
    }

    const extras = JSON.stringify({
      version: 'v4',
      sessionInfoVersion: '3',
      featureType: 'whatsapp_business_app_onboarding',
    });
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://crm.goboldlabs.com';
    const redirectUri = `${currentOrigin}/onboard`;
    const metaUrl = `https://business.facebook.com/messaging/whatsapp/onboard/?app_id=${encodeURIComponent(activeAppId)}&config_id=${encodeURIComponent(activeConfigId)}&extras=${encodeURIComponent(extras)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(JSON.stringify({ target_tenant_id: tenantId }))}`;
    window.location.href = metaUrl;
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center p-4 antialiased" style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}>

      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm overflow-hidden">

          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-[#0f766e] to-[#25D366]" />

          <div className="p-6 sm:p-7 space-y-5">

            {/* ── HEADER ── */}
            <div className="flex items-center justify-between pb-4 border-b border-[#e5e7eb]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f0fdfa] border border-[#99f6e4] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 fill-[#0f766e]" viewBox="0 0 24 24">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.23.9 2.43 1.03 2.6.13.17 1.77 2.7 4.28 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.12-.22-.19-.47-.31" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-sm font-bold text-[#111827]" style={{ fontFamily: "'Urbanist', sans-serif" }}>WhatsApp Business API</h1>
                  <p className="text-xs text-[#6b7280] mt-0.5">
                    Workspace: <span className="font-semibold text-[#0f766e]">{tenantName}</span>
                  </p>
                </div>
              </div>

              {status === 'success' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#15803d] animate-pulse" />
                  Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#f3f4f6] text-[#6b7280] border border-[#e5e7eb]">
                  Meta Onboarding
                </span>
              )}
            </div>

            {/* ── 1. IDLE ── */}
            {status === 'idle' && (
              <div className="space-y-5">

                <div>
                  <h2 className="text-lg font-bold text-[#111827] leading-snug" style={{ fontFamily: "'Urbanist', sans-serif" }}>
                    Connect your WhatsApp Business in seconds
                  </h2>
                  <p className="text-xs text-[#6b7280] mt-1.5 leading-relaxed">
                    Sign in with your Facebook account, choose your WhatsApp number, and verify ownership via SMS — no developer setup required.
                  </p>
                </div>

                {/* Trust badges */}
                <div className="bg-[#f0fdfa] border border-[#99f6e4] rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-2.5 text-xs text-[#374151]">
                    <ShieldCheck className="w-4 h-4 text-[#0f766e] shrink-0 mt-0.5" />
                    <span><strong className="text-[#111827]">Official Tech Provider:</strong> Authenticate safely via Meta — no password sharing.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-[#374151]">
                    <Zap className="w-4 h-4 text-[#0f766e] shrink-0 mt-0.5" />
                    <span><strong className="text-[#111827]">Instant AI Automation:</strong> Booking reminders and automated replies activate immediately.</span>
                  </div>
                </div>

                {/* Warning checklist */}
                <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#b45309] shrink-0" />
                    <span className="text-xs font-bold text-[#b45309]" style={{ fontFamily: "'Urbanist', sans-serif" }}>
                      3 Steps to Avoid Meta Rejection
                    </span>
                  </div>

                  <ol className="space-y-3 text-xs text-[#374151]">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#b45309] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <div>
                        <strong className="text-[#111827]">Business Display Name</strong>
                        <p className="mt-0.5 leading-relaxed text-[#4b5563]">
                          Use your full brand name — e.g. <span className="font-semibold text-[#0f766e]">{tenantName} Clinic</span> or <span className="font-semibold text-[#0f766e]">{tenantName} Enterprises</span>.
                        </p>
                        <p className="mt-1 text-[11px] text-[#b45309] leading-relaxed">
                          ❌ Never a single personal name — Meta's AI will instantly decline it.
                        </p>
                      </div>
                    </li>

                    <li className="flex items-start gap-2 pt-2 border-t border-[#fde68a]">
                      <span className="w-5 h-5 rounded-full bg-[#b45309] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <div>
                        <strong className="text-[#111827]">Phone Number (Coexistence Supported 📱)</strong>
                        <p className="mt-0.5 leading-relaxed text-[#4b5563]">Must be able to receive an SMS or WhatsApp code.</p>
                        <div className="mt-1.5 p-2.5 bg-[#f0fdf4] rounded-lg border border-[#bbf7d0] text-[11px] text-[#15803d] leading-relaxed">
                          <strong className="font-semibold text-[#166534]">✨ Keep using WhatsApp on your phone:</strong>
                          <p className="mt-0.5 text-[#166534]">Keep the <strong>WhatsApp Business App</strong> active on your phone! Meta will enable Coexistence so you can make calls and chat on your mobile phone while our CRM runs AI automation simultaneously.</p>
                          <p className="mt-1 text-[#b45309]"><em>(If currently using personal WhatsApp, upgrade to WhatsApp Business app on your phone first — do not delete).</em></p>
                        </div>
                      </div>
                    </li>


                    <li className="flex items-start gap-2 pt-2 border-t border-[#fde68a]">
                      <span className="w-5 h-5 rounded-full bg-[#b45309] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <div>
                        <strong className="text-[#111827]">Category &amp; Website</strong>
                        <p className="mt-0.5 leading-relaxed text-[#4b5563]">
                          Choose your business category and add your website or Instagram/Facebook URL when Meta asks.
                        </p>
                      </div>
                    </li>
                  </ol>
                </div>

                {/* CTA */}
                <button
                  type="button"
                  onClick={handleStartSignup}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 bg-[#25D366] hover:bg-[#1ebe5d] active:bg-[#18a852] text-white font-bold text-sm rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: "'Urbanist', sans-serif" }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.23.9 2.43 1.03 2.6.13.17 1.77 2.7 4.28 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.12-.22-.19-.47-.31" />
                    </svg>
                  )}
                  Connect WhatsApp Business with Meta
                </button>
              </div>
            )}

            {/* ── 2. PROCESSING ── */}
            {status === 'processing' && (
              <div className="py-10 flex flex-col items-center justify-center text-center gap-4">
                <div className="relative flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#f0fdfa] border border-[#99f6e4] animate-ping absolute" />
                  <div className="w-14 h-14 rounded-full bg-white border border-[#99f6e4] flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-[#0f766e] animate-spin" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111827]" style={{ fontFamily: "'Urbanist', sans-serif" }}>Authenticating with Meta…</h3>
                  <p className="text-xs text-[#6b7280] mt-1 leading-relaxed max-w-xs">
                    Complete the phone verification in the Meta popup. Keep this tab open.
                  </p>
                </div>
              </div>
            )}

            {/* ── 3. SUCCESS ── */}
            {status === 'success' && (
              <div className="space-y-5">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-[#15803d] stroke-[2.2]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#111827]" style={{ fontFamily: "'Urbanist', sans-serif" }}>WhatsApp Business Connected!</h2>
                    <p className="text-xs text-[#6b7280] mt-1">
                      Verified and linked to <span className="font-semibold text-[#111827]">{tenantName}</span>.
                    </p>
                  </div>
                </div>

                {/* IDs */}
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-xl p-4 space-y-2.5 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6b7280] font-sans">Phone Number ID</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#0f766e]">{phoneId || 'Active'}</span>
                      {phoneId && (
                        <button type="button" onClick={() => handleCopy(phoneId)} className="text-[#6b7280] hover:text-[#111827] p-1 transition-colors cursor-pointer">
                          {copied ? <Check className="w-3.5 h-3.5 text-[#15803d]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                  {wabaId && (
                    <div className="flex items-center justify-between border-t border-[#e5e7eb] pt-2.5">
                      <span className="text-[#6b7280] font-sans">WABA ID</span>
                      <span className="text-[#374151]">{wabaId}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-[#e5e7eb] pt-2.5">
                    <span className="text-[#6b7280] font-sans">Cloud API Status</span>
                    <span className="font-sans font-medium text-[#15803d] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />
                      Webhooks Subscribed
                    </span>
                  </div>
                </div>

                {/* Active features */}
                <div className="bg-[#f0fdfa] border border-[#99f6e4] rounded-xl p-4 space-y-2.5">
                  <p className="text-[11px] font-bold text-[#0f766e] uppercase tracking-wider" style={{ fontFamily: "'Urbanist', sans-serif" }}>Active Automations</p>
                  <div className="grid grid-cols-1 gap-2 text-xs text-[#374151]">
                    <div className="flex items-center gap-2"><Bot className="w-3.5 h-3.5 text-[#0f766e] shrink-0" /><span>AI Consultation Answering</span></div>
                    <div className="flex items-center gap-2"><CalendarCheck className="w-3.5 h-3.5 text-[#0f766e] shrink-0" /><span>Instant Booking Confirmation</span></div>
                    <div className="flex items-center gap-2"><BellRing className="w-3.5 h-3.5 text-[#0f766e] shrink-0" /><span>24h &amp; 2h Appointment Reminders</span></div>
                    <div className="flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5 text-[#0f766e] shrink-0" /><span>2-Hour Customer Follow-ups</span></div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => window.close()}
                  className="w-full py-3 px-4 bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#374151] font-semibold text-xs rounded-xl border border-[#e5e7eb] transition-colors cursor-pointer"
                >
                  Close this window
                </button>
              </div>
            )}

            {/* ── 3B. ACTION REQUIRED ── */}
            {status === 'action_required' && (
              <div className="space-y-5">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-[#fffbeb] border border-[#fde68a] flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-[#b45309] stroke-[2.2]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#111827]" style={{ fontFamily: "'Urbanist', sans-serif" }}>Action Required by Meta</h2>
                    <p className="text-xs text-[#6b7280] mt-1">
                      Linked but Meta flagged <strong className="text-[#b45309]">{actionNotice?.verifiedName || tenantName}</strong>.
                    </p>
                  </div>
                </div>

                <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-4 space-y-3 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#b45309] shrink-0" />
                    <span className="font-bold text-[#b45309]">Meta Status: {actionNotice?.nameStatus || 'DECLINED'}</span>
                  </div>
                  <p className="text-[#4b5563] leading-relaxed">
                    {actionNotice?.message || 'Single personal names are not accepted. Use a full business name.'}
                  </p>
                  <div className="bg-white rounded-lg p-3 border border-[#fde68a] space-y-2">
                    <p className="font-bold text-[#111827]">How to fix:</p>
                    <ol className="list-decimal pl-4 space-y-1 text-[#4b5563]">
                      <li>Open Meta WhatsApp Manager (button below).</li>
                      <li>Click the ✏️ pencil next to your display name.</li>
                      <li>Change to <strong className="text-[#0f766e]">{tenantName} Clinic</strong> or <strong className="text-[#0f766e]">{tenantName} Enterprises</strong>.</li>
                      <li>Submit — messaging will start working within minutes.</li>
                    </ol>
                  </div>
                </div>

                <div className="space-y-2">
                  {actionNotice?.metaUrl && (
                    <a
                      href={actionNotice.metaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 bg-[#0f766e] hover:bg-[#115e59] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
                      style={{ fontFamily: "'Urbanist', sans-serif" }}
                    >
                      Open Meta WhatsApp Manager
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3zM5 5h6v2H5v12h12v-6h2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>
                      </svg>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setStatus('idle')}
                    className="w-full py-2.5 px-4 bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#374151] font-medium text-xs rounded-xl border border-[#e5e7eb] transition-colors cursor-pointer"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            )}

            {/* ── 4. ERROR ── */}
            {status === 'error' && (
              <div className="py-8 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#fef2f2] border border-[#fecaca] flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-[#b91c1c]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111827]" style={{ fontFamily: "'Urbanist', sans-serif" }}>Connection Incomplete</h3>
                  <p className="text-xs text-[#b91c1c] mt-1 leading-relaxed max-w-xs">
                    {errorMessage || 'Meta Embedded Signup was not completed or was cancelled.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setStatus('idle'); setErrorMessage(''); }}
                  className="px-5 py-2.5 bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#374151] rounded-xl text-xs font-semibold cursor-pointer border border-[#e5e7eb] transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-[#f9fafb] border-t border-[#e5e7eb] flex items-center justify-between text-[11px] text-[#9ca3af]">
            <span>Powered by Boldlabs Platform</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />
              Meta WhatsApp Cloud API
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function OnboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0f766e]" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}

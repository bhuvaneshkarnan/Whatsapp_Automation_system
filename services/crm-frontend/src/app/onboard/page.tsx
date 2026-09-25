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
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
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
        if (payload?.type === 'WA_EMBEDDED_SIGNUP' && payload.event === 'FINISH' && payload.data) {
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
                .then((res) => {
                  setLoading(false);
                  setStatus('success');
                  setPhoneId(res.phone_number_id || capturedData.current.phone_number_id || '');
                  setWabaId(res.waba_id || capturedData.current.waba_id || '');
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
              featureType: 'whatsapp_business_app_onboarding',
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
    const redirectUri = `${currentOrigin}/dashboard`;
    const metaUrl = `https://business.facebook.com/messaging/whatsapp/onboard/?app_id=${encodeURIComponent(activeAppId)}&config_id=${encodeURIComponent(activeConfigId)}&extras=${encodeURIComponent(extras)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(JSON.stringify({ target_tenant_id: tenantId }))}`;
    window.location.href = metaUrl;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans antialiased text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* Background ambient gradient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl opacity-70" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="relative w-full max-w-lg bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Top Accent Line */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-[#25D366]" />

        <div className="p-7 sm:p-8 space-y-6">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/25 flex items-center justify-center shadow-xs shrink-0">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.23.9 2.43 1.03 2.6.13.17 1.77 2.7 4.28 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.12-.22-.19-.47-.31" />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-tight">WhatsApp Business API</h1>
                <p className="text-xs text-slate-400">
                  Workspace: <span className="font-semibold text-emerald-400">{tenantName}</span>
                </p>
              </div>
            </div>

            {status === 'success' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live & Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700/60">
                Official Meta Onboarding
              </span>
            )}
          </div>

          {/* ── 1. IDLE / READY TO CONNECT ──────────────────────────────── */}
          {status === 'idle' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Connect your WhatsApp Business in seconds
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sign in with your Facebook account, choose your WhatsApp number, and verify ownership via SMS. No developer setup or technical configuration required.
                </p>
              </div>

              {/* Security & Feature Badges */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3 text-xs">
                <div className="flex items-start gap-2.5 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Official Tech Provider:</strong> Authenticate safely via Meta without sharing your passwords.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-300">
                  <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Instant AI Automation:</strong> Booking reminders, appointment scheduling, and automated replies activate immediately.
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleStartSignup}
                disabled={loading}
                className="w-full py-3.5 px-5 bg-[#25D366] hover:bg-[#22c35e] text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#25D366]/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.23.9 2.43 1.03 2.6.13.17 1.77 2.7 4.28 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.12-.22-.19-.47-.31" />
                  </svg>
                )}
                <span>Connect WhatsApp Business with Meta</span>
              </button>
            </div>
          )}

          {/* ── 2. PROCESSING STATE ────────────────────────────────────── */}
          {status === 'processing' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-ping absolute" />
                <div className="w-14 h-14 rounded-full bg-slate-950 border border-emerald-500/40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-white tracking-tight">Authenticating with Meta...</h3>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Please complete the phone verification in the Meta popup window. Keep this tab open.
                </p>
              </div>
            </div>
          )}

          {/* ── 3. SUCCESS STATE (CLEAN DASHBOARD UI) ────────────────────── */}
          {status === 'success' && (
            <div className="space-y-6">
              {/* Status Header */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    WhatsApp Business Connected!
                  </h2>
                  <p className="text-xs text-slate-400">
                    Your number is verified and linked to <span className="text-white font-medium">{tenantName}</span>.
                  </p>
                </div>
              </div>

              {/* Credentials & Technical Details Card */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px] font-sans">Phone Number ID</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-emerald-400">{phoneId || 'Registered & Active'}</span>
                    {phoneId && (
                      <button
                        type="button"
                        onClick={() => handleCopy(phoneId)}
                        className="text-slate-400 hover:text-white p-1 rounded-sm cursor-pointer transition-colors"
                        title="Copy Phone Number ID"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                {wabaId && (
                  <div className="flex items-center justify-between border-t border-slate-800/60 pt-2.5">
                    <span className="text-slate-400 text-[11px] font-sans">WABA ID</span>
                    <span className="font-medium text-slate-300">{wabaId}</span>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-800/60 pt-2.5">
                  <span className="text-slate-400 text-[11px] font-sans">Cloud API Status</span>
                  <span className="text-[11px] font-sans font-medium text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Webhooks Subscribed
                  </span>
                </div>
              </div>

              {/* Active Features Checklist */}
              <div className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-4 space-y-2.5 text-xs text-slate-300">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Active Features & Automations
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Bot className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>AI Consultation Answering</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CalendarCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Instant Booking Confirmation</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <BellRing className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>24h & 2h Appointment Reminders</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>2-Hour Customer Follow-ups</span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => window.close()}
                  className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700/80 text-white font-medium text-xs rounded-xl border border-slate-700/60 transition-colors cursor-pointer"
                >
                  Close this window
                </button>
              </div>
            </div>
          )}

          {/* ── 4. ERROR STATE ────────────────────────────────────────── */}
          {status === 'error' && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-white">Connection Incomplete</h3>
                <p className="text-xs text-rose-300 max-w-sm leading-relaxed">
                  {errorMessage || 'Meta Embedded Signup was not completed or was cancelled.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStatus('idle');
                  setErrorMessage('');
                }}
                className="mt-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer border border-slate-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-3 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>Powered by Boldlabs Platform</span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Meta WhatsApp Cloud API
          </span>
        </div>
      </div>
    </div>
  );
}

export default function OnboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}

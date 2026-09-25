'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { crm } from '@/lib/api';
import { Loader2, CheckCircle2, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

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
  const [metaConfig, setMetaConfig] = useState<{ app_id: string; config_id?: string; version: string } | null>(null);

  const capturedData = useRef<{ phone_number_id?: string; waba_id?: string }>({});

  const activeAppId = metaConfig?.app_id || '966476346452663';
  const activeConfigId = metaConfig?.config_id || '2164202260830085';
  const activeVersion = metaConfig?.version || 'v19.0';

  useEffect(() => {
    // 1. Fetch Meta App config from backend
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

    // 2. Listen for postMessage from Meta Embedded Signup
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
                  setPhoneId(res.phone_number_id || '');
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

    // Direct fallback if SDK is blocked
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
    <div className="min-h-screen bg-[#0a0f1d] flex flex-col items-center justify-center p-4 text-white select-none">
      <div className="w-full max-w-lg bg-[#131b2e] border border-slate-700/60 rounded-2xl p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
          <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 flex items-center justify-center shadow-lg shrink-0">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.23.9 2.43 1.03 2.6.13.17 1.77 2.7 4.28 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.12-.22-.19-.47-.31" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Connect WhatsApp Business</h2>
            <p className="text-xs text-slate-400">Onboarding for <span className="text-emerald-400 font-semibold">{tenantName}</span></p>
          </div>
        </div>

        {status === 'idle' && (
          <div className="space-y-6">
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                Link your official WhatsApp Business number directly to the platform using Meta&apos;s secure 1-Click Embedded Signup.
              </p>
              <div className="bg-[#0a0f1d] border border-slate-800 rounded-xl p-4 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>1-Click Instant Activation:</strong> No developer account or manual token generation needed.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Official & Secure:</strong> You verify your phone number via SMS OTP directly on Facebook/Meta.</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartSignup}
              disabled={loading}
              className="w-full py-3.5 px-5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#25D366]/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.23.9 2.43 1.03 2.6.13.17 1.77 2.7 4.28 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.12-.22-.19-.47-.31" />
                </svg>
              )}
              <span>Connect WhatsApp Business with Meta</span>
            </button>
          </div>
        )}

        {status === 'processing' && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <div className="space-y-1">
              <h4 className="text-base font-semibold text-white">Connecting with Meta...</h4>
              <p className="text-xs text-slate-400">
                Please complete the verification popup. Keep this window open.
              </p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-lg font-bold text-white">WhatsApp Business Connected!</h4>
              <p className="text-xs text-slate-300">
                Your WhatsApp Business account is now live and linked to <strong className="text-emerald-400">{tenantName}</strong>.
              </p>
            </div>
            {phoneId && (
              <div className="w-full bg-[#0a0f1d] border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-400">
                <span className="text-[10px] text-slate-500 block uppercase">Phone Number ID</span>
                <span className="font-semibold text-emerald-400">{phoneId}</span>
              </div>
            )}
            <p className="text-xs text-slate-400 pt-2">
              You can now safely close this browser window.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-base font-bold text-white">Connection Failed</h4>
              <p className="text-xs text-rose-300 max-w-sm">
                {errorMessage || 'Meta Embedded Signup was not completed.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setStatus('idle');
                setErrorMessage('');
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0f1d] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}

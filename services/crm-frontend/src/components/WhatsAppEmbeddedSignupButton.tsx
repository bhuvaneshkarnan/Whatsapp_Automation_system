'use client';

import React, { useState, useEffect, useRef } from 'react';
import { crm } from '@/lib/api';
import { Loader2, ExternalLink } from 'lucide-react';

declare global {
  interface Window {
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

interface WhatsAppEmbeddedSignupButtonProps {
  targetTenantId?: string;
  onSuccess: (data: { phone_number_id: string; waba_id: string }) => void;
  onError?: (err: string) => void;
  className?: string;
  label?: string;
  disabled?: boolean;
}

export default function WhatsAppEmbeddedSignupButton({
  targetTenantId,
  onSuccess,
  onError,
  className = '',
  label = 'Connect WhatsApp Business with Meta',
  disabled = false,
}: WhatsAppEmbeddedSignupButtonProps) {
  const [loading, setLoading] = useState(false);
  const [metaConfig, setMetaConfig] = useState<{ app_id: string; config_id?: string; version: string } | null>(null);
  const capturedEventData = useRef<{ phone_number_id?: string; waba_id?: string }>({});

  const activeAppId = metaConfig?.app_id || '966476346452663';
  const activeConfigId = metaConfig?.config_id || '2164202260830085';

  const getMetaOnboardingUrl = () => {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://crm.goboldlabs.com';
    const redirectUri = `${currentOrigin}/dashboard`;
    const extras = JSON.stringify({
      version: 'v4',
      sessionInfoVersion: '3',
      featureType: 'whatsapp_business_app_onboarding',
    });
    let url = `https://business.facebook.com/messaging/whatsapp/onboard/?app_id=${encodeURIComponent(activeAppId)}&config_id=${encodeURIComponent(activeConfigId)}&extras=${encodeURIComponent(extras)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    if (targetTenantId) {
      url += `&state=${encodeURIComponent(JSON.stringify({ target_tenant_id: targetTenantId }))}`;
    }
    return url;
  };

  useEffect(() => {
    // 1. Fetch Meta App ID & configuration from backend
    crm.getWhatsAppOAuthConfig()
      .then((cfg) => {
        setMetaConfig(cfg);
        initFacebookSdk(cfg.app_id, cfg.version);
      })
      .catch((err) => {
        console.warn('Failed to load WhatsApp OAuth config from server:', err);
        const fallback = { app_id: '966476346452663', config_id: '2164202260830085', version: 'v19.0' };
        setMetaConfig(fallback);
        initFacebookSdk(fallback.app_id, fallback.version);
      });

    // 2. Listen for Meta Embedded Signup postMessage events
    const handleMetaMessage = (event: MessageEvent) => {
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
        if (payload?.type === 'WA_EMBEDDED_SIGNUP') {
          if (payload.event === 'FINISH' && payload.data) {
            capturedEventData.current = {
              phone_number_id: payload.data.phone_number_id,
              waba_id: payload.data.waba_id,
            };
          }
        }
      } catch (e) {
        // Ignore non-JSON or unrelated messages
      }
    };

    window.addEventListener('message', handleMetaMessage);
    return () => {
      window.removeEventListener('message', handleMetaMessage);
    };
  }, []);

  const initFacebookSdk = (appId: string, version: string) => {
    if (typeof window === 'undefined') return;

    if (window.FB) {
      try {
        window.FB.init({
          appId: appId || '966476346452663',
          autoLogAppEvents: true,
          xfbml: true,
          version: version || 'v19.0',
        });
      } catch (e) {}
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
      } catch (e) {}
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

  const handleLaunchEmbeddedSignup = () => {
    setLoading(true);
    capturedEventData.current = {};

    if (typeof window !== 'undefined' && window.FB) {
      try {
        window.FB.login(
          (response: any) => {
            if (response?.authResponse?.code) {
              const code = response.authResponse.code;
              crm.submitWhatsAppEmbeddedSignup({
                code,
                phone_number_id: capturedEventData.current.phone_number_id || '',
                waba_id: capturedEventData.current.waba_id || '',
                target_tenant_id: targetTenantId,
              })
                .then((res) => {
                  setLoading(false);
                  onSuccess({
                    phone_number_id: res.phone_number_id || '',
                    waba_id: res.waba_id || '',
                  });
                })
                .catch((err) => {
                  setLoading(false);
                  if (onError) onError(err instanceof Error ? err.message : 'WhatsApp registration failed.');
                });
            } else {
              setLoading(false);
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
        console.warn('FB.login failed, using popup fallback:', e);
      }
    }

    // Direct popup window opener (guaranteed fallback)
    const metaUrl = getMetaOnboardingUrl();
    const w = 660;
    const h = 820;
    const left = typeof window !== 'undefined' ? Math.max(0, (window.screen.width - w) / 2) : 100;
    const top = typeof window !== 'undefined' ? Math.max(0, (window.screen.height - h) / 2) : 100;

    const popup = window.open(
      metaUrl,
      'MetaWhatsAppOnboarding',
      `width=${w},height=${h},top=${top},left=${left},menubar=no,status=no,toolbar=no,scrollbars=yes,resizable=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      window.location.href = metaUrl;
      return;
    }

    // Poll popup window for redirect back to our dashboard
    const pollTimer = setInterval(() => {
      try {
        if (!popup || popup.closed) {
          clearInterval(pollTimer);
          setLoading(false);
          return;
        }

        if (popup.location && popup.location.origin === window.location.origin) {
          const urlParams = new URLSearchParams(popup.location.search);
          const code = urlParams.get('code');
          if (code) {
            clearInterval(pollTimer);
            popup.close();
            crm.submitWhatsAppEmbeddedSignup({
              code,
              phone_number_id: urlParams.get('phone_number_id') || capturedEventData.current.phone_number_id || '',
              waba_id: urlParams.get('waba_id') || capturedEventData.current.waba_id || '',
              target_tenant_id: targetTenantId,
            })
              .then((res) => {
                setLoading(false);
                onSuccess({
                  phone_number_id: res.phone_number_id || '',
                  waba_id: res.waba_id || '',
                });
              })
              .catch((err) => {
                setLoading(false);
                if (onError) onError(err instanceof Error ? err.message : 'WhatsApp registration failed.');
              });
          }
        }
      } catch (e) {
        // Cross-origin access to facebook.com throws security error until it redirects back; ignore
      }
    }, 800);
  };

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={handleLaunchEmbeddedSignup}
        disabled={disabled || loading}
        className={
          className ||
          'px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-md text-xs font-semibold shadow-xs transition-colors duration-150 flex items-center gap-2 cursor-pointer disabled:opacity-50'
        }
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : (
          <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.23.9 2.43 1.03 2.6.13.17 1.77 2.7 4.28 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.12-.22-.19-.47-.31" />
          </svg>
        )}
        <span>{label}</span>
      </button>

      {/* Direct link fallback in case browser blocks popups */}
      <a
        href={getMetaOnboardingUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-accent underline transition-colors pt-0.5"
      >
        <span>Open Meta Onboarding in new tab</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}

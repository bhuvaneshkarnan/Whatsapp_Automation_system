'use client';

import React, { useState, useEffect, useRef } from 'react';
import { crm } from '@/lib/api';
import { Loader2 } from 'lucide-react';

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
  label = 'Connect WhatsApp with Meta',
  disabled = false,
}: WhatsAppEmbeddedSignupButtonProps) {
  const [loading, setLoading] = useState(false);
  const [metaConfig, setMetaConfig] = useState<{ app_id: string; config_id?: string; version: string } | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const capturedEventData = useRef<{ phone_number_id?: string; waba_id?: string }>({});

  useEffect(() => {
    // 1. Fetch Meta App ID & configuration from backend
    crm.getWhatsAppOAuthConfig()
      .then((cfg) => {
        setMetaConfig(cfg);
        initFacebookSdk(cfg.app_id, cfg.version);
      })
      .catch((err) => {
        console.warn('Failed to load WhatsApp OAuth config from server:', err);
        // Fallback default Boldlabs Master Meta App ID & Config ID
        const fallback = { app_id: '966476346452663', config_id: '2164202260830085', version: 'v19.0' };
        setMetaConfig(fallback);
        initFacebookSdk(fallback.app_id, fallback.version);
      });

    // 2. Listen for Meta Embedded Signup session messages
    const handleMetaMessage = (event: MessageEvent) => {
      if (
        event.origin !== 'https://www.facebook.com' &&
        event.origin !== 'https://web.facebook.com'
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
    if (window.FB) {
      setSdkReady(true);
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: appId || '966476346452663',
        autoLogAppEvents: true,
        xfbml: true,
        version: version || 'v19.0',
      });
      setSdkReady(true);
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
    if (!window.FB) {
      if (onError) onError('Facebook SDK is still initializing. Please wait a moment and try again.');
      return;
    }

    setLoading(true);
    capturedEventData.current = {};

    const activeConfigId = metaConfig?.config_id || '2164202260830085';

    const loginOptions: Record<string, any> = {
      config_id: activeConfigId,
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        feature: 'whatsapp_embedded_signup',
        featureType: 'whatsapp_business_app_onboarding',
        sessionInfoVersion: '3',
        version: 2,
      },
    };

    window.FB.login(async (response: any) => {
      if (response?.authResponse && response.authResponse.code) {
        const authCode = response.authResponse.code;
        const phoneId = capturedEventData.current.phone_number_id || '';
        const wabaId = capturedEventData.current.waba_id || '';

        try {
          const res = await crm.submitWhatsAppEmbeddedSignup({
            code: authCode,
            phone_number_id: phoneId,
            waba_id: wabaId,
            target_tenant_id: targetTenantId,
          });
          setLoading(false);
          onSuccess({
            phone_number_id: res.phone_number_id || phoneId,
            waba_id: res.waba_id || wabaId,
          });
        } catch (err: any) {
          setLoading(false);
          const msg = err instanceof Error ? err.message : 'Failed to register WhatsApp account with server.';
          if (onError) onError(msg);
        }
      } else {
        setLoading(false);
        if (response?.status === 'unknown') {
          // Popup was closed or cancelled
          return;
        }
        if (onError) onError('Meta authorization was not completed.');
      }
    }, loginOptions);
  };

  return (
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
  );
}

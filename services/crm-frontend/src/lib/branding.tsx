'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getPublicBranding, PublicBrandingResponse, registerTenantSlug } from './api';

const DEFAULT_BRANDING: PublicBrandingResponse = {
  is_whitelabel: false,
  brand_name: 'Boldlabs CRM',
  brand_logo_url: '',
  brand_favicon_url: '/favicon.ico',
  brand_primary_color: '#059669',
  brand_support_email: 'support@goboldlabs.com',
  brand_support_phone: '+91 99999 99999',
  hide_platform_branding: false,
  custom_domain: null,
  tenant_id: null,
  tenant_slug: null,
  tenant_name: 'Boldlabs',
};

export function isPlatformHost(hostname: string): boolean {
  if (!hostname) return true;
  const h = hostname.toLowerCase().split(':')[0].trim();
  if (
    h === 'crm.goboldlabs.com' ||
    h === 'goboldlabs.com' ||
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h === '168.138.172.197' ||
    h.endsWith('.vercel.app')
  ) {
    return true;
  }
  return false;
}

interface BrandingContextType {
  branding: PublicBrandingResponse;
  isLoading: boolean;
  isCustomDomain: boolean;
}

const BrandingContext = createContext<BrandingContextType>({
  branding: DEFAULT_BRANDING,
  isLoading: true,
  isCustomDomain: false,
});

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<PublicBrandingResponse>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCustomDomain, setIsCustomDomain] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname;
    const isCustom = !isPlatformHost(hostname);
    setIsCustomDomain(isCustom);

    async function resolveBranding() {
      try {
        const data = await getPublicBranding(hostname);
        if (data && data.is_whitelabel) {
          setBranding(data);

          // Dynamically set Document Title
          if (data.brand_name) {
            document.title = `${data.brand_name} | Portal`;
          }

          // Dynamically inject Accent / Primary Brand Color as CSS variable
          if (data.brand_primary_color) {
            document.documentElement.style.setProperty('--brand-primary', data.brand_primary_color);
            document.documentElement.style.setProperty('--accent', data.brand_primary_color);
          }

          // Dynamically inject Favicon
          if (data.brand_favicon_url) {
            let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            link.href = data.brand_favicon_url;
          }

          // Register tenant slug & ID in client memory
          if (data.tenant_slug && data.tenant_id) {
            registerTenantSlug(data.tenant_slug, data.tenant_id);
          }
        }
      } catch (err) {
        console.warn('Failed to resolve dynamic white-label branding:', err);
      } finally {
        setIsLoading(false);
      }
    }

    resolveBranding();
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, isLoading, isCustomDomain }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getPublicBranding, PublicBrandingResponse, registerTenantSlug } from './api';

const DEFAULT_BRANDING: PublicBrandingResponse = {
  is_whitelabel: false,
  brand_name: 'Boldlabs CRM',
  brand_logo_url: '/boldlabs-logo.png?v=3',
  brand_favicon_url: '/icon-192.png?v=3',
  brand_primary_color: '#059669',
  brand_support_email: 'bhuvaneshkarnan@gmail.com',
  brand_support_phone: '+91 99999 99999',
  hide_platform_branding: false,
  custom_domain: null,
  canonical_domain: 'crm.goboldlabs.com',
  is_domain_match: true,
  tenant_id: null,
  tenant_slug: null,
  tenant_name: 'Boldlabs',
};


const NEUTRAL_CUSTOM_BRANDING: PublicBrandingResponse = {
  is_whitelabel: true,
  brand_name: '',
  brand_logo_url: '',
  brand_favicon_url: '/icon-192.png?v=3',
  brand_primary_color: '#079559',
  brand_support_email: '',
  brand_support_phone: '',
  hide_platform_branding: true,
  custom_domain: null,
  canonical_domain: null,
  is_domain_match: true,
  tenant_id: null,
  tenant_slug: null,
  tenant_name: '',
};

function getInitialBranding(): PublicBrandingResponse {
  if (typeof window !== 'undefined') {
    const h = window.location.hostname;
    if (isPlatformHost(h)) {
      return DEFAULT_BRANDING;
    }
    return {
      ...NEUTRAL_CUSTOM_BRANDING,
      custom_domain: h,
      canonical_domain: h,
    };
  }
  // During SSR / static export build: NEVER prerender platform defaults!
  // Return neutral branding so static HTML never bakes in Boldlabs or bhuvaneshkarnan email.
  return NEUTRAL_CUSTOM_BRANDING;
}

export function isPlatformHost(hostname: string): boolean {
  if (!hostname) return true;
  const h = hostname.toLowerCase().split(':')[0].trim();
  if (
    h === 'crm.boldlabs.com' ||
    h === 'boldlabs.com' ||
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

export function getCanonicalDomain(customDomain?: string | null): string {
  if (customDomain && customDomain.trim()) {
    const cd = customDomain.toLowerCase().trim();
    if (cd !== 'null' && cd !== 'undefined' && cd !== 'none') {
      return cd;
    }
  }
  return 'crm.goboldlabs.com';
}

export function checkDomainMatch(currentHostname: string, customDomain?: string | null): boolean {
  if (!currentHostname) return true;
  const cleanHost = currentHostname.toLowerCase().split(':')[0].trim();
  // Allow local development on localhost/127.0.0.1 without forced redirects
  if (cleanHost === 'localhost' || cleanHost === '127.0.0.1') return true;

  const canonical = getCanonicalDomain(customDomain);
  const tenantIsPlatform = canonical === 'crm.goboldlabs.com';

  if (tenantIsPlatform) {
    return isPlatformHost(cleanHost);
  }

  // Tenant has an explicit custom domain (e.g. ai.bizpipe.in)
  return cleanHost === canonical;
}

export function enforceDomainRedirect(currentHostname: string, customDomain?: string | null): boolean {
  if (typeof window === 'undefined') return false;
  if (!checkDomainMatch(currentHostname, customDomain)) {
    const canonical = getCanonicalDomain(customDomain);
    const targetUrl = `https://${canonical}${window.location.pathname}${window.location.search}${window.location.hash || ''}`;
    console.warn(`[Domain Isolation] Host mismatch (${currentHostname} vs canonical ${canonical}). Redirecting to: ${targetUrl}`);
    window.location.replace(targetUrl);
    return true;
  }
  return false;
}


interface BrandingContextType {
  branding: PublicBrandingResponse;
  isLoading: boolean;
  isCustomDomain: boolean;
  isMounted: boolean;
}

const BrandingContext = createContext<BrandingContextType>({
  branding: NEUTRAL_CUSTOM_BRANDING,
  isLoading: true,
  isCustomDomain: false,
  isMounted: false,
});

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<PublicBrandingResponse>(getInitialBranding);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isCustomDomain, setIsCustomDomain] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !isPlatformHost(window.location.hostname);
  });

  useEffect(() => {
    setIsMounted(true);
    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname;
    const isCustom = !isPlatformHost(hostname);
    setIsCustomDomain(isCustom);

    async function resolveBranding() {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        let slugCandidate: string | undefined = searchParams.get('slug') || undefined;

        if (!slugCandidate) {
          const redirectParam = searchParams.get('redirect');
          if (redirectParam) {
            const cleanRedirect = redirectParam.replace(/\\/g, '/').trim();
            const firstSeg = cleanRedirect.split('/').filter(Boolean)[0];
            if (firstSeg && !['dashboard', 'login', 'bhuvanesh', 'admin', 'api'].includes(firstSeg.toLowerCase())) {
              slugCandidate = firstSeg.toLowerCase();
            }
          }
        }

        if (!slugCandidate) {
          const pathSeg = window.location.pathname.split('/').filter(Boolean)[0];
          if (pathSeg && !['dashboard', 'login', 'bhuvanesh', 'admin', 'api'].includes(pathSeg.toLowerCase())) {
            slugCandidate = pathSeg.toLowerCase();
          }
        }

        if (!slugCandidate) {
          const stored = localStorage.getItem('tenant_slug');
          if (stored && !['dashboard', 'login', 'bhuvanesh', 'admin', 'api'].includes(stored.toLowerCase())) {
            slugCandidate = stored.toLowerCase();
          }
        }

        const data = await getPublicBranding(hostname, slugCandidate);
        const baseDefault = isCustom
          ? { ...NEUTRAL_CUSTOM_BRANDING, custom_domain: hostname, canonical_domain: hostname }
          : DEFAULT_BRANDING;
        const resolved = data ? { ...baseDefault, ...data } : baseDefault;
        setBranding(resolved);

        // Dynamically set Document Title
        if (resolved.brand_name) {
          document.title = resolved.is_whitelabel
            ? `${resolved.brand_name} | Portal`
            : `${resolved.brand_name} | Enterprise WhatsApp Platform`;
        }

        // Dynamically inject Accent / Primary Brand Color as CSS variable
        if (resolved.brand_primary_color) {
          document.documentElement.style.setProperty('--brand-primary', resolved.brand_primary_color);
          document.documentElement.style.setProperty('--accent', resolved.brand_primary_color);
        }

        // Safely update browser favicon href without removing nodes from React DOM tree
        const favUrl = resolved.brand_favicon_url || (isCustom ? '' : DEFAULT_BRANDING.brand_favicon_url);
        if (favUrl) {
          const versionedFav = favUrl.includes('?') ? favUrl : `${favUrl}?v=3`;
          const existingIcons = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
          if (existingIcons.length > 0) {
            existingIcons.forEach((el) => {
              el.href = versionedFav;
            });
          } else {
            const linkIcon = document.createElement('link');
            linkIcon.rel = 'icon';
            linkIcon.type = 'image/png';
            linkIcon.href = versionedFav;
            document.head.appendChild(linkIcon);
          }
        }

        // Register tenant slug & ID in client memory
        if (resolved.tenant_slug && resolved.tenant_id) {
          registerTenantSlug(resolved.tenant_slug, resolved.tenant_id);
        }
      } catch (err) {
        console.warn('Failed to resolve dynamic white-label branding:', err);
        if (isCustom) {
          setBranding((prev) => ({
            ...NEUTRAL_CUSTOM_BRANDING,
            ...prev,
            custom_domain: hostname,
            canonical_domain: hostname,
          }));
        }
      } finally {
        setIsLoading(false);
      }
    }

    resolveBranding();
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, isLoading, isCustomDomain, isMounted }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}

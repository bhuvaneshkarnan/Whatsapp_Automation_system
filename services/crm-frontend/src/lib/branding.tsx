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
        const resolved = data ? { ...DEFAULT_BRANDING, ...data } : DEFAULT_BRANDING;
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
        const favUrl = resolved.brand_favicon_url || DEFAULT_BRANDING.brand_favicon_url;
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

        // Register tenant slug & ID in client memory
        if (resolved.tenant_slug && resolved.tenant_id) {
          registerTenantSlug(resolved.tenant_slug, resolved.tenant_id);
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

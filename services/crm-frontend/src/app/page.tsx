'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';
import { isPlatformHost } from '@/lib/branding';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tokenParam = searchParams.get('token');
      const tenantIdParam = searchParams.get('tenant_id');
      const tenantSlugParam = searchParams.get('tenant_slug');
      if (tokenParam) {
        localStorage.setItem('auth_token', tokenParam);
        if (tenantIdParam) localStorage.setItem('tenant_id', tenantIdParam);
        if (tenantSlugParam) localStorage.setItem('tenant_slug', tenantSlugParam);
      }
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.replace('/login');
      return;
    }

    const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const isCustomDomain = !isPlatformHost(currentHostname);

    auth.me()
      .then((me) => {
        const slug = me.tenant_slug || localStorage.getItem('tenant_slug');

        // On a custom domain (e.g. ai.bizpipe.in), verify the stored token belongs
        // to the tenant that owns this domain. If it belongs to a different tenant
        // (e.g. boldlabs), clear the stale token and show login for this domain.
        if (isCustomDomain && slug && slug !== 'bhuvanesh') {
          // Import the branding function to resolve what tenant owns this domain
          import('@/lib/api').then(({ getPublicBranding }) => {
            getPublicBranding(currentHostname).then((branding) => {
              const domainTenantSlug = branding?.tenant_slug;
              if (domainTenantSlug && domainTenantSlug !== slug) {
                // Token belongs to a different tenant — clear and show login for this domain
                localStorage.removeItem('auth_token');
                localStorage.removeItem('tenant_id');
                localStorage.removeItem('tenant_slug');
                router.replace('/login');
                return;
              }
              // Token matches this domain's tenant — proceed normally
              localStorage.setItem('tenant_slug', slug);
              if (me.tenant_id) localStorage.setItem('tenant_id', me.tenant_id);
              router.replace(`/${slug}`);
            }).catch(() => {
              // Can't resolve domain branding — proceed normally
              if (slug) {
                localStorage.setItem('tenant_slug', slug);
                if (me.tenant_id) localStorage.setItem('tenant_id', me.tenant_id);
                router.replace(`/${slug}`);
              } else {
                router.replace('/dashboard');
              }
            });
          });
          return;
        }

        if (slug && slug !== 'bhuvanesh') {
          localStorage.setItem('tenant_slug', slug);
          if (me.tenant_id) localStorage.setItem('tenant_id', me.tenant_id);
          router.replace(`/${slug}`);
          return;
        }
        if (me.role === 'super_admin') {
          router.replace('/bhuvanesh');
          return;
        }
        router.replace('/dashboard');
      })
      .catch(() => {
        localStorage.removeItem('auth_token');
        router.replace('/login');
      });
  }, [router]);

  return null;
}

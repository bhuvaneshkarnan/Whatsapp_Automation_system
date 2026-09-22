'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';

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

    auth.me()
      .then((me) => {
        const slug = me.tenant_slug || localStorage.getItem('tenant_slug');
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

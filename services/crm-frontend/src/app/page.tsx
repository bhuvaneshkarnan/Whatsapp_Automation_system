'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.replace('/login');
      return;
    }

    auth.me()
      .then((me) => {
        if (me.role === 'super_admin') {
          router.replace('/bhuvanesh');
          return;
        }
        const slug = me.tenant_slug || localStorage.getItem('tenant_slug');
        if (slug) {
          localStorage.setItem('tenant_slug', slug);
          if (me.tenant_id) localStorage.setItem('tenant_id', me.tenant_id);
          router.replace(`/${slug}`);
        } else {
          router.replace('/dashboard');
        }
      })
      .catch(() => {
        localStorage.removeItem('auth_token');
        router.replace('/login');
      });
  }, [router]);

  return null;
}

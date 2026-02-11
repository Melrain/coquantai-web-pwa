'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores';
import { setOnUnauthorized } from '@/lib/api';

export default function AuthInit() {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const clearAuthState = useAuthStore((s) => s.clearAuthState);

  useEffect(() => {
    setOnUnauthorized(() => {
      clearAuthState();
    });
    return () => setOnUnauthorized(null);
  }, [clearAuthState]);

  useEffect(() => {
    checkAuth({ silent: true });
  }, [checkAuth]);

  return null;
}

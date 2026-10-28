'use client';

import { useEffect } from 'react';

export default function FetchInterceptor() {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.fetch) return;

    const handleError = (e: ErrorEvent) => {
      if (e.message?.includes('Cannot set property fetch')) {
        e.preventDefault();
      }
    };
    window.addEventListener('error', handleError);

    const originalFetch = window.fetch.bind(window);

    const interceptedFetch: typeof window.fetch = async (
      input: RequestInfo | URL,
      init?: RequestInit
    ) => {
      if (typeof input === 'string') {
        // Redirigir automáticamente IPs LAN antiguas al origen actual para evitar Failed to fetch
        if (input.includes('192.168.') && input.includes('/api/')) {
          const apiIdx = input.indexOf('/api/');
          const relativePath = input.slice(apiIdx);
          return await originalFetch(relativePath, init);
        }
      }
      return await originalFetch(input, init);
    };

    let currentFetch: typeof window.fetch = interceptedFetch;

    try {
      Object.defineProperty(window, 'fetch', {
        configurable: true,
        get: () => currentFetch,
        set: (f) => {
          currentFetch = f;
        },
      });
    } catch {
      // Ignorar si el entorno restringe la redefinición de window.fetch
    }

    return () => {
      window.removeEventListener('error', handleError);
      try {
        currentFetch = originalFetch;
      } catch {
        // Ignorar errores al restaurar fetch
      }
    };
  }, []);

  return null;
}


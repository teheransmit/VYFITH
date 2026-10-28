'use client';

import { useEffect } from 'react';

let baseFetch: typeof window.fetch | null = null;

function installFetchInterceptor() {
  if (typeof window === 'undefined' || !window.fetch) return () => {};

  const handleError = (e: ErrorEvent) => {
    if (e.message?.includes('Cannot set property fetch')) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  };

  window.addEventListener('error', handleError, true);

  if (!baseFetch) {
    baseFetch = window.fetch.bind(window);
  }
  const originalFetch = baseFetch;

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
      enumerable: true,
      get: () => currentFetch,
      set: (f) => {
        if (typeof f === 'function') {
          currentFetch = f;
        }
      },
    });
  } catch {
    // Ignorar si el entorno restringe la redefinición de window.fetch
  }

  return () => {
    window.removeEventListener('error', handleError, true);
    try {
      currentFetch = originalFetch;
    } catch {
      // Ignorar errores al restaurar fetch
    }
  };
}

// Inicialización temprana en cliente antes de la hidratación
if (typeof window !== 'undefined') {
  installFetchInterceptor();
}

export default function FetchInterceptor() {
  useEffect(() => {
    const cleanup = installFetchInterceptor();
    return cleanup;
  }, []);

  return null;
}



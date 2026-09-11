'use client';

import { useEffect } from 'react';

export default function FetchInterceptor() {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.fetch) {
        var desc = Object.getOwnPropertyDescriptor(window, 'fetch');
        if (desc && !desc.set) {
          var origFetch = window.fetch;
          Object.defineProperty(window, 'fetch', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: origFetch
          });
        }
      }
    } catch (e) {
      console.error('Fetch patch error:', e);
    }
  }, []);

  return null;
}

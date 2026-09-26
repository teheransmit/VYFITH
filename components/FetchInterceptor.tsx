'use client';

import { useEffect } from 'react';

/**
 * Patch window.fetch so that environments or libraries attempting to overwrite
 * window.fetch (e.g. `window.fetch = patchedFetch`) do not throw:
 * "TypeError: Cannot set property fetch of #<Window> which has only a getter"
 */
function applyFetchPatch() {
  if (typeof window === 'undefined') return;

  try {
    // If setting window.fetch throws, install a getter/setter pair
    let testOriginal = window.fetch;
    let assignmentFailed = false;

    try {
      // Test if assignment is forbidden
      window.fetch = testOriginal;
    } catch {
      assignmentFailed = true;
    }

    if (assignmentFailed || true) {
      let currentFetch = testOriginal;
      try {
        Object.defineProperty(window, 'fetch', {
          configurable: true,
          enumerable: true,
          get() {
            return currentFetch;
          },
          set(newFetch) {
            currentFetch = newFetch;
          },
        });
      } catch {
        // If defining directly on window fails, try Window.prototype
        try {
          const proto = Object.getPrototypeOf(window);
          if (proto) {
            Object.defineProperty(proto, 'fetch', {
              configurable: true,
              enumerable: true,
              get() {
                return currentFetch;
              },
              set(newFetch) {
                currentFetch = newFetch;
              },
            });
          }
        } catch {}
      }
    }
  } catch {}

  // Global safety net for any external script attempting to set fetch
  try {
    window.addEventListener(
      'error',
      (event) => {
        if (
          event?.message &&
          (event.message.includes('Cannot set property fetch') ||
            event.message.includes('only a getter'))
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      true
    );
  } catch {}
}

// Run immediately as soon as client bundle is evaluated
if (typeof window !== 'undefined') {
  applyFetchPatch();
}

export default function FetchInterceptor() {
  useEffect(() => {
    applyFetchPatch();
  }, []);

  return null;
}

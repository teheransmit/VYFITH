'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AcademicInteractiveOverrides,
  DEFAULT_ACADEMIC_OVERRIDES,
  TrackedCourseId,
  CourseOverrideMode,
  computeAcademicProjection,
  mergeAcademicOverrides,
} from './academicReactiveEngine';

const STORAGE_KEY = 'vyfith-academic-overrides-v1';
const EVENT_NAME = 'vyfith-academic-updated';

function readFromLocalStorage(): AcademicInteractiveOverrides | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return mergeAcademicOverrides(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeAndBroadcast(overrides: AcademicInteractiveOverrides) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    window.dispatchEvent(new CustomEvent<AcademicInteractiveOverrides>(EVENT_NAME, { detail: overrides }));
  } catch {
    // ignorar si storage no está disponible
  }
}

export function useAcademicReactiveState() {
  const [overrides, setOverrides] = useState<AcademicInteractiveOverrides>(
    DEFAULT_ACADEMIC_OVERRIDES
  );
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  useEffect(() => {
    const local = readFromLocalStorage();
    if (local) {
      setOverrides(local);
    }
    setHydrated(true);

    let cancelled = false;
    fetch('/api/academic', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (cancelled || !payload?.overrides) return;
        const serverOverrides = mergeAcademicOverrides(payload.overrides);
        const localTime = local?.updatedAt ? Date.parse(local.updatedAt) : 0;
        const serverTime = serverOverrides.updatedAt
          ? Date.parse(serverOverrides.updatedAt)
          : 0;
        if (!local || serverTime > localTime) {
          setOverrides(serverOverrides);
          writeAndBroadcast(serverOverrides);
        }
      })
      .catch(() => {
        // Silencioso en carga inicial; mantiene estado local
      });

    const handleCustomEvent = (e: Event) => {
      const custom = e as CustomEvent<AcademicInteractiveOverrides>;
      if (custom.detail) {
        setOverrides(mergeAcademicOverrides(custom.detail));
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setOverrides(mergeAcademicOverrides(JSON.parse(e.newValue)));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener(EVENT_NAME, handleCustomEvent);
    window.addEventListener('storage', handleStorageEvent);
    return () => {
      cancelled = true;
      window.removeEventListener(EVENT_NAME, handleCustomEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  const updateOverrides = useCallback(
    (
      updater:
        | Partial<AcademicInteractiveOverrides>
        | ((prev: AcademicInteractiveOverrides) => AcademicInteractiveOverrides)
    ) => {
      setOverrides((prev) => {
        const computed =
          typeof updater === 'function'
            ? updater(prev)
            : {
                ...prev,
                ...updater,
                courseStatuses: {
                  ...prev.courseStatuses,
                  ...(updater.courseStatuses ?? {}),
                },
              };
        const next = mergeAcademicOverrides({
          ...computed,
          updatedAt: new Date().toISOString(),
        });

        writeAndBroadcast(next);

        setSaving(true);
        setLastSyncError(null);
        fetch('/api/academic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        })
          .then(async (res) => {
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}`);
            }
            const json = await res.json();
            if (json?.warning) {
              setLastSyncError(json.warning);
            }
          })
          .catch((err) => {
            setLastSyncError(
              err instanceof Error
                ? `Guardado SOLO en navegador local (API ${err.message})`
                : 'Guardado SOLO en navegador local'
            );
          })
          .finally(() => setSaving(false));

        return next;
      });
    },
    []
  );

  const setCourseResolution = useCallback(
    (courseId: TrackedCourseId, mode: CourseOverrideMode) => {
      updateOverrides((prev) => ({
        ...prev,
        courseStatuses: {
          ...prev.courseStatuses,
          [courseId]: mode,
        },
      }));
    },
    [updateOverrides]
  );

  const toggleHomologateSuelosLab = useCallback(
    (explicitValue?: boolean) => {
      updateOverrides((prev) => ({
        ...prev,
        homologateSuelosLab:
          typeof explicitValue === 'boolean' ? explicitValue : !prev.homologateSuelosLab,
      }));
    },
    [updateOverrides]
  );

  const resetAcademicOverrides = useCallback(() => {
    updateOverrides(() => ({
      ...DEFAULT_ACADEMIC_OVERRIDES,
      courseStatuses: { ...DEFAULT_ACADEMIC_OVERRIDES.courseStatuses },
    }));
  }, [updateOverrides]);

  const projection = useMemo(() => computeAcademicProjection(overrides), [overrides]);

  return {
    overrides,
    projection,
    hydrated,
    saving,
    lastSyncError,
    updateOverrides,
    setCourseResolution,
    toggleHomologateSuelosLab,
    resetAcademicOverrides,
  };
}

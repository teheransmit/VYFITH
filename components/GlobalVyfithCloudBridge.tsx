'use client';

import { useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebaseClient';
import { normalizeIncomingVyfithPayload } from '@/lib/vyfithHealthNormalizer';

const SANTIAGO_PHONE_UID = 'ZVcSo21uZTOujKDgBWlSMqctLjg2';

/**
 * Puente Global en Segundo Plano (siempre montado en la raíz de VYFITH).
 * Escucha Firestore (`health_sync_stream/latest` y `users/ZVcSo21uZTOujKDgBWlSMqctLjg2/healthSync/latest`)
 * sin importar en qué pestaña esté el usuario (Resumen, Bio IA, Finanzas, Agenda o Salud).
 * Persiste en `/api/sync/health` y dispara los eventos reactivos globales para correlacionar toda la página.
 */
export default function GlobalVyfithCloudBridge() {
  const lastFingerprintRef = useRef<string>('');

  useEffect(() => {
    const db = getFirestoreDb();
    if (!db) return;

    const handleSnapshot = (docData: any, sourceTag: string) => {
      if (!docData) return;
      const norm = normalizeIncomingVyfithPayload(docData);
      if (norm.isBlankEmulator) {
        return; // Bloqueo anti-sobrescritura de emuladores vacíos de AI Studio
      }

      const snapshotIso = docData.updatedAt?.toDate
        ? docData.updatedAt.toDate().toISOString()
        : String(docData.updatedAt || '');
      const fingerprint = `${snapshotIso}|${norm.steps}|${norm.totalSleepHours}|${norm.readinessScore}|${norm.hydrationState?.totalIntakeMl ?? 0}|${norm.financeSummary?.totalLiquidityCop ?? 0}|w:${norm.watchExerciseSessions.length}`;
      if (fingerprint === lastFingerprintRef.current) return;
      lastFingerprintRef.current = fingerprint;

      void fetch('/api/sync/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'VYFITH_APP',
          deviceId: norm.deviceId || 'V2027',
          deviceName: `VYFITH_APP (${sourceTag})`,
          readinessScore: norm.readinessScore,
          readinessCategory: norm.readinessCategory,
          geminiAnalysis: norm.geminiAnalysis,
          roomMetrics: docData.roomMetrics || {},
          extendedBiometrics: docData.extendedBiometrics || undefined,
          superAppSummary: docData.superAppSummary || undefined,
          hevyWorkouts: docData.hevyWorkouts || undefined,
          hydrationState: norm.hydrationState || undefined,
          nutritionState: norm.nutritionState || undefined,
          latestMeasurement: norm.latestMeasurement || undefined,
          financeModule: norm.financeSummary || undefined,
          closetModule: norm.closetSummary || undefined,
          notesModule: norm.notesSummary || undefined,
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((res) => {
          if (res?.success && res?.data && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('vyfith-health-sync', { detail: res.data }));
            if (res.data.superAppSync) {
              window.dispatchEvent(
                new CustomEvent('vyfith-superapp-sync', { detail: res.data.superAppSync })
              );
            }
            if (res.watchFusion && (res.watchFusion.newlyFusedCount > 0 || res.watchFusion.watchSessionsCount > 0)) {
              window.dispatchEvent(
                new CustomEvent('vyfith-hevy-updated', {
                  detail: { ...res.watchFusion, fromCloudBridge: true },
                })
              );
            }
          }
        })
        .catch(() => {});
    };

    const unsubs: Array<() => void> = [];
    try {
      unsubs.push(
        onSnapshot(
          doc(db, 'health_sync_stream', 'latest'),
          (snap) => {
            if (snap.exists()) handleSnapshot(snap.data(), 'Firestore Stream');
          },
          () => {}
        )
      );
      unsubs.push(
        onSnapshot(
          doc(db, 'users', SANTIAGO_PHONE_UID, 'healthSync', 'latest'),
          (snap) => {
            if (snap.exists()) handleSnapshot(snap.data(), 'Vivo Y20 Cloud');
          },
          () => {}
        )
      );
    } catch {
      // ignore client firestore init warnings
    }

    return () => {
      unsubs.forEach((u) => {
        try {
          u();
        } catch {}
      });
    };
  }, []);

  return null;
}

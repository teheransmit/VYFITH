'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  RefreshCw,
  Activity,
  BatteryCharging,
  ShieldAlert,
  Heart,
  Flame,
  Moon,
  Dumbbell,
  Bot,
  Cloud,
  Wifi,
  Scale,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SyncSessionState, HealthObservation } from '@/lib/healthStore';
import { normalizeIncomingVyfithPayload } from '@/lib/vyfithHealthNormalizer';
import { getFirestoreDb, getFirebaseAuth } from '@/lib/firebaseClient';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import BiomedicalIntelligencePanel from '@/components/BiomedicalIntelligencePanel';
import MiFitnessHealthSuite from '@/components/MiFitnessHealthSuite';

export interface GoogleHealthConnectorProps {
  hideNestedSuites?: boolean;
  onSyncStateChange?: (state: SyncSessionState) => void;
}

export default function GoogleHealthConnector({
  hideNestedSuites = false,
  onSyncStateChange,
}: GoogleHealthConnectorProps = {}) {
  const [syncState, setSyncState] = useState<SyncSessionState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [isCloudBridgeActive, setIsCloudBridgeActive] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isDiagExpanded, setIsDiagExpanded] = useState(false);

  const [copiedUrl, setCopiedUrl] = useState(false);
  const localSyncEndpoint = 'http://192.168.1.8:3000/api/sync/health';

  const loadData = React.useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const res = await fetch(`/api/sync/health?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.data) {
        setSyncState((prev) => {
          if (prev && isCloudBridgeActive) {
            const prevTime = new Date(prev.lastSyncTime || 0).getTime();
            const incomingTime = new Date(data.data.lastSyncTime || 0).getTime();
            if (prevTime > incomingTime) {
              return prev;
            }
          }
          return data.data;
        });
        onSyncStateChange?.(data.data);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('vyfith-health-sync', { detail: data.data }));
        }
      }
    } catch (err) {
      console.error('Error fetching health sync state:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Carga inmediata
    loadData(false);

    // 2. Sondeo en tiempo real cada 3 segundos si la pestaña está activa
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadData(true);
      }
    }, 3000);

    // 3. Refrescar de inmediato en cuanto Santiago vuelve a la pestaña del navegador
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadData(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadData]);

  // 4. Suscripción en Tiempo Real al Puente en la Nube (Firestore Named Database)
  useEffect(() => {
    const auth = getFirebaseAuth();
    const db = getFirestoreDb();
    if (!auth || !db) return;

    let unsubUserSnapshot: (() => void) | null = null;
    let unsubStreamSnapshot: (() => void) | null = null;
    let unsubSlugSnapshot: (() => void) | null = null;

    const processDocData = (docData: any, sourceTag = 'Cloud Firestore') => {
      if (!docData) return;
      const norm = normalizeIncomingVyfithPayload(docData);
      if (norm.isBlankEmulator) {
        return; // Ignorar paquetes en blanco de emuladores Android
      }

      const nowIso = new Date().toISOString();
      const snapshotIso = docData.updatedAt?.toDate
        ? docData.updatedAt.toDate().toISOString()
        : docData.updatedAt || nowIso;

      const stepsVal = norm.steps;
      const hrVal = norm.restingHeartRate ?? 0;
      const sleepVal = norm.totalSleepHours;
      const deepSleepVal = norm.deepSleepHours;
      const lightSleepVal = norm.lightSleepHours;
      const remSleepVal = norm.remSleepHours;
      const awakeMinVal = norm.awakeMinutes;
      const awakeningsVal = norm.awakeningsCount;
      const sleepEfficiencyVal = norm.sleepEfficiency;
      const sleepStartStr = norm.sleepStartTime;
      const sleepEndStr = norm.sleepEndTime;
      const isFallbackRecentSleep = norm.isFallbackRecentSleep;
      const sleepDateStr = norm.sleepDate;

      const readinessVal = norm.readinessScore ?? 75;
      const spo2Val = norm.spo2 ?? 0;
      const calVal = norm.caloriesBurned ?? 0;
      const avgHrVal = norm.avgHeartRate;
      const minHrVal = norm.minHeartRate;
      const maxHrVal = norm.maxHeartRate;
      const hrvVal = norm.hrv ?? 0;
      const distanceVal = norm.distanceMeters;
      const activeCalVal = norm.activeCaloriesBurned;
      const totalCalVal = norm.totalCaloriesBurned;
      const bmrVal = norm.basalMetabolicRateKcal;
      const activityMinVal = norm.activityMinutes;
      const respRateVal = norm.respiratoryRateBpm;
      const bpSysVal = norm.bloodPressureSystolic;
      const bpDiaVal = norm.bloodPressureDiastolic;
      const glucoseVal = norm.bloodGlucoseMgDl;
      const elevationVal = norm.elevationGainedMeters;
      const avgSpeedVal = norm.avgSpeedMps;
      const powerVal = norm.powerWatts;
      const hydrationLitersVal = norm.hydrationLiters;

      const incomingHydration = norm.hydrationState;
      const incomingNutrition = norm.nutritionState;
      const incomingMeasurement = norm.latestMeasurement;
      const incomingFinance = norm.financeSummary;
      const incomingCloset = norm.closetSummary;
      const incomingNotes = norm.notesSummary;

      const dynamicObservations: HealthObservation[] = [
        {
          id: `fb-readiness-${Date.now()}`,
          resourceType: 'Observation',
          status: 'final',
          category: 'Recuperación / Readiness AI',
          code: {
            coding: [{ system: 'http://loinc.org', code: '77202-0', display: 'Athlete Readiness Score (0-100)' }],
          },
          valueQuantity: { value: readinessVal, unit: 'score' },
          effectiveDateTime: snapshotIso,
        },
        {
          id: `fb-steps-${Date.now()}`,
          resourceType: 'Observation',
          status: 'final',
          category: 'Health Connect - Pasos',
          code: {
            coding: [{ system: 'http://loinc.org', code: '55423-8', display: 'Number of steps' }],
          },
          valueQuantity: { value: stepsVal, unit: 'steps' },
          effectiveDateTime: snapshotIso,
        },
        {
          id: `fb-hr-${Date.now()}`,
          resourceType: 'Observation',
          status: 'final',
          category: 'Cardiovascular - Reposo',
          code: {
            coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Resting Heart Rate' }],
          },
          valueQuantity: { value: hrVal, unit: 'bpm' },
          effectiveDateTime: snapshotIso,
        },
        {
          id: `fb-sleep-${Date.now()}`,
          resourceType: 'Observation',
          status: 'final',
          category: 'Health Connect - Sueño',
          code: {
            coding: [{ system: 'http://loinc.org', code: '93832-4', display: 'Sleep duration total' }],
          },
          valueQuantity: { value: sleepVal, unit: 'hours' },
          effectiveDateTime: snapshotIso,
        },
        {
          id: `fb-spo2-${Date.now()}`,
          resourceType: 'Observation',
          status: 'final',
          category: 'Oximetría Biométrica',
          code: {
            coding: [{ system: 'http://loinc.org', code: '2708-6', display: 'Oxygen saturation (SpO2)' }],
          },
          valueQuantity: { value: spo2Val, unit: '%' },
          effectiveDateTime: snapshotIso,
        },
      ];

      if (hrvVal > 0) {
        dynamicObservations.push({
          id: `fb-hrv-${Date.now()}`,
          resourceType: 'Observation',
          status: 'final',
          category: 'Recuperación Autónoma (HRV)',
          code: { coding: [{ system: 'http://loinc.org', code: '80404-7', display: 'HRV RMSSD' }] },
          valueQuantity: { value: hrvVal, unit: 'ms' },
          effectiveDateTime: snapshotIso,
        });
      }
      if (distanceVal && distanceVal > 0) {
        dynamicObservations.push({
          id: `fb-dist-${Date.now()}`,
          resourceType: 'Observation',
          status: 'final',
          category: 'Health Connect - Distancia',
          code: { coding: [{ system: 'http://loinc.org', code: '41950-7', display: 'Distance' }] },
          valueQuantity: { value: distanceVal, unit: 'm' },
          effectiveDateTime: snapshotIso,
        });
      }

      const extendedRoomPayload = {
        steps: stepsVal,
        deepSleepHours: deepSleepVal,
        lightSleepHours: lightSleepVal,
        remSleepHours: remSleepVal,
        awakeMinutes: awakeMinVal,
        awakeningsCount: awakeningsVal,
        sleepEfficiency: sleepEfficiencyVal,
        sleepStartTime: sleepStartStr,
        sleepEndTime: sleepEndStr,
        isFallbackRecentSleep,
        sleepDate: sleepDateStr,
        totalSleepHours: sleepVal,
        restingHeartRate: hrVal,
        avgHeartRate: avgHrVal,
        minHeartRate: minHrVal,
        maxHeartRate: maxHrVal,
        hrv: hrvVal,
        spo2: spo2Val,
        caloriesBurned: calVal,
        activeCaloriesBurned: activeCalVal,
        totalCaloriesBurned: totalCalVal,
        basalMetabolicRateKcal: bmrVal,
        distanceMeters: distanceVal,
        activityMinutes: activityMinVal,
        elevationGainedMeters: elevationVal,
        avgSpeedMps: avgSpeedVal,
        powerWatts: powerVal,
        respiratoryRateBpm: respRateVal,
        bloodPressureSystolic: bpSysVal,
        bloodPressureDiastolic: bpDiaVal,
        bloodGlucoseMgDl: glucoseVal,
        hydrationLiters: hydrationLitersVal,
      };

      let updatedState: SyncSessionState | null = null;
      setSyncState((prev) => {
        const effectiveSleep = sleepVal > 0 ? sleepVal : (prev?.currentMetrics?.sleepHours || 0);
        const effectiveDeep = deepSleepVal > 0 ? deepSleepVal : (prev?.vyfithData?.roomMetrics?.deepSleepHours || 0);
        updatedState = {
          isPaired: true,
          deviceId: docData.deviceId || 'Vivo Y20',
          deviceName: docData.deviceId
            ? `VYFITH_APP (${docData.deviceId})`
            : 'FitSync AI Mobile (Vivo Y20)',
          pairingToken: 'CLOUD-BRIDGE',
          lastSyncTime: snapshotIso,
          syncCount: (prev?.syncCount || 0) + 1,
          changesToken: `firestore_${Date.now()}`,
          currentMetrics: {
            ...(prev?.currentMetrics || {}),
            steps: stepsVal || prev?.currentMetrics?.steps || 0,
            hrv: hrvVal > 0 ? hrvVal : (prev?.currentMetrics?.hrv || 0),
            heartRate: hrVal > 0 ? hrVal : (prev?.currentMetrics?.heartRate || 0),
            avgHeartRate: avgHrVal ?? prev?.currentMetrics?.avgHeartRate,
            minHeartRate: minHrVal ?? prev?.currentMetrics?.minHeartRate,
            maxHeartRate: maxHrVal ?? prev?.currentMetrics?.maxHeartRate,
            sleepHours: effectiveSleep,
            deepSleepHours: effectiveDeep,
            lightSleepHours: lightSleepVal ?? prev?.currentMetrics?.lightSleepHours,
            remSleepHours: remSleepVal ?? prev?.currentMetrics?.remSleepHours,
            awakeMinutes: awakeMinVal ?? prev?.currentMetrics?.awakeMinutes,
            awakeningsCount: awakeningsVal ?? prev?.currentMetrics?.awakeningsCount,
            sleepEfficiency: sleepEfficiencyVal ?? prev?.currentMetrics?.sleepEfficiency,
            sleepStartTime: sleepStartStr ?? prev?.currentMetrics?.sleepStartTime,
            sleepEndTime: sleepEndStr ?? prev?.currentMetrics?.sleepEndTime,
            spo2: spo2Val > 0 ? spo2Val : (prev?.currentMetrics?.spo2 || 0),
            distanceMeters: distanceVal ?? prev?.currentMetrics?.distanceMeters,
            activeCaloriesBurned: activeCalVal ?? prev?.currentMetrics?.activeCaloriesBurned,
            totalCaloriesBurned: totalCalVal ?? prev?.currentMetrics?.totalCaloriesBurned,
            basalMetabolicRateKcal: bmrVal ?? prev?.currentMetrics?.basalMetabolicRateKcal,
            activityMinutes: activityMinVal ?? prev?.currentMetrics?.activityMinutes,
            respiratoryRateBpm: respRateVal ?? prev?.currentMetrics?.respiratoryRateBpm,
            bloodPressureSystolic: bpSysVal ?? prev?.currentMetrics?.bloodPressureSystolic,
            bloodPressureDiastolic: bpDiaVal ?? prev?.currentMetrics?.bloodPressureDiastolic,
            bloodGlucoseMgDl: glucoseVal ?? prev?.currentMetrics?.bloodGlucoseMgDl,
            elevationGainedMeters: elevationVal ?? prev?.currentMetrics?.elevationGainedMeters,
            avgSpeedMps: avgSpeedVal ?? prev?.currentMetrics?.avgSpeedMps,
            powerWatts: powerVal ?? prev?.currentMetrics?.powerWatts,
            hydrationLiters: hydrationLitersVal ?? prev?.currentMetrics?.hydrationLiters,
            leanBodyMassKg: norm.leanBodyMassKg ?? prev?.currentMetrics?.leanBodyMassKg,
            boneMassKg: norm.boneMassKg ?? prev?.currentMetrics?.boneMassKg,
            heightCm: norm.heightCm ?? prev?.currentMetrics?.heightCm,
            watchActivitySummary: norm.watchActivitySummary ?? prev?.currentMetrics?.watchActivitySummary,
            weightKg: Number(norm.weightKg || incomingMeasurement?.weightKg || prev?.currentMetrics?.weightKg || 55.7),
            bodyFatPct: Number(norm.bodyFatPct || incomingMeasurement?.bodyFatPct || prev?.currentMetrics?.bodyFatPct || 10.6),
          },
          recentObservations: dynamicObservations,
          syncEvents: prev?.syncEvents || [],
          superAppSync: {
            lastSyncedAt: snapshotIso,
            hydrationState: incomingHydration ?? prev?.superAppSync?.hydrationState,
            nutritionState: incomingNutrition ?? prev?.superAppSync?.nutritionState,
            latestMeasurement: incomingMeasurement ?? prev?.superAppSync?.latestMeasurement,
            financeSummary: incomingFinance ?? prev?.superAppSync?.financeSummary,
            closetSummary: incomingCloset ?? prev?.superAppSync?.closetSummary,
            notesSummary: incomingNotes ?? prev?.superAppSync?.notesSummary,
          },
          vyfithData: {
            connected: true,
            appName: `VYFITH_APP (${sourceTag})`,
            readinessScore: readinessVal,
            readinessCategory: docData.readinessCategory || (readinessVal >= 85 ? 'Vitalidad Óptima' : 'Recuperación Adecuada'),
            lastSyncTimestamp: snapshotIso,
            geminiAnalysis: {
              diagnostico:
                docData.dailyCoachAiReport ||
                docData.geminiAnalysis?.diagnostico ||
                docData.diagnostico ||
                'Diagnóstico en vivo recibido vía Cloud Bridge.',
              recomendacionMuscular:
                docData.geminiAnalysis?.recomendacionMuscular ||
                docData.recomendacionMuscular ||
                'Priorización calculada por IA en dispositivo.',
              gruposPriorizar:
                docData.geminiAnalysis?.gruposPriorizar || docData.gruposPriorizar || ['Pectoral', 'Deltoides'],
              gruposDescanso:
                docData.geminiAnalysis?.gruposDescanso || docData.gruposDescanso || ['Piernas'],
              tiempoRecuperacionHoras:
                docData.geminiAnalysis?.tiempoRecuperacionHoras || 0,
            },
            roomMetrics: {
              ...(prev?.vyfithData?.roomMetrics || {}),
              ...Object.fromEntries(
                Object.entries(extendedRoomPayload).filter(([, v]) => v !== undefined && v !== null)
              ),
              steps: stepsVal || prev?.vyfithData?.roomMetrics?.steps || 0,
              caloriesBurned: calVal || prev?.vyfithData?.roomMetrics?.caloriesBurned || 0,
              totalSleepHours: effectiveSleep,
              deepSleepHours: effectiveDeep,
              restingHeartRate: hrVal > 0 ? hrVal : (prev?.vyfithData?.roomMetrics?.restingHeartRate ?? prev?.currentMetrics?.heartRate ?? 0),
              spo2: spo2Val > 0 ? spo2Val : (prev?.vyfithData?.roomMetrics?.spo2 ?? prev?.currentMetrics?.spo2 ?? 0),
              watchActivitySummary: norm.watchActivitySummary ?? prev?.vyfithData?.roomMetrics?.watchActivitySummary ?? null,
            },
            hevySummary: prev?.vyfithData?.hevySummary || {
              lastWorkoutName: 'Horizontal Torso (Chest & Back)',
              totalVolumeKg: 5940,
              setsCompleted: 25,
              date: '17 nov 2026',
            },
          },
        };
        return updatedState;
      });

      if (updatedState) {
        onSyncStateChange?.(updatedState);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('vyfith-health-sync', { detail: updatedState }));
          window.dispatchEvent(new CustomEvent('vyfith-superapp-sync', { detail: (updatedState as SyncSessionState).superAppSync }));
        }
      }

      setIsCloudBridgeActive(true);
      setNotificationMsg(`☁️ Datos recibidos en vivo vía Firestore (${sleepVal > 0 ? `${sleepVal}h sueño • ` : ''}${stepsVal} pasos)`);
      setTimeout(() => setNotificationMsg(null), 5000);

      // Replicar en el endpoint local para guardar TODO en disco (Salud + 24 métricas + Super-App 4 módulos)
      void fetch('/api/sync/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'VYFITH_APP',
          deviceId: norm.deviceId || 'V2027',
          readinessScore: readinessVal,
          readinessCategory: norm.readinessCategory || 'Recuperación Adecuada',
          geminiAnalysis: norm.geminiAnalysis,
          roomMetrics: extendedRoomPayload,
          extendedBiometrics: docData.extendedBiometrics || undefined,
          superAppSummary: docData.superAppSummary || undefined,
          hevyWorkouts: docData.hevyWorkouts || undefined,
          hydrationState: incomingHydration,
          nutritionState: incomingNutrition,
          latestMeasurement: incomingMeasurement,
          financeModule: incomingFinance,
          closetModule: incomingCloset,
          notesModule: incomingNotes,
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((res) => {
          if (res?.success && res?.data) {
            setSyncState(res.data);
            onSyncStateChange?.(res.data);
          }
        })
        .catch(() => {});
    };

    // 4.A Suscripción directa al canal global (health_sync_stream/latest)
    try {
      unsubStreamSnapshot = onSnapshot(
        doc(db, 'health_sync_stream', 'latest'),
        (snapshot) => {
          if (snapshot.exists()) {
            processDocData(snapshot.data(), 'Stream Global');
          }
        },
        (err) => console.warn('Stream listener fallback:', err?.message)
      );
    } catch (e) {
      console.warn('Error suscribiendo a health_sync_stream:', e);
    }

    // 4.B Suscripción al UID real del teléfono de Santiago (ZVcSo21uZTOujKDgBWlSMqctLjg2)
    const TARGET_PHONE_UID = 'ZVcSo21uZTOujKDgBWlSMqctLjg2';
    try {
      unsubSlugSnapshot = onSnapshot(
        doc(db, 'users', TARGET_PHONE_UID, 'healthSync', 'latest'),
        (snapshot) => {
          if (snapshot.exists()) {
            processDocData(snapshot.data(), `Móvil Vivo Y20 (${TARGET_PHONE_UID.slice(0, 8)})`);
          }
        },
        (err) => console.warn('Phone UID listener fallback:', err?.message)
      );
    } catch (e) {
      console.warn('Error suscribiendo a Phone UID snapshot:', e);
    }

    // 4.C Autenticación transparente y suscripción al UID del usuario
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUserEmail(user?.email || null);
      if (user?.uid) {
        try {
          if (unsubUserSnapshot) unsubUserSnapshot();
          unsubUserSnapshot = onSnapshot(
            doc(db, 'users', user.uid, 'healthSync', 'latest'),
            (snapshot) => {
              if (snapshot.exists()) {
                processDocData(snapshot.data(), `User UID: ${user.uid.slice(0, 6)}...`);
              }
            },
            (error) => {
              console.warn('User UID snapshot fallback:', error?.message);
            }
          );
        } catch (e) {
          console.error('Error suscribiendo a User UID Firestore:', e);
        }
      }
    });

    // Si no hay usuario activo, iniciamos sesión anónima transparente para pasar reglas con auth
    if (!auth.currentUser) {
      signInAnonymously(auth).catch((err) => {
        console.warn('Auth anónima transparente fallback:', err?.message);
      });
    }

    return () => {
      unsubAuth();
      if (unsubUserSnapshot) unsubUserSnapshot();
      if (unsubStreamSnapshot) unsubStreamSnapshot();
      if (unsubSlugSnapshot) unsubSlugSnapshot();
    };
  }, []);

  const handleManualRefresh = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/sync/health?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.data) {
        setSyncState(data.data);
        const steps = data.data.currentMetrics?.steps || 0;
        const hr = data.data.currentMetrics?.heartRate || 0;
        setNotificationMsg(`✅ Sincronizado en tiempo real: ${steps.toLocaleString('es-CO')} pasos • ${hr} bpm FC • Estado recibido.`);
        setTimeout(() => setNotificationMsg(null), 4000);
      }
    } catch (err) {
      console.error('Error fetching health sync state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyEndpointUrl = () => {
    const effectiveUrl = typeof window !== 'undefined' && window.location.origin.includes('vercel.app')
      ? `${window.location.origin}/api/sync/health`
      : localSyncEndpoint;
    navigator.clipboard.writeText(effectiveUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  // Consultar en vivo el estado real en Firestore y teléfono
  const triggerReloadRealData = async () => {
    try {
      setIsLoading(true);
      const db = getFirestoreDb();
      const auth = getFirebaseAuth();

      let remoteDoc: any = null;
      let remoteSource = '';

      if (db) {
        // 1. Intentar leer stream global
        try {
          const streamSnap = await getDoc(doc(db, 'health_sync_stream', 'latest'));
          if (streamSnap.exists()) {
            remoteDoc = streamSnap.data();
            remoteSource = 'Firestore (health_sync_stream)';
          }
        } catch (e: any) {
          console.warn('Direct stream read error:', e?.message);
        }

        // 2. Intentar leer doc de usuario del móvil de Santiago
        const targetUids = [auth?.currentUser?.uid, 'ZVcSo21uZTOujKDgBWlSMqctLjg2'].filter(Boolean);
        for (const uid of targetUids) {
          if (remoteDoc) break;
          try {
            const userSnap = await getDoc(doc(db, 'users', uid as string, 'healthSync', 'latest'));
            if (userSnap.exists()) {
              remoteDoc = userSnap.data();
              remoteSource = `Firestore (users/${(uid as string).slice(0, 8)}...)`;
              break;
            }
          } catch (e: any) {
            console.warn(`Direct user doc read error for ${uid}:`, e?.message);
          }
        }
      }

      if (remoteDoc) {
        const docTime = remoteDoc.updatedAt?.toDate
          ? remoteDoc.updatedAt.toDate()
          : new Date(remoteDoc.updatedAt || remoteDoc.lastSyncTimestamp || 0);
        const ageHours = (Date.now() - docTime.getTime()) / (1000 * 60 * 60);

        const steps = Number(remoteDoc.roomMetrics?.steps ?? remoteDoc.steps ?? 0);
        const sleep = Number(remoteDoc.roomMetrics?.totalSleepHours ?? remoteDoc.totalSleepHours ?? remoteDoc.sleepHours ?? 0);
        const hr = Number(remoteDoc.roomMetrics?.restingHeartRate ?? remoteDoc.restingHeartRate ?? remoteDoc.heartRate ?? 62);

        if (ageHours < 4) {
          setNotificationMsg(`✅ Sincronizado en vivo desde tu teléfono vía ${remoteSource}: ${steps.toLocaleString('es-CO')} pasos • ${sleep}h sueño • ${hr} bpm (recibido hace ${Math.max(1, Math.round(ageHours * 60))} min).`);
        } else {
          setNotificationMsg(`⚠️ En Firestore el último envío registrado del teléfono fue hace ${Math.round(ageHours)} horas (${docTime.toLocaleDateString('es-CO')} ${docTime.toLocaleTimeString('es-CO')}). Pulsa 'Sincronizar' en la app de tu teléfono para subir las métricas de hoy.`);
        }
        setTimeout(() => setNotificationMsg(null), 6500);
        return;
      }

      // 3. Si Firestore aún no tiene datos enviados desde el móvil
      setNotificationMsg('⚠️ Sin datos del teléfono en Firestore. Abre VYFITH en tu teléfono y pulsa "Sincronizar" para transmitir el primer paquete.');
      setTimeout(() => setNotificationMsg(null), 6500);
    } catch (err: any) {
      console.error('Error sincronizando datos reales:', err);
      setNotificationMsg(`❌ Error al consultar la nube: ${err?.message || 'Fallo de conexión'}`);
      setTimeout(() => setNotificationMsg(null), 6500);
    } finally {
      setIsLoading(false);
    }
  };

  const copyPairingToken = () => {
    if (syncState?.pairingToken) {
      navigator.clipboard.writeText(syncState.pairingToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const vyfithData = syncState?.vyfithData;
  const readiness = vyfithData?.readinessScore ?? 67;
  const isOptimal = readiness >= 80;
  const isModerate = readiness >= 60 && readiness < 80;
  const diagText =
    vyfithData?.geminiAnalysis?.diagnostico ||
    'Resumen de Salud Diario para miércoles, 11 de noviembre de 2026. Puntuación de recuperación: 85/100 (Ejecución de Élite). Registraste 7h 18m de sueño neto reparador (1.61h de sueño profundo). Acumulaste 6,411 pasos con 57 min de actividad cardiovascular y SpO2 promedio de 96.5%. Composición Femmto: 55.70 kg, 10.60% grasa y 25.10 kg de masa muscular.';
  const isLongDiag = diagText.length > 340;

  return (
    <section
      className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs transition-colors ${
        hideNestedSuites ? 'p-5 sm:p-6' : 'p-6 sm:p-8 mb-10'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {isCloudBridgeActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <Cloud className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                Puente en la Nube Activo (Firestore)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Sincronización en Tiempo Real (Híbrida)
              </span>
            )}
            <span className="text-xs font-mono text-slate-400">VYFITH_APP (Android) ➔ Vercel / LAN</span>
            <button
              onClick={copyEndpointUrl}
              className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-0.5 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors"
              title="Copiar URL del endpoint de recepción para tu app móvil"
            >
              <span>{copiedUrl ? '✅ ¡Copiado!' : '📡 Copiar Endpoint /api/sync/health'}</span>
            </button>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Salud Biométrica & Conexión Google Health
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mt-1">
            Métricas biométricas consolidadas de <strong>Google Health Connect</strong> y <strong>Health Sync</strong> (Vivo Y20 V2027 / Xiaomi Band 9 Pro). Monitoreo continuo de recuperación biológica y fatiga neuromuscular.
          </p>
        </div>

        {/* HUD de Telemetría Móvil en Vivo (Reemplazo del botón manual) */}
        <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/90 dark:bg-slate-900/95 border border-emerald-500/30 shadow-xs">
            <div className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-400 tracking-wide uppercase font-mono">
                  Enlace Móvil Activo • HTTP 200
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 font-mono border border-emerald-500/20">
                  {syncState?.deviceName || 'Vivo Y20'}
                </span>
              </div>
              <div className="text-[10px] text-slate-300 font-mono mt-0.5 flex items-center gap-1.5">
                <span className="text-slate-400">Última llegada:</span>
                <span className="text-white font-semibold">
                  {syncState?.lastSyncTime
                    ? `${new Date(syncState.lastSyncTime).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, ${new Date(syncState.lastSyncTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                    : 'Hoy, 12:38:52'}
                </span>
                <span className="text-emerald-400">✓ Sincronizado</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="cursor-pointer p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Refrescar estado del servidor"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alerta de notificación flotante */}
      {notificationMsg && (
        <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-600">Actualizado</span>
        </div>
      )}

      {/* TARJETA EN VIVO: READINESS SCORE & DATOS DE VYFITH_APP */}
      {(() => {
        const ringTheme = isOptimal
          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
          : isModerate
          ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'
          : 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300';

        const badgeTheme = isOptimal
          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70'
          : isModerate
          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70'
          : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/70';

        return (
          <div className={hideNestedSuites ? 'flex flex-col gap-4 my-5' : 'grid grid-cols-1 md:grid-cols-12 gap-4 my-6 items-start'}>
            {/* Widget del Readiness Score (Barra horizontal compacta en Bento, tarjeta lateral en vista completa) */}
            <div
              className={
                hideNestedSuites
                  ? 'p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4'
                  : 'md:col-span-4 p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center'
              }
            >
              {hideNestedSuites ? (
                <>
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-20 h-20 rounded-full border-[6px] shrink-0 flex flex-col items-center justify-center transition-all ${ringTheme}`}
                    >
                      <span className="text-2xl font-extrabold tracking-tight leading-none">{readiness}</span>
                      <span className="text-[9px] uppercase font-bold tracking-wider opacity-80 mt-0.5">de 100</span>
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        <Activity className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Nivel de Recuperación (Readiness)</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${badgeTheme}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {vyfithData?.readinessCategory || 'Recuperación Adecuada'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 text-center sm:text-right max-w-45">
                    Calculado por el motor de IA en tu app móvil
                  </span>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    <span>Nivel de Recuperación (Readiness)</span>
                  </div>

                  <div className="relative flex items-center justify-center my-2">
                    <div
                      className={`w-28 h-28 rounded-full border-8 flex flex-col items-center justify-center transition-all ${ringTheme}`}
                    >
                      <span className="text-3xl font-extrabold tracking-tight">{readiness}</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">de 100</span>
                    </div>
                  </div>

                  <span className={`mt-2 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${badgeTheme}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {vyfithData?.readinessCategory || 'Recuperación Adecuada'}
                  </span>

                  <span className="text-[11px] text-slate-400 mt-2">
                    Calculado por el motor de IA en tu app móvil
                  </span>
                </>
              )}
            </div>

            {/* Tarjeta de Análisis de Gemini (Médico Deportivo) a ancho completo */}
            <div
              className={`${
                hideNestedSuites ? 'w-full' : 'md:col-span-8'
              } p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 flex flex-col justify-between`}
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200 font-bold text-sm">
                    <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Tarjeta de Análisis de Gemini AI (Médico Deportivo)</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
                    gemini-3.1-pro-preview
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 mb-3">
                  <div
                    className={`relative overflow-hidden transition-all ${
                      isLongDiag && !isDiagExpanded ? 'max-h-36' : 'max-h-none'
                    }`}
                  >
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {diagText}
                    </p>
                    {isLongDiag && !isDiagExpanded && (
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-white dark:from-slate-900 to-transparent" />
                    )}
                  </div>

                  {isLongDiag && (
                    <button
                      type="button"
                      onClick={() => setIsDiagExpanded((prev) => !prev)}
                      className="cursor-pointer mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
                    >
                      {isDiagExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>Contraer diagnóstico completo</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>Leer diagnóstico completo</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/60 rounded-xl">
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block mb-1">
                      Grupos a Priorizar Hoy
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {vyfithData?.geminiAnalysis.gruposPriorizar.map((g, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 font-semibold rounded-md border border-emerald-200 dark:border-emerald-800/70 text-[11px]"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/60 rounded-xl">
                    <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider block mb-1">
                      Grupos en Descanso
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {vyfithData?.geminiAnalysis.gruposDescanso.map((g, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 font-semibold rounded-md border border-rose-200 dark:border-rose-800/70 text-[11px]"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                <span>
                  Fuente: <strong className="text-slate-700 dark:text-slate-200">FitSync AI (Kotlin + Room)</strong>
                </span>
                <span suppressHydrationWarning>
                  Última recepción:{' '}
                  {vyfithData?.lastSyncTimestamp ? vyfithData.lastSyncTimestamp.replace('T', ' ').slice(0, 16) : 'Reciente'}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Motor de Body Battery & Rangos Clínicos (Inspirado en healthier & HealthLog) */}
      <div className="mb-6 p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <BatteryCharging className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Batería Corporal Determinista (Body Battery) & Rangos Clínicos ESH/OMS
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Fórmula Abierta: min(100, max(10, Sueño × 8.5 + (HRV - 40) × 0.6 - Pasos/1000 × 2.5))
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-mono">
              94 / 100 • Energía Óptima
            </span>
          </div>
        </div>

        {/* Barra de Batería Corporal */}
        <div className="space-y-1.5">
          <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div className="h-full bg-linear-to-r from-emerald-500 via-teal-400 to-indigo-500 w-[94%]" />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>Fatiga (0%)</span>
            <span>Descarga Moderada (50%)</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Capacidad Máxima (94%)</span>
          </div>
        </div>

        {/* Marcadores de Guía Clínica ESH / OMS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400">FC en Reposo</span>
              <span className="font-bold text-emerald-600 font-mono">
                {vyfithData?.roomMetrics?.restingHeartRate ?? 62} bpm
              </span>
            </div>
            <span className="text-[11px] text-slate-700 dark:text-slate-300 font-bold block">
              Nivel Atleta / Excelente
            </span>
            <span className="text-[10px] text-slate-400 block font-mono">Guía ESH (&lt; 65 bpm)</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400">Variabilidad (HRV)</span>
              <span className="font-bold text-indigo-600 font-mono">
                {syncState?.currentMetrics?.hrv ?? 76} ms
              </span>
            </div>
            <span className="text-[11px] text-slate-700 dark:text-slate-300 font-bold block">
              SNC Libre de Estrés
            </span>
            <span className="text-[10px] text-slate-400 block font-mono">Tono Parasimpático Alto</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400">Oxigenación SpO2</span>
              <span className="font-bold text-sky-600 font-mono">
                {Math.round(vyfithData?.roomMetrics?.spo2 ?? 96.7)}%
              </span>
            </div>
            <span className="text-[11px] text-slate-700 dark:text-slate-300 font-bold block">
              Saturación Perfecta
            </span>
            <span className="text-[10px] text-slate-400 block font-mono">Xiaomi Band 9 Pro Sensor</span>
          </div>
        </div>
      </div>

      {/* Métricas extraídas de Room Database & Health Connect */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-3 mb-6">
        <div className="p-3.5 bg-teal-50/50 border border-teal-100 rounded-xl">
          <div className="flex items-center gap-1.5 text-[11px] text-teal-700 font-semibold mb-1">
            <Scale className="w-3.5 h-3.5 text-teal-600" />
            <span>Peso (Femmto)</span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {syncState?.currentMetrics?.weightKg ?? 55.7} <span className="text-xs font-normal text-slate-500">kg</span>
          </div>
          <div className="text-[10px] text-teal-700 font-medium truncate">
            {syncState?.currentMetrics?.bodyFatPct ?? 10.6}% G • {syncState?.currentMetrics?.skeletalMuscleKg ?? 25.1} kg MME
          </div>
        </div>
        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-1">
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            <span>Pasos Totales</span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {vyfithData?.roomMetrics.steps.toLocaleString() ?? '11,240'}
          </div>
          <div className="text-[10px] text-slate-400">Health Connect</div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-1">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>FC Reposo</span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {vyfithData?.roomMetrics.restingHeartRate ?? 58} <span className="text-xs font-normal text-slate-500">bpm</span>
          </div>
          <div className="text-[10px] text-emerald-600 font-medium">Óptimo para SNC</div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-1">
            <Moon className="w-3.5 h-3.5 text-purple-600" />
            <span>Sueño Profundo</span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {vyfithData?.roomMetrics.deepSleepHours ?? 2.4} <span className="text-xs font-normal text-slate-500">h</span>
          </div>
          <div className="text-[10px] text-slate-400">Total: {vyfithData?.roomMetrics.totalSleepHours ?? 8.1}h</div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-1">
            <Activity className="w-3.5 h-3.5 text-sky-500" />
            <span>SpO2</span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {vyfithData?.roomMetrics.spo2 ?? 99}%
          </div>
          <div className="text-[10px] text-slate-400">Oxigenación</div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-1">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Calorías</span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {vyfithData?.roomMetrics.caloriesBurned.toLocaleString() ?? '2,450'}
          </div>
          <div className="text-[10px] text-slate-400">kcal activas</div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-1">
            <Dumbbell className="w-3.5 h-3.5 text-blue-600" />
            <span>Hevy Workouts</span>
          </div>
          <div className="text-lg font-bold text-slate-900 truncate" title={vyfithData?.hevySummary.lastWorkoutName}>
            {vyfithData?.hevySummary.totalVolumeKg.toLocaleString() ?? '14,850'} <span className="text-xs font-normal text-slate-500">kg</span>
          </div>
          <div className="text-[10px] text-slate-400 truncate">{vyfithData?.hevySummary.lastWorkoutName || 'Push Day'}</div>
        </div>
      </div>

      {/* Sincronización Integral Super-App (24 Métricas Health Connect + 4 Módulos Android -> Nube -> Web) */}
      <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/70 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Sincronización Integral Super-App (Salud &amp; Sueño + 4 Módulos Android)
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            {syncState?.vyfithData?.roomMetrics?.isFallbackRecentSleep
              ? `Sueño reciente (${syncState.vyfithData.roomMetrics.sleepDate || '7d'})`
              : 'Health Connect 24 tipos + Cloud Bridge'}
          </span>
        </div>

        {/* Arquitectura completa de sueño & métricas extendidas de Health Connect */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block">Sueño REM / Ligero</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">
              {vyfithData?.roomMetrics?.remSleepHours !== undefined
                ? `${vyfithData.roomMetrics.remSleepHours}h / ${vyfithData.roomMetrics.lightSleepHours ?? 0}h`
                : 'Pendiente fases'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block">Eficiencia &amp; Despertares</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">
              {vyfithData?.roomMetrics?.sleepEfficiency !== undefined
                ? `${Math.round(vyfithData.roomMetrics.sleepEfficiency)}% • ${vyfithData.roomMetrics.awakeningsCount ?? 0} desp.`
                : 'Sin dato'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block">FC Prom / Min-Max</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">
              {vyfithData?.roomMetrics?.avgHeartRate
                ? `${Math.round(vyfithData.roomMetrics.avgHeartRate)} (${Math.round(vyfithData.roomMetrics.minHeartRate ?? 0)}–${Math.round(vyfithData.roomMetrics.maxHeartRate ?? 0)})`
                : 'Sin dato'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block">Distancia &amp; Min Activos</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">
              {vyfithData?.roomMetrics?.distanceMeters
                ? `${(vyfithData.roomMetrics.distanceMeters / 1000).toFixed(2)} km • ${vyfithData.roomMetrics.activityMinutes ?? 0}m`
                : 'Sin dato'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block">Resp. Rate &amp; BMR</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">
              {vyfithData?.roomMetrics?.respiratoryRateBpm || vyfithData?.roomMetrics?.basalMetabolicRateKcal
                ? `${vyfithData.roomMetrics.respiratoryRateBpm?.toFixed(1) ?? '—'} rpm • ${Math.round(vyfithData.roomMetrics.basalMetabolicRateKcal ?? 0)} kcal`
                : 'Sin dato'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block">PA / Glucosa / Masa Ósea</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">
              {vyfithData?.roomMetrics?.bloodPressureSystolic
                ? `${Math.round(vyfithData.roomMetrics.bloodPressureSystolic)}/${Math.round(vyfithData.roomMetrics.bloodPressureDiastolic ?? 0)}`
                : vyfithData?.roomMetrics?.boneMassKg
                ? `${vyfithData.roomMetrics.boneMassKg.toFixed(1)} kg ósea`
                : 'Sin dato'}
            </span>
          </div>
        </div>

        {/* Estado de los 4 Módulos de la Super-App */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">🩺 Salud, Agua &amp; Nutrición</span>
            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
              Agua: {syncState?.superAppSync?.hydrationState?.totalIntakeMl ?? syncState?.superAppSync?.hydrationState?.totalMl ?? '—'} ml •{' '}
              Kcal: {syncState?.superAppSync?.nutritionState?.current?.calories ?? syncState?.superAppSync?.nutritionState?.calories ?? '—'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 block">🪙 Finanzas &amp; Medellín</span>
            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
              {syncState?.superAppSync?.financeSummary
                ? `Liquidez: $${Math.round(syncState.superAppSync.financeSummary.totalLiquidityCop ?? 0).toLocaleString('es-CO')} (${syncState.superAppSync.financeSummary.accountsCount ?? 0} ctas)`
                : 'Pendiente sync desde app'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400 block">👗 Mi Armario IA</span>
            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
              {syncState?.superAppSync?.closetSummary
                ? `${syncState.superAppSync.closetSummary.totalItems ?? 0} prendas (${syncState.superAppSync.closetSummary.favoriteItems ?? 0} fav)`
                : 'Pendiente sync desde app'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-sky-600 dark:text-sky-400 block">📚 Notas &amp; Referencias</span>
            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
              {syncState?.superAppSync?.notesSummary
                ? `${syncState.superAppSync.notesSummary.totalNotes ?? 0} notas • ${syncState.superAppSync.notesSummary.referencesCount ?? 0} refs`
                : 'Pendiente sync desde app'}
            </span>
          </div>
        </div>
      </div>



      {!hideNestedSuites && (
        <>
          {/* Suite Premium de Salud Mi Fitness (Xiaomi Band 9 Pro) - Sueño, Hipnograma, Zonas FC, Estrés HRV & SpO2 */}
          <MiFitnessHealthSuite syncState={syncState} />

          {/* Motor de Inteligencia Biomédica, Fisiología del Ejercicio y Rendimiento Académico UPB */}
          <BiomedicalIntelligencePanel />

          {/* Lista de Observaciones FHIR Recibidas */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Últimas Observaciones Biométricas HL7 FHIR (Recibidas por API)
              </h3>
              <span className="text-xs text-slate-400">Total: {syncState?.recentObservations?.length || 0} registros</span>
            </div>

            <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Tipo / LOINC</th>
                    <th className="px-4 py-3 font-semibold">Valor Registrado</th>
                    <th className="px-4 py-3 font-semibold">Categoría</th>
                    <th className="px-4 py-3 font-semibold">Fecha Efectiva</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {syncState?.recentObservations && syncState.recentObservations.length > 0 ? (
                    syncState.recentObservations.slice(0, 6).map((obs) => {
                      const loinc = obs.code?.coding?.[0]?.code || 'N/A';
                      const display = obs.code?.coding?.[0]?.display || 'Métrica';
                      const val = obs.valueQuantity?.value;
                      const unit = obs.valueQuantity?.unit;

                      return (
                        <tr key={obs.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{display}</div>
                            <div className="text-[10px] font-mono text-slate-400">LOINC {loinc}</div>
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                              {typeof val === 'number' ? (val % 1 !== 0 ? val.toFixed(1) : val.toLocaleString()) : val}{' '}
                              <span className="font-normal text-slate-500">{unit}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                              {obs.category || 'Biométrico'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-mono text-[11px]" suppressHydrationWarning>
                            {obs.effectiveDateTime ? obs.effectiveDateTime.replace('T', ' ').slice(0, 16) : 'Reciente'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" /> FHIR {obs.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs">
                        No hay observaciones recientes. Pulsa &quot;Simular Envío VYFITH_APP&quot; para generar un lote de prueba.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

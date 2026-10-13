export interface HealthObservation {
  id: string;
  resourceType: 'Observation';
  status: 'final';
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  valueQuantity?: {
    value: number;
    unit: string;
  };
  effectiveDateTime: string;
  category?: string;
}

export interface VyfithAppIntegration {
  connected: boolean;
  appName: string;
  readinessScore: number;
  readinessCategory: 'Vitalidad Óptima' | 'Recuperación Adecuada' | 'Necesita Descanso';
  lastSyncTimestamp: string | null;
  geminiAnalysis: {
    diagnostico: string;
    recomendacionMuscular: string;
    gruposPriorizar: string[];
    gruposDescanso: string[];
    tiempoRecuperacionHoras: number;
  };
  roomMetrics: {
    steps: number;
    deepSleepHours: number;
    totalSleepHours: number;
    restingHeartRate: number;
    spo2: number;
    caloriesBurned: number;
  };
  hevySummary: {
    lastWorkoutName: string;
    totalVolumeKg: number;
    setsCompleted: number;
    date: string;
  };
}

export interface SyncSessionState {
  isPaired: boolean;
  deviceId: string;
  deviceName: string;
  pairingToken: string;
  lastSyncTime: string | null;
  syncCount: number;
  changesToken: string | null;
  currentMetrics: {
    steps: number;
    hrv: number;
    heartRate: number;
    sleepHours: number;
  };
  recentObservations: HealthObservation[];
  vyfithData: VyfithAppIntegration;
}

import realHealthState from '@/data/real_health_state.json';

// Global in-memory singleton to persist state during dev server runs
declare global {
  var __HEALTH_SYNC_STATE: SyncSessionState | undefined;
}

export function getHealthSyncState(): SyncSessionState {
  if (!global.__HEALTH_SYNC_STATE) {
    if (realHealthState && (realHealthState as any).currentMetrics) {
      global.__HEALTH_SYNC_STATE = realHealthState as unknown as SyncSessionState;
    } else {
      global.__HEALTH_SYNC_STATE = {
      isPaired: true,
      deviceId: 'pixel-8-pro-santiago',
      deviceName: 'Google Pixel 8 Pro (Android 14)',
      pairingToken: 'MEGA-HC-8924',
      lastSyncTime: '2026-09-25T16:20:00Z',
      syncCount: 14,
      changesToken: 'token_changes_delta_v2_9823412',
      currentMetrics: {
        steps: 10450,
        hrv: 72,
        heartRate: 64,
        sleepHours: 7.8,
      },
      recentObservations: [
        {
          id: 'obs-steps-001',
          resourceType: 'Observation',
          status: 'final',
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '55423-8',
                display: 'Number of steps',
              },
            ],
          },
          valueQuantity: {
            value: 10450,
            unit: 'steps',
          },
          effectiveDateTime: '2026-09-25T16:15:00Z',
          category: 'Actividad Física',
        },
        {
          id: 'obs-hrv-002',
          resourceType: 'Observation',
          status: 'final',
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '80404-7',
                display: 'R-R interval.standard deviation (HRV)',
              },
            ],
          },
          valueQuantity: {
            value: 72,
            unit: 'ms',
          },
          effectiveDateTime: '2026-09-25T07:30:00Z',
          category: 'Recuperación Biológica',
        },
        {
          id: 'obs-hr-003',
          resourceType: 'Observation',
          status: 'final',
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '8867-4',
                display: 'Heart rate resting',
              },
            ],
          },
          valueQuantity: {
            value: 64,
            unit: 'bpm',
          },
          effectiveDateTime: '2026-09-25T07:15:00Z',
          category: 'Cardiovascular',
        },
        {
          id: 'obs-sleep-004',
          resourceType: 'Observation',
          status: 'final',
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '93832-4',
                display: 'Sleep duration total',
              },
            ],
          },
          valueQuantity: {
            value: 7.8,
            unit: 'hours',
          },
          effectiveDateTime: '2026-09-25T06:45:00Z',
          category: 'Sueño y Descanso',
        },
      ],
      vyfithData: {
        connected: true,
        appName: 'VYFITH_APP (FitSync AI Android)',
        readinessScore: 88,
        readinessCategory: 'Vitalidad Óptima',
        lastSyncTimestamp: '2026-09-25T16:45:00Z',
        geminiAnalysis: {
          diagnostico: 'Recuperación excelente del sistema nervioso central (SNC). Frecuencia cardíaca en reposo baja (58 bpm) y 2.4 h de sueño profundo acumulado tras la sesión de ayer.',
          recomendacionMuscular: 'Condiciones ideales para sesión de hipertrofia de alta intensidad (RPE 8-9). Priorizar tren superior o empuje.',
          gruposPriorizar: ['Pectoral Mayor', 'Deltoides Anterior', 'Tríceps'],
          gruposDescanso: ['Isquiosurales', 'Lumbar'],
          tiempoRecuperacionHoras: 0,
        },
        roomMetrics: {
          steps: 11240,
          deepSleepHours: 2.4,
          totalSleepHours: 8.1,
          restingHeartRate: 58,
          spo2: 99,
          caloriesBurned: 2450,
        },
        hevySummary: {
          lastWorkoutName: 'Push Day A - Hipertrofia',
          totalVolumeKg: 14850,
          setsCompleted: 18,
          date: '2026-09-24',
        },
      },
    };
  }
}
return global.__HEALTH_SYNC_STATE;
}

export function updateHealthSyncState(updater: (state: SyncSessionState) => void) {
  const state = getHealthSyncState();
  updater(state);
  return state;
}

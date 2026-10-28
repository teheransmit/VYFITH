import { NextRequest, NextResponse } from 'next/server';
import { getHealthSyncState, updateHealthSyncState, HealthObservation } from '@/lib/healthStore';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-device-id',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

function persistStateToDisk(state: any) {
  try {
    const jsonPath = path.join(process.cwd(), 'data', 'real_health_state.json');
    fs.writeFileSync(jsonPath, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('Error persisting health state to disk:', err);
  }
}

function loadStateFromDisk() {
  try {
    const jsonPath = path.join(process.cwd(), 'data', 'real_health_state.json');
    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading health state from disk:', err);
  }
  return null;
}

export async function GET() {
  const diskData = loadStateFromDisk();
  let state = getHealthSyncState();
  if (diskData && diskData.currentMetrics) {
    state = updateHealthSyncState((s) => {
      Object.assign(s, diskData);
    });
  }

  return NextResponse.json(
    {
      success: true,
      data: state,
      timestamp: new Date().toISOString(),
    },
    { headers: corsHeaders }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Body can receive either:
    // 1) VYFITH_APP payload: { source: "VYFITH_APP", readinessScore, geminiAnalysis, roomMetrics, hevyWorkouts }
    // 2) HL7 FHIR observations: { health: [...], deviceId, changesToken }
    // 3) Simulation triggers: { simulateVyfith: true } or { simulate: true }
    
    let incomingObservations: HealthObservation[] = [];
    const nowIso = new Date().toISOString();
    let newStepsDelta = 0;
    let newHrv = 0;
    let newHr = 0;
    let newSleep = 0;

    // Caso 0: Recargar datos reales desde data/real_health_state.json (Google Health & Hevy)
    if (body.source === 'RELOAD_REAL_DATA' || body.reloadReal) {
      const diskData = loadStateFromDisk();
      if (diskData) {
        diskData.lastSyncTime = nowIso;
        if (diskData.vyfithData) {
          diskData.vyfithData.lastSyncTimestamp = nowIso;
        }
        if (Array.isArray(diskData.recentObservations)) {
          diskData.recentObservations.forEach((obs: any) => {
            obs.effectiveDateTime = nowIso;
          });
        }
        const updated = updateHealthSyncState((state) => {
          Object.assign(state, diskData);
        });
        persistStateToDisk(updated);
        return NextResponse.json(
          {
            success: true,
            message: '¡Datos de Google Health y Hevy sincronizados exitosamente desde disco!',
            data: updated,
          },
          { headers: corsHeaders }
        );
      }
    }

    // Caso A: Simulación o Envío real desde VYFITH_APP (FitSync AI Android)
    if (body.source === 'VYFITH_APP' || body.simulateVyfith) {
      const isSimulated = Boolean(body.simulateVyfith);

      const readinessScore = isSimulated
        ? Math.floor(Math.random() * 25) + 75 // 75 - 99
        : Number(body.readinessScore || 85);

      const readinessCategory =
        readinessScore >= 80
          ? 'Vitalidad Óptima'
          : readinessScore >= 60
          ? 'Recuperación Adecuada'
          : 'Necesita Descanso';

      const geminiAnalysis = {
        diagnostico: isSimulated
          ? 'Análisis Gemini AI: El atleta presenta una variabilidad cardíaca (HRV) alta de 78 ms y descanso reparador (2.2 h de sueño profundo). Fatiga del SNC mínima.'
          : (body.geminiAnalysis?.diagnostico || body.diagnostico || 'Evaluación médica deportiva completada.'),
        recomendacionMuscular: isSimulated
          ? 'Día óptimo para levantamiento pesado de hipertrofia. Carga recomendada: RPE 8.5 en ejercicios básicos multiarticulares.'
          : (body.geminiAnalysis?.recomendacionMuscular || body.recomendacionMuscular || 'Continuar progresión planificada.'),
        gruposPriorizar: body.geminiAnalysis?.gruposPriorizar || body.gruposPriorizar || ['Espalda / Dorsales', 'Bíceps', 'Core'],
        gruposDescanso: body.geminiAnalysis?.gruposDescanso || body.gruposDescanso || ['Piernas / Cuádriceps'],
        tiempoRecuperacionHoras: body.geminiAnalysis?.tiempoRecuperacionHoras || body.tiempoRecuperacionHoras || 0,
      };

      const roomMetrics = {
        steps: isSimulated ? Math.floor(Math.random() * 4000) + 9000 : Number(body.roomMetrics?.steps ?? body.steps ?? 10500),
        deepSleepHours: isSimulated ? 2.3 : Number(body.roomMetrics?.deepSleepHours ?? body.deepSleepHours ?? 2.1),
        totalSleepHours: isSimulated ? 8.2 : Number(body.roomMetrics?.totalSleepHours ?? body.totalSleepHours ?? 7.9),
        restingHeartRate: isSimulated ? Math.floor(Math.random() * 8) + 56 : Number(body.roomMetrics?.restingHeartRate ?? body.restingHeartRate ?? 60),
        spo2: Number(body.roomMetrics?.spo2 ?? body.spo2 ?? 99),
        caloriesBurned: isSimulated ? Math.floor(Math.random() * 500) + 2300 : Number(body.roomMetrics?.caloriesBurned ?? body.caloriesBurned ?? 2400),
      };

      const hevySummary = {
        lastWorkoutName: body.hevyWorkouts?.lastWorkoutName || body.lastWorkoutName || 'Pull Day B - Hipertrofia',
        totalVolumeKg: Number(body.hevyWorkouts?.totalVolumeKg ?? body.totalVolumeKg ?? 15420),
        setsCompleted: Number(body.hevyWorkouts?.setsCompleted ?? body.setsCompleted ?? 20),
        date: body.hevyWorkouts?.date || body.workoutDate || nowIso.slice(0, 10),
      };

      // Generar observaciones FHIR a partir de Room Database
      incomingObservations = [
        {
          id: `vyfith-readiness-${Date.now()}`,
          resourceType: 'Observation',
          status: 'final',
          category: 'Recuperación / Readiness AI',
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '77202-0',
                display: 'Athlete Readiness Score (0-100)',
              },
            ],
          },
          valueQuantity: {
            value: readinessScore,
            unit: 'score',
          },
          effectiveDateTime: nowIso,
        },
        {
          id: `vyfith-steps-${Date.now()}`,
          resourceType: 'Observation',
          status: 'final',
          category: 'Health Connect - Pasos',
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
            value: roomMetrics.steps,
            unit: 'steps',
          },
          effectiveDateTime: nowIso,
        },
        {
          id: `vyfith-hr-${Date.now()}`,
          resourceType: 'Observation',
          status: 'final',
          category: 'Cardiovascular - Reposo',
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '8867-4',
                display: 'Resting Heart Rate',
              },
            ],
          },
          valueQuantity: {
            value: roomMetrics.restingHeartRate,
            unit: 'bpm',
          },
          effectiveDateTime: nowIso,
        },
        {
          id: `vyfith-sleep-${Date.now()}`,
          resourceType: 'Observation',
          status: 'final',
          category: 'Health Connect - Sueño',
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
            value: roomMetrics.totalSleepHours,
            unit: 'hours',
          },
          effectiveDateTime: nowIso,
        },
        {
          id: `vyfith-spo2-${Date.now()}`,
          resourceType: 'Observation',
          status: 'final',
          category: 'Oximetría Biométrica',
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '2708-6',
                display: 'Oxygen saturation (SpO2)',
              },
            ],
          },
          valueQuantity: {
            value: roomMetrics.spo2,
            unit: '%',
          },
          effectiveDateTime: nowIso,
        },
        {
          id: `vyfith-cal-${Date.now()}`,
          resourceType: 'Observation',
          status: 'final',
          category: 'Actividad Física - Calorías',
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '41981-2',
                display: 'Active energy burned',
              },
            ],
          },
          valueQuantity: {
            value: roomMetrics.caloriesBurned,
            unit: 'kcal',
          },
          effectiveDateTime: nowIso,
        },
      ];

      const nextToken = `vyfith_sync_${Date.now()}`;

      const updated = updateHealthSyncState((state) => {
        state.lastSyncTime = nowIso;
        state.syncCount += 1;
        state.changesToken = nextToken;
        state.deviceId = body.deviceId || 'VYFITH-Android-Mobile';
        state.deviceName = body.deviceName || 'VYFITH_APP (Google Health Connect)';
        state.isPaired = true;

        state.currentMetrics.steps = roomMetrics.steps;
        state.currentMetrics.heartRate = roomMetrics.restingHeartRate;
        state.currentMetrics.sleepHours = roomMetrics.totalSleepHours;

        state.vyfithData = {
          connected: true,
          appName: 'VYFITH_APP (FitSync AI Android)',
          readinessScore,
          readinessCategory: readinessCategory as any,
          lastSyncTimestamp: nowIso,
          geminiAnalysis,
          roomMetrics,
          hevySummary,
        };

        state.recentObservations = [...incomingObservations, ...state.recentObservations].slice(0, 20);
      });

      // Persistir inmediatamente a disco en tiempo real
      persistStateToDisk(updated);

      return NextResponse.json(
        {
          success: true,
          message: '¡Datos recibidos exitosamente desde VYFITH_APP y guardados en tiempo real!',
          nextChangesToken: nextToken,
          syncedRecords: incomingObservations.length,
          data: updated,
        },
        { headers: corsHeaders }
      );
    }

    // Caso B: Simulación genérica de Worker de segundo plano
    if (body.simulate) {
      const randomSteps = Math.floor(Math.random() * 600) + 250;
      const hrvVariation = Math.floor(Math.random() * 7) - 3;
      const currentState = getHealthSyncState();
      
      newStepsDelta = randomSteps;
      newHrv = Math.max(50, Math.min(95, currentState.currentMetrics.hrv + hrvVariation));
      newHr = Math.floor(Math.random() * 12) + 60;
      newSleep = currentState.currentMetrics.sleepHours;

      incomingObservations = [
        {
          id: `obs-steps-${Date.now()}`,
          resourceType: 'Observation',
          status: 'final',
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '55423-8',
                display: 'Number of steps (Delta Upsertion)',
              },
            ],
          },
          valueQuantity: {
            value: randomSteps,
            unit: 'steps',
          },
          effectiveDateTime: nowIso,
          category: 'Actividad Física (Delta)',
        },
        {
          id: `obs-hrv-${Date.now()}`,
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
            value: newHrv,
            unit: 'ms',
          },
          effectiveDateTime: nowIso,
          category: 'Recuperación Biológica',
        },
      ];
    } else if (Array.isArray(body.health)) {
      // Caso C: Lote FHIR directo desde OkHttp/Retrofit
      incomingObservations = body.health.map((item: any, idx: number) => ({
        id: item.id || `obs-raw-${Date.now()}-${idx}`,
        resourceType: 'Observation',
        status: 'final',
        code: item.code || {
          coding: [{ system: 'http://loinc.org', code: '55423-8', display: 'Biometric reading' }],
        },
        valueQuantity: item.valueQuantity || { value: 0, unit: 'count' },
        effectiveDateTime: item.effectiveDateTime || nowIso,
        category: item.category || 'Salud Móvil',
      }));

      for (const obs of incomingObservations) {
        const code = obs.code?.coding?.[0]?.code;
        const val = obs.valueQuantity?.value || 0;
        if (code === '55423-8') newStepsDelta += val;
        else if (code === '80404-7') newHrv = val;
        else if (code === '8867-4') newHr = val;
        else if (code === '93832-4') newSleep = val;
      }
    }

    const nextToken = `hc_token_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const updated = updateHealthSyncState((state) => {
      state.lastSyncTime = nowIso;
      state.syncCount += 1;
      state.changesToken = nextToken;
      if (body.deviceId) state.deviceId = body.deviceId;
      if (body.deviceName) state.deviceName = body.deviceName;

      if (newStepsDelta > 0) state.currentMetrics.steps += newStepsDelta;
      if (newHrv > 0) state.currentMetrics.hrv = newHrv;
      if (newHr > 0) state.currentMetrics.heartRate = newHr;
      if (newSleep > 0) state.currentMetrics.sleepHours = newSleep;

      state.recentObservations = [...incomingObservations, ...state.recentObservations].slice(0, 20);
    });

    // Persistir inmediatamente a disco
    persistStateToDisk(updated);

    return NextResponse.json(
      {
        success: true,
        message: 'Sincronización procesada exitosamente en formato HL7 FHIR R4 y guardada en tiempo real',
        nextChangesToken: nextToken,
        syncedRecords: incomingObservations.length,
        data: updated,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Error al procesar el lote de salud',
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

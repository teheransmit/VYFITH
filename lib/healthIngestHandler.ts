import { NextRequest, NextResponse } from 'next/server';
import { getHealthSyncState, updateHealthSyncState, HealthObservation } from '@/lib/healthStore';
import { formatInt } from '@/lib/formatters';
import { computeDeterministicBiomedicalAnalysis } from '@/lib/biomedicalEngine';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function handleOptions() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function handleHealthGet() {
  const state = getHealthSyncState();
  return NextResponse.json(
    {
      success: true,
      message: 'MegaProyecto Health Sync Service Activo',
      data: state,
    },
    {
      status: 200,
      headers: corsHeaders,
    }
  );
}

export async function handleHealthPost(req: NextRequest | Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const nowIso = new Date().toISOString();
    let incomingObservations: HealthObservation[] = [];
    let newStepsDelta = 0;
    let newHrv = 0;
    let newHr = 0;
    let newSleep = 0;

    // Caso 1: Datos enviados desde VYFITH_APP (o simulación)
    if (body.source === 'VYFITH_APP' || body.simulateVyfith) {
      const isSimulated = Boolean(body.simulateVyfith);

      const readinessScore = isSimulated
        ? Math.floor(Math.random() * 25) + 75
        : Number(body.readinessScore || 85);

      const readinessCategory =
        readinessScore >= 80
          ? 'Vitalidad Óptima'
          : readinessScore >= 60
          ? 'Recuperación Adecuada'
          : 'Necesita Descanso';

      const geminiAnalysis = body.geminiAnalysis || {
        diagnostico: isSimulated
          ? 'Análisis Gemini AI: El atleta presenta una variabilidad cardíaca (HRV) alta de 78 ms y descanso reparador (2.2 h de sueño profundo). Fatiga del SNC mínima.'
          : body.geminiAnalysis?.diagnostico || 'Evaluación médica deportiva completada.',
        recomendacionMuscular: isSimulated
          ? 'Día óptimo para levantamiento pesado de hipertrofia. Carga recomendada: RPE 8.5 en ejercicios básicos multiarticulares.'
          : body.geminiAnalysis?.recomendacionMuscular || 'Continuar progresión planificada.',
        gruposPriorizar: body.geminiAnalysis?.gruposPriorizar || ['Espalda / Dorsales', 'Bíceps', 'Core'],
        gruposDescanso: body.geminiAnalysis?.gruposDescanso || ['Piernas / Cuádriceps'],
        tiempoRecuperacionHoras: body.geminiAnalysis?.tiempoRecuperacionHoras || 0,
      };

      const roomMetrics = body.roomMetrics || {
        steps: isSimulated ? Math.floor(Math.random() * 4000) + 9000 : Number(body.roomMetrics?.steps || 10500),
        deepSleepHours: isSimulated ? 2.3 : Number(body.roomMetrics?.deepSleepHours || 2.1),
        totalSleepHours: isSimulated ? 8.2 : Number(body.roomMetrics?.totalSleepHours || 7.9),
        restingHeartRate: isSimulated ? Math.floor(Math.random() * 8) + 56 : Number(body.roomMetrics?.restingHeartRate || 60),
        spo2: Number(body.roomMetrics?.spo2 || 99),
        caloriesBurned: isSimulated ? Math.floor(Math.random() * 500) + 2300 : Number(body.roomMetrics?.caloriesBurned || 2400),
      };

      const hevySummary = body.hevyWorkouts || {
        lastWorkoutName: body.hevyWorkouts?.lastWorkoutName || 'Pull Day B - Hipertrofia',
        totalVolumeKg: Number(body.hevyWorkouts?.totalVolumeKg || 15420),
        setsCompleted: Number(body.hevyWorkouts?.setsCompleted || 20),
        date: body.hevyWorkouts?.date || nowIso.slice(0, 10),
      };

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
      ];

      const nextToken = `vyfith_sync_${Date.now()}`;

      const updated = updateHealthSyncState((state) => {
        state.lastSyncTime = nowIso;
        state.syncCount += 1;
        state.changesToken = nextToken;
        state.deviceId = body.deviceId || 'V2027';
        state.deviceName = body.deviceName || 'Vivo Y20 (V2027) • Funtouch OS';
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

        state.lastReceivedPayload = body;
        state.recentObservations = [...incomingObservations, ...state.recentObservations].slice(0, 20);

        const newEvent = {
          id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: nowIso,
          source: isSimulated ? 'Simulación VYFITH_APP' : (body.source || 'VYFITH_APP Android'),
          deviceId: body.deviceId || body.model || 'Vivo Y20 (V2027)',
          endpoint: req.url ? new URL(req.url, 'http://localhost').pathname : '/api/sync/health',
          status: 200,
          recordsCount: incomingObservations.length,
          summary: `Readiness Score: ${readinessScore}/100 • ${formatInt(roomMetrics.steps)} pasos • FC Reposo: ${roomMetrics.restingHeartRate} bpm`,
          payload: body,
        };
        state.syncEvents = [newEvent, ...(state.syncEvents || [])].slice(0, 30);
      });

      const biomedicalComputed = computeDeterministicBiomedicalAnalysis({
        biometrics: {
          steps: roomMetrics.steps,
          restingHeartRate: roomMetrics.restingHeartRate,
          heartRateSeries: [{ bpm: roomMetrics.restingHeartRate, timestamp: nowIso }],
          sleepMetrics: {
            totalSleepHours: roomMetrics.totalSleepHours,
            deepSleepHours: roomMetrics.deepSleepHours,
            remSleepHours: Number((roomMetrics.totalSleepHours * 0.25).toFixed(1)),
            lightSleepHours: Number(
              Math.max(
                1,
                roomMetrics.totalSleepHours -
                  roomMetrics.deepSleepHours -
                  roomMetrics.totalSleepHours * 0.25
              ).toFixed(1)
            ),
            awakeMinutes: 15,
          },
          spo2: {
            average: roomMetrics.spo2,
            minimum: Math.max(92, roomMetrics.spo2 - 2),
          },
          activeCalories: roomMetrics.caloriesBurned,
        },
        workoutMetrics: {
          lastWorkoutName: hevySummary.lastWorkoutName,
          totalVolumeKg: hevySummary.totalVolumeKg,
          setsCompleted: hevySummary.setsCompleted,
          rpeAverage: 8.2,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: '¡Datos recibidos exitosamente desde VYFITH_APP!',
          nextChangesToken: nextToken,
          syncedRecords: incomingObservations.length,
          biomedicalPrescription: biomedicalComputed.prescription,
          data: updated,
        },
        { status: 200, headers: corsHeaders }
      );
    }

    // Caso 2: Simulación de worker de segundo plano
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
      // Caso 3: Lote FHIR R4 estándar desde HealthSyncWorker.kt de Android
      incomingObservations = body.health.map((item: any, idx: number) => ({
        id: item.id || `obs-raw-${Date.now()}-${idx}`,
        resourceType: 'Observation',
        status: 'final',
        code: item.code || {
          coding: [{ system: 'http://loinc.org', code: '55423-8', display: 'Biometric reading' }],
        },
        valueQuantity: item.valueQuantity || { value: 0, unit: 'count' },
        effectiveDateTime: item.effectiveDateTime || nowIso,
        category: item.category || 'Salud Móvil (Health Connect)',
      }));

      for (const obs of incomingObservations) {
        const code = obs.code?.coding?.[0]?.code;
        const val = obs.valueQuantity?.value || 0;
        if (code === '55423-8') newStepsDelta += val;
        else if (code === '80404-7') newHrv = val;
        else if (code === '8867-4') newHr = val;
        else if (code === '93832-4') newSleep = val;
      }
    } else {
      // Caso 4: Payload plano/directo desde cliente móvil (pasos, pulso, hrv, sueño)
      if (body.steps || body.stepCount) {
        const stepsVal = Number(body.steps || body.stepCount);
        newStepsDelta = stepsVal;
        incomingObservations.push({
          id: `obs-steps-direct-${Date.now()}`,
          resourceType: 'Observation',
          status: 'final',
          code: {
            coding: [{ system: 'http://loinc.org', code: '55423-8', display: 'Number of steps' }],
          },
          valueQuantity: { value: stepsVal, unit: 'steps' },
          effectiveDateTime: nowIso,
          category: 'Actividad Física',
        });
      }
      if (body.heartRate || body.restingHeartRate) {
        newHr = Number(body.heartRate || body.restingHeartRate);
        incomingObservations.push({
          id: `obs-hr-direct-${Date.now()}`,
          resourceType: 'Observation',
          status: 'final',
          code: {
            coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate resting' }],
          },
          valueQuantity: { value: newHr, unit: 'bpm' },
          effectiveDateTime: nowIso,
          category: 'Cardiovascular',
        });
      }
      if (body.hrv) {
        newHrv = Number(body.hrv);
        incomingObservations.push({
          id: `obs-hrv-direct-${Date.now()}`,
          resourceType: 'Observation',
          status: 'final',
          code: {
            coding: [{ system: 'http://loinc.org', code: '80404-7', display: 'Heart rate variability (HRV)' }],
          },
          valueQuantity: { value: newHrv, unit: 'ms' },
          effectiveDateTime: nowIso,
          category: 'Recuperación Biológica',
        });
      }
      if (body.sleepHours || body.sleepDuration) {
        newSleep = Number(body.sleepHours || body.sleepDuration);
        incomingObservations.push({
          id: `obs-sleep-direct-${Date.now()}`,
          resourceType: 'Observation',
          status: 'final',
          code: {
            coding: [{ system: 'http://loinc.org', code: '93832-4', display: 'Sleep duration total' }],
          },
          valueQuantity: { value: newSleep, unit: 'hours' },
          effectiveDateTime: nowIso,
          category: 'Sueño y Descanso',
        });
      }
    }

    const nextToken = `hc_token_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const updated = updateHealthSyncState((state) => {
      state.lastSyncTime = nowIso;
      state.syncCount += 1;
      state.changesToken = nextToken;
      state.lastReceivedPayload = body;
      if (body.deviceId || body.model) state.deviceId = body.deviceId || body.model;
      if (body.deviceName) state.deviceName = body.deviceName;

      if (newStepsDelta > 0) state.currentMetrics.steps = (body.stepsAbsolute ? newStepsDelta : state.currentMetrics.steps + newStepsDelta);
      if (newHrv > 0) state.currentMetrics.hrv = newHrv;
      if (newHr > 0) state.currentMetrics.heartRate = newHr;
      if (newSleep > 0) state.currentMetrics.sleepHours = newSleep;

      state.recentObservations = [...incomingObservations, ...state.recentObservations].slice(0, 20);

      const deviceName = body.deviceId || body.model || body.deviceName || 'Android Device';
      const newEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: nowIso,
        source: body.simulate ? 'Simulación Worker' : 'Google Health Connect (Móvil)',
        deviceId: deviceName,
        endpoint: req.url ? new URL(req.url, 'http://localhost').pathname : '/api/sync/health',
        status: 200,
        recordsCount: incomingObservations.length,
        summary: `${incomingObservations.length} observaciones registradas • Pasos: ${formatInt(state.currentMetrics.steps)} • HRV: ${state.currentMetrics.hrv}ms • FC: ${state.currentMetrics.heartRate}bpm`,
        payload: body,
      };
      state.syncEvents = [newEvent, ...(state.syncEvents || [])].slice(0, 30);
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Sincronización procesada exitosamente en MegaProyecto (HL7 FHIR R4)',
        nextChangesToken: nextToken,
        syncedRecords: incomingObservations.length,
        data: updated,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Error procesando sincronización de salud:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Error al procesar la sincronización de salud',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

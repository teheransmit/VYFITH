import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  buildLiveSystemInstruction,
  LiveTelemetrySnapshot,
} from '@/lib/santiagoKnowledgeBase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface MessagePayload {
  role: 'user' | 'assistant';
  text: string;
}

const REQUEST_TIMEOUT_MS = 32000; // 32 segundos de timeout estricto (>= 30s solicitados por Santiago)

/**
 * Lee directamente los 3 archivos centrales del cerebro de Obsidian en MegaProyecto/
 */
function readMegaProyectoNotes(): string {
  const cwd = process.cwd();
  const candidateDirs = [
    path.resolve(cwd, '..', 'MegaProyecto'),
    'G:\\Mi unidad\\Proyecto personal\\MegaProyecto',
    path.resolve(cwd, 'MegaProyecto'),
  ];

  let megaDir = '';
  for (const dir of candidateDirs) {
    if (fs.existsSync(dir)) {
      megaDir = dir;
      break;
    }
  }

  if (!megaDir) {
    return '';
  }

  const files = [
    '00_Antigravity_Cerebro_Proyecto_Personal.md',
    '01_Simulador_Paseos_y_Rutinas_UPB.md',
    '02_Bitacora_Automejora_y_Enlace_Cognitivo.md',
  ];

  let combined = '';
  for (const file of files) {
    const fullPath = path.join(megaDir, file);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        combined += `\n\n--- NODO OBSIDIAN MEGAPROYECTO: ${file} ---\n${content.trim()}\n`;
      } catch (err) {
        console.warn(`[BioAssistant API] Error leyendo nodo ${file}:`, err);
      }
    }
  }

  return combined;
}

/**
 * Recopila en tiempo real la telemetría viva de todos los módulos de la página (data/*.json)
 */
function readLivePageSnapshot(): LiveTelemetrySnapshot {
  const snapshot: LiveTelemetrySnapshot = {};
  const cwd = process.cwd();

  try {
    const healthPath = path.join(cwd, 'data', 'real_health_state.json');
    if (fs.existsSync(healthPath)) {
      const raw = fs.readFileSync(healthPath, 'utf-8');
      const healthData = JSON.parse(raw);
      const metrics = healthData.currentMetrics || {};
      const room = healthData.vyfithData?.roomMetrics || {};
      snapshot.health = {
        steps: metrics.steps || room.steps || 2354,
        sleepHours: metrics.sleepHours || room.totalSleepHours || 10.2,
        restingHeartRate: metrics.heartRate || room.restingHeartRate || 62,
        spo2: room.spo2 || 96.7,
        stressScore: 20,
        readinessScore: healthData.vyfithData?.readinessScore || 67,
        weight: metrics.weightKg || 55.7,
        bodyFatPct: metrics.bodyFatPct || 10.6,
        skeletalMuscleKg: metrics.skeletalMuscleKg || 25.1,
        bmi: metrics.bmi || 18.8,
        waterL: metrics.waterL || 32.8,
        fatFreeMassKg: metrics.fatFreeMassKg || 49.8,
      };
    }
  } catch (err) {
    console.warn('[BioAssistant API] Error leyendo health state:', err);
  }

  try {
    const hevyPath = path.join(cwd, 'data', 'real_hevy_workouts.json');
    if (fs.existsSync(hevyPath)) {
      const raw = fs.readFileSync(hevyPath, 'utf-8');
      const workouts = JSON.parse(raw);
      if (Array.isArray(workouts) && workouts.length > 0) {
        const last = workouts[0];
        snapshot.hevy = {
          lastWorkoutName: last.name || last.title || 'Horizontal Torso (Chest & Back)',
          totalVolumeKg: last.totalVolumeKg || 4484,
          date: last.date || '2026-10-27',
          setsCompleted: last.setsCompleted || 20,
        };
      }
    }
  } catch (err) {
    console.warn('[BioAssistant API] Error leyendo hevy state:', err);
  }

  try {
    const financePath = path.join(cwd, 'data', 'real_finance_state.json');
    if (fs.existsSync(financePath)) {
      const raw = fs.readFileSync(financePath, 'utf-8');
      const fin = JSON.parse(raw);
      snapshot.finance = {
        cajitaNu: fin.totalLiquid?.cajitaNu || 116929,
        cash: fin.totalLiquid?.cash || 5000,
        receivables: fin.pendingWalksWeekly || 25000,
        debtDaniela: 22000,
        debtYessid: 580000,
      };
    }
  } catch (err) {
    console.warn('[BioAssistant API] Error leyendo finance state:', err);
  }

  try {
    const calendarPath = path.join(cwd, 'data', 'real_calendar_events.json');
    if (fs.existsSync(calendarPath)) {
      const raw = fs.readFileSync(calendarPath, 'utf-8');
      const cal = JSON.parse(raw);
      if (cal.todayEvents || cal.tomorrowEvents) {
        snapshot.calendar = {
          todayEvents: cal.todayEvents || [],
          tomorrowEvents: cal.tomorrowEvents || [],
        };
      }
    }
  } catch (err) {
    console.warn('[BioAssistant API] Error leyendo calendar state:', err);
  }

  snapshot.academic = {
    pga: 3.93,
    estructurasAcum: 2.11,
    estructurasNeeded: 2.97,
    suelosAcum: 2.45,
    presupuestoAcum: 2.55,
  };

  return snapshot;
}

export async function POST(req: NextRequest) {
  let userQuery = '';
  try {
    const body = await req.json();
    const messages: MessagePayload[] = body.messages || [];
    const clientApiKey = body.apiKey || req.headers.get('x-gemini-api-key');
    const groqKey = body.groqApiKey || req.headers.get('x-groq-api-key') || process.env.GROQ_API_KEY;
    const requestedModel = body.model || 'auto';

    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    userQuery = lastUserMsg ? lastUserMsg.text : '';

    if (!userQuery || !userQuery.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se recibió ninguna pregunta del usuario.',
          reply: 'Por favor escribe tu consulta para el asistente.',
        },
        { status: 400 }
      );
    }

    // 1. Telemetría en vivo + Notas de MegaProyecto para el System Prompt
    const liveSnapshot = readLivePageSnapshot();
    const megaNotes = readMegaProyectoNotes();
    const systemPromptWithLiveContext = buildLiveSystemInstruction(liveSnapshot, megaNotes);

    // 2. Si el usuario seleccionó Groq o proveyó clave de Groq Cloud
    if (groqKey && (groqKey.startsWith('gsk_') || requestedModel === 'groq-llama')) {
      try {
        const groqController = new AbortController();
        const timeoutId = setTimeout(() => groqController.abort(), REQUEST_TIMEOUT_MS);

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey.trim()}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPromptWithLiveContext },
              ...messages.map((m) => ({ role: m.role, content: m.text })),
            ],
            temperature: 0.65,
            max_tokens: 2048,
          }),
          signal: groqController.signal,
        });

        clearTimeout(timeoutId);

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const groqText = groqData.choices?.[0]?.message?.content;
          if (groqText && groqText.trim()) {
            return NextResponse.json({
              success: true,
              reply: groqText.trim(),
              source: 'groq-llama-70b',
              model: 'Llama 3.3 70B (Groq Lightning)',
              snapshot: liveSnapshot,
            });
          }
        } else {
          console.warn('[BioAssistant API] Groq respondió con error:', groqRes.status, groqRes.statusText);
        }
      } catch (err: any) {
        console.warn('[BioAssistant API] Groq timeout/error:', err.message);
      }
    }

    // 3. Probar clave de Google AI Studio con modelos 2026 operativos y timeout estricto de 32s
    const hardcodedFallbackKey = 'AQ.Ab8RN6I9RHi1kNU9HeHn-_4JkgQQQ-qVWiguCDwH0VjsjFaYkQ';
    const activeGeminiKey =
      (clientApiKey && clientApiKey.trim()) ||
      process.env.GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY_BACKUP ||
      hardcodedFallbackKey;

    if (!activeGeminiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se encontró API Key de Google AI Studio. Configúrala en la interfaz o en .env.local.',
          reply: '⚠️ Error de Configuración: No se encontró ninguna API Key de Google AI Studio configurada. Por favor ingresa tu API Key en la barra superior de ajustes.',
          status: 401,
          source: 'google-ai-studio-error',
        },
        { status: 401 }
      );
    }

    // Modelos candidatos ordenados por disponibilidad y estabilidad comprobada en 2026
    let candidateModels = [
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemma-4-26b-a4b-it',
      'gemini-3.8-flash',
      'gemini-3.5-flash',
    ];

    if (requestedModel === 'gemma') {
      candidateModels = ['gemma-4-26b-a4b-it', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest'];
    } else if (requestedModel === 'gemini-3.8-flash') {
      candidateModels = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemma-4-26b-a4b-it'];
    } else if (requestedModel === 'gemini-3.5-flash-lite') {
      candidateModels = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemma-4-26b-a4b-it'];
    } else if (requestedModel === 'gemini-flash-lite-latest') {
      candidateModels = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemma-4-26b-a4b-it'];
    } else if (requestedModel === 'gemini-3.5-flash') {
      candidateModels = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest'];
    } else if (requestedModel && requestedModel !== 'auto' && requestedModel !== 'groq-llama') {
      candidateModels = [requestedModel, 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemma-4-26b-a4b-it'];
    }

    // 4. Mapeo estricto del historial de conversación para Google Gemini API
    const contents: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];

    for (const msg of messages) {
      if (!msg.text || !msg.text.trim()) continue;
      const role: 'user' | 'model' = msg.role === 'assistant' ? 'model' : 'user';
      const text = msg.text.trim();

      // Fusionar roles consecutivos idénticos para evitar error HTTP 400
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += '\n\n' + text;
      } else {
        contents.push({ role, parts: [{ text }] });
      }
    }

    // Asegurar que el último turno sea obligatoriamente del rol 'user'
    if (contents.length === 0 || contents[contents.length - 1].role !== 'user') {
      contents.push({ role: 'user', parts: [{ text: userQuery }] });
    }

    const payload = {
      system_instruction: {
        parts: [{ text: systemPromptWithLiveContext }],
      },
      contents,
      generationConfig: {
        temperature: 0.65,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    };

    let lastError: string = '';
    let lastStatusCode: number = 500;
    let lastModelAttempted: string = '';

    for (const model of candidateModels) {
      lastModelAttempted = model;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeGeminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText && replyText.trim()) {
            return NextResponse.json({
              success: true,
              reply: replyText.trim(),
              source: 'gemini-ai',
              model: `${model} (Google AI Studio)`,
              snapshot: liveSnapshot,
            });
          } else {
            lastStatusCode = 502;
            lastError = `El modelo ${model} retornó candidatos vacíos o bloqueados por filtros de seguridad.`;
          }
        } else {
          lastStatusCode = res.status;
          let errorBody = '';
          try {
            const errJson = await res.json();
            errorBody = errJson.error?.message || JSON.stringify(errJson);
          } catch {
            errorBody = await res.text();
          }
          lastError = `Google AI Studio respondió HTTP ${res.status} (${res.statusText}): ${errorBody}`;
          console.error(`[BioAssistant API] Error en ${model}:`, lastError);
        }
      } catch (fetchErr: any) {
        if (fetchErr.name === 'AbortError') {
          lastStatusCode = 504;
          lastError = `Timeout de 32 segundos alcanzado al consultar el modelo ${model} en Google AI Studio.`;
        } else {
          lastStatusCode = 500;
          lastError = `Error de red al conectar con Google AI Studio (${model}): ${fetchErr.message}`;
        }
        console.error(`[BioAssistant API] Excepción en ${model}:`, fetchErr);
      }
    }

    // 5. SI FALLA LA PETICIÓN: DEVOLVER EL ERROR HTTP REAL. PROHIBIDO FALLBACK A TEXTOS PREFABRICADOS O BIOGRAFÍAS.
    return NextResponse.json(
      {
        success: false,
        reply: `⚠️ Error de Google AI Studio [HTTP ${lastStatusCode}]: ${lastError || 'Falla desconocida al generar respuesta.'}`,
        error: lastError,
        status: lastStatusCode,
        model: lastModelAttempted,
        source: 'google-ai-studio-error',
      },
      { status: lastStatusCode >= 400 && lastStatusCode < 600 ? lastStatusCode : 500 }
    );
  } catch (error: any) {
    console.error('[BioAssistant API] Error fatal no capturado:', error);
    return NextResponse.json(
      {
        success: false,
        reply: `⚠️ Error de Servidor [HTTP 500]: ${error.message || 'Error interno inesperado'}`,
        error: error.message,
        status: 500,
        source: 'server-error',
      },
      { status: 500 }
    );
  }
}

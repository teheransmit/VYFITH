import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  gatherFullEcosystemTelemetry,
  FullEcosystemTelemetry,
  readMegaProyectoNotes,
} from '@/lib/liveTelemetryReader';
import { buildLiveSystemInstruction } from '@/lib/santiagoKnowledgeBase';
import {
  dispatchMultiAiChat,
  dispatchMultiAiParallel,
  type ParallelAgentResult,
} from '@/lib/multiAiRouter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface CognitiveInsightCard {
  category: 'TRAINING' | 'FINANCE' | 'CALENDAR' | 'SYSTEM';
  title: string;
  advice: string;
  actionLabel?: string;
  targetTab?: 'overview' | 'bio' | 'health' | 'horario' | 'grades' | 'walks' | 'finance';
}

export interface CognitivePulseCachePayload {
  generatedAt: string;
  model: string;
  source: string;
  executivePulse: string;
  insights: CognitiveInsightCard[];
  parallelAgents?: ParallelAgentResult[];
  totalLatencyMs?: number;
}

const CACHE_FILE = path.join(process.cwd(), 'data', 'cognitive_pulse_cache.json');

function readPulseCache(): CognitivePulseCachePayload | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    const raw = fs.readFileSync(CACHE_FILE, 'utf-8').replace(/^\uFEFF/, '');
    return JSON.parse(raw) as CognitivePulseCachePayload;
  } catch {
    return null;
  }
}

function writePulseCache(payload: CognitivePulseCachePayload): void {
  try {
    const tmp = `${CACHE_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(payload, null, 2), 'utf-8');
    fs.renameSync(tmp, CACHE_FILE);
  } catch (err) {
    console.warn('[CognitivePulse] Error escribiendo caché:', err);
  }
}

function parseAiPulseJson(rawText: string): {
  executivePulse: string;
  insights: CognitiveInsightCard[];
} | null {
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return null;

  try {
    const parsed = JSON.parse(cleaned.slice(startIdx, endIdx + 1));
    if (
      typeof parsed.executivePulse === 'string' &&
      Array.isArray(parsed.insights)
    ) {
      return {
        executivePulse: parsed.executivePulse.trim(),
        insights: parsed.insights.slice(0, 4).map((item: Partial<CognitiveInsightCard>) => ({
          category:
            item.category === 'TRAINING' ||
            item.category === 'FINANCE' ||
            item.category === 'CALENDAR' ||
            item.category === 'SYSTEM'
              ? item.category
              : 'SYSTEM',
          title: String(item.title || 'Insight Cognitivo'),
          advice: String(item.advice || ''),
          actionLabel: item.actionLabel ? String(item.actionLabel) : undefined,
          targetTab: item.targetTab || 'overview',
        })),
      };
    }
  } catch {
    return null;
  }
  return null;
}

async function runLiveAiCorrelation(params: {
  telemetry: FullEcosystemTelemetry;
  geminiKey?: string | null;
  nvidiaKey?: string | null;
  groqKey?: string | null;
  requestedModel?: string;
  selectedParallelModels?: string[];
}) {
  const megaNotes = readMegaProyectoNotes();
  const systemInstruction = buildLiveSystemInstruction(
    params.telemetry.snapshot,
    megaNotes
  );

  const correlationPrompt = `
Eres el Motor de Pulso Cognitivo Proactivo de VYFITH para Santiago Smit Teherán Mogollón (${params.telemetry.bogotaTimeLabel}).
Analiza la telemetría viva verificada en este instante y responde ÚNICAMENTE con un objeto JSON válido (sin markdown alrededor si es posible, o dentro de \`\`\`json) con exactamente esta estructura:

{
  "executivePulse": "Síntesis ejecutiva directa de 2 líneas cruzando sueño (${params.telemetry.healthDetailed.sleepHours}h), peso Femmto (${params.telemetry.healthDetailed.weightKg} kg), entrenamiento (${params.telemetry.hevyDetailed.lastWorkoutName}), agenda hoy y liquidez real ($${params.telemetry.financeDetailed.nequi} COP en Nequi).",
  "insights": [
    {
      "category": "TRAINING",
      "title": "Entrenamiento & Biometría",
      "advice": "Consejo específico comparando sueño (${params.telemetry.healthDetailed.sleepHours}h, ${params.telemetry.healthDetailed.sleepEfficiencyPct}% ef., ${params.telemetry.healthDetailed.restingHeartRate} bpm), última sesión (${params.telemetry.hevyDetailed.lastWorkoutName}, ${params.telemetry.hevyDetailed.totalVolumeKg} kg) y la sesión programada hoy (${params.telemetry.calendarDetailed.todayGymSession || 'revisar agenda'}) hacia la meta de ${params.telemetry.healthDetailed.targetWeightKg} kg.",
      "actionLabel": "Ver Hevy & Salud",
      "targetTab": "health"
    },
    {
      "category": "FINANCE",
      "title": "Liquidez, Cobros & Deuda Yessid",
      "advice": "Consejo exacto usando Nequi ($${params.telemetry.financeDetailed.nequi} COP, $0 efectivo), traslado de $${params.telemetry.financeDetailed.fridaPendingTransferToNu} COP de Frida a Cajita Nu (9.30% E.A.), cobro en calle de $${params.telemetry.financeDetailed.receivablesTotal} COP (Richard $${params.telemetry.financeDetailed.richardDebt} + Maba $${params.telemetry.financeDetailed.mabaDebt}) y saldo restante Yessid ($${params.telemetry.financeDetailed.yessidRemaining} COP).",
      "actionLabel": "Ir a Finanzas",
      "targetTab": "finance"
    },
    {
      "category": "CALENDAR",
      "title": "Google Calendar & Paseos Caninos",
      "advice": "Resumen de eventos hoy (${params.telemetry.calendarDetailed.todayEvents.map((e) => `${e.start} ${e.summary} [${e.rsvp}]`).join(', ') || 'Sin eventos restantes'}) y balance semanal de paseos confirmados ($${params.telemetry.calendarDetailed.weeklyConfirmedIncome} COP) vs por confirmar ($${params.telemetry.calendarDetailed.weeklyUnconfirmedIncome} COP).",
      "actionLabel": "Abrir Calendario",
      "targetTab": "horario"
    },
    {
      "category": "SYSTEM",
      "title": "Sentinel de Integridad Web",
      "advice": "Diagnóstico técnico del sistema (${params.telemetry.systemAudit.errorCount} errores de lectura JSON, ${params.telemetry.calendarDetailed.totalEventsCount} eventos sincronizados, estado de proveedores IA).",
      "actionLabel": "Ver Detalle",
      "targetTab": "bio"
    }
  ]
}
`.trim();

  const reqModel = params.requestedModel || 'parallel';
  const useParallel = reqModel === 'parallel' || reqModel === 'auto';

  const parallelOutcome = useParallel
    ? await dispatchMultiAiParallel({
        systemInstruction,
        messages: [{ role: 'user', text: correlationPrompt }],
        mode: 'json-consensus',
        keys: {
          geminiKey: params.geminiKey,
          nvidiaKey: params.nvidiaKey,
          groqKey: params.groqKey,
        },
        selectedParallelModels: params.selectedParallelModels,
        temperature: 0.4,
        maxTokens: 1500,
      })
    : null;

  const aiResult = parallelOutcome
    ? parallelOutcome
    : await dispatchMultiAiChat({
        systemInstruction,
        messages: [{ role: 'user', text: correlationPrompt }],
        requestedModel: reqModel,
        keys: {
          geminiKey: params.geminiKey,
          nvidiaKey: params.nvidiaKey,
          groqKey: params.groqKey,
        },
        temperature: 0.4,
        maxTokens: 1500,
      });

  if (!aiResult.success || !aiResult.reply) {
    return {
      aiSuccess: false,
      aiStatus: aiResult.status,
      aiError: aiResult.error || 'Error llamando al proveedor de IA',
      modelAttempted: aiResult.model,
      parallelAgents: parallelOutcome?.parallelAgents,
      cachedPulse: readPulseCache(),
    };
  }

  const parsed = parseAiPulseJson(aiResult.reply);
  if (!parsed) {
    // Si el LLM respondió texto plano sin JSON perfecto, usar el texto honesto en executivePulse
    const payload: CognitivePulseCachePayload = {
      generatedAt: new Date().toISOString(),
      model: aiResult.model,
      source: aiResult.source,
      executivePulse: aiResult.reply.slice(0, 420),
      insights: [],
      ...(parallelOutcome
        ? {
            parallelAgents: parallelOutcome.parallelAgents,
            totalLatencyMs: parallelOutcome.totalLatencyMs,
          }
        : {}),
    };
    writePulseCache(payload);
    return {
      aiSuccess: true,
      aiStatus: 200,
      aiError: null,
      cachedPulse: payload,
    };
  }

  const payload: CognitivePulseCachePayload = {
    generatedAt: new Date().toISOString(),
    model: aiResult.model,
    source: aiResult.source,
    executivePulse: parsed.executivePulse,
    insights: parsed.insights,
    ...(parallelOutcome
      ? {
          parallelAgents: parallelOutcome.parallelAgents,
          totalLatencyMs: parallelOutcome.totalLatencyMs,
        }
      : {}),
  };
  writePulseCache(payload);

  return {
    aiSuccess: true,
    aiStatus: 200,
    aiError: null,
    cachedPulse: payload,
  };
}

export async function GET(req: NextRequest) {
  try {
    const telemetry = gatherFullEcosystemTelemetry();
    const url = new URL(req.url);
    const shouldRefresh = url.searchParams.get('refresh') === 'true';

    if (!shouldRefresh) {
      const cachedPulse = readPulseCache();
      return NextResponse.json({
        success: true,
        refreshed: false,
        telemetry,
        aiPulse: cachedPulse,
        aiError: null,
      });
    }

    const geminiKey = req.headers.get('x-gemini-api-key');
    const nvidiaKey = req.headers.get('x-nvidia-api-key');
    const groqKey = req.headers.get('x-groq-api-key');
    const requestedModel = url.searchParams.get('model') || 'auto';

    const outcome = await runLiveAiCorrelation({
      telemetry,
      geminiKey,
      nvidiaKey,
      groqKey,
      requestedModel,
    });

    return NextResponse.json({
      success: true,
      refreshed: outcome.aiSuccess,
      telemetry,
      aiPulse: outcome.cachedPulse,
      aiError: outcome.aiError,
      aiStatus: outcome.aiStatus,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error)?.message || 'Error interno en cognitive-pulse',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const telemetry = gatherFullEcosystemTelemetry();

    const geminiKey = body.apiKey || req.headers.get('x-gemini-api-key');
    const nvidiaKey = body.nvidiaApiKey || req.headers.get('x-nvidia-api-key');
    const groqKey = body.groqApiKey || req.headers.get('x-groq-api-key');
    const requestedModel = body.model || 'parallel';
    const selectedParallelModels = Array.isArray(body.selectedParallelModels)
      ? body.selectedParallelModels
      : undefined;

    const outcome = await runLiveAiCorrelation({
      telemetry,
      geminiKey,
      nvidiaKey,
      groqKey,
      requestedModel,
      selectedParallelModels,
    });

    return NextResponse.json({
      success: outcome.aiSuccess,
      refreshed: outcome.aiSuccess,
      telemetry,
      aiPulse: outcome.cachedPulse,
      aiError: outcome.aiError,
      aiStatus: outcome.aiStatus,
      modelAttempted: outcome.modelAttempted,
      parallelAgents: outcome.parallelAgents,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error)?.message || 'Error ejecutando POST cognitive-pulse',
      },
      { status: 500 }
    );
  }
}

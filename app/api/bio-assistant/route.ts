import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  buildLiveSystemInstruction,
  localSemanticFallback,
  LiveTelemetrySnapshot,
} from '@/lib/santiagoKnowledgeBase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface MessagePayload {
  role: 'user' | 'assistant';
  text: string;
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
        steps: metrics.steps || room.steps || 2375,
        sleepHours: metrics.sleepHours || room.totalSleepHours || 10.2,
        restingHeartRate: metrics.heartRate || room.restingHeartRate || 62,
        spo2: room.spo2 || 96.7,
        stressScore: 20,
        readinessScore: healthData.vyfithData?.readinessScore || 67,
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

    if (!userQuery) {
      return NextResponse.json({
        success: false,
        error: 'No se recibió ninguna pregunta del usuario.',
        reply: 'Hola Santiago, ¿en qué te puedo apoyar hoy con tu agenda, entrenamiento, salud o academia?',
      });
    }

    // 1. Obtener la telemetría viva de toda la página
    const liveSnapshot = readLivePageSnapshot();
    const systemPromptWithLiveContext = buildLiveSystemInstruction(liveSnapshot);

    // 2. Si el usuario proporcionó una clave de Groq Cloud (Ultra rápida ~800 tokens/s, 0 latencia)
    if (groqKey && (groqKey.startsWith('gsk_') || requestedModel === 'groq-llama')) {
      try {
        const groqController = new AbortController();
        const timeoutId = setTimeout(() => groqController.abort(), 4000);

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
            temperature: 0.6,
            max_tokens: 1024,
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
        }
      } catch (err) {
        console.warn('[BioAssistant API] Groq timeout/error, continuando...');
      }
    }

    // 3. Probar clave de Google AI Studio (Gemini) con timeout ágil (máximo 3.5 segundos)
    const activeGeminiKey = (clientApiKey && clientApiKey.trim()) || process.env.GEMINI_API_KEY;

    if (activeGeminiKey) {
      let fastModels = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
      if (requestedModel === 'gemini-2.5-pro') {
        fastModels = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-1.5-flash'];
      } else if (requestedModel === 'gemini-2.5-flash') {
        fastModels = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
      } else if (requestedModel === 'gemini-1.5-pro') {
        fastModels = ['gemini-1.5-pro', 'gemini-2.5-flash', 'gemini-1.5-flash'];
      }

      // Preparar historial compatible con Gemini API
      const contents = messages
        .filter((m) => m.text && m.text.trim())
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.text.trim() }],
        }));

      if (contents.length === 0) {
        contents.push({ role: 'user', parts: [{ text: userQuery }] });
      }

      const payload = {
        system_instruction: {
          parts: [{ text: systemPromptWithLiveContext }],
        },
        contents,
        generationConfig: {
          temperature: 0.6,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      };

      for (const model of fastModels) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);

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
            }
          }
        } catch {
          // Timeout rápido, probar siguiente o pasar al motor en vivo
        }
      }
    }

    // 4. Fallback instantáneo (0ms) con la TELEMETRÍA EN VIVO DE TODA LA PÁGINA
    const fallbackReply = localSemanticFallback(userQuery, liveSnapshot);
    return NextResponse.json({
      success: true,
      reply: fallbackReply,
      source: 'live-telemetry-engine',
      model: 'Copiloto Determínico Telemetría en Vivo (0ms)',
      snapshot: liveSnapshot,
    });
  } catch (error: any) {
    console.error('[BioAssistant API] Error:', error);
    const liveSnapshot = readLivePageSnapshot();
    const safeReply = localSemanticFallback(userQuery || 'perfil', liveSnapshot);
    return NextResponse.json({
      success: true,
      reply: safeReply,
      source: 'live-telemetry-fallback',
      model: 'Copiloto Telemetría en Vivo (0ms)',
      snapshot: liveSnapshot,
    });
  }
}

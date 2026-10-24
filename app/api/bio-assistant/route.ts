import { NextRequest, NextResponse } from 'next/server';
import { SANTIAGO_SYSTEM_INSTRUCTION, localSemanticFallback } from '@/lib/santiagoKnowledgeBase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface MessagePayload {
  role: 'user' | 'assistant';
  text: string;
}

export async function POST(req: NextRequest) {
  let userQuery = '';
  try {
    const body = await req.json();
    const messages: MessagePayload[] = body.messages || [];
    const clientApiKey = body.apiKey || req.headers.get('x-gemini-api-key');
    const apiKey = (clientApiKey && clientApiKey.trim()) || process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_BACKUP;

    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    userQuery = lastUserMsg ? lastUserMsg.text : '';

    if (!userQuery) {
      return NextResponse.json({
        success: false,
        error: 'No se recibió ninguna pregunta del usuario.',
        reply: 'Hola, ¿qué te gustaría saber sobre Santiago?',
      });
    }

    if (!apiKey) {
      const fallbackReply = localSemanticFallback(userQuery);
      return NextResponse.json({
        success: true,
        reply: fallbackReply,
        source: 'local-semantic',
        model: 'local',
      });
    }

    // Preparar historial compatible con Gemini
    const contents = messages
      .filter((m) => m.text && m.text.trim())
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text.trim() }],
      }));

    // Si por alguna razón el historial está vacío, agregar la última consulta
    if (contents.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: userQuery }],
      });
    }

    const payload = {
      system_instruction: {
        parts: [{ text: SANTIAGO_SYSTEM_INSTRUCTION }],
      },
      contents,
      generationConfig: {
        temperature: 0.6,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    };

    // Modelos en orden de preferencia
    const candidateModels = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];

    for (const model of candidateModels) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
              model,
            });
          }
        }
      } catch (err: any) {
        console.warn(`[BioAssistant API] Falló llamada a ${model}:`, err?.message || err);
      }
    }

    // Si los modelos de Gemini fallan (cuota o timeout), recurrir al fallback semántico enriquecido
    const fallbackReply = localSemanticFallback(userQuery);
    return NextResponse.json({
      success: true,
      reply: fallbackReply,
      source: 'local-fallback-safe',
      model: 'local',
    });
  } catch (error: any) {
    console.error('[BioAssistant API] Error no controlado:', error);
    const safeReply = localSemanticFallback(userQuery || 'perfil');
    return NextResponse.json({
      success: true,
      reply: safeReply,
      source: 'local-fallback-error',
      model: 'local',
    });
  }
}

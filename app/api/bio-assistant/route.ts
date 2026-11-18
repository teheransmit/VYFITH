import { NextRequest, NextResponse } from 'next/server';
import { buildLiveSystemInstruction } from '@/lib/santiagoKnowledgeBase';
import {
  readLivePageSnapshot,
  readMegaProyectoNotes,
} from '@/lib/liveTelemetryReader';
import { dispatchMultiAiChat } from '@/lib/multiAiRouter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface MessagePayload {
  role: 'user' | 'assistant';
  text: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: MessagePayload[] = body.messages || [];
    const geminiKey = body.apiKey || req.headers.get('x-gemini-api-key');
    const nvidiaKey = body.nvidiaApiKey || req.headers.get('x-nvidia-api-key');
    const groqKey = body.groqApiKey || req.headers.get('x-groq-api-key');
    const requestedModel = body.model || 'auto';

    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    const userQuery = lastUserMsg ? lastUserMsg.text : '';

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

    const liveSnapshot = readLivePageSnapshot();
    const megaNotes = readMegaProyectoNotes();
    const systemPromptWithLiveContext = buildLiveSystemInstruction(
      liveSnapshot,
      megaNotes
    );

    const result = await dispatchMultiAiChat({
      systemInstruction: systemPromptWithLiveContext,
      messages,
      requestedModel,
      keys: {
        geminiKey,
        nvidiaKey,
        groqKey,
      },
      temperature: 0.65,
      maxTokens: 2048,
    });

    if (result.success && result.reply) {
      return NextResponse.json({
        success: true,
        reply: result.reply,
        source: result.source,
        model: result.model,
        snapshot: liveSnapshot,
      });
    }

    // Transparencia estricta: devolver el error HTTP real sin respuestas prefabricadas de 0ms
    const statusCode =
      result.status >= 400 && result.status < 600 ? result.status : 500;
    return NextResponse.json(
      {
        success: false,
        reply: `⚠️ Error del proveedor de IA [HTTP ${statusCode}]: ${result.error || 'Falla desconocida al generar respuesta.'}`,
        error: result.error,
        status: statusCode,
        model: result.model,
        source: 'google-ai-studio-error',
      },
      { status: statusCode }
    );
  } catch (error: unknown) {
    const errObj = error as { message?: string };
    console.error('[BioAssistant API] Error fatal no capturado:', error);
    return NextResponse.json(
      {
        success: false,
        reply: `⚠️ Error de Servidor [HTTP 500]: ${errObj?.message || 'Error interno inesperado'}`,
        error: errObj?.message || 'Error interno inesperado',
        status: 500,
        source: 'google-ai-studio-error',
      },
      { status: 500 }
    );
  }
}

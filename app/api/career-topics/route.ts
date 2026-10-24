import { NextRequest, NextResponse } from 'next/server';
import { CAREER_DAILY_TOPICS, CareerDailyTopic, CareerTopicQuiz } from '@/lib/careerDailyTopics';

export const dynamic = 'force-dynamic';

function fallbackQuiz(topic: CareerDailyTopic): CareerTopicQuiz[] {
  return [
    {
      question: `¿En qué disciplina se concentra principalmente “${topic.title}”?`,
      options: [topic.discipline, 'Contabilidad financiera', 'Historia del arte'],
      answer: 0,
      explanation: `La pregunta se relaciona con ${topic.discipline.toLowerCase()}.`,
    },
    {
      question: `¿Cuál es la mejor forma de estudiar este tema?`,
      options: ['Relacionarlo con cargas, materiales o sistemas reales', 'Memorizarlo sin entender el fenómeno', 'Ignorar los diagramas y ejemplos'],
      answer: 0,
      explanation: 'Conectar el concepto con un sistema real ayuda a comprobar si realmente lo comprendiste.',
    },
  ];
}

export async function GET() {
  return NextResponse.json({ success: true, online: true, aiConfigured: Boolean(process.env.GEMINI_API_KEY) });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { topicId?: string };
    const topic = CAREER_DAILY_TOPICS.find((item) => item.id === body.topicId);
    if (!topic) return NextResponse.json({ success: false, error: 'Tema no encontrado.' }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_BACKUP;
    if (!apiKey) return NextResponse.json({ success: true, source: 'local', quiz: fallbackQuiz(topic) });

    const prompt = `Genera exactamente 3 preguntas de quiz en español sobre este tema de Ingeniería Civil.
Tema: ${topic.title}
Contexto: ${topic.hook}. ${topic.prompt}
Devuelve únicamente JSON válido con esta forma: [{"question":"...","options":["...","...","..."],"answer":0,"explanation":"..."}].
answer debe ser el índice entero de la opción correcta.`;
    for (const model of ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-3.5-flash']) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.4, responseMimeType: 'application/json' },
            }),
            signal: AbortSignal.timeout(12000),
          },
        );
        if (!response.ok) continue;
        const data = await response.json();
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text
          ?.replace(/^```json\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();
        const quiz = raw ? JSON.parse(raw) as CareerTopicQuiz[] : null;
        if (Array.isArray(quiz) && quiz.length >= 2) {
          return NextResponse.json({ success: true, source: 'gemini', model, quiz: quiz.slice(0, 3) });
        }
      } catch {
        // Try the next available model, then use the local quiz.
      }
    }
    return NextResponse.json({ success: true, source: 'local-fallback', quiz: fallbackQuiz(topic) });
  } catch {
    return NextResponse.json({ success: true, source: 'local-fallback', quiz: fallbackQuiz(CAREER_DAILY_TOPICS[0]) });
  }
}

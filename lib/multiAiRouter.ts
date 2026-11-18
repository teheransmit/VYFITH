import {
  classifyDynamicNvidiaModel,
  NVIDIA_AUTO_CASCADE_MODELS,
} from '@/lib/nvidiaCatalog';

/**
 * Router Multi-IA para VYFITH (Google AI Studio Gemini, NVIDIA NIM & Groq Cloud)
 * Regla estricta: Timeout mínimo de 32s y transparencia total en códigos HTTP reales.
 * Cero respuestas estáticas o simuladas de 0ms.
 */

export const AI_REQUEST_TIMEOUT_MS = 32000;

export interface AiChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface AiKeysConfig {
  geminiKey?: string | null;
  nvidiaKey?: string | null;
  groqKey?: string | null;
}

export type AiSourceTag =
  | 'gemini-ai'
  | 'nvidia-nim'
  | 'groq-llama-70b'
  | 'google-ai-studio-error';

export interface MultiAiResponse {
  success: boolean;
  reply?: string;
  source: AiSourceTag;
  model: string;
  status: number;
  error?: string;
}

export function resolveConfiguredAiKeys(overrides?: AiKeysConfig) {
  const rawGeminiList = [
    overrides?.geminiKey?.trim(),
    process.env.GEMINI_API_KEY?.trim(),
    process.env.GEMINI_API_KEY_BACKUP?.trim(),
  ].filter((k): k is string => Boolean(k));

  const geminiKeys = Array.from(new Set(rawGeminiList));
  const geminiKey = geminiKeys[0] || '';

  const nvidiaKey =
    overrides?.nvidiaKey?.trim() || process.env.NVIDIA_API_KEY?.trim() || '';

  const groqKey =
    overrides?.groqKey?.trim() || process.env.GROQ_API_KEY?.trim() || '';

  return {
    geminiKey,
    geminiKeys,
    nvidiaKey,
    groqKey,
    statusFlags: {
      geminiReady: geminiKeys.length > 0,
      nvidiaReady: Boolean(nvidiaKey),
      groqReady: Boolean(groqKey),
    },
  };
}

/**
 * Llamada parametrizada para APIs compatibles con OpenAI (NVIDIA NIM y Groq Cloud).
 */
async function callOpenAICompatible(params: {
  endpoint: string;
  apiKey: string;
  model: string;
  displayLabel: string;
  sourceTag: 'nvidia-nim' | 'groq-llama-70b';
  systemInstruction: string;
  messages: AiChatMessage[];
  temperature: number;
  maxTokens: number;
}): Promise<MultiAiResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(params.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages: [
          { role: 'system', content: params.systemInstruction },
          ...params.messages.map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.text,
          })),
        ],
        temperature: params.temperature,
        max_tokens: params.maxTokens,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text && typeof text === 'string' && text.trim()) {
        return {
          success: true,
          reply: text.trim(),
          source: params.sourceTag,
          model: params.displayLabel,
          status: res.status,
        };
      }
      return {
        success: false,
        source: 'google-ai-studio-error',
        model: params.displayLabel,
        status: 502,
        error: `${params.displayLabel} retornó respuesta vacía.`,
      };
    }

    let errBody = '';
    try {
      const errJson = await res.json();
      errBody = errJson.error?.message || errJson.detail || JSON.stringify(errJson);
    } catch {
      errBody = await res.text();
    }

    return {
      success: false,
      source: 'google-ai-studio-error',
      model: params.displayLabel,
      status: res.status,
      error: `${params.displayLabel} respondió HTTP ${res.status} (${res.statusText}): ${errBody}`,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const errObj = err as { name?: string; message?: string };
    const isAbort = errObj?.name === 'AbortError';
    return {
      success: false,
      source: 'google-ai-studio-error',
      model: params.displayLabel,
      status: isAbort ? 504 : 500,
      error: isAbort
        ? `Timeout de 32s alcanzado en ${params.displayLabel}.`
        : `Error de red en ${params.displayLabel}: ${errObj?.message || 'Desconocido'}`,
    };
  }
}

/**
 * Llamada en cascada a los modelos activos de Google AI Studio (Gemini / Gemma).
 */
async function callGeminiCascade(params: {
  apiKey: string;
  systemInstruction: string;
  messages: AiChatMessage[];
  requestedModel: string;
  temperature: number;
  maxTokens: number;
}): Promise<MultiAiResponse> {
  let candidateModels = [
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-flash-latest',
    'gemma-4-26b-a4b-it',
    'gemini-2.5-flash',
    'gemini-3.5-flash',
  ];

  if (params.requestedModel === 'gemma') {
    candidateModels = ['gemma-4-26b-a4b-it', 'gemini-2.5-flash', 'gemini-3.5-flash-lite'];
  } else if (
    params.requestedModel &&
    params.requestedModel !== 'auto' &&
    !params.requestedModel.startsWith('nvidia') &&
    !params.requestedModel.startsWith('groq')
  ) {
    candidateModels = [
      params.requestedModel,
      ...candidateModels.filter((m) => m !== params.requestedModel),
    ];
  }

  const contents: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];
  for (const msg of params.messages) {
    if (!msg.text || !msg.text.trim()) continue;
    const role: 'user' | 'model' = msg.role === 'assistant' ? 'model' : 'user';
    const text = msg.text.trim();
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += '\n\n' + text;
    } else {
      contents.push({ role, parts: [{ text }] });
    }
  }

  if (contents.length === 0 || contents[contents.length - 1].role !== 'user') {
    const lastText = params.messages[params.messages.length - 1]?.text || 'Analiza mi estado actual.';
    contents.push({ role: 'user', parts: [{ text: lastText }] });
  }

  const payload = {
    system_instruction: { parts: [{ text: params.systemInstruction }] },
    contents,
    generationConfig: {
      temperature: params.temperature,
      topP: 0.95,
      maxOutputTokens: params.maxTokens,
    },
  };

  let lastError = '';
  let lastStatus = 500;
  let lastModel = candidateModels[0];

  for (const model of candidateModels) {
    lastModel = model;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${params.apiKey}`,
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
        if (replyText && typeof replyText === 'string' && replyText.trim()) {
          return {
            success: true,
            reply: replyText.trim(),
            source: 'gemini-ai',
            model: `${model} (Google AI Studio)`,
            status: 200,
          };
        }
        lastStatus = 502;
        lastError = `El modelo ${model} retornó candidatos vacíos.`;
      } else {
        lastStatus = res.status;
        let errorBody = '';
        try {
          const errJson = await res.json();
          errorBody = errJson.error?.message || JSON.stringify(errJson);
        } catch {
          errorBody = await res.text();
        }
        lastError = `Google AI Studio respondió HTTP ${res.status} (${res.statusText}): ${errorBody}`;
        if (res.status === 401 || res.status === 403) {
          break;
        }
      }
    } catch (fetchErr: unknown) {
      clearTimeout(timeoutId);
      const errObj = fetchErr as { name?: string; message?: string };
      if (errObj?.name === 'AbortError') {
        lastStatus = 504;
        lastError = `Timeout de 32 segundos alcanzado al consultar ${model} en Google AI Studio.`;
      } else {
        lastStatus = 500;
        lastError = `Error de red en Google AI Studio (${model}): ${errObj?.message || 'Desconocido'}`;
      }
    }
  }

  return {
    success: false,
    source: 'google-ai-studio-error',
    model: lastModel,
    status: lastStatus,
    error: lastError,
  };
}

/**
 * Orquestador Multi-Proveedor con soporte para NVIDIA NIM, Groq y Gemini AI Studio.
 */
export async function dispatchMultiAiChat(params: {
  systemInstruction: string;
  messages: AiChatMessage[];
  requestedModel?: string;
  keys?: AiKeysConfig;
  temperature?: number;
  maxTokens?: number;
}): Promise<MultiAiResponse> {
  const { geminiKeys, nvidiaKey, groqKey } = resolveConfiguredAiKeys(params.keys);
  const requestedModel = params.requestedModel || 'auto';
  const temperature = params.temperature ?? 0.55;
  const maxTokens = params.maxTokens ?? 2048;

  const attemptErrors: string[] = [];
  let lastFailedResult: MultiAiResponse | null = null;

  const tryNvidia = async (modelId: string, label?: string) => {
    if (!nvidiaKey) return null;
    const displayLabel =
      label || `${classifyDynamicNvidiaModel(modelId).label} (NVIDIA NIM)`;
    const res = await callOpenAICompatible({
      endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
      apiKey: nvidiaKey,
      model: modelId,
      displayLabel,
      sourceTag: 'nvidia-nim',
      systemInstruction: params.systemInstruction,
      messages: params.messages,
      temperature,
      maxTokens,
    });
    if (res.success) return res;
    attemptErrors.push(res.error || displayLabel);
    lastFailedResult = res;
    return null;
  };

  const tryNvidiaCascade = async () => {
    if (!nvidiaKey) return null;
    for (const modelId of NVIDIA_AUTO_CASCADE_MODELS) {
      const r = await tryNvidia(modelId);
      if (r) return r;
      if (lastFailedResult && (lastFailedResult.status === 401 || lastFailedResult.status === 403)) {
        break;
      }
    }
    return null;
  };

  const tryGroq = async () => {
    if (!groqKey) return null;
    const res = await callOpenAICompatible({
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      apiKey: groqKey,
      model: 'llama-3.3-70b-versatile',
      displayLabel: 'Llama 3.3 70B (Groq Lightning)',
      sourceTag: 'groq-llama-70b',
      systemInstruction: params.systemInstruction,
      messages: params.messages,
      temperature,
      maxTokens,
    });
    if (res.success) return res;
    attemptErrors.push(res.error || 'Groq');
    lastFailedResult = res;
    return null;
  };

  // 1. Prioridad explícita según selección del usuario
  // Soporte dinámico para CUALQUIER modelo de NVIDIA NIM (`nvidia:<provider/model>`) + alias heredados
  let explicitNvidiaModelId: string | null = null;
  if (requestedModel.startsWith('nvidia:')) {
    explicitNvidiaModelId = requestedModel.slice('nvidia:'.length).trim();
  } else if (requestedModel === 'nvidia-deepseek') {
    explicitNvidiaModelId = 'deepseek-ai/deepseek-v4.1-flash';
  } else if (requestedModel === 'nvidia-llama') {
    explicitNvidiaModelId = 'nvidia/nemotron-3.5-lightning-30b-a3b';
  } else if (requestedModel === 'nvidia-auto') {
    explicitNvidiaModelId = '__CASCADE__';
  }

  if (explicitNvidiaModelId) {
    if (!nvidiaKey) {
      return {
        success: false,
        source: 'google-ai-studio-error',
        model: `${explicitNvidiaModelId} (NVIDIA NIM)`,
        status: 401,
        error: 'No hay NVIDIA_API_KEY configurada. Obtén tu clave gratuita en build.nvidia.com (nvapi-...).',
      };
    }
    if (explicitNvidiaModelId === '__CASCADE__') {
      const r = await tryNvidiaCascade();
      if (r) return r;
    } else {
      const r = await tryNvidia(explicitNvidiaModelId);
      if (r) return r;
      // Si el modelo explícito de NVIDIA falló por no-auth (ej. 404/503), no saltar silenciosamente sin reportar si no hay otros, o caer al cascade si se prefiere
      return (
        lastFailedResult || {
          success: false,
          source: 'google-ai-studio-error',
          model: `${explicitNvidiaModelId} (NVIDIA NIM)`,
          status: 500,
          error: attemptErrors.join(' | '),
        }
      );
    }
  }

  if (requestedModel === 'groq-llama') {
    if (!groqKey) {
      return {
        success: false,
        source: 'google-ai-studio-error',
        model: 'Llama 3.3 70B (Groq)',
        status: 401,
        error: 'No hay GROQ_API_KEY configurada. Obtén tu clave gratuita en console.groq.com.',
      };
    }
    const r = await tryGroq();
    if (r) return r;
  }

  // 2. Cascada automática (si hay NVIDIA o Groq en modo auto, probar NVIDIA NIM 2026 / Groq / Gemini)
  if (requestedModel === 'auto' && nvidiaKey) {
    const r = await tryNvidiaCascade();
    if (r) return r;
  }

  if (requestedModel === 'auto' && groqKey && groqKey.startsWith('gsk_')) {
    const r = await tryGroq();
    if (r) return r;
  }

  // 3. Google AI Studio (Gemini / Gemma) — intenta todas las claves configuradas
  for (const gKey of geminiKeys) {
    const geminiRes = await callGeminiCascade({
      apiKey: gKey,
      systemInstruction: params.systemInstruction,
      messages: params.messages,
      requestedModel,
      temperature,
      maxTokens,
    });
    if (geminiRes.success) return geminiRes;
    attemptErrors.push(geminiRes.error || 'Google AI Studio');
    lastFailedResult = geminiRes;
  }

  // 4. Fallback cruzado a NVIDIA NIM o Groq si Gemini falló y el usuario no había intentado esos proveedores aún
  if (requestedModel !== 'auto' && !explicitNvidiaModelId && nvidiaKey) {
    const r = await tryNvidiaCascade();
    if (r) return r;
  }
  if (requestedModel !== 'auto' && groqKey) {
    const r = await tryGroq();
    if (r) return r;
  }

  return (
    lastFailedResult || {
      success: false,
      source: 'google-ai-studio-error',
      model: requestedModel,
      status: 401,
      error: attemptErrors.join(' | ') || 'No se encontraron claves API válidas.',
    }
  );
}

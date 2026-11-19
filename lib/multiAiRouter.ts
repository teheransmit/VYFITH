import fs from 'fs';
import path from 'path';
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
  | 'multi-ai-parallel'
  | 'google-ai-studio-error';

export interface MultiAiResponse {
  success: boolean;
  reply?: string;
  source: AiSourceTag;
  model: string;
  status: number;
  error?: string;
}

export interface ParallelAgentResult {
  id: string;
  role: string;
  provider: 'gemini' | 'nvidia' | 'groq';
  model: string;
  displayName: string;
  success: boolean;
  status: number;
  latencyMs: number;
  reply?: string;
  error?: string;
}

export interface MultiAiParallelResponse extends MultiAiResponse {
  parallelAgents: ParallelAgentResult[];
  totalLatencyMs: number;
  activeCount: number;
}

export function readServerEnvKey(name: string): string {
  const fromProc = process.env[name]?.trim();
  if (fromProc) return fromProc;
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx <= 0) continue;
        const k = trimmed.slice(0, eqIdx).trim();
        if (k === name) {
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          return val.trim();
        }
      }
    }
  } catch {
    // ignore read error
  }
  return '';
}

export function resolveConfiguredAiKeys(overrides?: AiKeysConfig) {
  const rawGeminiList = [
    overrides?.geminiKey?.trim(),
    readServerEnvKey('GEMINI_API_KEY'),
    readServerEnvKey('GEMINI_API_KEY_BACKUP'),
  ].filter((k): k is string => Boolean(k));

  const geminiKeys = Array.from(new Set(rawGeminiList));
  const geminiKey = geminiKeys[0] || '';

  const nvidiaKey =
    overrides?.nvidiaKey?.trim() || readServerEnvKey('NVIDIA_API_KEY');

  const groqKey =
    overrides?.groqKey?.trim() || readServerEnvKey('GROQ_API_KEY');

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
      const rawContent = data.choices?.[0]?.message?.content;
      const rawReasoning = data.choices?.[0]?.message?.reasoning_content;
      const text =
        typeof rawContent === 'string' && rawContent.trim()
          ? rawContent.trim()
          : typeof rawReasoning === 'string' && rawReasoning.trim()
          ? rawReasoning.trim()
          : '';
      if (text) {
        return {
          success: true,
          reply: text,
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
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite-preview',
    'gemini-flash-latest',
  ];

  if (params.requestedModel === 'gemma') {
    candidateModels = ['gemma-4-26b-a4b-it', 'gemini-3-flash-preview', 'gemini-3.5-flash-lite'];
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

async function callGeminiSingleModel(params: {
  geminiKeys: string[];
  model: string;
  systemInstruction: string;
  messages: AiChatMessage[];
  temperature: number;
  maxTokens: number;
  timeoutMs?: number;
}): Promise<MultiAiResponse> {
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

  let lastStatus = 500;
  let lastError = 'Sin clave de Google AI Studio configurada.';

  for (const apiKey of params.geminiKeys) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), params.timeoutMs || AI_REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: params.systemInstruction }] },
            contents,
            generationConfig: {
              temperature: params.temperature,
              topP: 0.95,
              maxOutputTokens: params.maxTokens,
            },
          }),
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
            model: params.model,
            status: 200,
          };
        }
        lastStatus = 502;
        lastError = `${params.model} retornó candidatos vacíos.`;
      } else {
        lastStatus = res.status;
        let errorBody = '';
        try {
          const errJson = await res.json();
          errorBody = errJson.error?.message || JSON.stringify(errJson);
        } catch {
          errorBody = await res.text();
        }
        lastError = `HTTP ${res.status} (${params.model}): ${errorBody}`;
        if (res.status !== 401 && res.status !== 403 && res.status !== 429) {
          break;
        }
      }
    } catch (fetchErr: unknown) {
      clearTimeout(timeoutId);
      const errObj = fetchErr as { name?: string; message?: string };
      lastStatus = errObj?.name === 'AbortError' ? 504 : 500;
      lastError =
        errObj?.name === 'AbortError'
          ? `Timeout (${params.model})`
          : `Error red (${params.model}): ${errObj?.message || 'Desconocido'}`;
    }
  }

  return {
    success: false,
    source: 'google-ai-studio-error',
    model: params.model,
    status: lastStatus,
    error: lastError,
  };
}

function extractBalancedJson(raw: string): Record<string, unknown> | null {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  const s = cleaned.indexOf('{');
  const e = cleaned.lastIndexOf('}');
  if (s === -1 || e === -1 || e <= s) return null;
  try {
    return JSON.parse(cleaned.slice(s, e + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Consejo Multi-IA en Paralelo: ejecuta múltiples modelos a la vez (NVIDIA NIM + Gemini + Groq),
 * recolecta sus aportes reales simultáneos con Promise.allSettled y sintetiza la respuesta final.
 */
export async function dispatchMultiAiParallel(params: {
  systemInstruction: string;
  messages: AiChatMessage[];
  mode?: 'chat-consensus' | 'json-consensus';
  keys?: AiKeysConfig;
  selectedParallelModels?: string[];
  temperature?: number;
  maxTokens?: number;
}): Promise<MultiAiParallelResponse> {
  const startedAt = Date.now();
  const { geminiKeys, nvidiaKey, groqKey } = resolveConfiguredAiKeys(params.keys);
  const temperature = params.temperature ?? 0.5;
  const maxTokens = params.maxTokens ?? 1800;
  const mode = params.mode || 'chat-consensus';

  interface SpecialistSpec {
    id: string;
    role: string;
    provider: 'gemini' | 'nvidia' | 'groq';
    model: string;
    fallbackModel?: string;
    displayName: string;
  }

  const squad: SpecialistSpec[] = [];

  if (params.selectedParallelModels && params.selectedParallelModels.length > 0) {
    params.selectedParallelModels.slice(0, 4).forEach((rawId, idx) => {
      if (rawId.startsWith('nvidia:') && nvidiaKey) {
        const mId = rawId.slice('nvidia:'.length).trim();
        squad.push({
          id: `spec-nv-${idx}`,
          role: `Especialista NVIDIA #${idx + 1}`,
          provider: 'nvidia',
          model: mId,
          displayName: classifyDynamicNvidiaModel(mId).label,
        });
      } else if (rawId === 'groq-llama' && groqKey) {
        squad.push({
          id: `spec-gq-${idx}`,
          role: 'Analista Relámpago (Groq)',
          provider: 'groq',
          model: 'llama-3.3-70b-versatile',
          displayName: 'Llama 3.3 70B (Groq)',
        });
      } else if (geminiKeys.length > 0) {
        const mId = rawId === 'gemma' ? 'gemma-4-26b-a4b-it' : rawId;
        squad.push({
          id: `spec-gm-${idx}`,
          role: `Especialista Google AI #${idx + 1}`,
          provider: 'gemini',
          model: mId,
          displayName: mId,
        });
      }
    });
  }

  if (squad.length === 0) {
    if (nvidiaKey) {
      if (geminiKeys.length > 0) {
        squad.push({
          id: 'gemini-biometric',
          role: 'Síntesis Biométrica & Correlación',
          provider: 'gemini',
          model: 'gemini-3.5-flash-lite',
          displayName: 'Gemini 3.5 Flash Lite',
        });
      }
      squad.push({
        id: 'nvidia-ultra',
        role: 'Razonamiento Profundo 550B (NVIDIA NIM)',
        provider: 'nvidia',
        model: 'nvidia/nemotron-3-ultra-550b-a55b',
        fallbackModel: 'nvidia/nemotron-3.5-lightning-30b-a3b',
        displayName: 'Nemotron 3 Ultra 550B (NVIDIA NIM)',
      });
      squad.push({
        id: 'nvidia-super',
        role: 'Estrategia & Verificación 120B (NVIDIA NIM)',
        provider: 'nvidia',
        model: 'nvidia/nemotron-3.5-super-vl-120b-a12b',
        fallbackModel: 'google/gemma-4-31b-it',
        displayName: 'Nemotron 3.5 Super 120B (NVIDIA NIM)',
      });
      squad.push({
        id: 'nvidia-bolt',
        role: 'Síntesis Rápida (NVIDIA NIM)',
        provider: 'nvidia',
        model: 'nvidia/nemotron-3.5-bolt-e4b',
        fallbackModel: 'nvidia/nemotron-3.5-lightning-30b-a3b',
        displayName: 'Nemotron 3.5 Bolt (NVIDIA NIM)',
      });
      if (groqKey) {
        squad.push({
          id: 'groq-speed',
          role: 'Análisis Relámpago (Groq)',
          provider: 'groq',
          model: 'llama-3.3-70b-versatile',
          displayName: 'Llama 3.3 70B (Groq)',
        });
      }
    } else if (geminiKeys.length > 0) {
      squad.push(
        {
          id: 'gemini-strategist',
          role: 'Estratega Biométrico & Síntesis',
          provider: 'gemini',
          model: 'gemini-3.5-flash-lite',
          displayName: 'Gemini 3.5 Flash Lite',
        },
        {
          id: 'gemini-critic',
          role: 'Analista Crítico & Finanzas',
          provider: 'gemini',
          model: 'gemini-3-flash-preview',
          displayName: 'Gemini 3 Flash',
        },
        {
          id: 'gemini-verifier',
          role: 'Plan de Acción & Verificación',
          provider: 'gemini',
          model: 'gemini-3.1-flash-lite-preview',
          displayName: 'Gemini 3.1 Flash Lite',
        }
      );
      if (groqKey) {
        squad.push({
          id: 'groq-speed',
          role: 'Análisis Relámpago (Groq)',
          provider: 'groq',
          model: 'llama-3.3-70b-versatile',
          displayName: 'Llama 3.3 70B (Groq)',
        });
      }
    } else if (groqKey) {
      squad.push({
        id: 'groq-only',
        role: 'Analista Groq Cloud',
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        displayName: 'Llama 3.3 70B (Groq)',
      });
    }
  }

  if (squad.length === 0) {
    return {
      success: false,
      source: 'google-ai-studio-error',
      model: 'Consejo Multi-IA (0 configurados)',
      status: 401,
      error: 'No se encontraron claves API activas en servidor ni navegador.',
      parallelAgents: [],
      totalLatencyMs: Date.now() - startedAt,
      activeCount: 0,
    };
  }

  const runSpecialist = async (spec: SpecialistSpec): Promise<ParallelAgentResult> => {
    const t0 = Date.now();
    const roleHint =
      mode === 'json-consensus'
        ? `\n[Rol especialista en paralelo: ${spec.role}. Entrega el JSON estricto solicitado optimizando tu enfoque de ${spec.role}.]`
        : `\n[Rol especialista en paralelo: ${spec.role}. Responde de forma concisa, precisa y con datos exactos.]`;
    const scopedInstruction = `${params.systemInstruction}${roleHint}`;

    let res: MultiAiResponse;
    if (spec.provider === 'nvidia') {
      res = await callOpenAICompatible({
        endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
        apiKey: nvidiaKey,
        model: spec.model,
        displayLabel: spec.displayName,
        sourceTag: 'nvidia-nim',
        systemInstruction: scopedInstruction,
        messages: params.messages,
        temperature,
        maxTokens,
      });
      if (!res.success && spec.fallbackModel && res.status !== 401 && res.status !== 403) {
        res = await callOpenAICompatible({
          endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
          apiKey: nvidiaKey,
          model: spec.fallbackModel,
          displayLabel: `${classifyDynamicNvidiaModel(spec.fallbackModel).label} (NVIDIA NIM)`,
          sourceTag: 'nvidia-nim',
          systemInstruction: scopedInstruction,
          messages: params.messages,
          temperature,
          maxTokens,
        });
      }
    } else if (spec.provider === 'groq') {
      res = await callOpenAICompatible({
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: groqKey,
        model: spec.model,
        displayLabel: spec.displayName,
        sourceTag: 'groq-llama-70b',
        systemInstruction: scopedInstruction,
        messages: params.messages,
        temperature,
        maxTokens,
      });
    } else {
      res = await callGeminiSingleModel({
        geminiKeys,
        model: spec.model,
        systemInstruction: scopedInstruction,
        messages: params.messages,
        temperature,
        maxTokens,
      });
    }

    return {
      id: spec.id,
      role: spec.role,
      provider: spec.provider,
      model: spec.model,
      displayName: spec.displayName,
      success: res.success,
      status: res.status,
      latencyMs: Date.now() - t0,
      reply: res.reply,
      error: res.error,
    };
  };

  const settled = await Promise.allSettled(squad.map(runSpecialist));
  const parallelAgents: ParallelAgentResult[] = settled.map((item, idx) =>
    item.status === 'fulfilled'
      ? item.value
      : {
          id: squad[idx].id,
          role: squad[idx].role,
          provider: squad[idx].provider,
          model: squad[idx].model,
          displayName: squad[idx].displayName,
          success: false,
          status: 500,
          latencyMs: Date.now() - startedAt,
          error: (item.reason as Error)?.message || 'Falla ejecutando agente paralelo',
        }
  );

  const succeeded = parallelAgents.filter((a) => a.success && a.reply);

  if (succeeded.length === 0) {
    const firstErr = parallelAgents[0];
    return {
      success: false,
      source: 'google-ai-studio-error',
      model: `Consejo Multi-IA (0/${parallelAgents.length})`,
      status: firstErr?.status || 500,
      error: parallelAgents.map((a) => `${a.displayName}: ${a.error || a.status}`).join(' | '),
      parallelAgents,
      totalLatencyMs: Date.now() - startedAt,
      activeCount: 0,
    };
  }

  let finalReply = succeeded[0].reply!;

  if (mode === 'json-consensus') {
    const parsedJsons = succeeded
      .map((a) => ({ agent: a, json: extractBalancedJson(a.reply!) }))
      .filter((x): x is { agent: ParallelAgentResult; json: Record<string, unknown> } => Boolean(x.json));

    if (parsedJsons.length >= 2) {
      // Fusionar limpiamente las opiniones paralelas sin desperdiciar latencia si ya hay estructura sólida,
      // enriqueciendo insights por categoría y combinando el executivePulse
      const mergedInsights = new Map<string, Record<string, unknown>>();
      for (const { json } of parsedJsons) {
        const list = Array.isArray(json.insights) ? json.insights : [];
        for (const rawItem of list) {
          if (!rawItem || typeof rawItem !== 'object') continue;
          const item = rawItem as Record<string, unknown>;
          const cat = String(item.category || 'SYSTEM');
          if (!mergedInsights.has(cat)) {
            mergedInsights.set(cat, item);
          } else {
            const existing = mergedInsights.get(cat)!;
            const prevAdv = String(existing.advice || '');
            const newAdv = String(item.advice || '');
            if (newAdv.length > prevAdv.length + 25) {
              mergedInsights.set(cat, item);
            }
          }
        }
      }
      const primaryPulse = String(parsedJsons[0].json.executivePulse || '');
      const secondaryPulse = parsedJsons[1]?.json.executivePulse
        ? String(parsedJsons[1].json.executivePulse)
        : '';
      const combinedPulse =
        secondaryPulse && secondaryPulse !== primaryPulse
          ? `${primaryPulse} [${parsedJsons[1].agent.displayName}: ${secondaryPulse.slice(0, 140)}]`
          : primaryPulse;

      finalReply = JSON.stringify({
        executivePulse: combinedPulse,
        insights: Array.from(mergedInsights.values()).slice(0, 4),
      });
    } else if (parsedJsons.length === 1) {
      finalReply = JSON.stringify(parsedJsons[0].json);
    }
  } else if (succeeded.length >= 2) {
    // chat-consensus: síntesis unificada con 14s de tope sobre los aportes reales paralelos
    const synthesisPrompt = [
      'Eres el Moderador del Consejo Multi-IA de VYFITH para Santiago.',
      `Pregunta original del usuario: "${params.messages[params.messages.length - 1]?.text || ''}"`,
      '',
      'Aportes obtenidos EN PARALELO de nuestros modelos especialistas:',
      ...succeeded.map(
        (a) => `### ${a.displayName} (${a.role} • ${(a.latencyMs / 1000).toFixed(1)}s)\n${a.reply}`
      ),
      '',
      'Sintetiza UNA respuesta maestra unificada, directa y en español combinando los datos exactos y puntos complementarios de todos los modelos sin repetir relleno.',
    ].join('\n');

    let fusionRes: MultiAiResponse | null = null;
    if (nvidiaKey) {
      fusionRes = await callOpenAICompatible({
        endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
        apiKey: nvidiaKey,
        model: 'nvidia/nemotron-3.5-bolt-e4b',
        displayLabel: 'Síntesis Multi-IA',
        sourceTag: 'nvidia-nim',
        systemInstruction: params.systemInstruction,
        messages: [{ role: 'user', text: synthesisPrompt }],
        temperature: 0.4,
        maxTokens: 1600,
      });
    } else if (geminiKeys.length > 0) {
      fusionRes = await callGeminiSingleModel({
        geminiKeys,
        model: 'gemini-3.5-flash-lite',
        systemInstruction: params.systemInstruction,
        messages: [{ role: 'user', text: synthesisPrompt }],
        temperature: 0.4,
        maxTokens: 1600,
        timeoutMs: 14000,
      });
    }

    if (fusionRes?.success && fusionRes.reply) {
      finalReply = fusionRes.reply;
    } else {
      finalReply = succeeded
        .map((a) => `### ${a.displayName} (${a.role})\n${a.reply}`)
        .join('\n\n---\n\n');
    }
  }

  const activeNames = succeeded.map((a) => a.displayName).join(' + ');

  return {
    success: true,
    reply: finalReply,
    source: 'multi-ai-parallel',
    model: `Consejo Paralelo (${succeeded.length}/${parallelAgents.length}: ${activeNames})`,
    status: 200,
    parallelAgents,
    totalLatencyMs: Date.now() - startedAt,
    activeCount: succeeded.length,
  };
}

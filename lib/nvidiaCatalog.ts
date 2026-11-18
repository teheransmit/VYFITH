/**
 * Catálogo oficial y dinámico de NVIDIA NIM (https://build.nvidia.com/models + https://integrate.api.nvidia.com/v1/models)
 * Actualizado al catálogo real en vivo de noviembre 2026.
 */

export type NvidiaModelCategory =
  | 'flagship'
  | 'coding'
  | 'fast'
  | 'multimodal'
  | 'utility';

export interface NvidiaModelCatalogItem {
  id: string;
  label: string;
  category: NvidiaModelCategory;
  chatCompatible: boolean;
  inLiveApi?: boolean;
  description: string;
}

export const NVIDIA_AUTO_CASCADE_MODELS = [
  'nvidia/nemotron-3.5-lightning-30b-a3b',
  'z-ai/glm-5.3-flash',
  'moonshotai/kimi-k3.1-pro',
  'mistralai/mistral-large-4-1t-a52b',
  'nvidia/nemotron-3-ultra-550b-a55b',
  'minimaxai/minimax-m3.1-flash',
  'google/gemma-4-31b-it',
] as const;

export const NVIDIA_KNOWN_CATALOG: NvidiaModelCatalogItem[] = [
  // 1. Flagship & Razonamiento Extremo
  {
    id: 'moonshotai/kimi-k3.1-pro',
    label: 'Kimi K3.1 Pro (3T • 1M ctx • Finanzas & Agentes)',
    category: 'flagship',
    chatCompatible: true,
    description: 'Modelo abierto clase 3T con contexto 1M, experto en agentic coding, finanzas y razonamiento.',
  },
  {
    id: 'mistralai/mistral-large-4-1t-a52b',
    label: 'Mistral Large 4 (1T MoE • Razonamiento)',
    category: 'flagship',
    chatCompatible: true,
    description: 'MoE 1T total / 52B activos con razonamiento avanzado, function calling y JSON estructurado.',
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b',
    label: 'Nemotron 3 Ultra 550B (1M ctx • Planificación)',
    category: 'flagship',
    chatCompatible: true,
    description: 'MoE híbrido Mamba-Transformer 550B para razonamiento profundo, código y planificación.',
  },
  {
    id: 'stepfun-ai/step-5-preview',
    label: 'Step 5 Preview (600B MoE • 1M ctx)',
    category: 'flagship',
    chatCompatible: true,
    description: 'MoE multimodal de ~600B parámetros con ventana de 1M tokens y tool calling.',
  },
  {
    id: 'deepseek-ai/deepseek-v4.1-flash',
    label: 'DeepSeek V4.1 Flash (552B MoE Multimodal)',
    category: 'flagship',
    chatCompatible: true,
    description: 'MoE 552B (8B activos) multimodal nativo de última generación en NVIDIA NIM.',
  },
  {
    id: 'moonshotai/kimi-k3',
    label: 'Kimi K3 (2.8T Multimodal • Largo Horizonte)',
    category: 'flagship',
    chatCompatible: true,
    description: 'MoE híbrido KDA+MLA para código de largo horizonte y razonamiento agéntico.',
  },

  // 2. Código & Agentes (Self-Heal / Ingeniería)
  {
    id: 'minimaxai/minimax-m3.1-flash',
    label: 'MiniMax M3.1 Flash (Coding & Agentes)',
    category: 'coding',
    chatCompatible: true,
    description: 'MoE multimodal nativo optimizado para programación, agentes y computer use.',
  },
  {
    id: 'poolside/laguna-xs-2.1',
    label: 'Poolside Laguna XS 2.1 (33B Agentic Coding)',
    category: 'coding',
    chatCompatible: true,
    description: 'MoE 33B especializado en ingeniería de software de largo horizonte y terminal.',
  },
  {
    id: 'google/gemma-4-31b-it',
    label: 'Gemma 4 31B Instruct (Código & Razonamiento)',
    category: 'coding',
    chatCompatible: true,
    description: 'Modelo denso 31B para razonamiento estructurado, código y flujos agénticos.',
  },
  {
    id: 'bigcode/starcoder2-15b',
    label: 'StarCoder2 15B (Generación de Código)',
    category: 'coding',
    chatCompatible: true,
    description: 'Modelo especializado en código entrenado en más de 600 lenguajes de programación.',
  },
  {
    id: 'openai/gpt-oss-20b',
    label: 'OpenAI GPT-OSS 20B (Matemáticas & Lógica)',
    category: 'coding',
    chatCompatible: true,
    description: 'LLM MoE abierto y compacto orientado a razonamiento lógico y matemáticas.',
  },

  // 3. Baja Latencia / Flash (Pulso Vivo)
  {
    id: 'nvidia/nemotron-3.5-lightning-30b-a3b',
    label: 'Nemotron 3.5 Lightning 30B (Ultra-Rápido)',
    category: 'fast',
    chatCompatible: true,
    description: 'MoE 30B-A3B de mínima latencia diseñado para agentes rápidos en tiempo real.',
  },
  {
    id: 'z-ai/glm-5.3-flash',
    label: 'GLM 5.3 Flash (320B MoE • Tool Calling)',
    category: 'fast',
    chatCompatible: true,
    description: 'MoE 320B (18B activos) rápido con razonamiento y llamadas a herramientas.',
  },
  {
    id: 'nvidia/nemotron-3.5-bolt-e4b',
    label: 'Nemotron 3.5 Bolt E4B (Compacto & Ágil)',
    category: 'fast',
    chatCompatible: true,
    description: 'Modelo de texto liviano para chat agéntico instantáneo y baja latencia.',
  },
  {
    id: 'google/gemma-3-12b-it',
    label: 'Gemma 3 12B Instruct (Rápido)',
    category: 'fast',
    chatCompatible: true,
    description: 'Modelo eficiente de 12B para respuestas ágiles y bajo consumo.',
  },
  {
    id: 'google/gemma-3-4b-it',
    label: 'Gemma 3 4B Instruct (Ligero)',
    category: 'fast',
    chatCompatible: true,
    description: 'Modelo ultra-ligero de 4B para tareas instantáneas.',
  },
  {
    id: 'google/diffusiongemma-26b-a4b-it',
    label: 'DiffusionGemma 26B (Generación Paralela)',
    category: 'fast',
    chatCompatible: true,
    description: 'LLM por difusión de 26B parámetros con decodificación paralela.',
  },

  // 4. Multimodal, Omni & Razonamiento Físico
  {
    id: 'nvidia/nemotron-3.5-super-vl-120b-a12b',
    label: 'Nemotron 3.5 Super VL 120B (Visión & Agentes)',
    category: 'multimodal',
    chatCompatible: true,
    description: 'Modelo multimodal de razonamiento de 120B para flujos agénticos, código y visión.',
  },
  {
    id: 'meta/muse-glimmer-30b',
    label: 'Meta Muse Glimmer 30B (Multimodal Reasoning)',
    category: 'multimodal',
    chatCompatible: true,
    description: 'Modelo multimodal (texto e imagen) con tool-calling y traza de razonamiento separada.',
  },
  {
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
    label: 'Nemotron 3 Nano Omni 30B Reasoning',
    category: 'multimodal',
    chatCompatible: true,
    description: 'Razonamiento omni-modal para imágenes, video, voz y texto.',
  },
  {
    id: 'nvidia/cosmos-reason2-8b',
    label: 'Cosmos Reason2 8B (Razonamiento Físico)',
    category: 'multimodal',
    chatCompatible: true,
    description: 'Modelo de razonamiento físico y comprensión del mundo real.',
  },
  {
    id: 'nvidia/ising-calibration-1.5-31b',
    label: 'Ising Calibration 1.5 31B (VLM Técnico)',
    category: 'multimodal',
    chatCompatible: true,
    description: 'VLM técnico basado en Gemma 4 31B para gráficas científicas.',
  },

  // 5. Traducción, Embeddings y Seguridad (Especializados / No-Chat)
  {
    id: 'nvidia/riva-translate-4b-instruct-v2',
    label: 'Riva Translate 4B v2 (Traducción NMT)',
    category: 'utility',
    chatCompatible: true,
    description: 'Modelo neuronal de traducción multilingüe de alta fidelidad.',
  },
  {
    id: 'nvidia/nemotron-3.5-embed-8b',
    label: 'Nemotron 3.5 Embed 8B (Embeddings RAG)',
    category: 'utility',
    chatCompatible: false,
    description: 'Embeddings vectoriales de alta precisión para búsqueda semántica RAG.',
  },
  {
    id: 'nvidia/nemotron-3.5-embed-1b',
    label: 'Nemotron 3.5 Embed 1B (Embeddings)',
    category: 'utility',
    chatCompatible: false,
    description: 'Embeddings ligeros para indexación rápida.',
  },
  {
    id: 'nvidia/nemotron-3-embed-1b',
    label: 'Nemotron 3 Embed 1B',
    category: 'utility',
    chatCompatible: false,
    description: 'Modelo de embeddings de 1B parámetros.',
  },
  {
    id: 'nvidia/embed-qa-4',
    label: 'NVIDIA Embed QA 4',
    category: 'utility',
    chatCompatible: false,
    description: 'Embeddings optimizados para preguntas y respuestas.',
  },
  {
    id: 'nvidia/nv-embedqa-mistral-7b-v2',
    label: 'NV-EmbedQA Mistral 7B v2',
    category: 'utility',
    chatCompatible: false,
    description: 'Embeddings basados en Mistral 7B.',
  },
  {
    id: 'nvidia/llama-3.2-nv-embedqa-1b-v1',
    label: 'Llama 3.2 NV-EmbedQA 1B v1',
    category: 'utility',
    chatCompatible: false,
    description: 'Embeddings multilingües ligeros.',
  },
  {
    id: 'nvidia/llama-3.2-nemoretriever-1b-vlm-embed-v1',
    label: 'NeMoRetriever 1B VLM Embed',
    category: 'utility',
    chatCompatible: false,
    description: 'Embeddings visuales para documentos e imágenes.',
  },
  {
    id: 'snowflake/arctic-embed-l',
    label: 'Snowflake Arctic Embed L',
    category: 'utility',
    chatCompatible: false,
    description: 'Embeddings abiertos para recuperación documental.',
  },
  {
    id: 'nvidia/nvclip',
    label: 'NVCLIP (Embeddings Visión-Texto)',
    category: 'utility',
    chatCompatible: false,
    description: 'Alineación vectorial de imágenes y texto.',
  },
  {
    id: 'nvidia/nemotron-3.5-content-safety',
    label: 'Nemotron 3.5 Content Safety',
    category: 'utility',
    chatCompatible: false,
    description: 'Moderación y clasificación de seguridad de contenido.',
  },
  {
    id: 'nvidia/llama-3.1-nemotron-safety-guard-8b-v3',
    label: 'Llama 3.1 Nemotron Safety Guard 8B v3',
    category: 'utility',
    chatCompatible: false,
    description: 'Guardrail de seguridad para salidas de LLMs.',
  },
  {
    id: 'nvidia/llama-3.1-nemoguard-8b-topic-control',
    label: 'Llama 3.1 NeMoGuard 8B Topic Control',
    category: 'utility',
    chatCompatible: false,
    description: 'Control temático de conversaciones agénticas.',
  },
  {
    id: 'nvidia/ai-synthetic-video-detector',
    label: 'AI Synthetic Video Detector',
    category: 'utility',
    chatCompatible: false,
    description: 'Detector de video sintético generado por IA.',
  },
];

const NON_CHAT_PATTERN = /embed|clip|guard|safety|detector|rerank|parse|ocr|pose|eyecontact|flux|diffusion|trellis|whisper|parakeet|tts|asr|bnr|studiovoice|boltz|diffdock|evo2|openfold|rfdiffusion|protein|cuopt|fourcastnet|kumo/i;

export function classifyDynamicNvidiaModel(id: string): NvidiaModelCatalogItem {
  const known = NVIDIA_KNOWN_CATALOG.find((m) => m.id.toLowerCase() === id.toLowerCase());
  if (known) {
    return { ...known, inLiveApi: true };
  }

  const isNonChat = NON_CHAT_PATTERN.test(id);
  let category: NvidiaModelCategory = 'flagship';
  if (isNonChat) {
    category = 'utility';
  } else if (/code|coder|starcoder|laguna/i.test(id)) {
    category = 'coding';
  } else if (/flash|lightning|bolt|nano|mini|4b|8b|12b/i.test(id)) {
    category = 'fast';
  } else if (/vl|omni|vision|cosmos|muse/i.test(id)) {
    category = 'multimodal';
  }

  const prettyName = id.split('/').pop() || id;
  return {
    id,
    label: `${prettyName} (${id.split('/')[0]})`,
    category,
    chatCompatible: !isNonChat,
    inLiveApi: true,
    description: `Modelo detectado en vivo en NVIDIA NIM API (${id}).`,
  };
}

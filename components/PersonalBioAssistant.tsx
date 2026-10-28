'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Github,
  ExternalLink,
  Settings,
  Key,
  Check,
  Copy,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Bot,
  Zap,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source?: 'gemini-ai' | 'groq-llama-70b' | 'google-ai-studio-error' | 'initial';
  model?: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'assistant',
    text: '¡Hola, Santiago! Soy tu copiloto interactivo de bio y telemetría total de VYFITH, conectado en tiempo real con **Google AI Studio** y tus notas del cerebro de **MegaProyecto**. Estoy enlazado a todos tus módulos en vivo: tu sueño y salud de Mi Fitness, tus 237 entrenamientos de Hevy, tus finanzas en Nu y tu agenda universitaria en la UPB Montería. ¿Qué deseas consultar hoy?',
    timestamp: 'Ahora',
    source: 'initial',
    model: 'Google AI Studio Live',
  },
];

const PREDEFINED_QUESTIONS = [
  '¿Cómo amaneció mi sueño en Mi Fitness y qué animal soy?',
  '¿Cómo está mi agenda de mañana (Sienna 5:30, Frida 6:10, UPB y gimnasio)?',
  '¿Cómo están mis finanzas en Nu y la deuda de Yessid?',
  '¿Cuánto necesito en el examen final de Estructuras (30%)?',
  '¿Cuál fue mi último entrenamiento en Hevy y mi meta física?',
  '¿Quién es Santiago Smit Teherán Mogollón y cuántos años tiene?',
];

/**
 * Parsea el texto en línea para resaltar negritas, código y cursivas
 */
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*|\*[^*\n]+?\*|`.*?`)/g);

  return parts.map((part, index) => {
    // Negrita: **texto**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <strong key={index} className="font-semibold text-slate-900 dark:text-white">
          {inner}
        </strong>
      );
    }
    // Código / Monospace: `texto`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 mx-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/50 dark:border-indigo-800/60 text-[11px] font-mono text-indigo-700 dark:text-indigo-300 font-medium"
        >
          {inner}
        </code>
      );
    }
    // Cursiva: *texto*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <em key={index} className="italic text-slate-700 dark:text-slate-300">
          {inner}
        </em>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

/**
 * Renderizador limpio de Markdown a JSX para eliminar sintaxis cruda (###, ---, *, **)
 */
function FormattedMessageContent({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 text-xs leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Línea vacía
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Divisor horizontal: --- o *** o ___
        if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
          return (
            <div
              key={idx}
              className="my-2.5 border-t border-slate-200/90 dark:border-slate-700/70"
            />
          );
        }

        // Encabezados: ### o ## o #
        if (trimmed.startsWith('#')) {
          const headerText = trimmed.replace(/^#+\s*/, '');
          return (
            <div
              key={idx}
              className="pt-2 pb-0.5 flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-indigo-600 dark:text-indigo-400"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>{renderInline(headerText)}</span>
            </div>
          );
        }

        // Elemento de lista con viñeta: *, -, • o número
        const isBullet = /^(\*|-|•)\s+/.test(trimmed);
        const isNumbered = /^\d+\.\s+/.test(trimmed);

        if (isBullet || isNumbered) {
          const content = trimmed.replace(/^(\*|-|•|\d+\.)\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1 py-0.5 text-slate-800 dark:text-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 mt-1.5 shrink-0" />
              <div className="flex-1">{renderInline(content)}</div>
            </div>
          );
        }

        // Párrafo de texto regular
        return (
          <p key={idx} className="text-slate-800 dark:text-slate-200">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export default function PersonalBioAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('auto');
  const [showSettings, setShowSettings] = useState(false);
  const [showKeyText, setShowKeyText] = useState(false);
  const [showGroqText, setShowGroqText] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [activeModel, setActiveModel] = useState('Google AI Studio (Gemini 3.5)');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Cargar API Keys y modelo personalizado desde localStorage si existen
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const defaultKey = 'AQ.Ab8RN6I9RHi1kNU9HeHn-_4JkgQQQ-qVWiguCDwH0VjsjFaYkQ';
      const storedKey = localStorage.getItem('vyfith_gemini_api_key');
      const storedGroq = localStorage.getItem('vyfith_groq_api_key');
      const storedModel = localStorage.getItem('vyfith_selected_model');
      if (storedKey) {
        setCustomApiKey(storedKey);
      } else {
        setCustomApiKey(defaultKey);
        localStorage.setItem('vyfith_gemini_api_key', defaultKey);
      }
      if (storedGroq) setGroqApiKey(storedGroq);
      if (storedModel) setSelectedModel(storedModel);
    }
  }, []);

  // Auto-scroll al final del chat en cada nuevo mensaje
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSaveSettings = () => {
    if (typeof window !== 'undefined') {
      if (customApiKey.trim()) {
        localStorage.setItem('vyfith_gemini_api_key', customApiKey.trim());
      } else {
        localStorage.removeItem('vyfith_gemini_api_key');
      }

      if (groqApiKey.trim()) {
        localStorage.setItem('vyfith_groq_api_key', groqApiKey.trim());
      } else {
        localStorage.removeItem('vyfith_groq_api_key');
      }

      localStorage.setItem('vyfith_selected_model', selectedModel);
      setSaveStatus('Ajustes y claves guardadas con éxito 🟢');
      setTimeout(() => setSaveStatus(null), 3500);
    }
  };

  const handleTestKey = async () => {
    setIsTestingKey(true);
    setSaveStatus('Probando conexión con Google AI Studio...');
    try {
      const res = await fetch('/api/bio-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customApiKey.trim() ? { 'x-gemini-api-key': customApiKey.trim() } : {}),
          ...(groqApiKey.trim() ? { 'x-groq-api-key': groqApiKey.trim() } : {}),
        },
        body: JSON.stringify({
          messages: [{ role: 'user', text: 'Ping de prueba. Responde brevemente: Conexión exitosa con Google AI Studio.' }],
          apiKey: customApiKey.trim() || undefined,
          groqApiKey: groqApiKey.trim() || undefined,
          model: selectedModel,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveStatus(`Conexión exitosa con ${data.model || 'Google AI Studio'} 🟢`);
        setActiveModel(data.model || 'Google AI Studio');
      } else {
        setSaveStatus(`Error [HTTP ${res.status}]: ${data.error || data.reply || 'Falla de autenticación'} 🔴`);
      }
    } catch (err: any) {
      setSaveStatus(`Error de red: ${err?.message || 'Falla de conexión'} 🔴`);
    } finally {
      setIsTestingKey(false);
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  const handleClearChat = () => {
    setMessages(INITIAL_MESSAGES);
  };

  const handleCopy = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    try {
      // Formatear mensajes previos para mantener el hilo de la conversación con la IA
      const payloadMessages = newHistory.map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        text: m.text,
      }));

      const res = await fetch('/api/bio-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customApiKey.trim() ? { 'x-gemini-api-key': customApiKey.trim() } : {}),
          ...(groqApiKey.trim() ? { 'x-groq-api-key': groqApiKey.trim() } : {}),
        },
        body: JSON.stringify({
          messages: payloadMessages,
          apiKey: customApiKey.trim() || undefined,
          groqApiKey: groqApiKey.trim() || undefined,
          model: selectedModel,
        }),
      });

      const data = await res.json();

      let replyText = '';
      let replySource: ChatMessage['source'] = 'gemini-ai';
      let replyModel = 'Google AI Studio';

      if (res.ok && data && data.success && data.reply) {
        replyText = data.reply;
        replySource = (data.source as any) || 'gemini-ai';
        replyModel = data.model || 'Google AI Studio';
        setActiveModel(replyModel);
      } else {
        // PROHIBIDO FALLBACK A TEXTOS PREFABRICADOS O BIOGRAFÍAS: MOSTRAR ERROR HTTP REAL
        const errorDetail = data?.reply || data?.error || `Error HTTP ${res.status}: ${res.statusText || 'Error en la petición a la IA'}`;
        replyText = typeof errorDetail === 'string' && errorDetail.startsWith('⚠️')
          ? errorDetail
          : `⚠️ Error de Google AI Studio [HTTP ${res.status}]: ${errorDetail}`;
        replySource = 'google-ai-studio-error';
        replyModel = data?.model ? `${data.model} (Error)` : 'Google AI Studio Error';
        setActiveModel(replyModel);
      }

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: replySource,
        model: replyModel,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('[PersonalBioAssistant] Error de red:', err);
      const errorMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ Error de Red / Conexión al contactar la IA: ${err?.message || 'Error de red inesperado'}. No se pudo conectar con el servidor local o Google AI Studio.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'google-ai-studio-error',
        model: 'Error de Red Local',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div
      id="personal-bio-assistant"
      className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start mb-10 animate-fadeIn"
    >
      {/* COLUMNA IZQUIERDA (lg:col-span-5): Bio & Portafolio de Ingeniería + Sub-tarjetas 2x2 + Proyectos 2x2 */}
      <div className="lg:col-span-5 space-y-4">
        {/* Tarjeta Principal de Bio Interactiva & Portafolio de Ingeniería */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Bio Interactiva & Portafolio de Ingeniería
              </span>
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                ID: 000533630
              </span>
            </div>

            <div className="flex items-center gap-3.5 mb-3.5">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white flex items-center justify-center font-black text-xl shadow-md ring-2 ring-indigo-500/20 shrink-0">
                ST
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Santiago Smit Teherán Mogollón
                </h2>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold block">
                  21 años • Ing. Civil Computacional
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
              Estudiante de 6° semestre en la <strong>UPB Montería</strong> (PGA 3.93). Nacido el <strong>30 de mayo de 2005 (21 años)</strong>. Une el análisis físico de estructuras, mecánica de fluidos y geotecnia con la programación avanzada (Next.js, Python, PyQGIS, algoritmos).
            </p>

            {/* Enlaces de Perfil y Botón de Ajustes */}
            <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
                title="Configurar Gemini API Key"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Configurar API</span>
              </button>
              <a
                href="https://github.com/teheransmit"
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors shadow-xs"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub @teheransmit</span>
              </a>
              <a
                href="https://vine-sternum-6db.notion.site/HORARIO-210f834da25880df9892f70cb70c5e24"
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Notion Site</span>
              </a>
            </div>
          </div>

          {/* Panel Desplegable de Configuración de API Key si está activo */}
          {showSettings && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200 text-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Orquestador de IA Multi-Modelo & Super-Respuesta
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  .env.local
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
                VYFITH conecta en tiempo real con <strong>Google AI Studio (Gemini 3.5 Flash Lite, Gemma 4, Gemini 3.8 Flash)</strong> y <strong>Groq Cloud (Llama 3.3 70B)</strong>.
              </p>

              <div className="grid grid-cols-1 gap-2.5 mb-3">
                {/* Clave Google AI Studio */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Google AI Studio API Key (Gemini)
                  </label>
                  <div className="relative">
                    <input
                      type={showKeyText ? 'text' : 'password'}
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      placeholder="Clave de Google AI Studio (ej. AIzaSy...)"
                      className="w-full px-3 py-1.5 pr-10 rounded-xl text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeyText(!showKeyText)}
                      className="cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showKeyText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Clave Groq Cloud */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Groq Cloud API Key (Llama 3.3 70B Gratis)
                  </label>
                  <div className="relative">
                    <input
                      type={showGroqText ? 'text' : 'password'}
                      value={groqApiKey}
                      onChange={(e) => setGroqApiKey(e.target.value)}
                      placeholder="Clave gratuita de Groq (gsk_...)"
                      className="w-full px-3 py-1.5 pr-10 rounded-xl text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGroqText(!showGroqText)}
                      className="cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showGroqText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Selector de Modelo y Motor */}
              <div className="mb-3">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motor de Inferencia
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
                >
                  <option value="auto">⚡ Multi-Modelo Automático (Gemini 3.5 Flash Lite + Gemma 4)</option>
                  <option value="gemini-3.5-flash-lite">🌟 Gemini 3.5 Flash Lite (Verificado & Rápido)</option>
                  <option value="gemini-flash-lite-latest">⚡ Gemini Flash Lite Latest</option>
                  <option value="gemini-3.8-flash">🚀 Gemini 3.8 Flash (Recomendado 2026)</option>
                  <option value="gemini-3.5-flash">💎 Gemini 3.5 Flash</option>
                  <option value="gemma">🧠 Gemma 4 26B (Alta Disponibilidad)</option>
                  <option value="groq-llama">⚡ Groq Cloud — Llama 3.3 70B Versatile</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="cursor-pointer px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={isTestingKey}
                  className="cursor-pointer px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingKey ? 'animate-spin' : ''}`} />
                  <span>Probar</span>
                </button>
                {saveStatus && (
                  <p className="ml-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    {saveStatus}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-mono">
            <span className="font-semibold text-slate-600 dark:text-slate-400">UPB Seccional Montería</span>
            <span>Montería, Colombia</span>
          </div>
        </div>

          {/* Sub-tarjetas Compactas de Datos Personales / Académicos (Cuadrícula 2x2) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Sub-tarjeta 1: Saber 11 */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
                  Saber 11 Mat.
                </span>
                <div className="text-base font-black text-slate-900 dark:text-white">
                  74 <span className="text-xs font-normal text-slate-400">/ 100</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-1 block">
                Percentil 97 (Top 3%)
              </span>
            </div>

            {/* Sub-tarjeta 2: PGA Acumulado */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
                  PGA UPB
                </span>
                <div className="text-base font-black text-slate-900 dark:text-white">
                  3.93 <span className="text-xs font-normal text-slate-400">/ 5.0</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                80 créditos aprobados
              </span>
            </div>

            {/* Sub-tarjeta 3: Meta Física Hevy */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
                  Meta Física Hevy
                </span>
                <div className="text-base font-black text-rose-600 dark:text-rose-400">
                  57 ➔ 60 <span className="text-xs font-normal text-slate-400">kg</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 block">
                Hipertrofia limpia
              </span>
            </div>

            {/* Sub-tarjeta 4: Disciplina Paseos */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
                  Disciplina Matutina
                </span>
                <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  05:30 <span className="text-xs font-normal text-slate-400">AM</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 block">
                Sienna & Frida
              </span>
            </div>
          </div>

          {/* Proyectos de Código Abierto e Ingeniería en Cuadrícula 2x2 */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Ecosistema de Proyectos Destacados (GitHub & Notion)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* colouring-monteria */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">colouring-monteria</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                    Open Source
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Mapeo urbano y atributos constructivos en EPSG:9377.
                </p>
              </div>

              {/* Horario- */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">Horario- UPB</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                    Notion Embed
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Gestión de horarios universitarios con NRC y exportación PDF.
                </p>
              </div>

              {/* Guías Técnicas */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">Guías Zapatas & Col.</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                    Civil UPB
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Diseño de cimentaciones directas y columnas a compresión.
                </p>
              </div>

              {/* Simulación Nu */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">Simulador Nu</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                    Nu COP
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Rendimientos CDT Nu (11.2%) y Cajitas (9.3%) con metas de ahorro.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (lg:col-span-7): Cerebro de Razonamiento Abierto de Santiago (Chat IA) */}
        <div className="lg:col-span-7">
          <div className="border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs flex flex-col">
            {/* Barra Superior del Chat */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                      Cerebro de Razonamiento Abierto de Santiago
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      Multi-Modelo Live
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    Conectado a Mi Fitness, Hevy, Notion, UPB y finanzas Nu
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearChat}
                  className="cursor-pointer p-2 rounded-xl text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Reiniciar conversación"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  En Línea
                </span>
              </div>
            </div>

            {/* Historial de Mensajes (con altura fija y scroll interno sin estirarse verticalmente) */}
            <div className="p-4 sm:p-5 space-y-3.5 h-[440px] sm:h-[480px] overflow-y-auto scrollbar-thin bg-slate-50/30 dark:bg-slate-950/40">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col group ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`relative max-w-[90%] sm:max-w-[85%] p-3.5 sm:p-4 rounded-2xl text-xs leading-relaxed transition-all ${
                      m.sender === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-xs shadow-xs'
                        : 'bg-white dark:bg-slate-800/95 border border-slate-200/90 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 rounded-bl-xs shadow-xs'
                    }`}
                  >
                    {m.sender === 'user' ? (
                      <p className="whitespace-pre-line text-white font-medium">{m.text}</p>
                    ) : (
                      <FormattedMessageContent text={m.text} />
                    )}

                    {m.sender === 'assistant' && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                          {m.model || activeModel}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(m.text, m.id)}
                          className="cursor-pointer opacity-70 group-hover:opacity-100 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-opacity"
                          title="Copiar respuesta"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500 font-medium">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                    {m.timestamp}
                  </span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-400 w-fit shadow-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium ml-1">
                    Procesando super-respuesta en vivo...
                  </span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Botones de Preguntas Rápidas */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {PREDEFINED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  disabled={isTyping}
                  className="cursor-pointer px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/80 dark:border-slate-700/80 transition-colors shrink-0 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input para Escribir Preguntas */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isTyping}
                placeholder="Pregúntale a la IA sobre Santiago (ej. sueño Mi Fitness, horario UPB, perros Sienna/Frida, meta Hevy, finanzas Nu)..."
                className="flex-1 px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isTyping || !inputValue.trim()}
                className="cursor-pointer p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white shadow-xs transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
      </div>
    </div>
  );
}

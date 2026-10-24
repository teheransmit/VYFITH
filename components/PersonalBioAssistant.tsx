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
import { localSemanticFallback } from '@/lib/santiagoKnowledgeBase';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source?: 'gemini-ai' | 'local-fallback' | 'initial';
  model?: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'assistant',
    text: '¡Hola! Soy tu asistente y copiloto interactivo de presentación personal, conectado a **Google Gemini**. Puedo responder sobre tu perfil como Ingeniero Civil Computacional en la UPB Montería, tus notas en Análisis de Estructuras, tu meta física en Hevy o el estado consolidado de tus finanzas en Nu. ¿Qué deseas consultar hoy?',
    timestamp: 'Ahora',
    source: 'initial',
  },
];

const PREDEFINED_QUESTIONS = [
  '¿Cómo están mis finanzas y mi Cajita de Nu?',
  '¿Cuánto necesito en el examen de Estructuras?',
  '¿Cuál es mi meta en el gimnasio y split en Hevy?',
  '¿Cuáles son mis proyectos destacados de software?',
  '¿Qué perros paseo y qué cobros tengo pendientes?',
  '¿Quién es Santiago Smit Teherán Mogollón?',
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
  const [showSettings, setShowSettings] = useState(false);
  const [showKeyText, setShowKeyText] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [activeModel, setActiveModel] = useState('Gemini 3.5 Flash');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Cargar API Key personalizada desde localStorage si existe
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('vyfith_gemini_api_key');
      if (storedKey) {
        setCustomApiKey(storedKey);
      }
    }
  }, []);

  // Auto-scroll al final del chat en cada nuevo mensaje
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSaveKey = () => {
    if (typeof window !== 'undefined') {
      if (customApiKey.trim()) {
        localStorage.setItem('vyfith_gemini_api_key', customApiKey.trim());
        setSaveStatus('Clave guardada exitosamente');
      } else {
        localStorage.removeItem('vyfith_gemini_api_key');
        setSaveStatus('Usando clave oficial del servidor (.env.local)');
      }
      setTimeout(() => setSaveStatus(null), 3500);
    }
  };

  const handleTestKey = async () => {
    setIsTestingKey(true);
    setSaveStatus('Probando conexión con Google Gemini...');
    try {
      const res = await fetch('/api/bio-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text: 'Ping de prueba. Responde: Conexión exitosa.' }],
          apiKey: customApiKey.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.source === 'gemini-ai') {
        setSaveStatus(`Conexión exitosa con ${data.model || 'Gemini 3.5 Flash'} 🟢`);
        setActiveModel(data.model || 'Gemini 3.5 Flash');
      } else {
        setSaveStatus(`Respuesta recibida en modo seguro (${data.source}) 🟡`);
      }
    } catch {
      setSaveStatus('Error de conexión de red 🔴');
    } finally {
      setIsTestingKey(false);
      setTimeout(() => setSaveStatus(null), 4000);
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
      // Formatear mensajes para el endpoint
      const payloadMessages = newHistory.map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        text: m.text,
      }));

      const res = await fetch('/api/bio-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customApiKey.trim() ? { 'x-gemini-api-key': customApiKey.trim() } : {}),
        },
        body: JSON.stringify({
          messages: payloadMessages,
          apiKey: customApiKey.trim() || undefined,
        }),
      });

      const data = await res.json();

      let replyText = '';
      let replySource: 'gemini-ai' | 'local-fallback' = 'gemini-ai';
      let replyModel = 'gemini-3.5-flash';

      if (data && data.success && data.reply) {
        replyText = data.reply;
        replySource = data.source === 'gemini-ai' ? 'gemini-ai' : 'local-fallback';
        replyModel = data.model || 'gemini-3.5-flash';
        setActiveModel(replyModel);
      } else {
        replyText = localSemanticFallback(text);
        replySource = 'local-fallback';
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
    } catch (err) {
      console.warn('[PersonalBioAssistant] Error de red, usando fallback semántico:', err);
      const fallbackReply = localSemanticFallback(text);
      const fallbackMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'local-fallback',
        model: 'local',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <section
      id="personal-bio-assistant"
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xs mb-10 transition-all"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Asistente Interactivo IA • Google Gemini
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {activeModel}
            </span>
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500 hidden sm:inline">
              ID: 000533630 • UPB Montería
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Bio Interactiva & Portafolio de Ingeniería
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mt-1">
            Módulo interactivo con IA en tiempo real para presentar la trayectoria, código, notas universitarias, metas físicas y finanzas de Santiago ante evaluadores y colegas.
          </p>
        </div>

        {/* Enlaces de Perfil y Botón de Ajustes */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
            title="Configurar Gemini API Key"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configurar API</span>
          </button>
          <a
            href="https://github.com/teheransmit"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors shadow-xs"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub @teheransmit</span>
          </a>
          <a
            href="https://vine-sternum-6db.notion.site/HORARIO-210f834da25880df9892f70cb70c5e24"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Notion Site</span>
          </a>
        </div>
      </div>

      {/* Panel Desplegable de Configuración de API Key */}
      {showSettings && (
        <div className="my-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Configuración de Google Gemini API Key
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
              Inyectada en servidor: .env.local
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
            El sistema ya cuenta con la clave oficial de Santiago configurada en el servidor. Si deseas usar una clave propia de Google AI Studio, puedes ingresarla aquí (se guardará exclusivamente en tu navegador).
          </p>

          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <div className="relative flex-1">
              <input
                type={showKeyText ? 'text' : 'password'}
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder="Pega tu API Key de Google AI Studio (ej. AQ.Ab8RN...)"
                className="w-full px-3.5 py-2 pr-10 rounded-xl text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <button
                type="button"
                onClick={() => setShowKeyText(!showKeyText)}
                className="cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showKeyText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveKey}
                className="cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={handleTestKey}
                disabled={isTestingKey}
                className="cursor-pointer px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingKey ? 'animate-spin' : ''}`} />
                <span>Probar</span>
              </button>
            </div>
          </div>

          {saveStatus && (
            <p className="mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              {saveStatus}
            </p>
          )}
        </div>
      )}

      {/* Grid de Presentación: Tarjeta de Identidad + Proyectos Clave */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">
        {/* Tarjeta de Identidad */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-slate-50 to-purple-50/60 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/40 border border-indigo-100 dark:border-indigo-900/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-lg shadow-sm">
                ST
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Santiago Smit Teherán Mogollón</h3>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold block">
                  19 años • Ing. Civil Computacional
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Estudiante de 6° semestre en la <strong>UPB Montería</strong> (PGA 3.93). Une el análisis físico de estructuras, mecánica de fluidos y geotecnia con la programación avanzada (Next.js, Python, PyQGIS, algoritmos).
            </p>

            <div className="space-y-2 border-t border-slate-200/60 dark:border-slate-800/80 pt-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Saber 11 Matemáticas:</span>
                <span className="font-bold text-slate-900 dark:text-white">74/100 (Percentil 97)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Meta Hevy Gym:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">57 kg ➔ 60 kg limpios</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Disciplina Vital:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Paseos Frida 5:50 AM</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-mono">
            <span>ID: 000533630</span>
            <span>Montería, Colombia</span>
          </div>
        </div>

        {/* Proyectos de Código Abierto e Ingeniería */}
        <div className="lg:col-span-2 space-y-3">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Ecosistema de Proyectos Destacados (GitHub & Notion)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* colouring-monteria */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-slate-900 dark:text-white">colouring-monteria</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  Open Source
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Plataforma de mapeo y atributos constructivos urbanos de Montería. Enfoque en infraestructura civil y datos espaciales.
              </p>
            </div>

            {/* Horario- */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-slate-900 dark:text-white">Horario- (GitHub Pages)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                  Notion Embed
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Aplicación web de gestión de horarios universitarios con códigos NRC, selección de colores y exportación en PDF.
              </p>
            </div>

            {/* Guías Técnicas */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-slate-900 dark:text-white">Guías Zapatas & Columnas</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                  Civil UPB
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Manuales técnicos de diseño y construcción de cimentaciones directas y elementos a compresión para obras civiles.
              </p>
            </div>

            {/* Simulación Nu */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-slate-900 dark:text-white">Simulador Financiero Nu</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                  COP Nu CDT
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Modelado de rendimientos de CDT Nu (11.2% EA) y Cajitas Nu (9.3% EA) cruzados con metas de ahorro de tarjeta estudiantil.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Asistente Conversacional Interactivo (Bio IA con Gemini) */}
      <div className="mt-6 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/60 shadow-xs">
        {/* Barra Superior del Chat */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Chatbot de Presentación: Asistente IA de Santiago
                </h4>
                <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  Gemini Flash Live
                </span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                Responde en tiempo real con datos de su Notion, historial académico, Hevy y finanzas Nu
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              className="cursor-pointer p-1.5 rounded-lg text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Reiniciar conversación"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              En Línea
            </span>
          </div>
        </div>

        {/* Historial de Mensajes */}
        <div className="p-4 space-y-4 max-h-[380px] overflow-y-auto scrollbar-thin">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col group ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`relative max-w-[90%] sm:max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed transition-all ${
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
                Gemini procesando respuesta...
              </span>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Botones de Preguntas Rápidas */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
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
          className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isTyping}
            placeholder="Pregúntale a Gemini sobre Santiago (ej. notas en Estructuras, proyectos de software, meta en Hevy)..."
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
    </section>
  );
}

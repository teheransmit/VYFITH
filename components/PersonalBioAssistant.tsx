'use client';

import React, { useState } from 'react';
import {
  User,
  Sparkles,
  Send,
  Code,
  GraduationCap,
  Dumbbell,
  Compass,
  CheckCircle2,
  ExternalLink,
  Github,
  Award,
  Layers,
  Heart,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'assistant',
    text: '¡Hola! Soy el asistente interactivo de presentación personal de Santiago Smith Terán. Estoy aquí para contarte sobre su perfil como estudiante de Ingeniería Civil e Hidroinformática en la UPB Montería, sus proyectos de software, su rendimiento académico y sus metas. ¿Qué te gustaría conocer?',
    timestamp: 'Ahora',
  },
];

const PREDEFINED_QUESTIONS = [
  '¿Quién es Santiago Smith Terán y cuál es su pasión?',
  '¿Cuáles son sus proyectos destacados de software e ingeniería?',
  '¿Cómo va su rendimiento académico en el 6° semestre de la UPB?',
  '¿Cuál es su disciplina deportiva y meta en el gimnasio?',
];

export default function PersonalBioAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const generateAnswer = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes('quién') || q.includes('pasion') || q.includes('perfil') || q.includes('bio')) {
      return 'Santiago Smith Terán Mogollón tiene 19 años y cursa 6° semestre de Ingeniería Civil en la Universidad Pontificia Bolivariana (Seccional Montería). Destaca por un percentil 97 nacional en Matemáticas (ICFES) y un PGA de 3.93/5.00 con calificaciones perfectas en Ecuaciones Diferenciales (5.00). Su verdadera pasión es la intersección entre la física civil y la computación: la Hidroinformática, el modelado matemático, la automatización y el desarrollo de software.';
    }
    if (q.includes('proyecto') || q.includes('software') || q.includes('github') || q.includes('repositorio')) {
      return 'Entre sus proyectos clave destacan:\n1. colouring-monteria: Plataforma open-source para cartografía de atributos constructivos de edificaciones en Montería.\n2. Horario- (GitHub Pages): Gestor de horarios universitarios publicado y embebido en su Notion Site oficial.\n3. VYFITH: Plataforma integral de salud biométrica HL7 FHIR, entrenamientos Hevy y finanzas personales.\n4. Guías técnicas: Documentación del proceso constructivo de zapatas y columnas.';
    }
    if (q.includes('semestre') || q.includes('upb') || q.includes('nota') || q.includes('academ')) {
      return 'En el semestre 2026-II cursa 13 créditos. Su materia foco prioritaria es Análisis de Estructuras (NRC 52885), donde tras obtener 3.70 en el Avance 5 acumula 2.11/5.00 (70% evaluado), necesitando 2.97 (~3.0) en el Examen Final para aprobar y desbloquear Concreto I. En Mecánica de Suelos ya cuenta con 2.45 acumulados, prácticamente asegurando la materia.';
    }
    if (q.includes('gym') || q.includes('hevy') || q.includes('deporte') || q.includes('meta') || q.includes('físic')) {
      return 'Santiago entrena con un split de 6 días a la semana registrado en Hevy. Actualmente pesa 57 kg a 170 cm de estatura y tiene 8 abdominales visibles, con la meta enfocada de alcanzar 60 kg de masa muscular limpia. Prioriza tríceps, antebrazos y pantorrillas, registrando meticulosamente el tonelaje levantado, series efectivas (W/F/D) y RPE.';
    }
    return `Santiago es un perfil híbrido escaso: Ingeniero Civil e Hidroinformático. Combina la rigurosidad del cálculo estructural y la modelación hidrológica con el desarrollo de software moderno (Next.js, Python, TypeScript, PyQGIS) y una estricta disciplina física de recuperación y entrenamiento.`;
  };

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const reply = generateAnswer(text);
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <section id="personal-bio-assistant" className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xs mb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Asistente de Presentación Personal (Notion AGENDA)
            </span>
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
              Perfil Ejecutivo • Santiago Smith Terán
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Bio Interactiva & Portafolio de Ingeniería
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mt-1">
            Módulo interactivo concebido en Notion para presentar la trayectoria, proyectos y visión técnica de Santiago ante evaluadores, reclutadores o colegas.
          </p>
        </div>

        {/* Enlaces de Perfil */}
        <div className="flex items-center gap-2 flex-wrap">
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
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Santiago Smith Terán</h3>
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

      {/* Asistente Conversacional Interactivo (Bio IA) */}
      <div className="mt-6 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/60">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Chatbot de Presentación: Pregúntale al Asistente de Santiago
              </h4>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                Responde al instante con los datos de su Notion y portafolio técnico
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80">
            En Línea
          </span>
        </div>

        {/* Historial de Mensajes */}
        <div className="p-4 space-y-3 max-h-[320px] overflow-y-auto scrollbar-thin">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-xs'
                    : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 rounded-bl-xs shadow-xs'
                }`}
              >
                <p className="whitespace-pre-line">{m.text}</p>
              </div>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                {m.timestamp}
              </span>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-1.5 p-3 rounded-xl bg-white dark:bg-slate-800 text-xs text-slate-400 w-fit">
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
            </div>
          )}
        </div>

        {/* Botones de Preguntas Rápidas */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {PREDEFINED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="cursor-pointer px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/80 dark:border-slate-700/80 transition-colors shrink-0"
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
            placeholder="Escribe una pregunta sobre Santiago (ej. ¿cuál es su meta en Hevy?, proyectos, etc.)..."
            className="flex-1 px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
          <button
            type="submit"
            className="cursor-pointer p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </section>
  );
}

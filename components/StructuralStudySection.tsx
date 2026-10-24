'use client';

import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Download,
  FilePenLine,
  RotateCcw,
  Sparkles,
  Target,
} from 'lucide-react';
import {
  STRUCTURAL_EXAM_DATE,
  STRUCTURAL_STUDY_TOPICS,
  StudyTopicStatus,
} from '@/lib/structuralStudyPlan';
import { initialAcademicData } from '@/lib/academicStore';

const STORAGE_KEY = 'vyfith-structural-study-progress-v1';
const DAILY_KEY = 'vyfith-structural-study-daily-v1';

type Progress = Record<string, StudyTopicStatus>;

function localDateKey() {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

function daysUntilExam() {
  const today = new Date();
  const exam = new Date(`${STRUCTURAL_EXAM_DATE}T23:59:59`);
  return Math.max(0, Math.ceil((exam.getTime() - today.getTime()) / 86_400_000));
}

function readStoredStudyState() {
  if (typeof window === 'undefined') {
    return { progress: {} as Progress, dailyDate: null as string | null, dailyTopicId: null as string | null };
  }
  try {
    const storedProgress = window.localStorage.getItem(STORAGE_KEY);
    const storedDaily = window.localStorage.getItem(DAILY_KEY);
    const daily = storedDaily ? JSON.parse(storedDaily) as { date: string; topicId: string } : null;
    return {
      progress: storedProgress ? JSON.parse(storedProgress) as Progress : {},
      dailyDate: daily?.date ?? null,
      dailyTopicId: daily?.topicId ?? null,
    };
  } catch {
    return { progress: {} as Progress, dailyDate: null as string | null, dailyTopicId: null as string | null };
  }
}

function createXoppTemplate(topicTitle: string, exercise: string) {
  const escapeXml = (value: string) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
  const escapedTitle = escapeXml(topicTitle);
  const escapedExercise = escapeXml(exercise);
  return `<?xml version="1.0" standalone="no"?>
<xournal creator="VYFITH" fileversion="4">
  <title>VYFITH - ${escapedTitle}</title>
  <page width="595.28" height="841.89">
    <background type="solid" color="#ffffffff" style="plain"/>
    <layer>
      <text x="72" y="72" font="Sans" size="18" color="#000000ff" valign="top" halign="left">VYFITH | ${escapedTitle}</text>
      <text x="72" y="112" font="Sans" size="13" color="#000000ff" valign="top" halign="left">Ejercicio: ${escapedExercise}</text>
      <text x="72" y="160" font="Sans" size="12" color="#000000ff" valign="top" halign="left">Desarrolla aquí: datos, diagrama, procedimiento y verificación.</text>
    </layer>
  </page>
</xournal>`;
}

export default function StructuralStudySection() {
  const [storedState] = useState(readStoredStudyState);
  const [progress, setProgress] = useState<Progress>(storedState.progress);
  const [dailyTopicId, setDailyTopicId] = useState<string | null>(storedState.dailyTopicId);
  const [dailyDate, setDailyDate] = useState<string | null>(storedState.dailyDate);
  const [isRolling, setIsRolling] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const today = localDateKey();
  const topic = STRUCTURAL_STUDY_TOPICS.find((item) => item.id === dailyTopicId) ?? null;
  const selectedTopic = STRUCTURAL_STUDY_TOPICS.find((item) => item.id === selectedTopicId) ?? topic;
  const completedCount = STRUCTURAL_STUDY_TOPICS.filter((item) => progress[item.id] === 'completed').length;
  const remainingTopics = STRUCTURAL_STUDY_TOPICS.filter((item) => progress[item.id] !== 'completed');
  const completionPercent = Math.round((completedCount / STRUCTURAL_STUDY_TOPICS.length) * 100);
  const isTodayAssigned = dailyDate === today && Boolean(topic);
  const structuralCourse = initialAcademicData.courses.find((course) => course.id === 'c-estructuras');

  const statusLabel = useMemo(() => ({
    pending: 'Pendiente',
    in_progress: 'En estudio',
    completed: 'Completado',
    review: 'Repasar',
  } satisfies Record<StudyTopicStatus, string>), []);

  const saveProgress = (next: Progress) => {
    setProgress(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const rollDailyTopic = () => {
    if (isRolling || isTodayAssigned) return;
    setIsRolling(true);
    setShowSolution(false);
    const pool = remainingTopics.length > 0 ? remainingTopics : STRUCTURAL_STUDY_TOPICS;
    const selected = pool[Math.floor(Math.random() * pool.length)];
    window.setTimeout(() => {
      setDailyTopicId(selected.id);
      setDailyDate(today);
      window.localStorage.setItem(DAILY_KEY, JSON.stringify({ date: today, topicId: selected.id }));
      saveProgress({ ...progress, [selected.id]: 'in_progress' });
      setIsRolling(false);
    }, 1100);
  };

  const updateTopicStatus = (id: string, status: StudyTopicStatus) => {
    saveProgress({ ...progress, [id]: status });
  };

  const downloadTemplate = async (id: string) => {
    const selected = STRUCTURAL_STUDY_TOPICS.find((item) => item.id === id);
    if (!selected) return;
    const xml = new Blob([createXoppTemplate(selected.title, selected.exercise)], { type: 'application/xml' });
    let blob: Blob = xml;
    if ('CompressionStream' in window) {
      const compressor = new CompressionStream('gzip');
      const writer = compressor.writable.getWriter();
      await writer.write(await xml.arrayBuffer());
      await writer.close();
      blob = await new Response(compressor.readable).blob();
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VYFITH-${selected.id}.xopp`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-6 animate-fadeIn">
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-950 via-indigo-950 to-amber-950 border border-indigo-800/50 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-400/15 px-3 py-1 text-xs font-semibold text-indigo-200 border border-indigo-400/30">
              <Target className="h-3.5 w-3.5" />
              Misión: aprobar Análisis de Estructuras
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Plan de Estudio</h1>
            <p className="text-sm sm:text-base leading-relaxed text-slate-300">
              Un tema al día, un ejercicio en Xournal++ y una verificación clara antes de avanzar.
              Examen final: <strong className="text-amber-300">29 de octubre de 2026</strong>.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
              <div className="text-2xl font-black text-amber-300">{daysUntilExam()}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-300">Días restantes</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
              <div className="text-2xl font-black text-emerald-300">{completionPercent}%</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-300">Temario cubierto</div>
            </div>
          </div>
        </div>
        <div className="relative z-10 mt-5 flex flex-wrap gap-2 text-xs">
          <span className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-amber-200">
            Meta para aprobar: <strong>{structuralCourse?.neededForPassing.toFixed(2) ?? '2.97'}</strong>
          </span>
          <span className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-slate-300">
            Acumulado: <strong className="text-white">{structuralCourse?.accumulatedPoints.toFixed(2) ?? '2.11'}</strong> / 5.00
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-5 rounded-3xl border border-indigo-200 dark:border-indigo-900/70 bg-indigo-50/70 dark:bg-indigo-950/30 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">Reto de hoy</span>
              <h2 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">Ruleta de temas</h2>
            </div>
            <Sparkles className="h-6 w-6 text-amber-500" />
          </div>
          <div className={`my-6 min-h-36 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-white/80 dark:bg-slate-900/80 p-5 flex items-center justify-center text-center ${isRolling ? 'animate-pulse' : ''}`}>
            {isRolling ? (
              <div className="space-y-2">
                <div className="text-sm text-indigo-500">Seleccionando tu reto...</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">Método · Compatibilidad · Equilibrio</div>
              </div>
            ) : topic ? (
              <div>
                <div className="text-xs font-semibold text-indigo-500 dark:text-indigo-300">{topic.area}</div>
                <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{topic.title}</div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Asignado hoy · {topic.estimatedMinutes} min</div>
              </div>
            ) : (
              <div className="text-sm text-slate-500 dark:text-slate-400">Gira la ruleta para elegir el primer reto.</div>
            )}
          </div>
          <button
            type="button"
            onClick={rollDailyTopic}
            disabled={isRolling || isTodayAssigned}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isTodayAssigned ? 'Reto de hoy guardado' : isRolling ? 'Eligiendo tema...' : 'Elegir tema de hoy'}
          </button>
          <p className="mt-3 text-center text-[11px] text-slate-500 dark:text-slate-400">
            La selección se guarda en este navegador y no cambia al recargar.
          </p>
        </div>

        <div className="xl:col-span-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-300">Sesión práctica</span>
              <h2 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{selectedTopic ? selectedTopic.title : 'Esperando tema'}</h2>
            </div>
            {selectedTopic && (
              <button type="button" onClick={() => downloadTemplate(selectedTopic.id)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                <Download className="h-3.5 w-3.5" /> Plantilla Xournal++
              </button>
            )}
          </div>
          {selectedTopic ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"><FilePenLine className="h-4 w-4 text-amber-500" /> Ejercicio libre</div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{selectedTopic.exercise}</p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Resuélvelo en Xournal++ y marca “terminé” cuando quieras revisar.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['in_progress', 'completed', 'review'] as StudyTopicStatus[]).map((status) => (
                  <button key={status} type="button" onClick={() => updateTopicStatus(selectedTopic.id, status)} className={`rounded-lg px-3 py-2 text-xs font-bold ${progress[selectedTopic.id] === status ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                    {status === 'in_progress' ? 'Estoy estudiando' : status === 'completed' ? 'Terminé' : 'Necesito repasar'}
                  </button>
                ))}
                <button type="button" onClick={() => setShowSolution((current) => !current)} className="rounded-lg bg-amber-100 dark:bg-amber-950/50 px-3 py-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                  {showSolution ? 'Ocultar verificación' : 'Verificar procedimiento'}
                </button>
              </div>
              {showSolution && (
                <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/70 bg-emerald-50/70 dark:bg-emerald-950/30 p-4">
                  <div className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Lista de verificación</div>
                  <ul className="mt-2 space-y-1.5 text-xs text-emerald-900/80 dark:text-emerald-200">
                    {selectedTopic.checkpoints.map((checkpoint) => <li key={checkpoint} className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 shrink-0" />{checkpoint}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl bg-slate-50 dark:bg-slate-800/70 p-8 text-center text-sm text-slate-500">Gira la ruleta para comenzar.</div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Ruta del examen</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Marca cada bloque según tu dominio real, no solo por haberlo leído.</p>
          </div>
          <BookOpen className="h-5 w-5 text-indigo-500" />
        </div>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {STRUCTURAL_STUDY_TOPICS.map((item) => {
            const status = progress[item.id] ?? 'pending';
            return (
              <button key={item.id} type="button" onClick={() => { setSelectedTopicId(item.id); setShowSolution(false); }} className={`text-left rounded-2xl border p-4 transition hover:-translate-y-0.5 ${selectedTopic?.id === item.id ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-800'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</div>
                    <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{item.area} · {item.estimatedMinutes} min</div>
                  </div>
                  {status === 'completed' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : status === 'review' ? <RotateCcw className="h-4 w-4 text-amber-500" /> : <CircleDashed className="h-4 w-4 text-slate-400" />}
                </div>
                <div className="mt-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{statusLabel[status]}</div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

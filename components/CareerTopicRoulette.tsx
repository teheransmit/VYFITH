'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Compass, Lightbulb, RotateCw, Sparkles, Wifi, WifiOff } from 'lucide-react';
import { CAREER_DAILY_TOPICS, CareerDailyTopic, CareerTopicQuiz } from '@/lib/careerDailyTopics';

const STORAGE_KEY = 'vyfith-career-topic-of-the-day-v1';

function dateKey() {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

function readDailyTopic() {
  if (typeof window === 'undefined') return { date: '', topic: null as CareerDailyTopic | null };
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return { date: '', topic: null };
    const parsed = JSON.parse(saved) as { date: string; topicId: string };
    if (parsed.date !== dateKey()) return { date: '', topic: null };
    return { date: parsed.date, topic: CAREER_DAILY_TOPICS.find((item) => item.id === parsed.topicId) ?? null };
  } catch {
    return { date: '', topic: null };
  }
}

export default function CareerTopicRoulette() {
  const [stored] = useState(readDailyTopic);
  const [topic, setTopic] = useState<CareerDailyTopic | null>(stored.topic);
  const [rollingTopic, setRollingTopic] = useState<CareerDailyTopic>(CAREER_DAILY_TOPICS[0]);
  const [isRolling, setIsRolling] = useState(false);
  const [quiz, setQuiz] = useState<CareerTopicQuiz[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  const [aiStatus, setAiStatus] = useState<'checking' | 'configured' | 'connected' | 'fallback'>('checking');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    fetch('/api/career-topics', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data: { aiConfigured?: boolean }) => setAiStatus(data.aiConfigured ? 'configured' : 'fallback'))
      .catch(() => setAiStatus('fallback'));
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadQuiz = async (selected: CareerDailyTopic) => {
    setQuiz([]);
    setAnswers({});
    setQuizResult(null);
    try {
      const response = await fetch('/api/career-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: selected.id }),
      });
      const data = await response.json() as { quiz?: CareerTopicQuiz[]; source?: string };
      setQuiz(data.quiz ?? []);
      setAiStatus(data.source === 'gemini' ? 'connected' : 'fallback');
    } catch {
      setAiStatus('fallback');
    }
  };

  const spin = () => {
    if (isRolling) return;
    setIsRolling(true);
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      setRollingTopic(CAREER_DAILY_TOPICS[Math.floor(Math.random() * CAREER_DAILY_TOPICS.length)]);
      if (Date.now() - startedAt >= 1150) {
        window.clearInterval(interval);
        const selected = CAREER_DAILY_TOPICS[Math.floor(Math.random() * CAREER_DAILY_TOPICS.length)];
        setRollingTopic(selected);
        setTopic(selected);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: dateKey(), topicId: selected.id }));
        void loadQuiz(selected);
        setIsRolling(false);
      }
    }, 75);
  };

  const finishQuiz = () => {
    const score = quiz.reduce((total, item, index) => total + (answers[index] === item.answer ? 1 : 0), 0);
    setQuizResult(score);
  };

  const displayedTopic = isRolling ? rollingTopic : topic;

  return (
    <section className="overflow-hidden rounded-3xl border border-cyan-200/80 dark:border-cyan-900/70 bg-white dark:bg-slate-900 shadow-xs">
      <div className="relative bg-linear-to-r from-cyan-950 via-indigo-950 to-slate-950 p-6 sm:p-8 text-white">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200">
              <Compass className="h-3.5 w-3.5" /> Curiosidad de Ingeniería
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight">La pregunta del día</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Un tema al azar relacionado con tu carrera para abrir la mente más allá del examen.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs text-slate-300">
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>Una curiosidad nueva cada día</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 p-5 sm:p-7">
        <div className={`relative min-h-64 sm:min-h-72 overflow-hidden rounded-2xl border border-cyan-200 dark:border-cyan-900/60 bg-cyan-50/70 dark:bg-slate-950/70 p-8 sm:p-10 flex items-center ${isRolling ? 'roulette-rolling' : ''}`}>
          <div className="absolute inset-x-0 top-0 h-8 bg-linear-to-b from-cyan-50 dark:from-slate-950 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-cyan-50 dark:from-slate-950 to-transparent pointer-events-none" />
          {displayedTopic ? (
            <div className="w-full text-center">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">{displayedTopic.discipline}</div>
              <div className="mt-3 text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">{displayedTopic.title}</div>
              <div className="mt-3 text-base text-slate-500 dark:text-slate-400">{displayedTopic.hook}</div>
            </div>
          ) : (
            <div className="w-full text-center text-sm text-slate-500">Presiona el botón para descubrir un tema.</div>
          )}
        </div>

        <div className="flex lg:w-52 flex-col justify-center gap-3">
          <button type="button" onClick={spin} disabled={isRolling} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-cyan-600/20 transition hover:bg-cyan-500 disabled:cursor-wait disabled:opacity-60">
            <RotateCw className={`h-4 w-4 ${isRolling ? 'animate-spin' : ''}`} />
            {isRolling ? 'Girando...' : topic ? 'Cambiar tema' : 'Girar la rueda'}
          </button>
          {topic && <p className="text-center text-[11px] text-slate-500 dark:text-slate-400">Guardado para hoy. Puedes cambiarlo si quieres explorar otra idea.</p>}
        </div>
      </div>

      {topic && !isRolling && (
        <div className="border-t border-slate-200 dark:border-slate-800 p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-100 dark:bg-amber-950/50 p-2 text-amber-600 dark:text-amber-300"><Lightbulb className="h-5 w-5" /></div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Mini misión de hoy</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{topic.prompt}</p>
            </div>
          </div>
        </div>
      )}
      <div className="border-t border-slate-200 dark:border-slate-800 p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Conexión y quiz</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Comprueba si la idea se quedó contigo.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-bold">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${isOnline ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'}`}>
              {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {isOnline ? 'Internet disponible' : 'Sin internet'}
            </span>
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-slate-600 dark:text-slate-300">
              IA: {aiStatus === 'connected' ? 'generando' : aiStatus === 'configured' ? 'configurada' : aiStatus === 'checking' ? 'verificando' : 'modo local'}
            </span>
          </div>
        </div>
        {!topic ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Gira la rueda para desbloquear el quiz.</p>
        ) : quiz.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Preparando preguntas...</p>
        ) : quizResult === null ? (
          <div className="mt-5 space-y-5">
            {quiz.map((item, index) => (
              <fieldset key={`${item.question}-${index}`} className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 p-4">
                <legend className="mb-3 text-sm font-bold text-slate-900 dark:text-white">{index + 1}. {item.question}</legend>
                <div className="grid gap-2">
                  {item.options.map((option, optionIndex) => (
                    <label key={option} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-xs text-slate-700 dark:text-slate-200 hover:border-cyan-400">
                      <input type="radio" name={`quiz-${index}`} checked={answers[index] === optionIndex} onChange={() => setAnswers((current) => ({ ...current, [index]: optionIndex }))} />
                      {option}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <button type="button" disabled={Object.keys(answers).length < quiz.length} onClick={finishQuiz} className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
              Evaluar respuestas
            </button>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 p-5">
            <div className="flex items-center gap-2 text-lg font-black text-emerald-800 dark:text-emerald-300"><CheckCircle2 className="h-5 w-5" /> Resultado: {quizResult}/{quiz.length}</div>
            <div className="mt-4 space-y-2 text-xs text-emerald-900 dark:text-emerald-200">
              {quiz.map((item, index) => <p key={`result-${index}`}><strong>{index + 1}.</strong> {item.explanation}</p>)}
            </div>
            <button type="button" onClick={() => { setQuizResult(null); setAnswers({}); }} className="mt-4 text-xs font-bold text-emerald-700 underline dark:text-emerald-300">Intentar de nuevo</button>
          </div>
        )}
      </div>
    </section>
  );
}

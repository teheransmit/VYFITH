'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RouteStep, RouteSettings } from '@/lib/unipaseoTypes';
import { 
  Home, 
  MapPin, 
  UserPlus, 
  UserMinus, 
  Bus, 
  GraduationCap, 
  Clock, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';

interface TimelineProps {
  steps: RouteStep[];
  finalArrival: string;
  targetClassTime: string;
  targetClassName: string;
  activeDogs: ('S' | 'F' | 'M')[];
  settings: RouteSettings;
  metas: { S: number; F: number; M: number };
  dogWalkDurations: { S: number; F: number; M: number };
}

export default function Timeline({
  steps,
  finalArrival,
  targetClassTime,
  targetClassName,
  settings,
  metas,
  dogWalkDurations,
}: TimelineProps) {
  const getMinutes = (tStr: string) => {
    const [h, m] = tStr.split(':').map(Number);
    return h * 60 + m;
  };

  const arrivalMin = getMinutes(finalArrival);
  const classMin = getMinutes(targetClassTime);
  const diffMin = classMin - arrivalMin;

  const getStatusCard = () => {
    if (diffMin >= 15) {
      return {
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
        icon: <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        text: `¡Excelente! Llegas a la universidad con ${diffMin} minutos de sobra para entrar a la clase de "${targetClassName}".`,
        label: 'A TIEMPO CON HOLGURA',
        badgeColor: 'bg-emerald-500',
      };
    } else if (diffMin >= 0) {
      return {
        bgColor: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
        icon: <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
        text: `Llegas justo a tiempo para la clase de "${targetClassName}" (te sobran solo ${diffMin} min). Ajusta el paso o sal antes.`,
        label: 'JUSTO A TIEMPO',
        badgeColor: 'bg-amber-500',
      };
    } else {
      return {
        bgColor: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 animate-pulse',
        icon: <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
        text: `¡ALERTA! Llegarías ${Math.abs(diffMin)} minutos tarde a la clase de "${targetClassName}". Intenta salir más temprano o acortar los paseos.`,
        label: 'LLEGADA TARDE ⚠️',
        badgeColor: 'bg-rose-500',
      };
    }
  };

  const status = getStatusCard();

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'casa':
        return <Home className="w-4 h-4 text-emerald-600" />;
      case 'pick':
        return <UserPlus className="w-4 h-4 text-violet-600" />;
      case 'drop':
        return <UserMinus className="w-4 h-4 text-rose-600" />;
      case 'bus_wait':
      case 'bus_ride':
        return <Bus className="w-4 h-4 text-cyan-500" />;
      case 'upb':
        return <GraduationCap className="w-5 h-5 text-red-600" />;
      default:
        return <MapPin className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Dynamic Status / Arriving Meter */}
      <div className={`p-4 border rounded-2xl shadow-sm ${status.bgColor} transition-colors duration-300`}>
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] uppercase tracking-wider font-extrabold text-white px-2 py-0.5 rounded-full ${status.badgeColor}`}>
            {status.label}
          </span>
          {status.icon}
        </div>
        <p className="text-xs font-semibold leading-relaxed">{status.text}</p>
        <div className="mt-3 flex justify-between items-end border-t border-current/10 pt-2.5">
          <div>
            <span className="text-[10px] uppercase font-bold opacity-75 block">Tu Hora de Llegada UPB</span>
            <span className="text-2xl font-black tracking-tight">{finalArrival}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold opacity-75 block">Hora de Entrada Clase</span>
            <span className="text-lg font-bold">{targetClassTime}</span>
          </div>
        </div>
      </div>

      {/* Routine Detail List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-500" /> Detalle de la Ruta Estimada
          </span>
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
            {settings.scenario === 'lluvia' ? '⚡ Escenario Lluvia' : settings.scenario === 'trafico' ? '🚗 Escenario Tráfico' : '☀️ Escenario Despejado'}
          </span>
        </div>

        <div className="p-4 space-y-4 max-h-[380px] overflow-y-auto relative">
          {/* Timeline Connector Line */}
          <div className="absolute left-[31px] top-6 bottom-6 w-[2px] bg-slate-100 dark:bg-slate-800" />

          {steps.map((step) => {
            const isDogRelated = step.dogId;
            const dogMeta = isDogRelated ? metas[step.dogId!] : 0;
            const dogWalked = isDogRelated ? dogWalkDurations[step.dogId!] : 0;
            const isDrop = step.type === 'drop';

            return (
              <div key={step.id} className="relative flex items-start gap-4" id={`step-${step.id}`}>
                <div className="relative z-10 w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs">
                  {getStepIcon(step.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {step.title}
                    </h4>
                    <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 shrink-0 select-none">
                      {step.startTime}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5 whitespace-pre-line">
                    {step.description}
                  </p>

                  {isDrop && (
                    <div className="mt-1.5 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        ⏱️ Paseas: <b className="text-slate-800 dark:text-white">{dogWalked}m</b> <span className="text-slate-400">/ Meta {dogMeta}m</span>
                      </span>
                      {(() => {
                        const delta = dogWalked - dogMeta;
                        if (Math.abs(delta) <= 3) {
                          return <span className="text-emerald-600 font-extrabold text-[10px] bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.2 rounded-full border border-emerald-200">✅ Cumple</span>;
                        } else if (delta > 3) {
                          return <span className="text-rose-600 font-extrabold text-[10px] bg-rose-50 dark:bg-rose-950/80 px-1.5 py-0.2 rounded-full border border-rose-200">⚠️ Te pasaste +{delta}m</span>;
                        } else {
                          return <span className="text-amber-600 font-extrabold text-[10px] bg-amber-50 dark:bg-amber-950/80 px-1.5 py-0.2 rounded-full border border-amber-200">⚠️ Faltaron {Math.abs(delta)}m</span>;
                        }
                      })()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

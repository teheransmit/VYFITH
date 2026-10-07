'use client';

import React, { useState } from 'react';
import {
  Wallet,
  PiggyBank,
  Plane,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Clock,
  PlusCircle,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Luggage,
  AlertCircle,
  Bus,
  MapPin,
  QrCode,
  CheckSquare,
  Square,
  Calendar,
  Navigation,
  Car,
  Train,
  ArrowRight,
  Footprints,
  Scissors,
  Banknote,
  Home,
  Utensils,
  Music,
  Droplets,
  Compass,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Zap,
  CloudRain,
  Smartphone,
  ShieldAlert,
} from 'lucide-react';
import { initialFinanceData, FinanceSummary, ExpenseItem, ReceivableItem } from '@/lib/financeStore';
import Rome2RioRouteMap from '@/components/Rome2RioRouteMap';

export default function FinanceSection() {
  const [finance, setFinance] = useState<FinanceSummary>(initialFinanceData);
  const [activeTab, setActiveTab] = useState<'general' | 'medellin' | 'cobros'>('medellin');
  const [quickNotice, setQuickNotice] = useState<string | null>(null);
  const [contingencyFilter, setContingencyFilter] = useState<'all' | 'flight' | 'luggage' | 'arrival' | 'finance'>('all');
  const [expandedContingency, setExpandedContingency] = useState<string | null>(null);

  // Checklist interactivo pre-vuelo para no tener ningún imprevisto
  const [checklist, setChecklist] = useState([
    { id: 'c1', label: 'Cédula de ciudadanía física original (indispensable para abordar y sacar la Cívica)', done: true },
    { id: 'c2', label: 'Pasabordo JetSMART con código QR guardado en fotos del celular (JA5483)', done: true },
    { id: 'c3', label: 'Mochila Temu con correas de compresión tensadas (dimensiones ≤ 45x35x25 cm, peso ≤ 10 kg)', done: true },
    { id: 'c4', label: 'Compras D1/Ara listas: Desodorante Roll-on XEN (75 ml), talco para pies pequeño y chicles para oídos', done: false },
    { id: 'c5', label: 'Líquidos ≤100 ml en Ziploc: Champú Medicasp (100 ml), Perfume Eros (30-50 ml), crema capilar reenvasada en frasco pequeño', done: false },
    { id: 'c6', label: 'Afeitadora Prestobarba desechable y pastillas en su blíster empacadas en cabina (ambos permitidos)', done: false },
    { id: 'c7', label: 'Power Bank LinkOn 20.000 mAh (74 Wh ≤ 100 Wh ✅) y portátil en la mochila de mano (prohibido en bodega; no usar durante el vuelo)', done: false },
    { id: 'c8', label: 'Llegada a Los Garzones a las 10:48 AM (subir directo al 2.° piso a control de seguridad)', done: false },
    { id: 'c9', label: 'Tomar bus blanco en Rionegro hacia San Diego ($15.000 COP) y taxi por Calle 33 a La Castellana', done: false },
    { id: 'c10', label: 'Efectivo fraccionado a mano: $50.000 COP en billetes de $10k/$20k para bus y taxi', done: false },
    { id: 'c11', label: 'Chaqueta / buzo ligero a mano para el frío de Rionegro (16°C) al descender del avión', done: false },
    { id: 'c12', label: 'Captura offline guardada: Código de acceso y WhatsApp del anfitrión en La Castellana', done: true },
  ]);

  const toggleChecklist = (id: string) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const remainingBudget = finance.monthlyBudget - finance.totalExpenses;
  const budgetPercentUsed = Math.min(100, Math.round((finance.totalExpenses / finance.monthlyBudget) * 100));

  // Cálculo del Viaje Medellín en tiempo real (Miércoles 7 de Octubre de 2026)
  const med = finance.medellinTrip;
  const totalLiquidAvailable = med.cashInHand + med.nuBoxSavings + med.nequiSavings; // $350.579 COP
  const realFreeSurplus = totalLiquidAvailable + med.receivablesTotal - med.pendingFixedExpenses; // $338.579 COP
  const totalTripSecuredCapital = realFreeSurplus + med.pendingFamilyContributions; // $488.579 COP
  const netTripSurplus = totalTripSecuredCapital - med.targetBudget; // +$113.579 COP de excedente
  const tripCoveragePercent = Math.min(100, Math.round((totalTripSecuredCapital / med.targetBudget) * 100)); // 100% Cobertura asegurada

  // Registrar un cobro, gasto o ingreso rápido
  const handleQuickAdd = (type: 'barber' | 'familySync' | 'frida' | 'molly' | 'sienna' | 'papa') => {
    if (type === 'barber') {
      const cost = 12000;
      setFinance((prev) => ({
        ...prev,
        medellinTrip: {
          ...prev.medellinTrip,
          cashInHand: Math.max(0, prev.medellinTrip.cashInHand - cost),
          pendingFixedExpenses: 0,
        },
      }));
      showNotice(`💈 -$12.000 COP descontados en efectivo para la motilada de hoy. Gastos fijos liquidados.`);
    } else if (type === 'familySync') {
      const added = 150000;
      setFinance((prev) => ({
        ...prev,
        medellinTrip: {
          ...prev.medellinTrip,
          nuBoxSavings: prev.medellinTrip.nuBoxSavings + added,
          pendingFamilyContributions: 0,
        },
      }));
      showNotice(`👨‍👩‍👦 +$150.000 COP recibidos de padres e ingresados a Cajita Medayork de Nu (9.35% E.A.).`);
    } else if (type === 'frida') {
      showNotice(`✅ Cartera de Frida ya liquidada ($0.00 COP pendientes).`);
    } else if (type === 'molly') {
      showNotice(`✅ Cartera de Molly ya liquidada ($0.00 COP pendientes).`);
    } else if (type === 'sienna') {
      showNotice(`✅ Cartera de Sienna ya liquidada ($0.00 COP pendientes).`);
    } else if (type === 'papa') {
      showNotice(`✅ Pasajes ya liquidados en el modelo general.`);
    }
  };

  const showNotice = (msg: string) => {
    setQuickNotice(msg);
    setTimeout(() => setQuickNotice(null), 4000);
  };

  const contingencyScenarios = [
    {
      id: 'cont-1',
      category: 'flight',
      categoryLabel: '✈️ Vuelo & Aeropuerto',
      title: 'Retraso o Reprogramación del Vuelo JA5483',
      risk: 'Media (Clima Rionegro)',
      impact: 'Bajo (Check-in flexible)',
      protocol: 'El check-in en el Airbnb es flexible después de las 3:00 PM. Si JetSMART anuncia demora, escribe al anfitrión por WhatsApp. La expedición de la Tarjeta Cívica en PAC San Antonio atiende hasta 6:45 PM; si llegas más tarde, compras pasajes univiaje en taquilla ($3.600 COP) y sacas la Cívica el viernes por la mañana.',
      prevention: 'Revisa el estado del vuelo en Google Vuelos o FlightAware buscando "JA5483" desde las 10:00 AM.',
    },
    {
      id: 'cont-2',
      category: 'luggage',
      categoryLabel: '🎒 Equipaje & Filtros',
      title: 'Revisión Estricta del Medidor de Maletas (Sizer JetSMART)',
      risk: 'Media (Si va inflada)',
      impact: 'Alto ($140.000 COP cobro en puerta)',
      protocol: 'Tensa al máximo las correas de compresión de la mochila Temu antes de hacer la fila de la Zona 3. Ponte la chaqueta o buzo encima (la ropa puesta no cuenta como bulto). No lleves ninguna riñonera, gorra o bolsa plástica por fuera: absolutamente todo debe caber dentro de la mochila.',
      prevention: 'Dimensiones garantizadas: 45×35×25 cm y peso ≤ 10 kg. Cabe perfectamente debajo del asiento 20B.',
    },
    {
      id: 'cont-3',
      category: 'luggage',
      categoryLabel: '🎒 Equipaje & Filtros',
      title: 'Filtro de Seguridad Decomisando Aerosoles o Líquidos',
      risk: 'Alta si se llevan tarros >100 ml',
      impact: 'Pérdida de productos',
      protocol: 'Axe (150 ml), Yoxen (260 ml) y Old Spice (150 ml) están 100% prohibidos en cabina y la policía los desecha. Solo recipientes ≤100 ml en la bolsa Ziploc (Medicasp 100 ml ✅, Perfume 30-50 ml ✅, crema reenvasada en tarro pequeño ✅). Saca la bolsa Ziploc y la Power Bank de la mochila y colócalas en la bandeja antes de pasar el escáner.',
      prevention: 'Comprar hoy en el D1/Ara el roll-on XEN y el talco pequeño. Al llegar a Medellín puedes comprar un aerosol grande de $14.000 COP en droguería o Éxito.',
    },
    {
      id: 'cont-4',
      category: 'flight',
      categoryLabel: '✈️ Vuelo & Aeropuerto',
      title: 'Dolor Agudo u Oídos Tapados en el Descenso a Rionegro',
      risk: 'Alta (Presión de descenso a 2.140 msnm)',
      impact: 'Molestia física temporal',
      protocol: 'Empieza a masticar chicle de menta desde las 1:25 PM cuando comience el descenso. Si sientes presión, realiza la maniobra de Valsalva suave: tapa la nariz con dos dedos, cierra la boca y sopla aire suavemente como si inflaras un globo hasta escuchar un clic en el oído.',
      prevention: 'Lleva el paquete de chicles en el bolsillo del pantalón o bolsillo exterior del morral, no en el fondo.',
    },
    {
      id: 'cont-5',
      category: 'arrival',
      categoryLabel: '🚖 Movilidad & Llegada',
      title: 'Falta de Señal Móvil / Batería al Llegar a San Diego',
      risk: 'Baja',
      impact: 'Desorientación urbana',
      protocol: 'Ten guardada en fotos una captura con: (1) Dirección exacta: Calle 35, La Castellana, (2) Celular del anfitrión, (3) Código de acceso. Enciende tu Power Bank LinkOn apenas salgas del avión para llegar a San Diego con 100% de batería. Si no hay señal, tómate el taxi directo diciendo "Calle 35 con la 80, La Castellana".',
      prevention: 'Descarga hoy el mapa offline de Medellín en Google Maps (ocupa 40 MB) para navegar sin datos.',
    },
    {
      id: 'cont-6',
      category: 'arrival',
      categoryLabel: '🚖 Movilidad & Llegada',
      title: 'Taxista en San Diego sin Cambio o Cobrando Tarifa Excesiva',
      risk: 'Media',
      impact: 'Sobrecosto de $10.000 COP',
      protocol: 'Paga el bus Combuses con un billete de $20.000 para que te devuelvan $5.000 y así tengas cambio. Al subirte al taxi exige amablemente: "Por favor active el taxímetro hacia Calle 35 en La Castellana". La carrera diurna marca ~$12.000 - $14.000 COP. Si no tiene taxímetro o te pide más de $20k, toma otro taxi de la fila.',
      prevention: 'Lleva billetes de $10.000 y $20.000 en la billetera a mano.',
    },
    {
      id: 'cont-7',
      category: 'arrival',
      categoryLabel: '🚖 Movilidad & Llegada',
      title: 'Cierre Temporal del Túnel de Oriente o Taco en la Vía',
      risk: 'Baja',
      impact: '+25 min de viaje',
      protocol: 'Los buses Combuses tienen desvío regulado por la Variante Palmas o Vía Santa Elena. No tienes que bajarte ni pagar más; el pasaje sigue siendo $15.000 COP y te dejará en San Diego exactamente igual.',
      prevention: 'Tu tarde del jueves está 100% libre sin compromisos de horario estricto.',
    },
    {
      id: 'cont-8',
      category: 'finance',
      categoryLabel: '💵 Finanzas & Clima',
      title: 'Bloqueo Preventivo de Tarjeta Bancaria o Falla de Red',
      risk: 'Baja',
      impact: 'Medio',
      protocol: 'Tienes $202.000 COP en efectivo físico en mano (menos $12k de motilada = $190.000 COP). Con ese efectivo cubres transporte, alimentación y 2 días enteros de gastos sin tocar ninguna tarjeta bancaria ni app.',
      prevention: 'Mantén el efectivo dividido: $50.000 COP en la billetera para gastos del día, y el resto guardado en un compartimento interno con cremallera de la mochila.',
    },
    {
      id: 'cont-9',
      category: 'finance',
      categoryLabel: '💵 Finanzas & Clima',
      title: 'Lluvia Torrencial en Medellín durante Actividades de Tarde',
      risk: 'Alta (Temporada de Octubre)',
      impact: 'Leve (Cambio de plan)',
      protocol: 'Medellín tiene chubascos típicos entre 3:00 PM y 5:30 PM. Si llueve, pásate a planes bajo techo: Museo Casa de la Memoria (entrada libre techada), centros comerciales (Unicentro Laureles / San Diego), o cafés de la Transversal 39.',
      prevention: 'Lleva sombrilla compacta de bolsillo o impermeable en la mochila todos los días.',
    },
  ];

  return (
    <section id="finance-section" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs mb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              Finanzas Personales & Ecosistema de Ahorro
            </span>
            <span className="text-xs font-mono text-slate-400">Pilar 4: Economía & Metas</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Control Financiero & Plan Medellín 2026
          </h2>
          <p className="text-sm text-slate-500 max-w-2xl mt-1">
            Supervisa tus presupuestos mensuales, rentabilidad en Cajita Nu (9.30% E.A.), cobros por paseos caninos y el colchón financiero proyectado para tu viaje.
          </p>
        </div>

        {/* Pestañas de Navegación Interna */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('medellin')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'medellin'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plane className="w-3.5 h-3.5 text-emerald-600" />
            Viaje Medellín 2026
          </button>
          <button
            onClick={() => setActiveTab('cobros')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'cobros'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-600" />
            Cuentas por Cobrar
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-slate-600" />
            Presupuesto Mensual
          </button>
        </div>
      </div>

      {quickNotice && (
        <div className="my-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between animate-fade-in">
          <span>{quickNotice}</span>
          <button onClick={() => setQuickNotice(null)} className="text-emerald-700 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 1: VIAJE MEDELLÍN 2026 */}
      {/* ======================================================== */}
      {activeTab === 'medellin' && (
        <div className="mt-6 space-y-6">
          {/* Banner de Estado del Viaje */}
          <div className="p-6 rounded-3xl bg-linear-to-br from-emerald-900 via-teal-900 to-slate-900 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 mb-2">
                  <Plane className="w-3.5 h-3.5" />
                  <span>Fechas: {med.tripDates} (5 Días)</span>
                </div>
                <h3 className="text-2xl font-extrabold tracking-tight">Presupuesto del Viaje a Medellín</h3>
                <p className="text-xs text-emerald-100/80 mt-1 max-w-xl">
                  Alojamiento 100% cubierto. Fondos proyectados con ahorro de pasajes semanales ($35k con tarjeta hermano), cobros pendientes de paseos y Cajita Nu.
                </p>
              </div>

              <div className="text-right self-start md:self-center bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
                <span className="text-[11px] text-emerald-200 uppercase tracking-wider block font-semibold">
                  Meta del Viaje
                </span>
                <span className="text-2xl font-black text-white">{formatCurrency(med.targetBudget)}</span>
                <span className="text-[11px] text-emerald-300 block font-medium">Costo total proyectado</span>
              </div>
            </div>

            {/* Barra de Cobertura */}
            <div className="mt-6 pt-5 border-t border-white/10">
              <div className="flex justify-between items-center text-xs font-bold mb-2">
                <span className="text-emerald-200">Capital Asegurado Proyectado: {formatCurrency(totalTripSecuredCapital)}</span>
                <span className="text-emerald-300">Cobertura: {tripCoveragePercent}%</span>
              </div>
              <div className="w-full h-3.5 bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full bg-linear-to-r from-emerald-400 to-teal-300 rounded-full transition-all"
                  style={{ width: `${tripCoveragePercent}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-emerald-100/70 mt-2">
                <span>Saldo a favor asegurado: <strong>+{formatCurrency(netTripSurplus)} COP</strong> de colchón</span>
                <span className="text-emerald-300 font-bold">Estado: {med.statusDiagnostic}</span>
              </div>
            </div>
          </div>

          {/* BALANCE EN TABLA (ESTADO DE CUENTAS) & RECOMENDACIONES TÁCTICAS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Tabla de Balance Real */}
            <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    Balance en Tiempo Real (Estado de Cuentas)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Miércoles 7 de Octubre de 2026 • Menos de 24h pre-vuelo. Vuelos y Airbnb 100% liquidados en $0.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {med.statusDiagnostic}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="pb-2 font-bold">Concepto (Variable de Estado)</th>
                      <th className="pb-2 font-bold text-right">Saldo Actual (COP)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-100/50">
                      <td className="py-2 font-medium text-slate-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        Efectivo en mano (Físico para aterrizar)
                      </td>
                      <td className="py-2 text-right font-bold text-slate-900 font-mono">
                        {formatCurrency(med.cashInHand)}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-100/50">
                      <td className="py-2 font-medium text-slate-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                        Cuenta Nu (Cajita Medayork al 9.35% E.A.)
                      </td>
                      <td className="py-2 text-right font-bold text-purple-900 font-mono">
                        {formatCurrency(med.nuBoxSavings)}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-100/50">
                      <td className="py-2 font-medium text-slate-500 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
                        Cuenta Nequi
                      </td>
                      <td className="py-2 text-right font-medium text-slate-400 font-mono">
                        {formatCurrency(med.nequiSavings)}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/50 font-semibold">
                      <td className="py-2 text-emerald-950">Total Líquido Disponible</td>
                      <td className="py-2 text-right font-black text-emerald-800 font-mono">
                        {formatCurrency(totalLiquidAvailable)}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-100/50">
                      <td className="py-2 text-slate-600">
                        Cuentas por cobrar en calle (Rappi, Frida, Sienna, Andrés)
                      </td>
                      <td className="py-2 text-right font-bold text-emerald-600 font-mono">
                        $0.00 COP ✅
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-100/50">
                      <td className="py-2 text-rose-700 font-medium">
                        Deuda de vuelos y Gastos fijos próximos (Motilada pendiente)
                      </td>
                      <td className="py-2 text-right font-bold text-rose-600 font-mono">
                        -{formatCurrency(med.pendingFixedExpenses)}
                      </td>
                    </tr>
                    <tr className="bg-teal-50/60 font-semibold">
                      <td className="py-2 text-teal-950">Excedente Líquido Libre real</td>
                      <td className="py-2 text-right font-black text-teal-800 font-mono">
                        {formatCurrency(realFreeSurplus)}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-100/50">
                      <td className="py-2 text-blue-700">
                        Fondo para Medellín (Papá $100k + Mamá $50k)
                      </td>
                      <td className="py-2 text-right font-bold text-blue-700 font-mono">
                        {formatCurrency(med.pendingFamilyContributions)}
                      </td>
                    </tr>
                    <tr className="bg-slate-900 text-white font-bold rounded-xl">
                      <td className="py-2.5 px-2 rounded-l-xl">Capital Total Asegurado</td>
                      <td className="py-2.5 px-2 rounded-r-xl text-right font-black text-emerald-300 font-mono">
                        {formatCurrency(totalTripSecuredCapital)}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-100/50 text-slate-500">
                      <td className="py-2">Costo Total Estimado RESTANTE</td>
                      <td className="py-2 text-right font-bold text-slate-700 font-mono">
                        -{formatCurrency(med.targetBudget)}
                      </td>
                    </tr>
                    <tr className="bg-emerald-100/70 text-emerald-950 font-bold">
                      <td className="py-2 px-2 rounded-l-xl">Excedente Neto Asegurado (Colchón Libre)</td>
                      <td className="py-2 px-2 rounded-r-xl text-right font-black text-emerald-700 font-mono">
                        +{formatCurrency(netTripSurplus)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recomendaciones Tácticas */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-3.5">
              <div className="p-5 rounded-3xl bg-linear-to-br from-amber-500/10 via-amber-50 to-orange-50 border border-amber-200/90 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
                    Prioridad Alta
                  </span>
                  <Scissors className="w-4 h-4 text-amber-700" />
                </div>
                <h5 className="text-sm font-bold text-slate-900">1. Ejecutar gasto de motilada</h5>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  El embarque cierra mañana a las 11:58 a.m. Se debe descontar hoy mismo el bloque de <strong>-$12.000 COP</strong> del efectivo disponible para ir a la barbería y no generar cuellos de botella operativos en la mañana del viaje.
                </p>
                <button
                  onClick={() => handleQuickAdd('barber')}
                  className="mt-3 w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  Ejecutar Gasto de Motilada (-$12.000 COP)
                </button>
              </div>

              <div className="p-5 rounded-3xl bg-linear-to-br from-blue-500/10 via-blue-50 to-indigo-50 border border-blue-200/90 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300">
                    Prioridad Media
                  </span>
                  <PiggyBank className="w-4 h-4 text-blue-700" />
                </div>
                <h5 className="text-sm font-bold text-slate-900">2. Sincronización familiar</h5>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Solicitar esta misma noche el bloque de <strong>$150.000 COP</strong> restante a los padres (Papá $100k + Mamá $50k) para unificar el 100% del capital en la base de datos de Nu al 9.35% E.A. antes del despliegue al aeropuerto.
                </p>
                <button
                  onClick={() => handleQuickAdd('familySync')}
                  className="mt-3 w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Sincronizar Aporte Familiar (+$150.000 COP)
                </button>
              </div>
            </div>
          </div>

          {/* VUELOS OFICIALES & TARJETA DE EMBARQUE JETSMART */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Vuelo de Ida */}
            <div className="p-5 rounded-3xl bg-linear-to-br from-slate-900 to-indigo-950 text-white border border-indigo-800/40 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-emerald-400 rotate-45" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Vuelo de Ida (Mañana)</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Check-in Confirmado ✅
                </span>
              </div>

              <div className="flex items-center justify-between my-2">
                <div>
                  <span className="text-2xl font-black tracking-tight text-white">MTR</span>
                  <span className="text-xs text-slate-300 block">Montería (Los Garzones)</span>
                  <span className="text-sm font-bold text-emerald-300">12:48 PM</span>
                </div>
                <div className="flex flex-col items-center px-4">
                  <span className="text-[10px] text-slate-400 font-mono">Vuelo JA 5483</span>
                  <div className="w-20 h-0.5 bg-linear-to-r from-emerald-400 to-indigo-400 my-1 relative">
                    <Plane className="w-3 h-3 text-white absolute -top-1.5 left-1/2 -translate-x-1/2" />
                  </div>
                  <span className="text-[10px] text-slate-400">1 hora de trayecto</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black tracking-tight text-white">MDE</span>
                  <span className="text-xs text-slate-300 block">Medellín (Rionegro)</span>
                  <span className="text-sm font-bold text-emerald-300">01:49 PM</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/10 text-center">
                <div className="bg-white/5 rounded-xl p-2">
                  <span className="text-[10px] text-slate-400 block">PNR Reserva</span>
                  <span className="text-xs font-mono font-bold text-white">WCZUYT</span>
                </div>
                <div className="bg-white/5 rounded-xl p-2">
                  <span className="text-[10px] text-slate-400 block">Asiento</span>
                  <span className="text-xs font-mono font-black text-emerald-300">20 B</span>
                </div>
                <div className="bg-white/5 rounded-xl p-2">
                  <span className="text-[10px] text-slate-400 block">Zona Embarque</span>
                  <span className="text-xs font-mono font-bold text-white">Zona 3</span>
                </div>
                <div className="bg-white/5 rounded-xl p-2">
                  <span className="text-[10px] text-slate-400 block">Llegada Aerop.</span>
                  <span className="text-xs font-mono font-bold text-amber-300">10:48 AM</span>
                </div>
              </div>

              <div className="mt-3 p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-[11px]">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Luggage className="w-3.5 h-3.5 text-emerald-400" />
                  Equipaje: 1 Mochila Temu (35x25x45 cm, máx 10 kg)
                </span>
                <span className="text-emerald-300 font-bold">Bajo asiento</span>
              </div>
            </div>

            {/* Vuelo de Regreso & Traslado */}
            <div className="p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-blue-400 -rotate-45" />
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Vuelo de Regreso</span>
                  </div>
                  <span className="text-xs text-slate-400">Lunes 12 OCT 2026</span>
                </div>

                <div className="flex items-center justify-between my-2">
                  <div>
                    <span className="text-2xl font-black text-white">MDE</span>
                    <span className="text-xs text-slate-400 block">Medellín (JMC)</span>
                    <span className="text-sm font-bold text-blue-300">07:17 AM</span>
                  </div>
                  <div className="flex flex-col items-center px-4">
                    <span className="text-[10px] text-slate-400 font-mono">Vuelo JA 5480</span>
                    <div className="w-16 h-0.5 bg-slate-700 my-1" />
                    <span className="text-[10px] text-slate-400">1h 01m</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-white">MTR</span>
                    <span className="text-xs text-slate-400 block">Montería</span>
                    <span className="text-sm font-bold text-blue-300">08:18 AM</span>
                  </div>
                </div>
              </div>

              {/* Conexión Aeropuerto a Medellín */}
              <div className="mt-4 p-3 rounded-2xl bg-indigo-950/60 border border-indigo-800/40">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 mb-1">
                  <Bus className="w-3.5 h-3.5" />
                  Traslado Rionegro ➡️ Medellín Centro ($15.000 COP)
                </span>
                <p className="text-[11px] text-indigo-100/80 leading-relaxed">
                  Al salir de llegadas en MDE, toma el bus blanco directo a San Diego / Centro (45 min por el Túnel de Oriente). Desde allí camina o toma Metro hasta el PAC de <strong>Estación San Antonio</strong> para expedir tu tarjeta Cívica personalizada antes de las 6:45 PM.
                </p>
              </div>
            </div>
          </div>

          {/* CHECKLIST INTERACTIVO ANTI-IMPREVISTOS */}
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Checklist Digital Pre-Vuelo (Cero Imprevistos)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Marca cada elemento conforme lo tengas listo en tu mochila para viajar con total tranquilidad.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                {checklist.filter((c) => c.done).length} de {checklist.length} listos
              </span>
            </div>

            <div className="space-y-2 mt-4">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklist(item.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 select-none ${
                    item.done
                      ? 'bg-white border-emerald-300 text-slate-800 shadow-2xs'
                      : 'bg-white/60 border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <div className={`p-1 rounded-lg ${item.done ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {item.done ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs font-medium ${item.done ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* MATRIZ MAESTRA DE CONTINGENCIAS & PROTOCOLO ANTI-IMPREVISTOS 360° */}
          <div className="p-6 rounded-3xl bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-700/40 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-white/10 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    <ShieldAlert className="w-4 h-4" />
                  </span>
                  <h4 className="text-base font-extrabold tracking-tight text-white">
                    Matriz Maestra de Contingencias & Anti-Imprevistos 360°
                  </h4>
                </div>
                <p className="text-xs text-slate-300">
                  Simulación de todos los escenarios de riesgo posibles para el 8 al 12 de Octubre. Protocolo de reacción inmediata y blindaje preventivo.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  🛡️ 9 Escenarios Blindados
                </span>
              </div>
            </div>

            {/* Filtros de Categoría */}
            <div className="flex flex-wrap gap-2 mb-5">
              {[
                { id: 'all', label: 'Todos (9)' },
                { id: 'flight', label: '✈️ Vuelo & Aeropuerto' },
                { id: 'luggage', label: '🎒 Equipaje & Filtros' },
                { id: 'arrival', label: '🚖 Movilidad & Llegada' },
                { id: 'finance', label: '💵 Finanzas & Clima' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setContingencyFilter(cat.id as any)}
                  className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    contingencyFilter === cat.id
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white border border-white/10'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Grid de Escenarios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {contingencyScenarios
                .filter((sc) => contingencyFilter === 'all' || sc.category === contingencyFilter)
                .map((sc) => {
                  const isExpanded = expandedContingency === sc.id;
                  return (
                    <div
                      key={sc.id}
                      onClick={() => setExpandedContingency(isExpanded ? null : sc.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isExpanded
                          ? 'bg-white/15 border-amber-400/60 shadow-md ring-1 ring-amber-400/30'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                          {sc.categoryLabel}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">Riesgo: <strong>{sc.risk}</strong></span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-amber-300" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                      </div>

                      <h5 className="text-sm font-bold text-white mb-2 leading-snug">{sc.title}</h5>

                      <div className="space-y-2 mt-3 pt-2.5 border-t border-white/10">
                        <div>
                          <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block mb-0.5">
                            ⚡ Protocolo de Acción Inmediato
                          </span>
                          <p className="text-xs text-slate-200 leading-relaxed">{sc.protocol}</p>
                        </div>

                        {isExpanded && (
                          <div className="pt-2 border-t border-white/5 animate-fadeIn">
                            <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider block mb-0.5">
                              🛡️ Blindaje Preventivo (Qué hacer hoy)
                            </span>
                            <p className="text-xs text-slate-300 leading-relaxed">{sc.prevention}</p>
                          </div>
                        )}
                      </div>

                      {!isExpanded && (
                        <div className="mt-2.5 text-right">
                          <span className="text-[10px] text-amber-300/80 font-medium hover:underline">
                            Toca para ver blindaje preventivo ➔
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* ITINERARIO PUERTA A PUERTA (ESTILO ROME2RIO) */}
          <div className="p-6 rounded-3xl bg-linear-to-br from-slate-900 via-slate-900 to-teal-950 text-white border border-teal-800/30 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-white/10 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30">
                    <Navigation className="w-4 h-4" />
                  </span>
                  <h4 className="text-base font-extrabold tracking-tight text-white">
                    Ruta Puerta a Puerta (Rome2Rio): De tu Casa a Medellín
                  </h4>
                </div>
                <p className="text-xs text-slate-300">
                  Itinerario multimodal detallado: Calle 35 ➔ Aeropuerto MTR ➔ Vuelo JA5483 ➔ Rionegro ➔ Medellín Centro ➔ PAC San Antonio.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30">
                  ⏱️ Duración Total: ~4h 30m
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-slate-200 border border-white/10">
                  🛣️ 5 Tramos
                </span>
              </div>
            </div>

            {/* Mapa Interactivo OpenStreetMap (Leaflet) */}
            <div className="mb-6">
              <Rome2RioRouteMap />
            </div>

            {/* Stepper / Timeline de Tramos */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 relative">
              {/* Tramo 1 */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between hover:bg-white/10 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <Car className="w-3.5 h-3.5" /> Tramo 1: Montería
                    </span>
                    <span className="text-[10px] text-slate-400">~12.5 km</span>
                  </div>
                  <h5 className="text-sm font-bold text-white">Casa ➔ Aeropuerto MTR</h5>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Transporte familiar directo desde <strong>Cl 35 # 15B-18</strong> hacia Los Garzones (te llevan gratis).
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Salida: <strong>10:25 AM</strong> (25m)</span>
                  <span className="text-emerald-400 font-bold">Gratis ✅ ($0 COP)</span>
                </div>
              </div>

              {/* Tramo 2 */}
              <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-500/30 flex flex-col justify-between hover:bg-teal-900/30 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-teal-300 flex items-center gap-1">
                      <Plane className="w-3.5 h-3.5" /> Tramo 2: Vuelo
                    </span>
                    <span className="text-[10px] text-teal-300 font-mono">JA 5483</span>
                  </div>
                  <h5 className="text-sm font-bold text-white">MTR ➔ MDE (Rionegro)</h5>
                  <p className="text-[11px] text-slate-300 mt-1">
                    JetSMART directo. Embarque: <strong>11:58 AM</strong> | Despegue: <strong>12:48 PM</strong> | Llegada: <strong>01:49 PM</strong>.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">Asiento <strong>20B (Zona 3)</strong></span>
                  <span className="text-emerald-400 font-bold">Cubierto ✅</span>
                </div>
              </div>

              {/* Tramo 3 */}
              <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex flex-col justify-between hover:bg-blue-900/30 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-300 flex items-center gap-1">
                      <Bus className="w-3.5 h-3.5" /> Tramo 3: Bus Túnel
                    </span>
                    <span className="text-[10px] text-blue-300">~24 km</span>
                  </div>
                  <h5 className="text-sm font-bold text-white">MDE ➔ CC San Diego</h5>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Bus blanco Combuses en Puerta 2. <strong>¡Bájate en San Diego!</strong> El bus NO va a Laureles.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Duración: <strong>35-40 min</strong></span>
                  <span className="text-blue-300 font-bold">$15.000 COP</span>
                </div>
              </div>

              {/* Tramo 4 */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between hover:bg-white/10 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                      <Train className="w-3.5 h-3.5" /> Tramo 4: Cívica
                    </span>
                    <span className="text-[10px] text-slate-400">Metro A</span>
                  </div>
                  <h5 className="text-sm font-bold text-white">PAC Est. San Antonio</h5>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Expedición de <strong>Tarjeta Cívica</strong> personalizada con cédula física original (hasta 6:45 PM).
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Desde San Diego: <strong>Metro</strong></span>
                  <span className="text-emerald-300 font-bold">Cédula física</span>
                </div>
              </div>

              {/* Tramo 5 */}
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex flex-col justify-between hover:bg-purple-900/30 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 flex items-center gap-1">
                      <Home className="w-3.5 h-3.5" /> Tramo 5: Destino
                    </span>
                    <span className="text-[10px] text-purple-300">~4.5 km</span>
                  </div>
                  <h5 className="text-sm font-bold text-white">San Diego ➔ Airbnb</h5>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Taxi por Calle 33 (~$12k-$14k, 12 min). <strong>A pie no renta:</strong> 4.5 km / 1h 10m con maleta, sol y cruce de río.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Taxi Calle 33 directo</span>
                  <span className="text-purple-300 font-bold">~$12.000 COP</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs text-slate-500 font-medium">Efectivo en Mano</span>
              <div className="text-lg font-bold text-slate-900 mt-1">{formatCurrency(med.cashInHand)}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Físico para aterrizar en MDE</div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs text-purple-800 font-medium">Cajita Medayork (Nu)</span>
                <span className="text-[10px] bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded-full font-bold">
                  9.35% E.A.
                </span>
              </div>
              <div className="text-lg font-bold text-purple-950 mt-1">{formatCurrency(med.nuBoxSavings)}</div>
              <div className="text-[11px] text-purple-700 mt-0.5">Rendimiento diario líquido</div>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80">
              <span className="text-xs text-teal-800 font-medium">Excedente Líquido Libre</span>
              <div className="text-lg font-bold text-teal-950 mt-1">{formatCurrency(realFreeSurplus)}</div>
              <div className="text-[11px] text-teal-700 mt-0.5">Líquido tras motilada (-$12k)</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
              <span className="text-xs text-emerald-800 font-medium">Capital Total Asegurado</span>
              <div className="text-lg font-bold text-emerald-950 mt-1">{formatCurrency(totalTripSecuredCapital)}</div>
              <div className="text-[11px] text-emerald-700 mt-0.5">Colchón libre: +{formatCurrency(netTripSurplus)}</div>
            </div>
          </div>

          {/* Partidas Desglosadas del Viaje */}
          <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80">
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-600" />
              Desglose de Gastos del Viaje a Medellín (5 Días)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {med.items.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{item.category}</span>
                    <span className="text-[11px] text-slate-500">{item.description}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-slate-900 block">
                      {item.amount === 0 ? 'Cubierto' : formatCurrency(item.amount)}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        item.status === 'Cubierto'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'Prioritario'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comandos Rápidos de Registro */}
          <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200/80">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Comandos de Registro Rápido
                </h4>
                <p className="text-xs text-indigo-700">Toca para registrar un movimiento diario y recalcular los fondos automáticamente.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => handleQuickAdd('barber')}
                className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-amber-200 hover:border-amber-400 text-xs font-bold text-amber-900 flex items-center gap-1.5 shadow-2xs hover:bg-amber-50/50 transition-all"
              >
                <Scissors className="w-3.5 h-3.5 text-amber-600" />
                Ejecutar Motilada (-$12.000 COP)
              </button>
              <button
                onClick={() => handleQuickAdd('familySync')}
                className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-blue-200 hover:border-blue-400 text-xs font-bold text-blue-900 flex items-center gap-1.5 shadow-2xs hover:bg-blue-50/50 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                Recibir Fondos Padres (+$150.000 COP)
              </button>
              <button
                onClick={() => handleQuickAdd('frida')}
                className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-emerald-200 hover:border-emerald-400 text-xs font-bold text-emerald-900 flex items-center gap-1.5 shadow-2xs hover:bg-emerald-50/50 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Cartera en Calle ($0.00 COP ✅)
              </button>
              <button
                onClick={() => handleQuickAdd('papa')}
                className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-purple-200 hover:border-purple-400 text-xs font-bold text-purple-900 flex items-center gap-1.5 shadow-2xs hover:bg-purple-50/50 transition-all"
              >
                <Bus className="w-3.5 h-3.5 text-purple-600" />
                Bus Rionegro ➔ Centro ($15.000 COP)
              </button>
            </div>
          </div>

          {/* ESTRATEGIA DE DESODORANTE & SUDORACIÓN EN CABINA */}
          <div className="p-6 rounded-3xl bg-linear-to-br from-slate-900 to-indigo-950 text-white border border-indigo-800/40 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 mb-4 gap-2">
              <div>
                <h4 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Estrategia para Sudoración Fuerte & Equipaje de Mano
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Los aerosoles estándar (Axe/Old Spice 150 ml) están prohibidos en cabina. Aquí tienes las 3 soluciones reales sin comprometer tu protección:
                </p>
              </div>
              <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Solución Clínica & Viajera
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      Opción 1: Mini Aerosol
                    </span>
                    <span className="text-xs font-mono text-slate-400">≤ 50 ml</span>
                  </div>
                  <h5 className="text-sm font-bold text-white">Rexona o Nivea Mini 50ml</h5>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    Si prefieres formato aerosol, busca en <strong>Farmatodo o Éxito</strong> las versiones travel size de 50 ml. Al ser ≤100 ml pasan el filtro de rayos X sin decomiso.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-white/10 text-[11px] text-amber-300 font-bold">
                  ⚠️ Difícil de hallar suelto en Montería
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Opción 2: Máximo Poder (Recomendada)
                    </span>
                    <span className="text-xs font-mono text-emerald-300">48 g</span>
                  </div>
                  <h5 className="text-sm font-bold text-white">Barra o Gel Clinical (48g)</h5>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    <strong>Rexona Clinical</strong> o <strong>Gillette Clinical Gel</strong>. Tienen 3 veces más concentración antitranspirante que cualquier aerosol común. Bloquean el sudor de raíz y al ser barra de 48g viajan 100% legales en cabina.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-white/10 text-[11px] text-emerald-300 font-bold">
                  ✅ 100% Seguro en Cabina + Máxima Secura
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30">
                      Opción 3: Truco Viajero
                    </span>
                    <span className="text-xs font-mono text-purple-300">150 ml</span>
                  </div>
                  <h5 className="text-sm font-bold text-white">Comprar Aerosol en Medellín</h5>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    Viaja ligero con un roll-on de D1 ($6.950). Apenas te bajes del bus en <strong>San Diego</strong> o en el Éxito cerca a tu Airbnb en La Castellana, compras tu tarro normal de 150 ml ($14k) y lo usas libremente en Medellín.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-white/10 text-[11px] text-purple-300 font-bold">
                  🛡️ Cero riesgo en aeropuerto
                </div>
              </div>
            </div>
          </div>

          {/* AGENDA CULTURAL & RUTAS CAMINABLES LOW-COST MEDELLÍN */}
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 mb-4 gap-2">
              <div>
                <h4 className="text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-teal-600" />
                  Planes de Costo $0 y Low-Cost en Medellín (8 al 12 Octubre)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pasea, camina y disfruta la ciudad sin gastar tu presupuesto. Planes ideales para recorrer a pie o con la Cívica.
                </p>
              </div>
              <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-300">
                Ahorro en Pasajes & Caminata
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Plan 1 */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-teal-400 transition-all flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      🎸 Evento del Año
                    </span>
                    <span className="text-xs font-bold text-emerald-600 font-mono">100% Gratis</span>
                  </div>
                  <h5 className="text-sm font-bold text-slate-900">Festival Altavoz 2026 (10-12 Oct)</h5>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Estadio Cincuentenario (Metro Universidad). Más de 50 bandas de rock, rap, reggae, ska y electrónica en vivo con entrada totalmente libre.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Llegada: Metro Línea A</span>
                  <span className="text-teal-700 font-semibold">Tarde / Noche</span>
                </div>
              </div>

              {/* Plan 2 */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-teal-400 transition-all flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      🚠 Hack del Metro
                    </span>
                    <span className="text-xs font-bold text-emerald-600 font-mono">$3.600 COP</span>
                  </div>
                  <h5 className="text-sm font-bold text-slate-900">Metrocable Panorámico (Línea J o K)</h5>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Toma el Metro y haz transbordo dentro del sistema al Metrocable hacia La Aurora o Santo Domingo. ¡Sobrevolarás Medellín con vista 360° sin pagar un peso adicional si no sales de los torniquetes!
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Mirador Aéreo</span>
                  <span className="text-blue-700 font-semibold">1 Solo Pasaje</span>
                </div>
              </div>

              {/* Plan 3 */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-teal-400 transition-all flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                      🎨 Arte Urbano
                    </span>
                    <span className="text-xs font-bold text-emerald-600 font-mono">Entrada Libre</span>
                  </div>
                  <h5 className="text-sm font-bold text-slate-900">Comuna 13 & Escaleras Eléctricas</h5>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Metro Línea B hasta San Javier + caminata o integrado. Murales gigantes, shows de breakdance y ambiente vibrante. Solo gastas en una paleta de mango biche ($3.000 COP).
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Caminata guiada libre</span>
                  <span className="text-purple-700 font-semibold">2-3 horas</span>
                </div>
              </div>

              {/* Plan 4 */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-teal-400 transition-all flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      🌿 Naturaleza & Relax
                    </span>
                    <span className="text-xs font-bold text-emerald-600 font-mono">100% Gratis</span>
                  </div>
                  <h5 className="text-sm font-bold text-slate-900">Jardín Botánico & Orquideorama</h5>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Estación Universidad. Enorme pulmón verde con lagos, aves y el icónico Orquideorama. Perfecto para una tarde fresca caminando y descansando bajo los árboles.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Zona norte de Medellín</span>
                  <span className="text-emerald-700 font-semibold">Cero costo</span>
                </div>
              </div>

              {/* Plan 5 */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-teal-400 transition-all flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      🏞️ Mirador Tradicional
                    </span>
                    <span className="text-xs font-bold text-emerald-600 font-mono">Entrada Libre</span>
                  </div>
                  <h5 className="text-sm font-bold text-slate-900">Cerro Nutibara / Pueblito Paisa</h5>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Sube a pie por el sendero ecológico del cerro (ideal para hacer ejercicio). Arriba hay una réplica de pueblo antioqueño tradicional y vista panorámica de la ciudad.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Cerca a Exposiciones</span>
                  <span className="text-amber-700 font-semibold">Senderismo suave</span>
                </div>
              </div>

              {/* Plan 6 */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-teal-400 transition-all flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      🚶 Caminata Local
                    </span>
                    <span className="text-xs font-bold text-emerald-600 font-mono">Desde tu Puerta</span>
                  </div>
                  <h5 className="text-sm font-bold text-slate-900">Circuito Parques de Laureles</h5>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    A pocas cuadras de tu Airbnb en La Castellana. Camina por la Transversal 39 hacia el Primer y Segundo Parque de Laureles. Calles sombreadas, seguras y llenas de vida nocturna tranquila.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Laureles / Av. Nutibara</span>
                  <span className="text-teal-700 font-semibold">Caminable 100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* PANEL DE PREVENCIÓN DE GASTOS OCULTOS & HACKS DE AHORRO */}
          <div className="p-5 rounded-2xl bg-linear-to-r from-emerald-50 via-teal-50 to-blue-50 border border-teal-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <h5 className="text-sm font-bold text-teal-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                3 Hacks Locales para Cuidar tu Dinero en Antioquia
              </h5>
              <p className="text-xs text-teal-800 leading-relaxed">
                1. <strong>Agua gratis:</strong> Lleva tu termo vacío en la mochila. En el aeropuerto de Montería y en Medellín el agua de grifo es 100% potable y de primera calidad (ahorras ~$20k en botellitas).<br />
                2. <strong>Almuerzo ejecutivo ("Corrientazo"):</strong> En La Castellana y Laureles pide almuerzo del día ($14.000 - $17.000 COP con sopa, proteína, ensalada y jugo natural). Evita restaurantes turísticos de $45k+.<br />
                3. <strong>Cívica siempre:</strong> Pagar con Cívica te ahorra $500 por viaje y te permite transbordar gratis entre Metro y Metrocables.
              </p>
            </div>
            <div className="self-end sm:self-center px-4 py-2.5 rounded-2xl bg-white border border-teal-300 text-right shadow-2xs">
              <span className="text-[10px] text-teal-600 uppercase font-black tracking-wider block">Ahorro Estimado</span>
              <span className="text-lg font-black text-teal-900 font-mono">+$45.000 COP</span>
              <span className="text-[10px] text-slate-500 block">En 5 días de viaje</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 2: CUENTAS POR COBRAR (PASEOS CANINOS) */}
      {/* ======================================================== */}
      {activeTab === 'cobros' && (
        <div className="mt-6 space-y-5">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <div>
              <span className="text-xs font-bold text-amber-900 block">Total Pendiente por Cobrar</span>
              <span className="text-2xl font-black text-amber-950">{formatCurrency(med.receivablesTotal)}</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Al recaudar en Nequi, trasladar de inmediato a la <strong>Cajita Medayork de Nu</strong> para ganar intereses al 9.30% E.A.
              </p>
            </div>
            <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-xs">
              <Coins className="w-6 h-6" />
            </div>
          </div>

          <div className="space-y-3">
            {med.receivables.map((rec) => (
              <div key={rec.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{rec.client}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-medium">
                      {rec.dogName}
                    </span>
                    <span className="text-xs text-slate-400">• {rec.concept}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{rec.notes}</p>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-base font-extrabold text-slate-900 block">{formatCurrency(rec.amount)}</span>
                    <span className="text-[10px] text-amber-700 font-bold uppercase">{rec.status}</span>
                  </div>
                  <button
                    onClick={() => {
                      showNotice(`💰 Cobro de ${rec.client} marcado como recibido.`);
                    }}
                    className="cursor-pointer px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Registrar Pago
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 3: PRESUPUESTO MENSUAL GENERAL */}
      {/* ======================================================== */}
      {activeTab === 'general' && (
        <div className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Ingresos Mensuales</span>
              <div className="text-xl font-extrabold text-slate-900 mt-1">{formatCurrency(finance.monthlyIncome)}</div>
              <div className="text-[11px] text-slate-400 mt-1">Nómina / Ingresos fijos</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Presupuesto Mensual</span>
              <div className="text-xl font-extrabold text-slate-900 mt-1">{formatCurrency(finance.monthlyBudget)}</div>
              <div className="text-[11px] text-slate-400 mt-1">Límite operativo de gastos</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Gastos Acumulados</span>
              <div className="text-xl font-extrabold text-emerald-700 mt-1">{formatCurrency(finance.totalExpenses)}</div>
              <div className="text-[11px] text-slate-400 mt-1">
                Restante: <strong className="text-slate-700">{formatCurrency(remainingBudget)}</strong>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-6">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-2">
              <span>Progreso del Presupuesto Mensual ({budgetPercentUsed}%)</span>
              <span>Disponible: {formatCurrency(remainingBudget)}</span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all rounded-full ${
                  budgetPercentUsed > 90 ? 'bg-rose-500' : budgetPercentUsed > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${budgetPercentUsed}%` }}
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Últimos Gastos Registrados
            </h4>
            {finance.expenses.map((exp) => (
              <div key={exp.id} className="p-3.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{exp.title}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                      {exp.category}
                    </span>
                    <span className="text-[10px] text-slate-400">{exp.date} • {exp.paymentMethod}</span>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-slate-900">{formatCurrency(exp.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

'use client';

import React, { useState } from 'react';
import {
  Wallet,
  CreditCard,
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
  ShoppingBag,
  Coffee,
} from 'lucide-react';
import { initialFinanceData, FinanceSummary, ExpenseItem, ReceivableItem } from '@/lib/financeStore';
import Rome2RioRouteMap from '@/components/Rome2RioRouteMap';

export default function FinanceSection() {
  const [finance, setFinance] = useState<FinanceSummary>(initialFinanceData);
  const [activeTab, setActiveTab] = useState<'goals-debt' | 'weekly-flow' | 'medellin' | 'cobros' | 'general'>('goals-debt');
  const [quickNotice, setQuickNotice] = useState<string | null>(null);
  const [debtPayInput, setDebtPayInput] = useState<number>(50000);
  const [iphoneSaveInput, setIphoneSaveInput] = useState<number>(100000);
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
    { id: 'c13', label: 'Termo de café de aluminio empacado 100% VACÍO (se llena gratis en sala de abordaje de Los Garzones y MDE; agua potable EPM en Medellín)', done: false },
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

  // Ingresos Ocasionales (Rappi con Andrés y Trabajos Universitarios - esporádicos)
  const [didRappi, setDidRappi] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vyfith_did_rappi');
      return saved !== null ? saved === 'true' : false;
    }
    return false;
  });
  const [rappiAmount, setRappiAmount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vyfith_rappi_amount');
      return saved ? Number(saved) : 107100;
    }
    return 107100;
  });

  const [didHomework, setDidHomework] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vyfith_did_homework');
      return saved !== null ? saved === 'true' : false;
    }
    return false;
  });
  const [homeworkAmount, setHomeworkAmount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vyfith_homework_amount');
      return saved ? Number(saved) : 50000;
    }
    return 50000;
  });

  const handleToggleRappi = (val: boolean) => {
    setDidRappi(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vyfith_did_rappi', String(val));
    }
  };

  const handleRappiAmountChange = (val: number) => {
    setRappiAmount(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vyfith_rappi_amount', String(val));
    }
  };

  const handleToggleHomework = (val: boolean) => {
    setDidHomework(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vyfith_did_homework', String(val));
    }
  };

  const handleHomeworkAmountChange = (val: number) => {
    setHomeworkAmount(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vyfith_homework_amount', String(val));
    }
  };

  // Cálculos dinámicos de Flujo Semanal (Paseos de perros, pasajes UPB, Rappi con Andrés Bello y trabajos U)
  const weeklyDogIncome = (finance.weeklyFlow?.dogWalksIncome || []).reduce((acc, curr) => acc + curr.weeklyTotal, 0);
  const weeklyRappiIncome = didRappi ? rappiAmount : 0;
  const weeklyHomeworkIncome = didHomework ? homeworkAmount : 0;
  const totalWeeklyIncome = weeklyDogIncome + (finance.weeklyFlow?.upbTransportSavings || 0) + weeklyRappiIncome + weeklyHomeworkIncome;
  const totalWeeklyExpenses = (finance.weeklyFlow?.weeklyFixedExpenses || []).reduce((acc, curr) => acc + curr.amount, 0);
  const netWeeklySavings = totalWeeklyIncome - totalWeeklyExpenses;

  // Cálculos Deuda Yessid ($580.000 COP)
  const yessidTotal = finance.yessidDebt?.totalAmount ?? 580000;
  const yessidPaid = finance.yessidDebt?.paidAmount ?? 0;
  const yessidRemaining = Math.max(0, yessidTotal - yessidPaid);
  const debtProgress = Math.min(100, Math.round((yessidPaid / yessidTotal) * 100));

  // Cálculos Meta iPhone 15 Pro Bodega Mayorista ($1.950.000 COP)
  const iphoneCost = finance.iphoneGoal?.price ?? 1950000;
  const iphoneSaved = finance.iphoneGoal?.savedAmount ?? 0;
  const iphoneRemaining = Math.max(0, iphoneCost - iphoneSaved);
  const iphoneProgress = Math.min(100, Math.round((iphoneSaved / iphoneCost) * 100));

  // Proyecciones de semanas
  const weeksToPayDebt = netWeeklySavings > 0 ? Math.ceil(yessidRemaining / netWeeklySavings) : 0;
  const weeksToBuyIphone = netWeeklySavings > 0 ? Math.ceil(iphoneRemaining / netWeeklySavings) : 0;

  const handlePayDebt = (amount: number) => {
    if (amount <= 0) return;
    setFinance((prev) => {
      const currentPaid = prev.yessidDebt?.paidAmount || 0;
      const total = prev.yessidDebt?.totalAmount || 580000;
      const newPaid = Math.min(total, currentPaid + amount);
      const remaining = total - newPaid;
      return {
        ...prev,
        yessidDebt: {
          ...prev.yessidDebt,
          paidAmount: newPaid,
          remainingAmount: remaining,
        },
      };
    });
    showNotice(`🤝 +${formatCurrency(amount)} abonados a la deuda de Yessid. Saldo pendiente: ${formatCurrency(Math.max(0, yessidRemaining - amount))}`);
  };

  const handleSaveIPhone = (amount: number) => {
    if (yessidRemaining > 0) {
      showNotice(`⚠️ Regla Innegociable: Primero salda la deuda de $580.000 COP con tu mejor amigo Yessid.`);
      return;
    }
    if (amount <= 0) return;
    setFinance((prev) => {
      const currentSaved = prev.iphoneGoal?.savedAmount || 0;
      const price = prev.iphoneGoal?.price || 1950000;
      const newSaved = Math.min(price, currentSaved + amount);
      return {
        ...prev,
        iphoneGoal: {
          ...prev.iphoneGoal,
          savedAmount: newSaved,
          status: newSaved >= price ? 'Completado' : 'En Progreso',
        },
      };
    });
    showNotice(`📱 +${formatCurrency(amount)} asignados al fondo del iPhone 15 Pro.`);
  };

  // Cálculo del Viaje Medellín en tiempo real (Miércoles 7 de Octubre de 2026)
  const med = finance.medellinTrip;
  const totalLiquidAvailable = med.cashInHand + med.nuBoxSavings + med.nequiSavings; // $350.579 COP
  const realFreeSurplus = totalLiquidAvailable + med.receivablesTotal - med.pendingFixedExpenses; // $338.579 COP
  const totalTripSecuredCapital = realFreeSurplus + med.pendingFamilyContributions; // $488.579 COP
  const netTripSurplus = totalTripSecuredCapital - med.targetBudget; // +$113.579 COP de excedente
  const tripCoveragePercent = Math.min(100, Math.round((totalTripSecuredCapital / med.targetBudget) * 100)); // 100% Cobertura asegurada

  // Registrar un cobro, gasto o ingreso rápido
  const handleQuickAdd = (type: 'barber' | 'preShopping' | 'familySync' | 'frida' | 'sienna' | 'papa') => {
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
    } else if (type === 'preShopping') {
      const cost = 18000;
      setFinance((prev) => ({
        ...prev,
        medellinTrip: {
          ...prev.medellinTrip,
          cashInHand: Math.max(0, prev.medellinTrip.cashInHand - cost),
        },
      }));
      showNotice(`🛍️ -$18.000 COP descontados en efectivo por compras previas D1/Ara (Roll-on XEN, talco pies, chicles y snack).`);
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
      showNotice(`✅ Cartera de Frida (Laura) ya liquidada ($0.00 COP pendientes).`);
    } else if (type === 'sienna') {
      showNotice(`✅ Cartera de Sienna (Elena) ya liquidada ($0.00 COP pendientes).`);
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
    {
      id: 'cont-10',
      category: 'luggage',
      categoryLabel: '🎒 Equipaje & Filtros',
      title: 'Termo Metálico de Café / Agua en Filtro de Seguridad Rayos X',
      risk: 'Alta si lleva líquido dentro',
      impact: 'Decomiso del líquido o retención',
      protocol: 'El termo de aluminio o acero inoxidable para café/agua está 100% PERMITIDO por la Aerocivil y JetSMART en cabina. La única regla inquebrantable es que DEBE PASAR EL CONTROL DE RAYOS X TOTALMENTE VACÍO (0 ml de líquido). Una vez dentro de la sala de abordaje en el 2.° piso de Los Garzones o en MDE, llénalo gratis en los bebederos. En Medellín el agua de grifo EPM es 100% potable y pura.',
      prevention: 'Vaciar y secar el termo antes de salir de casa en Montería. Ahorro de ~$20.000 COP en botellas plásticas.',
    },
  ];

  return (
    <section id="finance-section" className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xs mb-10 transition-colors">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Finanzas Personales & Ecosistema de Ahorro
            </span>
            <span className="text-xs font-mono text-slate-400">Pilar 4: Economía & Metas</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Control Financiero & Plan Medellín 2026
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mt-1">
            Supervisa tus presupuestos mensuales, rentabilidad en Cajita Nu (9.30% E.A.), cobros por paseos caninos y el colchón financiero proyectado para tu viaje.
          </p>
        </div>

        {/* Pestañas de Navegación Interna */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('goals-debt')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'goals-debt'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            🎯 Deuda Yessid & iPhone 15 Pro
          </button>
          <button
            onClick={() => setActiveTab('weekly-flow')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'weekly-flow'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            💵 Flujo Semanal & Paseos
          </button>
          <button
            onClick={() => setActiveTab('cobros')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'cobros'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-600" />
            Cartera Canina
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'general'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-slate-600" />
            Presupuesto Mensual
          </button>
          <button
            onClick={() => setActiveTab('medellin')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'medellin'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plane className="w-3.5 h-3.5 text-emerald-600" />
            Viaje Medellín
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

      {/* Panel de Micro-Liquidez, Deuda Daniela Bula & Pago Gimnasio UPB */}
      <div className="my-6 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-800/80 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Auditoría en Tiempo Real
              </span>
              <span className="text-xs font-mono text-slate-400">Octubre 2026</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              Micro-Liquidez Disponible: Gimnasio vs. Deuda Daniela vs. Cajita Nu
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluación matemática de solvencia para autorizar el pago de la mensualidad del gimnasio manteniendo tu colchón seguro.
            </p>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-right self-start sm:self-auto">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block font-mono">Saldo Libre Tras Pagos</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">+$50.929 COP</span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block font-semibold">+41.8% de colchón intacto</span>
          </div>
        </div>

        {/* Rejilla de Activos y Compromisos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          {/* Cajita Nu */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Cajita Nu (9.30%)</span>
            <span className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400 font-mono">$116.929</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Líquido 24/7</span>
          </div>

          {/* Efectivo */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Efectivo en Mano</span>
            <span className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-200 font-mono">$5.000</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Billetes físicos</span>
          </div>

          {/* Deuda Daniela Bula */}
          <div className="p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
            <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 block font-mono">Deuda Daniela Bula</span>
            <span className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400 font-mono">-$22.000</span>
            <span className="text-[10px] text-rose-700/80 dark:text-rose-300 block">Pago Prioritario #1</span>
          </div>

          {/* Gimnasio UPB */}
          <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
            <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block font-mono">Mensualidad Gym UPB</span>
            <span className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400 font-mono">-$49.000</span>
            <span className="text-[10px] text-amber-700/80 dark:text-amber-300 block">5 semanas (~$3.266/d)</span>
          </div>

          {/* María Minerva */}
          <div className="p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
            <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 block font-mono">Cobro María Minerva</span>
            <span className="text-sm sm:text-base font-black text-blue-600 dark:text-blue-400 font-mono">+$10.000</span>
            <span className="text-[10px] text-blue-700/80 dark:text-blue-300 block">Por cobrar</span>
          </div>

          {/* Reembolso Google Play */}
          <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
            <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block font-mono">Reembolso Google</span>
            <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">+$20.000</span>
            <span className="text-[10px] text-emerald-700/80 dark:text-emerald-300 block">Aprobado (Mastercard)</span>
          </div>
        </div>

        {/* Diagnóstico Resolutivo */}
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between flex-wrap gap-2">
          <span>
            💡 <strong>Diagnóstico de Cobertura:</strong> Tienes <strong>$121.929 COP</strong> disponibles. Pagando los <strong>$22.000</strong> a Daniela y los <strong>$49.000</strong> del gimnasio, te sobran <strong>$50.929 COP</strong> (que suben a <strong>$60.929 COP</strong> al cobrar a Minerva).
          </span>
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase font-mono bg-emerald-600 text-white shadow-xs">
            Solvencia Verificada ✅
          </span>
        </div>
      </div>

      {/* Tarjeta Ejecutiva de Alta Densidad: Runway & Asignación Base Cero (Inspirado en midday-ai & Actual Budget) */}
      <div className="my-6 p-5 sm:p-6 rounded-3xl bg-linear-to-br from-slate-900 via-emerald-950/70 to-slate-900 border border-emerald-800/40 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Consola Ejecutiva de Capital • Estándar Midday & Envelope Budgeting</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">
              Runway Personal, Rendimiento Nu & Fondo Blindado Medellín
            </h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Asignación determinista de liquidez con separación estricta para la meta fija de viaje ($584.500 COP) y rentabilidad activa en Cajita Nu (9.30% E.A.).
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
              Runway: 8.4 Meses
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Tasa E.A. Activa</span>
            <span className="text-lg font-black text-purple-400 font-mono">9.30%</span>
            <span className="text-[10px] text-slate-400 block">Cajita Nu Bank</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Rendimiento Diario</span>
            <span className="text-lg font-black text-emerald-400 font-mono">+$2.140</span>
            <span className="text-[10px] text-emerald-300/80 block">Interés compuesto</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Envolvente Medellín</span>
            <span className="text-lg font-black text-sky-400 font-mono">$584.500</span>
            <span className="text-[10px] text-slate-400 block">Fondo Intocable</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Abonos Papá</span>
            <span className="text-lg font-black text-amber-400 font-mono">$450.000</span>
            <span className="text-[10px] text-slate-400 block">Compromiso 100% OK</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VISTA 0A: DEUDA YESSID & META IPHONE 15 PRO */}
      {/* ======================================================== */}
      {activeTab === 'goals-debt' && (
        <div className="mt-6 space-y-6 animate-fadeIn">
          {/* Banner de Estrategia Financiera Innegociable */}
          <div className="p-6 rounded-3xl bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Plan de Saneamiento y Capitalización • Montería 2026</span>
                </div>
                <h3 className="text-2xl font-black tracking-tight">Deuda Yessid ➡️ Compra iPhone 15 Pro</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                  Regla de oro: liquidar primero el 100% de la deuda moral con tu mejor amigo Yessid (<strong>$580.000 COP</strong>) antes de desbloquear el fondo para el iPhone 15 Pro (<strong>$1.950.000 COP</strong>) en la bodega mayorista de Montería.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 text-right self-start md:self-center">
                <span className="text-[11px] text-slate-300 uppercase tracking-wider block font-semibold">Excedente Semanal Actual</span>
                <span className="text-2xl font-black text-emerald-400">+{formatCurrency(netWeeklySavings)}</span>
                <span className="text-[11px] text-slate-400 block font-medium">Paseos + Ahorro UPB + Rappi Andrés Bello</span>
              </div>
            </div>
          </div>

          {/* Dos Columnas: Tarjeta 1 (Deuda Yessid) y Tarjeta 2 (iPhone 15 Pro) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. TARJETA DEUDA YESSID (PRIORIDAD #1) */}
            <div className="p-6 rounded-3xl bg-white border-2 border-rose-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full">
                      Prioridad #1 Innegociable
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">Compromiso de Honor</span>
                </div>

                <div className="mt-4">
                  <h4 className="text-xl font-bold text-slate-900">Deuda con mi Mejor Amigo (Yessid)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Total adeudado: <strong className="text-slate-900">{formatCurrency(yessidTotal)}</strong>. Se debe extinguir antes de cualquier gasto de ocio o tecnología.
                  </p>
                </div>

                {/* Métricas de la deuda */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Abonado hasta hoy</span>
                    <span className="text-lg font-black text-emerald-600">{formatCurrency(yessidPaid)}</span>
                    <span className="text-[10px] text-slate-400">{debtProgress}% saldado</span>
                  </div>
                  <div className="p-3 bg-rose-50/70 rounded-2xl border border-rose-100">
                    <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">Saldo Pendiente</span>
                    <span className="text-lg font-black text-rose-700">{formatCurrency(yessidRemaining)}</span>
                    <span className="text-[10px] text-rose-500 font-medium">{yessidRemaining === 0 ? '¡Deuda 100% pagada!' : 'Por transferir a Yessid'}</span>
                  </div>
                </div>

                {/* Barra de Progreso */}
                <div className="mt-4">
                  <div className="flex justify-between items-center text-xs font-semibold mb-1">
                    <span className="text-slate-600">Progreso de Pago</span>
                    <span className={yessidRemaining === 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                      {yessidRemaining === 0 ? 'COMPLETADO ✅' : `${formatCurrency(yessidRemaining)} restantes`}
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        yessidRemaining === 0 ? 'bg-emerald-500' : 'bg-gradient-to-r from-rose-500 to-amber-500'
                      }`}
                      style={{ width: `${debtProgress}%` }}
                    />
                  </div>
                </div>

                {/* Proyección de Pago */}
                <div className="mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Tiempo estimado para salir de la deuda:</span>
                  </p>
                  <p className="text-[11px] text-amber-800/90 mt-1 leading-relaxed">
                    Con tu nuevo excedente semanal de <strong>{formatCurrency(netWeeklySavings)}</strong> (paseos + pasajes UPB + Rappi dupla Andrés Bello), liquidas a Yessid en solo <strong>{weeksToPayDebt} semanas</strong> (¡apenas 1 mes!). Si además sumas empleo de temporada, ¡la pagas en <strong>menos de 2 semanas</strong>!
                  </p>
                </div>
              </div>

              {/* Controles de Abono Interactivo */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 block mb-2">Registrar abono a Yessid:</span>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <button
                    onClick={() => handlePayDebt(50000)}
                    disabled={yessidRemaining === 0}
                    className="cursor-pointer py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all disabled:opacity-40"
                  >
                    +$50.000
                  </button>
                  <button
                    onClick={() => handlePayDebt(100000)}
                    disabled={yessidRemaining === 0}
                    className="cursor-pointer py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all disabled:opacity-40"
                  >
                    +$100.000
                  </button>
                  <button
                    onClick={() => handlePayDebt(yessidRemaining)}
                    disabled={yessidRemaining === 0}
                    className="cursor-pointer py-1.5 px-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-40"
                  >
                    Saldar Todo
                  </button>
                </div>
              </div>
            </div>

            {/* 2. TARJETA META IPHONE 15 PRO (BODEGA MAYORISTA MONTERÍA) */}
            <div className={`p-6 rounded-3xl bg-white border-2 shadow-sm flex flex-col justify-between ${yessidRemaining > 0 ? 'border-slate-200 opacity-95' : 'border-indigo-300'}`}>
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                      Meta de Capital • Bodega Montería
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">Importadores Directos 🇨🇴</span>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-bold text-slate-900">iPhone 15 Pro (256 GB - Titanio)</h4>
                    <span className="text-lg font-black text-indigo-600">{formatCurrency(iphoneCost)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Titanio Natural/Negro, Dynamic Island, Chip A17 Pro (3nm para emulación y render), Puerto USB-C 3.0 de alta velocidad.
                  </p>
                </div>

                {/* Métricas del iPhone */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Capital Guardado</span>
                    <span className="text-lg font-black text-indigo-600">{formatCurrency(iphoneSaved)}</span>
                    <span className="text-[10px] text-slate-400">{iphoneProgress}% acumulado</span>
                  </div>
                  <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100">
                    <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">Falta por Ahorrar</span>
                    <span className="text-lg font-black text-indigo-900">{formatCurrency(iphoneRemaining)}</span>
                    <span className="text-[10px] text-indigo-500 font-medium">Meta final para ir a comprar</span>
                  </div>
                </div>

                {/* Barra de Progreso del iPhone */}
                <div className="mt-4">
                  <div className="flex justify-between items-center text-xs font-semibold mb-1">
                    <span className="text-slate-600">Progreso hacia el iPhone</span>
                    <span className="text-indigo-600 font-bold">{iphoneProgress}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${iphoneProgress}%` }}
                    />
                  </div>
                </div>

                {/* Candado de advertencia o habilitación */}
                {yessidRemaining > 0 ? (
                  <div className="mt-4 p-3 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800">Fondo de compra bloqueado temporalmente:</strong>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Por disciplina financiera, este fondo se activará apenas los <strong>{formatCurrency(yessidRemaining)}</strong> de Yessid queden totalmente pagados.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>¡Deuda saldada! Todo tu ahorro semanal ahora entra directamente a la compra del iPhone.</span>
                  </div>
                )}
              </div>

              {/* Protocolo de Inspección en Bodega */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-700 block mb-1">🔍 Protocolo de Verificación Batería 100% en Bodega:</span>
                <ul className="text-[10px] text-slate-500 space-y-1 leading-tight">
                  <li>• <strong>Ciclos Reales (iOS 17.4+):</strong> Ajustes ➔ General ➔ Información ➔ Batería. Si marca 100% y tiene ≤50 ciclos, es legítimo. Si tiene &gt;150 ciclos y dice 100%, fue alterada.</li>
                  <li>• <strong>Test 3uTools en PC:</strong> Pedir que lo conecten a la computadora para verificar el serial BMS original y la capacidad en mAh (3.274 mAh diseño).</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Tabla Comparativa de Escenarios Laborales para Lograr el iPhone */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Proyección de Tiempos según Escenario Laboral
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-bold">Escenario Laboral</th>
                    <th className="px-4 py-3 font-bold">Ingreso Semanal Estimado</th>
                    <th className="px-4 py-3 font-bold">Ahorro Neto Semanal</th>
                    <th className="px-4 py-3 font-bold text-rose-600">Tiempo Deuda Yessid</th>
                    <th className="px-4 py-3 font-bold text-indigo-600">Tiempo iPhone 15 Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      1. Situación Actual (Paseos + Pasajes Papá + Rappi Dupla Andrés + Trabajos U)
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(totalWeeklyIncome)}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600">{formatCurrency(netWeeklySavings)}</td>
                    <td className="px-4 py-3 font-bold text-rose-600">4 semanas (¡1 mes!)</td>
                    <td className="px-4 py-3 font-bold text-indigo-600">14 semanas</td>
                  </tr>
                  <tr className="hover:bg-slate-50 bg-emerald-50/30">
                    <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-1.5">
                      <span>2. Empleo de Temporada en Montería (Éxito, Koaj, Bosi, Ara)</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-100 text-emerald-800 font-bold">Recomendado</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">~$395.000 COP</td>
                    <td className="px-4 py-3 font-bold text-emerald-700">~$280.000 COP</td>
                    <td className="px-4 py-3 font-black text-rose-700">2 semanas</td>
                    <td className="px-4 py-3 font-black text-emerald-700">7 semanas (¡En Diciembre!)</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      3. Empleo en Medellín / Bucaramanga (Arriendo Compartido con Compañero)
                    </td>
                    <td className="px-4 py-3 text-slate-600">~$415.000 COP</td>
                    <td className="px-4 py-3 font-bold text-indigo-600">~$260.000 COP</td>
                    <td className="px-4 py-3 font-bold text-rose-600">2.2 semanas</td>
                    <td className="px-4 py-3 font-bold text-indigo-600">7.5 semanas</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 0B: FLUJO DE CAJA SEMANAL & PASEOS */}
      {/* ======================================================== */}
      {activeTab === 'weekly-flow' && (
        <div className="mt-6 space-y-6 animate-fadeIn">
          {/* Tarjeta Destacada: Modelo de Volatilidad (Semanas Buenas vs Semanas Malas) */}
          <div className="p-6 rounded-3xl bg-linear-to-br from-indigo-950 via-slate-900 to-indigo-950 text-white shadow-md relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-indigo-900/60">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 mb-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Modelo Estadístico Ponderado (PERT) • Volatilidad Real
                </span>
                <h3 className="text-xl font-bold tracking-tight">Tu Promedio Real Mensual Ponderado</h3>
                <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                  Considera semanas flojas (parciales/lluvias), semanas normales y semanas pico de Rappi con Andrés Bello y trabajos de la U.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 text-right self-start md:self-center">
                <span className="text-[10px] text-slate-300 uppercase tracking-wider block font-semibold">Promedio Mensual Real</span>
                <span className="text-2xl font-black text-emerald-400">~$773.000 COP/mes</span>
                <span className="text-[10px] text-slate-400 block font-medium">~$178.000 COP/semana promedio</span>
              </div>
            </div>

            {/* Cuadrícula de 3 Escenarios */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-rose-400/40 transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-rose-300">🔴 Mes Malo / Lluvias</span>
                  <span className="text-[10px] bg-rose-500/20 text-rose-200 px-2 py-0.5 rounded-full font-mono">Piso Seguro</span>
                </div>
                <span className="text-lg font-black text-white block">$467.000 COP/mes</span>
                <span className="text-[11px] text-slate-400 block mb-2">~$108.000 COP/semana</span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Solo paseos y pasajes papá. Sin Rappi ni trabajos U por parciales o mal clima. Cubre tus gastos fijos y deja <strong>+$45k/mes</strong> de colchón.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-500/15 border-2 border-indigo-400/40 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-emerald-300">🟡 Mes Normal (Más Probable)</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded-full font-mono font-bold">Promedio Real</span>
                </div>
                <span className="text-lg font-black text-emerald-400 block">$773.000 COP/mes</span>
                <span className="text-[11px] text-emerald-200/80 block mb-2">~$178.000 COP/semana</span>
                <p className="text-[11px] text-slate-200 leading-relaxed">
                  Paseos continuos, pasajes papá, 2-3 fines de semana de Rappi (~$67k/sem para ti) y 1 trabajo U mediano. Ahorro neto: <strong>+$351.000 COP/mes</strong>. Deuda Yessid en <strong>7 semanas</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-400/40 transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-teal-300">🟢 Mes Excelente / Picos</span>
                  <span className="text-[10px] bg-teal-500/20 text-teal-200 px-2 py-0.5 rounded-full font-mono">Techo Fuerte</span>
                </div>
                <span className="text-lg font-black text-teal-300 block">$1.087.000 COP/mes</span>
                <span className="text-[11px] text-slate-400 block mb-2">~$251.000 COP/semana</span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  4 fines de semana de Rappi a tope (V-S-D), 2 entregas de ingeniería y paseos al 100%. Ahorro neto: <strong>+$665.000 COP/mes</strong>. Deuda Yessid en <strong>4 semanas</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Tarjetas de Resumen Semanal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-100">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Ingresos Semanales Totales</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">{formatCurrency(totalWeeklyIncome)}</span>
              <span className="text-xs text-emerald-600">Paseos Sienna (Elena) & Frida (Laura) + Pasajes Papá + Rappi Andrés + Trabajos U</span>
            </div>
            <div className="p-5 rounded-3xl bg-rose-50 border border-rose-100">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">Gastos Fijos Semanales</span>
              <span className="text-2xl font-black text-rose-700 mt-1 block">-{formatCurrency(totalWeeklyExpenses)}</span>
              <span className="text-xs text-rose-600 dark:text-rose-400">Imprevistos & Recargas Móviles</span>
            </div>
            <div className="p-5 rounded-3xl bg-slate-900 text-white shadow-sm">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Excedente Neto Disponible</span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">+{formatCurrency(netWeeklySavings)}</span>
              <span className="text-xs text-slate-400">Saldo libre semanal para pagar deuda y ahorrar</span>
            </div>
          </div>

          {/* Configuración de Ingresos Ocasionales: Rappi con Andrés & Trabajos Universitarios */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Ingresos Ocasionales de la Semana (De Vez en Cuando)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Marca si esta semana hiciste Rappi con Andrés o algún trabajo universitario, e indica cuánto ganaste para actualizar el flujo semanal exacto.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80">
                +{formatCurrency(weeklyRappiIncome + weeklyHomeworkIncome)} COP sumados
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {/* Opción 1: Rappi con Andrés */}
              <div className={`p-4 rounded-2xl border transition-all ${
                didRappi
                  ? 'bg-amber-50/70 border-amber-300 dark:bg-amber-950/30 dark:border-amber-700/60'
                  : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛵</span>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">Rappi con Andrés</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Dupla de fin de semana en moto</span>
                    </div>
                  </div>
                  <div className="flex items-center p-0.5 bg-slate-200/80 dark:bg-slate-700 rounded-xl">
                    <button
                      onClick={() => handleToggleRappi(true)}
                      className={`cursor-pointer px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        didRappi
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Sí, salí
                    </button>
                    <button
                      onClick={() => handleToggleRappi(false)}
                      className={`cursor-pointer px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        !didRappi
                          ? 'bg-slate-800 dark:bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      No esta vez
                    </button>
                  </div>
                </div>

                {didRappi ? (
                  <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-900/50">
                    <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      ¿Cuánto ganaste en tu parte limpia? (COP):
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">$</span>
                      <input
                        type="number"
                        value={rappiAmount}
                        onChange={(e) => handleRappiAmountChange(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                        placeholder="107100"
                      />
                      <span className="text-xs text-slate-500 font-mono">COP</span>
                    </div>
                    <span className="text-[10px] text-amber-700 dark:text-amber-300 mt-1 block">
                      ✅ Sumando +{formatCurrency(rappiAmount)} COP al ingreso semanal.
                    </span>
                  </div>
                ) : (
                  <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 italic">
                    Esta semana no saliste en Rappi ($0 COP sumados).
                  </div>
                )}
              </div>

              {/* Opción 2: Trabajos Universitarios */}
              <div className={`p-4 rounded-2xl border transition-all ${
                didHomework
                  ? 'bg-purple-50/70 border-purple-300 dark:bg-purple-950/30 dark:border-purple-700/60'
                  : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📚</span>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">Trabajo Universitario</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Asesorías, planos o ejercicios</span>
                    </div>
                  </div>
                  <div className="flex items-center p-0.5 bg-slate-200/80 dark:bg-slate-700 rounded-xl">
                    <button
                      onClick={() => handleToggleHomework(true)}
                      className={`cursor-pointer px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        didHomework
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Sí, hice
                    </button>
                    <button
                      onClick={() => handleToggleHomework(false)}
                      className={`cursor-pointer px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        !didHomework
                          ? 'bg-slate-800 dark:bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      No esta vez
                    </button>
                  </div>
                </div>

                {didHomework ? (
                  <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-900/50">
                    <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      ¿Cuánto cobraste / ganaste por el trabajo? (COP):
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-purple-600 dark:text-purple-400 font-mono">$</span>
                      <input
                        type="number"
                        value={homeworkAmount}
                        onChange={(e) => handleHomeworkAmountChange(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                        placeholder="50000"
                      />
                      <span className="text-xs text-slate-500 font-mono">COP</span>
                    </div>
                    <span className="text-[10px] text-purple-700 dark:text-purple-300 mt-1 block">
                      ✅ Sumando +{formatCurrency(homeworkAmount)} COP al ingreso semanal.
                    </span>
                  </div>
                ) : (
                  <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 italic">
                    Esta semana no realizaste trabajos pagados ($0 COP sumados).
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desglose de Paseos Caninos */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Footprints className="w-4 h-4 text-amber-600" />
                  Ingresos Semanales por Paseos Caninos
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Control de clientes caninos activos y tarifa por paseo</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl">
                Subtotal Paseos: {formatCurrency(weeklyDogIncome)}/semana
              </span>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-bold">Cliente / Mascota</th>
                    <th className="px-4 py-3 font-bold">Frecuencia</th>
                    <th className="px-4 py-3 font-bold">Tarifa por Paseo</th>
                    <th className="px-4 py-3 font-bold">Total Semanal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {finance.weeklyFlow?.dogWalksIncome?.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {item.dogName} <span className="text-slate-400 font-normal">({item.client})</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.walksPerWeek} paseos/semana</td>
                      <td className="px-4 py-3 text-slate-600">{formatCurrency(item.ratePerWalk)}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{formatCurrency(item.weeklyTotal)}</td>
                    </tr>
                  ))}
                  <tr className="bg-indigo-50/40">
                    <td className="px-4 py-3 font-bold text-indigo-900">
                      Aporte Pasajes Papá (Tarjeta Estudiantil Gratis)
                    </td>
                    <td className="px-4 py-3 text-slate-600">Lunes a Viernes (5 días)</td>
                    <td className="px-4 py-3 text-slate-600">$7.000/día ($3.500 ida + $3.500 venida) — Gasto $0 COP</td>
                    <td className="px-4 py-3 font-bold text-indigo-600">+{formatCurrency(finance.weeklyFlow?.upbTransportSavings || 35000)}</td>
                  </tr>
                  <tr className={didRappi ? "bg-amber-50/60 dark:bg-amber-950/30" : "bg-slate-50/40 dark:bg-slate-800/30 opacity-70"}>
                    <td className="px-4 py-3 font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                      <span>🛵 Rappi con Andrés</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${didRappi ? "bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-300" : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"}`}>
                        {didRappi ? "Realizado esta semana" : "No realizado esta semana"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">Ocasional (Fines de semana)</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {didRappi ? `Ganancia neta registrada: ${formatCurrency(rappiAmount)} COP` : "No salí en moto ($0 COP)"}
                    </td>
                    <td className="px-4 py-3 font-bold font-mono text-amber-700 dark:text-amber-400">
                      {didRappi ? `+${formatCurrency(rappiAmount)}` : "$0 COP"}
                    </td>
                  </tr>
                  <tr className={didHomework ? "bg-purple-50/60 dark:bg-purple-950/30" : "bg-slate-50/40 dark:bg-slate-800/30 opacity-70"}>
                    <td className="px-4 py-3 font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      <span>📚 Trabajos Universitarios</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${didHomework ? "bg-purple-200 text-purple-900 dark:bg-purple-900/60 dark:text-purple-300" : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"}`}>
                        {didHomework ? "Realizado esta semana" : "No realizado esta semana"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">Ocasional en el semestre</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {didHomework ? `Cobro registrado: ${formatCurrency(homeworkAmount)} COP` : "Sin asesorías/trabajos ($0 COP)"}
                    </td>
                    <td className="px-4 py-3 font-bold font-mono text-purple-600 dark:text-purple-400">
                      {didHomework ? `+${formatCurrency(homeworkAmount)}` : "$0 COP"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Desglose de Gastos Fijos Semanales */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-rose-600" />
              Gastos Fijos Semanales Inevitables
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-bold">Concepto</th>
                    <th className="px-4 py-3 font-bold">Categoría</th>
                    <th className="px-4 py-3 font-bold text-rose-600">Monto Semanal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {finance.weeklyFlow?.weeklyFixedExpenses?.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{item.concept}</td>
                      <td className="px-4 py-3 text-slate-600">{item.category}</td>
                      <td className="px-4 py-3 font-bold text-rose-600">-{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
                        Cuentas por cobrar en calle (Rappi, Frida de Laura, Sienna de Elena, Andrés)
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
                  🛡️ 10 Escenarios Blindados
                </span>
              </div>
            </div>

            {/* Filtros de Categoría */}
            <div className="flex flex-wrap gap-2 mb-5">
              {[
                { id: 'all', label: 'Todos (10)' },
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
                onClick={() => handleQuickAdd('preShopping')}
                className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-rose-200 hover:border-rose-400 text-xs font-bold text-rose-900 flex items-center gap-1.5 shadow-2xs hover:bg-rose-50/50 transition-all"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-rose-600" />
                Compras D1/Ara Hoy (-$18.000 COP)
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

          {/* PROTOCOLO OFICIAL DEL TERMO DE ALUMINIO / CAFÉ & AGUA GRATIS EPM */}
          <div className="p-6 rounded-3xl bg-linear-to-br from-slate-900 via-teal-950 to-slate-900 text-white border border-teal-800/40 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 mb-4 gap-2">
              <div>
                <h4 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-teal-400" />
                  Protocolo del Termo de Café (Aluminio) & Agua Gratis EPM
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Respuesta oficial a la duda de equipaje: Sí puedes llevar tu termo térmico metálico para café y agua.
                </p>
              </div>
              <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[11px] font-black bg-teal-500/20 text-teal-300 border border-teal-400/30">
                100% Permitido en Cabina ✅
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-400/30 block w-fit mb-2">
                    1. Normativa Aeronáutica
                  </span>
                  <h5 className="text-sm font-bold text-white">Metálico / Aluminio Legal</h5>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    Tanto la Aerocivil colombiana (RAC 160) como JetSMART autorizan termos de café, botellas térmicas y pachones de aluminio o acero inoxidable dentro del artículo personal bajo el asiento. No se considera arma ni objeto punzante.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-white/10 text-[11px] text-teal-300 font-bold">
                  🛡️ Cero riesgo de decomiso
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30 block w-fit mb-2">
                    2. La Regla de Oro
                  </span>
                  <h5 className="text-sm font-bold text-white">Pasar 100% Vacío en Rayos X</h5>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    <strong>¡Ojo!:</strong> En el control de seguridad de Los Garzones no permiten líquidos &gt;100 ml. Si tu termo lleva café o agua, el escáner lo detecta y te obligan a vaciarlo en la caneca. Llévalo <strong>totalmente vacío y seco</strong> al pasar los Rayos X.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-white/10 text-[11px] text-amber-300 font-bold">
                  ⚠️ 0 ml de líquido al pasar el filtro
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 block w-fit mb-2">
                    3. Hack de Ahorro
                  </span>
                  <h5 className="text-sm font-bold text-white">Agua Gratis EPM & Salas</h5>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    Apenas superes el filtro hacia la sala del 2.° piso, llénalo gratis en los bebederos. En Medellín, el agua de grifo de EPM es una de las más puras de América Latina (100% potable). Ahorras más de <strong>$20.000 COP</strong> en botellitas plásticas.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-white/10 text-[11px] text-emerald-300 font-bold">
                  💧 Ahorro: +$20.000 COP asegurados
                </div>
              </div>
            </div>
          </div>

          {/* COMERCIO LOCAL & ALIMENTACIÓN LOW-COST A 3 CUADRAS DEL AIRBNB */}
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 mb-4 gap-2">
              <div>
                <h4 className="text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  Puntos D1, Ara & Alimentación Low-Cost a 3 Cuadras del Airbnb
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Barrio La Castellana (`6.242847, -75.601348`): Come rico y compra barato como un local sin gastar de más.
                </p>
              </div>
              <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                Economía de Barrio
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between shadow-2xs">
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 block w-fit mb-2">
                    🛒 Supermercados Vecinos
                  </span>
                  <h5 className="text-sm font-bold text-slate-900">D1 La Castellana (a 3 cuadras)</h5>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    • <strong>D1 La Castellana:</strong> Calle 33 # 83A - 35 (a solo 3 cuadras).<br />
                    • <strong>D1 Laureles:</strong> Cra 78A # 34A - 14 (a 4 cuadras).<br />
                    • <strong>Éxito Laureles:</strong> Cra 81 # 37-100 (a 3 cuadras cruzando la 80).<br />
                    Ideal para comprar atún, avena, panela, huevos, snacks y desodorante aerosol si lo necesitas.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-emerald-700 font-bold">
                  📍 A 3 minutos caminando
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between shadow-2xs">
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 block w-fit mb-2">
                    🍲 Almuerzos Ejecutivos
                  </span>
                  <h5 className="text-sm font-bold text-slate-900">Corrientazos ($14k - $16k)</h5>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Alrededor de la <strong>Glorieta de Santa Gema</strong> y sobre la <strong>Carrera 81</strong> abundan restaurantes de comida casera tradicional paisa. El menú incluye sopa de mondongo/verduras/costilla, bandeja con carne/pollo/pescado, arroz, ensalada, patacón y vaso de jugo natural.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-amber-700 font-bold">
                  🥩 Comida completa y llenadora
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between shadow-2xs">
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase text-blue-700 bg-blue-50 border border-blue-200 block w-fit mb-2">
                    ☕ Desayunos de Panadería
                  </span>
                  <h5 className="text-sm font-bold text-slate-900">Combo Mañanero (&lt;$6.000)</h5>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Las panaderías de esquina sobre la Calle 33 y la Calle 35 ofrecen buñuelo recién horneado ($2.000), pandebono y café con leche o perico ($2.500), o huevos al gusto con arepa con queso por ~$5.500 COP. No necesitas pagar desayunos costosos de hotel.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-blue-700 font-bold">
                  🥐 Desayuno paisa low-cost
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

          {/* PRONÓSTICO METEOROLÓGICO Y ESTADO VIAL EN VIVO (8 AL 12 OCT) */}
          <div className="p-6 rounded-3xl bg-linear-to-br from-slate-900 via-sky-950 to-slate-900 text-white border border-sky-800/40 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 mb-4 gap-2">
              <div>
                <h4 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-sky-400" />
                  Meteorología & Estado Vial en Vivo (8 al 12 de Octubre)
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Inspección técnica en tiempo real: Medellín (16°-25°C), Rionegro (14°-22°C) y Concesión Túnel de Oriente.
                </p>
              </div>
              <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[11px] font-black bg-sky-500/20 text-sky-300 border border-sky-400/30">
                Patrón Bimodal Confirmado
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider block mb-1">
                    ☀️ Mañanas Secas (8:00 AM - 1:00 PM)
                  </span>
                  <h5 className="text-sm font-bold text-white">Ventana Ideal de Paseo & Sol</h5>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Probabilidad de lluvia muy baja (10-15%). Mañanas ideales para caminar por Laureles, Comuna 13, Jardín Botánico y diligencias como la tarjeta Cívica en San Antonio.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/10 text-[11px] text-amber-300 font-bold">
                  Aprovechar para exteriores
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-sky-300 tracking-wider block mb-1">
                    🌧️ Tardes Lluviosas (1:30 PM - 7:30 PM)
                  </span>
                  <h5 className="text-sm font-bold text-white">Tormentas Vespertinas (70-75%)</h5>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Aterrizas en MDE el jueves a la 1:49 PM justo cuando inicia la lluvia. Sal ágil en el bus y toma taxi directo. Para los demás días, programa planes bajo techo de 3 a 6 PM.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/10 text-[11px] text-sky-300 font-bold">
                  Llevar sombrilla o impermeable
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-300 tracking-wider block mb-1">
                    🛣️ Túnel de Oriente (100% Operativo)
                  </span>
                  <h5 className="text-sm font-bold text-white">Sin Cierres Nocturnos en tu Viaje</h5>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    El túnel opera normal 24/7. El contraflujo festivo unidireccional es domingo/lunes de 5 a 9 PM; tu regreso es el lunes a las 5:00 AM (flujo bidireccional libre sin trancones).
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/10 text-[11px] text-emerald-300 font-bold">
                  Vía despejada para tu vuelo
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
      {/* VISTA 3: PRESUPUESTO MENSUAL REAL (NOTION) */}
      {/* ======================================================== */}
      {activeTab === 'general' && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Flujo Mensual Estimado</span>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{formatCurrency(finance.monthlyIncome)}</div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Paseos caninos + Pasajes + Extras</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Presupuesto Operativo Mensual</span>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{formatCurrency(finance.monthlyBudget)}</div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Límite real asignado para el mes</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Gastos Reales del Semestre/Mes</span>
              <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(finance.totalExpenses)}</div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Disponible: <strong className="text-slate-700 dark:text-slate-300">{formatCurrency(remainingBudget)}</strong>
              </div>
            </div>
          </div>

          {/* Barra de Ejecución Presupuestal */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <span>Ejecución del Presupuesto ({budgetPercentUsed}%)</span>
              <span>Colchón disponible: {formatCurrency(remainingBudget)}</span>
            </div>
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all rounded-full ${
                  budgetPercentUsed > 90 ? 'bg-rose-500' : budgetPercentUsed > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${budgetPercentUsed}%` }}
              />
            </div>
          </div>

          {/* Dos Columnas: Gastos Reales Registrados (Notion) + Lista de Deseos (Wishlist Notion) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de Gastos Reales */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                  Transacciones Reales Registradas (Notion)
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">Total: {formatCurrency(finance.totalExpenses)}</span>
              </div>

              <div className="space-y-2.5">
                {finance.expenses.map((exp) => (
                  <div key={exp.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">{exp.title}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                          {exp.category}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{exp.date} • {exp.paymentMethod}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">{formatCurrency(exp.amount)}</span>
                  </div>
                ))}

                {/* Matrícula UPB Cubierta 100% por Papá */}
                <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/50 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">Matrícula Universitaria UPB (Semestre 2026-II)</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold">100% Cubierta por Papá</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">
                        Universidad & Libros
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Aporte familiar directo • Costo personal de Santiago: $0 COP</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">$0 COP</span>
                    <span className="text-[9px] text-slate-400 block line-through">$500.000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Metas de Ahorro / Wishlist Documentadas en Notion */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Lista de Deseos / Wishlist (Notion)
                </h4>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold">Meta: $245.920 COP</span>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Creatina Imn (133 Servicios)</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Nutrición & Hipertrofia (Meta 60 kg)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black font-mono text-amber-700 dark:text-amber-300">$95.920 COP</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 block font-semibold mt-0.5">
                      En Ahorro
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/50 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Jeans x 2 (Ropa)</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Vestuario personal</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black font-mono text-purple-700 dark:text-purple-300">$150.000 COP</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 block font-semibold mt-0.5">
                      En Ahorro
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                  💡 <strong>Regla de Prioridad:</strong> Estas compras se activan una vez saldada la deuda con Yessid ($580.000 COP).
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

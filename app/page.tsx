import { Activity, Calendar, CreditCard, Dumbbell } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 p-8 flex items-center justify-center font-sans">
      <div className="max-w-4xl w-full">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">MegaProyecto API Core</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Los artefactos de código solicitados para la integración del modelo híbrido han sido generados exitosamente.
            La base unifica los 4 pilares fundamentales para el motor de inteligencia.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">HealthSyncWorker.kt</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Worker en Kotlin configurado para usar <i>Changes Tokens</i>. Extrae deltas de Health Connect y los formatea a HL7 FHIR R4.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">schema.json</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Esquema estandarizado (JSON Schema) que unifica métricas biométricas, rutinas de Hevy, agenda (OAuth) y finanzas.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">SystemInstructions.txt</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                System Prompt para el modelo Gemini preparado para evaluar cruces multivariables y detectar sobreentrenamiento.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">backend_ingestor.ts</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Servicio backend TypeScript que implementa <i>Structured Outputs</i> usando Gemini 2.5 Pro para devolver JSON validado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

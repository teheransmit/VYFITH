import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 text-slate-800">
      <h2 className="text-2xl font-bold mb-2">Página no encontrada</h2>
      <p className="text-sm text-slate-500 mb-4">La página que buscas no existe o ha sido movida.</p>
      <Link href="/" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
        Volver al Inicio
      </Link>
    </div>
  );
}

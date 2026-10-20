/** Pantalla completa de carga, con el texto de lo que se está haciendo. */
export default function Cargando({ texto = 'Cargando...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8fafc]">
      <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin" />
      <p className="mt-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{texto}</p>
    </div>
  );
}

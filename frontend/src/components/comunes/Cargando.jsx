/** Indicador de carga. `pantallaCompleta` ocupa toda la pantalla; si no, sólo su lugar. */
export default function Cargando({ texto = 'Cargando…', pantallaCompleta = true }) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center gap-3 ${pantallaCompleta ? 'min-h-screen bg-slate-50' : 'py-16'}`}
    >
      <div className="size-8 border-3 border-slate-300 border-t-slate-900 rounded-full animate-spin" aria-hidden="true" />
      <p className="text-sm text-slate-500">{texto}</p>
    </div>
  );
}

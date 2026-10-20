/**
 * La tarjeta blanca de cada bloque. `titulo` es el rótulo gris de arriba y
 * `accion` un botón a su derecha (por ejemplo, "Editar").
 */
export default function Tarjeta({ titulo, accion, className = '', children }) {
  return (
    <section className={`bg-white rounded-xl p-5 shadow-xs border border-slate-200/70 space-y-3 ${className}`}>
      {(titulo || accion) && (
        <div className="flex justify-between items-center gap-2 border-b border-slate-100 pb-2">
          {titulo && <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{titulo}</h3>}
          {accion}
        </div>
      )}
      {children}
    </section>
  );
}

/** El botón chico de "Editar" que va en el rótulo de una tarjeta. */
export function BotonEditar({ onClick, children = 'Editar' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg cursor-pointer"
    >
      {children}
    </button>
  );
}

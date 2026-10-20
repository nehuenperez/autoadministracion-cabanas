/**
 * Barra fija de arriba. Con `antetitulo` y `titulo` muestra el nombre de la
 * sección; `izquierda` y `derecha` son para botones (Volver, Nueva reserva) y
 * `children` para lo que va debajo (un buscador).
 */
export default function Encabezado({ antetitulo, titulo, izquierda, derecha, children }) {
  return (
    <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-slate-200/60 px-4 py-3.5 space-y-3">
      <div className="flex items-center justify-between gap-3 min-h-9">
        {izquierda}
        {(antetitulo || titulo) && (
          <div className={izquierda ? 'text-center' : ''}>
            {antetitulo && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{antetitulo}</span>
            )}
            {titulo && <h1 className="text-lg font-bold text-slate-900 tracking-tight">{titulo}</h1>}
          </div>
        )}
        {derecha ?? (izquierda && <span className="w-14" />)}
      </div>
      {children}
    </header>
  );
}

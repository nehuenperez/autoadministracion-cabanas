import { ArrowLeft } from 'lucide-react';

/**
 * Barra fija de arriba.
 *   titulo / subtitulo: el nombre de la pantalla y una línea de contexto
 *   onVolver:           muestra la flecha para volver
 *   derecha:            un botón o una insignia a la derecha
 *   children:           lo que va debajo (un buscador)
 */
export default function Encabezado({ titulo, subtitulo, onVolver, textoVolver = 'Volver', derecha, children }) {
  return (
    <header className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md border-b border-slate-200 px-4 pt-seguro pb-3">
      <div className="max-w-md mx-auto space-y-3">
        <div className="flex items-center justify-between gap-3 min-h-11">
          <div className="flex items-center gap-1 min-w-0">
            {onVolver && (
              <button
                type="button"
                onClick={onVolver}
                className="-ml-2 min-h-11 pl-2 pr-3 inline-flex items-center gap-1.5 rounded-xl text-[15px] font-medium text-slate-600 hover:bg-slate-100 active:bg-slate-200 cursor-pointer"
              >
                <ArrowLeft className="size-5" aria-hidden="true" />
                {textoVolver}
              </button>
            )}
            {titulo && (
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-slate-900 truncate">{titulo}</h1>
                {subtitulo && <p className="text-sm text-slate-500 truncate first-letter:uppercase">{subtitulo}</p>}
              </div>
            )}
          </div>
          {derecha}
        </div>
        {children}
      </div>
    </header>
  );
}

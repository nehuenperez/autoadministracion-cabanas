import { Pencil } from 'lucide-react';
import Boton from './Boton.jsx';

/**
 * Un bloque de contenido. `titulo` va arriba a la izquierda y `accion` (por
 * ejemplo, el botón Editar) a su derecha.
 */
export default function Tarjeta({ titulo, accion, className = '', children }) {
  return (
    <section className={`bg-white rounded-2xl border border-slate-200 p-4 space-y-4 ${className}`}>
      {(titulo || accion) && (
        <div className="flex justify-between items-center gap-3 min-h-11">
          {titulo && <h2 className="text-base font-semibold text-slate-900">{titulo}</h2>}
          {accion}
        </div>
      )}
      {children}
    </section>
  );
}

/** El botón "Editar" que va en el encabezado de una tarjeta. */
export function BotonEditar({ onClick, children = 'Editar' }) {
  return (
    <Boton variante="fantasma" tamano="chico" icono={Pencil} onClick={onClick} className="-mr-2 text-blue-700">
      {children}
    </Boton>
  );
}

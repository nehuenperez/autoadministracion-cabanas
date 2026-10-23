/**
 * Botones pegados para elegir una opción entre pocas (una cabaña, un medio de
 * pago). Más cómodo que un desplegable en el celular: se ven todas las opciones
 * y se elige con un toque.
 *
 *   opciones: [{ valor, texto }]
 */
export default function ControlSegmentado({ opciones, valor, onCambiar, etiqueta }) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className="flex gap-1 p-1 bg-slate-100 rounded-xl">
      {opciones.map((opcion) => {
        const elegida = String(opcion.valor) === String(valor);
        return (
          <button
            key={opcion.valor}
            type="button"
            role="radio"
            aria-checked={elegida}
            onClick={() => onCambiar(opcion.valor)}
            className={`flex-1 min-h-11 px-3 rounded-lg text-[15px] font-semibold transition-colors cursor-pointer ${
              elegida ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {opcion.texto}
          </button>
        );
      })}
    </div>
  );
}

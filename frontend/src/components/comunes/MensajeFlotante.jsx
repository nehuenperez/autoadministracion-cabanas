import { useEffect } from 'react';

/**
 * Aviso flotante abajo de la pantalla ("Cobro registrado"). Se ve sin
 * importar dónde esté parada la pantalla y desaparece solo.
 * `onCerrar` tiene que ser estable (por ejemplo, el setter de un useState).
 */
export default function MensajeFlotante({ mensaje, onCerrar }) {
  useEffect(() => {
    if (!mensaje) return undefined;
    const temporizador = setTimeout(() => onCerrar(null), 3500);
    return () => clearTimeout(temporizador);
  }, [mensaje, onCerrar]);

  if (!mensaje) return null;

  const estilo = mensaje.tipo === 'error' ? 'bg-rose-600' : 'bg-slate-900';
  return (
    <div className="fixed bottom-4 inset-x-4 z-40 max-w-md mx-auto" role="status">
      <button
        type="button"
        onClick={() => onCerrar(null)}
        className={`w-full ${estilo} text-white text-xs font-semibold p-3 rounded-xl shadow-lg text-center animate-aparecer cursor-pointer`}
      >
        {mensaje.texto}
      </button>
    </div>
  );
}

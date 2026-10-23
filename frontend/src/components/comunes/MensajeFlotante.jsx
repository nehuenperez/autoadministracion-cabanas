import { useEffect } from 'react';
import { CircleAlert, CircleCheck } from 'lucide-react';

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

  const esError = mensaje.tipo === 'error';
  const Icono = esError ? CircleAlert : CircleCheck;
  return (
    <div className="fixed bottom-seguro inset-x-4 z-40 max-w-md mx-auto" role={esError ? 'alert' : 'status'}>
      <button
        type="button"
        onClick={() => onCerrar(null)}
        className={`w-full flex items-center gap-2.5 text-left text-[15px] font-medium text-white p-4 rounded-2xl shadow-lg animate-aparecer cursor-pointer ${
          esError ? 'bg-rose-700' : 'bg-slate-900'
        }`}
      >
        <Icono className={`size-5 shrink-0 ${esError ? '' : 'text-emerald-400'}`} aria-hidden="true" />
        {mensaje.texto}
      </button>
    </div>
  );
}

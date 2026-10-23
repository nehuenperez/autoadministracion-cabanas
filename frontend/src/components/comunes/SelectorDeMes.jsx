import { ChevronLeft, ChevronRight } from 'lucide-react';

const flecha =
  'size-11 inline-flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 active:bg-slate-200 hover:text-slate-900 cursor-pointer';

/** El mes con flechas para pasar al anterior o al siguiente. `onCambiar` recibe -1 o +1. */
export default function SelectorDeMes({ titulo, onCambiar }) {
  return (
    <div className="flex justify-between items-center">
      <button type="button" onClick={() => onCambiar(-1)} className={flecha} aria-label="Mes anterior">
        <ChevronLeft className="size-5" />
      </button>
      <span className="text-base font-semibold text-slate-900 capitalize" aria-live="polite">{titulo}</span>
      <button type="button" onClick={() => onCambiar(1)} className={flecha} aria-label="Mes siguiente">
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}

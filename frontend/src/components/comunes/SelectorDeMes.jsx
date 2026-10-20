/** Barra con flechas para pasar de mes. `onCambiar` recibe -1 o +1. */
export default function SelectorDeMes({ titulo, onCambiar, compacto = false }) {
  const flecha = 'p-2 font-bold text-slate-400 hover:text-slate-900 text-sm focus:outline-hidden cursor-pointer';
  return (
    <div
      className={`flex justify-between items-center ${
        compacto ? 'px-1' : 'bg-white rounded-xl p-4 border border-slate-200/70 shadow-xs'
      }`}
    >
      <button type="button" onClick={() => onCambiar(-1)} className={flecha} aria-label="Mes anterior">←</button>
      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{titulo}</span>
      <button type="button" onClick={() => onCambiar(1)} className={flecha} aria-label="Mes siguiente">→</button>
    </div>
  );
}

import { formatearMientrasSeEscribe } from '../../utils/montos.js';
import { claseDeCampo } from '../../utils/estilos.js';

/**
 * Campo de monto en pesos: muestra el teclado numérico del celular y agrega
 * los puntos de miles mientras se escribe ("120.000"). El valor es el texto
 * formateado; para mandarlo a la API se convierte con parsearMonto().
 */
export default function CampoMonto({ value, onChange, className = '', ...resto }) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-slate-500 pointer-events-none" aria-hidden="true">
        $
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(formatearMientrasSeEscribe(e.target.value))}
        className={`${claseDeCampo} pl-7 tabular-nums ${className}`}
        {...resto}
      />
    </div>
  );
}

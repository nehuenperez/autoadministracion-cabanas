import { formatearMientrasSeEscribe } from '../../utils/montos.js';

/**
 * Campo de monto en pesos: muestra el teclado numérico del celular y agrega
 * los puntos de miles mientras se escribe ("120.000"). El valor es el texto
 * formateado; para mandarlo a la API se convierte con parsearMonto().
 */
export default function CampoMonto({ value, onChange, className = '', ...resto }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(formatearMientrasSeEscribe(e.target.value))}
      className={`w-full p-3 text-sm font-medium border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-600/10 focus:border-blue-500 transition ${className}`}
      {...resto}
    />
  );
}

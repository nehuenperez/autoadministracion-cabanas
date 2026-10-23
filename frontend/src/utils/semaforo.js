import { diasEntre, hoyISO } from './fechas.js';
import { saldoPendiente, totalCobrado } from './reservas.js';

/**
 * El semáforo de cobros: el color que resume, de un vistazo, si una reserva
 * está al día o hay que hacer algo. Es la única definición: el calendario, el
 * detalle y cualquier pantalla nueva lo sacan de acá, así no se contradicen.
 *
 * Se evalúa en este orden:
 *   Abortada / Finalizada  → su propio color, no importa el saldo
 *   Sin saldo pendiente    → verde
 *   Sin ningún cobro       → rojo (ni siquiera se cobró la seña)
 *   Check-in ya pasado     → rojo (se olvidó cobrar el saldo)
 *   Check-in hoy o mañana  → amarillo (hay que cobrar)
 *   Si no                  → celeste (tranquilidad)
 */
function semaforoDe(reserva, hoy = hoyISO()) {
  if (reserva.estado === 'Abortada') return { clave: 'abortada', etiqueta: 'Cancelada' };
  if (reserva.estado === 'Finalizada') return { clave: 'finalizada', etiqueta: 'Finalizada' };
  if (saldoPendiente(reserva) <= 0) return { clave: 'pagada', etiqueta: 'Pagada' };
  if (totalCobrado(reserva) === 0) return { clave: 'sinSena', etiqueta: 'Sin seña' };

  const diasParaElCheckIn = diasEntre(hoy, reserva.fechaCheckIn);
  if (diasParaElCheckIn < 0) return { clave: 'vencida', etiqueta: 'Saldo pendiente' };
  if (diasParaElCheckIn <= 1) return { clave: 'cobrar', etiqueta: 'Cobrar hoy' };
  return { clave: 'senada', etiqueta: 'Señada' };
}

/**
 * Clases de Tailwind de cada color. Escritas completas (no armadas con
 * `bg-${color}`) para que Tailwind las encuentre al generar el CSS.
 *   celda:    fondo del día ocupado en el calendario
 *   numero:   el número de ese día
 *   insignia: la etiqueta con el nombre del estado
 *   borde:    la franja izquierda de la tarjeta del detalle
 *   punto:    el punto de la referencia de colores
 */
const ESTILOS = {
  senada: {
    celda: 'bg-sky-100',
    numero: 'text-sky-900 font-semibold',
    insignia: 'bg-sky-50 text-sky-800 border-sky-200',
    borde: 'border-l-sky-500',
    punto: 'bg-sky-500',
  },
  cobrar: {
    celda: 'bg-amber-100',
    numero: 'text-amber-900 font-semibold',
    insignia: 'bg-amber-50 text-amber-800 border-amber-200',
    borde: 'border-l-amber-500',
    punto: 'bg-amber-500',
  },
  pagada: {
    celda: 'bg-emerald-100',
    numero: 'text-emerald-900 font-semibold',
    insignia: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    borde: 'border-l-emerald-500',
    punto: 'bg-emerald-500',
  },
  sinSena: {
    celda: 'bg-rose-100',
    numero: 'text-rose-900 font-semibold',
    insignia: 'bg-rose-50 text-rose-800 border-rose-200',
    borde: 'border-l-rose-500',
    punto: 'bg-rose-500',
  },
  vencida: {
    celda: 'bg-rose-100',
    numero: 'text-rose-900 font-semibold',
    insignia: 'bg-rose-50 text-rose-800 border-rose-200',
    borde: 'border-l-rose-500',
    punto: 'bg-rose-500',
  },
  finalizada: {
    celda: 'bg-slate-100',
    numero: 'text-slate-500',
    insignia: 'bg-slate-100 text-slate-700 border-slate-200',
    borde: 'border-l-slate-400',
    punto: 'bg-slate-400',
  },
  abortada: {
    celda: 'bg-white',
    numero: 'text-slate-400',
    insignia: 'bg-orange-50 text-orange-800 border-orange-200',
    borde: 'border-l-orange-400',
    punto: 'bg-orange-400',
  },
};

/** Lo que muestra la referencia de colores del calendario. */
const REFERENCIAS = [
  { clave: 'senada', texto: 'Señada' },
  { clave: 'cobrar', texto: 'Cobrar hoy' },
  { clave: 'pagada', texto: 'Pagada' },
  { clave: 'sinSena', texto: 'Revisar cobro' },
];

export { semaforoDe, ESTILOS, REFERENCIAS };

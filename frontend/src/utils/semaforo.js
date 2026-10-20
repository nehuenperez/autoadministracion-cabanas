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
  if (reserva.estado === 'Abortada') return { clave: 'abortada', etiqueta: 'Abortada' };
  if (reserva.estado === 'Finalizada') return { clave: 'finalizada', etiqueta: 'Finalizada' };
  if (saldoPendiente(reserva) <= 0) return { clave: 'pagada', etiqueta: 'Pagada' };
  if (totalCobrado(reserva) === 0) return { clave: 'sinSena', etiqueta: 'Sin seña / Revisar' };

  const diasParaElCheckIn = diasEntre(hoy, reserva.fechaCheckIn);
  if (diasParaElCheckIn < 0) return { clave: 'vencida', etiqueta: 'Saldo pendiente' };
  if (diasParaElCheckIn <= 1) return { clave: 'cobrar', etiqueta: 'Cobrar hoy' };
  return { clave: 'senada', etiqueta: 'Señada' };
}

/**
 * Clases de Tailwind de cada color. Escritas completas (no armadas con
 * `bg-${color}`) para que Tailwind las encuentre al generar el CSS.
 *   celda:    fondo del día en el calendario
 *   numero:   el número del día (tachado = ocupado)
 *   insignia: la etiqueta con el nombre del estado
 *   borde:    la franja izquierda de la tarjeta del detalle
 *   punto:    el punto de la referencia de colores
 */
const ESTILOS = {
  senada: {
    celda: 'bg-sky-50/80 border-sky-100',
    numero: 'text-sky-700 font-bold line-through decoration-sky-400',
    insignia: 'bg-sky-50 text-sky-700 border-sky-100',
    borde: 'border-l-sky-500',
    punto: 'bg-sky-400',
  },
  cobrar: {
    celda: 'bg-amber-50/90 border-amber-200',
    numero: 'text-amber-800 font-bold line-through decoration-amber-400',
    insignia: 'bg-amber-50 text-amber-700 border-amber-100',
    borde: 'border-l-amber-500',
    punto: 'bg-amber-500',
  },
  pagada: {
    celda: 'bg-emerald-50/80 border-emerald-100',
    numero: 'text-emerald-700 font-bold line-through decoration-emerald-400',
    insignia: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    borde: 'border-l-emerald-500',
    punto: 'bg-emerald-500',
  },
  sinSena: {
    celda: 'bg-rose-50/90 border-rose-200',
    numero: 'text-rose-700 font-bold line-through decoration-rose-300',
    insignia: 'bg-rose-50 text-rose-700 border-rose-100',
    borde: 'border-l-rose-500',
    punto: 'bg-rose-500',
  },
  vencida: {
    celda: 'bg-rose-50/90 border-rose-200',
    numero: 'text-rose-700 font-bold line-through decoration-rose-300',
    insignia: 'bg-rose-50 text-rose-700 border-rose-100',
    borde: 'border-l-rose-500',
    punto: 'bg-rose-500',
  },
  finalizada: {
    celda: 'bg-slate-100/70 border-slate-200/80',
    numero: 'text-slate-400 font-medium line-through decoration-slate-300',
    insignia: 'bg-slate-100 text-slate-600 border-slate-200',
    borde: 'border-l-slate-400',
    punto: 'bg-slate-400',
  },
  abortada: {
    celda: 'bg-white',
    numero: 'text-slate-400 font-normal line-through',
    insignia: 'bg-orange-50 text-orange-700 border-orange-100',
    borde: 'border-l-orange-400',
    punto: 'bg-orange-400',
  },
};

/** Lo que muestra la referencia de colores del calendario. */
const REFERENCIAS = [
  { clave: 'senada', texto: 'Tranquilidad' },
  { clave: 'cobrar', texto: 'Cobrar hoy' },
  { clave: 'pagada', texto: 'Al día' },
  { clave: 'sinSena', texto: 'Revisar / Sin seña' },
];

export { semaforoDe, ESTILOS, REFERENCIAS };

import { sumarDias } from './fechas.js';
import { saldoPendiente } from './reservas.js';

/**
 * Lo que pasa cada día en el complejo, para el resumen del inicio. Recibe las
 * reservas tal como las devuelve la API (con su cabaña, huéspedes y cobros).
 */

const ESTADOS_ACTIVOS = ['Señada', 'Pagada'];
const esActiva = (reserva) => ESTADOS_ACTIVOS.includes(reserva.estado);

/**
 * Quién entra y quién sale un día, en todas las cabañas. Primero las salidas:
 * a la mañana se va uno y a la tarde llega el siguiente. Las canceladas no
 * cuentan, y una Finalizada sí (puede ser la salida de hoy).
 */
function movimientosDelDia(fecha, reservas) {
  const movimientos = [];
  for (const reserva of reservas) {
    if (reserva.estado === 'Abortada') continue;
    if (reserva.fechaCheckOut === fecha) movimientos.push({ tipo: 'sale', reserva });
    if (reserva.fechaCheckIn === fecha) movimientos.push({ tipo: 'entra', reserva });
  }
  return movimientos.sort((a, b) => (a.tipo === b.tipo ? 0 : a.tipo === 'sale' ? -1 : 1));
}

/**
 * Reservas activas a las que les falta cobrar y que ya llegaron o llegan
 * mañana: las que hay que atender ya. Ordenadas por fecha de ingreso.
 */
function cobrosPendientes(reservas, hoy) {
  const manana = sumarDias(hoy, 1);
  return reservas
    .filter((r) => esActiva(r) && saldoPendiente(r) > 0 && r.fechaCheckIn <= manana)
    .sort((a, b) => a.fechaCheckIn.localeCompare(b.fechaCheckIn));
}

export { movimientosDelDia, cobrosPendientes };

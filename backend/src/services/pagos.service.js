import { Pago, Reserva } from '../models/index.js';

class PagoError extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.status = status;
  }
}

// Sólo estas dos dependen del saldo. Finalizada y Abortada no se tocan.
const ESTADOS_SEGUN_SALDO = ['Señada', 'Pagada'];

/**
 * Fecha de hoy (AAAA-MM-DD) en Argentina. El servidor corre en UTC: con
 * new Date(), un cobro cargado después de las 21 h quedaba con fecha de
 * mañana y, a fin de mes, sumaba en la caja del mes siguiente.
 */
function fechaDeHoy() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/San_Luis' }).format(new Date());
}

/**
 * Deja el estado de la reserva acorde a su saldo: Pagada si no debe nada,
 * Señada si todavía debe. Se llama después de cualquier cosa que mueva el
 * saldo (cobrar, borrar un cobro, cambiar el monto total).
 */
async function sincronizarEstadoConSaldo(reserva) {
  if (!ESTADOS_SEGUN_SALDO.includes(reserva.estado)) return;

  const saldoPendiente = await calcularSaldoPendiente(reserva.id);
  const estado = saldoPendiente <= 0 ? 'Pagada' : 'Señada';

  if (reserva.estado !== estado) {
    await reserva.update({ estado });
  }
}

/**
 * Registra un nuevo pago sobre una reserva existente.
 * Si el saldo pendiente llega a $0 después de este pago, actualiza
 * automáticamente el estado de la reserva a "Pagada".
 */
async function registrarPago(reservaId, datos) {
  const { monto, metodoPago, fecha } = datos;

  const reserva = await Reserva.findByPk(reservaId);
  if (!reserva) {
    throw new PagoError('La reserva no existe', 404);
  }

  if (!monto || monto <= 0) {
    throw new PagoError('El monto del pago debe ser mayor a 0', 400);
  }

  const pago = await Pago.create({
    reservaId,
    monto,
    metodoPago,
    fecha: fecha || fechaDeHoy(),
  });

  await sincronizarEstadoConSaldo(reserva);

  return pago;
}

/**
 * Calcula el saldo pendiente de una reserva: montoTotal - suma de todos los pagos.
 * Esta es la función que el frontend va a usar para el semáforo de colores.
 */
async function calcularSaldoPendiente(reservaId) {
  const reserva = await Reserva.findByPk(reservaId, { include: [{ model: Pago }] });
  if (!reserva) {
    throw new PagoError('La reserva no existe', 404);
  }

  const totalPagado = reserva.Pagos.reduce((acumulado, pago) => acumulado + Number(pago.monto), 0);
  const saldo = Number(reserva.montoTotal) - totalPagado;

  return Number(saldo.toFixed(2));
}

async function listarPagosDeReserva(reservaId) {
  const reserva = await Reserva.findByPk(reservaId);
  if (!reserva) {
    throw new PagoError('La reserva no existe', 404);
  }
  return Pago.findAll({ where: { reservaId }, order: [['fecha', 'ASC']] });
}

/**
 * Borra un cobro. Si la reserva estaba Pagada y con esto vuelve a deber,
 * regresa a Señada: si no, el semáforo la mostraría saldada para siempre.
 */
async function removerPago(id) {
  const pago = await Pago.findByPk(id);
  if (!pago) {
    throw new PagoError('El cobro no existe', 404);
  }

  await pago.destroy();

  const reserva = await Reserva.findByPk(pago.reservaId);
  if (reserva) {
    await sincronizarEstadoConSaldo(reserva);
  }
}

export {
  PagoError,
  registrarPago,
  calcularSaldoPendiente,
  listarPagosDeReserva,
  removerPago,
  sincronizarEstadoConSaldo,
};
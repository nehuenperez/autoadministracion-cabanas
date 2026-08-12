import { Pago, Reserva } from '../models/index.js';

class PagoError extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.status = status;
  }
}

/**
 * Registra un nuevo pago sobre una reserva existente.
 * Si el saldo pendiente llega a $0 después de este pago, actualiza
 * automáticamente el estado de la reserva a "Pagada".
 */
async function registrarPago(reservaId, datos) {
  const { monto, metodoPago, fecha } = datos;

  const reserva = await Reserva.findByPk(reservaId, { include: [{ model: Pago }] });
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
    fecha: fecha || new Date(),
  });

  const saldoPendiente = await calcularSaldoPendiente(reservaId);

  if (saldoPendiente <= 0 && reserva.estado === 'Señada') {
    await reserva.update({ estado: 'Pagada' });
  }

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

async function removerPago(id) {
  // Nota: Asegurate de que el modelo se llame "Pago" o como lo tengas importado arriba de todo
  return await Pago.destroy({ where: { id } });
}

export { PagoError, registrarPago, calcularSaldoPendiente, listarPagosDeReserva, removerPago };
import { Op } from 'sequelize';
import { Reserva, Cabana, Pago, Huesped } from '../models/index.js';
import { sincronizarEstadoConSaldo } from './pagos.service.js';
import { fechaDeHoy } from '../utils/fechas.js';
import { saldoPendiente } from '../utils/saldo.js';

class ReservaError extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.status = status;
  }
}

// Estados que efectivamente "ocupan" una cabaña en el calendario
const ESTADOS_QUE_BLOQUEAN = ['Señada', 'Pagada'];

/**
 * Chequea si una cabaña está disponible para un rango de fechas dado.
 * Dos rangos de fechas se solapan si: inicio1 < fin2 Y fin1 > inicio2.
 * Opcionalmente excluye una reserva puntual (útil al editar una reserva existente,
 * para no chocar contra sí misma).
 */
async function verificarDisponibilidad(cabanaId, fechaCheckIn, fechaCheckOut, reservaIdExcluir = null) {
  const where = {
    cabanaId,
    estado: { [Op.in]: ESTADOS_QUE_BLOQUEAN },
    fechaCheckIn: { [Op.lt]: fechaCheckOut },
    fechaCheckOut: { [Op.gt]: fechaCheckIn },
  };

  if (reservaIdExcluir) {
    where.id = { [Op.ne]: reservaIdExcluir };
  }

  const reservaConflicto = await Reserva.findOne({ where });

  return !reservaConflicto; // true = disponible, false = ocupada
}

/**
 * Calcula el monto de la seña a partir del total y el porcentaje.
 * Si no se manda porcentaje (o se manda 0), la seña queda en 0 — esto es intencional:
 * no se obliga a cargar un porcentaje, es una herramienta opcional para quien la quiera usar.
 */
function calcularMontoSena(montoTotal, porcentajeSena) {
  const porcentaje = porcentajeSena || 0;
  return Number((montoTotal * (porcentaje / 100)).toFixed(2));
}

/**
 * Crea una nueva reserva, validando disponibilidad antes.
 */
async function crearReserva(datos) {
  const { cabanaId, fechaCheckIn, fechaCheckOut, montoTotal, porcentajeSena } = datos;

  if (fechaCheckOut <= fechaCheckIn) {
    throw new ReservaError('La fecha de check-out debe ser posterior a la de check-in', 400);
  }

  const cabana = await Cabana.findByPk(cabanaId);
  if (!cabana) {
    throw new ReservaError('La cabaña seleccionada no existe', 404);
  }

  const disponible = await verificarDisponibilidad(cabanaId, fechaCheckIn, fechaCheckOut);
  if (!disponible) {
    throw new ReservaError('La cabaña no está disponible para esas fechas', 409);
  }

  const montoSena = calcularMontoSena(montoTotal, porcentajeSena);

  const reserva = await Reserva.create({
    cabanaId,
    fechaCheckIn,
    fechaCheckOut,
    montoTotal,
    porcentajeSena: porcentajeSena || 0,
    montoSena,
    estado: 'Señada',
  });

  return reserva;
}

/**
 * Edita una reserva existente, re-validando disponibilidad si cambian las fechas o la cabaña.
 */
async function editarReserva(id, datos) {
  const reserva = await Reserva.findByPk(id);
  if (!reserva) {
    throw new ReservaError('La reserva no existe', 404);
  }

  const cabanaId = datos.cabanaId ?? reserva.cabanaId;
  const fechaCheckIn = datos.fechaCheckIn ?? reserva.fechaCheckIn;
  const fechaCheckOut = datos.fechaCheckOut ?? reserva.fechaCheckOut;

  if (fechaCheckOut <= fechaCheckIn) {
    throw new ReservaError('La fecha de check-out debe ser posterior a la de check-in', 400);
  }

  const disponible = await verificarDisponibilidad(cabanaId, fechaCheckIn, fechaCheckOut, id);
  if (!disponible) {
    throw new ReservaError('La cabaña no está disponible para esas fechas', 409);
  }

  const montoTotal = datos.montoTotal ?? reserva.montoTotal;
  const porcentajeSena = datos.porcentajeSena ?? reserva.porcentajeSena;
  const montoSena = calcularMontoSena(montoTotal, porcentajeSena);

  await reserva.update({
    cabanaId,
    fechaCheckIn,
    fechaCheckOut,
    montoTotal,
    porcentajeSena,
    montoSena,
  });

  // Si cambió el total, una reserva Pagada puede volver a deber (o al revés)
  await sincronizarEstadoConSaldo(reserva);

  return reserva;
}

/**
 * Marca una reserva como Abortada (cancelación manual).
 * El dinero ya ingresado y el historial quedan guardados, solo cambia el estado.
 */
async function abortarReserva(id) {
  const reserva = await Reserva.findByPk(id);
  if (!reserva) {
    throw new ReservaError('La reserva no existe', 404);
  }

  await reserva.update({ estado: 'Abortada' });
  return reserva;
}

/**
 * Recalcula el estado de UNA reserva puntual según la fecha de hoy.
 * Si está Señada o Pagada y ya pasó el check-out, pasa a Finalizada.
 */
function calcularEstadoActual(reserva, hoy = fechaDeHoy()) {
  if (ESTADOS_QUE_BLOQUEAN.includes(reserva.estado) && reserva.fechaCheckOut < hoy) {
    return 'Finalizada';
  }
  return reserva.estado;
}

/**
 * Pasa a Finalizada toda reserva activa cuyo check-out ya pasó. Se llama al
 * principio de cada listado, así el estado siempre está al día sin que nadie
 * tenga que hacerlo a mano. Es la misma regla que calcularEstadoActual.
 */
async function actualizarEstadosVencidos() {
  await Reserva.update(
    { estado: 'Finalizada' },
    {
      where: {
        estado: { [Op.in]: ESTADOS_QUE_BLOQUEAN },
        fechaCheckOut: { [Op.lt]: fechaDeHoy() },
      },
    }
  );
}

const INCLUIR_TODO = [{ model: Cabana }, { model: Pago }, { model: Huesped }];

/** La reserva como JSON, con el saldo pendiente ya calculado. */
function conSaldo(reserva) {
  return { ...reserva.toJSON(), saldoPendiente: saldoPendiente(reserva.montoTotal, reserva.Pagos) };
}

async function listarReservasActivas() {
  await actualizarEstadosVencidos();
  const reservas = await Reserva.findAll({
    where: { estado: { [Op.in]: ESTADOS_QUE_BLOQUEAN } },
    include: INCLUIR_TODO,
    order: [['fechaCheckIn', 'ASC']],
  });
  return reservas.map(conSaldo);
}

async function listarReservasHistoricas() {
  await actualizarEstadosVencidos();
  const reservas = await Reserva.findAll({
    where: { estado: { [Op.in]: ['Finalizada', 'Abortada'] } },
    include: INCLUIR_TODO,
    order: [['fechaCheckIn', 'DESC']],
  });
  return reservas.map(conSaldo);
}

async function obtenerReservaPorId(id) {
  await actualizarEstadosVencidos();
  const reserva = await Reserva.findByPk(id, { include: INCLUIR_TODO });
  if (!reserva) {
    throw new ReservaError('La reserva no existe', 404);
  }
  return conSaldo(reserva);
}

export {
  ReservaError,
  verificarDisponibilidad,
  calcularMontoSena,
  calcularEstadoActual,
  crearReserva,
  editarReserva,
  abortarReserva,
  actualizarEstadosVencidos,
  listarReservasActivas,
  listarReservasHistoricas,
  obtenerReservaPorId,
};
import { Op } from 'sequelize';
import { Reserva, Pago, Cabana } from '../models/index.js';
import { fechaDeHoy, rangoDelMes } from '../utils/fechas.js';
import { totalCobrado, redondear } from '../utils/saldo.js';

class EstadisticaError extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.status = status;
  }
}

/**
 * mes y anio llegan como texto desde la query string. Se validan acá para
 * responder un 400 claro en lugar de dejar que una fecha inválida llegue a la
 * consulta.
 */
function validarPeriodo(valor, porDefecto, minimo, maximo, nombre) {
  if (valor === undefined || valor === null || valor === '') {
    return porDefecto;
  }

  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero < minimo || numero > maximo) {
    throw new EstadisticaError(`El parámetro "${nombre}" debe ser un número entre ${minimo} y ${maximo}`, 400);
  }

  return numero;
}

// Una reserva cancelada no ocupa la cabaña: no cuenta para la ocupación, pero
// lo que se le cobró (una seña que quedó) sí suma en los ingresos.
const ocupaLaCabana = (reserva) => reserva.estado !== 'Abortada';

/**
 * Informe de un mes:
 * - ingresosDelMes: lo cobrado en el mes, según la fecha de cada cobro (caja).
 * - totalReservas y reservasPorCabana: reservas con check-in en el mes, sin las canceladas.
 * - ingresosPorCabana: lo cobrado en esas reservas, sea cual sea la fecha del cobro.
 * - reservasPorEstado: todas las reservas del mes, canceladas incluidas.
 */
async function obtenerEstadisticas(mes, anio) {
  const [anioActual, mesActual] = fechaDeHoy().split('-').map(Number);
  const mesNum = validarPeriodo(mes, mesActual, 1, 12, 'mes');
  const anioNum = validarPeriodo(anio, anioActual, 2000, 2100, 'anio');
  const { inicio, fin } = rangoDelMes(mesNum, anioNum);

  const pagosDelMes = await Pago.findAll({
    where: { fecha: { [Op.gte]: inicio, [Op.lt]: fin } },
  });

  const reservasDelMes = await Reserva.findAll({
    where: { fechaCheckIn: { [Op.gte]: inicio, [Op.lt]: fin } },
    include: [{ model: Cabana }, { model: Pago }],
  });

  const reservasPorCabana = {};
  const ingresosPorCabana = {};
  const reservasPorEstado = { Señada: 0, Pagada: 0, Finalizada: 0, Abortada: 0 };

  for (const reserva of reservasDelMes) {
    if (reservasPorEstado[reserva.estado] !== undefined) {
      reservasPorEstado[reserva.estado]++;
    }

    if (!reserva.Cabana) continue;
    const cabana = reserva.Cabana.nombre;

    if (ocupaLaCabana(reserva)) {
      reservasPorCabana[cabana] = (reservasPorCabana[cabana] || 0) + 1;
    }
    ingresosPorCabana[cabana] = redondear((ingresosPorCabana[cabana] || 0) + totalCobrado(reserva.Pagos));
  }

  return {
    mes: mesNum,
    anio: anioNum,
    ingresosDelMes: totalCobrado(pagosDelMes),
    totalReservas: reservasDelMes.filter(ocupaLaCabana).length,
    reservasPorCabana,
    ingresosPorCabana,
    reservasPorEstado,
  };
}

export { obtenerEstadisticas, EstadisticaError };

import { Op } from 'sequelize';
import { Reserva, Pago, Cabana } from '../models/index.js';
import { fechaDeHoy, rangoDelMes } from '../utils/fechas.js';
import { totalCobrado, redondear } from '../utils/saldo.js';

/**
 * Devuelve estadísticas mensuales.
 * Caja General = Flujo de caja del mes.
 * Rendimiento por unidad = Suma de los cobros reales cargados a las reservas de este mes.
 */
class EstadisticaError extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.status = status;
  }
}

/**
 * mes y anio llegan crudos desde la query string. Sin validar, algo como
 * ?mes=abc daba Number('abc') = NaN, y new Date(NaN, ...) = Invalid Date,
 * que hacía fallar la consulta con un 500 en vez de un error claro.
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

async function obtenerEstadisticas(mes, anio) {
  const [anioActual, mesActual] = fechaDeHoy().split('-').map(Number);
  const mesNum = validarPeriodo(mes, mesActual, 1, 12, 'mes');
  const anioNum = validarPeriodo(anio, anioActual, 2000, 2100, 'anio');

  const { inicio: inicioMes, fin: finMes } = rangoDelMes(mesNum, anioNum);

  // 1. CAJA GENERAL: Flujo de caja físico que entró al bolsillo estrictamente este mes
  const pagosDelMes = await Pago.findAll({
    where: { fecha: { [Op.gte]: inicioMes, [Op.lt]: finMes } },
  });
  const ingresosDelMes = totalCobrado(pagosDelMes);

  // 2. RESERVAS DEL MES: Traemos las reservas del período e incluimos sus cobros reales
  const reservasDelMes = await Reserva.findAll({
    where: { fechaCheckIn: { [Op.gte]: inicioMes, [Op.lt]: finMes } },
    include: [
      { model: Cabana },
      { model: Pago } // Traemos el historial de cobros cargados a cada reserva (señas + saldos)
    ],
  });

  // La ocupación cuenta sólo las estadías que se concretan o se van a concretar:
  // una reserva cancelada no ocupa la cabaña. Su plata cobrada (una seña que
  // quedó) sí suma en los ingresos, y la cancelación se ve en reservasPorEstado.
  const ocupan = (reserva) => reserva.estado !== 'Abortada';
  const totalReservas = reservasDelMes.filter(ocupan).length;

  const reservasPorCabana = {};
  const ingresosPorCabana = {};

  for (const reserva of reservasDelMes) {
    if (reserva.Cabana) {
      const nombreCabana = reserva.Cabana.nombre;

      // Contamos la cantidad de reservas de la unidad
      if (ocupan(reserva)) {
        reservasPorCabana[nombreCabana] = (reservasPorCabana[nombreCabana] || 0) + 1;
      }

      // Lo cobrado de verdad en las reservas del mes (no el montoTotal pactado)
      ingresosPorCabana[nombreCabana] = redondear(
        (ingresosPorCabana[nombreCabana] || 0) + totalCobrado(reserva.Pagos)
      );
    }
  }

  const reservasPorEstado = { Señada: 0, Pagada: 0, Finalizada: 0, Abortada: 0 };
  for (const reserva of reservasDelMes) {
    if (reservasPorEstado[reserva.estado] !== undefined) {
      reservasPorEstado[reserva.estado]++;
    }
  }

  return {
    mes: mesNum,
    anio: anioNum,
    ingresosDelMes,
    totalReservas,
    reservasPorCabana,
    ingresosPorCabana, // Enviamos los cobros reales sumados por cada unidad
    reservasPorEstado,
  };
}

export { obtenerEstadisticas, EstadisticaError };
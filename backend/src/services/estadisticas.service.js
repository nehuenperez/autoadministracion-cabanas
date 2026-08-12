import { Op } from 'sequelize';
import { Reserva, Pago, Cabana } from '../models/index.js';

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
  const fecha = new Date();
  const mesNum = validarPeriodo(mes, fecha.getMonth() + 1, 1, 12, 'mes');
  const anioNum = validarPeriodo(anio, fecha.getFullYear(), 2000, 2100, 'anio');

  const inicioMes = new Date(anioNum, mesNum - 1, 1);
  const finMes = new Date(anioNum, mesNum, 1);

  // 1. CAJA GENERAL: Flujo de caja físico que entró al bolsillo estrictamente este mes
  const pagosDelMes = await Pago.findAll({
    where: { fecha: { [Op.gte]: inicioMes, [Op.lt]: finMes } },
  });
  const ingresosDelMes = pagosDelMes.reduce((acum, p) => acum + Number(p.monto), 0);

  // 2. RESERVAS DEL MES: Traemos las reservas del período e incluimos sus cobros reales
  const reservasDelMes = await Reserva.findAll({
    where: { fechaCheckIn: { [Op.gte]: inicioMes, [Op.lt]: finMes } },
    include: [
      { model: Cabana },
      { model: Pago } // Traemos el historial de cobros cargados a cada reserva (señas + saldos)
    ],
  });

  const totalReservas = reservasDelMes.length;

  const reservasPorCabana = {};
  const ingresosPorCabana = {}; 

  for (const reserva of reservasDelMes) {
    if (reserva.Cabana) {
      const nombreCabana = reserva.Cabana.nombre;
      
      // Contamos la cantidad de reservas de la unidad
      reservasPorCabana[nombreCabana] = (reservasPorCabana[nombreCabana] || 0) + 1;
      
      // Inicializamos la cabaña en el desglose financiero si no existe
      if (ingresosPorCabana[nombreCabana] === undefined) {
        ingresosPorCabana[nombreCabana] = 0;
      }

      // CORRECCIÓN CLAVE: Sumamos los importes reales cobrados de la reserva (no el montoTotal)
      // Usamos un fallback por si el alias de Sequelize está en mayúscula o minúscula
      const listaCobros = reserva.Pagos || reserva.pagos || [];
      for (const cobro of listaCobros) {
        ingresosPorCabana[nombreCabana] += Number(cobro.monto || 0);
      }
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
    ingresosDelMes: Number(ingresosDelMes.toFixed(2)),
    totalReservas,
    reservasPorCabana,
    ingresosPorCabana, // Enviamos los cobros reales sumados por cada unidad
    reservasPorEstado,
  };
}

export { obtenerEstadisticas, EstadisticaError };
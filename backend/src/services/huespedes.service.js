import { Huesped, Reserva, ReservaHuesped } from '../models/index.js';

class HuespedError extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.status = status;
  }
}

/**
 * Busca un huésped por DNI. Devuelve null si no existe (no es un error,
 * es el caso normal de un cliente nuevo que todavía no está en la base).
 */
async function buscarPorDni(dni) {
  return Huesped.findOne({ where: { dni } });
}

// Campos que el cliente tiene permitido escribir. Todo lo demás que venga en el body
// (id, createdAt, updatedAt, o cualquier columna futura) se descarta.
const CAMPOS_EDITABLES_HUESPED = [
  'nombre',
  'apellido',
  'dni',
  'cuil',
  'telefono',
  'direccion',
  'vehiculoModelo',
  'vehiculoPatente',
  'notasComportamiento',
];

function soloCamposPermitidos(datos, permitidos) {
  const limpio = {};
  for (const campo of permitidos) {
    if (datos[campo] !== undefined) {
      limpio[campo] = datos[campo];
    }
  }
  return limpio;
}

/**
 * Crea un huésped nuevo, o si ya existe ese DNI, actualiza sus datos
 * (por si cambió de domicilio, auto, etc. de una visita a otra) y lo devuelve.
 */
async function crearOActualizarHuesped(datos) {
  const payload = soloCamposPermitidos(datos || {}, CAMPOS_EDITABLES_HUESPED);
  const { dni } = payload;

  if (!dni) {
    throw new HuespedError('El DNI es obligatorio', 400);
  }

  if (!payload.nombre || !payload.apellido) {
    throw new HuespedError('El nombre y el apellido son obligatorios', 400);
  }

  const existente = await Huesped.findOne({ where: { dni } });

  if (existente) {
    await existente.update(payload);
    return existente;
  }

  return Huesped.create(payload);
}

/**
 * Actualiza únicamente la nota de comportamiento de un huésped (historial).
 */
async function actualizarNotas(huespedId, notasComportamiento) {
  const huesped = await Huesped.findByPk(huespedId);
  if (!huesped) {
    throw new HuespedError('El huésped no existe', 404);
  }

  await huesped.update({ notasComportamiento });
  return huesped;
}

/**
 * Vincula un grupo de huéspedes (titular + acompañantes) a una reserva existente.
 * Recibe un array como:
 * [{ huespedId: 1, rol: 'titular' }, { huespedId: 2, rol: 'acompañante' }]
 */
async function vincularHuespedesAReserva(reservaId, huespedesConRol) {
  const reserva = await Reserva.findByPk(reservaId);
  if (!reserva) {
    throw new HuespedError('La reserva no existe', 404);
  }

  const titulares = huespedesConRol.filter((h) => h.rol === 'titular');
  if (titulares.length !== 1) {
    throw new HuespedError('Una reserva debe tener exactamente un titular', 400);
  }

  // Reemplaza los vínculos existentes por los nuevos (útil tanto para alta como para edición)
  await ReservaHuesped.destroy({ where: { reservaId } });

  const registros = huespedesConRol.map((h) => ({
    reservaId,
    huespedId: h.huespedId,
    rol: h.rol,
  }));

  await ReservaHuesped.bulkCreate(registros);

  return Reserva.findByPk(reservaId, {
    include: [{ model: Huesped }],
  });
}

/**
 * Devuelve el historial completo de reservas de un huésped (para ver visitas pasadas).
 */
async function historialDeHuesped(huespedId) {
  const huesped = await Huesped.findByPk(huespedId, {
    include: [{ model: Reserva }],
  });
  if (!huesped) {
    throw new HuespedError('El huésped no existe', 404);
  }
  return huesped;
}

export {
  HuespedError,
  buscarPorDni,
  crearOActualizarHuesped,
  actualizarNotas,
  vincularHuespedesAReserva,
  historialDeHuesped,
};
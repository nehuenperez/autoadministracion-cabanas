import { sequelize, Huesped, Reserva, ReservaHuesped } from '../models/index.js';

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

  const ids = huespedesConRol.map((h) => h.huespedId);
  if (new Set(ids).size !== ids.length) {
    throw new HuespedError('El mismo huésped está cargado dos veces', 400);
  }

  const existentes = await Huesped.count({ where: { id: ids } });
  if (existentes !== ids.length) {
    throw new HuespedError('Alguno de los huéspedes no existe', 404);
  }

  const registros = huespedesConRol.map((h) => ({
    reservaId,
    huespedId: h.huespedId,
    rol: h.rol,
  }));

  // Reemplaza los vínculos existentes por los nuevos (útil tanto para alta como para edición).
  // En una transacción: si el alta falla, el borrado se deshace y la reserva
  // no se queda sin huéspedes.
  await sequelize.transaction(async (transaction) => {
    await ReservaHuesped.destroy({ where: { reservaId }, transaction });
    await ReservaHuesped.bulkCreate(registros, { transaction });
  });

  return Reserva.findByPk(reservaId, {
    include: [{ model: Huesped }],
  });
}

export { HuespedError, buscarPorDni, crearOActualizarHuesped, vincularHuespedesAReserva };
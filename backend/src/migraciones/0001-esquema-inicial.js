import { DataTypes } from 'sequelize';

/**
 * Esquema inicial: las seis tablas tal como estaban en producción cuando se
 * empezó a usar migraciones (antes se creaban con sequelize.sync).
 *
 * Contra una base que ya tiene datos esta migración no cambia nada: cada
 * tabla se crea sólo si no existe, y la columna `cuil` (que se agregó
 * después, a mano) se asegura con ADD COLUMN IF NOT EXISTS. Contra una base
 * vacía deja el mismo esquema que generaba sync.
 */

const id = { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false };
const timestamps = {
  createdAt: { type: DataTypes.DATE, allowNull: false },
  updatedAt: { type: DataTypes.DATE, allowNull: false },
};

function claveForanea(tabla, onDelete, allowNull = true) {
  return {
    type: DataTypes.INTEGER,
    allowNull,
    references: { model: tabla, key: 'id' },
    onDelete,
    onUpdate: 'CASCADE',
  };
}

const TABLAS = [
  ['cabanas', {
    id,
    nombre: { type: DataTypes.STRING, allowNull: false, unique: true },
    capacidad: { type: DataTypes.INTEGER, allowNull: false },
    ...timestamps,
  }],
  ['usuarios', {
    id,
    nombreUsuario: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    ...timestamps,
  }],
  ['huespedes', {
    id,
    nombre: { type: DataTypes.STRING, allowNull: false },
    apellido: { type: DataTypes.STRING, allowNull: false },
    dni: { type: DataTypes.STRING, allowNull: false, unique: true },
    cuil: { type: DataTypes.STRING, allowNull: true },
    telefono: { type: DataTypes.STRING, allowNull: true },
    direccion: { type: DataTypes.STRING, allowNull: true },
    vehiculoModelo: { type: DataTypes.STRING, allowNull: true },
    vehiculoPatente: { type: DataTypes.STRING, allowNull: true },
    notasComportamiento: { type: DataTypes.TEXT, allowNull: true },
    ...timestamps,
  }],
  ['reservas', {
    id,
    fechaCheckIn: { type: DataTypes.DATEONLY, allowNull: false },
    fechaCheckOut: { type: DataTypes.DATEONLY, allowNull: false },
    montoTotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    porcentajeSena: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    montoSena: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    estado: {
      type: DataTypes.ENUM('Señada', 'Pagada', 'Finalizada', 'Abortada'),
      allowNull: false,
      defaultValue: 'Señada',
    },
    ...timestamps,
    cabanaId: claveForanea('cabanas', 'SET NULL'),
  }],
  ['pagos', {
    id,
    monto: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    metodoPago: { type: DataTypes.ENUM('Efectivo', 'Transferencia'), allowNull: false },
    ...timestamps,
    reservaId: claveForanea('reservas', 'CASCADE'),
  }],
  ['reserva_huespedes', {
    id,
    rol: { type: DataTypes.ENUM('titular', 'acompañante'), allowNull: false },
    ...timestamps,
    reservaId: claveForanea('reservas', 'CASCADE'),
    huespedId: claveForanea('huespedes', 'CASCADE'),
  }],
];

async function up({ context: queryInterface }) {
  await queryInterface.sequelize.transaction(async (transaction) => {
    const existentes = new Set();
    for (const [tabla] of TABLAS) {
      if (await queryInterface.tableExists(tabla, { transaction })) existentes.add(tabla);
    }

    for (const [tabla, columnas] of TABLAS) {
      if (!existentes.has(tabla)) {
        await queryInterface.createTable(tabla, columnas, { transaction });
      }
    }

    // Un huésped no puede figurar dos veces en la misma reserva
    if (!existentes.has('reserva_huespedes')) {
      await queryInterface.addConstraint('reserva_huespedes', {
        fields: ['reservaId', 'huespedId'],
        type: 'unique',
        name: 'reserva_huespedes_reservaId_huespedId_key',
        transaction,
      });
    }

    await queryInterface.sequelize.query(
      'ALTER TABLE huespedes ADD COLUMN IF NOT EXISTS cuil VARCHAR(255);',
      { transaction }
    );
  });
}

// No hay vuelta atrás: deshacer el esquema inicial sería borrar todos los datos.
async function down() {
  throw new Error('El esquema inicial no se puede deshacer.');
}

export { up, down };

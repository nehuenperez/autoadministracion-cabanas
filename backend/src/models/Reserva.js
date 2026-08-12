import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Reserva = sequelize.define('Reserva', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fechaCheckIn: {
    type: DataTypes.DATEONLY, // DATEONLY = solo fecha, sin hora
    allowNull: false,
  },
  fechaCheckOut: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  montoTotal: {
    type: DataTypes.DECIMAL(10, 2), // hasta 99,999,999.99 - evita errores de redondeo de los floats
    allowNull: false,
  },
  porcentajeSena: {
    type: DataTypes.DECIMAL(5, 2), // ej: 30.00 significa 30%
    allowNull: false,
    defaultValue: 0,
  },
  montoSena: {
    type: DataTypes.DECIMAL(10, 2), // se calcula en el backend a partir del porcentaje, nunca lo manda el frontend
    allowNull: false,
    defaultValue: 0,
  },
  estado: {
    type: DataTypes.ENUM('Señada', 'Pagada', 'Finalizada', 'Abortada'),
    allowNull: false,
    defaultValue: 'Señada',
  },
}, {
  tableName: 'reservas',
  timestamps: true,
});

export default Reserva;
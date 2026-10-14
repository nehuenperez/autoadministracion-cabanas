import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Huesped = sequelize.define('Huesped', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  apellido: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dni: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // clave para el autocompletado: un huésped = un DNI
  },
  cuil: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  telefono: {
  type: DataTypes.STRING,
  allowNull: true,
  },
  direccion: {
    type: DataTypes.STRING,
    allowNull: true, // solo se pide al titular, los acompañantes pueden no tenerlo
  },
  vehiculoModelo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  vehiculoPatente: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  notasComportamiento: {
    type: DataTypes.TEXT,
    allowNull: true, // el historial de comportamiento, opcional
  },
}, {
  tableName: 'huespedes',
  timestamps: true,
});

export default Huesped;
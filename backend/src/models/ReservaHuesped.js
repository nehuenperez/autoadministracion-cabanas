import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ReservaHuesped = sequelize.define('ReservaHuesped', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  rol: {
    type: DataTypes.ENUM('titular', 'acompañante'),
    allowNull: false,
  },
}, {
  tableName: 'reserva_huespedes',
  timestamps: true,
});

export default ReservaHuesped;
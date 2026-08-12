import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Pago = sequelize.define('Pago', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  metodoPago: {
    type: DataTypes.ENUM('Efectivo', 'Transferencia'),
    allowNull: false,
  },
}, {
  tableName: 'pagos',
  timestamps: true,
});

export default Pago;
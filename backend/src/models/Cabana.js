import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Cabana = sequelize.define('Cabana', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // no puede haber dos cabañas con el mismo nombre
  },
  capacidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'cabanas',
  timestamps: true, // agrega createdAt y updatedAt automáticamente
});

export default Cabana;
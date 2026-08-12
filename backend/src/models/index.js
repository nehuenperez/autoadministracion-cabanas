import sequelize from '../config/database.js';
import Cabana from './Cabana.js';
import Huesped from './Huesped.js';
import Reserva from './Reserva.js';
import ReservaHuesped from './ReservaHuesped.js';
import Pago from './Pago.js';
import Usuario from './Usuario.js';

// --- Cabana <-> Reserva ---
Cabana.hasMany(Reserva, { foreignKey: 'cabanaId' });
Reserva.belongsTo(Cabana, { foreignKey: 'cabanaId' });

// --- Reserva <-> Pago ---
Reserva.hasMany(Pago, { foreignKey: 'reservaId', onDelete: 'CASCADE' });
Pago.belongsTo(Reserva, { foreignKey: 'reservaId' });

// --- Reserva <-> Huesped (muchos a muchos, a través de ReservaHuesped) ---
Reserva.belongsToMany(Huesped, {
  through: ReservaHuesped,
  foreignKey: 'reservaId',
  otherKey: 'huespedId',
});
Huesped.belongsToMany(Reserva, {
  through: ReservaHuesped,
  foreignKey: 'huespedId',
  otherKey: 'reservaId',
});

export { sequelize, Cabana, Huesped, Reserva, ReservaHuesped, Pago, Usuario };
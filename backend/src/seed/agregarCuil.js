import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from '../models/index.js';

/**
 * Agrega la columna `cuil` a la tabla de huéspedes.
 *
 * Es la alternativa segura a DB_SYNC para una base que ya tiene datos: sólo
 * agrega una columna vacía y no toca nada más. Se puede correr más de una vez
 * sin problema (IF NOT EXISTS).
 */
async function agregarCuil() {
  try {
    await sequelize.authenticate();
    await sequelize.query('ALTER TABLE huespedes ADD COLUMN IF NOT EXISTS cuil VARCHAR(255);');
    console.log('✅ Columna "cuil" lista en la tabla huespedes.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al agregar la columna cuil:', error.message);
    process.exit(1);
  }
}

agregarCuil();

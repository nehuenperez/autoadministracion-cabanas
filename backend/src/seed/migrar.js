import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from '../models/index.js';
import { migrar } from '../config/migraciones.js';

/**
 * Aplica las migraciones pendientes sin levantar el servidor.
 *
 *   npm run migrar
 *
 * El servidor ya lo hace al arrancar; esto sirve para preparar una base nueva
 * antes de cargar las cabañas y el usuario.
 */
async function ejecutar() {
  try {
    await sequelize.authenticate();
    const aplicadas = await migrar();
    console.log(aplicadas.length ? `✅ Aplicadas: ${aplicadas.join(', ')}` : '✅ El esquema ya estaba al día.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al aplicar las migraciones:', error.message);
    process.exit(1);
  }
}

ejecutar();

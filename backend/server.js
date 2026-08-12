import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import { sequelize } from './src/models/index.js';

const PORT = process.env.PORT || 3000;

// Sin JWT_SECRET, jwt.sign() genera tokens inseguros o rompe en runtime con un 500
// que parece un error de credenciales. Mejor fallar acá, al arrancar, y no en el login.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error(
    '❌ JWT_SECRET no está definido o es demasiado corto (mínimo 32 caracteres). El servidor no arranca.'
  );
  process.exit(1);
}

/**
 * sequelize.sync({ alter: true }) inspecciona las tablas y las MODIFICA para que
 * coincidan con los modelos. Contra la base de producción eso puede renombrar o
 * borrar columnas con datos reales de reservas. Queda desactivado por defecto y
 * sólo se ejecuta si lo pedís explícitamente con DB_SYNC=true (para desarrollo).
 */
const debeSincronizar = process.env.DB_SYNC === 'true';

async function iniciar() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');

    if (debeSincronizar) {
      console.warn('⚠️  DB_SYNC=true: sincronizando modelos con ALTER. No usar contra producción.');
      await sequelize.sync({ alter: true });
      console.log('✅ Modelos sincronizados con la base de datos.');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error.message);
    process.exit(1);
  }
}

iniciar();

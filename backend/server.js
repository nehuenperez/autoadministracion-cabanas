import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import { sequelize } from './src/models/index.js';
import { migrar } from './src/config/migraciones.js';

const PORT = process.env.PORT || 3000;

// Sin JWT_SECRET, jwt.sign() genera tokens inseguros o rompe en runtime con un 500
// que parece un error de credenciales. Mejor fallar acá, al arrancar, y no en el login.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error(
    '❌ JWT_SECRET no está definido o es demasiado corto (mínimo 32 caracteres). El servidor no arranca.'
  );
  process.exit(1);
}

async function iniciar() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');

    // Aplica sólo las migraciones que falten (src/migraciones). Con la base al
    // día no hace nada, así que es seguro en cada arranque.
    const aplicadas = await migrar();
    console.log(
      aplicadas.length ? `✅ Migraciones aplicadas: ${aplicadas.join(', ')}` : '✅ Esquema al día.'
    );

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error.message);
    process.exit(1);
  }
}

iniciar();

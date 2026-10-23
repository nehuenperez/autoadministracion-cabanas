import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from '../models/index.js';

// Borra TODAS las reservas, huéspedes y pagos de la base a la que apunte
// DATABASE_URL, que puede ser la de producción. Para que un error de tipeo no
// vacíe los datos reales, exige una confirmación explícita:
//   CONFIRMAR_BORRADO=SI_BORRAR_TODO node src/seed/limpiarBase.js
async function vaciarDatosDePrueba() {
  try {
    if (process.env.CONFIRMAR_BORRADO !== 'SI_BORRAR_TODO') {
      console.error(
        '❌ Operación destructiva bloqueada.\n' +
          '   Este script vacía reservas, huéspedes y pagos de la base apuntada por DATABASE_URL.\n' +
          '   Si estás seguro, corré: CONFIRMAR_BORRADO=SI_BORRAR_TODO node src/seed/limpiarBase.js'
      );
      process.exit(1);
    }

    console.log('Conectando a Supabase...');
    await sequelize.authenticate();
    
    console.log('Iniciando vaciado de tablas dependientes...');
    
    // Ejecutamos un TRUNCATE directo mediante query nativa para evitar conflictos de claves foráneas (FK)
    // y resetear los contadores auto-incrementales a 1.
    // Los nombres son los `tableName` de los modelos, no los nombres por defecto de Sequelize.
    await sequelize.query('TRUNCATE TABLE pagos, reserva_huespedes, reservas, huespedes RESTART IDENTITY CASCADE;');
    
    console.log('✨ Base de datos limpia de manera exitosa.');
    console.log('Cabañas y Usuarios permanecen intactos.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la ejecución de la limpieza:', error);
    process.exit(1);
  }
}

vaciarDatosDePrueba();
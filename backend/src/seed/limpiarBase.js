import { sequelize } from '../models/index.js';

// Este script borra TODAS las reservas, huéspedes y pagos de la base a la que apunte
// DATABASE_URL — que hoy es la de producción. Se corría sin ninguna confirmación:
// un `node src/seed/limpiarBase.js` por error vaciaba los datos reales.
// Ahora exige una confirmación explícita:
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
    await sequelize.query('TRUNCATE TABLE "Pagos", "ReservaHuespeds", "Reservas", "Huespeds" RESTART IDENTITY CASCADE;');
    
    console.log('✨ Base de datos limpia de manera exitosa.');
    console.log('Cabañas y Usuarios permanecen intactos.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la ejecución de la limpieza:', error);
    process.exit(1);
  }
}

vaciarDatosDePrueba();
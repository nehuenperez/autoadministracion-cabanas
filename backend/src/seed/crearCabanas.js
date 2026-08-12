import dotenv from 'dotenv';
dotenv.config();

import { sequelize, Cabana } from '../models/index.js';

async function crearCabanas() {
  try {
    await sequelize.authenticate();

    const cabanasExistentes = await Cabana.count();
    if (cabanasExistentes > 0) {
      console.log('⚠️  Ya existen cabañas cargadas. No se creó ninguna nueva.');
      process.exit(0);
    }

    await Cabana.bulkCreate([
      { nombre: 'Estudio familiar', capacidad: 4 },
      { nombre: 'Dos ambientes', capacidad: 6 },
    ]);

    console.log('✅ Cabañas creadas correctamente.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear las cabañas:', error);
    process.exit(1);
  }
}

crearCabanas();
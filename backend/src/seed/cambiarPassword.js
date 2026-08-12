import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { sequelize, Usuario } from '../models/index.js';
import { crearInterfaz, preguntar, pedirPasswordConfirmada } from './consola.js';

/**
 * Cambia la contraseña de un usuario existente.
 *
 *   node src/seed/cambiarPassword.js
 *
 * La contraseña se pide por consola y no se muestra al tipearla. No se acepta
 * por argumento ni por variable de entorno a propósito: así no queda en el
 * historial de la terminal ni en la lista de procesos.
 *
 * Lo único que se escribe en la base es el hash. La contraseña en texto plano
 * nunca se persiste ni se loguea.
 */

const SALT_ROUNDS = 12;

async function cambiarPassword() {
  const rl = crearInterfaz();

  try {
    const nombreUsuario = await preguntar(rl, 'Usuario al que le querés cambiar la contraseña: ');

    if (!nombreUsuario) {
      throw new Error('El nombre de usuario no puede estar vacío.');
    }

    await sequelize.authenticate();

    const usuario = await Usuario.findOne({ where: { nombreUsuario } });
    if (!usuario) {
      throw new Error(`No existe ningún usuario con el nombre "${nombreUsuario}".`);
    }

    console.log(`\nUsuario encontrado (id ${usuario.id}). Ingresá la contraseña nueva.\n`);

    const passwordNueva = await pedirPasswordConfirmada(rl, 'Contraseña nueva: ');

    const esLaMisma = await bcrypt.compare(passwordNueva, usuario.passwordHash);
    if (esLaMisma) {
      throw new Error('La contraseña nueva es igual a la actual. Elegí una distinta.');
    }

    usuario.passwordHash = await bcrypt.hash(passwordNueva, SALT_ROUNDS);
    await usuario.save();

    console.log(`\n✅ Contraseña de "${nombreUsuario}" actualizada correctamente.`);
    console.log('   Las sesiones abiertas siguen siendo válidas hasta que venza su token.');
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

cambiarPassword();

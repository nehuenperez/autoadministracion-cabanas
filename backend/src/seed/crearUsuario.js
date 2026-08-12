import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { sequelize, Usuario } from '../models/index.js';
import { crearInterfaz, preguntar, pedirPasswordConfirmada, LARGO_MINIMO_PASSWORD } from './consola.js';

/**
 * Crea el usuario con el que se entra al sistema.
 *
 *   node src/seed/crearUsuario.js
 *
 * No hay endpoint público de registro: los usuarios se crean sólo con este
 * script, corriéndolo con acceso a la base. Las credenciales nunca se
 * hardcodean acá — lo que se escribe en este archivo queda en git para siempre.
 *
 * Para entornos automatizados se pueden pasar por variables de entorno y el
 * script no pregunta nada:
 *   SEED_USUARIO=... SEED_PASSWORD=... node src/seed/crearUsuario.js
 */

const SALT_ROUNDS = 12;

async function obtenerCredenciales() {
  if (process.env.SEED_USUARIO && process.env.SEED_PASSWORD) {
    return { nombreUsuario: process.env.SEED_USUARIO, password: process.env.SEED_PASSWORD };
  }

  const rl = crearInterfaz();
  try {
    const nombreUsuario = await preguntar(rl, 'Nombre de usuario: ');
    const password = await pedirPasswordConfirmada(rl);
    return { nombreUsuario, password };
  } finally {
    rl.close();
  }
}

async function crearUsuario() {
  try {
    const { nombreUsuario, password } = await obtenerCredenciales();

    if (!nombreUsuario) {
      throw new Error('El nombre de usuario no puede estar vacío.');
    }

    if (password.length < LARGO_MINIMO_PASSWORD) {
      throw new Error(`La contraseña debe tener al menos ${LARGO_MINIMO_PASSWORD} caracteres.`);
    }

    await sequelize.authenticate();

    const existente = await Usuario.findOne({ where: { nombreUsuario } });
    if (existente) {
      console.log('⚠️  Ya existe un usuario con ese nombre. No se creó ninguno nuevo.');
      console.log('   Si querés cambiarle la contraseña usá: node src/seed/cambiarPassword.js');
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const usuario = await Usuario.create({ nombreUsuario, passwordHash });

    console.log('✅ Usuario creado correctamente:');
    console.log({ id: usuario.id, nombreUsuario: usuario.nombreUsuario });
    process.exit(0);
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
}

crearUsuario();

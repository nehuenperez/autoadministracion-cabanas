/**
 * Preparación para los tests que necesitan una base de datos de verdad.
 *
 * Igual que ayudas.js, tiene que importarse ANTES que cualquier cosa que cargue
 * la configuración de la base: levanta un Postgres descartable y apunta
 * DATABASE_URL a él. La base de producción nunca entra en juego.
 *
 * Cada archivo de test corre en su propio proceso y, por lo tanto, con su
 * propio Postgres.
 */
import pg from 'pg';
import { levantarPostgres } from './postgresDePrueba.js';

process.env.NODE_ENV = 'test';
process.env.DB_SSL = 'false';
process.env.JWT_SECRET = 'secreto-solo-para-tests-con-largo-suficiente-1234567890';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CORS_ORIGINS = 'http://localhost:5173';

const servidor = await levantarPostgres();
process.env.DATABASE_URL = servidor.url;

/** Crea otra base vacía en el mismo servidor y devuelve su URL. */
async function crearBase(nombre, { plantilla } = {}) {
  const cliente = new pg.Client({ connectionString: servidor.url });
  await cliente.connect();
  await cliente.query(`CREATE DATABASE ${nombre}${plantilla ? ` TEMPLATE ${plantilla}` : ''}`);
  await cliente.end();
  return servidor.url.replace(/\/postgres$/, `/${nombre}`);
}

/** Cierra las conexiones de Sequelize y apaga el Postgres de prueba. */
async function cerrarBase() {
  const { sequelize } = await import('../src/models/index.js');
  await sequelize.close();
  await servidor.apagar();
}

export { crearBase, cerrarBase };

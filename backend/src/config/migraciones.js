import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Umzug, SequelizeStorage } from 'umzug';
import sequelize from './database.js';

/**
 * Migraciones del esquema de la base.
 *
 * Cada cambio de estructura (una tabla nueva, una columna) es un archivo en
 * src/migraciones/ que se aplica una sola vez. La tabla `migraciones` de la
 * base registra cuáles ya corrieron, así que aplicar las pendientes es seguro
 * de repetir: es lo que hace el servidor cada vez que arranca.
 *
 * Reemplaza a sequelize.sync({ alter: true }), que comparaba los modelos con
 * la base y la modificaba a ciegas, sin registro de qué cambió.
 */
const carpeta = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../migraciones');

const umzug = new Umzug({
  migrations: {
    glob: ['*.js', { cwd: carpeta }],
    resolve: ({ name, path: ruta, context }) => ({
      name,
      up: async () => (await import(pathToFileURL(ruta).href)).up({ context }),
      down: async () => (await import(pathToFileURL(ruta).href)).down({ context }),
    }),
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, tableName: 'migraciones' }),
  logger: process.env.NODE_ENV === 'test' ? undefined : console,
});

/** Aplica las migraciones pendientes y devuelve los nombres de las que corrió. */
async function migrar() {
  const aplicadas = await umzug.up();
  return aplicadas.map((m) => m.name);
}

export { migrar, umzug };

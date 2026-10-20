import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import pg from 'pg';
import { Sequelize } from 'sequelize';

import { crearBase, cerrarBase } from './conBase.js';

/**
 * Las migraciones y los modelos describen la misma base desde dos lados. Si se
 * desfasan (alguien agrega una columna al modelo y se olvida de la migración),
 * la app consulta columnas que no existen y se rompe en producción.
 *
 * Este test arma una base con sequelize.sync() (lo que piden los modelos) y
 * otra corriendo las migraciones, y exige que sean idénticas.
 */

const carpetaMigraciones = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/migraciones');

async function describirEsquema(url) {
  const cliente = new pg.Client({ connectionString: url });
  await cliente.connect();
  const consultar = async (sql) => (await cliente.query(sql)).rows;

  const esquema = {
    columnas: await consultar(`
      SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default,
             character_maximum_length, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name <> 'migraciones'
      ORDER BY table_name, column_name`),
    enums: await consultar(`
      SELECT t.typname, string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) AS valores
      FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
      GROUP BY t.typname ORDER BY t.typname`),
    // Se comparan las definiciones y no los nombres de las restricciones
    restricciones: await consultar(`
      SELECT conrelid::regclass::text AS tabla, pg_get_constraintdef(oid) AS definicion
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace AND conrelid::regclass::text <> 'migraciones'
      ORDER BY 1, 2`),
  };

  await cliente.end();
  return esquema;
}

let porModelos;
let porMigraciones;

before(async () => {
  const { sequelize } = await import('../src/models/index.js');
  await sequelize.sync();
  porModelos = await describirEsquema(process.env.DATABASE_URL);

  const url = await crearBase('por_migraciones');
  const instancia = new Sequelize(url, { logging: false });
  const archivos = fs.readdirSync(carpetaMigraciones).filter((a) => a.endsWith('.js')).sort();
  for (const archivo of archivos) {
    const { up } = await import(pathToFileURL(path.join(carpetaMigraciones, archivo)).href);
    await up({ context: instancia.getQueryInterface() });
  }
  await instancia.close();
  porMigraciones = await describirEsquema(url);
});

after(() => cerrarBase());

describe('Las migraciones generan el mismo esquema que los modelos', () => {
  it('mismas tablas y columnas, con los mismos tipos, nulos y valores por defecto', () => {
    // Guarda: si la consulta viniera vacía, el test pasaría sin comparar nada
    assert.ok(porModelos.columnas.length > 40 && porModelos.restricciones.length > 10);
    assert.deepEqual(porMigraciones.columnas, porModelos.columnas);
  });

  it('mismos enums', () => {
    assert.deepEqual(porMigraciones.enums, porModelos.enums);
  });

  it('mismas claves primarias, únicas y foráneas', () => {
    assert.deepEqual(porMigraciones.restricciones, porModelos.restricciones);
  });
});

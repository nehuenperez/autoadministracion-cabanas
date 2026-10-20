import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';

import { cerrarBase } from './conBase.js';

/**
 * La prueba que importa antes de deployar: correr las migraciones contra una
 * base como la de producción —creada con sequelize.sync, sin la tabla de
 * migraciones y con datos cargados— no puede cambiar ni un solo dato.
 */

const TABLAS = ['cabanas', 'usuarios', 'huespedes', 'reservas', 'pagos', 'reserva_huespedes'];

let cliente;
let modelos;
let migrar;

async function fotoDeLosDatos() {
  const foto = {};
  for (const tabla of TABLAS) {
    foto[tabla] = (await cliente.query(`SELECT * FROM ${tabla} ORDER BY id`)).rows;
  }
  return foto;
}

before(async () => {
  modelos = await import('../src/models/index.js');
  ({ migrar } = await import('../src/config/migraciones.js'));

  // Así se creó la base de producción: con sync, sin registro de migraciones
  await modelos.sequelize.sync();

  cliente = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await cliente.connect();

  await cliente.query(`
    INSERT INTO cabanas (nombre, capacidad, "createdAt", "updatedAt") VALUES
      ('Estudio familiar', 4, now(), now()), ('Dos ambientes', 6, now(), now());
    INSERT INTO usuarios ("nombreUsuario", "passwordHash", "createdAt", "updatedAt") VALUES
      ('mama', '$2a$12$hashdeprueba', now(), now());
    INSERT INTO huespedes (nombre, apellido, dni, cuil, telefono, "notasComportamiento", "createdAt", "updatedAt") VALUES
      ('Norma', 'Berger', '17047028', '27-17047028-7', '2664000000', 'Muy prolija', now(), now()),
      ('Marcelo', 'Giangreco', '16572628', NULL, NULL, NULL, now(), now());
    INSERT INTO reservas ("fechaCheckIn", "fechaCheckOut", "montoTotal", "porcentajeSena", "montoSena", estado, "cabanaId", "createdAt", "updatedAt") VALUES
      ('2026-01-10', '2026-01-15', 150000, 30, 45000, 'Finalizada', 1, now(), now()),
      ('2026-12-20', '2026-12-27', 300000, 0, 0, 'Señada', 2, now(), now());
    INSERT INTO pagos (monto, fecha, "metodoPago", "reservaId", "createdAt", "updatedAt") VALUES
      (45000, '2026-01-02', 'Transferencia', 1, now(), now()),
      (105000, '2026-01-10', 'Efectivo', 1, now(), now());
    INSERT INTO reserva_huespedes (rol, "reservaId", "huespedId", "createdAt", "updatedAt") VALUES
      ('titular', 1, 1, now(), now()), ('acompañante', 1, 2, now(), now()), ('titular', 2, 1, now(), now());
  `);
});

after(async () => {
  await cliente.end();
  await cerrarBase();
});

describe('Migraciones sobre una base existente con datos', () => {
  let antes;
  let aplicadas;

  before(async () => {
    antes = await fotoDeLosDatos();
    aplicadas = await migrar();
  });

  it('registra la migración inicial como aplicada', () => {
    assert.deepEqual(aplicadas, ['0001-esquema-inicial.js']);
  });

  it('no cambia ningún dato de ninguna tabla', async () => {
    assert.deepEqual(await fotoDeLosDatos(), antes);
  });

  it('no vuelve a correr lo que ya aplicó', async () => {
    assert.deepEqual(await migrar(), []);
    assert.deepEqual(await fotoDeLosDatos(), antes);
  });

  it('la app sigue leyendo las reservas con sus huéspedes y cobros', async () => {
    const reserva = await modelos.Reserva.findByPk(1, {
      include: [modelos.Cabana, modelos.Huesped, modelos.Pago],
    });
    assert.equal(reserva.Cabana.nombre, 'Estudio familiar');
    assert.equal(reserva.Huespeds.length, 2);
    assert.equal(reserva.Pagos.length, 2);
  });
});

describe('Base existente de antes del CUIL', () => {
  it('agrega la columna cuil sin tocar los huéspedes', async () => {
    await cliente.query('ALTER TABLE huespedes DROP COLUMN cuil');
    await cliente.query('DELETE FROM migraciones');
    const antes = (await cliente.query('SELECT * FROM huespedes ORDER BY id')).rows;

    await migrar();

    const despues = (await cliente.query('SELECT * FROM huespedes ORDER BY id')).rows;
    assert.deepEqual(
      despues.map(({ cuil, ...resto }) => resto),
      antes
    );
    assert.ok(despues.every((h) => h.cuil === null));
  });
});

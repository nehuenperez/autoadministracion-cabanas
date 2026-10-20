import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { cerrarBase } from './conBase.js';
import { levantarApp } from './servidor.js';

/**
 * Reglas de negocio contra una base real, pasando por la API completa
 * (validación, autenticación, servicios y base), igual que la app.
 */

let pedir;
let cerrar;
let token;
let modelos;

/** Pedido autenticado. Devuelve { status, json }. */
const api = (ruta, metodo = 'GET', cuerpo) => pedir(`/api${ruta}`, { metodo, cuerpo, token });

const nuevaReserva = (datos = {}) =>
  api('/reservas', 'POST', {
    cabanaId: 1,
    fechaCheckIn: '2030-03-10',
    fechaCheckOut: '2030-03-15',
    montoTotal: 100000,
    porcentajeSena: 30,
    ...datos,
  });

const estadoDe = async (id) => (await api(`/reservas/${id}`)).json.estado;

before(async () => {
  modelos = await import('../src/models/index.js');
  const { migrar } = await import('../src/config/migraciones.js');
  const { default: bcrypt } = await import('bcryptjs');

  await migrar();
  await modelos.Cabana.bulkCreate([
    { nombre: 'Estudio familiar', capacidad: 4 },
    { nombre: 'Dos ambientes', capacidad: 6 },
  ]);
  await modelos.Usuario.create({ nombreUsuario: 'mama', passwordHash: await bcrypt.hash('clave-de-prueba-123', 4) });

  ({ pedir, cerrar } = await levantarApp());
  const login = await pedir('/api/auth/login', {
    metodo: 'POST',
    cuerpo: { nombreUsuario: 'mama', password: 'clave-de-prueba-123' },
  });
  token = login.json.token;
});

beforeEach(async () => {
  await modelos.sequelize.query(
    'TRUNCATE TABLE pagos, reserva_huespedes, reservas, huespedes RESTART IDENTITY CASCADE'
  );
});

after(async () => {
  await cerrar();
  await cerrarBase();
});

describe('Login', () => {
  it('con las credenciales correctas devuelve token y usuario sin el hash', async () => {
    const r = await pedir('/api/auth/login', {
      metodo: 'POST',
      cuerpo: { nombreUsuario: 'mama', password: 'clave-de-prueba-123' },
    });
    assert.equal(r.status, 200);
    assert.ok(r.json.token);
    assert.deepEqual(Object.keys(r.json.usuario).sort(), ['id', 'nombreUsuario']);
  });

  it('usuario inexistente y contraseña incorrecta dan el mismo mensaje', async () => {
    const sinUsuario = await pedir('/api/auth/login', {
      metodo: 'POST', cuerpo: { nombreUsuario: 'nadie', password: 'x' },
    });
    const malaClave = await pedir('/api/auth/login', {
      metodo: 'POST', cuerpo: { nombreUsuario: 'mama', password: 'x' },
    });
    assert.equal(sinUsuario.status, 401);
    assert.equal(malaClave.status, 401);
    assert.equal(sinUsuario.json.error, malaClave.json.error);
  });
});

describe('Disponibilidad', () => {
  it('crea la reserva Señada y calcula la seña en el backend', async () => {
    const r = await nuevaReserva();
    assert.equal(r.status, 201);
    assert.equal(r.json.estado, 'Señada');
    assert.equal(Number(r.json.montoSena), 30000);
  });

  it('rechaza una reserva que se superpone en la misma cabaña', async () => {
    await nuevaReserva();
    const r = await nuevaReserva({ fechaCheckIn: '2030-03-12', fechaCheckOut: '2030-03-18' });
    assert.equal(r.status, 409);
  });

  it('permite entrar el mismo día que sale la reserva anterior', async () => {
    await nuevaReserva();
    const r = await nuevaReserva({ fechaCheckIn: '2030-03-15', fechaCheckOut: '2030-03-20' });
    assert.equal(r.status, 201);
  });

  it('las mismas fechas en otra cabaña no chocan', async () => {
    await nuevaReserva();
    const r = await nuevaReserva({ cabanaId: 2 });
    assert.equal(r.status, 201);
  });

  it('una reserva abortada libera las fechas', async () => {
    const { json } = await nuevaReserva();
    await api(`/reservas/${json.id}/abortar`, 'PATCH');
    const r = await nuevaReserva();
    assert.equal(r.status, 201);
  });

  it('rechaza check-out anterior o igual al check-in', async () => {
    const r = await nuevaReserva({ fechaCheckOut: '2030-03-10' });
    assert.equal(r.status, 400);
  });

  it('rechaza una cabaña inexistente', async () => {
    const r = await nuevaReserva({ cabanaId: 99 });
    assert.equal(r.status, 404);
  });

  it('al editar no choca consigo misma, pero sí con otra', async () => {
    const { json: primera } = await nuevaReserva();
    await nuevaReserva({ fechaCheckIn: '2030-03-20', fechaCheckOut: '2030-03-25' });

    const extender = await api(`/reservas/${primera.id}`, 'PUT', { fechaCheckOut: '2030-03-18' });
    assert.equal(extender.status, 200);

    const chocar = await api(`/reservas/${primera.id}`, 'PUT', { fechaCheckOut: '2030-03-22' });
    assert.equal(chocar.status, 409);
  });
});

describe('Cobros y estados', () => {
  it('un cobro parcial deja la reserva Señada con el saldo correcto', async () => {
    const { json } = await nuevaReserva();
    await api(`/pagos/reservas/${json.id}`, 'POST', { monto: 30000, metodoPago: 'Transferencia' });

    assert.equal(await estadoDe(json.id), 'Señada');
    const saldo = await api(`/pagos/reservas/${json.id}/saldo`);
    assert.equal(saldo.json.saldoPendiente, 70000);
  });

  it('completar el total la pasa a Pagada, y borrar un cobro la devuelve a Señada', async () => {
    const { json } = await nuevaReserva();
    await api(`/pagos/reservas/${json.id}`, 'POST', { monto: 30000, metodoPago: 'Transferencia' });
    const { json: ultimo } = await api(`/pagos/reservas/${json.id}`, 'POST', { monto: 70000, metodoPago: 'Efectivo' });
    assert.equal(await estadoDe(json.id), 'Pagada');

    const borrar = await api(`/pagos/${ultimo.id}`, 'DELETE');
    assert.equal(borrar.status, 200);
    assert.equal(await estadoDe(json.id), 'Señada');
  });

  it('borrar un cobro que no existe da 404', async () => {
    const r = await api('/pagos/999', 'DELETE');
    assert.equal(r.status, 404);
  });

  it('subir el total de una reserva Pagada la vuelve a Señada, y bajarlo la salda', async () => {
    const { json } = await nuevaReserva();
    await api(`/pagos/reservas/${json.id}`, 'POST', { monto: 100000, metodoPago: 'Efectivo' });
    assert.equal(await estadoDe(json.id), 'Pagada');

    await api(`/reservas/${json.id}`, 'PUT', { montoTotal: 120000 });
    assert.equal(await estadoDe(json.id), 'Señada');

    await api(`/reservas/${json.id}`, 'PUT', { montoTotal: 100000 });
    assert.equal(await estadoDe(json.id), 'Pagada');
  });

  it('editar el porcentaje recalcula la seña', async () => {
    const { json } = await nuevaReserva();
    const r = await api(`/reservas/${json.id}`, 'PUT', { porcentajeSena: 50 });
    assert.equal(Number(r.json.montoSena), 50000);
  });

  it('un cobro sin fecha queda con la fecha de hoy en Argentina', async () => {
    const { json } = await nuevaReserva();
    const { json: pago } = await api(`/pagos/reservas/${json.id}`, 'POST', { monto: 1000, metodoPago: 'Efectivo' });
    const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/San_Luis' }).format(new Date());
    assert.equal(pago.fecha, hoy);
  });

  it('el listado de activas trae el saldo pendiente de cada reserva', async () => {
    const { json } = await nuevaReserva();
    await api(`/pagos/reservas/${json.id}`, 'POST', { monto: 25000, metodoPago: 'Efectivo' });
    const { json: activas } = await api('/reservas');
    assert.equal(activas[0].saldoPendiente, 75000);
  });
});

describe('Reservas vencidas', () => {
  it('una reserva con el check-out pasado pasa a Finalizada y sale de las activas', async () => {
    await modelos.Reserva.create({
      cabanaId: 1, fechaCheckIn: '2020-01-10', fechaCheckOut: '2020-01-15', montoTotal: 1000, estado: 'Señada',
    });

    const { json: activas } = await api('/reservas');
    assert.equal(activas.length, 0);

    const { json: historicas } = await api('/reservas/historicas');
    assert.equal(historicas.length, 1);
    assert.equal(historicas[0].estado, 'Finalizada');
  });

  it('una Abortada vencida sigue Abortada', async () => {
    await modelos.Reserva.create({
      cabanaId: 1, fechaCheckIn: '2020-01-10', fechaCheckOut: '2020-01-15', montoTotal: 1000, estado: 'Abortada',
    });
    const { json: historicas } = await api('/reservas/historicas');
    assert.equal(historicas[0].estado, 'Abortada');
  });
});

describe('Huéspedes', () => {
  const ana = { nombre: 'Ana', apellido: 'Gómez', dni: '30111222' };

  it('cargar dos veces el mismo DNI actualiza en lugar de duplicar', async () => {
    const primero = await api('/huespedes', 'POST', ana);
    const segundo = await api('/huespedes', 'POST', { ...ana, telefono: '2664123456' });
    assert.equal(segundo.json.id, primero.json.id);
    assert.equal(segundo.json.telefono, '2664123456');
    assert.equal(await modelos.Huesped.count(), 1);
  });

  it('busca por DNI y responde 404 si no existe', async () => {
    await api('/huespedes', 'POST', ana);
    assert.equal((await api('/huespedes/dni/30111222')).json.nombre, 'Ana');
    assert.equal((await api('/huespedes/dni/1')).status, 404);
  });

  it('vincula titular y acompañantes a la reserva', async () => {
    const { json: reserva } = await nuevaReserva();
    const { json: titular } = await api('/huespedes', 'POST', ana);
    const { json: acompanante } = await api('/huespedes', 'POST', { nombre: 'Luis', apellido: 'Paz', dni: '28999000' });

    const r = await api(`/huespedes/reservas/${reserva.id}/vincular`, 'POST', {
      huespedes: [{ huespedId: titular.id, rol: 'titular' }, { huespedId: acompanante.id, rol: 'acompañante' }],
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.Huespeds.length, 2);
  });

  it('exige exactamente un titular y rechaza al mismo huésped dos veces', async () => {
    const { json: reserva } = await nuevaReserva();
    const { json: h } = await api('/huespedes', 'POST', ana);
    const ruta = `/huespedes/reservas/${reserva.id}/vincular`;

    assert.equal((await api(ruta, 'POST', { huespedes: [{ huespedId: h.id, rol: 'acompañante' }] })).status, 400);
    assert.equal(
      (await api(ruta, 'POST', { huespedes: [{ huespedId: h.id, rol: 'titular' }, { huespedId: h.id, rol: 'acompañante' }] })).status,
      400
    );
  });

  it('si un huésped no existe, los vínculos anteriores quedan intactos', async () => {
    const { json: reserva } = await nuevaReserva();
    const { json: h } = await api('/huespedes', 'POST', ana);
    const ruta = `/huespedes/reservas/${reserva.id}/vincular`;
    await api(ruta, 'POST', { huespedes: [{ huespedId: h.id, rol: 'titular' }] });

    const r = await api(ruta, 'POST', { huespedes: [{ huespedId: 999, rol: 'titular' }] });
    assert.equal(r.status, 404);

    const { json: detalle } = await api(`/reservas/${reserva.id}`);
    assert.equal(detalle.Huespeds.length, 1);
    assert.equal(detalle.Huespeds[0].id, h.id);
  });

  it('las notas de comportamiento se actualizan solas', async () => {
    const { json: h } = await api('/huespedes', 'POST', ana);
    const r = await api(`/huespedes/${h.id}/notas`, 'PATCH', { notasComportamiento: 'Dejó todo impecable' });
    assert.equal(r.json.notasComportamiento, 'Dejó todo impecable');
  });
});

describe('Estadísticas', () => {
  it('suma la caja por fecha de cobro y el rendimiento por cabaña', async () => {
    const { json: marzo } = await nuevaReserva();
    const { json: otra } = await nuevaReserva({ cabanaId: 2 });
    await api(`/pagos/reservas/${marzo.id}`, 'POST', { monto: 30000, metodoPago: 'Efectivo', fecha: '2030-03-01' });
    await api(`/pagos/reservas/${marzo.id}`, 'POST', { monto: 70000, metodoPago: 'Efectivo', fecha: '2030-03-31' });
    // Cobrado en febrero: no cuenta para la caja de marzo
    await api(`/pagos/reservas/${otra.id}`, 'POST', { monto: 5000, metodoPago: 'Efectivo', fecha: '2030-02-28' });

    const { json } = await api('/estadisticas?mes=3&anio=2030');
    assert.equal(json.ingresosDelMes, 100000);
    assert.equal(json.totalReservas, 2);
    assert.deepEqual(json.reservasPorCabana, { 'Estudio familiar': 1, 'Dos ambientes': 1 });
    assert.deepEqual(json.ingresosPorCabana, { 'Estudio familiar': 100000, 'Dos ambientes': 5000 });
    assert.equal(json.reservasPorEstado.Pagada, 1);
    assert.equal(json.reservasPorEstado.Señada, 1);
  });
});

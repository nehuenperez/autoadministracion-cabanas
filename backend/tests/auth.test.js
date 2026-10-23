import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

import {
  levantarApp,
  tokenValido,
  tokenConFirmaInvalida,
  tokenVencido,
} from './ayudas.js';

let pedir;
let cerrar;

before(async () => {
  ({ pedir, cerrar } = await levantarApp());
});

after(() => cerrar());

describe('POST /api/auth/login — contrato de entrada', () => {
  // Este es exactamente el bug que tuvo el sistema en producción: el frontend
  // mandaba { usuario, password } y el backend esperaba { nombreUsuario, password }.
  // El login fallaba con un 400 que parecía un problema de credenciales.
  it('rechaza el payload con "usuario" en lugar de "nombreUsuario"', async () => {
    const r = await pedir('/api/auth/login', {
      metodo: 'POST',
      cuerpo: { usuario: 'mama', password: 'loquesea' },
    });

    assert.equal(r.status, 400);
    assert.match(r.json.error, /nombreUsuario/);
  });

  it('rechaza el cuerpo vacío', async () => {
    const r = await pedir('/api/auth/login', { metodo: 'POST', cuerpo: {} });
    assert.equal(r.status, 400);
  });

  it('rechaza cuando falta la contraseña', async () => {
    const r = await pedir('/api/auth/login', {
      metodo: 'POST',
      cuerpo: { nombreUsuario: 'mama' },
    });
    assert.equal(r.status, 400);
    assert.match(r.json.error, /password/);
  });

  it('rechaza un nombre de usuario vacío', async () => {
    const r = await pedir('/api/auth/login', {
      metodo: 'POST',
      cuerpo: { nombreUsuario: '   ', password: 'loquesea' },
    });
    assert.equal(r.status, 400);
  });

  it('no filtra datos internos en el error', async () => {
    const r = await pedir('/api/auth/login', { metodo: 'POST', cuerpo: {} });
    assert.doesNotMatch(r.texto, /at |\.js:\d+|SequelizeError|node_modules/);
  });
});

describe('Middleware de autenticación', () => {
  const rutasProtegidas = [
    '/api/reservas',
    '/api/reservas/historicas',
    '/api/cabanas',
    '/api/estadisticas',
    '/api/huespedes/dni/12345678',
    '/api/pagos/reservas/1',
  ];

  for (const ruta of rutasProtegidas) {
    it(`${ruta} exige token`, async () => {
      const r = await pedir(ruta);
      assert.equal(r.status, 401);
    });
  }

  it('rechaza un token con firma inválida', async () => {
    const r = await pedir('/api/cabanas', { token: tokenConFirmaInvalida() });
    assert.equal(r.status, 401);
  });

  it('rechaza un token vencido', async () => {
    const r = await pedir('/api/cabanas', { token: tokenVencido() });
    assert.equal(r.status, 401);
  });

  it('rechaza un token con formato basura', async () => {
    const r = await pedir('/api/cabanas', { token: 'esto-no-es-un-jwt' });
    assert.equal(r.status, 401);
  });

  it('rechaza el header sin el prefijo Bearer', async () => {
    const r = await pedir('/api/cabanas', {
      cabeceras: { Authorization: tokenValido() },
    });
    assert.equal(r.status, 401);
  });

  it('un token válido pasa el middleware y llega al controlador', async () => {
    // La base no existe en los tests, así que el pedido no puede devolver 200.
    // Lo que importa es que NO sea 401: el token fue aceptado.
    const r = await pedir('/api/cabanas', { token: tokenValido() });
    assert.notEqual(r.status, 401);
  });
});

describe('Rutas públicas', () => {
  it('/api/health responde sin token', async () => {
    const r = await pedir('/api/health');
    assert.equal(r.status, 200);
    assert.equal(r.json.status, 'ok');
  });

  it('/api/health/db responde 503 sin detalles internos si la base no contesta', async () => {
    // En este entorno de test la base apunta a un puerto cerrado a propósito
    const r = await pedir('/api/health/db');
    assert.equal(r.status, 503);
    assert.deepEqual(r.json, { status: 'error', base: 'sin conexión' });
  });
});

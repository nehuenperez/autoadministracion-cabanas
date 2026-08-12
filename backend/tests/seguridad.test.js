import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

import { levantarApp } from './ayudas.js';

let pedir;
let cerrar;

before(async () => {
  ({ pedir, cerrar } = await levantarApp());
});

after(() => cerrar());

describe('Cabeceras de seguridad (helmet)', () => {
  it('manda X-Content-Type-Options: nosniff', async () => {
    const r = await pedir('/api/health');
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  });

  it('manda X-Frame-Options', async () => {
    const r = await pedir('/api/health');
    assert.ok(r.headers.get('x-frame-options'));
  });

  it('no revela la tecnología del servidor en X-Powered-By', async () => {
    const r = await pedir('/api/health');
    assert.equal(r.headers.get('x-powered-by'), null);
  });
});

describe('CORS', () => {
  const permitido = 'https://ejemplo-produccion.vercel.app';

  it('permite el origen configurado', async () => {
    const r = await pedir('/api/health', { cabeceras: { Origin: permitido } });
    assert.equal(r.headers.get('access-control-allow-origin'), permitido);
  });

  it('no autoriza un origen desconocido', async () => {
    const r = await pedir('/api/health', {
      cabeceras: { Origin: 'https://sitio-malicioso.com' },
    });
    assert.equal(r.headers.get('access-control-allow-origin'), null);
  });

  it('no autoriza el mismo dominio con barra final', async () => {
    const r = await pedir('/api/health', {
      cabeceras: { Origin: `${permitido}/` },
    });
    assert.equal(r.headers.get('access-control-allow-origin'), null);
  });
});

describe('Límite de tamaño del cuerpo', () => {
  it('rechaza un JSON más grande que 100 kb', async () => {
    const gigante = { nombreUsuario: 'a'.repeat(200 * 1024), password: 'x' };
    const r = await pedir('/api/auth/login', { metodo: 'POST', cuerpo: gigante });
    assert.equal(r.status, 413);
  });
});

describe('Manejo de errores', () => {
  it('una ruta inexistente no expone el stack trace', async () => {
    const r = await pedir('/api/ruta/que/no/existe');
    assert.doesNotMatch(r.texto, /node_modules|\.js:\d+:\d+/);
  });
});

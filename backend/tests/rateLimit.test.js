import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

import { levantarApp } from './ayudas.js';

let pedir;
let cerrar;

before(async () => {
  ({ pedir, cerrar } = await levantarApp());
});

after(() => cerrar());

/**
 * Este archivo va aparte a propósito: agota el límite de intentos, y el
 * contador vive en memoria por proceso. El runner de Node corre cada archivo
 * de test en su propio proceso, así que no contamina a los demás.
 */
describe('Límite de intentos en el login', () => {
  it('corta con 429 después de 10 intentos desde la misma IP', async () => {
    const cuerpo = { nombreUsuario: 'atacante', password: 'probando' };
    const respuestas = [];

    for (let i = 0; i < 12; i++) {
      const r = await pedir('/api/auth/login', { metodo: 'POST', cuerpo });
      respuestas.push(r.status);
      if (r.status === 429) break;
    }

    const indice429 = respuestas.indexOf(429);

    assert.notEqual(indice429, -1, 'nunca se activó el límite de intentos');
    assert.equal(indice429, 10, `el bloqueo llegó en el intento ${indice429 + 1}, se esperaba el 11`);
  });

  it('el mensaje de bloqueo no revela si el usuario existe', async () => {
    const r = await pedir('/api/auth/login', {
      metodo: 'POST',
      cuerpo: { nombreUsuario: 'atacante', password: 'probando' },
    });

    assert.equal(r.status, 429);
    assert.doesNotMatch(r.texto, /existe|encontrado|incorrecta/i);
  });
});

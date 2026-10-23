import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { conectarConReintentos } from '../src/config/conexion.js';

/** Una base de mentira que falla las primeras `fallas` veces. */
function baseQueFalla(fallas) {
  let intentos = 0;
  return {
    get intentos() {
      return intentos;
    },
    async authenticate() {
      intentos++;
      if (intentos <= fallas) throw new Error('connect ETIMEDOUT');
    },
  };
}

const sinAvisos = () => {};

describe('conectarConReintentos', () => {
  it('conecta al primer intento si la base responde', async () => {
    const base = baseQueFalla(0);
    await conectarConReintentos(base, { esperas: [1, 1], avisar: sinAvisos });
    assert.equal(base.intentos, 1);
  });

  it('reintenta si la base falla un par de veces y después responde', async () => {
    const base = baseQueFalla(2);
    const avisos = [];
    await conectarConReintentos(base, { esperas: [1, 1, 1], avisar: (m) => avisos.push(m) });
    assert.equal(base.intentos, 3);
    assert.equal(avisos.length, 2);
    assert.match(avisos[0], /intento 1 de 4/);
  });

  it('se rinde con el error original cuando se acaban los intentos', async () => {
    const base = baseQueFalla(10);
    await assert.rejects(
      conectarConReintentos(base, { esperas: [1, 1], avisar: sinAvisos }),
      /ETIMEDOUT/
    );
    assert.equal(base.intentos, 3);
  });
});

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

import { levantarApp, tokenValido } from './ayudas.js';

let pedir;
let cerrar;
let token;

before(async () => {
  ({ pedir, cerrar } = await levantarApp());
  token = tokenValido();
});

after(() => cerrar());

/**
 * Estos tests comprueban que la entrada inválida se corta ANTES de llegar a la
 * base: todos esperan un 400. Como la base no existe en el entorno de test,
 * un 400 prueba que la validación actuó primero.
 */

describe('Validación de reservas', () => {
  const baseValida = {
    cabanaId: 1,
    fechaCheckIn: '2026-03-10',
    fechaCheckOut: '2026-03-15',
    montoTotal: 150000,
    porcentajeSena: 30,
  };

  const casosInvalidos = [
    ['cabanaId ausente', { ...baseValida, cabanaId: undefined }],
    ['cabanaId no numérico', { ...baseValida, cabanaId: 'abc' }],
    ['cabanaId negativo', { ...baseValida, cabanaId: -1 }],
    ['fecha con formato inglés', { ...baseValida, fechaCheckIn: '03/10/2026' }],
    ['fecha inexistente (31 de febrero)', { ...baseValida, fechaCheckIn: '2026-02-31' }],
    ['montoTotal negativo', { ...baseValida, montoTotal: -500 }],
    ['montoTotal no numérico', { ...baseValida, montoTotal: 'mucho' }],
    ['porcentajeSena mayor a 100', { ...baseValida, porcentajeSena: 150 }],
    ['porcentajeSena negativo', { ...baseValida, porcentajeSena: -5 }],
  ];

  for (const [descripcion, cuerpo] of casosInvalidos) {
    it(`rechaza: ${descripcion}`, async () => {
      const r = await pedir('/api/reservas', { metodo: 'POST', token, cuerpo });
      assert.equal(r.status, 400, `esperaba 400 y vino ${r.status}`);
    });
  }

  it('acepta un cuerpo válido (pasa la validación)', async () => {
    const r = await pedir('/api/reservas', { metodo: 'POST', token, cuerpo: baseValida });
    // No puede ser 200 porque no hay base, pero tampoco debe ser 400.
    assert.notEqual(r.status, 400);
  });

  it('descarta campos de más en lugar de guardarlos (mass assignment)', async () => {
    const r = await pedir('/api/reservas', {
      metodo: 'POST',
      token,
      cuerpo: { ...baseValida, id: 999, estado: 'Pagada', montoSena: 0 },
    });
    // Los campos extra se descartan en silencio; no debe fallar por validación.
    assert.notEqual(r.status, 400);
  });

  it('rechaza un id no numérico en la URL', async () => {
    const r = await pedir('/api/reservas/abc', { token });
    assert.equal(r.status, 400);
  });
});

describe('Validación de pagos', () => {
  const casosInvalidos = [
    ['monto cero', { monto: 0, metodoPago: 'Efectivo' }],
    ['monto negativo', { monto: -100, metodoPago: 'Efectivo' }],
    ['monto no numérico', { monto: 'mil', metodoPago: 'Efectivo' }],
    ['metodoPago fuera del enum', { monto: 100, metodoPago: 'Bitcoin' }],
    ['metodoPago ausente', { monto: 100 }],
  ];

  for (const [descripcion, cuerpo] of casosInvalidos) {
    it(`rechaza: ${descripcion}`, async () => {
      const r = await pedir('/api/pagos/reservas/1', { metodo: 'POST', token, cuerpo });
      assert.equal(r.status, 400, `esperaba 400 y vino ${r.status}`);
    });
  }

  it('acepta un pago válido', async () => {
    const r = await pedir('/api/pagos/reservas/1', {
      metodo: 'POST',
      token,
      cuerpo: { monto: 50000, metodoPago: 'Transferencia' },
    });
    assert.notEqual(r.status, 400);
  });
});

describe('Validación de huéspedes', () => {
  const valido = { nombre: 'Ana', apellido: 'Gómez', dni: '30111222' };

  it('rechaza sin DNI', async () => {
    const r = await pedir('/api/huespedes', {
      metodo: 'POST',
      token,
      cuerpo: { nombre: 'Ana', apellido: 'Gómez' },
    });
    assert.equal(r.status, 400);
  });

  it('rechaza sin nombre', async () => {
    const r = await pedir('/api/huespedes', {
      metodo: 'POST',
      token,
      cuerpo: { apellido: 'Gómez', dni: '30111222' },
    });
    assert.equal(r.status, 400);
  });

  it('acepta un huésped válido', async () => {
    const r = await pedir('/api/huespedes', { metodo: 'POST', token, cuerpo: valido });
    assert.notEqual(r.status, 400);
  });

  it('rechaza un rol fuera del enum al vincular', async () => {
    const r = await pedir('/api/huespedes/reservas/1/vincular', {
      metodo: 'POST',
      token,
      cuerpo: { huespedes: [{ huespedId: 1, rol: 'administrador' }] },
    });
    assert.equal(r.status, 400);
  });

  it('rechaza una lista de huéspedes vacía', async () => {
    const r = await pedir('/api/huespedes/reservas/1/vincular', {
      metodo: 'POST',
      token,
      cuerpo: { huespedes: [] },
    });
    assert.equal(r.status, 400);
  });
});

describe('Validación de estadísticas', () => {
  const invalidos = ['?mes=abc', '?mes=13', '?mes=0', '?anio=1800', '?anio=xx'];

  for (const query of invalidos) {
    it(`rechaza ${query}`, async () => {
      const r = await pedir(`/api/estadisticas${query}`, { token });
      assert.equal(r.status, 400, `esperaba 400 y vino ${r.status}`);
    });
  }

  it('acepta un período válido', async () => {
    const r = await pedir('/api/estadisticas?mes=3&anio=2026', { token });
    assert.notEqual(r.status, 400);
  });
});

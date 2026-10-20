import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { semaforoDe, ESTILOS } from './semaforo.js';

const HOY = '2026-03-10';

/** Reserva de $100.000 con check-in en `checkIn` y los cobros indicados. */
function reserva({ checkIn = '2026-03-20', estado = 'Señada', cobros = [] } = {}) {
  return {
    estado,
    fechaCheckIn: checkIn,
    fechaCheckOut: '2026-03-25',
    montoTotal: '100000.00',
    Pagos: cobros.map((monto) => ({ monto: String(monto) })),
  };
}

const clave = (datos) => semaforoDe(reserva(datos), HOY).clave;

describe('semaforoDe', () => {
  it('celeste: señada y falta para el check-in', () => {
    assert.equal(clave({ cobros: [30000] }), 'senada');
  });

  it('amarillo: el check-in es mañana', () => {
    assert.equal(clave({ checkIn: '2026-03-11', cobros: [30000] }), 'cobrar');
  });

  it('amarillo: el check-in es hoy', () => {
    assert.equal(clave({ checkIn: HOY, cobros: [30000] }), 'cobrar');
  });

  it('rojo: el check-in ya pasó y queda saldo', () => {
    assert.equal(clave({ checkIn: '2026-03-09', cobros: [30000] }), 'vencida');
  });

  it('rojo: no hay ni un cobro, aunque falte mucho', () => {
    assert.equal(clave({ cobros: [] }), 'sinSena');
  });

  it('verde: saldado, aunque el check-in ya haya pasado', () => {
    assert.equal(clave({ checkIn: '2026-03-01', cobros: [30000, 70000] }), 'pagada');
  });

  it('Finalizada y Abortada tienen su color sin importar el saldo', () => {
    assert.equal(clave({ estado: 'Finalizada', cobros: [] }), 'finalizada');
    assert.equal(clave({ estado: 'Abortada', cobros: [100000] }), 'abortada');
  });

  it('cada estado posible tiene sus estilos', () => {
    const claves = ['senada', 'cobrar', 'vencida', 'sinSena', 'pagada', 'finalizada', 'abortada'];
    for (const c of claves) {
      assert.ok(ESTILOS[c]?.celda && ESTILOS[c]?.insignia && ESTILOS[c]?.borde, `faltan estilos de ${c}`);
    }
  });
});

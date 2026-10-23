import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { cobrosPendientes, movimientosDelDia } from './agenda.js';
import { formatearDia, formatearDiaCorto, formatearNoches } from './fechas.js';

const HOY = '2026-10-23';

/** Reserva de $100.000 con los cobros indicados. */
function reserva(id, checkIn, checkOut, { estado = 'Señada', cobros = [] } = {}) {
  return {
    id,
    estado,
    fechaCheckIn: checkIn,
    fechaCheckOut: checkOut,
    montoTotal: '100000.00',
    Pagos: cobros.map((monto) => ({ monto: String(monto) })),
  };
}

describe('movimientosDelDia', () => {
  it('lista primero las salidas y después las entradas', () => {
    const reservas = [reserva(1, HOY, '2026-10-26'), reserva(2, '2026-10-20', HOY, { estado: 'Finalizada' })];
    const movimientos = movimientosDelDia(HOY, reservas);
    assert.deepEqual(movimientos.map((m) => [m.tipo, m.reserva.id]), [['sale', 2], ['entra', 1]]);
  });

  it('no cuenta las reservas canceladas ni las que siguen en curso', () => {
    const reservas = [reserva(1, HOY, '2026-10-26', { estado: 'Abortada' }), reserva(2, '2026-10-20', '2026-10-25')];
    assert.deepEqual(movimientosDelDia(HOY, reservas), []);
  });
});

describe('cobrosPendientes', () => {
  it('incluye a quien ya llegó o llega mañana y todavía debe', () => {
    const reservas = [
      reserva(1, '2026-10-21', '2026-10-25', { cobros: [30000] }), // ya está, debe
      reserva(2, '2026-10-24', '2026-10-27', { cobros: [30000] }), // llega mañana, debe
      reserva(3, '2026-10-30', '2026-11-02'), // llega más adelante
      reserva(4, '2026-10-22', '2026-10-24', { cobros: [100000] }), // ya pagó todo
      reserva(5, '2026-10-22', '2026-10-24', { estado: 'Abortada' }), // cancelada
    ];
    assert.deepEqual(cobrosPendientes(reservas, HOY).map((r) => r.id), [1, 2]);
  });
});

describe('fechas legibles', () => {
  it('arma el día completo, el corto y las noches', () => {
    assert.equal(formatearDia('2026-10-23'), 'viernes 23 de octubre');
    assert.equal(formatearDiaCorto('2026-10-21'), 'mié 21 oct');
    assert.equal(formatearNoches('2026-10-21', '2026-10-25'), '4 noches');
    assert.equal(formatearNoches('2026-10-21', '2026-10-22'), '1 noche');
  });
});

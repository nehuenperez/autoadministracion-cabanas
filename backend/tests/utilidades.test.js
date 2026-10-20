import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { fechaDeHoy, sumarDias, rangoDelMes } from '../src/utils/fechas.js';
import { totalCobrado, saldoPendiente } from '../src/utils/saldo.js';

describe('fechaDeHoy', () => {
  it('usa el día de Argentina aunque en UTC ya sea mañana', () => {
    // 19/10 a las 23:30 en Argentina = 20/10 02:30 UTC
    assert.equal(fechaDeHoy(new Date('2026-10-20T02:30:00Z')), '2026-10-19');
  });

  it('a la medianoche de Argentina ya es el día siguiente', () => {
    assert.equal(fechaDeHoy(new Date('2026-10-20T03:00:00Z')), '2026-10-20');
  });
});

describe('sumarDias', () => {
  it('cruza fin de mes y de año', () => {
    assert.equal(sumarDias('2026-01-31', 1), '2026-02-01');
    assert.equal(sumarDias('2026-12-31', 1), '2027-01-01');
    assert.equal(sumarDias('2026-03-01', -1), '2026-02-28');
  });
});

describe('rangoDelMes', () => {
  it('va del primer día del mes al primero del siguiente', () => {
    assert.deepEqual(rangoDelMes(3, 2026), { inicio: '2026-03-01', fin: '2026-04-01' });
  });

  it('diciembre termina en enero del año siguiente', () => {
    assert.deepEqual(rangoDelMes(12, 2026), { inicio: '2026-12-01', fin: '2027-01-01' });
  });
});

describe('saldo', () => {
  const pagos = [{ monto: '30000.00' }, { monto: '45000.50' }];

  it('suma los cobros que vienen como texto desde la base', () => {
    assert.equal(totalCobrado(pagos), 75000.5);
  });

  it('el saldo es el total menos lo cobrado', () => {
    assert.equal(saldoPendiente('100000.00', pagos), 24999.5);
  });

  it('sin cobros, el saldo es el total', () => {
    assert.equal(saldoPendiente(100000), 100000);
  });

  it('no arrastra errores de punto flotante', () => {
    assert.equal(saldoPendiente(0.3, [{ monto: 0.1 }, { monto: 0.2 }]), 0);
  });
});

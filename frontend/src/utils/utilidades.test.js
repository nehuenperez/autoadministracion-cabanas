import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { aISO, deISO, sumarDias, diasEntre, formatearFecha, formatearRango, diasDelMes } from './fechas.js';
import { parsearMonto, formatearMonto, formatearMientrasSeEscribe, calcularSena } from './montos.js';
import { titularDe, acompanantesDe, vinculosDe, totalCobrado, saldoPendiente } from './reservas.js';
import { soloConDato } from './huespedes.js';

describe('huespedes', () => {
  it('manda sólo los campos con dato, para no borrar lo guardado de otra visita', () => {
    const fila = { nombre: ' Ana ', apellido: 'Gómez', dni: '30111222', telefono: '', direccion: null, id: 7, rol: 'titular' };
    assert.deepEqual(soloConDato(fila), { nombre: 'Ana', apellido: 'Gómez', dni: '30111222' });
  });
});

describe('fechas', () => {
  it('ida y vuelta entre texto y Date sin correrse de día', () => {
    assert.equal(aISO(deISO('2026-03-01')), '2026-03-01');
    assert.equal(deISO('2026-03-01').getDate(), 1);
  });

  it('suma días cruzando meses y años', () => {
    assert.equal(sumarDias('2026-02-28', 1), '2026-03-01');
    assert.equal(sumarDias('2026-12-31', 1), '2027-01-01');
  });

  it('cuenta los días entre dos fechas', () => {
    assert.equal(diasEntre('2026-03-10', '2026-03-15'), 5);
    assert.equal(diasEntre('2026-03-10', '2026-03-09'), -1);
  });

  it('formatea para mostrar', () => {
    assert.equal(formatearFecha('2026-03-10'), '10/03/2026');
    assert.equal(formatearRango('2026-03-10', '2026-03-15'), 'Del 10 al 15 de Marzo');
    assert.equal(formatearRango('2026-03-28', '2026-04-02'), 'Del 28 de Marzo al 2 de Abril');
  });

  it('arma la grilla del mes empezando el lunes', () => {
    // Marzo de 2026 empieza un domingo: seis huecos (lu a sá) antes del 1
    const dias = diasDelMes(2026, 2);
    assert.equal(dias.filter((d) => d === null).length, 6);
    assert.equal(dias[6], '2026-03-01');
    assert.equal(dias.at(-1), '2026-03-31');
  });
});

describe('montos', () => {
  it('lee lo que se tipeó con puntos de miles', () => {
    assert.equal(parsearMonto('120.000'), 120000);
    assert.equal(parsearMonto(''), 0);
  });

  it('formatea con signo y puntos de miles', () => {
    assert.equal(formatearMonto(120000), '$120.000');
    assert.equal(formatearMientrasSeEscribe('120000'), '120.000');
    assert.equal(formatearMientrasSeEscribe('abc'), '');
  });

  it('calcula la seña como el backend', () => {
    assert.equal(calcularSena(12345, 33), 4073.85);
    assert.equal(calcularSena(100000, ''), 0);
  });
});

describe('reservas', () => {
  const reserva = {
    montoTotal: '100000.00',
    Pagos: [{ monto: '30000.00' }, { monto: '20000.00' }],
    Huespeds: [
      { id: 1, nombre: 'Norma', ReservaHuesped: { rol: 'titular' } },
      { id: 2, nombre: 'Marcelo', ReservaHuesped: { rol: 'acompañante' } },
    ],
  };

  it('separa titular y acompañantes', () => {
    assert.equal(titularDe(reserva).nombre, 'Norma');
    assert.deepEqual(acompanantesDe(reserva).map((h) => h.nombre), ['Marcelo']);
    assert.equal(titularDe({ Huespeds: [] }), null);
  });

  it('arma los vínculos para el endpoint de vincular', () => {
    assert.deepEqual(vinculosDe(reserva), [
      { huespedId: 1, rol: 'titular' },
      { huespedId: 2, rol: 'acompañante' },
    ]);
  });

  it('calcula cobrado y saldo', () => {
    assert.equal(totalCobrado(reserva), 50000);
    assert.equal(saldoPendiente(reserva), 50000);
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Se importa primero para fijar las variables de entorno antes de que se cargue
// la configuración de la base.
import './ayudas.js';

import { calcularMontoSena, calcularEstadoActual } from '../src/services/reservas.service.js';
import { fechaDeHoy, sumarDias } from '../src/utils/fechas.js';

describe('calcularMontoSena', () => {
  it('calcula el porcentaje sobre el total', () => {
    assert.equal(calcularMontoSena(100000, 30), 30000);
  });

  it('devuelve 0 si no se manda porcentaje (la seña es opcional)', () => {
    assert.equal(calcularMontoSena(100000, undefined), 0);
    assert.equal(calcularMontoSena(100000, 0), 0);
    assert.equal(calcularMontoSena(100000, null), 0);
  });

  it('devuelve el total cuando la seña es del 100%', () => {
    assert.equal(calcularMontoSena(85000, 100), 85000);
  });

  it('redondea a dos decimales', () => {
    // 33% de 10.000 = 3.300 exacto; con un total quebrado aparece el redondeo
    assert.equal(calcularMontoSena(12345, 33), 4073.85);
  });

  it('no arrastra errores de punto flotante', () => {
    const resultado = calcularMontoSena(0.1 + 0.2, 100);
    assert.equal(resultado, 0.3);
  });
});

describe('calcularEstadoActual', () => {
  const diasDesdeHoy = (dias) => sumarDias(fechaDeHoy(), dias);

  it('el día del check-out la reserva sigue activa', () => {
    const reserva = { estado: 'Señada', fechaCheckOut: diasDesdeHoy(0) };
    assert.equal(calcularEstadoActual(reserva), 'Señada');
  });

  it('pasa a Finalizada una reserva Señada cuyo check-out ya pasó', () => {
    const reserva = { estado: 'Señada', fechaCheckOut: diasDesdeHoy(-5) };
    assert.equal(calcularEstadoActual(reserva), 'Finalizada');
  });

  it('pasa a Finalizada una reserva Pagada cuyo check-out ya pasó', () => {
    const reserva = { estado: 'Pagada', fechaCheckOut: diasDesdeHoy(-1) };
    assert.equal(calcularEstadoActual(reserva), 'Finalizada');
  });

  it('mantiene Señada si el check-out es futuro', () => {
    const reserva = { estado: 'Señada', fechaCheckOut: diasDesdeHoy(10) };
    assert.equal(calcularEstadoActual(reserva), 'Señada');
  });

  it('no reactiva una reserva Abortada aunque la fecha haya pasado', () => {
    const reserva = { estado: 'Abortada', fechaCheckOut: diasDesdeHoy(-30) };
    assert.equal(calcularEstadoActual(reserva), 'Abortada');
  });

  it('deja Finalizada como está', () => {
    const reserva = { estado: 'Finalizada', fechaCheckOut: diasDesdeHoy(-30) };
    assert.equal(calcularEstadoActual(reserva), 'Finalizada');
  });
});

/**
 * La disponibilidad se resuelve con una consulta a la base, así que acá se
 * verifica la regla de solapamiento en sí, que es la que define el criterio:
 *   se solapan si  inicio1 < fin2  Y  fin1 > inicio2
 */
describe('regla de solapamiento de fechas', () => {
  const seSolapan = (inicio1, fin1, inicio2, fin2) =>
    new Date(inicio1) < new Date(fin2) && new Date(fin1) > new Date(inicio2);

  it('detecta un solapamiento parcial por el final', () => {
    assert.equal(seSolapan('2026-03-10', '2026-03-15', '2026-03-14', '2026-03-20'), true);
  });

  it('detecta una reserva contenida dentro de otra', () => {
    assert.equal(seSolapan('2026-03-10', '2026-03-20', '2026-03-12', '2026-03-15'), true);
  });

  it('no marca solapamiento cuando el check-out coincide con el check-in siguiente', () => {
    // Caso real y frecuente: alguien se va el mismo día que entra el próximo.
    assert.equal(seSolapan('2026-03-10', '2026-03-15', '2026-03-15', '2026-03-20'), false);
  });

  it('no marca solapamiento entre rangos separados', () => {
    assert.equal(seSolapan('2026-03-01', '2026-03-05', '2026-03-10', '2026-03-15'), false);
  });
});

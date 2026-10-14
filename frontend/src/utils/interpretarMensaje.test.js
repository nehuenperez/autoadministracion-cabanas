import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { interpretarMensaje, cuilValido } from './interpretarMensaje.js';

/** Compara sólo los campos de datos (los avisos se chequean aparte). */
function datos(huesped) {
  // eslint-disable-next-line no-unused-vars
  const { avisos, ...resto } = huesped;
  return resto;
}

const VACIO = {
  nombre: '',
  apellido: '',
  dni: '',
  cuil: '',
  telefono: '',
  direccion: '',
  vehiculoModelo: '',
  vehiculoPatente: '',
};

describe('interpretarMensaje', () => {
  it('interpreta el mensaje típico: titular con todos sus datos y un acompañante', () => {
    const { huespedes, avisos } = interpretarMensaje(
      'Norma Graciela Berger dni 17047028. Cuil 27170470287. Florisbelo Acosta 3766 MdP. ' +
        'Toyota Hilux blanca 2013, NJU 953. Marcelo O Giangreco 16572628.'
    );

    assert.deepEqual(huespedes.map(datos), [
      {
        rol: 'titular',
        nombre: 'Norma Graciela',
        apellido: 'Berger',
        dni: '17047028',
        cuil: '27-17047028-7',
        telefono: '',
        direccion: 'Florisbelo Acosta 3766, Mar del Plata',
        vehiculoModelo: 'Toyota Hilux blanca 2013',
        vehiculoPatente: 'NJU953',
      },
      { ...VACIO, rol: 'acompañante', nombre: 'Marcelo O.', apellido: 'Giangreco', dni: '16572628' },
    ]);
    assert.deepEqual(huespedes[0].avisos, ['No vino el teléfono (hace falta para el WhatsApp)']);
    assert.deepEqual(huespedes[1].avisos, []);
    assert.deepEqual(avisos, []);
  });

  it('interpreta un formulario con etiquetas, una por línea', () => {
    const { huespedes, avisos } = interpretarMensaje(
      [
        'Nombre: Juan Carlos',
        'Apellido: Pérez',
        'DNI: 30.123.456',
        'Tel: +54 9 2664 12-3456',
        'Domicilio: Av. Illia 1234, San Luis',
        'Vehículo: Ford Ranger gris 2019',
        'Patente: AE 123 CD',
      ].join('\n')
    );

    assert.deepEqual(huespedes.map(datos), [
      {
        rol: 'titular',
        nombre: 'Juan Carlos',
        apellido: 'Pérez',
        dni: '30123456',
        cuil: '',
        telefono: '+54 9 2664 12-3456',
        direccion: 'Av. Illia 1234, San Luis',
        vehiculoModelo: 'Ford Ranger gris 2019',
        vehiculoPatente: 'AE123CD',
      },
    ]);
    assert.deepEqual(huespedes[0].avisos, []);
    assert.deepEqual(avisos, []);
  });

  it('reconoce acompañantes presentados con parentescos y nombres en minúscula', () => {
    const { huespedes, avisos } = interpretarMensaje(
      'Reserva a nombre de maria de los angeles gomez, DNI 25.456.789, cel 0351 15 6123456. ' +
        'Viene con su esposo Raúl Fernández DNI 24111222 y su hija Sofía Fernández 45333444. ' +
        'Auto: VW Gol Trend, patente ab123cd'
    );

    assert.deepEqual(huespedes.map(datos), [
      {
        rol: 'titular',
        nombre: 'Maria de los Angeles',
        apellido: 'Gomez',
        dni: '25456789',
        cuil: '',
        telefono: '0351 15 6123456',
        direccion: '',
        vehiculoModelo: 'VW Gol Trend',
        vehiculoPatente: 'AB123CD',
      },
      { ...VACIO, rol: 'acompañante', nombre: 'Raúl', apellido: 'Fernández', dni: '24111222' },
      { ...VACIO, rol: 'acompañante', nombre: 'Sofía', apellido: 'Fernández', dni: '45333444' },
    ]);
    assert.deepEqual(avisos, []);
  });

  it('respeta el apellido en mayúsculas y detecta un teléfono sin rótulo', () => {
    const { huespedes } = interpretarMensaje(
      'Norma Graciela BERGER 17047028 - 2235123456 - Florisbelo Acosta 3766 Mar del Plata'
    );

    assert.equal(huespedes.length, 1);
    assert.equal(huespedes[0].nombre, 'Norma Graciela');
    assert.equal(huespedes[0].apellido, 'Berger');
    assert.equal(huespedes[0].telefono, '2235123456');
    assert.equal(huespedes[0].direccion, 'Florisbelo Acosta 3766, Mar del Plata');
  });

  it('ignora saludos y avisa lo que no pudo ubicar', () => {
    const { huespedes, avisos } = interpretarMensaje(
      'Hola! Te paso los datos. Juan Pérez 30123456. Etios 2015 AB 123 CD. Llegamos tipo 14hs'
    );

    assert.equal(huespedes.length, 1);
    assert.equal(huespedes[0].nombre, 'Juan');
    assert.equal(huespedes[0].apellido, 'Pérez');
    assert.equal(huespedes[0].vehiculoModelo, 'Etios 2015');
    assert.equal(huespedes[0].vehiculoPatente, 'AB123CD');
    assert.deepEqual(avisos, ['No se usó: "Llegamos tipo 14hs"']);
  });

  it('no confunde "Villa Mercedes" con un vehículo', () => {
    const { huespedes } = interpretarMensaje('Pedro Gómez 28999888, Belgrano 123, Villa Mercedes');

    assert.equal(huespedes[0].direccion, 'Belgrano 123, Villa Mercedes');
    assert.equal(huespedes[0].vehiculoModelo, '');
  });

  it('no toma fechas ni montos como DNI', () => {
    const { huespedes } = interpretarMensaje('Del 12/01/2026 al 15/01/2026. Juan Pérez 30123456. Total $120.000');

    assert.equal(huespedes.length, 1);
    assert.equal(huespedes[0].dni, '30123456');
  });

  it('interpreta un mensaje con etiquetas en la misma línea y domicilio con piso', () => {
    const { huespedes, avisos } = interpretarMensaje(
      'Buenas! Somos 3. Titular: Laura Martínez, DNI 32.555.111, cel 266 4555666. ' +
        'Dirección: Calle Pringles 450 piso 2 dpto B, San Luis. ' +
        'Acompañantes: Diego Ruiz 31222333 y Tomás Ruiz 50111222. Vamos en un Peugeot 208 gris patente AC 456 KJ'
    );

    assert.deepEqual(huespedes.map(datos), [
      {
        rol: 'titular',
        nombre: 'Laura',
        apellido: 'Martínez',
        dni: '32555111',
        cuil: '',
        telefono: '266 4555666',
        direccion: 'Calle Pringles 450 piso 2 dpto B, San Luis',
        vehiculoModelo: 'Peugeot 208 gris',
        vehiculoPatente: 'AC456KJ',
      },
      { ...VACIO, rol: 'acompañante', nombre: 'Diego', apellido: 'Ruiz', dni: '31222333' },
      { ...VACIO, rol: 'acompañante', nombre: 'Tomás', apellido: 'Ruiz', dni: '50111222' },
    ]);
    assert.deepEqual(avisos, ['No se usó: "Somos 3"']);
  });

  it('entiende "apellido, nombre" separados por coma', () => {
    const { huespedes } = interpretarMensaje('datos: gonzalez, maria laura 28.765.432 - camioneta amarok negra AA111BB');

    assert.equal(huespedes[0].nombre, 'Maria Laura');
    assert.equal(huespedes[0].apellido, 'Gonzalez');
    assert.equal(huespedes[0].vehiculoModelo, 'Amarok negra');
  });

  it('no junta dos personas separadas por un punto', () => {
    const { huespedes } = interpretarMensaje('Juan Pérez. Ana Gómez 31123456');

    assert.equal(huespedes.length, 2);
    assert.equal(huespedes[1].nombre, 'Ana');
    assert.equal(huespedes[1].dni, '31123456');
  });

  it('separa apellidos con partículas', () => {
    const { huespedes } = interpretarMensaje('Juan de la Fuente 30123456');

    assert.equal(huespedes[0].nombre, 'Juan');
    assert.equal(huespedes[0].apellido, 'de la Fuente');
  });

  it('respeta el orden "apellido y nombre"', () => {
    const { huespedes } = interpretarMensaje('Apellido y nombre: Berger Norma Graciela. DNI 17047028');

    assert.equal(huespedes[0].nombre, 'Norma Graciela');
    assert.equal(huespedes[0].apellido, 'Berger');
  });

  it('avisa si el CUIL no coincide con el DNI', () => {
    const { huespedes } = interpretarMensaje('Norma Berger dni 17047029 cuil 27-17047028-7');

    assert.equal(huespedes[0].cuil, '27-17047028-7');
    assert.ok(huespedes[0].avisos.includes('El CUIL no coincide con el DNI'));
  });

  it('saca el DNI del CUIL cuando no viene aparte', () => {
    const { huespedes } = interpretarMensaje('Norma Berger cuil 27170470287');

    assert.equal(huespedes[0].dni, '17047028');
    assert.ok(huespedes[0].avisos.includes('El DNI se sacó del CUIL'));
  });

  it('avisa cuando no encuentra a nadie', () => {
    const { huespedes, avisos } = interpretarMensaje('Hola, ¿tienen lugar para el finde?');

    assert.deepEqual(huespedes, []);
    assert.equal(avisos[0], 'No se encontró ningún huésped en el mensaje');
  });

  it('acepta un mensaje reenviado desde WhatsApp con encabezado y negritas', () => {
    const { huespedes } = interpretarMensaje('[12/10 14:32] Norma: *Norma Berger* DNI 17047028');

    assert.equal(huespedes.length, 1);
    assert.equal(huespedes[0].nombre, 'Norma');
    assert.equal(huespedes[0].apellido, 'Berger');
  });
});

describe('cuilValido', () => {
  it('acepta un CUIL con el dígito verificador correcto', () => {
    assert.equal(cuilValido('27170470287'), true);
    assert.equal(cuilValido('27-17047028-7'), true);
  });

  it('rechaza un CUIL con el dígito verificador incorrecto o mal formado', () => {
    assert.equal(cuilValido('27170470288'), false);
    assert.equal(cuilValido('99170470287'), false);
    assert.equal(cuilValido('2717047028'), false);
  });
});

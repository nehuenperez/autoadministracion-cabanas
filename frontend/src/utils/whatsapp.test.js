import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { armarLinkWhatsapp, numeroParaWhatsapp } from './whatsapp.js';

describe('numeroParaWhatsapp', () => {
  const casos = [
    ['característica y número', '266 4555666', '5492664555666'],
    ['todo pegado', '2664555666', '5492664555666'],
    ['con el 0 de larga distancia', '0266 4555666', '5492664555666'],
    ['con 0 y 15 separados', '0351 15 6123456', '5493516123456'],
    ['con 15 separado y sin 0', '11 15 5555 4444', '5491155554444'],
    ['con 0 y 15 pegados', '0266154555666', '5492664555666'],
    ['con 15 pegado en característica de 4 cifras', '265215123456', '5492652123456'],
    ['con guiones y paréntesis', '(0266) 455-5666', '5492664555666'],
    ['ya en formato internacional', '+54 9 266 455-5666', '5492664555666'],
    ['internacional sin el 9', '+54 266 4555666', '5492664555666'],
    ['internacional con 00', '0054 9 266 4555666', '5492664555666'],
    ['número extranjero', '+598 99 123 456', '59899123456'],
  ];

  for (const [descripcion, entrada, esperado] of casos) {
    it(descripcion, () => {
      assert.equal(numeroParaWhatsapp(entrada), esperado);
    });
  }

  it('deja tal cual un número sin característica, que no se puede completar', () => {
    assert.equal(numeroParaWhatsapp('4555666'), '4555666');
  });
});

describe('armarLinkWhatsapp', () => {
  it('arma el link con el número internacional y el mensaje codificado', () => {
    assert.equal(armarLinkWhatsapp('266 4555666', 'Hola Norma 😊'), 'https://wa.me/5492664555666?text=Hola%20Norma%20%F0%9F%98%8A');
  });
});

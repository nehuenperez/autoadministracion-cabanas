/**
 * wa.me necesita el número en formato internacional, sin "+" ni espacios:
 * para un celular argentino es 54 + 9 + característica + número, sin el 0
 * de larga distancia ni el 15. Como los teléfonos se guardan tal como los
 * escribió el huésped ("266 4555666", "0351 15 6123456"), hay que convertirlos:
 * con el número local tal cual, WhatsApp lo lee como internacional y "266..."
 * termina siendo un número de Lesoto (+266).
 */
function numeroParaWhatsapp(telefono) {
  const texto = String(telefono ?? '').trim();
  let digitos = texto.replace(/\D/g, '');

  // Prefijo internacional escrito como 00 en vez de +
  const esInternacional = texto.startsWith('+') || digitos.startsWith('00');
  digitos = digitos.replace(/^00/, '');

  if (digitos.startsWith('54')) {
    const resto = digitos.slice(2).replace(/^9/, '');
    return resto.length === 10 ? `549${resto}` : digitos;
  }

  // Con "+" y otro código de país es un número extranjero: va tal cual
  if (esInternacional) return digitos;

  // El 15 sólo se puede sacar con seguridad si vino separado ("0351 15 6123456")
  const grupos = texto.split(/[^\d]+/).filter(Boolean);
  if (grupos.length > 1 && grupos.slice(1).includes('15')) {
    const indice = grupos.indexOf('15', 1);
    digitos = [...grupos.slice(0, indice), ...grupos.slice(indice + 1)].join('');
  }

  digitos = digitos.replace(/^0/, '');

  // Pegado ("2664154555666"): característica de 2 a 4 cifras + 15 + número
  if (digitos.length === 12) {
    const caracteristica = [2, 3, 4].find((largo) => digitos.slice(largo, largo + 2) === '15');
    if (caracteristica) digitos = digitos.slice(0, caracteristica) + digitos.slice(caracteristica + 2);
  }

  // Sin la característica no se puede armar el número completo: queda como está
  return digitos.length === 10 ? `549${digitos}` : digitos;
}

function armarLinkWhatsapp(telefono, mensaje) {
  return `https://wa.me/${numeroParaWhatsapp(telefono)}?text=${encodeURIComponent(mensaje)}`;
}

export { armarLinkWhatsapp, numeroParaWhatsapp };

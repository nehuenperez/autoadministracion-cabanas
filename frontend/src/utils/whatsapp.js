function armarLinkWhatsapp(telefono, mensaje) {
  const telefonoLimpio = telefono.replace(/\D/g, ''); // saca espacios, guiones, paréntesis
  const mensajeCodificado = encodeURIComponent(mensaje);
  return `https://wa.me/${telefonoLimpio}?text=${mensajeCodificado}`;
}

export { armarLinkWhatsapp };
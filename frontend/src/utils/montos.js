/**
 * Montos en pesos. Los campos se escriben con separador de miles ("120.000")
 * y a la API se mandan como número.
 */

/** Lo que se tipeó en un campo de monto ("120.000") → número (120000). */
function parsearMonto(texto) {
  return Number(String(texto ?? '').replace(/\D/g, '')) || 0;
}

/** Número → "120.000" (con decimales sólo si los tiene). */
function formatearNumero(valor) {
  return Number(valor || 0).toLocaleString('es-AR');
}

/** Número → "$120.000" */
function formatearMonto(valor) {
  return `$${formatearNumero(valor)}`;
}

/** Para el onChange de un campo de monto: deja sólo dígitos y agrega los puntos de miles. */
function formatearMientrasSeEscribe(texto) {
  const digitos = String(texto ?? '').replace(/\D/g, '');
  return digitos ? formatearNumero(Number(digitos)) : '';
}

/** Monto de la seña según el total y el porcentaje, igual que lo calcula el backend. */
function calcularSena(total, porcentaje) {
  return Number(((Number(total) || 0) * ((Number(porcentaje) || 0) / 100)).toFixed(2));
}

export { parsearMonto, formatearNumero, formatearMonto, formatearMientrasSeEscribe, calcularSena };

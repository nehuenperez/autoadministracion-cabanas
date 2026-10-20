/**
 * Cuentas de una reserva. Los montos llegan de la base como DECIMAL, que
 * Sequelize entrega como texto ("150000.00"): se convierten acá, en un solo
 * lugar, y se redondean a centavos para no arrastrar errores de punto flotante.
 */

const redondear = (valor) => Number(Number(valor).toFixed(2));

/** Suma de los cobros. */
function totalCobrado(pagos = []) {
  return redondear(pagos.reduce((acumulado, pago) => acumulado + Number(pago.monto), 0));
}

/** Lo que falta cobrar: total de la reserva menos lo cobrado. */
function saldoPendiente(montoTotal, pagos = []) {
  return redondear(Number(montoTotal) - totalCobrado(pagos));
}

export { totalCobrado, saldoPendiente, redondear };

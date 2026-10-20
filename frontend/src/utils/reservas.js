/**
 * Datos derivados de una reserva tal como la devuelve la API (con sus
 * `Huespeds`, `Pagos` y `Cabana` incluidos).
 */

const rolDe = (huesped) => huesped.ReservaHuesped?.rol;

function titularDe(reserva) {
  return reserva?.Huespeds?.find((h) => rolDe(h) === 'titular') ?? null;
}

function acompanantesDe(reserva) {
  return reserva?.Huespeds?.filter((h) => rolDe(h) === 'acompañante') ?? [];
}

/** Los vínculos actuales, en el formato que espera el endpoint de vincular. */
function vinculosDe(reserva) {
  return (reserva?.Huespeds ?? []).map((h) => ({ huespedId: h.id, rol: rolDe(h) }));
}

function totalCobrado(reserva) {
  const total = (reserva?.Pagos ?? []).reduce((acumulado, pago) => acumulado + Number(pago.monto), 0);
  return Number(total.toFixed(2));
}

function saldoPendiente(reserva) {
  return Number((Number(reserva?.montoTotal || 0) - totalCobrado(reserva)).toFixed(2));
}

export { titularDe, acompanantesDe, vinculosDe, totalCobrado, saldoPendiente };

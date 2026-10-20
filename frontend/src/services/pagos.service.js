import api from './api.js';

// Los cobros de una reserva vienen incluidos en la reserva (GET /reservas/:id):
// no hace falta pedirlos aparte.

async function registrarPago(reservaId, datos) {
  const { data } = await api.post(`/pagos/reservas/${reservaId}`, datos);
  return data;
}

async function eliminarPago(pagoId) {
  const { data } = await api.delete(`/pagos/${pagoId}`);
  return data;
}

export { registrarPago, eliminarPago };

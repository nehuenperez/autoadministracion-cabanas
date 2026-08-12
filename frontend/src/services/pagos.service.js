import api from './api.js';

async function listarPagos(reservaId) {
  const { data } = await api.get(`/pagos/reservas/${reservaId}`);
  return data;
}

async function registrarPago(reservaId, datos) {
  const { data } = await api.post(`/pagos/reservas/${reservaId}`, datos);
  return data;
}

export { listarPagos, registrarPago };
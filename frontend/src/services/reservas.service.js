import api from './api.js';

async function listarReservas() {
  const { data } = await api.get('/reservas');
  return data;
}

async function listarReservasHistoricas() {
  const { data } = await api.get('/reservas/historicas');
  return data;
}

async function listarCabanas() {
  const { data } = await api.get('/cabanas');
  return data;
}

async function crearReserva(datos) {
  const { data } = await api.post('/reservas', datos);
  return data;
}

async function editarReserva(id, datos) {
  const { data } = await api.put(`/reservas/${id}`, datos);
  return data;
}

async function abortarReserva(id) {
  const { data } = await api.patch(`/reservas/${id}/abortar`);
  return data;
}

async function obtenerReservaPorId(id) {
  const { data } = await api.get(`/reservas/${id}`);
  return data;
}

export {
  listarReservas,
  listarReservasHistoricas,
  listarCabanas,
  crearReserva,
  editarReserva,
  abortarReserva,
  obtenerReservaPorId,
};
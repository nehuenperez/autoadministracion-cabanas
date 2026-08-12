import api from './api.js';

async function buscarPorDni(dni) {
  try {
    const { data } = await api.get(`/huespedes/dni/${dni}`);
    return data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
}

async function crearHuesped(datos) {
  const { data } = await api.post('/huespedes', datos);
  return data;
}

async function vincularAReserva(reservaId, huespedes) {
  const { data } = await api.post(`/huespedes/reservas/${reservaId}/vincular`, { huespedes });
  return data;
}

async function actualizarNotas(huespedId, notasComportamiento) {
  const { data } = await api.patch(`/huespedes/${huespedId}/notas`, { notasComportamiento });
  return data;
}

export { buscarPorDni, crearHuesped, vincularAReserva, actualizarNotas };
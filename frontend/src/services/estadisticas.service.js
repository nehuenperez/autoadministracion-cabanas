import api from './api.js';

async function obtenerEstadisticas(mes, anio) {
  const { data } = await api.get('/estadisticas', { params: { mes, anio } });
  return data;
}

export { obtenerEstadisticas };
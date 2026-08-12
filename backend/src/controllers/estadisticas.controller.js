import { obtenerEstadisticas } from '../services/estadisticas.service.js';

async function obtener(req, res, next) {
  try {
    const { mes, anio } = req.query;
    const estadisticas = await obtenerEstadisticas(mes, anio);
    res.status(200).json(estadisticas);
  } catch (error) {
    next(error);
  }
}

export { obtener };
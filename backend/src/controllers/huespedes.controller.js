import {
  buscarPorDni,
  crearOActualizarHuesped,
  actualizarNotas,
  vincularHuespedesAReserva,
  historialDeHuesped,
} from '../services/huespedes.service.js';

async function buscarPorDniController(req, res, next) {
  try {
    const huesped = await buscarPorDni(req.params.dni);
    if (!huesped) {
      return res.status(404).json({ error: 'No se encontró ningún huésped con ese DNI' });
    }
    res.status(200).json(huesped);
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const huesped = await crearOActualizarHuesped(req.body);
    res.status(201).json(huesped);
  } catch (error) {
    next(error);
  }
}

async function actualizarNotasController(req, res, next) {
  try {
    const huesped = await actualizarNotas(req.params.id, req.body.notasComportamiento);
    res.status(200).json(huesped);
  } catch (error) {
    next(error);
  }
}

async function vincularAReserva(req, res, next) {
  try {
    const reserva = await vincularHuespedesAReserva(req.params.reservaId, req.body.huespedes);
    res.status(200).json(reserva);
  } catch (error) {
    next(error);
  }
}

async function historial(req, res, next) {
  try {
    const huesped = await historialDeHuesped(req.params.id);
    res.status(200).json(huesped);
  } catch (error) {
    next(error);
  }
}

export { buscarPorDniController, crear, actualizarNotasController, vincularAReserva, historial };
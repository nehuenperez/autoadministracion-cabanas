import {
  crearReserva,
  editarReserva,
  abortarReserva,
  listarReservasActivas,
  listarReservasHistoricas,
  obtenerReservaPorId,
} from '../services/reservas.service.js';

async function listarActivas(req, res, next) {
  try {
    const reservas = await listarReservasActivas();
    res.status(200).json(reservas);
  } catch (error) {
    next(error);
  }
}

async function listarHistoricas(req, res, next) {
  try {
    const reservas = await listarReservasHistoricas();
    res.status(200).json(reservas);
  } catch (error) {
    next(error);
  }
}

async function obtenerPorId(req, res, next) {
  try {
    const reserva = await obtenerReservaPorId(req.params.id);
    res.status(200).json(reserva);
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const reserva = await crearReserva(req.body);
    res.status(201).json(reserva);
  } catch (error) {
    next(error);
  }
}

async function editar(req, res, next) {
  try {
    const reserva = await editarReserva(req.params.id, req.body);
    res.status(200).json(reserva);
  } catch (error) {
    next(error);
  }
}

async function abortar(req, res, next) {
  try {
    const reserva = await abortarReserva(req.params.id);
    res.status(200).json(reserva);
  } catch (error) {
    next(error);
  }
}

export { listarActivas, listarHistoricas, obtenerPorId, crear, editar, abortar };
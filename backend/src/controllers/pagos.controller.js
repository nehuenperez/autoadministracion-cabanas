import { registrarPago, removerPago } from '../services/pagos.service.js';

async function crear(req, res, next) {
  try {
    const pago = await registrarPago(req.params.reservaId, req.body);
    res.status(201).json(pago);
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    await removerPago(req.params.id);
    res.status(200).json({ mensaje: 'Registro de cobro eliminado correctamente' });
  } catch (error) {
    next(error);
  }
}

export { crear, eliminar };

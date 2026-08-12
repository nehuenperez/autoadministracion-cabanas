import { 
  registrarPago, 
  calcularSaldoPendiente, 
  listarPagosDeReserva,
  removerPago // Importamos la nueva función del servicio
} from '../services/pagos.service.js';

async function crear(req, res, next) {
  try {
    const pago = await registrarPago(req.params.reservaId, req.body);
    res.status(201).json(pago);
  } catch (error) {
    next(error);
  }
}

async function saldo(req, res, next) {
  try {
    const saldoPendiente = await calcularSaldoPendiente(req.params.reservaId);
    res.status(200).json({ saldoPendiente });
  } catch (error) {
    next(error);
  }
}

async function listar(req, res, next) {
  try {
    const pagos = await listarPagosDeReserva(req.params.reservaId);
    res.status(200).json(pagos);
  } catch (error) {
    next(error);
  }
}

// NUEVA FUNCIÓN: Ejecuta el borrado y responde un código 200 de éxito
async function eliminar(req, res, next) {
  try {
    await removerPago(req.params.id);
    res.status(200).json({ mensaje: 'Registro de cobro eliminado correctamente' });
  } catch (error) {
    next(error);
  }
}

export { crear, saldo, listar, eliminar };
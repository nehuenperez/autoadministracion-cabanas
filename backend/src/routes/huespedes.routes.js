import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { validarBody, validarParams } from '../middlewares/validation.middleware.js';
import {
  buscarPorDniController,
  crear,
  actualizarNotasController,
  vincularAReserva,
  historial,
} from '../controllers/huespedes.controller.js';

const router = Router();

router.use(verificarToken);

router.get('/dni/:dni', validarParams('paramDni'), buscarPorDniController);
router.get('/:id/historial', validarParams('paramId'), historial);
router.post('/', validarBody('crearHuesped'), crear);
router.patch('/:id/notas', validarParams('paramId'), validarBody('actualizarNotas'), actualizarNotasController);
router.post(
  '/reservas/:reservaId/vincular',
  validarParams('paramReservaId'),
  validarBody('vincularHuespedes'),
  vincularAReserva
);

export default router;

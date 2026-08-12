import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { validarBody, validarParams } from '../middlewares/validation.middleware.js';
import {
  listarActivas,
  listarHistoricas,
  obtenerPorId,
  crear,
  editar,
  abortar,
} from '../controllers/reservas.controller.js';

const router = Router();

router.use(verificarToken);

router.get('/', listarActivas);
router.get('/historicas', listarHistoricas);
router.get('/:id', validarParams('paramId'), obtenerPorId);
router.post('/', validarBody('crearReserva'), crear);
router.put('/:id', validarParams('paramId'), validarBody('editarReserva'), editar);
router.patch('/:id/abortar', validarParams('paramId'), abortar);

export default router;

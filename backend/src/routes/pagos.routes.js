import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { validarBody, validarParams } from '../middlewares/validation.middleware.js';
import { crear, saldo, listar, eliminar } from '../controllers/pagos.controller.js';

const router = Router();

router.use(verificarToken);

router.get('/reservas/:reservaId', validarParams('paramReservaId'), listar);
router.get('/reservas/:reservaId/saldo', validarParams('paramReservaId'), saldo);
router.post('/reservas/:reservaId', validarParams('paramReservaId'), validarBody('crearPago'), crear);
router.delete('/:id', validarParams('paramId'), eliminar);

export default router;

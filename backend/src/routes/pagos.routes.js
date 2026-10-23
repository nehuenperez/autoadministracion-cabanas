import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { validarBody, validarParams } from '../middlewares/validation.middleware.js';
import { crear, eliminar } from '../controllers/pagos.controller.js';

const router = Router();

router.use(verificarToken);

router.post('/reservas/:reservaId', validarParams('paramReservaId'), validarBody('crearPago'), crear);
router.delete('/:id', validarParams('paramId'), eliminar);

export default router;
